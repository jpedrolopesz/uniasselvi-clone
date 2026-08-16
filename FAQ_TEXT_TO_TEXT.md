# FAQ - Sistema Text-to-Text

## ❓ Perguntas Frequentes

### 1. Qual a diferença entre `/voice-message` e `/chat`?

**`/api/v1/vitru/chat`** (já existia):
- Tem lógica complexa de resolução (FAQ → Conteúdo → Geração)
- Retorna ações estruturadas (navegar, abrir aula, confirmar plano)
- Específico para superfícies "trilha" e "calendario"
- Usa resolução local antes de chamar a IA

**`/api/v1/vitru/voice-message`** (agora expandido):
- Mais simples e direto
- Sempre usa a IA quando `generateResponse: true`
- Suporta superfícies "portal" e "calendario"
- Foco em conversação, não em ações estruturadas

**Quando usar cada um?**
- Use `/chat` para o painel de assistente com navegação
- Use `/voice-message` para chat simples de perguntas e respostas

---

### 2. Como funciona o mapeamento de superfícies?

O sistema tem dois tipos de superfície:

**`VoiceSurface`** (no sistema de voz):
- `"portal"` - Área geral do portal
- `"calendario"` - Calendário de estudos

**`Surface`** (no sistema de chat):
- `"trilha"` - Trilha de aprendizado (aulas)
- `"calendario"` - Calendário de estudos

O endpoint `/voice-message` faz o mapeamento:
```typescript
"portal" → "trilha"  // Para compatibilidade com getSurfaceVisit
"calendario" → "calendario"  // Permanece o mesmo
```

---

### 3. Posso usar o sistema sem voz?

**Sim!** O sistema é totalmente funcional apenas com texto.

Use o componente `TextChatExample` que funciona apenas com teclado:
```tsx
import { TextChatExample } from "@/components/vitru/TextChatExample";

<TextChatExample surface="portal" objectId="teste" />
```

---

### 4. Como implementar Text-to-Speech (TTS)?

Há duas opções:

#### Opção 1: Web Speech API (Grátis, no navegador)

```typescript
function speakText(text: string) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "pt-BR";
  utterance.rate = 1.0;
  window.speechSynthesis.speak(utterance);
}

// Após receber a resposta
const data = await response.json();
speakText(data.reply);
```

**Prós**: Grátis, funciona offline
**Contras**: Voz robótica, suporte limitado em alguns navegadores

#### Opção 2: AWS Polly (Pago, mais natural)

```typescript
import { PollyClient, SynthesizeSpeechCommand } from "@aws-sdk/client-polly";

async function textToSpeech(text: string): Promise<Blob> {
  const client = new PollyClient({ region: "us-east-1" });

  const command = new SynthesizeSpeechCommand({
    Text: text,
    OutputFormat: "mp3",
    VoiceId: "Camila", // Voz feminina BR
    Engine: "neural"
  });

  const response = await client.send(command);
  // Converter stream para Blob e reproduzir
  return audioBlobFromStream(response.AudioStream);
}
```

**Prós**: Voz natural, múltiplas vozes
**Contras**: Custo por caractere, requer credenciais AWS

---

### 5. Como implementar Speech-to-Text (STT)?

#### Opção 1: Web Speech API (Grátis, no navegador)

Já implementado no `VoiceToTextChatExample.tsx`:

```typescript
const SpeechRecognition =
  window.SpeechRecognition ||
  window.webkitSpeechRecognition;

const recognition = new SpeechRecognition();
recognition.lang = "pt-BR";
recognition.continuous = false;
recognition.interimResults = true;

recognition.onresult = (event) => {
  const transcript = Array.from(event.results)
    .map(result => result[0].transcript)
    .join("");
  console.log(transcript);
};

recognition.start();
```

**Prós**: Grátis, funciona em tempo real
**Contras**: Requer Chrome/Edge, qualidade varia

#### Opção 2: Serviços pagos (AWS Transcribe, Google Speech-to-Text)

Envie áudio para o backend e processe lá:

```typescript
// Frontend
const audioBlob = await recorder.stop();
const formData = new FormData();
formData.append("audio", audioBlob);

const response = await fetch("/api/transcribe", {
  method: "POST",
  body: formData,
});

const { transcript } = await response.json();
```

---

### 6. Quanto custa usar o AWS Bedrock?

