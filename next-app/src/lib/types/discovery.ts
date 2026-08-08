export interface ChannelDNA {
  niche: string;
  subNiche: string;
  topics: string[];
  audience: string;
  viewerIntent: string;
  keywords: string[];
  entities: string[];
  uploadPattern: string;
  titleStyle: string;
  thumbnailStyle: string;
  hookStyle: string;
  storytellingStyle: string;
  editingStyle: string;
  publishingPattern: string;
  shortsRatio: number;
  longFormRatio: number;
  engagementPattern: string;
  viralFormula: string;
  contentDepth: string;
}

export interface Channel {
  id: string; // Stable YouTube Channel ID
  title: string;
  handle: string;
  description: string;
  thumbnailUrl: string;
  bannerUrl?: string;
  
  // Metrics
  subscriberCount: number;
  videoCount: number;
  viewCount: number;
  
  // Derived / Additional
  averageViews?: number;
  uploadFrequency?: string; // e.g. "2 videos / week"
  engagementRate?: number;
  
  // Metadata
  country?: string;
  language?: string;
  publishedAt: string;
  lastUploadAt?: string;
  
  // Intelligence
  niche?: string[];
  topics?: string[];
  verified?: boolean;

  // New Fields for Milestone 22B
  dna?: ChannelDNA;
  discoveryScore?: number;
  confidenceScore?: number;
  authorityScore?: number;
  opportunityScore?: number;
  competitionScore?: number;
  growthScore?: number;
  consistencyScore?: number;
  engagementScore?: number;
  viralityScore?: number;
  freshnessScore?: number;
  
  // Specific Requested Fields
  viewerIntent?: string;
  primaryNiche?: string;
  subNiche?: string;
  evidence?: string[];
  growthStatus?: string;
  monetized?: boolean;
  performanceRatio?: number;
  outlierScore?: number;
  similarityScore?: number;
}

export type DiscoverySource = "live" | "cache" | "mock";

export interface ChannelDiscoveryResponse {
  data: Channel[];
  meta: {
    source: DiscoverySource;
    fetchedAt: string;
    cacheAgeMs?: number;
    nextPageToken?: string;
    totalResults: number;
    errorReason?: string;
  };
}

export interface ChannelDiscoveryFilters {
  query?: string;
  
  // Metrics
  minSubscribers?: number;
  maxSubscribers?: number;
  minViews?: number;
  maxViews?: number;
  minAverageViews?: number;
  minMedianViews?: number;
  minTotalVideos?: number;
  maxTotalVideos?: number;
  minAverageUploads?: number;
  minViewVelocity?: number;
  minSubscriberVelocity?: number;
  minRPM?: number;
  minRetention?: number;
  minCTR?: number;
  minAverageViewDuration?: number;
  minEngagementRate?: number;
  minPerformanceRatio?: number;
  minOutlierScore?: number;
  
  // Upload Activity
  uploadActivity?: "Today" | "Yesterday" | "This Week" | "Last Week" | "This Month" | "Last Month" | "Last 3 Months" | "Last 6 Months" | "Last Year";
  
  // Channel Age
  channelAge?: "New" | "30 Days" | "90 Days" | "6 Months" | "1 Year" | "2 Years" | "3 Years" | "5 Years" | "10+ Years" | "Custom";
  channelAgeCustomMin?: string;
  channelAgeCustomMax?: string;
  maxChannelAge?: number;
  maxChannelAgeUnit?: "days" | "weeks" | "months" | "years";
  minRecentViews?: number;
  recentVideoCount?: number;
  
  // Growth
  growthStatus?: "Exploding" | "Fast Growing" | "Growing" | "Stable" | "Declining" | "Inactive" | "Dead" | "Revived";
  
  // Verification / Type
  verifiedOnly?: boolean;
  monetizedOnly?: boolean;
  brandChannel?: boolean;
  personalChannel?: boolean;
  facelessOnly?: boolean;
  faceChannel?: boolean;
  mcn?: boolean;
  officialArtist?: boolean;
  
  // Content Type
  shortsOnly?: boolean;
  longFormOnly?: boolean;
  mixedContent?: boolean;
  liveChannels?: boolean;
  premieres?: boolean;
  podcasts?: boolean;
  series?: boolean;
  
  // Geography & Language
  country?: string;
  language?: string;
  
  // Category & Niche
  category?: string; // Standard YT + Custom AI
  
