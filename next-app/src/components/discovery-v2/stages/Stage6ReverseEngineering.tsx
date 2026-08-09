import React, { useState } from "react";
import { useDiscovery } from "@/components/discovery-v2/engine/DiscoveryProvider";
import { useSession } from "../../dashboard/session-context";
import { V2Video, ScriptAnalysisResult } from "@/lib/types/discovery-v2";
import { Hammer, Youtube, FileText, Sparkles, Wand2, BarChart, Activity, Brain, Target, ArrowRight, Zap, CheckCircle, AlertTriangle, GitMerge } from "lucide-react";

export default function Stage6ReverseEngineering() {
  const { state, prevStage } = useDiscovery();
  const { activeSession, updateSessionState } = useSession();
  
  const explicitItems = activeSession?.filters?.workspaceItems || state.workspaceItems || [];
  const sourceOutliers = activeSession?.filters?.outlierVideos || state.outlierVideos || [];
  const allItems = [...sourceOutliers, ...explicitItems];
  const workspaceItems = Array.from(new Map(allItems.map((v: any) => [v.videoId, v])).values());
  
  // Initialize from previously saved analyses in session (persists across stage navigation)
  const savedAnalyses: Record<string, ScriptAnalysisResult> = activeSession?.filters?.scriptAnalyses || {};
  const [selectedVideo, setSelectedVideo] = useState<V2Video | null>(workspaceItems[0] || null);
  const [analysisState, setAnalysisState] = useState<Record<string, { status: 'idle' | 'analyzing' | 'complete' | 'error', data?: ScriptAnalysisResult, errorMsg?: string }>>(
    // Pre-populate from session so already-analyzed videos don't need re-running
    Object.fromEntries(
      Object.entries(savedAnalyses).map(([id, data]) => [id, { status: 'complete' as const, data }])
    )
  );

  const handleAnalyze = async (video: V2Video) => {
    if (!video.userScript || video.userScript.status !== 'added') return;

    setAnalysisState(prev => ({
      ...prev,
      [video.videoId]: { status: 'analyzing' }
    }));

    try {
      const res = await fetch("/api/discovery-v2/script-analysis/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          video, 
          workspaceIntelligence: state.workspaceIntelligence 
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.scriptAnalysis) {
          // STRICT DATA ISOLATION: force correct videoId (API enforces this too)
          data.scriptAnalysis.videoId = video.videoId;
          const newEntry = { status: 'complete' as const, data: data.scriptAnalysis };
          setAnalysisState(prev => ({ ...prev, [video.videoId]: newEntry }));
          // Persist to session so Stage 7 can read it without re-running
          const updatedSaved = { ...savedAnalyses, [video.videoId]: data.scriptAnalysis };
          await updateSessionState({ scriptAnalyses: updatedSaved });
        } else {
          throw new Error(data.error || "Invalid response format.");
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        throw new Error((errData as any).error || `Server error: ${res.status}`);
      }
    } catch (error: any) {
      console.error('[Stage6 Analysis Error]', error);
      setAnalysisState(prev => ({
        ...prev,
        [video.videoId]: { status: 'error', errorMsg: error.message }
      }));
    }
  };

  const currentAnalysis = selectedVideo ? analysisState[selectedVideo.videoId] : null;

  return (
    <div className="space-y-6 pb-20">
      
      {/* HEADER SECTION */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FileText className="text-red-500" />
              Script Reverse Engineering
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1 max-w-2xl">
              Deep analysis of the user-provided scripts for the selected workspace videos, compared against competitor intelligence.
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
               onClick={() => updateSessionState({ wizardStep: 7 })}
               className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
             >
               Script Generation →
             </button>
          </div>
        </div>
      </div>

      {workspaceItems.length === 0 ? (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-8 text-center border border-yellow-200 dark:border-yellow-800 flex-1 flex flex-col items-center justify-center">
          <Hammer className="text-yellow-500 mb-4 mx-auto" size={48} />
          <h3 className="text-xl font-bold text-yellow-700 dark:text-yellow-500 mb-2">Workspace Empty</h3>
          <p className="text-yellow-600 dark:text-yellow-400 max-w-md mx-auto">
            You need to select videos and add scripts in Stage 5 before reverse engineering them here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          
          {/* SIDEBAR */}
          <div className="w-full lg:w-1/3 bg-gray-50 dark:bg-gray-800/80 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shrink-0">
            <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
              <Youtube size={18} /> Workspace Scripts
            </h3>
            <div className="space-y-3">
              {workspaceItems.map((video) => {
                const hasScript = video.userScript?.status === 'added';
                return (
                  <button
                    key={video.videoId}
                    onClick={() => setSelectedVideo(video)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      selectedVideo?.videoId === video.videoId
                        ? "bg-white dark:bg-gray-900 border-red-500 shadow-sm"
                        : "bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:border-red-300"
                    }`}
                  >
                    <div className="flex gap-3">
                      <img src={video.thumbnail} alt="" className="w-20 h-12 object-cover rounded shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm line-clamp-2 leading-tight text-gray-900 dark:text-white">{video.title}</h4>
                        <div className="flex items-center gap-2 mt-2">
                           {hasScript ? (
                              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-0.5 rounded flex items-center gap-1"><CheckCircle size={10}/> Script Ready</span>
                           ) : (
                              <span className="text-[10px] font-bold text-gray-500 bg-gray-200 dark:bg-gray-800 px-2 py-0.5 rounded">No Script</span>
                           )}
                           {analysisState[video.videoId]?.status === 'complete' && (
                             <span className="text-[10px] font-bold text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded flex items-center gap-1"><Zap size={10}/> Analyzed</span>
                           )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* MAIN DECONSTRUCTION AREA */}
          <div className="flex-1 w-full bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden min-h-[600px]">
            {selectedVideo ? (
              <div className="p-6">
                 
                 {/* Video Header Context */}
                 <div className="flex items-start justify-between border-b border-gray-100 dark:border-gray-700 pb-4 mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{selectedVideo.title}</h3>
                      <div className="flex items-center gap-4 text-xs font-mono text-gray-500">
                         <span>ID: {selectedVideo.videoId}</span>
                         {selectedVideo.userScript?.status === 'added' && (
                           <>
                             <span>•</span>
                             <span>{selectedVideo.userScript.wordCount} words</span>
                             <span>•</span>
                             <span>Source: {selectedVideo.userScript.source}</span>
                           </>
                         )}
                      </div>
                    </div>
                 </div>

                 {/* Content Area */}
                 {!selectedVideo.userScript || selectedVideo.userScript.status === 'not_added' ? (
                    <div className="py-20 text-center flex flex-col items-center">
                       <FileText size={48} className="text-gray-300 dark:text-gray-600 mb-4" />
                       <h4 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">No Script Available</h4>
                       <p className="text-sm text-gray-500 max-w-sm">This video does not have an attached user script. Go back to Step 5 to paste or upload the script for this video.</p>
                       <button onClick={prevStage} className="mt-4 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600">Return to Workspace</button>
                    </div>
                 ) : (
                    <div>
                      {!currentAnalysis || currentAnalysis.status === 'idle' ? (
                        <div className="py-12 text-center flex flex-col items-center border border-dashed border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                           <Brain size={48} className="text-indigo-300 mb-4" />
                           <h4 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">Script Ready for Analysis</h4>
                           <p className="text-sm text-gray-500 max-w-sm mb-6">Compare this script against the cross-video workspace patterns and generate a deep improvement strategy.</p>
                           <button onClick={() => handleAnalyze(selectedVideo)} className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-md">
                             <Wand2 size={16} /> Analyze Script Now
                           </button>
                        </div>
                      ) : currentAnalysis.status === 'analyzing' ? (
                        <div className="py-20 text-center flex flex-col items-center">
                          <Activity className="text-indigo-500 animate-bounce mx-auto mb-4" size={48} />
                          <h4 className="text-lg font-bold text-gray-900 dark:text-white">Analyzing Script Architecture...</h4>
                          <p className="text-sm text-gray-500 mt-2">Comparing against niche intelligence data.</p>
                        </div>
                      ) : currentAnalysis.status === 'error' ? (
                        <div className="py-16 text-center flex flex-col items-center">
                          <AlertTriangle className="text-red-500 mx-auto mb-4" size={48} />
                          <h4 className="text-lg font-bold text-red-700">Analysis Failed</h4>
                          <p className="text-sm text-red-500 mt-2 max-w-sm">
                            {(currentAnalysis as any).errorMsg || 'The AI could not analyze this script. Please try again.'}
                          </p>
                          <button onClick={() => handleAnalyze(selectedVideo)} className="mt-4 px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium text-sm">
                            Retry Analysis
                          </button>
                        </div>
                      ) : currentAnalysis.data ? (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                           
                           {/* TOP LEVEL METRICS */}
                           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                             <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                               <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Hook Strength</div>
                               <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{currentAnalysis.data.hookStrength}<span className="text-sm text-gray-400">/100</span></div>
                             </div>
                             <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                               <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Pacing Score</div>
                               <div className="text-2xl font-black text-blue-600 dark:text-blue-400">{currentAnalysis.data.pacingScore}<span className="text-sm text-gray-400">/100</span></div>
                             </div>
                             <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                               <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Info Density</div>
                               <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{currentAnalysis.data.infoDensityScore}<span className="text-sm text-gray-400">/100</span></div>
                             </div>
                             <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                               <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Retention Est.</div>
                               <div className="text-2xl font-black text-orange-600 dark:text-orange-400">{currentAnalysis.data.retentionScore}<span className="text-sm text-gray-400">/100</span></div>
                             </div>
                           </div>

                           {/* SCRIPT VS COMPETITOR COMPARISON */}
                           <div>
                             <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                               <Target className="text-red-500"/> Competitor Comparison
                             </h4>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-red-50 dark:bg-red-900/10 p-5 rounded-xl border border-red-100 dark:border-red-900/30">
                                  <h5 className="font-bold text-red-800 dark:text-red-400 mb-2">What Competitors Do</h5>
                                  <p className="text-sm text-gray-700 dark:text-gray-300">{currentAnalysis.data.competitorComparison.whatCompetitorsDo}</p>
                                  <h5 className="font-bold text-red-800 dark:text-red-400 mt-4 mb-2">Competitor Advantage</h5>
                                  <p className="text-sm text-gray-700 dark:text-gray-300">{currentAnalysis.data.competitorComparison.competitorAdvantage}</p>
                                </div>
                                <div className="bg-blue-50 dark:bg-blue-900/10 p-5 rounded-xl border border-blue-100 dark:border-blue-900/30">
                                  <h5 className="font-bold text-blue-800 dark:text-blue-400 mb-2">Your Script Approach</h5>
                                  <p className="text-sm text-gray-700 dark:text-gray-300">{currentAnalysis.data.competitorComparison.whatUserDoes}</p>
                                  <h5 className="font-bold text-blue-800 dark:text-blue-400 mt-4 mb-2">Your Advantage</h5>
                                  <p className="text-sm text-gray-700 dark:text-gray-300">{currentAnalysis.data.competitorComparison.userAdvantage}</p>
                                </div>
                             </div>
                           </div>

                           {/* DIFFERENCE ENGINE */}
                           <div>
                             <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                               <GitMerge className="text-indigo-500" /> Difference Engine
                             </h4>
                             <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200 dark:divide-gray-700">
                                   <div className="p-4">
                                      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Hook Difference</div>
                                      <p className="text-sm text-gray-700 dark:text-gray-300">{currentAnalysis.data.differenceEngine.hookDifference}</p>
                                   </div>
                                   <div className="p-4">
                                      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Story Difference</div>
                                      <p className="text-sm text-gray-700 dark:text-gray-300">{currentAnalysis.data.differenceEngine.storyDifference}</p>
                                   </div>
                                   <div className="p-4">
                                      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Pacing Difference</div>
                                      <p className="text-sm text-gray-700 dark:text-gray-300">{currentAnalysis.data.differenceEngine.pacingDifference}</p>
                                   </div>
                                   <div className="p-4">
                                      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Emotional Difference</div>
                                      <p className="text-sm text-gray-700 dark:text-gray-300">{currentAnalysis.data.differenceEngine.emotionalDifference}</p>
                                   </div>
                                </div>
                             </div>
                           </div>

                           {/* SCRIPT IMPROVEMENT STRATEGY */}
                           <div className="bg-gradient-to-b from-gray-900 to-black rounded-2xl p-8 shadow-xl border border-gray-800 text-gray-300">
                             <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-800">
                               <Wand2 className="text-emerald-400" size={28} />
                               <div>
                                 <h2 className="text-xl font-black text-white">Actionable Script Improvements</h2>
                                 <p className="text-sm text-gray-400">Direct recommendations to beat the competition.</p>
                               </div>
                             </div>

                             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                               <div className="space-y-6">
                                 <div>
                                   <h4 className="text-[10px] text-red-400 uppercase tracking-widest font-bold mb-2">Identified Problems</h4>
                                   <ul className="space-y-1">
                                     {currentAnalysis.data.improvementStrategy.problems.map((p, i) => (
                                       <li key={i} className="text-sm text-gray-300 flex items-start gap-2"><span className="text-red-500 mt-0.5">•</span> {p}</li>
                                     ))}
                                   </ul>
                                 </div>
                                 <div>
                                   <h4 className="text-[10px] text-yellow-400 uppercase tracking-widest font-bold mb-2">Missed Opportunities</h4>
                                   <ul className="space-y-1">
                                     {currentAnalysis.data.improvementStrategy.missedOpportunities.map((p, i) => (
                                       <li key={i} className="text-sm text-gray-300 flex items-start gap-2"><span className="text-yellow-500 mt-0.5">•</span> {p}</li>
                                     ))}
                                   </ul>
                                 </div>
                               </div>
                               <div className="space-y-6">
                                 <div>
                                   <h4 className="text-[10px] text-emerald-400 uppercase tracking-widest font-bold mb-2">Recommended Changes</h4>
                                   <ul className="space-y-1 bg-gray-800/50 p-4 rounded-xl border border-gray-700/50">
                                     {currentAnalysis.data.improvementStrategy.recommendedChanges.map((p, i) => (
                                       <li key={i} className="text-sm text-white font-medium flex items-start gap-2"><ArrowRight size={14} className="text-emerald-500 mt-0.5 shrink-0"/> {p}</li>
                                     ))}
                                   </ul>
                                 </div>
                                 <div>
                                   <h4 className="text-[10px] text-blue-400 uppercase tracking-widest font-bold mb-2">Improved Structure</h4>
                                   <div className="text-sm text-gray-300 p-4 bg-black/40 rounded-xl font-mono leading-relaxed border border-gray-800">
                                     {currentAnalysis.data.improvementStrategy.improvedStructure}
                                   </div>
                                 </div>
                               </div>
                             </div>
                           </div>

                        </div>
                      ) : null}
                    </div>
                 )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-500 py-20">
                <FileText size={48} className="mb-4 text-gray-300 dark:text-gray-600" />
                <p>Select a video from the workspace to begin script reverse engineering.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
