"use client";

import { useState, useRef } from "react";
import {
  useAnalyzeTitles,
  useGenerateTitles,
  useAnalyzeScript,
  useGenerateScript,
  useFetchCompetitorVideos,
  useSaveTitleFormat,
  useGetTitleFormats,
} from "@/integrations/api-client";
import { TitleAnalysisJSON, ScriptAnalysisJSON } from "@/lib/ai/schemas";
import { OutputViewer } from "./output-viewer";
import { ActiveProviderBadge } from "./ActiveProviderBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PromptEditor } from "@/components/ui/prompt-editor";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SaveToLibraryModal, LibraryItemPayload } from "./save-to-library-modal";
import { ScriptAnalysisDashboard } from "./script-analysis-dashboard";
import { useJob } from "@/hooks/use-job";
import { JobProgress } from "@/components/ui/job-progress";

type OutputMode = "docs" | "text";

interface Competitor {
  name: string;
  titles: string[];
  views: string[];
}

const DEFAULT_CUSTOM_PROMPT = `Analyze these titles very critically. Act like an expert faceless YouTuber who has a lot of successful channels.

You MUST strictly follow the exact markdown headings requested. First provide an OVERALL analysis, then break down each title individually with the exact psychology template requested. Finally, provide 7 recommended formats for each title at the end of its breakdown. DO NOT use "##" headers for the formats or the triggers; keep them all within the single title breakdown box. Do not add conversational filler.`;

const DEFAULT_GENERATE_PROMPT = `On the basis of the final formula and what you analyzed, give me 5 titles for my YouTube channel. My script is copying the competitor's so I need the title on the same subject — same topic, same niche, same emotional angle — but completely rewritten as MY original title.

Each title must:
- Follow the winning formula extracted from the analysis above
- Cover the EXACT same subject/topic as the competitor's titles
- Use the same emotional vocabulary and power words that made the originals win
- Have a stronger hook or a bigger curiosity gap than the competitor's version
- Stay between 50–70 characters
- Be completely unique — not a copy or paraphrase of the competitor's title`;

interface WizardState {
  competitors: Competitor[];
  titlesText: string;
  customPrompt: string;
  customGeneratePrompt: string;
  titleAnalysis: string;
  generatedTitles: string[];
  selectedTitle: string;
  competitorScript: string;
  scriptAnalysis: string;
  generatedScript: string;
  generatedScriptWordCount: number;
  targetWordCountMode: "exact_word_count" | "approximate_word_count" | "match_competitor" | "ai_optimized" | "max_retention";
  targetWordCount: number;
  fetchLimit: number;
  generateLimit: number;
  saveFormatIndex: number | null;
  formatName: string;
  selectedLibraryFormat: string;
  libraryPayloadToSave: LibraryItemPayload | null;
}

const EMPTY_COMPETITOR = (limit = 7): Competitor => ({ name: "", titles: Array(limit).fill(""), views: Array(limit).fill("") });

const STEPS = [
  { num: 1, label: "Competitors" },
  { num: 2, label: "Analyze Titles" },
  { num: 3, label: "Generate Titles" },
  { num: 4, label: "Analyze Script" },
  { num: 5, label: "Generate Script" },
  { num: 6, label: "Final Report" },
];

