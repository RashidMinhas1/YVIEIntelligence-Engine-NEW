import React, { useState } from "react";
import { V2Video, AdvancedVideoResearch } from "@/lib/types/discovery-v2";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Brain, Activity, Target, AlertTriangle, Play, BarChart, Clock, TrendingUp } from "lucide-react";

interface Props {
  video: V2Video;
  allVideos: V2Video[];
  activeModules?: string[];
}

export default function AdvancedResearchPanel({ video, allVideos, activeModules = [] }: Props) {
  const [researchData, setResearchData] = useState<AdvancedVideoResearch | null>(video.advancedResearch || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchResearch = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/discovery-v2/outliers/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetVideo: video, allVideos })
      });
      if (!res.ok) throw new Error("Failed to fetch advanced research");
      const data = await res.json();
      setResearchData(data.advancedResearch);
      
      // Update the parent's memory reference if possible
      video.advancedResearch = data.advancedResearch;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!researchData && !isLoading) {
    return (
      <div className="mt-4 border-t border-gray-100 dark:border-gray-800 pt-4 pb-2">
        <button 
          onClick={fetchResearch}
          className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 font-medium rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition"
        >
          <Brain size={18} />
          Run Advanced AI Research
        </button>
        {error && <p className="text-red-500 text-xs mt-2 text-center">{error}</p>}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mt-4 border-t border-gray-100 dark:border-gray-800 pt-6 pb-4 flex flex-col items-center justify-center text-gray-500">
        <Loader2 className="animate-spin mb-3 text-red-500" size={32} />
        <p className="text-sm font-medium">Running Deep Semantic Analysis...</p>
        <p className="text-xs text-gray-400 mt-1 max-w-[250px] text-center">Checking concept saturation, lifecycle timeline, and content gaps against all historical videos.</p>
      </div>
    );
  }

  if (!researchData) return null;

  return (
    <div className="mt-4 border-t border-gray-100 dark:border-gray-800 pt-4" onClick={(e) => e.stopPropagation()}>
      <h5 className="text-sm font-bold flex items-center gap-2 mb-3 text-gray-900 dark:text-white">
        <Brain size={16} className="text-red-500" /> Advanced AI Research
      </h5>
      
      <Tabs defaultValue="saturation" className="w-full">
        <TabsList className="flex flex-wrap gap-2 mb-4 h-auto bg-transparent p-0 justify-start">
          {(!activeModules.length || activeModules.includes("Concept Saturation Score")) && (
            <TabsTrigger value="saturation" className="text-xs py-1.5 px-4 rounded-full data-[state=active]:bg-red-600 data-[state=active]:text-white data-[state=active]:shadow-md border border-transparent data-[state=inactive]:bg-gray-100 dark:data-[state=inactive]:bg-gray-800">Saturation</TabsTrigger>
          )}
          {(!activeModules.length || activeModules.includes("Content Gap Finder") || activeModules.includes("Competition Score")) && (
            <TabsTrigger value="gaps" className="text-xs py-1.5 px-4 rounded-full data-[state=active]:bg-red-600 data-[state=active]:text-white data-[state=active]:shadow-md border border-transparent data-[state=inactive]:bg-gray-100 dark:data-[state=inactive]:bg-gray-800">Gaps & Difficulty</TabsTrigger>
          )}
          {(!activeModules.length || activeModules.includes("Best Publishing Window") || activeModules.includes("Clone Risk Detector")) && (
            <TabsTrigger value="action" className="text-xs py-1.5 px-4 rounded-full data-[state=active]:bg-red-600 data-[state=active]:text-white data-[state=active]:shadow-md border border-transparent data-[state=inactive]:bg-gray-100 dark:data-[state=inactive]:bg-gray-800">Action Center</TabsTrigger>
          )}
        </TabsList>
        
        {/* TAB 1: SATURATION */}
        <TabsContent value="saturation" className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between mb-2">
              <h6 className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5"><Activity size={14} /> Concept Saturation</h6>
              <span className={
                "text-xs font-bold px-2 py-0.5 rounded-full " + 
                (researchData.saturation.level === 'Low Saturation' ? 'bg-green-100 text-green-700' : 
                 researchData.saturation.level === 'Medium Saturation' ? 'bg-yellow-100 text-yellow-700' : 
                 'bg-red-100 text-red-700')
              }>
                {researchData.saturation.level}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3">
              <div className="text-center bg-white dark:bg-gray-800 rounded p-2 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="text-[10px] text-gray-500 uppercase font-semibold">Semantic Matches</div>
                <div className="font-bold text-gray-900 dark:text-white mt-1">{researchData.saturation.matchCount}</div>
              </div>
              <div className="text-center bg-white dark:bg-gray-800 rounded p-2 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="text-[10px] text-gray-500 uppercase font-semibold">Trend</div>
                <div className="font-bold text-gray-900 dark:text-white mt-1">{researchData.saturation.trendDirection}</div>
              </div>
              <div className="text-center bg-white dark:bg-gray-800 rounded p-2 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="text-[10px] text-gray-500 uppercase font-semibold">Opportunity</div>
                <div className="font-bold text-red-600 dark:text-red-400 mt-1">{researchData.saturation.opportunityScore}/100</div>
              </div>
            </div>
            <p className="text-xs mt-3 text-gray-600 dark:text-gray-400 leading-relaxed border-t border-gray-200 dark:border-gray-700 pt-2">
              <strong className="text-gray-800 dark:text-gray-200">AI Summary:</strong> {researchData.saturation.aiSummary}
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 border border-gray-100 dark:border-gray-800">
            <h6 className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 mb-3"><Clock size={14} /> Lifecycle Timeline</h6>
            <div className="space-y-3 relative before:absolute before:inset-0 before:ml-1.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-300 before:to-transparent">
              {researchData.lifecycleTimeline.map((item, idx) => (
                <div key={idx} className="relative flex items-center gap-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full shrink-0 relative z-10 ring-4 ring-gray-50 dark:ring-gray-900"></div>
                  <div>
                    <h4 className="text-[11px] font-bold text-gray-900 dark:text-white">{item.stage}</h4>
                    <p className="text-[11px] text-gray-500">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
        </TabsContent>

        {/* TAB 2: GAPS */}
        <TabsContent value="gaps" className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 border border-gray-100 dark:border-gray-800">
            <h6 className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 mb-2"><Target size={14} /> Content Gap Finder</h6>
            <div className="space-y-2 mt-2">
              <div className="text-xs"><strong className="text-gray-900 dark:text-white">Suggested Angle:</strong> <span className="text-gray-600 dark:text-gray-400">{researchData.contentGap.suggestedAngle}</span></div>
              <div className="text-xs"><strong className="text-gray-900 dark:text-white">Untapped Audience:</strong> <span className="text-gray-600 dark:text-gray-400">{researchData.contentGap.suggestedAudience}</span></div>
              <div className="text-xs"><strong className="text-gray-900 dark:text-white">Core Improvement:</strong> <span className="text-red-600 dark:text-red-400">{researchData.contentGap.suggestedImprovement}</span></div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 border border-gray-100 dark:border-gray-800">
              <h6 className="text-[11px] font-bold text-gray-500 uppercase mb-1">Competition</h6>
              <div className="font-bold text-sm text-gray-900 dark:text-white mb-1">{researchData.competition.level}</div>
              <p className="text-[10px] text-gray-500 line-clamp-3" title={researchData.competition.explanation}>{researchData.competition.explanation}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 border border-gray-100 dark:border-gray-800">
              <h6 className="text-[11px] font-bold text-gray-500 uppercase mb-1">Difficulty</h6>
              <div className="font-bold text-sm text-gray-900 dark:text-white mb-1">{researchData.difficulty.level}</div>
              <p className="text-[10px] text-gray-500 line-clamp-3" title={researchData.difficulty.explanation}>{researchData.difficulty.explanation}</p>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 border border-gray-100 dark:border-gray-800">
            <h6 className="text-[11px] font-bold text-gray-500 uppercase mb-2">First Mover Analysis</h6>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div><strong>Pioneer:</strong> {researchData.firstMover.firstCreator}</div>
              <div><strong>Highest Perf:</strong> {researchData.firstMover.highestVersionCreator}</div>
              <div><strong>Latest Entry:</strong> {researchData.firstMover.latestVersionCreator}</div>
              <div><strong>Total Competitors:</strong> {researchData.firstMover.totalChannels}</div>
            </div>
          </div>
        </TabsContent>

        {/* TAB 3: ACTION */}
        <TabsContent value="action" className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          
          <div className={
            "rounded-lg p-4 border " + 
            (researchData.actionCenter.recommendation === 'Create Immediately' ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-900' :
             researchData.actionCenter.recommendation === 'Create with Improvements' ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-900' :
             'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-900')
          }>
            <h6 className="text-sm font-bold mb-1 flex items-center gap-2">
              {researchData.actionCenter.recommendation === 'Create Immediately' && <Play size={16} className="text-green-600" />}
              {researchData.actionCenter.recommendation === 'Create with Improvements' && <Target size={16} className="text-yellow-600" />}
              {(researchData.actionCenter.recommendation === 'Avoid' || researchData.actionCenter.recommendation === 'Wait') && <AlertTriangle size={16} className="text-red-600" />}
              {researchData.actionCenter.recommendation}
            </h6>
            <p className="text-xs font-medium mb-3 opacity-90">{researchData.actionCenter.reason}</p>
            
            <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-black/10 dark:border-white/10 text-xs">
              <div><strong>Potential:</strong> {researchData.actionCenter.expectedPotential}</div>
              <div><strong>Risk Level:</strong> {researchData.cloneRisk.level}</div>
              <div className="col-span-2"><strong>Next Step:</strong> {researchData.actionCenter.suggestedNextStep}</div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 border border-gray-100 dark:border-gray-800">
            <h6 className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">Executive Summary</h6>
            <div className="space-y-2">
              <div className="text-xs"><strong className="text-green-600">Strengths:</strong> {researchData.opportunitySummary.strengths}</div>
              <div className="text-xs"><strong className="text-red-600">Weaknesses:</strong> {researchData.opportunitySummary.weaknesses}</div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
