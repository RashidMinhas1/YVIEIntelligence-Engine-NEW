'use server';

import { pipeline, env } from '@xenova/transformers';

// Setup environment for node
env.allowLocalModels = true;
// Define the pipeline variable
let extractor: any = null;

/**
 * Initializes and caches the embedding model
 */
const getExtractor = async () => {
  if (!extractor) {
    // all-MiniLM-L6-v2 is a great balance of size and quality
    extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  return extractor;
};

/**
 * Server Action to generate embeddings for an array of texts.
 * Returns an array of vector arrays (number[][]).
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  try {
    const embedder = await getExtractor();
    const results: number[][] = [];
    
    for (const text of texts) {
      // Create embedding
      const output = await embedder(text, { pooling: 'mean', normalize: true });
      // output.data is a Float32Array, convert to standard number array
      results.push(Array.from(output.data));
    }
    
    return results;
  } catch (error) {
    console.error("Failed to generate embeddings:", error);
    // Return empty arrays as fallback
    return texts.map(() => []);
  }
}
