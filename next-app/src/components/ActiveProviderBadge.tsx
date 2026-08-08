"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Zap, AlertTriangle, ChevronDown } from "lucide-react";
import { useProviderContext } from "@/context/ProviderContext";
import { ModuleAISettings } from "./shared/module-ai-settings";

export function ActiveProviderBadge({ 
  featureKey = "global", 
  moduleName = "Global Default",
  subFeatures 
}: { 
  featureKey?: string; 
  moduleName?: string;
  subFeatures?: { key: string; label: string }[];
}) {
  const { providers } = useProviderContext();
  const [activeRoute, setActiveRoute] = useState<{providerName: string, model: string} | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchRoute = async () => {
      try {
        const res = await fetch(`/api/providers/active-route?featureKey=${featureKey}`);
        const data = await res.json();
        if (data.success) {
          setActiveRoute({ providerName: data.providerName, model: data.model });
          setError(false);
        } else {
          setActiveRoute(null);
          setError(true);
        }
      } catch (err) {
        setActiveRoute(null);
        setError(true);
      }
    };
    fetchRoute();
  }, [providers]);

  if (error) {
    return (
      <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 flex items-center gap-1 h-6">
        <AlertTriangle className="w-3 h-3" />
        No Active AI Provider
      </Badge>
    );
  }

  if (!activeRoute) return null;

  return (
    <ModuleAISettings featureKey={featureKey} moduleName={moduleName} subFeatures={subFeatures}>
      <Badge variant="outline" className="cursor-pointer hover:bg-emerald-100 bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1.5 h-6 px-2.5 shadow-sm whitespace-nowrap transition-colors">
        <Zap className="w-3 h-3 fill-emerald-500 text-emerald-500" />
        <span className="font-bold">{activeRoute.providerName}</span>
        <span className="text-emerald-600/50">|</span>
        <span className="font-medium text-emerald-600 truncate max-w-[150px]" title={activeRoute.model}>{activeRoute.model}</span>
        <ChevronDown className="w-3 h-3 text-emerald-600/60 ml-1" />
      </Badge>
    </ModuleAISettings>
  );
}
