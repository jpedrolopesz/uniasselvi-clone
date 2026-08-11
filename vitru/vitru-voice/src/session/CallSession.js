import { openSttStream } from '../services/sttService.js';
import { generateReplyStreaming } from '../services/llmService.js';
import { synthesizeSpeechStreaming } from '../services/ttsService.js';

/**
 * Representa uma chamada/sessão de voz em andamento (telefone ou web).
 * Orquestra: áudio de entrada -> STT -> LLM -> TTS -> áudio de saída.
 */
export class CallSession {
  /**
   * @param {Object} opts
   * @param {'phone'|'web'} opts.channel
   * @param {'pcm_s16le'} opts.sttAudioFormat - formato aceito pelo STT local
   * @param {number} opts.sttSampleRate
   * @param {'wav'} opts.ttsOutputFormat
   * @param {(audioChunk: Buffer) => void} opts.sendAudioOut - envia áudio de volta ao cliente
   * @param {(text: string, from: 'user'|'assistant') => void} [opts.onTranscriptEvent] - para logs/debug
   */
  constructor({ channel, sttAudioFormat, sttSampleRate, ttsOutputFormat, sendAudioOut, onTranscriptEvent }) {
    this.channel = channel;
    this.ttsOutputFormat = ttsOutputFormat;
    this.sendAudioOut = sendAudioOut;
    this.onTranscriptEvent = onTranscriptEvent ?? (() => {});

    this.history = [];
    this.currentUtterance = '';
    this.isResponding = false;
    this.ttsChain = Promise.resolve();

    this.stt = openSttStream({
      audioFormat: sttAudioFormat,
      sampleRate: sttSampleRate,
      onTranscript: (text, isFinal) => {
        if (isFinal) {
          this.currentUtterance += `${this.currentUtterance ? ' ' : ''}${text}`;
        }
      },
      onUtteranceEnd: () => this._handleUtteranceEnd(),
      onError: (err) => console.error(`[CallSession:${this.channel}] erro STT:`, err),
    });
  }

  /** Recebe um chunk de áudio bruto vindo do cliente (telefone ou navegador) */
  pushAudio(buffer) {
    if (this.isResponding) return;
    this.stt.sendAudio(buffer);
  }

  async _handleUtteranceEnd() {
    const userText = this.currentUtterance.trim();
    this.currentUtterance = '';

    if (!userText || this.isResponding) return;

    this.isResponding = true;
    this.onTranscriptEvent(userText, 'user');
    this.history.push({ role: 'user', content: userText });

    try {
      let fullReply = '';

      // Gera a resposta em streaming e manda cada frase pronta direto pro TTS,
      // assim o áudio começa a tocar antes do LLM terminar de responder tudo.
      fullReply = await generateReplyStreaming(this.history, {
        onSentence: (sentence) => {
          this.ttsChain = this.ttsChain.then(() => this._speak(sentence));
        },
      });
      await this.ttsChain;

      this.history.push({ role: 'assistant', content: fullReply });
      this.onTranscriptEvent(fullReply, 'assistant');
    } catch (err) {
      console.error(`[CallSession:${this.channel}] erro no LLM:`, err);
    } finally {
      this.isResponding = false;
    }
  }

  async _speak(sentence) {
    try {
      await synthesizeSpeechStreaming(sentence, this.ttsOutputFormat, (chunk) => {
        this.sendAudioOut(chunk);
      });
    } catch (err) {
      console.error(`[CallSession:${this.channel}] erro no TTS:`, err);
    }
  }

  close() {
    this.stt.close();
  }
}
