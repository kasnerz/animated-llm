import { seededVector } from '../../utils/random';

// Compute all embeddings for a given step without relying on JSON
// - outer: seeded only by token string (stable across sessions)
// - insideTop, insideBottom, ffn, outsideBottom: deterministic per step+variant+token to avoid flicker
export function computeEmbeddingsForStep(step, vectorLength = 3) {
  const tokens = step?.tokens || [];
  const stepId = typeof step?.step === 'number' ? step.step : 0;

  const outer = tokens.map((tok) => seededVector(`outer|${tok}`, vectorLength));

  const mk = (variant, tok) => {
    const key = `${variant}|${stepId}|${tok}`;
    return seededVector(key, vectorLength);
  };

  const insideTop = tokens.map((tok) => mk('top', tok));
  const insideBottom = tokens.map((tok) => mk('bottom', tok));
  const ffn = tokens.map((tok) => mk('ffn', tok));
  const outsideBottom = tokens.map((tok) => mk('out', tok));

  return { outer, insideTop, insideBottom, ffn, outsideBottom };
}
