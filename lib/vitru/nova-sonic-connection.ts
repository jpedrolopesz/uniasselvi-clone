/**
 * Conexão de voz do browser com o relay Nova Sonic (server/nova-sonic-relay.ts).
 * Isola WebSocket + captura/reprodução de áudio via AudioWorklet do resto de
 * VoiceAssistantWindow.tsx, que cuida só de estado de UI e decisão de ações.
 */
import { parseServerMessage, type RealtimeServerEvent, type VoiceClientMessage } from "@/lib/vitru/voice-relay-protocol";

export const VOICE_CONNECTION_TIMEOUT_MS = 15_000;

export interface NovaSonicConnection {
  sendControl(message: VoiceClientMessage): void;
  close(): void;
}

interface ConnectOptions {
  url: string;
  stream: MediaStream;
  onServerEvent: (event: RealtimeServerEvent) => void;
  onDisconnect: (error?: Error) => void;
  timeoutMs?: number;
}

export function waitForSocketOpen(ws: WebSocket, timeoutMs: number): Promise<void> {
  if (ws.readyState === WebSocket.OPEN) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error("O serviço de voz não concluiu a conexão a tempo."));
    }, timeoutMs);
    const onOpen = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error("Não foi possível conectar ao serviço de voz."));
    };
    const cleanup = () => {
      window.clearTimeout(timeout);
      ws.removeEventListener("open", onOpen);
      ws.removeEventListener("error", onError);
    };
    ws.addEventListener("open", onOpen);
    ws.addEventListener("error", onError);
  });
}

export async function connectNovaSonicVoice({
  url,
  stream,
  onServerEvent,
  onDisconnect,
  timeoutMs = VOICE_CONNECTION_TIMEOUT_MS,
}: ConnectOptions): Promise<NovaSonicConnection> {
  const ws = new WebSocket(url);
  ws.binaryType = "arraybuffer";
  await waitForSocketOpen(ws, timeoutMs);

  const audioContext = new AudioContext();
  console.log("[nova-sonic] AudioContext criado, state=", audioContext.state, "sampleRate=", audioContext.sampleRate);
  await audioContext.audioWorklet.addModule("/worklets/pcm-capture-processor.js");
  await audioContext.audioWorklet.addModule("/worklets/pcm-playback-processor.js");
  console.log("[nova-sonic] worklets carregados");

  const source = audioContext.createMediaStreamSource(stream);
  const captureNode = new AudioWorkletNode(audioContext, "pcm-capture-processor");
  source.connect(captureNode);
  captureNode.port.onmessage = (event: MessageEvent<ArrayBuffer>) => {
    if (ws.readyState === WebSocket.OPEN) ws.send(event.data);
  };

  const playbackNode = new AudioWorkletNode(audioContext, "pcm-playback-processor");
  playbackNode.connect(audioContext.destination);
  console.log("[nova-sonic] playbackNode conectado ao destination, contextState=", audioContext.state);

  let audioFramesReceived = 0;
  ws.onmessage = (event) => {
    if (event.data instanceof ArrayBuffer) {
      audioFramesReceived += 1;
      if (audioFramesReceived % 50 === 1) {
        console.log("[nova-sonic] frame de áudio recebido do relay, total=", audioFramesReceived, "bytes=", event.data.byteLength, "contextState=", audioContext.state);
      }
      playbackNode.port.postMessage(event.data, [event.data]);
      return;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(String(event.data));
    } catch {
      onServerEvent({ kind: "error", message: "Recebi um evento inválido do serviço de voz." });
      return;
    }
    onServerEvent(parseServerMessage(parsed));
  };

  let closedByUs = false;
  ws.onclose = () => {
    if (!closedByUs) onDisconnect(new Error("A conexão de voz foi encerrada."));
  };
  ws.onerror = () => {
    if (!closedByUs) onDisconnect(new Error("A conexão de voz falhou."));
  };

  return {
    sendControl(message) {
      if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(message));
    },
    close() {
      closedByUs = true;
      source.disconnect();
      captureNode.disconnect();
      playbackNode.disconnect();
      void audioContext.close();
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) ws.close();
    },
  };
}
