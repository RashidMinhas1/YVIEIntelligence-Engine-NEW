import { ProviderTemplate } from './types';

export const localTemplates: ProviderTemplate[] = [
  {
    templateId: 'ollama',
    name: 'Ollama',
    category: 'local',
    description: 'Local GPU/CPU inference engine for open models',
    apiBaseUrl: 'http://localhost:11434/v1',
    websiteUrl: 'https://ollama.com',
    docsUrl: 'https://ollama.com',
    authType: 'none',
    requiresApiKey: false,
    defaultModels: ['llama3.1:latest', 'mistral:latest', 'gemma:latest']
  },
  {
    templateId: 'lm_studio',
    name: 'LM Studio',
    category: 'local',
    description: 'Local desktop server running GGUF models',
    apiBaseUrl: 'http://localhost:1234/v1',
    websiteUrl: 'https://lmstudio.ai',
    docsUrl: 'https://lmstudio.ai',
    authType: 'none',
    requiresApiKey: false,
    defaultModels: ['local-model']
  },
  {
    templateId: 'vllm_local',
    name: 'vLLM (Local)',
    category: 'local',
    description: 'High-throughput local LLM serving engine',
    apiBaseUrl: 'http://localhost:8000/v1',
    websiteUrl: 'https://vllm.ai',
    docsUrl: 'https://docs.vllm.ai',
    authType: 'none',
    requiresApiKey: false,
    defaultModels: ['vllm-model']
  },
  {
    templateId: 'localai',
    name: 'LocalAI',
    category: 'local',
    description: 'Drop-in replacement for OpenAI API running locally',
    apiBaseUrl: 'http://localhost:8080/v1',
    websiteUrl: 'https://localai.io',
    docsUrl: 'https://localai.io/docs/',
    authType: 'none',
    requiresApiKey: false,
    defaultModels: ['ggml-gpt4all-j']
  },
  {
    templateId: 'text_gen_webui',
    name: 'Text Generation WebUI',
    category: 'local',
    description: 'Gradio web UI for Large Language Models',
    apiBaseUrl: 'http://127.0.0.1:5000/v1',
    websiteUrl: 'https://github.com/oobabooga/text-generation-webui',
    docsUrl: 'https://github.com/oobabooga/text-generation-webui/wiki',
    authType: 'none',
    requiresApiKey: false,
    defaultModels: ['loaded-model']
  },
  {
    templateId: 'koboldcpp',
    name: 'KoboldCpp',
    category: 'local',
    description: 'A simple one-file way to run various GGML/GGUF models',
    apiBaseUrl: 'http://localhost:5001/v1',
    websiteUrl: 'https://github.com/LostRuins/koboldcpp',
    docsUrl: 'https://github.com/LostRuins/koboldcpp/wiki',
    authType: 'none',
    requiresApiKey: false,
    defaultModels: ['koboldcpp-model']
  },
  {
    templateId: 'llama_cpp',
    name: 'llama.cpp Server',
    category: 'local',
    description: 'Built-in HTTP server for llama.cpp',
    apiBaseUrl: 'http://localhost:8080/v1',
    websiteUrl: 'https://github.com/ggerganov/llama.cpp',
    docsUrl: 'https://github.com/ggerganov/llama.cpp/tree/master/examples/server',
    authType: 'none',
    requiresApiKey: false,
    defaultModels: ['llama-cpp-model']
  },
  {
    templateId: 'jan_ai',
    name: 'Jan AI',
    category: 'local',
    description: 'Open source alternative to ChatGPT that runs 100% offline',
    apiBaseUrl: 'http://localhost:1337/v1',
    websiteUrl: 'https://jan.ai',
    docsUrl: 'https://jan.ai/docs',
    authType: 'none',
    requiresApiKey: false,
    defaultModels: ['jan-model']
  },
  {
    templateId: 'anythingllm',
    name: 'AnythingLLM',
    category: 'local',
    description: 'The all-in-one Desktop & Docker AI application',
    apiBaseUrl: 'http://localhost:3001/api/v1/openai',
    websiteUrl: 'https://useanything.com',
    docsUrl: 'https://docs.useanything.com',
    authType: 'bearer',
    requiresApiKey: true,
    defaultModels: ['anything-llm-workspace']
  },
  {
    templateId: 'open_webui',
    name: 'Open WebUI',
    category: 'local',
    description: 'User-friendly WebUI for LLMs',
    apiBaseUrl: 'http://localhost:3000/api',
    websiteUrl: 'https://openwebui.com',
    docsUrl: 'https://docs.openwebui.com',
    authType: 'bearer',
    requiresApiKey: true,
    defaultModels: ['open-webui-model']
  }
];
