'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Step3TabProps, V2Video } from './types';
import {
  Clock, User, Eye, Activity, Info, Loader2, Zap,
  ExternalLink, TrendingUp, Video, AlertTriangle, ShieldAlert,
  ChevronDown, ChevronUp, CheckCircle, HelpCircle, Sparkles, BookOpen,
  Award, Globe, Layers, Target, Compass, X, Plus, Filter, ArrowUpDown,
  BarChart3, Brain, History, Save, Download, Lightbulb, Search,
  ChevronRight, ArrowRight, Shield, Gauge, GitBranch, FileText
} from 'lucide-react';
import {
  computePerformanceGroup, getPerformanceGroupBadgeClasses, getPerformanceGroupColor,
  getVersionLabelClasses, getConfidenceBadgeClasses, getConfidenceIcon,
  formatViewCount, formatTimeAgo, validateMetric, buildPerformanceGroups
} from '@/lib/discovery/timeline-utils';

// ==================== TYPES (inline for component) ====================

type ComparisonMode = 'previous' | 'earliest' | 'best' | 'latest';
type SortOption = 'date' | 'views' | 'confidence' | 'performance';
type PerformanceFilter = 'all' | '🔥 Explosive' | '🚀 Viral' | '📈 Above Average' | '➖ Average' | '📉 Underperformed' | '💀 Dead';

// ==================== SKELETON LOADER ====================

function SkeletonCard() {
  return (
    <div className="animate-pulse space-y-3 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      <div className="flex gap-4">
        <div className="w-24 h-14 rounded-lg bg-gray-200 dark:bg-gray-700" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      </div>
    </div>
  );
}

// ==================== CONFIDENCE METER ====================

function ConfidenceMeter({ label, level, icon }: { label: string; level: string; icon: string }) {
  return (
    <div className="flex items-center gap-1.5 text-[10px]" title={`${label}: ${level}`}>
      <span>{icon}</span>
      <span className={`px-1.5 py-0.5 rounded font-bold ${getConfidenceBadgeClasses(level as any)}`}>
        {level}
      </span>
    </div>
  );
}

// ==================== AI EXPLAINABILITY PANEL ====================

function AIExplainabilityPanel({ data }: { data: any }) {
  if (!data || !data.reasons) return null;
  return (
    <div className="bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/20 dark:to-indigo-950/20 border border-violet-200 dark:border-violet-800/50 rounded-xl p-4 space-y-3">
      <h5 className="text-xs font-extrabold text-violet-800 dark:text-violet-300 uppercase tracking-wider flex items-center gap-1.5">
        <Brain className="w-3.5 h-3.5" /> Why AI Selected This
      </h5>
      <div className="space-y-2">
        {data.reasons.map((reason: any, i: number) => (
          <div key={i} className="flex items-center justify-between text-xs">
            <span className="text-gray-700 dark:text-gray-300 font-medium">{reason.factor}</span>
            <div className="flex items-center gap-2">
              <div className="w-24 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    reason.score >= 85 ? 'bg-green-500' : reason.score >= 65 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(reason.score, 100)}%` }}
                />
              </div>
              <span className="font-bold text-gray-900 dark:text-white w-8 text-right">{reason.score}%</span>
            </div>
          </div>
        ))}
      </div>
      {data.summary && (
        <p className="text-[11px] text-gray-600 dark:text-gray-400 italic border-t border-violet-200 dark:border-violet-800/50 pt-2 mt-2">
          {data.summary}
        </p>
      )}
    </div>
  );
}

// ==================== PERFORMANCE GROUP SUMMARY BAR ====================

function PerformanceGroupBar({ groups, activeFilter, onSelect }: { groups: any[], activeFilter: string, onSelect: (filter: any) => void }) {
  if (!groups || groups.length === 0) return null;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
      {groups.map((g: any) => (
        <button 
          key={g.group} 
          onClick={() => onSelect(activeFilter === g.group ? 'all' : g.group)}
          className={`p-3 rounded-xl border text-center transition-all hover:scale-[1.02] active:scale-95 ${getPerformanceGroupBadgeClasses(g.group)} ${activeFilter === g.group ? 'ring-2 ring-offset-1 ring-red-500' : 'opacity-80 hover:opacity-100'}`}
        >
          <span className="text-lg font-extrabold block">{g.totalVideos}</span>
          <span className="text-[10px] font-bold block">{g.group}</span>
          <span className="text-[9px] opacity-75">{formatViewCount(g.avgViews)} avg</span>
        </button>
      ))}
    </div>
  );
}

// ==================== MAIN COMPONENT ====================

