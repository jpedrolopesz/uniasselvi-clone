import "server-only";
import { queryOne } from "./client";

export function startAgentRun(userId:string|null,transcript:string,intent:string){return queryOne<{id:string}>(`INSERT INTO telemetry.agent_runs(user_id,transcript,intent) VALUES($1,$2,$3) RETURNING id`,[userId,transcript,intent]);}
