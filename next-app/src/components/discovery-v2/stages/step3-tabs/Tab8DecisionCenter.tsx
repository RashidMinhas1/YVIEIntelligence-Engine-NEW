'use client';

import React from 'react';
import { Step3TabProps, V2Video } from './types';
import { Info, TrendingUp, ShieldAlert, Zap, CheckCircle2, AlertTriangle, Clock, XCircle, Lightbulb, Target, ExternalLink, PlayCircle, Eye, Activity, CheckSquare, Square } from 'lucide-react';

export default function Tab8DecisionCenter({ videos, activeSession, updateSessionState }: Step3TabProps) {
  const selectedVideoIds = activeSession?.filters?.outlierVideos?.map((v: V2Video) => v.id) || [];
  
  const toggleVideoSelection = (video: V2Video) => {
    if (!updateSessionState) return;
    
    const isSelected = selectedVideoIds.includes(video.id);
    let newOutliers = [...(activeSession?.filters?.outlierVideos || [])];
    
    if (isSelected) {
      newOutliers = newOutliers.filter(v => v.id !== video.id);
    } else {
      newOutliers.push(video);
    }
    
    updateSessionState({
      filters: {
        ...(activeSession?.filters || {}),
        outlierVideos: newOutliers,
        minSimilarity: activeSession?.filters?.minSimilarity || 50,
      }
    });
  };

  const proceedToStep4 = () => {
    if (updateSessionState) {
      updateSessionState({ wizardStep: 4 });
    }
  };

  if (!videos || videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        <Info className="w-12 h-12 mb-4 text-red-500" />
        <p className="text-lg font-medium">No videos available to review.</p>
      </div>
    );
  }

  // Sort videos so selected ones are at the top
  const sortedVideos = [...videos].sort((a, b) => {
    const aSelected = selectedVideoIds.includes(a.id);
    const bSelected = selectedVideoIds.includes(b.id);
    if (aSelected && !bSelected) return -1;
    if (!aSelected && bSelected) return 1;
    return ((b as any).performanceRatio || 0) - ((a as any).performanceRatio || 0); // fallback to performance
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Action Bar (Top) */}
      <div className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Master Selection List</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Select the videos you want to reverse-engineer in Step 4. You have selected {selectedVideoIds.length} out of {videos.length} analyzed videos.
          </p>
        </div>
        <button
          onClick={proceedToStep4}
          disabled={selectedVideoIds.length === 0}
          className={`px-6 py-3 rounded-xl font-bold transition shadow-md flex items-center gap-2 whitespace-nowrap ${
            selectedVideoIds.length > 0
              ? 'bg-red-600 hover:bg-red-700 text-white hover:scale-105 active:scale-95 shadow-red-500/20'
              : 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
          }`}
        >
          Proceed to Step 4: Concept Match 🚀
        </button>
      </div>

      {/* Video Master List */}
      <div className="space-y-6">
        {sortedVideos.map((video) => {
          const isSelected = selectedVideoIds.includes(video.id);
          const adv = video.advancedResearch;
          const action = adv?.actionCenter;
          
          const recType = action?.recommendation?.toLowerCase() || '';
          let RecIcon = Lightbulb;
          let recColor = 'bg-gray-100 text-gray-800 border-gray-300';
          
          if (recType.includes('immediately') || recType.includes('high')) {
            RecIcon = CheckCircle2;
            recColor = 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800';
          } else if (recType.includes('improve') || recType.includes('medium')) {
            RecIcon = AlertTriangle;
            recColor = 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800';
          } else if (recType.includes('wait') || recType.includes('low')) {
            RecIcon = Clock;
            recColor = 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
          } else if (recType.includes('avoid')) {
            RecIcon = XCircle;
            recColor = 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
          }

          return (
            <div 
              key={video.id} 
              className={`rounded-2xl border-2 transition-all duration-300 overflow-hidden ${
                isSelected 
                  ? 'border-red-500 shadow-lg shadow-red-500/10 dark:shadow-none bg-white dark:bg-gray-800/90' 
                  : 'border-gray-200 dark:border-gray-700 hover:border-red-300 bg-gray-50/50 dark:bg-gray-900/50 opacity-90'
              }`}
            >
              {/* Card Header (Video Info) */}
              <div className="flex flex-col md:flex-row p-4 gap-6 items-start md:items-center">
                
                {/* Checkbox & Thumbnail */}
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <button 
                    onClick={() => toggleVideoSelection(video)}
                    className={`p-1 rounded-lg transition-colors ${isSelected ? 'text-red-600' : 'text-gray-400 hover:text-red-500'}`}
                  >
                    {isSelected ? <CheckSquare className="w-8 h-8" /> : <Square className="w-8 h-8" />}
                  </button>
                  <div className="relative w-32 h-20 rounded-lg overflow-hidden shrink-0 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                    <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                      {video.duration || '00:00'}
                    </div>
                  </div>
                </div>

                {/* Title & Channel */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-lg text-gray-900 dark:text-white line-clamp-2 leading-snug mb-1">
                    {video.title}
                  </h4>
                  <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">{video.channelTitle}</span>
                    <span>•</span>
                    <span>{video.publishedAt}</span>
                    <a 
                      href={`https://youtube.com/watch?v=${video.id}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-red-500 hover:text-red-600 hover:underline ml-2 font-medium"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Watch
                    </a>
                  </div>
                </div>

                {/* Primary Metrics */}
                <div className="flex gap-4 shrink-0 mt-4 md:mt-0">
                  <div className="text-center bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-2 border border-gray-200 dark:border-gray-700">
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-0.5 flex items-center justify-center gap-1">
                      <Eye className="w-3 h-3" /> Views
                    </div>
                    <div className="font-bold text-gray-900 dark:text-white text-lg">{video.viewCount?.toLocaleString() || 'N/A'}</div>
                  </div>
                  <div className="text-center bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-2 border border-red-100 dark:border-red-900/50">
                    <div className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider mb-0.5 flex items-center justify-center gap-1">
                      <TrendingUp className="w-3 h-3" /> Virality
                    </div>
                    <div className="font-bold text-red-700 dark:text-red-300 text-lg">{(video as any).performanceRatio || 'N/A'}x</div>
                  </div>
                </div>
              </div>

              {/* Expanded AI Data (Always shown if selected, or if rich data exists) */}
              {(isSelected || adv) && (
                <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Recommendation Badge */}
                    <div className={`col-span-1 rounded-xl p-4 flex flex-col justify-center border ${recColor}`}>
                      <div className="flex items-center gap-3 mb-2">
                        <RecIcon className="w-6 h-6" />
                        <span className="font-bold uppercase tracking-wide text-sm">{action?.recommendation || 'Analysis Pending'}</span>
                      </div>
                      <p className="text-sm font-medium opacity-90 line-clamp-3">
                        {action?.reason || 'Run deep analysis to get an AI verdict on this video concept.'}
                      </p>
                    </div>

                    {/* Stats Grid */}
                    <div className="col-span-1 grid grid-cols-2 gap-3">
                       <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700 flex flex-col justify-center">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1"><Zap className="w-3 h-3 text-yellow-500" /> Opp Score</span>
                          <span className="font-bold text-gray-900 dark:text-white text-sm">{adv?.saturation?.opportunityScore ? `${adv.saturation.opportunityScore}/100` : 'N/A'}</span>
                       </div>
                       <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700 flex flex-col justify-center">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1"><ShieldAlert className="w-3 h-3 text-red-500" /> Competition</span>
                          <span className="font-bold text-gray-900 dark:text-white text-sm capitalize">{adv?.competition?.level || 'N/A'}</span>
                       </div>
                       <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700 flex flex-col justify-center">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1"><Activity className="w-3 h-3 text-blue-500" /> Trend Stage</span>
                          <span className="font-bold text-gray-900 dark:text-white text-sm capitalize">{adv?.trendStage?.stage || 'N/A'}</span>
                       </div>
                       <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700 flex flex-col justify-center">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1"><Target className="w-3 h-3 text-purple-500" /> VPH</span>
                          <span className="font-bold text-gray-900 dark:text-white text-sm">{(video as any).viewsPerHour || 'N/A'}</span>
                       </div>
                    </div>

                    {/* Execution Strategy */}
                    <div className="col-span-1 flex flex-col gap-3">
                      <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Suggested Angle</span>
                        <span className="font-medium text-gray-800 dark:text-gray-200 text-xs line-clamp-2">{adv?.contentGap?.suggestedAngle || 'N/A'}</span>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Target Audience</span>
                        <span className="font-medium text-gray-800 dark:text-gray-200 text-xs line-clamp-2">{adv?.contentGap?.suggestedAudience || 'N/A'}</span>
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
  );
}
