import React from 'react';
import { GripVertical, Lock, Unlock, Video, Type, Brain, ChevronDown, ChevronUp, AlertTriangle, Lightbulb, TrendingUp, Check, X, Copy, Trash2, Edit2, Wand2, ImageIcon } from 'lucide-react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import AiSuggestField from '@/components/studio/AiSuggestField';
import { formatTime, calculateDuration } from '@/lib/utils';
import { ScriptSection } from '@/lib/types/studio';
import type { DraggableProvided } from '@hello-pangea/dnd';

export interface SceneCardProps {
  section: ScriptSection;
  index: number;
  isExpanded: boolean;
  toggleSceneExpanded: (id: string) => void;
  updateSection: (id: string, updates: Partial<ScriptSection>) => void;
  handleContentChange: (id: string, value: string) => void;
  globalTheme: string;
  wpm: number;
  provided?: DraggableProvided;
  onRemove?: (id: string) => void;
  onDuplicate?: (id: string) => void;
}

const SceneCard: React.FC<SceneCardProps> = React.memo((props) => {
  const {
    section,
    index,
    isExpanded,
    toggleSceneExpanded,
    updateSection,
    handleContentChange,
    globalTheme,
    wpm,
    provided,
    onRemove,
    onDuplicate
  } = props;

  const [showIntelligence, setShowIntelligence] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
  const [pendingImprovements, setPendingImprovements] = useState<null | { visual?: string; camera?: string; hook?: string; artDirection?: string; lighting?: string; composition?: string; motion?: string; broll?: string; sfx?: string; music?: string; colorGrade?: string; postProduction?: string; editingNotes?: string; raw: any }>(null);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/studio/scene/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scene: section })
      });
      if (res.ok) {
        const data = await res.json();
        updateSection(section.id, { intelligence: data });
        setShowIntelligence(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleImprove = async () => {
    setIsImproving(true);
    try {
      const res = await fetch('/api/studio/scene/improve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scene: section })
      });
      if (res.ok) {
        const data = await res.json();
        setPendingImprovements({
          visual: data.improvedVisualPrompt,
          camera: data.improvedCamera,
          hook: data.improvedHook,
          artDirection: data.improvedArtDirection,
          lighting: data.improvedLighting,
          composition: data.improvedComposition,
          motion: data.improvedMotion,
          broll: data.improvedBRoll,
          sfx: data.improvedSFX,
          music: data.improvedMusic,
          colorGrade: data.improvedColorGrade,
          postProduction: data.improvedPostProduction,
          editingNotes: data.improvedEditingNotes,
          raw: data
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsImproving(false);
    }
  };

  const applyImprovements = (updates: Partial<ScriptSection>) => {
    updateSection(section.id, updates);
    setPendingImprovements(null);
  };

  return (
    <div
      ref={provided?.innerRef}
      {...(provided?.draggableProps as any)}
      className="bg-card border border-border/60 rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col group"
    >
      {/* Scene Header */}
      <div className="p-3 border-b border-border/40 bg-muted/10 flex justify-between items-center rounded-t-xl gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div {...(provided?.dragHandleProps as any)} className="text-muted-foreground hover:text-foreground cursor-grab p-1 shrink-0">
            <GripVertical className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold px-2.5 py-1 bg-primary/10 text-primary rounded-md uppercase tracking-wider shrink-0">
            Scene {index + 1}
          </span>
          <Input
            value={section.title || ''}
            onChange={(e) => updateSection(section.id, { title: e.target.value })}
            className="h-8 text-sm font-semibold bg-transparent border-transparent hover:border-border/50 focus:bg-background focus:border-border max-w-[200px]"
            placeholder="Scene Title..."
          />
          <span className="text-xs text-muted-foreground font-mono font-medium shrink-0">
            {formatTime(section.duration || calculateDuration(section.content, wpm))}
          </span>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => onDuplicate && onDuplicate(section.id)} title="Copy Scene">
            <Copy className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={(e) => { e.stopPropagation(); handleAnalyze(); }} disabled={isAnalyzing} title="AI Analyze">
            <Brain className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={(e) => { e.stopPropagation(); handleImprove(); }} disabled={isImproving} title="AI Regenerate">
            <Wand2 className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => { if (!isExpanded) toggleSceneExpanded(section.id); }} title="Edit Scene">
            <Edit2 className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => onRemove && onRemove(section.id)} title="Delete Scene">
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
          <div className="w-px h-4 bg-border mx-1"></div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground hover:text-foreground ml-1"
            onClick={() => toggleSceneExpanded(section.id)}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
            {isExpanded ? 'Collapse' : 'Expand'}
          </Button>
        </div>
      </div>

      {/* Collapsed Preview */}
      {!isExpanded && (
        <div 
          className="p-4 text-sm text-muted-foreground line-clamp-2 italic cursor-pointer hover:bg-muted/30 transition-colors"
          onClick={() => toggleSceneExpanded(section.id)}
        >
           {section.content || section.visualNotes || "Empty scene..."}
        </div>
      )}

      {/* Expanded Content */}
      <div className={`flex flex-col custom-scrollbar overflow-y-auto transition-all ${isExpanded ? 'p-5 space-y-6 max-h-[800px] border-t border-border/20' : 'h-0 p-0 overflow-hidden border-t-0'}`}>
        {/* Core Narrative */}
        <div className="space-y-4 bg-muted/5 p-4 rounded-lg border border-border/30">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <AiSuggestField
                label="Scene Goal"
                fieldKey="sceneGoal"
                value={section.sceneGoal || ''}
                onChange={(v: string) => updateSection(section.id, { sceneGoal: v })}
                sectionId={section.id}
                scriptChunk={section.content}
                globalTheme={globalTheme}
              />
            </div>

            <div>
              <label className="text-xs font-bold text-foreground flex items-center mb-2">
                <Type className="w-3.5 h-3.5 mr-1.5 text-primary" /> Script Chunk / Dialogue
              </label>
              <Textarea
                value={pendingImprovements?.hook || section.content}
                onChange={(e) => handleContentChange(section.id, e.target.value)}
                className={`text-sm min-h-[100px] resize-y rounded-md bg-background border-border/50 focus:border-primary/50 ${pendingImprovements?.hook ? 'ring-2 ring-blue-500' : ''}`}
                placeholder="Voiceover script content..."
              />
            </div>

            <AiSuggestField
              label="Voice Over Notes (Tone, Pace, Emotion)"
              fieldKey="voiceOver"
              value={section.voiceOver || ''}
              onChange={(v: string) => updateSection(section.id, { voiceOver: v })}
              sectionId={section.id}
              scriptChunk={section.content}
              globalTheme={globalTheme}
            />
          </div>
        </div>

        {/* Visuals & Camera */}
        <div className="space-y-4 relative">
          <div className="flex items-center justify-between border-b pb-1">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center">
              <Video className="w-3.5 h-3.5 mr-1.5 text-primary" /> Visuals & Camera
            </h4>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  updateSection(section.id, {
                    lockedFields: { ...section.lockedFields, visual: !section.lockedFields?.visual },
                  })
                }
                className={`p-1 rounded flex items-center gap-1 text-[10px] font-bold uppercase transition-colors ${section.lockedFields?.visual ? 'bg-red-500/10 text-red-5' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                title="Lock Visuals Field from AI Updates"
              >
                {section.lockedFields?.visual ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />} Visual
              </button>
              <button
                onClick={() =>
                  updateSection(section.id, {
                    lockedFields: { ...section.lockedFields, camera: !section.lockedFields?.camera },
                  })
                }
                className={`p-1 rounded flex items-center gap-1 text-[10px] font-bold uppercase transition-colors ${section.lockedFields?.camera ? 'bg-red-500/10 text-red-5' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                title="Lock Camera Field from AI Updates"
              >
                {section.lockedFields?.camera ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />} Camera
              </button>
            </div>
          </div>

          <AiSuggestField
            label="Visual Description"
            fieldKey="visual"
            value={pendingImprovements?.visual || section.visualNotes || ''}
            onChange={(v: string) => updateSection(section.id, { visualNotes: v })}
            sectionId={section.id}
            scriptChunk={section.content}
            globalTheme={globalTheme}
          />
          <AiSuggestField
            label="Art Direction"
            fieldKey="artDirection"
            value={pendingImprovements?.artDirection || section.artDirection || ''}
            onChange={(v: string) => updateSection(section.id, { artDirection: v })}
            sectionId={section.id}
            scriptChunk={section.content}
            globalTheme={globalTheme}
          />
          <AiSuggestField
            label="Lighting"
            fieldKey="lighting"
            value={pendingImprovements?.lighting || section.lighting || ''}
            onChange={(v: string) => updateSection(section.id, { lighting: v })}
            sectionId={section.id}
            scriptChunk={section.content}
            globalTheme={globalTheme}
          />
          <AiSuggestField
            label="Composition"
            fieldKey="composition"
            value={pendingImprovements?.composition || section.composition || ''}
            onChange={(v: string) => updateSection(section.id, { composition: v })}
            sectionId={section.id}
            scriptChunk={section.content}
            globalTheme={globalTheme}
          />
          <AiSuggestField
            label="Motion"
            fieldKey="motion"
            value={pendingImprovements?.motion || section.motion || ''}
            onChange={(v: string) => updateSection(section.id, { motion: v })}
            sectionId={section.id}
            scriptChunk={section.content}
            globalTheme={globalTheme}
          />
          <AiSuggestField
            label="B‑Roll"
            fieldKey="broll"
            value={pendingImprovements?.broll || section.brollNotes || ''}
            onChange={(v: string) => updateSection(section.id, { brollNotes: v })}
            sectionId={section.id}
            scriptChunk={section.content}
            globalTheme={globalTheme}
          />
          <AiSuggestField
            label="SFX"
            fieldKey="sfx"
            value={pendingImprovements?.sfx || section.soundEffects || ''}
            onChange={(v: string) => updateSection(section.id, { soundEffects: v })}
            sectionId={section.id}
            scriptChunk={section.content}
            globalTheme={globalTheme}
          />
          <AiSuggestField
            label="Music"
            fieldKey="music"
            value={pendingImprovements?.music || section.musicNotes || ''}
            onChange={(v: string) => updateSection(section.id, { musicNotes: v })}
            sectionId={section.id}
            scriptChunk={section.content}
            globalTheme={globalTheme}
          />
          <AiSuggestField
            label="Color Grade"
            fieldKey="colorGrade"
            value={pendingImprovements?.colorGrade || section.colorPalette || ''}
            onChange={(v: string) => updateSection(section.id, { colorPalette: v })}
            sectionId={section.id}
            scriptChunk={section.content}
            globalTheme={globalTheme}
          />
          <AiSuggestField
            label="Post Production"
            fieldKey="postProduction"
            value={pendingImprovements?.postProduction || section.postProduction || ''}
            onChange={(v: string) => updateSection(section.id, { postProduction: v })}
            sectionId={section.id}
            scriptChunk={section.content}
            globalTheme={globalTheme}
          />
          <AiSuggestField
            label="Editing Notes"
            fieldKey="editingNotes"
            value={pendingImprovements?.editingNotes || section.editingNotes || ''}
            onChange={(v: string) => updateSection(section.id, { editingNotes: v })}
            sectionId={section.id}
            scriptChunk={section.content}
            globalTheme={globalTheme}
          />
          <AiSuggestField
            label="Camera Directions"
            fieldKey="camera"
            value={pendingImprovements?.camera || section.cameraAngle || ''}
            onChange={(v: string) => updateSection(section.id, { cameraAngle: v })}
            sectionId={section.id}
            scriptChunk={section.content}
            globalTheme={globalTheme}
          />
        </div>
        
        {/* Scene Image Prompts */}
        {section.sceneImagePrompts && section.sceneImagePrompts.length > 0 && (
          <div className="border border-border/40 rounded-lg bg-muted/5 mt-4 overflow-hidden p-4 space-y-3">
             <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center mb-2">
                <ImageIcon className="w-3.5 h-3.5 mr-1.5 text-primary" /> Scene Image Prompts
             </h4>
             <div className="space-y-3">
               {section.sceneImagePrompts.map((prompt, index) => (
                 <div key={index} className="space-y-1">
                   <div className="text-xs font-semibold text-muted-foreground uppercase">Image Prompt {index + 1}</div>
                   <div className="text-sm bg-background p-3 rounded border border-border/50 text-foreground italic">
                     {prompt}
                   </div>
                 </div>
               ))}
             </div>
          </div>
        )}

        {/* Intelligence Section */}
        <div className="border border-border/40 rounded-lg bg-muted/5 mt-4 overflow-hidden">
          <div className="flex items-center justify-between p-3 bg-muted/20 cursor-pointer" onClick={() => setShowIntelligence(!showIntelligence)}>
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-primary" />
              <h4 className="text-sm font-bold uppercase tracking-wide">Scene Intelligence</h4>
              {section.intelligence && (
                 <>
                   {(() => {
                     const avg = Math.round((section.intelligence.hookStrength + section.intelligence.visualImpact + section.intelligence.retentionScore) / 3);
                     let label = 'Weak';
                     let bg = 'bg-red-500/20';
                     let txt = 'text-red-600';
                     if (avg >= 90) { label = 'Excellent'; bg = 'bg-green-500/20'; txt = 'text-green-600'; }
                     else if (avg >= 75) { label = 'Good'; bg = 'bg-blue-500/20'; txt = 'text-blue-600'; }
                     else if (avg >= 50) { label = 'Needs Improvement'; bg = 'bg-yellow-500/20'; txt = 'text-yellow-600'; }
                     return <span className={`px-2 py-0.5 rounded text-xs font-bold ${bg} ${txt}`}>Quality: {avg} ({label})</span>;
                   })()}
                 </>
               )}
            </div>
            <div className="flex items-center gap-2">
              {!section.intelligence && (
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); handleAnalyze(); }} disabled={isAnalyzing}>
                  {isAnalyzing ? "Analyzing..." : "Analyze Scene"}
                </Button>
              )}
              {showIntelligence ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </div>
          </div>
          
          {showIntelligence && (
            <div className="p-4 space-y-4">
              {!section.intelligence ? (
                <div className="text-sm text-muted-foreground text-center py-4">Click 'Analyze Scene' to generate intelligence scores.</div>
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground font-semibold uppercase">Hook Strength</div>
                      <div className="text-xl font-black">{section.intelligence.hookStrength}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground font-semibold uppercase">Visual Impact</div>
                      <div className="text-xl font-black">{section.intelligence.visualImpact}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground font-semibold uppercase">Retention Score</div>
                      <div className="text-xl font-black">{section.intelligence.retentionScore}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground font-semibold uppercase">Production Diff.</div>
                      <div className="text-xl font-black">{section.intelligence.productionDifficulty}</div>
                    </div>
                  </div>

                  {section.intelligence.riskFlags && section.intelligence.riskFlags.length > 0 && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded p-3 text-sm text-red-600 dark:text-red-400">
                      <div className="flex items-center font-bold mb-1"><AlertTriangle className="w-4 h-4 mr-1.5" /> Risk Flags</div>
                      <ul className="list-disc pl-5 space-y-1">
                        {section.intelligence.riskFlags.map((risk, i) => <li key={i}>{risk}</li>)}
                      </ul>
                    </div>
                  )}

                  {section.intelligence.suggestions && section.intelligence.suggestions.length > 0 && (
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded p-3 text-sm text-blue-600 dark:text-blue-400">
                      <div className="flex items-center font-bold mb-1"><Lightbulb className="w-4 h-4 mr-1.5" /> Suggestions</div>
                      <ul className="list-disc pl-5 space-y-1">
                        {section.intelligence.suggestions.map((sug, i) => <li key={i}>{sug}</li>)}
                      </ul>
                    </div>
                  )}

                  {pendingImprovements && (
                    <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg space-y-3">
                      <p className="text-sm font-bold text-blue-900 dark:text-blue-100">Review AI Improvements:</p>
                      <div className="flex gap-2">
                        <Button size="sm" className="bg-blue-600" onClick={() => applyImprovements({ 
                            visualNotes: pendingImprovements.visual || section.visualNotes,
                            cameraAngle: pendingImprovements.camera || section.cameraAngle,
                            content: pendingImprovements.hook || section.content,
                            artDirection: pendingImprovements.artDirection || section.artDirection,
                            lighting: pendingImprovements.lighting || section.lighting,
                            composition: pendingImprovements.composition || section.composition,
                            motion: pendingImprovements.motion || section.motion,
                            brollNotes: pendingImprovements.broll || section.brollNotes,
                            soundEffects: pendingImprovements.sfx || section.soundEffects,
                            musicNotes: pendingImprovements.music || section.musicNotes,
                            colorPalette: pendingImprovements.colorGrade || section.colorPalette,
                            postProduction: pendingImprovements.postProduction || section.postProduction,
                            editingNotes: pendingImprovements.editingNotes || section.editingNotes
                          })}>
                          <Check className="w-4 h-4 mr-2" /> Apply All
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-600" onClick={() => setPendingImprovements(null)}>
                          <X className="w-4 h-4 mr-2" /> Reject
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <Button size="sm" onClick={handleImprove} disabled={isImproving}>
                      <TrendingUp className="w-4 h-4 mr-2" /> {isImproving ? "Improving..." : "Improve Scene"}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default SceneCard;
