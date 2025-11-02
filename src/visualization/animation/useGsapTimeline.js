/**
 * Hook to manage GSAP timeline lifecycle
 */
import { useEffect, useRef } from 'react';
import { buildTimeline, setInitialStates } from './timeline';

/**
 * Hook to create and manage a GSAP timeline
 * @param {Object} deps - Dependencies: svgRef, subStep, currentStep, animDuration, onComplete
 * @returns {Object} Timeline ref
 */
export function useGsapTimeline({
  svgRef,
  subStep,
  currentStep,
  animDuration = 0.6,
  onComplete,
  numLayers = 1,
}) {
  const timelineRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current || currentStep === 0) return;

    // Kill existing timeline
    if (timelineRef.current) {
      timelineRef.current.kill();
      timelineRef.current = null;
    }

    const isInitialStep = currentStep === 1;

    // Set initial states
    setInitialStates(svgRef.current, subStep, isInitialStep, numLayers);

    // Build and play timeline
    timelineRef.current = buildTimeline(
      svgRef.current,
      subStep,
      isInitialStep,
      animDuration,
      onComplete,
      numLayers
    );

    // Cleanup on unmount
    return () => {
      if (timelineRef.current) {
        timelineRef.current.kill();
        timelineRef.current = null;
      }
    };
  }, [svgRef, subStep, currentStep, animDuration, onComplete, numLayers]);

  return timelineRef;
}
