import "server-only";
import { transaction,query } from "./client";
import { embedOne, toVectorLiteral } from "../ai/embeddings";

export function listDocuments(subjectId:string){return query(`SELECT id,title,document_type,source_uri,indexed_at FROM rag.documents WHERE subject_id=$1 ORDER BY title`,[subjectId]);}
export async function searchRag(queryText:string,subjectId:string,limit=5){const vector=toVectorLiteral(await embedOne(queryText));return transaction(async client=>{await client.query("SET LOCAL hnsw.ef_search = 100");const result=await client.query(`SELECT c.content,d.title,d.source_uri,(1-(c.embedding <=> $1::vector))::float8 similarity FROM rag.chunks c JOIN rag.documents d ON d.id=c.document_id WHERE c.embedding IS NOT NULL AND c.metadata @> jsonb_build_object('subject_id',$2::text) ORDER BY c.embedding <=> $1::vector LIMIT $3`,[vector,subjectId,Math.max(1,Math.min(limit,20))]);return result.rows.filter(row=>row.similarity>=0.5);});}
