"use client";

import { useState, useEffect } from "react";
import { InfoPanel } from "../info-panel";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Play, Square } from "lucide-react";

export function ArenaTab() {
  const [prompt, setPrompt] = useState("");
  const [providersList, setProvidersList] = useState<string[]>([]);
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [results, setResults] = useState<Record<string, { response?: string, error?: string, loading: boolean, time?: number }>>({});
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    fetch("/api/settings/ai/providers")
      .then(res => res.json())
      .then(data => {
        if (data.success && data.providers) {
          const p = Object.keys(data.providers);
          setProvidersList(p);
          if (p.length > 0) setSelectedProviders([p[0]]); // Select first by default
        }
      })
      .catch(console.error);
  }, []);

  const toggleProvider = (p: string) => {
    if (selectedProviders.includes(p)) {
      setSelectedProviders(selectedProviders.filter(x => x !== p));
    } else {
      setSelectedProviders([...selectedProviders, p]);
    }
  };

  const handleRun = async () => {
    if (!prompt || selectedProviders.length === 0) return;
    setIsRunning(true);
    
    // Initialize results state
    const initialResults: any = {};
    selectedProviders.forEach(p => initialResults[p] = { loading: true });
    setResults(initialResults);

    // Fire all requests concurrently
    await Promise.all(selectedProviders.map(async (provider) => {
      const start = Date.now();
      try {
        const res = await fetch("/api/settings/ai/playground", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, provider, systemPrompt: "You are a helpful assistant." })
        });
        
        const time = Date.now() - start;
        const contentType = res.headers.get("content-type");
        
        if (contentType && contentType.includes("application/json")) {
          const data = await res.json();
          setResults(prev => ({
            ...prev,
            [provider]: { loading: false, response: data.success ? data.response : undefined, error: data.success ? undefined : data.error, time }
          }));
        } else {
          setResults(prev => ({
            ...prev,
            [provider]: { loading: false, error: `HTTP ${res.status}: Server Error Overlay. Check terminal.`, time }
          }));
        }
      } catch (e: any) {
        setResults(prev => ({
          ...prev,
          [provider]: { loading: false, error: e.message }
        }));
      }
    }));
    
    setIsRunning(false);
  };

  return (
    <div className="space-y-6">
      <InfoPanel 
        title="Multi Model Arena"
        purpose="Compare multiple models simultaneously."
        example="Run the same prompt against GPT-4o, Claude 3.5 Sonnet, and Gemini 2.5 Pro to compare speed and quality."
        nextStep="AI Router"
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 border rounded-lg p-4 bg-muted/5 flex flex-col gap-4">
          <h3 className="font-medium">Arena Setup</h3>
          <p className="text-sm text-muted-foreground">Select models to compare:</p>
          <div className="space-y-2 max-h-[200px] overflow-auto">
            {providersList.map(p => (
              <label key={p} className="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-muted/50">
                <input 
                  type="checkbox" 
                  checked={selectedProviders.includes(p)} 
                  onChange={() => toggleProvider(p)} 
                />
                <span className="text-sm">{p.toUpperCase()}</span>
              </label>
            ))}
            {providersList.length === 0 && <span className="text-sm text-muted-foreground">No providers available.</span>}
          </div>
        </div>

        <div className="lg:col-span-3 border rounded-lg p-4 bg-card min-h-[400px] flex flex-col gap-4">
          <Textarea 
            placeholder="Enter your prompt to test across multiple models..." 
            value={prompt} 
            onChange={e => setPrompt(e.target.value)} 
            className="min-h-[100px]"
          />

          <Button onClick={handleRun} disabled={isRunning || !prompt || selectedProviders.length < 1} className="w-full">
            {isRunning ? <Square className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
            {isRunning ? "Running Comparison..." : "Run Comparison"}
          </Button>

          {Object.keys(results).length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {Object.entries(results).map(([p, res]) => (
                <div key={p} className="border rounded-md p-4 bg-muted/10 flex flex-col">
                  <div className="flex justify-between items-center mb-2 border-b pb-2">
                    <span className="font-semibold text-sm">{p.toUpperCase()}</span>
                    {res.time && <span className="text-xs text-muted-foreground">{res.time}ms</span>}
                  </div>
                  <div className="flex-1 whitespace-pre-wrap font-mono text-sm overflow-auto max-h-[300px]">
                    {res.loading ? (
                      <span className="text-muted-foreground animate-pulse">Generating...</span>
                    ) : res.error ? (
                      <span className="text-red-500">{res.error}</span>
                    ) : (
                      res.response
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
