"use client";

import { useState, useEffect } from "react";
import { InfoPanel } from "../info-panel";
import { Button } from "@/components/ui/button";
import { Save, RefreshCw, SplitSquareVertical, AlertCircle, CheckCircle2, ChevronRight, Layers } from "lucide-react";
import { Label } from "@/components/ui/label";

export function ProjectsTab() {
  const [modules, setModules] = useState<any[]>([]);
  const [providers, setProviders] = useState<Record<string, any>>({});
  const [savedModels, setSavedModels] = useState<Record<string, any>>({});
  
  const [isLoading, setIsLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  
  const [overrides, setOverrides] = useState<Record<string, { provider: string, model: string }>>({});

  const fetchData = async () => {
    setIsLoading(true);
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
        // Initialize local overrides state for both modules and features
        const initialOverrides: any = {};
        featData.modules.forEach((mod: any) => {
          if (mod.moduleOverride) {
            initialOverrides[mod.moduleId] = { provider: mod.moduleOverride.provider || "", model: mod.moduleOverride.model || "" };
          }
          mod.features.forEach((f: any) => {
            if (f.override) {
              initialOverrides[f.key] = { provider: f.override.provider || "", model: f.override.model || "" };
            }
          });
        });
        setOverrides(initialOverrides);
      }
      if (provData.success) setProviders(provData.providers || {});
      if (modData.success) setSavedModels(modData.models || {});
      
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveOverride = async (targetKey: string, isModule = false) => {
    setSavingKey(targetKey);
    try {
      const override = overrides[targetKey];
      const payload = {
        featureKey: targetKey,
        provider: override?.provider || "",
        model: override?.model || ""
      };

      const res = await fetch("/api/settings/ai/features", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      
      // Refresh to update saved state cleanly
      await fetchData();
      
    } catch (e: any) {
      alert("Error saving override: " + e.message);
    } finally {
      setSavingKey(null);
    }
  };

  const handleProviderChange = (targetKey: string, providerId: string) => {
    setOverrides(prev => ({
      ...prev,
      [targetKey]: { provider: providerId, model: "" }
    }));
  };

  const handleModelChange = (targetKey: string, modelId: string) => {
    setOverrides(prev => ({
      ...prev,
      [targetKey]: { ...prev[targetKey], model: modelId }
    }));
  };

  const hasUnsavedChanges = (targetKey: string, savedData: any) => {
    const currentOvr = overrides[targetKey];
    const savedOvr = savedData;
    
    if (!currentOvr && !savedOvr) return false;
    if (currentOvr && !savedOvr && currentOvr.provider) return true; // new override
    if (!currentOvr?.provider && savedOvr) return true; // clearing override
    if (currentOvr?.provider !== savedOvr?.provider) return true;
    if (currentOvr?.model !== savedOvr?.model) return true;
    
    return false;
  };

  const OverrideControlRow = ({ title, subtitle, targetKey, savedData, isModule = false }: any) => {
    const ovr = overrides[targetKey] || { provider: "", model: "" };
    const unsaved = hasUnsavedChanges(targetKey, savedData);
    const isActiveOverride = !!savedData;

    return (
      <div className={`p-4 flex flex-col md:flex-row gap-4 md:items-center ${isModule ? 'bg-muted/30 border-b rounded-t-xl' : 'border-t border-dashed'} ${isActiveOverride && !isModule ? 'bg-blue-50/10' : ''}`}>
        <div className="md:w-1/3">
          <div className="flex items-center gap-2">
            {isModule && <Layers className="w-4 h-4 text-blue-600" />}
            <h3 className={`font-semibold ${isModule ? 'text-lg' : 'text-sm'}`}>{title}</h3>
            {isActiveOverride && (
               <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider flex items-center">
                 {isModule ? "Module Custom Route" : "Feature Custom Route"}
               </span>
            )}
          </div>
          {subtitle && <p className="text-xs text-muted-foreground font-mono mt-1">{subtitle}</p>}
        </div>

        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">{isModule ? "Module Provider" : "Feature Provider"}</Label>
            <select 
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
              value={ovr.provider}
              onChange={e => handleProviderChange(targetKey, e.target.value)}
            >
              <option value="">{isModule ? "Inherit Global Default" : "Inherit Module / Global Default"}</option>
              {Object.entries(providers).map(([pid, p]) => (
                <option key={pid} value={pid}>{p.displayName || pid}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">{isModule ? "Module Model" : "Feature Model"}</Label>
            <select 
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm disabled:opacity-50"
              value={ovr.model}
              onChange={e => handleModelChange(targetKey, e.target.value)}
              disabled={!ovr.provider}
            >
              <option value="">Provider Default (Auto)</option>
              {Object.entries(savedModels)
                .filter(([_, m]) => m.provider === ovr.provider)
                .map(([mid, m]) => (
                  <option key={mid} value={mid}>{m.name || mid}</option>
                ))
              }
            </select>
          </div>
        </div>

        <div className="md:w-[120px] flex justify-end">
          <Button 
            onClick={() => handleSaveOverride(targetKey, isModule)}
            disabled={!unsaved || savingKey === targetKey}
            variant={unsaved ? "default" : "outline"}
            className={`w-full h-9 ${unsaved ? 'animate-pulse bg-blue-600 hover:bg-blue-700 text-white' : ''}`}
          >
            {savingKey === targetKey ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : unsaved ? (
              <><Save className="w-3.5 h-3.5 mr-1.5" /> Save</>
            ) : (
              <><CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Saved</>
            )}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <InfoPanel 
        title="App Module & Feature Router"
        purpose="Route specific app modules or individual features to specialized AI models."
        example="Set the entire Wizard module to use Gemini, but override the Title Analyzer feature to use GPT-4o."
        nextStep="AI Router"
      />
      
      <div className="border rounded-xl bg-card overflow-hidden">
        <div className="p-6 border-b bg-muted/10">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <SplitSquareVertical className="w-5 h-5 text-blue-600" />
            Hierarchical Routing Overrides
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Hierarchy: <strong>Feature Override</strong> &gt; <strong>Module Override</strong> &gt; <strong>Global Default</strong>.
          </p>
        </div>
        
        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground flex items-center justify-center">
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Loading Modules...
          </div>
        ) : modules.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            No modules have been registered yet.
          </div>
        ) : (
          <div className="p-4 space-y-6 bg-muted/5">
            {modules.map((mod) => (
              <div key={mod.moduleId} className="border rounded-xl bg-background shadow-sm overflow-hidden">
                {/* Module Level Control */}
                <OverrideControlRow 
                  title={`${mod.moduleName} Module`}
                  subtitle={`Module ID: ${mod.moduleId}`}
                  targetKey={mod.moduleId}
                  savedData={mod.moduleOverride}
                  isModule={true}
                />
                
                {/* Feature Level Controls */}
                <div className="pl-4 pr-0 py-0">
                  {mod.features.map((feature: any) => (
                    <div key={feature.key} className="flex">
                      <div className="w-6 flex items-start justify-center pt-6 border-r border-dashed border-muted">
                        <ChevronRight className="w-4 h-4 text-muted-foreground opacity-50" />
                      </div>
                      <div className="flex-1">
                        <OverrideControlRow 
                          title={feature.name}
                          subtitle={feature.key}
                          targetKey={feature.key}
                          savedData={feature.override}
                          isModule={false}
                        />
                      </div>
                    </div>
                  ))}
                  {mod.features.length === 0 && (
                    <div className="p-4 text-sm text-muted-foreground border-t border-dashed">
                      No specific sub-features detected for this module yet.
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
