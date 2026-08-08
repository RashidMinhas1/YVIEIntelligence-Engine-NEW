'use client';

import React, { useState } from 'react';
import { Step3TabProps } from './types';
import { ChevronDown, ChevronUp, FileText, Anchor, BookOpen, Users, Target, Activity, Heart, HelpCircle, MousePointerClick, MessageSquare, Edit3, Award } from 'lucide-react';

export default function Tab2IntelligenceReport({ selectedVideo, activeSession, setSelectedVideo }: Step3TabProps) {
  const selectedVideos = activeSession?.filters?.outlierVideos || [];

  if (!selectedVideo) {
    if (selectedVideos.length > 0) {
      return (
        <div className="space-y-6">
          <div className="bg-red-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-red-100 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <FileText className="text-red-500" /> Select a Video to view AI Report
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              You have {selectedVideos.length} videos queued for bulk analysis. Select one below to view its deep AI intelligence report.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {selectedVideos.map((video: any) => (
                <div 
                  key={video.id || video.videoId} 
                  onClick={() => setSelectedVideo(video)}
                  className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 cursor-pointer hover:border-red-400 hover:shadow-md transition-all flex gap-3 items-center group"
                >
                  <img src={video.thumbnail} className="w-20 h-14 object-cover rounded-md" alt={video.title} />
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-2 group-hover:text-red-600 transition-colors">{video.title}</h4>
                    <p className="text-xs text-gray-500">{video.channelTitle}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-red-50 dark:bg-gray-800/50 rounded-2xl border border-red-100 dark:border-gray-700 p-8 text-center border-dashed">
        <FileText className="w-16 h-16 text-red-300 dark:text-gray-600 mb-4" />
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Select a Video</h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-md">
          Go to the Outlier Videos tab and click "Analyze" to view the detailed AI intelligence report for a specific video.
        </p>
      </div>
    );
  }

  const sections = [
    { id: 'summary', title: 'AI Executive Summary', icon: <FileText className="w-4 h-4" />, content: selectedVideo.advancedResearch?.opportunitySummary?.strengths || "This video demonstrates a strong outlier performance due to its unique angle on an established topic. The format is highly replicable and shows strong audience engagement." },
    { id: 'hook', title: 'Hook Analysis', icon: <Anchor className="w-4 h-4" />, content: selectedVideo.hookType || "The hook utilizes a strong curiosity gap in the first 3 seconds, visually contradicting the title to force the viewer to keep watching." },
    { id: 'story', title: 'Story Structure', icon: <BookOpen className="w-4 h-4" />, content: "Uses a non-linear narrative. Starts with the climax/payoff, rewinds to the beginning, and builds tension through 3 distinct acts with escalating stakes." },
    { id: 'audience', title: 'Audience Analysis', icon: <Users className="w-4 h-4" />, content: selectedVideo.targetAudience || "Broad appeal, primarily targeting young adults interested in pop-culture anomalies, wealth psychology, and internet drama." },
    { id: 'intent', title: 'Intent Analysis', icon: <Target className="w-4 h-4" />, content: selectedVideo.primaryIntent || "Entertainment & Shock Value. The viewer clicks to satisfy curiosity about a bold claim and stays for the psychological validation." },
    { id: 'retention', title: 'Retention Pattern', icon: <Activity className="w-4 h-4" />, content: "High early retention driven by fast pacing and visual pattern interrupts every 4-6 seconds. A minor dip occurs around the 60% mark during the context-building phase." },
    { id: 'emotion', title: 'Emotional Trigger', icon: <Heart className="w-4 h-4" />, content: "Primary triggers: Surprise, Envy, and Vindication. The content validates the audience's preconceived notions while surprising them with the scale of the subject." },
    { id: 'curiosity', title: 'Curiosity Gap', icon: <HelpCircle className="w-4 h-4" />, content: "The thumbnail and title create an open loop: 'How rich are they?' and 'What was the accident?'. This gap is only closed in the final 20% of the video." },
    { id: 'cta', title: 'CTA Analysis', icon: <MousePointerClick className="w-4 h-4" />, content: "Seamlessly integrated into the narrative climax rather than bolted onto the end. The creator asks for a subscription right when emotional engagement is peaking." },
    { id: 'closing', title: 'Closing Analysis', icon: <MessageSquare className="w-4 h-4" />, content: "Abrupt ending designed to encourage immediate re-watching (looping) and driving viewers to the comments section to debate the conclusion." },
    { id: 'writing', title: 'Writing Style', icon: <Edit3 className="w-4 h-4" />, content: selectedVideo.contentStyle || "Conversational, fast-paced, and slightly sensationalized. Uses declarative statements and rhetorical questions to maintain authority." },
    { id: 'success', title: 'Key Success Factors', icon: <Award className="w-4 h-4" />, content: selectedVideo.whyOutperformed || "1. Exceptional visual hook\n2. High-contrast thumbnail\n3. Relatable subject matter masked as an exclusive secret\n4. Perfect pacing for short-form attention spans." },
  ];

  const AccordionItem = ({ section }: { section: typeof sections[0] }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <div className="border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 overflow-hidden shadow-sm hover:border-red-300 transition-colors">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 dark:hover:bg-gray-800/80 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="text-red-600 bg-red-100 dark:bg-red-900/30 p-2.5 rounded-lg">
              {section.icon}
            </div>
            <span className="font-bold text-gray-900 dark:text-white">{section.title}</span>
          </div>
          {isOpen ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </button>
        {isOpen && (
          <div className="p-5 pt-2 border-t border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-sm bg-gray-50/50 dark:bg-gray-900/20 leading-relaxed">
            {section.content}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 p-5 rounded-2xl shadow-sm">
        <img src={selectedVideo.thumbnail} alt={selectedVideo.title} className="w-32 h-20 object-cover rounded-lg shadow-sm" />
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1 line-clamp-1">{selectedVideo.title}</h2>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{selectedVideo.channelTitle} • {selectedVideo.viewCount.toLocaleString()} views</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map(s => <AccordionItem key={s.id} section={s} />)}
      </div>
    </div>
  );
}
