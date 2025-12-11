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

  // Use magnitude if provided, otherwise fallback to amplitude
  const effectiveAmplitude = magnitude !== undefined ? magnitude : amplitude;

  const getQualitySettings = useCallback((quality) => {
    switch (quality) {
      case 'low':
        return { width: 60, height: 30 };
      case 'high':
        return { width: 150, height: 75 };
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
    const dpr = window.devicePixelRatio || 1;
    // Only resize if dimensions changed to avoid clearing canvas unnecessarily if we were not clearing it manually
    // But we clear it manually anyway.
    // However, setting width/height clears the canvas context state (like scale), so we must be careful.
    // To optimize, we check if resize is needed.
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

    // 3D Projection Helper
    // Simple perspective projection
    // Camera is at (0,0,0) looking down -Z
    const project = (x, y, z) => {
      // 1. Apply Rotation (around X axis)
      const rad = (waveRotation * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);

      const yRot = y * cos - z * sin;
      const zRot = y * sin + z * cos;

      // 2. Apply Translation
      const xTrans = x;
      const yTrans = yRot + waveOffsetY;
      const zTrans = zRot + cameraDistance;

      // 3. Perspective Projection
      // fov to focal length: f = (height/2) / tan(fov/2)
      // But we can just use a constant scale factor for simplicity or derive it
      const fovRad = (fov * Math.PI) / 180;
      const focalLength = height / 2 / Math.tan(fovRad / 2);

      if (zTrans >= 0) return null; // Behind camera

      const scale = focalLength / Math.abs(zTrans);
      const xProj = xTrans * scale + width / 2;
      const yProj = -yTrans * scale + height / 2; // Invert Y for screen coords

      return { x: xProj, y: yProj };
    };

    // Generate Grid Points
    const points = [];
    const phase = phaseRef.current;

    for (let y = 0; y <= segH; y++) {
      const row = [];
      for (let x = 0; x <= segW; x++) {
        const u = x / segW;
        const v = y / segH;

        const px = (u - 0.5) * planeWidth;
        const py = (v - 0.5) * planeHeight;

        // Apply noise to Z with phase for animation
        // Moving along Y axis (v) creates a "flowing" effect
        const noiseX = px / smoothness;
        const noiseY = py / smoothness - phase;
        const pz = simplex(noiseX, noiseY) * effectiveAmplitude;

        row.push({ x: px, y: py, z: pz });
      }
      points.push(row);
    }

    // Draw Horizontal Lines
    ctx.beginPath();
    for (let y = 0; y <= segH; y++) {
      let first = true;
      for (let x = 0; x <= segW; x++) {
        const p = points[y][x];
        const proj = project(p.x, p.y, p.z);
        if (proj) {
          if (first) {
            ctx.moveTo(proj.x, proj.y);
            first = false;
          } else {
            ctx.lineTo(proj.x, proj.y);
          }
        } else {
          first = true;
        }
      }
    }
    ctx.stroke();

    // Draw Vertical Lines
    ctx.beginPath();
    for (let x = 0; x <= segW; x++) {
      let first = true;
      for (let y = 0; y <= segH; y++) {
        const p = points[y][x];
        const proj = project(p.x, p.y, p.z);
        if (proj) {
          if (first) {
            ctx.moveTo(proj.x, proj.y);
            first = false;
          } else {
            ctx.lineTo(proj.x, proj.y);
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
