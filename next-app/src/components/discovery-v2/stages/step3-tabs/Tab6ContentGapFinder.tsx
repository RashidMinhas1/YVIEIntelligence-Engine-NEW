'use client';

import React from 'react';
import { Step3TabProps } from './types';
import { Info, Target, Users, Zap, Layout, HelpCircle, TrendingUp } from 'lucide-react';

export default function Tab6ContentGapFinder({ selectedVideo }: Step3TabProps) {
  if (!selectedVideo) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        <Info className="w-12 h-12 mb-4 text-red-500" />
        <p className="text-lg font-medium">Select a video to view content gaps.</p>
      </div>
    );
  }

  const adv = selectedVideo.advancedResearch;
  const gap = adv?.contentGap;

  if (!gap) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        <Info className="w-12 h-12 mb-4 text-yellow-500" />
        <p className="text-lg font-medium">Run Advanced AI Research to find content gaps.</p>
      </div>
    );
  }

  const getOppColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'high': return 'text-green-600 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'medium': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'low': return 'text-red-600 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
    }
  };

  const gapSections = [
    {
      title: "Missing Angle",
      icon: <Target className="w-5 h-5 text-blue-500" />,
      content: gap.suggestedAngle || 'No specific angle identified.',
      expectedImpact: 'High potential for differentiation'
    },
    {
      title: "Untapped Audience",
      icon: <Users className="w-5 h-5 text-purple-500" />,
      content: gap.suggestedAudience || 'Broad audience currently served.',
      expectedImpact: 'Reach new demographics'
    },
    {
      title: "Format Innovation",
      icon: <Layout className="w-5 h-5 text-green-500" />,
      content: gap.suggestedImprovement || 'Standard format is overused.',
      expectedImpact: 'Improved retention and engagement'
    },
    {
      title: "Unanswered Questions",
      icon: <HelpCircle className="w-5 h-5 text-orange-500" />,
      content: 'Viewers are likely asking for practical steps not covered in current videos.',
      expectedImpact: 'High search volume potential'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Content Gap Finder</h3>
        <div className={`px-4 py-2 rounded-full border font-bold flex items-center gap-2 ${getOppColor(gap.opportunityLevel || '')}`}>
          <TrendingUp className="w-5 h-5" />
          Overall Opportunity: {gap.opportunityLevel || 'Unknown'}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {gapSections.map((section, idx) => (
          <div key={idx} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:border-red-300 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                {section.icon}
              </div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{section.title}</h4>
            </div>
            
            <p className="text-gray-700 dark:text-gray-300 text-lg mb-4 font-medium">
              "{section.content}"
            </p>
            
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Expected Impact: <span className="text-gray-900 dark:text-white">{section.expectedImpact}</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
