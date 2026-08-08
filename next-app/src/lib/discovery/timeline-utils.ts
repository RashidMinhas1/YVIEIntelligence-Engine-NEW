/**
 * Timeline Engine Utilities
 * Shared logic for performance bucketing, confidence scoring, version labeling,
 * duplicate detection, and data validation.
 */

// ==================== PERFORMANCE BUCKETING ====================

type PerformanceGroup = '🔥 Explosive' | '🚀 Viral' | '📈 Above Average' | '➖ Average' | '📉 Underperformed' | '💀 Dead';
type VersionLabel = 'Original Concept' | 'Earliest Known Version' | 'Improved Version' | 'Alternative Angle' | 'Trend Adaptation' | 'Evergreen' | 'Updated' | 'Beginner' | 'Advanced';

export function computePerformanceGroup(views: number, medianViews: number): PerformanceGroup {
  if (medianViews <= 0) return '➖ Average';
  const ratio = views / medianViews;
  if (ratio >= 3.0) return '🔥 Explosive';
  if (ratio >= 1.5) return '🚀 Viral';
  if (ratio > 1.0) return '📈 Above Average';
  if (ratio >= 0.5) return '➖ Average';
  if (ratio > 0.2) return '📉 Underperformed';
  return '💀 Dead';
}

export function getPerformanceGroupColor(group: PerformanceGroup): string {
  switch (group) {
    case '🔥 Explosive': return 'from-red-500 to-orange-500';
    case '🚀 Viral': return 'from-orange-400 to-yellow-400';
    case '📈 Above Average': return 'from-green-400 to-emerald-400';
    case '➖ Average': return 'from-blue-400 to-sky-400';
    case '📉 Underperformed': return 'from-purple-400 to-violet-400';
    case '💀 Dead': return 'from-gray-400 to-gray-500';
    default: return 'from-gray-400 to-gray-500';
  }
}

export function getPerformanceGroupBadgeClasses(group: PerformanceGroup): string {
  switch (group) {
    case '🔥 Explosive': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800';
    case '🚀 Viral': return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800';
    case '📈 Above Average': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800';
    case '➖ Average': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800';
    case '📉 Underperformed': return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800';
    case '💀 Dead': return 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700';
    default: return 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700';
  }
}

export function buildPerformanceGroups(entries: any[]): any[] {
  const groupOrder: PerformanceGroup[] = ['🔥 Explosive', '🚀 Viral', '📈 Above Average', '➖ Average', '📉 Underperformed', '💀 Dead'];
  const grouped = new Map<PerformanceGroup, any[]>();
  groupOrder.forEach(g => grouped.set(g, []));
  entries.forEach(e => {
    const list = grouped.get(e.performanceGroup) || [];
    list.push(e);
    grouped.set(e.performanceGroup, list);
  });
  return groupOrder.map(group => {
    const list = grouped.get(group) || [];
    const avgViews = list.length > 0 ? Math.round(list.reduce((s: number, e: any) => s + (e.views || 0), 0) / list.length) : 0;
    const avgEngagement = list.length > 0 ? Math.round(list.reduce((s: number, e: any) => s + ((e.likes || 0) + (e.comments || 0)), 0) / list.length) : 0;
    return {
      group,
      totalVideos: list.length,
      avgViews,
      avgEngagement,
      growthTrend: list.length > 0 ? (avgViews > 50000 ? 'Growing' : avgViews > 10000 ? 'Stable' : 'Declining') : 'N/A',
      entries: list
    };
  }).filter(g => g.totalVideos > 0);
}

// ==================== CONFIDENCE SCORING ====================

export function computeConfidenceLevel(score: number): 'High' | 'Medium' | 'Low' {
  if (score >= 0.85) return 'High';
  if (score >= 0.65) return 'Medium';
  return 'Low';
}

