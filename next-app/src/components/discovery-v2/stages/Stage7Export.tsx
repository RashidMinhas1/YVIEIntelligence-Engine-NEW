import React, { useState } from "react";
import { useSession } from "@/components/dashboard/session-context";
import { FileDown, CheckCircle, Copy, Check, Trello, Calendar, ArrowRight, Share2 } from "lucide-react";

export default function Stage7Export() {
  const { activeSession, updateSessionState } = useSession();
  const prevStage = () => updateSessionState({ wizardStep: 6 });

  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleExport = () => {
    setExporting(true);
    setTimeout(() => {
      setExporting(false);
      setExported(true);
    }, 1500);
  };

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 h-full flex flex-col items-center">
      <div className="w-full flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Stage 7: Export & Action Plan</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Export your finalized research to your project management tools or content calendar.
          </p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={prevStage}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            Back
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border border-gray-200 dark:border-gray-700 max-w-4xl w-full">
        {!exported ? (
          <div className="flex flex-col items-center justify-center text-center py-10">
            <div className="w-20 h-20 bg-green-50 dark:bg-green-900/20 text-green-500 rounded-full flex items-center justify-center mb-6">
              <FileDown size={40} />
            </div>
            <h3 className="text-3xl font-black mb-4">Research Complete</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-10">
              You've successfully discovered {activeSession?.filters?.outlierVideos?.length || 0} high-performing outlier videos, matched concepts, and reverse-engineered scripts. 
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-10 text-left">
              <div className="border-2 border-transparent hover:border-red-500 bg-gray-50 dark:bg-gray-900/50 p-6 rounded-xl cursor-pointer transition relative group">
                <div className="absolute top-4 right-4 text-gray-400 group-hover:text-red-500 transition">
                  <Share2 size={20} />
                </div>
                <div className="mb-4 text-blue-500"><Trello size={32} /></div>
                <h4 className="font-bold mb-2">Send to Notion / Trello</h4>
                <p className="text-xs text-gray-500">Create tasks for your writers, editors, and designers automatically.</p>
              </div>

              <div className="border-2 border-red-500 bg-red-50 dark:bg-red-900/10 p-6 rounded-xl cursor-pointer transition relative group shadow-md shadow-red-500/10">
                <div className="absolute top-4 right-4 text-red-500">
                  <CheckCircle size={20} />
                </div>
                <div className="mb-4 text-red-500"><FileDown size={32} /></div>
                <h4 className="font-bold mb-2">Download Full Report</h4>
                <p className="text-xs text-gray-500">Get a comprehensive PDF or Markdown file containing all your findings and scripts.</p>
              </div>

              <div className="border-2 border-transparent hover:border-red-500 bg-gray-50 dark:bg-gray-900/50 p-6 rounded-xl cursor-pointer transition relative group">
                <div className="absolute top-4 right-4 text-gray-400 group-hover:text-red-500 transition">
                  <ArrowRight size={20} />
                </div>
                <div className="mb-4 text-green-500"><Calendar size={32} /></div>
                <h4 className="font-bold mb-2">Schedule Content</h4>
                <p className="text-xs text-gray-500">Push to your internal content calendar to plan production.</p>
              </div>
            </div>

            <button
              onClick={handleExport}
              disabled={exporting}
              className="px-10 py-4 bg-red-600 text-white rounded-xl font-bold text-lg hover:bg-red-700 transition w-full max-w-md shadow-lg shadow-red-600/20 disabled:opacity-70 disabled:cursor-wait flex items-center justify-center gap-3"
            >
              {exporting ? (
                <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Compiling Report...</>
              ) : (
                <>Export Selected Plan</>
              )}
            </button>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-8 text-center border border-green-200 dark:border-green-800 mb-8">
              <CheckCircle className="text-green-500 mx-auto mb-4" size={48} />
              <h3 className="text-2xl font-bold text-green-900 dark:text-green-300 mb-2">Export Successful!</h3>
              <p className="text-green-700 dark:text-green-400">
                Your report has been generated. You can download the files or copy the raw markdown below.
              </p>
            </div>

            <div className="bg-gray-900 text-gray-100 rounded-xl p-6 relative">
              <button 
                onClick={handleCopy}
                className="absolute top-4 right-4 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 transition flex items-center gap-2"
              >
                {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                <span className="text-xs font-bold">{copied ? "Copied!" : "Copy Markdown"}</span>
              </button>
              
              <h4 className="font-mono text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider">research-report.md</h4>
              
              <pre className="text-sm font-mono overflow-auto max-h-[300px] text-gray-300">
{`# Viral Intelligence Report

## Executive Summary
Generated on: ${new Date().toLocaleDateString()}
Total Outliers Analyzed: ${activeSession?.filters?.outlierVideos?.length || 0}
Primary Goal: ${activeSession?.filters?.researchGoal || 'Custom Analysis'}

## Key Findings
- The most prominent hook structure was **Curiosity Gap + Authority**.
- Average video pacing: Fast (Cut every 3.2s).
- Primary color palette used across successful thumbnails: High Contrast (Red/Black/White).

## Next Steps
1. Script Generation for Topic A (See Stage 4 Concept Match).
2. Brief thumbnail designer using color palette guidelines.
3. Record A/B test hooks.`}
              </pre>
            </div>
            
            <div className="mt-8 flex justify-center">
              <button onClick={() => setExported(false)} className="text-sm font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white transition">
                Create another export
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
