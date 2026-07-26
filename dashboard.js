/*
  dashboard.js
  Controls the persistent dashboard shell: the status bar clock, the
  ambient telemetry numbers, and nav rail sound and hover feedback.
  All console output and command processing is owned by the AI Core
  module (js/ai-core.js), this file only wires the console's DOM
  elements up to that module. Module specific behavior beyond AI Core
  (Spectral Scan, EVP Analyzer, and so on) will live in their own files
  added in later milestones and will mount into #center-stage.
*/

const NexusDashboard = (() => {

  let telemetryInterval = null;
  let clockInterval = null;
  let activated = false;

  function startClock() {
    const clockValue = document.getElementById('status-clock');
    function tick() {
      clockValue.textContent = NexusUtils.formatClock(new Date());
    }
    tick();
    clockInterval = setInterval(tick, 1000);
  }

  /* Telemetry numbers are entirely decorative, they exist to make the
     interface feel alive at a glance, not to represent anything real.
     Values drift slowly rather than jumping, which reads as sensor
     noise rather than a broken counter. */
  function startTelemetry() {
    const emField = document.getElementById('telemetry-em');
    const tempField = document.getElementById('telemetry-temp');
    const signalField = document.getElementById('telemetry-signal');

    function update() {
      emField.textContent = `${NexusUtils.randomFloat(0.1, 4.8, 2)} mG`;
      tempField.textContent = `${NexusUtils.randomFloat(-2, 1.5, 1)} deg drift`;
      signalField.textContent = `${NexusUtils.randomInt(62, 99)} percent`;
    }

    update();
    telemetryInterval = setInterval(update, 2600);
  }

  function printConsoleLine(text, prefix = 'NEXUS') {
    const output = document.getElementById('console-output');
    const line = document.createElement('div');
    line.className = 'console-line';
    const prefixSpan = document.createElement('span');
    prefixSpan.className = 'prefix';
    prefixSpan.textContent = `[${prefix}]`;
    const textSpan = document.createElement('span');
    textSpan.textContent = text;

    line.appendChild(prefixSpan);
    line.appendChild(textSpan);
    output.appendChild(line);
    output.scrollTop = output.scrollHeight;
  }

  /* Prints one AI Core idle line every 14 seconds while the operator is
     not actively typing, establishing personality even when nothing
     else is happening on screen. */
  function startIdleCommentary() {
    printConsoleLine('Dashboard online. Awaiting instructions, Operator. Type HELP to see what I can do.');
    setInterval(() => {
      printConsoleLine(NexusAICore.getIdleLine());
    }, 14000);
  }

  function wireNavRail() {
    const navModules = document.querySelectorAll('.nav-module');
    navModules.forEach((moduleButton) => {
      moduleButton.addEventListener('mouseenter', () => {
        NexusAudio.playBlip(900);
      });
      moduleButton.addEventListener('click', () => {
        NexusAudio.playConfirm();
        const moduleName = moduleButton.dataset.module;

        /* AI Core is the one module that is actually installed at this
           stage, it is the console itself. Clicking its icon should
           acknowledge that and focus the input, not repeat the generic
           "not installed yet" message meant for the other eight
           modules that really are still pending. */
        if (moduleName === 'AI Core') {
          printConsoleLine('AI Core is already online, right here in this console. Type HELP to see what I can do.');
          const input = document.getElementById('console-input');
          if (input) input.focus();
          return;
        }

        printConsoleLine(NexusAICore.commentOnModuleRequest(moduleName));
      });
    });
  }

  /* Wires the console input field up to the AI Core's command
     processor. This file only handles the DOM side of things (echoing
     what the operator typed, clearing the input, playing a sound), it
     has no knowledge of individual commands, that logic lives entirely
     in ai-core.js. */
  function wireConsoleInput() {
    const input = document.getElementById('console-input');
    input.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter') return;
      const value = input.value.trim();
      if (!value) return;

      printConsoleLine(value, 'OPERATOR');
      input.value = '';
      NexusAudio.playBlip(760);

      const responseLines = NexusAICore.processCommand(value);
      responseLines.forEach((line) => printConsoleLine(line));
    });
  }

  /* Called once by boot-sequence.js after the fade into the dashboard
     completes. Safe to call only once per page load. */
  function activate() {
    if (activated) return;
    activated = true;

    startClock();
    startTelemetry();
    wireNavRail();
    wireConsoleInput();
    startIdleCommentary();

    if (typeof initParticleField === 'function') {
      initParticleField();
    }
  }

  return { activate };
})();
