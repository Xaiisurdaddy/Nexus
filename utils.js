/*
  utils.js
  Small shared helpers used by more than one module. Nothing in this file
  should depend on the DOM structure of a specific screen, keep it generic.
*/

const NexusUtils = (() => {

  /*
    Decides whether the interface should run in full effects or reduced
    effects mode. Two signals are combined:
    1. The operating system prefers-reduced-motion setting, always respected.
    2. A rough device capability heuristic (CPU core count and screen width),
       so low powered phones get lighter particle density and shorter
       animations even if the user has not set a system preference.
    The result is written to document.documentElement as a data attribute
    so any CSS file can react to it with [data-effects="reduced"].
  */
  function detectEffectsLevel() {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const lowCoreCount = (navigator.hardwareConcurrency || 4) <= 4;
    const smallScreen = window.innerWidth <= 600;
    const isLowPowerDevice = lowCoreCount && smallScreen;

    const level = prefersReduced || isLowPowerDevice ? 'reduced' : 'full';
    document.documentElement.setAttribute('data-effects', level);
    return level;
  }

  /* Returns a random integer between min and max, inclusive. Used for
     fake telemetry values and procedural scan results. */
  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /* Returns a random floating point value formatted to a fixed number
     of decimal places, useful for fake sensor readouts. */
  function randomFloat(min, max, decimals = 1) {
    const value = Math.random() * (max - min) + min;
    return value.toFixed(decimals);
  }

  /* Picks a random item from an array without mutating it. */
  function randomItem(list) {
    return list[randomInt(0, list.length - 1)];
  }

  /* Formats the current time as HH:MM:SS for the status bar clock. */
  function formatClock(date) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  }

  /* Simple typewriter effect that resolves a promise when finished, used
     by the boot sequence and console output. Respects reduced effects
     by shortening the per character delay significantly. */
  function typeText(element, text, speedMs = 18) {
    const effectsLevel = document.documentElement.getAttribute('data-effects');
    const delay = effectsLevel === 'reduced' ? 2 : speedMs;

    return new Promise((resolve) => {
      let index = 0;
      element.textContent = '';
      const interval = setInterval(() => {
        element.textContent += text.charAt(index);
        index += 1;
        if (index >= text.length) {
          clearInterval(interval);
          resolve();
        }
      }, delay);
    });
  }

  /* Wraps setTimeout in a promise so async boot and scan sequences read
     as a clean top to bottom list of awaited steps. */
  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  return {
    detectEffectsLevel,
    randomInt,
    randomFloat,
    randomItem,
    formatClock,
    typeText,
    wait
  };
})();