**Amazon Nova Micro** (modelo padrão):
- ~$0.035 por 1M tokens de entrada
- ~$0.140 por 1M tokens de saída

**Exemplo de custo**:
- Uma conversa típica: 500 tokens entrada + 200 tokens saída
- Custo: $0.0000175 + $0.000028 = **$0.0000455** (~R$ 0.0002)
- **1000 conversas = ~R$ 0.20**

É muito barato para uso moderado!

---

### 7. Como adicionar rate limiting?

Para evitar abuso, adicione rate limiting no endpoint:

```typescript
// src/app/api/v1/vitru/voice-message/route.ts
import { ratelimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const userId = await resolveActiveUserId(undefined);

  // Limitar a 20 requisições por minuto por usuário
  const { success } = await ratelimit.limit(`voice-message:${userId}`);

  if (!success) {
    return Response.json(
      { ok: false, error: { code: "RATE_LIMIT", message: "Muitas requisições. Tente novamente em alguns segundos." } },
      { status: 429 }
    );
  }

  // ... resto do código
}
```

Implemente `ratelimit` com Upstash Redis ou similar.

---

### 8. Como fazer streaming de respostas?

Para melhorar a UX, implemente streaming:

```typescript
// Backend (route.ts)
export async function POST(request: Request) {
  // ... validações ...

  const stream = new ReadableStream({
    async start(controller) {
      const generated = await generate({
        system: systemPrompt,
        userMessage: messageText,
        history,
        maxTokens: 1_200,
        stream: true, // ← Ativar streaming
      });

      for await (const chunk of generated) {
        controller.enqueue(new TextEncoder().encode(chunk));
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
```

```typescript
// Frontend
const response = await fetch("/api/v1/vitru/voice-message", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ ... }),
});

const reader = response.body?.getReader();
const decoder = new TextDecoder();

let accumulatedText = "";

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value);
  accumulatedText += chunk;

  // Atualizar UI em tempo real
  setMessages(prev => [
    ...prev.slice(0, -1),
    { role: "assistant", text: accumulatedText, timestamp: new Date() }
  ]);
}
```

---

### 9. Como adicionar memória de longo prazo?

O sistema já usa:
- **Histórico recente**: Últimas 20 mensagens da conversa
- **Perfil do estudante**: Dados acadêmicos e preferências
- **Memórias ativas**: Informações importantes marcadas

Para adicionar mais memória, edite `voice-message/route.ts`:

```typescript
// Adicione mais contexto ao prompt
const memories = await listActiveMemories(userId);
const customContext = memories
  .filter(m => m.kind === "important")
  .map(m => m.content)
  .join("\n");

const systemPrompt = `
${buildPortalSystemPrompt(context, profile, disclosure)}

CONTEXTO ADICIONAL IMPORTANTE:
${customContext}
`;
```

---

### 10. Como debugar problemas?

#### Ver logs no servidor:

```bash
# Desenvolvimento
npm run dev

# Produção
pm2 logs
# ou
docker logs <container-id>
```

#### Adicionar logging detalhado:

```typescript
// No route.ts
console.log("[VOICE-MESSAGE] Request:", {
  userId,
  surface,
  objectId,
  textLength: messageText.length,
});

console.log("[VOICE-MESSAGE] Context loaded:", {
  hasProfile: !!profile,
  historyLength: history.length,
  contextKeys: Object.keys(context),
});

console.log("[VOICE-MESSAGE] Generated:", {
  replyLength: generated.text.length,
  inputTokens: generated.inputTokens,
  outputTokens: generated.outputTokens,
});
```

#### Testar com curl:

```bash
curl -X POST http://localhost:3000/api/v1/vitru/voice-message \
  -H "Content-Type: application/json" \
  -d '{
    "surface": "portal",
    "objectId": "test-123",
    "role": "user",
    "text": "Qual é minha próxima prova?",
    "generateResponse": true
  }'
```

---

### 11. O sistema funciona em produção?

**Sim!** Mas verifique:

1. ✅ Variáveis de ambiente configuradas:
   ```bash
   AWS_REGION=us-east-1
   BEDROCK_MODEL_ID=amazon.nova-micro-v1:0
   AWS_ACCESS_KEY_ID=...
   AWS_SECRET_ACCESS_KEY=...
   ```

