import 'dotenv/config';
import { ASSISTANT_SYSTEM_PROMPT } from './prompts/assistantPrompt.js';

export const config = {
  port: process.env.PORT || 3000,
  publicBaseUrl: process.env.PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 3000}`,

  // LLM local - Ollama (não requer token)
  ollamaBaseUrl: (process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434').replace(/\/$/, ''),
  llmModel: process.env.LLM_MODEL || 'llama3.2:latest',

  // STT local - whisper.cpp
  whisperCommand: process.env.WHISPER_COMMAND || 'whisper-cli',
  whisperModelPath: process.env.WHISPER_MODEL_PATH || 'models/ggml-base.bin',
  vadThreshold: Number(process.env.VAD_THRESHOLD || 0.018),
  vadSilenceMs: Number(process.env.VAD_SILENCE_MS || 750),
  vadMinSpeechMs: Number(process.env.VAD_MIN_SPEECH_MS || 350),
  vadMaxSpeechMs: Number(process.env.VAD_MAX_SPEECH_MS || 15_000),

  // TTS local - Kokoro
  kokoroPython: process.env.KOKORO_PYTHON || '.venv-kokoro/bin/python',
  kokoroWorker: process.env.KOKORO_WORKER || 'scripts/kokoro_worker.py',
  kokoroVoice: process.env.KOKORO_VOICE || 'pf_dora',
  kokoroSpeed: Number(process.env.KOKORO_SPEED || 1.05),

  // Prompt do assistente (pode ser sobrescrito via .env para testes rápidos)
  systemPrompt: process.env.ASSISTANT_SYSTEM_PROMPT || ASSISTANT_SYSTEM_PROMPT,
};
