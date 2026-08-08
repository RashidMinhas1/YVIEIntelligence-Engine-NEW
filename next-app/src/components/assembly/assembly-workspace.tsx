"use client";

import React, { useState, useMemo } from "react";
import { AssemblySelection, AIMemoryProfile } from "@/lib/types/knowledge-object";
import { calculateAssemblyScore, detectConflictsPhase1, generateExplainWhy } from "@/lib/assembly/engine";
import { KnowledgePreviewPanel } from "./knowledge-preview-panel";
import { LivePromptPreview } from "./live-prompt-preview";
import { AssemblyScorePanel } from "./assembly-score-panel";
import { AiMemoryProfileEditor } from "./ai-memory-profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Sparkles, Wand2, History, Bot, BookOpen, Layers, CheckCircle2, ChevronDown, Download, Eye, Link as LinkIcon, Settings, AlertTriangle, FileText, ChevronRight, X, Save, Play } from "lucide-react";
import { ActiveProviderBadge } from "../ActiveProviderBadge";
import { toast } from "sonner";
import { KNOWLEDGE_CATEGORIES } from "@/lib/config/knowledge-categories";
import { KnowledgePicker } from "./knowledge-picker";
import { useJob } from "@/hooks/use-job";
import { JobProgress } from "@/components/ui/job-progress";

const DEFAULT_MEMORY_PROFILE: AIMemoryProfile = {
  writingStyle: "Conversational yet authoritative",
  readingLevel: "8th Grade (Accessible)",
  sentenceLength: "Varied (mix of short punchy and longer flow)",
  paragraphLength: "Short (1-3 sentences max)",
  humorLevel: "Light, witty observational humor",
  dramaLevel: "Medium (high stakes but grounded)",
  curiosityLevel: "Extremely high (constant open loops)",
  emotionalIntensity: "Medium-High",
  formality: "Casual",
  pacing: "Fast-paced with strategic breathing room",
  storytellingStyle: "In medias res (start in the action)",
  vocabularyComplexity: "Simple but evocative power words",
  ctaAggressiveness: "Subtle but clear value-driven",
  hookStrength: "Aggressive pattern interrupt",
};

