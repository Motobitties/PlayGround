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
    { id: 'array', name: 'Deep-space array', icon: '✧', desc: 'Listen between the stars · +12 drift/sec', base: 1100, effect: 'rate', amount: 12, unlock: 700 }
  ];
  const missions = [
    { title: 'A voice in the dark', description: 'Send 12 pulses to make the old dish hum.', type: 'pulses', target: 12, reward: 12 },
    { title: 'A second pair of ears', description: 'Build 3 listening posts for the station.', type: 'relay', target: 3, reward: 55 },
    { title: 'Keep the porch light on', description: 'Gather 250 signal. Someone may be watching.', type: 'lifetime', target: 250, reward: 90 },
    { title: 'Let the choir answer', description: 'Build 2 night choirs and fill the silence.', type: 'choir', target: 2, reward: 180 },
    { title: 'Reflect what remains', description: 'Build 2 moon mirrors to focus your pulse.', type: 'mirror', target: 2, reward: 400 },
    { title: 'A signal beyond the moon', description: 'Gather 2,000 signal. The reply is getting closer.', type: 'lifetime', target: 2000, reward: 900 },
    { title: 'The sky has a voice', description: 'Build 2 deep-space arrays. Find out who it belongs to.', type: 'array', target: 2, reward: 2200 }
  ];
  const fresh = () => ({ signal: 0, lifetime: 0, echoes: 0, upgrades: { relay: 0, choir: 0, mirror: 0, array: 0 }, pulses: 0, mission: 0, missionClaimed: -1, frequency: 'warm', phase: 0, phaseAt: Date.now(), lastSave: Date.now(), fragments: [], sound: false });
  let state = fresh();
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
    if (saved && typeof saved === 'object') {
      state = { ...fresh(), ...saved, upgrades: { ...fresh().upgrades, ...(saved.upgrades || {}) }, fragments: Array.isArray(saved.fragments) ? saved.fragments.slice(-5) : [] };
      state.signal = Math.max(0, Number(state.signal) || 0);
      state.lifetime = Math.max(state.signal, Number(state.lifetime) || 0);
      state.echoes = Math.max(0, Math.floor(Number(state.echoes) || 0));
      state.mission = Math.max(0, Math.floor(Number(state.mission) || 0));
      state.pulses = Math.max(0, Math.floor(Number(state.pulses) || 0));
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
  function rate() { return getBaseRate() * echoMultiplier() * (state.frequency === 'deep' && state.phase === 1 ? 1.2 : 1); }
  function clickPower() { return (1 + state.upgrades.mirror * 2) * echoMultiplier() * (state.frequency === 'warm' && state.phase === 0 ? 1.25 : 1); }
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
  function render() {
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
    if (!state.fragments.length) { const empty = document.createElement('span'); empty.className = 'empty-echo'; empty.textContent = 'Your first echo is waiting in the noise.'; $('echoList').append(empty); }
    state.fragments.slice().reverse().forEach(fragment => { const chip = document.createElement('span'); chip.className = 'echo-token'; chip.textContent = `✧ ${fragment}`; $('echoList').append(chip); });
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
    '“The quiet was never empty. Not really.”'
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
    if (state.frequency === 'clear' && state.phase === 2 && Math.random() < .045 && state.fragments.length < 5) {
      const available = ['a blue thread', 'the smell of rain', 'someone humming', 'a window left open', 'the color of home'];
      const memory = available.find(item => !state.fragments.includes(item));
      if (memory) { state.fragments.push(memory); addSignal(Math.max(5, gain * 5)); updateVoice(); toast(`An echo found you: ${memory}.`); playTone(840, .23); }
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
    state.signal = 0; state.lifetime = 0; state.upgrades = { relay: 0, choir: 0, mirror: 0, array: 0 }; state.pulses = 0; state.mission = 0; state.missionClaimed = -1; state.phase = 0; state.phaseAt = Date.now(); state.frequency = 'warm';
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
