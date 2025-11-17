/**
 * Animation Timelines and Hooks
 *
 * This module exports view-specific timelines and the generic timeline hook.
 *
 * Each view should have its own timeline file with setInitialStates() and buildTimeline() functions.
 */

// Generic timeline hook (view-agnostic)
export { useGsapTimeline } from './useGsapTimeline';

// View-specific timelines
export * as textGenerationTimeline from './textGenerationTimeline';
export * as trainingTimeline from './trainingTimeline';
export * as decodingTimeline from './decodingTimeline';