export function AssemblyWorkspace({ 
  assemblyTemplates 
}: { 
  assemblyTemplates: any[]
}) {
  const [selectedItems, setSelectedItems] = useState<Record<string, any>>({});
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  
  const [memoryProfile, setMemoryProfile] = useState<AIMemoryProfile>(DEFAULT_MEMORY_PROFILE);
  const [topic, setTopic] = useState("");
  const [wordCountMode, setWordCountMode] = useState("approximate_word_count");
  const [targetWordCount, setTargetWordCount] = useState(1500);
  const [provider, setProvider] = useState("default");
  const [customPromptOverride, setCustomPromptOverride] = useState<string | null>(null);
  
  const [activeObjectPreview, setActiveObjectPreview] = useState<any | null>(null);
  const [generatedScript, setGeneratedScript] = useState("");
  const [generationError, setGenerationError] = useState<string | null>(null);

  const { job, isPolling: isGenerating, startPolling, stopPolling, cancelJob, reset: resetJob } = useJob(null, {
    onComplete: (result) => {
      setGeneratedScript(result.script);
    },
    onError: (err) => {
      setGenerationError(err || "Generation failed.");
    }
  });

  const toggleSection = (id: string) => setExpandedSections(p => ({ ...p, [id]: !p[id] }));

  const activeObjects = useMemo(() => Object.values(selectedItems).filter(Boolean), [selectedItems]);
  // Fake legacy selections map for engines
  const legacySelections = useMemo(() => activeObjects.map(o => ({ categoryId: o.type, knowledgeObjectId: o.id, priority: "High" as const })), [activeObjects]);

  // Engine hooks
  const scoreDetails = useMemo(() => calculateAssemblyScore(activeObjects), [activeObjects]);
  const explainWhy = useMemo(() => generateExplainWhy(activeObjects, scoreDetails), [activeObjects, scoreDetails]);
  const conflicts = useMemo(() => detectConflictsPhase1(activeObjects), [activeObjects]);

  async function handleGenerate() {
    if (conflicts.length > 0) {
      const proceed = window.confirm("There are active conflicts in your assembly. Are you sure you want to proceed?");
      if (!proceed) return;
    }
    if (!topic.trim()) {
      toast.error("Please enter a topic for the script.");
      return;
    }
    
    setGenerationError(null);
    setGeneratedScript("");
    resetJob();

    try {
      const res = await fetch("/api/scripts/assemble", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selections: legacySelections,
          objects: activeObjects,
          memoryProfile,
          topic,
          wordCountMode,
          targetWordCount,
          provider,
          customPromptOverride
        })
      });
      const data = await res.json();
      if (res.ok) {
        startPolling(data.jobId);
        toast.success("Assembly job dispatched!");
      } else {
        toast.error(data.error || "Dispatch failed.");
      }
    } catch (e) {
      toast.error("An error occurred during dispatch.");
    }
  }

  async function handleSaveTemplate() {
    const name = window.prompt("Enter a name for this Template:", `Template - ${new Date().toLocaleDateString()}`);
    if (!name) return;

    const payload = {
      folderId: null,
      type: "assembly",
      title: name,
      content: {
        selectedItems,
        memoryProfile,
        topic,
        wordCountMode,
        targetWordCount,
        provider,
        version: "2.0"
      },
      summary: `Assembly Template: ${topic || "Untitled"}`,
      metadata: { provider, tags: ["assembly", "template"] },
      tags: ["assembly"]
    };

    try {
      const res = await fetch("/api/library/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) toast.success("Template saved!");
      else toast.error("Failed to save template.");
    } catch (e) {
      toast.error("An error occurred while saving.");
    }
  }

  const builderCategories = KNOWLEDGE_CATEGORIES.filter(c => c.builderSection);

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left Column: Categories and Selections */}
      <div className="w-1/2 flex flex-col border-r border-border overflow-y-auto bg-muted/10 p-4 space-y-6 custom-scrollbar">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold font-mono tracking-tight flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              Knowledge Assembly Engine
            </h1>
            <div className="pt-1">
              <ActiveProviderBadge 
                featureKey="builder" 
                moduleName="Builder" 
                subFeatures={[
                  { key: 'builder.knowledge_assembler', label: 'Knowledge Assembler' }
                ]}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Construct a master script by blending atomic knowledge objects.</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-mono uppercase">Script Topic</Label>
            <Input 
              placeholder="e.g. The scandalous history of..." 
              value={topic}
              onChange={e => setTopic(e.target.value)}
              className="text-xs h-8"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-mono uppercase">Word Count Mode</Label>
            <Select value={wordCountMode} onValueChange={setWordCountMode}>
              <SelectTrigger className="text-xs h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="approximate_word_count">Approximate</SelectItem>
                <SelectItem value="exact_word_count">Exact Count</SelectItem>
                <SelectItem value="ai_optimized">AI Optimized</SelectItem>
                <SelectItem value="maximum_retention">Maximum Retention</SelectItem>
                <SelectItem value="maximum_watch_time">Maximum Watch Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-xs font-bold font-mono uppercase text-muted-foreground">Knowledge Blueprint</h3>
          <div className="space-y-3">
            {builderCategories.map(category => {
              const isExpanded = expandedSections[category.id] ?? true;
              const selectedItem = selectedItems[category.id];

              return (
                <div key={category.id} className="border border-border bg-background rounded-md overflow-hidden">
                  <div 
                    className={`flex items-center justify-between p-2 cursor-pointer select-none ${selectedItem ? "bg-primary/5 border-b border-border/50" : "hover:bg-muted/50"}`}
                    onClick={() => toggleSection(category.id)}
                  >
                    <div className="flex items-center gap-2">
                      {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                      <category.icon className={`w-4 h-4 ${selectedItem ? "text-primary" : "text-muted-foreground"}`} />
                      <span className={`text-xs font-bold font-mono uppercase tracking-wider ${selectedItem ? "text-foreground" : "text-muted-foreground"}`}>
                        {category.label}
                      </span>
                    </div>
                    {selectedItem && (
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[10px] font-normal truncate max-w-[150px]">
                          {selectedItem.title}
                        </Badge>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="w-5 h-5 h-auto p-0 hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedItems(p => ({ ...p, [category.id]: null }));
                          }}
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {isExpanded && (
                    <div className="p-3 bg-muted/5">
                      <KnowledgePicker 
                        category={category}
                        topic={topic} 
                        selectedItemId={selectedItem?.id || null} 
                        onSelect={(item) => setSelectedItems(p => ({ ...p, [category.id]: item }))} 
                        onPreview={setActiveObjectPreview}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <AiMemoryProfileEditor profile={memoryProfile} onChange={setMemoryProfile} />
      </div>

      {/* Right Column: Previews and Scores */}
      <div className="w-1/2 flex flex-col overflow-y-auto p-4 space-y-6 bg-background relative custom-scrollbar">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-bold font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Live Master Prompt
          </h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-8 text-xs font-mono" onClick={handleSaveTemplate}>
              <Save className="w-3 h-3 mr-1" /> Save Blend
            </Button>
            <Button size="sm" className="h-8 text-xs font-mono bg-primary hover:bg-primary/90 text-primary-foreground" onClick={handleGenerate} disabled={isGenerating}>
              {isGenerating ? "Assembling..." : <><Play className="w-3 h-3 mr-1" /> Generate Script</>}
            </Button>
          </div>
        </div>

        {(isGenerating || job) && !generatedScript && (
          <JobProgress 
            job={job} 
            title="Assembling Script..." 
            onCancel={cancelJob}
            onRetry={handleGenerate}
          />
        )}

        {/* Conflicts Warning */}
        {conflicts.length > 0 && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive p-3 rounded-md space-y-1">
            <div className="flex items-center gap-2 font-bold text-xs uppercase">
              <AlertTriangle className="w-4 h-4" /> 
              Conflicts Detected ({conflicts.length})
            </div>
            <ul className="list-disc pl-5 text-xs opacity-90 space-y-1">
              {conflicts.map((c, i) => (
                <li key={i}>{c.message}</li>
              ))}
            </ul>
          </div>
        )}

        <AssemblyScorePanel score={scoreDetails} explainWhy={explainWhy} />

        {generatedScript ? (
          <div className="flex-1 border border-border rounded-lg p-4 bg-muted/5 overflow-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold font-mono uppercase text-primary">Generated Script</h3>
              <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => setGeneratedScript("")}>Clear</Button>
            </div>
            <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed">{generatedScript}</pre>
          </div>
        ) : (
          <LivePromptPreview 
            selections={legacySelections} 
            objects={activeObjects} 
            memoryProfile={memoryProfile} 
            topic={topic}
            wordCount={targetWordCount.toString()}
            onChange={setCustomPromptOverride}
          />
        )}

      </div>

      {/* Overlay Preview Panel */}
      <KnowledgePreviewPanel 
        object={activeObjectPreview} 
        onClose={() => setActiveObjectPreview(null)} 
      />
    </div>
  );
}
