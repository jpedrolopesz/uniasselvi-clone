process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
setTimeout(() => { console.log("TIMEOUT GERAL"); process.exit(1); }, 60000);

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
  console.log("AUTH_OK");

  console.log("SESSION...");
  const r2 = await fetch(`${URL}/services/data/v62.0/einstein/ai-agent/agents/${AID}/sessions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${d1.access_token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ externalSessionKey: "x" + Date.now(), instanceConfig: { endpoint: URL } }),
  });
  console.log("SESSION_STATUS:" + r2.status);
  console.log("SESSION_BODY:" + await r2.text());
  process.exit(0);
}
run().catch(e => { console.log("CATCH:" + e.message); process.exit(1); });
