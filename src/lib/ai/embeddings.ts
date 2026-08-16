import "server-only";
import { OllamaError,ollamaConfig,ollamaFetch } from "./ollama";
interface EmbedResponse{embeddings:number[][]}
export async function embed(input:string|string[]){const inputs=Array.isArray(input)?input:[input];if(inputs.length===0)return[];if(inputs.some(text=>text.trim().length===0))throw new OllamaError("Texto vazio nao pode ser vetorizado.");const data=await ollamaFetch<EmbedResponse>("/api/embed",{model:ollamaConfig.embeddingModel,input:inputs});for(const vector of data.embeddings){if(vector.length!==ollamaConfig.embeddingDimensions)throw new OllamaError(`Dimensao inesperada: ${vector.length}, esperado ${ollamaConfig.embeddingDimensions}.`);}return data.embeddings;}
export async function embedOne(text:string){const [vector]=await embed(text);return vector;}
export function toVectorLiteral(vector:number[]){return `[${vector.join(",")}]`;}
