"use client";

import { useState, useEffect } from "react";
import { InfoPanel } from "../info-panel";
import { RefreshCw, ArrowDown, Settings2, PlayCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function RouterTab() {
  const [modules, setModules] = useState<any[]>([]);
  const [providers, setProviders] = useState<Record<string, any>>({});
  const [savedModels, setSavedModels] = useState<any>({});
  const [globalDefault, setGlobalDefault] = useState("openai");
  
  const [selectedFeature, setSelectedFeature] = useState<string>("title-analyzer");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [featRes, provRes, modRes] = await Promise.all([
          fetch("/api/settings/ai/features"),
          fetch("/api/settings/ai/providers"),
          fetch("/api/settings/ai/models")
        ]);
        const featData = await featRes.json();
        const provData = await provRes.json();
        const modData = await modRes.json();
        
        if (featData.success) {
          setModules(featData.modules);
          setGlobalDefault(featData.globalDefaultProvider || "openai");
        }
        if (provData.success) {
          setProviders(provData.providers || {});
        }
        if (modData.success) {
          setSavedModels(modData.models || {});
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Compute the route path dynamically
  let activeModule: any = null;
  let activeFeature: any = null;
  
  if (modules.length > 0) {
    for (const m of modules) {
      const f = m.features.find((feat: any) => feat.key === selectedFeature);
      if (f) {
        activeModule = m;
        activeFeature = f;
        break;
      }
    }
  }

  const featureOverride = activeFeature?.override;
  const moduleOverride = activeModule?.moduleOverride;
  
  let finalProviderId = globalDefault;
  let finalModel = "Provider Default (Auto)";
  let decisionSource = "Global Default API";

  if (featureOverride?.provider) {
    finalProviderId = featureOverride.provider;
    finalModel = featureOverride.model || "Provider Default (Auto)";
    decisionSource = "Feature Custom Route";
  } else if (moduleOverride?.provider) {
    finalProviderId = moduleOverride.provider;
    finalModel = moduleOverride.model || "Provider Default (Auto)";
    decisionSource = "Module Custom Route";
  }

  const finalProviderName = providers[finalProviderId]?.displayName || finalProviderId;

  const [savingGlobal, setSavingGlobal] = useState(false);
  const [localGlobalDefault, setLocalGlobalDefault] = useState("");
  const [localDefaultModel, setLocalDefaultModel] = useState("");
  
  useEffect(() => {
    setLocalGlobalDefault(globalDefault);
    setLocalDefaultModel(providers[globalDefault]?.defaultModel || "");
  }, [globalDefault, providers]);

  const handleSaveGlobal = async () => {
    setSavingGlobal(true);
    try {
      const res = await fetch("/api/settings/ai/global-route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerId: localGlobalDefault, defaultModel: localDefaultModel })
      });
      const data = await res.json();
      if (data.success) {
        setGlobalDefault(localGlobalDefault);
        setProviders(prev => ({
          ...prev,
          [localGlobalDefault]: {
            ...prev[localGlobalDefault],
            defaultModel: localDefaultModel
          }
        }));
      }
    } catch(e) {
      alert("Failed to save global defaults");
    } finally {
      setSavingGlobal(false);
    }
  };

  return (
    <div className="space-y-6">
      <InfoPanel 
        title="AI Router Simulator"
        purpose="Test how the system routes requests for different features."
        example="Select a feature below to trace its exact routing path based on your current settings."
        nextStep="Playground"
      />
      
      {isLoading ? (
        <div className="p-12 text-center text-muted-foreground flex items-center justify-center">
          <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Loading Router Configuration...
        </div>
      ) : (
        <>
          <div className="border rounded-xl p-6 bg-card shadow-sm mb-6 flex flex-col md:flex-row gap-6 md:items-end">
            <div className="flex-1 space-y-2">
              <Label>Global Default Provider</Label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
                value={localGlobalDefault}
                onChange={e => setLocalGlobalDefault(e.target.value)}
              >
                {Object.entries(providers).map(([pid, p]) => (
                  <option key={pid} value={pid}>{p.displayName || pid}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 space-y-2">
              <Label>Global Default Model (Optional)</Label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
                value={localDefaultModel}
                onChange={e => setLocalDefaultModel(e.target.value)}
              >
                <option value="">Provider Default (Auto)</option>
                {Object.entries(savedModels)
                  .filter(([_, m]: any) => m.provider === localGlobalDefault)
                  .map(([mid, m]: any) => (
                    <option key={mid} value={mid}>{m.name || mid}</option>
                  ))}
              </select>
            </div>
            <Button onClick={handleSaveGlobal} disabled={savingGlobal} className="md:w-32">
              {savingGlobal ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Save Global"}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="col-span-1 border rounded-xl p-6 bg-card shadow-sm space-y-6 h-fit">
            <div>
              <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
                <Settings2 className="w-5 h-5 text-blue-600" />
                Simulate Request
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Choose an app feature to simulate how the AI Router will direct the backend traffic.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label>Select App Feature</Label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
                value={selectedFeature}
                onChange={e => setSelectedFeature(e.target.value)}
              >
                {modules.map((m: any) => (
                  <optgroup key={m.moduleId} label={`${m.moduleName} Module`}>
                    {m.features.map((f: any) => (
                      <option key={f.key} value={f.key}>{f.name}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-100 mt-6">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">How it works:</h4>
              <ul className="text-xs text-blue-800 space-y-1 list-decimal pl-4">
                <li>Checks Feature-level override</li>
                <li>Checks Module-level override</li>
                <li>Falls back to Global Default API</li>
              </ul>
            </div>
          </div>

          <div className="col-span-2 border rounded-xl p-8 bg-muted/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
              <PlayCircle className="w-32 h-32" />
            </div>
            
            <h3 className="font-semibold text-lg mb-8 text-center">Live Routing Trace</h3>

            <div className="flex flex-col items-center space-y-2">
              {/* Node 1: Request Entry */}
              <div className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium shadow-md w-64 text-center">
                Incoming Request:<br/>
                <span className="text-sm opacity-90">{activeFeature?.name || selectedFeature}</span>
              </div>
              
              <ArrowDown className="w-5 h-5 text-muted-foreground/50" />

              {/* Node 2: Feature Override Check */}
              <div className={`px-6 py-3 rounded-lg border w-64 text-center ${featureOverride?.provider ? 'bg-green-50 border-green-200' : 'bg-card'}`}>
                <div className="text-xs text-muted-foreground font-mono mb-1">Feature Override Check</div>
                <div className={`font-medium ${featureOverride?.provider ? 'text-green-700' : ''}`}>
                  {featureOverride?.provider ? `Match found: ${providers[featureOverride.provider]?.displayName || featureOverride.provider}` : 'No override'}
                </div>
              </div>

              <ArrowDown className="w-5 h-5 text-muted-foreground/50" />

              {/* Node 3: Module Override Check */}
              <div className={`px-6 py-3 rounded-lg border w-64 text-center ${(moduleOverride?.provider && !featureOverride?.provider) ? 'bg-green-50 border-green-200' : 'bg-card'} ${featureOverride?.provider ? 'opacity-50' : ''}`}>
                <div className="text-xs text-muted-foreground font-mono mb-1">Module Override Check</div>
                <div className={`font-medium ${(moduleOverride?.provider && !featureOverride?.provider) ? 'text-green-700' : ''}`}>
                  {moduleOverride?.provider ? `Match found: ${providers[moduleOverride.provider]?.displayName || moduleOverride.provider}` : 'No override'}
                </div>
              </div>

              <ArrowDown className="w-5 h-5 text-muted-foreground/50" />

              {/* Node 4: Global Default */}
              <div className={`px-6 py-3 rounded-lg border w-64 text-center ${(!featureOverride?.provider && !moduleOverride?.provider) ? 'bg-green-50 border-green-200' : 'bg-card opacity-50'}`}>
                <div className="text-xs text-muted-foreground font-mono mb-1">Global Default Check</div>
                <div className="font-medium">
                  {providers[globalDefault]?.displayName || globalDefault}
                </div>
              </div>

              <div className="h-6 border-l-2 border-dashed border-primary"></div>

              {/* Final Node: Selection */}
              <div className="bg-green-600 text-white px-8 py-4 rounded-xl font-bold shadow-lg w-72 text-center ring-4 ring-green-600/20">
                <div className="text-xs text-green-100 uppercase tracking-wider mb-1">Final AI Model Selected</div>
                <div className="text-lg">{finalProviderName}</div>
                <div className="text-sm font-normal text-green-100 mt-1">{finalModel}</div>
                <div className="mt-3 pt-3 border-t border-green-500/50 text-xs text-green-100 font-medium">
                  Source: {decisionSource}
                </div>
              </div>
            </div>
          </div>

        </div>
        </>
      )}
    </div>
  );
}
