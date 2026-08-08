"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { ResearchSession } from "@/lib/repositories/storage";
import { getSessionsAction, createSessionAction, updateSessionAction, deleteSessionAction } from "@/app/actions/sessions";

interface SessionContextType {
  activeSession: ResearchSession | null;
  setActiveSession: (session: ResearchSession | null) => void;
  sessions: ResearchSession[];
  refreshSessions: () => Promise<void>;
  createSession: (name: string) => Promise<ResearchSession>;
  renameSession: (id: string, newName: string) => Promise<void>;
  duplicateSession: (id: string) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  updateSessionState: (updates: Record<string, any>) => Promise<void>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [activeSession, setActiveSession] = useState<ResearchSession | null>(null);
  const [sessions, setSessions] = useState<ResearchSession[]>([]);

  const refreshSessions = async () => {
    try {
      const data = await getSessionsAction();
      setSessions(data);
      if (activeSession) {
        const updatedActive = data.find(s => s.id === activeSession.id);
        if (updatedActive) setActiveSession(updatedActive);
      } else if (data.length > 0) {
        setActiveSession(data[0]);
      }
    } catch (e) {
      console.error("Failed to load sessions", e);
    }
  };

  const createSession = async (name: string) => {
    const newSession = await createSessionAction(name);
    await refreshSessions();
    setActiveSession(newSession);
    return newSession;
  };

  const renameSession = async (id: string, newName: string) => {
    await updateSessionAction(id, { name: newName });
    await refreshSessions();
  };

  const duplicateSession = async (id: string) => {
    const sessionToCopy = sessions.find(s => s.id === id);
    if (!sessionToCopy) return;
    
    const newSession = await createSessionAction(`${sessionToCopy.name} (Copy)`);
    await updateSessionAction(newSession.id, {
      filters: sessionToCopy.filters,
      notes: sessionToCopy.notes
    });
    await refreshSessions();
  };

  const deleteSession = async (id: string) => {
    await deleteSessionAction(id);
    if (activeSession?.id === id) {
      setActiveSession(null);
    }
    await refreshSessions();
  };

  const updateSessionState = async (updates: Record<string, any>) => {
    if (!activeSession) return;
    
    // We store wizard state in the filters object for flexibility
    const newFilters = { ...activeSession.filters, ...updates };
    
    // Optimistic update
    const updated = { ...activeSession, filters: newFilters };
    setActiveSession(updated);
    setSessions(prev => prev.map(s => s.id === activeSession.id ? updated : s));
    
    await updateSessionAction(activeSession.id, { filters: newFilters });
  };

  useEffect(() => {
    refreshSessions();
  }, []);

  return (
    <SessionContext.Provider 
      value={{ 
        activeSession, 
        setActiveSession, 
        sessions, 
        refreshSessions, 
        createSession,
        renameSession,
        duplicateSession,
        deleteSession,
        updateSessionState
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}