  // Custom Dates & Activity
  lastUploadDate?: "any" | "today" | "yesterday" | "thisWeek" | "lastWeek" | "lastMonth" | "last3Months" | "last6Months" | "lastYear";
  uploadFrequency?: "any" | "daily" | "weekly" | "monthly" | "seasonal" | "active" | "inactive";
  
  // Additional Similarity
  minOpportunityScore?: number;
  
  // Similarity
  minSimilarity?: number;
  minConfidence?: number;
  minTopicMatch?: number;
  minKeywordMatch?: number;
  minAudienceMatch?: number;
  minLanguageMatch?: number;
  minCountryMatch?: number;
  minThumbnailMatch?: number;
  minTitleMatch?: number;
  minPublishingPatternMatch?: number;
  minGrowthMatch?: number;
  minCompetitionScore?: number;
  maxDifficulty?: number;
  minOpportunity?: number;
  minGapScore?: number;
  minViralityScore?: number;

  // Sorting
  sortBy?: "similarity" | "confidence" | "subscribers" | "views" | "averageViews" | "growth" | "newest" | "oldest" | "ctr" | "retention" | "virality" | "performanceRatio" | "outlierScore" | "uploadFrequency" | "opportunity" | "competition" | "difficulty" | "engagement";
  sortOrder?: "asc" | "desc";
}

// Phase 2: Similar Channels & Compare Matrix Types

export type CompetitorClass = "Direct Competitor" | "Indirect Competitor" | "Inspiration" | "Aspirational" | "Different Audience";

export interface GrowthOpportunity {
  betterAt: string[];
  worseAt: string[];
  missingOpportunities: string[];
  contentGaps: string[];
  untappedTopics: string[];
}

export interface SimilarChannel extends Channel {
  similarityScore: number; // 0-100 (Deterministic or AI)
  similarityExplanation: string; // Why this competitor matters
  makesItSimilar: string; // What makes it similar
  whereItDiffers: string; // Where it differs
  whatToCopy: string; // What the creator should copy
  whatToAvoid: string; // What the creator should avoid
  competitorClass: CompetitorClass;
  growthOpportunity: GrowthOpportunity;
  nicheClassification: string[];
  reverseEngineering: {
    titlePsychology: string;
    thumbnailPsychology: string;
    hookStrategy: string;
    storytellingFramework: string;
    retentionStrategy: string;
    emotionalCurve: string;
    seoStrategy: string;
    viralFormula: string;
  };
}

export interface SimilarChannelsResponse {
  targetChannel: Channel;
  similarChannels: SimilarChannel[];
  meta: {
    source: DiscoverySource;
    fetchedAt: string;
    totalEvaluated: number;
    errorReason?: string;
  };
}

export interface ChannelComparison {
  channel: Channel;
  titlePsychology?: string;
  thumbnailPsychology?: string;
  audienceDemographic?: string;
  hookStyle?: string;
  storytelling?: string;
  editingStyle?: string;
  uploadPattern?: string;
  publishingStrategy?: string;
  viralFormula?: string;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  viralProbabilityScore: number;
}

export interface CompareMatrixResponse {
  comparisons: ChannelComparison[];
  meta: {
    source: DiscoverySource;
    fetchedAt: string;
    errorReason?: string;
  };
}

// Phase 3: Outlier Detection

export interface VideoBaseline {
  meanViews: number;
  medianViews: number;
  standardDeviation: number;
  typicalViewRange: [number, number];
  uploadFrequency: string;
  subscriberRatio: number;
  viewVelocity: string;
  longTailPerformance: string;
}

export type OutlierCategory = "Viral Explosion" | "Slow Burner" | "Evergreen" | "Trend Spike" | "Algorithm Push" | "Seasonal" | "Unexpected Success";

export interface VideoBase {
  id: string;
  title: string;
  thumbnailUrl: string;
  publishedAt: string;
  viewCount: number;
  likeCount?: number;
  commentCount?: number;
}

export interface OutlierVideo extends VideoBase {
  isOutlier: boolean;
  outlierScore?: number;
  category?: string;
  performanceRatio?: number;
  viewVelocity?: number;
  ctrEstimate?: number;
  retentionEstimate?: number;
  engagementEstimate?: number;
  viralReasoning?: {
    explanation: string;
    topic: string;
    packaging: string;
    trend: string;
    emotionalTrigger: string;
  } | string;
  evidence?: string[];
  repeatability?: string;
  confidenceScore?: number;
}

