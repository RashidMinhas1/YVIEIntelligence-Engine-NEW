"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, Save, X, Layers, ShoppingBag, Play, Table, History, Sparkles, Database, HardDrive, BarChart2, Plus } from "lucide-react";
import { ModelsTab } from "./settings/tabs/models-tab";
import { ProfilesTab } from "./settings/tabs/profiles-tab";
import { ProjectsTab } from "./settings/tabs/projects-tab";
import { PlaygroundTab } from "./settings/tabs/playground-tab";
import { ArenaTab } from "./settings/tabs/arena-tab";
import { TelemetryTab } from "./settings/tabs/telemetry-tab";
import { DiagnosticsTab } from "./settings/tabs/diagnostics-tab";
import { RouterTab } from "./settings/tabs/router-tab";
import { TemplatesTab } from "./settings/tabs/templates-tab";
import { InfoPanel } from "./settings/info-panel";

// Universal AI Provider Ecosystem V2 Additive Integrated Components
import { ProviderCard } from "./ProviderCard";
import { CapabilityMatrix } from "./CapabilityMatrix";
import { RequestHistoryPanel } from "./RequestHistoryPanel";
import { BackupPanel } from "./BackupPanel";
import { MarketplacePanel } from "./MarketplacePanel";
import { LocalModelsPanel } from "./LocalModelsPanel";
import { useProviderContext } from "@/context/ProviderContext";
import { PROVIDER_TEMPLATES, createProfileFromTemplate } from "@/lib/providers/templates";

