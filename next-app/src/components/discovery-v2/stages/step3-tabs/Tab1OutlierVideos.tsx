'use client';

import React, { useState } from 'react';
import { Step3TabProps, V2Video } from './types';
import { Play, ExternalLink, ChevronDown, ChevronUp, CheckSquare, Square, Search, TrendingUp, Target, BarChart2, Zap, Plus, Check } from 'lucide-react';
// import AdvancedResearchPanel from '../AdvancedResearchPanel'; // Assuming this exists or will be created

export default function Tab1OutlierVideos({
  videos,
  filteredVideos,
  selectedVideo,
  setSelectedVideo,
  isSelected,
  toggleSelection,
  selectAll,
  deselectAll,
  compareMode,
  expandedInsights,
  toggleInsights,
  activeSession,
  updateSessionState
}: Step3TabProps) {
  
  const displayVideos = filteredVideos.length > 0 ? filteredVideos : videos;
  const selectedCount = activeSession?.filters?.outlierVideos?.length || 0;

  if (compareMode) {
    return (
      <div className="w-full overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 shadow-sm">
        <table className="w-full text-sm text-left text-gray-700 dark:text-gray-300">
          <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th scope="col" className="p-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-red-600 bg-white border-gray-300 rounded focus:ring-red-500"
                    onChange={(e) => e.target.checked ? selectAll() : deselectAll()}
                    checked={displayVideos.length > 0 && displayVideos.every(v => isSelected(v.id))}
                  />
                </div>
              </th>
              <th scope="col" className="px-6 py-4 font-semibold">Video</th>
              <th scope="col" className="px-6 py-4 font-semibold">Channel</th>
              <th scope="col" className="px-6 py-4 font-semibold">Metrics</th>
              <th scope="col" className="px-6 py-4 font-semibold">Scores</th>
              <th scope="col" className="px-6 py-4 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {displayVideos.map(video => (
              <tr key={video.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <td className="w-4 p-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-red-600 bg-white border-gray-300 rounded focus:ring-red-500"
                      checked={isSelected(video.id)}
                      onChange={() => toggleSelection(video)}
                    />
                  </div>
                </td>
                <td className="px-6 py-4 flex items-center gap-4">
                  <img src={video.thumbnail} alt={video.title} className="w-20 h-14 object-cover rounded-md shadow-sm" />
                  <div className="max-w-xs">
                    <p className="font-semibold text-gray-900 dark:text-white line-clamp-2">{video.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{new Date(video.publishedAt).toLocaleDateString()}</p>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-700 dark:text-gray-300">{video.channelTitle}</td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1 text-xs">
                    <span className="text-gray-600 dark:text-gray-400">Views: <strong className="text-gray-900 dark:text-white">{video.viewCount.toLocaleString()}</strong></span>
                    <span className="text-gray-600 dark:text-gray-400">Likes: <strong className="text-gray-900 dark:text-white">{video.likeCount?.toLocaleString() || 'N/A'}</strong></span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-red-600 dark:text-red-400 font-bold bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded w-max">⚡ {video.outlierScore}x</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <button 
                    onClick={() => setSelectedVideo(video)}
                    className="text-xs bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-lg transition-colors shadow-sm"
                  >
                    Analyze
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  const handleSelectAll = () => {
    const current = activeSession?.filters?.outlierVideos || [];
    const newSelections = displayVideos.filter(v => !isSelected(v.id));
    updateSessionState({ outlierVideos: [...current, ...newSelections] });
  };

  const handleDeselectAll = () => {
    const current = activeSession?.filters?.outlierVideos || [];
    const remaining = current.filter((v: V2Video) => !displayVideos.some(dv => dv.id === v.id));
    updateSessionState({ outlierVideos: remaining });
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm gap-4">
        <div className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-500" />
          Showing <strong className="text-gray-900 dark:text-white">{displayVideos.length}</strong> outlier videos
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={handleSelectAll} 
            className="flex items-center gap-2 text-sm font-bold px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg transition-colors shadow-sm"
          >
            <CheckSquare className="w-4 h-4" /> Select All Visible
          </button>
          <button 
            onClick={handleDeselectAll} 
            className="flex items-center gap-2 text-sm font-bold px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-lg transition-colors shadow-sm"
          >
            <Square className="w-4 h-4" /> Deselect All Visible
          </button>
          <button 
            onClick={() => updateSessionState({ wizardStep: 4 })}
            disabled={selectedCount === 0}
            className={`flex items-center gap-2 text-sm font-bold px-5 py-2 border rounded-lg transition-all shadow-md ${
              selectedCount > 0 
                ? 'bg-red-600 hover:bg-red-700 border-red-600 text-white shadow-red-500/20 hover:-translate-y-0.5' 
                : 'bg-red-300 border-red-300 text-white/80 cursor-not-allowed opacity-70'
            }`}
          >
            <Search className="w-4 h-4" /> Analyze Selected ({selectedCount})
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {displayVideos.map(video => (
          <div 
            key={video.id} 
            className={`flex flex-col bg-white dark:bg-gray-900 rounded-2xl border overflow-hidden transition-all duration-300 hover:-translate-y-1 ${
              isSelected(video.id) 
                ? 'border-red-500 ring-2 ring-red-500/20 shadow-lg shadow-red-500/10' 
                : 'border-gray-200 dark:border-gray-800 hover:border-red-300 dark:hover:border-red-800 hover:shadow-xl'
            }`}
          >
            {/* Thumbnail Header */}
            <div className="relative aspect-video bg-gray-100 dark:bg-gray-800 group">
              <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <a href={`https://youtube.com/watch?v=${video.videoId}`} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()} className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-full transition-transform hover:scale-110 shadow-lg">
                  <Play className="w-5 h-5 fill-current" />
                </a>
              </div>
              
              <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                {video.outlierScore && (
                  <span className="bg-red-600 text-white text-xs font-black px-2.5 py-1 rounded-md shadow-lg backdrop-blur-sm flex items-center gap-1 border border-red-500">
                    ⚡ {video.outlierScore}x Outlier
                  </span>
                )}
              </div>
              
              <div className="absolute bottom-2 right-2 text-xs font-medium bg-black/80 text-white px-2 py-1 rounded-md backdrop-blur-sm">
                {video.duration || 'N/A'}
              </div>
            </div>

            {/* Content Body */}
            <div className="p-5 flex-1 flex flex-col">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="text-gray-900 dark:text-white font-bold line-clamp-2 text-base leading-tight group-hover:text-red-600 transition-colors" title={video.title}>
                  {video.title}
                </h3>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <a href={`https://youtube.com/channel/${video.channelId}`} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()} className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors truncate flex items-center gap-1.5">
                  {video.channelTitle} <ExternalLink className="w-3.5 h-3.5 inline" />
                </a>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 mb-5 mt-auto">
                <div className="bg-gray-50 dark:bg-gray-800/50 p-2.5 rounded-lg border border-gray-100 dark:border-gray-800">
                  <div className="text-gray-500 dark:text-gray-400 text-xs mb-0.5 flex items-center gap-1 font-medium">Views</div>
                  <div className="font-bold text-gray-900 dark:text-white text-sm">{video.viewCount.toLocaleString()}</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/50 p-2.5 rounded-lg border border-gray-100 dark:border-gray-800">
                  <div className="text-gray-500 dark:text-gray-400 text-xs mb-0.5 flex items-center gap-1 font-medium">Date</div>
                  <div className="font-bold text-gray-900 dark:text-white text-sm">{new Date(video.publishedAt).toLocaleDateString()}</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/50 p-2.5 rounded-lg border border-gray-100 dark:border-gray-800">
                  <div className="text-gray-500 dark:text-gray-400 text-xs mb-0.5 flex items-center gap-1 font-medium">Likes</div>
                  <div className="font-bold text-gray-900 dark:text-white text-sm">{video.likeCount?.toLocaleString() || '-'}</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/50 p-2.5 rounded-lg border border-gray-100 dark:border-gray-800">
                  <div className="text-gray-500 dark:text-gray-400 text-xs mb-0.5 flex items-center gap-1 font-medium">Comments</div>
                  <div className="font-bold text-gray-900 dark:text-white text-sm">{video.commentCount?.toLocaleString() || '-'}</div>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex flex-col gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); toggleSelection(video); }}
                  className={`w-full text-sm py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-2 shadow-sm border ${
                    isSelected(video.id)
                      ? 'bg-green-50 dark:bg-green-900/20 text-green-600 border-green-200 dark:border-green-800 hover:bg-green-100'
                      : 'bg-red-600 text-white hover:bg-red-700 border-red-600'
                  }`}
                >
                  {isSelected(video.id) ? (
                    <><Check className="w-4 h-4" /> Added to Analysis List</>
                  ) : (
                    <><Plus className="w-4 h-4" /> Add to Analysis List</>
                  )}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedVideo(video); }}
                  className="w-full bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/20 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800/50 text-sm py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <Search className="w-4 h-4" /> Deep Dive Internals
                </button>
              </div>

              {/* Collapsible AI Insights */}
              <div className="mt-3">
                <button 
                  onClick={(e) => toggleInsights(video.id, e)}
                  className="flex items-center justify-between w-full text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors group px-1 py-1.5"
                >
                  <span className="flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5" /> Quick AI Insights</span>
                  {expandedInsights[video.id] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {expandedInsights[video.id] && (
                  <div className="mt-2 space-y-3 text-xs bg-red-50 dark:bg-red-900/10 p-3 rounded-lg border border-red-100 dark:border-red-900/30">
                    {video.whyOutlier && (
                      <div>
                        <span className="text-red-700 dark:text-red-400 font-bold block mb-1 flex items-center gap-1"><Target className="w-3 h-3"/> Why Outlier</span>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{video.whyOutlier}</p>
                      </div>
                    )}
                    {video.whyOutperformed && (
                      <div className="pt-2 border-t border-red-200 dark:border-red-900/50">
                        <span className="text-red-700 dark:text-red-400 font-bold block mb-1 flex items-center gap-1"><BarChart2 className="w-3 h-3"/> Why Outperformed</span>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{video.whyOutperformed}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
