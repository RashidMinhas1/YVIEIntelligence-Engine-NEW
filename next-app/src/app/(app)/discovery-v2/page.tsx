"use client";

import React from "react";
import { useDiscovery } from "@/components/discovery-v2/engine/DiscoveryProvider";
import { AppLayout } from "@/components/app-layout";
import { DiscoveryV2Stage } from "@/lib/types/discovery-v2";
import { Search, Users, Activity, Target, Brain, FileText, Download } from "lucide-react";

import Stage1ChannelDiscovery from "@/components/discovery-v2/stages/Stage1ChannelDiscovery";
import Stage2SimilarChannels from "@/components/discovery-v2/stages/Stage2SimilarChannels";
import Stage3OutlierVideos from "@/components/discovery-v2/stages/Stage3OutlierVideos";
import Stage4ConceptMatch from "@/components/discovery-v2/stages/Stage4ConceptMatch";
import Stage5IntelligenceWorkspace from "@/components/discovery-v2/stages/Stage5IntelligenceWorkspace";
import Stage6ReverseEngineering from "@/components/discovery-v2/stages/Stage6ReverseEngineering";
import Stage7Export from "@/components/discovery-v2/stages/Stage7Export";

const STAGES: { num: DiscoveryV2Stage; label: string; icon: React.ElementType }[] = [
  { num: 1, label: "Channel Discovery", icon: Search },
  { num: 2, label: "Similar Channels", icon: Users },
  { num: 3, label: "Outlier Videos", icon: Activity },
  { num: 4, label: "Concept Match", icon: Target },
  { num: 5, label: "Workspace", icon: Brain },
  { num: 6, label: "Reverse Engineering", icon: FileText },
  { num: 7, label: "Export", icon: Download },
];

export default function DiscoveryV2Page() {
  const { state, goToStage } = useDiscovery();

  return (
    <AppLayout>
      <div className="flex flex-col h-full bg-background">
        {/* Wizard Header / Stepper */}
        <div className="border-b bg-card shadow-sm px-6 py-4 shrink-0">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl font-black mb-6 uppercase tracking-tight">Discovery V2 Research System</h1>
            
            <div className="flex items-center justify-between w-full relative">
              {/* Progress Line */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-muted rounded-full" />
              <div 
                className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary rounded-full transition-all duration-300"
                style={{ width: `${((state.currentStage - 1) / (STAGES.length - 1)) * 100}%` }}
              />

              {STAGES.map((s) => {
                const isActive = state.currentStage === s.num;
                const isPast = state.currentStage > s.num;
                const Icon = s.icon;
                return (
                  <button
                    key={s.num}
                    onClick={() => goToStage(s.num)}
                    disabled={s.num > state.currentStage && !isPast} // Only allow clicking past or current
                    className={`relative z-10 flex flex-col items-center gap-2 ${
                      isActive ? "text-primary" : isPast ? "text-primary/70 cursor-pointer" : "text-muted-foreground opacity-50 cursor-not-allowed"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 bg-background transition-colors ${
                      isActive ? "border-primary text-primary" : isPast ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30"
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider hidden md:block">
                      {s.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Wizard Body */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-muted/10">
          <div className="max-w-7xl mx-auto">
            {state.currentStage === 1 && <Stage1ChannelDiscovery />}
            {state.currentStage === 2 && <Stage2SimilarChannels />}
            {state.currentStage === 3 && <Stage3OutlierVideos />}
            {state.currentStage === 4 && <Stage4ConceptMatch />}
            {state.currentStage === 5 && <Stage5IntelligenceWorkspace />}
            {state.currentStage === 6 && <Stage6ReverseEngineering />}
            {state.currentStage === 7 && <Stage7Export />}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
