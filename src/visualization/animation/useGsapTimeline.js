/**
 * Hook to manage GSAP timeline lifecycle
 * Now view-agnostic - accepts timeline builder functions as parameters
 */
import { useEffect, useRef } from 'react';

/**
 * Hook to create and manage a GSAP timeline
 * @param {Object} deps - Dependencies
 * @param {React.RefObject} deps.svgRef - Reference to SVG element
 * @param {number} deps.subStep - Current animation sub-step
 * @param {number} deps.currentStep - Current step number
 * @param {number} deps.animDuration - Animation duration
 * @param {Function} deps.onComplete - Callback when animation completes
 * @param {number} deps.numLayers - Number of transformer layers
 * @param {Function} deps.setInitialStatesFn - Function to set initial states (view-specific)
 * @param {Function} deps.buildTimelineFn - Function to build timeline (view-specific)
 * @returns {Object} Timeline ref
 */
export function useGsapTimeline({
  svgRef,
  subStep,
  currentStep,
  animDuration = 0.6,
  onComplete,
  numLayers = 1,
  setInitialStatesFn,
  buildTimelineFn,
}) {
  const timelineRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current || currentStep === 0 || !setInitialStatesFn || !buildTimelineFn) return;

    // Kill existing timeline
    if (timelineRef.current) {
      timelineRef.current.kill();
      timelineRef.current = null;
    }

    const isInitialStep = currentStep === 1;

    // Set initial states using view-specific function
    setInitialStatesFn(svgRef.current, subStep, isInitialStep, numLayers);

    // Build and play timeline using view-specific function
    timelineRef.current = buildTimelineFn(
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
  }, [
    svgRef,
    subStep,
    currentStep,
    animDuration,
    onComplete,
    numLayers,
    setInitialStatesFn,
    buildTimelineFn,
  ]);

  return timelineRef;
}
