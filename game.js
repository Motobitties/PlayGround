(() => {
  'use strict';
  const SAVE_KEY = 'afterlight-save-v1';
  const frequencies = ['warm', 'deep', 'clear'];
  const phases = [
    { name: 'WARMTH', line: 'WARMTH IS IN PHASE' },
    { name: 'DEEP SPACE', line: 'DEEP SPACE IS IN PHASE' },
    { name: 'CLEAR SKY', line: 'CLEAR SKY IS IN PHASE' }
  ];
  const upgrades = [
    { id: 'relay', name: 'Listening post', icon: '⌁', desc: 'A second ear in the dark · +0.4 drift/sec', base: 15, effect: 'rate', amount: .4, unlock: 0 },
    { id: 'choir', name: 'The night choir', icon: '♬', desc: 'Old radios singing together · +2 drift/sec', base: 90, effect: 'rate', amount: 2, unlock: 40 },
    { id: 'mirror', name: 'Moon mirror', icon: '◒', desc: 'Focus the light · +2 pulse strength', base: 240, effect: 'click', amount: 2, unlock: 150 },
    { id: 'array', name: 'Deep-space array', icon: '✧', desc: 'Listen between the stars · +12 drift/sec', base: 1100, effect: 'rate', amount: 12, unlock: 700 },
    { id: 'beacon', name: 'Horizon beacon', icon: '♜', desc: 'A steady light for lost travelers · +55 drift/sec', base: 5200, effect: 'rate', amount: 55, unlock: 3500 },
    { id: 'greenhouse', name: 'Signal greenhouse', icon: '❋', desc: 'Living things amplify the hum · +8% all signal', base: 12000, effect: 'multiplier', amount: .08, unlock: 8000 },
    { id: 'lunar', name: 'Lunar relay', icon: '☾', desc: 'Bounce a stronger pulse off the moon · +12 pulse', base: 18000, effect: 'click', amount: 12, unlock: 12000 },
    { id: 'archive', name: 'Memory archive', icon: '▤', desc: 'Give every recovered voice a home · +240 drift/sec', base: 52000, effect: 'rate', amount: 240, unlock: 40000 },
    { id: 'aurora', name: 'Aurora engine', icon: '✺', desc: 'Turn the upper atmosphere into a lens · +15% all signal', base: 105000, effect: 'multiplier', amount: .15, unlock: 85000 },
    { id: 'observatory', name: 'Far-side observatory', icon: '⌂', desc: 'Hear what the planet cannot · +1,200 drift/sec', base: 480000, effect: 'rate', amount: 1200, unlock: 350000 },
    { id: 'hearth', name: 'The last hearth', icon: '♨', desc: 'A little warmth travels a long way · +100 pulse', base: 900000, effect: 'click', amount: 100, unlock: 700000 },
    { id: 'singularity', name: 'Quiet singularity', icon: '✹', desc: 'Bend the silence toward us · +30% all signal', base: 4200000, effect: 'multiplier', amount: .3, unlock: 3000000 }
  ];
  const missions = [
    { title: 'A voice in the dark', description: 'Send 12 pulses to make the old dish hum.', type: 'pulses', target: 12, reward: 12 },
    { title: 'A second pair of ears', description: 'Build 3 listening posts for the station.', type: 'relay', target: 3, reward: 55 },
    { title: 'Keep the porch light on', description: 'Gather 250 signal. Someone may be watching.', type: 'lifetime', target: 250, reward: 90 },
    { title: 'Let the choir answer', description: 'Build 2 night choirs and fill the silence.', type: 'choir', target: 2, reward: 180 },
    { title: 'Reflect what remains', description: 'Build 2 moon mirrors to focus your pulse.', type: 'mirror', target: 2, reward: 400 },
    { title: 'A signal beyond the moon', description: 'Gather 2,000 signal. The reply is getting closer.', type: 'lifetime', target: 2000, reward: 900 },
    { title: 'The sky has a voice', description: 'Build 2 deep-space arrays. Find out who it belongs to.', type: 'array', target: 2, reward: 2200 },
    { title: 'A light on the horizon', description: 'Gather 8,000 signal and mark the far ridge.', type: 'lifetime', target: 8000, reward: 5000 },
    { title: 'Guide the wanderers', description: 'Raise 2 horizon beacons above the dark.', type: 'beacon', target: 2, reward: 9000 },
    { title: 'A garden in the static', description: 'Grow 2 signal greenhouses among the antennas.', type: 'greenhouse', target: 2, reward: 18000 },
    { title: 'The moon answers back', description: 'Build 3 lunar relays and listen for the return.', type: 'lunar', target: 3, reward: 35000 },
    { title: 'Nothing is ever lost', description: 'Gather 100,000 signal for the voices you found.', type: 'lifetime', target: 100000, reward: 60000 },
    { title: 'Keep their names', description: 'Build 3 memory archives to preserve the signal.', type: 'archive', target: 3, reward: 120000 },
    { title: 'Paint the whole sky', description: 'Build 3 aurora engines and wake the atmosphere.', type: 'aurora', target: 3, reward: 300000 },
    { title: 'Look beyond home', description: 'Build 2 far-side observatories.', type: 'observatory', target: 2, reward: 650000 },
    { title: 'A home-fire in the void', description: 'Build 3 last hearths for whoever is listening.', type: 'hearth', target: 3, reward: 1500000 },
    { title: 'The quiet has a shape', description: 'Build 2 quiet singularities. Find the edge of it.', type: 'singularity', target: 2, reward: 5000000 },
    { title: 'Answer every voice', description: 'Gather 10,000,000 signal. The whole sky is listening.', type: 'lifetime', target: 10000000, reward: 10000000 }
  ];
  const memories = ['a blue thread', 'the smell of rain', 'someone humming', 'a window left open', 'the color of home', 'a paper boat on the steps', 'warm bread cooling by the radio', 'footprints leading back to the shore', 'a name written beneath the desk', 'the first snow of a long winter', 'a dog asleep beside the transmitter', 'the last song at the summer fair', 'a lighthouse blinking through fog', 'a garden nobody asked to leave', 'the sound of everyone coming home'];
  const milestones = [
    { id: 'signal-100', name: 'First light', hint: 'Gather 100 signal in one transmission', test: s => s.lifetime >= 100, reward: 25 },
    { id: 'signal-1k', name: 'A steady carrier', hint: 'Gather 1,000 signal in one transmission', test: s => s.lifetime >= 1000, reward: 150 },
    { id: 'signal-10k', name: 'Across the valley', hint: 'Gather 10,000 signal in one transmission', test: s => s.lifetime >= 10000, reward: 1200 },
    { id: 'signal-100k', name: 'The long reply', hint: 'Gather 100,000 signal in one transmission', test: s => s.lifetime >= 100000, reward: 12000 },
    { id: 'signal-1m', name: 'A sky full of voices', hint: 'Gather 1,000,000 signal in one transmission', test: s => s.lifetime >= 1000000, reward: 100000 },
    { id: 'pulses-100', name: 'Restless hands', hint: 'Send 100 pulses in one transmission', test: s => s.pulses >= 100, reward: 100 },
    { id: 'pulses-1000', name: 'Patient listener', hint: 'Send 1,000 pulses in one transmission', test: s => s.pulses >= 1000, reward: 2500 },
    { id: 'build-10', name: 'A station takes shape', hint: 'Build 10 pieces of equipment in one transmission', test: s => Object.values(s.upgrades).reduce((a, b) => a + b, 0) >= 10, reward: 250 },
    { id: 'build-40', name: 'A constellation of ears', hint: 'Build 40 pieces of equipment in one transmission', test: s => Object.values(s.upgrades).reduce((a, b) => a + b, 0) >= 40, reward: 10000 },
    { id: 'echo-1', name: 'Carry it forward', hint: 'Begin a second transmission', test: s => s.echoes >= 1, reward: 100 },
    { id: 'echo-5', name: 'Five times heard', hint: 'Recover 5 permanent echoes', test: s => s.echoes >= 5, reward: 10000 },
    { id: 'memory-5', name: 'A handful of home', hint: 'Recover 5 story fragments', test: s => s.fragments.length >= 5, reward: 500 },
    { id: 'memory-15', name: 'Nothing left in the static', hint: 'Recover every story fragment', test: s => s.fragments.length >= memories.length, reward: 50000 }
  ];
  const fresh = () => ({ signal: 0, lifetime: 0, echoes: 0, upgrades: Object.fromEntries(upgrades.map(item => [item.id, 0])), pulses: 0, mission: 0, missionClaimed: -1, frequency: 'warm', phase: 0, phaseAt: Date.now(), lastSave: Date.now(), fragments: [], achievements: [], sound: false });
  let state = fresh();
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
    if (saved && typeof saved === 'object') {
      state = { ...fresh(), ...saved, upgrades: { ...fresh().upgrades, ...(saved.upgrades || {}) }, fragments: Array.isArray(saved.fragments) ? saved.fragments.filter(item => memories.includes(item)).slice(-memories.length) : [] };
      state.signal = Math.max(0, Number(state.signal) || 0);
      state.lifetime = Math.max(state.signal, Number(state.lifetime) || 0);
      state.echoes = Math.max(0, Math.floor(Number(state.echoes) || 0));
      state.mission = Math.max(0, Math.floor(Number(state.mission) || 0));
      state.pulses = Math.max(0, Math.floor(Number(state.pulses) || 0));
      state.achievements = Array.isArray(saved.achievements) ? saved.achievements.filter(id => milestones.some(item => item.id === id)) : [];
      state.phase = Math.abs(Math.floor(Number(state.phase) || 0)) % 3;
      if (!frequencies.includes(state.frequency)) state.frequency = 'warm';
      Object.keys(state.upgrades).forEach(id => state.upgrades[id] = Math.max(0, Math.floor(Number(state.upgrades[id]) || 0)));
      const away = Math.min(8 * 60 * 60, Math.max(0, (Date.now() - (Number(state.lastSave) || Date.now())) / 1000));
      const drift = getBaseRate() * away;
      if (drift > 1) { state.signal += drift; state.lifetime += drift; setTimeout(() => toast(`Welcome back. ${format(drift)} signal gathered while you were away.`), 500); }
      if (Date.now() - (Number(state.phaseAt) || Date.now()) >= 60000) state.phaseAt = Date.now();
    }
  } catch (_) { state = fresh(); }

  const $ = id => document.getElementById(id);
  const amount = $('signalAmount'), rateLabel = $('rateAmount'), clickLabel = $('clickAmount');
  let toastTimer, lastTick = Date.now(), lastSave = 0;
  let soundContext;
  function getBaseRate() { return upgrades.reduce((sum, item) => sum + (item.effect === 'rate' ? state.upgrades[item.id] * item.amount : 0), 0); }
  function echoMultiplier() { return 1 + state.echoes * .2; }
  function stationMultiplier() { return 1 + upgrades.reduce((sum, item) => sum + (item.effect === 'multiplier' ? state.upgrades[item.id] * item.amount : 0), 0); }
  function rate() { return getBaseRate() * echoMultiplier() * stationMultiplier() * (state.frequency === 'deep' && state.phase === 1 ? 1.2 : 1); }
  function clickPower() { const click = 1 + upgrades.reduce((sum, item) => sum + (item.effect === 'click' ? state.upgrades[item.id] * item.amount : 0), 0); return click * echoMultiplier() * stationMultiplier() * (state.frequency === 'warm' && state.phase === 0 ? 1.25 : 1); }
  function format(value) {
    if (!Number.isFinite(value)) return '∞';
    if (value < 1000) return (value < 10 && value % 1 ? value.toFixed(1) : Math.floor(value)).toLocaleString('en-US');
    const units = [['Qa', 1e15], ['T', 1e12], ['B', 1e9], ['M', 1e6], ['K', 1e3]];
    for (const [label, size] of units) if (value >= size) return (value / size).toFixed(value / size >= 100 ? 0 : 1) + label;
    return String(Math.floor(value));
  }
  function cost(item) { return Math.floor(item.base * Math.pow(1.17, state.upgrades[item.id])); }
  function addSignal(value) { if (!(value > 0) || !Number.isFinite(value)) return; state.signal += value; state.lifetime += value; }
  function save() { try { state.lastSave = Date.now(); localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (_) {} }
  function toast(message) { const el = $('toast'); el.textContent = message; el.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 2600); }
  function playTone(freq = 440, duration = .07) {
    if (!state.sound) return;
    try { soundContext ||= new (window.AudioContext || window.webkitAudioContext)(); const osc = soundContext.createOscillator(), gain = soundContext.createGain(); osc.frequency.value = freq; osc.type = 'sine'; gain.gain.setValueAtTime(.035, soundContext.currentTime); gain.gain.exponentialRampToValueAtTime(.001, soundContext.currentTime + duration); osc.connect(gain); gain.connect(soundContext.destination); osc.start(); osc.stop(soundContext.currentTime + duration); } catch (_) {}
  }
  function activeMission() { return state.mission < missions.length ? missions[state.mission] : null; }
  function missionProgress(m) { if (!m) return 0; if (m.type === 'pulses') return state.pulses; if (m.type === 'lifetime') return state.lifetime; return state.upgrades[m.type] || 0; }
  function renderUpgrades() {
    const list = $('upgradeList'); list.innerHTML = '';
    upgrades.forEach(item => {
      const count = state.upgrades[item.id], price = cost(item), locked = state.lifetime < item.unlock;
      const row = document.createElement('div'); row.className = `upgrade-row${!locked && state.signal >= price ? ' affordable' : ''}${locked ? ' locked' : ''}`;
      const icon = document.createElement('div'); icon.className = 'upgrade-icon'; icon.textContent = item.icon;
      const info = document.createElement('div'); info.className = 'upgrade-info';
      const name = document.createElement('div'); name.className = 'upgrade-name'; name.textContent = item.name;
      const desc = document.createElement('div'); desc.className = 'upgrade-desc'; desc.textContent = locked ? `Unlocks at ${format(item.unlock)} lifetime signal` : item.desc;
      const owned = document.createElement('div'); owned.className = 'upgrade-owned'; owned.textContent = `OWNED  ${count}`;
      info.append(name, desc, owned);
      const button = document.createElement('button'); button.className = 'buy-button'; button.disabled = locked || state.signal < price; button.innerHTML = `${locked ? 'LOCKED' : 'BUILD'}<span class="buy-cost">${locked ? format(item.unlock) : `${format(price)} ◉`}</span>`;
      button.setAttribute('aria-label', `Build ${item.name} for ${format(price)} signal`); button.addEventListener('click', () => buy(item));
      row.append(icon, info, button); list.append(row);
    });
    $('upgradeCount').textContent = `${Object.values(state.upgrades).reduce((a, b) => a + b, 0)} BUILT`;
  }
  function checkMilestones() {
    milestones.forEach(item => {
      if (!state.achievements.includes(item.id) && item.test(state)) {
        state.achievements.push(item.id); addSignal(item.reward);
        toast(`Milestone recorded: ${item.name} · +${format(item.reward)} signal`); playTone(760, .14);
      }
    });
  }
  function renderMilestones() {
    const list = $('milestoneList'); list.innerHTML = '';
    milestones.forEach(item => {
      const done = state.achievements.includes(item.id), row = document.createElement('div'); row.className = `milestone-row${done ? ' complete' : ''}`;
      const mark = document.createElement('span'); mark.className = 'milestone-mark'; mark.textContent = done ? '✦' : '○';
      const copy = document.createElement('span'); copy.className = 'milestone-copy';
      const name = document.createElement('strong'); name.textContent = item.name;
      const hint = document.createElement('small'); hint.textContent = done ? `RECORDED · +${format(item.reward)} SIGNAL` : item.hint;
      copy.append(name, hint); row.append(mark, copy); list.append(row);
    });
    $('milestoneCount').textContent = `${state.achievements.length} / ${milestones.length}`;
  }
  function render() {
    checkMilestones();
    amount.textContent = format(state.signal); rateLabel.textContent = format(rate()); clickLabel.textContent = format(clickPower());
    const goals = [24, 40, 150, 700, 2000, 10000, 50000, 100000];
    const goal = goals.find(g => state.lifetime < g) || 1000000;
    $('nextGoal').textContent = `${format(goal)} signal`; $('goalFill').style.width = `${Math.min(100, state.lifetime / goal * 100)}%`;
    $('cycleNumber').textContent = String(state.echoes + 1).padStart(2, '0');
    $('cycleName').textContent = state.echoes ? 'A NEW TRANSMISSION' : 'THE FIRST PING';
    $('resonanceFill').style.width = `${Math.min(100, (state.signal % 100) / 100 * 100)}%`; $('resonanceText').textContent = `${Math.floor(state.signal % 100)}%`;
    document.querySelectorAll('.frequency-card').forEach(button => button.classList.toggle('active', button.dataset.frequency === state.frequency));
    $('skyText').textContent = phases[state.phase].line;
    const seconds = Math.max(0, 60 - Math.floor((Date.now() - state.phaseAt) / 1000)); $('skyTimer').textContent = `SHIFT IN ${seconds}S`;
    const mission = activeMission();
    if (mission) {
      $('missionNumber').textContent = String(state.mission + 1).padStart(2, '0'); $('missionTitle').textContent = mission.title; $('missionDescription').textContent = mission.description;
      $('missionReward').textContent = format(mission.reward); $('missionProgress').textContent = `${format(Math.min(missionProgress(mission), mission.target))} / ${format(mission.target)}`;
      $('missionFill').style.width = `${Math.min(100, missionProgress(mission) / mission.target * 100)}%`;
    } else { $('missionTitle').textContent = 'The station is yours'; $('missionDescription').textContent = 'Keep the signal alive. There is always more to hear.'; $('missionProgress').textContent = 'COMPLETE'; $('missionFill').style.width = '100%'; }
    $('echoCount').textContent = state.echoes; $('echoList').innerHTML = '';
    $('fragmentCount').textContent = `${state.fragments.length} / ${memories.length} FOUND`;
    if (!state.fragments.length) { const empty = document.createElement('span'); empty.className = 'empty-echo'; empty.textContent = 'Tune to clear sky when it is in phase. A memory may answer.'; $('echoList').append(empty); }
    state.fragments.slice().reverse().forEach(fragment => { const chip = document.createElement('span'); chip.className = 'echo-token'; chip.textContent = `✧ ${fragment}`; $('echoList').append(chip); });
    renderMilestones();
    const transmit = $('transmitButton'), canTransmit = state.signal >= 100000;
    transmit.disabled = !canTransmit; transmit.classList.toggle('ready', canTransmit);
    transmit.querySelector('.transmit-cost').textContent = canTransmit ? `${Math.max(1, Math.floor(state.signal / 100000))} ECHO${state.signal >= 200000 ? 'ES' : ''} AVAILABLE` : `${format(100000 - state.signal)} SIGNAL TO GO`;
    $('soundButton').innerHTML = `♫<span class="sound-label">SOUND ${state.sound ? 'ON' : 'OFF'}</span>`;
    renderUpgrades(); checkMission();
  }
  function checkMission() {
    const mission = activeMission(); if (!mission || missionProgress(mission) < mission.target || state.missionClaimed === state.mission) return;
    state.missionClaimed = state.mission; addSignal(mission.reward); toast(`Field note complete: +${format(mission.reward)} signal`); playTone(680, .18);
    state.mission++; state.missionClaimed = -1;
  }

  const voiceLines = [
    '“I used to leave the porch light on. Just in case.”',
    '“There are still stars over the water. I checked.”',
    '“If you can hear this, the garden is growing wild.”',
    '“I saved you a seat by the window.”',
    '“Tell the moon we said hello.”',
    '“We kept the radio on for you.”',
    '“The quiet was never empty. Not really.”',
    '“I made a paper boat. It got farther than I did.”',
    '“The bread is cooling. Come home before it does.”',
    '“I followed the footprints until they met the tide.”',
    '“Your name is still under the desk. I never erased it.”',
    '“The first snow came early. The dog loved it.”',
    '“The fair closed, but I can still hear the carousel.”',
    '“The lighthouse kept blinking after the ships were gone.”',
    '“We are all coming home. Just taking the long way.”'
  ]; 
  function updateVoice() {
    const index = Math.min(voiceLines.length - 1, state.fragments.length);
    $('storyText').textContent = voiceLines[index];
    const eyebrow = document.querySelector('.story-card .eyebrow');
    if (eyebrow) eyebrow.textContent = `INCOMING · FRAGMENT ${String(index + 1).padStart(2, '0')}`;
  }
  function buy(item) {
    const price = cost(item);
    if (state.lifetime < item.unlock || state.signal < price) return;
    state.signal -= price; state.upgrades[item.id]++;
    playTone(310 + state.upgrades[item.id] * 16, .1);
    toast(`${item.name} is listening now.`); render(); save();
  }
  function pulse() {
    const gain = clickPower(); addSignal(gain); state.pulses++;
    const stage = $('coreStage'); stage.classList.remove('pulsing'); void stage.offsetWidth; stage.classList.add('pulsing');
    const button = $('pulseButton'), rect = button.getBoundingClientRect();
    const pop = document.createElement('span'); pop.className = 'pulse-pop'; pop.textContent = `+${format(gain)}`;
    pop.style.left = `${rect.left + rect.width / 2}px`; pop.style.top = `${rect.top + 10}px`; document.body.append(pop); setTimeout(() => pop.remove(), 950);
    playTone(state.frequency === 'clear' ? 600 : state.frequency === 'deep' ? 240 : 420, .09);
    if (state.frequency === 'clear' && state.phase === 2 && Math.random() < .085 && state.fragments.length < memories.length) {
      const memory = memories.find(item => !state.fragments.includes(item));
      if (memory) { state.fragments.push(memory); addSignal(Math.max(5, gain * 5)); updateVoice(); toast(`Memory ${state.fragments.length}/${memories.length} recovered: ${memory}.`); playTone(840, .23); }
    }
    render();
  }
  function chooseFrequency(frequency) { if (!frequencies.includes(frequency)) return; state.frequency = frequency; toast(`${frequency === 'warm' ? 'Warmth' : frequency === 'deep' ? 'Deep space' : 'Clear sky'} tuned in.`); playTone(frequency === 'warm' ? 470 : frequency === 'deep' ? 260 : 680, .12); render(); save(); }
  function openTransmission() {
    if (state.signal < 100000) return;
    const gain = Math.max(1, Math.floor(state.signal / 100000)); $('modalEchoGain').textContent = `+${gain} ECHO${gain > 1 ? 'ES' : ''}`; $('modalBackdrop').classList.add('open'); $('modalBackdrop').setAttribute('aria-hidden', 'false');
  }
  function closeTransmission() { $('modalBackdrop').classList.remove('open'); $('modalBackdrop').setAttribute('aria-hidden', 'true'); }
  function transmit() {
    if (state.signal < 100000) return;
    const gained = Math.max(1, Math.floor(state.signal / 100000)); state.echoes += gained;
    state.signal = 0; state.lifetime = 0; state.upgrades = Object.fromEntries(upgrades.map(item => [item.id, 0])); state.pulses = 0; state.mission = 0; state.missionClaimed = -1; state.phase = 0; state.phaseAt = Date.now(); state.frequency = 'warm';
    closeTransmission(); updateVoice(); render(); save(); toast(`Transmission sent. ${gained} new echo${gained > 1 ? 'es' : ''} will guide you.`); playTone(180, .35);
  }
  $('pulseButton').addEventListener('click', pulse);
  document.querySelectorAll('.frequency-card').forEach(button => button.addEventListener('click', () => chooseFrequency(button.dataset.frequency)));
  $('transmitButton').addEventListener('click', openTransmission);
  $('modalClose').addEventListener('click', closeTransmission); $('modalCancel').addEventListener('click', closeTransmission); $('modalConfirm').addEventListener('click', transmit);
  $('modalBackdrop').addEventListener('click', event => { if (event.target === $('modalBackdrop')) closeTransmission(); });
  $('soundButton').addEventListener('click', () => { state.sound = !state.sound; if (state.sound) playTone(520, .1); render(); save(); });
  $('resetButton').addEventListener('click', () => { if (window.confirm('Reset this station and erase all echoes? This cannot be undone.')) { localStorage.removeItem(SAVE_KEY); state = fresh(); updateVoice(); render(); save(); toast('A fresh station. A fresh signal.'); } });
  document.addEventListener('keydown', event => { if ((event.code === 'Space' || event.code === 'Enter') && !['BUTTON', 'INPUT'].includes(document.activeElement.tagName) && !$('modalBackdrop').classList.contains('open')) { event.preventDefault(); pulse(); } if (event.key === 'Escape') closeTransmission(); });

  function tick() {
    const now = Date.now(), delta = Math.min(1, Math.max(0, (now - lastTick) / 1000)); lastTick = now;
    const drift = rate() * delta; if (drift > 0) addSignal(drift);
    if (now - state.phaseAt >= 60000) { const turns = Math.floor((now - state.phaseAt) / 60000); state.phase = (state.phase + turns) % 3; state.phaseAt += turns * 60000; playTone(360 + state.phase * 110, .2); toast(`${phases[state.phase].name} moves into phase.`); }
    render();
    if (now - lastSave > 5000) { save(); lastSave = now; }
  }
  window.addEventListener('beforeunload', save);
  updateVoice(); render(); setInterval(tick, 250); save();
})();
