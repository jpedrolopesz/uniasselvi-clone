# Exemplo de Integração: Como Adicionar Chat Text-to-Text em suas Páginas

## 📌 Cenário 1: Adicionar Chat de Texto em uma Página de Disciplina

Vamos adicionar o chat Vitru em uma página de disciplina existente.

### Passo 1: Criar o componente específico da página

```tsx
// src/components/vitru/DisciplinaChat.tsx
"use client";

import { TextChatExample } from "@/components/vitru/TextChatExample";
import { useState } from "react";

interface DisciplinaChatProps {
  subjectCode: string;
  subjectName: string;
}

export function DisciplinaChat({ subjectCode, subjectName }: DisciplinaChatProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-all z-50"
        aria-label="Abrir chat Vitru"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] shadow-2xl rounded-lg overflow-hidden z-50">
      <div className="bg-blue-600 text-white p-3 flex justify-between items-center">
        <div>
          <h3 className="font-semibold">Vitru</h3>
          <p className="text-xs opacity-90">{subjectName}</p>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-white hover:bg-blue-700 p-2 rounded"
          aria-label="Fechar chat"
        >
          ✕
        </button>
      </div>
      <TextChatExample
        surface="portal"
        objectId={`disciplina-${subjectCode}`}
      />
    </div>
  );
}
```

### Passo 2: Integrar na página da disciplina

```tsx
// src/app/disciplinas/[codigo]/page.tsx
import { DisciplinaChat } from "@/components/vitru/DisciplinaChat";

export default function DisciplinaPage({ params }: { params: { codigo: string } }) {
  const subject = getSubject(params.codigo); // sua função existente

  return (
    <div>
      {/* Seu conteúdo existente */}
      <h1>{subject.name}</h1>
      <div className="conteudo-da-disciplina">
        {/* ... */}
      </div>

      {/* Adicione o chat flutuante */}
      <DisciplinaChat
        subjectCode={params.codigo}
        subjectName={subject.name}
      />
    </div>
  );
}
```

---

## 📌 Cenário 2: Chat de Voz no Calendário

### Passo 1: Criar wrapper do calendário

```tsx
// src/components/vitru/CalendarioVoiceChat.tsx
"use client";

import { VoiceToTextChatExample } from "@/components/vitru/VoiceToTextChatExample";

export function CalendarioVoiceChat() {
  return (
    <div className="w-full max-w-4xl mx-auto my-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">
          💬 Fale com o Vitru sobre seu Calendário
        </h2>
        <p className="text-gray-600 mb-6">
          Use sua voz para pedir ajuda com prazos, avaliações e organização de estudos.
        </p>

        <VoiceToTextChatExample
          surface="calendario"
          objectId="calendario-principal"
        />
      </div>
    </div>
  );
}
```

### Passo 2: Adicionar na página do calendário

```tsx
// src/app/calendario-de-estudos/page.tsx
import { CalendarioVoiceChat } from "@/components/vitru/CalendarioVoiceChat";

export default function CalendarioPage() {
  return (
    <div>
      <h1>Calendário de Estudos</h1>

      {/* Seu calendário existente */}
      <div className="calendario-grid">
        {/* ... */}
      </div>

      {/* Chat de voz integrado */}
      <CalendarioVoiceChat />
    </div>
  );
}
```

---

## 📌 Cenário 3: Widget de Ajuda Rápida (Drawer lateral)

### Componente de Drawer

```tsx
// src/components/vitru/VitruDrawer.tsx
"use client";

import { TextChatExample } from "@/components/vitru/TextChatExample";
import { useState } from "react";

interface VitruDrawerProps {
  defaultSurface?: "portal" | "calendario";
  defaultObjectId?: string;
}

export function VitruDrawer({
  defaultSurface = "portal",
  defaultObjectId = "ajuda-geral"
}: VitruDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Botão flutuante */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed right-0 top-1/2 -translate-y-1/2 bg-purple-600 text-white px-3 py-6 rounded-l-lg shadow-lg hover:bg-purple-700 transition-all z-40 flex items-center gap-2"
        aria-label="Ajuda Vitru"
      >
        <span className="text-sm font-semibold [writing-mode:vertical-lr] rotate-180">
          Precisa de Ajuda?
        </span>
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 h-full w-96 bg-white shadow-2xl transform transition-transform duration-300 z-50 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="bg-purple-600 text-white p-4 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">Vitru Ajuda</h2>
              <p className="text-sm opacity-90">Estou aqui para ajudar!</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-purple-700 p-2 rounded"
              aria-label="Fechar"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-hidden">
            <TextChatExample
              surface={defaultSurface}
              objectId={defaultObjectId}
            />
          </div>
        </div>
      </div>
    </>
  );
}
```

### Adicionar no layout principal

```tsx
// src/app/layout.tsx
import { VitruDrawer } from "@/components/vitru/VitruDrawer";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        {children}

        {/* Widget de ajuda disponível em todas as páginas */}
        <VitruDrawer />
      </body>
    </html>
  );
}
```

---

## 📌 Cenário 4: Modal de Chat (Centro da tela)

### Componente Modal

