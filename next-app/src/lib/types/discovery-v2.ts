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
  // Robust channel output format
  banner?: string;
  verified?: boolean;
  publishedAt?: string;
  country?: string;
  language?: string;
  primaryNiche?: string;
  subNiche?: string;
  viewerIntent?: string;
  averageViews?: number;
  performanceRatio?: number;
  outlierScore?: number;
  growthStatus?: string;
  evidence?: string[];
  // Step 2 AI Sub-scores
  topicMatchScore?: number;
  intentMatchScore?: number;
  audienceMatchScore?: number;
  contentStyleMatchScore?: number;
  storytellingMatchScore?: number;
  titleFormulaMatchScore?: number;

  // Calculated Metrics
  uploadFrequency?: string; // Daily, Weekly, etc.
  channelAgeMonths?: number;
  contentType?: string; // Shorts Only, Long-form Only, Mixed
  viewsPerSubRatio?: number;
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
  
  // Step 3 Outlier Metrics
  likeCount?: string;
  commentCount?: string;
  outlierScore?: number;
  outlierScoreAvg?: number; // Views vs Avg Channel Views
  outlierScoreSubs?: number; // Views vs Subs
  videoType?: string; // Shorts or Long
  estimatedGrowthTrend?: string;
  viewsPerSubRatio?: number;
  averageChannelViews?: number;

  // Step 3 AI Insights
  whyOutlier?: string;
  whyOutperformed?: string;
  mainTopic?: string;
  primaryIntent?: string;
  targetAudience?: string;
  hookType?: string;
  contentStyle?: string;
  
  similarityScore?: number; // Step 4
  matchExplanation?: string; // Step 4
  tags: string[]; // Step 5
  transcriptStatus: "Available" | "Missing" | "AI Transcript" | "Manual Upload" | "Ready for Analysis" | "Analysis Complete";
  transcriptText?: string;
  advancedResearch?: AdvancedVideoResearch;

  // Dashboard Score Fields
  viralityScore?: number;
  researchPriorityScore?: number;
  opportunityScore?: number;
  competitionBadge?: "Low" | "Medium" | "High";
  trendBadge?: "Emerging" | "Growing" | "Peak" | "Declining" | "Stable";
  conceptMatchData?: ConceptMatchData;
}

export interface DashboardSummaryData {
  totalChannels: number;
  totalVideos: number;
  totalOutliers: number;
  highOpportunityConcepts: number;
  growingTrends: number;
  highCompetitionConcepts: number;
  lowCompetitionConcepts: number;
  avgOutlierScore: number;
  avgViralityScore: number;
  avgResearchPriorityScore: number;
  aiExecutiveSummary: string;
}

export interface AdvancedVideoResearch {
  saturation: {
    level: "Low Saturation" | "Medium Saturation" | "High Saturation";
    matchCount: number;
    channelCount: number;
    highestPerformingVersionId?: string;
    avgViews: number;
    trendDirection: "Growing" | "Stable" | "Declining";
    opportunityScore: number; // 0 - 100
    aiSummary: string;
  };
  firstMover: {
    firstCreator: string;
    firstUploadDate: string;
    firstVideoId?: string;
    highestVersionCreator: string;
    highestVideoId?: string;
    latestVersionCreator: string;
    totalChannels: number;
  };
  lifecycleTimeline: {
    stage: string; // e.g. "Jan 2025 -> First Upload"
    description?: string;
    channelTitle?: string;
    videoTitle?: string;
    videoId?: string;
    publishDate?: string;
    thumbnail?: string;
    packaging?: string;
    hook?: string;
    multiplier?: string;
  }[];
  contentGap: {
    opportunityLevel: "Low" | "Medium" | "High";
    suggestedAngle: string;
    suggestedAudience: string;
    suggestedImprovement: string;
    missingElements?: string[];
    editingStyle?: string;
  };
  trendStage: {
    stage: "Emerging" | "Growing" | "Peak" | "Declining" | "Dead";
    explanation: string;
  };
  competition: {
    level: "Low Competition" | "Medium Competition" | "High Competition";
    explanation: string;
  };
  difficulty: {
    level: "Beginner" | "Intermediate" | "Advanced";
    explanation: string;
  };
  cloneRisk: {
    level: "Low Risk" | "Medium Risk" | "High Risk";
    explanation: string;
  };
  opportunitySummary: {
    strengths: string;
    weaknesses: string;
    demandGrowing: boolean;
    isEvergreen: boolean;
  };
  actionCenter: {
    recommendation: "Create Immediately" | "Create with Improvements" | "Wait" | "Avoid";
    reason: string;
    opportunityLevel: string;
    riskLevel: string;
    expectedPotential: string;
    suggestedNextStep: string;
    confidenceScore: number;
  };
  generatedIdeas?: {
    ideas: {
      id: string;
      title: string;
      angle: string;
      hook: string;
      thumbnailConcept: string;
      difficulty: 'Easy' | 'Medium' | 'Hard';
      targetEmotion: string;
    }[];
    analysis: {
      coreIntent: string;
      whyOriginalWorked: string;
    };
  };
}

