import React, { useState, useEffect } from "react";
import { useSession } from "@/components/dashboard/session-context";
import { 
  Brain, Search, Zap, CheckCircle, Target, GitMerge, FileText, ArrowRight,
  Settings, Globe, Percent, Activity, BarChart2, Plus, ExternalLink, Play, 
  Users, Lightbulb, PieChart, Layers
} from "lucide-react";

// Types
interface Fingerprint {
  topic: string;
  intent: string;
  audience: string;
  angle: string;
}

interface MatchResult {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  matchType: "Strong Match" | "Related Concept";
  topicMatch: number;
  intentMatch: number;
  conceptMatch: number;
  whyMatched: string[];
}

interface TabState {
  fingerprint: Fingerprint | null;
  results: MatchResult[];
  isExtracting: boolean;
  isSearching: boolean;
  hasSearched: boolean;
  saturation: number; 
  crossChannelData: { channelName: string; count: number; avgMatch: number }[];
  
  // Search Config
  searchLimit: number;
  minSimilarity: number;
  language: string;
}

export default function Stage4ConceptMatch() {
  const { activeSession, updateSessionState } = useSession();
  const selectedOutliers = activeSession?.filters?.outlierVideos || [];
  
  const prevStage = () => updateSessionState({ wizardStep: 3 });
  const nextStage = () => updateSessionState({ wizardStep: 5 });

  const [activeTab, setActiveTab] = useState<string>(
    selectedOutliers.length > 0 ? selectedOutliers[0].videoId : ""
  );

  // State map per video ID
  const [tabStates, setTabStates] = useState<Record<string, TabState>>({});
  const [addedToWorkspace, setAddedToWorkspace] = useState<Set<string>>(new Set());

  useEffect(() => {
    const initialStates: Record<string, TabState> = { ...tabStates };
    let changed = false;
    selectedOutliers.forEach((v: any) => {
      if (!initialStates[v.videoId]) {
        initialStates[v.videoId] = {
          fingerprint: null,
          results: [],
          isExtracting: false,
          isSearching: false,
          hasSearched: false,
          saturation: 0,
          crossChannelData: [],
          searchLimit: 100,
          minSimilarity: 75,
          language: "en",
        };
        changed = true;
      }
    });
    if (changed) setTabStates(initialStates);
    if (!activeTab && selectedOutliers.length > 0) {
      setActiveTab(selectedOutliers[0].videoId);
    }
  }, [selectedOutliers]);

  const updateTabState = (videoId: string, updates: Partial<TabState>) => {
    setTabStates((prev) => ({
      ...prev,
      [videoId]: {
        ...prev[videoId],
        ...updates
      }
    }));
  };

  const handleRunConceptSearch = async (videoId: string, sourceVideo: any) => {
    const currentState = tabStates[videoId];
    if (!currentState) return;

    updateTabState(videoId, { isExtracting: true, hasSearched: false, results: [] });

    try {
      // 1: Extract Fingerprint
      const resExtract = await fetch('/api/discovery-v2/outliers/concept-match/extract', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          videoId, 
          title: sourceVideo.title, 
          channelTitle: sourceVideo.channelTitle 
        }) 
      });
      const extractData = await resExtract.json();
      
      if (!extractData.success) throw new Error(extractData.error || "Extraction failed");
      
      const fingerprint = extractData.fingerprint;

      updateTabState(videoId, { 
        fingerprint,
        isExtracting: false,
        isSearching: true
      });

      // 2: Search with Fingerprint
      const resSearch = await fetch('/api/discovery-v2/outliers/concept-match/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fingerprint,
          searchLimit: currentState.searchLimit,
          minSimilarity: currentState.minSimilarity,
          sourceVideoId: videoId,
          sourceVideoTitle: sourceVideo.title,
          sourceChannelId: sourceVideo.channelId || "",
          sourceChannelName: sourceVideo.channelTitle || ""
        })
      });
      const searchData = await resSearch.json();

      if (!searchData.success) throw new Error(searchData.error || "Search failed");
      
      const results = searchData.results;
      const saturation = searchData.saturation;

      updateTabState(videoId, {
        isSearching: false,
        hasSearched: true,
        results: results,
        saturation: saturation?.totalMatchingVideos || 0,
        crossChannelData: []
      });

    } catch (error) {
      console.error(error);
      alert("Error: " + (error as any).message);
      updateTabState(videoId, { isExtracting: false, isSearching: false });
    }
  };

  const handleRunAnalysis = async (videoId: string, matchId: string, matchTitle: string) => {
    try {
      const sourceVideo = selectedOutliers.find((v: any) => v.videoId === videoId);
      if (!sourceVideo) return;
      
      const res = await fetch('/api/discovery-v2/outliers/concept-match/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceVideoId: videoId,
          matchVideoId: matchId,
          sourceTitle: sourceVideo.title,
          matchTitle: matchTitle
        })
      });
      
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      
      alert(`Analysis Complete:\n\nUnique Angle: ${data.deepAnalysis.uniqueAngle}\nHook: ${data.deepAnalysis.hook}\nDiff: ${data.deepAnalysis.whatMakesDifferent}`);
    } catch (error) {
       console.error(error);
       alert("Analysis failed.");
    }
  };

  const addToWorkspace = (match: MatchResult) => {
    const video = { id: match.videoId, title: match.title, type: "video" };
    const existingWorkspaceItems = activeSession?.filters?.workspaceItems || [];
    const isDuplicate = existingWorkspaceItems.some((item: any) => item.id === video.id);
        
    if (!isDuplicate) {
      updateSessionState({ 
        filters: {
          ...(activeSession?.filters || {}),
          workspaceItems: [...existingWorkspaceItems, video]
        }
      });
      setAddedToWorkspace(prev => new Set(prev).add(video.id));
    } else {
      alert("Already in workspace.");
    }
  };

  if (selectedOutliers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <GitMerge className="w-16 h-16 text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">No Seed Videos Selected</h2>
        <p className="text-gray-500 mb-6">You need to select outlier videos in Step 3 before running a concept match.</p>
        <button onClick={prevStage} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
          Go Back to Step 3
        </button>
      </div>
    );
  }

  const currentTabState = tabStates[activeTab] || {
    fingerprint: null,
    results: [],
    isExtracting: false,
    isSearching: false,
    hasSearched: false,
    saturation: 0,
    crossChannelData: [],
    searchLimit: 100,
    minSimilarity: 75,
    language: "en"
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Stage 4: Concept Match Engine</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Isolate core concepts from your selected outliers and map market saturation.
          </p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={prevStage}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            Back
          </button>
          <button 
            onClick={nextStage}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
          >
            Intelligence Workspace
          </button>
        </div>
      </div>

      {/* Horizontal Tabs */}
      <div className="flex overflow-x-auto border-b border-gray-200 dark:border-gray-800 space-x-1 pb-px scrollbar-hide">
        {selectedOutliers.map((v: any) => (
          <button
            key={v.videoId}
            onClick={() => setActiveTab(v.videoId)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition border-b-2 ${
              activeTab === v.videoId
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-700"
            }`}
          >
            {v.title?.substring(0, 30) || "Unknown Video"}...
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
        
        {/* Search Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Search Limit</label>
            <select
              value={currentTabState.searchLimit}
              onChange={(e) => updateTabState(activeTab, { searchLimit: Number(e.target.value) })}
              className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value={50}>50 Results</option>
              <option value={100}>100 Results</option>
              <option value={200}>200 Results</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Min Similarity</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="60"
                max="90"
                value={currentTabState.minSimilarity}
                onChange={(e) => updateTabState(activeTab, { minSimilarity: Number(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-blue-500"
              />
              <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{currentTabState.minSimilarity}%</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Language</label>
            <select
              value={currentTabState.language}
              onChange={(e) => updateTabState(activeTab, { language: e.target.value })}
              className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="pt">Portuguese</option>
            </select>
          </div>
          <div className="flex items-end">
            <button 
              onClick={() => handleRunConceptSearch(activeTab, selectedOutliers.find((v:any) => v.videoId === activeTab))}
              disabled={currentTabState.isExtracting || currentTabState.isSearching}
              className="flex items-center justify-center gap-2 w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-medium transition disabled:opacity-50"
            >
              {currentTabState.isExtracting || currentTabState.isSearching ? (
                <Activity size={16} className="animate-spin" />
              ) : (
                <Zap size={16} />
              )}
              {currentTabState.hasSearched ? "Re-Run Search" : "Run Concept Search"}
            </button>
          </div>
        </div>

        {/* Loading States */}
        {currentTabState.isExtracting && (
          <div className="py-12 flex flex-col items-center justify-center animate-pulse">
            <Brain size={48} className="text-blue-500 mb-4 animate-bounce" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Extracting Concept Fingerprint...</h3>
            <p className="text-gray-500 text-sm">Analyzing script, structure, and psychological hooks.</p>
          </div>
        )}

        {currentTabState.isSearching && (
          <div className="py-12 flex flex-col items-center justify-center animate-pulse">
            <Search size={48} className="text-indigo-500 mb-4 animate-bounce" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Scanning Global Database...</h3>
            <p className="text-gray-500 text-sm">Matching fingerprint against massive historical data.</p>
          </div>
        )}

        {/* Results Dashboard */}
        {currentTabState.hasSearched && !currentTabState.isExtracting && !currentTabState.isSearching && (
          <div className="animate-in fade-in duration-500 space-y-8">
            
            {/* Concept Fingerprint Panel */}
            {currentTabState.fingerprint && (
              <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/50 rounded-xl p-5">
                <h3 className="text-sm font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <GitMerge size={16} /> Extracted Concept Fingerprint
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2 text-gray-500 mb-1"><Lightbulb size={14}/> <span className="text-xs font-semibold uppercase">Topic</span></div>
                    <p className="font-medium text-sm text-gray-900 dark:text-gray-100">{currentTabState.fingerprint.topic}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2 text-gray-500 mb-1"><Target size={14}/> <span className="text-xs font-semibold uppercase">Intent</span></div>
                    <p className="font-medium text-sm text-gray-900 dark:text-gray-100">{currentTabState.fingerprint.intent}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2 text-gray-500 mb-1"><Users size={14}/> <span className="text-xs font-semibold uppercase">Audience</span></div>
                    <p className="font-medium text-sm text-gray-900 dark:text-gray-100">{currentTabState.fingerprint.audience}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2 text-gray-500 mb-1"><Layers size={14}/> <span className="text-xs font-semibold uppercase">Angle</span></div>
                    <p className="font-medium text-sm text-gray-900 dark:text-gray-100">{currentTabState.fingerprint.angle}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Saturation & Cross Channel Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Concept Saturation Gauge */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm flex flex-col items-center justify-center">
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <PieChart size={16} /> Concept Saturation
                </h4>
                <div className="relative w-32 h-32 flex items-center justify-center rounded-full border-8 border-gray-100 dark:border-gray-700">
                  <div 
                    className="absolute inset-0 rounded-full border-8 border-transparent border-t-red-500 border-r-red-500" 
                    style={{ transform: `rotate(${currentTabState.saturation * 3.6 - 45}deg)` }}
                  />
                  <div className="text-center">
                    <span className="text-3xl font-black text-gray-900 dark:text-white">{currentTabState.saturation}%</span>
                  </div>
                </div>
                <p className="text-xs text-center text-gray-500 mt-4 px-2">
                  Moderate saturation. Room for disruption using a unique angle.
                </p>
              </div>

              {/* Cross-Channel Analysis Table */}
              <div className="lg:col-span-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <BarChart2 size={16} /> Cross-Channel Dominance
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-900/50">
                      <tr>
                        <th className="px-4 py-2 rounded-l-lg">Channel Name</th>
                        <th className="px-4 py-2 text-center">Video Count</th>
                        <th className="px-4 py-2 text-right rounded-r-lg">Avg Match Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentTabState.crossChannelData.map((d, i) => (
                        <tr key={i} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                          <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{d.channelName}</td>
                          <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-400">{d.count}</td>
                          <td className="px-4 py-3 text-right">
                            <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-md font-bold text-xs">
                              {d.avgMatch}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Results List */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Matched Market Videos</h3>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {currentTabState.results.map((match: any) => (
                  <div key={match.videoId || match.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm hover:shadow-md transition flex flex-col md:flex-row gap-5">
                    
                    {/* Thumbnail */}
                    <div className="relative w-full md:w-48 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                      <img src={match.thumbnailUrl} alt={match.title} className="w-full h-full object-cover" />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0 flex flex-col">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-bold text-gray-900 dark:text-gray-100 text-base leading-tight truncate">{match.title}</h4>
                          <p className="text-xs text-gray-500">{match.channelTitle}</p>
                        </div>
                        <div className="flex flex-col gap-1 items-end ml-4">
                          <span className="text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full whitespace-nowrap">
                            {match.conceptMatchData?.matchCategory || "Strong Match"}
                          </span>
                          <span className="text-xs text-gray-500 font-medium">Overall {match.conceptMatchData?.scores?.overall}%</span>
                        </div>
                      </div>
                        
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        <div className="bg-gray-50 dark:bg-gray-800 rounded p-2 text-center">
                          <div className="text-xs text-gray-500 uppercase">Topic</div>
                          <div className="text-sm font-bold text-gray-900 dark:text-white">{match.conceptMatchData?.scores?.topic}%</div>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800 rounded p-2 text-center">
                          <div className="text-xs text-gray-500 uppercase">Intent</div>
                          <div className="text-sm font-bold text-gray-900 dark:text-white">{match.conceptMatchData?.scores?.intent}%</div>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800 rounded p-2 text-center">
                          <div className="text-xs text-gray-500 uppercase">Concept</div>
                          <div className="text-sm font-bold text-gray-900 dark:text-white">{match.conceptMatchData?.scores?.concept}%</div>
                        </div>
                      </div>

                      <div className="mt-4">
                        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Why Matched</h4>
                        <ul className="space-y-1">
                          {match.conceptMatchData?.whyMatched?.map((reason: string, idx: number) => (
                            <li key={idx} className="flex items-start text-sm text-gray-700 dark:text-gray-300">
                              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 mr-2 shrink-0" />
                              <span>{reason}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap items-center gap-2 mt-auto pt-3 border-t border-gray-100 dark:border-gray-800">
                        <button className="p-1.5 text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition" title="Open Video">
                          <Play size={16} />
                        </button>
                        <button className="p-1.5 text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition" title="Open Channel">
                          <ExternalLink size={16} />
                        </button>
                        <button 
                          onClick={() => handleRunAnalysis(activeTab, match.id || match.videoId, match.title)}
                          className="flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                        >
                          <Target className="w-4 h-4 mr-1" />
                          Run Analysis
                        </button>
                        <button 
                          onClick={() => addToWorkspace(match)}
                          disabled={addedToWorkspace.has(match.id || match.videoId)}
                          className="flex items-center px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md text-sm font-medium transition disabled:opacity-50"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          {addedToWorkspace.has(match.id || match.videoId) ? "Added" : "Add to Step 5"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
