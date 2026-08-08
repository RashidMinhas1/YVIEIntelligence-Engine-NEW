"use server";

import { storage } from "@/lib/repositories/local-storage-repo";
import { ResearchSession } from "@/lib/repositories/storage";

export async function getSessionsAction(): Promise<ResearchSession[]> {
  return await storage.getSessions();
}

export async function createSessionAction(name: string): Promise<ResearchSession> {
  return await storage.createSession({ name, filters: {}, notes: "" });
}

export async function updateSessionAction(id: string, updates: Partial<ResearchSession>): Promise<ResearchSession> {
  return await storage.updateSession(id, updates);
}

export async function deleteSessionAction(id: string): Promise<void> {
  return await storage.deleteSession(id);
}
