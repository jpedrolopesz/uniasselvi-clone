/**
 * Relay entre o browser e o Amazon Nova 2 Sonic (Bedrock bidirectional
 * streaming). Processo Node separado — não é uma rota do Next.js — porque
 * este fork do Next não sustenta WebSocket em route handlers, e a chamada ao
 * Bedrock precisa ser assinada com SigV4 no servidor, nunca no browser.
 *
 * `npm run voice` sobe este processo. O browser conecta direto nele via
 * NEXT_PUBLIC_VITRU_VOICE_URL (ws://...); as credenciais AWS nunca saem daqui.
 *
 * ATENÇÃO: a forma exata dos eventos do stream bidirecional da Nova 2 Sonic
 * (nomes de campo, se textOutput carrega `role`, como um barge-in é
 * sinalizado) foi levantada via documentação e exemplos da AWS, não testada
 * ao vivo — os pontos marcados com "verificar ao vivo" abaixo são os
 * primeiros lugares a olhar se o áudio ou os transcripts não baterem.
 */
import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { WebSocketServer, type WebSocket } from "ws";
import {
  BedrockRuntimeClient,
  InvokeModelWithBidirectionalStreamCommand,
} from "@aws-sdk/client-bedrock-runtime";
import type { RealtimeTool } from "@/lib/vitru/realtime-protocol";
import { buildNovaSonicToolConfiguration } from "@/lib/vitru/nova-sonic-tools";

const PORT = Number(process.env.VOICE_RELAY_PORT ?? 8765);
const HOST = process.env.VOICE_RELAY_HOST ?? "127.0.0.1";
const MODEL_ID = "amazon.nova-2-sonic-v1:0";
const VOICE_ID = "carolina"; // voz feminina pt-BR; ver docs de idiomas da Nova 2 Sonic.

const client = new BedrockRuntimeClient({ region: process.env.AWS_REGION ?? "us-east-1" });
const encoder = new TextEncoder();
const decoder = new TextDecoder();

/** Fila assíncrona: alimenta o generator que o SDK consome como `body`. */
class AsyncEventQueue {
  private items: unknown[] = [];
  private resolvers: Array<(result: IteratorResult<unknown>) => void> = [];
  private closed = false;

  push(item: unknown) {
    if (this.closed) return;
    const resolver = this.resolvers.shift();
    if (resolver) resolver({ value: item, done: false });
    else this.items.push(item);
  }

  close() {
    this.closed = true;
    while (this.resolvers.length > 0) this.resolvers.shift()!({ value: undefined, done: true });
  }

  async *[Symbol.asyncIterator](): AsyncGenerator<unknown> {
    while (true) {
      if (this.items.length > 0) {
        yield this.items.shift();
        continue;
      }
      if (this.closed) return;
      const result = await new Promise<IteratorResult<unknown>>((resolve) => this.resolvers.push(resolve));
      if (result.done) return;
      yield result.value;
    }
  }
}

function chunk(event: Record<string, unknown>) {
  return { chunk: { bytes: encoder.encode(JSON.stringify({ event })) } };
}

interface Session {
  promptName: string;
  queue: AsyncEventQueue;
  audioContentName: string | null;
  /** contentId/contentName do Nova Sonic → papel do bloco, p/ separar transcript do aluno x da Vitru. */
  contentRoles: Map<string, string>;
}

function send(ws: WebSocket, message: Record<string, unknown>) {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(message));
}

function log(...args: unknown[]) {
  console.log(`[relay ${new Date().toISOString()}]`, ...args);
}

