import React, { useEffect, useRef, useCallback } from 'react';
import { createNoise2D } from 'simplex-noise';

const AnimatedWave = ({
  className,
  amplitude = 30,
  smoothness = 300,
  waveColor = '#92C4A7',
  opacity = 1,
  quality = 'medium',
  fov = 60,
  waveOffsetY = -300,
  waveRotation = 29.8,
  cameraDistance = -1000,
  backgroundColor = 'transparent',
  speed = 0.002,
  magnitude,
}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const simplex = useRef(createNoise2D()).current;
  const phaseRef = useRef(0);
  const animationFrameRef = useRef();
  const pointsBufferRef = useRef(null);

  // Use magnitude if provided, otherwise fallback to amplitude
  const effectiveAmplitude = magnitude !== undefined ? magnitude : amplitude;

  const getQualitySettings = useCallback((quality) => {
    switch (quality) {
      case 'low':
        return { width: 60, height: 30 };
      case 'high':
        return { width: 180, height: 75 };
      default:
        return { width: 100, height: 50 };
    }
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Handle high DPI displays
    // Optimization: Cap dpr at 2 to avoid performance issues on very high density screens
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const displayWidth = Math.floor(width * dpr);
    const displayHeight = Math.floor(height * dpr);

    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
      canvas.width = displayWidth;
      canvas.height = displayHeight;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    }

    // Always reset scale because canvas resize resets context
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = waveColor;
    ctx.globalAlpha = opacity;
    ctx.lineWidth = 1;

    const { width: segW, height: segH } = getQualitySettings(quality);
    const planeWidth = 4000;
    const planeHeight = 2000;

    // Optimization: Pre-calculate constants outside the loop
    const rad = (waveRotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const fovRad = (fov * Math.PI) / 180;
    const focalLength = height / 2 / Math.tan(fovRad / 2);
    const halfWidth = width / 2;
    const halfHeight = height / 2;

    // Optimization: Use Float32Array for points to reduce GC pressure
    // Storing x, y for each point. Size: (segW + 1) * (segH + 1) * 2
    const numPointsX = segW + 1;
    const numPointsY = segH + 1;
    const requiredSize = numPointsX * numPointsY * 2;

    if (!pointsBufferRef.current || pointsBufferRef.current.length !== requiredSize) {
      pointsBufferRef.current = new Float32Array(requiredSize);
    }
    const projectedPoints = pointsBufferRef.current;
    // Initialize with NaN to indicate invalid/behind camera points
    projectedPoints.fill(NaN);

    const phase = phaseRef.current;

    // Generate and Project Points
    for (let y = 0; y < numPointsY; y++) {
      const v = y / segH;
      const py = (v - 0.5) * planeHeight;
      const noiseY = py / smoothness - phase;

      // Optimization: Calculate row-constant parts of rotation if possible
      // But z depends on x, so we can't fully pre-calc rotation

      for (let x = 0; x < numPointsX; x++) {
        const u = x / segW;
        const px = (u - 0.5) * planeWidth;

        const noiseX = px / smoothness;
        const pz = simplex(noiseX, noiseY) * effectiveAmplitude;

        // 3D Transformation & Projection inline
        // 1. Rotation (around X axis)
        const yRot = py * cos - pz * sin;
        const zRot = py * sin + pz * cos;

        // 2. Translation
        const xTrans = px;
        const yTrans = yRot + waveOffsetY;
        const zTrans = zRot + cameraDistance;

        // 3. Projection
        if (zTrans < 0) {
          // Only draw points in front of camera
          const scale = focalLength / Math.abs(zTrans);
          const xProj = xTrans * scale + halfWidth;
          const yProj = -yTrans * scale + halfHeight;

          const index = (y * numPointsX + x) * 2;
          projectedPoints[index] = xProj;
          projectedPoints[index + 1] = yProj;
        }
      }
    }

    // Draw Horizontal Lines
    ctx.beginPath();
    for (let y = 0; y < numPointsY; y++) {
      let first = true;
      for (let x = 0; x < numPointsX; x++) {
        const index = (y * numPointsX + x) * 2;
        const px = projectedPoints[index];
        const py = projectedPoints[index + 1];

        if (!isNaN(px)) {
          if (first) {
            ctx.moveTo(px, py);
            first = false;
          } else {
            ctx.lineTo(px, py);
          }
        } else {
          first = true;
        }
      }
    }
    ctx.stroke();

    // Draw Vertical Lines
    ctx.beginPath();
    for (let x = 0; x < numPointsX; x++) {
      let first = true;
      for (let y = 0; y < numPointsY; y++) {
        const index = (y * numPointsX + x) * 2;
        const px = projectedPoints[index];
        const py = projectedPoints[index + 1];

        if (!isNaN(px)) {
          if (first) {
            ctx.moveTo(px, py);
            first = false;
          } else {
            ctx.lineTo(px, py);
          }
        } else {
          first = true;
        }
      }
    }
    ctx.stroke();

    // Update phase for next frame
    phaseRef.current += speed;
  }, [
    quality,
    fov,
    waveColor,
    opacity,
    effectiveAmplitude,
    smoothness,
    waveOffsetY,
    waveRotation,
    cameraDistance,
    getQualitySettings,
    speed,
    simplex,
  ]);

  useEffect(() => {
    const loop = () => {
      draw();
      animationFrameRef.current = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [draw]);
  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        pointerEvents: 'none',
        backgroundColor: backgroundColor,
      }}
    >
      <canvas ref={canvasRef} />
    </div>
  );
};

export default AnimatedWave;
