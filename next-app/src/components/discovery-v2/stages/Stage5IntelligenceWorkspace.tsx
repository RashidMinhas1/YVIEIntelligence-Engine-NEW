import React, { useEffect, useState, useRef } from "react";
import { useDiscovery } from "@/components/discovery-v2/engine/DiscoveryProvider";
import { V2Video } from "@/lib/types/discovery-v2";
import { 
  Database,
  Upload,
  Tag,
  FileText,
  AlertTriangle,
  CheckCircle,
  PlayCircle,
  X
} from "lucide-react";

export default function Stage5IntelligenceWorkspace() {
  const { state, updateState, nextStage, prevStage } = useDiscovery();
  const [selectedVideo, setSelectedVideo] = useState<V2Video | null>(null);
  const [tagInput, setTagInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize workspace with concept matched videos if empty
  useEffect(() => {
    if (state.workspaceItems.length === 0 && state.conceptMatchedVideos.length > 0) {
      updateState({ workspaceItems: [...state.conceptMatchedVideos] });
    }
  }, [state.conceptMatchedVideos, state.workspaceItems.length, updateState]);

  const items = state.workspaceItems;

  const updateItem = (updatedVideo: V2Video) => {
    updateState({
      workspaceItems: state.workspaceItems.map(v => 
        v.videoId === updatedVideo.videoId ? updatedVideo : v
      )
    });
    if (selectedVideo && selectedVideo.videoId === updatedVideo.videoId) {
      setSelectedVideo(updatedVideo);
    }
  };

  const handleAddTag = (video: V2Video, tag: string) => {
    if (!tag.trim() || video.tags?.includes(tag.trim())) return;
    const newTags = [...(video.tags || []), tag.trim()];
    updateItem({ ...video, tags: newTags });
    setTagInput("");
  };

  const handleRemoveTag = (video: V2Video, tagToRemove: string) => {
    const newTags = (video.tags || []).filter(t => t !== tagToRemove);
    updateItem({ ...video, tags: newTags });
  };

  const handleManualUpload = (video: V2Video) => {
    // Simulate manual transcript upload
    updateItem({
      ...video,
      transcriptStatus: "Manual Upload",
      transcriptText: "[Manual Transcript Content...]"
    });
  };

  const markReady = (video: V2Video) => {
    updateItem({
      ...video,
      transcriptStatus: "Ready for Analysis"
    });
  };

  const getStatusBadge = (status: V2Video["transcriptStatus"]) => {
    switch (status) {
      case "Missing":
        return <span className="flex items-center gap-1 text-red-600 bg-red-100 px-2 py-1 rounded text-xs font-medium dark:bg-red-900/30 dark:text-red-400"><AlertTriangle size={12}/> Transcript Missing</span>;
      case "Ready for Analysis":
        return <span className="flex items-center gap-1 text-emerald-600 bg-emerald-100 px-2 py-1 rounded text-xs font-medium dark:bg-emerald-900/30 dark:text-emerald-400"><CheckCircle size={12}/> Ready for Analysis</span>;
      case "AI Transcript":
      case "Available":
      case "Manual Upload":
        return <span className="flex items-center gap-1 text-blue-600 bg-blue-100 px-2 py-1 rounded text-xs font-medium dark:bg-blue-900/30 dark:text-blue-400"><FileText size={12}/> {status}</span>;
      case "Analysis Complete":
        return <span className="flex items-center gap-1 text-indigo-600 bg-indigo-100 px-2 py-1 rounded text-xs font-medium dark:bg-indigo-900/30 dark:text-indigo-400"><CheckCircle size={12}/> Analysis Complete</span>;
      default:
        return <span className="flex items-center gap-1 text-gray-600 bg-gray-100 px-2 py-1 rounded text-xs font-medium dark:bg-gray-800 dark:text-gray-400">{status}</span>;
    }
  };

  const allReady = items.length > 0 && items.every(i => i.transcriptStatus === "Ready for Analysis" || i.transcriptStatus === "Analysis Complete");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Stage 5: Intelligence Workspace</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage your curated videos, tag them, and ensure transcripts are ready for analysis.
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
            disabled={!allReady}
            className={`px-4 py-2 rounded-lg text-white transition ${
              allReady 
                ? "bg-indigo-600 hover:bg-indigo-700" 
                : "bg-indigo-400 cursor-not-allowed"
            }`}
          >
            Next Stage (AI Analysis)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
              <Database className="text-indigo-500" size={20} />
              Workspace Inventory ({items.length})
            </h3>
            
            {items.length === 0 ? (
              <div className="text-center py-10">
                <Database className="mx-auto text-gray-400 mb-3" size={48} />
                <p className="text-gray-500 dark:text-gray-400">No items in your workspace. Go back and select videos.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((video) => (
                  <div 
                    key={video.id} 
                    className={`flex items-center gap-4 p-3 rounded-lg border transition cursor-pointer ${selectedVideo?.videoId === video.videoId ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
                    onClick={() => setSelectedVideo(video)}
                  >
                    <div className="w-24 aspect-video relative rounded overflow-hidden shrink-0">
                      <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition">
                        <PlayCircle className="text-white" size={20} />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 dark:text-white truncate" title={video.title}>{video.title}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{video.channelTitle}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {getStatusBadge(video.transcriptStatus || "Missing")}
                        {video.tags?.map(tag => (
                          <span key={tag} className="flex items-center gap-1 text-gray-600 bg-gray-100 px-2 py-0.5 rounded text-xs dark:bg-gray-700 dark:text-gray-300">
                            <Tag size={10} /> {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar for Selected Video Details */}
        <div className="xl:col-span-1">
          {selectedVideo ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 sticky top-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">Item Details</h3>
              
              <div className="aspect-video rounded-lg overflow-hidden bg-gray-100 mb-4">
                <img src={selectedVideo.thumbnail} alt={selectedVideo.title} className="w-full h-full object-cover" />
              </div>
              
              <h4 className="font-medium text-gray-900 dark:text-white mb-1 leading-tight">{selectedVideo.title}</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{selectedVideo.channelTitle}</p>

              <div className="space-y-4">
                <div>
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">Tags</span>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {selectedVideo.tags?.map(tag => (
                      <span key={tag} className="flex items-center gap-1 text-gray-700 bg-gray-100 px-2 py-1 rounded-md text-xs dark:bg-gray-700 dark:text-gray-300">
                        {tag}
                        <button onClick={() => handleRemoveTag(selectedVideo, tag)} className="text-gray-400 hover:text-red-500"><X size={12}/></button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddTag(selectedVideo, tagInput)}
                      placeholder="Add tag..."
                      className="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button 
                      onClick={() => handleAddTag(selectedVideo, tagInput)}
                      className="px-3 py-1.5 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 transition"
                    >
                      <Tag size={16} />
                    </button>
                  </div>
                </div>

                <div>
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">Transcript Status</span>
                  <div className="mb-3">
                    {getStatusBadge(selectedVideo.transcriptStatus || "Missing")}
                  </div>
                  
                  {(!selectedVideo.transcriptStatus || selectedVideo.transcriptStatus === "Missing") && (
                    <div className="flex gap-2">
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept=".txt,.srt,.vtt"
                        onChange={() => handleManualUpload(selectedVideo)}
                      />
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                      >
                        <Upload size={16} /> Upload Manual
                      </button>
                    </div>
                  )}

                  {selectedVideo.transcriptStatus && selectedVideo.transcriptStatus !== "Missing" && selectedVideo.transcriptStatus !== "Ready for Analysis" && (
                    <button 
                      onClick={() => markReady(selectedVideo)}
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 text-sm font-medium rounded-lg transition dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50"
                    >
                      <CheckCircle size={16} /> Mark Ready
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-10 text-center border border-gray-200 dark:border-gray-700 border-dashed h-full flex flex-col items-center justify-center">
              <FileText className="text-gray-400 mb-3" size={32} />
              <p className="text-gray-500 dark:text-gray-400 text-sm">Select an item from the workspace to view details and manage transcripts.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