export interface OutlierPatternAnalysis {
  titleFormat?: string;
  thumbnailConcept?: string;
  topicAngle?: string;
  psychologicalTrigger?: string;
  repeatableFormula?: string;
  confidenceScore: number;
}

export interface OutlierDetectionResponse {
  channelId: string;
  baseline: VideoBaseline;
  videos: OutlierVideo[]; // Both outliers and normal videos (to show the scale)
  patternAnalysis?: OutlierPatternAnalysis;
  meta: {
    source: DiscoverySource;
    fetchedAt: string;
    sampledCount: number;
    errorReason?: string;
  };
}

// Phase 4: Intelligence Reports

export interface EvidenceBasedRecommendation {
  recommendation: string;
  evidence: string;
  sourceModule: string;
  confidenceScore: number;
}

export interface PrioritizedOpportunity {
  title: string;
  description: string;
  impact: "High" | "Medium" | "Low";
  difficulty: "High" | "Medium" | "Low";
  expectedGrowth: string;
  confidenceScore: number;
}

export interface Contradiction {
  issue: string;
  moduleA: { name: string; claim: string };
  moduleB: { name: string; claim: string };
  resolution: string;
}

export interface ReportVersionMeta {
  version: string;
  generatedAt: string;
  aiModel: string;
  sourceDataVersion: string; // hash or timestamp of the source data
}

export interface IntelligenceReport {
  id: string;
  channelId: string;
  meta: ReportVersionMeta;
  
  executiveSummary: {
    overallHealth: string;
    growthStage: string;
    biggestOpportunities: string[];
    biggestRisks: string[];
  };
  
  channelProfile: {
    primaryNiche: string;
    secondaryNiche: string;
    audienceProfile: string;
    contentPillars: string[];
    uploadStrategy: string;
  };
  
  competitorLandscape: {
    summary: string;
    directCompetitors: string[];
    aspirationalCompetitors: string[];
    marketPositioning: string;
    competitiveAdvantages: string[];
    weaknesses: string[];
  };
  
  viralFormula: {
    titles: string[];
    hooks: string[];
    storytelling: string[];
    thumbnails: string[];
    uploadTiming: string;
    topics: string[];
    emotionalTriggers: string[];
  };
  
  contentGapAnalysis: {
    competitorTopics: string[];
    missedOpportunities: string[];
    emergingTrends: string[];
    evergreenOpportunities: string[];
  };
  
  growthRoadmap: {
    quickWins: PrioritizedOpportunity[];
    thirtyDayImprovements: PrioritizedOpportunity[];
    ninetyDayStrategy: PrioritizedOpportunity[];
    longTermStrategy: PrioritizedOpportunity[];
  };
  
  evidenceBasedRecommendations: EvidenceBasedRecommendation[];
  contradictionsDetected: Contradiction[];
}

// Phase 5: Deep Content Intelligence

export interface ContentDNA {
  storytellingStructure: string;
  hookArchitecture: string;
  narrativePacing: string;
  emotionalProgression: string;
  curiosityLifecycle: string;
  ctaStrategy: string;
  authorityBuilding: string;
  viewerRetentionTechniques: string[];
  evidence: string; // The specific videos or module that proves this
}

export interface AudiencePsychology {
  beginnerVsAdvanced: string;
  viewerIntent: string;
  painPoints: string[];
  emotionalMotivations: string[];
  learningExpectations: string;
  entertainmentExpectations: string;
  evidence: string;
}

export interface ContentStrategy {
  evergreenStrategy: { strategy: string; confidenceScore: number; evidence: string };
  trendStrategy: { strategy: string; confidenceScore: number; evidence: string };
  seriesStrategy: { strategy: string; confidenceScore: number; evidence: string };
  educationalStrategy: { strategy: string; confidenceScore: number; evidence: string };
  documentaryStrategy: { strategy: string; confidenceScore: number; evidence: string };
  entertainmentStrategy: { strategy: string; confidenceScore: number; evidence: string };
}

export interface PatternStability {
  sustainablePatterns: string[];
  temporaryTrends: string[];
  algorithmDrivenSuccess: string[];
  repeatableSystems: string[];
}

export interface KnowledgeGraphNode {
  from: string; // e.g. "Hook"
  to: string; // e.g. "Curiosity"
  relationship: string; // e.g. "generates"
  context: string; // Why this relationship exists
}

