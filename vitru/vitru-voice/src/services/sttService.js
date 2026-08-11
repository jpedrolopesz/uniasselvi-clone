import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { config } from '../config.js';

const execFileAsync = promisify(execFile);

function createWav(pcm, sampleRate) {
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write('WAVEfmt ', 8);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

function rmsPcm16(buffer) {
  let sum = 0;
  const samples = Math.floor(buffer.length / 2);
  for (let i = 0; i < samples; i++) {
    const value = buffer.readInt16LE(i * 2) / 32768;
    sum += value * value;
  }
  return samples ? Math.sqrt(sum / samples) : 0;
}

async function transcribe(pcm, sampleRate) {
  const dir = await mkdtemp(path.join(tmpdir(), 'voice-ai-stt-'));
  const input = path.join(dir, 'speech.wav');
  const output = path.join(dir, 'result');
  try {
    await writeFile(input, createWav(pcm, sampleRate));
    await execFileAsync(config.whisperCommand, [
      '-m', config.whisperModelPath,
      '-f', input,
      '-l', 'pt',
      '-otxt',
      '-of', output,
      '-np',
      '-nt',
    ], { timeout: 60_000, maxBuffer: 1024 * 1024 });
    return (await readFile(`${output}.txt`, 'utf8')).trim();
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

/** STT local com detecção de fala por energia para áudio PCM16 mono. */
export function openSttStream({ audioFormat, sampleRate, onTranscript, onUtteranceEnd, onError }) {
  if (audioFormat !== 'pcm_s16le') {
    throw new Error('O STT local aceita somente pcm_s16le; use o canal web.');
  }

  const preRoll = [];
  const speech = [];
  let speaking = false;
  let silenceMs = 0;
  let speechMs = 0;
  let processing = false;
  let closed = false;

  const finishUtterance = async () => {
    if (processing || speechMs < config.vadMinSpeechMs) {
      speech.length = 0;
      speaking = false;
      silenceMs = 0;
      speechMs = 0;
      return;
    }

    processing = true;
    const audio = Buffer.concat(speech);
    speech.length = 0;
    speaking = false;
    silenceMs = 0;
    speechMs = 0;

    try {
      const text = await transcribe(audio, sampleRate);
      if (text && !/^\[.*\]$/.test(text)) {
        onTranscript(text, true);
        await onUtteranceEnd();
      }
    } catch (error) {
      onError?.(error);
    } finally {
      processing = false;
    }
  };

  return {
    sendAudio(buffer) {
      if (closed || processing || buffer.length < 2) return;
      const durationMs = (buffer.length / 2 / sampleRate) * 1000;
      const level = rmsPcm16(buffer);

      if (!speaking) {
        preRoll.push(Buffer.from(buffer));
        while (preRoll.length > 3) preRoll.shift();
        if (level >= config.vadThreshold) {
          speaking = true;
          speech.push(...preRoll);
          preRoll.length = 0;
          speechMs += durationMs;
        }
        return;
      }

      speech.push(Buffer.from(buffer));
      speechMs += durationMs;
      silenceMs = level < config.vadThreshold ? silenceMs + durationMs : 0;

      if (silenceMs >= config.vadSilenceMs || speechMs >= config.vadMaxSpeechMs) {
        void finishUtterance();
      }
    },
    close() {
      closed = true;
      if (speaking) void finishUtterance();
    },
  };
}
