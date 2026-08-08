'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Step3TabProps, V2Video } from './types';
import { Sparkles, Play, Check, Plus, ExternalLink, Network, Search, AlertCircle, Loader2 } from 'lucide-react';
import { generateEmbeddings } from '@/app/actions/embed';

// Cosine similarity helper
function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length === 0 || b.length === 0) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export default function Tab3SimilarContent({ videos, activeSession, updateSessionState }: Step3TabProps) {
  const [viewMode, setViewMode] = useState<'matches' | 'clusters' | 'loops'>('matches');

  // ... (use existing embeddings effect) ...
  const [embeddings, setEmbeddings] = useState<Record<string, number[]>>({});
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiError, setAiError] = useState(false);
  
  const SIMILARITY_THRESHOLD = 0.40; // 40% semantic match for looser matching

  // Ensure all videos have embeddings
  useEffect(() => {
    const fetchEmbeddings = async () => {
      const missing = videos.filter(v => !embeddings[v.id]);
      if (missing.length === 0) return;
      
      setLoadingAI(true);
      try {
         const vectors = await generateEmbeddings(missing.map(v => v.title));
         setEmbeddings(prev => {
             const newE = { ...prev };
             missing.forEach((v, i) => {
                 if (vectors[i] && vectors[i].length > 0) {
                     newE[v.id] = vectors[i];
                 }
             });
             return newE;
         });
      } catch (e) {
         console.error("AI Embedding Error:", e);
         setAiError(true);
      } finally {
         setLoadingAI(false);
      }
    };
    fetchEmbeddings();
  }, [videos]);

  const targetVideos = activeSession?.filters?.outlierVideos || [];
  
  const isSelected = (id: string) => {
    return targetVideos.some((v: V2Video) => v.id === id);
  };

  const toggleSelection = (video: V2Video) => {
    if (isSelected(video.id)) {
      updateSessionState?.({ outlierVideos: targetVideos.filter((v: V2Video) => v.id !== video.id) });
    } else {
      updateSessionState?.({ outlierVideos: [...targetVideos, video] });
    }
  };

  // --- VIEW 1: Target Matches ---
  // For each target video, find semantic matches from OTHER channels
  const targetMatches = useMemo(() => {
    return targetVideos.map((target: V2Video) => {
      const targetVec = embeddings[target.id];
      if (!targetVec) return { target, matches: [] };
      
      const matches = videos
        .filter(v => v.id !== target.id) // exclude self
        .map(v => ({
          video: v,
          score: cosineSimilarity(targetVec, embeddings[v.id] || [])
        }))
        .filter(m => m.score >= SIMILARITY_THRESHOLD)
        .sort((a, b) => b.score - a.score);
        
      return { target, matches };
    }).filter((group: any) => group.matches.length > 0);
  }, [targetVideos, videos, embeddings]);

  // --- VIEW 2: Global Clusters ---
  // Cluster ALL videos that are semantically similar across distinct channels
  const globalClusters = useMemo(() => {
    if (Object.keys(embeddings).length < videos.length) return [];
    
    const clusters: Array<Array<{ video: V2Video, score: number }>> = [];
    const processed = new Set<string>();
    
    // Sort videos by date to always identify the "Originator" first
    const chronologicalVideos = [...videos].sort((a, b) => {
       const dateA = new Date(a.publishedAt || 0).getTime();
       const dateB = new Date(b.publishedAt || 0).getTime();
       return dateA - dateB;
    });

    for (let i = 0; i < chronologicalVideos.length; i++) {
      const v1 = chronologicalVideos[i];
      if (processed.has(v1.id)) continue;
      
      const v1Vec = embeddings[v1.id];
      if (!v1Vec) continue;
      
      const cluster = [{ video: v1, score: 1.0 }];
      processed.add(v1.id);
      
      const seenChannels = new Set<string>();
      seenChannels.add(v1.channelId);
      
      for (let j = i + 1; j < chronologicalVideos.length; j++) {
        const v2 = chronologicalVideos[j];
        if (processed.has(v2.id)) continue;
        
        // Enforce 1 video per channel in a single cluster
        if (seenChannels.has(v2.channelId)) continue;
        
        const v2Vec = embeddings[v2.id];
        if (!v2Vec) continue;
        
        const score = cosineSimilarity(v1Vec, v2Vec);
        if (score >= SIMILARITY_THRESHOLD) {
          cluster.push({ video: v2, score });
          processed.add(v2.id);
          seenChannels.add(v2.channelId);
        }
      }
      
      // Only keep clusters that span across > 1 channel
      if (cluster.length > 1) {
        clusters.push(cluster);
      }
    }
    
    // Sort clusters by size (most widespread trends first)
    return clusters.sort((a, b) => b.length - a.length);
  }, [videos, embeddings]);

  // --- VIEW 3: Channel Loops ---
  // Cluster videos that are semantically similar WITHIN the same channel
  const channelLoops = useMemo(() => {
    if (Object.keys(embeddings).length < videos.length) return [];
    
    const loops: Array<Array<{ video: V2Video, score: number }>> = [];
    const processed = new Set<string>();
    
    // Group by channel first
    const byChannel: Record<string, V2Video[]> = {};
    videos.forEach(v => {
      if (!byChannel[v.channelId]) byChannel[v.channelId] = [];
      byChannel[v.channelId].push(v);
    });

    Object.values(byChannel).forEach(channelVideos => {
      // Sort chronologically
      const chrono = [...channelVideos].sort((a, b) => new Date(a.publishedAt || 0).getTime() - new Date(b.publishedAt || 0).getTime());
      
      for (let i = 0; i < chrono.length; i++) {
        const v1 = chrono[i];
        if (processed.has(v1.id)) continue;
        
        const v1Vec = embeddings[v1.id];
        if (!v1Vec) continue;
        
        const cluster = [{ video: v1, score: 1.0 }];
        processed.add(v1.id);
        
        for (let j = i + 1; j < chrono.length; j++) {
          const v2 = chrono[j];
          if (processed.has(v2.id)) continue;
          
          const v2Vec = embeddings[v2.id];
          if (!v2Vec) continue;
          
          const score = cosineSimilarity(v1Vec, v2Vec);
          if (score >= SIMILARITY_THRESHOLD) {
            cluster.push({ video: v2, score });
            processed.add(v2.id);
          }
        }
        
        if (cluster.length > 1) {
          loops.push(cluster);
        }
      }
    });
    
    return loops.sort((a, b) => b.length - a.length);
  }, [videos, embeddings]);

  const VideoCard = ({ video, badge }: { video: V2Video, badge?: React.ReactNode }) => (
    <div className={`flex flex-col sm:flex-row bg-white dark:bg-gray-800 rounded-xl border transition-all duration-300 hover:-translate-y-1 w-full ${
      isSelected(video.id) ? 'border-red-500 shadow-md ring-1 ring-red-500' : 'border-gray-200 dark:border-gray-700 hover:shadow-xl'
    }`}>
      <a href={`https://youtube.com/watch?v=${video.videoId}`} target="_blank" rel="noreferrer" className="block relative w-full sm:w-64 shrink-0 aspect-video bg-gray-100 dark:bg-gray-900 overflow-hidden sm:rounded-l-xl rounded-t-xl sm:rounded-tr-none group">
        <img src={video.thumbnail || `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`} alt={video.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
        {badge}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-red-600 text-white rounded-full p-3 shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
            <Play className="w-5 h-5 fill-current ml-1" />
          </div>
        </div>
      </a>
      <div className="p-4 flex flex-col flex-1 justify-between gap-4">
        <div>
          <h4 className="font-bold text-gray-900 dark:text-white line-clamp-2 text-base mb-1" title={video.title}>{video.title}</h4>
          <p className="text-sm text-gray-500 mb-2 flex items-center gap-1">
            {video.channelTitle} <ExternalLink className="w-3 h-3" />
          </p>
        </div>
        
        <div className="flex flex-col gap-4 mt-auto">
           {/* Data Metrics */}
           <div className="flex flex-wrap gap-3 text-sm">
             <div className="bg-gray-50 dark:bg-gray-900 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-gray-700 flex-1 min-w-[100px]">
               <span className="text-gray-500 font-medium block text-[10px] uppercase tracking-wider mb-0.5">Total Views</span>
               <strong className="text-gray-900 dark:text-white">{(parseInt(video.viewCount) || 0).toLocaleString()}</strong>
             </div>
             
             {video.outlierScoreAvg !== undefined && (
               <div className="bg-red-50 dark:bg-red-900/10 px-3 py-1.5 rounded-lg border border-red-100 dark:border-red-900/30 flex-1 min-w-[100px]">
                 <span className="text-red-500 font-medium block text-[10px] uppercase tracking-wider mb-0.5">Virality Score</span>
                 <strong className="text-red-700 dark:text-red-400">{video.outlierScoreAvg}x Avg</strong>
               </div>
             )}
             
             {video.outlierScoreSubs !== undefined && (
               <div className="bg-blue-50 dark:bg-blue-900/10 px-3 py-1.5 rounded-lg border border-blue-100 dark:border-blue-900/30 flex-1 min-w-[100px]">
                 <span className="text-blue-500 font-medium block text-[10px] uppercase tracking-wider mb-0.5">Subs Impact</span>
                 <strong className="text-blue-700 dark:text-blue-400">{video.outlierScoreSubs}x Subs</strong>
               </div>
             )}
           </div>

           <button
             onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleSelection(video); }}
             className={`w-full py-2.5 rounded-lg font-bold transition-all flex items-center justify-center gap-2 shadow-sm border ${
               isSelected(video.id)
                 ? 'bg-green-50 dark:bg-green-900/20 text-green-600 border-green-200 dark:border-green-800 hover:bg-green-100'
                 : 'bg-red-600 text-white hover:bg-red-700 border-red-600'
             }`}
           >
             {isSelected(video.id) ? (
               <><Check className="w-4 h-4" /> Added to Analysis</>
             ) : (
               <><Plus className="w-4 h-4" /> Add to Analysis</>
             )}
           </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 rounded-2xl relative overflow-hidden shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="relative z-10 flex-1">
          <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white mb-2">
            <Network className="w-5 h-5 text-red-500" />
            Semantic Concept Matching
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed max-w-3xl">
            Our AI generates 384-dimensional vector embeddings for every video title to understand its semantic meaning.
            Use this to find titles that share the exact same underlying concept across different channels.
          </p>
        </div>
        
        {/* View Toggle */}
        <div className="flex flex-wrap bg-gray-100 dark:bg-gray-900 p-1 rounded-xl shadow-inner border border-gray-200 dark:border-gray-700 gap-1 shrink-0">
          <button 
            onClick={() => setViewMode('matches')}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${
              viewMode === 'matches' 
                ? 'bg-white dark:bg-gray-800 text-red-600 shadow-sm border border-gray-200 dark:border-gray-700' 
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Search className="w-4 h-4" /> Selected Matches
          </button>
          <button 
            onClick={() => setViewMode('clusters')}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${
              viewMode === 'clusters' 
                ? 'bg-white dark:bg-gray-800 text-red-600 shadow-sm border border-gray-200 dark:border-gray-700' 
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Network className="w-4 h-4" /> Global Clusters
          </button>
          <button 
            onClick={() => setViewMode('loops')}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${
              viewMode === 'loops' 
                ? 'bg-white dark:bg-gray-800 text-red-600 shadow-sm border border-gray-200 dark:border-gray-700' 
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Network className="w-4 h-4" /> Channel Loops
          </button>
        </div>
      </div>

      {loadingAI && (
        <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <Loader2 className="w-10 h-10 text-red-500 animate-spin mb-4" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Generating AI Embeddings...</h3>
          <p className="text-gray-500 text-sm">Processing {videos.length} videos to build semantic vectors.</p>
        </div>
      )}

      {aiError && !loadingAI && (
        <div className="flex items-center gap-3 p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">Failed to generate AI embeddings. Make sure the server action is running properly.</p>
        </div>
      )}

      {!loadingAI && !aiError && viewMode === 'matches' && (
        <div className="space-y-8">
          {targetVideos.length === 0 ? (
             <div className="p-12 text-center bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 border-dashed">
               <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No Target Videos Selected</h3>
               <p className="text-gray-500 text-sm">Add some videos to your analysis list (from Tab 1) to find their semantic matches across competitor channels.</p>
             </div>
          ) : targetMatches.length === 0 ? (
             <div className="p-12 text-center bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 border-dashed">
               <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No Cross-Channel Matches Found</h3>
               <p className="text-gray-500 text-sm">None of your selected videos have semantic twins on other channels in this dataset.</p>
             </div>
          ) : (
            targetMatches.map((group: any, idx: number) => (
              <div key={idx} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                <div className="bg-red-50 dark:bg-red-900/10 p-5 border-b border-red-100 dark:border-red-900/30 flex flex-col xl:flex-row gap-6 items-center">
                  <div className="w-full xl:w-2/3">
                    <p className="text-xs font-bold text-red-500 uppercase tracking-wider mb-3">Target Concept</p>
                    <VideoCard video={group.target} />
                  </div>
                  <div className="flex-1 text-center xl:text-left flex flex-col items-center xl:items-start">
                    <Sparkles className="w-8 h-8 text-red-400 mb-3" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Found {group.matches.length} Matches</h3>
                    <p className="text-sm text-gray-500">Other channels successfully used this exact title concept.</p>
                  </div>
                </div>
                
                <div className="p-6 bg-gray-50 dark:bg-gray-900">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Competitor Replications</p>
                  <div className="flex flex-col gap-4">
                    {group.matches.map((m: any, mIdx: number) => (
                      <VideoCard 
                        key={mIdx} 
                        video={m.video} 
                        badge={
                          <div className="absolute top-2 left-2 bg-black/70 backdrop-blur text-white text-xs font-bold px-2 py-1 rounded border border-white/10">
                            {Math.round(m.score * 100)}% Semantic Match
                          </div>
                        } 
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {!loadingAI && !aiError && viewMode === 'clusters' && (
        <div className="space-y-8">
          {globalClusters.length === 0 ? (
             <div className="p-12 text-center bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 border-dashed">
               <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No Patterns Detected</h3>
               <p className="text-gray-500 text-sm">We couldn't find any widespread title concepts shared across multiple channels in this dataset.</p>
             </div>
          ) : (
            globalClusters.map((cluster, idx) => (
              <div key={idx} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                <div className="bg-blue-50 dark:bg-blue-900/10 p-4 border-b border-blue-100 dark:border-blue-900/30 flex justify-between items-center">
                   <h3 className="text-base font-bold text-blue-900 dark:text-blue-400 flex items-center gap-2">
                     <Network className="w-4 h-4" /> Global Trend #{idx + 1}
                   </h3>
                   <span className="text-xs font-bold bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full">
                     {cluster.length} Videos across multiple channels
                   </span>
                </div>
                
                <div className="p-6">
                  <div className="flex flex-col gap-4">
                    {cluster.map((m, mIdx) => {
                      const isOrigin = mIdx === 0;
                      return (
                        <div key={mIdx} className="relative">
                          {isOrigin && (
                            <div className="absolute -top-3 -left-3 z-20 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full shadow-md border-2 border-white flex items-center gap-1">
                              👑 1st Upload (Originator)
                            </div>
                          )}
                          <VideoCard 
                            video={m.video} 
                            badge={
                               <div className="absolute top-2 right-2 bg-black/70 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded border border-white/10">
                                 {new Date(m.video.publishedAt || 0).toLocaleDateString()}
                               </div>
                            }
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {!loadingAI && !aiError && viewMode === 'loops' && (
        <div className="space-y-8">
          {channelLoops.length === 0 ? (
             <div className="p-12 text-center bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 border-dashed">
               <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No Content Loops Found</h3>
               <p className="text-gray-500 text-sm">We couldn't find any creators who are aggressively repeating the same concepts.</p>
             </div>
          ) : (
            channelLoops.map((cluster, idx) => (
              <div key={idx} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                <div className="bg-purple-50 dark:bg-purple-900/10 p-4 border-b border-purple-100 dark:border-purple-900/30 flex justify-between items-center">
                   <h3 className="text-base font-bold text-purple-900 dark:text-purple-400 flex items-center gap-2">
                     <Network className="w-4 h-4" /> Channel Loop #{idx + 1}
                   </h3>
                   <span className="text-xs font-bold bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 px-3 py-1 rounded-full">
                     {cluster.length} Repeated videos by {cluster[0].video.channelTitle}
                   </span>
                </div>
                
                <div className="p-6">
                  <div className="flex flex-col gap-4">
                    {cluster.map((m, mIdx) => (
                      <VideoCard 
                        key={mIdx} 
                        video={m.video} 
                        badge={
                           <div className="absolute top-2 right-2 bg-black/70 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded border border-white/10">
                             {new Date(m.video.publishedAt || 0).toLocaleDateString()}
                           </div>
                        }
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