export interface AIConsultantInsight {
  observation: string;
  whyItWorks: string;
  whenItWorks: string;
  whenItFails: string;
  whoShouldUseIt: string;
  expectedImpact: string;
  confidenceScore: number;
  supportingEvidence: string;
}

export interface DeepContentIntelligenceResponse {
  id: string;
  channelId: string;
  meta: ReportVersionMeta;
  
  contentDNA: ContentDNA;
  audiencePsychology: AudiencePsychology;
  contentStrategy: ContentStrategy;
  patternStability: PatternStability;
  knowledgeGraph: KnowledgeGraphNode[];
  consultantInsights: AIConsultantInsight[];
}

// Phase 6: Viral Formula & Knowledge Base

export type FormulaCategory = "Evergreen" | "Documentary" | "Educational" | "Entertainment" | "Finance" | "Business" | "Storytelling" | "News" | "True Crime" | "Gaming" | "Tech" | "Vlog" | "Other";

export interface FormulaStructure {
  topic: string;
  hook: string;
  curiosityPattern: string;
  storyStructure: string;
  retentionTechnique: string;
  emotionalTrigger: string;
  cta: string;
  viewerOutcome: string;
}

export interface FormulaStrength {
  reliability: number;     // 0-100
  repeatability: number;   // 0-100
  risk: number;            // 0-100
  difficulty: number;      // 0-100
  expectedGrowth: number;  // 0-100
}

export interface FormulaConditions {
  whyItSucceeds: string;
  whenItSucceeds: string;
  whenItFails: string;
  requiredAudience: string;
  executionQuality: string;
}

export interface ViralFormula {
  id: string;
  version: string;
  createdAt: string;
  updatedAt: string;
  
  title: string;           // E.g., "The Negative Curiosity Hook"
  description: string;
  
  category: FormulaCategory;
  tags: string[];
  
  structure: FormulaStructure;
  strength: FormulaStrength;
  conditions: FormulaConditions;
  
  // Linkages
  sourceChannels: string[];
  sourceVideos: string[];
  evidenceCount: number;
  confidence: number;      // 0-100
  frequency: number;       // Occurrences detected
  successRate: number;     // 0-100
  
  knowledgeGraphLinks: KnowledgeGraphNode[]; // Connecting it to Topics, Hooks, etc.
}

// Phase 7: Title Intelligence Engine

export type TitleIntent = "Curiosity" | "Fear" | "Shock" | "Education" | "Documentary" | "Mystery" | "Transformation" | "Money" | "Warning" | "Comparison" | "Story" | "Proof" | "Challenge" | "News" | "Review";

export interface TitlePromiseAnalysis {
  explicitPromise: string;
  hiddenPromise: string;
  viewerExpectation: string;
  expectedPayoff: string;
  scriptAlignment: "High" | "Medium" | "Low";
}

export interface TitleCuriosityGap {
  curiosityStrength: number; // 0-100
  curiosityOpening: string;
  curiosityClosing: string;
  informationGap: string;
  clickMotivation: string;
}

export interface TitleEmotionalAnalysis {
  detectedEmotions: ("Fear" | "Excitement" | "Surprise" | "Greed" | "Hope" | "Suspense" | "Anxiety" | "Relief" | "Inspiration")[];
  emotionalIntensityScore: number; // 0-100
}

export interface TitleCTRPrediction {
  expectedCTR: string; // e.g., "8-12%"
  clickProbability: number; // 0-100
  scrollStopScore: number; // 0-100
  firstImpressionScore: number; // 0-100
}

export interface TitleAudienceMapping {
  experienceLevel: "Beginner" | "Intermediate" | "Advanced" | "Universal";
  ageGroup: string;
  viewerIntent: string;
  knowledgeLevel: string;
}

export interface TitleFramework {
  id: string;
  version: string;
  createdAt: string;
  updatedAt: string;
  
  // Core
  frameworkName: string;
  template: string; // e.g. "I [Action] [Time] [Extreme Situation]"
  exampleUsed: string; // e.g. "I Survived 50 Hours in Antarctica"
  
  // Intelligence Breakdowns
  primaryIntent: TitleIntent;
  secondaryIntent: TitleIntent;
  promise: TitlePromiseAnalysis;
  curiosity: TitleCuriosityGap;
  emotion: TitleEmotionalAnalysis;
  audience: TitleAudienceMapping;
  ctrPrediction: TitleCTRPrediction;
  
  // Mechanics & Triggers
  novelty: string;
  numberUsage: string;
  timeUsage: string;
  
