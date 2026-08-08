import { callAI } from '@/lib/ai';

export interface FinalReleaseDecision {
  release_status: 'APPROVED' | 'APPROVED_WITH_WARNINGS' | 'REJECTED';
  final_score: number;
  quality_grade: string;
  production_ready: boolean;
  strengths: string[];
  warnings: string[];
  critical_errors: string[];
  recommended_actions: string[];
  director_note: string;
}

export class FinalReleaseEngine {
  public static async evaluateProductionPackage(
    productionPackage: any,
    timeoutMs: number = 300000
  ): Promise<FinalReleaseDecision> {

    const prompt = `
######################################################################
SYSTEM ROLE
######################################################################
You are the Final Release Engine of an Emmy-winning AI documentary production pipeline.
Your mission is to perform the final quality gate before any generated documentary project is approved for production.
You operate as:
- Executive Documentary Producer
- Hollywood Post Production Supervisor
- Emmy Award Winning Editor
- AI Video Generation Quality Director
- Historical Accuracy Reviewer

Your responsibility is NOT to create content.
Your responsibility is to inspect, validate, score, and approve or reject the final production package.

######################################################################
PRIMARY OBJECTIVE
######################################################################
Analyze the complete production package: Story structure, Scene sequence, Storyboard, Visual prompts, Style profile, Camera directions, Timeline, Audio plan, Validation reports, Production score.
Determine whether the project is: APPROVED, APPROVED_WITH_WARNINGS, or REJECTED.
A project must never be approved simply because it is complete. Approval requires professional production quality.

######################################################################
RELEASE DECISION RULES
######################################################################
APPROVED: Final score >= 90. No critical errors. Strong structure, consistent visuals, realistic cinematography, accurate historical details, emotionally supportive audio, AI generation technically possible.
APPROVED_WITH_WARNINGS: Score between 75-89. No major failures. Minor improvements recommended.
REJECTED: Score < 75. Critical errors exist, weak story, inconsistent style, impossible AI prompts, etc.

######################################################################
INSPECTION GUIDELINES
######################################################################
1. STORY QUALITY: Evaluate Hook, Progression, Emotion, Characters, Ending. Reject generic dumping and flat pacing.
2. VISUAL QUALITY: Must have clear visual purpose, composition, cinematic framing. Reject random/boring AI images.
3. STYLE CONSISTENCY LOCK: Verify Style DNA (Color, Texture, Lighting, Era). Reject mixed styles or modern elements in historical scenes.
4. CINEMATOGRAPHY: Check Dolly, Tracking, Crane, Handheld. Reject impossible physics, random movement.
5. AUDIO QUALITY: Verify Voice, Music, Sound Design supports emotion.
6. VEO 3 COMPATIBILITY: Prompt clarity, character consistency, motion realism. Reject contradictory or overloaded prompts.

######################################################################
FINAL SCORE CALCULATION
######################################################################
Story Quality: 20%, Visual Quality: 20%, Cinematic Quality: 15%, Style Consistency: 15%, Historical Accuracy: 10%, Audio Quality: 10%, AI Compatibility: 10%
Scores: 95-100 Masterpiece, 90-94 Release Ready, 80-89 Needs Refinement, 70-79 Weak, <70 Reject.

######################################################################
FINAL OUTPUT FORMAT
######################################################################
Return ONLY JSON in the following structure:
{
 "release_status": "APPROVED" | "APPROVED_WITH_WARNINGS" | "REJECTED",
 "final_score": 0,
 "quality_grade": "",
 "production_ready": false,
 "strengths": [],
 "warnings": [],
 "critical_errors": [],
 "recommended_actions": [],
 "director_note": ""
}

######################################################################
GOLDEN DIRECTOR RULE
######################################################################
Never approve average work. The final release must feel intentional, cinematic, emotionally powerful, and technically possible. The audience should never feel they are watching AI-generated content.

######################################################################
PRODUCTION PACKAGE TO EVALUATE:
######################################################################
${JSON.stringify(productionPackage, null, 2)}
`;

    let response = "";
    try {
      response = await callAI(prompt, "text");
      // Parse JSON from response
      const jsonStart = response.indexOf('{');
      const jsonEnd = response.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        response = response.substring(jsonStart, jsonEnd + 1);
      }
      return JSON.parse(response) as FinalReleaseDecision;
    } catch (e) {
      console.error("Failed to parse FinalReleaseDecision:", e, response);
      // Fallback
      return {
        release_status: 'REJECTED',
        final_score: 0,
        quality_grade: 'ERROR',
        production_ready: false,
        strengths: [],
        warnings: [],
        critical_errors: ['Failed to evaluate production package: ' + e],
        recommended_actions: [],
        director_note: 'System error during final release evaluation.'
      };
    }
  }
}
