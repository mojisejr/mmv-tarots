// Development Learning Journal - Embeddings Generator
// 🟢 GREEN Phase: Minimal implementation to make tests pass

export async function generateEmbedding(text: string): Promise<number[]> {
  // Minimal implementation: generate simple hash-based embedding
  const embedding: number[] = []
  for (let i = 0; i < 384; i++) {
    const char = text.charCodeAt(i % text.length) || 0
    embedding.push((char / 255) * Math.sin(i))
  }
  return embedding
}