```tsx
// src/components/vitru/VitruModal.tsx
"use client";

import { TextChatExample } from "@/components/vitru/TextChatExample";
import { useEffect } from "react";

interface VitruModalProps {
  isOpen: boolean;
  onClose: () => void;
  surface: "portal" | "calendario";
  objectId: string;
  title?: string;
}

export function VitruModal({
  isOpen,
  onClose,
  surface,
  objectId,
  title = "Chat com Vitru"
}: VitruModalProps) {
  // Fechar com ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      window.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }

    return () => {
      window.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-lg flex justify-between items-center">
          <h2 className="text-xl font-bold">{title}</h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 p-2 rounded transition-colors"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        {/* Chat */}
        <div className="flex-1 overflow-hidden">
          <TextChatExample surface={surface} objectId={objectId} />
        </div>
      </div>
    </div>
  );
}
```

### Uso do modal

```tsx
// Em qualquer página
"use client";

import { VitruModal } from "@/components/vitru/VitruModal";
import { useState } from "react";

export default function MinhaPage() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div>
      <h1>Minha Página</h1>

      <button
        onClick={() => setIsChatOpen(true)}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        💬 Falar com Vitru
      </button>

      <VitruModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        surface="portal"
        objectId="pagina-exemplo"
        title="Precisa de ajuda?"
      />
    </div>
  );
}
```

---

## 📌 Cenário 5: Chat Inline (Parte da página)

### Uso direto sem wrapper

```tsx
// src/app/ajuda/page.tsx
import { TextChatExample } from "@/components/vitru/TextChatExample";

export default function AjudaPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Coluna esquerda: FAQ */}
        <div>
          <h1 className="text-3xl font-bold mb-6">Perguntas Frequentes</h1>
          <div className="space-y-4">
            <details className="bg-white p-4 rounded-lg shadow">
              <summary className="font-semibold cursor-pointer">
                Como acessar minhas notas?
              </summary>
              <p className="mt-2 text-gray-600">...</p>
            </details>
            {/* Mais FAQs */}
          </div>
        </div>

        {/* Coluna direita: Chat */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Chat com Vitru</h2>
          <p className="text-gray-600 mb-4">
            Não encontrou o que procurava? Pergunte diretamente!
          </p>
          <div className="h-[600px]">
            <TextChatExample
              surface="portal"
              objectId="pagina-ajuda"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 🎨 Customização de Estilos

### Exemplo de tema customizado

```tsx
// src/components/vitru/CustomVitruChat.tsx
"use client";

import { useState, useRef, useEffect } from "react";

// Copie o código do TextChatExample.tsx e customize as classes:

export function CustomVitruChat({ surface, objectId }: Props) {
  // ... mesma lógica ...

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto border-2 border-purple-500 rounded-2xl shadow-2xl">
      {/* Header customizado */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-t-2xl">
        <h2 className="text-2xl font-bold">✨ Vitru AI Assistant</h2>
        <p className="text-sm opacity-90 mt-1">Powered by AWS Bedrock Nova</p>
      </div>

      {/* Mensagens com tema customizado */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-purple-50 to-pink-50">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl p-4 ${
                message.role === "user"
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
                  : "bg-white text-gray-900 border-2 border-purple-200 shadow-md"
              }`}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Input customizado */}
      <div className="border-t-2 border-purple-200 p-4 bg-white rounded-b-2xl">
        <div className="flex space-x-3">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua mensagem..."
            className="flex-1 border-2 border-purple-300 rounded-full px-6 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !inputText.trim()}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-full hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold"
          >
            {isLoading ? "⏳" : "📤"}
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## 🔧 Dicas de Performance

### 1. Lazy Loading

```tsx
import dynamic from "next/dynamic";

const TextChatExample = dynamic(
  () => import("@/components/vitru/TextChatExample").then(mod => ({ default: mod.TextChatExample })),
  { ssr: false, loading: () => <p>Carregando chat...</p> }
);
```

### 2. Debounce de transcrição (para voz)

```tsx
// No VoiceToTextChatExample.tsx, adicione debounce na transcrição
import { useCallback } from "react";
import { debounce } from "lodash"; // ou crie sua própria função

const debouncedSetTranscript = useCallback(
  debounce((text: string) => setCurrentTranscript(text), 300),
  []
);
```

### 3. Cache de contexto

```tsx
// Use React Query para cachear requisições
import { useQuery } from "@tanstack/react-query";

function useChatMessages(conversationId: string) {
  return useQuery({
    queryKey: ["chat", conversationId],
    queryFn: () => fetchMessages(conversationId),
    staleTime: 30000, // Cache por 30 segundos
  });
}
```

---

## 📱 Responsividade

### Mobile-first

```tsx
// Ajuste os componentes para mobile
<div className="
  fixed bottom-0 left-0 right-0
  md:bottom-6 md:right-6 md:left-auto
  w-full md:w-96
  h-screen md:h-[600px]
  md:rounded-lg
">
  <TextChatExample surface="portal" objectId="mobile-chat" />
</div>
```

---

## 🎯 Conclusão

Escolha o padrão que melhor se adequa à sua página:

1. **Botão flutuante** → Para disponibilidade global
2. **Drawer lateral** → Para acesso rápido sem atrapalhar
3. **Modal centralizado** → Para foco total na conversa
4. **Inline** → Para páginas de ajuda/FAQ
5. **Customizado** → Para match perfeito com seu design

Todos os padrões usam os mesmos componentes base (`TextChatExample` ou `VoiceToTextChatExample`), apenas com wrappers diferentes!
