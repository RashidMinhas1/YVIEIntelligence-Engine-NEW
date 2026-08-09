import React, { useState, useRef } from "react";
import { V2Video, IndividualVideoIntelligence, UserVideoScript } from "@/lib/types/discovery-v2";
import { ExternalLink, CheckCircle, Eye, FileText, Upload, FileCode, Edit, Trash, X, ChevronDown, ChevronUp } from "lucide-react";

interface Props {
  video: V2Video;
  intel?: IndividualVideoIntelligence;
  onUpdateScript: (videoId: string, scriptData: UserVideoScript | null) => void;
  onClickDetails: () => void;
}

export function WorkspaceVideoCard({ video, intel, onUpdateScript, onClickDetails }: Props) {
  const simScore = video.conceptMatchData?.scores?.overall || 0;
  
  const [isPasting, setIsPasting] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatNumber = (num: string | number) => {
    const n = typeof num === 'string' ? parseInt(num) : num;
    if (isNaN(n)) return "0";
    if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
    if (n >= 1000) return (n / 1000).toFixed(1) + "K";
    return n.toString();
  };

  const handleSavePaste = () => {
    if (!pasteText.trim()) return;
    
    const wordCount = pasteText.trim().split(/\s+/).length;
    
    onUpdateScript(video.videoId, {
      status: "added",
      source: "user_paste",
      text: pasteText,
      wordCount,
      characterCount: pasteText.length,
      updatedAt: new Date().toISOString()
    });
    
    setIsPasting(false);
    setPasteText("");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const wordCount = text.trim().split(/\s+/).length;
      
      onUpdateScript(video.videoId, {
        status: "added",
        source: "user_upload",
        text,
        fileName: file.name,
        wordCount,
        characterCount: text.length,
        updatedAt: new Date().toISOString()
      });
    };
    reader.readAsText(file); // Only .txt is natively easy this way, skipping docx logic for brevity without libraries
    
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800/50 shadow-sm overflow-hidden transition group">
      
      {/* Top Section - Video Metadata */}
      <div className="flex gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer" onClick={onClickDetails}>
        <div className="w-32 aspect-video rounded-lg overflow-hidden relative shrink-0">
          <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
          <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1 rounded font-mono">
            {simScore}% Match
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 leading-tight" title={video.title}>{video.title}</h4>
          <p className="text-xs text-gray-500 mt-1 truncate">{video.channelTitle}</p>
          <div className="flex items-center gap-3 mt-2 text-xs font-mono text-gray-500">
            <span className="flex items-center gap-1"><Eye size={12}/> {formatNumber(video.viewCount)}</span>
            {intel ? (
              <span className="text-emerald-500 flex items-center gap-1"><CheckCircle size={10}/> Analyzed</span>
            ) : (
              <span className="text-gray-400 flex items-center gap-1">Pending</span>
            )}
          </div>
        </div>
      </div>

      {/* Action Bar - Links */}
      <div className="px-3 py-2 bg-gray-50 dark:bg-gray-900/40 border-y border-gray-100 dark:border-gray-800 flex justify-end gap-2">
         <a 
           href={`https://youtube.com/watch?v=${video.videoId}`} 
           target="_blank" 
           rel="noopener noreferrer"
           className="text-xs flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 rounded"
         >
           Open Video <ExternalLink size={10} />
         </a>
         <a 
           href={`https://youtube.com/channel/${video.channelId}`} 
           target="_blank" 
           rel="noopener noreferrer"
           className="text-xs flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:underline px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded"
         >
           Open Channel <ExternalLink size={10} />
         </a>
      </div>

      {/* Script Section */}
      <div className="p-3 bg-white dark:bg-gray-800">
        <div className="flex justify-between items-center mb-2">
           <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 uppercase tracking-wide">
             <FileText size={14} className="text-blue-500" /> SCRIPT / TRANSCRIPT
           </h4>
           {video.userScript?.status === "added" ? (
             <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1"><CheckCircle size={12}/> Added</span>
           ) : (
             <span className="text-xs text-gray-400 flex items-center gap-1"><X size={12}/> Not Added</span>
           )}
        </div>

        {!video.userScript || video.userScript.status === "not_added" ? (
          <div className="space-y-2">
            {!isPasting ? (
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsPasting(true)}
                  className="flex-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg py-1.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center justify-center gap-1.5 text-gray-700 dark:text-gray-200"
                >
                  <FileCode size={12}/> Paste Script
                </button>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg py-1.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center justify-center gap-1.5 text-gray-700 dark:text-gray-200"
                >
                  <Upload size={12}/> Upload .txt
                </button>
                <input type="file" accept=".txt" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
              </div>
            ) : (
              <div className="space-y-2">
                 <textarea 
                   className="w-full h-24 text-sm p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                   placeholder="Paste script here..."
                   value={pasteText}
                   onChange={e => setPasteText(e.target.value)}
                 />
                 <div className="flex gap-2">
                   <button onClick={handleSavePaste} className="flex-1 bg-indigo-600 text-white text-xs py-1.5 rounded-lg hover:bg-indigo-700">Save</button>
                   <button onClick={() => { setIsPasting(false); setPasteText(""); }} className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs py-1.5 rounded-lg">Cancel</button>
                 </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5">
             <div className="flex justify-between items-center text-xs text-gray-600 dark:text-gray-400 font-mono mb-2">
               <span>{formatNumber(video.userScript.wordCount)} words</span>
               <span>{formatNumber(video.userScript.characterCount)} chars</span>
             </div>
             
             {/* Collapsible preview */}
             <div className="mb-2">
                <button onClick={() => setIsExpanded(!isExpanded)} className="text-[10px] text-gray-500 uppercase tracking-widest flex items-center gap-1 mb-1 hover:text-gray-700 dark:hover:text-gray-300">
                  {isExpanded ? <><ChevronUp size={12}/> Hide Preview</> : <><ChevronDown size={12}/> Show Preview</>}
                </button>
                {isExpanded && (
                  <div className="text-xs text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700 max-h-24 overflow-y-auto whitespace-pre-wrap">
                    {video.userScript.text}
                  </div>
                )}
             </div>

             <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
               <button onClick={() => setIsPasting(true)} className="flex-1 text-[10px] font-medium uppercase text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center justify-center gap-1">
                 <Edit size={10}/> Replace
               </button>
               <button onClick={() => onUpdateScript(video.videoId, null)} className="flex-1 text-[10px] font-medium uppercase text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 flex items-center justify-center gap-1">
                 <Trash size={10}/> Remove
               </button>
             </div>
          </div>
        )}
      </div>

    </div>
  );
}
