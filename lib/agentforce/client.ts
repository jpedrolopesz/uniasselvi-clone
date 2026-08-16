/**
 * Client para Salesforce Agentforce (Einstein AI Agent API v61.0).
 *
 * Endpoints:
 * - Auth: POST {instanceUrl}/services/oauth2/token
 * - Sessão: POST {instanceUrl}/services/data/v61.0/einstein/ai-agent/agents/{agentId}/sessions
 * - Mensagem: POST {instanceUrl}/services/data/v61.0/einstein/ai-agent/sessions/{sessionId}/messages
 */

// Desabilita verificação SSL em dev (antivírus/proxy interceptando HTTPS)
if (process.env.NODE_ENV !== "production") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

// --- Tipos ---

export interface AgentSession {
  sessionId: string;
  greeting: string;
}

export interface AgentMessage {
  type?: string;
  id?: string;
  message: string;
  isContentSafe?: boolean;
}

export interface AgentResponse {
  messages: AgentMessage[];
}

// --- Config ---

function getConfig() {
  const instanceUrl = process.env.SALESFORCE_INSTANCE_URL;
  const consumerKey = process.env.AGENTFORCE_CONSUMER_KEY ?? process.env.SALESFORCE_CLIENT_ID;
  const consumerSecret = process.env.AGENTFORCE_CONSUMER_SECRET ?? process.env.SALESFORCE_CLIENT_SECRET;
  const agentId = process.env.AGENTFORCE_AGENT_ID;

  if (!instanceUrl || !consumerKey || !consumerSecret) {
    throw new Error(
      "Agentforce não configurado. Defina: SALESFORCE_INSTANCE_URL, " +
      "AGENTFORCE_CONSUMER_KEY, AGENTFORCE_CONSUMER_SECRET no .env.local"
    );
  }

  if (!agentId) {
    throw new Error(
      "AGENTFORCE_AGENT_ID não configurado. Coloque o ID do agente no .env.local"
    );
  }

  return { instanceUrl, consumerKey, consumerSecret, agentId };
}

// --- OAuth Token ---

let cachedToken: { token: string; expiresAt: number } | null = null;

/**
 * POST {instanceUrl}/services/oauth2/token
 * grant_type=client_credentials
 */
export async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const config = getConfig();

  const params = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: config.consumerKey,
    client_secret: config.consumerSecret,
  });

  const res = await fetch(`${config.instanceUrl}/services/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Agentforce OAuth failed (${res.status}): ${err}`);
  }

  const data = await res.json();

  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + 110 * 60 * 1000,
  };

  return data.access_token;
}

// --- Session ---

/**
 * POST {instanceUrl}/services/data/v61.0/einstein/ai-agent/agents/{agentId}/sessions
 *
 * Body:
 * {
 *   "externalSessionKey": "session-xxx",
 *   "instanceConfig": { "endpoint": "{instanceUrl}" }
 * }
 */
export async function createSession(externalSessionKey?: string): Promise<AgentSession> {
  const config = getConfig();
  const token = await getAccessToken();

  const sessionKey = externalSessionKey ?? `session-${Date.now()}`;

  const res = await fetch(
    `${config.instanceUrl}/services/data/v61.0/einstein/ai-agent/agents/${config.agentId}/sessions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        externalSessionKey: sessionKey,
        instanceConfig: {
          endpoint: config.instanceUrl,
        },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Agentforce createSession failed (${res.status}): ${err}`);
  }

  const data = await res.json();

  return {
    sessionId: data.sessionId ?? data.id,
    greeting: data.messages?.[0]?.message ?? "Olá! Como posso te ajudar?",
  };
}

// --- Messages ---

/**
 * POST {instanceUrl}/services/data/v61.0/einstein/ai-agent/sessions/{sessionId}/messages
 *
 * Body:
 * {
 *   "message": { "role": "user", "content": "texto" },
 *   "variables": []
 * }
 */
export async function sendMessage(
  sessionId: string,
  message: string
): Promise<AgentResponse> {
  const config = getConfig();
  const token = await getAccessToken();

  const res = await fetch(
    `${config.instanceUrl}/services/data/v61.0/einstein/ai-agent/sessions/${sessionId}/messages`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        message: {
          role: "user",
          content: message,
        },
        variables: [],
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Agentforce sendMessage failed (${res.status}): ${err}`);
  }

  const data = await res.json();

  // Normaliza resposta para formato consistente
  let messages: AgentMessage[] = [];

  if (Array.isArray(data.messages)) {
    messages = data.messages.map((m: Record<string, unknown>) => ({
      type: m.type ?? "text",
      id: m.id ?? `msg-${Date.now()}`,
      message: m.message ?? m.content ?? m.text ?? "",
      isContentSafe: m.isContentSafe ?? true,
    }));
  } else if (data.message) {
    messages = [{
      type: "text",
      id: `msg-${Date.now()}`,
      message: typeof data.message === "string" ? data.message : data.message.content ?? "",
      isContentSafe: true,
    }];
  } else if (data.content) {
    messages = [{ type: "text", id: `msg-${Date.now()}`, message: data.content, isContentSafe: true }];
  }

  return { messages };
}

/**
 * DELETE {instanceUrl}/services/data/v61.0/einstein/ai-agent/sessions/{sessionId}
 */
export async function endSession(sessionId: string): Promise<void> {
  const config = getConfig();
  const token = await getAccessToken();

  await fetch(
    `${config.instanceUrl}/services/data/v61.0/einstein/ai-agent/sessions/${sessionId}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }
  );
}
