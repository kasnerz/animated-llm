/**
 * Icon data for the model hint popover.
 *
 * Icons are from the Lucide set on Iconify (ISC licensed), inlined rather than
 * fetched at runtime: the app makes no external requests, so the icon data has
 * to ship with it. Each entry is Iconify's own icon-data shape, which
 * `<Icon icon={...} />` from @iconify/react renders directly.
 *
 * To refresh or add an icon:
 *   curl "https://api.iconify.design/lucide.json?icons=box,list-checks,brain,link"
 */

// lucide:box
export const BASE_MODEL_ICON = {
  body: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7l8.7 5l8.7-5M12 22V12"/></g>',
  width: 24,
  height: 24,
};

// lucide:list-checks
export const INSTRUCTION_TUNED_ICON = {
  body: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5h8m-8 7h8m-8 7h8M3 17l2 2l4-4M3 7l2 2l4-4"/>',
  width: 24,
  height: 24,
};

// lucide:brain
export const REASONING_ICON = {
  body: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M12 18V5m3 8a4.17 4.17 0 0 1-3-4a4.17 4.17 0 0 1-3 4m8.598-6.5A3 3 0 1 0 12 5a3 3 0 1 0-5.598 1.5"/><path d="M17.997 5.125a4 4 0 0 1 2.526 5.77"/><path d="M18 18a4 4 0 0 0 2-7.464"/><path d="M19.967 17.483A4 4 0 1 1 12 18a4 4 0 1 1-7.967-.517"/><path d="M6 18a4 4 0 0 1-2-7.464"/><path d="M6.003 5.125a4 4 0 0 0-2.526 5.77"/></g>',
  width: 24,
  height: 24,
};

// lucide:link
export const SOURCE_ICON = {
  body: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></g>',
  width: 24,
  height: 24,
};
