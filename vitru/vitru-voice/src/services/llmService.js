import { config } from '../config.js';

const chatUrl = `${config.ollamaBaseUrl}/api/chat`;

async function requestOllama(history, stream) {
  let response;
  try {
    response = await fetch(chatUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.llmModel,
        stream,
        messages: [{ role: 'system', content: config.systemPrompt }, ...history],
        options: { temperature: 0.6, num_predict: 300 },
      }),
    });
  } catch (error) {
    throw new Error(
      `Não foi possível conectar ao Ollama em ${config.ollamaBaseUrl}. ` +
        `Inicie-o com "ollama serve". Detalhe: ${error.message}`
    );
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Ollama respondeu ${response.status}: ${detail}`);
  }

  return response;
}

export async function generateReply(history) {
  const response = await requestOllama(history, false);
  const result = await response.json();
  return result.message?.content?.trim() ?? '';
}

/** Libera frases completas para o TTS enquanto o Ollama gera a resposta. */
export async function generateReplyStreaming(history, { onSentence }) {
  const response = await requestOllama(history, true);
  if (!response.body) throw new Error('Ollama retornou uma resposta sem conteúdo.');

  let sentenceBuffer = '';
  let fullText = '';
  let ndjsonBuffer = '';
  const sentenceEndRegex = /([.!?]|\n)\s*/;
  const decoder = new TextDecoder();

  const processLine = (line) => {
    if (!line.trim()) return;
    const chunk = JSON.parse(line);
    if (chunk.error) throw new Error(`Ollama: ${chunk.error}`);

    const delta = chunk.message?.content ?? '';
    if (!delta) return;
    sentenceBuffer += delta;
    fullText += delta;

    let match;
    while ((match = sentenceBuffer.match(sentenceEndRegex))) {
      const endIdx = match.index + match[0].length;
      const sentence = sentenceBuffer.slice(0, endIdx).trim();
      sentenceBuffer = sentenceBuffer.slice(endIdx);
      if (sentence) onSentence(sentence);
    }
  };

  for await (const chunk of response.body) {
    ndjsonBuffer += decoder.decode(chunk, { stream: true });
    const lines = ndjsonBuffer.split('\n');
    ndjsonBuffer = lines.pop() ?? '';
    for (const line of lines) processLine(line);
  }

  ndjsonBuffer += decoder.decode();
  if (ndjsonBuffer.trim()) processLine(ndjsonBuffer);
  if (sentenceBuffer.trim()) onSentence(sentenceBuffer.trim());

  return fullText.trim();
}
