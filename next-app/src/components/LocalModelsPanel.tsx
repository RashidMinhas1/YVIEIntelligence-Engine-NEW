"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HardDrive, Play, CheckCircle2, AlertTriangle, Terminal, BookOpen, Plus, ExternalLink } from 'lucide-react';
import { useProviderContext } from '@/context/ProviderContext';
import { InfoPanel } from './settings/info-panel';

interface LocalEngineSpec {
  id: string;
  name: string;
  defaultPort: number;
  baseUrl: string;
  description: string;
  cliCommand: string;
  setupInstructions: string[];
  docsUrl: string;
  defaultModel: string;
}

const LOCAL_ENGINES: LocalEngineSpec[] = [
  {
    id: 'ollama',
    name: 'Ollama Engine',
    defaultPort: 11434,
    baseUrl: 'http://localhost:11434/v1',
    description: 'Get up and running with Llama 3.3, DeepSeek-R1, Mistral, and Gemma locally.',
    cliCommand: 'OLLAMA_ORIGINS="*" ollama serve',
    setupInstructions: [
      'Download & install Ollama from https://ollama.com',
      'Run a model in terminal: ollama run llama3.3',
      'If connecting from browser, allow CORS: set OLLAMA_ORIGINS="*" in your environment variables.',
      'Ollama OpenAI compatible endpoint is active at http://localhost:11434/v1',
    ],
    docsUrl: 'https://github.com/ollama/ollama/blob/main/docs/openai.md',
    defaultModel: 'llama3.3',
  },
  {
    id: 'lmstudio',
    name: 'LM Studio',
    defaultPort: 1234,
    baseUrl: 'http://localhost:1234/v1',
    description: 'Run any GGUF quantized model on Mac M1/M2/M3 or Windows/Linux GPUs.',
    cliCommand: 'lms server start --port 1234',
    setupInstructions: [
      'Download LM Studio from https://lmstudio.ai',
      'Search and download any GGUF model (e.g. Qwen2.5, DeepSeek-R1).',
      'Navigate to Developer / Local Server tab in LM Studio.',
      'Click "Start Server" and toggle ON "Cross-Origin Resource Sharing (CORS)".',
      'Server endpoint is active at http://localhost:1234/v1',
    ],
    docsUrl: 'https://lmstudio.ai/docs/local-server',
    defaultModel: 'local-model',
  },
  {
    id: 'vllm',
    name: 'vLLM Engine',
    defaultPort: 8000,
    baseUrl: 'http://localhost:8000/v1',
    description: 'High-throughput and memory-efficient LLM serving engine with PagedAttention.',
    cliCommand: 'python -m vllm.entrypoints.openai.api_server --model Qwen/Qwen2.5-7B-Instruct --port 8000',
    setupInstructions: [
      'Install vLLM: pip install vllm',
      'Launch OpenAI-compatible server: python -m vllm.entrypoints.openai.api_server --model <model-name>',
      'Endpoint will be available at http://localhost:8000/v1',
    ],
    docsUrl: 'https://docs.vllm.ai/en/latest/serving/openai_compatible_server.html',
    defaultModel: 'vllm-model',
  },
  {
    id: 'localai',
    name: 'LocalAI',
    defaultPort: 8080,
    baseUrl: 'http://localhost:8080/v1',
    description: 'Free, open-source OpenAI alternative. Supports LLMs, audio, image generation, and embeddings.',
    cliCommand: 'docker run -p 8080:8080 --name local-ai -ti localai/localai:latest',
    setupInstructions: [
      'Install Docker on your system.',
      'Launch LocalAI container: docker run -p 8080:8080 -ti localai/localai:latest',
      'LocalAI endpoint responds at http://localhost:8080/v1',
    ],
    docsUrl: 'https://localai.io/basics/getting_started/',
    defaultModel: 'gpt-3.5-turbo',
  },
  {
    id: 'jan',
    name: 'Jan.ai',
    defaultPort: 1337,
    baseUrl: 'http://localhost:1337/v1',
    description: 'Open-source desktop AI assistant running 100% offline on your device.',
    cliCommand: 'jan --server --port 1337',
    setupInstructions: [
      'Download Jan.ai from https://jan.ai',
      'Open Settings ➔ Local API Server.',
      'Turn on "Enable Server" on port 1337.',
      'Endpoint active at http://localhost:1337/v1',
    ],
    docsUrl: 'https://jan.ai/docs/local-server',
    defaultModel: 'jan-local-model',
  },
  {
    id: 'oobabooga',
    name: 'Text Generation WebUI',
    defaultPort: 5000,
    baseUrl: 'http://localhost:5000/v1',
    description: 'Gradio web UI for Large Language Models (oobabooga).',
    cliCommand: 'python server.py --api --api-port 5000 --listen',
    setupInstructions: [
      'Clone repo: git clone https://github.com/oobabooga/text-generation-webui',
      'Launch server with --api flag: python server.py --api --api-port 5000',
      'OpenAI endpoint available at http://localhost:5000/v1',
    ],
    docsUrl: 'https://github.com/oobabooga/text-generation-webui/wiki/12-%E2%80%90-OpenAI-API',
    defaultModel: 'text-webui-model',
  },
  {
    id: 'llamacpp',
    name: 'Llama.cpp Server',
    defaultPort: 8080,
    baseUrl: 'http://localhost:8080/v1',
    description: 'Lightweight C/C++ native LLM inference engine binary.',
    cliCommand: './llama-server -m models/llama-3.gguf --port 8080 -c 4096 --host 0.0.0.0',
    setupInstructions: [
      'Build or download llama-server binary.',
      'Run command: ./llama-server -m your_model.gguf --port 8080',
      'Connect to http://localhost:8080/v1',
    ],
    docsUrl: 'https://github.com/ggerganov/llama.cpp/tree/master/examples/server',
    defaultModel: 'llama-cpp-model',
  },
];

