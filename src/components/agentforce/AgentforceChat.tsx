"use client";

import { useState, useRef, useEffect } from "react";
import { VITRU_OPEN_ASSISTANT_EVENT } from "@/components/vitru/assistant-events";

interface Message {
  id: string;
  role: "user" | "agent";
  text: string;
}

interface AgentforceChatProps {
  studentId: string;
  studentName?: string;
}

type AgentMode = "agentforce" | "sonic";

/**
 * Widget Vitru — Abre quando o botão Vitru no sidebar é clicado.
 * Dois modos: Agentforce (texto) e Nova Sonic (voz).
 * Respostas simuladas para demo/banca.
 */
export function AgentforceChat({ studentId, studentName }: AgentforceChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<AgentMode>("agentforce");

  // Escuta o evento do sidebar para abrir/fechar
  useEffect(() => {
    function handleOpen() {
      setIsOpen((prev) => !prev);
    }
    window.addEventListener(VITRU_OPEN_ASSISTANT_EVENT, handleOpen);
    return () => window.removeEventListener(VITRU_OPEN_ASSISTANT_EVENT, handleOpen);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 left-20 w-[23rem] h-[34rem] rounded-2xl bg-bg-card border border-border-subtle shadow-2xl flex flex-col z-50 overflow-hidden">
      {/* Header */}
      <div className="border-b border-border-subtle bg-bg-sidebar shrink-0">
        <div className="flex items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-brand-yellow flex items-center justify-center">
              <span className="text-black text-xs font-bold">V</span>
            </div>
            <span className="text-sm font-semibold text-text-primary">Vitru</span>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-text-secondary hover:text-text-primary p-1" aria-label="Fechar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-3 pb-2 gap-1">
          <button
            onClick={() => setMode("agentforce")}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              mode === "agentforce"
                ? "bg-[#00A1E0]/15 text-[#00A1E0] border border-[#00A1E0]/30"
                : "bg-bg-card-hover text-text-secondary hover:text-text-primary border border-transparent"
            }`}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            Agentforce
            <span className="text-[9px] opacity-60">(texto)</span>
          </button>
          <button
            onClick={() => setMode("sonic")}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              mode === "sonic"
                ? "bg-accent-purple/15 text-accent-purple border border-accent-purple/30"
                : "bg-bg-card-hover text-text-secondary hover:text-text-primary border border-transparent"
            }`}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            </svg>
            Nova Sonic
            <span className="text-[9px] opacity-60">(voz)</span>
          </button>
        </div>
      </div>

      {mode === "agentforce" ? (
        <AgentforceTextChat studentName={studentName} />
      ) : (
        <NovaSonicVoiceChat studentName={studentName} />
      )}
    </div>
  );
}

// ========================================
// MODO 1: Salesforce Agentforce (texto)
// ========================================

