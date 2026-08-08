export type AIGenerationStatus = 'Waiting' | 'Generating' | 'Completed' | 'Regenerated' | 'Failed';

export interface AIAuditMetadata {
  timestamp: string;
  provider: string;
  modelName: string;
  promptVersion: string;
  generatorModule: string;
  validationStatus: string;
  regenerationCount: number;
  versionNumber: number;
}

export interface FlowIntelligence {
  continuityScore: number;
  issues: string[];
  recommendations: string[];
}

export interface AssetIntelligence {
  characters: string[];
  locations: string[];
  objects: string[];
  reuseSuggestions: string[];
}

export interface SceneIntelligence {
  hookStrength: number;        // 0-100
  visualImpact: number;        // 0-100
  retentionScore: number;      // 0-100
  productionDifficulty: number;// 0-100
  emotionalImpact: number;     // 0-100
  riskFlags: string[];
  suggestions: string[];
  flow?: FlowIntelligence;
  assets?: AssetIntelligence;
}

export interface ScriptSection {
  id: string;
  type: string; // e.g., 'Hook', 'Intro', 'Story', 'Body', 'CTA', 'Scene 1'
  content: string; // Script Chunk
  isExpanded?: boolean;
  intelligence?: SceneIntelligence;
  
  // Base Fields
  sceneNumber?: number;
  title?: string; // Scene Title
  sceneGoal?: string;
  voiceOver?: string;
  
  // Visual Fields
  visualNotes?: string; // Visual Description
  environment?: string;
  background?: string;
  characterNotes?: string;
  lighting?: string;
  colorPalette?: string;
  mood?: string;
  emotion?: string;
  // New fields for AI generation
  artDirection?: string;
  motion?: string;
  postProduction?: string;
  
  // Camera Fields
  cameraDirection?: string;
  cameraAngle?: string;
  cameraLens?: string;
  cameraMovement?: string;
  composition?: string;
  
  // Editing & Motion
  brollNotes?: string; // Single string or legacy
  brollSuggestions?: string[]; // Array of 3-5 suggestions
  onScreenText?: string;
  motionGraphics?: string;
  zoomSuggestions?: string;
  transitionSuggestions?: string;
  subtitleStyle?: string;
  editingNotes?: string;
  
  // Audio Fields
  soundEffects?: string;
  musicNotes?: string; // Background Music
  
  // AI Image Prompt Fields
  aiPrompt?: string; // Professional AI Image Prompt
  sceneImagePrompts?: string[]; // 1-3 distinct image prompts
  negativePrompt?: string;
  thumbnailConsistency?: string;
  
  // Timeline & Estimates
  duration?: number;
  durationEstimate?: number;
  timelinePosition?: string;
  
  // Legacy / Misc fields
  transitionNotes?: string;
  hookType?: string;
  curiosityLevel?: string;
  zoomMotion?: string;
  aiSuggestions?: string[];
  
  // Advanced AI Architecture
  lockedFields?: Record<string, boolean>;
  generationStatus?: Record<string, AIGenerationStatus>;
  versionHistory?: Record<string, any[]>; // Array of previous generations
  aiMetadata?: Record<string, AIAuditMetadata>;
}

export interface ResearchSource {
  id: string;
  title: string;
  url?: string;
  notes: string;
  summary?: string;
  insights?: string[];
  tags: string[];
  collectionId?: string;
  addedAt: string;
}

export interface ResearchCollection {
  id: string;
  name: string;
}

export interface ResearchPanelData {
  notes: string; // Global scratchpad / notebook
  sources?: ResearchSource[];
  collections?: ResearchCollection[];
  
  // Legacy fields for backward compatibility
  references?: string;
  competitors?: string;
  timeline?: string;
}

export interface TimelineAnalysis {
  estimatedWatchTime: string;
  totalDuration: number;
  retentionCurve: string;
  slowSections: string[];
  fastSections: string[];
  deadMoments: string[];
  emotionalPeaks: string[];
  curiosityGaps: string[];
  hookStrength: number;
  endingStrength: number;
  ctaPosition: string;
  rehookOpportunities: string[];
}

export interface ThumbnailReadinessScore {
  ctrPotential: number;
  curiosity: number;
  emotionalImpact: number;
  visualSimplicity: number;
  textReadability: number;
  mobileVisibility: number;
  colorContrast: number;
  faceVisibility: number;
  focusQuality: number;
  overallScore: number;
}

