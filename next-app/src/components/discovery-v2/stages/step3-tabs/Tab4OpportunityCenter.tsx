'use client';

import React, { useState } from 'react';
import { Step3TabProps, V2Video, AdvancedVideoResearch } from './types';
import { Compass, Zap, Swords, TrendingUp, AlertTriangle, Lightbulb, BarChart, Loader2, Play } from 'lucide-react';



  const generateMockResearch = (title: string, relatedVideos?: V2Video[]): AdvancedVideoResearch => {
    const score = Math.floor(Math.random() * 30) + 70; // 70-99
    // Extract a meaningful concept from the title to generate related fake titles
    const words = title.split(' ');
    const baseConcept = words.length > 3 ? words.slice(words.length > 5 ? 2 : 1).join(' ') : title;
    
    // Pick random channels from relatedVideos to act as the "other channels" who uploaded it
    const channels = (relatedVideos || []).map(v => ({ channelTitle: v.channelTitle, thumbnail: v.thumbnail, videoId: v.videoId || v.id }));
    
    // Create synthetic competitors that perfectly match the active video's concept
    const selectedCompetitors = [
      {
        channelTitle: channels.length > 0 ? channels[0].channelTitle : "PioneerCreator",
        title: `The Original Guide to ${baseConcept}`,
        videoId: channels.length > 0 ? channels[0].videoId : "dQw4w9WgXcQ",
        publishedAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year ago
        thumbnail: channels.length > 0 ? channels[0].thumbnail : "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=160&auto=format&fit=crop&q=60"
      },
      {
        channelTitle: channels.length > 1 ? channels[1].channelTitle : "EvolutionChannel",
        title: `I Tested ${baseConcept} (And It Actually Works)`,
        videoId: channels.length > 1 ? channels[1].videoId : "yPYZpwSpKmA",
        publishedAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(), // 6 months ago
        thumbnail: channels.length > 1 ? channels[1].thumbnail : "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=160&auto=format&fit=crop&q=60"
      },
      {
        channelTitle: channels.length > 2 ? channels[2].channelTitle : "ModernOutlier",
        title: title, // Exact title of the active video
        videoId: channels.length > 2 ? channels[2].videoId : "3tmd-ClpJxA",
        publishedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 1 month ago
        thumbnail: channels.length > 2 ? channels[2].thumbnail : "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=160&auto=format&fit=crop&q=60"
      }
    ];

    const timelineStages = selectedCompetitors.map((comp, idx) => {
      const isFirst = idx === 0;
      const packagingList = [
        "Simplified title to increase curiosity; removed complex jargon. Thumbnail switched to a single focal point instead of a busy collage.",
        "Used a curiosity-inducing question style title. Thumbnail added a red circle highlighting a key hidden detail.",
        "Used a mystery-explanation style title. Thumbnail used high-contrast dark lighting with minimal text."
      ];
      const hookList = [
        "Introduced a basic educational walkthrough; standard slow introduction.",
        "Switched to a 10-second fast-paced preview hook showing the climax of the story first.",
        "Used a multi-loop curiosity hook, asking 3 unanswered questions in the first 15 seconds to maximize retention."
      ];
      const scriptList = [
        "Linear narrative. Explains point A to B directly.",
        "Non-linear narrative. Starts at the end, then explains how we got there.",
        "Case-study driven narrative. Uses 3 real-world examples to prove the point before explaining the theory."
      ];
      const ctaBodyList = [
        "Standard end-of-video subscribe ask. Pacing is slow.",
        "Mid-roll subscribe ask tied to a value-add. Faster pacing with B-roll.",
        "No explicit subscribe ask; focuses entirely on high-retention pacing with sound design."
      ];
      const uniquenessList = [
        "First mover. Established the core concept on YouTube.",
        "Added high-quality visuals and improved pacing compared to the pioneer.",
        "Perfected the retention structure and added a unique contrasting angle that the previous creators missed."
      ];
      const multipliers = ["1.2x Average", "2.8x Outlier", "8.5x Mega-Outlier"];

      return {
        stage: `Stage ${idx + 1}: ${comp.channelTitle} Coverage`,
        channelTitle: comp.channelTitle,
        videoTitle: comp.title,
        videoId: comp.videoId,
        publishDate: new Date(comp.publishedAt || new Date()).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
        thumbnail: comp.thumbnail,
        packaging: packagingList[idx % packagingList.length],
        hook: hookList[idx % hookList.length],
        scriptChanges: scriptList[idx % scriptList.length],
        bodyCta: ctaBodyList[idx % ctaBodyList.length],
        uniqueness: isFirst ? "Original Pioneer of this specific angle." : uniquenessList[idx % uniquenessList.length],
        multiplier: multipliers[idx % multipliers.length]
      };
    });

    return {
      saturation: {
        level: "Medium Saturation",
        matchCount: 15,
        channelCount: 5,
        avgViews: 250000,
        trendDirection: "Growing",
        opportunityScore: score,
        aiSummary: "Moderate coverage but high audience demand remains."
      },
      firstMover: {
        firstCreator: timelineStages[0]?.channelTitle || "PioneerCreator",
        firstUploadDate: timelineStages[0]?.publishDate || "2024-01-15T00:00:00Z",
        firstVideoId: timelineStages[0]?.videoId || "dQw4w9WgXcQ",
        highestVersionCreator: timelineStages[timelineStages.length - 1]?.channelTitle || "CurrentTopCreator",
        highestVideoId: timelineStages[timelineStages.length - 1]?.videoId || "3tmd-ClpJxA",
        latestVersionCreator: "RecentUploader",
        totalChannels: 5
      },
      lifecycleTimeline: timelineStages,
      contentGap: {
        opportunityLevel: "High",
        suggestedAngle: `Deep-dive analysis of ${baseConcept}`,
        suggestedAudience: "Advanced viewers seeking technical details",
        suggestedImprovement: "Higher pacing and better storytelling",
        missingElements: [
          "3D animated timeline explanations", 
          "Verified real-world case study examples", 
          "Curiosity loop hooks in the first 30 seconds"
        ],
        editingStyle: "Use rapid pacing (cut every 3-4 seconds), high-contrast B-roll, and sound-design-heavy transitions. Competitors used very slow, static editing."
      },
      trendStage: {
        stage: "Growing",
        explanation: "Search volume is increasing month-over-month."
      },
      competition: {
        level: "Medium Competition",
        explanation: "Some big channels covered it, but they left content gaps."
      },
      difficulty: {
        level: "Intermediate",
        explanation: "Requires good research but standard editing."
      },
      cloneRisk: {
        level: "Low Risk",
        explanation: "Highly specific to your unique delivery."
      },
      opportunitySummary: {
        strengths: "Proven CTR, high retention potential.",
        weaknesses: "Requires significant research time.",
        demandGrowing: true,
        isEvergreen: true
      },
      actionCenter: {
        recommendation: "Create with Improvements",
        reason: `The concept "${title}" has strong market validation. If you add practical examples and faster pacing to your content, your virality score will be much closer to the original outlier!`,
        opportunityLevel: "High",
        riskLevel: "Medium",
        expectedPotential: "100k - 500k Views",
        suggestedNextStep: "Write a script focusing on the content gap.",
        confidenceScore: 85
      }
    };
  };

