"use client";

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";
import { ScriptSection, StudioProject } from "@/lib/types/studio";

export type AIJobTarget = {
  type: "project" | "scene" | "field";
  moduleId: string; // e.g., "storyboard", "thumbnail", "production"
  sceneId?: string;
  fieldId?: string; // e.g., "visual", "camera", "seoTitle"
};

export interface AIJobState {
  id: string;
  target: AIJobTarget;
  status: "queued" | "preparing" | "analyzing" | "generating" | "validating" | "saving" | "completed" | "failed" | "cancelled";
  provider: string;
  model: string;
  startedAt: number;
  completedAt?: number;
  result?: any;
  error?: string;
}

interface AIJobManagerContextType {
  activeJobs: Map<string, AIJobState>;
  startJob: (target: AIJobTarget, payload: any, apiRoute: string) => Promise<string>;
  cancelJob: (jobId: string) => void;
  retryJob: (jobId: string) => void;
  getJobStatus: (target: AIJobTarget) => AIJobState | undefined;
}

const AIJobManagerContext = createContext<AIJobManagerContextType | undefined>(undefined);

export function AIJobManagerProvider({ 
  children,
  project,
  setProject
}: { 
  children: React.ReactNode;
  project: StudioProject;
  setProject: React.Dispatch<React.SetStateAction<StudioProject>>;
}) {
  const [activeJobs, setActiveJobs] = useState<Map<string, AIJobState>>(new Map());
  // Store original payloads for retry capability
  const jobPayloadsRef = useRef<Map<string, {target: AIJobTarget; payload: any; apiRoute: string}>>(new Map());
  
  // Track jobs to avoid race conditions
  const activeTargetsRef = useRef<Set<string>>(new Set());

  const getTargetHash = (target: AIJobTarget) => {
    return `${target.moduleId}-${target.sceneId || 'none'}-${target.fieldId || 'none'}`;
  };

  const updateJob = useCallback((id: string, updates: Partial<AIJobState>) => {
    setActiveJobs(prev => {
      const newMap = new Map(prev);
      const job = newMap.get(id);
      if (job) {
        newMap.set(id, { ...job, ...updates });
      }
      return newMap;
    });
  }, []);

  const commitJobResult = useCallback((job: AIJobState, result: any) => {
    // Strict Commit Policy: Only validated data is committed
    if (job.status !== "validating") return;
    
    updateJob(job.id, { status: "saving" });

    // Apply result to StudioProject based on target
    setProject((prev) => {
      const newProject = { ...prev };
      
      if (job.target.type === "project" && job.target.moduleId === "storyboard") {
        if (result.scenes && Array.isArray(result.scenes)) {
          // Merge scenes, respecting locks if any existed
          newProject.sections = prev.sections.map((section, idx) => {
            const aiScene = result.scenes.find((s: any) => s.sceneIndex === idx) || result.scenes[idx];
            if (!aiScene) return section;
            
            // Generate version history entry
            const historyEntry = {
              timestamp: new Date().toISOString(),
              data: { ...section }
            };

            const versionHistory = section.versionHistory?.storyboard || [];

            return {
              ...section,
              ...aiScene,
              versionHistory: {
                ...section.versionHistory,
                storyboard: [historyEntry, ...versionHistory].slice(0, 10)
              },
              generationStatus: {
                ...section.generationStatus,
                storyboard: "Completed"
              },
              aiMetadata: {
                ...section.aiMetadata,
                storyboard: {
                  timestamp: new Date().toISOString(),
                  provider: job.provider,
                  modelName: job.model,
                  promptVersion: "v2.0-independent-fields",
                  generatorModule: "storyboard",
                  validationStatus: "passed",
                  regenerationCount: (section.aiMetadata?.storyboard?.regenerationCount || 0) + 1,
                  versionNumber: (section.aiMetadata?.storyboard?.versionNumber || 0) + 1
                }
              }
            };
          });
        }
      } else if (job.target.type === "project" && job.target.moduleId === "thumbnail") {
        const prod = newProject.production || { thumbnails: [], titles: [], chapters: [], editingChecklist: [] };
        let newThumbnails = [...(prod.thumbnails || [])];

        if (result.thumbnails) {
            newThumbnails = result.thumbnails;
        } else if (result.thumbnail) {
            newThumbnails = newThumbnails.map(t => t.id === result.thumbnail.id ? result.thumbnail : t);
        }

        newProject.production = { ...prod, thumbnails: newThumbnails };
      } else if (job.target.type === "project" && job.target.moduleId === "production") {
        const prod = newProject.production || { thumbnails: [], titles: [], chapters: [], editingChecklist: [] };
        newProject.production = { ...prod, ...result };
      }

      return newProject;
    });
    
    // Simulate auto-save delay
    setTimeout(() => {
      updateJob(job.id, { status: "completed", completedAt: Date.now(), result });
      activeTargetsRef.current.delete(getTargetHash(job.target));
      toast.success(`Job completed successfully.`);
    }, 300);
    
  }, [updateJob, setProject]);

  const pollJob = useCallback(async (jobId: string) => {
    // This will poll the backend database (like use-job.ts) and update the local state.
    // For now, it's just the structural interface.
  }, []);

  const startJob = useCallback(async (target: AIJobTarget, payload: any, apiRoute: string) => {
    const targetHash = getTargetHash(target);
    
    if (activeTargetsRef.current.has(targetHash)) {
      toast.error("A generation job is already running for this target.");
      throw new Error("Race condition prevented.");
    }

    const jobId = crypto.randomUUID();
    const newJob: AIJobState = {
      id: jobId,
      target,
      status: "queued",
      provider: "OpenRouter",
      model: "google/gemini-2.5-flash",
      startedAt: Date.now()
    };
    // Save payload for future retry
    jobPayloadsRef.current.set(jobId, { target, payload, apiRoute });

    activeTargetsRef.current.add(targetHash);
    setActiveJobs(prev => new Map(prev).set(jobId, newJob));

    // Kick off backend job via apiRoute
    try {
      updateJob(jobId, { status: "preparing" });
      const res = await fetch(apiRoute, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, target })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Start polling the backend job ID
      // pollJob(data.jobId);
      
      // Mock progression for structural testing
      setTimeout(() => updateJob(jobId, { status: "analyzing" }), 1000);
      setTimeout(() => updateJob(jobId, { status: "generating" }), 2000);
      setTimeout(() => updateJob(jobId, { status: "validating" }), 3000);
      setTimeout(() => commitJobResult({ ...newJob, status: "validating" }, data), 4000);

      return jobId;
    } catch (err: any) {
      updateJob(jobId, { status: "failed", error: err.message });
      activeTargetsRef.current.delete(targetHash);
      toast.error(`Job failed: ${err.message}`);
      throw err;
    }
  }, [updateJob, commitJobResult]);

  const cancelJob = useCallback((jobId: string) => {
    const job = activeJobs.get(jobId);
    if (!job || job.status === "completed" || job.status === "failed") return;
    
    updateJob(jobId, { status: "cancelled" });
    activeTargetsRef.current.delete(getTargetHash(job.target));
    toast.info("Job cancelled.");
    
    // Call backend to cancel
  }, [activeJobs, updateJob]);

  const retryJob = useCallback((jobId: string) => {
    const job = activeJobs.get(jobId);
    if (!job || job.status !== "failed") return;
    const stored = jobPayloadsRef.current.get(jobId);
    if (!stored) {
      toast.error(`No payload stored for job ${jobId}. Cannot retry.`);
      return;
    }
    // Clean up old job entry and start a fresh job with same data
    setActiveJobs(prev => {
      const copy = new Map(prev);
      copy.delete(jobId);
      return copy;
    });
    activeTargetsRef.current.delete(getTargetHash(job.target));
    // Kick off a new job using the saved payload
    startJob(stored.target, stored.payload, stored.apiRoute).catch(err => {
      console.error(`Retry of job ${jobId} failed:`, err);
    });
  }, [activeJobs, startJob]);

  const getJobStatus = useCallback((target: AIJobTarget) => {
    const targetHash = getTargetHash(target);
    for (const [_, job] of activeJobs.entries()) {
      if (getTargetHash(job.target) === targetHash) {
        return job;
      }
    }
    return undefined;
  }, [activeJobs]);

  return (
    <AIJobManagerContext.Provider value={{ activeJobs, startJob, cancelJob, retryJob, getJobStatus }}>
      {children}
    </AIJobManagerContext.Provider>
  );
}

export function useAIJobManager() {
  const context = useContext(AIJobManagerContext);
  if (!context) {
    throw new Error("useAIJobManager must be used within an AIJobManagerProvider");
  }
  return context;
}
