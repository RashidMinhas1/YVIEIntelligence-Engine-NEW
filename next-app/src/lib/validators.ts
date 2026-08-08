import { z } from "zod";

export const FetchCompetitorVideosBody = z.object({
  competitors: z.array(z.string()).min(1).max(3),
  youtubeApiKey: z.string().nullish(),
  limit: z.number().optional(),
});

export const GetVideosQueryParams = z.object({
  competitor: z.coerce.string().optional(),
});

export const AnalyzeTitlesBody = z.object({
  titles: z.array(z.string()),
  outputMode: z.enum(["docs", "text"]),
  customPrompt: z.string().nullish(),
});

export const GenerateTitlesBody = z.object({
  analysis: z.string(),
  niche: z.string().nullish(),
  outputMode: z.enum(["docs", "text"]),
  customGeneratePrompt: z.string().nullish(),
  libraryFormat: z.string().nullish(),
  limit: z.number().optional(),
});

export const AnalyzeScriptBody = z.object({
  script: z.string(),
  outputMode: z.enum(["docs", "text"]),
});

export const GenerateScriptBody = z.object({
  title: z.string(),
  scriptAnalysis: z.string().nullish(),
  targetWordCountMode: z.string().optional(),
  targetWordCount: z.number().nullish(),
  outputMode: z.enum(["docs", "text"]),
});

export const SaveTitleFormatBody = z.object({
  name: z.string().min(1),
  pattern: z.string().min(1),
  description: z.string().nullish(),
  originalTitle: z.string().nullish(),
  generatedTitle: z.string().nullish(),
  psychology: z.string().nullish(),
  formula: z.string().nullish(),
  hookType: z.string().nullish(),
  emotionalTrigger: z.string().nullish(),
  providerUsed: z.string().nullish(),
});

export const SaveVideoIdeaBody = z.object({
  name: z.string().min(1),
  selectedTitleFormatId: z.string().nullish(),
  editedTitle: z.string().nullish(),
  selectedScriptFormatId: z.string().nullish(),
  editedScript: z.string().nullish(),
  notes: z.string().nullish(),
  metadata: z.record(z.unknown()).nullish(),
});

export const SaveLibraryFolderBody = z.object({
  name: z.string().min(1),
  section: z.enum(["video_ideas", "titles", "scripts", "hooks", "ctas", "thumbnails", "reports"]),
});

export const SaveLibraryItemBody = z.object({
  folderId: z.string().nullish(),
  type: z.string(),
  title: z.string().min(1),
  content: z.record(z.unknown()),
  summary: z.string().nullish(),
  metadata: z.record(z.unknown()).nullish(),
  tags: z.array(z.string()).nullish(),
  updateAction: z.boolean().optional(),
});

export const AuthLoginBody = z.object({
  password: z.string().min(1),
});

export const CustomProviderConfigSchema = z.object({
  providerType: z.enum(["openai", "gemini", "openrouter", "openai-compatible", "ollama", "lmstudio", "vllm", "custom"]),
  displayName: z.string().optional(),
  description: z.string().optional(),
  isEnabled: z.boolean().optional(),
  priority: z.number().optional(),
  
  baseUrl: z.string().optional().or(z.literal("")),
  apiKey: z.string().optional(),
  apiKeys: z.array(z.string()).optional(),
  organizationId: z.string().optional(),
  projectId: z.string().optional(),
  region: z.string().optional(),
  authMethod: z.enum(["bearer", "api-key-header", "basic", "custom", "none"]).optional(),
  headers: z.record(z.string()).optional(),

  healthEndpoint: z.string().optional(),
  modelsEndpoint: z.string().optional(),

  defaultModel: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().min(1).optional(),
  timeout: z.number().min(1000).optional(),
  retryCount: z.number().min(0).max(10).optional(),
  rateLimit: z.number().optional(),
  loadBalancingStrategy: z.enum(["round_robin", "least_latency", "least_errors", "weighted"]).optional(),
  
  streamingSupported: z.boolean().optional(),
  visionSupported: z.boolean().optional(),
  embeddingSupported: z.boolean().optional(),
  imageSupported: z.boolean().optional(),
  audioSupported: z.boolean().optional(),
  functionCalling: z.boolean().optional(),
  jsonMode: z.boolean().optional(),
  reasoningModels: z.boolean().optional(),

  notes: z.string().optional(),
});

export const FeatureModelOverrideSchema = z.object({
  profileId: z.string().optional(),
  provider: z.string().optional(),
  model: z.string().optional(),
  apiKeys: z.array(z.string()).optional(),
  temperature: z.number().optional(),
  maxTokens: z.number().optional(),
  timeout: z.number().optional(),
  retryCount: z.number().optional(),
  streaming: z.boolean().optional(),
  jsonMode: z.boolean().optional(),
  visionMode: z.boolean().optional(),
  loadBalancingStrategy: z.enum(["round_robin", "least_latency", "least_errors", "weighted"]).optional(),
  isLocalOverrideEnabled: z.boolean().optional(),
});

export const AISettingsSchema = z.object({
  activeProvider: z.string().optional(),
  providers: z.record(z.string(), CustomProviderConfigSchema).optional(),
  features: z.record(z.string(), FeatureModelOverrideSchema).optional(),
});

export const AITestConnectionSchema = z.object({
  provider: z.string(),
  config: CustomProviderConfigSchema,
});
