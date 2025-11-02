// Application configuration
export const config = {
  app: {
    title: 'Interactive Transformer Visualization',
    version: '1.0.0',
  },
  defaults: {
    theme: 'light',
    language: 'en',
    animationSpeed: 7.5, // seconds (2x faster)
    prompt: 'Which ingredients do I need to make scrambled eggs?',
  },
  animation: {
    minSpeed: 5,
    maxSpeed: 30,
    phases: {
      tokenization: 0.15,
      tokenIds: 0.1,
      embeddings: 0.15,
      transformer: 0.4,
      output: 0.2,
    },
  },
  visualization: {
    embeddingDisplaySize: 4, // First 2 + last 2 dimensions
    topKTokens: 10,
  },
  model: {
    name: 'meta-llama/Llama-3-8B',
    numLayers: 32,
    hiddenSize: 4096,
    numAttentionHeads: 32,
    vocabSize: 128256,
  },
};

export default config;
