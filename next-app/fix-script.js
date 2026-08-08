const fs = require('fs');
const path = require('path');

const baseDir = 'C:\\\\Users\\\\HC\\\\Desktop\\\\viral clip\\\\YouTube-Viral-Intelligence\\\\next-app';

function readFile(p) {
    return fs.readFileSync(path.join(baseDir, p), 'utf-8');
}

function writeFile(p, content) {
    fs.writeFileSync(path.join(baseDir, p), content, 'utf-8');
}

// 1. Create AiSuggestField.tsx
const aiSuggestCode = `"use client";

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
      toast.success(\`\${label} suggested!\`);
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
          placeholder={\`Enter \${label.toLowerCase()}...\`}
        />
      ) : (
        <Input 
          value={value} 
          onChange={(e) => onChange(e.target.value)} 
          className="text-xs h-8 rounded-md" 
          placeholder={\`Enter \${label.toLowerCase()}...\`}
        />
      )}
    </div>
  );
};

export default AiSuggestField;
`;
writeFile('src/components/studio/AiSuggestField.tsx', aiSuggestCode);

// 2. Modify storyboard-panel.tsx
const spPath = 'src/components/studio/panels/storyboard-panel.tsx';
let spContent = readFile(spPath);
const startIdx = spContent.indexOf('// Helper component for AI-assisted fields');
const endIdx = spContent.indexOf('export function StoryboardPanel');
if (startIdx !== -1 && endIdx !== -1) {
    spContent = spContent.substring(0, startIdx) + 'import AiSuggestField from "@/components/studio/AiSuggestField";\n\n' + spContent.substring(endIdx);
}
// Fix Clapperboard import
if (!spContent.includes('Clapperboard,')) {
    spContent = spContent.replace('import { Download, Clock, GripVertical, Image as ImageIcon, Video, Type, ArrowRight, Save, LayoutGrid, LayoutList, Sparkles, Upload, FileText, Wand2, ChevronDown, ChevronRight, Loader2, Lock, Unlock } from "lucide-react";', 'import { Download, Clock, GripVertical, Image as ImageIcon, Video, Type, ArrowRight, Save, LayoutGrid, LayoutList, Sparkles, Upload, FileText, Wand2, ChevronDown, ChevronRight, Loader2, Lock, Unlock, Clapperboard } from "lucide-react";');
}
writeFile(spPath, spContent);

// 3. Modify SceneCard.tsx
const scPath = 'src/components/studio/panels/SceneCard.tsx';
let scContent = readFile(scPath);
scContent = scContent.replace("import AiSuggestField from '@/components/ai/AiSuggestField';", "import AiSuggestField from '@/components/studio/AiSuggestField';\nimport { formatTime, calculateDuration } from '@/lib/utils';");
scContent = scContent.replace("import type { ScriptSection } from '@/types';", "import { ScriptSection } from '@/lib/types/studio';");
scContent = scContent.replace("globalTheme: string;", "globalTheme: string;\n  wpm: number;");
scContent = scContent.replace("globalTheme,\n    provided,", "globalTheme,\n    wpm,\n    provided,");
// Fix any implicitly typed v parameter in SceneCard AiSuggestField onChange handler
scContent = scContent.replace(/\(v\) =>/g, "(v: string) =>");
// Fix provided optional handling
scContent = scContent.replace(/\{\.\.\.provided\.draggableProps\}/g, "{...(provided?.draggableProps || {})}");
scContent = scContent.replace(/\{\.\.\.provided\.dragHandleProps\}/g, "{...(provided?.dragHandleProps || {})}");
writeFile(scPath, scContent);

// 4. studio-workspace.tsx
const swPath = 'src/components/studio/studio-workspace.tsx';
let swContent = readFile(swPath);
swContent = swContent.replace('import { ExportPanel } from "./panels/export-panel";', 'import ExportPanel from "./panels/export-panel";');
writeFile(swPath, swContent);

// 5. Modify studio.spec.ts
const tsPath = 'tests/e2e/studio.spec.ts';
let tsContent = readFile(tsPath);
tsContent = tsContent.replace(/\.click\(\s*\{\s*hasText\s*:\s*"([^"]+)"\s*\}\s*\)/g, '.filter({ hasText: "$1" }).click()');
tsContent = tsContent.replace(/\(arr\)/g, '(arr: any[])');
writeFile(tsPath, tsContent);

console.log('Done applying fixes!');
