import { Info, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InfoPanelProps {
  title: string;
  purpose: string;
  example: string;
  nextStep: string;
}

export function InfoPanel({ title, purpose, example, nextStep }: InfoPanelProps) {
  return (
    <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div className="flex gap-3 items-start">
        <Info className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="font-semibold text-blue-900">{title}</h3>
          <p className="text-sm text-blue-800 mt-1">
            <strong>Purpose:</strong> {purpose}
          </p>
          <p className="text-sm text-blue-800 mt-1">
            <strong>Example:</strong> {example}
          </p>
        </div>
      </div>
      <button 
        onClick={() => {
          const tabMap: Record<string, string> = {
            "Import Models": "models",
            "Workflow Profiles": "profiles",
            "Arena": "arena",
            "Projects": "projects",
            "Playground": "playground",
            "Router": "router",
            "Telemetry": "telemetry"
          };
          const target = tabMap[nextStep] || nextStep.toLowerCase();
          window.dispatchEvent(new CustomEvent("navigate-tab", { detail: target }));
        }}
        className="flex-shrink-0 flex items-center gap-2 bg-white hover:bg-blue-50 px-3 py-2 rounded-md border border-blue-100 shadow-sm transition-colors cursor-pointer"
      >
        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Next Step</span>
        <span className="text-sm font-semibold">{nextStep}</span>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </button>
    </div>
  );
}
