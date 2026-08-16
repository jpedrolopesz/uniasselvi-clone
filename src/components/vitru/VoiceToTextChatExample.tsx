"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  text: string;
  timestamp: Date;
}

interface VoiceToTextChatExampleProps {
  surface: "portal" | "calendario";
  objectId: string;
}

/**
 * Componente de exemplo demonstrando conversão de voz para texto no cliente
 * e processamento text-to-text no backend via /api/v1/vitru/voice-message
 *
 * Este componente usa:
 * - Web Speech API (Speech Recognition) para converter voz em texto
 * - Endpoint /voice-message com generateResponse: true para processar
 * - Web Speech API (Speech Synthesis) opcional para falar a resposta
 */
export function VoiceToTextChatExample({ surface, objectId }: VoiceToTextChatExampleProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSpeechSupported, setIsSpeechSupported] = useState(true);

  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Verifica suporte a Web Speech API
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSpeechSupported(false);
      setError("Seu navegador não suporta reconhecimento de voz. Use Chrome ou Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "pt-BR";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join("");

      setCurrentTranscript(transcript);
    };

    recognition.onend = async () => {
      setIsRecording(false);

      const finalTranscript = currentTranscript.trim();
      if (finalTranscript) {
        await sendMessage(finalTranscript);
      }

      setCurrentTranscript("");
    };

    recognition.onerror = (event: any) => {
      console.error("Erro no reconhecimento de voz:", event.error);
      setError(`Erro: ${event.error}`);
      setIsRecording(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [currentTranscript]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const startRecording = () => {
    if (!recognitionRef.current || isRecording || isProcessing) return;

    setError(null);
    setCurrentTranscript("");
    setIsRecording(true);

    try {
      recognitionRef.current.start();
    } catch (err) {
      console.error("Erro ao iniciar gravação:", err);
      setError("Não foi possível iniciar a gravação");
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (!recognitionRef.current || !isRecording) return;
    recognitionRef.current.stop();
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isProcessing) return;

    const userMessage: Message = {
      role: "user",
      text: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch("/api/v1/vitru/voice-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          surface,
          objectId,
          role: "user",
          text: userMessage.text,
          generateResponse: true,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error?.message || "Falha ao enviar mensagem");
      }

      const assistantMessage: Message = {
        role: "assistant",
        text: data.reply,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Fala a resposta automaticamente
      await speakText(data.reply);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
      setError(errorMessage);
      console.error("Erro ao enviar mensagem:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const speakText = async (text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!window.speechSynthesis) {
        console.warn("Speech Synthesis não suportado");
        resolve();
        return;
      }

      // Cancela qualquer fala em andamento
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "pt-BR";
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      window.speechSynthesis.speak(utterance);
    });
  };

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto border border-gray-300 rounded-lg">
      {/* Header */}
      <div className="bg-purple-600 text-white p-4 rounded-t-lg">
        <h2 className="text-xl font-semibold">
          Chat por Voz - {surface === "portal" ? "Portal" : "Calendário"}
        </h2>
        <p className="text-sm opacity-90">
          Fale para perguntar • Processamento text-to-text
        </p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {!isSpeechSupported && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 p-4 rounded-lg">
            <p className="text-sm font-semibold">Navegador não suportado</p>
            <p className="text-sm">Use Google Chrome ou Microsoft Edge para usar o chat por voz.</p>
          </div>
        )}

        {messages.length === 0 && isSpeechSupported && (
          <div className="text-center text-gray-500 mt-8">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
              />
            </svg>
            <p>Clique no botão para começar a falar</p>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === "user"
                  ? "bg-purple-600 text-white"
                  : "bg-white text-gray-900 border border-gray-200"
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.text}</p>
              <p
                className={`text-xs mt-1 ${
                  message.role === "user" ? "text-purple-100" : "text-gray-500"
                }`}
              >
                {message.timestamp.toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        ))}

        {/* Transcript em tempo real */}
        {isRecording && currentTranscript && (
          <div className="flex justify-end">
            <div className="max-w-[80%] bg-purple-200 text-purple-900 rounded-lg p-3 border-2 border-purple-400">
              <p className="text-sm italic">{currentTranscript}</p>
            </div>
          </div>
        )}

        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-900 border border-gray-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                <span className="text-sm text-gray-600">Vitru está pensando...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Voice Control */}
      <div className="border-t border-gray-300 p-6 bg-white rounded-b-lg">
        <div className="flex flex-col items-center space-y-3">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={!isSpeechSupported || isProcessing}
            className={`w-20 h-20 rounded-full focus:outline-none focus:ring-4 transition-all ${
              isRecording
                ? "bg-red-600 hover:bg-red-700 focus:ring-red-300 animate-pulse"
                : "bg-purple-600 hover:bg-purple-700 focus:ring-purple-300"
            } disabled:bg-gray-400 disabled:cursor-not-allowed`}
          >
            <svg
              className="w-10 h-10 mx-auto text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isRecording ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              )}
            </svg>
          </button>

          <p className="text-sm text-gray-600">
            {isRecording
              ? "🔴 Gravando... Clique para parar"
              : isProcessing
              ? "⏳ Processando..."
              : "🎤 Clique para falar"}
          </p>

          {isRecording && (
            <div className="text-xs text-gray-500 text-center">
              <p>Fale claramente e naturalmente</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
