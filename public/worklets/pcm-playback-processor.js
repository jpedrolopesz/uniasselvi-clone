/**
 * Fila (jitter buffer) que recebe PCM16 mono a SOURCE_SAMPLE_RATE (24kHz, o
 * que a Nova Sonic devolve) via port.postMessage e reamostra por
 * interpolação linear pra taxa nativa do AudioContext na reprodução.
 */
class PCMPlaybackProcessor extends AudioWorkletProcessor {
  static SOURCE_SAMPLE_RATE = 24000;

  constructor() {
    super();
    this.ratio = PCMPlaybackProcessor.SOURCE_SAMPLE_RATE / sampleRate;
    this.queue = [];
    this.readPos = 0;
    this.messagesReceived = 0;
    this.processCalls = 0;
    console.log("[nova-sonic worklet] playback processor construído, ratio=", this.ratio, "sampleRate=", sampleRate);
    this.port.onmessage = (event) => {
      if (event.data === "clear") {
        this.queue = [];
        this.readPos = 0;
        return;
      }
      const int16 = new Int16Array(event.data);
      const floats = new Float32Array(int16.length);
      for (let i = 0; i < int16.length; i++) floats[i] = int16[i] / 0x8000;
      this.queue.push(floats);
      this.messagesReceived += 1;
      if (this.messagesReceived % 50 === 1) {
        console.log("[nova-sonic worklet] mensagem de áudio recebida, total=", this.messagesReceived, "samples neste bloco=", int16.length, "blocos na fila=", this.queue.length);
      }
    };
  }

  sampleAt(position) {
    let remaining = position;
    for (const block of this.queue) {
      if (remaining < block.length) return block[Math.floor(remaining)] ?? 0;
      remaining -= block.length;
    }
    return null;
  }

  process(_inputs, outputs) {
    this.processCalls += 1;
    if (this.processCalls === 1) {
      console.log("[nova-sonic worklet] process() chamado pela 1a vez. outputs.length=", outputs.length, "outputs[0]?.length=", outputs[0] && outputs[0].length);
    }
    const output = outputs[0] && outputs[0][0];
    if (!output) {
      if (this.processCalls % 500 === 1) console.log("[nova-sonic worklet] sem output[0][0] disponível neste quantum");
      return true;
    }

    let maxAbs = 0;
    for (let i = 0; i < output.length; i++) {
      const sample = this.sampleAt(this.readPos);
      output[i] = sample ?? 0;
      if (Math.abs(output[i]) > maxAbs) maxAbs = Math.abs(output[i]);
      this.readPos += this.ratio;
    }

    while (this.queue.length > 0 && this.readPos >= this.queue[0].length) {
      this.readPos -= this.queue[0].length;
      this.queue.shift();
    }

    if (this.processCalls % 500 === 1) {
      console.log("[nova-sonic worklet] process() #", this.processCalls, "filaBlocos=", this.queue.length, "readPos=", this.readPos.toFixed(1), "maxAbsNesteBloco=", maxAbs.toFixed(4));
    }

    return true;
  }
}

registerProcessor("pcm-playback-processor", PCMPlaybackProcessor);
