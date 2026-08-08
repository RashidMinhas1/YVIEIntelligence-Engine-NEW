import { StoryAnalyzer } from "./planners/story-analyzer";
import { VisualBeatPlanner } from "./planners/visual-beat-planner";
import { GlobalStoryPlanner } from "./planners/global-story-planner";
import { SceneGenerator } from "./generators/scene-generator";
import { ValidationEngine } from "./validators/validation-engine";
import { SceneRegenerator } from "./generators/scene-regenerator";
import { SCENE_CONCURRENCY } from "./constants";
import { VisualMemoryManager } from "./utils/visual-memory-manager";
import { ProductionAnalytics } from "./analytics/production-analytics";
import { StoryboardInspector } from "./analytics/storyboard-inspector";
import { PromptOptimizer } from "./optimizers/prompt-optimizer";
import { DebugPayload } from "./types/pipeline";

export class StoryboardPipeline {
  /**
   * Orchestrates the entire production pipeline.
   * Plan -> Generate -> Validate -> Regenerate -> Score
   */
  public static async execute(script: string | string[], theme: string, debug: boolean = false): Promise<any> {
    console.log("[Pipeline] Phase 2A: Story Analysis...");
    const analysis = await StoryAnalyzer.analyze(script, theme);

    console.log("[Pipeline] Phase 2A: Visual Beat Planning...");
    const beats = await VisualBeatPlanner.plan(script, analysis);
    if (debug) {
      console.log('[Debug] Generated Beats:', beats.map(b => ({ id: b.id, visualGoal: b.visualGoal, narration: b.narration.slice(0, 80) })));
    }

    console.log("[Pipeline] Phase 2B: Global Story Planning...");
    const productionPlan = await GlobalStoryPlanner.plan(analysis, beats, theme);

    console.log("[Pipeline] Phase 2C: Scene Generation...");
    const memoryManager = new VisualMemoryManager();
    const generatedScenes: any[] = [];

    // Generate scenes in parallel batches with a fixed concurrency limit
    const concurrency = SCENE_CONCURRENCY;
    for (let i = 0; i < beats.length; i += concurrency) {
      const batch = beats.slice(i, i + concurrency);
      const batchPromises = batch.map((beat) =>
        SceneGenerator.generate(beat, productionPlan, analysis, memoryManager.getMemory(), theme)
      );
      const results = await Promise.allSettled(batchPromises);

      // Process results in the order of the batch to preserve scene order
      results.forEach((result, idx) => {
        if (result.status === "fulfilled") {
          const scene = result.value;
          generatedScenes.push(scene);
          console.log(`[Debug] Scene ${generatedScenes.length - 1} generated`, {
            beatId: scene.beatId || batch[idx].id,
            visual: JSON.stringify(scene.subject || scene.environment || scene.visualNotes).slice(0, 80),
            camera: JSON.stringify(scene.cameraMovement || scene.cameraAngle).slice(0, 80),
            art: JSON.stringify(scene.location || scene.lighting).slice(0, 80),
            post: JSON.stringify(scene.editingStyle || scene.transitions).slice(0, 80)
          });
          // Update memory with the newly generated scene so subsequent batches can reference it
          memoryManager.addScene({
            environment: scene.environment || "",
            location: scene.location || scene.environment || "",
            camera: scene.cameraMovement || "",
            movement: scene.cameraMovement || "",
            angle: scene.cameraAngle || "",
            lens: scene.cameraLens || "",
            lighting: scene.lighting || "",
            composition: scene.composition || "",
            transition: scene.transitionNotes || "",
            music: scene.musicNotes || "",
            broll: scene.brollSuggestions ? scene.brollSuggestions.join(" ") : "",
            aiPrompt: scene.aiPrompt || "",
            emotion: scene.emotion || "",
            mood: scene.mood || "",
            visualMetaphor: scene.visualMetaphor || ""
          });
        } else {
          // Log the error; continue processing other scenes
          console.error("[Pipeline] Scene generation failed for beat", i + idx, result.reason);
        }
      });
    }

    console.log("[Pipeline] Phase 2D: Validation & Scoring...");
    let currentScenes = generatedScenes;
    const scriptContent = Array.isArray(script) ? script.join(" ") : script;
    let validationReport = ValidationEngine.validateScenes(currentScenes, scriptContent);
    let attempts = 0;
    let regeneratedScenesCount = 0;
    const MAX_ATTEMPTS = 3;
    const diffReport: any[] = [];
    const startTime = Date.now();

    while (validationReport.metrics.overallScore < 90 && attempts < MAX_ATTEMPTS) {
      console.log(`[Pipeline] Validation Run ${attempts + 1} Failed. Score: ${validationReport.metrics.overallScore}`);
      
      const regenerated = await SceneRegenerator.regenerateScenes(validationReport.invalidScenes, theme);
      
      regenerated.forEach(reg => {
        // Log diff
        diffReport.push({
          sceneIndex: reg.index,
          originalScene: currentScenes[reg.index],
          regeneratedScene: reg.scene,
          changes: "Regenerated to fix duplication/score"
        });
        currentScenes[reg.index] = reg.scene;
        regeneratedScenesCount++;
      });

      validationReport = ValidationEngine.validateScenes(currentScenes, scriptContent);
      attempts++;
    }

    if (validationReport.metrics.overallScore >= 90) {
      console.log(`[Pipeline] Success! Final Production Score: ${validationReport.metrics.overallScore}`);
    } else {
      console.warn(`[Pipeline] Max retries reached. Returning best effort. Final Score: ${validationReport.metrics.overallScore}`);
      // Per-field regeneration for scenes with validation failures (e.g., duplicate fields)
      for (const inv of validationReport.invalidScenes) {
        const { sceneIndex, reasons } = inv;
        const beat = beats[sceneIndex];
        const understanding = await SceneGenerator.buildUnderstanding(
          beat,
          productionPlan,
          analysis,
          memoryManager.getMemory(),
          null,
          theme
        );
        const prevScenes = currentScenes.slice(0, sceneIndex);
        let updatedScene = { ...currentScenes[sceneIndex] };
        if (reasons.some(r => r.toLowerCase().includes('visual'))) {
          const v = await SceneGenerator.generateVisualField(understanding, prevScenes);
          updatedScene = { ...updatedScene, ...v };
        }
        if (reasons.some(r => r.toLowerCase().includes('camera'))) {
          const c = await SceneGenerator.generateCameraField(understanding, prevScenes);
          updatedScene = { ...updatedScene, ...c };
        }
        if (reasons.some(r => r.toLowerCase().includes('art'))) {
          const a = await SceneGenerator.generateArtDirectionField(understanding, prevScenes);
          updatedScene = { ...updatedScene, ...a };
        }
        if (reasons.some(r => r.toLowerCase().includes('post'))) {
          const p = await SceneGenerator.generatePostProductionField(understanding, prevScenes);
          updatedScene = { ...updatedScene, ...p };
        }
        currentScenes[sceneIndex] = updatedScene;
      }
      // Re-validate after per-field fixes
      validationReport = ValidationEngine.validateScenes(currentScenes, scriptContent);
    }

    const executionTimeMs = Date.now() - startTime;

    // Optional Prompt Optimization step
    currentScenes = currentScenes.map(scene => {
      const optimized = PromptOptimizer.optimize(scene.aiPrompt || "", "");
      scene.aiPrompt = optimized.optimizedPrompt;
      return scene;
    });

    const result: any = {
      scenes: currentScenes,
      validationMetrics: validationReport.metrics
    };

    if (debug) {
      const debugPayload: DebugPayload = {
        storyAnalysis: analysis,
        visualBeats: beats,
        productionPlan,
        validationReport,
        productionAnalytics: ProductionAnalytics.generate(currentScenes),
        storyboardInspector: StoryboardInspector.inspect(currentScenes, validationReport),
        diffReport,
        pipelineMetrics: {
          executionTimeMs,
          aiCalls: 3 + attempts, // Analyzer + BeatPlanner + GlobalPlanner + Regeneration calls
          validationFailures: attempts,
          regeneratedScenes: regeneratedScenesCount,
          overallProductionScore: validationReport.metrics.overallScore
        }
      };
      
      result.debug = debugPayload;
    }

    return result;
  }
}
