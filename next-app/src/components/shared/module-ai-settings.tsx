"use client";

import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Settings, Plus, Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useProviderContext } from "@/context/ProviderContext";
import { GitHubModelsWizard } from "@/components/provider-wizards/GitHubModelsWizard";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface ModuleAISettingsProps {
  featureKey: string;
  moduleName: string;
  children?: React.ReactNode;
  subFeatures?: { key: string; label: string }[];
}

export function ModuleAISettings({ featureKey, moduleName, children, subFeatures }: ModuleAISettingsProps) {
  const [configs, setConfigs] = useState<Record<string, any>>({});
  const [savedModels, setSavedModels] = useState<Record<string, any>>({});
  const [savedProfiles, setSavedProfiles] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  
  const { 
    providers, 
    officialProviders, 
    communityProviders, 
    localProviders, 
    discoveredModels 
  } = useProviderContext();

  useEffect(() => {
    if (open) {
      fetch("/api/settings/ai")
        .then(res => res.json())
        .then(data => {
          if (data.models) {
            setSavedModels(data.models);
          }
          if (data.profiles) {
            setSavedProfiles(data.profiles);
          }
          const loadedConfigs: Record<string, any> = {};
          const keysToLoad = subFeatures && subFeatures.length > 0 ? subFeatures.map(sf => sf.key) : [featureKey];
          
          for (const k of keysToLoad) {
            if (data.features && data.features[k]) {
              loadedConfigs[k] = { ...data.features[k], profileId: data.features[k].profileId || "none", isLocalOverrideEnabled: data.features[k].isLocalOverrideEnabled ?? false };
            } else {
              loadedConfigs[k] = { profileId: "none", provider: "auto", model: "auto", apiKeys: [""], isLocalOverrideEnabled: false };
            }
          }
          setConfigs(loadedConfigs);
        })
        .catch(err => {
          console.error("Failed to load AI settings:", err);
        });
    }
  }, [open, featureKey, subFeatures]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings/ai");
      const data = await res.json();
      
      if (!data.features) data.features = {};
      for (const k of Object.keys(configs)) {
        data.features[k] = configs[k];
      }

      await fetch("/api/settings/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      
      setOpen(false);
    } catch (err) {
      console.error(err);
    }
    setSaving(false);
  };

  if (Object.keys(configs).length === 0) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {children ? children : (
            <Button variant="outline" size="sm" className="gap-2 shrink-0">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">AI Config</span>
            </Button>
          )}
        </DialogTrigger>
        <DialogContent>Loading...</DialogContent>
      </Dialog>
    );
  }

  const renderConfigForm = (k: string, label: string) => {
    const config = configs[k];
    if (!config) return null;

    const selectedProviderProfile = config.provider !== 'auto' ? providers.find(p => p.profile?.id === config.provider || p.profile?.name.toLowerCase() === config.provider.toLowerCase()) : null;
    
    const displayModels = (() => {
      if (config.provider === 'auto' || config.provider === 'none') return [];

      const discovered = discoveredModels[config.provider] || [];
      if (discovered.length > 0) {
        return discovered.map(m => ({ id: m.id, name: m.name, type: 'text' }));
      }

      if (!selectedProviderProfile) return [];
      const providerId = selectedProviderProfile.profile?.id;
      const enabledModels = Object.entries(savedModels)
        .filter(([id, m]: [string, any]) => m.provider === providerId)
        .map(([id, m]: [string, any]) => ({ id, name: m.name, type: 'text' }));
        
      if (enabledModels.length > 0) return enabledModels;
      return selectedProviderProfile.profile?.models || [];
    })();

    const updateApiKey = (idx: number, val: string) => {
      const keys = [...(config.apiKeys || [""])];
      keys[idx] = val;
      setConfigs({ ...configs, [k]: { ...config, apiKeys: keys } });
    };

    const addKey = () => {
      setConfigs({ ...configs, [k]: { ...config, apiKeys: [...(config.apiKeys || [""]), ""] } });
    };

    const removeKey = (idx: number) => {
      const keys = (config.apiKeys || [""]).filter((_: any, i: number) => i !== idx);
      setConfigs({ ...configs, [k]: { ...config, apiKeys: keys.length ? keys : [""] } });
    };

    return (
      <div className="space-y-3 py-1">
        <div className="flex items-center justify-between border-b pb-2">
          <div className="space-y-0.5">
            <Label className="text-xs font-medium">Enable Local Override</Label>
            <div className="text-xs text-muted-foreground">Override global AI settings for {label}.</div>
          </div>
          <Switch 
            checked={config.isLocalOverrideEnabled} 
            onCheckedChange={(c) => setConfigs({ ...configs, [k]: { ...config, isLocalOverrideEnabled: c } })} 
          />
        </div>

        {config.isLocalOverrideEnabled && (
          <>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Assigned Profile (AI Consumption Control)</Label>
              <Select 
                value={config.profileId || "none"} 
                onValueChange={(v) => {
                  const selectedProf = v !== "none" ? savedProfiles[v] : null;
                  setConfigs({ 
                    ...configs, 
                    [k]: { 
                      ...config, 
                      profileId: v,
                      provider: selectedProf?.defaultProvider && selectedProf.defaultProvider !== 'auto' ? selectedProf.defaultProvider : config.provider
                    } 
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Profile" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Default Auto Control)</SelectItem>
                  {Object.entries(savedProfiles).map(([profId, prof]: [string, any]) => (
                    <SelectItem key={profId} value={profId}>
                      <div className="flex items-center justify-between w-full gap-2">
                        <span className="font-semibold">{prof.name || profId}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          ({prof.defaultProvider || 'Auto'} • {prof.budget === 0 ? "Unlimited" : `$${prof.budget}`})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Provider Selection</Label>
              <Select value={config.provider} onValueChange={(v) => setConfigs({ ...configs, [k]: { ...config, provider: v, model: 'auto' } })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto (Smart Routing)</SelectItem>
                  
                  {officialProviders.length > 0 && (
                    <SelectGroup>
                      <SelectLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-slate-50 dark:bg-slate-900 rounded mt-1 px-2">
                        Official Providers
                      </SelectLabel>
                      {officialProviders.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{p.name}</span>
                            {p.healthStatus === 'online' ? <span className="w-1.5 h-1.5 rounded-full bg-green-500 ml-2" /> :
                             p.healthStatus === 'offline' ? <span className="w-1.5 h-1.5 rounded-full bg-red-500 ml-2" /> :
                             <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 ml-2" />}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  )}

                  {communityProviders.length > 0 && (
                    <SelectGroup>
                      <SelectLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-slate-50 dark:bg-slate-900 rounded mt-1 px-2">
                        Community Providers
                      </SelectLabel>
                      {communityProviders.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{p.name}</span>
                            {p.healthStatus === 'online' ? <span className="w-1.5 h-1.5 rounded-full bg-green-500 ml-2" /> :
                             p.healthStatus === 'offline' ? <span className="w-1.5 h-1.5 rounded-full bg-red-500 ml-2" /> :
                             <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 ml-2" />}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  )}

                  {localProviders.length > 0 && (
                    <SelectGroup>
                      <SelectLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-slate-50 dark:bg-slate-900 rounded mt-1 px-2">
                        Local Providers
                      </SelectLabel>
                      {localProviders.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{p.name}</span>
                            {p.healthStatus === 'online' ? <span className="w-1.5 h-1.5 rounded-full bg-green-500 ml-2" /> :
                             p.healthStatus === 'offline' ? <span className="w-1.5 h-1.5 rounded-full bg-red-500 ml-2" /> :
                             <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 ml-2" />}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Model Override</Label>
              <Select value={config.model} onValueChange={(v) => setConfigs({ ...configs, [k]: { ...config, model: v } })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">
                    Auto (Smart Selection) <span className="ml-2 text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-mono">Dynamic</span>
                  </SelectItem>
                  
                  {displayModels.map((m: any, i: number) => (
                    <SelectItem key={m.id || `model-${i}`} value={m.id || `model-${i}`}>
                      <div className="flex justify-between items-center w-full">
                        <span>{m.name || m.id || 'Unknown Model'}</span>
                        <span className="text-[10px] text-muted-foreground ml-4 uppercase">{m.type || 'text'}</span>
                      </div>
                    </SelectItem>
                  ))}

                  {selectedProviderProfile && displayModels.length === 0 && (
                    <p className="text-xs text-muted-foreground mt-1 text-orange-500">
                      Warning: This provider has no models defined. Add models in the Settings tab.
                    </p>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">Local API Keys (Optional)</Label>
                <Button variant="ghost" size="sm" onClick={addKey} className="h-5 px-1.5 text-xs"><Plus className="w-3 h-3" /></Button>
              </div>
              {(config.apiKeys || [""]).map((keyVal: string, i: number) => (
                <div key={i} className="flex gap-1.5">
                  <Input 
                    type="password" 
                    placeholder="sk-... (Leave empty to use global)" 
                    value={keyVal} 
                    className="h-8 text-xs font-mono"
                    onChange={(e) => updateApiKey(i, e.target.value)} 
                  />
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeKey(i)}>
                    <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ? children : (
          <Button variant="outline" size="sm" className="gap-2 shrink-0 bg-background hover:bg-muted">
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">AI Config</span>
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader className="flex flex-row items-center justify-between w-full">
          <DialogTitle>{moduleName} - AI Settings</DialogTitle>
          <div className="pr-6">
            <GitHubModelsWizard />
          </div>
        </DialogHeader>

        <div className="space-y-3 py-2 max-h-[70vh] overflow-y-auto no-scrollbar">
          {subFeatures && subFeatures.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              {subFeatures.map((sf, index) => (
                <AccordionItem key={sf.key} value={sf.key} className="border-b border-border/40">
                  <AccordionTrigger className="text-xs font-semibold py-2 hover:no-underline">{sf.label}</AccordionTrigger>
                  <AccordionContent className="pb-3">
                    {renderConfigForm(sf.key, sf.label)}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            renderConfigForm(featureKey, moduleName)
          )}

          <div className="flex justify-end pt-4 sticky bottom-0 bg-background">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Module Config"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
