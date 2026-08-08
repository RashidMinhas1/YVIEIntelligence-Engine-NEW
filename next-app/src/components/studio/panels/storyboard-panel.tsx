"use client";

import React, { useState, useRef, useEffect } from "react";
import { StudioProject, ScriptSection } from "@/lib/types/studio";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import VirtualizedSceneList from "@/components/studio/VirtualizedSceneList";
import SceneCard from "@/components/studio/panels/SceneCard";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import { Download, Clock, GripVertical, Image as ImageIcon, Video, Type, ArrowRight, Save, LayoutGrid, LayoutList, Sparkles, Upload, FileText, Wand2, ChevronDown, ChevronRight, Loader2, Lock, Unlock, Clapperboard } from "lucide-react";
import { useAIJobManager } from "@/lib/intelligence/job-manager-context";
import { toast } from "sonner";
import { splitScriptIntoSentences, splitScriptIntoParagraphs } from "@/lib/utils";
import { ActiveProviderBadge } from "@/components/ActiveProviderBadge";

interface StoryboardPanelProps {
  project: StudioProject;
  updateSection: (sectionId: string, updates: Partial<ScriptSection>) => void;
  reorderSections: (startIndex: number, endIndex: number) => void;
  setProject: React.Dispatch<React.SetStateAction<StudioProject>>;
}

import AiSuggestField from "@/components/studio/AiSuggestField";