export interface ThumbnailConcept {
  id: string;
  title: string;
  ctrScore: number;
  curiosityScore: number;
  emotionScore: number;
  visualHook: string;
  mainSubject: string;
  background: string;
  colorPalette: string;
  textPlacement: string;
  faceExpression: string;
  cameraAngle: string;
  negativeSpace: string;
  aiSuggestions: string[];
  
  // AI Image Generation Fields
  imagePrompt?: string;
  negativePrompt?: string;
  aspectRatio?: string;
  style?: string;
  lighting?: string;
  composition?: string;
  cameraLens?: string;
  renderEngine?: string;
  
  // Advanced Strategy Fields
  thumbnailCtrStrategy?: string;
  mobileReadabilityStrategy?: string;
  environment?: string;
  mood?: string;
  depthOfField?: string;
  focus?: string;

  // Generated Assets
  generatedImageUrl?: string;
  generatedAt?: string;

  // Analysis
  readinessScore?: ThumbnailReadinessScore;

  // Advanced AI Architecture
  lockedFields?: Record<string, boolean>;
  generationStatus?: Record<string, AIGenerationStatus>;
  versionHistory?: Record<string, any[]>;
  aiMetadata?: Record<string, AIAuditMetadata>;
}

export interface GeneratedTitle {
  id: string;
  title: string;
  seoScore: number;
  curiosityScore: number;
  emotionalScore: number;
  clickPotential: number;
  characterCount: number;
}

export interface GeneratedDescription {
  full: string;
  short: string;
  cta: string;
  credits: string;
  affiliate: string;
  disclaimer: string;
}

export interface GeneratedTags {
  youtubeTags: string[];
  searchKeywords: string[];
  longTailKeywords: string[];
  relatedSearchTerms: string[];
  hashtags: string[];
}

export interface Chapter {
  id: string;
  time: string;
  title: string;
  summary: string;
}

export interface EditingChecklistItem {
  id: string;
  category: 'broll' | 'graphics' | 'sfx' | 'music' | 'zoom' | 'motion' | 'text' | 'camera';
  description: string;
  completed: boolean;
}

export interface ProductionReadinessScore {
  overallScore: number;
  thumbnailScore: number;
  titleScore: number;
  descriptionScore: number;
  seoScore: number;
  retentionScore: number;
  ctrPrediction: number;
  publishingReadiness: 'Excellent' | 'Good' | 'Average' | 'Poor';
  missingAssets: string[];
  improvementSuggestions: string[];
}

export interface ProductionData {
  thumbnails: ThumbnailConcept[];
  titles: GeneratedTitle[];
  description?: GeneratedDescription;
  tags?: GeneratedTags;
  chapters: Chapter[];
  editingChecklist: EditingChecklistItem[];
  readinessScore?: ProductionReadinessScore;
}

export interface StudioProject {
  id: string;
  title: string;
  globalVisualStyle?: string;
  rawScript?: string;
  sections: ScriptSection[];
  research: ResearchPanelData;
  lastAnalysis?: StudioAnalysis;
  timelineAnalysis?: TimelineAnalysis;
  production?: ProductionData;
  updatedAt: string;
  
  // Project-level Advanced AI Architecture
  lockedFields?: Record<string, boolean>;
  generationStatus?: Record<string, AIGenerationStatus>;
  versionHistory?: Record<string, any[]>;
  aiMetadata?: Record<string, AIAuditMetadata>;
  actionableRecommendations?: ActionableRecommendation[];
}

export interface StudioAnalysis {
  retentionScore: number;
  emotionalScore: number;
  curiosityScore: number;
  seoScore: number;
  readability: string;
  wordCount: number;
  estimatedReadingTime: string;
  suggestions: string[];
}

export interface ActionableRecommendation {
  id: string;
  tab: 'script' | 'storyboard' | 'thumbnail' | 'production';
  context: string;
  issue: string;
  suggestion: string;
  applied: boolean;
  actionPayload: {
    type: 'UPDATE_SECTION_CONTENT' | 'UPDATE_THUMBNAIL_PROMPT' | 'UPDATE_TITLE' | 'ADD_CHECKLIST_ITEM';
    targetId: string;
    newValue: string;
  };
}
