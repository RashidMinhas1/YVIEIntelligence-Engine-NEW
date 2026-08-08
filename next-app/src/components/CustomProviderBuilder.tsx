"use client";

import React, { useState } from "react";
import { ProviderTemplate, TemplateCategory, AuthType } from "@/lib/providers/templatesCatalog/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Download, Upload, Plus, Trash2, ArrowLeft, Settings2, Globe, Shield, Zap, Box } from "lucide-react";

interface CustomProviderBuilderProps {
  initialData?: ProviderTemplate | null;
  onSave: (template: ProviderTemplate) => void;
  onCancel: () => void;
}

export function CustomProviderBuilder({ initialData, onSave, onCancel }: CustomProviderBuilderProps) {
  const [formData, setFormData] = useState<ProviderTemplate>(
    initialData || {
      templateId: `custom_${Date.now()}`,
      name: "",
      category: "custom" as TemplateCategory,
      description: "",
      apiBaseUrl: "",
      websiteUrl: "",
      docsUrl: "",
      authType: "bearer" as AuthType,
      customHeaderName: "",
      requiresApiKey: true,
      defaultModels: [""],
      capabilities: { chat: true, vision: false, toolCalling: false, jsonMode: false, streaming: true, embeddings: false },
      customHeaders: {},
      timeoutMs: 30000
    }
  );

  const [headerKey, setHeaderKey] = useState("");
  const [headerValue, setHeaderValue] = useState("");
  const [modelInput, setModelInput] = useState("");

  const handleSave = () => {
    // Basic validation
    if (!formData.name || !formData.apiBaseUrl) {
      alert("Please provide a Name and API Base URL.");
      return;
    }
    onSave(formData);
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(formData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${formData.templateId}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        setFormData(imported);
      } catch (err) {
        alert("Invalid JSON file");
      }
    };
    reader.readAsText(file);
  };

  const updateCapability = (key: keyof NonNullable<ProviderTemplate['capabilities']>, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      capabilities: { ...(prev.capabilities || {}), [key]: value }
    }));
  };

  return (
    <div className="flex flex-col h-full bg-card border rounded-lg overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-muted/30">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onCancel} className="h-8 w-8">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-primary" />
              {initialData ? "Edit Template" : "Custom Provider Builder"}
            </h2>
            <p className="text-xs text-muted-foreground">Configure all advanced routing, auth, and request options.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <input type="file" id="import-json" accept=".json" className="hidden" onChange={handleImportJSON} />
            <Label htmlFor="import-json" className="flex items-center gap-1 cursor-pointer text-xs font-medium px-3 py-1.5 border rounded-md hover:bg-muted">
              <Upload className="w-3.5 h-3.5" /> Import
            </Label>
          </div>
          <Button variant="outline" size="sm" onClick={handleExportJSON} className="h-8 text-xs gap-1">
            <Download className="w-3.5 h-3.5" /> Export
          </Button>
          <Button size="sm" onClick={handleSave} className="h-8 text-xs gap-1">
            <Save className="w-3.5 h-3.5" /> Save Template
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-0">
        <Tabs defaultValue="basic" className="w-full flex h-full">
          {/* Sidebar Tabs */}
          <div className="w-48 shrink-0 border-r bg-muted/10 p-2 space-y-1">
            <TabsList className="flex flex-col h-auto bg-transparent p-0 items-stretch gap-1">
              <TabsTrigger value="basic" className="justify-start px-3 py-2 text-sm data-[state=active]:bg-primary/10 data-[state=active]:text-primary"><Globe className="w-4 h-4 mr-2" /> Basic Info</TabsTrigger>
              <TabsTrigger value="auth" className="justify-start px-3 py-2 text-sm data-[state=active]:bg-primary/10 data-[state=active]:text-primary"><Shield className="w-4 h-4 mr-2" /> Authentication</TabsTrigger>
              <TabsTrigger value="connection" className="justify-start px-3 py-2 text-sm data-[state=active]:bg-primary/10 data-[state=active]:text-primary"><Zap className="w-4 h-4 mr-2" /> Endpoints</TabsTrigger>
              <TabsTrigger value="models" className="justify-start px-3 py-2 text-sm data-[state=active]:bg-primary/10 data-[state=active]:text-primary"><Box className="w-4 h-4 mr-2" /> Models</TabsTrigger>
              <TabsTrigger value="features" className="justify-start px-3 py-2 text-sm data-[state=active]:bg-primary/10 data-[state=active]:text-primary"><Settings2 className="w-4 h-4 mr-2" /> Capabilities</TabsTrigger>
            </TabsList>
          </div>

          {/* Tab Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            <TabsContent value="basic" className="m-0 space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Provider Name *</Label>
                    <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. My Custom API" />
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={formData.category} onValueChange={(v: TemplateCategory) => setFormData({ ...formData, category: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="custom">Custom</SelectItem>
                        <SelectItem value="website">Website API</SelectItem>
                        <SelectItem value="generic">Generic REST</SelectItem>
                        <SelectItem value="local">Local Host</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label>Description</Label>
                    <Input value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Short description of this provider" />
                  </div>
                  <div className="space-y-2">
                    <Label>Website URL</Label>
                    <Input value={formData.websiteUrl || ''} onChange={e => setFormData({ ...formData, websiteUrl: e.target.value })} placeholder="https://" />
                  </div>
                  <div className="space-y-2">
                    <Label>Documentation URL</Label>
                    <Input value={formData.docsUrl || ''} onChange={e => setFormData({ ...formData, docsUrl: e.target.value })} placeholder="https://" />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="auth" className="m-0 space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Authentication</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Authentication Type</Label>
                    <Select value={formData.authType} onValueChange={(v: AuthType) => setFormData({ ...formData, authType: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bearer">Bearer Token</SelectItem>
                        <SelectItem value="api-key-header">API Key (Header)</SelectItem>
                        <SelectItem value="custom-header">Custom Header</SelectItem>
                        <SelectItem value="basic">Basic Auth</SelectItem>
                        <SelectItem value="cookie">Cookie / Session</SelectItem>
                        <SelectItem value="none">None</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {(formData.authType === 'custom-header' || formData.authType === 'api-key-header') && (
                    <div className="space-y-2">
                      <Label>Header Name</Label>
                      <Input value={formData.customHeaderName || ''} onChange={e => setFormData({ ...formData, customHeaderName: e.target.value })} placeholder="e.g. x-api-key" />
                    </div>
                  )}
                  <div className="space-y-2 col-span-2 flex items-center gap-2 mt-4">
                    <Switch checked={formData.requiresApiKey} onCheckedChange={c => setFormData({ ...formData, requiresApiKey: c })} />
                    <Label>Requires API Key or Secret at Runtime</Label>
                  </div>
                </div>

                <div className="pt-6 border-t space-y-4">
                  <h4 className="text-md font-medium">Custom Static Headers</h4>
                  <p className="text-sm text-muted-foreground">Headers that will be permanently attached to all requests for this provider.</p>
                  <div className="flex gap-2">
                    <Input placeholder="Header Key (e.g. User-Agent)" value={headerKey} onChange={e => setHeaderKey(e.target.value)} />
                    <Input placeholder="Value" value={headerValue} onChange={e => setHeaderValue(e.target.value)} />
                    <Button onClick={() => {
                      if (headerKey && headerValue) {
                        setFormData({ ...formData, customHeaders: { ...formData.customHeaders, [headerKey]: headerValue } });
                        setHeaderKey(""); setHeaderValue("");
                      }
                    }}>Add</Button>
                  </div>
                  {Object.entries(formData.customHeaders || {}).length > 0 && (
                    <div className="border rounded-md divide-y">
                      {Object.entries(formData.customHeaders || {}).map(([k, v]) => (
                        <div key={k} className="flex items-center justify-between p-2 px-3 text-sm">
                          <div><span className="font-medium">{k}:</span> <span className="text-muted-foreground">{v}</span></div>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500" onClick={() => {
                            const newHeaders = { ...formData.customHeaders };
                            delete newHeaders[k];
                            setFormData({ ...formData, customHeaders: newHeaders });
                          }}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="connection" className="m-0 space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">API Endpoints</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Base URL *</Label>
                    <Input value={formData.apiBaseUrl} onChange={e => setFormData({ ...formData, apiBaseUrl: e.target.value })} placeholder="https://api.example.com/v1" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="space-y-2">
                      <Label>Chat Endpoint (Suffix)</Label>
                      <Input value={formData.chatEndpoint || ''} onChange={e => setFormData({ ...formData, chatEndpoint: e.target.value })} placeholder="/chat/completions" />
                    </div>
                    <div className="space-y-2">
                      <Label>Models Endpoint (Suffix)</Label>
                      <Input value={formData.modelsEndpoint || ''} onChange={e => setFormData({ ...formData, modelsEndpoint: e.target.value })} placeholder="/models" />
                    </div>
                    <div className="space-y-2">
                      <Label>Embeddings Endpoint (Suffix)</Label>
                      <Input value={formData.embeddingsEndpoint || ''} onChange={e => setFormData({ ...formData, embeddingsEndpoint: e.target.value })} placeholder="/embeddings" />
                    </div>
                    <div className="space-y-2">
                      <Label>Timeout (ms)</Label>
                      <Input type="number" value={formData.timeoutMs || 30000} onChange={e => setFormData({ ...formData, timeoutMs: parseInt(e.target.value) || 30000 })} />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="models" className="m-0 space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Predefined Models</h3>
                <p className="text-sm text-muted-foreground">Add models that this provider supports by default.</p>
                <div className="flex gap-2">
                  <Input placeholder="Model ID (e.g. gpt-4)" value={modelInput} onChange={e => setModelInput(e.target.value)} onKeyDown={e => {
                    if (e.key === 'Enter' && modelInput) {
                      setFormData({ ...formData, defaultModels: [...formData.defaultModels.filter(m => m !== ''), modelInput] });
                      setModelInput("");
                    }
                  }}/>
                  <Button onClick={() => {
                    if (modelInput) {
                      setFormData({ ...formData, defaultModels: [...formData.defaultModels.filter(m => m !== ''), modelInput] });
                      setModelInput("");
                    }
                  }}>Add</Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  {formData.defaultModels.filter(m => m !== '').map((m, idx) => (
                    <div key={idx} className="bg-secondary px-3 py-1.5 rounded-full text-sm flex items-center gap-2 border">
                      {m}
                      <button onClick={() => setFormData({ ...formData, defaultModels: formData.defaultModels.filter(x => x !== m) })} className="text-muted-foreground hover:text-foreground">
                        &times;
                      </button>
                    </div>
                  ))}
                  {formData.defaultModels.filter(m => m !== '').length === 0 && (
                    <span className="text-sm text-muted-foreground italic">No default models defined. (User can fetch models at runtime if API supports it).</span>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="features" className="m-0 space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Provider Capabilities</h3>
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  {[
                    { key: 'chat', label: 'Chat / Text Generation' },
                    { key: 'vision', label: 'Vision / Image Input' },
                    { key: 'toolCalling', label: 'Tool Calling / Functions' },
                    { key: 'jsonMode', label: 'JSON Mode Output' },
                    { key: 'streaming', label: 'Streaming Responses' },
                    { key: 'reasoning', label: 'Advanced Reasoning' },
                    { key: 'embeddings', label: 'Text Embeddings' },
                    { key: 'imageGeneration', label: 'Image Generation' }
                  ].map((feat) => (
                    <div key={feat.key} className="flex items-center justify-between p-3 border rounded-lg bg-card">
                      <Label className="cursor-pointer font-medium">{feat.label}</Label>
                      <Switch 
                        checked={(formData.capabilities as any)?.[feat.key] || false}
                        onCheckedChange={(c) => updateCapability(feat.key as any, c)}
                      />
                    </div>
                  ))}
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-6 mt-6 border-t">
                  <div className="space-y-2">
                    <Label>Max Context Window (Tokens)</Label>
                    <Input type="number" value={formData.capabilities?.maxContextTokens || 128000} onChange={e => updateCapability('maxContextTokens', parseInt(e.target.value) as any)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Output Tokens</Label>
                    <Input type="number" value={formData.capabilities?.maxOutputTokens || 4096} onChange={e => updateCapability('maxOutputTokens', parseInt(e.target.value) as any)} />
                  </div>
                </div>
              </div>
            </TabsContent>

          </div>
        </Tabs>
      </div>
    </div>
  );
}
