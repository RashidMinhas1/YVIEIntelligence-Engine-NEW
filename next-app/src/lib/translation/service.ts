// ─────────────────────────────────────────────────────────────────────────────
// Translation Service
// API Route → Service → AI Router → AI Provider
// ─────────────────────────────────────────────────────────────────────────────

import crypto from "crypto";
import { getAIProvider } from "@/lib/ai/factory";
import { translationRepo } from "@/lib/repository";
import {
  TranslationRequest,
  TranslationResponse,
  BatchTranslationRequest,
  BatchTranslationResponse,
  LanguageDetectionResult,
  TranslationQualityReport,
  GlossaryEntry,
  GlossaryFilters,
  TranslationHistoryFilters,
  TranslationHistory,
} from "./translation";
import {
  getTranslationSystemPrompt,
  buildTranslationPrompt,
  buildQualityValidationPrompt,
  buildLanguageDetectionPrompt,
  QUALITY_VALIDATION_SYSTEM_PROMPT,
  LANGUAGE_DETECTION_SYSTEM_PROMPT,
} from "./prompts";
import { getLanguageByCode } from "./languages";

// ─────────────────────────────────────────────────────────────────────────────
// Input validation limits
// ─────────────────────────────────────────────────────────────────────────────

const MAX_CONTENT_LENGTH = 50_000; // characters
const MAX_BATCH_ITEMS = 20;
const BATCH_CONCURRENCY_LIMIT = 4;

// ─────────────────────────────────────────────────────────────────────────────
// Cache key builder
// ─────────────────────────────────────────────────────────────────────────────

function buildCacheKey(
  content: string,
  sourceLanguage: string,
  targetLanguage: string,
  mode: string,
  glossaryHash: string
): string {
  return crypto
    .createHash("sha256")
    .update(content)
    .update(sourceLanguage)
    .update(targetLanguage)
    .update(mode)
    .update(glossaryHash)
    .digest("hex");
}

function buildGlossaryHash(entries: GlossaryEntry[]): string {
  if (entries.length === 0) return "no-glossary";
  const sorted = [...entries]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((e) => `${e.sourceTerm}:${e.targetTerm}`)
    .join("|");
  return crypto.createHash("sha256").update(sorted).digest("hex");
}

// ─────────────────────────────────────────────────────────────────────────────
// Quality validation
// ─────────────────────────────────────────────────────────────────────────────