export function LocalModelsPanel() {
  const { providers, refreshProviders } = useProviderContext();
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string }>>({});
  const [addingId, setAddingId] = useState<string | null>(null);

  const isInstalled = (id: string) => {
    return providers.some((p) => p.profile?.id === id);
  };

  const handleTestConnection = async (engine: LocalEngineSpec) => {
    setTestingId(engine.id);
    try {
      const res = await fetch(`/api/providers/diagnostics?providerId=${engine.id}`);
      const data = await res.json();
      if (data.success && data.diagnostics) {
        setTestResults((prev) => ({
          ...prev,
          [engine.id]: {
            success: data.diagnostics.status === 'online',
            message: `Status: ${data.diagnostics.status.toUpperCase()} (${data.diagnostics.latencyMs}ms)`,
          },
        }));
      } else {
        setTestResults((prev) => ({
          ...prev,
          [engine.id]: {
            success: false,
            message: 'Server not reachable on default port.',
          },
        }));
      }
    } catch (err: any) {
      setTestResults((prev) => ({
        ...prev,
        [engine.id]: {
          success: false,
          message: 'Connection failed. Check if local server is running.',
        },
      }));
    } finally {
      setTestingId(null);
    }
  };

  const handleAddLocalProvider = async (engine: LocalEngineSpec) => {
    setAddingId(engine.id);
    try {
      const profile = {
        id: engine.id,
        name: engine.name,
        category: 'local',
        description: engine.description,
        website: engine.baseUrl,
        documentation: engine.docsUrl,
        apiBaseUrl: engine.baseUrl,
        authType: 'none',
        defaultModel: engine.defaultModel,
        status: 'online',
      };

      await fetch('/api/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile }),
      });
      await refreshProviders();
    } catch (err) {
      console.error('Failed to add local provider:', err);
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <InfoPanel 
        title="Local AI Models (Ollama, LM Studio)"
        purpose="Use this section to set up local LLM inference on your own machine. Running models locally is entirely free, requires no internet connection, and guarantees absolute data privacy since the AI runs strictly on your hardware."
        example="1. Download Ollama onto your PC. 2. Copy the 'ollama run llama3' command from the card below and run it in your terminal. 3. Return to the Dashboard V2 and use the Local Models provider profile to start chatting with your free local AI!"
        nextStep="playground_v2"
      />
      
      <div className="bg-card p-4 border rounded-lg shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="font-bold text-base flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-emerald-600" /> Offline Local Models Setup & Documentation Guide
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Step-by-step setup guides, terminal launch commands, and 1-click integration for offline LLM engines.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {LOCAL_ENGINES.map((engine) => {
          const installed = isInstalled(engine.id);
          const result = testResults[engine.id];

          return (
            <Card key={engine.id} className="border shadow-sm flex flex-col justify-between">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-emerald-600" /> {engine.name}
                  </CardTitle>
                  <Badge variant="secondary" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                    Local Port {engine.defaultPort}
                  </Badge>
                </div>
                <CardDescription className="text-xs mt-1">{engine.description}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 text-xs pt-1">
                {/* CLI Command Box */}
                <div className="space-y-1">
                  <div className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1">
                    <Terminal className="w-3 h-3 text-slate-500" /> Quick Launch Command
                  </div>
                  <div className="p-2 bg-slate-900 text-slate-100 font-mono text-[11px] rounded border select-all overflow-x-auto">
                    {engine.cliCommand}
                  </div>
                </div>

                {/* Setup Instructions */}
                <div className="space-y-1">
                  <div className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1">
                    <BookOpen className="w-3 h-3 text-blue-500" /> Setup & CORS Configuration
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] text-muted-foreground bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded border">
                    {engine.setupInstructions.map((step, idx) => (
                      <li key={idx} className="leading-snug">{step}</li>
                    ))}
                  </ol>
                </div>

                {/* Base URL */}
                <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t">
                  <span>API Base URL:</span>
                  <span className="font-mono font-semibold text-foreground">{engine.baseUrl}</span>
                </div>

                {/* Test Result Indicator */}
                {result && (
                  <div
                    className={`p-2 text-[11px] rounded flex items-center gap-2 font-medium ${
                      result.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {result.success ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" /> : <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                    <span>{result.message}</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-2 border-t gap-2">
                  <a
                    href={engine.docsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-600 flex items-center gap-1 hover:underline"
                  >
                    Documentation <ExternalLink className="w-3 h-3" />
                  </a>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1"
                      onClick={() => handleTestConnection(engine)}
                      disabled={testingId === engine.id}
                    >
                      <Play className={`w-3 h-3 ${testingId === engine.id ? 'animate-spin' : ''}`} />
                      {testingId === engine.id ? 'Testing...' : 'Test Connection'}
                    </Button>

                    <Button
                      size="sm"
                      className="h-7 text-xs gap-1"
                      variant={installed ? 'outline' : 'default'}
                      onClick={() => handleAddLocalProvider(engine)}
                      disabled={addingId === engine.id || installed}
                    >
                      {installed ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-green-600" /> Active
                        </>
                      ) : (
                        <>
                          <Plus className="w-3 h-3" /> {addingId === engine.id ? 'Adding...' : 'Add Provider'}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
