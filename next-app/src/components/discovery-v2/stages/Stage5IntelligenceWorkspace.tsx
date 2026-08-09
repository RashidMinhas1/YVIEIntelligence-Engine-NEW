import React, { useEffect, useState } from "react";
import { useDiscovery } from "@/components/discovery-v2/engine/DiscoveryProvider";
import { useSession } from "../../dashboard/session-context";
import { V2Video, WorkspaceIntelligenceData, IndividualVideoIntelligence } from "@/lib/types/discovery-v2";
import { 
  Database, AlertTriangle, CheckCircle, PlayCircle, BrainCircuit, Activity, 
  TrendingUp, Users, Target, Rocket, Eye, ThumbsUp, MessageSquare, Download, Filter, FileText
} from "lucide-react";
import { WorkspaceVideoCard } from "./WorkspaceVideoCard";

export default function Stage5IntelligenceWorkspace() {
  const { state, updateState, nextStage, prevStage } = useDiscovery();
  const [selectedVideo, setSelectedVideo] = useState<V2Video | null>(null);
  
  // UI States
  const [filter, setFilter] = useState("All");
  const [sortBy, setSortBy] = useState("Similarity");
  const [analyzingProgress, setAnalyzingProgress] = useState<{
    stage: string;
    completed: number;
    total: number;
    currentVideo?: string;
  } | null>(null);

  const { activeSession, updateSessionState } = useSession();
  
  // Use session state for workspace items to preserve data across stages
  const explicitItems = activeSession?.filters?.workspaceItems || state.workspaceItems || [];
  const sourceOutliers = activeSession?.filters?.outlierVideos || state.outlierVideos || [];
  
  // Combine source outliers with explicitly added matches, removing duplicates
  const allItems = [...sourceOutliers, ...explicitItems];
  const items = Array.from(new Map(allItems.map(v => [v.videoId, v])).values());

  const workspaceData = state.workspaceIntelligence;
  const analysisStatus = workspaceData?.status || "Not Analyzed";

  // Data formatting helpers
  const formatNumber = (num: string | number) => {
    const n = typeof num === 'string' ? parseInt(num) : num;
    if (isNaN(n)) return "0";
    if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
    if (n >= 1000) return (n / 1000).toFixed(1) + "K";
    return n.toString();
  };

  const handleUpdateScript = (videoId: string, scriptData: any) => {
    const updatedItems = items.map((v: any) => 
      v.videoId === videoId ? { ...v, userScript: scriptData || { status: "not_added" } } : v
    );
    updateSessionState({ workspaceItems: updatedItems });
    // Keep local discovery state in sync
    updateState({ workspaceItems: updatedItems });
  };

  // Run Analysis Engine
  const runAnalysis = async () => {
    if (items.length === 0) return;
    
    updateState({ 
      workspaceIntelligence: { 
        ...workspaceData, 
        status: 'Analyzing',
        individualAnalysis: {}
      } 
    });

    let newIndividualAnalysis: Record<string, IndividualVideoIntelligence> = {};

    // STAGE A: Individual Video Analysis
    for (let i = 0; i < items.length; i++) {
      const video = items[i];
      setAnalyzingProgress({
        stage: "Independent Video Analysis",
        completed: i,
        total: items.length,
        currentVideo: video.title
      });

      try {
        const res = await fetch("/api/discovery-v2/intelligence/analyze-video", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ video })
        });
        
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.intelligence) {
             // Strict Data Isolation check
             if (data.intelligence.videoId === video.videoId) {
                newIndividualAnalysis[video.videoId] = data.intelligence;
             }
          }
        }
      } catch (error) {
        console.error("Failed to analyze video", video.videoId, error);
      }
    }

    setAnalyzingProgress({
      stage: "Cross-Video Pattern Engine",
      completed: items.length,
      total: items.length,
      currentVideo: "Generating Final Blueprint..."
    });

    // STAGE B: Cross-Video Analysis
    let crossAnalysis = null;
    try {
      const res = await fetch("/api/discovery-v2/intelligence/analyze-workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          workspaceVideos: items, 
          individualAnalysisMap: newIndividualAnalysis 
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) crossAnalysis = data.crossVideoAnalysis;
      }
    } catch (error) {
      console.error("Cross-video analysis failed", error);
    }

    const fingerprint = items.map((v: any) => v.videoId).sort().join(",");

    updateState({
      workspaceIntelligence: {
        status: crossAnalysis ? 'Complete' : 'Failed',
        timestamp: new Date().toISOString(),
        workspaceFingerprint: fingerprint,
        individualAnalysis: newIndividualAnalysis,
        crossVideoAnalysis: crossAnalysis
      }
    });

    setAnalyzingProgress(null);
  };

  // Sort and Filter logic
  let displayedItems = [...items];
  
  if (filter === "High Similarity") {
    displayedItems = displayedItems.filter(v => (v.conceptMatchData?.scores?.overall || 0) > 85);
  } else if (filter === "Analyzed") {
    displayedItems = displayedItems.filter(v => workspaceData?.individualAnalysis?.[v.videoId]);
  }

  displayedItems.sort((a, b) => {
    if (sortBy === "Views") return parseInt(b.viewCount || "0") - parseInt(a.viewCount || "0");
    if (sortBy === "Newest") return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    if (sortBy === "Similarity") return (b.conceptMatchData?.scores?.overall || 0) - (a.conceptMatchData?.scores?.overall || 0);
    return 0;
  });

  const getSaturationBadge = () => {
    if (items.length < 3) return "Low";
    if (items.length < 8) return "Medium";
    return "High";
  };

  const cv = workspaceData?.crossVideoAnalysis;

  return (
    <div className="space-y-8 pb-20">
      
      {/* 1. HEADER SECTION */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <BrainCircuit className="text-indigo-500" />
              Intelligence Workspace
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1 max-w-2xl">
              Transform selected concept matches into actionable content intelligence. This workspace strictly analyzes {items.length} validated videos.
            </p>
          </div>
          <div className="flex gap-3">
             <button 
               onClick={prevStage}
               className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
             >
               Back
             </button>
             <button 
               onClick={runAnalysis}
               disabled={analysisStatus === 'Analyzing' || items.length === 0}
               className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition flex items-center gap-2 shadow-sm font-medium"
             >
               {analysisStatus === 'Analyzing' ? 'Analyzing Workspace...' : 'Analyze Workspace'}
             </button>
              {analysisStatus === 'Complete' && (
                <button
                  onClick={() => updateSessionState({ wizardStep: 6 })}
                  className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 active:scale-95 transition-all font-semibold flex items-center gap-2 shadow-md shadow-indigo-200 dark:shadow-indigo-900/30 text-sm"
                >
                  Reverse Engineering →
                </button>
              )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-8">
          <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Selected Videos</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{items.length}</div>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700">
             <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Unique Channels</div>
             <div className="text-2xl font-bold text-gray-900 dark:text-white">
               {new Set(items.map((v: any) => v.channelId)).size}
             </div>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700">
             <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Avg Similarity</div>
             <div className="text-2xl font-bold text-gray-900 dark:text-white">
               {items.length > 0 ? Math.round(items.reduce((acc: any, curr: any) => acc + (curr.conceptMatchData?.scores?.overall || 0), 0) / items.length) : 0}%
             </div>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700">
             <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Concept Saturation</div>
             <div className="text-2xl font-bold text-gray-900 dark:text-white">{getSaturationBadge()}</div>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700">
             <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Analysis Status</div>
             <div className="flex items-center gap-2 mt-1">
               {analysisStatus === 'Complete' && <CheckCircle className="text-emerald-500" size={20} />}
               {analysisStatus === 'Analyzing' && <Activity className="text-indigo-500 animate-pulse" size={20} />}
               {analysisStatus === 'Failed' && <AlertTriangle className="text-red-500" size={20} />}
               {analysisStatus === 'Not Analyzed' && <Database className="text-gray-400" size={20} />}
               <span className="font-semibold text-gray-900 dark:text-white">{analysisStatus}</span>
             </div>
          </div>
        </div>
      </div>

      {/* ANALYSIS PROGRESS OVERLAY */}
      {analysisStatus === 'Analyzing' && analyzingProgress && (
        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-6 text-center">
          <Activity className="text-indigo-500 animate-bounce mx-auto mb-3" size={32} />
          <h3 className="text-lg font-bold text-indigo-900 dark:text-indigo-300 mb-2">{analyzingProgress.stage}</h3>
          <p className="text-indigo-600 dark:text-indigo-400 mb-4">{analyzingProgress.currentVideo}</p>
          <div className="w-full bg-indigo-200 dark:bg-indigo-900/50 rounded-full h-2.5 max-w-xl mx-auto overflow-hidden">
             <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${(analyzingProgress.completed / analyzingProgress.total) * 100}%`}}></div>
          </div>
          <p className="text-sm text-indigo-500 mt-3 font-mono">
            {analyzingProgress.completed} / {analyzingProgress.total} Validated Workspace Items
          </p>
        </div>
      )}

      {/* 2. WORKSPACE LIBRARY (Always visible above intelligence) */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/80">
          <h3 className="font-semibold text-gray-900 dark:text-white">Selected Workspace Library</h3>
          <div className="flex gap-2">
            <select className="text-sm border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg px-2 py-1 text-gray-700 dark:text-gray-200" value={filter} onChange={e => setFilter(e.target.value)}>
              <option>All</option>
              <option>High Similarity</option>
              <option>Analyzed</option>
            </select>
            <select className="text-sm border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg px-2 py-1 text-gray-700 dark:text-gray-200" value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option>Similarity</option>
              <option>Views</option>
              <option>Newest</option>
            </select>
          </div>
        </div>
        
        {items.length === 0 ? (
          <div className="p-10 text-center text-gray-500">No videos added yet. Go back to Step 4.</div>
        ) : (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {displayedItems.map((video) => {
              const intel = workspaceData?.individualAnalysis?.[video.videoId];
              return (
                <WorkspaceVideoCard 
                  key={video.videoId}
                  video={video}
                  intel={intel}
                  onUpdateScript={handleUpdateScript}
                  onClickDetails={() => setSelectedVideo(video)}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* 3. FINAL INTELLIGENCE DASHBOARD */}
      {analysisStatus === 'Complete' && cv && (
        <div className="space-y-6">
          
          {/* Opportunity Score Card */}
          <div className="bg-gradient-to-br from-indigo-900 to-indigo-800 rounded-2xl p-6 shadow-lg text-white border border-indigo-700">
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="text-center md:text-left shrink-0">
                <div className="text-indigo-200 font-medium mb-1 tracking-widest text-sm uppercase">Opportunity Score</div>
                <div className="text-6xl font-black">{cv.opportunityScore?.score || 0}<span className="text-3xl text-indigo-400">/100</span></div>
                <div className="mt-2 inline-block px-3 py-1 bg-emerald-500/20 text-emerald-300 font-bold rounded-full text-sm border border-emerald-500/30">
                  {cv.opportunityScore?.status || "UNKNOWN"}
                </div>
              </div>
              <div className="flex-1 bg-black/20 p-5 rounded-xl border border-white/10">
                <h4 className="font-semibold text-indigo-100 mb-3 text-sm">Validated Signals</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="w-24 text-xs text-indigo-200">Demand Signal</div>
                    <div className="flex-1 bg-indigo-950/50 rounded-full h-2"><div className="bg-blue-400 h-2 rounded-full" style={{width: `${cv.opportunityScore?.demand || 0}%`}}></div></div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-24 text-xs text-indigo-200">Content Gap</div>
                    <div className="flex-1 bg-indigo-950/50 rounded-full h-2"><div className="bg-emerald-400 h-2 rounded-full" style={{width: `${cv.opportunityScore?.gap || 0}%`}}></div></div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-24 text-xs text-indigo-200">Competition</div>
                    <div className="flex-1 bg-indigo-950/50 rounded-full h-2"><div className="bg-orange-400 h-2 rounded-full" style={{width: `${cv.opportunityScore?.competition || 0}%`}}></div></div>
                  </div>
                </div>
                <p className="text-xs text-indigo-200/70 mt-4 leading-relaxed font-mono">
                  {cv.opportunityScore?.explanation}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Cross-Video Patterns */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <TrendingUp className="text-blue-500" /> Detected Patterns
              </h3>
              <div className="space-y-4">
                {cv.patterns?.map((p, idx) => (
                  <div key={idx} className="p-4 bg-gray-50 dark:bg-gray-750 border border-gray-100 dark:border-gray-700 rounded-xl">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-bold text-gray-900 dark:text-white text-sm">{p.pattern}</div>
                      <span className="text-xs font-mono bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded">{p.frequency}</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mb-2 leading-relaxed">{p.whyItMatters}</p>
                    <div className="text-[10px] text-gray-400 font-mono uppercase">Performance: {p.performanceAssociation}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Content Gaps */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Target className="text-emerald-500" /> Content Gaps
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{cv.contentGaps?.opportunityStatement}</p>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Missing Angles</h4>
                  <div className="flex flex-wrap gap-2">
                    {cv.contentGaps?.missingAngles?.map((m, i) => (
                      <span key={i} className="px-3 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 text-xs rounded-full border border-emerald-100 dark:border-emerald-800/30">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Unanswered Questions</h4>
                  <ul className="space-y-2">
                    {cv.contentGaps?.unansweredQuestions?.map((q, i) => (
                      <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                        <span className="text-emerald-500 font-bold">?</span> {q}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

          </div>

          {/* AI Content Blueprint */}
          {cv.finalBlueprint && (
            <div className="bg-gradient-to-b from-gray-900 to-black rounded-2xl p-8 shadow-xl border border-gray-800 text-gray-300">
              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-800">
                <Rocket className="text-indigo-400" size={32} />
                <div>
                  <h2 className="text-2xl font-black text-white">AI Content Blueprint</h2>
                  <p className="text-sm text-gray-400">Actionable strategy based entirely on the workspace dataset.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                
                {/* Core Strategy */}
                <div className="space-y-6">
                  <div>
                    <h4 className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Recommended Concept</h4>
                    <p className="text-lg font-bold text-white leading-tight">{cv.finalBlueprint.recommendedConcept}</p>
                  </div>
                  <div>
                    <h4 className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Unique Angle</h4>
                    <p className="text-sm text-emerald-400 font-medium">{cv.finalBlueprint.uniqueAngle}</p>
                  </div>
                  <div>
                    <h4 className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Main Promise</h4>
                    <p className="text-sm text-gray-300">{cv.finalBlueprint.mainPromise}</p>
                  </div>
                  <div>
                    <h4 className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2">Title Strategy</h4>
                    <p className="text-sm text-gray-300 mb-3">{cv.finalBlueprint.titleStrategy}</p>
                    <div className="bg-gray-800/50 rounded-lg p-3 space-y-2 border border-gray-700/50">
                      {cv.finalBlueprint.suggestedTitles?.map((t, i) => (
                        <div key={i} className="text-sm font-semibold text-white">"{t}"</div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Execution Strategy */}
                <div className="space-y-6">
                  <div>
                    <h4 className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Hook Strategy</h4>
                    <p className="text-sm text-gray-300 mb-2">{cv.finalBlueprint.hookStrategy}</p>
                    <ul className="list-disc pl-4 space-y-1 text-xs text-indigo-300">
                      {cv.finalBlueprint.hookExamples?.map((h, i) => <li key={i}>{h}</li>)}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Thumbnail Concept</h4>
                    <p className="text-sm text-gray-300">{cv.finalBlueprint.thumbnailConcept}</p>
                  </div>
                  <div>
                    <h4 className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Story Structure</h4>
                    <p className="text-sm text-gray-300 leading-relaxed">{cv.finalBlueprint.storyStructure}</p>
                  </div>
                  <div className="bg-red-950/30 border border-red-900/30 p-4 rounded-xl mt-4">
                    <h4 className="text-[10px] text-red-500 uppercase tracking-widest font-bold mb-1">What to Avoid</h4>
                    <p className="text-sm text-red-300">{cv.finalBlueprint.whatToAvoid}</p>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>
      )}

      {/* INDIVIDUAL VIDEO MODAL */}
      {selectedVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedVideo(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-800" onClick={e => e.stopPropagation()}>
            
            <div className="sticky top-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center z-10">
              <h3 className="font-bold text-gray-900 dark:text-white">Individual Intelligence Report</h3>
              <button onClick={() => setSelectedVideo(null)} className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition">Close</button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <img src={selectedVideo.thumbnail} alt="Thumbnail" className="w-full md:w-64 rounded-xl shadow-sm aspect-video object-cover" />
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{selectedVideo.title}</h2>
                  <div className="flex gap-4 text-sm text-gray-500 mb-4 font-mono">
                    <span>{selectedVideo.channelTitle}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><Eye size={14}/> {formatNumber(selectedVideo.viewCount)}</span>
                  </div>
                  
                  {/* Strict Data Isolation Badge */}
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800/30 text-xs text-indigo-700 dark:text-indigo-400 font-mono">
                    <Database size={10} /> Validated ID: {selectedVideo.videoId}
                  </div>
                </div>
              </div>

              {workspaceData?.individualAnalysis?.[selectedVideo.videoId] ? (
                (() => {
                  const intel = workspaceData.individualAnalysis[selectedVideo.videoId];
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                      <div className="space-y-6">
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
                          <h4 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2"><Eye size={16} className="text-blue-500"/> Hook Strategy</h4>
                          <div className="space-y-3 text-sm">
                            <div><span className="text-gray-500 font-bold block mb-0.5 text-xs uppercase tracking-wider">Type</span><span className="text-gray-900 dark:text-gray-200">{intel.hookIntelligence?.hookType}</span></div>
                            <div><span className="text-gray-500 font-bold block mb-0.5 text-xs uppercase tracking-wider">Retention Mechanism</span><span className="text-gray-900 dark:text-gray-200">{intel.hookIntelligence?.retentionMechanism}</span></div>
                            <div><span className="text-gray-500 font-bold block mb-0.5 text-xs uppercase tracking-wider">Curiosity Trigger</span><span className="text-gray-900 dark:text-gray-200">{intel.hookIntelligence?.curiosityTrigger}</span></div>
                          </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
                          <h4 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2"><FileText size={16} className="text-emerald-500"/> Title Strategy</h4>
                          <div className="space-y-3 text-sm">
                            <div><span className="text-gray-500 font-bold block mb-0.5 text-xs uppercase tracking-wider">Formula</span><span className="text-gray-900 dark:text-gray-200">{intel.titleIntelligence?.formula}</span></div>
                            <div><span className="text-gray-500 font-bold block mb-0.5 text-xs uppercase tracking-wider">Information Gap</span><span className="text-gray-900 dark:text-gray-200">{intel.titleIntelligence?.informationGap}</span></div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
                          <h4 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2"><PlayCircle size={16} className="text-orange-500"/> Story Structure</h4>
                          <div className="space-y-3 text-sm">
                            <div><span className="text-gray-500 font-bold block mb-0.5 text-xs uppercase tracking-wider">Setup</span><span className="text-gray-900 dark:text-gray-200">{intel.storyIntelligence?.setup}</span></div>
                            <div><span className="text-gray-500 font-bold block mb-0.5 text-xs uppercase tracking-wider">Escalation</span><span className="text-gray-900 dark:text-gray-200">{intel.storyIntelligence?.escalation}</span></div>
                            <div><span className="text-gray-500 font-bold block mb-0.5 text-xs uppercase tracking-wider">Payoff</span><span className="text-gray-900 dark:text-gray-200">{intel.storyIntelligence?.payoff}</span></div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                           <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-100 dark:border-emerald-800/30">
                             <h4 className="font-bold text-emerald-700 dark:text-emerald-400 mb-2 text-sm">Strengths</h4>
                             <ul className="text-xs text-emerald-800 dark:text-emerald-300 space-y-1 list-disc pl-3">
                               {intel.strengths?.map((s,i) => <li key={i}>{s}</li>)}
                             </ul>
                           </div>
                           <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-100 dark:border-red-800/30">
                             <h4 className="font-bold text-red-700 dark:text-red-400 mb-2 text-sm">Weaknesses</h4>
                             <ul className="text-xs text-red-800 dark:text-red-300 space-y-1 list-disc pl-3">
                               {intel.weaknesses?.map((w,i) => <li key={i}>{w}</li>)}
                             </ul>
                           </div>
                        </div>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="text-center p-12 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                  <Database size={32} className="mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-500 font-medium">This video has not been analyzed yet.</p>
                  <p className="text-xs text-gray-400 mt-1">Click "Analyze Workspace" to generate intelligence.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