export default function Tab4OpportunityCenter({ selectedVideo, setSelectedVideo, activeSession, updateSessionState, videos }: Step3TabProps) {
  const activeOutliers = activeSession?.filters?.outlierVideos || [];
  
  // Find which video is currently active. Defaults to the first outlier if none is explicitly selected.
  const activeVideo = activeOutliers.find((v: V2Video) => v.id === selectedVideo?.id) || activeOutliers[0];

  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});

  const runAI = async (videoIds: string[], selectFirstAfter = false) => {
    const newLoading = { ...loadingMap };
    videoIds.forEach(id => newLoading[id] = true);
    setLoadingMap(newLoading);

    // Simulate AI delay
    await new Promise(r => setTimeout(r, 2500));

    const currentOutliers = [...(activeSession?.filters?.outlierVideos || [])];
    
    videoIds.forEach(id => {
      const idx = currentOutliers.findIndex((v: V2Video) => v.id === id);
      if (idx !== -1) {
        currentOutliers[idx] = {
          ...currentOutliers[idx],
          advancedResearch: generateMockResearch(currentOutliers[idx].title)
        };
      }
    });

    if (updateSessionState) {
      await updateSessionState({ outlierVideos: currentOutliers });
    }

    if (selectFirstAfter && setSelectedVideo && currentOutliers.length > 0) {
      setSelectedVideo(currentOutliers[0]);
    }

    setLoadingMap(prev => {
      const next = { ...prev };
      videoIds.forEach(id => delete next[id]);
      return next;
    });
  };

  if (activeOutliers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-red-50 dark:bg-gray-800/50 rounded-2xl border border-red-100 dark:border-gray-700 p-8 text-center border-dashed">
        <Compass className="w-16 h-16 text-red-300 dark:text-gray-600 mb-4" />
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Videos Selected</h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-md">
          Select videos from the Outlier Videos tab to evaluate their market opportunity, competition level, and viability.
        </p>
      </div>
    );
  }

  const MetricCard = ({ title, value, icon, color, progress }: { title: string, value: string | number | undefined, icon: React.ReactNode, color: string, progress?: number }) => (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:border-red-300 dark:hover:border-red-900/50 transition-colors shadow-sm group">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2 rounded-lg bg-${color.split('-')[1]}-50 dark:bg-${color.split('-')[1]}-900/20 ${color}`}>
          {icon}
        </div>
        <span className="text-2xl font-bold text-gray-900 dark:text-white capitalize">{value || 'N/A'}</span>
      </div>
      <h4 className="text-gray-500 dark:text-gray-400 text-sm font-bold">{title}</h4>
      {progress !== undefined && (
        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 mt-3">
          <div className={`h-1.5 rounded-full ${color.replace('text-', 'bg-')}`} style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}></div>
        </div>
      )}
    </div>
  );

  const allNeedsAnalysis = activeOutliers.filter((v: any) => !v.advancedResearch).map((v: any) => v.id);

  return (
    <div className="space-y-12">
      {/* Global Actions */}
      <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div>
           <h3 className="font-bold text-gray-900 dark:text-white">Opportunity Center</h3>
           <p className="text-sm text-gray-500">Evaluating {activeOutliers.length} selected outlier videos.</p>
        </div>
        <button 
          onClick={() => runAI(allNeedsAnalysis, true)}
          disabled={allNeedsAnalysis.length === 0 || Object.keys(loadingMap).length > 0}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:text-gray-500 text-white px-5 py-2.5 rounded-lg font-bold transition-all shadow-sm"
        >
          {Object.keys(loadingMap).length > 0 ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Processing AI...</>
          ) : allNeedsAnalysis.length === 0 ? (
            <><Zap className="w-5 h-5" /> All Videos Analyzed</>
          ) : (
            <><Play className="w-5 h-5" /> Run AI on All ({allNeedsAnalysis.length})</>
          )}
        </button>
      </div>
      {activeVideo && (() => {
        const video = activeVideo;
        const adv = video.advancedResearch;
        const isAnalyzing = loadingMap[video.id];
        
        return (
          <div key={video.id} className="relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
            {/* Video Header */}
            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-4">
              <img src={video.thumbnail} alt={video.title} className="w-20 h-12 object-cover rounded shadow-sm" />
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white line-clamp-1">{video.title}</h3>
                <p className="text-xs text-gray-500">{video.channelTitle} • {video.viewCount.toLocaleString()} views</p>
              </div>
            </div>

            <div className="p-6 space-y-8">
              {/* AI Recommendation Banner */}
              <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 p-6 rounded-xl shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Zap className="w-32 h-32 text-red-500" />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row items-start gap-4">
                  <div className="p-3 bg-white dark:bg-red-900/30 rounded-xl text-red-600 dark:text-red-400 shadow-sm border border-red-100 dark:border-red-900/50">
                    <Lightbulb className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                      Action Center
                      {adv?.actionCenter?.recommendation && (
                        <span className="text-xs font-bold px-2.5 py-1 bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 rounded-md border border-red-200 dark:border-red-800 uppercase tracking-wider">
                          {adv.actionCenter.recommendation}
                        </span>
                      )}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-6 max-w-3xl">
                      {adv?.actionCenter?.reason || "Analyze this video to determine if you should create content on this topic."}
                    </p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col justify-center">
                        <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Opportunity Level</div>
                        <div className="text-sm font-bold text-gray-900 dark:text-white">{adv?.actionCenter?.opportunityLevel || 'Pending'}</div>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col justify-center">
                        <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Risk Level</div>
                        <div className="text-sm font-bold text-gray-900 dark:text-white">{adv?.actionCenter?.riskLevel || 'Pending'}</div>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col justify-center">
                        <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Expected Potential</div>
                        <div className="text-sm font-bold text-gray-900 dark:text-white">{adv?.actionCenter?.expectedPotential || 'Pending'}</div>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col justify-center">
                        <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Confidence Score</div>
                        <div className="text-sm font-bold text-gray-900 dark:text-white">{adv?.actionCenter?.confidenceScore ? `${adv.actionCenter.confidenceScore}%` : 'Pending'}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Opportunity Metrics</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <MetricCard 
                    title="Opportunity Score" 
                    value={adv?.saturation?.opportunityScore ? `${adv.saturation.opportunityScore}/100` : 'N/A'}
                    icon={<Zap className="w-5 h-5 text-yellow-500" />} 
                    color="text-yellow-500"
                    progress={adv?.saturation?.opportunityScore || 0}
                  />
                  <MetricCard 
                    title="Competition Level" 
                    value={adv?.competition?.level || 'N/A'}
                    icon={<Swords className="w-5 h-5 text-orange-500" />} 
                    color="text-orange-500"
                  />
                  <MetricCard 
                    title="Saturation Meter" 
                    value={adv?.saturation?.level || 'N/A'}
                    icon={<BarChart className="w-5 h-5 text-blue-500" />} 
                    color="text-blue-500"
                  />
                  <MetricCard 
                    title="Trend Stage" 
                    value={adv?.trendStage?.stage || 'N/A'}
                    icon={<TrendingUp className="w-5 h-5 text-green-500" />} 
                    color="text-green-500"
                  />
                  <MetricCard 
                    title="Difficulty Score" 
                    value={adv?.difficulty?.level || 'N/A'}
                    icon={<AlertTriangle className="w-5 h-5 text-red-500" />} 
                    color="text-red-500"
                  />
                  <MetricCard 
                    title="Clone Risk" 
                    value={adv?.cloneRisk?.level || 'N/A'}
                    icon={<Compass className="w-5 h-5 text-purple-500" />} 
                    color="text-purple-500"
                  />
                </div>
              </div>

              {/* Content Gap Finder UI */}
              {adv && (
                <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Content Gap Finder</h3>
                    <span className="flex items-center gap-1.5 text-sm font-bold text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400 px-3 py-1 rounded-full border border-green-200 dark:border-green-800">
                      <TrendingUp className="w-4 h-4" />
                      Overall Opportunity: {adv.contentGap?.opportunityLevel || 'High'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Missing Angle Card */}
                    <div className="bg-white dark:bg-gray-800 border border-red-200 dark:border-red-900/30 rounded-xl p-5 shadow-sm">
                       <div className="flex items-center gap-3 mb-4">
                         <div className="bg-blue-50 text-blue-500 p-2 rounded-lg">
                           <Lightbulb className="w-5 h-5" />
                         </div>
                         <h4 className="font-bold text-gray-900 dark:text-white">Missing Angle</h4>
                       </div>
                       <p className="text-gray-700 dark:text-gray-300 font-medium mb-6">
                         "{adv.contentGap?.suggestedAngle || 'N/A'}"
                       </p>
                       <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex items-start gap-2">
                         <Zap className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                         <p className="text-xs text-gray-500"><span className="font-bold text-gray-700 dark:text-gray-300">Expected Impact:</span> High potential for differentiation.</p>
                       </div>
                    </div>

                    {/* Untapped Audience Card */}
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm">
                       <div className="flex items-center gap-3 mb-4">
                         <div className="bg-purple-50 text-purple-500 p-2 rounded-lg">
                           <Compass className="w-5 h-5" />
                         </div>
                         <h4 className="font-bold text-gray-900 dark:text-white">Untapped Audience</h4>
                       </div>
                       <p className="text-gray-700 dark:text-gray-300 font-medium mb-6">
                         "{adv.contentGap?.suggestedAudience || 'N/A'}"
                       </p>
                       <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex items-start gap-2">
                         <Zap className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                         <p className="text-xs text-gray-500"><span className="font-bold text-gray-700 dark:text-gray-300">Expected Impact:</span> Reach new demographics.</p>
                       </div>
                    </div>

                    {/* Format Innovation Card */}
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm">
                       <div className="flex items-center gap-3 mb-4">
                         <div className="bg-green-50 text-green-500 p-2 rounded-lg">
                           <BarChart className="w-5 h-5" />
                         </div>
                         <h4 className="font-bold text-gray-900 dark:text-white">Format Innovation</h4>
                       </div>
                       <p className="text-gray-700 dark:text-gray-300 font-medium mb-6">
                         "{adv.contentGap?.suggestedImprovement || 'N/A'}"
                       </p>
                       <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex items-start gap-2">
                         <Zap className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                         <p className="text-xs text-gray-500"><span className="font-bold text-gray-700 dark:text-gray-300">Expected Impact:</span> Improved retention and engagement.</p>
                       </div>
                    </div>

                    {/* Unanswered Questions Card */}
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm">
                       <div className="flex items-center gap-3 mb-4">
                         <div className="bg-orange-50 text-orange-500 p-2 rounded-lg">
                           <AlertTriangle className="w-5 h-5" />
                         </div>
                         <h4 className="font-bold text-gray-900 dark:text-white">Unanswered Questions</h4>
                       </div>
                       <p className="text-gray-700 dark:text-gray-300 font-medium mb-6">
                         "Viewers are likely asking for practical steps not covered in current videos."
                       </p>
                       <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex items-start gap-2">
                         <Zap className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                         <p className="text-xs text-gray-500"><span className="font-bold text-gray-700 dark:text-gray-300">Expected Impact:</span> High search volume potential.</p>
                       </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Overlay if not analyzed */}
            {!adv && (
               <div className="absolute inset-0 bg-white/60 dark:bg-gray-900/80 backdrop-blur-[2px] flex flex-col items-center justify-center z-20 transition-all border border-transparent hover:border-red-500 rounded-2xl">
                 {isAnalyzing ? (
                   <div className="text-center">
                     <Loader2 className="w-12 h-12 text-red-500 animate-spin mx-auto mb-4" />
                     <h3 className="text-xl font-bold text-gray-900 dark:text-white">Analyzing Market Opportunity...</h3>
                     <p className="text-gray-500">Cross-referencing {video.channelTitle} with global trends.</p>
                   </div>
                 ) : (
                   <div className="text-center bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-md">
                     <div className="bg-red-50 dark:bg-red-900/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                       <Zap className="w-8 h-8 text-red-500" />
                     </div>
                     <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Run Advanced AI Research</h3>
                     <p className="text-gray-500 text-sm mb-6">Discover content gaps, evaluate competition, and get actionable recommendations for this specific topic.</p>
                     <button 
                       onClick={() => runAI([video.id])}
                       className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-sm transition-all"
                     >
                       Run Analysis
                     </button>
                   </div>
                 )}
               </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
