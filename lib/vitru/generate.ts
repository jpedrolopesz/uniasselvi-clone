import {
  BedrockRuntimeClient,
  ConverseCommand,
  type Message,
} from "@aws-sdk/client-bedrock-runtime";

const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION ?? "us-east-1",
});

const modelId = process.env.BEDROCK_MODEL_ID ?? "amazon.nova-micro-v1:0";

export interface GenerateResult {
  text: string;
  inputTokens: number | null;
  outputTokens: number | null;
}

function toAlternatingMessages(
  history: { role: "user" | "assistant"; text: string }[]
): Message[] {
  return history.reduce<Message[]>((messages, item) => {
    const previous = messages.at(-1);
    if (previous?.role === item.role) {
      const previousText = previous.content?.[0]?.text ?? "";
      previous.content = [{ text: `${previousText}\n${item.text}` }];
    } else {
      messages.push({ role: item.role, content: [{ text: item.text }] });
    }
    return messages;
  }, []);
}

export async function generate(params: {
  system: string;
  userMessage: string;
  history?: { role: "user" | "assistant"; text: string }[];
  maxTokens?: number;
}): Promise<GenerateResult> {
  try {
    const messages = toAlternatingMessages(params.history ?? []);
    const previous = messages.at(-1);
    if (previous?.role === "user") {
      const previousText = previous.content?.[0]?.text ?? "";
      previous.content = [{ text: `${previousText}\n${params.userMessage}` }];
    } else {
      messages.push({ role: "user", content: [{ text: params.userMessage }] });
    }

    const response = await client.send(
      new ConverseCommand({
        modelId,
        system: [{ text: params.system }],
        messages,
        inferenceConfig: { maxTokens: params.maxTokens ?? 800 },
      }),
      { abortSignal: AbortSignal.timeout(45_000) }
    );

    const text = response.output?.message?.content
      ?.map((block) => block.text)
      .filter((value): value is string => typeof value === "string")
      .join("")
      .trim();

    if (!text) {
      throw new Error("O Bedrock retornou uma resposta sem texto.");
    }

    return {
      text,
      inputTokens: response.usage?.inputTokens ?? null,
      outputTokens: response.usage?.outputTokens ?? null,
    };
  } catch (error) {
    console.error("Falha na geração de texto com o Bedrock", error);
    throw error;
  }
}
