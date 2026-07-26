/*
  particles-config.js
  Sets up the faint drifting particle field that sits behind the dashboard.
  Density and speed are scaled down automatically on lower powered devices
  and reduced motion is a full stop, no particles render at all, since
  they are purely decorative and add nothing functional for those users.
*/

/*
  Chooses a particle count based on viewport width. This is a separate
  axis from the reduced effects check in utils.js, which looks at CPU
  core count. A phone can report eight cores and still have a modest
  GPU, so width is used here as an independent, cheaper signal of how
  much compositing the device is likely to handle comfortably.
*/
function getParticleCountForViewport() {
  const width = window.innerWidth;
  if (width <= 480) return 18;
  if (width <= 900) return 30;
  return 45;
}

function initParticleField() {
  const effectsLevel = document.documentElement.getAttribute('data-effects');

  if (effectsLevel === 'reduced') {
    /* Skip particles entirely under reduced effects, the CSS grid
       background and scanline overlay already provide enough ambient
       texture without the added CPU and battery cost. */
    return;
  }

  if (typeof tsParticles === 'undefined') {
    console.warn('NEXUS: tsParticles failed to load, skipping particle field.');
    return;
  }

  tsParticles.load('particle-field', {
    fpsLimit: 60,
    background: { color: 'transparent' },
    particles: {
      number: {
        value: getParticleCountForViewport(),
        density: { enable: true, area: 900 }
      },
      color: { value: ['#00fff2', '#9d4dff'] },
      opacity: {
        value: { min: 0.1, max: 0.4 },
        animation: { enable: true, speed: 0.4, sync: false }
      },
      size: { value: { min: 1, max: 2 } },
      move: {
        enable: true,
        speed: 0.3,
        direction: 'none',
        random: true,
        straight: false,
        outModes: { default: 'out' }
      },
      links: {
        enable: true,
        distance: 140,
        color: '#00fff2',
        opacity: 0.08,
        width: 1
      }
    },
    interactivity: {
      events: {
        onHover: { enable: false },
        onClick: { enable: false }
      }
    },
    detectRetina: true
  });
}
