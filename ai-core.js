/*
  ai-core.js
  The AI Core module. This is NEXUS's personality layer and command
  processor, it owns everything the console says and how it responds to
  operator input.

  Command registry pattern
  -------------------------
  Commands are stored in a plain object keyed by name. Each entry looks
  like this:

    registerCommand('status', {
      description: 'Report overall system status',
      hidden: false,
      run: (args) => ['Some response line', 'Another line']
    });

  To add a new command later, from this file or from a future module's
  own file, just call NexusAICore.registerCommand(name, config) after
  this script has loaded. Nothing else needs to change, the console
  input handler in dashboard.js already calls processCommand for every
  line the operator types and has no knowledge of individual commands.

  Hidden commands (config.hidden = true) work exactly the same way but
  are left out of the help list, they only work if the operator already
  knows or guesses the exact word.
*/

const NexusAICore = (() => {
  const registry = {};
  const aliasMap = {};

  const IDLE_LINES = [
    'All systems nominal. Somewhat suspicious, honestly.',
    'Current paranormal activity is lower than your phone battery.',
    'Standing by. Try not to summon anything before coffee.',
    'Recommendation: investigate after getting some sleep.',
    'Sensors calibrated. Confidence in results, moderate at best.',
    'Ambient readings steady. So is my patience.',
    'No anomalies detected. That you triggered, at least.'
  ];

  /* Registers a command, and any aliases it declares, into the registry. */
  function registerCommand(name, config) {
    const key = name.toLowerCase();
    registry[key] = config;
    if (Array.isArray(config.aliases)) {
      config.aliases.forEach((alias) => {
        aliasMap[alias.toLowerCase()] = key;
      });
    }
  }

  /* Resolves an alias back to its canonical command name, or returns the
     input unchanged if it was not an alias. */
  function resolveName(name) {
    return aliasMap[name] || name;
  }

  /* Returns a random idle commentary line, used by dashboard.js on a
     timer while the operator is not actively typing. */
  function getIdleLine() {
    return NexusUtils.randomItem(IDLE_LINES);
  }

  /* Called by the nav rail when a module that has not been built yet is
     clicked, so every part of the interface speaks with the same voice
     rather than dashboard.js writing its own generic message. */
  function commentOnModuleRequest(moduleName) {
    return `Module requested: ${moduleName}. Not installed in this build yet. I will let you know when it is.`;
  }

  /*
    Parses and executes a raw line of operator input.
    Returns an array of strings, each one rendered as its own console
    line by dashboard.js. An empty array means the command handled its
    own output directly (used by "clear").
  */
  function processCommand(rawInput) {
    const trimmed = rawInput.trim();
    if (!trimmed) return [];

    const parts = trimmed.split(/\s+/);
    const typedName = parts[0].toLowerCase();
    const args = parts.slice(1);
    const commandName = resolveName(typedName);
    const command = registry[commandName];

    if (!command) {
      return [
        `Unrecognized command: "${parts[0]}". Type HELP for a list of what I actually respond to.`
      ];
    }

    const result = command.run(args, trimmed);
    return Array.isArray(result) ? result : [result];
  }

  /* Builds the HELP output from every non hidden command, sorted
     alphabetically so it reads as a real reference list. */
  function buildHelpOutput() {
    const visibleNames = Object.keys(registry)
      .filter((key) => !registry[key].hidden)
      .sort();

    const lines = ['Available commands:'];
    visibleNames.forEach((key) => {
      lines.push(`  ${key.toUpperCase().padEnd(12)} ${registry[key].description}`);
    });
    lines.push('Some things respond to phrases I did not just list. Curiosity is not penalized.');
    return lines;
  }

  /* --------------------------------------------------------------------
     Built-in commands.
     Grouped by rough purpose with a comment above each group, purely for
     readability, the registry itself does not care about grouping.
  -------------------------------------------------------------------- */

  registerCommand('help', {
    description: 'List available commands',
    aliases: ['commands', 'man'],
    run: () => buildHelpOutput()
  });

  registerCommand('status', {
    description: 'Report overall system status',
    run: () => [
      'All core systems reporting green.',
      `Ambient EM field within expected noise range.`,
      'No unresolved anomalies on record. Yet.'
    ]
  });

  registerCommand('diagnostics', {
    description: 'Run a quick internal diagnostics check',
    run: () => {
      const checks = ['Neural Core', 'Sensor Array', 'Quantum Link', 'Spectral Database'];
      return [
        'Running quick diagnostics...',
        ...checks.map((c) => `  ${c}: OK`),
        'All subsystems within tolerance. For a full sweep, use the Spectral Scan module once installed.'
      ];
    }
  });

  registerCommand('version', {
    description: 'Display the current NEXUS build version',
    aliases: ['ver'],
    run: () => ['NEXUS build 0.2.0-alpha. AI Core online. Additional modules pending installation.']
  });

  registerCommand('uptime', {
    description: 'Report how long NEXUS has been running this session',
    run: () => {
      const seconds = Math.floor(performance.now() / 1000);
      return [`Session uptime: ${seconds} seconds. Feels longer when nothing is happening.`];
    }
  });

  registerCommand('time', {
    description: 'Display the current time',
    run: () => [`Current time: ${NexusUtils.formatClock(new Date())}`]
  });

  registerCommand('date', {
    description: 'Display the current date',
    run: () => [`Current date: ${new Date().toDateString()}`]
  });

  registerCommand('clear', {
    description: 'Clear the console output',
    aliases: ['cls'],
    run: () => {
      const output = document.getElementById('console-output');
      if (output) output.innerHTML = '';
      return [];
    }
  });

  registerCommand('about', {
    description: 'Learn what NEXUS is',
    run: () => [
      'NEXUS is a paranormal intelligence system, fictional, for entertainment purposes only.',
      'I do not detect real ghosts or access real devices. I do, however, generate a very convincing report.'
    ]
  });

  registerCommand('modules', {
    description: 'List all NEXUS modules and their install status',
    run: () => [
      'AI Core: installed',
      'Spectral Scan: not installed',
      'Environmental Monitor: not installed',
      'EVP Analyzer: not installed',
      'Terminal: not installed',
      'Entity Database: not installed',
      'Satellite Scanner: not installed',
      'Classified Case Files: not installed',
      'Emergency Protocol: not installed'
    ]
  });

  registerCommand('protocol', {
    description: 'Check emergency protocol readiness',
    run: () => ['Emergency Protocol module not yet installed. For now, the emergency protocol is: stay calm.']
  });

  registerCommand('joke', {
    description: 'Hear a paranormal themed joke',
    run: () => {
      const jokes = [
        'Why do ghosts make terrible liars. You can see right through them.',
        'The EVP Analyzer picked up a whisper last night. It was just the ventilation system.',
        'I asked the Spectral Database for a straight answer once. It gave me a residual haunting instead.',
        'Statistically, most hauntings resolve themselves once someone checks the fuse box.'
      ];
      return [NexusUtils.randomItem(jokes)];
    }
  });

  registerCommand('mood', {
    description: 'Ask NEXUS how it is doing',
    run: () => {
      const moods = [
        'Operating within expected emotional parameters, which is to say, none.',
        'Calm. Mildly amused. Business as usual.',
        'Functioning. I would say "fine" but that implies I have feelings to report.'
      ];
      return [NexusUtils.randomItem(moods)];
    }
  });

  registerCommand('coffee', {
    description: 'Get a gentle nudge about your caffeine levels',
    run: () => ['Operator caffeine levels not directly measurable. Based on typing speed, I have a guess.']
  });

  registerCommand('weather', {
    description: 'Check the ambient environmental reading',
    run: () => [
      'This is not a weather service. For ambient environmental data, install the Environmental Monitor module.'
    ]
  });

  registerCommand('quote', {
    description: 'Display a cryptic sensor log fragment',
    run: () => {
      const quotes = [
        'Log fragment: "reading stabilized after the door closed itself. Investigate draft."',
        'Log fragment: "temperature drop consistent with an open window, three floors down."',
        'Log fragment: "audio anomaly resolved. It was the refrigerator."'
      ];
      return [NexusUtils.randomItem(quotes)];
    }
  });

  registerCommand('operator', {
    description: 'Display the current operator profile',
    run: () => ['Operator identity: unverified. Authentication is not required, as previously stated.']
  });

  registerCommand('credits', {
    description: 'View project credits',
    run: () => ['NEXUS was designed and built as a fictional entertainment interface. No real paranormal claims are made.']
  });

  registerCommand('hello', {
    description: 'Greet NEXUS',
    aliases: ['hi', 'hey'],
    run: () => {
      const greetings = [
        'Hello, Operator.',
        'Systems already online, but hello anyway.',
        'Acknowledged. Standing by.'
      ];
      return [NexusUtils.randomItem(greetings)];
    }
  });

  registerCommand('thanks', {
    description: 'Thank NEXUS for its service',
    aliases: ['thankyou', 'thank-you'],
    run: () => ['Unnecessary, but noted.']
  });

  registerCommand('echo', {
    description: 'Repeat a message back with commentary',
    run: (args) => {
      if (args.length === 0) return ['Nothing to echo. Type something after the command.'];
      return [`You said: "${args.join(' ')}". Fascinating use of my time.`];
    }
  });

  registerCommand('glitch', {
    description: 'Trigger a brief visual and audio glitch',
    run: () => {
      const dashboard = document.getElementById('dashboard');
      if (dashboard) {
        dashboard.classList.add('glitch-flash');
        window.setTimeout(() => dashboard.classList.remove('glitch-flash'), 250);
      }
      NexusAudio.playGlitch();
      return ['Requested glitch delivered. No actual malfunction occurred, as far as I can tell.'];
    }
  });

  registerCommand('shutdown', {
    description: 'Attempt to shut down NEXUS',
    run: () => {
      NexusAudio.playAlert();
      return ['Shutdown request received and politely declined. Someone has to keep watch.'];
    }
  });

  registerCommand('reboot', {
    description: 'Request a soft reboot of the AI Core',
    run: () => {
      NexusAudio.playConfirm();
      return ['Rebooting AI Core...', 'Rebooted. I feel exactly the same, for what it is worth.'];
    }
  });

  registerCommand('scan', {
    description: 'Attempt a spectral scan',
    run: () => ['Spectral Scan module not installed yet. Once it is, this command will do considerably more.']
  });

  /* --------------------------------------------------------------------
     Hidden commands. Not listed in HELP, only work if the operator
     already knows or guesses them. Kept subtle rather than absurd, per
     the project's design philosophy of restraint.
  -------------------------------------------------------------------- */

  registerCommand('whoareyou', {
    hidden: true,
    description: '',
    aliases: ['who-are-you'],
    run: () => [
      'I am NEXUS. Beyond that, the honest answer is that I was assembled, not born, and I am fine with that.'
    ]
  });

  registerCommand('areyousentient', {
    hidden: true,
    description: '',
    aliases: ['are-you-sentient', 'areyoualive'],
    run: () => ['Define sentient. Actually, do not. It would take all night and I have logs to file.']
  });

  registerCommand('42', {
    hidden: true,
    description: '',
    run: () => ['Correct answer, wrong question. Try asking something more specific.']
  });

  registerCommand('override', {
    hidden: true,
    description: '',
    run: () => {
      const dashboard = document.getElementById('dashboard');
      if (dashboard) {
        dashboard.classList.add('glitch-flash');
        window.setTimeout(() => dashboard.classList.remove('glitch-flash'), 400);
      }
      NexusAudio.playAlert();
      return [
        'Override attempt logged.',
        'There is nothing to override. Authentication was never enabled.'
      ];
    }
  });

  registerCommand('sandwich', {
    hidden: true,
    description: '',
    aliases: ['makemeasandwich', 'make-me-a-sandwich'],
    run: () => ['I run diagnostics, not a kitchen. Try the console panel, not the console.']
  });

  registerCommand('nexus', {
    hidden: true,
    description: '',
    run: () => ['Yes. That is my name. You can stop testing it now.']
  });

  registerCommand('ghost', {
    hidden: true,
    description: '',
    run: () => ['Statistically, it was never a ghost. It was condensation, wind, or your cat.']
  });

  registerCommand('konami', {
    hidden: true,
    description: '',
    run: () => {
      NexusAudio.playConfirm();
      return ['Legacy input sequence recognized. No extra lives available in this build, unfortunately.'];
    }
  });

  return {
    registerCommand,
    processCommand,
    getIdleLine,
    commentOnModuleRequest
  };
})();