function StepHeader({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-8 overflow-x-auto pb-2">
      {STEPS.map((s, i) => (
        <div key={s.num} className="flex items-center">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono font-bold whitespace-nowrap transition-all ${
            s.num === current
              ? "bg-primary text-primary-foreground"
              : s.num < current
              ? "bg-primary/15 text-primary"
              : "bg-muted text-muted-foreground"
          }`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-black ${
              s.num === current ? "bg-white/20" : s.num < current ? "bg-primary text-white" : "bg-muted-foreground/20"
            }`}>
              {s.num < current ? "✓" : s.num}
            </span>
            {s.label}
          </div>
          {i < STEPS.length - 1 && (
            <div className={`w-6 h-px mx-1 ${s.num < current ? "bg-primary" : "bg-border"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-border bg-muted/40">
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">{title}</p>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function PromptBox({ items }: { items: { label: string; text: string }[] }) {
  return (
    <div className="rounded-lg border border-primary/25 bg-primary/5 p-4 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
        <p className="text-xs font-mono font-bold text-primary uppercase tracking-widest">What the AI will do</p>
      </div>
      {items.map((item, i) => (
        <div key={i} className="flex gap-3">
          <span className="text-primary font-mono text-xs font-bold mt-0.5 shrink-0">→</span>
          <div>
            <span className="text-xs font-bold text-foreground font-mono">{item.label}: </span>
            <span className="text-xs text-muted-foreground leading-relaxed">{item.text}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function parseAnalysisSections(analysis: string): { heading: string; body: string }[] {
  const sections: { heading: string; body: string }[] = [];

  // Try ## markdown headings first (preferred format)
  if (/^## /m.test(analysis)) {
    const parts = analysis.split(/\n(?=## )/);
    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      if (trimmed.startsWith("## ")) {
        const nl = trimmed.indexOf("\n");
        const heading = nl === -1 ? trimmed.slice(3) : trimmed.slice(3, nl).trim();
        const body = nl === -1 ? "" : trimmed.slice(nl + 1).trim();
        if (heading) sections.push({ heading, body });
      } else {
        // Preamble text before first ## heading
        if (trimmed) sections.push({ heading: "Overview", body: trimmed });
      }
    }
    if (sections.length > 0) return sections;
  }

  // Fallback: split on **BOLD HEADER** lines (AI sometimes uses bold instead of ##)
  if (/^\*\*[A-Z0-9 ,:[\]()-]+\*\*/m.test(analysis)) {
    const lines = analysis.split("\n");
    let currentHeading = "Overview";
    let currentBody: string[] = [];

    for (const line of lines) {
      const boldHeader = line.match(/^\*\*([^*]{3,60})\*\*\s*:?\s*$/);
      if (boldHeader) {
        if (currentBody.length > 0 || sections.length > 0) {
          sections.push({ heading: currentHeading, body: currentBody.join("\n").trim() });
        }
        currentHeading = boldHeader[1].trim();
        currentBody = [];
      } else {
        currentBody.push(line);
      }
    }
    if (currentBody.length > 0) {
      sections.push({ heading: currentHeading, body: currentBody.join("\n").trim() });
    }
    if (sections.length > 0) return sections;
  }

  // Last resort: split on numbered lines like "1. TITLE TEXT" or "TITLE 1:"
  const titlePattern = /\n(?=(?:TITLE\s+\d+|##\s*\d+|\d+\.\s+[A-Z]))/;
  const chunks = analysis.split(titlePattern);
  if (chunks.length > 1) {
    chunks.forEach((chunk, i) => {
      const trimmed = chunk.trim();
      if (!trimmed) return;
      const firstLine = trimmed.split("\n")[0].replace(/^\d+\.\s*/, "").trim();
      const rest = trimmed.split("\n").slice(1).join("\n").trim();
      sections.push({ heading: firstLine || `Section ${i + 1}`, body: rest });
    });
    if (sections.length > 0) return sections;
  }

  // Absolute fallback: whole text as one section
  return [{ heading: "Analysis", body: analysis.trim() }];
}

const SECTION_COLORS = [
  { border: "border-red-200", bg: "bg-red-50", text: "text-red-700" },
  { border: "border-orange-200", bg: "bg-orange-50", text: "text-orange-700" },
  { border: "border-yellow-200", bg: "bg-yellow-50", text: "text-yellow-700" },
  { border: "border-green-200", bg: "bg-green-50", text: "text-green-700" },
  { border: "border-blue-200", bg: "bg-blue-50", text: "text-blue-700" },
  { border: "border-purple-200", bg: "bg-purple-50", text: "text-purple-700" },
  { border: "border-pink-200", bg: "bg-pink-50", text: "text-pink-700" },
  { border: "border-teal-200", bg: "bg-teal-50", text: "text-teal-700" },
];

function renderMarkdown(text: string): string {
  return text
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold mt-4 mb-1 text-foreground">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold mt-5 mb-2 text-primary border-b border-border pb-1">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-xl font-black mt-5 mb-3 text-primary">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 text-sm text-muted-foreground leading-relaxed">• $1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 text-sm text-muted-foreground leading-relaxed">$1. $2</li>')
    .replace(/`(.+?)`/g, '<code class="bg-muted text-primary text-xs px-1 py-0.5 rounded font-mono">$1</code>');
}

export default function Wizard() {
  const [step, setStep] = useState(1);
  const [outputMode, setOutputMode] = useState<"docs" | "text">("text");
  const [step6Tab, setStep6Tab] = useState<"report" | "script">("report");
  const [youtubeApiKey, setYoutubeApiKey] = useState("");
  const [fetchingCard, setFetchingCard] = useState<number | null>(null);
  const [state, setState] = useState<WizardState>({
    competitors: [EMPTY_COMPETITOR(), EMPTY_COMPETITOR(), EMPTY_COMPETITOR()],
    titlesText: "",
    customPrompt: DEFAULT_CUSTOM_PROMPT,
    customGeneratePrompt: DEFAULT_GENERATE_PROMPT,
    titleAnalysis: "",
    generatedTitles: [],
    selectedTitle: "",
    competitorScript: "",
    scriptAnalysis: "",
    generatedScript: "",
    generatedScriptWordCount: 0,
    targetWordCountMode: "approximate_word_count",
    targetWordCount: 200,
    fetchLimit: 7,
    generateLimit: 5,
    saveFormatIndex: null,
    formatName: "",
    selectedLibraryFormat: "",
    libraryPayloadToSave: null,
  });

  const [activeJobType, setActiveJobType] = useState<"analyze_titles" | "generate_titles" | "analyze_script" | "generate_script" | null>(null);
  // Use a ref so the useJob onComplete callback always reads the latest value (avoids stale closure)
  const activeJobTypeRef = useRef<typeof activeJobType>(null);

  const { job, isPolling, startPolling, cancelJob, reset: resetJob } = useJob(null, {
    pollIntervalMs: 2000,
    onComplete: (result) => {
      const jobType = activeJobTypeRef.current;
      activeJobTypeRef.current = null;
      setActiveJobType(null);
      if (jobType === "analyze_titles") {
        setState((s) => ({ ...s, titleAnalysis: result.analysis }));
      } else if (jobType === "generate_titles") {
        setState((s) => ({ ...s, generatedTitles: result.titles, selectedTitle: result.titles[0] ?? "" }));
        setStep(4);
      } else if (jobType === "analyze_script") {
        setState((s) => ({ ...s, scriptAnalysis: result.analysis }));
      } else if (jobType === "generate_script") {
        setState((s) => ({ ...s, generatedScript: result.script, generatedScriptWordCount: result.wordCount }));
        setStep(6);
      }
    },
    onError: (err) => {
      alert("AI task failed: " + err);
      activeJobTypeRef.current = null;
      setActiveJobType(null);
    }
  });

  const { data: formatsData } = useGetTitleFormats();
  const libraryFormats = formatsData?.formats || [];

  const fetchVideosMutation = useFetchCompetitorVideos({
    mutation: {
      onSuccess: (data, variables) => {
        if (fetchingCard === null) return;
        const ci = fetchingCard;
        const channelName = data.videos[0]?.competitor || variables.data.competitors[0];
        setState((s) => {
          const fetched = data.videos.slice(0, s.fetchLimit);
          const next = s.competitors.map((c, i) => {
            if (i !== ci) return c;
            const titles = Array(s.fetchLimit).fill("");
            const views = Array(s.fetchLimit).fill("");
            fetched.forEach((v: { title: string; views: string }, ti: number) => {
              titles[ti] = v.title;
              views[ti] = v.views;
            });
            return { name: channelName, titles, views };
          });
          return { ...s, competitors: next };
        });
        setFetchingCard(null);
      },
      onError: () => setFetchingCard(null),
    },
  });

  const saveFormatMutation = useSaveTitleFormat({
    mutation: {
      onSuccess: () => {
        setState((s) => ({ ...s, saveFormatIndex: null, formatName: "" }));
        alert("Format saved to library!");
      },
      onError: (err) => {
        alert("Failed to save format: " + err.message);
      }
    }
  });

  const handleAutoFetch = (ci: number) => {
    const channelInput = state.competitors[ci].name.trim();
    if (!channelInput) return;
    setFetchingCard(ci);
    fetchVideosMutation.mutate({
      data: {
        competitors: [channelInput],
        youtubeApiKey: youtubeApiKey || undefined,
        limit: state.fetchLimit,
      },
    });
  };

  const analyzeTitlesMutation = useAnalyzeTitles({
    mutation: {
      onSuccess: (data: any) => {
        if (data.jobId) {
          activeJobTypeRef.current = "analyze_titles";
          setActiveJobType("analyze_titles");
          startPolling(data.jobId);
        } else {
          setState((s) => ({ ...s, titleAnalysis: data.analysis }));
        }
      },
      onError: (err) => alert("Failed to analyze titles: " + err.message)
    },
  });

  const generateTitlesMutation = useGenerateTitles({
    mutation: {
      onSuccess: (data: any) => {
        if (data.jobId) {
          activeJobTypeRef.current = "generate_titles";
          setActiveJobType("generate_titles");
          startPolling(data.jobId);
        } else {
          setState((s) => ({ ...s, generatedTitles: data.titles, selectedTitle: data.titles[0] ?? "" }));
          setStep(4);
        }
      },
      onError: (err) => alert("Failed to generate titles: " + err.message)
    },
  });

  const analyzeScriptMutation = useAnalyzeScript({
    mutation: {
      onSuccess: (data: any) => {
        if (data.jobId) {
          activeJobTypeRef.current = "analyze_script";
          setActiveJobType("analyze_script");
          startPolling(data.jobId);
        } else {
          setState((s) => ({ ...s, scriptAnalysis: data.analysis }));
        }
      },
      onError: (err) => alert("Failed to analyze script: " + err.message)
    },
  });

  const generateScriptMutation = useGenerateScript({
    mutation: {
      onSuccess: (data: any) => {
        if (data.jobId) {
          activeJobTypeRef.current = "generate_script";
          setActiveJobType("generate_script");
          startPolling(data.jobId);
        } else {
          setState((s) => ({ ...s, generatedScript: data.script, generatedScriptWordCount: data.wordCount }));
          setStep(6);
        }
      },
      onError: (err) => alert("Failed to generate script: " + err.message)
    },
  });

  // Collect all non-empty titles from all competitors into a flat list
  const allCollectedTitles = state.competitors.flatMap((c) =>
    c.titles.filter((t) => t.trim())
  );

  const parsedTitles = state.titlesText.split("\n").map((l) => l.trim()).filter(Boolean);

  const handleStep1Continue = () => {
    const titlesList = allCollectedTitles;
    if (titlesList.length > 0) {
      setState((s) => ({ ...s, titlesText: titlesList.join("\n") }));
    }
    setStep(2);
  };

  const updateCompetitor = (ci: number, field: "name", value: string) => {
    setState((s) => {
      const next = s.competitors.map((c, i) =>
        i === ci ? { ...c, [field]: value } : c
      );
      return { ...s, competitors: next };
    });
  };

  const updateTitle = (ci: number, ti: number, value: string) => {
    setState((s) => {
      const next = s.competitors.map((c, i) => {
        if (i !== ci) return c;
        const titles = [...c.titles];
        const views = [...c.views];
        titles[ti] = value;
        views[ti] = ""; // clear view count when manually editing
        return { ...c, titles, views };
      });
      return { ...s, competitors: next };
    });
  };

  // Build final combined report
  const buildStrategyReport = (mode: OutputMode): string => {
    const competitorSection = state.competitors
      .filter((c) => c.name.trim() || c.titles.some((t) => t.trim()))
      .map((c, i) => {
        const label = c.name.trim() || `Competitor ${i + 1}`;
        const titles = c.titles.filter((t) => t.trim()).map((t, ti) => `  ${ti + 1}. ${t}`).join("\n");
        return `${label}:\n${titles || "  (no titles entered)"}`;
      })
      .join("\n\n");

    let formattedTitleAnalysis = state.titleAnalysis;
    let formattedScriptAnalysis = state.scriptAnalysis;
    
    try {
      if (formattedTitleAnalysis) {
        formattedTitleAnalysis = JSON.stringify(JSON.parse(formattedTitleAnalysis), null, 2);
      }
      if (formattedScriptAnalysis) {
        formattedScriptAnalysis = JSON.stringify(JSON.parse(formattedScriptAnalysis), null, 2);
      }
    } catch (e) {
      // Keep as string if parsing fails
    }

    if (mode === "docs") {
      return `# YouTube Viral Strategy Report

---

## Step 1: Competitor Titles Collected

${competitorSection}

---

## Step 2: Title Analysis

Titles Analyzed (${parsedTitles.length} titles):
${parsedTitles.map((t, i) => `${i + 1}. ${t}`).join("\n")}

### Analysis Result:
\`\`\`json
${formattedTitleAnalysis}
\`\`\`

---

## Step 3: Generated Viral Titles

${state.generatedTitles.map((t, i) => `${i + 1}. ${t}`).join("\n")}

**Selected Title for Script:** "${state.selectedTitle}"

---

## Step 4: Script Analysis

\`\`\`json
${formattedScriptAnalysis}
\`\`\`
`;
    } else {
      return `YOUTUBE VIRAL STRATEGY REPORT

=== STEP 1: COMPETITOR TITLES COLLECTED ===
${competitorSection}

=== STEP 2: TITLE ANALYSIS ===
Titles analyzed: ${parsedTitles.length}

${formattedTitleAnalysis}

=== STEP 3: GENERATED TITLES ===
${state.generatedTitles.map((t, i) => `${i + 1}. ${t}`).join("\n")}

Selected: "${state.selectedTitle}"

=== STEP 4: SCRIPT ANALYSIS ===
${formattedScriptAnalysis}
`;
    }
  };

  const buildFinalScript = (mode: OutputMode): string => {
    if (mode === "docs") {
      return `# Final YouTube Script

**Title:** "${state.selectedTitle}"
**Word Count:** ${state.generatedScriptWordCount} words

${state.generatedScript}
`;
    } else {
      return `FINAL YOUTUBE SCRIPT

Title: "${state.selectedTitle}"
Word count: ${state.generatedScriptWordCount}

${state.generatedScript}
`;
    }
  };

  const buildReport = (mode: OutputMode): string => {
    return buildStrategyReport(mode) + "\n\n" + buildFinalScript(mode);
  };

  const handleDownload = (ext: "txt" | "md") => {
    const content = buildReport(ext === "md" ? "docs" : "text");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `yvie-report.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    const textToCopy = step6Tab === "report" ? buildStrategyReport(outputMode) : buildFinalScript(outputMode);
    navigator.clipboard.writeText(textToCopy);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-foreground">
            Content Intelligence Wizard
          </h2>
          <p className="text-muted-foreground text-sm mt-1 font-mono">
            Follow the steps — get one complete report at the end
          </p>
        </div>
        <div className="pt-1">
          <ActiveProviderBadge 
            featureKey="wizard" 
            moduleName="Wizard" 
            subFeatures={[
              { key: 'wizard.title_analyzer', label: 'Title Analyzer' },
              { key: 'wizard.title_generator', label: 'Title Generator' },
              { key: 'wizard.script_analyzer', label: 'Script Analyzer' },
              { key: 'wizard.script_generator', label: 'Script Generator' }
            ]}
          />
        </div>
      </div>

      <StepHeader current={step} />

      {/* STEP 1: Competitors */}
      {step === 1 && (
        <div className="space-y-4">
          <PromptBox items={[
            { label: "Auto-Fetch", text: "Enter a channel name, URL (youtube.com/@MrBeast), or @handle — then click 'Auto Fetch' to instantly pull the latest video titles from that channel." },
            { label: "Manual Entry", text: "Or paste titles yourself directly into the numbered fields — from YouTube, any niche, or any source. Both methods work." },
            { label: "YouTube API Key", text: "Add your API key below for real data. Without it, demo titles are generated in the same style as the channel — useful for testing the full pipeline." },
          ]} />

          {/* Global API key & Fetch Limit */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-3 rounded-lg border border-border bg-muted/30">
            <div className="flex items-center gap-3 flex-1">
              <Label className="text-xs font-mono text-muted-foreground uppercase shrink-0">YouTube API Key</Label>
              <Input
                type="password"
                placeholder="Optional — leave empty for demo titles"
                value={youtubeApiKey}
                onChange={(e) => setYoutubeApiKey(e.target.value)}
                className="text-xs h-8 max-w-sm font-mono"
              />
            </div>
            <div className="flex items-center gap-3">
              <Label className="text-xs font-mono text-muted-foreground uppercase shrink-0">Fetch Limit</Label>
              <Input
                type="number"
                min={1}
                max={25}
                value={state.fetchLimit}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val) && val > 0 && val <= 25) {
                    setState(s => {
                      const nextComps = s.competitors.map(c => {
                        const titles = Array(val).fill("");
                        const views = Array(val).fill("");
                        for (let i = 0; i < Math.min(val, c.titles.length); i++) {
                          titles[i] = c.titles[i];
                          views[i] = c.views[i] || "";
                        }
                        return { ...c, titles, views };
                      });
                      return { ...s, fetchLimit: val, competitors: nextComps };
                    });
                  }
                }}
                className="text-xs h-8 w-20 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {state.competitors.map((comp, ci) => {
              const cardColors = [
                { bg: "bg-primary/10", text: "text-primary", btn: "border-primary text-primary hover:bg-primary hover:text-white" },
                { bg: "bg-orange-50", text: "text-orange-600", btn: "border-orange-400 text-orange-600 hover:bg-orange-500 hover:text-white" },
                { bg: "bg-blue-50", text: "text-blue-600", btn: "border-blue-400 text-blue-600 hover:bg-blue-500 hover:text-white" },
              ][ci];
              const isLoading = fetchingCard === ci;

              return (
                <div key={ci} className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                  {/* Card header */}
                  <div className={`px-4 py-2.5 border-b border-border ${cardColors.bg}`}>
                    <p className={`text-xs font-mono font-bold uppercase tracking-widest ${cardColors.text}`}>
                      Competitor {ci + 1}
                    </p>
                  </div>
                  <div className="p-4 space-y-3">
                    {/* Channel input + fetch button */}
                    <div>
                      <Label className="text-xs font-mono text-muted-foreground uppercase block mb-1">
                        Channel / URL / @Handle
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="e.g. @MrBeast or youtube.com/@..."
                          value={comp.name}
                          onChange={(e) => updateCompetitor(ci, "name", e.target.value)}
                          className="text-xs h-8 flex-1"
                          onKeyDown={(e) => { if (e.key === "Enter") handleAutoFetch(ci); }}
                        />
                        <button
                          onClick={() => handleAutoFetch(ci)}
                          disabled={!comp.name.trim() || fetchingCard !== null}
                          className={`shrink-0 text-xs font-mono font-bold px-2.5 h-8 rounded-md border transition-all disabled:opacity-40 disabled:cursor-not-allowed ${cardColors.btn}`}
                        >
                          {isLoading ? "..." : "↓ Fetch"}
                        </button>
                      </div>
                    </div>

                    {/* 7 title inputs — skeleton while loading */}
                    <div className="space-y-2">
                      <Label className="text-xs font-mono text-muted-foreground uppercase block">
                        Video Titles
                        {comp.titles.filter((t) => t.trim()).length > 0 && (
                          <span className={`ml-2 font-bold ${cardColors.text}`}>
                            {comp.titles.filter((t) => t.trim()).length}/{state.fetchLimit}
                          </span>
                        )}
                      </Label>
                      {isLoading ? (
                        <div className="space-y-2">
                          {Array.from({ length: state.fetchLimit }).map((_, i) => (
                            <Skeleton key={i} className={`h-8 w-full rounded-md opacity-${Math.max(10, 70 - i * 8)}`} />
                          ))}
                        </div>
                      ) : (
                        comp.titles.map((title, ti) => (
                          <div key={ti} className="flex items-center gap-2">
                            <span className="text-xs font-mono text-muted-foreground w-4 shrink-0 text-right">{ti + 1}</span>
                            <Input
                              placeholder={`Title ${ti + 1}`}
                              value={title}
                              onChange={(e) => updateTitle(ci, ti, e.target.value)}
                              className="text-xs h-8 flex-1"
                            />
                            {comp.views?.[ti] && (
                              <span className={`shrink-0 text-xs font-mono font-bold px-1.5 py-0.5 rounded ${cardColors.bg} ${cardColors.text}`}>
                                {comp.views[ti]}
                              </span>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button
              onClick={handleStep1Continue}
              className="bg-primary text-primary-foreground font-mono text-sm"
            >
              {allCollectedTitles.length > 0
                ? `Continue with ${allCollectedTitles.length} titles →`
                : "Continue (empty) →"}
            </Button>
            {allCollectedTitles.length > 0 && (
              <p className="text-xs text-muted-foreground font-mono">
                {allCollectedTitles.length} titles collected from {state.competitors.filter((c) => c.titles.some((t) => t.trim())).length} competitor(s)
              </p>
            )}
          </div>
        </div>
      )}

      {/* STEP 2: Analyze Titles */}
      {step === 2 && (
        <SectionCard title="Step 2 of 6 — Analyze Competitor Titles">
          <div className="space-y-5">

            {/* Titles read-only display */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs font-mono text-muted-foreground uppercase">
                  Titles collected from Step 1
                  {parsedTitles.length > 0 && (
                    <span className="ml-2 text-primary font-bold">{parsedTitles.length} titles</span>
                  )}
                </Label>
                <button
                  className="text-xs font-mono text-muted-foreground underline hover:text-foreground"
                  onClick={() => setStep(1)}
                >
                  ← Edit in Step 1
                </button>
              </div>
              {parsedTitles.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-4 text-center">
                  <p className="text-xs text-muted-foreground font-mono">No titles yet — go back to Step 1 to add them, or paste below</p>
                  <PromptEditor
                    placeholder={"Paste titles here — one per line...\n10 Things Nobody Tells You About...\nI Tried This For 30 Days and..."}
                    value={state.titlesText}
                    onChange={(val) => setState((s) => ({ ...s, titlesText: val }))}
                    minHeight="144px"
                    className="mt-3"
                  />
                </div>
              ) : (
                <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1.5 max-h-52 overflow-y-auto">
                  {parsedTitles.map((t, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <span className="text-xs font-mono text-muted-foreground w-5 shrink-0 text-right mt-0.5">{i + 1}.</span>
                      <p className="text-xs font-mono text-foreground leading-relaxed">{t}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Custom prompt section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs font-mono text-muted-foreground uppercase">
                  Your Analysis Prompt
                  <span className="ml-2 text-muted-foreground/60 normal-case font-normal">— tell the AI exactly how to analyze the titles above</span>
                </Label>
                <button
                  className="text-xs font-mono text-muted-foreground underline hover:text-foreground"
                  onClick={() => setState((s) => ({ ...s, customPrompt: DEFAULT_CUSTOM_PROMPT }))}
                >
                  Reset to default
                </button>
              </div>
              <PromptEditor
                value={state.customPrompt}
                onChange={(val) => setState((s) => ({ ...s, customPrompt: val }))}
                minHeight="216px"
                placeholder="Write your custom analysis instructions here..."
              />
              <p className="text-xs text-muted-foreground font-mono mt-1.5">
                The titles above will be automatically included. Just write what you want the AI to do with them.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="font-mono text-sm">Back</Button>
              <Button
                onClick={() => {
                  if (!parsedTitles.length) return;
                  analyzeTitlesMutation.mutate({
                    data: {
                      titles: parsedTitles,
                      outputMode,
                      customPrompt: state.customPrompt || undefined,
                    },
                  });
                }}
                disabled={analyzeTitlesMutation.isPending || isPolling || parsedTitles.length === 0}
                className="bg-primary text-primary-foreground font-mono text-sm"
              >
                {(analyzeTitlesMutation.isPending || isPolling) ? "Analyzing..." : "Analyze & Continue →"}
              </Button>
              <Button variant="ghost" className="text-xs font-mono text-muted-foreground" onClick={() => setStep(3)}>
                Skip
              </Button>
            </div>
            {(analyzeTitlesMutation.isPending || (isPolling && activeJobType === "analyze_titles")) && (
              <div className="space-y-3 pt-2">
                {isPolling && job ? (
                  <JobProgress job={job} onCancel={cancelJob} />
                ) : (
                  <>
                    <p className="text-xs font-mono text-muted-foreground animate-pulse">🔍 AI is analyzing your titles...</p>
                    {[1,2,3,4,5,6,7,8].map(i => <Skeleton key={i} className="h-4 w-full" />)}
                  </>
                )}
              </div>
            )}

            {state.titleAnalysis && !analyzeTitlesMutation.isPending && !isPolling && (() => {
              let parsed: TitleAnalysisJSON | null = null;
              try {
                const data = JSON.parse(state.titleAnalysis);
                parsed = data.data as TitleAnalysisJSON;
              } catch (e) {
                // Silently handle parse errors to prevent Next.js dev overlay crash
              }

              if (!parsed) {
                return (
                  <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm">
                    Failed to load analysis. Please clear and re-analyze.
                  </div>
                );
              }

              return (
                <div className="space-y-6 pt-2 border-t border-border mt-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-mono font-bold text-primary uppercase tracking-widest">✓ Analysis Complete</p>
                    <button
                      className="text-xs font-mono text-muted-foreground underline hover:text-foreground"
                      onClick={() => setState((s) => ({ ...s, titleAnalysis: "" }))}
                    >
                      Clear & re-analyze
                    </button>
                  </div>

                  {parsed.level1Overall && (
                    <div className="rounded-xl border border-blue-200 bg-blue-50/30 overflow-hidden">
                      <div className="bg-blue-100/50 px-4 py-3 border-b border-blue-200 flex justify-between items-center">
                        <p className="text-xs font-mono font-bold uppercase tracking-widest text-blue-800">Overall Analysis</p>
                        {parsed.level1Overall.confidenceScore && (
                          <Badge variant="outline" className="text-blue-700 border-blue-300">Confidence: {parsed.level1Overall.confidenceScore}%</Badge>
                        )}
                      </div>
                      <div className="p-5 text-sm grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><strong className="text-blue-900">Formula:</strong> <span className="text-muted-foreground">{parsed.level1Overall.commonFormula || "N/A"}</span></div>
                        <div><strong className="text-blue-900">Structure:</strong> <span className="text-muted-foreground">{parsed.level1Overall.commonStructure || "N/A"}</span></div>
                        <div><strong className="text-blue-900">Keywords:</strong> <span className="text-muted-foreground">{parsed.level1Overall.commonKeywords?.join(", ") || "N/A"}</span></div>
                        <div><strong className="text-blue-900">Emotional Triggers:</strong> <span className="text-muted-foreground">{parsed.level1Overall.commonEmotionalTriggers?.join(", ") || "N/A"}</span></div>
                        <div className="md:col-span-2"><strong className="text-blue-900">Why They Work:</strong> <p className="text-muted-foreground mt-1">{parsed.level1Overall.whyTheyWork || "N/A"}</p></div>
                        {parsed.level1Overall.inferenceNote && <div className="md:col-span-2 text-xs text-orange-600 bg-orange-50 p-2 rounded border border-orange-200">Note: {parsed.level1Overall.inferenceNote}</div>}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {parsed.level2Titles.map((t, idx) => {
                      const color = SECTION_COLORS[idx % SECTION_COLORS.length];
                      return (
                        <div key={idx} className={`rounded-xl border ${color.border} overflow-hidden flex flex-col`}>
                          <div className={`${color.bg} px-4 py-3 border-b ${color.border} flex justify-between items-start gap-2`}>
                            <p className={`text-sm font-semibold leading-tight ${color.text}`}>{t.originalTitle}</p>
                            {t.confidenceScore && <Badge variant="outline" className={`${color.text} ${color.border} shrink-0`}>{t.confidenceScore}%</Badge>}
                          </div>
                          <div className="p-4 space-y-3 text-sm flex-1">
                            {t.formula && <div><span className="font-bold opacity-80">Formula:</span> <span className="opacity-90">{t.formula}</span></div>}
                            {t.hookType && <div><span className="font-bold opacity-80">Hook Type:</span> <span className="opacity-90">{t.hookType}</span></div>}
                            {t.emotionalTrigger && <div><span className="font-bold opacity-80">Emotional Trigger:</span> <span className="opacity-90">{t.emotionalTrigger}</span></div>}
                            {t.whyItWorks && <div><span className="font-bold opacity-80">Why it works:</span> <p className="opacity-90 mt-1">{t.whyItWorks}</p></div>}
                            {t.inferenceNote && <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded border border-orange-200">Note: {t.inferenceNote}</div>}

                            {t.generatedFormats?.length > 0 && (
                              <div className="mt-6 pt-4 border-t border-border">
                                <p className="text-xs font-mono font-bold uppercase mb-3 opacity-70">Generated Formats</p>
                                <div className="space-y-4">
                                  {t.generatedFormats.map((f, fIdx) => (
                                    <div key={fIdx} className="bg-muted/30 p-3 rounded-lg border border-border">
                                      <p className="font-medium text-foreground mb-1">{f.copy}</p>
                                      <p className="text-xs text-muted-foreground mb-3">{f.tip}</p>
                                      
                                      {/* Replaced inline form with SaveToLibraryModal Trigger */}
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setState((s) => ({ 
                                          ...s, 
                                          libraryPayloadToSave: {
                                            type: "title",
                                            title: f.copy,
                                            content: {
                                              template: f.copy,
                                              psychologyFormula: t.formula,
                                              hookType: t.hookType,
                                              emotionalTrigger: t.emotionalTrigger,
                                              examples: t.originalTitle,
                                            },
                                            summary: f.tip,
                                            tags: ["generated-title", t.hookType || "hook"]
                                          } 
                                        }))}
                                        className="text-xs font-mono w-full text-primary border-primary/40 hover:bg-primary/10"
                                      >
                                        + Save to Library
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <Button
                    onClick={() => setStep(3)}
                    className="w-full bg-primary text-primary-foreground font-mono text-sm mt-2"
                  >
                    Continue to Generate Titles →
                  </Button>
                </div>
              );
            })()}
          </div>
        </SectionCard>
      )}

      {/* STEP 3: Generate Titles */}
      {step === 3 && (
        <SectionCard title="Step 3 of 6 — Generate Viral Titles">
          <div className="space-y-5">

            {/* Analysis summary (read-only preview) */}
            {state.titleAnalysis ? (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-xs font-mono text-muted-foreground uppercase">Analysis from Step 2 (auto-loaded)</Label>
                  <button className="text-xs font-mono text-muted-foreground underline hover:text-foreground" onClick={() => setStep(2)}>
                    ← Edit analysis
                  </button>
                </div>
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 max-h-36 overflow-y-auto">
                  <p className="text-xs text-muted-foreground font-mono leading-relaxed whitespace-pre-wrap">{state.titleAnalysis.substring(0, 600)}{state.titleAnalysis.length > 600 ? "..." : ""}</p>
                </div>
              </div>
            ) : (
              <div>
                <Label className="text-xs font-mono text-muted-foreground uppercase block mb-2">Paste analysis (or go back to Step 2)</Label>
                <PromptEditor
                  placeholder={"Paste title analysis here if you skipped Step 2..."}
                  value={state.titleAnalysis}
                  onChange={(val) => setState((s) => ({ ...s, titleAnalysis: val }))}
                  minHeight="144px"
                />
              </div>
            )}

            {/* Library Format Selection */}
            {libraryFormats.length > 0 && (
              <div className="bg-muted/30 border border-border rounded-lg p-4 mb-4">
                <Label className="text-xs font-mono text-muted-foreground uppercase mb-2 block">
                  Use a Saved Format (Optional)
                </Label>
                <Select
                  value={state.selectedLibraryFormat}
                  onValueChange={(val) => setState((s) => ({ ...s, selectedLibraryFormat: val }))}
                >
                  <SelectTrigger className="w-full text-sm font-mono bg-background">
                    <SelectValue placeholder="Select a title format from your Library..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" className="text-sm font-mono text-muted-foreground italic">
                      None (Let AI decide)
                    </SelectItem>
                    {libraryFormats.map((fmt) => (
                      <SelectItem key={fmt.id} value={fmt.pattern} className="text-sm font-mono">
                        {fmt.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {state.selectedLibraryFormat && state.selectedLibraryFormat !== "none" && (
                  <p className="text-xs text-primary font-mono mt-2 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Strict formatting enabled. The AI will output titles and a virality recommendation based on this pattern.
                  </p>
                )}
              </div>
            )}

            {/* Custom generate prompt */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs font-mono text-muted-foreground uppercase">
                  Your Title Generation Prompt
                  <span className="ml-2 text-muted-foreground/60 normal-case font-normal">— tell the AI exactly what titles you need</span>
                </Label>
                <button
                  className="text-xs font-mono text-muted-foreground underline hover:text-foreground"
                  onClick={() => setState((s) => ({ ...s, customGeneratePrompt: DEFAULT_GENERATE_PROMPT }))}
                >
                  Reset to default
                </button>
              </div>
              <PromptEditor
                placeholder="Tell the AI what kind of titles you want..."
                value={state.customGeneratePrompt}
                onChange={(val) => setState((s) => ({ ...s, customGeneratePrompt: val }))}
                minHeight="192px"
              />
              <p className="text-xs text-muted-foreground font-mono mt-1.5">
                The analysis above is automatically passed to the AI. Just write your specific instructions here.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Label className="text-xs font-mono text-muted-foreground uppercase shrink-0">Titles to Generate</Label>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={state.generateLimit}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val) && val > 0 && val <= 20) {
                      setState((s) => ({ ...s, generateLimit: val }));
                    }
                  }}
                  className="text-xs h-8 w-20 font-mono"
                />
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={() => setStep(2)} className="font-mono text-sm">Back</Button>
                <Button
                  onClick={() => generateTitlesMutation.mutate({
                    data: {
                      analysis: state.titleAnalysis,
                      outputMode,
                      customGeneratePrompt: state.customGeneratePrompt || undefined,
                      libraryFormat: state.selectedLibraryFormat && state.selectedLibraryFormat !== "none" ? state.selectedLibraryFormat : undefined,
                      limit: state.generateLimit,
                    },
                  })}
                  disabled={generateTitlesMutation.isPending || !state.titleAnalysis.trim()}
                  className="bg-primary text-primary-foreground font-mono text-sm"
                >
                  {generateTitlesMutation.isPending ? "Generating..." : `Generate ${state.generateLimit} Titles →`}
                </Button>
                <Button variant="ghost" className="text-xs font-mono text-muted-foreground" onClick={() => setStep(4)}>
                  Skip
                </Button>
              </div>
            </div>
            {(generateTitlesMutation.isPending || (isPolling && activeJobType === "generate_titles")) && (
              <div className="space-y-2 pt-2">
                {isPolling && job ? (
                  <JobProgress job={job} onCancel={cancelJob} />
                ) : (
                  [1,2,3,4,5].map(i => <Skeleton key={i} className="h-10 w-full rounded-lg" />)
                )}
              </div>
            )}
          </div>
        </SectionCard>
      )}

      {/* STEP 4: Analyze Script */}
      {step === 4 && (
        <SectionCard title="Step 4 of 6 — Analyze Competitor Script">
          <div className="space-y-4">
            <PromptBox items={[
              { label: "Hook Analysis", text: "Rates the first 10–15 seconds on a Weak → Elite scale. Identifies which hook technique is used and whether the intro stays within the 3–4 line short-intro rule." },
              { label: "Framework ID", text: "Detects the exact script framework used: AIDA, PAS, Problem–Solution–Benefit, Storytelling Arc, or the 3-Level Script Model (Structural Clarity + Psychological Triggers + Performance Layer)." },
              { label: "Retention Mechanics", text: "Lists every open loop ('Later I'll show you...'), rehook (re-engagement after every 2 paragraphs), pattern interrupt, and curiosity gap used — with their exact positions in the script." },
              { label: "Tone & Storytelling", text: "Identifies tone, sarcasm/humor ratio (ideal ~20%), storytelling structure, and how well the script reads as a narrative vs. a dry list." },
              { label: "Reusable Formula", text: "Extracts a 6-step formula from the script that will be used in Step 5 to generate your script in the same high-retention style." },
            ]} />
            {state.generatedTitles.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-mono text-muted-foreground uppercase">Select title for your script (from Step 3)</p>
                {state.generatedTitles.map((t, i) => (
                  <button
                    key={i}
                    onClick={() => setState((s) => ({ ...s, selectedTitle: t }))}
                    className={`w-full text-left text-sm px-4 py-2.5 rounded-lg border transition-all font-medium ${
                      state.selectedTitle === t
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/40 text-foreground"
                    }`}
                  >
                    <span className="text-xs font-mono text-muted-foreground mr-2">{i + 1}.</span>
                    {t}
                  </button>
                ))}
              </div>
            )}
            {state.generatedTitles.length === 0 && (
              <div className="space-y-1">
                <Label className="text-xs font-mono text-muted-foreground uppercase">Your Video Title</Label>
                <Input
                  placeholder="Enter the title you want to create a script for..."
                  value={state.selectedTitle}
                  onChange={(e) => setState((s) => ({ ...s, selectedTitle: e.target.value }))}
                  className="text-sm font-mono"
                />
              </div>
            )}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-mono text-muted-foreground uppercase">
                  Paste or upload competitor script
                  {state.competitorScript && (
                    <span className="ml-2 text-primary">{state.competitorScript.split(/\s+/).filter(Boolean).length} words</span>
                  )}
                </Label>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept=".txt,.srt,.vtt,.text"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        let text = (ev.target?.result as string) ?? "";
                        // Strip SRT/VTT timestamps (00:00:00,000 --> 00:00:02,000)
                        text = text.replace(/^\d{1,2}:\d{2}:\d{2}[,.:]\d{1,3}\s*-->\s*\d{1,2}:\d{2}:\d{2}[,.:]\d{1,3}\s*$/gm, "");
                        // Strip WebVTT header
                        text = text.replace(/^WEBVTT.*$/gm, "");
                        // Strip sequence numbers on their own line
                        text = text.replace(/^\d+\s*$/gm, "");
                        // Strip YouTube caption noise: [music], [applause], >> speaker markers
                        text = text.replace(/\[music\]/gi, "").replace(/\[applause\]/gi, "").replace(/\[[^\]]{1,30}\]/g, "");
                        text = text.replace(/^>>\s*/gm, "");
                        // Collapse excessive blank lines
                        text = text.replace(/\n{3,}/g, "\n\n").trim();
                        setState((s) => ({ ...s, competitorScript: text }));
                        e.target.value = "";
                      };
                      reader.readAsText(file);
                    }}
                  />
                  <span className="inline-flex items-center gap-1.5 text-xs font-mono text-primary border border-primary/40 hover:bg-primary/5 rounded px-2.5 py-1 transition-colors">
                    ↑ Upload .txt / .srt
                  </span>
                </label>
              </div>
              <PromptEditor
                placeholder={"Paste a competitor YouTube script or transcript here...\n\nOr click 'Upload .txt / .srt' above to load a transcript file directly."}
                value={state.competitorScript}
                onChange={(val) => setState((s) => ({ ...s, competitorScript: val }))}
                minHeight="240px"
              />
              {state.competitorScript && (
                <p className="text-xs text-muted-foreground font-mono">
                  Caption noise ([music], timestamps, &gt;&gt;) is auto-stripped on upload.
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => setStep(3)} className="font-mono text-sm">Back</Button>
              <Button
                onClick={() => analyzeScriptMutation.mutate({ data: { script: state.competitorScript, outputMode } })}
                disabled={analyzeScriptMutation.isPending || !state.competitorScript.trim()}
                className="bg-primary text-primary-foreground font-mono text-sm"
              >
                {analyzeScriptMutation.isPending ? "Analyzing..." : "Analyze Script →"}
              </Button>
              <Button variant="ghost" className="text-xs font-mono text-muted-foreground" onClick={() => setStep(5)}>
                Skip
              </Button>
            </div>
            {(analyzeScriptMutation.isPending || (isPolling && activeJobType === "analyze_script")) && (
              <div className="space-y-2 pt-2">
                {isPolling && job ? (
                  <JobProgress job={job} onCancel={cancelJob} />
                ) : (
                  [1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-4 w-full" />)
                )}
              </div>
            )}
            {state.scriptAnalysis && !analyzeScriptMutation.isPending && !isPolling && (
              <div className="space-y-6 pt-6 border-t border-border mt-4">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-mono font-bold text-primary uppercase tracking-widest">✓ Script Analysis Complete</p>
                  <button
                    className="text-xs font-mono text-muted-foreground underline hover:text-foreground"
                    onClick={() => setState((s) => ({ ...s, scriptAnalysis: "" }))}
                  >
                    Clear & re-analyze
                  </button>
                </div>
                
                <ScriptAnalysisDashboard 
                  analysisJson={state.scriptAnalysis} 
                  competitorTitle={state.selectedTitle}
                />

                <Button
                  onClick={() => setStep(5)}
                  className="w-full bg-primary text-primary-foreground font-mono text-sm mt-8"
                >
                  Continue to Generate Script →
                </Button>
              </div>
            )}
          </div>
        </SectionCard>
      )}

      {/* STEP 5: Generate Script */}
      {step === 5 && (
        <SectionCard title="Step 5 of 6 — Generate Your Script">
          <div className="space-y-4">
            <PromptBox items={[
              { label: "Hook (First 10–15 sec)", text: "Starts with max 3–4 lines. Uses one of: Specific Promise, Curiosity Gap, Bold Claim, Shocking Stat, or Problem Statement. No 'Hey guys' or generic intros allowed." },
              { label: "[REHOOK] markers", text: "Re-engagement sentences placed after every 2 paragraphs — sarcastic, dramatic, or plot-twist style — to pull back viewers who are about to leave." },
              { label: "[OPEN LOOP] markers", text: "Teasers placed throughout that promise future reveals without giving them away — keeps viewers watching to the end." },
              { label: "[B-ROLL / CLIP / GRAPHIC] cues", text: "15–25 visual cue suggestions for faceless channel editors, making the video dynamic and preventing visual fatigue." },
              { label: "Storytelling Arc", text: "The entire script follows: Hook → Conflict → Rising Tension → Resolution → Lesson. Even factual content is written as a story." },
              { label: "[MID-ROLL CTA] + [END CTA]", text: "A soft call-to-action placed halfway through, and a strong direct CTA at the end — both labeled clearly in the script." },
            ]} />
            {state.selectedTitle && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
                <p className="text-xs font-mono text-muted-foreground uppercase mb-1">Title</p>
                <p className="text-sm font-semibold text-primary">"{state.selectedTitle}"</p>
              </div>
            )}
            {!state.selectedTitle && (
              <div className="space-y-1">
                <Label className="text-xs font-mono text-muted-foreground uppercase">Video Title</Label>
                <Input
                  placeholder="Enter the title for your script..."
                  value={state.selectedTitle}
                  onChange={(e) => setState((s) => ({ ...s, selectedTitle: e.target.value }))}
                  className="text-sm font-mono"
                />
              </div>
            )}
            {state.scriptAnalysis && (
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-xs font-mono text-muted-foreground uppercase mb-1">Script Analysis Reference (from Step 4)</p>
                <p className="text-xs text-muted-foreground line-clamp-3">{state.scriptAnalysis.substring(0, 200)}...</p>
              </div>
            )}

            {/* Target Duration / Word Count picker */}
            <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-mono font-bold text-foreground uppercase tracking-widest">Generation Mode</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {[
                    { mode: "exact_word_count", label: "Exact Word Count", tip: "Hits the target word count precisely" },
                    { mode: "approximate_word_count", label: "Approximate", tip: "Within +/- 10% of target" },
                    { mode: "match_competitor", label: "Match Competitor", tip: "Same length as competitor script" },
                    { mode: "ai_optimized", label: "AI Optimized", tip: "Best length for the topic/hook" },
                    { mode: "max_retention", label: "Max Retention", tip: "Short, punchy, high pacing" },
                  ].map(({ mode, label, tip }) => (
                    <button
                      key={mode}
                      onClick={() => setState((s) => ({ ...s, targetWordCountMode: mode as any }))}
                      className={`py-2 px-3 rounded-lg border text-xs font-mono text-left transition-all ${
                        state.targetWordCountMode === mode
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                      }`}
                    >
                      <span className="font-bold block">{label}</span>
                      <span className="block text-[10px] mt-0.5 opacity-80">{tip}</span>
                    </button>
                  ))}
                </div>
              </div>

              {["exact_word_count", "approximate_word_count"].includes(state.targetWordCountMode) ? (
                <div className="space-y-3 pt-4 border-t border-border">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-mono font-bold text-foreground uppercase tracking-widest">Target Length</p>
                    <span className="text-xs font-mono text-primary font-bold">
                      ~{state.targetWordCount} words
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                    {[
                      { label: "1 min", words: 200 },
                      { label: "2 min", words: 400 },
                      { label: "3 min", words: 600 },
                      { label: "5 min", words: 1000 },
                      { label: "7 min", words: 1400 },
                      { label: "10 min", words: 2000 },
                    ].map(({ label, words }) => (
                      <button
                        key={words}
                        onClick={() => setState((s) => ({ ...s, targetWordCount: words }))}
                        className={`py-2 rounded-lg border text-xs font-mono font-bold transition-all ${
                          state.targetWordCount === words
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                        }`}
                      >
                        {label}
                        <span className={`block text-[10px] font-normal mt-0.5 ${state.targetWordCount === words ? "text-primary-foreground/70" : "text-muted-foreground/60"}`}>
                          ~{words}w
                        </span>
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs font-mono text-muted-foreground shrink-0">Custom:</span>
                    <input
                      type="number"
                      min={100}
                      max={100000}
                      step={50}
                      value={state.targetWordCount}
                      onChange={(e) => {
                        const v = parseInt(e.target.value);
                        if (!isNaN(v) && v >= 50) setState((s) => ({ ...s, targetWordCount: v }));
                      }}
                      className="w-24 text-xs font-mono border border-border rounded px-2 py-1 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <span className="text-xs font-mono text-muted-foreground">words</span>
                  </div>
                </div>
              ) : (
                <div className="pt-4 border-t border-border">
                  <div className="flex items-start gap-2 text-xs font-mono text-muted-foreground bg-background/50 p-3 rounded border border-border/50">
                    <span className="text-primary mt-0.5">ℹ</span>
                    <div>
                      {state.targetWordCountMode === "match_competitor" && "The AI will automatically match the approximate word count of the competitor script you analyzed in Step 4."}
                      {state.targetWordCountMode === "ai_optimized" && "The AI will automatically determine the best length for this specific topic and hook (typically 1200 - 1800 words / 8-12 minutes)."}
                      {state.targetWordCountMode === "max_retention" && "The AI will generate a highly condensed, fast-paced script to maximize audience retention (typically 600 - 900 words / 4-6 minutes)."}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => setStep(4)} className="font-mono text-sm">Back</Button>
              <Button
                onClick={() =>
                  generateScriptMutation.mutate({
                    data: {
                      title: state.selectedTitle,
                      scriptAnalysis: state.scriptAnalysis || undefined,
                      targetWordCountMode: state.targetWordCountMode,
                      targetWordCount: ["exact_word_count", "approximate_word_count"].includes(state.targetWordCountMode) ? state.targetWordCount : undefined,
                      outputMode,
                    },
                  })
                }
                disabled={generateScriptMutation.isPending || !state.selectedTitle.trim()}
                className="bg-primary text-primary-foreground font-mono text-sm"
              >
                {generateScriptMutation.isPending ? "Writing Script..." : `Generate ~${state.targetWordCount}-Word Script →`}
              </Button>
            </div>
            {(generateScriptMutation.isPending || (isPolling && activeJobType === "generate_script")) && (
              <div className="space-y-2 pt-2">
                {isPolling && job ? (
                  <JobProgress job={job} onCancel={cancelJob} />
                ) : (
                  <>
                    <p className="text-xs font-mono text-muted-foreground animate-pulse">Writing your high-retention script...</p>
                    {Array.from({ length: 12 }).map((_, i) => (
                      <Skeleton key={i} className={`h-4 ${i % 3 === 0 ? "w-2/3" : i % 2 === 0 ? "w-5/6" : "w-full"}`} />
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        </SectionCard>
      )}

      {/* STEP 6: Final Report */}
      {step === 6 && (
        <div className="space-y-6">
          <SectionCard title="Step 6 of 6 — Your Complete Intelligence Report">
            <div className="space-y-4">
              {/* Summary badges */}
              <div className="flex flex-wrap gap-2">
                {allCollectedTitles.length > 0 && (
                  <Badge variant="outline" className="text-xs font-mono text-primary border-primary/30">
                    {allCollectedTitles.length} Titles Collected
                  </Badge>
                )}
                {parsedTitles.length > 0 && (
                  <Badge variant="outline" className="text-xs font-mono text-primary border-primary/30">
                    {parsedTitles.length} Titles Analyzed
                  </Badge>
                )}
                {state.generatedTitles.length > 0 && (
                  <Badge variant="outline" className="text-xs font-mono text-primary border-primary/30">
                    {state.generatedTitles.length} Titles Generated
                  </Badge>
                )}
                {state.scriptAnalysis && (
                  <Badge variant="outline" className="text-xs font-mono text-primary border-primary/30">
                    Script Analyzed
                  </Badge>
                )}
                {state.generatedScript && (
                  <Badge variant="outline" className="text-xs font-mono text-primary border-primary/30">
                    {state.generatedScriptWordCount} Word Script
                  </Badge>
                )}
              </div>

              {/* Tabs and Output Mode */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
                <div className="flex bg-muted/30 p-1 rounded-lg border border-border">
                  <button
                    onClick={() => setStep6Tab("report")}
                    className={`px-4 py-1.5 text-xs font-mono font-bold rounded-md transition-colors ${
                      step6Tab === "report" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Strategy Report
                  </button>
                  <button
                    onClick={() => setStep6Tab("script")}
                    className={`px-4 py-1.5 text-xs font-mono font-bold rounded-md transition-colors ${
                      step6Tab === "script" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Final Script
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex rounded-lg border border-border overflow-hidden">
                    <button
                      onClick={() => setOutputMode("docs")}
                      className={`px-3 py-1.5 text-xs font-mono font-bold transition-colors ${
                        outputMode === "docs" ? "bg-primary text-primary-foreground" : "bg-muted/30 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Docs
                    </button>
                    <button
                      onClick={() => setOutputMode("text")}
                      className={`px-3 py-1.5 text-xs font-mono font-bold transition-colors border-l border-border ${
                        outputMode === "text" ? "bg-primary text-primary-foreground" : "bg-muted/30 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Text
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleCopy} variant="outline" size="sm" className="font-mono text-xs">
                      Copy {step6Tab === "report" ? "Report" : "Script"}
                    </Button>
                    <Button
                      onClick={() => handleDownload("md")}
                      className="font-mono text-xs bg-primary text-primary-foreground hover:bg-primary/90"
                      size="sm"
                    >
                      Download Both
                    </Button>
                  </div>
                </div>
              </div>

              {/* Tab Content Preview */}
              <div className="rounded-lg border border-border bg-background max-h-[500px] overflow-y-auto p-5">
                {outputMode === "docs" ? (
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: renderMarkdown(step6Tab === "report" ? buildStrategyReport("docs") : buildFinalScript("docs")),
                    }}
                  />
                ) : (
                  <pre className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap font-mono">
                    {step6Tab === "report" ? buildStrategyReport("text") : buildFinalScript("text")}
                  </pre>
                )}
              </div>

              <div className="flex items-center gap-3 pt-2 border-t border-border">
                <Button variant="outline" onClick={() => setStep(5)} className="font-mono text-sm">Back</Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setStep(1);
                    setState({
                      competitors: [EMPTY_COMPETITOR(), EMPTY_COMPETITOR(), EMPTY_COMPETITOR()],
                      titlesText: "",
                      customPrompt: DEFAULT_CUSTOM_PROMPT,
                      customGeneratePrompt: DEFAULT_GENERATE_PROMPT,
                      titleAnalysis: "",
                      generatedTitles: [],
                      selectedTitle: "",
                      competitorScript: "",
                      scriptAnalysis: "",
                      generatedScript: "",
                      generatedScriptWordCount: 0,
                      targetWordCountMode: "approximate_word_count",
                      targetWordCount: 200,
                      fetchLimit: 7,
                      generateLimit: 5,
                      saveFormatIndex: null,
                      formatName: "",
                      selectedLibraryFormat: "",
                      libraryPayloadToSave: null,
                    });
                  }}
                  className="font-mono text-sm text-muted-foreground"
                >
                  Start New Session
                </Button>
              </div>
            </div>
          </SectionCard>
        </div>
      )}

      {/* Save to Library Modal */}
      <SaveToLibraryModal
        open={!!state.libraryPayloadToSave}
        onOpenChange={(open) => !open && setState(s => ({ ...s, libraryPayloadToSave: null }))}
        payload={state.libraryPayloadToSave}
      />
    </div>
  );
}
