"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag, Download, ExternalLink, Check, Sparkles } from 'lucide-react';
import { useProviderContext } from '@/context/ProviderContext';
import { InfoPanel } from './settings/info-panel';

const MARKETPLACE_CATALOG = [
  {
    id: 'nvidia',
    name: 'NVIDIA NIM Engine',
    category: 'official',
    author: 'NVIDIA Inc.',
    version: '2.0.0',
    description: 'Enterprise GPU accelerated AI inference microservices for LLMs & vision models.',
    website: 'https://build.nvidia.com',
    documentation: 'https://docs.nvidia.com/nim/',
    apiBaseUrl: 'https://integrate.api.nvidia.com/v1',
    defaultModel: 'nvidia/neva-22b',
  },
  {
    id: 'github',
    name: 'GitHub Copilot & Models',
    category: 'official',
    author: 'GitHub / Microsoft',
    version: '1.8.0',
    description: 'Access GitHub Copilot models & Azure AI models with developer API keys.',
    website: 'https://github.com/marketplace/models',
    documentation: 'https://docs.github.com/en/github-models',
    apiBaseUrl: 'https://models.inference.ai.azure.com',
    defaultModel: 'gpt-4o',
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    category: 'official',
    author: 'Anthropic',
    version: '3.5.0',
    description: 'State-of-the-art reasoning, code generation, and complex analysis (Claude 3.5 Sonnet & Haiku).',
    website: 'https://anthropic.com',
    documentation: 'https://docs.anthropic.com',
    apiBaseUrl: 'https://api.anthropic.com/v1',
    defaultModel: 'claude-3-5-sonnet-20241022',
  },
  {
    id: 'perplexity',
    name: 'Perplexity AI Search Engine',
    category: 'official',
    author: 'Perplexity',
    version: '1.3.0',
    description: 'Real-time live web search augmented LLM generation engine (sonar-pro, sonar-reasoning).',
    website: 'https://perplexity.ai',
    documentation: 'https://docs.perplexity.ai',
    apiBaseUrl: 'https://api.perplexity.ai',
    defaultModel: 'sonar-pro',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek AI Engine',
    category: 'community',
    author: 'DeepSeek',
    version: '2.1.0',
    description: 'Ultra-low cost high intelligence open reasoning LLMs (DeepSeek-V3 & DeepSeek-R1).',
    website: 'https://deepseek.com',
    documentation: 'https://platform.deepseek.com/docs',
    apiBaseUrl: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
  },
  {
    id: 'mistral',
    name: 'Mistral AI Engine',
    category: 'official',
    author: 'Mistral AI',
    version: '1.5.0',
    description: 'European frontier open-weight & commercial LLMs (Mistral Large, Codestral, Pixtral).',
    website: 'https://mistral.ai',
    documentation: 'https://docs.mistral.ai',
    apiBaseUrl: 'https://api.mistral.ai/v1',
    defaultModel: 'mistral-large-latest',
  },
  {
    id: 'cohere',
    name: 'Cohere Command R+',
    category: 'official',
    author: 'Cohere',
    version: '2.0.1',
    description: 'Enterprise RAG, multi-step tool use, and multilingual AI models.',
    website: 'https://cohere.com',
    documentation: 'https://docs.cohere.com',
    apiBaseUrl: 'https://api.cohere.com/v2',
    defaultModel: 'command-r-plus',
  },
  {
    id: 'groq',
    name: 'Groq LPU Engine',
    category: 'community',
    author: 'Groq Inc.',
    version: '1.2.0',
    description: 'Ultra-high speed open model inference (Llama 3.3 70B, Mixtral 8x7B) up to 800 tokens/sec.',
    website: 'https://groq.com',
    documentation: 'https://console.groq.com/docs',
    apiBaseUrl: 'https://api.groq.com/openai/v1',
    defaultModel: 'llama-3.3-70b-versatile',
  },
  {
    id: 'cloudflare',
    name: 'Cloudflare Workers AI',
    category: 'community',
    author: 'Cloudflare',
    version: '1.0.4',
    description: 'Serverless global GPU inference network running open-weights LLMs at the edge.',
    website: 'https://ai.cloudflare.com',
    documentation: 'https://developers.cloudflare.com/workers-ai/',
    apiBaseUrl: 'https://api.cloudflare.com/client/v4/accounts/v1',
    defaultModel: '@cf/meta/llama-3.3-70b-instruct',
  },
  {
    id: 'together',
    name: 'Together AI Engine',
    category: 'community',
    author: 'Together.ai',
    version: '2.1.0',
    description: 'Fast cloud inference and fine-tuning engine for open source models.',
    website: 'https://together.ai',
    documentation: 'https://docs.together.ai',
    apiBaseUrl: 'https://api.together.xyz/v1',
    defaultModel: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
  },
  {
    id: 'cerebras',
    name: 'Cerebras Wafer-Scale AI',
    category: 'community',
    author: 'Cerebras Systems',
    version: '1.0.0',
    description: 'World fastest LLM inference on Wafer-Scale Engines (2,000+ tokens/sec).',
    website: 'https://cerebras.ai',
    documentation: 'https://inference-docs.cerebras.ai',
    apiBaseUrl: 'https://api.cerebras.ai/v1',
    defaultModel: 'llama3.1-70b',
  },
  {
    id: 'sambanova',
    name: 'SambaNova Systems',
    category: 'community',
    author: 'SambaNova',
    version: '1.1.0',
    description: 'Full precision 405B & 70B Llama inference on Reconfigurable Dataflow Units.',
    website: 'https://sambanova.ai',
    documentation: 'https://docs.sambanova.ai',
    apiBaseUrl: 'https://api.sambanova.ai/v1',
    defaultModel: 'Meta-Llama-3.3-70B-Instruct',
  },
  {
    id: 'deepinfra',
    name: 'DeepInfra Engine',
    category: 'community',
    author: 'DeepInfra',
    version: '1.1.0',
    description: 'Scalable machine learning inference infrastructure for LLMs and vision models.',
    website: 'https://deepinfra.com',
    documentation: 'https://deepinfra.com/docs',
    apiBaseUrl: 'https://api.deepinfra.com/v1/openai',
    defaultModel: 'meta-llama/Llama-3.3-70B-Instruct',
  },
  {
    id: 'replicate',
    name: 'Replicate Cloud Models',
    category: 'community',
    author: 'Replicate',
    version: '1.0.0',
    description: 'Run thousands of open-source models with a simple HTTP API.',
    website: 'https://replicate.com',
    documentation: 'https://replicate.com/docs',
    apiBaseUrl: 'https://api.replicate.com/v1',
    defaultModel: 'meta/llama-2-70b-chat',
  },
];