async function validateQuality(
  original: string,
  translated: string,
  sourceLanguage: string,
  targetLanguage: string
): Promise<TranslationQualityReport> {
  try {
    const provider = getAIProvider();
    const prompt = buildQualityValidationPrompt(
      original,
      translated,
      sourceLanguage,
      targetLanguage
    );

    const rawResponse = await provider.generateText(prompt, {
      systemPrompt: QUALITY_VALIDATION_SYSTEM_PROMPT,
      responseFormat: "json_object",
      featureKey: "translation",
    });

    const parsed = JSON.parse(rawResponse) as {
      semanticAccuracy: number;
      tonePreservation: number;
      formattingPreservation: number;
      localizationQuality: number;
    };

    const scores = {
      semanticAccuracy: clamp(parsed.semanticAccuracy, 0, 100),
      tonePreservation: clamp(parsed.tonePreservation, 0, 100),
      formattingPreservation: clamp(parsed.formattingPreservation, 0, 100),
      localizationQuality: clamp(parsed.localizationQuality, 0, 100),
    };

    const overallScore = Math.round(
      scores.semanticAccuracy * 0.4 +
      scores.tonePreservation * 0.3 +
      scores.formattingPreservation * 0.2 +
      scores.localizationQuality * 0.1
    );

    return { ...scores, overallScore };
  } catch {
    // Return a neutral score if validation fails — do not block translation
    return {
      semanticAccuracy: 0,
      tonePreservation: 0,
      formattingPreservation: 0,
      localizationQuality: 0,
      overallScore: 0,
    };
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

// ─────────────────────────────────────────────────────────────────────────────
// Core translation logic (shared by translate() and batchTranslate())
// ─────────────────────────────────────────────────────────────────────────────

async function executeTranslation(
  request: TranslationRequest,
  userId: string
): Promise<TranslationResponse> {
  const startTime = Date.now();

  // 1. Validate input
  if (!request.content || request.content.trim().length === 0) {
    throw new Error("Content is required for translation");
  }
  if (request.content.length > MAX_CONTENT_LENGTH) {
    throw new Error(`Content exceeds maximum length of ${MAX_CONTENT_LENGTH} characters`);
  }
  if (!request.targetLanguage) {
    throw new Error("Target language is required");
  }

  // 2. Resolve source language
  const resolvedSourceLanguage =
    request.sourceLanguage === "auto" || !request.sourceLanguage
      ? "auto"
      : request.sourceLanguage;

  // 3. Load glossary entries
  const glossaryEntries: GlossaryEntry[] =
    request.glossaryId
      ? await translationRepo.getGlossary({
          sourceLanguage: resolvedSourceLanguage !== "auto" ? resolvedSourceLanguage : undefined,
          targetLanguage: request.targetLanguage,
        })
      : [];

  // Filter to matching entries for this language pair
  const relevantGlossary = glossaryEntries.filter(
    (e) =>
      e.targetLanguage === request.targetLanguage &&
      (resolvedSourceLanguage === "auto" || e.sourceLanguage === resolvedSourceLanguage)
  );

  // 4. Build cache key
  const glossaryHash = buildGlossaryHash(relevantGlossary);
  const cacheKey = buildCacheKey(
    request.content,
    resolvedSourceLanguage,
    request.targetLanguage,
    request.mode,
    glossaryHash
  );

  // Removed manual caching because AIRouter handles deduplication.
  const systemPrompt = getTranslationSystemPrompt(request.mode);

  // 6. Build translation prompt
  const userPrompt = buildTranslationPrompt(
    request.content,
    resolvedSourceLanguage,
    request.targetLanguage,
    request.contentType,
    relevantGlossary,
    request.preserveBrandNames ?? true,
    request.preserveFormatting ?? true,
    request.preserveUrls ?? true,
    request.preserveNumbers ?? true
  );

  // 7. Call AI Provider via the AI factory (no direct provider code here)
  const provider = getAIProvider();
  const translatedContent = await provider.generateText(userPrompt, {
    systemPrompt,
    featureKey: "translation",
    responseFormat: "text",
  });

  // 9. Run quality validation
  const qualityReport = await validateQuality(
    request.content,
    translatedContent,
    resolvedSourceLanguage,
    request.targetLanguage
  );

  // 10. Build final result
  const result: TranslationResponse = {
    id: crypto.randomUUID(),
    sourceContent: request.content,
    translatedContent,
    sourceLanguage: resolvedSourceLanguage,
    targetLanguage: request.targetLanguage,
    mode: request.mode,
    contentType: request.contentType,
    qualityReport,
    glossaryApplied: request.glossaryId,
    inputLength: request.content.length,
    outputLength: translatedContent.length,
    processingTimeMs: Date.now() - startTime,
    fromCache: false,
    createdAt: new Date().toISOString(),
  };

  // 11. Persist to repository
  await saveHistory(result, userId);

  return result;
}

async function saveHistory(result: TranslationResponse, userId: string): Promise<void> {
  const historyEntry: TranslationHistory = {
    id: result.id,
    userId,
    sourceLanguage: result.sourceLanguage,
    targetLanguage: result.targetLanguage,
    mode: result.mode,
    contentType: result.contentType,
    inputLength: result.inputLength,
    outputLength: result.outputLength,
    qualityScore: result.qualityReport.overallScore,
    fromCache: result.fromCache,
    glossaryId: result.glossaryApplied,
    createdAt: result.createdAt,
  };
  await translationRepo.saveHistory(historyEntry);
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

export class TranslationService {
  /**
   * Translate a single piece of content.
   */
  async translate(request: TranslationRequest, userId: string): Promise<TranslationResponse> {
    return executeTranslation(request, userId);
  }

  /**
   * Translate multiple items in a batch with concurrency control.
   */
  async translateBatch(
    request: BatchTranslationRequest,
    userId: string
  ): Promise<BatchTranslationResponse> {
    if (request.items.length === 0) {
      throw new Error("Batch translation requires at least one item");
    }
    if (request.items.length > MAX_BATCH_ITEMS) {
      throw new Error(`Batch size cannot exceed ${MAX_BATCH_ITEMS} items`);
    }

    const startTime = Date.now();
    const results: Record<string, TranslationResponse> = {};
    const errors: Record<string, string> = {};
    let successCount = 0;
    let failureCount = 0;

    // Process in parallel with concurrency limit
    for (let i = 0; i < request.items.length; i += BATCH_CONCURRENCY_LIMIT) {
      const chunk = request.items.slice(i, i + BATCH_CONCURRENCY_LIMIT);
      const chunkResults = await Promise.allSettled(
        chunk.map((item) =>
          executeTranslation(
            {
              content: item.content,
              contentType: item.contentType,
              sourceLanguage: request.sourceLanguage,
              targetLanguage: request.targetLanguage,
              mode: request.mode,
              glossaryId: request.glossaryId,
              preserveBrandNames: request.preserveBrandNames,
              preserveFormatting: request.preserveFormatting,
              preserveUrls: request.preserveUrls,
              preserveNumbers: request.preserveNumbers,
            },
            userId
          ).then((result) => ({ id: item.id, result }))
        )
      );

      for (const outcome of chunkResults) {
        if (outcome.status === "fulfilled") {
          results[outcome.value.id] = outcome.value.result;
          successCount++;
        } else {
          const failedItem = chunk[chunkResults.indexOf(outcome)];
          errors[failedItem.id] = outcome.reason?.message ?? "Translation failed";
          failureCount++;
        }
      }
    }

    return {
      results,
      totalItems: request.items.length,
      successCount,
      failureCount,
      errors,
      totalProcessingTimeMs: Date.now() - startTime,
    };
  }

  /**
   * Detect the language of a text sample.
   */
  async detectLanguage(text: string): Promise<LanguageDetectionResult> {
    if (!text || text.trim().length === 0) {
      throw new Error("Text is required for language detection");
    }

    const provider = getAIProvider();
    const rawResponse = await provider.generateText(
      buildLanguageDetectionPrompt(text),
      {
        systemPrompt: LANGUAGE_DETECTION_SYSTEM_PROMPT,
        responseFormat: "json_object",
        featureKey: "translation",
      }
    );

    const parsed = JSON.parse(rawResponse) as {
      languageCode: string;
      languageName: string;
      confidence: number;
    };

    const lang = getLanguageByCode(parsed.languageCode);

    return {
      detectedLanguage: parsed.languageCode,
      languageName: parsed.languageName,
      confidence: clamp(parsed.confidence, 0, 100),
      direction: lang?.direction ?? "ltr",
    };
  }

  /**
   * Get translation history.
   */
  async getHistory(filters: TranslationHistoryFilters): Promise<TranslationHistory[]> {
    return translationRepo.getHistory(filters);
  }

  /**
   * Delete a translation history entry.
   */
  async deleteHistory(id: string): Promise<void> {
    return translationRepo.deleteHistory(id);
  }

  /**
   * Get glossary entries.
   */
  async getGlossary(filters: GlossaryFilters): Promise<GlossaryEntry[]> {
    return translationRepo.getGlossary(filters);
  }

  /**
   * Save or update a glossary entry.
   */
  async saveGlossaryEntry(entry: Omit<GlossaryEntry, "id" | "createdAt" | "updatedAt">): Promise<GlossaryEntry> {
    const fullEntry: GlossaryEntry = {
      ...entry,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await translationRepo.saveGlossaryEntry(fullEntry);
    return fullEntry;
  }

  /**
   * Update an existing glossary entry.
   */
  async updateGlossaryEntry(
    id: string,
    updates: Partial<Omit<GlossaryEntry, "id" | "createdAt">>
  ): Promise<GlossaryEntry> {
    return translationRepo.updateGlossaryEntry(id, updates);
  }

  /**
   * Delete a glossary entry.
   */
  async deleteGlossaryEntry(id: string): Promise<void> {
    return translationRepo.deleteGlossaryEntry(id);
  }
}

// Singleton instance
export const translationService = new TranslationService();
