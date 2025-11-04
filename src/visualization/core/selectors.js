/**
 * CSS class names and selectors used by GSAP animations
 * Centralizes all class names to avoid typos and enable easy refactoring
 */

// Token layer selectors
export const TOKEN_SELECTORS = {
  token: '.token',
  tokenNew: '.token.new-token',
  tokenPrev: '.token.prev-token',
  tokenId: '.token-id',
  tokenIdNew: '.token-id.new-token',
  tokenIdPrev: '.token-id.prev-token',
  tokenIdArrow: '.token-id-arrow',
  tokenIdArrowNew: '.token-id-arrow.new-token',
  tokenIdArrowPrev: '.token-id-arrow.prev-token',
};

// Embedding layer selectors
export const EMBEDDING_SELECTORS = {
  embeddingGroup: '.embedding-group',
  embeddingGroupAll: '.embedding-group, .embedding-group *',
  embeddingCol: '.embedding-group .embedding-col',
  embeddingColNew: '.embedding-group .embedding-col.new-token',
  embeddingColPrev: '.embedding-group .embedding-col.prev-token',
  idToEmbArrow: '.id-to-emb-arrow',
  idToEmbArrowNew: '.id-to-emb-arrow.new-token',
  idToEmbArrowPrev: '.id-to-emb-arrow.prev-token',
};

// Transformer block selectors
export const TRANSFORMER_SELECTORS = {
  transformerGroup: '.transformer-group',
  transformerBox: '.transformer-group .transformer-box',
  transformerShadowBox: '.transformer-shadow-box',
  transformerStackLabel: '.transformer-stack-label',
  shadowToBlockArrow: '.shadow-to-block-arrow',
  shadowToBlockArrowNew: '.shadow-to-block-arrow.new-token',
  shadowToBlockArrowPrev: '.shadow-to-block-arrow.prev-token',
  insideTopEmbeddings: '.transformer-group .inside-top-embeddings',
  insideTopEmbeddingsAll:
    '.transformer-group .inside-top-embeddings, .transformer-group .inside-top-embeddings *',
  insideTopEmbeddingCol: '.transformer-group .inside-top-embeddings .embedding-col',
  insideTopEmbeddingColNew: '.transformer-group .inside-top-embeddings .embedding-col.new-token',
  insideTopEmbeddingColPrev: '.transformer-group .inside-top-embeddings .embedding-col.prev-token',
  outerToBlockArrow: '.outer-to-block-arrow',
  outerToBlockArrowNew: '.outer-to-block-arrow.new-token',
  outerToBlockArrowPrev: '.outer-to-block-arrow.prev-token',
  attentionMash: '.transformer-group .attention-mash',
  attentionMashAll: '.transformer-group .attention-mash, .transformer-group .attention-mash *',
  insideBottomEmbeddings: '.transformer-group .inside-bottom-embeddings',
  insideBottomEmbeddingsAll:
    '.transformer-group .inside-bottom-embeddings, .transformer-group .inside-bottom-embeddings *',
  insideBottomEmbeddingCol: '.transformer-group .inside-bottom-embeddings .embedding-col',
  insideBottomEmbeddingColNew:
    '.transformer-group .inside-bottom-embeddings .embedding-col.new-token',
  insideBottomEmbeddingColPrev:
    '.transformer-group .inside-bottom-embeddings .embedding-col.prev-token',
  insideFfnEmbeddings: '.transformer-group .inside-ffn-embeddings',
  insideFfnEmbeddingsAll:
    '.transformer-group .inside-ffn-embeddings, .transformer-group .inside-ffn-embeddings *',
  insideFfnEmbeddingCol: '.transformer-group .inside-ffn-embeddings .embedding-col',
  insideFfnEmbeddingColNew: '.transformer-group .inside-ffn-embeddings .embedding-col.new-token',
  insideFfnEmbeddingColPrev: '.transformer-group .inside-ffn-embeddings .embedding-col.prev-token',
  ffnArrow: '.ffn-arrow',
  ffnArrowNew: '.ffn-arrow.new-token',
  ffnArrowPrev: '.ffn-arrow.prev-token',
};

// Bottom embeddings selectors
export const BOTTOM_EMBEDDING_SELECTORS = {
  bottomEmbeddingGroup: '.bottom-embedding-group',
  bottomEmbeddingGroupAll: '.bottom-embedding-group, .bottom-embedding-group *',
  bottomEmbeddingCol: '.bottom-embedding-group .embedding-col',
  bottomEmbeddingColNew: '.bottom-embedding-group .embedding-col.new-token',
  bottomEmbeddingColPrev: '.bottom-embedding-group .embedding-col.prev-token',
  blockToOutsideArrow: '.block-to-outside-arrow',
  blockToOutsideArrowNew: '.block-to-outside-arrow.new-token',
  blockToOutsideArrowPrev: '.block-to-outside-arrow.prev-token',
};

// Output distribution selectors
export const OUTPUT_SELECTORS = {
  extractedEmbedding: '.extracted-embedding',
  extractedPathArrow: '.extracted-path-arrow',
  extractedHorizontal: '.extracted-horizontal',
  logprobArrow: '.logprob-arrow',
  logprobVector: '.logprob-vector',
  distributionBar: '.distribution-bar',
  distributionTokenLabel: '.distribution-token-label',
  distributionPercentageLabel: '.distribution-percentage-label',
  distributionLabels: '.distribution-token-label, .distribution-percentage-label',
};

// All selectors combined for convenience
export const ALL_SELECTORS = {
  ...TOKEN_SELECTORS,
  ...EMBEDDING_SELECTORS,
  ...TRANSFORMER_SELECTORS,
  ...BOTTOM_EMBEDDING_SELECTORS,
  ...OUTPUT_SELECTORS,
};
