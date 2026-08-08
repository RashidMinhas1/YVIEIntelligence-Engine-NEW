'use client';

import React, { useState } from 'react';
import { V2Video } from './types';
import { Video, Users, Zap, TrendingUp, Target, ShieldAlert, Sparkles, Activity, CheckCircle, Layers, CheckSquare, Square, ExternalLink, Eye } from 'lucide-react';

interface DashboardSummaryProps {
  videos: V2Video[];
  allChannels: any[];
  onNavigate?: (tab: string) => void;
  selectedChannel?: any | null;
  activeSession?: any;
  updateSessionState?: (state: any) => void;
}

export default function DashboardSummary({ videos, allChannels, onNavigate, selectedChannel, activeSession, updateSessionState }: DashboardSummaryProps) {
  // Local state for interactive drill-down
  const [activeDrilldown, setActiveDrilldown] = useState<'none' | 'channels' | 'outliers'>('none');
  const [drilldownChannelId, setDrilldownChannelId] = useState<string | null>(null);

  // Helper to toggle selected videos in global state
  const toggleVideoSelection = (video: V2Video) => {
    if (!updateSessionState) return;
    const selectedIds = activeSession?.filters?.outlierVideos?.map((v: V2Video) => v.id) || [];
    const isSelected = selectedIds.includes(video.id);
    let newOutliers = [...(activeSession?.filters?.outlierVideos || [])];
    if (isSelected) {
      newOutliers = newOutliers.filter((v: V2Video) => v.id !== video.id);
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

  // Filter dashboard stats if a top-level channel is selected
  const displayVideos = selectedChannel ? videos.filter(v => v.channelId === selectedChannel.id) : videos;
  
  // Calculations
  const totalChannels = selectedChannel ? 1 : allChannels.length;
  const totalVideos = displayVideos.length;
  const totalOutliers = displayVideos.filter(v => (v.outlierScore || 0) > 3).length;
  
  const highOppVideos = displayVideos.filter(v => (v.opportunityScore || 0) > 70 || (v.advancedResearch?.saturation?.opportunityScore || 0) > 70).length;
  const growingTrends = displayVideos.filter(v => v.trendBadge === 'Growing' || v.advancedResearch?.trendStage?.stage === 'Growing').length;
  const highComp = displayVideos.filter(v => v.competitionBadge === 'High').length;
  const lowComp = displayVideos.filter(v => v.competitionBadge === 'Low').length;

  const avgOutlier = displayVideos.length ? (displayVideos.reduce((acc, v) => acc + (v.outlierScore || 0), 0) / displayVideos.length).toFixed(1) : '0';
  const avgVirality = displayVideos.length ? (displayVideos.reduce((acc, v) => acc + (v.viralityScore || 0), 0) / displayVideos.length).toFixed(1) : '0';
  const avgPriority = displayVideos.length ? (displayVideos.reduce((acc, v) => acc + (v.researchPriorityScore || 0), 0) / displayVideos.length).toFixed(1) : '0';

  // Handling Drilldown Views
  const handleDrilldownToggle = (type: 'channels' | 'outliers') => {
    if (activeDrilldown === type) {
      setActiveDrilldown('none');
      setDrilldownChannelId(null);
    } else {
      setActiveDrilldown(type);
      setDrilldownChannelId(null); // Reset channel selection when switching type
    }
  };

  const drilldownChannels = selectedChannel ? [selectedChannel] : allChannels;
  
  // Determine which videos to show in the drilldown panel
  let drilldownVideos: V2Video[] = [];
  if (drilldownChannelId) {
    const channelVideos = videos.filter(v => v.channelId === drilldownChannelId);
    if (activeDrilldown === 'outliers') {
      drilldownVideos = channelVideos.filter(v => (v.outlierScore || 0) > 3);
    } else {
      drilldownVideos = channelVideos;
    }
  }

  return (
    <div className="mb-10 space-y-6 animate-in fade-in duration-500">
      {/* AI Executive Summary Hero */}
      <div className="bg-gradient-to-r from-red-600 to-red-800 rounded-2xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden transition-all">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Sparkles className="w-48 h-48" />
        </div>
        
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-red-200" /> AI Executive Summary
          </h2>
          <p className="text-red-50 text-lg font-medium leading-relaxed max-w-4xl mb-6">
            AI analyzed {totalVideos} videos {selectedChannel ? `from ${selectedChannel.title}` : `across ${totalChannels} channels`}. {totalOutliers} strong Outlier Videos were discovered. 
            There are {highOppVideos} concepts showing high opportunity with low saturation, making them prime targets for your next upload.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-black/20 backdrop-blur-sm rounded-xl p-4 flex items-start gap-3">
              <Target className="w-6 h-6 text-green-400 mt-1" />
              <div>
                <p className="text-red-200 text-xs font-bold uppercase tracking-wider">Biggest Opportunity</p>
                <p className="font-semibold text-sm mt-1">{highOppVideos} highly actionable concepts found.</p>
              </div>
            </div>
            <div className="bg-black/20 backdrop-blur-sm rounded-xl p-4 flex items-start gap-3">
              <ShieldAlert className="w-6 h-6 text-yellow-400 mt-1" />
              <div>
                <p className="text-red-200 text-xs font-bold uppercase tracking-wider">Biggest Threat</p>
                <p className="font-semibold text-sm mt-1">{highComp} highly competitive concepts to avoid.</p>
              </div>
            </div>
            <div className="bg-black/20 backdrop-blur-sm rounded-xl p-4 flex items-start gap-3">
              <TrendingUp className="w-6 h-6 text-blue-400 mt-1" />
              <div>
                <p className="text-red-200 text-xs font-bold uppercase tracking-wider">Fastest Growing Trend</p>
                <p className="font-semibold text-sm mt-1">{growingTrends} trends accelerating rapidly.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {[
          { label: 'Channels', value: totalChannels, icon: Users, color: 'text-blue-500', isDrilldown: true, type: 'channels' as const },
          { label: 'Videos', value: totalVideos, icon: Video, color: 'text-indigo-500', isDrilldown: false, tab: 'outliers' },
          { label: 'Outliers', value: totalOutliers, icon: Zap, color: 'text-yellow-500', isDrilldown: true, type: 'outliers' as const },
          { label: 'High Opp.', value: highOppVideos, icon: Target, color: 'text-green-500', isDrilldown: false, tab: 'opportunity' },
          { label: 'Growing', value: growingTrends, icon: TrendingUp, color: 'text-teal-500', isDrilldown: false, tab: 'timeline' },
          { label: 'High Comp.', value: highComp, icon: ShieldAlert, color: 'text-red-500', isDrilldown: false, tab: 'opportunity' },
          { label: 'Low Comp.', value: lowComp, icon: CheckCircle, color: 'text-emerald-500', isDrilldown: false, tab: 'opportunity' },
          { label: 'Avg Outlier', value: avgOutlier, icon: Activity, color: 'text-purple-500', isDrilldown: false, tab: 'analysis' },
          { label: 'Avg Virality', value: avgVirality, icon: Sparkles, color: 'text-pink-500', isDrilldown: false, tab: 'analysis' },
          { label: 'Avg Priority', value: avgPriority, icon: Zap, color: 'text-orange-500', isDrilldown: false, tab: 'decision' },
        ].map((stat, i) => {
          const isActiveDrilldown = stat.isDrilldown && activeDrilldown === stat.type;
          
          return (
            <div 
              key={i} 
              onClick={() => {
                if (stat.isDrilldown) {
                  handleDrilldownToggle(stat.type as 'channels' | 'outliers');
                } else if (stat.tab) {
                  onNavigate?.(stat.tab);
                }
              }}
              className={`rounded-xl p-4 border shadow-sm flex flex-col items-center text-center justify-center gap-2 transition-all cursor-pointer hover:-translate-y-0.5 ${
                isActiveDrilldown 
                  ? 'bg-red-50 dark:bg-red-900/20 border-red-500 ring-2 ring-red-200 dark:ring-red-900 shadow-md' 
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-red-300'
              }`}
            >
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
              <div className="text-2xl font-black text-gray-900 dark:text-white">{stat.value}</div>
              <div className={`text-xs font-bold uppercase tracking-wide ${isActiveDrilldown ? 'text-red-700 dark:text-red-400' : 'text-gray-500'}`}>
                {stat.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Drilldown Panel */}
      {activeDrilldown !== 'none' && (
        <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-inner animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                {activeDrilldown === 'channels' ? <Users className="w-6 h-6 text-blue-500"/> : <Zap className="w-6 h-6 text-yellow-500"/>}
                {activeDrilldown === 'channels' ? 'Explore Channels & All Videos' : 'Explore Channel Outliers'}
              </h3>
              <p className="text-sm text-gray-500 mt-1">Select a channel to view its videos. Select videos to add them to your master list.</p>
            </div>
            <button 
              onClick={() => handleDrilldownToggle(activeDrilldown)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
            >
              Close
            </button>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 h-[500px]">
            {/* Channel List Sidebar */}
            <div className="w-full lg:w-1/3 flex flex-col gap-2 overflow-y-auto custom-scrollbar pr-2 h-full">
              {drilldownChannels.map(channel => {
                const isActive = drilldownChannelId === channel.id;
                return (
                  <div 
                    key={channel.id}
                    onClick={() => setDrilldownChannelId(channel.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border-2 ${
                      isActive 
                        ? 'border-red-500 bg-white dark:bg-gray-800 shadow-md' 
                        : 'border-transparent bg-white dark:bg-gray-800 hover:border-gray-300 shadow-sm'
                    }`}
                  >
                    <img 
                      src={channel.thumbnail || `https://ui-avatars.com/api/?name=${encodeURIComponent(channel.title)}`} 
                      alt="" 
                      className="w-10 h-10 object-cover rounded-full shrink-0 border border-gray-200"
                    />
                    <div className="min-w-0">
                      <p className={`text-sm font-bold truncate ${isActive ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>{channel.title}</p>
                      <p className="text-xs text-gray-500">
                        {activeDrilldown === 'outliers' 
                          ? `${videos.filter(v => v.channelId === channel.id && (v.outlierScore || 0) > 3).length} Outliers` 
                          : `${videos.filter(v => v.channelId === channel.id).length} Videos`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Video List */}
            <div className="w-full lg:w-2/3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 overflow-y-auto custom-scrollbar h-full relative shadow-sm">
              {!drilldownChannelId ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <Users className="w-12 h-12 mb-2 opacity-50" />
                  <p>Select a channel from the list to view its videos.</p>
                </div>
              ) : drilldownVideos.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <Zap className="w-12 h-12 mb-2 opacity-50" />
                  <p>No videos found for this filter.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {drilldownVideos.map(video => {
                    const selectedIds = activeSession?.filters?.outlierVideos?.map((v: V2Video) => v.id) || [];
                    const isSelected = selectedIds.includes(video.id);

                    return (
                      <div 
                        key={video.id} 
                        className={`flex gap-4 p-3 rounded-xl border transition-all ${
                          isSelected ? 'border-red-500 bg-red-50/50 dark:bg-red-900/10' : 'border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        <button 
                          onClick={() => toggleVideoSelection(video)}
                          className={`mt-1 shrink-0 transition-colors ${isSelected ? 'text-red-600' : 'text-gray-300 hover:text-red-400'}`}
                        >
                          {isSelected ? <CheckSquare className="w-6 h-6" /> : <Square className="w-6 h-6" />}
                        </button>
                        
                        <div className="relative w-28 h-16 rounded-md overflow-hidden shrink-0 border border-gray-200 dark:border-gray-700">
                          <img src={video.thumbnail} alt="" className="w-full h-full object-cover" />
                        </div>
                        
                        <div className="flex flex-col min-w-0 flex-1">
                          <p className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-1">{video.title}</p>
                          <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                            <span className="flex items-center gap-1"><Eye className="w-3 h-3"/> {video.viewCount?.toLocaleString() || 'N/A'}</span>
                            <span className="flex items-center gap-1 text-red-500 font-medium"><TrendingUp className="w-3 h-3"/> {(video as any).performanceRatio || 'N/A'}x</span>
                            <span>{video.publishedAt}</span>
                          </div>
                        </div>
                        
                        <a 
                          href={`https://youtube.com/watch?v=${video.id}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="shrink-0 p-2 text-gray-400 hover:text-red-500 self-center"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
