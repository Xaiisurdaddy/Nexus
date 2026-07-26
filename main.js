/*
  main.js
  Entry point. Detects device and motion preferences first, since every
  other script reads the resulting data-effects attribute, then starts
  the boot sequence once the DOM is ready.
*/

document.addEventListener('DOMContentLoaded', () => {
  NexusUtils.detectEffectsLevel();
  NexusBoot.enableSkip();
  NexusBoot.run();
});

/* Re-evaluate effects level if the window is resized across the mobile
   breakpoint, for example rotating a tablet or resizing a desktop
   browser window significantly. Particle density is only set once at
   load for simplicity, a future milestone can make this fully dynamic
   if needed. */
window.addEventListener('resize', () => {
  NexusUtils.detectEffectsLevel();
});
