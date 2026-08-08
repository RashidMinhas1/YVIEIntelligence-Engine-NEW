"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { DiscoveryV2State, INITIAL_STATE, DiscoveryV2Stage } from "@/lib/types/discovery-v2";

interface DiscoveryContextType {
  state: DiscoveryV2State;
  updateState: (updates: Partial<DiscoveryV2State>) => void;
  nextStage: () => void;
  prevStage: () => void;
  goToStage: (stage: DiscoveryV2Stage) => void;
  resetProject: () => void;
  saveToCache: () => void;
}

const DiscoveryContext = createContext<DiscoveryContextType | undefined>(undefined);

export const DiscoveryProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<DiscoveryV2State>(INITIAL_STATE);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from local storage on mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem("discovery_v2_project");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.version === INITIAL_STATE.version) {
          setState(parsed);
        }
      }
    } catch (e) {
      console.warn("Failed to load discovery project cache", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Auto-save whenever state changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("discovery_v2_project", JSON.stringify(state));
    }
  }, [state, isLoaded]);

  const updateState = (updates: Partial<DiscoveryV2State>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  const nextStage = () => {
    setState((prev) => ({
      ...prev,
      currentStage: Math.min(prev.currentStage + 1, 7) as DiscoveryV2Stage,
    }));
  };

  const prevStage = () => {
    setState((prev) => ({
      ...prev,
      currentStage: Math.max(prev.currentStage - 1, 1) as DiscoveryV2Stage,
    }));
  };

  const goToStage = (stage: DiscoveryV2Stage) => {
    setState((prev) => ({ ...prev, currentStage: stage }));
  };

  const resetProject = () => {
    setState(INITIAL_STATE);
    localStorage.removeItem("discovery_v2_project");
  };

  const saveToCache = () => {
    localStorage.setItem("discovery_v2_project", JSON.stringify(state));
  };

  if (!isLoaded) return null; // or a loading spinner

  return (
    <DiscoveryContext.Provider value={{ state, updateState, nextStage, prevStage, goToStage, resetProject, saveToCache }}>
      {children}
    </DiscoveryContext.Provider>
  );
};

export const useDiscovery = () => {
  const context = useContext(DiscoveryContext);
  if (context === undefined) {
    throw new Error("useDiscovery must be used within a DiscoveryProvider");
  }
  return context;
};