function startSession(ws: WebSocket, instructions: string, tools: RealtimeTool[]) {
  const promptName = randomUUID();
  const queue = new AsyncEventQueue();
  const session: Session = { promptName, queue, audioContentName: null, contentRoles: new Map() };

  queue.push(
    chunk({
      sessionStart: {
        inferenceConfiguration: { maxTokens: 1024, topP: 0.9, temperature: 0.7 },
        // Turn detection própria da Nova 2 Sonic — não fazemos VAD no browser.
        turnDetectionConfiguration: { endpointingSensitivity: "HIGH" },
      },
    })
  );

  const { tools: toolSpecs, toolChoice } = buildNovaSonicToolConfiguration(tools);
  queue.push(
    chunk({
      promptStart: {
        promptName,
        textOutputConfiguration: { mediaType: "text/plain" },
        audioOutputConfiguration: {
          mediaType: "audio/lpcm",
          sampleRateHertz: 24000,
          sampleSizeBits: 16,
          channelCount: 1,
          voiceId: VOICE_ID,
          encoding: "base64",
          audioType: "SPEECH",
        },
        toolUseOutputConfiguration: { mediaType: "application/json" },
        toolConfiguration: { tools: toolSpecs, toolChoice },
      },
    })
  );

  const systemContentName = randomUUID();
  session.contentRoles.set(systemContentName, "SYSTEM");
  queue.push(
    chunk({ contentStart: { promptName, contentName: systemContentName, type: "TEXT", role: "SYSTEM", textInputConfiguration: { mediaType: "text/plain" } } })
  );
  queue.push(chunk({ textInput: { promptName, contentName: systemContentName, content: instructions } }));
  queue.push(chunk({ contentEnd: { promptName, contentName: systemContentName } }));

  // Bloco de áudio único para a chamada inteira: a Nova 2 Sonic detecta os
  // turnos sozinha (turnDetectionConfiguration acima), então não fechamos e
  // reabrimos contentStart(AUDIO) por fala — verificar ao vivo se isso
  // produz barge-in correto ou se precisamos fechar por turno.
  const audioContentName = randomUUID();
  session.audioContentName = audioContentName;
  session.contentRoles.set(audioContentName, "USER");
  queue.push(
    chunk({
      contentStart: {
        promptName,
        contentName: audioContentName,
        type: "AUDIO",
        role: "USER",
        audioInputConfiguration: { mediaType: "audio/lpcm", sampleRateHertz: 16000, sampleSizeBits: 16, channelCount: 1, encoding: "base64" },
      },
    })
  );

  void runBedrockStream(ws, session);
  return session;
}

async function runBedrockStream(ws: WebSocket, session: Session) {
  log("abrindo stream Bedrock", { promptName: session.promptName, modelId: MODEL_ID });
  try {
    const response = await client.send(
      new InvokeModelWithBidirectionalStreamCommand({ modelId: MODEL_ID, body: session.queue as unknown as AsyncIterable<{ chunk: { bytes: Uint8Array } }> })
    );
    log("stream Bedrock aberto, requestId=", response.$metadata?.requestId);
    send(ws, { type: "session_created" });

    if (!response.body) {
      log("resposta sem body — nada pra iterar");
      return;
    }
    for await (const rawEvent of response.body) {
      const raw = rawEvent as unknown as Record<string, unknown>;
      const bytes = (raw.chunk as { bytes?: Uint8Array } | undefined)?.bytes;
      if (!bytes) {
        log("evento de erro do stream:", JSON.stringify(raw));
        const errorEvent = raw;
        const message =
          (errorEvent.modelStreamErrorException as { message?: string } | undefined)?.message ??
          (errorEvent.internalServerException as { message?: string } | undefined)?.message;
        if (message) send(ws, { type: "error", message });
        continue;
      }
      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(decoder.decode(bytes));
      } catch (parseError) {
        log("falha ao parsear evento:", decoder.decode(bytes), parseError);
        continue;
      }
      handleBedrockEvent(ws, session, parsed);
    }
    log("stream Bedrock encerrado (for-await terminou)");
  } catch (error) {
    log("EXCEÇÃO no stream Bedrock:", error);
    send(ws, { type: "error", message: error instanceof Error ? error.message : "Falha na conexão com a Nova Sonic." });
  }
}

function handleBedrockEvent(ws: WebSocket, session: Session, parsed: Record<string, unknown>) {
  const event = (parsed.event ?? parsed) as Record<string, unknown>;
  const keys = Object.keys(event);

  const contentStart = event.contentStart as Record<string, unknown> | undefined;
  if (contentStart) {
    const id = String(contentStart.contentId ?? contentStart.contentName ?? "");
    const role = typeof contentStart.role === "string" ? contentStart.role : "ASSISTANT";
    log("contentStart", { id, role, type: contentStart.type });
    if (id) session.contentRoles.set(id, role);
    return;
  }

  const textOutput = event.textOutput as Record<string, unknown> | undefined;
  if (textOutput) {
    const content = typeof textOutput.content === "string" ? textOutput.content.trim() : "";
    // "verificar ao vivo": role pode vir no próprio evento ou só via contentStart anterior.
    const id = String(textOutput.contentId ?? textOutput.contentName ?? "");
    const role = typeof textOutput.role === "string" ? textOutput.role : session.contentRoles.get(id) ?? "ASSISTANT";
    log("textOutput", { role, content });
    if (!content) return;
    if (role === "USER") send(ws, { type: "user_transcript", text: content });
    else if (role === "ASSISTANT") send(ws, { type: "assistant_transcript", text: content });
    return;
  }

  const audioOutput = event.audioOutput as Record<string, unknown> | undefined;
  if (audioOutput) {
    const content = typeof audioOutput.content === "string" ? audioOutput.content : "";
    log("audioOutput", { bytesBase64Length: content.length });
    if (!content) return;
    ws.send(Buffer.from(content, "base64"));
    return;
  }

  const toolUse = event.toolUse as Record<string, unknown> | undefined;
  if (toolUse) {
    const callId = String(toolUse.toolUseId ?? "");
    const name = String(toolUse.toolName ?? "");
    log("toolUse", { callId, name, content: toolUse.content });
    if (!callId || !name) return;
    let args: Record<string, unknown> = {};
    if (typeof toolUse.content === "string") {
      try {
        const parsedArgs = JSON.parse(toolUse.content);
        if (parsedArgs && typeof parsedArgs === "object") args = parsedArgs;
      } catch {
        // args inválidos: segue com {} — o portal trata como tool desconhecida/sem args.
      }
    }
    send(ws, { type: "tool_call", callId, name, args });
    return;
  }

  log("evento Bedrock não reconhecido, chaves:", keys, JSON.stringify(event).slice(0, 500));
}