2. ✅ Permissões IAM para Bedrock:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [{
       "Effect": "Allow",
       "Action": ["bedrock:InvokeModel"],
       "Resource": "arn:aws:bedrock:*:*:inference-profile/*"
     }]
   }
   ```

3. ✅ Timeout adequado (Bedrock pode levar 5-10 segundos):
   ```typescript
   // vercel.json
   {
     "functions": {
       "api/**/*.ts": {
         "maxDuration": 30
       }
     }
   }
   ```

---

### 12. Como migrar conversas antigas?

Se você tinha um sistema anterior:

```sql
-- Migrar conversas antigas para o novo formato
INSERT INTO vitru_conversations (conversation_id, user_id, surface, object_id, created_at)
SELECT
  old_conversation_id,
  user_id,
  'portal', -- ou mapear de outro campo
  object_id,
  created_at
FROM old_conversations;

-- Migrar mensagens
INSERT INTO vitru_messages (conversation_id, role, text, created_at)
SELECT
  conversation_id,
  CASE
    WHEN sender = 'user' THEN 'user'
    ELSE 'assistant'
  END,
  message_text,
  sent_at
FROM old_messages;
```

---

### 13. Posso usar outro modelo além do Nova?

**Sim!** Configure no `.env`:

```bash
# AWS Bedrock
BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0  # Claude
BEDROCK_MODEL_ID=amazon.nova-pro-v1:0                        # Nova Pro
BEDROCK_MODEL_ID=meta.llama3-70b-instruct-v1:0               # Llama 3

# Ou outro provider
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o
```

E ajuste `lib/vitru/generate.ts`:

```typescript
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generate(params) {
  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o",
    messages: [
      { role: "system", content: params.system },
      ...params.history,
      { role: "user", content: params.userMessage },
    ],
    max_tokens: params.maxTokens,
  });

  return {
    text: completion.choices[0].message.content,
    inputTokens: completion.usage?.prompt_tokens,
    outputTokens: completion.usage?.completion_tokens,
  };
}
```

---

### 14. Como lidar com múltiplos idiomas?

Adicione detecção de idioma:

```typescript
import { detect } from "langdetect"; // ou outra lib

const detectedLang = detect(messageText);

const systemPrompt = detectedLang === "en"
  ? buildEnglishSystemPrompt(context, profile, disclosure)
  : buildPortalSystemPrompt(context, profile, disclosure);
```

Ou force o idioma no prompt:
```typescript
const systemPrompt = `
${buildPortalSystemPrompt(context, profile, disclosure)}

IMPORTANTE: Responda SEMPRE em português do Brasil, independente do idioma da pergunta.
`;
```

---

### 15. Onde encontro mais ajuda?

- 📖 Documentação completa: `VOICE_TO_TEXT_MIGRATION.md`
- 💡 Exemplos de integração: `EXEMPLO_INTEGRACAO.md`
- 📋 Resumo das mudanças: `RESUMO_MUDANCAS.md`
- 🧑‍💻 Código fonte: `src/components/vitru/TextChatExample.tsx`
- 🎤 Exemplo com voz: `src/components/vitru/VoiceToTextChatExample.tsx`

---

## 🆘 Problemas Comuns

### Erro: "Cannot find module '@/lib/ai/embeddings'"

**Causa**: Arquivo está em local errado (pré-existente, não relacionado a esta feature)

**Solução**: Mova `src/lib/ai/embeddings.ts` para `/lib/ai/embeddings.ts`

---

### Erro: "AUTOMATION_UNAVAILABLE"

**Causa**: AWS Bedrock não está acessível

**Verificar**:
1. Credenciais AWS configuradas
2. Região correta
3. Modelo existe e está ativo
4. Permissões IAM

---

### Chat não aparece na tela

**Verificar**:
1. Componente é "use client"
2. Importação correta
3. Props `surface` e `objectId` estão corretas

---

### Voz não funciona

**Verificar**:
1. Navegador suportado (Chrome/Edge)
2. HTTPS habilitado (microfone requer HTTPS)
3. Permissão de microfone concedida
4. `window.SpeechRecognition` disponível

```typescript
if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
  alert("Seu navegador não suporta reconhecimento de voz");
}
```

---

## 📞 Contato

Para dúvidas específicas do projeto:
1. Abra uma issue no repositório
2. Consulte a documentação do AWS Bedrock
3. Revise os logs do servidor

**Happy coding! 🚀**
