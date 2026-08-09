"use client";

import React, { useState } from "react";
import { useDiscovery } from "@/components/discovery-v2/engine/DiscoveryProvider";
import { useSession } from "../../dashboard/session-context";
import { V2Video, ScriptAnalysisResult } from "@/lib/types/discovery-v2";
import {
  Youtube, FileText, Sparkles, Wand2, Activity,
  Brain, Target, ArrowRight, Zap, CheckCircle, AlertTriangle,
  GitMerge, Loader2, Copy, Download, ChevronRight, Image as ImageIcon
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type AnalysisRecord = Record<
  string,
  { status: "idle" | "analyzing" | "complete" | "error"; data?: ScriptAnalysisResult }
>;
type GenerationRecord = Record<
  string,
  { status: "idle" | "generating" | "complete" | "error"; script?: string; wordCount?: number }
>;
type WordCountMode = "match_competitor" | "exact_word_count" | "approximate_word_count" | "ai_optimized" | "max_retention";

// ─── Metric Card ──────────────────────────────────────────────────────────────
function MetricCard({ label, value, color, bg }: { label: string; value: number; color: string; bg: string }) {
  return (
    <div className={`${bg} p-4 rounded-xl border`}>
      <div className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">{label}</div>
      <div className={`text-2xl font-black ${color}`}>
        {value}<span className="text-sm text-gray-400 font-normal">/100</span>
      </div>
      <div className="mt-2 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
        <div
          className={`h-1.5 rounded-full transition-all duration-700 ${color.replace("text-", "bg-")}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

// ─── Thumbnail Download Helper ─────────────────────────────────────────────────
async function downloadThumbnail(video: V2Video) {
  const urls = [
    `https://i.ytimg.com/vi/${video.videoId}/maxresdefault.jpg`,
    `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`,
    video.thumbnail,
  ].filter(Boolean);

  for (const url of urls) {
    try {
      const res = await fetch(`/api/proxy-image?url=${encodeURIComponent(url!)}`);
      if (res.ok) {
        const blob = await res.blob();
        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = objectUrl;
        a.download = `${video.title.slice(0, 60).replace(/[^a-z0-9]/gi, "_")}_thumbnail.jpg`;
        a.click();
        URL.revokeObjectURL(objectUrl);
        return;
      }
    } catch {}
  }
  // Fallback: open in new tab
  window.open(urls[0] || video.thumbnail, "_blank");
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Stage7ScriptGeneration() {
  const { state } = useDiscovery();
  const { activeSession, updateSessionState } = useSession();

  const explicitItems = activeSession?.filters?.workspaceItems || state.workspaceItems || [];
  const sourceOutliers = activeSession?.filters?.outlierVideos || state.outlierVideos || [];
  const allItems = [...sourceOutliers, ...explicitItems];
  const workspaceItems: V2Video[] = Array.from(
    new Map(allItems.map((v: any) => [v.videoId, v])).values()
  );

  // Load analyses saved by Stage 6 (or previous Stage 7 runs) — no re-run needed
  const savedAnalyses: Record<string, ScriptAnalysisResult> = activeSession?.filters?.scriptAnalyses || {};

  const [selectedVideo, setSelectedVideo] = useState<V2Video | null>(workspaceItems[0] || null);
  const [analysisState, setAnalysisState] = useState<AnalysisRecord>(
    Object.fromEntries(
      Object.entries(savedAnalyses).map(([id, data]) => [id, { status: "complete" as const, data }])
    )
  );
  const [genState, setGenState] = useState<GenerationRecord>({});
  const [activeTab, setActiveTab] = useState<"analysis" | "generation">("analysis");
  const [wordCountMode, setWordCountMode] = useState<WordCountMode>("match_competitor");
  const [customWordCount, setCustomWordCount] = useState(1300);
  const [copied, setCopied] = useState(false);
  const [thumbDownloading, setThumbDownloading] = useState(false);

  const currentAnalysis = selectedVideo ? analysisState[selectedVideo.videoId] : null;
  const currentGen = selectedVideo ? genState[selectedVideo.videoId] : null;

  // ── Analyze ──────────────────────────────────────────────────────────────────
  const handleAnalyze = async (video: V2Video) => {
    if (!video.userScript || video.userScript.status !== "added") return;
    setAnalysisState((p) => ({ ...p, [video.videoId]: { status: "analyzing" } }));
    try {
      const res = await fetch("/api/discovery-v2/script-analysis/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ video, workspaceIntelligence: state.workspaceIntelligence }),
      });
      if (!res.ok) throw new Error("Server error");
      const data = await res.json();
      if (data.success && data.scriptAnalysis) {
        data.scriptAnalysis.videoId = video.videoId;
        setAnalysisState((p) => ({ ...p, [video.videoId]: { status: "complete", data: data.scriptAnalysis } }));
        // Also persist so Stage 6 badge reflects it
        const updated = { ...savedAnalyses, [video.videoId]: data.scriptAnalysis };
        await updateSessionState({ scriptAnalyses: updated });
      } else {
        throw new Error(data.error || "Invalid response");
      }
    } catch (e: any) {
      setAnalysisState((p) => ({ ...p, [video.videoId]: { status: "error" } }));
    }
  };

  // ── Generate ─────────────────────────────────────────────────────────────────
  const handleGenerate = async (video: V2Video) => {
    const analysis = analysisState[video.videoId]?.data || null;
    const resolvedWordCount =
      wordCountMode === "exact_word_count" || wordCountMode === "approximate_word_count"
        ? customWordCount
        : video.userScript?.wordCount || 1300;

    setGenState((p) => ({ ...p, [video.videoId]: { status: "generating" } }));
    try {
      const res = await fetch("/api/discovery-v2/script-generation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          video,
          scriptAnalysis: analysis,
          targetWordCountMode: wordCountMode,
          targetWordCount: resolvedWordCount,
        }),
      });
      if (!res.ok) throw new Error("Server error");
      const data = await res.json();
      if (data.success && data.script) {
        setGenState((p) => ({ ...p, [video.videoId]: { status: "complete", script: data.script, wordCount: data.wordCount } }));
        const updatedWorkspace = workspaceItems.map((v) =>
          v.videoId === video.videoId
            ? { ...v, generatedScript: { text: data.script, wordCount: data.wordCount } }
            : v
        );
        updateSessionState({ workspaceItems: updatedWorkspace });
      } else {
        throw new Error(data.error || "AI error");
      }
    } catch {
      setGenState((p) => ({ ...p, [video.videoId]: { status: "error" } }));
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────────
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadScript = (video: V2Video, text: string) => {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${video.title.slice(0, 60).replace(/[^a-z0-9]/gi, "_")}_script.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadThumbnail = async (video: V2Video) => {
    setThumbDownloading(true);
    try {
      await downloadThumbnail(video);
    } finally {
      setThumbDownloading(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-20">

      {/* ── HEADER ── */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Sparkles className="text-indigo-500" />
              Script Generation
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1 max-w-2xl text-sm">
              Click a video → reverse-engineer the script → generate a new one using the same 21-rule Netflix-documentary prompt engine as the Wizard.
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <button
              onClick={() => updateSessionState({ wizardStep: 6 })}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm"
            >
              ← Back
            </button>
            <button
              onClick={() => updateSessionState({ wizardStep: 8 })}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium text-sm flex items-center gap-2"
            >
              Final Export <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {workspaceItems.length === 0 ? (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-8 text-center border border-yellow-200 dark:border-yellow-800">
          <Brain className="text-yellow-500 mb-4 mx-auto" size={48} />
          <h3 className="text-xl font-bold text-yellow-700 dark:text-yellow-500 mb-2">Workspace Empty</h3>
          <p className="text-yellow-600 dark:text-yellow-400">Add scripts in Stage 5 before generating here.</p>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* ── LEFT SIDEBAR: Video List ── */}
          <div className="w-full lg:w-72 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shrink-0 shadow-sm">
            <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2 text-xs uppercase tracking-widest">
              <Youtube size={14} /> Workspace Videos
            </h3>
            <div className="space-y-2">
              {workspaceItems.map((video) => {
                const hasScript = video.userScript?.status === "added";
                const analyzed = analysisState[video.videoId]?.status === "complete";
                const generated = genState[video.videoId]?.status === "complete";
                const isSelected = selectedVideo?.videoId === video.videoId;
                return (
                  <button
                    key={video.videoId}
                    onClick={() => setSelectedVideo(video)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      isSelected
                        ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-400 dark:border-indigo-500 shadow-sm"
                        : "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:border-indigo-300 hover:bg-white dark:hover:bg-gray-800"
                    }`}
                  >
                    <div className="flex gap-3">
                      {/* Thumbnail with download overlay */}
                      <div className="relative group shrink-0 w-16 h-10 rounded overflow-hidden">
                        <img src={video.thumbnail} alt="" className="w-full h-full object-cover" />
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDownloadThumbnail(video); }}
                          className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Download thumbnail"
                        >
                          <Download size={12} className="text-white" />
                        </button>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold text-xs line-clamp-2 leading-tight ${isSelected ? "text-indigo-700 dark:text-indigo-300" : "text-gray-900 dark:text-white"}`}>
                          {video.title}
                        </p>
                        <div className="flex flex-wrap items-center gap-1 mt-1.5">
                          {hasScript ? (
                            <span className="text-[9px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                              <CheckCircle size={7} /> Script
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded-full">No Script</span>
                          )}
                          {analyzed && (
                            <span className="text-[9px] font-bold text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                              <Zap size={7} /> Analyzed
                            </span>
                          )}
                          {generated && (
                            <span className="text-[9px] font-bold text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                              <Sparkles size={7} /> Done
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── RIGHT PANEL: Analysis + Generation ── */}
          {selectedVideo ? (
            <div className="flex-1 w-full space-y-6">

              {/* Video Header with thumbnail download */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
                <div className="flex gap-4 items-start">
                  {/* Thumbnail */}
                  <div className="relative group shrink-0">
                    <img
                      src={selectedVideo.thumbnail}
                      alt={selectedVideo.title}
                      className="w-40 h-24 object-cover rounded-xl shadow-sm"
                    />
                    {/* Thumbnail download overlay */}
                    <button
                      onClick={() => handleDownloadThumbnail(selectedVideo)}
                      disabled={thumbDownloading}
                      className="absolute inset-0 bg-black/60 rounded-xl flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200"
                      title="Download thumbnail"
                    >
                      {thumbDownloading ? (
                        <Loader2 size={20} className="text-white animate-spin" />
                      ) : (
                        <>
                          <ImageIcon size={20} className="text-white mb-1" />
                          <span className="text-white text-[10px] font-bold">Download Thumbnail</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight mb-1">
                      {selectedVideo.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-gray-400">
                      <span>ID: {selectedVideo.videoId}</span>
                      {selectedVideo.userScript?.wordCount && (
                        <><span>•</span><span>{selectedVideo.userScript.wordCount} words</span></>
                      )}
                      {selectedVideo.channelTitle && (
                        <><span>•</span><span>{selectedVideo.channelTitle}</span></>
                      )}
                    </div>
                    {/* Quick actions */}
                    <div className="flex gap-2 mt-3">
                      <a
                        href={`https://youtube.com/watch?v=${selectedVideo.videoId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-mono px-2.5 py-1 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400 hover:border-red-400 hover:text-red-500 transition flex items-center gap-1"
                      >
                        <Youtube size={11} /> Watch on YouTube
                      </a>
                      <button
                        onClick={() => handleDownloadThumbnail(selectedVideo)}
                        className="text-[11px] font-mono px-2.5 py-1 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400 hover:border-indigo-400 hover:text-indigo-500 transition flex items-center gap-1"
                      >
                        <ImageIcon size={11} /> Download Thumbnail
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── TABS ── */}
              <div className="flex items-center gap-6 border-b border-gray-200 dark:border-gray-700 px-4">
                <button
                  onClick={() => setActiveTab("analysis")}
                  className={`py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
                    activeTab === "analysis"
                      ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                >
                  <Brain size={16} /> Reverse Engineering
                </button>
                <button
                  onClick={() => setActiveTab("generation")}
                  className={`py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
                    activeTab === "generation"
                      ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                >
                  <Sparkles size={16} /> Generate Script
                </button>
              </div>

              {/* ══ SECTION 1: REVERSE ENGINEERING ══ */}
              {activeTab === "analysis" && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden animate-in fade-in duration-300">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                  <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-sm">
                    <Brain size={16} className="text-indigo-500" />
                    Reverse Engineering Analysis
                  </h4>
                  {currentAnalysis?.status === "complete" && (
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle size={10} /> Complete
                    </span>
                  )}
                </div>

                <div className="p-6">
                  {!selectedVideo.userScript || selectedVideo.userScript.status !== "added" ? (
                    /* No script */
                    <div className="py-10 text-center flex flex-col items-center">
                      <FileText size={40} className="text-gray-300 dark:text-gray-600 mb-3" />
                      <p className="font-semibold text-gray-600 dark:text-gray-400 mb-1">No Script Attached</p>
                      <p className="text-sm text-gray-400 max-w-xs">Go back to Stage 5 to paste the competitor script for this video.</p>
                      <button
                        onClick={() => updateSessionState({ wizardStep: 5 })}
                        className="mt-4 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600"
                      >
                        ← Back to Workspace
                      </button>
                    </div>
                  ) : !currentAnalysis || currentAnalysis.status === "idle" ? (
                    /* Ready to analyze */
                    <div className="py-10 text-center flex flex-col items-center bg-indigo-50/50 dark:bg-indigo-900/10 rounded-xl border border-dashed border-indigo-200 dark:border-indigo-800">
                      <Brain size={44} className="text-indigo-300 mb-4" />
                      <h5 className="font-bold text-gray-800 dark:text-gray-200 mb-2">Script Ready for Analysis</h5>
                      <p className="text-sm text-gray-500 max-w-sm mb-6">
                        Compare this script against cross-video patterns. The result auto-feeds into script generation.
                      </p>
                      <button
                        onClick={() => handleAnalyze(selectedVideo)}
                        className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-md transition"
                      >
                        <Wand2 size={16} /> Analyze Script Now
                      </button>
                    </div>
                  ) : currentAnalysis.status === "analyzing" ? (
                    /* Analyzing */
                    <div className="py-16 text-center flex flex-col items-center">
                      <Activity className="text-indigo-500 animate-bounce mx-auto mb-4" size={44} />
                      <p className="font-bold text-gray-900 dark:text-white">Analyzing Script Architecture…</p>
                      <p className="text-sm text-gray-500 mt-2">Comparing against niche intelligence data.</p>
                    </div>
                  ) : currentAnalysis.status === "error" ? (
                    /* Error */
                    <div className="py-16 text-center flex flex-col items-center">
                      <AlertTriangle className="text-red-500 mx-auto mb-3" size={40} />
                      <p className="font-bold text-red-700">Analysis Failed</p>
                      <button
                        onClick={() => handleAnalyze(selectedVideo)}
                        className="mt-3 px-4 py-2 border border-red-200 rounded-lg text-red-600 hover:bg-red-50 text-sm"
                      >
                        Retry
                      </button>
                    </div>
                  ) : currentAnalysis.data ? (
                    /* Results */
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

                      {/* Metrics */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <MetricCard label="Hook Strength" value={currentAnalysis.data.hookStrength} color="text-indigo-600 dark:text-indigo-400" bg="bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-900/40" />
                        <MetricCard label="Pacing Score" value={currentAnalysis.data.pacingScore} color="text-blue-600 dark:text-blue-400" bg="bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/40" />
                        <MetricCard label="Info Density" value={currentAnalysis.data.infoDensityScore} color="text-emerald-600 dark:text-emerald-400" bg="bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/40" />
                        <MetricCard label="Retention Est." value={currentAnalysis.data.retentionScore} color="text-orange-600 dark:text-orange-400" bg="bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-900/40" />
                      </div>

                      {/* Competitor Comparison */}
                      <div>
                        <h5 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                          <Target size={13} className="text-red-500" /> Competitor Comparison
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-xl border border-red-100 dark:border-red-900/30">
                            <p className="font-bold text-red-700 dark:text-red-400 text-xs mb-1.5 uppercase tracking-wide">What Competitors Do</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">{currentAnalysis.data.competitorComparison.whatCompetitorsDo}</p>
                            <p className="font-bold text-red-700 dark:text-red-400 text-xs mb-1.5 uppercase tracking-wide">Competitor Advantage</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{currentAnalysis.data.competitorComparison.competitorAdvantage}</p>
                          </div>
                          <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30">
                            <p className="font-bold text-blue-700 dark:text-blue-400 text-xs mb-1.5 uppercase tracking-wide">Your Script Approach</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">{currentAnalysis.data.competitorComparison.whatUserDoes}</p>
                            <p className="font-bold text-blue-700 dark:text-blue-400 text-xs mb-1.5 uppercase tracking-wide">Your Advantage</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{currentAnalysis.data.competitorComparison.userAdvantage}</p>
                          </div>
                        </div>
                      </div>

                      {/* Difference Engine */}
                      <div>
                        <h5 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                          <GitMerge size={13} className="text-indigo-500" /> Difference Engine
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {[
                            { label: "Hook Difference", val: currentAnalysis.data.differenceEngine.hookDifference },
                            { label: "Story Difference", val: currentAnalysis.data.differenceEngine.storyDifference },
                            { label: "Pacing Difference", val: currentAnalysis.data.differenceEngine.pacingDifference },
                            { label: "Emotional Difference", val: currentAnalysis.data.differenceEngine.emotionalDifference },
                          ].map(({ label, val }) => (
                            <div key={label} className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</div>
                              <p className="text-sm text-gray-700 dark:text-gray-300">{val}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Actionable Improvements */}
                      <div className="bg-gradient-to-b from-gray-900 to-black rounded-2xl p-6 shadow-xl border border-gray-800">
                        <div className="flex items-center gap-3 mb-5 pb-5 border-b border-gray-800">
                          <Wand2 className="text-emerald-400" size={24} />
                          <div>
                            <h5 className="text-lg font-black text-white">Actionable Script Improvements</h5>
                            <p className="text-xs text-gray-400">Direct recommendations to beat the competition.</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div>
                              <p className="text-[10px] text-red-400 uppercase tracking-widest font-bold mb-2">Identified Problems</p>
                              <ul className="space-y-1">
                                {currentAnalysis.data.improvementStrategy.problems.map((p, i) => (
                                  <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                                    <span className="text-red-500 mt-0.5 shrink-0">•</span> {p}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <p className="text-[10px] text-yellow-400 uppercase tracking-widest font-bold mb-2">Missed Opportunities</p>
                              <ul className="space-y-1">
                                {currentAnalysis.data.improvementStrategy.missedOpportunities.map((p, i) => (
                                  <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                                    <span className="text-yellow-500 mt-0.5 shrink-0">•</span> {p}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                          <div className="space-y-4">
                            <div>
                              <p className="text-[10px] text-emerald-400 uppercase tracking-widest font-bold mb-2">Recommended Changes</p>
                              <ul className="space-y-1.5 bg-gray-800/50 p-3 rounded-xl border border-gray-700/50">
                                {currentAnalysis.data.improvementStrategy.recommendedChanges.map((p, i) => (
                                  <li key={i} className="text-sm text-white font-medium flex items-start gap-2">
                                    <ArrowRight size={13} className="text-emerald-500 mt-0.5 shrink-0" /> {p}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <p className="text-[10px] text-blue-400 uppercase tracking-widest font-bold mb-2">Improved Structure</p>
                              <div className="text-sm text-gray-300 p-3 bg-black/40 rounded-xl font-mono leading-relaxed border border-gray-800">
                                {currentAnalysis.data.improvementStrategy.improvedStructure}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
              )}

              {/* ══ SECTION 2: SCRIPT GENERATION ══ */}
              {activeTab === "generation" && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden animate-in fade-in duration-300">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                  <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-sm">
                    <Sparkles size={16} className="text-indigo-500" />
                    Generate Script
                    {currentAnalysis?.status === "complete" && (
                      <span className="ml-2 text-[10px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                        + Reverse Engineering Injected
                      </span>
                    )}
                  </h4>
                  {currentGen?.status === "complete" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCopy(currentGen.script!)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition font-mono"
                      >
                        <Copy size={11} /> {copied ? "Copied!" : "Copy"}
                      </button>
                      <button
                        onClick={() => handleDownloadScript(selectedVideo, currentGen.script!)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-mono"
                      >
                        <Download size={11} /> Download .txt
                      </button>
                    </div>
                  )}
                </div>

                <div className="p-6 space-y-5">
                  {/* Warning if no analysis */}
                  {(!currentAnalysis || currentAnalysis.status !== "complete") && !currentGen?.script && (
                    <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-sm">
                      <AlertTriangle size={15} className="text-amber-500 shrink-0 mt-0.5" />
                      <span className="text-amber-700 dark:text-amber-300">
                        Run the analysis above first for best results — the improvement strategy will be baked into the generation prompt.
                        <br /><span className="text-amber-500 text-xs">You can also generate without analysis.</span>
                      </span>
                    </div>
                  )}

                  {/* Word count controls */}
                  {(!currentGen || currentGen.status !== "complete") && (
                    <>
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Generation Mode</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {([
                            { mode: "match_competitor", label: "Match Competitor", tip: "Same length as competitor script" },
                            { mode: "exact_word_count", label: "Exact Word Count", tip: "Hits target precisely" },
                            { mode: "approximate_word_count", label: "Approximate", tip: "Within ±10% of target" },
                            { mode: "ai_optimized", label: "AI Optimised", tip: "Best length for topic" },
                            { mode: "max_retention", label: "Max Retention", tip: "Short, punchy, high pacing" },
                          ] as { mode: WordCountMode; label: string; tip: string }[]).map(({ mode, label, tip }) => (
                            <button
                              key={mode}
                              onClick={() => setWordCountMode(mode)}
                              className={`py-2 px-3 rounded-xl border text-xs font-mono text-left transition-all ${
                                wordCountMode === mode
                                  ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300"
                                  : "border-gray-200 dark:border-gray-700 text-gray-500 hover:border-indigo-300 hover:text-gray-700 dark:hover:text-gray-300"
                              }`}
                            >
                              <span className="font-bold block">{label}</span>
                              <span className="block text-[10px] mt-0.5 opacity-70">{tip}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {(wordCountMode === "exact_word_count" || wordCountMode === "approximate_word_count") && (
                        <div className="pt-2">
                          <p className="text-xs font-mono text-gray-400 mb-2 uppercase tracking-wider">Target Word Count</p>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {[
                              { label: "1 min", words: 200 }, { label: "2 min", words: 400 },
                              { label: "3 min", words: 600 }, { label: "5 min", words: 1000 },
                              { label: "7 min", words: 1400 }, { label: "10 min", words: 2000 },
                            ].map(({ label, words }) => (
                              <button
                                key={words}
                                onClick={() => setCustomWordCount(words)}
                                className={`py-1.5 px-3 rounded-lg border text-xs font-mono font-bold transition-all ${
                                  customWordCount === words
                                    ? "border-indigo-500 bg-indigo-500 text-white"
                                    : "border-gray-200 dark:border-gray-700 text-gray-500 hover:border-indigo-300"
                                }`}
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-gray-400">Custom:</span>
                            <input
                              type="number" min={100} max={100000} step={50}
                              value={customWordCount}
                              onChange={(e) => { const v = parseInt(e.target.value); if (!isNaN(v) && v >= 50) setCustomWordCount(v); }}
                              className="w-24 text-xs font-mono border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                            <span className="text-xs font-mono text-gray-400">words</span>
                          </div>
                        </div>
                      )}

                      {!["exact_word_count", "approximate_word_count"].includes(wordCountMode) && (
                        <div className="flex items-start gap-2 text-xs font-mono text-gray-500 bg-gray-50 dark:bg-gray-900 p-3 rounded-xl border border-gray-200 dark:border-gray-700">
                          <span className="text-indigo-500">ℹ</span>
                          <span>
                            {wordCountMode === "match_competitor" && `Will match the competitor script's word count (~${selectedVideo.userScript?.wordCount || "auto"} words).`}
                            {wordCountMode === "ai_optimized" && "AI will determine the best length (typically 1200–1800 words)."}
                            {wordCountMode === "max_retention" && "Condensed script for max retention (typically 600–900 words)."}
                          </span>
                        </div>
                      )}

                      {/* Generate button */}
                      <button
                        onClick={() => handleGenerate(selectedVideo)}
                        disabled={genState[selectedVideo.videoId]?.status === "generating"}
                        className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:from-indigo-700 hover:to-purple-700 transition shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {genState[selectedVideo.videoId]?.status === "generating" ? (
                          <><Loader2 className="animate-spin" size={18} /> Writing Script…</>
                        ) : (
                          <><Sparkles size={18} /> Generate Script →</>
                        )}
                      </button>
                    </>
                  )}

                  {/* Script output */}
                  {currentGen?.status === "complete" && currentGen.script && (
                    <div className="space-y-4 animate-in fade-in duration-500">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          <CheckCircle className="text-emerald-500" size={16} />
                          Generated Script
                          <span className="text-xs font-normal text-gray-400 font-mono">
                            ≈ {currentGen.wordCount ?? currentGen.script.split(/\s+/).length} words
                          </span>
                        </p>
                        <button
                          onClick={() => setGenState((p) => ({ ...p, [selectedVideo.videoId]: { status: "idle" } }))}
                          className="text-xs text-gray-400 hover:text-gray-600 underline font-mono"
                        >
                          Regenerate
                        </button>
                      </div>
                      <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed overflow-auto max-h-[600px] bg-gray-50 dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200">
                        {currentGen.script}
                      </pre>
                    </div>
                  )}

                  {currentGen?.status === "error" && (
                    <div className="py-8 text-center flex flex-col items-center">
                      <AlertTriangle className="text-red-500 mx-auto mb-3" size={36} />
                      <p className="font-bold text-red-700">Generation Failed</p>
                      <button
                        onClick={() => setGenState((p) => ({ ...p, [selectedVideo.videoId]: { status: "idle" } }))}
                        className="mt-3 px-4 py-2 border border-red-200 rounded-lg text-red-600 hover:bg-red-50 text-sm"
                      >
                        Try Again
                      </button>
                    </div>
                  )}
                </div>
              </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 py-24">
              <FileText size={48} className="mb-4 text-gray-200 dark:text-gray-700" />
              <p className="font-medium">Select a video from the sidebar to begin</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
