"use client";

import React, { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

const AiSuggestField = ({ 
  label, 
  value, 
  onChange, 
  sectionId, 
  fieldKey, 
  scriptChunk,
  globalTheme
}: { 
  label: string; 
  value: string; 
  onChange: (val: string) => void; 
  sectionId: string; 
  fieldKey: string;
  scriptChunk: string;
  globalTheme: string;
}) => {
  const [isSuggesting, setIsSuggesting] = useState(false);

  const handleSuggest = async () => {
    if (!scriptChunk.trim()) {
      toast.error("Add some script content first before requesting AI suggestions.");
      return;
    }
    setIsSuggesting(true);
    try {
      const res = await fetch("/api/studio/storyboard/suggest-field", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scriptChunk, fieldToSuggest: fieldKey, globalTheme })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onChange(data.suggestion);
      toast.success(`${label} suggested!`);
    } catch (err: any) {
      toast.error(err.message || "Suggestion failed.");
    } finally {
      setIsSuggesting(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</label>
        <button 
          onClick={handleSuggest} 
          disabled={isSuggesting}
          className="text-[10px] font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors disabled:opacity-50"
        >
          {isSuggesting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
          AI Suggest
        </button>
      </div>
      {fieldKey === "aiPrompt" || fieldKey === "brollSuggestions" || fieldKey === "voiceOver" ? (
        <Textarea 
          value={value} 
          onChange={(e) => onChange(e.target.value)} 
          className="text-xs min-h-[60px] resize-y rounded-md" 
          placeholder={`Enter ${label.toLowerCase()}...`}
        />
      ) : (
        <Input 
          value={value} 
          onChange={(e) => onChange(e.target.value)} 
          className="text-xs h-8 rounded-md" 
          placeholder={`Enter ${label.toLowerCase()}...`}
        />
      )}
    </div>
  );
};

export default AiSuggestField;