export default function Tab5Timeline({ selectedVideo, setSelectedVideo, activeSession, updateSessionState, videos }: Step3TabProps) {
  // ===== All hooks at the top level, never conditional =====
  const activeOutliers = activeSession?.filters?.outlierVideos || [];
  const activeVideo = activeOutliers.find((v: V2Video) => v.id === selectedVideo?.id) || activeOutliers[0];

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAnalyzingAll, setIsAnalyzingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedStages, setExpandedStages] = useState<Record<number, boolean>>({});
  const [expandedExplainability, setExpandedExplainability] = useState<Record<number, boolean>>({});
  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>('previous');
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [performanceFilter, setPerformanceFilter] = useState<PerformanceFilter>('all');
  const [searchLimit, setSearchLimit] = useState(200);
  const [similarityThreshold, setSimilarityThreshold] = useState(0.70);
  const [showChannelsModal, setShowChannelsModal] = useState(false);
  const [showVideosModal, setShowVideosModal] = useState(false);
  const [showSnapshotsModal, setShowSnapshotsModal] = useState(false);
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [isSavingSnapshot, setIsSavingSnapshot] = useState(false);
  const [expandedDuplicateGroups, setExpandedDuplicateGroups] = useState<Record<string, boolean>>({});
  const [showSettings, setShowSettings] = useState(false);

  // Determine if data is old format (exactly 5 items = legacy)
  const isOldData = activeVideo?.advancedResearch?.lifecycleTimeline?.length === 5;
  const adv = isOldData ? null : activeVideo?.advancedResearch;

  // ===== Computed data =====
  const timelineEntries = useMemo(() => {
    if (!adv) return [];
    let entries = adv.entries || adv.lifecycleTimeline || [];
    
    let filtered = performanceFilter === 'all'
      ? entries
      : entries.filter((e: any) => (e.performanceGroup || e.performanceStatus) === performanceFilter);

    // Apply Comparison Mode Filter
    if (comparisonMode !== 'previous' && filtered.length > 0) {
      // Find the specific video to compare against
      let compareVideo = null;
      if (comparisonMode === 'earliest') {
        compareVideo = [...filtered].sort((a: any, b: any) => new Date(a.publishDate || a.uploadDate || 0).getTime() - new Date(b.publishDate || b.uploadDate || 0).getTime())[0];
      } else if (comparisonMode === 'best') {
        compareVideo = [...filtered].sort((a: any, b: any) => (b.views || b.currentViews || 0) - (a.views || a.currentViews || 0))[0];
      } else if (comparisonMode === 'latest') {
        compareVideo = [...filtered].sort((a: any, b: any) => new Date(b.publishDate || b.uploadDate || 0).getTime() - new Date(a.publishDate || a.uploadDate || 0).getTime())[0];
      }
      
      // Target video is typically the last one in the original entries if sorted by date, or we can just show the entire timeline but highlight it.
      // Filtering to just show the compared video and the target video is a good way to "compare".
      // Let's just highlight them in the UI instead of filtering them out completely, or we filter to just 2 videos?
      // Actually, filtering to just the compare video and the latest video is best.
      if (compareVideo) {
        const latestVideo = [...entries].sort((a: any, b: any) => new Date(b.publishDate || b.uploadDate || 0).getTime() - new Date(a.publishDate || a.uploadDate || 0).getTime())[0];
        // If they are the same, just show one. Otherwise show both.
        filtered = compareVideo.videoId === latestVideo.videoId ? [compareVideo] : [compareVideo, latestVideo];
      }
    }

    // Sort
    switch (sortBy) {
      case 'views':
        filtered = [...filtered].sort((a: any, b: any) => (b.views || b.currentViews || 0) - (a.views || a.currentViews || 0));
        break;
      case 'confidence':
        filtered = [...filtered].sort((a: any, b: any) => (b.confidence?.composite || 0) - (a.confidence?.composite || 0));
        break;
      case 'performance':
        const perfOrder: Record<string, number> = { '🔥 Explosive': 0, '🚀 Viral': 1, '📈 Above Average': 2, '➖ Average': 3, '📉 Underperformed': 4, '💀 Dead': 5, 'Outlier': 0, 'Average': 3, 'Underperforming': 4 };
        filtered = [...filtered].sort((a: any, b: any) => (perfOrder[a.performanceGroup || a.performanceStatus] || 3) - (perfOrder[b.performanceGroup || b.performanceStatus] || 3));
        break;
      default: // date
        filtered = [...filtered].sort((a: any, b: any) => new Date(a.publishDate || a.uploadDate || 0).getTime() - new Date(b.publishDate || b.uploadDate || 0).getTime());
    }
    return filtered;
  }, [adv, performanceFilter, sortBy]);

  const performanceGroups = useMemo(() => {
    if (!adv) return [];
    return adv.performanceGroups || buildPerformanceGroups(adv.entries || adv.lifecycleTimeline || []);
  }, [adv]);

  const uniqueChannels = useMemo(() => {
    if (!adv) return [];
    const entries = adv.entries || adv.lifecycleTimeline || [];
    const map = new Map<string, any>();
    entries.forEach((s: any) => {
      const name = s.channelName;
      if (name && !map.has(name)) {
        map.set(name, { name, link: s.channelLink, thumbnail: s.channelThumbnail || s.thumbnail });
      }
    });
    return Array.from(map.values());
  }, [adv]);

  const allNeedsAnalysisCount = activeOutliers.filter((v: V2Video) => !v.advancedResearch || v.advancedResearch.lifecycleTimeline?.length === 5).length;

  // ===== Callbacks =====
  const toggleStageDetails = useCallback((idx: number) => {
    setExpandedStages(prev => ({ ...prev, [idx]: !prev[idx] }));
  }, []);

  const toggleExplainability = useCallback((idx: number) => {
    setExpandedExplainability(prev => ({ ...prev, [idx]: !prev[idx] }));
  }, []);

  const addVideoToSelection = useCallback(async (stage: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    let vId = `timeline-vid-${Date.now()}`;
    if (stage.videoLink) {
      const match = stage.videoLink.match(/[?&]v=([^&]+)/) || stage.videoLink.match(/youtu\.be\/([^?]+)/);
      if (match && match[1]) vId = match[1];
    } else if (stage.videoId) {
      vId = stage.videoId;
    }
    const currentOutliers = [...(activeSession?.filters?.outlierVideos || [])];
    if (!currentOutliers.some((v: V2Video) => v.id === vId)) {
      const newVideo: V2Video = {
        id: vId, videoId: vId,
        title: stage.videoTitle || stage.title || 'Unknown Video',
        thumbnail: stage.thumbnail || '',
        channelTitle: stage.channelName || 'Unknown Channel',
        viewCount: String(stage.currentViews || stage.views || 0),
        publishedAt: new Date(stage.uploadDate || stage.publishDate || Date.now()).toISOString(),
        url: stage.videoLink || `https://youtube.com/watch?v=${vId}`
      } as any;
      currentOutliers.push(newVideo);
      if (updateSessionState) await updateSessionState({ outlierVideos: currentOutliers });
    }
  }, [activeSession, updateSessionState]);

  const runAI = useCallback(async (vId: string) => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const currentOutliers = [...(activeSession?.filters?.outlierVideos || [])];
      const target = currentOutliers.find((v: V2Video) => v.id === vId);
      if (!target) throw new Error('Target video not found');

      const res = await fetch('/api/discovery-v2/outliers/timeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetVideo: target,
          allVideos: videos,
          searchLimit,
          similarityThreshold
        })
      });
      if (!res.ok) throw new Error('Failed to fetch evolution timeline data');
      const data = await res.json();

      const idx = currentOutliers.findIndex((v: V2Video) => v.id === vId);
      if (idx !== -1) {
        currentOutliers[idx] = { ...currentOutliers[idx], advancedResearch: data.advancedResearch };
      }
      if (updateSessionState) await updateSessionState({ outlierVideos: currentOutliers });
      if (setSelectedVideo) setSelectedVideo(currentOutliers[idx]);

      // Auto-save snapshot
      try {
        await fetch('/api/discovery-v2/outliers/snapshot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectName: activeSession?.projectName || 'Research Session',
            selectedVideo: target,
            channelInfo: { channelId: target.channelId || '', channelTitle: target.channelTitle || '', subscriberCount: '0' },
            appliedFilters: { similarityThreshold, searchLimit, performanceFilter, sortBy },
            timelineResult: data.advancedResearch,
            aiModelUsed: data.advancedResearch?.metadata?.aiModelUsed || 'AI Provider'
          })
        });
      } catch { /* Snapshot save failure is non-critical */ }

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to analyze video concept');
    } finally {
      setIsAnalyzing(false);
    }
  }, [activeSession, videos, searchLimit, similarityThreshold, performanceFilter, sortBy, updateSessionState, setSelectedVideo]);

  const runAllAI = useCallback(async () => {
    setIsAnalyzingAll(true);
    setError(null);
    try {
      const currentOutliers = [...(activeSession?.filters?.outlierVideos || [])];
      for (let i = 0; i < currentOutliers.length; i++) {
        const v = currentOutliers[i];
        if (!v.advancedResearch || v.advancedResearch.lifecycleTimeline?.length === 5) {
          const res = await fetch('/api/discovery-v2/outliers/timeline', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ targetVideo: v, allVideos: videos, searchLimit, similarityThreshold })
          });
          if (res.ok) {
            const data = await res.json();
            currentOutliers[i] = { ...v, advancedResearch: data.advancedResearch };
          }
        }
      }
      if (updateSessionState) await updateSessionState({ outlierVideos: currentOutliers });
      if (selectedVideo) {
        const updated = currentOutliers.find(v => v.id === selectedVideo.id);
        if (updated && setSelectedVideo) setSelectedVideo(updated);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to analyze all concepts');
    } finally {
      setIsAnalyzingAll(false);
    }
  }, [activeSession, videos, searchLimit, similarityThreshold, selectedVideo, updateSessionState, setSelectedVideo]);

  const loadSnapshots = useCallback(async () => {
    try {
      const vId = activeVideo?.id || activeVideo?.videoId;
      const url = vId ? `/api/discovery-v2/outliers/snapshot?videoId=${vId}` : '/api/discovery-v2/outliers/snapshot';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setSnapshots(data.snapshots || []);
      }
    } catch { /* ignore */ }
  }, [activeVideo]);

  const restoreSnapshot = useCallback(async (snapshotId: string) => {
    try {
      const res = await fetch(`/api/discovery-v2/outliers/snapshot?id=${snapshotId}`);
      if (!res.ok) return;
      const data = await res.json();
      const snap = data.snapshot;
      if (snap?.timelineResult && activeVideo) {
        const currentOutliers = [...(activeSession?.filters?.outlierVideos || [])];
        const idx = currentOutliers.findIndex((v: V2Video) => v.id === activeVideo.id);
        if (idx !== -1) {
          currentOutliers[idx] = { ...currentOutliers[idx], advancedResearch: snap.timelineResult };
          if (updateSessionState) await updateSessionState({ outlierVideos: currentOutliers });
          if (setSelectedVideo) setSelectedVideo(currentOutliers[idx]);
        }
      }
      setShowSnapshotsModal(false);
    } catch { /* ignore */ }
  }, [activeVideo, activeSession, updateSessionState, setSelectedVideo]);

  // ===== EMPTY STATE =====
  if (activeOutliers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-800/50 dark:to-gray-900/50 rounded-2xl border border-red-100 dark:border-gray-700 p-8 text-center border-dashed" role="status" aria-label="No videos selected">
        <Clock className="w-16 h-16 text-red-300 dark:text-gray-600 mb-4" />
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Videos Selected</h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-md">
          Select videos from the Outlier Videos tab to analyze the concept evolution timeline.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ===== BATCH HEADER BAR ===== */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div>
          <h4 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-red-500" /> Evolution Analytics Dashboard
          </h4>
          <p className="text-xs text-gray-500 mt-1">
            {allNeedsAnalysisCount > 0
              ? `${allNeedsAnalysisCount} of ${activeOutliers.length} concepts pending analysis.`
              : 'Timeline analysis completed for all selected concepts.'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => { setShowSnapshotsModal(true); loadSnapshots(); }}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-gray-200 dark:border-gray-600"
            aria-label="View research snapshots"
          >
            <History className="w-3.5 h-3.5" /> Snapshots
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-gray-200 dark:border-gray-600"
            aria-label="Toggle search settings"
          >
            <Filter className="w-3.5 h-3.5" /> Settings
          </button>
          <button
            onClick={runAllAI}
            disabled={isAnalyzingAll}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-md shadow-red-500/10 shrink-0"
            aria-label="Run all timeline analyses"
          >
            {isAnalyzingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 text-yellow-300" />}
            {isAnalyzingAll ? 'Analyzing All...' : `Run All (${activeOutliers.length})`}
          </button>
        </div>
      </div>

      {/* ===== SETTINGS PANEL ===== */}
      {showSettings && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 space-y-4 animate-in fade-in duration-200">
          <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Filter className="w-4 h-4 text-red-500" /> Search & Filter Settings
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Similarity Threshold</label>
              <select
                value={similarityThreshold}
                onChange={e => setSimilarityThreshold(parseFloat(e.target.value))}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-medium text-gray-900 dark:text-white"
                aria-label="Similarity threshold"
              >
                <option value="0.60">0.60 (Broad)</option>
                <option value="0.70">0.70 (Default)</option>
                <option value="0.80">0.80 (Strict)</option>
                <option value="0.90">0.90 (Very Strict)</option>
                <option value="0.95">0.95 (Ultra Strict)</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Search Limit</label>
              <select
                value={searchLimit}
                onChange={e => setSearchLimit(parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-medium text-gray-900 dark:text-white"
                aria-label="Search limit"
              >
                <option value="50">50 videos</option>
                <option value="100">100 videos</option>
                <option value="200">200 videos (Default)</option>
                <option value="500">500 videos</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Sort By</label>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as SortOption)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-medium text-gray-900 dark:text-white"
                aria-label="Sort order"
              >
                <option value="date">Publish Date</option>
                <option value="views">View Count</option>
                <option value="confidence">Confidence</option>
                <option value="performance">Performance Group</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Performance Filter</label>
              <select
                value={performanceFilter}
                onChange={e => setPerformanceFilter(e.target.value as PerformanceFilter)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-medium text-gray-900 dark:text-white"
                aria-label="Performance filter"
              >
                <option value="all">All Groups</option>
                <option value="🔥 Explosive">🔥 Explosive</option>
                <option value="🚀 Viral">🚀 Viral</option>
                <option value="📈 Above Average">📈 Above Average</option>
                <option value="➖ Average">➖ Average</option>
                <option value="📉 Underperformed">📉 Underperformed</option>
                <option value="💀 Dead">💀 Dead</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ===== ERROR BANNER ===== */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl flex items-center gap-3 text-red-700 dark:text-red-400 text-sm" role="alert">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* ===== VIDEO SELECTOR TABS ===== */}
      <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar" role="tablist" aria-label="Select video for analysis">
        {activeOutliers.map((video: V2Video) => {
          const isActive = video.id === activeVideo?.id;
          const isDone = video.advancedResearch && video.advancedResearch.lifecycleTimeline?.length > 5;
          return (
            <button
              key={video.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setSelectedVideo && setSelectedVideo(video)}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border shrink-0 ${
                isActive
                  ? 'bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900 dark:border-white shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700'
              }`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${isDone ? 'bg-green-500' : 'bg-yellow-400'}`} />
              <span className="max-w-[180px] truncate">{video.title}</span>
            </button>
          );
        })}
      </div>

      {/* ===== MAIN CONTENT ===== */}
      {activeVideo && (
        <div className="relative min-h-[400px]">
          {adv ? (
            <div className="space-y-6">

              {/* Low Confidence Banner */}
              {adv.confidenceScore !== undefined && adv.confidenceScore < 50 && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900/50 rounded-xl flex items-start gap-3 text-yellow-800 dark:text-yellow-400 text-xs" role="alert">
                  <ShieldAlert className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Low Confidence Match</span>
                    <span>The AI has low confidence in the semantic matching for this concept. Results may be approximate.</span>
                  </div>
                </div>
              )}

              {/* Metadata Banner */}
              {adv.metadata && (
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700 p-3 flex flex-wrap items-center gap-4 text-[10px] font-medium text-gray-500">
                  <span>📊 {adv.metadata.totalAfterFiltering || timelineEntries.length} results</span>
                  {adv.metadata.totalPagesSearched === 0 ? (
                    <span className="bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-400 px-2 py-0.5 rounded-md font-bold flex items-center gap-1"><ShieldAlert className="w-3 h-3" /> Live Data Failed - Showing AI Generated Fallback</span>
                  ) : (
                    <>
                      <span>📄 {adv.metadata.totalPagesSearched || 0} pages searched</span>
                      <span>🔍 {adv.metadata.totalCandidatesFound || 0} candidates found</span>
                      <span>⚙️ Threshold: {adv.metadata.similarityThreshold || similarityThreshold}</span>
                      <span>🤖 {adv.metadata.aiModelUsed || 'AI Provider'}</span>
                    </>
                  )}
                  <span>🕐 {adv.metadata.analysisTimestamp ? new Date(adv.metadata.analysisTimestamp).toLocaleString() : 'N/A'}</span>
                </div>
              )}

              {/* ===== TARGET VIDEO OVERVIEW ===== */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm flex flex-col md:flex-row gap-6 items-start">
                <img src={activeVideo.thumbnail} alt={activeVideo.title} className="w-full md:w-56 h-32 object-cover rounded-xl border border-gray-150 dark:border-gray-800 shadow-sm" />
                <div className="space-y-2 flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-400 px-2.5 py-1 rounded-md">Target Video</span>
                  <h3 className="text-xl font-extrabold text-gray-900 dark:text-white leading-tight">{activeVideo.title}</h3>
                  <p className="text-xs text-gray-500 font-medium">
                    Channel: <span className="font-bold text-gray-700 dark:text-gray-300">{activeVideo.channelTitle}</span> •
                    Views: <span className="font-bold text-gray-700 dark:text-gray-300">{parseInt(activeVideo.viewCount || '0').toLocaleString()}</span> •
                    Uploaded: {new Date(activeVideo.publishedAt).toLocaleDateString()}
                  </p>
                  <div className="pt-2 flex flex-wrap gap-2">
                    <button
                      onClick={() => runAI(activeVideo.id)}
                      disabled={isAnalyzing}
                      className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border border-gray-200 dark:border-gray-700"
                      aria-label="Regenerate timeline analysis"
                    >
                      {isAnalyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                      Regenerate Analysis
                    </button>
                  </div>
                </div>
              </div>

              {/* ===== COMPARISON MODE SELECTOR ===== */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                  <GitBranch className="w-3.5 h-3.5" /> Comparison Mode
                </div>
                <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Comparison mode">
                  {([
                    { value: 'previous', label: 'Previous Version', icon: '←' },
                    { value: 'earliest', label: 'Earliest Version', icon: '⏮' },
                    { value: 'best', label: 'Best Performing', icon: '🏆' },
                    { value: 'latest', label: 'Latest Version', icon: '⏭' }
                  ] as const).map(mode => (
                    <button
                      key={mode.value}
                      role="radio"
                      aria-checked={comparisonMode === mode.value}
                      onClick={() => setComparisonMode(mode.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        comparisonMode === mode.value
                          ? 'bg-red-600 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600'
                      }`}
                    >
                      {mode.icon} {mode.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ===== PERFORMANCE GROUP SUMMARY ===== */}
              {performanceGroups.length > 0 && (
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-red-500" /> Performance Groups
                    </h4>
                    {performanceFilter !== 'all' && (
                      <span className="text-[10px] font-bold text-gray-500">Filtered by: {performanceFilter}</span>
                    )}
                  </div>
                  <PerformanceGroupBar groups={performanceGroups} activeFilter={performanceFilter} onSelect={setPerformanceFilter} />
                </div>
              )}

              {/* ===== TWO COLUMN WORKSPACE ===== */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* LEFT: VERSION HISTORY TIMELINE (2 cols) */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-150 dark:border-gray-800">
                      <h4 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Clock className="w-5 h-5 text-red-500" /> Version History
                      </h4>
                      <span className="text-xs text-gray-500 font-medium">
                        {timelineEntries.length} entries • Sorted by {sortBy}
                      </span>
                    </div>

                    {/* Timeline entries */}
                    <div className="relative border-l-2 border-gray-200 dark:border-gray-800 ml-4 space-y-6">
                      {timelineEntries.map((stage: any, idx: number) => {
                        const perf = stage.performanceGroup || stage.performanceStatus || 'Average';
                        const isExplosive = perf.includes('Explosive') || perf.includes('Viral') || perf === 'Outlier';

                        let dotColor = 'bg-blue-500';
                        if (isExplosive) dotColor = 'bg-red-500';
                        else if (stage.versionLabel === 'Original Concept' || stage.stageName?.toLowerCase().includes('origin')) dotColor = 'bg-green-500';
                        else if (perf.includes('Dead') || perf.includes('Underperformed') || perf === 'Underperforming') dotColor = 'bg-gray-400';
                        else dotColor = 'bg-blue-500';

                        const showDetails = !!expandedStages[idx];
                        const showExplain = !!expandedExplainability[idx];
                        const views = stage.views || stage.currentViews || 0;

                        return (
                          <div key={idx} className={`ml-8 relative p-5 rounded-2xl border shadow-sm transition-all hover:shadow-md ${
                            isExplosive
                              ? 'bg-red-50/10 dark:bg-red-950/5 border-red-200 dark:border-red-900/30 hover:border-red-300'
                              : 'bg-gray-50 dark:bg-gray-850/30 border-gray-200 dark:border-gray-800 hover:border-gray-300'
                          }`}>
                            {/* Dot */}
                            <span className={`absolute flex items-center justify-center w-6 h-6 rounded-full -left-[45px] top-6 ring-4 ring-white dark:ring-gray-900 ${dotColor}`}>
                              <span className="w-2.5 h-2.5 rounded-full bg-white" />
                            </span>

                            {/* Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                              <div>
                                <h3 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                                  {stage.stageName || stage.versionLabel || `Entry ${idx + 1}`}
                                </h3>
                                <div className="flex flex-wrap gap-2 items-center text-[10px] text-gray-400 mt-1 font-medium">
                                  <span>{stage.uploadDate || (stage.publishDate && stage.publishDate.split('T')[0])}</span>
                                  <span>•</span>
                                  <span>{stage.timeSinceUpload || 'Recent'}</span>
                                  {stage.language && (
                                    <>
                                      <span>•</span>
                                      <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> {stage.language} {stage.country ? `(${stage.country})` : ''}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-1.5 self-start sm:self-center">
                                {/* Version Label Badge */}
                                {stage.versionLabel && (
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getVersionLabelClasses(stage.versionLabel)}`}>
                                    {stage.versionLabel}
                                  </span>
                                )}
                                {/* Performance Badge */}
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getPerformanceGroupBadgeClasses(perf)}`}>
                                  {perf}
                                </span>
                              </div>
                            </div>

                            {/* Confidence Meters */}
                            {stage.confidence && (
                              <div className="flex flex-wrap gap-3 mb-3">
                                <ConfidenceMeter label="AI" level={stage.confidence.ai || 'Medium'} icon={getConfidenceIcon(stage.confidence.ai || 'Medium')} />
                                <ConfidenceMeter label="Semantic" level={stage.confidence.semantic || 'Medium'} icon={getConfidenceIcon(stage.confidence.semantic || 'Medium')} />
                                <ConfidenceMeter label="Timeline" level={stage.confidence.timeline || 'Medium'} icon={getConfidenceIcon(stage.confidence.timeline || 'Medium')} />
                                <ConfidenceMeter label="Search" level={stage.confidence.search || 'Medium'} icon={getConfidenceIcon(stage.confidence.search || 'Medium')} />
                                {stage.confidence.composite && (
                                  <div className="flex items-center gap-1.5 text-[10px]" title={`Composite: ${stage.confidence.composite}%`}>
                                    <Gauge className="w-3 h-3 text-gray-400" />
                                    <span className="font-bold text-gray-700 dark:text-gray-300">{stage.confidence.composite}%</span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Video Card */}
                            <div className="mb-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden flex transition-all hover:border-gray-300 dark:hover:border-gray-600">
                              <button
                                onClick={() => toggleStageDetails(idx)}
                                className="flex gap-4 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition group flex-1 min-w-0 text-left items-center"
                                aria-expanded={showDetails}
                              >
                                <div className="relative shrink-0">
                                  <img src={stage.thumbnail || `https://i.ytimg.com/vi/${stage.videoId}/hqdefault.jpg`} className="w-24 h-14 object-cover rounded-lg bg-gray-100 border border-gray-100 dark:border-gray-850" alt="" />
                                  <a href={stage.videoLink || `https://youtube.com/watch?v=${stage.videoId}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="absolute -bottom-1 -right-1 bg-black/70 hover:bg-red-600 text-white p-1 rounded-md transition-colors shadow-sm" title="Watch on YouTube">
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                </div>
                                <div className="min-w-0 flex-1 flex flex-col justify-between py-0.5">
                                  <p className="text-xs font-extrabold text-gray-900 dark:text-white line-clamp-2 group-hover:text-red-600 transition-colors leading-tight">
                                    {stage.videoTitle || stage.title}
                                  </p>
                                  <div className="text-[10px] text-gray-500 flex flex-wrap gap-x-2 gap-y-1 mt-1">
                                    <span>By <span className="font-bold text-gray-700 dark:text-gray-300">{stage.channelName}</span></span>
                                    {stage.subscriberCount > 0 && <span>({(stage.subscriberCount / 1000).toFixed(0)}k subs)</span>}
                                  </div>
                                </div>
                                <div className="shrink-0 text-gray-400 group-hover:text-red-500">
                                  {showDetails ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                </div>
                              </button>
                              <button
                                onClick={(e) => addVideoToSelection(stage, e)}
                                title="Add to Outlier Selection"
                                className="flex flex-col items-center justify-center px-4 border-l border-gray-200 dark:border-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors text-gray-400 dark:text-gray-500"
                                aria-label="Add video to selection"
                              >
                                <Plus className="w-5 h-5 mb-0.5" />
                                <span className="text-[9px] font-bold uppercase tracking-wider">Select</span>
                              </button>
                            </div>

                            {/* Stats Row */}
                            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-3 text-[10px] font-bold text-gray-600 dark:text-gray-400">
                              <div className="bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-150 dark:border-gray-700 text-center">
                                <span className="block text-gray-400 font-medium">Views</span>
                                <span className="text-gray-900 dark:text-white text-xs">{formatViewCount(views)}</span>
                              </div>
                              <div className="bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-150 dark:border-gray-700 text-center">
                                <span className="block text-gray-400 font-medium">Views/Day</span>
                                <span className="text-gray-900 dark:text-white text-xs">{validateMetric(stage.metrics?.viewsPerDay || stage.viewsPerDay)}</span>
                              </div>
                              <div className="bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-150 dark:border-gray-700 text-center">
                                <span className="block text-gray-400 font-medium">Engagement</span>
                                <span className="text-gray-900 dark:text-white text-xs">{validateMetric(stage.metrics?.engagementRate)}</span>
                              </div>
                              <div className="bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-150 dark:border-gray-700 text-center hidden sm:block">
                                <span className="block text-gray-400 font-medium">Retention</span>
                                <span className="text-gray-900 dark:text-white text-xs">{validateMetric(stage.metrics?.audienceRetention)}</span>
                              </div>
                              <div className="bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-150 dark:border-gray-700 text-center hidden sm:block">
                                <span className="block text-gray-400 font-medium">CTR</span>
                                <span className="text-gray-900 dark:text-white text-xs">{validateMetric(stage.metrics?.ctr)}</span>
                              </div>
                            </div>

                            {/* Similarity Scores (if available) */}
                            {stage.similarity && (
                              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 mb-3">
                                {['topic', 'intent', 'story', 'audience', 'overall'].map(key => (
                                  <div key={key} className="text-center text-[10px]">
                                    <span className="text-gray-400 capitalize block">{key}</span>
                                    <span className={`font-bold ${(stage.similarity[key] || 0) >= 0.85 ? 'text-green-600 dark:text-green-400' : (stage.similarity[key] || 0) >= 0.65 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
                                      {Math.round((stage.similarity[key] || 0) * 100)}%
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* AI Explainability Toggle */}
                            {stage.aiExplainability && (
                              <div className="mb-3">
                                <button
                                  onClick={() => toggleExplainability(idx)}
                                  className="w-full flex items-center justify-center gap-1.5 py-2 bg-violet-50 dark:bg-violet-950/20 hover:bg-violet-100 dark:hover:bg-violet-900/30 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800/50 rounded-xl text-xs font-bold transition"
                                  aria-expanded={showExplain}
                                  aria-label="Toggle AI Explainability"
                                >
                                  <Brain className="w-3.5 h-3.5" />
                                  {showExplain ? 'Hide AI Explainability' : 'Why AI Selected This'}
                                  {showExplain ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </button>
                                {showExplain && (
                                  <div className="mt-2 animate-in fade-in duration-200">
                                    <AIExplainabilityPanel data={stage.aiExplainability} />
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Details Toggle */}
                            <button
                              onClick={() => toggleStageDetails(idx)}
                              className="w-full flex items-center justify-center gap-1.5 py-2 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold transition"
                              aria-expanded={showDetails}
                              aria-label="Toggle content analysis details"
                            >
                              {showDetails ? (
                                <>Hide Analysis <ChevronUp className="w-4 h-4" /></>
                              ) : (
                                <>View Content Analysis & Evolution <ChevronDown className="w-4 h-4" /></>
                              )}
                            </button>

                            {/* Expanded Details */}
                            {showDetails && (
                              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4 text-xs animate-in fade-in duration-200">
                                {/* Content Analysis */}
                                <div className="space-y-2">
                                  <h4 className="font-extrabold text-xs text-red-600 dark:text-red-400 uppercase tracking-wider flex items-center gap-1">
                                    <Video className="w-3.5 h-3.5" /> Content Elements Analysis
                                  </h4>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {[
                                      { label: 'Hook Structure', value: stage.contentAnalysis?.hook },
                                      { label: 'Thumbnail Formula', value: stage.contentAnalysis?.thumbnailFormula },
                                      { label: 'Title Pattern', value: stage.contentAnalysis?.titleFormula },
                                      { label: 'Story Arc & Flow', value: stage.contentAnalysis?.storyStructure },
                                      { label: 'Editing & Visual Pacing', value: stage.contentAnalysis?.editingStyle },
                                      { label: 'CTA & Retention Loop', value: stage.contentAnalysis?.cta },
                                      { label: 'Pattern Interrupts & Triggers', value: `${stage.contentAnalysis?.patternInterrupts || ''} • ${stage.contentAnalysis?.emotionalTriggers || ''}` },
                                      { label: 'Est. AVD / USP', value: `AVD: ${stage.contentAnalysis?.estimatedAVD || 'Unavailable'} | ${stage.contentAnalysis?.uniqueSellingPoint || 'Unavailable'}` }
                                    ].map((item, i) => (
                                      <div key={i} className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                                        <span className="font-bold text-gray-500 block mb-1">{item.label}</span>
                                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed font-medium">{item.value || 'Unavailable'}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Evolution Comparison */}
                                <div className="space-y-2">
                                  <h4 className="font-extrabold text-xs text-orange-600 dark:text-orange-400 uppercase tracking-wider flex items-center gap-1">
                                    <Activity className="w-3.5 h-3.5" /> Evolution Comparison ({comparisonMode === 'previous' ? 'vs Previous' : comparisonMode === 'earliest' ? 'vs Earliest' : comparisonMode === 'best' ? 'vs Best' : 'vs Latest'})
                                  </h4>
                                  <div className="bg-orange-50/50 dark:bg-orange-950/10 border border-orange-100 dark:border-orange-900/30 p-4 rounded-xl space-y-2">
                                    <div>
                                      <span className="font-bold text-gray-500 block">What Changed & Improved:</span>
                                      <p className="text-gray-850 dark:text-gray-200 font-medium">{stage.evolutionCompare?.whatChanged || 'Unavailable'} • {stage.evolutionCompare?.whatImproved || 'Unavailable'}</p>
                                    </div>
                                    {stage.evolutionCompare?.whatWorse && stage.evolutionCompare?.whatWorse !== 'N/A' && (
                                      <div>
                                        <span className="font-bold text-gray-500 block">What Became Worse:</span>
                                        <p className="text-gray-850 dark:text-gray-200 font-medium">{stage.evolutionCompare.whatWorse}</p>
                                      </div>
                                    )}
                                    <div>
                                      <span className="font-bold text-gray-500 block">Performance Impact:</span>
                                      <p className="text-gray-900 dark:text-white font-extrabold">{stage.evolutionCompare?.whyPerformanceImpact || 'Unavailable'}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* RIGHT SIDEBAR */}
                <div className="space-y-6">

                  {/* Opportunity Score */}
                  {adv.opportunity && (
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm space-y-4">
                      <h4 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Lightbulb className="w-5 h-5 text-yellow-500" /> Opportunity Score
                      </h4>
                      <div className="flex items-center justify-center">
                        <div className={`w-24 h-24 rounded-full border-4 flex items-center justify-center ${
                          (adv.opportunity.opportunityScore || 0) >= 70 ? 'border-green-500' :
                          (adv.opportunity.opportunityScore || 0) >= 40 ? 'border-yellow-500' : 'border-red-500'
                        }`}>
                          <span className="text-2xl font-extrabold text-gray-900 dark:text-white">{adv.opportunity.opportunityScore || 'N/A'}</span>
                        </div>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between"><span className="text-gray-400">Lifecycle</span><span className="font-bold text-gray-900 dark:text-white">{adv.opportunity.conceptLifecycle || 'Unknown'}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Trend</span><span className="font-bold text-gray-900 dark:text-white">{adv.opportunity.trendPrediction || 'Unknown'}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Competition</span><span className="font-bold text-gray-900 dark:text-white">{adv.opportunity.competitionDensity || 0}%</span></div>
                      </div>
                      {adv.opportunity.missingOpportunities?.length > 0 && (
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                          <span className="text-[10px] font-bold text-gray-500 uppercase block mb-2">Missing Opportunities</span>
                          <ul className="space-y-1">
                            {adv.opportunity.missingOpportunities.map((opp: string, i: number) => (
                              <li key={i} className="text-[11px] text-gray-600 dark:text-gray-400 flex items-start gap-1.5">
                                <span className="text-yellow-500 mt-0.5">•</span> {opp}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Saturation Dashboard */}
                  <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm space-y-4">
                    <h4 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <Target className="w-5 h-5 text-red-500" /> Saturation Dashboard
                    </h4>
                    <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-800 p-3.5 rounded-xl border border-gray-150 dark:border-gray-700">
                      <span className="text-xs text-gray-500 font-bold">Level</span>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                        adv.saturation?.saturationLevel === 'Low' ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400' :
                        adv.saturation?.saturationLevel === 'Medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400' :
                        'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                      }`}>{adv.saturation?.saturationLevel || 'Medium'}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <button onClick={() => setShowChannelsModal(true)} className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-150 dark:border-gray-700 hover:border-red-400 transition-all text-left group">
                        <span className="text-gray-400 font-medium block group-hover:text-red-500">Channels</span>
                        <span className="text-gray-900 dark:text-white font-extrabold text-base">{adv.saturation?.totalChannels || uniqueChannels.length}</span>
                      </button>
                      <button onClick={() => setShowVideosModal(true)} className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-150 dark:border-gray-700 hover:border-red-400 transition-all text-left group">
                        <span className="text-gray-400 font-medium block group-hover:text-red-500">Videos</span>
                        <span className="text-gray-900 dark:text-white font-extrabold text-base">{adv.saturation?.totalVideos || timelineEntries.length}</span>
                      </button>
                    </div>
                    <div className="text-xs space-y-2 bg-gray-50 dark:bg-gray-800 p-3.5 rounded-xl border border-gray-150 dark:border-gray-700">
                      <div className="flex justify-between"><span className="text-gray-400">Competition:</span><span className="font-bold text-gray-900 dark:text-white">{adv.saturation?.competitionLevel || 'Medium'}</span></div>
                      <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                        <span className="text-gray-400 font-medium block mb-1">Languages:</span>
                        <p className="font-bold text-gray-900 dark:text-white">{adv.saturation?.languagesCovered?.join(', ') || 'English'}</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed font-medium bg-red-50/30 dark:bg-red-950/10 p-3 rounded-xl border border-red-100 dark:border-red-950/20">
                      {adv.saturation?.explanation || 'Analysis pending.'}
                    </p>
                  </div>

                  {/* Concept History */}
                  <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm space-y-4">
                    <h4 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-red-500" /> Concept History
                    </h4>
                    <div className="space-y-4 text-xs">
                      {[
                        { label: 'Pioneered By', value: adv.conceptHistory?.firstMover },
                        { label: 'Originality', value: adv.conceptHistory?.originality },
                        { label: 'Viral Instigator', value: adv.conceptHistory?.viralInstigator },
                        { label: 'Best Iteration', value: adv.conceptHistory?.bestImprover },
                        { label: 'Dominant Creator', value: adv.conceptHistory?.strongestVersionOwner }
                      ].map((item, i) => (
                        <div key={i} className={i > 0 ? 'flex justify-between border-t border-gray-100 dark:border-gray-800 pt-2' : ''}>
                          {i === 0 ? (
                            <div>
                              <span className="text-gray-400 font-medium block">{item.label}:</span>
                              <span className="font-extrabold text-gray-900 dark:text-white">{item.value || 'Unknown'}</span>
                            </div>
                          ) : (
                            <><span className="text-gray-400 font-medium">{item.label}:</span><span className="font-bold text-gray-900 dark:text-white">{item.value || 'Unknown'}</span></>
                          )}
                        </div>
                      ))}
                      <p className="text-xs text-gray-500 mt-2 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg leading-relaxed font-medium">
                        {adv.conceptHistory?.historySummary || 'Analysis pending.'}
                      </p>
                    </div>
                  </div>

                  {/* Evolution Summary */}
                  {adv.evolutionSummary && (
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 rounded-2xl border border-indigo-200 dark:border-indigo-800/50 p-6 shadow-sm space-y-4">
                      <h4 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-indigo-500" /> Evolution Summary
                      </h4>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="text-center"><span className="block text-gray-400">Major Versions</span><span className="text-xl font-extrabold text-gray-900 dark:text-white">{adv.evolutionSummary.totalMajorVersions || 0}</span></div>
                        <div className="text-center"><span className="block text-gray-400">Concept Age</span><span className="text-sm font-extrabold text-gray-900 dark:text-white">{adv.evolutionSummary.conceptAge || 'Unknown'}</span></div>
                      </div>
                      <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                        {adv.evolutionSummary.narrative || 'Evolution narrative pending.'}
                      </p>
                      {adv.evolutionSummary.biggestImprovements?.length > 0 && (
                        <div>
                          <span className="text-[10px] font-bold text-gray-500 uppercase">Key Improvements</span>
                          <ul className="mt-1 space-y-1">
                            {adv.evolutionSummary.biggestImprovements.map((imp: string, i: number) => (
                              <li key={i} className="text-[11px] text-gray-600 dark:text-gray-400 flex items-start gap-1.5">
                                <span className="text-green-500 mt-0.5">✓</span> {imp}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Content Gaps */}
                  <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm space-y-4">
                    <h4 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <Compass className="w-5 h-5 text-red-500" /> Content Gaps
                    </h4>
                    <div className="space-y-3 text-xs leading-relaxed">
                      {[
                        { label: 'Missing Angles', value: adv.contentGaps?.missingAngles },
                        { label: 'Unresolved Questions', value: adv.contentGaps?.missingQuestions },
                        { label: 'Missing Case Studies', value: adv.contentGaps?.missingCaseStudies },
                        { label: 'Untried Hooks', value: adv.contentGaps?.missingHooks }
                      ].filter(i => i.value && i.value !== 'Unavailable').map((item, i) => (
                        <div key={i} className={i > 0 ? 'border-t border-gray-100 dark:border-gray-850 pt-2.5' : ''}>
                          <span className="font-extrabold text-gray-650 dark:text-gray-400 block">{item.label}:</span>
                          <p className="text-gray-700 dark:text-gray-300 font-medium">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm space-y-4">
                    <h4 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <Award className="w-5 h-5 text-red-500" /> Recommendations
                    </h4>
                    <div className="space-y-4 text-xs leading-relaxed">
                      {adv.finalRecommendations?.hookSuggestions && (
                        <div>
                          <span className="font-bold text-red-600 dark:text-red-400 block mb-1">Hook Direction:</span>
                          <p className="bg-red-50/50 dark:bg-red-950/10 p-2.5 rounded-lg border border-red-100 dark:border-red-900/30 text-gray-700 dark:text-gray-300 font-medium whitespace-pre-line">
                            {adv.finalRecommendations.hookSuggestions}
                          </p>
                        </div>
                      )}
                      {adv.finalRecommendations?.uniqueAngle && (
                        <div>
                          <span className="font-bold text-gray-900 dark:text-white block">Unique Angle:</span>
                          <p className="text-gray-700 dark:text-gray-300 font-medium mt-1">{adv.finalRecommendations.uniqueAngle}</p>
                        </div>
                      )}
                      {adv.finalRecommendations?.audienceExpectations && (
                        <div className="bg-gray-50 dark:bg-gray-800 p-3.5 rounded-xl border border-gray-150 dark:border-gray-700">
                          <span className="font-bold text-gray-900 dark:text-white block mb-1.5 flex items-center gap-1.5">
                            <Award className="w-4 h-4 text-yellow-500" /> Audience Expectations
                          </span>
                          <p className="text-gray-600 dark:text-gray-400 font-medium">{adv.finalRecommendations.audienceExpectations}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ===== EMPTY STATE – Run Analysis ===== */
            <div className="absolute inset-0 bg-white dark:bg-gray-900/90 backdrop-blur-[2px] flex flex-col items-center justify-center z-25 transition-all rounded-2xl py-12 border border-gray-200 dark:border-gray-700">
              {isAnalyzing ? (
                <div className="text-center space-y-4">
                  <Loader2 className="w-12 h-12 text-red-500 animate-spin mx-auto" />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Analyzing Concept Evolution...</h3>
                  <p className="text-gray-500 mt-1 text-sm">Searching YouTube ecosystem for semantic matches...</p>
                  <div className="flex gap-2 justify-center">
                    {[0, 1, 2].map(i => (
                      <SkeletonCard key={i} />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center p-8 max-w-md">
                  <div className="bg-red-50 dark:bg-red-900/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 shadow-sm">
                    <Compass className="w-8 h-8 text-red-600" />
                  </div>
                  <h3 className="text-xl font-extrabold text-gray-900 dark:text-white mb-2">Run Deep Timeline Analysis</h3>
                  <p className="text-gray-500 text-sm mb-4 leading-relaxed">
                    Discover the complete evolution of this concept across YouTube. Find the original creator, viral triggers, performance patterns, and untapped opportunities.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center text-[10px] text-gray-400 mb-6">
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">Recursive Discovery</span>
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">AI Analysis</span>
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">Performance Groups</span>
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">Version History</span>
                  </div>
                  <button
                    onClick={() => runAI(activeVideo.id)}
                    className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-500/25 transition-all text-sm"
                    aria-label="Run timeline analysis"
                  >
                    Run Analysis
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ===== CHANNELS MODAL ===== */}
      {showChannelsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" role="dialog" aria-modal="true" aria-label="Channels modal">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden">
            <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><Video className="w-6 h-6 text-red-500" /> Channels</h3>
              <button onClick={() => setShowChannelsModal(false)} className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition" aria-label="Close"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 overflow-y-auto custom-scrollbar flex-1 space-y-3">
              {uniqueChannels.map((ch: any, i: number) => (
                <a key={i} href={ch.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-3 rounded-xl border border-gray-150 dark:border-gray-700/60 hover:border-red-300 hover:bg-red-50/30 dark:hover:border-red-900/50 dark:hover:bg-red-900/10 transition group">
                  <img src={ch.thumbnail || `https://ui-avatars.com/api/?name=${encodeURIComponent(ch.name)}`} alt={ch.name} className="w-12 h-12 rounded-full object-cover shadow-sm bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700" />
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-red-600 dark:group-hover:text-red-400 transition">{ch.name}</h4>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><ExternalLink className="w-3 h-3" /> Visit Channel</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== VIDEOS MODAL ===== */}
      {showVideosModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" role="dialog" aria-modal="true" aria-label="Videos modal">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><Video className="w-6 h-6 text-red-500" /> All Timeline Videos</h3>
              <button onClick={() => setShowVideosModal(false)} className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition" aria-label="Close"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 overflow-y-auto custom-scrollbar flex-1 space-y-3">
              {timelineEntries.map((stage: any, i: number) => {
                const perf = stage.performanceGroup || stage.performanceStatus;
                const isOutlier = perf?.includes('Explosive') || perf?.includes('Viral') || perf === 'Outlier';
                return (
                  <div key={i} className={`flex items-stretch rounded-xl border transition overflow-hidden shadow-sm group ${isOutlier ? 'border-red-200 dark:border-red-900/50 bg-red-50/10 dark:bg-red-950/10' : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-850'}`}>
                    <a href={stage.videoLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-3 flex-1 min-w-0 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                      <img src={stage.thumbnail || `https://i.ytimg.com/vi/${stage.videoId}/hqdefault.jpg`} alt={stage.videoTitle || stage.title} className="w-24 h-14 rounded-lg object-cover shadow-sm bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-bold truncate text-sm transition ${isOutlier ? 'text-red-700 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'}`}>{stage.videoTitle || stage.title}</h4>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1 truncate">{stage.channelName} • {stage.timeSinceUpload}</p>
                      </div>
                      <div className="shrink-0 text-right pr-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getPerformanceGroupBadgeClasses(perf)}`}>{perf}</span>
                      </div>
                    </a>
                    <button
                      onClick={(e) => addVideoToSelection(stage, e)}
                      title="Add to Outlier Selection"
                      className="flex flex-col items-center justify-center px-4 border-l border-gray-200 dark:border-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-600 transition-colors"
                      aria-label="Add to selection"
                    >
                      <Plus className="w-5 h-5 mb-0.5" />
                      <span className="text-[9px] font-bold uppercase tracking-wider">Select</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ===== SNAPSHOTS MODAL ===== */}
      {showSnapshotsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" role="dialog" aria-modal="true" aria-label="Research snapshots">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden">
            <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><History className="w-6 h-6 text-red-500" /> Research Snapshots</h3>
              <button onClick={() => setShowSnapshotsModal(false)} className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition" aria-label="Close"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 overflow-y-auto custom-scrollbar flex-1 space-y-3">
              {snapshots.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No snapshots saved yet. Run an analysis to auto-save a snapshot.</p>
                </div>
              ) : (
                snapshots.map((snap: any) => (
                  <button
                    key={snap.id}
                    onClick={() => restoreSnapshot(snap.id)}
                    className="w-full text-left p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-800 hover:bg-red-50/30 dark:hover:bg-red-900/10 transition group"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-gray-900 dark:text-white text-sm group-hover:text-red-600 transition">{snap.videoTitle || 'Untitled'}</h4>
                      <span className="text-[10px] text-gray-400">{snap.totalEntries || 0} entries</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{snap.channelTitle} • {new Date(snap.timestamp).toLocaleString()}</p>
                    <p className="text-[10px] text-gray-400 mt-1">Model: {snap.aiModelUsed || 'Unknown'}</p>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
