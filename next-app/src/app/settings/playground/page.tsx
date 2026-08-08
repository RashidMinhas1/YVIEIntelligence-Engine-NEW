"use client";

import React, { useState } from 'react';
import { ProviderContextProvider, useProviderContext } from '@/context/ProviderContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Sparkles, Clock, Cpu, ShieldCheck, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function PlaygroundContent() {
  const { providers } = useProviderContext();
  const [prompt, setPrompt] = useState('Write a 3-point summary on the benefits of AI modularity.');
  const [systemPrompt, setSystemPrompt] = useState('You are an expert AI assistant.');
  const [selectedProvider, setSelectedProvider] = useState('auto');
  const [selectedModel, setSelectedModel] = useState('auto');
  const [temperature, setTemperature] = useState(0.7);
  const [executing, setExecuting] = useState(false);
  const [response, setResponse] = useState<any>(null);

  const handleExecute = async () => {
    if (!prompt) return;
    setExecuting(true);
    setResponse(null);
    try {
      const res = await fetch('/api/providers/playground', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          systemPrompt,
          preferredProviderId: selectedProvider !== 'auto' ? selectedProvider : undefined,
          preferredModel: selectedModel !== 'auto' ? selectedModel : undefined,
          temperature,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setResponse(data.response);
      } else {
        setResponse({ text: `Execution error: ${data.error}` });
      }
    } catch (err: any) {
      setResponse({ text: `Network error: ${err.message}` });
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-5xl space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-3">
          <Link href="/settings/providers">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Play className="w-5 h-5 text-green-600" /> AI Playground
            </h1>
            <p className="text-xs text-muted-foreground">
              Test prompt execution across any provider with real-time failover and latency tracking.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-4">
          <Card className="border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Router & Provider Config</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <Label>Provider Target</Label>
                <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto (Smart Routing)</SelectItem>
                    {providers.map((p) => (
                      <SelectItem key={p.profile?.id} value={p.profile?.id}>
                        {p.profile?.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>System Prompt</Label>
                <Input
                  className="h-8 text-xs"
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Temperature ({temperature})</Label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              <Button className="w-full h-8 text-xs gap-1.5 mt-2" onClick={handleExecute} disabled={executing}>
                <Play className="w-3.5 h-3.5 fill-current" /> {executing ? 'Executing...' : 'Run Prompt'}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-4">
          <Card className="border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Prompt Input</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                rows={4}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="text-xs"
                placeholder="Enter prompt here..."
              />
            </CardContent>
          </Card>

          <Card className="border min-h-[220px]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center justify-between">
                <span>Response Output</span>
                {response && (
                  <span className="text-[10px] font-normal text-muted-foreground flex items-center gap-2">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {response.latencyMs} ms</span>
                    <span className="flex items-center gap-1"><Cpu className="w-3 h-3" /> {response.tokensUsed?.total || 0} tokens</span>
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs">
              {response ? (
                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded font-mono text-xs whitespace-pre-wrap">
                    {response.text}
                  </div>
                  {response.providerId && (
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <ShieldCheck className="w-3 h-3 text-green-600" /> Processed via {response.providerId} ({response.modelUsed})
                      {response.failoverUsed && <span className="text-amber-600 font-semibold">[Failover Triggered]</span>}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">Click "Run Prompt" to execute a test request.</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function PlaygroundPage() {
  return (
    <ProviderContextProvider>
      <PlaygroundContent />
    </ProviderContextProvider>
  );
}
