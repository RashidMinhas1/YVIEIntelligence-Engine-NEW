import React, { useMemo } from 'react';
import { StudioProject, ActionableRecommendation } from '@/lib/types/studio';
import { Brain, AlertTriangle, TrendingDown, Target, Lightbulb, Activity, CheckCircle2, ChevronRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useJob } from '@/hooks/use-job';
import { JobProgress } from '@/components/ui/job-progress';
import { toast } from 'sonner';

interface IntelligencePanelProps {
  project: StudioProject;
  setProject?: React.Dispatch<React.SetStateAction<StudioProject>>;
}

export const IntelligencePanel: React.FC<IntelligencePanelProps> = ({ project, setProject }) => {
  const { job, isPolling, startPolling, cancelJob, reset } = useJob(null, {
    onComplete: (result) => {
      if (setProject && result.recommendations) {
        setProject(p => ({
          ...p,
          actionableRecommendations: result.recommendations,
          updatedAt: new Date().toISOString()
        }));
        toast.success("Comprehensive Analysis complete.");
      }
    },
    onError: (err) => {
      toast.error(err || "Analysis failed.");
    }
  });

  const handleRunAnalysis = async () => {
    if (isPolling) return;
    reset();
    try {
      const res = await fetch("/api/studio/intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project })
      });
      const data = await res.json();
      if (data.jobId) startPolling(data.jobId);
    } catch (err) {
      toast.error("Failed to start analysis.");
    }
  };

  const applyRecommendation = (rec: ActionableRecommendation) => {
    if (!setProject) return;

    setProject(prev => {
      const next = { ...prev, updatedAt: new Date().toISOString() };
      const p = rec.actionPayload;

      try {
        if (p.type === 'UPDATE_SECTION_CONTENT') {
          next.sections = next.sections.map(s => s.id === p.targetId ? { ...s, content: p.newValue } : s);
        } else if (p.type === 'UPDATE_THUMBNAIL_PROMPT') {
          if (next.production?.thumbnails) {
            next.production.thumbnails = next.production.thumbnails.map(t => 
              t.id === p.targetId ? { ...t, negativePrompt: p.newValue } : t
            );
          }
        } else if (p.type === 'UPDATE_TITLE') {
          if (next.production?.titles) {
            next.production.titles = next.production.titles.map(t => 
              t.id === p.targetId ? { ...t, title: p.newValue } : t
            );
          }
        } else if (p.type === 'ADD_CHECKLIST_ITEM') {
          if (!next.production) {
            next.production = { thumbnails: [], titles: [], chapters: [], editingChecklist: [] };
          }
          if (!next.production.editingChecklist) {
            next.production.editingChecklist = [];
          }
          next.production.editingChecklist = [
            ...next.production.editingChecklist,
            { id: crypto.randomUUID(), category: 'music', description: p.newValue, completed: false }
          ];
        }

        // Mark as applied
        if (next.actionableRecommendations) {
          next.actionableRecommendations = next.actionableRecommendations.map(r => 
            r.id === rec.id ? { ...r, applied: true } : r
          );
        }

        toast.success(`Applied to ${rec.tab}`);
      } catch (e) {
        toast.error("Failed to apply recommendation");
      }

      return next;
    });
  };

  const summary = useMemo(() => {
    let totalScore = 0;
    let weakCount = 0;
    let difficultCount = 0;
    let totalRisks = 0;
    
    const scenesWithIntel = project.sections.filter(s => s.intelligence);
    const count = scenesWithIntel.length;

    scenesWithIntel.forEach(s => {
      const intel = s.intelligence!;
      const quality = (intel.hookStrength + intel.visualImpact + intel.retentionScore) / 3;
      totalScore += quality;
      if (quality < 50) weakCount++;
      if (intel.productionDifficulty > 75) difficultCount++;
      totalRisks += intel.riskFlags?.length || 0;
    });

    const avgQuality = count > 0 ? Math.round(totalScore / count) : 0;
    const productionScore = count > 0 
      ? Math.max(0, Math.min(100, Math.round(avgQuality - (difficultCount * 5) - (totalRisks * 2))))
      : 0;

    return {
      avgQuality,
      weakCount,
      difficultCount,
      totalRisks,
      productionScore,
      analyzedCount: count,
      totalScenes: project.sections.length
    };
  }, [project.sections]);

  const recs = project.actionableRecommendations || [];

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto custom-scrollbar overflow-y-auto h-full bg-background">
      <div className="flex justify-between items-end border-b pb-4">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary" /> Production Intelligence
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Aggregated analysis for {summary.analyzedCount} out of {summary.totalScenes} scenes.
          </p>
        </div>
        <Button onClick={handleRunAnalysis} disabled={isPolling} className="shadow-sm">
          {isPolling ? "Analyzing..." : "Run Comprehensive Analysis"}
        </Button>
      </div>

      {isPolling && job && (
        <div className="py-4">
          <JobProgress job={job} onCancel={cancelJob} />
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-muted/10 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <Target className="w-3.5 h-3.5" /> Overall Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">{summary.productionScore}<span className="text-sm font-normal text-muted-foreground">/100</span></div>
          </CardContent>
        </Card>

        <Card className="bg-muted/10 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <Brain className="w-3.5 h-3.5" /> Avg Quality
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">{summary.avgQuality}</div>
          </CardContent>
        </Card>

        <Card className="bg-red-500/5 border-red-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-red-500 uppercase tracking-wider flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5" /> Weak Scenes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-red-600 dark:text-red-400">{summary.weakCount}</div>
          </CardContent>
        </Card>

        <Card className="bg-yellow-500/5 border-yellow-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-yellow-600 dark:text-yellow-500 uppercase tracking-wider flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> Total Risks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-yellow-600 dark:text-yellow-500">{summary.totalRisks}</div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-primary" /> Actionable Recommendations
        </h3>
        {recs.length === 0 ? (
          <div className="text-center p-8 border border-dashed rounded-xl text-muted-foreground bg-muted/5">
            No recommendations yet. Click "Run Comprehensive Analysis" to scan your project.
          </div>
        ) : (
          <div className="grid gap-3">
            {recs.map((rec) => (
              <div key={rec.id} className={`border rounded-xl p-4 flex flex-col md:flex-row md:items-start justify-between gap-4 transition-all ${rec.applied ? "bg-muted/30 border-muted opacity-80" : "bg-card shadow-sm border-primary/20"}`}>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded flex items-center">
                      Tab: {rec.tab} <ChevronRight className="w-3 h-3 mx-1 opacity-50"/> {rec.context}
                    </span>
                    {rec.applied && <span className="text-xs font-medium text-emerald-500 flex items-center"><CheckCircle2 className="w-3 h-3 mr-1" /> Applied</span>}
                  </div>
                  <p className="text-sm font-medium">{rec.issue}</p>
                  <div className="bg-muted p-3 rounded-lg text-sm flex flex-col gap-2 border border-border/50">
                    <div className="text-muted-foreground"><strong className="text-foreground">Suggestion:</strong> {rec.suggestion}</div>
                    <div className="font-mono text-xs text-primary/80 bg-background p-2 rounded border border-border/40">
                      <strong className="text-foreground mr-2 opacity-60">Change to:</strong> 
                      {rec.actionPayload.newValue}
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0 md:mt-0 mt-2">
                  <Button 
                    onClick={() => applyRecommendation(rec)} 
                    disabled={rec.applied}
                    className="w-full md:w-auto shadow-sm"
                  >
                    {rec.applied ? "Applied" : "Apply Change"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