function DashboardV2Tab() {
  const { providers, refreshProviders } = useProviderContext();
  return (
    <div className="space-y-6">
      <InfoPanel 
        title="Universal AI Provider Ecosystem V2 Dashboard"
        purpose="This is the central nervous system of your AI infrastructure. Use this dashboard to monitor all active API connections, verify their health, and quickly enable or disable routing to specific providers without deleting their setup."
        example="If OpenAI is down, you can toggle it off here. The system will automatically route your requests to Gemini or Local Models. You can also monitor diagnostic health (latency/errors) inside each provider box."
        nextStep="templates"
      />
      <div className="flex items-center justify-between border-b pb-3">
        <div>
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600" /> Ecosystem V2 Provider Dashboard
          </h3>
          <p className="text-xs text-muted-foreground">
            Multi-Key AES-256 Security, Resilience Failover Chain, & Real-Time Diagnostics.
          </p>
        </div>
        <Button onClick={() => window.dispatchEvent(new CustomEvent('navigate-tab', { detail: 'templates' }))}>
          <Plus className="w-4 h-4 mr-2" /> Add Provider from Templates
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {providers.map((p) => (
          <ProviderCard key={p.profile?.id} provider={p} onRefresh={refreshProviders} />
        ))}
        {providers.length === 0 && (
          <div className="col-span-full py-12 flex flex-col items-center justify-center border-2 border-dashed rounded-xl bg-muted/10">
            <Layers className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-semibold">No Providers Configured</h3>
            <p className="text-sm text-muted-foreground max-w-sm text-center mt-2 mb-4">
              Add a provider from the templates library to get started.
            </p>
            <Button variant="outline" onClick={() => window.dispatchEvent(new CustomEvent('navigate-tab', { detail: 'templates' }))}>
              <Plus className="w-4 h-4 mr-2" /> Browse Templates
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}



export function SettingsPage() {
  const [activeTab, setActiveTab] = useState("dashboard_v2");
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [showWizard, setShowWizard] = useState(true);

  const [wizardStatus, setWizardStatus] = useState({
    hasProvider: false,
    hasTestedConnection: false,
    hasModels: false,
    hasDefaultModel: false,
    hasProfile: false,
    completedCount: 0,
    isComplete: false
  });

  useEffect(() => {
    const handleNavigate = (e: any) => {
      if (typeof e?.detail === "string") {
        setActiveTab(e.detail);
      } else if (e?.detail && typeof e.detail.tab === "string") {
        setActiveTab(e.detail.tab);
      }
    };
    window.addEventListener("navigate-tab", handleNavigate);
    
    // Poll wizard status
    const fetchStatus = async () => {
      try {
        const res = await fetch("/api/settings/ai/wizard-status");
        const data = await res.json();
        if (data.success) {
          setWizardStatus(data.status);
        }
      } catch (e) {}
    };
    
    fetchStatus();
    const interval = setInterval(fetchStatus, 2000);
    
    return () => {
      window.removeEventListener("navigate-tab", handleNavigate);
      clearInterval(interval);
    };
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus("saving");
    try {
      await new Promise(res => setTimeout(res, 500));
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (e) {
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Infrastructure Layer</h1>
          <p className="text-muted-foreground mt-1">
            Universal AI Provider Ecosystem V2 with Centralized Event Bus & Multi-Key Resilience
          </p>
        </div>
        <div className="flex items-center gap-4">
          {saveStatus === "success" && (
            <span className="flex items-center text-green-500 text-sm gap-1">
              <CheckCircle2 className="w-4 h-4" /> Saved successfully
            </span>
          )}
          {saveStatus === "error" && (
            <span className="flex items-center text-red-500 text-sm gap-1">
              <AlertCircle className="w-4 h-4" /> Error saving
            </span>
          )}
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? "Saving..." : "Save Configuration"}
          </Button>
        </div>
      </div>

      {showWizard && (
        <div className={`border rounded-xl p-4 mb-6 relative transition-colors ${wizardStatus.isComplete ? 'bg-green-50 border-green-200' : 'bg-primary/5 border-primary/20'}`}>
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute top-2 right-2 text-muted-foreground hover:bg-black/5" 
            onClick={() => setShowWizard(false)}
          >
            <X className="w-4 h-4" />
          </Button>
          <h3 className={`font-semibold text-lg mb-2 flex items-center gap-2 ${wizardStatus.isComplete ? 'text-green-800' : ''}`}>
            Welcome to Universal AI Manager
            {wizardStatus.isComplete && <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded-full">Setup Complete!</span>}
          </h3>
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-6 text-sm">
              <label 
                className={`flex items-center gap-2 cursor-pointer hover:underline ${wizardStatus.hasProvider ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}
                onClick={() => setActiveTab("dashboard_v2")}
              >
                <input type="checkbox" checked={wizardStatus.hasProvider} readOnly className="accent-green-600 pointer-events-none" /> Add Provider
              </label>
              <label 
                className={`flex items-center gap-2 cursor-pointer hover:underline ${wizardStatus.hasTestedConnection ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}
                onClick={() => setActiveTab("dashboard_v2")}
              >
                <input type="checkbox" checked={wizardStatus.hasTestedConnection} readOnly className="accent-green-600 pointer-events-none" /> Test Connection
              </label>
              <label 
                className={`flex items-center gap-2 cursor-pointer hover:underline ${wizardStatus.hasModels ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}
                onClick={() => setActiveTab("models")}
              >
                <input type="checkbox" checked={wizardStatus.hasModels} readOnly className="accent-green-600 pointer-events-none" /> Import Models
              </label>
              <label 
                className={`flex items-center gap-2 cursor-pointer hover:underline ${wizardStatus.hasDefaultModel ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}
                onClick={() => setActiveTab("router")}
              >
                <input type="checkbox" checked={wizardStatus.hasDefaultModel} readOnly className="accent-green-600 pointer-events-none" /> Select Default Model
              </label>
              <label 
                className={`flex items-center gap-2 cursor-pointer hover:underline ${wizardStatus.hasProfile ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}
                onClick={() => setActiveTab("profiles")}
              >
                <input type="checkbox" checked={wizardStatus.hasProfile} readOnly className="accent-green-600 pointer-events-none" /> Create Profile
              </label>
            </div>
            <div className={`text-sm font-bold ${wizardStatus.isComplete ? 'text-green-700' : 'text-muted-foreground'}`}>
              Progress: {wizardStatus.completedCount}/5 Completed
            </div>
          </div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={(val) => typeof val === "string" && setActiveTab(val)} className="flex flex-col md:flex-row gap-6 w-full">
        
        {/* Vertical Sidebar Menu */}
        <div className="w-full md:w-64 shrink-0 flex flex-col gap-6">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 px-2">Setup & Providers</h4>
            <TabsList className="flex flex-col h-auto bg-transparent p-0 items-stretch gap-1 w-full">
              <TabsTrigger value="templates" className="justify-start px-3 py-2 text-sm data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                <Sparkles className="w-4 h-4 mr-2 text-amber-500" /> Templates Library
              </TabsTrigger>
              <TabsTrigger value="dashboard_v2" className="justify-start px-3 py-2 text-sm data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                <Layers className="w-4 h-4 mr-2" /> API Dashboard
              </TabsTrigger>
              <TabsTrigger value="marketplace" className="justify-start px-3 py-2 text-sm data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                <ShoppingBag className="w-4 h-4 mr-2" /> Marketplace
              </TabsTrigger>
              <TabsTrigger value="local_models" className="justify-start px-3 py-2 text-sm data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                <HardDrive className="w-4 h-4 mr-2 text-emerald-600" /> Local Models
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="space-y-1">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 px-2">Configuration</h4>
            <TabsList className="flex flex-col h-auto bg-transparent p-0 items-stretch gap-1 w-full">
              <TabsTrigger value="router" className="justify-start px-3 py-2 text-sm data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                AI Router
              </TabsTrigger>
              <TabsTrigger value="models" className="justify-start px-3 py-2 text-sm data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                Models Registry
              </TabsTrigger>
              <TabsTrigger value="profiles" className="justify-start px-3 py-2 text-sm data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                Agent Profiles
              </TabsTrigger>
              <TabsTrigger value="projects" className="justify-start px-3 py-2 text-sm data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                Projects
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="space-y-1">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 px-2">Monitoring & Testing</h4>
            <TabsList className="flex flex-col h-auto bg-transparent p-0 items-stretch gap-1 w-full">
              <TabsTrigger value="matrix" className="justify-start px-3 py-2 text-sm data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                <Table className="w-4 h-4 mr-2" /> Capability Matrix
              </TabsTrigger>
              <TabsTrigger value="playground_v2" className="justify-start px-3 py-2 text-sm data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                <Play className="w-4 h-4 mr-2 text-green-600" /> Playground
              </TabsTrigger>
              <TabsTrigger value="diagnostics" className="justify-start px-3 py-2 text-sm data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                Diagnostics
              </TabsTrigger>
              <TabsTrigger value="telemetry" className="justify-start px-3 py-2 text-sm data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                <BarChart2 className="w-4 h-4 mr-2 text-purple-600" /> Telemetry
              </TabsTrigger>
              <TabsTrigger value="history" className="justify-start px-3 py-2 text-sm data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                <History className="w-4 h-4 mr-2" /> Request History
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="space-y-1">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 px-2">System</h4>
            <TabsList className="flex flex-col h-auto bg-transparent p-0 items-stretch gap-1 w-full">
              <TabsTrigger value="backup" className="justify-start px-3 py-2 text-sm data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                <Database className="w-4 h-4 mr-2 text-indigo-600" /> Backup & Sync
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 border rounded-xl p-6 bg-card min-h-[500px]">
          <TabsContent value="dashboard_v2" className="m-0"><DashboardV2Tab /></TabsContent>
          <TabsContent value="marketplace" className="m-0"><MarketplacePanel /></TabsContent>
          <TabsContent value="local_models" className="m-0"><LocalModelsPanel /></TabsContent>
          <TabsContent value="playground_v2" className="m-0"><PlaygroundTab /></TabsContent>
          <TabsContent value="matrix" className="m-0"><CapabilityMatrix /></TabsContent>
          <TabsContent value="history" className="m-0"><RequestHistoryPanel /></TabsContent>
          <TabsContent value="telemetry" className="m-0"><TelemetryTab /></TabsContent>
          <TabsContent value="templates" className="m-0"><TemplatesTab /></TabsContent>
          <TabsContent value="backup" className="m-0"><BackupPanel /></TabsContent>

          {/* Preserved Legacy Tabs */}
          <TabsContent value="models" className="m-0"><ModelsTab /></TabsContent>
          <TabsContent value="profiles" className="m-0"><ProfilesTab /></TabsContent>
          <TabsContent value="projects" className="m-0"><ProjectsTab /></TabsContent>
          <TabsContent value="router" className="m-0"><RouterTab /></TabsContent>
          <TabsContent value="playground" className="m-0"><PlaygroundTab /></TabsContent>
          <TabsContent value="arena" className="m-0"><ArenaTab /></TabsContent>
          <TabsContent value="diagnostics" className="m-0"><DiagnosticsTab /></TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
