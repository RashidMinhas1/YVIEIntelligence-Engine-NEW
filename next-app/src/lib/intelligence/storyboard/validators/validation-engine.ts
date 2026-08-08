import { SceneMemoryState, ValidationReport, InvalidScene } from "../types/pipeline";
import { SemanticNormalizer } from "../utils/semantic-normalizer";
import { SimilarityChecker } from "./similarity-checker";
import { VisualMemoryManager } from "../utils/visual-memory-manager";
import { ProductionScoringEngine } from "./production-scoring";

export class ValidationEngine {
  public static validateField(fieldGroup: 'visual' | 'camera' | 'art' | 'post', fieldData: any, previousScenes: any[]): string[] {
    const reasons: string[] = [];
    
    // Convert current field values to a single lowercase string for similarity
    const currentValues = Object.values(fieldData).filter(v => typeof v === 'string').join(' ').toLowerCase();
    if (!currentValues.trim()) return reasons;

    for (const prev of previousScenes) {
      let prevValues = "";
      if (fieldGroup === 'visual') prevValues = [prev.visualNotes, prev.environment, prev.background, prev.characterNotes].join(' ');
      if (fieldGroup === 'camera') prevValues = [prev.cameraAngle, prev.cameraLens, prev.cameraMovement, prev.composition].join(' ');
      if (fieldGroup === 'art') prevValues = [prev.location, prev.lighting, prev.colorPalette, prev.props, prev.style, prev.atmosphere].join(' ');
      if (fieldGroup === 'post') prevValues = [prev.editingStyle, prev.transitions, prev.effects, prev.motion, prev.soundSuggestions, prev.colorGrading].join(' ');
      
      prevValues = prevValues.toLowerCase().trim();
      if (!prevValues) continue;

      const sim = SimilarityChecker.calculateSimilarity(currentValues, prevValues);
      
      // Threshold for field duplication
      if (sim > 0.45) { // 45% similarity is very high for a specific field group
        reasons.push(`${fieldGroup.toUpperCase()} field similarity too high (${(sim * 100).toFixed(0)}%) with a previous scene.`);
        break;
      }
    }

    return reasons;
  }

  public static validateScenes(scenes: any[], scriptContent: string = ""): ValidationReport {
    const memoryManager = new VisualMemoryManager();
    const invalidScenes: InvalidScene[] = [];
    const usedOnScreenText = new Set<string>();

    scenes.forEach((scene, index) => {
      const reasons: string[] = [];
      const aiPrompt = scene.aiPrompt || "";
      const broll = scene.brollSuggestions ? scene.brollSuggestions.join(" ") : (scene.brollNotes || "");
      const environment = SemanticNormalizer.normalizeConcept(scene.environment || "");
      const lens = scene.cameraLens || "";
      const lighting = scene.lighting || "";
      const transition = scene.transitionNotes || scene.transitionSuggestions || "";
      const camera = scene.cameraMovement || "";
      const music = scene.musicNotes || "";
      const emotion = scene.emotion || "";
      const onScreenText = scene.onScreenText || "";

      // 0. Dynamic Context Validation (Template Leakage Check)
      const leakedTerms = ["world war", "tank", "air raid", "battlefield", "nazi", "hitler", "abandoned warehouse"];
      const lowerScript = scriptContent.toLowerCase();
      const allSceneText = JSON.stringify(scene).toLowerCase();
      
      leakedTerms.forEach(term => {
         if (allSceneText.includes(term) && !lowerScript.includes(term)) {
            reasons.push(`Template Leakage Detected: Unjustified term "${term}"`);
         }
      });

      // 1. On Screen Text (Never duplicate)
      if (onScreenText && usedOnScreenText.has(onScreenText.toLowerCase())) {
        reasons.push(`Duplicate On-Screen Text: "${onScreenText}"`);
      }
      if (onScreenText) usedOnScreenText.add(onScreenText.toLowerCase());

      // 2. Similarity Checks against previous scenes
      const previousScenes = memoryManager.getMemory();
      for (const prev of previousScenes) {
        if (aiPrompt && prev.aiPrompt) {
          const sim = SimilarityChecker.calculateSimilarity(aiPrompt, prev.aiPrompt);
          if (sim > 0.20) {
            reasons.push(`AI Prompt similarity too high (${(sim * 100).toFixed(0)}%) with a previous scene`);
            break; // only push once
          }
        }
        if (broll && prev.broll) {
          const sim = SimilarityChecker.calculateSimilarity(broll, prev.broll);
          if (sim > 0.25) {
            reasons.push(`B-roll similarity too high (${(sim * 100).toFixed(0)}%) with a previous scene`);
            break;
          }
        }
      }
      // 3. Field-specific duplicate validation
      const fieldGroups: ('visual' | 'camera' | 'art' | 'post')[] = ['visual', 'camera', 'art', 'post'];
      for (const group of fieldGroups) {
        const fieldErrors = ValidationEngine.validateField(group, scene, previousScenes);
        if (fieldErrors.length) {
          reasons.push(...fieldErrors);
        }
      }
      // 3. Consecutive Repeat Checks
      const envRepeats = memoryManager.getRecentConsecutiveCount("environment", environment);
      if (envRepeats >= 2) reasons.push(`Environment "${environment}" repeated >2 times`);

      const lensRepeats = memoryManager.getRecentConsecutiveCount("lens", lens);
      if (lensRepeats >= 2) reasons.push(`Lens "${lens}" repeated >2 times`);

      const lightingRepeats = memoryManager.getRecentConsecutiveCount("lighting", lighting);
      if (lightingRepeats >= 2) reasons.push(`Lighting "${lighting}" repeated >2 times`);

      const transitionRepeats = memoryManager.getRecentConsecutiveCount("transition", transition);
      if (transitionRepeats >= 2) reasons.push(`Transition "${transition}" repeated >2 times`);

      const cameraRepeats = memoryManager.getRecentConsecutiveCount("movement", camera);
      if (cameraRepeats >= 2) reasons.push(`Camera movement "${camera}" repeated >2 times`);

      const musicRepeats = memoryManager.getRecentConsecutiveCount("music", music);
      if (musicRepeats >= 2) reasons.push(`Music "${music}" repeated >2 times`);

      const emotionRepeats = memoryManager.getRecentConsecutiveCount("emotion", emotion);
      if (emotionRepeats >= 3) reasons.push(`Emotion "${emotion}" repeated >3 times`);

      if (reasons.length > 0) {
        invalidScenes.push({ sceneIndex: index, reasons, scene });
      }

      // Record to memory
      memoryManager.addScene({
        environment,
        location: scene.location || environment,
        camera,
        movement: camera,
        angle: scene.cameraAngle || "",
        lens,
        lighting,
        composition: scene.composition || "",
        transition,
        music,
        broll,
        aiPrompt,
        emotion,
        mood: scene.mood || "",
        visualMetaphor: scene.visualMetaphor || ""
      });
    });

    const isValid = invalidScenes.length === 0;
    let diversityPenalty = 0;
    invalidScenes.forEach(inv => {
        diversityPenalty += inv.reasons.length;
    });
    
    const metrics = ProductionScoringEngine.score(invalidScenes, scenes.length, diversityPenalty);

    return {
      isValid: metrics.overallScore >= 90,
      score: metrics.overallScore,
      invalidScenes,
      metrics
    };
  }
}