  // Performance & Strength
  frequency: number;
  successRate: number; // 0-100
  averageViews: number;
  averageOutlierScore: number;
  repeatability: number; // 0-100
  reliability: number; // 0-100
  confidence: number; // 0-100
  difficulty: number; // 0-100
  risk: number; // 0-100
  
  sourceChannels: string[];
  sourceVideos: string[];
  
  // Enterprise Graph Integration
  knowledgeGraphLinks: KnowledgeGraphNode[]; // Link to Thumbnail, Hook, Script, Retention, Audience, SEO, Viral Formula
}

// Phase 8: Thumbnail Intelligence Engine

export interface ThumbnailVisualAnalysis {
  colorPalette: string[];
  contrast: "High" | "Medium" | "Low";
  brightness: "Bright" | "Balanced" | "Dark";
  saturation: "High" | "Medium" | "Low";
  lighting: string;
  background: string;
  foreground: string;
  composition: string;
  ruleOfThirds: boolean;
  visualBalance: string;
  negativeSpace: "High" | "Medium" | "Low";
  depth: string;
  blur: string;
  focus: string;
  framing: string;
}

export interface ThumbnailSubjectAnalysis {
  faceDetected: boolean;
  numberOfFaces: number;
  eyeContact: boolean;
  facialEmotion: string;
  bodyLanguage: string;
  gesture: string;
  objectFocus: string;
  beforeAfterComparison: boolean;
  humanVsObjectRatio: string;
}

export interface ThumbnailTypography {
  hasText: boolean;
  fontStyle: string;
  fontWeight: string;
  fontSize: "Large" | "Medium" | "Small";
  readability: "High" | "Medium" | "Low";
  placement: string;
  textDensity: "High" | "Medium" | "Low";
  wordCount: number;
  textHierarchy: string;
  transcribedText: string;
}

export interface ThumbnailClickPsychology {
  primaryEmotion: "Curiosity" | "Shock" | "Fear" | "Surprise" | "Suspense" | "Transformation" | "Status" | "Money" | "Urgency" | "Mystery" | "Conflict";
  emotionalIntensityScore: number; // 0-100
  clickMotivation: string;
}

export interface ThumbnailVisualHook {
  primaryHook: string;
  secondaryHook: string;
  visualStory: string;
  viewerAttentionPath: string[]; // e.g. ["Face", "Arrow", "Object"]
  eyeTrackingPrediction: string;
}

export interface ThumbnailCTRPrediction {
  expectedCTR: string;
  scrollStopScore: number; // 0-100
  clarityScore: number; // 0-100
  emotionScore: number; // 0-100
  curiosityScore: number; // 0-100
  thumbnailQualityScore: number; // 0-100
}

export interface TitleCompatibility {
  promiseAlignment: "High" | "Medium" | "Low";
  emotionalAlignment: "High" | "Medium" | "Low";
  curiosityAlignment: "High" | "Medium" | "Low";
  audienceAlignment: "High" | "Medium" | "Low";
  mismatches: string[];
}

export interface ThumbnailFramework {
  id: string;
  version: string;
  createdAt: string;
  updatedAt: string;
  
  frameworkName: string;
  thumbnailDnaTemplate: string; // e.g., "Face -> Object -> Large Text -> Red Arrow -> Dark Background -> High Contrast"
  
  visual: ThumbnailVisualAnalysis;
  subject: ThumbnailSubjectAnalysis;
  typography: ThumbnailTypography;
  psychology: ThumbnailClickPsychology;
  hook: ThumbnailVisualHook;
  ctrPrediction: ThumbnailCTRPrediction;
  compatibility: TitleCompatibility;
  
  whyItWorks: string;
  whenItWorks: string;
  whenItFails: string;
  
  frequency: number;
  confidence: number;
  
  sourceChannels: string[];
  sourceVideos: string[];
  
  knowledgeGraphLinks: KnowledgeGraphNode[]; 
}

// Phase 9: Title + Thumbnail Synergy Engine

export interface PromiseLifecycle {
  titlePromise: string;
  thumbnailPromise: string;
  hookDelivery: string;
  storyProgression: string;
  finalPayoff: string;
  alignmentScore: number; // 0-100
  mismatchScore: number; // 0-100
  contradictions: string[];
  issues: string[]; // e.g. ["Over-promising", "Premature payoff"]
}

