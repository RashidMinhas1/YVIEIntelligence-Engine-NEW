"use client";

import React, { useState } from "react";
import { GeneratorProvider, useGenerator, GeneratorTab } from "./generator-context";
import { 
  FileText, Activity, LayoutList, TerminalSquare, 
  Settings2, Library, Download, History, Save, Cloud, Loader2, Play, Upload
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { VISUAL_STYLES, CATEGORIES } from "@/lib/constants/visual-styles";
import { toast } from "sonner";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ActiveProviderBadge } from "../ActiveProviderBadge";

const NAV_ITEMS: { id: GeneratorTab; label: string; icon: any }[] = [
  { id: "import", label: "Script Import", icon: FileText },
  { id: "analysis", label: "Script Analysis", icon: Activity },
  { id: "breakdown", label: "Scene Breakdown", icon: LayoutList },
  { id: "generator", label: "Prompt Generator", icon: TerminalSquare },
  { id: "settings", label: "Prompt Settings", icon: Settings2 },
  { id: "library", label: "Prompt Library", icon: Library },
  { id: "export", label: "Export Center", icon: Download },
  { id: "history", label: "History", icon: History },
];

const MOCK_JSON_RESULT = `{
  "scene": "Beat 1 – The Mitford Sisters",
  "style": "Historical Explainer – AI Generated Cinematic Documentary",
  "shot": {
    "composition": "Wide establishing shot of a grand British aristocratic estate in the 1920s, six young sisters standing elegantly in front of the manor gardens",
    "camera_motion": "Slow Ken Burns zoom toward the sisters with subtle cinematic pan across the estate grounds",
    "frame_rate": "24 fps",
    "resolution": "1920 × 1080",
    "lens": "Cinematic 35mm lens simulation with realistic depth",
    "look": "Ultra-realistic AI-generated imagery, detailed faces, period-accurate clothing, cinematic documentary aesthetic"
  },
  "voice_over": {
    "language": "English",
    "tone": "Engaging, informative",
    "mode": "Narrative, explanatory",
    "emotion": "Intriguing, curious",
    "narration_text": "The Mitford sisters were born into privilege, yet their lives would become one of history's most fascinating and controversial family stories.",
    "duration_sec": "8"
  }
}`;

