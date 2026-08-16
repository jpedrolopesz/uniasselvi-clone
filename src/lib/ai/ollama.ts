import "server-only";

export const ollamaConfig = {
  baseUrl: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434",
  chatModel: process.env.OLLAMA_CHAT_MODEL ?? "llama3.2:latest",
  embeddingModel: process.env.OLLAMA_EMBEDDING_MODEL ?? "embeddinggemma",
  embeddingDimensions: Number(process.env.OLLAMA_EMBEDDING_DIMENSIONS ?? 768),
} as const;

export class OllamaError extends Error {
  constructor(message: string, readonly status?: number) { super(message); this.name="OllamaError"; }
}

export async function ollamaFetch<T>(path:string,body:unknown,timeoutMs=30_000):Promise<T>{
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{const response=await fetch(`${ollamaConfig.baseUrl}${path}`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body),signal:controller.signal,cache:"no-store"});if(!response.ok)throw new OllamaError(`Ollama respondeu ${response.status}`,response.status);return await response.json() as T;}catch(error){if((error as Error).name==="AbortError")throw new OllamaError(`Ollama nao respondeu em ${timeoutMs}ms`);throw error;}finally{clearTimeout(timer);}
}

export async function checkOllamaHealth(){try{const response=await fetch(`${ollamaConfig.baseUrl}/api/tags`,{signal:AbortSignal.timeout(3_000),cache:"no-store"});if(!response.ok)return{status:"unhealthy" as const,error:`HTTP ${response.status}`};const {models}=await response.json() as {models:{name:string}[]};const names=models.map(m=>m.name);const has=(wanted:string)=>names.some(name=>name===wanted||name.startsWith(`${wanted}:`));return{status:"healthy" as const,chatModel:ollamaConfig.chatModel,chatModelAvailable:has(ollamaConfig.chatModel),embeddingModel:ollamaConfig.embeddingModel,embeddingModelAvailable:has(ollamaConfig.embeddingModel)};}catch(error){return{status:"unhealthy" as const,error:(error as Error).message};}}
