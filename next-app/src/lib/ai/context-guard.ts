export class ContextLimitError extends Error {
  public estimatedTokens: number;
  public modelLimit: number;
  public safetyThreshold: number;
  public remainingCapacity: number;
  public model: string;

  constructor(
    message: string,
    model: string,
    estimatedTokens: number,
    modelLimit: number,
    safetyThreshold: number,
    remainingCapacity: number
  ) {
    super(message);
    this.name = "ContextLimitError";
    this.model = model;
    this.estimatedTokens = estimatedTokens;
    this.modelLimit = modelLimit;
    this.safetyThreshold = safetyThreshold;
    this.remainingCapacity = remainingCapacity;
  }
}

export class ContextGuard {
  // Known context limits (in tokens)
  private static readonly MODEL_LIMITS: Record<string, number> = {
    // 4k-8k models
    "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free": 4096,
    "meta-llama/llama-3-8b-instruct": 8192,
    "gpt-3.5-turbo": 16384,
    // High context models
    "gpt-4o": 128000,
    "gpt-4o-mini": 128000,
    "claude-3-haiku": 200000,
    "claude-3.5-sonnet": 200000,
    "anthropic/claude-3.5-sonnet": 200000,
    "gemini-1.5-flash": 1000000,
    "gemini-1.5-pro": 2000000,
    "google/gemini-2.5-flash": 1000000,
    "google/gemini-2.5-pro": 2000000,
    "default": 8192, // Safe default if unknown
  };

  private static getLimitForModel(modelName: string): number {
    const lowerName = modelName.toLowerCase();
    
    // Exact match
    if (this.MODEL_LIMITS[lowerName]) return this.MODEL_LIMITS[lowerName];
    if (this.MODEL_LIMITS[modelName]) return this.MODEL_LIMITS[modelName];

    // Substring match
    for (const [key, limit] of Object.entries(this.MODEL_LIMITS)) {
      if (lowerName.includes(key.toLowerCase())) {
        return limit;
      }
    }

    return this.MODEL_LIMITS["default"];
  }

  /**
   * Validates the prompt sizes against the model's maximum context limit.
   * Uses an 85% safety threshold to ensure room for completion tokens.
   */
  public static validateRequest(modelName: string, systemPrompt: string = "", userPrompt: string = "") {
    const limit = this.getLimitForModel(modelName);
    const safetyThreshold = Math.floor(limit * 0.85); // 85% safety threshold
    
    const systemChars = systemPrompt.length;
    const userChars = userPrompt.length;
    const totalChars = systemChars + userChars;

    const systemTokens = Math.ceil(systemChars / 4);
    const userTokens = Math.ceil(userChars / 4);
    const totalTokens = systemTokens + userTokens;

    const remainingCapacity = safetyThreshold - totalTokens;

    if (totalTokens > safetyThreshold) {
      const msg = `Context Guard Rejected Request: Estimated prompt tokens (${totalTokens}) exceeds safety threshold (${safetyThreshold}) for model '${modelName}'. (Total Limit: ${limit})`;
      throw new ContextLimitError(msg, modelName, totalTokens, limit, safetyThreshold, remainingCapacity);
    }

    return {
      systemTokens,
      userTokens,
      totalTokens,
      limit,
      safetyThreshold,
      remainingCapacity,
      modelName
    };
  }
}
