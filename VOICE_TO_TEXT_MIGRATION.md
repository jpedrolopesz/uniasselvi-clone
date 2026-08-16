# Migração de Speech-to-Speech para Text-to-Text

## Resumo das Mudanças

O sistema de voz foi atualizado para suportar **text-to-text** em vez de apenas speech-to-speech. Agora você pode enviar mensagens de texto e receber respostas da IA diretamente.

## O que foi alterado

### 1. Endpoint `/api/v1/vitru/voice-message`

O endpoint foi expandido para suportar geração automática de respostas via IA.

#### Novo parâmetro: `generateResponse`

Quando `generateResponse: true` é enviado junto com uma mensagem do usuário, o sistema:
- Salva a mensagem do usuário
- Gera uma resposta usando AWS Bedrock (Amazon Nova)
- Salva a resposta do assistente
- Retorna a resposta gerada

#### Exemplo de uso (comportamento antigo - apenas salva):

```typescript
const response = await fetch("/api/v1/vitru/voice-message", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    surface: "portal",        // ou "calendario"
    objectId: "disciplina-123",
    role: "user",
    text: "Qual é o prazo da minha prova?"
  }),
});

const result = await response.json();
// { ok: true, conversationId: "..." }
```

#### Exemplo de uso (novo - gera resposta):

```typescript
const response = await fetch("/api/v1/vitru/voice-message", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    surface: "portal",        // ou "calendario"
    objectId: "disciplina-123",
    role: "user",
    text: "Qual é o prazo da minha prova?",
    generateResponse: true    // ← NOVO PARÂMETRO
  }),
});

const result = await response.json();
// {
//   ok: true,
//   reply: "Sua próxima prova está agendada para...",
//   conversationId: "...",
//   inputTokens: 150,
//   outputTokens: 200
// }
```

### 2. Prompts por Superfície

Foram criados dois prompts diferentes no arquivo `/lib/vitru/prompts.ts`:

- **`buildPortalSystemPrompt`**: Para a superfície "portal" (perguntas gerais sobre disciplinas, aulas, notas)
- **`buildCalendarSystemPrompt`**: Para a superfície "calendario" (gestão de cronograma e prazos)

O sistema escolhe automaticamente o prompt correto baseado na superfície.

### 3. Suporte a Contexto e Histórico

O endpoint agora:
- Busca o histórico da conversa
- Carrega o contexto acadêmico do aluno
- Carrega o perfil do estudante
- Usa tudo isso para gerar respostas contextualizadas

## Como usar no Frontend

### Opção 1: Chat de Texto Puro

Se você quer criar um chat de texto simples:

```typescript
async function sendMessage(text: string) {
  const response = await fetch("/api/v1/vitru/voice-message", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      surface: "portal",
      objectId: "disciplina-123",
      role: "user",
      text: text,
      generateResponse: true
    }),
  });

  const data = await response.json();

  if (data.ok) {
    console.log("Resposta da IA:", data.reply);
    return data.reply;
  } else {
    console.error("Erro:", data.error);
  }
}
```

### Opção 2: Integrar com Speech-to-Text no Cliente

Se você quer manter a entrada de voz mas processar como texto:

```typescript
// 1. Converter áudio para texto (usando Web Speech API ou outro serviço)
const transcript = await speechToText(audioBlob);

// 2. Enviar o texto para o endpoint
const response = await fetch("/api/v1/vitru/voice-message", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    surface: "portal",
    objectId: "disciplina-123",
    role: "user",
    text: transcript,
    generateResponse: true
  }),
});

const data = await response.json();

// 3. Exibir ou falar a resposta
displayMessage(data.reply);
// ou: await textToSpeech(data.reply);
```

### Opção 3: Usar o endpoint `/api/v1/vitru/chat` (alternativa)

O endpoint `/chat` já existia e tem lógica mais complexa com suporte a ações. Se você precisa de:
- Navegação automática
- Abertura de lições
- Confirmação de planos de estudo

Use `/chat` em vez de `/voice-message`.

## Compatibilidade

- ✅ O comportamento antigo ainda funciona (sem `generateResponse`)
- ✅ Não quebra código existente que usa `voice-message` apenas para logging
- ✅ O endpoint `/voice-session` continua funcionando normalmente
- ✅ O endpoint `/chat` não foi alterado

## Próximos Passos

Se você quiser remover completamente a dependência de speech-to-speech:

1. Atualizar o componente `VoiceAssistantWindow.tsx` para usar `generateResponse: true`
2. Implementar conversão de texto para fala no cliente (usando Web Speech API ou serviço externo)
3. Remover integrações com serviços de speech-to-speech externos (se houver)

## Suporte a Text-to-Speech (TTS)

Para converter a resposta de texto em áudio, você pode usar:

### Web Speech API (Grátis, funciona no navegador)

```typescript
function speakText(text: string) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'pt-BR';
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  window.speechSynthesis.speak(utterance);
}
```

### AWS Polly (Pago, mais natural)

```typescript
import { PollyClient, SynthesizeSpeechCommand } from "@aws-sdk/client-polly";

async function textToSpeech(text: string): Promise<Blob> {
  const client = new PollyClient({ region: "us-east-1" });

  const command = new SynthesizeSpeechCommand({
    Text: text,
    OutputFormat: "mp3",
    VoiceId: "Camila", // Voz em português brasileiro
    Engine: "neural"
  });

  const response = await client.send(command);
  const audioStream = response.AudioStream;

  // Converter stream para Blob
  const chunks: Uint8Array[] = [];
  for await (const chunk of audioStream as any) {
    chunks.push(chunk);
  }

  return new Blob(chunks, { type: "audio/mpeg" });
}
```

## Estrutura de Arquivos Modificados

```
/lib/vitru/
  ├── prompts.ts                    ← Adicionado buildPortalSystemPrompt()
  └── generate.ts                   ← Sem alterações (já existia)

/src/app/api/v1/vitru/
  └── voice-message/
      └── route.ts                  ← Expandido com suporte a generateResponse
```

## Testes

Lembre-se de atualizar os testes em `/src/app/api/v1/vitru/voice-message/route.test.ts` para cobrir o novo comportamento com `generateResponse: true`.