function sendPageContext(session: Session, context: unknown) {
  const contentName = randomUUID();
  session.contentRoles.set(contentName, "USER");
  const text = `[VITRU_PAGE_SNAPSHOT] ${JSON.stringify(context)}`;
  session.queue.push(chunk({ contentStart: { promptName: session.promptName, contentName, type: "TEXT", role: "USER", textInputConfiguration: { mediaType: "text/plain" } } }));
  session.queue.push(chunk({ textInput: { promptName: session.promptName, contentName, content: text } }));
  session.queue.push(chunk({ contentEnd: { promptName: session.promptName, contentName } }));
}

function sendToolResult(session: Session, callId: string, output: unknown) {
  const contentName = randomUUID();
  session.queue.push(
    chunk({
      contentStart: {
        promptName: session.promptName,
        contentName,
        type: "TOOL",
        role: "TOOL",
        toolResultInputConfiguration: { toolUseId: callId, type: "TEXT", textInputConfiguration: { mediaType: "application/json" } },
      },
    })
  );
  session.queue.push(chunk({ toolResult: { promptName: session.promptName, contentName, content: JSON.stringify(output) } }));
  session.queue.push(chunk({ contentEnd: { promptName: session.promptName, contentName } }));
}

function endSession(session: Session) {
  if (session.audioContentName) {
    session.queue.push(chunk({ contentEnd: { promptName: session.promptName, contentName: session.audioContentName } }));
  }
  session.queue.push(chunk({ promptEnd: { promptName: session.promptName } }));
  session.queue.push(chunk({ sessionEnd: {} }));
  session.queue.close();
}

const httpServer = createServer();
const wss = new WebSocketServer({ server: httpServer });

wss.on("connection", (ws, req) => {
  log("conexão WS aberta de", req.socket.remoteAddress);
  let session: Session | null = null;
  let audioChunksReceived = 0;

  ws.on("message", (data, isBinary) => {
    if (isBinary) {
      if (!session?.audioContentName) {
        log("áudio binário recebido antes da sessão existir — descartado");
        return;
      }
      audioChunksReceived += 1;
      if (audioChunksReceived % 100 === 1) log("áudio recebido do browser, chunks até agora:", audioChunksReceived);
      const content = Buffer.isBuffer(data) ? data.toString("base64") : Buffer.from(data as ArrayBuffer).toString("base64");
      session.queue.push(chunk({ audioInput: { promptName: session.promptName, contentName: session.audioContentName, content } }));
      return;
    }

    let message: Record<string, unknown>;
    try {
      message = JSON.parse(data.toString());
    } catch (error) {
      log("mensagem de controle não é JSON válido:", data.toString().slice(0, 200), error);
      return;
    }

    log("mensagem de controle recebida:", message.type);

    if (message.type === "session_config" && !session) {
      const tools = Array.isArray(message.tools) ? (message.tools as RealtimeTool[]) : [];
      log("session_config", { instructionsLength: String(message.instructions ?? "").length, toolCount: tools.length, toolNames: tools.map((t) => t.name) });
      session = startSession(ws, String(message.instructions ?? ""), tools);
      return;
    }
    if (message.type === "page_context" && session) {
      sendPageContext(session, message.context);
      return;
    }
    if (message.type === "tool_result" && session) {
      log("tool_result recebido do browser", { callId: message.callId, output: message.output });
      sendToolResult(session, String(message.callId ?? ""), message.output);
      return;
    }
    if (!session) log("mensagem ignorada — ainda não há session_config:", message.type);
  });

  ws.on("close", (code, reason) => {
    log("conexão WS fechada", { code, reason: reason.toString(), audioChunksReceived });
    if (session) endSession(session);
  });

  ws.on("error", (error) => {
    log("erro no WebSocket:", error);
  });
});

httpServer.listen(PORT, HOST, () => {
  console.log(`Relay Nova Sonic ouvindo em ws://${HOST}:${PORT}`);
});
