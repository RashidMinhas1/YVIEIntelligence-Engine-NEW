"use client";

import React, { useState, useMemo } from "react";
import { useSession } from "@/components/dashboard/session-context";
import { useDiscovery } from "@/components/discovery-v2/engine/DiscoveryProvider";
import {
  FileDown, CheckCircle, Copy, Check, Download, ChevronDown, ChevronUp,
  Youtube, FileText, Sparkles, Brain, Target, Zap, BookOpen, Lightbulb,
  BarChart2, ArrowRight, Hash, Clock, Users, TrendingUp
} from "lucide-react";
import { ScriptAnalysisResult, V2Video } from "@/lib/types/discovery-v2";

// ─── Collapsible Section ──────────────────────────────────────────────────────
function Section({
  title, icon, badge, children, defaultOpen = true
}: {
  title: string; icon: React.ReactNode; badge?: string;
  children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 bg-gray-50 dark:bg-gray-900/40 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
      >
        <div className="flex items-center gap-2 font-bold text-gray-900 dark:text-white text-sm">
          {icon}
          {title}
          {badge && (
            <span className="ml-2 text-[10px] font-bold px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-full">
              {badge}
            </span>
          )}
        </div>
        {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
      </button>
      {open && <div className="p-5 bg-white dark:bg-gray-800">{children}</div>}
    </div>
  );
}

// ─── Main Export Component ────────────────────────────────────────────────────
export default function Stage7Export() {
  const { activeSession, updateSessionState } = useSession();
  const { state } = useDiscovery();

  const prevStage = () => updateSessionState({ wizardStep: 7 });

  const [exportDone, setExportDone] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [copied, setCopied] = useState(false);

  // ─── Gather all data ────────────────────────────────────────────────────────
  const filters = activeSession?.filters || {};

  const outlierVideos: V2Video[] = filters.outlierVideos || [];
  const workspaceItems: V2Video[] = (() => {
    const explicit = filters.workspaceItems || state.workspaceItems || [];
    const outliers = filters.outlierVideos || state.outlierVideos || [];
    const all = [...outliers, ...explicit];
    return Array.from(new Map(all.map((v: V2Video) => [v.videoId, v])).values());
  })();

  const scriptAnalyses: Record<string, ScriptAnalysisResult> = filters.scriptAnalyses || {};
  const workspaceIntelligence = state.workspaceIntelligence || filters.workspaceIntelligence;

  // Videos that have a generated script
  const videosWithScript = workspaceItems.filter(
    (v) => (v as any).generatedScript?.text
  );

  // Videos with reverse engineering done
  const videosAnalyzed = workspaceItems.filter((v) => scriptAnalyses[v.videoId]);

  // Concept blueprints from workspace intelligence
  const finalBlueprint = workspaceIntelligence?.crossVideoAnalysis?.finalBlueprint || null;

  // All suggested titles gathered from blueprints
  const allTitles: string[] = useMemo(() => {
    return finalBlueprint?.suggestedTitles || [];
  }, [finalBlueprint]);

  // ─── Build Markdown Export ──────────────────────────────────────────────────
  const buildMarkdown = (): string => {
    const lines: string[] = [];
    const date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

    lines.push(`# 🎬 Viral Intelligence Report`);
    lines.push(`**Generated:** ${date}`);
    lines.push(`**Session:** ${activeSession?.name || "Research Session"}`);
    lines.push(`**Outlier Videos Found:** ${outlierVideos.length}`);
    lines.push(`**Workspace Videos:** ${workspaceItems.length}`);
    lines.push(`**Scripts Analyzed:** ${Object.keys(scriptAnalyses).length}`);
    lines.push(`**Scripts Generated:** ${videosWithScript.length}`);
    lines.push(``);

    // ── Title Variations
    if (allTitles.length > 0) {
      lines.push(`---`);
      lines.push(`## 📝 Title Variations (${allTitles.length})`);
      allTitles.forEach((t, i) => {
        lines.push(`${i + 1}. ${t}`);
      });
      lines.push(``);
    }

    // ── Content Blueprint
    if (finalBlueprint) {
      lines.push(`---`);
      lines.push(`## 💡 Content Blueprint`);
      if (finalBlueprint.recommendedConcept) lines.push(`**Recommended Concept:** ${finalBlueprint.recommendedConcept}`);
      if (finalBlueprint.uniqueAngle) lines.push(`**Unique Angle:** ${finalBlueprint.uniqueAngle}`);
      if (finalBlueprint.mainPromise) lines.push(`**Main Promise:** ${finalBlueprint.mainPromise}`);
      if (finalBlueprint.titleStrategy) lines.push(`**Title Strategy:** ${finalBlueprint.titleStrategy}`);
      if (finalBlueprint.hookStrategy) lines.push(`**Hook Strategy:** ${finalBlueprint.hookStrategy}`);
      if (finalBlueprint.thumbnailConcept) lines.push(`**Thumbnail Concept:** ${finalBlueprint.thumbnailConcept}`);
      if (finalBlueprint.storyStructure) lines.push(`**Story Structure:** ${finalBlueprint.storyStructure}`);
      if (finalBlueprint.whatToAvoid) lines.push(`⚠️ **Avoid:** ${finalBlueprint.whatToAvoid}`);
      lines.push(``);
    }

    // ── Outlier Videos
    if (outlierVideos.length > 0) {
      lines.push(`---`);
      lines.push(`## 📊 Top Outlier Videos (${outlierVideos.length})`);
      outlierVideos.forEach((v, i) => {
        lines.push(`### ${i + 1}. ${v.title}`);
        lines.push(`- **Channel:** ${v.channelTitle || "Unknown"}`);
        lines.push(`- **Views:** ${v.viewCount?.toLocaleString() || "N/A"}`);
        lines.push(`- **URL:** https://youtube.com/watch?v=${v.videoId}`);
        lines.push(``);
      });
    }

    // ── Reverse Engineering Results
    if (Object.keys(scriptAnalyses).length > 0) {
      lines.push(`---`);
      lines.push(`## 🔬 Reverse Engineering Analysis`);
      Object.entries(scriptAnalyses).forEach(([videoId, analysis]) => {
        const video = workspaceItems.find((v) => v.videoId === videoId);
        lines.push(`### ${video?.title || videoId}`);
        lines.push(`- Hook Strength: ${analysis.hookStrength}/100`);
        lines.push(`- Pacing Score: ${analysis.pacingScore}/100`);
        lines.push(`- Info Density: ${analysis.infoDensityScore}/100`);
        lines.push(`- Retention: ${analysis.retentionScore}/100`);
        lines.push(`- Hook Type: ${analysis.breakdown.hookType}`);
        lines.push(`- Story Structure: ${analysis.breakdown.storyStructure}`);
        lines.push(`**Opportunity:** ${analysis.competitorComparison.opportunity}`);
        lines.push(`**Improvement:** ${analysis.improvementStrategy.improvedStructure}`);
        lines.push(`**Recommended Changes:**`);
        analysis.improvementStrategy.recommendedChanges.forEach((c) => lines.push(`  - ${c}`));
        lines.push(``);
      });
    }

    // ── Generated Scripts
    videosWithScript.forEach((v) => {
      const gs = (v as any).generatedScript;
      lines.push(`---`);
      lines.push(`## ✍️ Generated Script — ${v.title}`);
      lines.push(`**Word Count:** ${gs.wordCount || "N/A"} words`);
      lines.push(``);
      lines.push(gs.text);
      lines.push(``);
    });

    return lines.join("\n");
  };

  // ─── Export Handlers ────────────────────────────────────────────────────────
  const markdown = useMemo(() => buildMarkdown(), [
    allTitles, finalBlueprint, outlierVideos, scriptAnalyses, videosWithScript
  ]);

  const handleExport = () => {
    setExporting(true);
    setTimeout(() => {
      const blob = new Blob([markdown], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `viral-intelligence-report-${Date.now()}.md`;
      a.click();
      URL.revokeObjectURL(url);
      setExporting(false);
      setExportDone(true);
    }, 800);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-20">

      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FileDown className="text-red-500" />
              Export & Action Plan
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
              Full research package: title variations, content blueprints, reverse engineering insights, and generated scripts.
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <button
              onClick={prevStage}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm"
            >
              ← Back
            </button>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Outlier Videos", value: outlierVideos.length, icon: <Youtube size={18} className="text-red-500" />, color: "text-red-600" },
          { label: "Title Variations", value: allTitles.length, icon: <Hash size={18} className="text-indigo-500" />, color: "text-indigo-600" },
          { label: "Scripts Analyzed", value: Object.keys(scriptAnalyses).length, icon: <Brain size={18} className="text-blue-500" />, color: "text-blue-600" },
          { label: "Scripts Generated", value: videosWithScript.length, icon: <Sparkles size={18} className="text-emerald-500" />, color: "text-emerald-600" },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-3">
            {icon}
            <div>
              <div className={`text-2xl font-black ${color}`}>{value}</div>
              <div className="text-xs text-gray-500">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Export actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center justify-center gap-3 py-4 px-6 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 active:scale-[0.98] transition-all shadow-lg shadow-red-600/20 disabled:opacity-70 disabled:cursor-wait text-base"
        >
          {exporting ? (
            <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Compiling Report…</>
          ) : (
            <><Download size={20} /> Download Full Report (.md)</>
          )}
        </button>
        <button
          onClick={handleCopy}
          className="flex items-center justify-center gap-3 py-4 px-6 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-[0.98] transition-all text-base"
        >
          {copied ? <><Check size={20} className="text-emerald-500" /> Copied!</> : <><Copy size={20} /> Copy as Markdown</>}
        </button>
      </div>

      {exportDone && (
        <div className="flex items-center gap-3 px-5 py-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl text-sm">
          <CheckCircle className="text-emerald-500 shrink-0" size={18} />
          <span className="text-emerald-700 dark:text-emerald-300 font-medium">
            Report downloaded! Open it in any Markdown viewer (Obsidian, Notion, VS Code).
          </span>
        </div>
      )}

      {/* ── TITLE VARIATIONS ── */}
      {allTitles.length > 0 && (
        <Section title="Title Variations" icon={<Hash size={16} className="text-indigo-500" />} badge={String(allTitles.length)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {allTitles.map((t, i) => (
              <div key={i} className="group relative bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:border-indigo-400 transition">
                <p className="font-semibold text-sm text-gray-900 dark:text-white pr-7">"{t}"</p>
                <button
                  onClick={() => { navigator.clipboard.writeText(t); }}
                  className="absolute top-3 right-3 p-1 text-gray-400 hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition"
                  title="Copy title"
                >
                  <Copy size={13} />
                </button>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── CONTENT BLUEPRINTS ── */}
      {finalBlueprint && (
        <Section title="Content Blueprint" icon={<Lightbulb size={16} className="text-yellow-500" />}>
          <div className="space-y-6">
            <div className="bg-gradient-to-b from-gray-900 to-black rounded-2xl p-6 border border-gray-800">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
                {[
                  { label: "Recommended Concept", val: finalBlueprint.recommendedConcept, color: "text-white" },
                  { label: "Unique Angle", val: finalBlueprint.uniqueAngle, color: "text-emerald-400" },
                  { label: "Main Promise", val: finalBlueprint.mainPromise, color: "text-gray-300" },
                  { label: "Hook Strategy", val: finalBlueprint.hookStrategy, color: "text-indigo-300" },
                  { label: "Thumbnail Concept", val: finalBlueprint.thumbnailConcept, color: "text-yellow-300" },
                  { label: "Story Structure", val: finalBlueprint.storyStructure, color: "text-gray-300" },
                ].filter(x => x.val).map(({ label, val, color }) => (
                  <div key={label}>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">{label}</p>
                    <p className={`${color} leading-snug`}>{val}</p>
                  </div>
                ))}
              </div>
              {/* Suggested Titles */}
              {finalBlueprint.suggestedTitles?.length > 0 && (
                <div className="mt-5 pt-5 border-t border-gray-800">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Suggested Titles</p>
                  <div className="space-y-2">
                    {finalBlueprint.suggestedTitles.map((t: string, ti: number) => (
                      <div key={ti} className="flex items-center justify-between gap-2 bg-gray-800/50 px-3 py-2 rounded-lg border border-gray-700/50">
                        <span className="text-sm text-white font-medium">"{t}"</span>
                        <button onClick={() => navigator.clipboard.writeText(t)} className="text-gray-400 hover:text-white shrink-0">
                          <Copy size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {finalBlueprint.whatToAvoid && (
                <div className="mt-4 px-4 py-3 bg-red-950/30 border border-red-900/30 rounded-xl">
                  <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-1">⚠ Avoid</p>
                  <p className="text-sm text-red-300">{finalBlueprint.whatToAvoid}</p>
                </div>
              )}
            </div>
          </div>
        </Section>
      )}

      {/* ── REVERSE ENGINEERING SUMMARIES ── */}
      {Object.keys(scriptAnalyses).length > 0 && (
        <Section title="Reverse Engineering Insights" icon={<Brain size={16} className="text-blue-500" />} badge={String(Object.keys(scriptAnalyses).length)}>
          <div className="space-y-5">
            {Object.entries(scriptAnalyses).map(([videoId, analysis]) => {
              const video = workspaceItems.find((v) => v.videoId === videoId);
              return (
                <div key={videoId} className="border border-gray-200 dark:border-gray-700 rounded-xl p-5">
                  <div className="flex items-start gap-3 mb-4">
                    {video?.thumbnail && (
                      <img src={video.thumbnail} alt="" className="w-20 h-12 rounded-lg object-cover shrink-0" />
                    )}
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white text-sm leading-tight">{video?.title || videoId}</p>
                      <div className="flex gap-3 mt-2">
                        {[
                          { label: "Hook", val: analysis.hookStrength, color: "text-indigo-600 dark:text-indigo-400" },
                          { label: "Pacing", val: analysis.pacingScore, color: "text-blue-600 dark:text-blue-400" },
                          { label: "Density", val: analysis.infoDensityScore, color: "text-emerald-600 dark:text-emerald-400" },
                          { label: "Retention", val: analysis.retentionScore, color: "text-orange-600 dark:text-orange-400" },
                        ].map(({ label, val, color }) => (
                          <div key={label} className="text-center">
                            <div className={`text-lg font-black ${color}`}>{val}</div>
                            <div className="text-[9px] text-gray-400 uppercase tracking-wide">{label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-2">
                      <div>
                        <span className="font-bold text-gray-500 uppercase tracking-wide">Hook Type: </span>
                        <span className="text-gray-800 dark:text-gray-200">{analysis.breakdown.hookType}</span>
                      </div>
                      <div>
                        <span className="font-bold text-gray-500 uppercase tracking-wide">Story: </span>
                        <span className="text-gray-800 dark:text-gray-200">{analysis.breakdown.storyStructure}</span>
                      </div>
                      <div>
                        <span className="font-bold text-gray-500 uppercase tracking-wide">Opportunity: </span>
                        <span className="text-gray-800 dark:text-gray-200">{analysis.competitorComparison.opportunity}</span>
                      </div>
                    </div>
                    <div>
                      <p className="font-bold text-gray-500 uppercase tracking-wide mb-1">Recommended Changes</p>
                      <ul className="space-y-1">
                        {analysis.improvementStrategy.recommendedChanges.slice(0, 4).map((c, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-gray-700 dark:text-gray-300">
                            <ArrowRight size={11} className="text-emerald-500 mt-0.5 shrink-0" /> {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* ── GENERATED SCRIPTS ── */}
      {videosWithScript.length > 0 && (
        <Section title="Generated Scripts" icon={<Sparkles size={16} className="text-emerald-500" />} badge={String(videosWithScript.length)}>
          <div className="space-y-5">
            {videosWithScript.map((v) => {
              const gs = (v as any).generatedScript;
              return (
                <div key={v.videoId} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <img src={v.thumbnail} alt="" className="w-16 h-10 rounded-lg object-cover" />
                      <div>
                        <p className="font-bold text-sm text-gray-900 dark:text-white line-clamp-1">{v.title}</p>
                        <p className="text-xs text-gray-400 font-mono">≈ {gs.wordCount || "?"} words</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigator.clipboard.writeText(gs.text)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-white dark:hover:bg-gray-800 transition font-mono"
                      >
                        <Copy size={11} /> Copy
                      </button>
                      <button
                        onClick={() => {
                          const blob = new Blob([gs.text], { type: "text/plain" });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `${v.title.slice(0, 60).replace(/[^a-z0-9]/gi, "_")}_script.txt`;
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-mono"
                      >
                        <Download size={11} /> .txt
                      </button>
                    </div>
                  </div>
                  <pre className="whitespace-pre-wrap text-xs font-mono leading-relaxed overflow-auto max-h-64 p-5 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800">
                    {gs.text}
                  </pre>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* ── TOP OUTLIER VIDEOS ── */}
      {outlierVideos.length > 0 && (
        <Section title="Top Outlier Videos" icon={<TrendingUp size={16} className="text-red-500" />} badge={String(outlierVideos.length)} defaultOpen={false}>
          <div className="space-y-3">
            {outlierVideos.slice(0, 10).map((v, i) => (
              <div key={v.videoId} className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-red-300 transition">
                <span className="text-lg font-black text-gray-300 dark:text-gray-600 w-6 shrink-0">#{i + 1}</span>
                <img src={v.thumbnail} alt="" className="w-20 h-12 rounded-lg object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-1">{v.title}</p>
                  <p className="text-xs text-gray-400">{v.channelTitle} · {v.viewCount?.toLocaleString()} views</p>
                </div>
                <a
                  href={`https://youtube.com/watch?v=${v.videoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 font-mono shrink-0"
                >
                  <Youtube size={12} /> Watch
                </a>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Empty state */}
      {outlierVideos.length === 0 && Object.keys(scriptAnalyses).length === 0 && videosWithScript.length === 0 && allTitles.length === 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-10 text-center border border-yellow-200 dark:border-yellow-800">
          <FileText size={48} className="text-yellow-400 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-yellow-700 dark:text-yellow-400 mb-2">No Data to Export Yet</h3>
          <p className="text-sm text-yellow-600 dark:text-yellow-500 max-w-sm mx-auto">
            Complete the research stages first — analyze outlier videos, generate scripts, and run reverse engineering. Then come back here to export everything.
          </p>
        </div>
      )}
    </div>
  );
}