function AgentforceTextChat({ studentName }: { studentName?: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function sendMessage(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || typing) return;

    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: "user", text: msg }]);
    setInput("");
    setTyping(true);

    setTimeout(() => {
      const response = getAgentforceResponse(msg);
      setMessages((prev) => [...prev, { id: `a-${Date.now()}`, role: "agent", text: response }]);
      setTyping(false);
    }, 1000 + Math.random() * 800);
  }

  return (
    <>
      <div className="px-4 py-1.5 bg-[#00A1E0]/5 border-b border-[#00A1E0]/10 shrink-0">
        <p className="text-[10px] text-[#00A1E0] flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00A1E0] animate-pulse" />
          Salesforce Agentforce · Chat por escrita
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-2">
            <div className="w-10 h-10 rounded-full bg-[#00A1E0]/10 flex items-center justify-center mb-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00A1E0" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <p className="text-sm text-text-primary font-medium">Oi{studentName ? `, ${studentName}` : ""}!</p>
            <p className="text-xs text-text-secondary mt-1">Sou o Vitru via Agentforce. Digite ou escolha:</p>
            <div className="flex flex-wrap gap-1.5 mt-3 justify-center">
              {["O que estudar hoje?", "Me indica um grupo", "Monte meu plano", "Como estou?"].map((s) => (
                <button key={s} onClick={() => sendMessage(s)}
                  className="px-2.5 py-1 rounded-full text-[11px] bg-bg-card-hover border border-border-subtle text-text-secondary hover:text-text-primary hover:border-[#00A1E0]/50 transition">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[82%] px-3 py-2 rounded-xl text-[13px] leading-relaxed whitespace-pre-wrap ${
              msg.role === "user"
                ? "bg-brand-yellow text-black rounded-br-sm"
                : "bg-bg-card-hover text-text-primary border border-border-subtle rounded-bl-sm"
            }`}>
              {msg.text}
            </div>
          </div>
        ))}

        {typing && (
          <div className="flex justify-start">
            <div className="px-3 py-2 rounded-xl bg-bg-card-hover border border-border-subtle rounded-bl-sm">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-text-secondary rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-text-secondary rounded-full animate-bounce [animation-delay:0.15s]" />
                <span className="w-1.5 h-1.5 bg-text-secondary rounded-full animate-bounce [animation-delay:0.3s]" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="px-3 py-2.5 border-t border-border-subtle shrink-0">
        <div className="flex gap-2">
          <input type="text" value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Digite sua pergunta..." disabled={typing}
            className="flex-1 px-3 py-2 bg-bg-card-hover border border-border-subtle rounded-lg text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-[#00A1E0] disabled:opacity-50" />
          <button onClick={() => sendMessage()} disabled={!input.trim() || typing}
            className="px-3 py-2 bg-[#00A1E0] text-white rounded-lg font-bold text-sm hover:bg-[#0081B8] disabled:opacity-50 transition">↑</button>
        </div>
      </div>
    </>
  );
}

// ========================================
// MODO 2: Amazon Nova Sonic (voz)
// ========================================

const SONIC_CONVERSATIONS = [
  { user: "O que devo estudar hoje?", agent: "Priorize Estatística — avaliação em 3 dias. Use mapas mentais por 45 minutos hoje à noite. Depois, 30 minutos de exercícios de Cálculo." },
  { user: "Me indica uma comunidade", agent: "Recomendo a Empresa Júnior de Administração — 75% de compatibilidade com seu perfil. Também tem o grupo de Networking com eventos quinzenais." },
  { user: "Monte meu plano semanal", agent: "Segunda: Estatística com mapas mentais. Terça: Cálculo com exercícios. Quarta: revisão de Estatística. Quinta: Direito Empresarial. Sexta: flashcards gerais. 45 minutos por noite." },
  { user: "Como estou no curso?", agent: "Seu score de engajamento está em 62 de 100 — atenção. Cálculo está com nota 5.2. Entrar em uma comunidade e acessar diariamente melhora bastante." },
  { user: "Qual meu estilo de aprendizagem?", agent: "Você é predominantemente visual e cinestésico. Mapas mentais, exercícios práticos e flashcards visuais são os métodos com maior eficácia para você." },
];

function NovaSonicVoiceChat({ studentName }: { studentName?: string }) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentConv, setCurrentConv] = useState(0);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [response, setResponse] = useState<string | null>(null);
  const [history, setHistory] = useState<{ role: "user" | "agent"; text: string }[]>([]);

  function toggleListening() {
    if (isListening) {
      setIsListening(false);
      setIsProcessing(true);

      const conv = SONIC_CONVERSATIONS[currentConv % SONIC_CONVERSATIONS.length];
      setTranscript(conv.user);

      setTimeout(() => {
        setResponse(conv.agent);
        setHistory((prev) => [
          ...prev,
          { role: "user", text: conv.user },
          { role: "agent", text: conv.agent },
        ]);
        setCurrentConv((c) => c + 1);
        setIsProcessing(false);
      }, 1800 + Math.random() * 700);
    } else {
      setIsListening(true);
      setTranscript(null);
      setResponse(null);
    }
  }

  return (
    <>
      <div className="px-4 py-1.5 bg-accent-purple/5 border-b border-accent-purple/10 shrink-0">
        <p className="text-[10px] text-accent-purple flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-purple animate-pulse" />
          Amazon Nova Sonic (Bedrock) · Conversa por voz
        </p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-4">
        {!isListening && !isProcessing && !response && history.length === 0 && (
          <div className="text-center">
            <p className="text-sm text-text-primary font-medium mb-1">Oi{studentName ? `, ${studentName}` : ""}!</p>
            <p className="text-xs text-text-secondary">Pressione o microfone e fale comigo.<br/>Respondo por voz em tempo real.</p>
          </div>
        )}

        {isListening && (
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-1 h-8">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="w-1 bg-accent-purple rounded-full animate-pulse"
                  style={{ height: `${8 + Math.sin(i * 0.9) * 16 + 8}px`, animationDelay: `${i * 0.08}s`, animationDuration: "0.6s" }} />
              ))}
            </div>
            <p className="text-sm text-accent-purple font-medium animate-pulse">Ouvindo...</p>
          </div>
        )}

        {isProcessing && (
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-2 border-accent-purple border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-text-secondary">Nova Sonic processando...</p>
            {transcript && <p className="text-xs text-text-secondary/70 italic max-w-[200px] text-center">&ldquo;{transcript}&rdquo;</p>}
          </div>
        )}

        {response && !isListening && !isProcessing && (
          <div className="w-full flex flex-col gap-2">
            <div className="px-3 py-2 rounded-lg bg-bg-card-hover border border-border-subtle">
              <p className="text-[10px] text-text-secondary mb-0.5">🎙️ Você disse:</p>
              <p className="text-xs text-text-primary">{transcript}</p>
            </div>
            <div className="px-3 py-2 rounded-lg bg-accent-purple/10 border border-accent-purple/20">
              <p className="text-[10px] text-accent-purple mb-0.5">🔊 Vitru respondeu:</p>
              <p className="text-xs text-text-primary">{response}</p>
            </div>
            <p className="text-[10px] text-text-secondary text-center mt-1">Toque no mic para continuar</p>
          </div>
        )}

        {history.length > 0 && !isListening && !isProcessing && !response && (
          <div className="w-full flex flex-col gap-1.5 max-h-44 overflow-y-auto">
            {history.slice(-6).map((h, i) => (
              <div key={i} className={`px-2.5 py-1.5 rounded-lg text-[11px] ${
                h.role === "user" ? "bg-bg-card-hover text-text-secondary" : "bg-accent-purple/10 text-text-primary"
              }`}>
                <span className="font-medium">{h.role === "user" ? "🎙️ Você" : "🔊 Vitru"}:</span> {h.text}
              </div>
            ))}
          </div>
        )}

        <button
          onClick={toggleListening}
          disabled={isProcessing}
          className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg ${
            isListening
              ? "bg-accent-red scale-110 shadow-accent-red/30 animate-pulse"
              : "bg-accent-purple hover:bg-accent-purple/80 hover:scale-105 shadow-accent-purple/20"
          } disabled:opacity-50 disabled:animate-none`}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            {isListening ? (
              <rect x="6" y="6" width="12" height="12" rx="2" />
            ) : (
              <>
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="22" />
              </>
            )}
          </svg>
        </button>
        <p className="text-[11px] text-text-secondary">
          {isListening ? "Toque para parar" : isProcessing ? "Processando..." : "Toque para falar"}
        </p>
      </div>

      <div className="px-4 py-2 border-t border-border-subtle shrink-0">
        <p className="text-[10px] text-text-secondary text-center">
          Speech-to-speech · Sem STT+TTS separados · Latência &lt;1s · Português BR
        </p>
      </div>
    </>
  );
}

// ========================================
// Respostas simuladas Agentforce (texto)
// ========================================

function getAgentforceResponse(userMessage: string): string {
  const msg = userMessage.toLowerCase();

  if (msg.includes("estudar hoje") || msg.includes("o que estud") || msg.includes("priorizar")) {
    return `📚 Prioridades de hoje:

1. Estatística — Avaliação em 3 dias (peso 4)
   Método: Mapas Mentais · 45min às 19h

2. Cálculo I — Nota 5.2 (risco)
   Método: Exercícios · 45min amanhã

3. Direito Empresarial — Em dia ✓

Quer o plano completo da semana?`;
  }

  if (msg.includes("grupo") || msg.includes("comunidade") || msg.includes("indica")) {
    return `🤝 Top 3 para você (ADM, visual):

🏢 EJ Admin — 75% match
   marketing, gestão · 23 membros

🎓 Mentoria Veteranos — 65% match
   orientação 1-on-1 · mensal

🤝 Networking — 60% match
   eventos quinzenais online

Participar reduz seu risco em ~15 pts.`;
  }

  if (msg.includes("plano") || msg.includes("monte") || msg.includes("semana")) {
    return `📅 Plano semanal (45min/noite):

Seg — Estatística (Mapas Mentais)
Ter — Cálculo I (Exercícios)
Qua — Estatística (Quiz revisão)
Qui — Direito (Resumo visual)
Sex — Revisão geral (Flashcards)

Total: 3h45/semana · Perfil: Visual
Confirma esse plano?`;
  }

  if (msg.includes("como estou") || msg.includes("progresso") || msg.includes("nota")) {
    return `📊 Seu status atual:

Score: 62/100 ⚠️ (atenção)
Média: 6.4 · Em dia: 3/5 disciplinas

⚠️ Alertas:
• Cálculo I: nota 5.2
• 8 dias sem acessar o AVA

💡 Para melhorar:
• Entrar em 1 grupo → -15 pts risco
• Acesso diário → -10 pts
• Subir Cálculo acima de 6 → -8 pts`;
  }

  if (msg.includes("confirma") || msg.includes("sim") || msg.includes("ok")) {
    return `✅ Perfeito! Plano confirmado.

Seus lembretes:
• Hoje 19h: Estatística (Mapas Mentais)
• Amanhã 19h: Cálculo I (Exercícios)

Boa sorte nos estudos! Me chama se precisar.`;
  }

  return `Posso te ajudar com:

📚 "O que estudar hoje?" — priorizo suas matérias
🤝 "Me indica um grupo" — conecto à comunidade
📅 "Monte meu plano" — organizo sua semana
📊 "Como estou?" — resumo do progresso

O que precisa?`;
}
