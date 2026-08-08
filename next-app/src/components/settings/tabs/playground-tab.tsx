"use client";

import { useState, useEffect } from "react";
import { InfoPanel } from "../info-panel";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Play, Square, Copy, Save, RotateCcw } from "lucide-react";

export function PlaygroundTab() {
  const [prompt, setPrompt] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("You are a helpful assistant.");
  const [provider, setProvider] = useState("");
  const [model, setModel] = useState("");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [providersList, setProvidersList] = useState<string[]>([]);
  const [savedModels, setSavedModels] = useState<Record<string, any>>({});
  
  useEffect(() => {
    Promise.all([
      fetch("/api/settings/ai/providers").then(res => res.json()),
      fetch("/api/settings/ai/models").then(res => res.json())
    ])
    .then(([providersData, modelsData]) => {
      if (providersData.success && providersData.providers) {
        const p = Object.keys(providersData.providers);
        setProvidersList(p);
        if (p.length > 0) setProvider(p[0]);
      }
      if (modelsData.success) {
        setSavedModels(modelsData.models || {});
      }
    })
    .catch(e => console.error(e));
  }, []);

  const handleRun = async () => {
    if (!prompt) return;
    setIsLoading(true);
    setResponse("");
    try {
      const res = await fetch("/api/settings/ai/playground", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, systemPrompt, provider, model })
      });
      
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await res.json();
        if (data.success) {
          setResponse(data.response);
        } else {
          setResponse(`Error: ${data.error}`);
        }
      } else {
        setResponse(`Server returned HTTP ${res.status} error overlay. Check terminal backend logs.`);
      }
    } catch (e: any) {
      setResponse(`Request failed: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <InfoPanel 
        title="AI Playground"
        purpose="The Playground allows you to instantly chat with and test any AI provider you have configured in the Dashboard without writing any code. It runs directly through your unified Event Bus and respects your failover routing rules."
        example="Want to see if your newly added Local Ollama Llama-3 model works? Select it from the 'Provider' dropdown below, type 'Hello World' in the prompt box, and hit Send. You will immediately see its response and the latency it took to reply!"
        nextStep="Arena"
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 border rounded-lg p-4 bg-muted/5 flex flex-col gap-4">
          <h3 className="font-medium">Configuration</h3>
          
          <div className="space-y-2">
            <Label>Provider</Label>
            <select 
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={provider}
              onChange={e => setProvider(e.target.value)}
            >
              {providersList.map(p => <option key={p} value={p}>{p}</option>)}
              {providersList.length === 0 && <option value="">No Providers Found</option>}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Model Override (Optional)</Label>
            <select 
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={model} 
              onChange={e => setModel(e.target.value)}
            >
              <option value="">Default for this Provider (Auto)</option>
              {Object.entries(savedModels)
                .filter(([_, m]) => m.provider === provider)
                .map(([id, m]) => (
                  <option key={id} value={id}>{m.name || id}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>System Prompt (Optional)</Label>
            <Textarea 
              placeholder="You are a helpful assistant..." 
              value={systemPrompt} 
              onChange={e => setSystemPrompt(e.target.value)} 
              className="min-h-[150px]"
            />
          </div>
        </div>

        <div className="lg:col-span-2 border rounded-lg p-4 bg-card min-h-[400px] flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">Playground Session</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => { setPrompt(""); setResponse(""); }}><RotateCcw className="w-4 h-4 mr-1" /> Reset</Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>User Prompt</Label>
            <Textarea 
              placeholder="Enter your prompt here to test..." 
              value={prompt} 
              onChange={e => setPrompt(e.target.value)} 
              className="min-h-[120px]"
            />
          </div>

          <Button onClick={handleRun} disabled={isLoading || !prompt || providersList.length === 0} className="w-full">
            {isLoading ? <Square className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
            {isLoading ? "Running..." : "Run Generation"}
          </Button>

          <div className="flex-1 bg-muted/20 rounded-md border p-4 overflow-auto min-h-[200px] whitespace-pre-wrap font-mono text-sm">
            {response || <span className="text-muted-foreground text-sm font-sans">Response will appear here...</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
