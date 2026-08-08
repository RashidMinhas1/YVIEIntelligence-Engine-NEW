"use client";

import React, { useState, useMemo } from "react";
import { PROVIDER_TEMPLATES, createProfileFromTemplate } from "@/lib/providers/templates";
import { detectProviderFromUrl } from "@/lib/providers/autoDetector";
import { ProviderTemplate } from "@/lib/providers/templatesCatalog/types";
import { useProviderContext } from "@/context/ProviderContext";
import { InfoPanel } from "@/components/settings/info-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Search, Plus, ExternalLink, Globe, Cpu, Server, Code, Zap } from "lucide-react";
import { CustomProviderBuilder } from "@/components/CustomProviderBuilder";

export function TemplatesTab() {
  const { refreshProviders } = useProviderContext();
  const [msg, setMsg] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [autoDetectUrl, setAutoDetectUrl] = useState("");
  const [showCustomBuilder, setShowCustomBuilder] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ProviderTemplate | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  // Filter templates
  const filteredTemplates = useMemo(() => {
    return PROVIDER_TEMPLATES.filter((tmpl) => {
      if (activeCategory !== "all" && tmpl.category !== activeCategory) return false;
      if (search && !tmpl.name.toLowerCase().includes(search.toLowerCase()) && !tmpl.description.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [search, activeCategory]);

  const handleUseTemplate = async (tmpl: ProviderTemplate) => {
    const profile = createProfileFromTemplate(tmpl);
    try {
      const res = await fetch('/api/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg(`Provider ${tmpl.name} created successfully!`);
        await refreshProviders();
        setTimeout(() => {
          setMsg(null);
          window.dispatchEvent(new CustomEvent('navigate-tab', { detail: 'dashboard_v2' }));
        }, 1000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAutoDetect = () => {
    const detected = detectProviderFromUrl(autoDetectUrl);
    if (detected) {
      setSearch(detected.name);
      setActiveCategory(detected.category);
      setMsg(`Detected: ${detected.name}`);
      setTimeout(() => setMsg(null), 3000);
    } else {
      setMsg("Could not auto-detect provider from URL.");
      setTimeout(() => setMsg(null), 3000);
    }
  };

  const handleSaveCustomTemplate = async (template: ProviderTemplate) => {
    try {
      const res = await fetch('/api/providers/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template),
      });
      if (res.ok) {
        setMsg(`Saved custom template ${template.name}`);
        setShowCustomBuilder(false);
        setEditingTemplate(null);
        setTimeout(() => setMsg(null), 3000);
        // Normally we'd reload user templates here, but for now we just show success
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (showCustomBuilder) {
    return (
      <div className="h-[800px]">
        <CustomProviderBuilder 
          initialData={editingTemplate}
          onSave={handleSaveCustomTemplate} 
          onCancel={() => { setShowCustomBuilder(false); setEditingTemplate(null); }} 
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <InfoPanel 
        title="Provider Templates Marketplace"
        purpose="1-click setup for 45+ AI APIs. Support for Official, Community, Local, and Custom REST APIs."
        example="Paste a base URL into the Smart Auto-Detector below, or click 'Custom Provider Builder' to configure an advanced connection."
        nextStep="dashboard_v2"
      />

      <div className="bg-card border rounded-lg p-4 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" /> Smart Auto-Detection
            </h3>
            <p className="text-xs text-muted-foreground">Paste an API URL and we'll detect the provider automatically.</p>
          </div>
          {msg && <span className="text-xs text-primary font-semibold bg-primary/10 px-3 py-1 rounded">{msg}</span>}
        </div>
        <div className="flex gap-2">
          <Input 
            value={autoDetectUrl} 
            onChange={e => setAutoDetectUrl(e.target.value)} 
            placeholder="e.g. https://api.openai.com/v1" 
            className="flex-1"
          />
          <Button onClick={handleAutoDetect}><Zap className="w-4 h-4 mr-2"/> Auto Detect</Button>
          <Button variant="secondary" onClick={() => setShowCustomBuilder(true)}>
            <Plus className="w-4 h-4 mr-2" /> Custom Builder
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
            <div className="flex items-center justify-between mb-4">
              <TabsList className="bg-muted/50">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="official" className="gap-1"><Globe className="w-3.5 h-3.5"/> Official</TabsTrigger>
                <TabsTrigger value="community" className="gap-1"><Server className="w-3.5 h-3.5"/> Community</TabsTrigger>
                <TabsTrigger value="local" className="gap-1"><Cpu className="w-3.5 h-3.5"/> Local</TabsTrigger>
                <TabsTrigger value="generic" className="gap-1"><Code className="w-3.5 h-3.5"/> Generic</TabsTrigger>
              </TabsList>
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search templates..." 
                  className="pl-8 h-9" 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>
          </Tabs>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((tmpl) => (
            <div key={tmpl.templateId} className="border rounded-lg p-4 bg-card shadow-sm hover:shadow-md transition-shadow flex flex-col gap-3 group relative">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">{tmpl.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted font-medium capitalize text-muted-foreground">
                      {tmpl.category}
                    </span>
                    {tmpl.websiteUrl && (
                      <a href={tmpl.websiteUrl} target="_blank" rel="noreferrer" className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-0.5">
                        <ExternalLink className="w-3 h-3" /> site
                      </a>
                    )}
                  </div>
                </div>
              </div>
              
              <p className="text-xs text-muted-foreground flex-1 leading-relaxed">
                {tmpl.description}
              </p>
              
              <div className="pt-3 border-t flex items-center justify-between gap-2 mt-auto">
                <span className="text-[10px] text-muted-foreground font-mono truncate bg-muted/30 px-1.5 py-0.5 rounded" title={tmpl.apiBaseUrl}>
                  {tmpl.apiBaseUrl.replace('https://', '').replace('http://', '')}
                </span>
                <Button size="sm" className="h-7 text-xs shrink-0" onClick={() => handleUseTemplate(tmpl)}>
                  Use Template
                </Button>
              </div>
            </div>
          ))}
          {filteredTemplates.length === 0 && (
            <div className="col-span-full py-12 text-center text-muted-foreground">
              No templates found matching your criteria.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
