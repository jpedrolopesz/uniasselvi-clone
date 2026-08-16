/**
 * Downsampla o microfone (taxa nativa do AudioContext, geralmente 48kHz) para
 * PCM16 mono a TARGET_SAMPLE_RATE (16kHz, o que a Nova Sonic espera de
 * entrada) e posta blocos de ~20ms pro thread principal.
 */
class PCMCaptureProcessor extends AudioWorkletProcessor {
  static TARGET_SAMPLE_RATE = 16000;
  static CHUNK_MS = 20;

  constructor() {
    super();
    this.ratio = sampleRate / PCMCaptureProcessor.TARGET_SAMPLE_RATE;
    this.chunkSize = Math.round((PCMCaptureProcessor.TARGET_SAMPLE_RATE * PCMCaptureProcessor.CHUNK_MS) / 1000);
    this.buffer = [];
    this.sourcePos = 0;
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || input.length === 0) return true;
    const channel = input[0];
    if (!channel || channel.length === 0) return true;

    for (let i = 0; i < channel.length; i++) {
      this.sourcePos += 1;
      if (this.sourcePos >= this.ratio) {
        this.sourcePos -= this.ratio;
        const sample = Math.max(-1, Math.min(1, channel[i]));
        this.buffer.push(sample < 0 ? sample * 0x8000 : sample * 0x7fff);
      }
    }

    while (this.buffer.length >= this.chunkSize) {
      const chunk = this.buffer.splice(0, this.chunkSize);
      const int16 = new Int16Array(chunk.length);
      for (let i = 0; i < chunk.length; i++) int16[i] = chunk[i];
      this.port.postMessage(int16.buffer, [int16.buffer]);
    }

    return true;
  }
}

registerProcessor("pcm-capture-processor", PCMCaptureProcessor);