// ========== TIMELINE ENGINE TYPES ==========

export interface TimelineSimilarityScore {
  overall: number;
  topic: number;
  intent: number;
  story: number;
  audience: number;
  format: number;
  hook: number;
  thumbnail: number;
  narrative: number;
}

export interface TimelineConfidence {
  ai: 'High' | 'Medium' | 'Low';
  semantic: 'High' | 'Medium' | 'Low';
  timeline: 'High' | 'Medium' | 'Low';
  search: 'High' | 'Medium' | 'Low';
  composite: number;
}

export interface AIExplainability {
  reasons: {
    factor: string;
    score: number;
    explanation: string;
  }[];
  summary: string;
}

export type PerformanceGroup = '🔥 Explosive' | '🚀 Viral' | '📈 Above Average' | '➖ Average' | '📉 Underperformed' | '💀 Dead';

export type ConceptLifecycle = 'Emerging' | 'Growing' | 'Maturing' | 'Mature' | 'Declining' | 'Dead';

export type VersionLabel = 'Original Concept' | 'Earliest Known Version' | 'Improved Version' | 'Alternative Angle' | 'Trend Adaptation' | 'Evergreen' | 'Updated' | 'Beginner' | 'Advanced';

export interface TimelineEntry {
  videoId: string;
  channelId: string;
  channelName: string;
  channelLink: string;
  channelThumbnail?: string;
  title: string;
  thumbnail: string;
  publishDate: string;
  timeSinceUpload: string;
  views: number;
  likes: number;
  comments: number;
  language: string;
  country: string;
  duration: string;
  subscriberCount: number;
  similarity: TimelineSimilarityScore;
  confidence: TimelineConfidence;
  aiExplainability: AIExplainability;
  performanceGroup: PerformanceGroup;
  versionLabel: VersionLabel;
  contentAnalysis: {
    hook: string;
    thumbnailFormula: string;
    titleFormula: string;
    storyStructure: string;
    editingStyle: string;
    cta: string;
    retentionPattern: string;
    estimatedAVD: string;
    patternInterrupts: string;
    emotionalTriggers: string;
    curiosityGap: string;
    uniqueSellingPoint: string;
  };
  evolutionCompare: {
    whatChanged: string;
    whatImproved: string;
    whatWorse: string;
    whyPerformanceImpact: string;
  };
  metrics: {
    viewsPerHour: string;
    viewsPerDay: string;
    audienceRetention: string;
    ctr: string;
    engagementRate: string;
  };
  videoLink: string;
  isDuplicate?: boolean;
  duplicateGroupId?: string;
}

export interface PerformanceGroupSummary {
  group: PerformanceGroup;
  totalVideos: number;
  avgViews: number;
  avgEngagement: number;
  growthTrend: string;
  entries: TimelineEntry[];
}

export interface DuplicateGroup {
  id: string;
  primaryEntry: TimelineEntry;
  duplicates: TimelineEntry[];
  reason: string;
}

export interface ConceptEvolutionSummary {
  totalMajorVersions: number;
  conceptAge: string;
  biggestImprovements: string[];
  majorShifts: string[];
  notableTrends: string[];
  narrative: string;
}

export interface OpportunityAnalysis {
  opportunityScore: number;
  saturationLevel: string;
  trendPrediction: string;
  conceptLifecycle: ConceptLifecycle;
  missingOpportunities: string[];
  competitionDensity: number;
}

