process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
setTimeout(() => { console.log("TIMEOUT"); process.exit(1); }, 60000);

const URL = "https://orgfarm-1ff9c31ff1-dev-ed.develop.my.salesforce.com";
const CID = "3MVG91oqviqJKoEFKOIrN9jRTJbGjKgKAPznyH5u9TyrZczcirrsMf0D.V5X1m_odCCNJu6uvqUfS3BgZ2Hq6";
const SEC = "029580E977DB6CAE165B50A4CBF38E5BA8803459E96D940774E3A792BC455348";
const AID = "0Xxbm0000039gSvCAI";

async function run() {
  console.log("AUTH...");
  const r1 = await fetch(`${URL}/services/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=client_credentials&client_id=${CID}&client_secret=${SEC}`,
  });
  const d1 = await r1.json();
  if (!r1.ok) { console.log("AUTH_FAIL", JSON.stringify(d1)); process.exit(1); }
  console.log("AUTH_OK\n");
  const tk = d1.access_token;

  // Testar diferentes endpoints possíveis
  const endpoints = [
    `/services/data/v62.0/einstein/ai-agent/agents/${AID}/sessions`,
    `/services/data/v61.0/einstein/ai-agent/agents/${AID}/sessions`,
    `/services/data/v62.0/einstein/bots/${AID}/sessions`,
    `/services/data/v62.0/connect/bots/${AID}/sessions`,
    `/services/data/v62.0/einstein/copilot/agents/${AID}/sessions`,
  ];

  const body = JSON.stringify({
    externalSessionKey: "test-" + Date.now(),
    instanceConfig: { endpoint: URL },
    streamingCapabilities: { chunkTypes: ["Text"] },
    bypassUser: false,
  });

  for (const ep of endpoints) {
    console.log(`TEST: ${ep}`);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 10000);
    try {
      const r = await fetch(`${URL}${ep}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${tk}`, "Content-Type": "application/json" },
        body,
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      const txt = await r.text();
      console.log(`  STATUS: ${r.status} | BODY: ${txt.slice(0, 200)}\n`);
      if (r.ok) {
        console.log("=== SUCESSO! USE ESTE ENDPOINT ===");
        process.exit(0);
      }
    } catch (e) {
      clearTimeout(timer);
      console.log(`  TIMEOUT/ERR: ${e.message}\n`);
    }
  }

  // Tentar descobrir APIs disponíveis
  console.log("DISCOVER: /services/data/v62.0/einstein/");
  const r3 = await fetch(`${URL}/services/data/v62.0/einstein/`, {
    headers: { Authorization: `Bearer ${tk}` },
  });
  console.log(`  STATUS: ${r3.status} | BODY: ${(await r3.text()).slice(0, 300)}`);

  process.exit(0);
}
run().catch(e => { console.log("ERR:", e.message); process.exit(1); });
