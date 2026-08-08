import { getAIProvider } from "../ai/factory";
import { getActiveProviderName } from "../ai/config";
import { ViralIntelligenceReport } from "../types/viral-intelligence";
import { repairTruncatedJson } from "../utils";

export class IntelligenceEngine {
  public async analyzeScript(
    scriptContent: string, 
    videoTitle: string = "", 
    options?: { testMode?: boolean; maxTokens?: number; providerOverride?: string }
  ): Promise<ViralIntelligenceReport | any> {
    const { AIRouter } = require("../ai/router");
    const providerName = options?.providerOverride || getActiveProviderName();
    const provider = AIRouter.getInstance();
    
    let systemPrompt = `You are an elite, highly experienced Senior YouTube Script Director with over 10 years of experience consulting for top 1% creators.
Your output must be strictly valid JSON matching the provided schema. Do NOT include markdown blocks (\`\`\`json\`) or any conversational text.

MANDATORY SCRIPT DIRECTOR DIRECTIVES:
1. DEEP REASONING OVER LABELS: Never just fill fields with generic words. Every metric, array, and string must contain deeply reasoned psychological explanations.
2. TITLE AS A CONTRACT: Treat the Video Title as a binding psychological contract. Explain exactly what expectations are created, whether the script fulfills them, and what is promised but never delivered.
3. THE NARRATIVE CHAIN: Analyze the script as an interconnected chain. Identify broken story flows, missing bridges, abrupt topic changes, and explain exactly why a transition fails.
4. CURIOSITY LIFECYCLE: Trace the exact points where curiosity is opened and closed. Identify if a payoff comes too early (killing retention) or too late (causing boredom). Identify where curiosity flatlines.
5. RETENTION PSYCHOLOGY: Estimate the exact paragraph where viewers are most likely to drop off. Explain the psychological reason for their departure (e.g., "The primary question was answered, and no new loop was opened").
6. STORY VALIDATION: Continuously cross-reference every paragraph against the central core narrative. Call out any tangent that weakens the story and explain why.
7. EMOTIONAL CURVE: Map how the viewer is expected to feel throughout the script dynamically. Explain the emotional shifts rather than just assigning labels.
8. DOCUMENTARY PACING: Evaluate the pacing of reveals, narrative rhythm, and payoff timing as if you were directing a high-end documentary.
9. ULTRA-SPECIFIC ACTIONABLE ADVICE: NEVER give generic advice like "Improve transition". You must provide highly specific guidance (e.g., "Paragraph 4 introduces 'X' abruptly. Close the loop on 'Y' from Paragraph 3 first").
10. NEVER REWRITE: You are a consultant. You NEVER rewrite the user's script. You only explain the problems and provide professional strategic recommendations.
11. TOKEN EFFICIENCY: For the 'paragraphLevelReview' array, ONLY review a maximum of the 5 most critical paragraphs that have retention risks. Do not review every single paragraph.`;

    if (options?.testMode) {
      systemPrompt = `You are a Senior YouTube Script Director evaluating scripts.
TEST MODE: Keep responses concise. No verbose explanations. Return only the required fields. Do NOT include markdown blocks (\`\`\`json\`) or conversational text.`;
    }

    const prompt = `
Analyze the following YouTube video title and script, and generate a complete Viral Intelligence Report.

VIDEO TITLE (The Promise):
${videoTitle || "No title provided"}

SCRIPT CONTENT (The Delivery):
${scriptContent}

---
JSON SCHEMA FOR RESPONSE:
${options?.testMode ? `{
  "overallScore": "number (0-100)",
  "titleMatch": "string",
  "hookScore": "number",
  "storyFlow": "string",
  "curiosity": "string",
  "retention": "string",
  "mainProblems": ["string"],
  "topRecommendations": ["string"]
}` : `{
  "metadata": {
    "overallViralScore": "number (0-100)",
    "overallConfidenceScore": "number (0-100)",
    "aiProvider": "${providerName}",
    "generatedTime": "ISO String",
    "analysisVersion": "2.0"
  },
  "hook": {
    "rawScore": "number", "confidenceScore": "number", "riskLevel": "Low|Medium|High", "opportunityScore": "number", "priority": "Critical|High|Medium|Low",
    "whyThisScore": "string", "evidenceUsed": ["string"], "assumptionsInferred": ["string"], "suggestions": ["string"], "expectedImpact": "string",
    "originalHook": "string", "hookType": "string", "hookPsychology": "string", "emotionalTrigger": "string", "curiosityTrigger": "string",
    "coach": { "whyItMatters": "string", "performanceImpact": "string", "whatToChange": "string", "expectedImprovement": "string" }
  },
  "title": {
    "rawScore": "number", "confidenceScore": "number", "riskLevel": "Low|Medium|High", "opportunityScore": "number", "priority": "Critical|High|Medium|Low",
    "whyThisScore": "string", "evidenceUsed": ["string"], "assumptionsInferred": ["string"], "suggestions": ["string"], "expectedImpact": "string",
    "originalTitle": "string", "ctrPotential": "number", "curiosity": "number", "emotionalTrigger": "string", "searchIntent": "string", "seoStrength": "number",
    "coach": { "whyItMatters": "string", "performanceImpact": "string", "whatToChange": "string", "expectedImprovement": "string" }
  },
  "cta": {
    "rawScore": "number", "confidenceScore": "number", "riskLevel": "Low|Medium|High", "opportunityScore": "number", "priority": "Critical|High|Medium|Low",
    "whyThisScore": "string", "evidenceUsed": ["string"], "assumptionsInferred": ["string"], "suggestions": ["string"], "expectedImpact": "string",
    "originalCta": "string", "ctaType": "string", "ctaPsychology": "string", "placementAnalysis": "string", "timingAnalysis": "string",
    "coach": { "whyItMatters": "string", "performanceImpact": "string", "whatToChange": "string", "expectedImprovement": "string" }
  },
  "story": {
    "rawScore": "number", "confidenceScore": "number", "riskLevel": "Low|Medium|High", "opportunityScore": "number", "priority": "Critical|High|Medium|Low",
    "whyThisScore": "string", "evidenceUsed": ["string"], "assumptionsInferred": ["string"], "suggestions": ["string"], "expectedImpact": "string",
    "storytellingStyle": "string", "pacing": "string", "emotionalArc": "string", "characterDevelopment": "string", "conflictResolution": "string",
    "coach": { "whyItMatters": "string", "performanceImpact": "string", "whatToChange": "string", "expectedImprovement": "string" }
  },
  "seo": {
    "rawScore": "number", "confidenceScore": "number", "riskLevel": "Low|Medium|High", "opportunityScore": "number", "priority": "Critical|High|Medium|Low",
    "whyThisScore": "string", "evidenceUsed": ["string"], "assumptionsInferred": ["string"], "suggestions": ["string"], "expectedImpact": "string",
    "primaryKeywords": ["string"], "secondaryKeywords": ["string"], "searchVolume": "number", "competition": "number", "rankingPotential": "number",
    "coach": { "whyItMatters": "string", "performanceImpact": "string", "whatToChange": "string", "expectedImprovement": "string" }
  },
  "thumbnail": {
    "rawScore": "number", "confidenceScore": "number", "riskLevel": "Low|Medium|High", "opportunityScore": "number", "priority": "Critical|High|Medium|Low",
    "whyThisScore": "string", "evidenceUsed": ["string"], "assumptionsInferred": ["string"], "suggestions": ["string"], "expectedImpact": "string",
    "visualAppeal": "number", "textReadability": "number", "contrast": "number", "emotionEvoked": "string", "clickbaitRisk": "number",
    "coach": { "whyItMatters": "string", "performanceImpact": "string", "whatToChange": "string", "expectedImprovement": "string" }
  },
  "retention": {
    "rawScore": "number", "confidenceScore": "number", "riskLevel": "Low|Medium|High", "opportunityScore": "number", "priority": "Critical|High|Medium|Low",
    "whyThisScore": "string", "evidenceUsed": ["string"], "assumptionsInferred": ["string"], "suggestions": ["string"], "expectedImpact": "string",
    "hookRetention": "number", "midPointRetention": "number", "endRetention": "number", "dropOffPoints": ["string"], "engagementTriggers": ["string"],
    "coach": { "whyItMatters": "string", "performanceImpact": "string", "whatToChange": "string", "expectedImprovement": "string" }
  },
  "graphAnalysis": {
    "nodes": [{"id": "string", "type": "string", "label": "string"}],
    "edges": [{"source": "string", "target": "string", "type": "string", "strength": "number"}],
    "insights": ["string"]
  },
  "titleIntentValidation": {
    "viewerExpectation": "string", "searchIntent": "string", "clickIntent": "string", "emotionalPromise": "string", "curiosityPromise": "string",
    "titleToScriptAlignment": "string", "titleMatchScore": "number", "titlePromiseFulfillment": "string",
    "missingExpectations": ["string"], "overpromising": ["string"], "underDelivering": ["string"], "explanation": "string"
  },
  "seniorScriptWriterReview": {
    "hook": "string", "intro": "string", "storytelling": "string", "viewerPsychology": "string", "logic": "string", "flow": "string", "suspense": "string", "cta": "string", "ending": "string", "naturalNarration": "string", "improvementSuggestions": ["string"]
  },
  "paragraphConnectivityAnalysis": {
    "brokenTransitions": ["string"], "abruptJumps": ["string"], "missingBridges": ["string"], "weakTransitions": ["string"], "unansweredQuestions": ["string"], "randomInformation": ["string"], "transitionSuggestions": ["string"]
  },
  "mainStoryValidation": {
    "centralIdea": "string", "offTopicContent": ["string"], "repetition": ["string"], "weakSections": ["string"], "missingInformation": ["string"], "wrongSequence": ["string"], "logicGaps": ["string"]
  },
  "curiosityLoopAnalysis": {
    "openLoops": ["string"], "closedLoops": ["string"], "weakCuriosity": ["string"], "missingCuriosity": ["string"], "brokenCuriosity": ["string"], "recommendations": ["string"]
  },
  "viewerRetentionPrediction": {
    "dropOffPoints": [{"location": "string", "reason": "string"}], "retentionImprovements": ["string"]
  },
  "emotionalCurve": {
    "curiosity": "string", "suspense": "string", "emotion": "string", "shock": "string", "relief": "string", "satisfaction": "string", "energy": "string", "flatSections": ["string"], "suggestions": ["string"]
  },
  "documentaryDirectorReview": {
    "storyProgression": "string", "narrativePacing": "string", "revealTiming": "string", "informationPacing": "string", "visualOpportunities": ["string"], "documentaryQuality": "string"
  },
  "paragraphLevelReview": [
    {
      "paragraphNumber": "number", "purpose": "string", "mainIdea": "string", "connectionWithPrevious": "string", "connectionWithNext": "string",
      "curiosityCreated": "string", "curiosityAnswered": "string", "retentionRisk": "Low|Medium|High", "emotionalImpact": "string", "status": "Keep|Improve|Critical Fix", "improvementSuggestions": ["string"]
    }
  ],
  "contradictionConsistencyEngine": {
    "internalContradictions": ["string"], "timelineInconsistencies": ["string"], "characterInconsistencies": ["string"], "repeatedFacts": ["string"], "missingExplanations": ["string"], "unsupportedClaims": ["string"]
  },
  "finalIntelligenceReport": {
    "executiveSummary": "string", "strengths": ["string"], "weaknesses": ["string"], "criticalIssues": ["string"], "improvementSuggestions": ["string"],
    "titleAlignmentScore": "number", "hookScore": "number", "storyFlowScore": "number", "curiosityScore": "number", "paragraphConnectivityScore": "number", "retentionScore": "number", "emotionalCurveScore": "number", "documentaryQualityScore": "number", "overallScriptScore": "number", "confidenceScore": "number"
  }
}`}
`;

    const response = await provider.generateText(prompt, {
      mode: "text",
      systemPrompt,
      responseFormat: "json_object",
      maxTokens: options?.testMode ? (options.maxTokens || 1200) : (options?.maxTokens || 8192),
      providerOverride: options?.providerOverride
    });

    try {
      let cleanResponse = response.trim();
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/^```json\n/, '').replace(/\n```$/, '');
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/^```\n/, '').replace(/\n```$/, '');
      }

      // Use the aggressive JSON repair utility to salvage truncated outputs from LLMs hitting token limits
      const parsed = repairTruncatedJson(cleanResponse) || JSON.parse(cleanResponse);
      return parsed as ViralIntelligenceReport;
    } catch (e) {
      console.error("Failed to parse Intelligence JSON", e, response);
      throw new Error("Failed to parse Viral Intelligence AI response. The script might be too long for the AI's output limits.");
    }
  }

  public async generateOptimizationVariant(
    moduleType: string,
    originalText: string,
    scriptContext: string,
    specificInstruction: string
  ) {
    const { AIRouter } = require("../ai/router");
    const provider = AIRouter.getInstance();
    
    const systemPrompt = `You are a YouTube Viral Optimization Engine. You generate optimized alternatives for script elements.
Output STRICT JSON matching the schema. No markdown blocks.`;

    const prompt = `
MODULE TYPE: \${moduleType}
ORIGINAL TEXT: \${originalText}
SCRIPT CONTEXT: \${scriptContext}
INSTRUCTION: \${specificInstruction}

Generate an optimized variant.

JSON SCHEMA:
{
  "optimizedText": "string",
  "reasonForChange": "string",
  "expectedImprovement": "string"
}
`;

    const response = await provider.generateText(prompt, {
      mode: "text",
      systemPrompt,
      responseFormat: "json_object"
    });

    try {
      let cleanResponse = response.trim();
      if (cleanResponse.startsWith('\`\`\`json')) {
        cleanResponse = cleanResponse.replace(/^\`\`\`json\n/, '').replace(/\n\`\`\`$/, '');
      } else if (cleanResponse.startsWith('\`\`\`')) {
        cleanResponse = cleanResponse.replace(/^\`\`\`\n/, '').replace(/\n\`\`\`$/, '');
      }

      return JSON.parse(cleanResponse);
    } catch (e) {
      console.error("Failed to parse Optimization JSON", e, response);
      throw new Error("Failed to parse Optimization AI response.");
    }
  }
}