export function MarketplacePanel() {
  const { providers, refreshProviders } = useProviderContext();
  const [installingId, setInstallingId] = useState<string | null>(null);

  const isInstalled = (id: string) => {
    return providers.some((p) => p.profile?.id === id);
  };

  const handleInstall = async (item: any) => {
    setInstallingId(item.id);
    try {
      const sampleSpec = {
        id: item.id,
        name: item.name,
        category: item.category,
        description: item.description,
        website: item.website,
        documentation: item.documentation,
        apiBaseUrl: item.apiBaseUrl || (item.website ? `${item.website}/v1` : 'https://api.example.com/v1'),
        defaultModel: item.defaultModel || `${item.id}-default-model`,
        version: item.version,
        author: item.author,
      };

      await fetch('/api/providers/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'local_json', data: sampleSpec }),
      });
      await refreshProviders();
    } catch (err) {
      console.error('Marketplace installation error:', err);
    } finally {
      setInstallingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <InfoPanel 
        title="AI Provider Marketplace"
        purpose="This marketplace gives you 1-click access to massive open-source and commercial AI engines that aren't natively supported yet. When you install an engine, it automatically downloads its configuration profile and prepares it for API key integration."
        example="Want to use DeepSeek or NVIDIA NIM? Just click 'Install' here. The system will create a new profile for that provider in your Dashboard. You can then go to your Dashboard, add your NVIDIA/DeepSeek API key, and start routing requests to it immediately!"
        nextStep="local_models"
      />
      <div className="bg-card p-4 border rounded-lg shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="font-bold text-base flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-purple-600" /> Famous AI Provider Marketplace
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Discover and 1-click install official & community LLM provider packages (NVIDIA, GitHub Copilot, Anthropic, Perplexity, DeepSeek, Groq, Cerebras).
          </p>
        </div>
        <Badge className="bg-purple-100 text-purple-800 border-purple-200 gap-1 text-xs px-3 py-1">
          <Sparkles className="w-3.5 h-3.5" /> 14 Premium Engines
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {MARKETPLACE_CATALOG.map((item) => {
          const installed = isInstalled(item.id);
          return (
            <Card key={item.id} className="border shadow-sm flex flex-col justify-between">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    {item.name}
                  </CardTitle>
                  <Badge variant="outline" className="text-[10px] capitalize">
                    {item.category}
                  </Badge>
                </div>
                <CardDescription className="text-xs mt-1 line-clamp-2">{item.description}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-3 text-xs pt-1 mt-auto">
                {installed && (
                  <Badge className="bg-green-100 text-green-800 text-[10px] w-fit">
                    <Check className="w-3 h-3 mr-1" /> Installed in Ecosystem
                  </Badge>
                )}

                <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t">
                  <span>Author: {item.author}</span>
                  <span>v{item.version}</span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <a
                    href={item.documentation}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-600 flex items-center gap-1 hover:underline"
                  >
                    Docs <ExternalLink className="w-3 h-3" />
                  </a>

                  <Button
                    size="sm"
                    className="h-7 text-xs gap-1"
                    variant={installed ? 'outline' : 'default'}
                    onClick={() => handleInstall(item)}
                    disabled={installingId === item.id || installed}
                  >
                    {installed ? (
                      <>
                        <Check className="w-3 h-3 text-green-600" /> Ready
                      </>
                    ) : (
                      <>
                        <Download className="w-3 h-3" /> {installingId === item.id ? 'Installing...' : 'Install Provider'}
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
