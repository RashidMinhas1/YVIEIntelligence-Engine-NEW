'use client';

import React, { useState, useEffect } from 'react';
import { Step3TabProps, V2Video } from './types';
import DashboardSummary from './DashboardSummary';
import Tab1OutlierVideos from './Tab1OutlierVideos';
import Tab2IntelligenceReport from './Tab2IntelligenceReport';
import Tab3SimilarContent from './Tab3SimilarContent';
import Tab4OpportunityCenter from './Tab4OpportunityCenter';
import Tab5Timeline from './Tab5Timeline';
import Tab6ContentGapFinder from './Tab6ContentGapFinder';
import Tab7ConceptNetwork from './Tab7ConceptNetwork';
import Tab8DecisionCenter from './Tab8DecisionCenter';
import { Video, X } from 'lucide-react';

interface ResultsDashboardProps extends Step3TabProps {
  scannedVideos: V2Video[];
}

export default function ResultsDashboard(props: ResultsDashboardProps) {
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('yvie_activeTab') || 'overview';
    }
    return 'overview';
  });

  useEffect(() => {
    localStorage.setItem('yvie_activeTab', activeTab);
  }, [activeTab]);

  const [selectedChannel, setSelectedChannel] = useState<any | null>(null);

  const tabs = [
    { id: 'overview', label: '📊 Overview', emoji: '📊' },
    { id: 'outliers', label: '🔥 Outlier Videos', emoji: '🔥' },
    { id: 'analysis', label: '🧠 AI Analysis', emoji: '🧠' },
    { id: 'similar', label: '🔗 Similar Content', emoji: '🔗' },
    { id: 'opportunity', label: '💡 Opportunity Center', emoji: '💡' },
    { id: 'timeline', label: '📈 Timeline', emoji: '📈' },
    { id: 'network', label: '🕸️ Concept Network', emoji: '🕸️' },
    { id: 'decision', label: '🎯 Decision Center', emoji: '🎯' },
  ];

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'overview':
        return <DashboardSummary 
                  videos={props.videos} 
                  allChannels={props.allChannels} 
                  onNavigate={setActiveTab} 
                  selectedChannel={selectedChannel}
                  activeSession={props.activeSession}
                  updateSessionState={props.updateSessionState}
                />;
      case 'outliers':
        return <Tab1OutlierVideos {...props} />;
      case 'analysis':
        return <Tab2IntelligenceReport {...props} />;
      case 'similar':
        return <Tab3SimilarContent {...props} />;
      case 'opportunity':
        return <Tab4OpportunityCenter {...props} />;
      case 'timeline':
        return <Tab5Timeline {...props} />;
      case 'network':
        return <Tab7ConceptNetwork {...props} />;
      case 'decision':
        return <Tab8DecisionCenter {...props} />;
      default:
        return <DashboardSummary 
                  videos={props.videos} 
                  allChannels={props.allChannels} 
                  onNavigate={setActiveTab} 
                  selectedChannel={selectedChannel}
                  activeSession={props.activeSession}
                  updateSessionState={props.updateSessionState}
                />;
    }
  };

  return (
    <div className="w-full space-y-6">
      
      {/* ===== Tab Navigation Bar ===== */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-3">
        <div className="overflow-x-auto custom-scrollbar">
          <div className="flex gap-2 min-w-max">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-red-600 text-white shadow-lg shadow-red-500/20'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ===== Context Bar (Conditional based on active tab) ===== */}
      {activeTab === 'overview' ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 animate-in fade-in zoom-in-95 duration-300">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Selected Channel (Dashboard Filter)</h4>
          <div className="overflow-x-auto custom-scrollbar pb-2">
            <div className="flex gap-4 min-w-max">
              <div 
                onClick={() => setSelectedChannel(null)}
                className={`flex items-center gap-3 p-2 pr-4 rounded-xl cursor-pointer transition-all border-2 ${
                  !selectedChannel 
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20 shadow-md' 
                    : 'border-transparent hover:border-gray-200 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-gray-500">All</span>
                </div>
                <div className="flex flex-col">
                  <p className={`text-sm font-bold ${!selectedChannel ? 'text-red-700 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                    All Channels
                  </p>
                  <p className="text-xs text-gray-500">{props.allChannels.length} total</p>
                </div>
              </div>

              {props.allChannels.map((channel: any) => {
                const isSelected = selectedChannel?.id === channel.id;
                
                return (
                  <div 
                    key={channel.id}
                    onClick={() => setSelectedChannel(channel)}
                    className={`flex items-center gap-3 p-2 pr-4 rounded-xl cursor-pointer transition-all border-2 ${
                      isSelected 
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20 shadow-md' 
                        : 'border-transparent hover:border-gray-200 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <img 
                      src={channel.thumbnail || `https://ui-avatars.com/api/?name=${encodeURIComponent(channel.title)}`} 
                      alt="" 
                      className="w-10 h-10 object-cover rounded-full shrink-0 shadow-sm border border-gray-200 dark:border-gray-700"
                    />
                    <div className="flex flex-col min-w-0 max-w-[200px]">
                      <p className={`text-sm font-bold truncate ${isSelected ? 'text-red-700 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                        {channel.title}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{channel.customUrl || `@${channel.title.replace(/\s+/g, '')}`}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 animate-in fade-in zoom-in-95 duration-300">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Currently Analyzing (Select Video)</h4>
          <div className="overflow-x-auto custom-scrollbar pb-2">
            <div className="flex gap-4 min-w-max">
              {props.activeSession?.filters?.outlierVideos?.map((video: V2Video) => {
                const isSelected = props.selectedVideo?.id === video.id;
                
                return (
                  <div 
                    key={video.id}
                    onClick={() => props.setSelectedVideo(video)}
                    className={`relative flex items-center gap-3 p-2 pr-8 rounded-xl cursor-pointer transition-all border-2 group ${
                      isSelected 
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20 shadow-md' 
                        : 'border-transparent hover:border-gray-200 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <img 
                      src={video.thumbnail} 
                      alt="" 
                      className="w-16 h-10 object-cover rounded-lg shrink-0 shadow-sm"
                    />
                    <div className="flex flex-col min-w-0 max-w-[200px]">
                      <p className={`text-sm font-bold truncate ${isSelected ? 'text-red-700 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                        {video.title}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{video.channelTitle}</p>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (props.updateSessionState) {
                          const newOutliers = props.activeSession.filters.outlierVideos.filter((v: V2Video) => v.id !== video.id);
                          props.updateSessionState({
                            outlierVideos: newOutliers
                          });
                        }
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                      title="Remove video"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
              
              {(!props.activeSession?.filters?.outlierVideos || props.activeSession.filters.outlierVideos.length === 0) && (
                 <p className="text-sm text-gray-500 italic py-2">No videos selected. Go back to Outlier Videos to select some.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== Active Tab Content ===== */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
        {renderActiveTab()}
      </div>

    </div>
  );
}
