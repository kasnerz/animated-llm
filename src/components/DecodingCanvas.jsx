import React from 'react';

// NOTE: This component is a placeholder wrapper should we later move SVG/GSAP logic out of DecodingView.
// For now the rendering lives directly in DecodingView; this file provides a future hook point.
export default function DecodingCanvas({ children }) {
  return <div className="decoding-canvas-wrapper">{children}</div>;
}
