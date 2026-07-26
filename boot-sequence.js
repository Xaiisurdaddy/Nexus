/*
  boot-sequence.js
  Drives the three stage boot sequence: the scrolling system log, the
  NEXUS wordmark reveal, and the welcome and enter prompt. Runs once per
  session, then hands off to dashboard.js to activate the shell.
*/

const NexusBoot = (() => {

  const LOG_LINES = [
    'BOOT SEQUENCE INITIATED...',
    'LOADING NEURAL CORE...',
    'SYNCHRONIZING SENSORS...',
    'CONNECTING QUANTUM ARRAY...',
    'LOADING SPECTRAL DATABASE...',
    'INITIALIZING NEXUS...',
    'STATUS: ONLINE'
  ];

  async function runLogStage() {
    const logContainer = document.getElementById('boot-log');
    const effectsLevel = document.documentElement.getAttribute('data-effects');
    const lineDelay = effectsLevel === 'reduced' ? 120 : 420;

    for (let i = 0; i < LOG_LINES.length; i += 1) {
      const line = document.createElement('div');
      line.className = 'log-line';
      if (LOG_LINES[i].startsWith('STATUS')) {
        line.classList.add('status-online');
      }
      logContainer.appendChild(line);

      gsap.to(line, { opacity: 1, duration: 0.15 });
      await NexusUtils.typeText(line, LOG_LINES[i], 16);
      NexusAudio.playBlip(620 + i * 20);

      /* A brief glitch flicker on two of the lines for texture, never on
         every line since restraint reads as more premium than constant
         noise. */
      if (i === 2 || i === 4) {
        document.getElementById('boot-screen').classList.add('glitching');
        NexusAudio.playGlitch();
        await NexusUtils.wait(160);
        document.getElementById('boot-screen').classList.remove('glitching');
      }

      await NexusUtils.wait(lineDelay);
    }

    NexusAudio.playConfirm();
    await NexusUtils.wait(500);
  }

  function runWordmarkStage() {
    return new Promise((resolve) => {
      const logStage = document.getElementById('boot-log');
      const wordmarkStage = document.getElementById('boot-wordmark');
      const heading = wordmarkStage.querySelector('h1');
      const tagline = wordmarkStage.querySelector('.tagline');

      const timeline = gsap.timeline({
        onComplete: resolve
      });

      timeline
        .to(logStage, { opacity: 0, duration: 0.4 })
        .set(logStage, { display: 'none' })
        .set(wordmarkStage, { display: 'flex' })
        .to(heading, { opacity: 1, letterSpacing: '0.3em', duration: 1.1, ease: 'power2.out' })
        .to(tagline, { opacity: 1, duration: 0.8 }, '-=0.3');
    });
  }

  function runWelcomeStage() {
    return new Promise((resolve) => {
      const welcomeStage = document.getElementById('boot-welcome');
      welcomeStage.style.display = 'flex';

      const paragraphs = welcomeStage.querySelectorAll('p');
      const timeline = gsap.timeline({ onComplete: resolve });

      timeline.to(paragraphs, {
        opacity: 1,
        duration: 0.6,
        stagger: 0.35
      });
    });
  }

  /*
    Fades out the entire boot screen and reveals the dashboard shell.
    Also unlocks audio here, since the ENTER key press that triggers this
    function is the required user gesture browsers need before audio can
    play.
  */
  function transitionToDashboard() {
    NexusAudio.unlock();
    NexusAudio.playConfirm();

    const bootScreen = document.getElementById('boot-screen');
    const dashboard = document.getElementById('dashboard');

    const timeline = gsap.timeline();
    timeline
      .to(bootScreen, { opacity: 0, duration: 0.6, ease: 'power2.inOut' })
      .set(bootScreen, { display: 'none' })
      .set(dashboard, { display: 'grid' })
      .to(dashboard, { opacity: 1, duration: 0.8 }, '-=0.1')
      .call(() => {
        if (typeof NexusDashboard !== 'undefined') {
          NexusDashboard.activate();
        }
      });
  }

  async function run() {
    await runLogStage();
    await runWordmarkStage();
    await runWelcomeStage();

    /* Listen for the ENTER key, and also allow a tap or click on the
       prompt itself for touch devices that have no enter key. */
    const enterPrompt = document.querySelector('.enter-prompt');
    const skipHint = document.getElementById('boot-skip-hint');
    if (skipHint) {
      skipHint.style.display = 'none';
    }

    function handleEnter(event) {
      if (event.type === 'keydown' && event.key !== 'Enter') return;
      document.removeEventListener('keydown', handleEnter);
      enterPrompt.removeEventListener('click', handleEnter);
      transitionToDashboard();
    }

    document.addEventListener('keydown', handleEnter);
    enterPrompt.addEventListener('click', handleEnter);
  }

  /*
    Allows an impatient operator to skip the boot sequence early by
    pressing ESCAPE. This is a deliberate UX safety valve, cinematic
    intros are enjoyable the first time and tedious the fifth time, so
    returning users should never feel trapped by it.
  */
  function enableSkip() {
    function handleSkip(event) {
      if (event.key !== 'Escape') return;
      document.removeEventListener('keydown', handleSkip);
      gsap.killTweensOf('*');
      transitionToDashboard();
    }
    document.addEventListener('keydown', handleSkip);
  }

  return { run, enableSkip };
})();
