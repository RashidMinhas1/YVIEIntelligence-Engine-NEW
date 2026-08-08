import { pipeline, env } from '@xenova/transformers';

// Skip local model check since we're using the CDN
env.allowLocalModels = false;

// We use a singleton pattern for the pipeline to avoid re-initializing
class SemanticPipeline {
  static task = 'feature-extraction';
  static model = 'Xenova/all-MiniLM-L6-v2';
  static instance: any = null;

  static async getInstance(progress_callback?: any) {
    if (this.instance === null) {
      this.instance = await pipeline(this.task as any, this.model, { progress_callback });
    }
    return this.instance;
  }
}

function dotProduct(a: number[], b: number[]) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += a[i] * b[i];
  }
  return sum;
}

export async function calculateSemanticSimilarity(text1: string, text2: string): Promise<number> {
  if (!text1 || !text2) return 0;
  
  try {
    const extractor = await SemanticPipeline.getInstance();
    
    // Generate embeddings
    const output1 = await extractor(text1, { pooling: 'mean', normalize: true });
    const output2 = await extractor(text2, { pooling: 'mean', normalize: true });
    
    // Calculate cosine similarity (dot product of normalized vectors)
    const similarity = dotProduct(Array.from(output1.data), Array.from(output2.data));
    
    return Math.max(0, Math.min(100, similarity * 100));
  } catch (e) {
    console.error("Semantic similarity error:", e);
    // Fallback heuristic if models fail to load
    return fallbackStringMatch(text1, text2);
  }
}

export async function rankCandidatesSemantically(query: string, candidates: string[]): Promise<number[]> {
  if (!query || candidates.length === 0) return [];
  
  try {
    const extractor = await SemanticPipeline.getInstance();
    const queryEmb = await extractor(query, { pooling: 'mean', normalize: true });
    
    const scores = [];
    for (const candidate of candidates) {
      const candEmb = await extractor(candidate, { pooling: 'mean', normalize: true });
      const sim = dotProduct(Array.from(queryEmb.data), Array.from(candEmb.data));
      scores.push(Math.max(0, Math.min(100, sim * 100)));
    }
    return scores;
  } catch (e) {
    console.error("Rank candidates error:", e);
    return candidates.map(c => fallbackStringMatch(query, c));
  }
}

function fallbackStringMatch(a: string, b: string): number {
  const setA = new Set(a.toLowerCase().split(/\s+/));
  const setB = new Set(b.toLowerCase().split(/\s+/));
  let intersection = 0;
  for (const w of setA) {
    if (setB.has(w)) intersection++;
  }
  // Use setA.size (the query size) to prevent long candidate descriptions from diluting the score
  return Math.round((intersection / Math.max(1, setA.size)) * 100) || 0;
}
