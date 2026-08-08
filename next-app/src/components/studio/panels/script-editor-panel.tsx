"use client";

import React, { useState } from "react";
import { StudioProject, ScriptSection } from "@/lib/types/studio";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, GripVertical, ChevronDown, ChevronRight, Wand2, Trash2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { PromptEditor } from "@/components/ui/prompt-editor";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useJob } from "@/hooks/use-job";
import { JobProgress } from "@/components/ui/job-progress";
import { toast } from "sonner";
import { ActiveProviderBadge } from "@/components/ActiveProviderBadge";

interface ScriptEditorPanelProps {
  project: StudioProject;
  setProject: React.Dispatch<React.SetStateAction<StudioProject>>;
  updateSection: (id: string, updates: Partial<ScriptSection>) => void;
  addSection: (type: string, index: number) => void;
  removeSection: (id: string) => void;
  reorderSections: (start: number, end: number) => void;
  isSaving: boolean;
}

export function ScriptEditorPanel({ 
  project, 
  updateSection, 
  addSection, 
  removeSection, 
  reorderSections,
  isSaving,
  setProject
}: ScriptEditorPanelProps) {
  const [activeJobSection, setActiveJobSection] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [focusSectionId, setFocusSectionId] = useState<string | null>(null);

  React.useEffect(() => {
    setMounted(true);
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setFocusSectionId(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const { job, isPolling, startPolling, cancelJob, reset } = useJob(null, {
    onComplete: (result) => {
      if (activeJobSection && result.updatedContent) {
        updateSection(activeJobSection, { content: result.updatedContent });
        toast.success("AI operation complete.");
      }
      setActiveJobSection(null);
    },
    onError: (err) => {
      toast.error(err || "AI operation failed.");
      setActiveJobSection(null);
    }
  });

  const handleAIAction = async (sectionId: string, action: string) => {
    if (isPolling) return;
    const section = project.sections.find(s => s.id === sectionId);
    if (!section) return;

    setActiveJobSection(sectionId);
    reset();

    const fullContext = project.sections.map(s => `${s.type}:\n${s.content}`).join("\n\n");

    try {
      const res = await fetch("/api/studio/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          sectionType: section.type,
          currentContent: section.content,
          fullScriptContext: fullContext
        })
      });
      const data = await res.json();
      if (data.jobId) startPolling(data.jobId);
    } catch (err) {
      toast.error("Failed to start AI action.");
      setActiveJobSection(null);
    }
  };

  const handleExport = (format: "md" | "txt") => {
    let textContent = "";
    if (format === "md") {
      textContent = project.sections.map((s, i) => `# SCENE ${String(i + 1).padStart(2, "0")}\n\n## Script\n${s.content}\n\n## Voice Over\n${s.voiceOver || ""}\n\n## Visuals\n- **Environment:** ${s.environment || ""}\n- **Background:** ${s.background || ""}\n- **Characters:** ${s.characterNotes || ""}\n- **Composition:** ${s.composition || ""}\n\n## Camera\n- **Movement:** ${s.cameraMovement || ""}\n- **Angle:** ${s.cameraAngle || ""}\n- **Lens:** ${s.cameraLens || ""}\n\n## Lighting\n${s.lighting || ""}\n\n## Color Palette\n${s.colorPalette || ""}\n\n## Art Direction\n- **Mood:** ${s.mood || ""}\n- **Emotion:** ${s.emotion || ""}\n\n## B-Roll\n${s.brollSuggestions ? (Array.isArray(s.brollSuggestions) ? s.brollSuggestions.map(b => `- ${b}`).join("\n") : s.brollSuggestions) : ""}\n\n## AI Image Prompt\n\`\`\`\n${s.aiPrompt || ""}\n\`\`\`\n\n## Negative Prompt\n\`\`\`\n${s.negativePrompt || ""}\n\`\`\`\n\n`).join("\n");
    } else {
      textContent = project.sections.map((s, i) => `==================================================\nSCENE ${String(i + 1).padStart(2, "0")}\n==================================================\n\nSCRIPT\n${s.content}\n\n--------------------------------------------------\nVOICE OVER\n--------------------------------------------------\n${s.voiceOver || ""}\n\n--------------------------------------------------\nVISUALS\n--------------------------------------------------\nEnvironment: ${s.environment || ""}\nBackground: ${s.background || ""}\nCharacters: ${s.characterNotes || ""}\nComposition: ${s.composition || ""}\n\n--------------------------------------------------\nCAMERA\n--------------------------------------------------\nMovement: ${s.cameraMovement || ""}\nAngle: ${s.cameraAngle || ""}\nLens: ${s.cameraLens || ""}\n\n--------------------------------------------------\nLIGHTING\n--------------------------------------------------\n${s.lighting || ""}\n\n--------------------------------------------------\nCOLOR PALETTE\n--------------------------------------------------\n${s.colorPalette || ""}\n\n--------------------------------------------------\nART DIRECTION\n--------------------------------------------------\nMood: ${s.mood || ""}\nEmotion: ${s.emotion || ""}\n\n`).join("\n");
    }
    const blob = new Blob([textContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Script exported as ${format.toUpperCase()}!`);
  };

  const expandAll = () => {
    setProject(p => ({
      ...p,
      sections: p.sections.map(s => ({ ...s, isExpanded: true }))
    }));
  };

  const collapseAll = () => {
    setProject(p => ({
      ...p,
      sections: p.sections.map(s => ({ ...s, isExpanded: false }))
    }));
  };

  return (
    <div className="flex flex-col h-full bg-background relative">
      <div className="p-4 border-b flex justify-between items-center bg-card">
        <div>
          <Input 
            value={project.title}
            onChange={(e) => setProject(p => ({ ...p, title: e.target.value }))}
            className="text-xl font-bold border-0 bg-transparent px-0 h-auto focus-visible:ring-0 shadow-none"
          />
          <div className="text-xs text-muted-foreground mt-1">
            {isSaving ? "Saving..." : (mounted ? `Last updated: ${new Date(project.updatedAt).toLocaleTimeString()}` : "Last updated: ...")}
          </div>
        </div>
        <div className="flex gap-2 items-center">
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
          <Button variant="ghost" size="sm" onClick={expandAll}>Expand All</Button>
          <Button variant="ghost" size="sm" onClick={collapseAll}>Collapse All</Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">Export <ChevronDown className="ml-2 h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleExport("md")}>Export as Markdown</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("txt")}>Export as TXT</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="sm">Save Draft</Button>
        </div>
      </div>
      
      <ScrollArea className="flex-1 p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6 pb-32">
          {project.sections.map((section, index) => (
            <div key={section.id} className="border border-border/60 rounded-xl bg-card shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
              {/* Header */}
              <div className="flex items-center justify-between p-3 border-b border-border/40 bg-muted/10">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8 cursor-grab text-muted-foreground hover:text-foreground">
                    <GripVertical className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 px-3 font-semibold text-foreground/90 text-base"
                    onClick={() => setFocusSectionId(section.id)}
                  >
                    {section.isExpanded ? <ChevronDown className="h-4 w-4 mr-2 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 mr-2 text-muted-foreground" />}
                    {section.type}
                  </Button>
                  {!section.isExpanded && (
                    <div className="flex items-center gap-3 text-xs text-muted-foreground ml-2">
                      <span>{(section.content || "").split(/\s+/).filter(Boolean).length} words</span>
                      <span>{(section.content || "").length} chars</span>
                      <span>Updated just now</span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50/50"
                    onClick={() => handleAIAction(section.id, "Rewrite")}
                    disabled={isPolling && activeJobSection === section.id}
                  >
                    <Wand2 className="h-4 w-4 mr-2" /> 
                    {isPolling && activeJobSection === section.id ? "Rewriting..." : "AI Rewrite"}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => removeSection(section.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Body */}
              <div 
                className={`transition-all duration-200 overflow-hidden ${section.isExpanded ? "opacity-100 max-h-[800px]" : "opacity-0 max-h-0"}`}
                onClick={() => { if (!section.isExpanded) updateSection(section.id, { isExpanded: true }); }}
              >
                <div className="p-4 md:p-6 relative">
                  {isPolling && activeJobSection === section.id && job && (
                    <div className="absolute inset-0 z-10 bg-background/80 backdrop-blur-sm p-4 flex flex-col justify-center items-center rounded-b-xl">
                      <div className="w-full max-w-sm">
                        <JobProgress job={job} onCancel={cancelJob} />
                      </div>
                    </div>
                  )}
                  <PromptEditor
                    className="border-0 focus-within:ring-0 shadow-none bg-transparent"
                    placeholder={`Write your ${section.type} script here...`}
                    value={section.content}
                    onChange={(val) => updateSection(section.id, { content: val })}
                    readOnly={isPolling && activeJobSection === section.id}
                    minHeight="160px"
                  />
                </div>
              </div>
            </div>
          ))}
          
          <Button 
            variant="outline" 
            className="w-full h-16 border-dashed border-2 border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/50 hover:bg-primary/5 rounded-xl transition-all"
            onClick={() => addSection("New Section", project.sections.length)}
          >
            <Plus className="h-5 w-5 mr-2" /> Add Script Section
          </Button>
        </div>
      </ScrollArea>

      {/* Focus Mode Overlay */}
      {focusSectionId && (
        <div className="fixed inset-0 z-50 bg-background flex flex-col animate-in fade-in zoom-in-95 duration-200">
          <div className="h-14 border-b flex items-center justify-between px-6 bg-card shrink-0">
            <div className="font-semibold text-lg">
              Focus Mode: {project.sections.find(s => s.id === focusSectionId)?.type}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Press ESC to close</span>
              <Button variant="outline" onClick={() => setFocusSectionId(null)}>Cancel</Button>
              <Button onClick={() => setFocusSectionId(null)}>Save & Close</Button>
            </div>
          </div>
          <div className="flex-1 overflow-hidden bg-[#F8F9FA] dark:bg-background/95">
            <div className="max-w-4xl mx-auto h-full p-8 pb-32">
              <PromptEditor
                className="w-full h-full border-0 focus-within:ring-0 bg-transparent rounded-none"
                placeholder={`Write your script here...`}
                value={project.sections.find(s => s.id === focusSectionId)?.content || ""}
                onChange={(val) => updateSection(focusSectionId, { content: val })}
                minHeight="100%"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
