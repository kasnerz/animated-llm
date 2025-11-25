import React from 'react';

// NOTE: This component is a placeholder wrapper should we later move SVG/GSAP logic out of GenerationSimpleView.
// For now the rendering lives directly in GenerationSimpleView; this file provides a future hook point.
export default function DecodingCanvas({ children }) {
  return <div className="decoding-canvas-wrapper">{children}</div>;
}
