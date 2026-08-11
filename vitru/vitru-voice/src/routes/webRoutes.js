import { CallSession } from '../session/CallSession.js';

/**
 * Handler do WebSocket usado pelo cliente web (public/index.html).
 * Protocolo simplificado:
 *  - Cliente envia frames binários de áudio PCM linear16 16kHz (mono).
 *  - Servidor envia de volta frames binários MP3 para tocar no navegador.
 *  - Mensagens de texto (JSON) são usadas para eventos de controle,
 *    ex: {"type": "transcript", "from": "user"|"assistant", "text": "..."}
 */
export function handleWebSocketClient(ws) {
  const session = new CallSession({
    channel: 'web',
    sttAudioFormat: 'pcm_s16le',
    sttSampleRate: 16000,
    ttsOutputFormat: 'wav',
    sendAudioOut: (chunk) => {
      if (ws.readyState === ws.OPEN) ws.send(chunk, { binary: true });
    },
    onTranscriptEvent: (text, from) => {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({ type: 'transcript', from, text }));
      }
    },
  });

  ws.on('message', (data, isBinary) => {
    if (isBinary) {
      session.pushAudio(Buffer.from(data));
    }
  });

  ws.on('close', () => session.close());
}