export interface TimelineAnalysisResult {
  originLabel: string;
  entries: TimelineEntry[];
  performanceGroups: PerformanceGroupSummary[];
  duplicateGroups: DuplicateGroup[];
  evolutionSummary: ConceptEvolutionSummary;
  opportunity: OpportunityAnalysis;
  conceptHistory: {
    firstMover: string;
    firstMoverTitle: string;
    firstMoverLink: string;
    originality: string;
    viralInstigator: string;
    bestImprover: string;
    strongestVersionOwner: string;
    historySummary: string;
  };
  saturation: {
    totalChannels: number;
    totalVideos: number;
    languagesCovered: string[];
    uploadFrequency: string;
    competitionLevel: string;
    saturationLevel: string;
    explanation: string;
  };
  contentGaps: {
    missingAngles: string;
    missingAudience: string;
    missingQuestions: string;
    missingCaseStudies: string;
    missingHooks: string;
    missingCTA: string;
  };
  finalRecommendations: {
    hookSuggestions: string;
    titleDirection: string;
    thumbnailDirection: string;
    uniqueAngle: string;
    audienceExpectations: string;
  };
  metadata: {
    searchLimit: number;
    similarityThreshold: number;
    aiModelUsed: string;
    analysisTimestamp: string;
    totalPagesSearched: number;
    totalCandidatesFound: number;
    totalAfterFiltering: number;
  };
}

export interface ResearchSessionSnapshot {
  id: string;
  projectName: string;
  selectedVideo: {
    videoId: string;
    title: string;
    channelTitle: string;
    viewCount: string;
    publishedAt: string;
    thumbnail: string;
  };
  channelInfo: {
    channelId: string;
    channelTitle: string;
    subscriberCount: string;
  };
  appliedFilters: {
    similarityThreshold: number;
    searchLimit: number;
    performanceFilter: string;
    sortBy: string;
  };
  timelineResult: TimelineAnalysisResult;
  timestamp: string;
  aiModelUsed: string;
  version: number;
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

export interface ConceptFingerprint {
  topic: string;
  coreConcept: string;
  coreIntent: string;
  problemBeingSolved: string;
  targetAudience: string;
  mainAngle: string;
  secondaryAngle?: string;
  storyPremise: string;
  keyEntities: string[];
  keywords: string[];
  synonyms: string[];
  relatedTerms: string[];
  localizedTerms: string[];
  importantPhrases: string[];
  emotionalTrigger: string;
  curiosityMechanism: string;
  contentFormat: string;
  contentCategory: string;
}

export interface ConceptMatchData {
  sourceVideoId: string;
  sourceVideoTitle: string;
  sourceChannelId: string;
  sourceChannelName: string;
  
  matchCategory: "Strong Concept Match" | "Related Concept" | "Alternative Angle" | "Low Confidence";
  
  scores: {
    topic: number;
    intent: number;
    concept: number;
    angle: number;
    audience: number;
    problem: number;
    story: number;
    overall: number;
  };
  
  whyMatched: string[];
  
  versionDifferences?: {
    same: string[];
    changed: string[];
  };
  
  deepAnalysis?: {
    titleFormula?: string;
    hook?: string;
    openingPattern?: string;
    storyStructure?: string;
    narrativeFlow?: string;
    retentionPattern?: string;
    curiosityGap?: string;
    emotionalTrigger?: string;
    cta?: string;
    closing?: string;
    thumbnailStrategy?: string;
    uniqueAngle?: string;
    presentationStyle?: string;
    audience?: string;
    whatMakesDifferent?: string;
  };
}

export interface ConceptChannelStats {
  channelId: string;
  channelName: string;
  subscribers: string;
  matchingVideosCount: number;
  bestVideoViews: number;
  averageViews: number;
  latestUpload: string;
  firstKnownCoverage: string;
  conceptSimilarityAvg: number;
}

export interface ConceptSaturation {
  totalMatchingVideos: number;
  totalMatchingChannels: number;
  uniqueConceptsFound: number;
  level: "Low Saturation" | "Medium Saturation" | "High Saturation";
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
