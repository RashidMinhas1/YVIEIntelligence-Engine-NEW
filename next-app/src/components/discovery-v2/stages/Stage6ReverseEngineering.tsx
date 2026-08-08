import React, { useState } from "react";
import { useSession } from "@/components/dashboard/session-context";
import { Hammer, Youtube, Image as ImageIcon, Sparkles, Wand2, Download, BarChart, Eye } from "lucide-react";

export default function Stage6ReverseEngineering() {
  const { activeSession, updateSessionState } = useSession();
  const prevStage = () => updateSessionState({ wizardStep: 5 });
  const nextStage = () => updateSessionState({ wizardStep: 7 });

  const selectedOutliers = activeSession?.filters?.outlierVideos || [];
  
  const [selectedVideo, setSelectedVideo] = useState(selectedOutliers[0] || null);

  const [activeTab, setActiveTab] = useState<'script' | 'thumbnail'>('script');

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6 flex-shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Stage 6: Reverse Engineering</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Deconstruct the retention scripts and thumbnail designs of your outlier videos.
          </p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={prevStage}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            Back
          </button>
          <button 
            onClick={nextStage}
            className="px-4 py-2 rounded-lg text-white bg-red-600 hover:bg-red-700 transition"
          >
            Export & Action Plan
          </button>
        </div>
      </div>

      {selectedOutliers.length === 0 ? (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-8 text-center border border-yellow-200 dark:border-yellow-800 flex-1 flex flex-col items-center justify-center">
          <Hammer className="text-yellow-500 mb-4" size={48} />
          <h3 className="text-xl font-bold text-yellow-700 dark:text-yellow-500 mb-2">No Videos Selected</h3>
          <p className="text-yellow-600 dark:text-yellow-400 max-w-md">
            You need to select at least one outlier video in Stage 3 to reverse engineer its components.
          </p>
          <button 
            onClick={() => updateSessionState({ wizardStep: 3 })}
            className="mt-6 px-6 py-2 bg-yellow-100 text-yellow-800 rounded-lg font-bold hover:bg-yellow-200 transition"
          >
            Go back to Stage 3
          </button>
        </div>
      ) : (
        <div className="flex gap-6 flex-1 min-h-0">
          {/* Sidebar - Video Selection */}
          <div className="w-1/3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
            <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
              <Youtube size={18} /> Selected Outliers
            </h3>
            <div className="space-y-3">
              {selectedOutliers.map((video: any) => (
                <button
                  key={video.id}
                  onClick={() => setSelectedVideo(video)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    selectedVideo?.id === video.id
                      ? "bg-white dark:bg-gray-800 border-red-500 shadow-sm"
                      : "bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:border-red-300"
                  }`}
                >
                  <div className="flex gap-3">
                    <img src={video.thumbnail} alt="" className="w-20 h-12 object-cover rounded" />
                    <div>
                      <h4 className="font-bold text-sm line-clamp-2 leading-tight">{video.title}</h4>
                      <div className="text-xs text-gray-500 mt-1">{video.channelTitle}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Main Area - Deconstruction */}
          <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col min-h-0 overflow-hidden">
            {selectedVideo ? (
              <>
                <div className="flex border-b border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setActiveTab('script')}
                    className={`flex-1 py-4 font-bold text-sm flex items-center justify-center gap-2 transition ${
                      activeTab === 'script' 
                        ? "text-red-600 border-b-2 border-red-600 bg-red-50/50 dark:bg-red-900/10" 
                        : "text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-900"
                    }`}
                  >
                    <Sparkles size={16} /> Script & Pacing
                  </button>
                  <button
                    onClick={() => setActiveTab('thumbnail')}
                    className={`flex-1 py-4 font-bold text-sm flex items-center justify-center gap-2 transition ${
                      activeTab === 'thumbnail' 
                        ? "text-red-600 border-b-2 border-red-600 bg-red-50/50 dark:bg-red-900/10" 
                        : "text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-900"
                    }`}
                  >
                    <ImageIcon size={16} /> Thumbnail Breakdown
                  </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                  {activeTab === 'script' && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold">Script Deconstruction</h3>
                        <button className="px-4 py-2 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-blue-100 transition">
                          <Wand2 size={16} /> Generate Similar Script
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Hook Type</h4>
                          <p className="font-semibold text-lg text-red-600 dark:text-red-400">Curiosity Gap + Authority</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Pacing</h4>
                          <p className="font-semibold text-lg text-blue-600 dark:text-blue-400">Fast (Cut every 3.2s)</p>
                        </div>
                      </div>

                      <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                        <div className="bg-gray-50 dark:bg-gray-900 px-4 py-3 font-bold border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                          <span>Story Arc Timeline</span>
                          <span className="text-xs text-gray-500 bg-white dark:bg-gray-800 px-2 py-1 rounded">Length: {selectedVideo.duration}</span>
                        </div>
                        <div className="p-4 space-y-4">
                          <div className="flex gap-4">
                            <div className="w-16 flex-shrink-0 text-sm font-bold text-gray-400">0:00 - 0:15</div>
                            <div className="flex-1 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 dark:border-red-900/30">
                              <span className="font-bold text-red-700 dark:text-red-400 block mb-1">The Hook</span>
                              <p className="text-sm text-gray-700 dark:text-gray-300">Sets up an impossible scenario. Uses high-contrast visual (black background, bright red text).</p>
                            </div>
                          </div>
                          <div className="flex gap-4">
                            <div className="w-16 flex-shrink-0 text-sm font-bold text-gray-400">0:15 - 1:30</div>
                            <div className="flex-1 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-900/30">
                              <span className="font-bold text-blue-700 dark:text-blue-400 block mb-1">Context & Stakes</span>
                              <p className="text-sm text-gray-700 dark:text-gray-300">Explains why the viewer should care. Introduces the main conflict.</p>
                            </div>
                          </div>
                          <div className="flex gap-4">
                            <div className="w-16 flex-shrink-0 text-sm font-bold text-gray-400">1:30 - {selectedVideo.duration}</div>
                            <div className="flex-1 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-100 dark:border-green-900/30">
                              <span className="font-bold text-green-700 dark:text-green-400 block mb-1">Resolution & Payoff</span>
                              <p className="text-sm text-gray-700 dark:text-gray-300">Delivers on the promise of the hook. Fast-paced actionable advice.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'thumbnail' && (
                    <div className="space-y-6">
                       <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold">Thumbnail & Title Analysis</h3>
                      </div>
                      
                      <div className="p-4 bg-gray-900 rounded-xl relative group overflow-hidden">
                        <img src={selectedVideo.thumbnail} alt="Thumbnail" className="w-full h-auto rounded-lg object-cover" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button className="px-6 py-3 bg-white text-black rounded-full font-bold flex items-center gap-2 hover:scale-105 transition">
                            <Download size={18} /> Download Asset
                          </button>
                        </div>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Title Framework</h4>
                        <p className="text-lg font-bold">"{selectedVideo.title}"</p>
                        <div className="mt-3 flex gap-2">
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded">Negative Framing</span>
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-bold rounded">Curiosity Trigger</span>
                          <span className="px-2 py-1 bg-gray-200 text-gray-800 text-xs font-bold rounded">Short Length (42 chars)</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                         <div className="border border-gray-200 dark:border-gray-700 p-4 rounded-xl">
                            <h4 className="font-bold mb-2 flex items-center gap-2"><BarChart size={16} /> Color Palette</h4>
                            <div className="flex h-12 rounded-lg overflow-hidden">
                              <div className="bg-[#FF0000] flex-1"></div>
                              <div className="bg-[#000000] flex-1"></div>
                              <div className="bg-[#FFFFFF] flex-1"></div>
                              <div className="bg-[#FFD700] flex-1"></div>
                            </div>
                            <p className="text-xs text-gray-500 mt-2 text-center">High Contrast / Primary Colors</p>
                         </div>
                         <div className="border border-gray-200 dark:border-gray-700 p-4 rounded-xl">
                            <h4 className="font-bold mb-2 flex items-center gap-2"><Eye size={16} /> Visual Elements</h4>
                            <ul className="text-sm space-y-2 text-gray-600 dark:text-gray-400">
                              <li>• Faces present: Yes (Expressive)</li>
                              <li>• Text on thumbnail: Yes (3 words)</li>
                              <li>• Pointing/Arrows: Red Arrow</li>
                              <li>• Subject Size: Large (50% of frame)</li>
                            </ul>
                         </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                <Youtube size={48} className="mb-4 text-gray-300 dark:text-gray-600" />
                <p>Select a video from the sidebar to begin reverse engineering.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
