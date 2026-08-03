import { readUserJsonFile } from "@/lib/data/read-json-file";
import type { UserIndex, UserManifest } from "@/lib/types/raw/local";

export function loadUserIndex(): Promise<UserIndex> {
  return readUserJsonFile<UserIndex>("index.json");
}

export function loadUserManifest(userId: string): Promise<UserManifest> {
  return readUserJsonFile<UserManifest>(userId, "manifest.json");
}