export function StoryboardPanel({ project, updateSection, reorderSections, setProject }: StoryboardPanelProps) {
  const globalTheme = project.globalVisualStyle || "Documentary Cinematic";
  const [viewMode, setViewMode] = useState<"grid" | "timeline">("grid");
  const [wpm, setWpm] = useState<number>(150);
  const [mode, setMode] = useState<"manual" | "ai">("manual");
  const jobManager = useAIJobManager();
  
  // Collapsible state for scene fields
  const [expandedScenes, setExpandedScenes] = useState<Record<string, boolean>>({});
  
  // AI Generator State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingStep, setGeneratingStep] = useState(0);
  const [generatingSceneCount, setGeneratingSceneCount] = useState(0);
  // Auto map all fields state
  const [isMappingAll, setIsMappingAll] = useState(false);
  const [mappingProgress, setMappingProgress] = useState({ done: 0, total: 0 });
  const mapCancelRef = useRef(false);

  const [aiTheme, setAiTheme] = useState(project.globalVisualStyle || "Documentary Cinematic");
  const [aiSceneCount, setAiSceneCount] = useState<number | "auto">("auto");
  const [aiChunkStyle, setAiChunkStyle] = useState<"sentences" | "paragraphs">("sentences");
  const [aiScript, setAiScript] = useState(project.rawScript || project.sections.map(s => s.content).join("\n\n"));

  React.useEffect(() => {
    const currentText = project.rawScript || project.sections.map(s => s.content).join("\n\n");
    setAiScript(currentText);
  }, [project.rawScript, project.sections]);
  const [isExtracting, setIsExtracting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) {
      setIsDragging(false);
      return;
    }
    reorderSections(result.source.index, result.destination.index);
    setIsDragging(false);
  };

  const calculateDuration = (text: string, currentWpm: number) => {
    if (!text) return 0;
    const words = text.trim().split(/\s+/).length;
    return text.trim() === "" ? 0 : Math.ceil((words / currentWpm) * 60);
  };

  const handleContentChange = (sectionId: string, content: string) => {
    const duration = calculateDuration(content, wpm);
    updateSection(sectionId, { content, duration });
  };

  const totalDuration = project.sections.reduce((acc, s) => acc + (s.duration || calculateDuration(s.content, wpm)), 0);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const toggleSceneExpanded = (id: string) => {
    setExpandedScenes(prev => ({ ...prev, [id]: prev[id] === undefined ? false : !prev[id] }));
  };

  const removeSection = (id: string) => {
    setProject(prev => ({
      ...prev,
      sections: prev.sections.filter(s => s.id !== id)
    }));
    toast.success("Scene deleted");
  };

  const duplicateSection = (id: string) => {
    setProject(prev => {
      const index = prev.sections.findIndex(s => s.id === id);
      if (index === -1) return prev;
      const original = prev.sections[index];
      const newSection = {
        ...original,
        id: crypto.randomUUID()
      };
      const newSections = [...prev.sections];
      newSections.splice(index + 1, 0, newSection);
      return { ...prev, sections: newSections };
    });
    toast.success("Scene duplicated");
  };

  const handleExport = async (format: "txt" | "md" | "json" | "docx") => {
    if (format === "json") {
      const blob = new Blob([JSON.stringify(project, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${project.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_storyboard.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Exported as JSON");
      return;
    }

    if (format === "txt" || format === "md") {
      let content = "";
      project.sections.forEach((s, i) => {
        if (format === "txt") {
          content += `==================================================\nSCENE ${String(i + 1).padStart(2, "0")}\n==================================================\n\n`;
          content += `SCRIPT\n${s.content || ""}\n\n`;
          content += `--------------------------------------------------\nVOICE OVER\n--------------------------------------------------\n${s.voiceOver || ""}\n\n`;
          content += `--------------------------------------------------\nVISUALS\n--------------------------------------------------\nEnvironment: ${s.environment || ""}\nBackground: ${s.background || ""}\nCharacters: ${s.characterNotes || ""}\nComposition: ${s.composition || ""}\n\n`;
          content += `--------------------------------------------------\nCAMERA\n--------------------------------------------------\nMovement: ${s.cameraMovement || ""}\nAngle: ${s.cameraAngle || ""}\nLens: ${s.cameraLens || ""}\n\n`;
          content += `--------------------------------------------------\nLIGHTING\n--------------------------------------------------\n${s.lighting || ""}\n\n`;
          content += `--------------------------------------------------\nCOLOR PALETTE\n--------------------------------------------------\n${s.colorPalette || ""}\n\n`;
          content += `--------------------------------------------------\nART DIRECTION\n--------------------------------------------------\nMood: ${s.mood || ""}\nEmotion: ${s.emotion || ""}\n\n`;
          content += `--------------------------------------------------\nB-ROLL\n--------------------------------------------------\n${s.brollSuggestions ? (Array.isArray(s.brollSuggestions) ? s.brollSuggestions.map(b => `- ${b}`).join("\n") : s.brollSuggestions) : ""}\n\n`;
          content += `--------------------------------------------------\nON SCREEN TEXT\n--------------------------------------------------\n${s.onScreenText || ""}\n\n`;
          content += `--------------------------------------------------\nSFX\n--------------------------------------------------\n${s.soundEffects || ""}\n\n`;
          content += `--------------------------------------------------\nBACKGROUND MUSIC\n--------------------------------------------------\n${s.musicNotes || ""}\n\n`;
          content += `--------------------------------------------------\nTRANSITIONS\n--------------------------------------------------\n${s.transitionNotes || ""}\n\n`;
          content += `--------------------------------------------------\nPOST PRODUCTION\n--------------------------------------------------\n${s.editingNotes || ""}\n\n`;
          content += `--------------------------------------------------\nAI IMAGE PROMPT\n--------------------------------------------------\n${s.aiPrompt || ""}\n\n`;
          content += `--------------------------------------------------\nNEGATIVE PROMPT\n--------------------------------------------------\n${s.negativePrompt || ""}\n\n`;
        } else if (format === "md") {
          content += `# SCENE ${String(i + 1).padStart(2, "0")}\n\n`;
          content += `## Script\n${s.content || ""}\n\n`;
          content += `## Voice Over\n${s.voiceOver || ""}\n\n`;
          content += `## Visuals\n- **Environment:** ${s.environment || ""}\n- **Background:** ${s.background || ""}\n- **Characters:** ${s.characterNotes || ""}\n- **Composition:** ${s.composition || ""}\n\n`;
          content += `## Camera\n- **Movement:** ${s.cameraMovement || ""}\n- **Angle:** ${s.cameraAngle || ""}\n- **Lens:** ${s.cameraLens || ""}\n\n`;
          content += `## Lighting\n${s.lighting || ""}\n\n`;
          content += `## Color Palette\n${s.colorPalette || ""}\n\n`;
          content += `## Art Direction\n- **Mood:** ${s.mood || ""}\n- **Emotion:** ${s.emotion || ""}\n\n`;
          content += `## B-Roll\n${s.brollSuggestions ? (Array.isArray(s.brollSuggestions) ? s.brollSuggestions.map(b => `- ${b}`).join("\n") : s.brollSuggestions) : ""}\n\n`;
          content += `## On Screen Text\n${s.onScreenText || ""}\n\n`;
          content += `## SFX\n${s.soundEffects || ""}\n\n`;
          content += `## Background Music\n${s.musicNotes || ""}\n\n`;
          content += `## Transitions\n${s.transitionNotes || ""}\n\n`;
          content += `## Post Production\n${s.editingNotes || ""}\n\n`;
          
          if (s.sceneImagePrompts && s.sceneImagePrompts.length > 0) {
            content += `## Scene Image Prompts\n${s.sceneImagePrompts.map(p => `- ${p}`).join("\n")}\n\n`;
          }

          content += `## AI Image Prompt\n\`\`\`\n${s.aiPrompt || ""}\n\`\`\`\n\n`;
        }
      });
      
      // Append Production Assets
      if (project.production) {
        content += `# Production Assets\n\n`;
        if (project.production.titles?.length) content += `## Titles\n${project.production.titles.map(t => `- ${t.title}`).join("\n")}\n\n`;
        if (project.production.description?.full) content += `## Description\n${project.production.description.full}\n\n`;
        if (project.production.tags?.youtubeTags?.length) content += `## Tags\n${project.production.tags.youtubeTags.join(", ")}\n\n`;
        if (project.production.chapters?.length) content += `## Chapters\n${project.production.chapters.map(c => `${c.time} - ${c.title}`).join("\n")}\n\n`;
        if (project.production.editingChecklist?.length) content += `## Checklist\n${project.production.editingChecklist.map(c => `- [ ] ${c.description}`).join("\n")}\n\n`;
        if (project.production.thumbnails?.length) content += `## Thumbnail Concepts\n${project.production.thumbnails.map(t => `- ${t.title}`).join("\n")}\n\n`;
      }
      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${project.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_storyboard.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported as ${format.toUpperCase()}`);
      return;
    }

    if (format === "docx") {
      try {
        const docx = await import("docx");
        const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType } = docx;
        
        const docChildren: any[] = [
          new Paragraph({
            text: project.title || "Storyboard",
            heading: HeadingLevel.TITLE,
            spacing: { after: 400 }
          }),
          new Paragraph({
            text: `Generated on: ${new Date().toLocaleDateString()}`,
            spacing: { after: 800 }
          })
        ];

        project.sections.forEach((s, i) => {
          docChildren.push(
            new Paragraph({ text: `SCENE ${String(i + 1).padStart(2, "0")}`, heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 } }),
            
            new Paragraph({ text: "Script", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: s.content || "", spacing: { after: 200 } }),
            
            new Paragraph({ text: "Voice Over", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: s.voiceOver || "", spacing: { after: 200 } }),
            
            new Paragraph({ text: "Visuals", heading: HeadingLevel.HEADING_2 }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({ children: [new TableCell({ children: [new Paragraph({ text: "Environment", style: "Strong" })] }), new TableCell({ children: [new Paragraph(s.environment || "")] })] }),
                new TableRow({ children: [new TableCell({ children: [new Paragraph({ text: "Background", style: "Strong" })] }), new TableCell({ children: [new Paragraph(s.background || "")] })] }),
                new TableRow({ children: [new TableCell({ children: [new Paragraph({ text: "Characters", style: "Strong" })] }), new TableCell({ children: [new Paragraph(s.characterNotes || "")] })] }),
                new TableRow({ children: [new TableCell({ children: [new Paragraph({ text: "Composition", style: "Strong" })] }), new TableCell({ children: [new Paragraph(s.composition || "")] })] })
              ]
            }),
            new Paragraph({ spacing: { after: 200 } }),

            new Paragraph({ text: "Camera", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ children: [new TextRun({ text: "Movement: ", bold: true }), new TextRun(s.cameraMovement || "")] }),
            new Paragraph({ children: [new TextRun({ text: "Angle: ", bold: true }), new TextRun(s.cameraAngle || "")] }),
            new Paragraph({ children: [new TextRun({ text: "Lens: ", bold: true }), new TextRun(s.cameraLens || "")], spacing: { after: 200 } }),
            
            new Paragraph({ text: "Lighting", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: s.lighting || "", spacing: { after: 200 } }),
            
            new Paragraph({ text: "Color Palette", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: s.colorPalette || "", spacing: { after: 200 } }),
            
            new Paragraph({ text: "Art Direction", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ children: [new TextRun({ text: "Mood: ", bold: true }), new TextRun(s.mood || "")] }),
            new Paragraph({ children: [new TextRun({ text: "Emotion: ", bold: true }), new TextRun(s.emotion || "")], spacing: { after: 200 } }),
            
            new Paragraph({ text: "B-Roll", heading: HeadingLevel.HEADING_2 })
          );

          if (s.brollSuggestions && Array.isArray(s.brollSuggestions)) {
            s.brollSuggestions.forEach(b => {
              docChildren.push(new Paragraph({ text: b, bullet: { level: 0 } }));
            });
          } else if (s.brollSuggestions) {
            docChildren.push(new Paragraph({ text: String(s.brollSuggestions) }));
          }
          docChildren.push(new Paragraph({ spacing: { after: 200 } }));

          docChildren.push(
            new Paragraph({ text: "On Screen Text", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: s.onScreenText || "", spacing: { after: 200 } }),
            
            new Paragraph({ text: "Music & Sound Effects", heading: HeadingLevel.HEADING_2 })
          );
          if (s.musicNotes) docChildren.push(new Paragraph({ text: `Music: ${s.musicNotes}`, bullet: { level: 0 } }));
          if (s.soundEffects) docChildren.push(new Paragraph({ text: `SFX: ${s.soundEffects}`, bullet: { level: 0 } }));
          docChildren.push(new Paragraph({ spacing: { after: 200 } }));

          docChildren.push(
            new Paragraph({ text: "Transitions", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: s.transitionNotes || "", bullet: { level: 0 } }),
            new Paragraph({ spacing: { after: 200 } }),
            
            new Paragraph({ text: "Post Production", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: s.editingNotes || "", spacing: { after: 200 } }),
            
            new Paragraph({ text: "AI Image Prompt", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ children: [new TextRun({ text: s.aiPrompt || "", font: "Courier New" })], spacing: { after: 200 } }),
            
            new Paragraph({ text: "Negative Prompt", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ children: [new TextRun({ text: s.negativePrompt || "", font: "Courier New" })], spacing: { after: 400 } })
          );
        });

        const doc = new Document({
          sections: [{
            properties: {},
            children: docChildren
          }]
        });

        const blob = await Packer.toBlob(doc);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${project.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_storyboard.docx`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Exported as DOCX");
      } catch(err) {
        toast.error("Failed to export DOCX");
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExtracting(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/studio/storyboard/extract", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setAiScript(data.text);

      const sentences = splitScriptIntoSentences(data.text);
      
      setProject(prev => {
        const sections = sentences.length > 0 ? sentences.map((sentence, idx) => ({
          id: crypto.randomUUID(),
          type: `Scene ${idx + 1}`,
          content: sentence,
          isExpanded: true
        })) : prev.sections;
        return { ...prev, rawScript: data.text, sections };
      });

      toast.success(sentences.length > 0 ? `Script extracted and split into ${sentences.length} scenes!` : "Script extracted successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to extract script from file.");
    } finally {
      setIsExtracting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Watch job status using a safe interval — only polls while generating
  const pollerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoMapTriggeredRef = useRef(false);

  const startPolling = () => {
    if (pollerRef.current) return; // already polling
    pollerRef.current = setInterval(() => {
      if (!jobManager) return;
      const job = jobManager.getJobStatus({ type: "project", moduleId: "storyboard" });
      if (!job) return;

      if (job.status === "queued" || job.status === "preparing") {
        setGeneratingStep(1);
      } else if (job.status === "analyzing") {
        setGeneratingStep(2);
      } else if (job.status === "generating") {
        setGeneratingStep(3);
      } else if (job.status === "validating" || job.status === "saving") {
        setGeneratingStep(4);
      } else if (job.status === "completed") {
        setGeneratingStep(5);
        clearInterval(pollerRef.current!);
        pollerRef.current = null;
        setTimeout(() => {
          setIsGenerating(false);
          setGeneratingStep(0);
          setMode("manual");
          toast.success("Storyboard mapped! Scenes are ready.");
        }, 1200);
      } else if (job.status === "failed") {
        clearInterval(pollerRef.current!);
        pollerRef.current = null;
        setIsGenerating(false);
        setGeneratingStep(0);
        toast.error(job.error || "Storyboard generation failed.");
      }
    }, 800);
  };

  // Clean up poller on unmount
  useEffect(() => {
    return () => {
      if (pollerRef.current) clearInterval(pollerRef.current);
    };
  }, []);

  // Reset auto‑map guard when component re‑mounts (e.g., new project loads)
  useEffect(() => {
    autoMapTriggeredRef.current = false;
  }, [project.id]);
  const generateAIStoryboard = async () => {
    if (!aiScript.trim()) {
      toast.error("Please provide a script to generate scenes from.");
      return;
    }
    
    try {
      const chunks = aiChunkStyle === "paragraphs" ? splitScriptIntoParagraphs(aiScript) : splitScriptIntoSentences(aiScript);

      if (!jobManager) {
          toast.error("Job Manager not available");
          return;
      }

      // Show progress overlay and start safe poller
      setIsGenerating(true);
      setGeneratingStep(1);
      setGeneratingSceneCount(chunks.length);
      startPolling();

      await jobManager.startJob(
        { type: "project", moduleId: "storyboard" },
        { script: chunks, theme: aiTheme, sceneCount: chunks.length },
        "/api/studio/generate-storyboard"
      );
    } catch (err: any) {
      if (pollerRef.current) { clearInterval(pollerRef.current); pollerRef.current = null; }
      setIsGenerating(false);
      setGeneratingStep(0);
      toast.error(err.message || "Failed to start generation job");
    }
  };

  // The fields we want to auto-fill for each scene
  const SCENE_FIELDS: { key: keyof ScriptSection; label: string }[] = [
    { key: "visualNotes",     label: "Visual Notes" },
    { key: "cameraMovement",  label: "Camera Movement" },
    { key: "cameraAngle",     label: "Camera Angle" },
    { key: "cameraLens",      label: "Camera Lens" },
    { key: "lighting",        label: "Lighting" },
    { key: "colorPalette",    label: "Color Palette" },
    { key: "mood",            label: "Mood" },
    { key: "emotion",         label: "Emotion" },
    { key: "onScreenText",    label: "On Screen Text" },
    { key: "soundEffects",    label: "SFX" },
    { key: "musicNotes",      label: "Music" },
    { key: "transitionNotes", label: "Transition" },
    { key: "editingNotes",    label: "Post Production" },
    { key: "aiPrompt",        label: "AI Image Prompt" },
  ];

  const autoMapAllFields = async () => {
    const sections = project.sections.filter(s => s.content.trim());
    if (sections.length === 0) {
      toast.error("No scenes to map. Generate your storyboard first.");
      return;
    }

    const total = sections.length;
    setIsMappingAll(true);
    setMappingProgress({ done: 0, total });
    mapCancelRef.current = false;

    // Process scenes in parallel batches of 5
    const BATCH_SIZE = 5;
    let done = 0;

    for (let i = 0; i < sections.length; i += BATCH_SIZE) {
      if (mapCancelRef.current) break;

      const batch = sections.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(async (section) => {
          if (mapCancelRef.current) return;
          try {
            const res = await fetch("/api/studio/storyboard/bulk-scene-fields", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                scriptChunk: section.content,
                globalTheme: globalTheme
              })
            });
            if (res.ok) {
              const data = await res.json();
              if (data.fields) {
                updateSection(section.id, data.fields as Partial<ScriptSection>);
              }
            }
          } catch { /* skip errors, continue */ }
          done++;
          setMappingProgress({ done, total });
        })
      );
    }

    setIsMappingAll(false);
    setMappingProgress({ done: 0, total: 0 });
    if (!mapCancelRef.current) {
      toast.success("✅ All fields mapped!");
    }
  };


  const PROGRESS_STEPS = [
    { label: "Reading script...", icon: "📄" },
    { label: "Analysing narrative structure...", icon: "🧠" },
    { label: "AI mapping scenes & fields...", icon: "🎬" },
    { label: "Validating & saving...", icon: "✅" },
    { label: "Done! Opening storyboard...", icon: "🚀" },
  ];

  return (
    <div className="h-full flex flex-col bg-background relative">
      {/* Top Header */}
      {/* Top Header Row */}
      <div className="p-4 border-b border-border bg-card/50 flex flex-col gap-3 shrink-0">
        <div className="flex justify-between items-center w-full">
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
              <Clapperboard className="w-4 h-4 text-purple-500" />
              Storyboard Planning
              {isGenerating && (
                <span className="ml-2 text-xs text-blue-500 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> AI Generating...
                </span>
              )}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Visualize your narrative. Break script into scenes.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <ActiveProviderBadge 
              featureKey="studio" 
              moduleName="Creator Studio" 
              subFeatures={[
                { key: 'studio.ai_task', label: 'Script Editor AI Assistant' },
                { key: 'studio.analyze_task', label: 'Retention & Pacing Analyzer' },
                { key: 'studio.storyboard_generate', label: 'Storyboard Scene Generator' },
                { key: 'studio.thumbnail_ideator', label: 'Thumbnail AI Ideator' },
                { key: 'studio.research_generate', label: 'Research & Hook Generator' }
              ]}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                  <Download className="w-3.5 h-3.5" /> Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport("txt")}>Plain Text (.txt)</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("md")}>Markdown (.md)</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("docx")}>Microsoft Word (.docx)</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("json")}>JSON Data</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => {
              const dataToSave = {
                sections: project.sections.map(s => ({
                  id: s.id,
                  title: s.title,
                  content: s.content,
                  visualNotes: s.visualNotes,
                  environment: s.environment,
                  background: s.background,
                  characterNotes: s.characterNotes,
                  composition: s.composition,
                  cameraAngle: s.cameraAngle,
                  cameraLens: s.cameraLens,
                  cameraMovement: s.cameraMovement,
                  lighting: s.lighting,
                  colorPalette: s.colorPalette,
                  mood: s.mood,
                  emotion: s.emotion,
                  onScreenText: s.onScreenText,
                  soundEffects: s.soundEffects,
                  musicNotes: s.musicNotes,
                  transitionNotes: s.transitionNotes,
                  editingNotes: s.editingNotes,
                  aiPrompt: s.aiPrompt,
                  sceneImagePrompts: s.sceneImagePrompts
                }))
              };
              localStorage.setItem(`studio_storyboard_${project.id}`, JSON.stringify(dataToSave));
              const blob = new Blob([JSON.stringify(dataToSave, null, 2)], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `storyboard_data_${project.id}.json`;
              a.click();
              URL.revokeObjectURL(url);
              toast.success("Storyboard saved & downloaded!");
            }}>
              <Save className="w-3.5 h-3.5" /> Save Storyboard
            </Button>
          </div>
        </div>

        {/* Sub Toolbar Row */}
        <div className="flex items-center justify-between flex-wrap gap-3 pt-1 border-t border-border/20">
          <div className="flex items-center gap-3">
            <div className="flex bg-muted p-0.5 rounded-lg shadow-inner">
              <button 
                onClick={() => setMode("manual")} 
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${mode === "manual" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                Manual Storyboard
              </button>
              <button 
                onClick={() => setMode("ai")} 
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center ${mode === "ai" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5 text-primary"/> AI Generator
              </button>
            </div>

            {mode === "manual" && (
              <>
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Total: <span className="text-foreground font-semibold">{formatTime(totalDuration)}</span>
                </p>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium text-muted-foreground">Pacing:</span>
                  <select 
                    className="text-xs border rounded-md p-1 bg-background font-medium h-7"
                    value={wpm}
                    onChange={(e) => setWpm(Number(e.target.value))}
                  >
                    <option value={120}>Slow (120 WPM)</option>
                    <option value={150}>Normal (150 WPM)</option>
                    <option value={180}>Fast (180 WPM)</option>
                  </select>
                </div>
              </>
            )}
          </div>

          {mode === "manual" && (
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5 bg-muted p-0.5 rounded-md">
                <Button variant={viewMode === "grid" ? "secondary" : "ghost"} size="sm" onClick={() => setViewMode("grid")} className="h-7 w-7 p-0 rounded">
                  <LayoutGrid className="w-3.5 h-3.5" />
                </Button>
                <Button variant={viewMode === "timeline" ? "secondary" : "ghost"} size="sm" onClick={() => setViewMode("timeline")} className="h-7 w-7 p-0 rounded">
                  <LayoutList className="w-3.5 h-3.5" />
                </Button>
              </div>

              {/* AI Map All Fields button */}
              {project.sections.length > 0 && (
                <Button
                  variant="default"
                  size="sm"
                  className="h-7 gap-1.5 text-xs bg-purple-600 hover:bg-purple-700 text-white px-3"
                  onClick={isMappingAll ? () => { mapCancelRef.current = true; } : autoMapAllFields}
                  disabled={isGenerating}
                >
                  {isMappingAll ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      {mappingProgress.done}/{mappingProgress.total} — Stop
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      AI Map All Fields ({project.sections.length} scenes)
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* AI Generation Progress Overlay */}
      {isGenerating && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm">
          <div className="w-full max-w-lg mx-auto px-8 text-center space-y-8">
            {/* Animated icon */}
            <div className="flex items-center justify-center">
              <div className="relative w-20 h-20">
                <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-ping" />
                <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center text-3xl">
                  {generatingStep > 0 ? PROGRESS_STEPS[generatingStep - 1]?.icon : "🎬"}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-bold tracking-tight">
                {generatingStep === 5 ? "Storyboard Ready!" : "Generating AI Storyboard"}
              </h3>
              <p className="text-muted-foreground text-sm">
                {generatingStep > 0 ? PROGRESS_STEPS[generatingStep - 1]?.label : "Starting..."}
                {generatingSceneCount > 0 && generatingStep === 3 && (
                  <span className="ml-1 font-semibold text-primary">({generatingSceneCount} scenes)</span>
                )}
              </p>
            </div>

            {/* Step Progress Bar */}
            <div className="space-y-3">
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="h-2 bg-primary rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${(generatingStep / 5) * 100}%` }}
                />
              </div>
              <div className="flex justify-between">
                {PROGRESS_STEPS.map((step, i) => (
                  <div
                    key={i}
                    className={`flex flex-col items-center gap-1 transition-all duration-300 ${
                      i + 1 <= generatingStep ? "opacity-100" : "opacity-30"
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full ${
                      i + 1 < generatingStep ? "bg-primary" :
                      i + 1 === generatingStep ? "bg-primary animate-pulse" : "bg-muted-foreground/30"
                    }`} />
                    <span className="text-xs text-muted-foreground hidden sm:block">{i + 1}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Scene chunks preview */}
            {generatingSceneCount > 0 && (
              <div className="grid grid-cols-5 gap-1">
                {Array.from({ length: Math.min(generatingSceneCount, 20) }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      generatingStep >= 3 ? "bg-primary/60" : "bg-muted"
                    }`}
                    style={{ animationDelay: `${i * 60}ms` }}
                  />
                ))}
                {generatingSceneCount > 20 && (
                  <span className="col-span-5 text-xs text-muted-foreground text-center">+{generatingSceneCount - 20} more scenes</span>
                )}
              </div>
            )}

            <p className="text-xs text-muted-foreground/60">
              AI is auto-mapping visual, camera, art direction and post-production fields for each scene
            </p>
          </div>
        </div>
      )}

      {/* Main Area */}
      <ScrollArea className="flex-1 p-4 md:p-8 bg-muted/10">
        {mode === "ai" ? (
          <div className="max-w-4xl mx-auto bg-card border border-border/60 rounded-2xl p-8 shadow-sm space-y-8">
            <div>
              <h3 className="text-2xl font-bold mb-2">Intelligent Storyboard Generator</h3>
              <p className="text-base text-muted-foreground">Automatically break down your script into professional scenes with 27 points of AI-generated production data, perfect pacing, and Midjourney image prompts.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Global Visual Theme</label>
                <Input 
                  value={aiTheme} 
                  onChange={(e) => setAiTheme(e.target.value)} 
                  placeholder="e.g., Documentary Cinematic, Dark Mystery, Pixar..."
                  className="h-10 text-base"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Scene Distribution</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={aiSceneCount.toString()}
                  onChange={(e) => setAiSceneCount(e.target.value === "auto" ? "auto" : Number(e.target.value))}
                >
                  <option value="auto">Automatic (Intelligent Flow Detection)</option>
                  <option value="10">10 Scenes</option>
                  <option value="20">20 Scenes</option>
                  <option value="30">30 Scenes</option>
                </select>
              </div>
            </div>

            <div className="space-y-3 border-t border-border/40 pt-6">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold">Script Source</label>
                <div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept=".txt,.md,.pdf,.docx"
                    onChange={handleFileUpload}
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isExtracting}
                    className="rounded-full px-4"
                  >
                    {isExtracting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                    Upload File (PDF, DOCX, TXT)
                  </Button>
                </div>
              </div>
              <Textarea 
                value={aiScript}
                onChange={(e) => {
                  const val = e.target.value;
                  const isPaste = val.length - aiScript.length > 50; // simple heuristic for paste
                  setAiScript(val);

                  if (isPaste) {
                    const sentences = splitScriptIntoSentences(val);
                    if (sentences.length > 0) {
                      setProject(prev => {
                        let localPhaseCounts: Record<string, number> = {};
                        const newSections = sentences.map((sentence, idx) => {
                          const percent = idx / sentences.length;
                          let phase = "MAIN BODY";
                          if (percent < 0.15) phase = "HOOK";
                          else if (percent < 0.25) phase = "INTRO";
                          else if (percent > 0.90) phase = "CTA";
                          else if (percent > 0.75) phase = "CLIMAX";

                          localPhaseCounts[phase] = (localPhaseCounts[phase] || 0) + 1;
                          
                          return {
                            id: crypto.randomUUID(),
                            type: `${phase}-SENTENCE-${localPhaseCounts[phase]}`,
                            content: sentence,
                            isExpanded: true
                          };
                        });
                        return { ...prev, rawScript: val, sections: newSections };
                      });
                      toast.success(`Auto-split into ${sentences.length} scenes!`);
                      return;
                    }
                  }

                  setProject(prev => ({ ...prev, rawScript: val }));
                }}
                className="min-h-[300px] text-base leading-relaxed p-4"
                placeholder="Paste your voiceover script here, or upload a file..."
              />
            </div>

            {/* Chunking Strategy Selector */}
            <div className="space-y-3 pt-6 border-t border-border/40">
              <label className="text-sm font-semibold">How should the AI chunk your script?</label>
              <div className="grid grid-cols-2 gap-4">
                <div 
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${aiChunkStyle === "sentences" ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/30 bg-card"}`}
                  onClick={() => setAiChunkStyle("sentences")}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${aiChunkStyle === "sentences" ? "border-primary bg-primary" : "border-muted-foreground"}`}>
                      {aiChunkStyle === "sentences" && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                    </div>
                    <h4 className="font-bold text-sm">Sentences Form</h4>
                  </div>
                  <p className="text-xs text-muted-foreground ml-6">Breaks script line-by-line. Best for fast-paced edits and heavy B-Roll.</p>
                </div>
                <div 
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${aiChunkStyle === "paragraphs" ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/30 bg-card"}`}
                  onClick={() => setAiChunkStyle("paragraphs")}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${aiChunkStyle === "paragraphs" ? "border-primary bg-primary" : "border-muted-foreground"}`}>
                      {aiChunkStyle === "paragraphs" && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                    </div>
                    <h4 className="font-bold text-sm">Dialogue / Scenes Form</h4>
                  </div>
                  <p className="text-xs text-muted-foreground ml-6">Groups text into natural dialogues. Best for smooth cinematic flow.</p>
                </div>
              </div>
            </div>

            <Button 
              className="w-full h-14 text-lg font-bold rounded-xl" 
              onClick={generateAIStoryboard} 
              disabled={isGenerating || !aiScript.trim()}
            >
              {isGenerating ? (
                <><Loader2 className="w-5 h-5 mr-3 animate-spin" /> Analyzing Narrative & Generating Scenes...</>
              ) : (
                <><Wand2 className="w-5 h-5 mr-3" /> Generate Premium Storyboard</>
              )}
            </Button>
          </div>
        ) : (
          <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <Droppable droppableId="storyboard" direction={viewMode === "grid" ? "horizontal" : "vertical"}>
              {(provided: any) => (
                <div 
                  {...provided.droppableProps} 
                  ref={provided.innerRef}
                  className={viewMode === "grid" ? "grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6" : "flex flex-col gap-6 max-w-5xl mx-auto"}
                >
                  {!isDragging && project.sections.length > 20 ? (
                    <VirtualizedSceneList
                      items={project.sections}
                      renderItem={(section, index) => (
                        <SceneCard
                          section={section}
                          index={index}
                          isExpanded={expandedScenes[section.id] !== false}
                          toggleSceneExpanded={toggleSceneExpanded}
                          updateSection={updateSection}
                          handleContentChange={handleContentChange}
                          globalTheme={globalTheme}
                          wpm={wpm}
                          onRemove={removeSection}
                          onDuplicate={duplicateSection}
                        />
                      )}
                    />
                  ) : (
                    project.sections.map((section, index) => (
                      <Draggable key={section.id} draggableId={section.id} index={index}>
                        {(provided: any) => (
                          <SceneCard
                            section={section}
                            index={index}
                            isExpanded={expandedScenes[section.id] !== false}
                            toggleSceneExpanded={toggleSceneExpanded}
                            updateSection={updateSection}
                            handleContentChange={handleContentChange}
                            globalTheme={globalTheme}
                          wpm={wpm}
                            provided={provided}
                            onRemove={removeSection}
                            onDuplicate={duplicateSection}
                          />
                        )}
                      </Draggable>
                    ))
                  )}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </ScrollArea>
    </div>
  );
}