export function computeCompositeConfidence(confidence: { ai: string; semantic: string; search: string; timeline: string }): number {
  const weights = { ai: 0.4, semantic: 0.3, search: 0.2, timeline: 0.1 };
  const levelToScore = (level: string) => level === 'High' ? 95 : level === 'Medium' ? 75 : 45;
  return Math.round(
    levelToScore(confidence.ai) * weights.ai +
    levelToScore(confidence.semantic) * weights.semantic +
    levelToScore(confidence.search) * weights.search +
    levelToScore(confidence.timeline) * weights.timeline
  );
}

export function getConfidenceBadgeClasses(level: 'High' | 'Medium' | 'Low'): string {
  switch (level) {
    case 'High': return 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300';
    case 'Medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300';
    case 'Low': return 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300';
  }
}

export function getConfidenceIcon(level: 'High' | 'Medium' | 'Low'): string {
  switch (level) {
    case 'High': return '🟢';
    case 'Medium': return '🟡';
    case 'Low': return '🔴';
  }
}

// ==================== VERSION LABELING ====================

export function getVersionLabelClasses(label: VersionLabel): string {
  switch (label) {
    case 'Original Concept': return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800';
    case 'Earliest Known Version': return 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-950 dark:text-teal-300 dark:border-teal-800';
    case 'Improved Version': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800';
    case 'Alternative Angle': return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800';
    case 'Trend Adaptation': return 'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-950 dark:text-pink-300 dark:border-pink-800';
    case 'Evergreen': return 'bg-lime-100 text-lime-800 border-lime-200 dark:bg-lime-950 dark:text-lime-300 dark:border-lime-800';
    case 'Updated': return 'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-950 dark:text-cyan-300 dark:border-cyan-800';
    case 'Beginner': return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800';
    case 'Advanced': return 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800';
    default: return 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700';
  }
}

// ==================== DUPLICATE DETECTION ====================

export function detectDuplicateGroups(entries: any[]): any[] {
  const groups: any[] = [];
  const visited = new Set<string>();
  for (let i = 0; i < entries.length; i++) {
    if (visited.has(entries[i].videoId)) continue;
    const duplicates: any[] = [];
    for (let j = i + 1; j < entries.length; j++) {
      if (visited.has(entries[j].videoId)) continue;
      const sim = entries[i].similarity;
      const sim2 = entries[j].similarity;
      if (sim && sim2 && sim.topic >= 0.92 && sim2.topic >= 0.92 && sim.intent >= 0.92 && sim2.intent >= 0.92) {
        duplicates.push(entries[j]);
        visited.add(entries[j].videoId);
      }
    }
    if (duplicates.length > 0) {
      visited.add(entries[i].videoId);
      groups.push({
        id: `dup-${entries[i].videoId}`,
        primaryEntry: entries[i],
        duplicates,
        reason: 'High topic & intent similarity (≥92%)'
      });
    }
  }
  return groups;
}

// ==================== DYNAMIC THRESHOLD ====================

export function computeDynamicThreshold(scores: number[], baseThreshold: number): number {
  if (scores.length < 3) return baseThreshold;
  const mean = scores.reduce((s, v) => s + v, 0) / scores.length;
  const variance = scores.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / scores.length;
  const stdDev = Math.sqrt(variance);
  const adjustment = stdDev < 0.1 ? 0.05 : stdDev > 0.25 ? -0.05 : 0;
  return Math.max(0.60, Math.min(0.95, baseThreshold + adjustment));
}

// ==================== MEDIAN COMPUTATION ====================

export function computeMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// ==================== DATA VALIDATION ====================

export function validateMetric(value: any, label: string = 'Unavailable'): string {
  if (value === undefined || value === null || value === '' || value === 0) return label;
  if (typeof value === 'number') return value.toLocaleString();
  return String(value);
}

export function formatViewCount(views: number): string {
  if (views >= 1000000) return (views / 1000000).toFixed(1) + 'M';
  if (views >= 1000) return (views / 1000).toFixed(1) + 'K';
  return views.toLocaleString();
}

export function formatTimeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days > 365) return Math.floor(days / 365) + ' years ago';
  if (days > 30) return Math.floor(days / 30) + ' months ago';
  if (days > 0) return days + ' days ago';
  return 'Today';
}
