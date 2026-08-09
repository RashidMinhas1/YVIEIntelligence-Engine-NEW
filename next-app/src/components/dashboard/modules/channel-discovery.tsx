"use client";

import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft } from "lucide-react";
import Stage2SimilarChannels from "@/components/discovery-v2/stages/Stage2SimilarChannels";
import Stage3OutlierVideos from "@/components/discovery-v2/stages/Stage3OutlierVideos";
import { useSession } from "../session-context";
import Stage1ChannelDiscovery from "@/components/discovery-v2/stages/Stage1ChannelDiscovery";
import { DiscoveryProvider } from "@/components/discovery-v2/engine/DiscoveryProvider";
import Stage4ConceptMatch from "@/components/discovery-v2/stages/Stage4ConceptMatch";
import Stage6ReverseEngineering from "@/components/discovery-v2/stages/Stage6ReverseEngineering";
import Stage7Export from "@/components/discovery-v2/stages/Stage7Export";
import Stage8ScriptGeneration from "@/components/discovery-v2/stages/Stage8ScriptGeneration";
import Stage5IntelligenceWorkspace from "@/components/discovery-v2/stages/Stage5IntelligenceWorkspace";

export default function ChannelDiscoveryWizard() {
  const { activeSession, updateSessionState } = useSession();
  const currentStep = activeSession?.filters?.wizardStep || 1;

  const setStep = (step: number) => {
    updateSessionState({ wizardStep: step });
  };

  const steps = [
    { id: 1, name: "Channel Discovery" },
    { id: 2, name: "Similar Channels" },
    { id: 3, name: "Outlier Videos" },
    { id: 4, name: "AI Concept Match" },
    { id: 5, name: "Intelligence Workspace" },
    { id: 6, name: "Reverse Engineering" },
    { id: 7, name: "Script Generation" },
    { id: 8, name: "Export" },
  ];

  return (
    <DiscoveryProvider>
      <div className="flex flex-col h-full space-y-4">
        {/* Stepper Header */}
        <div className="flex items-center justify-between border-b border-border pb-4 overflow-x-auto">
          <div className="flex gap-1 items-center min-w-max">
            {steps.map((s, idx) => (
              <div key={s.id} className="flex items-center">
                <Button 
                  variant={currentStep === s.id ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setStep(s.id)}
                  className={`rounded-full px-3 py-1 h-8 ${currentStep === s.id ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' : 'text-muted-foreground hover:bg-secondary'}`}
                >
                  {s.id}. {s.name}
                </Button>
                {idx < steps.length - 1 && <ChevronRight className="w-4 h-4 text-muted-foreground/50 mx-1 flex-shrink-0" />}
              </div>
            ))}
          </div>
          <div className="flex gap-2 ml-4 flex-shrink-0">
            <Button variant="outline" size="sm" disabled={currentStep === 1} onClick={() => setStep(currentStep - 1)}>
              <ChevronLeft className="w-4 h-4 mr-1" /> Prev
            </Button>
            <Button variant="outline" size="sm" disabled={currentStep === 8} onClick={() => setStep(currentStep + 1)}>
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-auto bg-card/10 rounded-xl p-2 md:p-6 border border-border/50 shadow-inner">
          {currentStep === 1 && <Stage1ChannelDiscovery />}
          {currentStep === 2 && <Stage2SimilarChannels />}
          {currentStep === 3 && <Stage3OutlierVideos />}
          {currentStep === 4 && <Stage4ConceptMatch />}
          {currentStep === 5 && <Stage5IntelligenceWorkspace />}
          {currentStep === 6 && <Stage6ReverseEngineering />}
          {currentStep === 7 && <Stage8ScriptGeneration />}
          {currentStep === 8 && <Stage7Export />}
        </div>
      </div>
    </DiscoveryProvider>
  );
}
