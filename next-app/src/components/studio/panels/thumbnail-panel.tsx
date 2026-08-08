"use client";

import React, { useState, useRef } from "react";
import { StudioProject } from "@/lib/types/studio";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sparkles, Save, Copy, ChevronDown, ChevronRight,
  ImageIcon, Loader2, X, Wand2, FileText, CheckCircle2
} from "lucide-react";
import { toast } from "sonner";
import { ActiveProviderBadge } from "@/components/ActiveProviderBadge";

interface ImagePrompt {
  id: string;
  concept: string;
  prompt: string;
  negativePrompt: string;
  style: string;
  mood: string;
}

interface ScenePromptResult {
  sceneId: string;
  sceneNumber: number;
  sceneTitle: string;
  sceneText: string;
  imagePrompts: ImagePrompt[];
  isLoading: boolean;
  isExpanded: boolean;
  error?: string;
}

interface ThumbnailPanelProps {
  project: StudioProject;
  setProject: React.Dispatch<React.SetStateAction<StudioProject>>;
}

export function ThumbnailPanel({ project, setProject }: ThumbnailPanelProps) {
  const [scenes, setScenes] = useState<ScenePromptResult[]>([]);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const cancelRef = useRef(false);

  const globalTheme = project.globalVisualStyle || "Cinematic Documentary";

  // ── Build initial scene list from project sections ──────────────────────────
  const buildSceneList = (): ScenePromptResult[] =>
    project.sections
      .filter(s => s.content?.trim())
      .map((s, idx) => ({
        sceneId: s.id,
        sceneNumber: s.sceneNumber ?? idx + 1,
        sceneTitle: s.title || s.type || `Scene ${idx + 1}`,
        sceneText: s.content,
        imagePrompts: (s.sceneImagePrompts as any) || [],
        isLoading: false,
        isExpanded: false,
      }));

  // ── Fetch prompts for a single scene ────────────────────────────────────────
  const fetchScenePrompts = async (scene: ScenePromptResult): Promise<ImagePrompt[]> => {
    const res = await fetch("/api/studio/storyboard/scene-image-prompts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sceneText: scene.sceneText,
        sceneNumber: scene.sceneNumber,
        globalTheme
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed");
    return data.imagePrompts || [];
  };

  // ── Generate prompts for ALL scenes (parallel batches of 4) ─────────────────
  const handleGenerateAll = async () => {
    const list = buildSceneList();
    if (list.length === 0) {
      toast.error("No scenes found. Add script content first.");
      return;
    }

    cancelRef.current = false;
    setIsGeneratingAll(true);
    setProgress({ done: 0, total: list.length });

    // Start with all scenes visible but loading
    setScenes(list.map(s => ({ ...s, isLoading: true, isExpanded: false })));

    const BATCH = 4;
    let done = 0;

    for (let i = 0; i < list.length; i += BATCH) {
      if (cancelRef.current) break;
      const batch = list.slice(i, i + BATCH);

      await Promise.all(batch.map(async (scene) => {
        if (cancelRef.current) return;
        try {
          const prompts = await fetchScenePrompts(scene);
          // Save to project sections
          setProject(p => ({
            ...p,
            sections: p.sections.map(s =>
              s.id === scene.sceneId ? { ...s, sceneImagePrompts: prompts as any } : s
            )
          }));
          setScenes(prev => prev.map(s =>
            s.sceneId === scene.sceneId
              ? { ...s, imagePrompts: prompts, isLoading: false, isExpanded: true }
              : s
          ));
        } catch (e: any) {
          setScenes(prev => prev.map(s =>
            s.sceneId === scene.sceneId
              ? { ...s, isLoading: false, error: e.message }
              : s
          ));
        }
        done++;
        setProgress(p => ({ ...p, done }));
      }));
    }

    setIsGeneratingAll(false);
    if (!cancelRef.current) toast.success("✅ All scene image prompts generated!");
  };

  // ── Generate prompts for ONE scene ──────────────────────────────────────────
  const handleGenerateOne = async (sceneId: string) => {
    setScenes(prev => prev.map(s =>
      s.sceneId === sceneId ? { ...s, isLoading: true, error: undefined } : s
    ));
    const scene = scenes.find(s => s.sceneId === sceneId);
    if (!scene) return;
    try {
      const prompts = await fetchScenePrompts(scene);
      setProject(p => ({
        ...p,
        sections: p.sections.map(s =>
          s.id === sceneId ? { ...s, sceneImagePrompts: prompts as any } : s
        )
      }));
      setScenes(prev => prev.map(s =>
        s.sceneId === sceneId
          ? { ...s, imagePrompts: prompts, isLoading: false, isExpanded: true }
          : s
      ));
    } catch (e: any) {
      setScenes(prev => prev.map(s =>
        s.sceneId === sceneId ? { ...s, isLoading: false, error: e.message } : s
      ));
      toast.error(e.message);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const handleSave = () => {
    const data = scenes.map(s => ({
      scene: s.sceneNumber,
      title: s.sceneTitle,
      prompts: s.imagePrompts
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `image_prompts_${project.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Image prompts saved!");
  };

  const totalPrompts = scenes.reduce((sum, s) => sum + s.imagePrompts.length, 0);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* ── Header ── */}
      <div className="p-4 border-b border-border/40 flex justify-between items-center bg-card shadow-sm shrink-0 flex-wrap gap-3">
        <div>
          <h2 className="font-bold text-xl flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-primary" /> Thumbnail AI
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            AI reads each scene's script and generates image prompts per visual idea.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
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
          {scenes.length > 0 && (
            <Button variant="outline" size="lg" onClick={handleSave} className="rounded-xl font-bold shadow-sm h-11 px-5">
              <Save className="w-4 h-4 mr-2 text-muted-foreground" /> Save Prompts
            </Button>
          )}
          {isGeneratingAll ? (
            <Button
              size="lg"
              variant="destructive"
              onClick={() => { cancelRef.current = true; setIsGeneratingAll(false); }}
              className="rounded-xl font-bold shadow-sm h-11 px-5"
            >
              <X className="w-4 h-4 mr-2" /> Stop ({progress.done}/{progress.total})
            </Button>
          ) : (
            <Button
              size="lg"
              onClick={handleGenerateAll}
              className="rounded-xl font-bold shadow-sm h-11 px-5"
            >
              <Sparkles className="w-4 h-4 mr-2" /> Generate All Scenes
            </Button>
          )}
        </div>
      </div>

      {/* ── Progress bar ── */}
      {isGeneratingAll && (
        <div className="px-6 py-3 bg-primary/5 border-b border-primary/10">
          <div className="flex justify-between text-xs font-semibold text-primary mb-1.5">
            <span className="flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating scene prompts...</span>
            <span>{progress.done}/{progress.total} scenes</span>
          </div>
          <div className="w-full bg-primary/20 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      <ScrollArea className="flex-1 p-5 md:p-6 bg-muted/10">
        <div className="max-w-4xl mx-auto space-y-4">

          {/* ── Empty state ── */}
          {scenes.length === 0 && (
            <div className="text-center border-2 border-dashed border-border/60 rounded-3xl p-16 bg-card shadow-sm">
              <ImageIcon className="w-14 h-14 mx-auto text-muted-foreground/25 mb-5" />
              <p className="font-bold text-xl text-foreground mb-2">Scene Image Prompt Generator</p>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
                AI reads your script scene by scene. For each visual idea or sentence it finds,
                it writes a dedicated Midjourney / DALL·E image prompt.
              </p>
              <Button size="lg" onClick={handleGenerateAll} className="rounded-xl font-bold px-8">
                <Wand2 className="w-4 h-4 mr-2" /> Generate Image Prompts
              </Button>
            </div>
          )}

          {/* ── Stats row ── */}
          {scenes.length > 0 && (
            <div className="flex gap-4 flex-wrap">
              <div className="bg-card border border-border/60 rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center gap-2 shadow-sm">
                <FileText className="w-4 h-4 text-primary" />
                {scenes.length} Scenes
              </div>
              <div className="bg-card border border-border/60 rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center gap-2 shadow-sm">
                <ImageIcon className="w-4 h-4 text-primary" />
                {totalPrompts} Image Prompts
              </div>
            </div>
          )}

          {/* ── Scene cards ── */}
          {scenes.map(scene => (
            <div
              key={scene.sceneId}
              className="bg-card border border-border/60 rounded-2xl shadow-sm overflow-hidden transition-shadow hover:shadow-md"
            >
              {/* Scene header */}
              <div
                className="flex items-center justify-between px-5 py-4 cursor-pointer select-none hover:bg-muted/30 transition-colors"
                onClick={() =>
                  !scene.isLoading &&
                  setScenes(prev => prev.map(s =>
                    s.sceneId === scene.sceneId ? { ...s, isExpanded: !s.isExpanded } : s
                  ))
                }
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-black text-primary">
                    {scene.sceneNumber}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-sm text-foreground truncate">{scene.sceneTitle}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{scene.sceneText.slice(0, 80)}…</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                  {scene.isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  ) : scene.error ? (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-7 px-3 text-xs rounded-lg"
                      onClick={e => { e.stopPropagation(); handleGenerateOne(scene.sceneId); }}
                    >
                      Retry
                    </Button>
                  ) : scene.imagePrompts.length > 0 ? (
                    <>
                      <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                        {scene.imagePrompts.length} prompt{scene.imagePrompts.length > 1 ? "s" : ""}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs rounded-lg hover:bg-primary/10"
                        onClick={e => { e.stopPropagation(); handleGenerateOne(scene.sceneId); }}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-3 text-xs rounded-lg"
                      onClick={e => { e.stopPropagation(); handleGenerateOne(scene.sceneId); }}
                    >
                      <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Generate
                    </Button>
                  )}
                  {!scene.isLoading && (
                    scene.isExpanded
                      ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      : <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              </div>

              {/* Image prompts */}
              {scene.isExpanded && scene.imagePrompts.length > 0 && (
                <div className="border-t border-border/40 divide-y divide-border/30">
                  {scene.imagePrompts.map((prompt, idx) => (
                    <div key={prompt.id || idx} className="px-5 py-4 space-y-3 hover:bg-muted/10 transition-colors">
                      {/* Prompt header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-md bg-primary flex items-center justify-center text-[10px] font-black text-primary-foreground flex-shrink-0">
                            {idx + 1}
                          </div>
                          <span className="font-semibold text-sm text-foreground">{prompt.concept}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{prompt.style}</span>
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{prompt.mood}</span>
                        </div>
                      </div>

                      {/* Positive prompt */}
                      <div className="bg-muted/40 rounded-xl p-3.5 border border-border/40">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold text-primary uppercase tracking-wider flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Positive Prompt
                          </span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 rounded-lg hover:bg-primary/10"
                            onClick={() => copyToClipboard(prompt.prompt)}
                          >
                            <Copy className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
                          </Button>
                        </div>
                        <p className="text-xs text-foreground leading-relaxed font-mono">{prompt.prompt}</p>
                      </div>

                      {/* Negative prompt */}
                      {prompt.negativePrompt && (
                        <div className="bg-destructive/5 rounded-xl p-3 border border-destructive/20">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-bold text-destructive/80 uppercase tracking-wider">Negative Prompt</span>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 rounded-lg hover:bg-destructive/10"
                              onClick={() => copyToClipboard(prompt.negativePrompt)}
                            >
                              <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground font-mono">{prompt.negativePrompt}</p>
                        </div>
                      )}

                      {/* Copy both */}
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-3 text-xs rounded-lg w-full border-primary/20 hover:bg-primary/5 hover:text-primary"
                        onClick={() => copyToClipboard(`Prompt: ${prompt.prompt}\nNegative: ${prompt.negativePrompt}`)}
                      >
                        <Copy className="w-3.5 h-3.5 mr-1.5" /> Copy Full Prompt
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Error state */}
              {scene.error && !scene.isLoading && (
                <div className="border-t border-destructive/20 px-5 py-3 text-xs text-destructive bg-destructive/5">
                  ⚠ {scene.error}
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
