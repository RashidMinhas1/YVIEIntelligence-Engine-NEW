'use client';

import React, { useState, useEffect } from 'react';
import { Step3TabProps, V2Video } from './types';
import { Info, Lightbulb, Loader2, PlayCircle, Image as ImageIcon, MessageSquare, Target, Zap, CheckCircle2, ChevronRight, Share2, Download, Copy, Youtube } from 'lucide-react';
import Image from 'next/image';

interface GeneratedIdea {
  id: string;
  title: string;
  angle: string;
  hook: string;
  thumbnailConcept: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  targetEmotion: string;
}

interface IdeaAnalysis {
  coreIntent: string;
  whyOriginalWorked: string;
}

export default function Tab7ConceptNetwork({ selectedVideo, setSelectedVideo, activeSession, updateSessionState }: Step3TabProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [ideas, setIdeas] = useState<GeneratedIdea[]>([]);
  const [analysis, setAnalysis] = useState<IdeaAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load cached ideas if available in the session for this video
  useEffect(() => {
    if (selectedVideo?.id) {
      const cached = selectedVideo.advancedResearch?.generatedIdeas;
      if (cached && cached.ideas) {
        setIdeas(cached.ideas);
        setAnalysis(cached.analysis || null);
      } else {
        setIdeas([]);
        setAnalysis(null);
      }
      setError(null);
    }
  }, [selectedVideo?.id, selectedVideo?.advancedResearch?.generatedIdeas]);

  const generateIdeas = async () => {
    if (!selectedVideo) return;
    
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/discovery-v2/outliers/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetVideo: selectedVideo,
          channelContext: activeSession?.projectGoals ? {
            niche: activeSession.projectGoals.targetAudience,
            style: 'Fast-paced, highly engaging',
            audience: activeSession.projectGoals.targetAudience
          } : undefined
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate ideas. Please try again.');
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        setIdeas(result.data.ideas || []);
        setAnalysis(result.data.analysis || null);

        if (result._fallback) {
           setError("AI Provider failed. Showing AI Generated Fallback instead.");
        }

        // Save to session state
        if (updateSessionState && activeSession) {
          const currentOutliers = [...(activeSession.filters?.outlierVideos || [])];
          const idx = currentOutliers.findIndex((v: V2Video) => v.id === selectedVideo.id);
          
          if (idx !== -1) {
            currentOutliers[idx] = {
              ...currentOutliers[idx],
              advancedResearch: {
                ...currentOutliers[idx].advancedResearch,
                generatedIdeas: result.data
              }
            };
            await updateSessionState({ outlierVideos: currentOutliers });
            if (setSelectedVideo) setSelectedVideo(currentOutliers[idx]);
          }
        }
      } else {
        throw new Error('Invalid response from AI');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during generation.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!selectedVideo) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/30 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
        <Info className="w-12 h-12 mb-4 text-red-500" />
        <p className="text-lg font-bold text-gray-900 dark:text-white">Select a video to generate ideas.</p>
        <p className="text-sm">Choose a video from the top navigation to begin.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
        <div className="flex items-center gap-5">
          <div className="w-24 h-14 relative rounded-lg overflow-hidden shrink-0 border border-gray-100 dark:border-gray-800 shadow-sm">
             {selectedVideo.thumbnail ? (
               <Image src={selectedVideo.thumbnail} alt={selectedVideo.title} fill className="object-cover" unoptimized />
             ) : (
               <div className="w-full h-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center"><Youtube className="w-6 h-6 text-gray-400" /></div>
             )}
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
              <Lightbulb className="w-6 h-6 text-yellow-500" /> Idea Generation Engine
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mt-1">
              Analyzing intent from: <span className="font-bold text-gray-800 dark:text-gray-200">"{selectedVideo.title}"</span>
            </p>
          </div>
        </div>
        <button
          onClick={generateIdeas}
          disabled={isGenerating}
          className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-xl font-bold transition shadow-lg shadow-red-500/25 flex items-center gap-2 text-sm shrink-0"
        >
          {isGenerating ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Generating Ideas...</>
          ) : (
            <><Zap className="w-4 h-4 text-yellow-300" /> Generate Spin-Off Ideas</>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl border border-red-100 dark:border-red-900/30 flex items-center gap-3 text-sm font-medium">
          <Info className="w-5 h-5 shrink-0" /> {error}
        </div>
      )}

      {/* Loading State */}
      {isGenerating && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-12 shadow-sm text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 bg-red-100 dark:bg-red-900/30 rounded-full animate-ping opacity-75"></div>
            <div className="relative bg-red-50 dark:bg-red-900/50 w-full h-full rounded-full flex items-center justify-center border-2 border-red-200 dark:border-red-800 shadow-inner">
               <Lightbulb className="w-10 h-10 text-red-600 animate-pulse" />
            </div>
          </div>
          <h4 className="text-xl font-extrabold text-gray-900 dark:text-white mb-2">Engineering Viral Concepts</h4>
          <p className="text-gray-500 dark:text-gray-400">Analyzing audience psychology and generating high-CTR angles...</p>
        </div>
      )}

      {/* Results State */}
      {!isGenerating && ideas.length > 0 && (
        <div className="space-y-6">
          
          {/* Analysis Banner */}
          {analysis && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-2xl border border-blue-200 dark:border-blue-900/30 p-5 shadow-sm">
                <h5 className="text-xs font-extrabold text-blue-800 dark:text-blue-300 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Target className="w-4 h-4" /> Core Audience Intent</h5>
                <p className="text-sm text-gray-700 dark:text-gray-300 font-medium leading-relaxed">{analysis.coreIntent}</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-2xl border border-purple-200 dark:border-purple-900/30 p-5 shadow-sm">
                <h5 className="text-xs font-extrabold text-purple-800 dark:text-purple-300 uppercase tracking-wider mb-2 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> Why The Original Worked</h5>
                <p className="text-sm text-gray-700 dark:text-gray-300 font-medium leading-relaxed">{analysis.whyOriginalWorked}</p>
              </div>
            </div>
          )}

          {/* Ideas Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {ideas.map((idea, idx) => (
              <div key={idea.id || idx} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow group flex flex-col">
                
                {/* Card Header */}
                <div className="bg-gray-50 dark:bg-gray-800/50 p-5 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex justify-between items-start gap-4 mb-3">
                    <span className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-md shrink-0">Idea {idx + 1}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        idea.difficulty === 'Easy' ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400' :
                        idea.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400' :
                        'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {idea.difficulty} Effort
                      </span>
                    </div>
                  </div>
                  <h4 className="text-lg font-extrabold text-gray-900 dark:text-white leading-tight group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                    {idea.title}
                  </h4>
                </div>

                {/* Card Body */}
                <div className="p-5 space-y-5 flex-1">
                  
                  {/* Angle */}
                  <div>
                    <h5 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><Target className="w-3.5 h-3.5" /> The Angle</h5>
                    <p className="text-sm text-gray-700 dark:text-gray-300 font-medium leading-relaxed">{idea.angle}</p>
                  </div>

                  {/* Hook */}
                  <div className="bg-yellow-50/50 dark:bg-yellow-900/10 rounded-xl p-3 border border-yellow-100 dark:border-yellow-900/20">
                    <h5 className="text-[10px] font-bold text-yellow-800 dark:text-yellow-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><PlayCircle className="w-3.5 h-3.5" /> First 10 Seconds (Hook)</h5>
                    <p className="text-sm text-gray-800 dark:text-gray-200 font-medium italic">"{idea.hook}"</p>
                  </div>

                  {/* Thumbnail */}
                  <div>
                    <h5 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><ImageIcon className="w-3.5 h-3.5" /> Thumbnail Concept</h5>
                    <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">{idea.thumbnailConcept}</p>
                  </div>
                  
                </div>
                
                {/* Card Footer */}
                <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-850/50 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-gray-500 flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5" /> Target: {idea.targetEmotion}
                  </span>
                  <div className="flex gap-2">
                    <button className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition" title="Copy idea to clipboard">
                      <Copy className="w-4 h-4" />
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-xs font-bold hover:bg-red-600 dark:hover:bg-red-500 hover:text-white transition-colors shadow-sm">
                      Use Idea <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isGenerating && ideas.length === 0 && (
        <div className="flex flex-col items-center justify-center min-h-[300px] bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8 text-center shadow-sm">
          <div className="bg-gray-50 dark:bg-gray-800 w-20 h-20 rounded-full flex items-center justify-center mb-4">
            <Lightbulb className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Ready to Brainstorm?</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md">
            Click the generate button above to create highly-converting video ideas based on the core intent and psychology of the selected video.
          </p>
        </div>
      )}

    </div>
  );
}
