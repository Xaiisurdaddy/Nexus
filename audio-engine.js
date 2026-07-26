/*
  audio-engine.js
  All NEXUS sound is synthesized at runtime with the Web Audio API rather
  than loaded from audio files. This keeps the project fully static with
  no assets to source or license, and lets sounds react dynamically to
  what is happening on screen (for example, an alert can bend the pitch
  of the ambient hum in real time).

  To swap in real recorded audio later, replace the functions below with
  calls to an HTMLAudioElement or an AudioBufferSourceNode loaded from a
  file in assets/sounds. The public methods (playBlip, playGlitch, and so
  on) are the interface the rest of the app relies on, so the app code
  would not need to change.
*/

const NexusAudio = (() => {
  let context = null;
  let masterGain = null;
  let ambientNodes = null;
  let unlocked = false;

  function ensureContext() {
    if (!context) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      context = new AudioContextClass();
      masterGain = context.createGain();
      masterGain.gain.value = 0.5;
      masterGain.connect(context.destination);
    }
    return context;
  }

  /*
    Browsers block audio until a user gesture occurs. The boot sequence's
    ENTER key press is that gesture, so this is called at that moment to
    resume the audio context and start the ambient hum.
  */
  function unlock() {
    if (unlocked) return;
    ensureContext();
    if (context.state === 'suspended') {
      context.resume();
    }
    unlocked = true;
    startAmbientHum();
  }

  function isUnlocked() {
    return unlocked;
  }

  /*
    Continuous low ambient hum, built from two detuned oscillators through
    a lowpass filter. Runs for as long as the dashboard is open. Volume is
    kept very low since this plays constantly in the background.
  */
  function startAmbientHum() {
    if (ambientNodes) return;
    const ctx = ensureContext();

    const oscA = ctx.createOscillator();
    const oscB = ctx.createOscillator();
    oscA.type = 'sine';
    oscB.type = 'sine';
    oscA.frequency.value = 55;
    oscB.frequency.value = 55.6;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 220;

    const gain = ctx.createGain();
    gain.gain.value = 0;

    oscA.connect(filter);
    oscB.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);

    oscA.start();
    oscB.start();

    /* Fade in gently rather than starting abruptly at full volume. */
    gain.gain.setTargetAtTime(0.06, ctx.currentTime, 1.5);

    ambientNodes = { oscA, oscB, filter, gain };
  }

  function stopAmbientHum() {
    if (!ambientNodes) return;
    const ctx = ensureContext();
    ambientNodes.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.5);
    setTimeout(() => {
      ambientNodes.oscA.stop();
      ambientNodes.oscB.stop();
      ambientNodes = null;
    }, 1000);
  }

  /* Short, clean blip for hover and click feedback on nav modules and
     buttons. Quiet and quick so it never feels intrusive. */
  function playBlip(frequency = 880) {
    if (!unlocked) return;
    const ctx = ensureContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = frequency;
    gain.gain.value = 0.0001;

    osc.connect(gain);
    gain.connect(masterGain);

    const now = ctx.currentTime;
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

    osc.start(now);
    osc.stop(now + 0.13);
  }

  /* Deeper confirmation tone for a completed boot stage or a successful
     action, distinct from the lighter hover blip. */
  function playConfirm() {
    if (!unlocked) return;
    const ctx = ensureContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.15);
    gain.gain.value = 0.0001;

    osc.connect(gain);
    gain.connect(masterGain);

    const now = ctx.currentTime;
    gain.gain.exponentialRampToValueAtTime(0.15, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);

    osc.start(now);
    osc.stop(now + 0.32);
  }

  /* Short filtered noise burst for glitch moments and easter eggs. Built
     from a noise buffer rather than an oscillator, since real glitch
     texture reads as broadband noise, not a clean tone. */
  function playGlitch() {
    if (!unlocked) return;
    const ctx = ensureContext();
    const bufferSize = ctx.sampleRate * 0.2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i += 1) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1800;

    const gain = ctx.createGain();
    gain.gain.value = 0.0001;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);

    const now = ctx.currentTime;
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

    noise.start(now);
  }

  /* Low, ominous tone for warning and critical alert states. */
  function playAlert() {
    if (!unlocked) return;
    const ctx = ensureContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.value = 120;
    gain.gain.value = 0.0001;

    osc.connect(gain);
    gain.connect(masterGain);

    const now = ctx.currentTime;
    gain.gain.exponentialRampToValueAtTime(0.1, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);

    osc.start(now);
    osc.stop(now + 0.62);
  }

  return {
    unlock,
    isUnlocked,
    playBlip,
    playConfirm,
    playGlitch,
    playAlert,
    stopAmbientHum
  };
})();
