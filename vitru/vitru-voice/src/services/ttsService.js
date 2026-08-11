import { spawn } from 'node:child_process';
import { config } from '../config.js';

let worker;
let stdoutBuffer = '';
let nextId = 1;
let readyPromise;
const pending = new Map();

function rejectPending(error) {
  for (const request of pending.values()) request.reject(error);
  pending.clear();
}

function startWorker() {
  if (worker) return readyPromise;

  let markReady;
  let rejectReady;
  readyPromise = new Promise((resolve, reject) => {
    markReady = resolve;
    rejectReady = reject;
  });

  worker = spawn(config.kokoroPython, [config.kokoroWorker], {
    env: { ...process.env, PYTHONUNBUFFERED: '1' },
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  worker.stdout.setEncoding('utf8');
  worker.stdout.on('data', (data) => {
    stdoutBuffer += data;
    const lines = stdoutBuffer.split('\n');
    stdoutBuffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.trim().startsWith('{')) continue;
      let message;
      try {
        message = JSON.parse(line);
      } catch {
        continue;
      }

      if (message.type === 'ready') {
        markReady();
        continue;
      }

      const request = pending.get(message.id);
      if (!request) continue;
      pending.delete(message.id);
      if (message.error) request.reject(new Error(`Kokoro: ${message.error}`));
      else request.resolve(Buffer.from(message.audio, 'base64'));
    }
  });

  worker.stderr.on('data', (data) => {
    const message = data.toString().trim();
    if (message) console.error(`[Kokoro] ${message}`);
  });

  worker.on('error', (error) => {
    rejectReady(error);
    rejectPending(error);
    worker = undefined;
  });

  worker.on('exit', (code) => {
    const error = new Error(`Processo Kokoro encerrado (código ${code}).`);
    rejectReady(error);
    rejectPending(error);
    worker = undefined;
  });

  return readyPromise;
}

/** Sintetiza WAV localmente usando um processo Kokoro persistente. */
export async function synthesizeSpeechStreaming(text, outputFormat, onChunk) {
  if (outputFormat !== 'wav') throw new Error('Kokoro está configurado para saída WAV.');
  await startWorker();

  const id = nextId++;
  const audio = await new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    worker.stdin.write(`${JSON.stringify({
      id,
      text,
      voice: config.kokoroVoice,
      speed: config.kokoroSpeed,
    })}\n`);
  });

  await onChunk(audio);
}
