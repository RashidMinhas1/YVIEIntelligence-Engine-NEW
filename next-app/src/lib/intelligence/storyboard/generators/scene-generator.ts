import { callAI } from "@/lib/ai";
import { ValidationEngine } from "../validators/validation-engine";
import {
  StoryAnalysis,
  VisualBeat,
  ProductionPlan,
  SceneMemoryState,
  SharedSceneUnderstanding,
  StyleDNAModel,
} from "../types/pipeline";

// ─────────────────────────────────────────────────────────────────────────────
// StyleDNA Resolver
// Converts free-form theme string into a structured StyleDNAModel so every
// engine reads the SAME structured data instead of interpreting free text.
// ─────────────────────────────────────────────────────────────────────────────
function resolveStyleDNA(globalTheme: string): StyleDNAModel {
  const t = globalTheme.toLowerCase();

  // ── True Crime ────────────────────────────────────────────────────────────
  if (t.includes("true crime") || t.includes("crime investigation") || t.includes("detective")) {
    return {
      styleName: globalTheme,
      cameraLanguage: "Slow push-ins on evidence. Static interrogation frames. Handheld tension during reveals. Never wide establishing shots for crime scenes.",
      lightingLanguage: "Hard chiaroscuro shadows. Single practical source. Cold blue tone with warm amber isolation pools. High contrast black regions.",
      audioLanguage: "Tense investigative ambient. Muffled city noise. Clock ticking. Paper rustling. No war sounds. No nature sounds unless crime happened outdoors.",
      musicLanguage: "Sparse piano with low string tension. Staccato string pulses for revelations. Never orchestral swells.",
      motionLanguage: "Deliberate, measured pace. Slow dissolves between evidence. Very occasional subtle camera tremor on shock moments.",
      editingLanguage: "Evidence-board cuts. J-cuts on audio. Long holds on evidence frames. Measured editorial rhythm — never fast cuts.",
      typographyLanguage: "Typewriter font for case facts. Red stamp overlays for dates and case numbers. Clean sans-serif for contextual captions.",
      transitionLanguage: "Red-string wipe. Case file flip. Slow cross-dissolve between scenes. Never glitch or flash transitions.",
      vfxLanguage: "Film grain. Vignette corners. Dust particles on archival material. Light desaturation.",
      metadataRules: "Tags derived only from: topic of crime, location of crime, year of crime, people involved. Never add war, military, or unrelated historical tags.",
      colorRules: "Desaturated mid-tones. Cold blue shadows. Warm amber highlights on key evidence. No neon. No saturated hues.",
      environmentRules: "Crime scenes, evidence rooms, courtrooms, interview rooms, city exteriors at night. No war environments. No military settings.",
      forbiddenElements: "War sounds, military equipment, explosions, battlefield, air raids, historical army visuals, anime elements, 3D renders, cartoon outlines.",
    };
  }

  // ── Pixar / Animation ────────────────────────────────────────────────────
  if (t.includes("pixar") || t.includes("3d animation") || t.includes("cgi animation")) {
    return {
      styleName: globalTheme,
      cameraLanguage: "Dynamic arcing shots. Wide establishing then intimate close. Expressive rack focus. High-angle charm shots on character moments.",
      lightingLanguage: "Soft rim lighting. Warm key light. Colourful environment bounces. No harsh shadows. Subsurface scattering on skin and organic materials.",
      audioLanguage: "Playful orchestral swells. Whimsical SFX aligned with visual actions. Clean foley. No realistic ambient — slightly stylised sound design.",
      musicLanguage: "Full orchestral score. Leitmotifs per character. Emotional crescendos on story beats. Adventure brass. Tender strings on emotional moments.",
      motionLanguage: "Exaggerated squash-and-stretch. Anticipation before action. Follow-through. Smooth arcing motion paths.",
      editingLanguage: "Energetic cuts on action. Slow holds on emotional beats. Match cuts on shape similarities. Smash cuts for comedy.",
      typographyLanguage: "Friendly rounded sans-serif. Large, readable, colourful. Character-specific colour per name card.",
      transitionLanguage: "Iris wipes. Star wipes. Shape morphs. Energetic smash cuts. Never dark film transitions.",
      vfxLanguage: "Soft particle dust. Colour lens flares. Warm bloom on magical moments. Environment ambient occlusion.",
      metadataRules: "Tags derived from: story theme, emotional arc, character names if applicable, animation style. Never add realistic or historical tags.",
      colorRules: "Saturated vibrant palette. Character-coded accent colours. Warm hero tones. Cool villain/conflict tones.",
      environmentRules: "Stylised real-world environments. Slightly exaggerated scale. Clean, prop-rich environments that tell the character story.",
      forbiddenElements: "Realistic violence, war, dark psychology, film noir, archival footage look, typewriter fonts, desaturated grades.",
    };
  }

  // ── Anime ────────────────────────────────────────────────────────────────
  if (t.includes("anime")) {
    return {
      styleName: globalTheme,
      cameraLanguage: "Dynamic action angles. Speed-lines for motion. Dramatic low angles on power moments. Wide panning reveals. Static contemplative shots.",
      lightingLanguage: "Hard cel-shaded. Dramatic shadow cuts across face. Colour bloom on emotional peaks. Sunset orange/purple backgrounds.",
      audioLanguage: "Japanese-inspired orchestral. Ambient nature where appropriate. Dramatic silence before impact beats. No western orchestral defaults.",
      musicLanguage: "Synthesiser with orchestral layers. Emotional piano for quiet moments. Epic brass and percussion for action. Character theme motifs.",
      motionLanguage: "Speed-lines. Manga panel freeze-frames. Dynamic particle burst. Hair and fabric physics animation.",
      editingLanguage: "Impact freeze frames. Rapid action cuts. Slow-motion on emotional peaks. Manga panel overlay cuts.",
      typographyLanguage: "Bold japanese-aesthetic kanji-influenced styling. Strong weight. High contrast. Character name cards.",
      transitionLanguage: "Speed-line wipe. Flash transition. Manga panel cut. Dramatic freeze frame cuts.",
      vfxLanguage: "Speed lines. Dramatic wind particles. Light bloom on power moments. Cel-shade outline glow.",
      metadataRules: "Tags from: anime style, story theme, character archetypes, emotional beats. Never add realistic documentary tags.",
      colorRules: "Bold saturated palette. High contrast shadows. Vibrant accent colours per character. Dramatic sky gradients.",
      environmentRules: "Stylised real-world or fantasy environments. Iconic Japanese visual references where appropriate to script context.",
      forbiddenElements: "Photorealism, war documentary aesthetics, film grain, typewriter fonts, evidence boards, archival look.",
    };
  }

  // ── Cinematic 3D Render ───────────────────────────────────────────────────
  if (t.includes("cinematic 3d") || t.includes("3d render") || t.includes("cgi")) {
    return {
      styleName: globalTheme,
      cameraLanguage: "Precise cinematic angles. Slow dolly reveals. Dramatic crane lifts. Anamorphic lens behaviour. Never handheld.",
      lightingLanguage: "Studio-quality HDRI lighting. Dramatic volumetric god-rays where supported by scene. Physically accurate material response.",
      audioLanguage: "Premium cinematic ambient. Accurate location sound. Rich foley. No cartoon sound design.",
      musicLanguage: "Epic orchestral or hybrid electronic. Hans Zimmer-style layering concept (never referencing the name). Emotional swell on story moments.",
      motionLanguage: "Smooth, controlled camera paths. Subtle environment animation. Realistic cloth and hair simulation.",
      editingLanguage: "Premium cinema cuts. L-cuts and J-cuts. Match cuts on geometry. Slow cross-dissolve for reflection beats.",
      typographyLanguage: "Clean premium sans-serif. Minimal. High legibility. White on dark or dark on light. Never decorative.",
      transitionLanguage: "Seamless match cuts. Lens occlusion wipes. Slow cross-dissolve. Never flat wipes or anime cuts.",
      vfxLanguage: "Lens flares. Depth of field. Atmospheric haze. Chromatic aberration on wide shots. Subtle film grain.",
      metadataRules: "Tags from: story subject, visual style identifier (3d-render, cinematic), emotional tone. Never historical or war tags unless script explicitly covers war.",
      colorRules: "Neutral-to-warm grade. Teal-orange complementary contrast. Deep blacks. Clean highlights. No oversaturation.",
      environmentRules: "Photorealistic environment design. Accurate materials. Era-appropriate props if historical. No fantasy elements unless script requires.",
      forbiddenElements: "Cartoon outlines, cel-shading, anime effects, hand-drawn textures, paper or parchment overlays, watercolour.",
    };
  }

  // ── Noir ─────────────────────────────────────────────────────────────────
  if (t.includes("noir") || t.includes("neo noir")) {
    return {
      styleName: globalTheme,
      cameraLanguage: "Low-angle shadows. Dutch tilt for moral ambiguity. Slow reveals through doorways. Long lens isolation. Venetian blind light patterns.",
      lightingLanguage: "Hard single-source. Deep shadows filling 60% of frame. Venetian blind light streaks. Cigarette smoke atmosphere. Rain-reflected street lights.",
      audioLanguage: "Rain against glass. City night murmur. Jazz club distant. Lonely wind. Footsteps on wet pavement.",
      musicLanguage: "Muted trumpet. Walking jazz bass. Sparse piano. Minor key throughout. Never optimistic major chords.",
      motionLanguage: "Slow, deliberate. Long static holds. Very subtle camera drift. No energetic motion.",
      editingLanguage: "Long takes. Slow cross-dissolve. Hard cuts on dialogue reveals. Never fast action edits.",
      typographyLanguage: "Narrow serif. White on black. Slight distress texture. City signage aesthetic.",
      transitionLanguage: "Fade through black. Venetian blind wipe. Rain dissolve. Never bright or energetic transitions.",
      vfxLanguage: "Heavy film grain. Deep vignette. Rain overlay. Cigarette smoke particles. Low-contrast desaturated grade.",
      metadataRules: "Tags from: noir, mystery, moral ambiguity, story subject. Never military or war tags unless script covers those.",
      colorRules: "Near monochrome. Deep blacks. Cold blue for shadow. Warm amber for isolated subjects. No saturated colours.",
      environmentRules: "Night city. Rain-slicked streets. Dimly lit offices. Smoke-filled rooms. Never bright outdoor or modern clean environments.",
      forbiddenElements: "Bright lighting, warm colour grades, anime styles, 3D CGI renders, cartoons, historical documentary aesthetics.",
    };
  }

  // ── Documentary (default) ─────────────────────────────────────────────────
  return {
    styleName: globalTheme || "Documentary",
    cameraLanguage: "Purposeful cinematic movement. Natural dolly. Subtle handheld only when emotionally justified. Strong visual hierarchy.",
    lightingLanguage: "Natural motivated lighting. Realistic ambience. Never artificial studio look unless subject is in a studio.",
    audioLanguage: "Real-world environmental ambient. Authentic location sounds. No invented SFX that do not exist in the scene.",
    musicLanguage: "Minimal score. Supports story without dominating narration. Documentary strings and piano where appropriate.",
    motionLanguage: "Subtle, purposeful. Never decorative animation. Environment motion only (wind, water, crowd).",
    editingLanguage: "Invisible editorial. Purposeful cuts. Long takes on emotional moments. Never music-video style.",
    typographyLanguage: "Bold, clean, modern sans-serif. Location and date captions. Factual overlay only.",
    transitionLanguage: "Straight cuts. Slow dissolve for time passage. L-cuts for audio continuity. Never decorative transitions.",
    vfxLanguage: "Minimal. Subtle colour grade. Clean lens. Atmospheric depth only where physically present in scene.",
    metadataRules: "Tags strictly derived from: story subject, location, people, year, topic. Never invent unrelated tags.",
    colorRules: "Natural. Slightly warm grade. Accurate skin tones. No heavy colour manipulation. Consistent across documentary.",
    environmentRules: "Accurate real-world environments from script context. No invented locations. Era-accurate props and details.",
    forbiddenElements: "Fantasy elements, cartoon styles, anime, unrelated SFX, invented characters, fabricated locations.",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Scene Understanding Builder (Stage 1–4 reasoning in a single AI call)
// This is the architectural heart: ONE reasoning call that fills the
// SharedSceneUnderstanding object before any engine generates JSON.
// ─────────────────────────────────────────────────────────────────────────────
async function buildSceneUnderstanding(
  beat: VisualBeat,
  plan: ProductionPlan,
  analysis: StoryAnalysis,
  memory: SceneMemoryState[],
  nextBeat: VisualBeat | null,
  globalTheme: string,
  styleDNA: StyleDNAModel
): Promise<SharedSceneUnderstanding> {
  const reasoningPrompt = `
You are the Creative Director's Internal Reasoning Engine.
Your ONLY job is to reason about THIS SCENE ONLY and fill the SharedSceneUnderstanding object.
You do NOT look at any previous scenes or reuse any language.

THIS SCENE TEXT:
${beat.narration}

Generate a structured reasoning object based solely on this text and the global style DNA.
This reasoning object will be used by every downstream engine (Camera, Audio, Lighting, Metadata, Timeline, VFX, etc.) as the SINGLE SOURCE OF TRUTH.
No engine will re-analyze the script. They all read THIS object.

YOUR REASONING MUST BE:
- Derived 100% from the narration and story context
- Filtered through the selected Style DNA
- Free of generic defaults, military metaphors, or unrelated patterns
- Specific to THIS exact beat and THIS exact script

══════════════════════════════════════════════════════════════════════
SELECTED STYLE DNA (MASTER CONTROLLER)
══════════════════════════════════════════════════════════════════════
Style Name: ${styleDNA.styleName}
Camera Language: ${styleDNA.cameraLanguage}
Lighting Language: ${styleDNA.lightingLanguage}
Audio Language: ${styleDNA.audioLanguage}
Music Language: ${styleDNA.musicLanguage}
Motion Language: ${styleDNA.motionLanguage}
Editing Language: ${styleDNA.editingLanguage}
Typography Language: ${styleDNA.typographyLanguage}
Transition Language: ${styleDNA.transitionLanguage}
VFX Language: ${styleDNA.vfxLanguage}
Metadata Rules: ${styleDNA.metadataRules}
Color Rules: ${styleDNA.colorRules}
Environment Rules: ${styleDNA.environmentRules}
Forbidden Elements: ${styleDNA.forbiddenElements}

══════════════════════════════════════════════════════════════════════
YOUR TASK
══════════════════════════════════════════════════════════════════════
Perform 4 stages of reasoning to output ONLY a valid JSON object matching this exact schema:
{
  "beatId": "${beat.id}",
  "storySummary": "brief summary of the full story",
  "scriptExcerpt": "exact narration text",
  "beatPurpose": "Hook|Exposition|Discovery|Conflict|Climax|Resolution",
  "beatNarrativeFunction": "why this beat exists in the story arc",
  "sceneGoal": "what this scene must achieve for the viewer",
  "informationRevealed": "what new fact or emotion is revealed in this beat",
  "dominantEmotion": "single primary emotion word",
  "viewerEmotion": "what the viewer should feel watching this",
  "characterIntent": "what the subject is experiencing emotionally",
  "emotionalIntensity": "Low|Medium|High|Climactic",
  "timeContext": "era, year, time of day — derived from narration only",
  "locationContext": "where this scene takes place — from narration only",
  "environmentDescription": "physical environment details from narration",
  "characters": "who is present and their relationship",
  "subjects": "key objects, documents, or subjects visible in the scene",
  "historicalContext": "historical accuracy requirements if any",
  "primarySubject": "what the camera should prioritize",
  "visualMetaphor": "symbolic idea behind the visuals",
  "retentionHook": "what keeps the viewer watching",
  "visualPriority": "foreground/midground/background hierarchy",
  "audioPriority": "Ambient-led|Music-led|SFX-led",
  "musicMood": "emotional direction of music for this specific scene",
  "naturalSounds": "sounds that naturally exist in this environment",
  "directorCameraDecision": "SPECIFIC camera angle + movement chosen + one-sentence rationale from the narration and style",
  "directorLightingDecision": "SPECIFIC lighting decision chosen + one-sentence rationale",
  "directorAudioDecision": "SPECIFIC music + ambient chosen + one-sentence rationale",
  "directorEditingDecision": "SPECIFIC transition + pacing decision + one-sentence rationale",
  "editingRhythm": "Fast|Measured|Slow|Contemplative",
  "motionPriority": "specific camera motion style for this scene"
}

CRITICAL RULES:
- Every value must come from the narration, not from generic defaults
- Never use: war sounds, military terms, "abandoned warehouse", "battlefield" unless these words appear in the narration above
- Never copy from Scene Memory — generate fresh reasoning
- Output ONLY valid JSON — no markdown, no explanation, no wrapping
`;

  const raw = await callAI(reasoningPrompt, { mode: "text", responseFormat: "json_object" });
  let reasoning: any;
  try {
    reasoning = JSON.parse(raw);
  } catch {
    const cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();
    reasoning = JSON.parse(cleaned);
  }

  const understanding: SharedSceneUnderstanding = {
    ...reasoning,
    styleDNA,
  };

  return understanding;
}

// ─────────────────────────────────────────────────────────────────────────────
// SceneGenerator (Stage 5: Generate JSON from SharedSceneUnderstanding)
// ─────────────────────────────────────────────────────────────────────────────
export class SceneGenerator {
  public static async buildUnderstanding(
    beat: VisualBeat,
    plan: ProductionPlan,
    analysis: StoryAnalysis,
    memory: SceneMemoryState[],
    nextBeat: VisualBeat | null,
    globalTheme: string
  ): Promise<SharedSceneUnderstanding> {
    const styleDNA = resolveStyleDNA(globalTheme);
    return await buildSceneUnderstanding(beat, plan, analysis, memory, nextBeat, globalTheme, styleDNA);
  }

  public static async generateVisualField(understanding: SharedSceneUnderstanding, prevScenes: any[]): Promise<any> {
    for (let i = 0; i < 3; i++) {
      const prompt = `
You are the VISUAL ENGINE. Generate only visual fields based on the Scene Understanding.
Generate fields ONLY from THIS SCENE. Do NOT reference previous scenes or reuse wording.
UNDERSTANDING:
${JSON.stringify(understanding, null, 2)}

BEAT ID: ${understanding.beatId}

OUTPUT SCHEMA:
{
  "subject": "Main focus",
  "environment": "Physical environment",
  "action": "What happens",
  "composition": "Framing",
  "mood": "Visual mood",
  "visualNotes": "Additional storytelling details",
  "brollSuggestions": ["<item 1>", "<item 2>"]
}
`;
      const res = await callAI(prompt, { mode: "text", responseFormat: "json_object" });
      const data = JSON.parse(res.replace(/```json/g, "").replace(/```/g, "").trim());
      
      const errors = ValidationEngine.validateField('visual', data, prevScenes);
      if (errors.length === 0 || i === 2) return data;
      console.log(`[Visual Engine] Retrying due to validation errors: ${errors.join(', ')}`);
    }
  }

  public static async generateCameraField(understanding: SharedSceneUnderstanding, prevScenes: any[]): Promise<any> {
    for (let i = 0; i < 3; i++) {
      const prompt = `
You are the CAMERA ENGINE. Generate only camera fields based on the Scene Understanding.
Generate fields ONLY from THIS SCENE. Do NOT reference previous scenes.
UNDERSTANDING:
${JSON.stringify(understanding, null, 2)}

BEAT ID: ${understanding.beatId}

OUTPUT SCHEMA:
{
  "shotType": "e.g. Close Up",
  "cameraAngle": "e.g. Low Angle",
  "cameraLens": "e.g. 85mm",
  "cameraMovement": "e.g. Slow Push-in",
  "framing": "Framing details",
  "cinematicStyle": "Style notes",
  "sceneImagePrompts": ["High quality prompt for this scene 1", "Optional prompt 2", "Optional prompt 3"]
}
`;
      const res = await callAI(prompt, { mode: "text", responseFormat: "json_object" });
      const data = JSON.parse(res.replace(/```json/g, "").replace(/```/g, "").trim());
      
      const errors = ValidationEngine.validateField('camera', data, prevScenes);
      if (errors.length === 0 || i === 2) return data;
      console.log(`[Camera Engine] Retrying due to validation errors: ${errors.join(', ')}`);
    }
  }

  public static async generateArtDirectionField(understanding: SharedSceneUnderstanding, prevScenes: any[]): Promise<any> {
    for (let i = 0; i < 3; i++) {
      const prompt = `
You are the ART DIRECTION ENGINE. Generate only art direction fields.
Generate fields ONLY from THIS SCENE. Do NOT reference previous scenes.
UNDERSTANDING:
${JSON.stringify(understanding, null, 2)}

BEAT ID: ${understanding.beatId}

OUTPUT SCHEMA:
{
  "location": "Specific setting",
  "lighting": "Lighting setup",
  "colorPalette": "Color scheme",
  "props": "Key objects",
  "style": "Overall aesthetic",
  "atmosphere": "Atmospheric effects"
}
`;
      const res = await callAI(prompt, { mode: "text", responseFormat: "json_object" });
      const data = JSON.parse(res.replace(/```json/g, "").replace(/```/g, "").trim());
      
      const errors = ValidationEngine.validateField('art', data, prevScenes);
      if (errors.length === 0 || i === 2) return data;
      console.log(`[Art Engine] Retrying due to validation errors: ${errors.join(', ')}`);
    }
  }

  public static async generatePostProductionField(understanding: SharedSceneUnderstanding, prevScenes: any[]): Promise<any> {
    for (let i = 0; i < 3; i++) {
      const prompt = `
You are the POST PRODUCTION ENGINE. Generate only post production fields.
Generate fields ONLY from THIS SCENE. Do NOT reference previous scenes.
UNDERSTANDING:
${JSON.stringify(understanding, null, 2)}

BEAT ID: ${understanding.beatId}

OUTPUT SCHEMA:
{
  "editingStyle": "Editing rhythm",
  "transitions": "Transition types",
  "effects": "VFX",
  "motion": "Motion graphics",
  "soundSuggestions": "SFX/Audio",
  "colorGrading": "Grading notes"
}
`;
      const res = await callAI(prompt, { mode: "text", responseFormat: "json_object" });
      const data = JSON.parse(res.replace(/```json/g, "").replace(/```/g, "").trim());
      
      const errors = ValidationEngine.validateField('post', data, prevScenes);
      if (errors.length === 0 || i === 2) return data;
      console.log(`[Post Engine] Retrying due to validation errors: ${errors.join(', ')}`);
    }
  }

  // Legacy fallback for tests
  public static async generate(
    beat: VisualBeat,
    plan: ProductionPlan,
    analysis: StoryAnalysis,
    memory: SceneMemoryState[],
    globalTheme: string,
    existingScene?: any // For locking
  ): Promise<any> {
    const understanding = await this.buildUnderstanding(beat, plan, analysis, memory, null, globalTheme);
    const prevScenes = memory; // Passed to validator

    // Respect locks
    const locks = existingScene?.lockedFields || {};
    
    let v = existingScene && locks['visual'] ? existingScene : await this.generateVisualField(understanding, prevScenes);
    let c = existingScene && locks['camera'] ? existingScene : await this.generateCameraField(understanding, prevScenes);
    let a = existingScene && locks['art'] ? existingScene : await this.generateArtDirectionField(understanding, prevScenes);
    let p = existingScene && locks['post'] ? existingScene : await this.generatePostProductionField(understanding, prevScenes);
    
    // After initial generation, run uniqueness validation and regenerate duplicated fields if needed.
    let finalScene = { ...existingScene, ...v, ...c, ...a, ...p, sceneGoal: understanding.sceneGoal, content: beat.narration };
    // Uniqueness validation will be performed later in the pipeline after all scenes are collected.
    return finalScene;
  }
}
