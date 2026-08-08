"use client";

import { useState, useEffect, useMemo } from "react";
import { InfoPanel } from "../info-panel";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Search, Filter, Activity, Server, RefreshCw, CheckCircle2, AlertCircle, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ModelsTab() {
  const [models, setModels] = useState<any[]>([]); // Models for current sync view
  const [savedModels, setSavedModels] = useState<Record<string, any>>({});
  const [providersList, setProvidersList] = useState<{id: string, name: string}[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoadingSaved, setIsLoadingSaved] = useState(true);
  
  const [testStatus, setTestStatus] = useState<Record<string, { loading: boolean, success?: boolean, latency?: number, error?: string }>>({});
  const [saveStatus, setSaveStatus] = useState<Record<string, { saving: boolean, saved: boolean }>>({});

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [pricingFilter, setPricingFilter] = useState("all"); // "all", "free", "paid"
  const [contextFilter, setContextFilter] = useState("all"); // "all", "small", "medium", "large"

  const fetchSavedModels = async () => {
    try {
      const res = await fetch("/api/settings/ai/models");
      const data = await res.json();
      if (data.success) {
        setSavedModels(data.models || {});
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingSaved(false);
    }
  };

  useEffect(() => {
    // Load available providers
    fetch("/api/settings/ai/providers")
      .then(res => {
        if (!res.ok) throw new Error("Failed to load providers");
        return res.json();
      })
      .then(data => {
        if (data.success && data.providers) {
          const list = Object.entries(data.providers).map(([id, config]: [string, any]) => ({
            id,
            name: config.displayName || id
          }));
          setProvidersList(list);
          if (list.length > 0) setSelectedProvider(list[0].id);
        }
      })
      .catch(e => console.error(e));
      
    fetchSavedModels();
  }, []);

  const handleSyncModels = async () => {
    if (!selectedProvider) return;
    setIsSyncing(true);
    try {
      const res = await fetch("/api/settings/ai/models/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerId: selectedProvider })
      });
      
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await res.json();
        if (data.success) {
          setModels(data.models || []);
        } else {
          alert("Failed to sync models: " + data.error);
        }
      } else {
        alert(`Server error (${res.status}): Please check backend logs.`);
      }
    } catch (e: any) {
      console.error(e);
      alert("Error syncing models: " + e.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleTestConnection = async (modelId: string) => {
    setTestStatus(prev => ({ ...prev, [modelId]: { loading: true } }));
    setSaveStatus(prev => ({ ...prev, [modelId]: { saving: false, saved: false } })); // Reset save status
    
    try {
      const res = await fetch("/api/settings/ai/models/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerId: selectedProvider, modelId })
      });
      
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await res.json();
        if (data.success) {
          setTestStatus(prev => ({ ...prev, [modelId]: { loading: false, success: true, latency: data.latency } }));
        } else {
          setTestStatus(prev => ({ ...prev, [modelId]: { loading: false, success: false, error: data.error } }));
        }
      } else {
         setTestStatus(prev => ({ ...prev, [modelId]: { loading: false, success: false, error: `HTTP ${res.status}: Server Error Overlay` } }));
      }
    } catch (e: any) {
      setTestStatus(prev => ({ ...prev, [modelId]: { loading: false, success: false, error: e.message } }));
    }
  };

  const handleSaveModel = async (model: any) => {
    setSaveStatus(prev => ({ ...prev, [model.id]: { saving: true, saved: false } }));
    try {
      const res = await fetch("/api/settings/ai/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelId: model.id,
          provider: model.provider,
          contextWindow: model.contextWindow,
          isFree: model.isFree,
          capabilities: model.capabilities,
          name: model.name
        })
      });
      const data = await res.json();
      if (data.success) {
        setSaveStatus(prev => ({ ...prev, [model.id]: { saving: false, saved: true } }));
        fetchSavedModels(); // Refresh saved models list
      } else {
        alert("Failed to save model: " + data.error);
        setSaveStatus(prev => ({ ...prev, [model.id]: { saving: false, saved: false } }));
      }
    } catch (e: any) {
      alert("Error saving model");
      setSaveStatus(prev => ({ ...prev, [model.id]: { saving: false, saved: false } }));
    }
  };

  const handleRemoveSavedModel = async (modelId: string) => {
    if (!confirm("Remove this model from your enabled list?")) return;
    try {
      await fetch(`/api/settings/ai/models?id=${modelId}`, { method: "DELETE" });
      fetchSavedModels();
      // Reset save status in the discovery grid if it was set
      setSaveStatus(prev => {
        const next = { ...prev };
        if (next[modelId]) next[modelId] = { saving: false, saved: false };
        return next;
      });
    } catch (e) {
      console.error(e);
    }
  };

  const filteredModels = useMemo(() => {
    return models.filter(model => {
      // 1. Search Query
      if (searchQuery && !model.name?.toLowerCase().includes(searchQuery.toLowerCase()) && !model.id?.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // 2. Pricing Filter
      if (pricingFilter === "free" && !model.isFree) return false;
      if (pricingFilter === "paid" && model.isFree) return false;
      
      // 3. Context Filter
      const context = model.contextWindow || 0;
      if (contextFilter === "small" && context > 32000) return false; // <= 32k
      if (contextFilter === "medium" && (context <= 32000 || context > 128000)) return false; // 32k - 128k
      if (contextFilter === "large" && context <= 128000) return false; // > 128k
      
      return true;
    });
  }, [models, searchQuery, pricingFilter, contextFilter]);

  const activeFiltersCount = (pricingFilter !== "all" ? 1 : 0) + (contextFilter !== "all" ? 1 : 0);
  const selectedProviderName = providersList.find(p => p.id === selectedProvider)?.name || selectedProvider;
  
  const savedModelsList = Object.entries(savedModels);

  return (
    <div className="space-y-6">
      <InfoPanel 
        title="Model Discovery & Testing"
        purpose="This tab automatically syncs with your providers to pull their latest available models. It ensures your Universal Manager always knows exactly what models exist on OpenAI, Anthropic, or Local Ollama."
        example="If a new model like 'GPT-5' drops, just click 'Sync Models' under the OpenAI section. It will automatically fetch it and add it to your routing list without any code updates needed!"
        nextStep="Workflow Profiles"
      />

      {/* Enabled Models Section */}
      <div className="border rounded-xl p-4 bg-muted/10">
        <h2 className="font-semibold text-lg flex items-center gap-2 mb-4">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          Currently Enabled Models
        </h2>
        {isLoadingSaved ? (
          <p className="text-sm text-muted-foreground">Loading enabled models...</p>
        ) : savedModelsList.length === 0 ? (
          <div className="text-sm text-muted-foreground bg-background border rounded-lg p-6 text-center">
            No models enabled yet. Sync a provider below and enable models to add them to your system.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {savedModelsList.map(([id, config]) => (
              <div key={id} className="bg-background border rounded-lg p-3 flex flex-col gap-2 relative group">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10"
                  onClick={() => handleRemoveSavedModel(id)}
                  title="Remove Model"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
                <div className="pr-6">
                  <h4 className="font-medium text-sm leading-tight line-clamp-1" title={config.name || id}>{config.name || id}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">{providersList.find(p => p.id === config.provider)?.name || config.provider}</p>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  {config.isFree && <span className="text-[9px] bg-green-100 text-green-800 px-1 py-0.5 rounded font-bold uppercase tracking-wider">Free</span>}
                  <span className="text-[9px] bg-muted text-muted-foreground px-1 py-0.5 rounded font-bold uppercase">{config.contextWindow ? (config.contextWindow/1000).toFixed(0)+'k' : '?' }</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <hr className="my-6 border-muted-foreground/20" />
      
      {/* Discovery Section */}
      <h2 className="font-semibold text-lg flex items-center gap-2">
        <Search className="w-5 h-5 text-blue-600" />
        Discover & Add Models
      </h2>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-muted/10 p-4 border rounded-xl">
        <div className="flex items-center gap-4 flex-1">
          <div className="flex items-center gap-2">
            <Label className="whitespace-nowrap">Target API:</Label>
            <select 
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={selectedProvider}
              onChange={e => setSelectedProvider(e.target.value)}
            >
              {providersList.map(p => <option key={p.id} value={p.id}>{p.name.toUpperCase()}</option>)}
              {providersList.length === 0 && <option value="">No Providers Installed</option>}
            </select>
          </div>
        </div>
        <Button onClick={handleSyncModels} disabled={isSyncing || !selectedProvider} className="w-full sm:w-auto">
          {isSyncing ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Server className="w-4 h-4 mr-2" />}
          Sync {selectedProviderName ? selectedProviderName.toUpperCase() : ''} Models
        </Button>
      </div>

      <div className="flex items-center gap-2 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search discovered models..." 
            className="pl-8" 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="relative">
              <Filter className="h-4 w-4" />
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Pricing</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={pricingFilter} onValueChange={setPricingFilter}>
              <DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="free">Free Only</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="paid">Paid Only</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuLabel>Context Window</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={contextFilter} onValueChange={setContextFilter}>
              <DropdownMenuRadioItem value="all">Any Size</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="small">Small (≤ 32k)</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="medium">Medium (32k - 128k)</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="large">Large (&gt; 128k)</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
            
            {(pricingFilter !== "all" || contextFilter !== "all") && (
              <>
                <DropdownMenuSeparator />
                <div className="p-2">
                  <Button variant="ghost" size="sm" className="w-full justify-start text-xs h-8" onClick={() => { setPricingFilter("all"); setContextFilter("all"); }}>
                    Clear Filters
                  </Button>
                </div>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {models.length === 0 ? (
          <div className="col-span-full border border-dashed rounded-xl p-12 bg-muted/5 flex flex-col items-center justify-center text-center">
            <Server className="w-10 h-10 text-muted-foreground mb-4 opacity-30" />
            <h3 className="font-semibold text-lg">No Models Loaded</h3>
            <p className="text-muted-foreground text-sm max-w-sm mt-2">
              Select a provider above and click Sync to dynamically discover all available models and their capabilities.
            </p>
          </div>
        ) : filteredModels.length === 0 ? (
          <div className="col-span-full border border-dashed rounded-xl p-12 bg-muted/5 flex flex-col items-center justify-center text-center">
            <Search className="w-10 h-10 text-muted-foreground mb-4 opacity-30" />
            <h3 className="font-semibold text-lg">No Results Found</h3>
            <p className="text-muted-foreground text-sm max-w-sm mt-2">
              No models match your current filters. Try adjusting your search query or removing filters.
            </p>
          </div>
        ) : (
          filteredModels.map((model) => {
            const isSaved = !!savedModels[model.id] || saveStatus[model.id]?.saved;
            return (
             <div key={model.id} className={`border rounded-lg bg-card shadow-sm flex flex-col justify-between overflow-hidden ${isSaved ? 'ring-2 ring-green-500/50' : ''}`}>
              <div className="p-4">
                <div className="flex justify-between items-start mb-2 gap-2">
                  <h3 className="font-semibold break-all text-sm leading-tight" title={model.name || model.id}>{model.name || model.id}</h3>
                  <div className="flex flex-shrink-0 gap-1">
                    {model.isFree ? (
                      <span className="text-[10px] bg-green-100 text-green-800 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Free</span>
                    ) : (
                      <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Paid</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-1 text-xs text-muted-foreground mt-3">
                   <div className="flex justify-between border-b pb-1">
                     <span>Context Length</span>
                     <span className="font-medium text-foreground">{model.contextWindow ? (model.contextWindow / 1000).toFixed(0) + 'k' : 'Unknown'}</span>
                   </div>
                   <div className="flex justify-between border-b pb-1 pt-1">
                     <span>Provider</span>
                     <span className="font-medium text-foreground">{providersList.find(p => p.id === model.provider)?.name || model.provider}</span>
                   </div>
                </div>
              </div>

              {/* Status Banner */}
              {testStatus[model.id] && (
                <div className={`px-4 py-2 text-xs flex justify-between items-center ${testStatus[model.id].loading ? 'bg-blue-50 text-blue-700' : testStatus[model.id].success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {testStatus[model.id].loading && <span className="flex items-center"><RefreshCw className="w-3 h-3 mr-1 animate-spin" /> Testing...</span>}
                  {testStatus[model.id].success && <span className="flex items-center font-medium"><CheckCircle2 className="w-3 h-3 mr-1" /> Success!</span>}
                  {testStatus[model.id].success && <span className="font-mono">{testStatus[model.id].latency}ms</span>}
                  {testStatus[model.id].error && (
                    <span className="flex flex-col gap-1 w-full">
                      <span className="flex items-center font-semibold text-red-800"><AlertCircle className="w-3 h-3 mr-1" /> Error</span>
                      <span className="text-[10px] opacity-80 break-words leading-tight">{testStatus[model.id].error}</span>
                    </span>
                  )}
                </div>
              )}

              <div className="p-3 bg-muted/10 border-t flex gap-2">
                {!testStatus[model.id]?.success && !isSaved ? (
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => handleTestConnection(model.id)} disabled={testStatus[model.id]?.loading}>
                    <Activity className="w-3.5 h-3.5 mr-1.5" /> Test Connection
                  </Button>
                ) : (
                  <Button 
                    variant={isSaved ? "secondary" : "default"} 
                    size="sm" 
                    className={`flex-1 ${isSaved ? 'bg-green-100 text-green-800 hover:bg-green-200' : ''}`}
                    onClick={() => handleSaveModel(model)} 
                    disabled={saveStatus[model.id]?.saving || isSaved}
                  >
                    {saveStatus[model.id]?.saving ? (
                      <><RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Saving...</>
                    ) : isSaved ? (
                      <><CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Added to System</>
                    ) : (
                      <><Save className="w-3.5 h-3.5 mr-1.5" /> Enable Model</>
                    )}
                  </Button>
                )}
              </div>
            </div>
          );
        })
        )}
      </div>
    </div>
  );
}
