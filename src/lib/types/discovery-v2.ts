export type DiscoveryV2Stage = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface AILogEntry {
  id: string;
  provider: string;
  model: string;
  timestamp: string;
  durationMs: number;
  tokens: { prompt: number; completion: number; total: number; estimatedCost?: number };
  success: boolean;
  errorMessage?: string;
  action: string;
}

export interface V2Channel {
  id: string;
  channelId: string;
  title: string;
  thumbnail: string;
  subscriberCount: string;
  videoCount: string;
  viewCount: string;
  lastUploadDate?: string;
  description: string;
  isVerified?: boolean;
  customUrl?: string;
  similarityScore?: number; // For step 2
  matchExplanation?: string;
}

export interface V2Video {
  id: string;
  videoId: string;
  title: string;
  thumbnail: string;
  viewCount: string;
  publishedAt: string;
  duration?: string;
  channelId: string;
  channelTitle: string;
  outlierScore?: number; // Step 3
  similarityScore?: number; // Step 4
  matchExplanation?: string; // Step 4
  tags: string[]; // Step 5
  transcriptStatus: "Available" | "Missing" | "AI Transcript" | "Manual Upload" | "Ready for Analysis" | "Analysis Complete";
  transcriptText?: string;
}

export interface IntelligenceReport {
  videoId: string;
  confidenceScore: number; // Overall
  sections: {
    name: string;
    content: string;
    confidenceScore: number;
  }[];
}

export interface MasterBlueprint {
  confidenceScore: number;
  sections: {
    name: string;
    content: string;
    confidenceScore: number;
  }[];
}

export interface GeneratedPrompt {
  id: string;
  type: string; // "Title", "Hook", "Script", etc.
  content: string;
}

export interface DiscoveryV2State {
  version: number;
  projectName: string;
  currentStage: DiscoveryV2Stage;
  searchHistory: string[];
  aiLogs: AILogEntry[];
  
  // Data
  seedChannels: V2Channel[];
  similarChannels: V2Channel[];
  outlierVideos: V2Video[];
  conceptMatchedVideos: V2Video[];
  workspaceItems: V2Video[]; // Unified workspace
  
  // Reports
  reports: Record<string, IntelligenceReport>;
  masterBlueprint: MasterBlueprint | null;
  generatedPrompts: GeneratedPrompt[];
}

export const INITIAL_STATE: DiscoveryV2State = {
  version: 1,
  projectName: "Untitled Research Project",
  currentStage: 1,
  searchHistory: [],
  aiLogs: [],
  seedChannels: [],
  similarChannels: [],
  outlierVideos: [],
  conceptMatchedVideos: [],
  workspaceItems: [],
  reports: {},
  masterBlueprint: null,
  generatedPrompts: []
};

export interface ConceptFingerprint {
  topic: string;
  coreConcept: string;
  coreIntent: string;
  audience: string;
  angles: string[];
  keywords: string[];
}

export interface ConceptSaturation {
  totalResults: number;
  averageViews: number;
  topChannels: string[];
}

export interface ConceptMatchData {
  fingerprint: ConceptFingerprint;
  whyMatched: string[];
  saturation?: ConceptSaturation;
}
