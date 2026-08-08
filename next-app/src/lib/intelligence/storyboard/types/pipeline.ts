export interface StoryAnalysis {
  storyArc: string;
  emotionalArc: string;
  locations: string[];
  characters: string[];
  investigationFlow: string;
  climax: string;
  ending: string;
}

export interface VisualBeat {
  id: string;
  narration: string;
  cinematicIdea: string;
  visualGoal: string;
  emotion: string;
  priority: 'High' | 'Medium' | 'Low';
  estimatedDuration: number;
}

export interface ProductionPlan {
  storyStructure: {
    opening: string;
    setup: string;
    conflict: string;
    investigation: string;
    discovery: string;
    climax: string;
    resolution: string;
  };
  visualStrategy: {
    documentaryStyle: string;
    pacing: string;
    visualRhythm: string;
    editingRhythm: string;
  };
  // Mapping of beat ID to its planned properties
  beatPlans: Record<string, {
    location: string;
    cameraAngle: string;
    cameraMovement: string;
    focalLength: string;
    lightingStyle: string;
    composition: string;
    colorPalette: string;
    transitionToNext: string;
    music: string;
    soundDesign: string;
    emotion: string;
    retentionHook: string;
    visualMetaphor: string;
  }>;
}

/**
 * StyleDNAModel — Structured version of the Style DNA that every engine reads.
 * Prevents free-form text interpretation causing cross-engine inconsistency.
 */
export interface StyleDNAModel {
  styleName: string;
  cameraLanguage: string;     // Preferred movement, angles, speed
  lightingLanguage: string;   // Lighting philosophy, contrast, temperature
  audioLanguage: string;      // Ambient character, SFX personality, music genre
  musicLanguage: string;      // Instrumentation, tempo, emotional key
  motionLanguage: string;     // Animation style, particle behaviour, pacing
  editingLanguage: string;    // Cut style, transition type, rhythm
  typographyLanguage: string; // Font personality, hierarchy, placement rules
  transitionLanguage: string; // Transition type, speed, emotional purpose
  vfxLanguage: string;        // Grain, particles, atmosphere, lens effects
  metadataRules: string;      // How to derive tags, categories, series names
  colorRules: string;         // Palette constraints, contrast, saturation rules
  environmentRules: string;   // Set dressing, era accuracy, prop rules
  forbiddenElements: string;  // What must never appear in this style
}

/**
 * SharedSceneUnderstanding — The single source of truth created once per beat.
 * Every downstream engine reads from this object instead of re-analyzing the script.
 * This is INTERNAL ONLY and is never returned in the final JSON.
 */
export interface SharedSceneUnderstanding {
  // ── Script Layer ──────────────────────────────────────────────────────────
  storySummary: string;          // What the full story is about
  scriptExcerpt: string;         // The exact narration for this beat

  // ── Beat Layer ────────────────────────────────────────────────────────────
  beatId: string;
  beatPurpose: string;           // Hook / Exposition / Discovery / Conflict / Climax / Resolution
  beatNarrativeFunction: string; // Why this beat exists in the story arc
  sceneGoal: string;             // What this scene must achieve for the viewer
  informationRevealed: string;   // What new fact/emotion is learned in this beat

  // ── Emotion Layer ─────────────────────────────────────────────────────────
  dominantEmotion: string;       // The single primary emotional objective
  viewerEmotion: string;         // What the viewer should feel
  characterIntent: string;       // What the on-screen subject is experiencing
  emotionalIntensity: 'Low' | 'Medium' | 'High' | 'Climactic';

  // ── Context Layer ─────────────────────────────────────────────────────────
  timeContext: string;           // Era, year, time of day
  locationContext: string;       // Where the scene takes place
  environmentDescription: string; // Physical environment details
  characters: string;            // Who is present and their relationship
  subjects: string;              // Key objects, documents, or subjects
  historicalContext: string;     // Any historical period accuracy requirements

  // ── Visual Priority Layer ─────────────────────────────────────────────────
  primarySubject: string;        // What the camera prioritizes
  visualMetaphor: string;        // The symbolic idea behind the visuals
  retentionHook: string;         // What keeps the viewer watching
  visualPriority: string;        // Foreground/midground/background hierarchy

  // ── Audio Priority Layer ──────────────────────────────────────────────────
  audioPriority: string;         // Ambient, musical, or SFX-led scene?
  musicMood: string;             // Emotional direction of the music
  naturalSounds: string;         // What sounds exist in this environment

  // ── Style DNA Layer (pre-resolved from StyleDNAModel) ─────────────────────
  styleDNA: StyleDNAModel;

  // ── Direction Decisions (resolved before JSON generation) ─────────────────
  directorCameraDecision: string;  // Final decided camera angle + movement + rationale
  directorLightingDecision: string; // Final decided lighting + rationale
  directorAudioDecision: string;   // Final decided music + ambient + rationale
  directorEditingDecision: string; // Final decided transition + pacing + rationale
  editingRhythm: string;           // Fast / Measured / Slow / Contemplative
  motionPriority: string;          // Camera motion style for this specific scene
}

export interface SceneMemoryState {
  environment: string;
  location: string;
  camera: string;
  movement: string;
  angle: string;
  lens: string;
  lighting: string;
  composition: string;
  transition: string;
  music: string;
  broll: string;
  aiPrompt: string;
  emotion: string;
  mood: string;
  visualMetaphor: string;
}

export interface ValidationReport {
  isValid: boolean;
  score: number;
  invalidScenes: InvalidScene[];
  metrics: ScoringMetrics;
}

export interface InvalidScene {
  sceneIndex: number;
  reasons: string[];
  scene: any; // The raw scene object that failed
}

export interface ScoringMetrics {
  visualDiversity: number;
  cameraVariety: number;
  lightingVariety: number;
  promptVariety: number;
  storyProgression: number;
  emotionProgression: number;
  editingQuality: number;
  viewerRetentionPotential: number;
  productionReadiness: number;
  overallScore: number;
}

export interface DebugPayload {
  storyAnalysis?: StoryAnalysis;
  visualBeats?: VisualBeat[];
  productionPlan?: ProductionPlan;
  validationReport?: ValidationReport;
  productionAnalytics?: any; // To be typed later
  storyboardInspector?: any[]; // To be typed later
  diffReport?: any[];
  pipelineMetrics?: {
    executionTimeMs: number;
    aiCalls: number;
    validationFailures: number;
    regeneratedScenes: number;
    overallProductionScore: number;
  };
}
