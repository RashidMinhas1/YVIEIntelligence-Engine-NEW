"use client";

import { useState, useMemo, useEffect } from "react";
import { DashboardModuleId, getRegisteredModules } from "./dashboard/registry";
import { SessionProvider, useSession } from "./dashboard/session-context";
import { SelectionProvider } from "./dashboard/selection-context";
import { JobProvider } from "./dashboard/job-context";
import { workspaceEvents } from "./dashboard/events";
import { Button } from "@/components/ui/button";
import { Plus, Trash, Copy, Edit2, Check, X } from "lucide-react";

function DashboardLayout() {
  const [activeModuleId, setActiveModuleId] = useState<DashboardModuleId>("overview");
  const { 
    activeSession, setActiveSession, sessions, 
    createSession, deleteSession, duplicateSession, renameSession 
  } = useSession();
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  useEffect(() => {
    return workspaceEvents.subscribe("navigate", (moduleId: string) => {
      setActiveModuleId(moduleId as DashboardModuleId);
    });
  }, []);

  const registeredModules = useMemo(() => getRegisteredModules(), []);
  const ActiveModule = registeredModules.find((m) => m.id === activeModuleId)?.component;

  const handleCreateSession = async () => {
    const name = `Research Session ${sessions.length + 1}`;
    await createSession(name);
  };

  const startEditing = (id: string, name: string) => {
    setEditingSessionId(id);
    setEditingName(name);
  };

  const saveEditing = async () => {
    if (editingSessionId && editingName.trim()) {
      await renameSession(editingSessionId, editingName);
    }
    setEditingSessionId(null);
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] border-t border-border mt-16">
      {/* Sidebar Plugin Navigation */}
      <aside className="w-64 flex-shrink-0 border-r border-border bg-card/30 p-4 space-y-2 hidden md:flex flex-col">

        <nav className="space-y-2 flex-1 pt-4">
          {registeredModules.map((module) => {
            const Icon = module.icon;
            const isActive = activeModuleId === module.id;
            return (
              <div key={module.id} className="space-y-1">
                <button
                  onClick={() => setActiveModuleId(module.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {module.title}
                </button>
                {module.id === "discovery" && (
                  <div className="ml-6 mt-1 mb-3 space-y-1 border-l-2 border-border/50 pl-3 relative">
                    <div className="flex items-center justify-between mb-2 mt-2">
                      <h3 className="text-[10px] font-mono uppercase text-muted-foreground font-bold tracking-widest">
                        Research Sessions
                      </h3>
                      <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-primary/10 hover:text-primary transition-colors" onClick={handleCreateSession} title="New Session">
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <div className="space-y-1 max-h-[250px] overflow-y-auto pr-1">
                      {sessions.length === 0 && (
                        <div className="text-xs text-muted-foreground italic px-2 py-1">No sessions</div>
                      )}
                      {sessions.map(session => (
                        <div 
                          key={session.id} 
                          className={`flex items-center justify-between p-1.5 rounded text-xs border group cursor-pointer transition-colors ${
                            activeSession?.id === session.id 
                              ? "bg-primary/10 border-primary/30 text-primary font-medium shadow-sm" 
                              : "bg-transparent border-transparent hover:bg-secondary/50 hover:border-border text-muted-foreground"
                          }`}
                          onClick={() => {
                            setActiveSession(session);
                            if (activeModuleId !== "discovery") {
                              setActiveModuleId("discovery");
                            }
                          }}
                        >
                          {editingSessionId === session.id ? (
                            <div className="flex items-center w-full gap-1" onClick={e => e.stopPropagation()}>
                              <input 
                                value={editingName} 
                                onChange={e => setEditingName(e.target.value)} 
                                className="w-full bg-background text-foreground text-[10px] px-1 py-0.5 rounded outline-none border border-primary h-5"
                                autoFocus
                                onKeyDown={e => {
                                  if (e.key === 'Enter') saveEditing();
                                  if (e.key === 'Escape') setEditingSessionId(null);
                                }}
                              />
                              <Button variant="ghost" size="icon" className="h-4 w-4 shrink-0" onClick={saveEditing}>
                                <Check className="h-3 w-3 text-green-500" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <span className="truncate flex-1">{session.name}</span>
                              <div className="hidden group-hover:flex items-center gap-0 shrink-0 bg-background/80 rounded backdrop-blur-sm">
                                <Button variant="ghost" size="icon" className="h-4 w-4" onClick={(e) => { e.stopPropagation(); startEditing(session.id, session.name); }}>
                                  <Edit2 className="h-2.5 w-2.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-4 w-4 hover:text-red-500" onClick={(e) => { e.stopPropagation(); deleteSession(session.id); }}>
                                  <Trash className="h-2.5 w-2.5" />
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Dynamic Module Content Area */}
      <main className="flex-1 p-6 overflow-auto">
        {ActiveModule ? <ActiveModule /> : <div className="text-muted-foreground">Module not found</div>}
      </main>
    </div>
  );
}

export default function DashboardShell() {
  return (
    <SessionProvider>
      <SelectionProvider>
        <JobProvider>
          <DashboardLayout />
        </JobProvider>
      </SelectionProvider>
    </SessionProvider>
  );
}