export interface PsychologicalConsistency {
  curiosityAlignment: number; // 0-100
  fearAlignment: number;
  shockAlignment: number;
  surpriseAlignment: number;
  statusAlignment: number;
  moneyAlignment: number;
  mysteryAlignment: number;
  conflictAlignment: number;
  transformationAlignment: number;
  overallAlignmentScore: number; // 0-100
  conflictScore: number; // 0-100
  reinforcementScore: number; // 0-100
}

export interface AudienceConsistency {
  titleTargetSkillLevel: string;
  thumbnailTargetSkillLevel: string;
  titleTargetIntent: string;
  thumbnailTargetIntent: string;
  titleTargetMotivation: string;
  thumbnailTargetMotivation: string;
  titleTargetPainPoints: string[];
  thumbnailTargetPainPoints: string[];
  titleExpectedOutcome: string;
  thumbnailExpectedOutcome: string;
  audienceMatchScore: number; // 0-100
  mismatches: string[];
}

export interface SynergyCTRPrediction {
  titleCtrScore: number; // 0-100
  thumbnailCtrScore: number; // 0-100
  combinedCtrPrediction: string; // e.g., "10-15%"
  synergyScore: number; // 0-100
  scrollStopProbability: number; // 0-100
  clickProbability: number; // 0-100
  ignoreProbability: number; // 0-100
  explanation: string;
}

export interface StoryConsistencyFlow {
  transitions: {
    from: string;
    to: string;
    isConsistent: boolean;
    reason: string;
  }[];
  brokenTransitions: string[];
}

export interface SynergyFramework {
  id: string;
  version: string;
  createdAt: string;
  updatedAt: string;
  
  frameworkName: string;
  titleFormula: string;
  thumbnailFormula: string;
  psychologicalFormula: string;
  
  promiseLifecycle: PromiseLifecycle;
  psychologicalConsistency: PsychologicalConsistency;
  audienceConsistency: AudienceConsistency;
  ctrPrediction: SynergyCTRPrediction;
  storyConsistency: StoryConsistencyFlow;
  
  frequency: number;
  confidence: number;
  
  sourceChannels: string[];
  sourceVideos: string[];
  
  knowledgeGraphLinks: KnowledgeGraphNode[];
}

// Phase 10: AI Strategy & Decision Engine

export interface StrategicRecommendation {
  id: string;
  category: "Do" | "Stop" | "Repeat" | "Improve" | "Experiment";
  recommendation: string;
  reason: string;
  expectedGrowthImpact: number; // 0-100
  expectedCtrImpact: number; // 0-100
  expectedRetentionImpact: number; // 0-100
  difficulty: number; // 0-100
  timeRequired: "Hours" | "Days" | "Weeks";
  resourceCost: "Low" | "Medium" | "High";
  confidence: number; // 0-100
  priorityScore: number; // 0-100 (Calculated ROI)
  roiScore: number; // 0-100
  supportingEvidence: string[];
  sourceModules: string[]; // e.g. ["Title Intelligence", "Outlier Detection"]
  risk: string;
  expectedOutcome: string;
  expiry: string; // ISO date
  version: string;
  createdAt: string;
}

export interface VideoIdea {
  title: string;
  format: "Shorts" | "Long-form";
  category: "Evergreen" | "Trend" | "Series" | "Experimental";
  reason: string;
  targetAudience: string;
  estimatedROI: number; // 0-100
  priority: number;
}

export interface StrategyRoadmap {
  next10Videos: VideoIdea[];
  next30DaysPlan: string[];
  next90DaysPlan: string[];
  quickWins: string[];
  longTermPlays: string[];
  experimentalIdeas: string[];
}

export interface OpportunityDetection {
  untappedTopics: string[];
  emergingTrends: string[];
  evergreenOpportunities: string[];
  weakCompetitors: string[];
  marketGaps: string[];
  contentClusters: string[];
  winningSeriesIdeas: string[];
}

export interface StrategicRisk {
  type: "Clickbait Risk" | "Audience Fatigue" | "Thumbnail Repetition" | "Title Repetition" | "SEO Risk" | "Retention Risk" | "Trend Dependency" | "Overused Formats" | string;
  description: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  confidence: number;
  mitigationStrategy: string;
}

export interface StrategicIntelligence {
  id: string;
  version: string;
  createdAt: string;
  channelId: string;
  recommendations: StrategicRecommendation[];
  roadmap: StrategyRoadmap;
  opportunities: OpportunityDetection;
  risks: StrategicRisk[];
  knowledgeGraphLinks: KnowledgeGraphNode[];
}
