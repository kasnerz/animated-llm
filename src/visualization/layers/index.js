/**
 * Reusable Visualization Renderers
 *
 * This module exports all view-agnostic rendering functions that can be
 * composed in different ways for different views.
 *
 * Usage:
 *   import { renderTokensLayer, renderTransformerBlockLayer } from '../visualization/layers';
 */

export { renderTokensLayer } from './tokenRenderer';
export { renderOuterEmbeddingsLayer } from './embeddingRenderer';
export { renderTransformerBlockLayer } from './transformerRenderer';
export { renderOutputLayer } from './outputRenderer';
export { renderStageLabels } from './stageLabelRenderer';

// Re-export helpers for convenience
export * from './helpers/vectorHelpers';
export * from './helpers/arrowHelpers';