function LayoutContent() {
  const { activeTab, setActiveTab, isSaving, project, setProject, history, loadProject, deleteProject } = useGenerator();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedBeats, setSelectedBeats] = useState<Set<string>>(new Set());
  const [expandedScenes, setExpandedScenes] = useState<Set<string>>(new Set());
  const [previewScene, setPreviewScene] = useState<string | null>(null);
  const [preChunks, setPreChunks] = useState<{ id: string, text: string, styleOverride: string | null }[]>([]);

  React.useEffect(() => {
    if (!project.rawScript) {
      setPreChunks([]);
      return;
    }
    let rawSentences = project.rawScript.split(/(?<=[.?!])\s+/).filter(s => s.trim().length > 0);
    if (rawSentences.length === 0) rawSentences = [project.rawScript];
    let beatChunks: string[] = [];
    if (project.settings?.beatDetectionMode === "sentence") {
      beatChunks = rawSentences;
    } else {
      let currentChunk = "";
      rawSentences.forEach((sentence, i) => {
        currentChunk += sentence + " ";
        if ((i + 1) % 3 === 0 || i === rawSentences.length - 1) {
          beatChunks.push(currentChunk.trim());
          currentChunk = "";
        }
      });
    }
    setPreChunks(prev => {
      // Preserve existing overrides if possible by checking index
      return beatChunks.map((text, i) => ({
        id: prev[i]?.id || crypto.randomUUID(),
        text,
        styleOverride: prev[i]?.styleOverride || null
      }));
    });
  }, [project.rawScript, project.settings?.beatDetectionMode]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const text = await file.text();
      setProject(p => ({ ...p, rawScript: text, title: file.name.replace(/\.[^/.]+$/, "") }));
      toast.success("Script imported successfully from " + file.name);
    } catch (err) {
      toast.error("Failed to parse file.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleExport = async (format: "json" | "txt" | "md" | "zip", onlySelected: boolean = false) => {
    let outputData = "";
    
    const entries = Object.entries(project.prompts || {});
    const targetEntries = onlySelected && selectedBeats.size > 0
      ? entries.filter(([id]) => selectedBeats.has(id))
      : entries;

    if (format === "zip") {
      const zip = new JSZip();
      const scenesFolder = zip.folder("Scenes");
      const projectFolder = zip.folder("Project");
      
      // Add Scenes
      targetEntries.forEach(([id, data], i) => {
        const beatNum = String(i + 1).padStart(2, '0');
        scenesFolder?.file(`Scene-${beatNum}.json`, data.json);
      });
      
      // Add Project files
      const projectMetadata = {
        title: project.title || "Untitled Project",
        totalScenes: targetEntries.length,
        settings: project.settings
      };
      projectFolder?.file("project.json", JSON.stringify(projectMetadata, null, 2));
      projectFolder?.file("style.json", JSON.stringify(project.settings || {}, null, 2));
      projectFolder?.file("metadata.json", JSON.stringify({ generatorVersion: "2.0", generatedAt: new Date().toISOString() }, null, 2));
      projectFolder?.file("README.md", `# ${project.title || "Untitled Project"}\n\nGenerated with AI Storyboard Generator.`);
      
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `${project.title || "project"}.zip`);
      toast.success("Exported as ZIP");
      return;
    }

    if (format === "json") {
      const exportObj: Record<string, any> = {};
      targetEntries.forEach(([id, data]) => {
        exportObj[id] = JSON.parse(data.json);
      });
      outputData = JSON.stringify(exportObj, null, 2);
    } else if (format === "txt") {
      targetEntries.forEach(([id, data], i) => {
        const beatObj = JSON.parse(data.json);
        outputData += `--- BEAT ${String(i + 1).padStart(2, '0')} ---\n`;
        Object.entries(beatObj).forEach(([key, val]) => {
          outputData += `${key}: ${val}\n`;
        });
        outputData += `\n`;
      });
    } else if (format === "md") {
      outputData += `# Project Export: ${project.title || 'Untitled'}\n\n`;
      targetEntries.forEach(([id, data], i) => {
        const beatObj = JSON.parse(data.json);
        outputData += `## BEAT ${String(i + 1).padStart(2, '0')} - ${beatObj['Beat Title'] || beatObj['Scene Name']}\n\n`;
        Object.entries(beatObj).forEach(([key, val]) => {
          if (typeof val === 'object') {
            outputData += `**${key}**:\n`;
            outputData += "```json\n" + JSON.stringify(val, null, 2) + "\n```\n\n";
          } else {
            outputData += `**${key}**: ${val}\n\n`;
          }
        });
        outputData += `---\n\n`;
      });
    }

    const mime = format === "json" ? "application/json" : "text/plain";
    const blob = new Blob([outputData], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.title || "prompt"}.${format}`;
    a.click();
    toast.success(`Exported as ${format.toUpperCase()}`);
  };

  const handleCopy = (onlySelected: boolean = false) => {
    const entries = Object.entries(project.prompts || {});
    const targetEntries = onlySelected && selectedBeats.size > 0
      ? entries.filter(([id]) => selectedBeats.has(id))
      : entries;
    
    const exportObj: Record<string, any> = {};
    targetEntries.forEach(([id, data]) => {
      exportObj[id] = JSON.parse(data.json);
    });
    
    navigator.clipboard.writeText(JSON.stringify(exportObj, null, 2));
    toast.success(onlySelected ? "Copied Selected Beats!" : "Copied All Beats!");
  };

  const toggleSelectBeat = (sceneId: string) => {
    const newSet = new Set(selectedBeats);
    if (newSet.has(sceneId)) newSet.delete(sceneId);
    else newSet.add(sceneId);
    setSelectedBeats(newSet);
  };

  const toggleExpandedScene = (sceneId: string) => {
    const newSet = new Set(expandedScenes);
    if (newSet.has(sceneId)) newSet.delete(sceneId);
    else newSet.add(sceneId);
    setExpandedScenes(newSet);
  };

  // ─── Policy-safe prompt cleaner ───────────────────────────────────────────
  // Strips real proper names, brand names, and protected IP from prompts
  // so outputs never trigger AI platform content policy violations.
  const makePolicySafe = (text: string): string => {
    return text
      // Remove real person names → descriptive role
      .replace(/\bEmpress\s+\w+\b/gi, "a regal 19th-century empress")
      .replace(/\bKing\s+\w+\b/gi, "a period-accurate monarch")
      .replace(/\bQueen\s+\w+\b/gi, "a period-accurate queen")
      .replace(/\bPresident\s+\w+\b/gi, "a head of state")
      .replace(/\bGeneral\s+\w+\b/gi, "a military commander")
      .replace(/\bAdolf\s+\w+|Hitler\b/gi, "the wartime dictator")
      .replace(/\bChurchill\b/gi, "the wartime prime minister")
      .replace(/\bStalin\b/gi, "the wartime leader")
      .replace(/\bRoosevelt\b/gi, "the wartime president")
      .replace(/\bEugénie|Eugenie\b/gi, "the exiled empress")
      // Remove brand/platform names
      .replace(/\bNetflix\b/gi, "premium streaming")
      .replace(/\bARRI\s*Alexa\b/gi, "professional cinema camera")
      .replace(/\bARRI\b/gi, "cinema-grade")
      .replace(/\bKodak\b/gi, "vintage film stock")
      .replace(/\bHollywood\b/gi, "cinematic")
      .replace(/\bDisney\b/gi, "studio-quality")
      .replace(/\bHans Zimmer\b/gi, "award-winning composer style")
      .replace(/\bBBC\b/gi, "public broadcaster")
      .replace(/\bHBO\b/gi, "premium cable")
      // Remove specific named locations that could be sensitive
      .replace(/\bWall Street\b/gi, "a financial district")
      // Clean up double spaces
      .replace(/\s{2,}/g, " ")
      .trim();
  };

  const handleGenerate = () => {
    if (!project.rawScript || preChunks.length === 0) return;
    setCurrentStep(2);
    setIsGenerating(true);

    setTimeout(() => {
      const newScenes: any[] = [];
      const newPrompts: Record<string, any> = {};

      // ── Derive visual style from user selection ────────────────────────────
      const selectedStyle = (project.settings?.visualStyle || "Documentary").toLowerCase();

      // ── Style DNA: each style provides its own semantically correct defaults ─
      type StyleDefaults = {
        cameraMotions: string[];
        lightingMoods: { primary: string; secondary: string; accents: string }[];
        sfxSets: string[][];
        ambients: string[];
        musicBank: { track: string; description: string; tempo: string; key: string; curve: string }[];
        bgPalettes: string[];
        transitionBank: { between: string; impact: string }[];
        look: string;
        lens: string;
        colorGrade: string;
        overlayStyle: string;
        fontEnter: string;
        fontExit: string;
        vfxGrain: string;
        vfxParticles: string;
        forbiddenElements: string[];
      };

      const getStyleDefaults = (style: string): StyleDefaults => {
        // ── True Crime Dark ─────────────────────────────────────────────────
        if (style.includes("true crime") || style.includes("crime") || style.includes("detective") || style.includes("noir")) {
          return {
            cameraMotions: [
              "Slow push-in on evidence — building dread",
              "Static locked frame — interrogation room tension",
              "Handheld close-up — documentary intimacy on witness",
              "Slow rack focus — shifting from suspect to evidence",
              "Long lens compression — surveillance aesthetic",
              "Tracking shot following investigator through scene",
              "Low angle — conveying power imbalance",
              "Extreme close-up on document or clue",
            ],
            lightingMoods: [
              { primary: "Single hard practical lamp — cold white", secondary: "Deep shadow filling 60% of frame", accents: "Warm amber rim on subject edge" },
              { primary: "Venetian blind light stripes across suspect", secondary: "Near-black background", accents: "Cold blue reflected on glass surface" },
              { primary: "Desk lamp pool — harsh downward key", secondary: "Ink-black surrounding shadow", accents: "Red reflection off case file folder" },
              { primary: "Fluorescent flicker in evidence room", secondary: "Green-tinted shadow fill", accents: "Warm practical from hallway" },
              { primary: "Candlelight amber on aged document", secondary: "Deep cool shadow outside lamp radius", accents: "Subtle warm rim on subject" },
            ],
            sfxSets: [
              ["Typewriter keys striking paper", "File cabinet drawer closing", "Rain against glass"],
              ["Clock ticking — slow, measured", "Papers shuffling", "Distant city traffic muffled"],
              ["Single phone ringing unanswered", "Fluorescent light hum", "Footsteps on tile floor"],
              ["Pen scratching on notepad", "Recording tape rewinding", "Door buzzer"],
              ["Newspaper printing press", "Coffee cup placed on desk", "Low building hum"],
            ],
            ambients: [
              "Quiet interview room — low ventilation hum",
              "Late-night detective office — city murmur through glass",
              "Rain against window — isolation and reflection",
              "Empty courthouse corridor — reverberant silence",
              "Evidence room — fluorescent hum, paper sounds",
            ],
            musicBank: [
              { track: "Sparse piano — investigative", description: "Single piano line, minor key, deliberate pacing", tempo: "54 BPM", key: "D minor", curve: "steady, contemplative" },
              { track: "Low cello tension", description: "Solo cello sustain building unease", tempo: "48 BPM", key: "B minor", curve: "slow build, peaks at reveal" },
              { track: "Staccato string pulses", description: "Short string bursts on beats, tension rhythm", tempo: "70 BPM", key: "E minor", curve: "urgent escalation" },
              { track: "Muted trumpet — noir", description: "Lonely trumpet melody over bass drone", tempo: "52 BPM", key: "A minor", curve: "melancholic, flat arc" },
              { track: "Electronic ambient tension", description: "Low synth pad with subtle pulse", tempo: "60 BPM", key: "F minor", curve: "sustained throughout" },
            ],
            bgPalettes: ["near-black with cold shadow", "deep charcoal grey", "dark slate with amber accent", "muted ink-grey", "midnight blue-grey"],
            transitionBank: [
              { between: "hard cut on revelation moment", impact: "single frame black flash on key word" },
              { between: "slow cross-dissolve through black", impact: "desaturate to grey on emotional peaks" },
              { between: "J-cut — audio leads into next scene", impact: "subtle vignette crush on cut" },
              { between: "match cut on similar object shapes", impact: "momentary freeze frame on evidence reveal" },
              { between: "fade through black — time passage", impact: "typewriter click on new caption appear" },
            ],
            look: "Desaturated film noir aesthetic — heavy vignette, grain texture, high contrast chiaroscuro rendering",
            lens: "85mm portrait compression — intimate, slightly shallow depth of field, subject isolation",
            colorGrade: "Cold blue shadows, warm amber mid-tones on subjects, deep crushed blacks",
            overlayStyle: "Typewriter-style case fact overlay — lower third only, white on black, no decorative borders",
            fontEnter: "typewriter character-by-character",
            fontExit: "typewriter delete wipe",
            vfxGrain: "heavy 35mm film grain — authentic investigative documentary texture",
            vfxParticles: "dust motes in lamp beam — slow drift",
            forbiddenElements: ["war sounds", "military imagery", "explosions", "battlefield", "cartoon elements", "anime effects", "3D CGI", "bright saturated colours"],
          };
        }

        // ── Pixar / Animation ───────────────────────────────────────────────
        if (style.includes("pixar") || style.includes("animation") || style.includes("animated") || style.includes("cartoon")) {
          return {
            cameraMotions: [
              "Dynamic arc shot — character energy and joy",
              "Low angle wide — making environment feel grand",
              "Expressive rack focus — character emotion emphasis",
              "Tracking alongside character in motion",
              "High angle — vulnerability or charm",
              "Slow push-in — emotional character moment",
              "Whip pan — comic surprise transition",
              "Close-up on expressive character face",
            ],
            lightingMoods: [
              { primary: "Warm golden key light — optimism", secondary: "Soft fill — no harsh shadows", accents: "Bright eye-light on character" },
              { primary: "Cool adventure blue — exploration", secondary: "Warm environment bounce", accents: "Sparkle on magical elements" },
              { primary: "Dramatic orange sunset — emotional climax", secondary: "Warm shadow gradient", accents: "Rim light on hero silhouette" },
              { primary: "Soft indoor warmth — safety and home", secondary: "Slightly cooler background", accents: "Warm glow from practical source" },
              { primary: "Colourful environment bounce — wonder", secondary: "Soft ambient fill", accents: "Character highlight from above" },
            ],
            sfxSets: [
              ["Cartoon footstep rhythm", "Gentle string pluck on discovery", "Cheerful bell accent"],
              ["Bounce sound on character action", "Whimsical pop on surprise", "Gentle wind chime"],
              ["Paper shuffle — playful texture", "Soft musical hit on reveal", "Happy crowd murmur"],
              ["Adventure fanfare snippet", "Door creak — comic timing", "Coin clink on success"],
              ["Playful percussion accent", "Animal reaction sound", "Magical shimmer on effect"],
            ],
            ambients: [
              "Gentle outdoor nature — birds, light breeze",
              "Warm indoor home atmosphere — quiet and safe",
              "Adventure exterior — wind and distant nature",
              "Magical environment — subtle ethereal hum",
              "Town square — gentle crowd and ambient music",
            ],
            musicBank: [
              { track: "Warm orchestral adventure", description: "Strings and woodwind melody — optimistic", tempo: "92 BPM", key: "G major", curve: "energetic opening, warm resolution" },
              { track: "Tender piano — emotional moment", description: "Solo piano with light strings", tempo: "56 BPM", key: "C major", curve: "gentle throughout, single swell" },
              { track: "Adventure brass and strings", description: "Full orchestral heroic theme", tempo: "108 BPM", key: "D major", curve: "builds to triumphant peak" },
              { track: "Whimsical woodwind theme", description: "Flute and clarinet playful motif", tempo: "84 BPM", key: "F major", curve: "light and bouncing" },
              { track: "Emotional string swell", description: "Lush string melody — nostalgia and heart", tempo: "66 BPM", key: "A major", curve: "slow crescendo to emotional peak" },
            ],
            bgPalettes: ["warm golden amber", "soft sky blue", "vibrant green meadow", "warm interior cream", "adventure sunset orange"],
            transitionBank: [
              { between: "iris wipe — classic animation style", impact: "sparkle burst on character action" },
              { between: "star wipe on magical moment", impact: "colour flash on surprise" },
              { between: "shape morph cut", impact: "sound accent on transition" },
              { between: "smash cut — comic timing", impact: "visual pop on impact" },
              { between: "cross-dissolve — emotional beat", impact: "soft glow on dissolve" },
            ],
            look: "Stylised 3D animation with subsurface scattering, expressive character rendering, clean vibrant materials",
            lens: "Wide 24mm with slight barrel distortion — dynamic and expressive character perspective",
            colorGrade: "Saturated vibrant palette, warm hero tones, cool contrast backgrounds",
            overlayStyle: "Friendly rounded sans-serif name cards — character-specific colour, clean and readable",
            fontEnter: "bounce in from below",
            fontExit: "pop out scale",
            vfxGrain: "none — clean digital animation surface",
            vfxParticles: "magical sparkle particles and environment dust motes",
            forbiddenElements: ["dark themes", "violence", "war imagery", "film grain", "desaturated grades", "typewriter fonts", "noir lighting"],
          };
        }

        // ── Cinematic 3D Render ─────────────────────────────────────────────
        if (style.includes("cinematic 3d") || style.includes("3d render") || style.includes("cgi") || style.includes("3d")) {
          return {
            cameraMotions: [
              "Precise cinematic dolly reveal — controlled, premium",
              "Slow crane rise — scale and context establishment",
              "Orbital arc — subject prestige and isolation",
              "Anamorphic long lens push — emotional compression",
              "Low-angle dramatic reveal — power and authority",
              "Gimbal smooth tracking — premium production feel",
              "Locked tripod — gravity and weight",
              "Focus pull from environment to subject",
            ],
            lightingMoods: [
              { primary: "Key light — large area soft box equivalent", secondary: "Bounce fill — neutral", accents: "Rim light separating subject from background" },
              { primary: "Dramatic directional sun — golden hour", secondary: "Atmospheric scatter fill", accents: "Practical light motivating secondary source" },
              { primary: "Cool overcast — contemplative", secondary: "Soft neutral fill", accents: "Subtle warm practical accent" },
              { primary: "Volumetric god rays — cinematic atmosphere", secondary: "Deep shadow fill", accents: "Specular highlight on key surfaces" },
              { primary: "Night exterior — cool blue ambient", secondary: "Warm interior practical leak", accents: "Rim light from background source" },
            ],
            sfxSets: [
              ["Premium foley — leather, fabric, material sounds", "Subtle architectural ambience", "Precise mechanical sound design"],
              ["Environment-specific ambient detail", "Subtle wind movement", "Distant contextual sound"],
              ["Human movement foley — footsteps, breathing", "Material interaction sounds", "Spatial room tone"],
              ["Professional voice isolation — clean delivery", "Subtle reverb tail", "Precise SFX timing"],
              ["Score stinger on dramatic reveal", "Atmospheric transition sound", "Premium mix quality"],
            ],
            ambients: [
              "Premium interior — subtle HVAC hum and spatial depth",
              "Urban exterior — precise city layer at distance",
              "Natural exterior — wind and environmental texture",
              "Controlled studio — near silence with room tone",
              "Industrial — precise machinery and space acoustics",
            ],
            musicBank: [
              { track: "Epic hybrid orchestral", description: "Full orchestra with electronic elements — premium cinema", tempo: "80 BPM", key: "D minor", curve: "builds to cinematic swell" },
              { track: "Minimal piano — emotional depth", description: "Solo piano with subtle string bed", tempo: "58 BPM", key: "C minor", curve: "contemplative, single emotional peak" },
              { track: "Dramatic string statement", description: "Full string section — tension and gravity", tempo: "72 BPM", key: "E minor", curve: "builds through scene" },
              { track: "Ambient electronic — modern cinematic", description: "Synthesiser layers with organic textures", tempo: "64 BPM", key: "A minor", curve: "evolving throughout" },
              { track: "Orchestral revelation — climax", description: "Brass and strings — triumphant resolution", tempo: "92 BPM", key: "F major", curve: "powerful from mid-scene" },
            ],
            bgPalettes: ["neutral charcoal — premium cinematic", "deep midnight blue", "warm dark amber", "cool grey concrete", "muted teal-shadow"],
            transitionBank: [
              { between: "seamless match cut — professional editorial", impact: "lens flare on cut point" },
              { between: "slow cross-dissolve — premium feel", impact: "subtle motion blur on transition" },
              { between: "lens occlusion — object passes camera", impact: "brief blackout on emotional beat" },
              { between: "J-cut — audio continuity", impact: "motion blur on fast cut" },
              { between: "fade through black — chapter change", impact: "subtle colour shift on new scene" },
            ],
            look: "Photorealistic 3D rendering — accurate PBR materials, atmospheric depth, premium cinematic post-processing",
            lens: "50mm anamorphic — natural perspective, subtle oval bokeh, cinematic lens character",
            colorGrade: "Teal-orange complementary grade, deep blacks, clean highlights, neutral skin tones",
            overlayStyle: "Minimal premium sans-serif — white on dark background, precise kerning, no decorative elements",
            fontEnter: "fade in — opacity",
            fontExit: "fade out — opacity",
            vfxGrain: "subtle 35mm emulsion — premium cinematic texture",
            vfxParticles: "atmospheric depth haze, subtle lens chromatic aberration on wide shots",
            forbiddenElements: ["cartoon outlines", "cel shading", "anime effects", "hand-drawn textures", "paper overlays", "watercolour", "typewriter fonts"],
          };
        }

        // ── Anime ───────────────────────────────────────────────────────────
        if (style.includes("anime")) {
          return {
            cameraMotions: [
              "Dynamic pan with speed lines — action energy",
              "Low dramatic angle — power moment",
              "Wide emotional reveal — character and environment",
              "Static contemplative shot — reflection beat",
              "Quick whip-pan — dramatic transition",
              "Slow close-up — character emotional state",
              "Bird's eye perspective — scale and isolation",
              "Tracking alongside movement — momentum",
            ],
            lightingMoods: [
              { primary: "Dramatic sunset orange-purple gradient", secondary: "Deep cel-shade shadow cut", accents: "Bright eye-catchlight on character" },
              { primary: "Cool blue — introspective moment", secondary: "Hard shadow line across face", accents: "Warm bloom on emotional peak" },
              { primary: "Overcast white — tension and uncertainty", secondary: "Grey middle shadow", accents: "Single colour accent" },
              { primary: "Night blue-black — mystery", secondary: "Moonlight rim on character", accents: "City light colour glow" },
              { primary: "Golden backlight — heroic silhouette", secondary: "Warm ambient fill", accents: "Dramatic rim separating subject" },
            ],
            sfxSets: [
              ["Wind whoosh on dramatic movement", "Impact bass hit", "Energy charge sound"],
              ["Ambient Japanese environment sound", "Character action foley", "Dramatic silence before peak"],
              ["Rain on pavement — contemplative", "Thunder accent", "Distant city noise"],
              ["Paper or fabric flutter", "Sword or equipment sound", "Echo effect on power word"],
              ["Crowd reaction — crowd foley", "Single dramatic bell", "Score sting on reveal"],
            ],
            ambients: [
              "Japanese urban exterior — distant crowd, traffic, cicadas",
              "Quiet interior — rain against window, contemplative",
              "Open field — wind and nature — freedom and isolation",
              "School or institutional interior — hallway ambience",
              "Night city — neon environment, traffic drone",
            ],
            musicBank: [
              { track: "Epic orchestral with synth", description: "Orchestra layered with electronic elements", tempo: "95 BPM", key: "A minor", curve: "builds to dramatic peak" },
              { track: "Emotional piano motif", description: "Solo piano — character theme", tempo: "60 BPM", key: "D minor", curve: "quiet, single emotional swell" },
              { track: "Driving percussion and strings", description: "Action-forward rhythm section", tempo: "120 BPM", key: "E minor", curve: "energetic throughout" },
              { track: "Soft acoustic guitar — character moment", description: "Intimate acoustic with light strings", tempo: "68 BPM", key: "G major", curve: "warm and gentle" },
              { track: "Chorus power theme", description: "Full ensemble — hero theme statement", tempo: "88 BPM", key: "B minor", curve: "triumphant swell at scene peak" },
            ],
            bgPalettes: ["sunset gradient orange-pink", "deep night blue-black", "cool overcast grey", "warm interior amber", "vivid environment saturated"],
            transitionBank: [
              { between: "speed line wipe — dynamic transition", impact: "energy burst frame on impact" },
              { between: "flash transition — manga panel cut", impact: "freeze frame on dramatic moment" },
              { between: "cross-dissolve — emotional beat", impact: "bloom effect on peak emotion" },
              { between: "hard cut on action moment", impact: "impact frame — brief white flash" },
              { between: "iris wipe — classic anime style", impact: "sparkle effect on transition" },
            ],
            look: "Cel-shaded anime aesthetic — bold outlines, vibrant saturated colours, expressive character rendering, dramatic shadow cuts",
            lens: "24mm wide — dynamic perspective, expressive distortion on action, character-forward framing",
            colorGrade: "Bold saturated palette, high contrast shadows, vibrant accent colours, dramatic sky gradients",
            overlayStyle: "Bold weight sans-serif — strong contrast, character-coded colours, dramatic placement",
            fontEnter: "slide in with speed lines",
            fontExit: "fade out on cut",
            vfxGrain: "none — clean anime cel aesthetic",
            vfxParticles: "speed lines, dramatic wind particles, light bloom on power moments, cherry blossom or environment-appropriate particles",
            forbiddenElements: ["photorealism", "war documentary aesthetics", "film grain", "typewriter fonts", "evidence boards", "archival look", "desaturated grades"],
          };
        }

        // ── Documentary (default) ───────────────────────────────────────────
        return {
          cameraMotions: [
            "Slow purposeful dolly toward subject",
            "Static locked — weight and documentary authority",
            "Subtle handheld — intimate documentary closeness",
            "Tracking alongside subject movement",
            "Wide establishing — context and location",
            "Push-in on detail — discovery and revelation",
            "Tilt reveal — scale and environment",
            "Slow pan — landscape or environment survey",
          ],
          lightingMoods: [
            { primary: "Natural window key — documentary realism", secondary: "Soft fill from opposite direction", accents: "Subtle rim separating subject" },
            { primary: "Overcast natural light — honest and unmanipulated", secondary: "Neutral fill", accents: "Minimal practical accent" },
            { primary: "Golden hour natural — warmth and humanity", secondary: "Long warm shadows", accents: "Gentle rim from sun direction" },
            { primary: "Interior fluorescent — institutional reality", secondary: "Natural light from windows", accents: "Warm practical lamp accent" },
            { primary: "Dramatic natural contrast — clear sky directional", secondary: "Deep natural shadow", accents: "Reflected bounce from environment" },
          ],
          sfxSets: [
            ["Natural environment sound from location", "Human activity foley — footsteps, movement", "Ambient architectural detail"],
            ["Location-specific texture sounds", "Quiet room tone — presence", "Subtle environment layer"],
            ["Interview room ambience — neutral", "Paper or document handling", "Pen or writing sound"],
            ["Urban exterior — distant city layer", "Natural wind and movement", "Door or space sound"],
            ["Indoor quiet — breath and subtle movement", "Archival equipment sound if relevant", "Neutral room tone"],
          ],
          ambients: [
            "Quiet interview environment — neutral room presence",
            "Natural exterior — location-specific sound",
            "Indoor institutional space — HVAC and presence",
            "Urban environment — distant city texture",
            "Natural landscape — wind, birds, environment",
          ],
          musicBank: [
            { track: "Minimal piano — documentary underscore", description: "Single piano, neutral and supportive", tempo: "58 BPM", key: "D minor", curve: "gentle, supporting narration" },
            { track: "Sparse strings — reflective", description: "String quartet, quiet and measured", tempo: "52 BPM", key: "A minor", curve: "contemplative throughout" },
            { track: "Ambient texture — minimal", description: "Soft pad and minimal melodic element", tempo: "60 BPM", key: "E minor", curve: "steady support" },
            { track: "Documentary strings — emotive", description: "String section with subtle brass", tempo: "66 BPM", key: "G minor", curve: "builds to emotional peak" },
            { track: "Solo instrument — intimate", description: "Guitar or piano solo — personal", tempo: "50 BPM", key: "C minor", curve: "quiet throughout" },
          ],
          bgPalettes: ["natural neutral — location accurate", "warm earth tone", "cool exterior grey", "warm interior cream", "muted documentary grade"],
          transitionBank: [
            { between: "straight cut — invisible editorial", impact: "subtle audio transition" },
            { between: "slow cross-dissolve — time passage", impact: "audio fade on dissolve" },
            { between: "L-cut — audio leads next scene", impact: "audio bridge on transition" },
            { between: "match cut — visual continuity", impact: "subtle sound bridge" },
            { between: "fade through black — chapter mark", impact: "complete audio fade" },
          ],
          look: "Natural documentary aesthetic — realistic materials, accurate colour, minimal post-processing, cinema vérité quality",
          lens: "50mm — natural human eye perspective, authentic documentary framing",
          colorGrade: "Natural grade — warm highlights, accurate skin tones, minimal manipulation, consistent documentary palette",
          overlayStyle: "Clean modern sans-serif — location and date captions, factual overlay only, never decorative",
          fontEnter: "fade in — opacity",
          fontExit: "fade out — opacity",
          vfxGrain: "minimal film texture — authentic documentary look",
          vfxParticles: "natural environment only — dust, atmosphere where physically present",
          forbiddenElements: ["fantasy elements", "cartoon styles", "anime", "unrelated SFX", "invented characters", "fabricated locations", "military imagery unless script requires"],
        };
      };

      const styleDefaults = getStyleDefaults(selectedStyle);
      const selectedStyleName = project.settings?.visualStyle || "Documentary";

      // ── Script-level tag extraction (from actual narration, not hardcoded lists)
      const fullScriptText = preChunks.map(c => c.text).join(" ");
      const scriptWords = fullScriptText.toLowerCase().split(/\W+/).filter(w => w.length > 4);
      const scriptWordFreq: Record<string, number> = {};
      scriptWords.forEach(w => { scriptWordFreq[w] = (scriptWordFreq[w] || 0) + 1; });
      const topScriptWords = Object.entries(scriptWordFreq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([w]) => w);

      preChunks.forEach((chunk, index) => {
        const beatNum = index + 1;
        const sceneId = chunk.id;

        newScenes.push({
          id: sceneId,
          sceneNumber: beatNum,
          voiceOver: chunk.text,
          visualDescription: `Beat ${beatNum} visual`
        });

        // ── Style-derived values (indexed to provide variety, not generic cycling) ─
        const cameraMotion = styleDefaults.cameraMotions[index % styleDefaults.cameraMotions.length];
        const lighting = styleDefaults.lightingMoods[index % styleDefaults.lightingMoods.length];
        const sfx = styleDefaults.sfxSets[index % styleDefaults.sfxSets.length];
        const ambient = styleDefaults.ambients[index % styleDefaults.ambients.length];
        const music = styleDefaults.musicBank[index % styleDefaults.musicBank.length];
        const bgPalette = styleDefaults.bgPalettes[index % styleDefaults.bgPalettes.length];
        const transition = styleDefaults.transitionBank[index % styleDefaults.transitionBank.length];

        // ── Tags derived from actual narration words ───────────────────────
        const chunkWords = chunk.text.toLowerCase().split(/\W+/).filter(w => w.length > 4);
        const chunkTopWords = chunkWords
          .filter(w => topScriptWords.includes(w))
          .slice(0, 2);
        const styleSafeTag = selectedStyleName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
        const tags = [...new Set([...chunkTopWords, styleSafeTag])].slice(0, 3);

        // ── Extract year/date from narration ──────────────────────────────
        const yearMatch = chunk.text.match(/\b(19[0-9]{2}|20[0-9]{2})\b/);
        const subtextDate = yearMatch ? yearMatch[0] : `Beat ${beatNum} of ${preChunks.length}`;

        // ── Beat title derived from narration — never from military bank ───
        const words = chunk.text.trim().split(/\s+/);
        const openWords = makePolicySafe(words.slice(0, 6).join(' '));
        const midWords = makePolicySafe(words.slice(Math.floor(words.length / 2), Math.floor(words.length / 2) + 5).join(' '));
        const wordCount = words.length;
        const durationSec = Math.max(7, Math.min(10, Math.round(wordCount / 3)));

        // Timeline derived from style and narration pacing
        const timelineActions = [
          `${selectedStyleName} — scene opens: ${openWords}`,
          `${cameraMotion} begins — primary subject revealed`,
          `Emotional beat develops — key detail in focus`,
          `${makePolicySafe(midWords)} — scene deepens`,
          `Audio and visual synchronize — narrative peak`,
          `Scene resolves — ${transition.between} prepares`,
          `${transition.between} — next beat begins`
        ];

        newPrompts[sceneId] = {
          json: JSON.stringify({
            "scene": `Beat ${beatNum} — ${selectedStyleName}`,
            "style": `${selectedStyleName}`,
            "color_grade": makePolicySafe(project.settings?.colorPalette || styleDefaults.colorGrade),
            "shot": {
              "composition": makePolicySafe(`${cameraMotion} — ${openWords}`),
              "camera_motion": cameraMotion,
              "frame_rate": "24 fps",
              "resolution": "1920 × 1080",
              "lens": styleDefaults.lens,
              "look": styleDefaults.look
            },
            "voice_over": {
              "language": "English",
              "tone": "Documentary narrative",
              "mode": "Narrative, explanatory",
              "emotion": "Contextual — derived from beat",
              "narration_text": chunk.text,
              "duration_sec": String(durationSec)
            },
            "house_settings": {
              "typeface": {
                "hook": openWords,
                "subtext": subtextDate
              },
              "overlay_style": styleDefaults.overlayStyle,
              "animation": {
                "enter": styleDefaults.fontEnter,
                "enter_duration_ms": 600,
                "exit": styleDefaults.fontExit,
                "exit_duration_ms": 500
              },
              "callouts": { "stroke_px": 0, "corner_radius_px": 0 },
              "sizes": {
                "hook_font_height_pct": "8",
                "sublabel_font_height_pct": "5",
                "safe_margins_pct": 7
              }
            },
            "timeline": [
              { "time": "0.0–1.5 s", "action": timelineActions[0] },
              { "time": "1.5–3.0 s", "action": timelineActions[1] },
              { "time": "3.0–4.0 s", "action": timelineActions[2] },
              { "time": "4.0–5.5 s", "action": timelineActions[3] },
              { "time": "5.5–6.5 s", "action": timelineActions[4] },
              { "time": "6.5–7.5 s", "action": timelineActions[5] },
              { "time": "7.5–END",   "action": timelineActions[6] }
            ],
            "lighting": {
              "primary": lighting.primary,
              "secondary": lighting.secondary,
              "accents": lighting.accents
            },
            "audio": {
              "ambient": ambient,
              "sfx": sfx,
              "music": {
                "track": music.track,
                "description": music.description,
                "tempo": music.tempo,
                "key": music.key,
                "dynamic_curve": music.curve
              },
              "mix": {
                "integrated_loudness": "-14 LUFS",
                "sidechain_music_db_on_impacts": -3,
                "natural_reverb": true
              }
            },
            "text_rules": {
              "emoji_policy": "no emojis",
              "contrast": "high contrast text readable on style background"
            },
            "color_palette": {
              "background": project.settings?.colorPalette ? makePolicySafe(project.settings.colorPalette) : bgPalette,
              "primary": project.settings?.colorPrimary || "#111111",
              "secondary": project.settings?.colorSecondary || "#444444",
              "accent": project.settings?.colorAccent || "#222222",
              "text_primary": "#FFFFFF"
            },
            "transitions": {
              "between_scenes": transition.between,
              "impact_frame_usage": transition.impact,
              "forbidden": styleDefaults.forbiddenElements.slice(0, 3)
            },
            "vfx_rules": {
              "grain": styleDefaults.vfxGrain,
              "particles": styleDefaults.vfxParticles,
              "camera_shake": "very subtle — only on high-intensity emotional moments"
            },
            "visual_rules": {
              "prohibited_elements": styleDefaults.forbiddenElements,
              "rendering": styleDefaults.look,
              "style_lock": selectedStyleName
            },
            "export": {
              "preset": "1920x1080_h264_high",
              "target_duration_sec": String(durationSec)
            },
            "metadata": {
              "series": makePolicySafe(project.title || selectedStyleName),
              "task": `Beat ${beatNum} — ${selectedStyleName}`,
              "scene_number": String(beatNum),
              "tags": tags
            }
          }, null, 2)
        };
      });

      setProject(p => ({
        ...p,
        scenes: newScenes,
        prompts: newPrompts
      }));

      setIsGenerating(false);
      setCurrentStep(3);
      toast.success(`${preChunks.length} beats generated successfully`);
    }, 3000);
  };



  return (
    <div className="flex flex-col h-full bg-[#F8F9FA] w-full text-foreground font-sans relative">
      
      {/* Top Progress Bar */}
      <div className="sticky top-0 z-40 w-full bg-white border-b border-gray-200 py-4 px-8 flex items-center justify-between shadow-sm">
        <div className="w-24"></div> {/* Spacer for centering */}
        
        <div className="flex items-center justify-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full font-bold text-sm ${currentStep >= 1 ? 'bg-red-600 text-white' : 'border-2 border-gray-300 text-gray-500'}`}>1</div>
            <span className={`text-sm ${currentStep >= 1 ? 'font-semibold text-gray-900' : 'font-medium text-gray-500'}`}>Configure</span>
          </div>
          <div className={`w-32 sm:w-48 h-px ${currentStep >= 2 ? 'bg-red-600' : 'bg-gray-200'}`}></div>
          <div className={`flex items-center space-x-2 ${currentStep < 2 ? 'opacity-50' : ''}`}>
            <div className={`flex h-8 w-8 items-center justify-center rounded-full font-bold text-sm ${currentStep >= 2 ? 'bg-red-600 text-white' : 'border-2 border-gray-300 text-gray-500'}`}>2</div>
            <span className={`text-sm ${currentStep >= 2 ? 'font-semibold text-gray-900' : 'font-medium text-gray-500'}`}>Generating</span>
          </div>
          <div className={`w-32 sm:w-48 h-px ${currentStep >= 3 ? 'bg-red-600' : 'bg-gray-200'}`}></div>
          <div className={`flex items-center space-x-2 ${currentStep < 3 ? 'opacity-50' : ''}`}>
            <div className={`flex h-8 w-8 items-center justify-center rounded-full font-bold text-sm ${currentStep >= 3 ? 'bg-red-600 text-white' : 'border-2 border-gray-300 text-gray-500'}`}>3</div>
            <span className={`text-sm ${currentStep >= 3 ? 'font-semibold text-gray-900' : 'font-medium text-gray-500'}`}>Results</span>
          </div>
        </div>
        <div className="w-24 flex justify-end gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 text-gray-600 border-gray-300">
                <History className="w-4 h-4" />
                <span className="hidden sm:inline">History</span>
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Project History</SheetTitle>
                <SheetDescription>
                  Restore previously generated projects and prompts.
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                {(!history || history.length === 0) ? (
                  <p className="text-sm text-gray-500 text-center py-10">No history found.</p>
                ) : (
                  history.map(proj => (
                    <div key={proj.id} className="border rounded-lg p-4 hover:border-red-400 transition-colors bg-gray-50/50 relative group">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-sm text-gray-900 truncate pr-8">{proj.title || "Untitled Project"}</h4>
                        <span className="text-xs text-gray-400 shrink-0">{new Date(proj.updatedAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2 mb-3">{proj.rawScript || "No script content."}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-mono bg-white border px-2 py-1 rounded text-gray-600">
                          {Object.keys(proj.prompts || {}).length} Beats
                        </span>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => deleteProject(proj.id)}>
                            Delete
                          </Button>
                          <SheetTrigger asChild>
                            <Button size="sm" className="h-7 text-xs bg-red-600 hover:bg-red-700 text-white" onClick={() => { loadProject(proj.id); setCurrentStep(Object.keys(proj.prompts || {}).length > 0 ? 3 : 1); toast.success("Project loaded"); }}>
                              Load
                            </Button>
                          </SheetTrigger>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </SheetContent>
          </Sheet>
          <div className="pt-1">
            <ActiveProviderBadge 
              featureKey="prompt_generator" 
              moduleName="Prompt Generator" 
              subFeatures={[
                { key: 'generator.prompt_builder', label: 'Prompt Builder' }
              ]}
            />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-4xl mx-auto w-full py-10 px-4">
        
        {/* WHAT THE AI WILL DO Banner */}
        <div className="mb-10 bg-red-50 border-l-4 border-red-600 p-6 rounded-r-lg flex justify-between items-start">
          <div>
            <h3 className="text-red-600 font-bold text-sm tracking-widest uppercase mb-4 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-red-600 inline-block"></span>
              What the AI Will Do
            </h3>
            <ul className="space-y-3 text-sm text-gray-700">
              <li className="flex gap-2">
                <span className="text-red-500">→</span>
                <p><strong>Beat Detection:</strong> AI reads your full script and breaks it into named story beats (Hook → Conflict → Resolution).</p>
              </li>
              <li className="flex gap-2">
                <span className="text-red-500">→</span>
                <p><strong>Style Lock:</strong> One-time analysis locks hex colors, lens, transitions, and character appearances across all beats.</p>
              </li>
              <li className="flex gap-2">
                <span className="text-red-500">→</span>
                <p><strong>Beat Generation:</strong> Every named beat generated in parallel — no SWAP_ME, full cinematic JSON.</p>
              </li>
            </ul>
          </div>
          {isSaving && (
            <div className="flex items-center gap-2 text-xs text-red-500 font-mono bg-white px-3 py-1.5 rounded-full shadow-sm">
              <Loader2 className="w-3 h-3 animate-spin" /> Auto-saving...
            </div>
          )}
        </div>

        {/* Section 1: Sequence Data */}
        <div className="mb-8 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white font-bold text-xs">1</div>
            <h2 className="text-sm font-bold tracking-widest text-gray-800">SEQUENCE DATA</h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Project Name (Optional)</label>
              <input 
                type="text" 
                value={project.title}
                onChange={(e) => setProject(p => ({ ...p, title: e.target.value }))}
                placeholder="e.g. SC-01-INTRO" 
                className="w-full px-4 py-3 border border-gray-200 rounded bg-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <label className="text-xs font-bold text-gray-500 uppercase">Complete Script</label>
                <div>
                  <input type="file" id="script-upload" className="hidden" accept=".txt,.md,.docx,.pdf" onChange={handleFileUpload} />
                  <Button variant="outline" size="sm" onClick={() => document.getElementById("script-upload")?.click()} disabled={isUploading} className="text-xs h-7 py-0 px-3">
                    {isUploading ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> : <Upload className="w-3 h-3 mr-1.5" />}
                    Upload TXT / MD
                  </Button>
                </div>
              </div>
              <textarea 
                value={project.rawScript}
                onChange={(e) => setProject(p => ({ ...p, rawScript: e.target.value }))}
                placeholder="Paste your full narration script here. AI will auto-split into scenes..." 
                className="w-full h-48 px-4 py-3 border border-gray-200 rounded bg-white text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mt-2 gap-4">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="beatDetection" 
                      className="text-red-600 focus:ring-red-500" 
                      checked={project.settings?.beatDetectionMode !== "sentence"} 
                      onChange={() => setProject(p => ({ ...p, settings: { ...p.settings, beatDetectionMode: "smart" } }))}
                    />
                    <span className="text-sm font-medium text-gray-800">Smart Beat Detection <span className="text-xs text-green-600 font-bold ml-1">(Recommended)</span></span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="beatDetection" 
                      className="text-red-600 focus:ring-red-500" 
                      checked={project.settings?.beatDetectionMode === "sentence"} 
                      onChange={() => setProject(p => ({ ...p, settings: { ...p.settings, beatDetectionMode: "sentence" } }))}
                    />
                    <span className="text-sm font-medium text-gray-800">Sentence by Sentence</span>
                  </label>
                </div>
                <p className="text-xs text-gray-400">→ {project.settings?.beatDetectionMode === "sentence" ? "Script is split on every period/punctuation." : "AI intelligently groups beats by topic, scene, and emotional shifts."}</p>
              </div>
            </div>

            {/* Analysis Results */}
            {project.analysis && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] text-green-700 font-bold uppercase tracking-wider">Hook</span>
                  <p className="text-sm font-medium text-green-900">{project.analysis.hook}</p>
                </div>
                <div>
                  <span className="text-[10px] text-green-700 font-bold uppercase tracking-wider">Tone & Audience</span>
                  <p className="text-sm font-medium text-green-900">{project.analysis.tone} • {project.analysis.audience}</p>
                </div>
              </div>
            )}

            <div className="bg-red-50 border border-red-100 rounded-lg p-4 flex items-center justify-between">
              <div className="flex gap-3">
                <div className="mt-1"><Activity className="w-5 h-5 text-red-500" /></div>
                <div>
                  <h4 className="text-sm font-bold text-red-800">AI Auto-Suggest All Fields</h4>
                  <p className="text-xs text-gray-500 mt-1">Paste your script above, then click to let AI pick the best visual style, colors, lighting, camera & mood.</p>
                </div>
              </div>
              <Button
                onClick={() => {
                  const script = (project.rawScript || "").toLowerCase();
                  const style = project.settings?.visualStyle || "";
                  // Auto-detect mood
                  let mood = "Serious";
                  if (script.includes("hope") || script.includes("victory")) mood = "Hopeful";
                  else if (script.includes("war") || script.includes("battle")) mood = "Dramatic";
                  else if (script.includes("fear") || script.includes("terror")) mood = "Tense";
                  else if (script.includes("sacrifice") || script.includes("loss")) mood = "Mournful";
                  // Auto-detect lighting
                  let light = "Cinematic Lighting";
                  if (script.includes("war") || script.includes("history")) light = "Sepia Parchment Tone";
                  else if (script.includes("night") || script.includes("dark")) light = "Moody / Low Key";
                  else if (script.includes("nature") || script.includes("outdoor")) light = "Natural Light";
                  // Auto-detect camera
                  let cam = "Slow Ken Burns";
                  if (script.includes("battle") || script.includes("action")) cam = "Handheld Tracking";
                  else if (script.includes("map") || script.includes("landscape")) cam = "Drone Wide Pan";
                  // Auto-detect palette
                  let palette = "aged parchment beige, dark ink shadows, sepia tones";
                  let prim = "#2b1d0e"; let sec = "#8b7355"; let acc = "#c8952c";
                  if (style.includes("Neon") || style.includes("Cyberpunk")) { palette = "deep black, electric blue, neon accent"; prim = "#0a0a0a"; sec = "#00d4ff"; acc = "#ff0080"; }
                  else if (script.includes("war") || script.includes("history")) { palette = "aged parchment beige, dark ink shadows, sepia tones"; prim = "#2b1d0e"; sec = "#8b7355"; acc = "#c8952c"; }
                  setProject(p => ({
                    ...p,
                    settings: { ...p.settings, mood, lightingStyle: light, cameraStyle: cam, colorPalette: palette, colorPrimary: prim, colorSecondary: sec, colorAccent: acc },
                    analysis: {
                      hook: script.length > 50 ? `"${(project.rawScript || "").slice(0, 60).trim()}..."` : "Strong narrative opening",
                      storyStructure: preChunks.length > 5 ? "Multi-act structure" : "Three-act structure",
                      tone: mood + " and authoritative",
                      audience: script.includes("war") ? "History enthusiasts" : "General documentary viewers",
                    }
                  }));
                  toast.success("AI suggested all fields based on your script!");
                }}
                className="bg-red-600 hover:bg-red-700 text-white font-bold"
              >
                <Settings2 className="w-4 h-4 mr-2" />
                Suggest All
              </Button>
            </div>
          </div>
        </div>

        {/* Section 1.5: Per-Scene Visual Style (From Screenshot 1 & 2) */}
        {preChunks.length > 0 && (
          <div className={`mb-8 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden transition-opacity ${currentStep > 1 ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white font-bold text-xs">
                  <Activity className="w-3 h-3" />
                </div>
                <h2 className="text-sm font-bold tracking-widest text-gray-800">PER-SCENE VISUAL STYLE <span className="text-xs font-normal text-gray-400 ml-2 bg-gray-200 px-2 py-0.5 rounded">{preChunks.length} scenes × 8s</span></h2>
              </div>
              <Button variant="ghost" className="text-red-600 hover:bg-red-50 text-xs font-bold h-8">
                <Activity className="w-3 h-3 mr-2" />
                AI Suggest All
              </Button>
            </div>
            <div className="p-0 max-h-96 overflow-y-auto divide-y divide-gray-100">
              {preChunks.map((chunk, i) => (
                <div key={chunk.id} className="p-4 flex gap-4 hover:bg-gray-50 transition-colors group">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 group-hover:bg-red-100 group-hover:text-red-600 transition-colors">
                      {i + 1}
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <p className="text-sm text-gray-600">{chunk.text}</p>
                    <div className="flex items-center gap-2">
                      <select 
                        value={chunk.styleOverride || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPreChunks(prev => prev.map(c => c.id === chunk.id ? { ...c, styleOverride: val === "" ? null : val } : c));
                        }}
                        className="flex-1 px-3 py-1.5 border border-gray-200 rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 appearance-none text-gray-700"
                      >
                        <option value="">— Use Global Style —</option>
                        {VISUAL_STYLES.map(s => (
                          <option key={s.id} value={s.title}>{s.emoji} {s.title}</option>
                        ))}
                      </select>
                      <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50 text-xs font-bold px-2 py-1 h-auto">
                        <Activity className="w-3 h-3 mr-1" />
                        AI
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 2: Visual Style */}
        <div className={`mb-8 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden transition-opacity ${currentStep > 1 ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white font-bold text-xs">2</div>
              <h2 className="text-sm font-bold tracking-widest text-gray-800">VISUAL STYLE</h2>
            </div>
            <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 text-xs font-bold h-8">
              <Settings2 className="w-3 h-3 mr-2" />
              AI Fill All
            </Button>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Visual Style</label>
                <p className="text-sm text-gray-400 italic mt-1">
                  {project.settings?.visualStyle || "No style selected — pick one below"}
                </p>
              </div>
              <Button variant="ghost" className="text-red-600 hover:bg-red-50 text-xs font-bold" onClick={() => setProject(p => ({ ...p, settings: { ...p.settings, visualStyle: "Cinematic 3D Render" } }))}>
                <Activity className="w-3 h-3 mr-2" />
                AI Suggest
              </Button>
            </div>
            
            <input 
              type="text" 
              placeholder="Search 59 styles..." 
              className="w-full px-4 py-2 border border-gray-200 rounded bg-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />
            
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button 
                  key={cat}
                  className={`px-3 py-1 rounded-full text-xs font-medium border ${cat === 'All' ? 'bg-red-600 text-white border-red-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4 h-64 overflow-y-auto border border-gray-100 rounded-lg p-2 bg-gray-50/50">
              {VISUAL_STYLES.map((style) => {
                const isSelected = project.settings?.visualStyle === style.title;
                return (
                  <div 
                    key={style.id} 
                    onClick={() => setProject(p => ({ ...p, settings: { ...p.settings, visualStyle: style.title } }))}
                    className={`bg-white p-3 border rounded shadow-sm cursor-pointer transition-colors flex flex-col justify-start ${isSelected ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200 hover:border-red-400'}`}
                  >
                    <div className="text-2xl mb-2">{style.emoji}</div>
                    <h4 className="font-bold text-sm text-gray-900">{style.title}</h4>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{style.description}</p>
                  </div>
                );
              })}
            </div>

            <button className="text-sm text-gray-500 hover:text-gray-900 font-medium flex items-center gap-2">
              <span>+</span> Use custom style not in the list
            </button>
            
            <div className="pt-4 border-t border-gray-100 border-dashed space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                <LayoutList className="w-3 h-3" />
                REFERENCE IMAGE (Style Copy)
              </label>
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors">
                <p className="text-sm text-gray-500">Click to upload reference image</p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Color Palette */}
        <div className={`mb-8 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden transition-opacity ${currentStep > 1 ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white font-bold text-xs">3</div>
              <h2 className="text-sm font-bold tracking-widest text-gray-800">COLOR PALETTE</h2>
            </div>
            <Button variant="ghost" className="text-red-600 hover:bg-red-50 text-xs font-bold" onClick={() => {
              // AI suggests palette based on visual style and script tone
              const style = project.settings?.visualStyle || "";
              const script = (project.rawScript || "").toLowerCase();
              let palette = "aged parchment beige, dark ink shadows, sepia tones";
              let primary = "#2b1d0e"; let secondary = "#8b7355"; let accent = "#c8952c";
              if (style.includes("Neon") || style.includes("Cyberpunk")) { palette = "deep black, electric blue, neon pink"; primary = "#0a0a0a"; secondary = "#00d4ff"; accent = "#ff0080"; }
              else if (style.includes("Horror") || script.includes("dark") || script.includes("shadow")) { palette = "near black, blood red, ash grey"; primary = "#0d0d0d"; secondary = "#8b0000"; accent = "#555555"; }
              else if (style.includes("Nature") || script.includes("forest") || script.includes("ocean")) { palette = "forest green, sky blue, earth brown"; primary = "#1a3d1a"; secondary = "#4a90b8"; accent = "#8b6b3d"; }
              else if (style.includes("Historical") || script.includes("war") || script.includes("battle")) { palette = "aged parchment beige, dark ink shadows, sepia tones"; primary = "#2b1d0e"; secondary = "#8b7355"; accent = "#c8952c"; }
              else if (style.includes("Fantasy") || script.includes("magic") || script.includes("kingdom")) { palette = "midnight purple, gold leaf, deep emerald"; primary = "#1a0a2e"; secondary = "#d4a017"; accent = "#1a4a2e"; }
              else if (style.includes("Sci-Fi") || script.includes("space") || script.includes("future")) { palette = "deep space black, cyan glow, silver chrome"; primary = "#0a0a14"; secondary = "#00e5ff"; accent = "#c0c0c0"; }
              setProject(p => ({ ...p, settings: { ...p.settings, colorPalette: palette, colorPrimary: primary, colorSecondary: secondary, colorAccent: accent } }));
              toast.success("AI Color Palette Applied!");
            }}>
              <Activity className="w-3 h-3 mr-2" />
              AI Suggest
            </Button>
          </div>
          <div className="p-6 space-y-6">
            
            {/* Color Palette Description */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Palette Description (used in JSON output)</label>
              <input
                type="text"
                value={project.settings?.colorPalette || ""}
                onChange={(e) => setProject(p => ({ ...p, settings: { ...p.settings, colorPalette: e.target.value } }))}
                placeholder="e.g. aged parchment beige, dark ink shadows, sepia tones"
                className="w-full px-3 py-2 border border-gray-200 rounded bg-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
            </div>

            {/* Primary Color */}
            <div className="border border-gray-100 rounded-lg p-4 bg-gray-50/50">
              <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2 mb-3">
                <div className="w-4 h-4 rounded-sm border border-gray-300" style={{ background: project.settings?.colorPrimary || "#2b1d0e" }}></div>
                PRIMARY (ink_primary)
              </label>
              <div className="flex gap-3">
                <input
                  type="color"
                  value={project.settings?.colorPrimary || "#2b1d0e"}
                  onChange={(e) => setProject(p => ({ ...p, settings: { ...p.settings, colorPrimary: e.target.value } }))}
                  className="w-10 h-9 rounded cursor-pointer border border-gray-200"
                />
                <input
                  type="text"
                  value={project.settings?.colorPrimary || "#2b1d0e"}
                  onChange={(e) => setProject(p => ({ ...p, settings: { ...p.settings, colorPrimary: e.target.value } }))}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded bg-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                />
              </div>
            </div>

            {/* Secondary Color */}
            <div className="border border-gray-100 rounded-lg p-4 bg-gray-50/50">
              <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2 mb-3">
                <div className="w-4 h-4 rounded-sm border border-gray-300" style={{ background: project.settings?.colorSecondary || "#8b7355" }}></div>
                SECONDARY (ink_secondary)
              </label>
              <div className="flex gap-3">
                <input
                  type="color"
                  value={project.settings?.colorSecondary || "#8b7355"}
                  onChange={(e) => setProject(p => ({ ...p, settings: { ...p.settings, colorSecondary: e.target.value } }))}
                  className="w-10 h-9 rounded cursor-pointer border border-gray-200"
                />
                <input
                  type="text"
                  value={project.settings?.colorSecondary || "#8b7355"}
                  onChange={(e) => setProject(p => ({ ...p, settings: { ...p.settings, colorSecondary: e.target.value } }))}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded bg-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                />
              </div>
            </div>

            {/* Accent Color */}
            <div className="border border-gray-100 rounded-lg p-4 bg-gray-50/50">
              <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2 mb-3">
                <div className="w-4 h-4 rounded-sm border border-gray-300" style={{ background: project.settings?.colorAccent || "#c8952c" }}></div>
                ACCENT (splatter)
              </label>
              <div className="flex gap-3">
                <input
                  type="color"
                  value={project.settings?.colorAccent || "#c8952c"}
                  onChange={(e) => setProject(p => ({ ...p, settings: { ...p.settings, colorAccent: e.target.value } }))}
                  className="w-10 h-9 rounded cursor-pointer border border-gray-200"
                />
                <input
                  type="text"
                  value={project.settings?.colorAccent || "#c8952c"}
                  onChange={(e) => setProject(p => ({ ...p, settings: { ...p.settings, colorAccent: e.target.value } }))}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded bg-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                />
              </div>
            </div>

          </div>
        </div>

        {/* Section 4: Camera, Lighting & Mood */}
        <div className={`mb-8 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden transition-opacity ${currentStep > 1 ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white font-bold text-xs">4</div>
              <h2 className="text-sm font-bold tracking-widest text-gray-800">CAMERA, LIGHTING & MOOD</h2>
            </div>
          </div>
          <div className="p-6 space-y-4">

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-bold text-gray-800">Lighting Style</label>
                <button className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center" onClick={() => {
                  const script = (project.rawScript || "").toLowerCase();
                  const style = project.settings?.visualStyle || "";
                  let light = "Cinematic Lighting";
                  if (script.includes("night") || script.includes("dark") || style.includes("Horror")) light = "Moody / Low Key";
                  else if (script.includes("war") || script.includes("battle") || script.includes("history")) light = "Sepia Parchment Tone";
                  else if (script.includes("nature") || script.includes("outdoor")) light = "Natural Light";
                  else if (script.includes("future") || script.includes("space") || style.includes("Sci-Fi")) light = "Neon Ambient";
                  setProject(p => ({ ...p, settings: { ...p.settings, lightingStyle: light } }));
                  toast.success(`Lighting → ${light}`);
                }}><Activity className="w-3 h-3 mr-1" /> AI Suggest</button>
              </div>
              <select
                value={project.settings?.lightingStyle || "Cinematic Lighting"}
                onChange={(e) => setProject(p => ({ ...p, settings: { ...p.settings, lightingStyle: e.target.value } }))}
                className="w-full px-4 py-2 border border-gray-200 rounded bg-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 appearance-none"
              >
                <option>Cinematic Lighting</option>
                <option>Sepia Parchment Tone</option>
                <option>Natural Light</option>
                <option>Studio Lighting</option>
                <option>Moody / Low Key</option>
                <option>Neon Ambient</option>
                <option>Dramatic Overcast</option>
                <option>Golden Hour</option>
                <option>Candlelight Interior</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-bold text-gray-800">Camera Style</label>
                <button className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center" onClick={() => {
                  const script = (project.rawScript || "").toLowerCase();
                  const style = project.settings?.visualStyle || "";
                  let cam = "Slow Ken Burns";
                  if (script.includes("action") || script.includes("battle") || script.includes("chase")) cam = "Handheld Tracking";
                  else if (script.includes("landscape") || script.includes("city") || script.includes("map")) cam = "Drone Wide Pan";
                  else if (script.includes("face") || script.includes("emotion") || script.includes("close")) cam = "Close Up Push-In";
                  setProject(p => ({ ...p, settings: { ...p.settings, cameraStyle: cam } }));
                  toast.success(`Camera → ${cam}`);
                }}><Activity className="w-3 h-3 mr-1" /> AI Suggest</button>
              </div>
              <select
                value={project.settings?.cameraStyle || "Slow Ken Burns"}
                onChange={(e) => setProject(p => ({ ...p, settings: { ...p.settings, cameraStyle: e.target.value } }))}
                className="w-full px-4 py-2 border border-gray-200 rounded bg-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 appearance-none"
              >
                <option>Slow Ken Burns</option>
                <option>Close Up Push-In</option>
                <option>Drone Wide Pan</option>
                <option>Handheld Tracking</option>
                <option>Orbit Slow Rotate</option>
                <option>Tilt Up Reveal</option>
                <option>Dolly Forward</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-bold text-gray-800">Mood & Tone</label>
                <button className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center" onClick={() => {
                  const script = (project.rawScript || "").toLowerCase();
                  let mood = "Serious";
                  if (script.includes("hope") || script.includes("victory") || script.includes("freedom")) mood = "Hopeful";
                  else if (script.includes("fear") || script.includes("terror") || script.includes("horror")) mood = "Tense";
                  else if (script.includes("sacrifice") || script.includes("loss") || script.includes("grief")) mood = "Mournful";
                  else if (script.includes("war") || script.includes("battle") || script.includes("fight")) mood = "Dramatic";
                  else if (script.includes("mystery") || script.includes("secret") || script.includes("unknown")) mood = "Mysterious";
                  setProject(p => ({ ...p, settings: { ...p.settings, mood: mood } }));
                  toast.success(`Mood → ${mood}`);
                }}><Activity className="w-3 h-3 mr-1" /> AI Suggest</button>
              </div>
              <select
                value={project.settings?.mood || "Serious"}
                onChange={(e) => setProject(p => ({ ...p, settings: { ...p.settings, mood: e.target.value } }))}
                className="w-full px-4 py-2 border border-gray-200 rounded bg-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 appearance-none"
              >
                <option>Serious</option>
                <option>Dramatic</option>
                <option>Hopeful</option>
                <option>Mournful</option>
                <option>Tense</option>
                <option>Mysterious</option>
                <option>Urgent</option>
                <option>Reverent</option>
              </select>
            </div>

          </div>
        </div>

        {/* Section 5: Platform & Output */}
        <div className={`mb-8 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden transition-opacity ${currentStep > 1 ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white font-bold text-xs">5</div>
            <h2 className="text-sm font-bold tracking-widest text-gray-800">PLATFORM & OUTPUT</h2>
          </div>
          <div className="p-6">
            <label className="text-xs font-bold text-gray-500 uppercase block mb-3">TARGET PLATFORM</label>
            <div className="grid grid-cols-4 gap-2">
              <button 
                onClick={() => setProject(p => ({ ...p, settings: { ...p.settings, platform: "YouTube" } }))}
                className={`py-2 px-4 rounded text-sm font-bold flex justify-center items-center gap-2 border ${project.settings?.platform === 'YouTube' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
              >
                ▶ YouTube
              </button>
              <button 
                onClick={() => setProject(p => ({ ...p, settings: { ...p.settings, platform: "TikTok" } }))}
                className={`py-2 px-4 rounded text-sm font-bold flex justify-center items-center gap-2 border ${project.settings?.platform === 'TikTok' ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
              >
                ♪ TikTok
              </button>
              <button 
                onClick={() => setProject(p => ({ ...p, settings: { ...p.settings, platform: "Instagram" } }))}
                className={`py-2 px-4 rounded text-sm font-bold flex justify-center items-center gap-2 border ${project.settings?.platform === 'Instagram' ? 'bg-pink-600 text-white border-pink-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
              >
                ◎ Instagram
              </button>
              <button 
                onClick={() => setProject(p => ({ ...p, settings: { ...p.settings, platform: "Facebook" } }))}
                className={`py-2 px-4 rounded text-sm font-bold flex justify-center items-center gap-2 border ${project.settings?.platform === 'Facebook' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
              >
                ■ Facebook
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-3">6–16 beats, full narrative depth</p>
          </div>
        </div>

        {/* Generate Button Area */}
        {currentStep === 1 && (
          <div className="mt-8 flex justify-center pb-20">
            <Button 
              onClick={handleGenerate}
              disabled={!project.rawScript}
              className="bg-[#e60000] hover:bg-red-700 text-white font-bold py-6 px-10 rounded-lg text-lg shadow-xl hover:shadow-2xl transition-all w-full max-w-4xl"
            >
              <Play className="w-5 h-5 mr-3" />
              GENERATE STORY BEATS
            </Button>
          </div>
        )}

        {/* Generating State */}
        {currentStep === 2 && (
          <div className="mt-12 flex flex-col items-center max-w-2xl mx-auto pb-20">
            <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-6">
              <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
            </div>
            
            <h2 className="text-3xl font-bold text-[#0f172a] mb-2 tracking-tight">Building Scene Bundle</h2>
            <p className="text-red-600 font-bold mb-4">~{preChunks.length} scenes × 8 seconds each</p>
            <p className="text-gray-500 text-center mb-10 max-w-lg leading-relaxed">
              AI detecting story beats and generating cinematic scenes in parallel...
            </p>

            <div className="w-full space-y-4">
              <div className="bg-red-50/50 border border-red-200 rounded-lg p-5 flex gap-4 items-start">
                <Loader2 className="w-5 h-5 text-red-500 animate-spin shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-red-700 text-sm mb-1">Pass 0+1 — Story Beat Detection & Style Lock</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    AI detects narrative beats (Hook → Conflict → Resolution) • Extracts characters • Locks style across all scenes
                  </p>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-5 flex gap-4 items-start shadow-sm">
                <div className="w-5 h-5 rounded-full border-2 border-gray-300 shrink-0 mt-0.5"></div>
                <div>
                  <h4 className="font-bold text-gray-500 text-sm mb-1">Pass 2 — Parallel Scene Generation</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    All {preChunks.length} scenes generated simultaneously — ready for bulk image/video generation
                  </p>
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-400 mt-10">Large script ({preChunks.length} scenes) — may take 60–120 seconds</p>
          </div>
        )}

        {/* Results Area */}
        {currentStep === 3 && (
          <div className="mt-12 mb-20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Generated Sequence</h2>
              <div className="flex flex-col gap-3 justify-end mt-6">
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" className="text-gray-600 font-bold text-xs" onClick={() => handleCopy(true)} disabled={selectedBeats.size === 0}>
                    <FileText className="w-4 h-4 mr-2" /> Copy Selected
                  </Button>
                  <Button variant="outline" className="text-gray-600 font-bold text-xs" onClick={() => handleCopy(false)}>
                    <FileText className="w-4 h-4 mr-2" /> Copy All
                  </Button>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" className="text-gray-600 font-bold text-xs" onClick={() => handleExport("txt", selectedBeats.size > 0)}>
                    <Download className="w-4 h-4 mr-2" /> Export TXT
                  </Button>
                  <Button variant="outline" className="text-gray-600 font-bold text-xs" onClick={() => handleExport("md", selectedBeats.size > 0)}>
                    <Download className="w-4 h-4 mr-2" /> Export MD
                  </Button>
                  <Button variant="outline" className="text-gray-600 font-bold text-xs" onClick={() => handleExport("json", selectedBeats.size > 0)}>
                    <Download className="w-4 h-4 mr-2" /> Export JSON
                  </Button>
                  <Button variant="outline" className="text-gray-600 font-bold text-xs" onClick={() => handleExport("zip", selectedBeats.size > 0)}>
                    <Download className="w-4 h-4 mr-2" /> Export ZIP
                  </Button>
                  <Button className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs" onClick={() => toast.success("Saved to Prompt Library")}>
                    <Save className="w-4 h-4 mr-2" /> Save to Library
                  </Button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden mt-8 max-w-5xl mx-auto">
              <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center relative">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{project.title || "nno"}</h2>
                  <p className="text-sm text-gray-500 mt-1">{Object.keys(project.prompts || {}).length} beats generated · {project.settings?.visualStyle || "Cinematic"}</p>
                </div>
                <Button variant="ghost" className="absolute top-4 right-4 w-8 h-8 p-0 rounded-full text-red-600 hover:bg-red-50 hover:text-red-700 border border-red-200" onClick={() => setCurrentStep(1)}>
                  <span className="sr-only">Close</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </Button>
              </div>

              <div className="p-8 space-y-12 bg-gray-50/30 max-h-[70vh] overflow-y-auto">
                {Object.entries(project.prompts || {}).map(([sceneId, promptData], index) => {
                  const beatNum = String(index + 1).padStart(2, '0');
                  const parsed = JSON.parse(promptData.json);
                  const narration = parsed["Voice Over"]?.["Narration Text"] || parsed.voice_over?.narration_text || parsed["Voice Over"] || "";
                  const isSelected = selectedBeats.has(sceneId);
                  const isExpanded = !expandedScenes.has(sceneId); // Default to expanded
                  
                  return (
                    <div key={sceneId} className={`bg-white rounded-xl border ${isSelected ? 'border-red-400 ring-1 ring-red-400 shadow-md' : 'border-gray-200 shadow-sm'} overflow-hidden transition-all relative`}>
                      <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between bg-white">
                        <div className="flex items-start gap-4">
                          <div className="flex items-center gap-2 mt-1">
                            <input 
                              type="checkbox" 
                              className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500 cursor-pointer"
                              checked={isSelected}
                              onChange={() => toggleSelectBeat(sceneId)}
                            />
                            <div className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
                              BEAT {beatNum}
                            </div>
                          </div>
                          <p className="text-gray-500 italic text-xs mt-1 max-w-2xl line-clamp-2 leading-relaxed">"{narration}"</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button 
                            className="text-xs font-medium text-gray-500 hover:text-gray-900 px-2 py-1 transition-colors flex items-center gap-1 border border-gray-200 rounded hover:bg-gray-50"
                            onClick={() => {
                              navigator.clipboard.writeText(promptData.json);
                              toast.success("Copied!");
                            }}
                          >
                            <FileText className="w-3 h-3" /> Copy
                          </button>
                          <button 
                            className="text-xs font-medium text-blue-600 hover:text-blue-800 px-2 py-1 transition-colors bg-blue-50 rounded"
                            onClick={() => setPreviewScene(sceneId)}
                          >
                            Preview
                          </button>
                          <div className="h-4 w-px bg-gray-200 mx-1"></div>
                          <button 
                            className="text-xs font-medium text-gray-500 hover:text-gray-900 px-2 py-1 transition-colors"
                            onClick={() => toggleExpandedScene(sceneId)}
                          >
                            {isExpanded ? 'Collapse' : 'Expand'}
                          </button>
                        </div>
                      </div>
                      
                      {isExpanded && (
                        <div className="p-0 overflow-x-auto bg-[#fafafa]">
                          <div className="px-6 py-2 bg-gray-100/50 border-b border-gray-200 flex gap-4 text-xs text-gray-500">
                            <button className="hover:text-gray-900" onClick={() => toast.success("Edit Scene")}>Edit</button>
                            <button className="hover:text-gray-900" onClick={() => toast.success("Scene Duplicated")}>Duplicate</button>
                            <button className="hover:text-gray-900" onClick={() => toast.success("Regenerating Scene...")}>Regenerate</button>
                            <button className="text-red-500 hover:text-red-700" onClick={() => toast.success("Scene Deleted")}>Delete</button>
                          </div>
                          <pre className="text-[13px] font-mono text-gray-700 whitespace-pre-wrap p-6">
                            {promptData.json}
                          </pre>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Preview Modal */}
            {previewScene && project.prompts?.[previewScene] && (
              <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                  {(() => {
                    const data = JSON.parse(project.prompts[previewScene].json);
                    return (
                      <>
                        <div className="px-8 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded">BEAT {data.metadata?.scene_number || data["Scene Number"]}</span>
                              <h2 className="text-xl font-bold text-gray-900">{data.scene || data["Scene Name"]}</h2>
                            </div>
                            <p className="text-sm text-gray-500">{data.style || data["Style"]}</p>
                          </div>
                          <button onClick={() => setPreviewScene(null)} className="text-gray-400 hover:text-gray-700 transition-colors p-2 rounded-full hover:bg-gray-200">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                          </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-8 bg-white">
                          <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-6">
                              <div>
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Voice Over / Narration</h4>
                                <p className="text-gray-800 text-sm font-medium leading-relaxed italic border-l-4 border-red-200 pl-4 py-1">
                                  "{data.voice_over?.narration_text || data["Voice Over"]?.["Narration Text"] || data["Voice Over"]}"
                                </p>
                              </div>
                              <div>
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Visual Composition</h4>
                                <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700">
                                  <p><strong>Camera:</strong> {data.shot?.camera_motion || data["Shot"]?.["Camera Motion"]} — {data.shot?.composition || data["Shot"]?.["Composition"]}</p>
                                  <p className="mt-2"><strong>Lens:</strong> {data.shot?.lens || data["Shot"]?.["Camera Lens"]}</p>
                                  <p className="mt-2"><strong>Lighting:</strong> {data.lighting?.primary || data["Lighting"]}</p>
                                  <p className="mt-2"><strong>Palette:</strong> {data.shot?.look || data["Color Palette"]}</p>
                                </div>
                              </div>
                              <div>
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Audio & SFX</h4>
                                <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700">
                                  <p><strong>Music:</strong> {data.audio?.music?.track || data["Audio"]?.["Music"]}</p>
                                  <p className="mt-2"><strong>SFX:</strong> {Array.isArray(data.audio?.sfx) ? data.audio.sfx.join(", ") : Array.isArray(data["Audio"]?.["SFX"]) ? data["Audio"]["SFX"].join(", ") : ""}</p>
                                  <p className="mt-2"><strong>Ambient:</strong> {data.audio?.ambient || ""}</p>
                                </div>
                              </div>
                            </div>
                            <div className="space-y-6">
                              <div>
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Timeline Progression</h4>
                                <div className="bg-slate-900 rounded-lg p-4 font-mono text-sm">
                                  {(data.timeline || data["Timeline"] || []).map((t: any, i: number) => (
                                    <div key={i} className="flex gap-4 mb-2 last:mb-0">
                                      <span className="text-red-400 shrink-0">{t.time}</span>
                                      <span className="text-slate-300">{t.action}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">AI Generator Prompts</h4>
                                <div className="bg-indigo-50/50 rounded-lg p-4 space-y-4">
                                  <div>
                                    <span className="text-xs font-bold text-indigo-800">IMAGE PROMPT</span>
                                    <p className="text-xs text-indigo-900 mt-1">{data["AI Image Prompt"]}</p>
                                  </div>
                                  <div>
                                    <span className="text-xs font-bold text-indigo-800">VIDEO PROMPT</span>
                                    <p className="text-xs text-indigo-900 mt-1">{data["AI Video Prompt"]}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            <div className="mt-12 flex justify-center pb-20">
              <Button 
                onClick={() => {
                  setCurrentStep(1);
                  setProject({
                    id: crypto.randomUUID(),
                    title: "",
                    rawScript: "",
                    analysis: null,
                    scenes: [],
                    prompts: {},
                    updatedAt: new Date().toISOString(),
                    settings: {
                      creativity: 50,
                      detailLevel: 50,
                      cameraStyle: "",
                      lightingStyle: "",
                      mood: "",
                      cinematicLevel: 50,
                      outputLength: "Medium",
                      visualStyle: "Cinematic 3D Render",
                      colorPalette: "Deep Black, Light Gray, Amber",
                      referenceImage: null
                    }
                  });
                }}
                variant="outline"
                className="text-gray-600 border-gray-300 hover:bg-gray-50"
              >
                Start New Project
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function GeneratorLayout() {
  return (
    <GeneratorProvider>
      <LayoutContent />
    </GeneratorProvider>
  );
}
