/**
 * Cliente Salesforce — OAuth 2.0 + REST API.
 */

interface SObjectRecord { Id?: string; [key: string]: unknown }

let cachedToken: { accessToken: string; expiresAt: number } | null = null;

export async function authenticate(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) return cachedToken.accessToken;

  const instanceUrl = process.env.SALESFORCE_INSTANCE_URL!;
  const params = new URLSearchParams({
    grant_type: "password",
    client_id: process.env.SALESFORCE_CLIENT_ID!,
    client_secret: process.env.SALESFORCE_CLIENT_SECRET!,
    username: process.env.SALESFORCE_USERNAME!,
    password: process.env.SALESFORCE_PASSWORD ?? "",
  });

  const res = await fetch(`${instanceUrl}/services/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!res.ok) throw new Error(`SF auth failed: ${res.status} — ${await res.text()}`);
  const data = await res.json();
  cachedToken = { accessToken: data.access_token, expiresAt: Date.now() + 110 * 60 * 1000 };
  return data.access_token;
}

export async function query<T extends SObjectRecord>(soql: string): Promise<T[]> {
  const token = await authenticate();
  const res = await fetch(`${process.env.SALESFORCE_INSTANCE_URL}/services/data/v60.0/query?q=${encodeURIComponent(soql)}`, {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`SF query failed: ${res.status}`);
  return (await res.json()).records ?? [];
}

export async function upsert(objectName: string, externalIdField: string, externalIdValue: string, record: SObjectRecord): Promise<{ id: string; created: boolean }> {
  const token = await authenticate();
  const res = await fetch(`${process.env.SALESFORCE_INSTANCE_URL}/services/data/v60.0/sobjects/${objectName}/${externalIdField}/${externalIdValue}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(record),
  });
  if (!res.ok) throw new Error(`SF upsert failed: ${res.status} — ${await res.text()}`);
  const created = res.status === 201;
  const id = created ? (await res.json()).id : externalIdValue;
  return { id, created };
}

export async function create(objectName: string, record: SObjectRecord): Promise<string> {
  const token = await authenticate();
  const res = await fetch(`${process.env.SALESFORCE_INSTANCE_URL}/services/data/v60.0/sobjects/${objectName}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(record),
  });
  if (!res.ok) throw new Error(`SF create failed: ${res.status} — ${await res.text()}`);
  return (await res.json()).id;
}
