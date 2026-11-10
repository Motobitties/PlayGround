import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';

(() => {
  const $ = (selector) => document.querySelector(selector);
  const host = $('#fpsHost');
  const canvas = $('#fpsCanvas');
  if (!host || !canvas) return;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#252b2b');
  scene.fog = new THREE.Fog('#252b2b', 14, 38);
  const camera = new THREE.PerspectiveCamera(73, 1, 0.05, 70);
  camera.rotation.order = 'YXZ';
  camera.position.set(0, 1.64, 7.5);
  scene.add(camera);

  const clock = new THREE.Clock();
  const raycaster = new THREE.Raycaster();
  const targets = [];
  const keys = new Set();
  const world = new THREE.Group();
  scene.add(world);

  let equipped = null;
  let ammo = 0;
  let maxAmmo = 0;
  let score = 0;
  let best = Number(localStorage.getItem('cursedBest') || 0);
  let lastShot = 0;
  let reloading = false;
  let soundOn = false;
  let audioContext = null;
  let yaw = 0;
  let pitch = 0;
  let recoil = 0;
  let muzzleTime = 0;
  let lastHit = 0;
  let bobTime = 0;
  let hudTimer;
  let weaponGroup;
  let magazine;
  let muzzleLight;
  let muzzleFlash;
  let gameStarted = false;

  const mat = (color, roughness = 0.8, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
  const materials = {
    concrete: mat('#777b75', 0.94), darkConcrete: mat('#343a39', 0.88), wall: mat('#4e5653', 0.86),
    steel: mat('#343b3c', 0.48, 0.72), steelLight: mat('#6b7472', 0.42, 0.68), black: mat('#171b1b', 0.55, 0.32),
    rubber: mat('#202322', 0.98), yellow: mat('#d4b643', 0.72), paper: mat('#d7d2c2', 0.95),
    targetInk: mat('#303434', 0.96), targetRed: mat('#a94335', 0.9), glow: new THREE.MeshBasicMaterial({ color: '#f0d99c' })
  };

  function proceduralTexture(base, fleck, seed = 1) {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const g = c.getContext('2d'); g.fillStyle = base; g.fillRect(0, 0, 256, 256);
    let n = seed;
    const rand = () => { n = (n * 1664525 + 1013904223) >>> 0; return n / 4294967296; };
    for (let i = 0; i < 1800; i++) {
      g.globalAlpha = rand() * 0.22;
      g.fillStyle = fleck;
      const x = rand() * 256, y = rand() * 256, s = 1 + rand() * 3;
      g.fillRect(x, y, s, s);
    }
    g.globalAlpha = 1;
    const texture = new THREE.CanvasTexture(c);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  function box(parent, size, position, material, cast = true, receive = true) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
    mesh.position.set(...position); mesh.castShadow = cast; mesh.receiveShadow = receive;
    parent.add(mesh); return mesh;
  }

  function cylinder(parent, radiusTop, radiusBottom, height, position, material, segments = 20, rotation = [0, 0, 0]) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments), material);
    mesh.position.set(...position); mesh.rotation.set(...rotation); mesh.castShadow = true;
    parent.add(mesh); return mesh;
  }

  function addStrip(parent, size, position, color, rotation = [0, 0, 0]) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), new THREE.MeshBasicMaterial({ color }));
    mesh.position.set(...position); mesh.rotation.set(...rotation); parent.add(mesh); return mesh;
  }

  function buildRoom() {
    const floorTexture = proceduralTexture('#646965', '#d2d0bd', 82);
    floorTexture.repeat.set(8, 14);
    const floorMat = new THREE.MeshStandardMaterial({ map: floorTexture, roughness: 0.95, metalness: 0.02 });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(18, 38), floorMat);
    floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, -4); floor.receiveShadow = true; world.add(floor);
    const wallTexture = proceduralTexture('#46504d', '#a8aca0', 319); wallTexture.repeat.set(7, 3);
    const wallMat = new THREE.MeshStandardMaterial({ map: wallTexture, roughness: 0.92 });
    box(world, [18, 7, .35], [0, 3.5, -14], wallMat);
    box(world, [.35, 7, 38], [-9, 3.5, -4], wallMat);
    box(world, [.35, 7, 38], [9, 3.5, -4], wallMat);
    box(world, [18, .24, 38], [0, 7, -4], materials.darkConcrete, false);
    box(world, [18, .12, .5], [0, .08, 12], materials.yellow, false);
    for (let lane = -7.5; lane <= 7.5; lane += 3) {
      addStrip(world, [.035, .006, 30], [lane, .006, -3.5], '#aaa996');
      addStrip(world, [.07, .012, 2.4], [lane, .012, 9.5], '#d6bc57');
    }
    for (const z of [-12, -8, -4, 0, 4]) {
      box(world, [18, .18, .18], [0, 6.05, z], materials.steel);
      box(world, [.08, .42, .08], [-8.45, 5.77, z], materials.steelLight);
      box(world, [.08, .42, .08], [8.45, 5.77, z], materials.steelLight);
    }
    // lane dividers and scuffed acoustic baffles
    for (const x of [-6, -3, 0, 3, 6]) {
      box(world, [.11, 1.5, 15], [x, .78, -2.5], materials.darkConcrete);
      box(world, [.13, .05, 15], [x, 1.53, -2.5], materials.yellow);
    }
    for (const x of [-6, -2, 2, 6]) {
      box(world, [2.4, .18, 1.2], [x, 6.4, -4], materials.steel);
      const lamp = new THREE.Mesh(new THREE.BoxGeometry(1.7, .045, .48), materials.glow);
      lamp.position.set(x, 6.27, -4); world.add(lamp);
      const light = new THREE.PointLight('#ffe8b1', 17, 8, 2);
      light.position.set(x, 5.95, -4); world.add(light);
    }
    // backstop panels and restrained range signage
    for (const x of [-7.4, -3.7, 0, 3.7, 7.4]) {
      box(world, [3.2, 2.7, .22], [x, 3.35, -13.72], materials.darkConcrete);
      box(world, [2.9, .06, .08], [x, 4.65, -13.55], materials.yellow);
    }
    const ambient = new THREE.HemisphereLight('#d5ddd8', '#292d2b', 1.15); scene.add(ambient);
    const key = new THREE.DirectionalLight('#fff0d4', 2.5); key.position.set(-5, 10, 4); key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024); key.shadow.camera.left = -12; key.shadow.camera.right = 12;
    key.shadow.camera.top = 12; key.shadow.camera.bottom = -12; key.shadow.bias = -0.0004; scene.add(key);
  }

  function createTarget(x, z, phase) {
    const group = new THREE.Group(); group.position.set(x, 0, z); group.userData.phase = phase;
    const post = box(group, [.055, 1.05, .055], [0, .56, 0], materials.steel, true, true);
    const foot = box(group, [.58, .08, .4], [0, .08, .1], materials.rubber);
    const board = new THREE.Mesh(new THREE.BoxGeometry(.72, 1.02, .055), materials.paper);
    board.position.set(0, 1.55, 0); board.castShadow = true; board.receiveShadow = true; board.userData.target = group; group.add(board);
    const circle = cylinder(group, .31, .31, .012, [0, 1.58, .036], materials.targetInk, 48, [Math.PI / 2, 0, 0]); circle.userData.target = group;
    const ring1 = cylinder(group, .225, .225, .014, [0, 1.58, .047], materials.paper, 48, [Math.PI / 2, 0, 0]); ring1.userData.target = group;
    const ring2 = cylinder(group, .145, .145, .016, [0, 1.58, .058], materials.targetRed, 48, [Math.PI / 2, 0, 0]); ring2.userData.target = group;
    const bull = cylinder(group, .06, .06, .018, [0, 1.58, .071], materials.paper, 32, [Math.PI / 2, 0, 0]); bull.userData.target = group;
    const outer = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(.72, 1.02, .055)), new THREE.LineBasicMaterial({ color: '#79786d' }));
    outer.position.copy(board.position); group.add(outer);
    group.userData.board = board; group.userData.hitMeshes = [board, circle, ring1, ring2, bull];
    group.userData.homeX = x; group.userData.active = true; group.userData.respawn = 0; group.userData.points = 0;
    world.add(group); targets.push(group);
    return group;
  }

  function buildRangeTargets() {
    targets.splice(0, targets.length);
    for (let i = 0; i < 5; i++) {
      const x = (i - 2) * 3.05;
      createTarget(x, -10.2 - (i % 2) * .3, i * 1.9);
    }
    // overhead carrier rails and target hangers
    box(world, [15, .12, .12], [0, 5.18, -10.1], materials.steel);
    for (const target of targets) box(target, [.32, .055, .08], [0, 2.23, -.04], materials.steelLight);
  }

  function buildWeapon(gun) {
    if (weaponGroup) camera.remove(weaponGroup);
    const dark = new THREE.MeshStandardMaterial({ color: '#242a2b', roughness: .36, metalness: .68 });
    const receiver = new THREE.MeshStandardMaterial({ color: '#343b3c', roughness: .43, metalness: .62 });
    const accent = new THREE.MeshStandardMaterial({ color: gun?.color || '#c5c6b7', roughness: .42, metalness: .42 });
    const polymer = new THREE.MeshStandardMaterial({ color: '#181c1d', roughness: .88, metalness: .06 });
    weaponGroup = new THREE.Group(); weaponGroup.position.set(.32, -.31, -.57); camera.add(weaponGroup);
    const rifle = new THREE.Group(); weaponGroup.add(rifle);
    box(rifle, [.18, .17, .46], [0, 0, -.02], receiver, true, false);
    box(rifle, [.19, .035, .42], [0, .101, -.04], dark, true, false);
    box(rifle, [.205, .025, .24], [0, -.085, -.02], dark, true, false);
    cylinder(rifle, .033, .04, .56, [0, .01, -.49], dark, 20, [Math.PI / 2, 0, 0]);
    cylinder(rifle, .049, .045, .09, [0, .01, -.8], receiver, 24, [Math.PI / 2, 0, 0]);
    cylinder(rifle, .018, .018, .09, [0, .01, -.85], polymer, 20, [Math.PI / 2, 0, 0]);
    // handguard and continuous picatinny rail
    box(rifle, [.22, .13, .34], [0, .005, -.37], dark, true, false);
    for (let i = 0; i < 8; i++) box(rifle, [.232, .012, .022], [0, .078, -.51 + i * .041], accent, false, false);
    box(rifle, [.065, .018, .24], [-.137, .01, -.38], receiver, false, false);
    box(rifle, [.065, .018, .24], [.137, .01, -.38], receiver, false, false);
    // stock, cheek rest, grip, and angled magazine
    box(rifle, [.14, .14, .28], [0, .005, .34], polymer, true, false);
    box(rifle, [.17, .11, .065], [0, .025, .49], receiver, true, false);
    box(rifle, [.09, .16, .11], [0, -.16, .075], polymer, true, false).rotation.x = -.16;
    magazine = box(rifle, [.105, .23, .14], [0, -.27, -.02], polymer, true, false); magazine.rotation.x = -.12;
    box(rifle, [.11, .025, .14], [0, -.384, -.035], dark, false, false);
    // trigger guard and trigger
    const guard = new THREE.Mesh(new THREE.TorusGeometry(.065, .009, 8, 18, Math.PI), dark);
    guard.position.set(0, -.105, -.075); guard.rotation.set(Math.PI / 2, 0, 0); rifle.add(guard);
    box(rifle, [.014, .06, .018], [0, -.075, -.075], accent, false, false);
    // compact red-dot optic and front post
    box(rifle, [.12, .035, .12], [0, .125, -.08], dark, false, false);
    box(rifle, [.09, .075, .085], [0, .17, -.08], receiver, false, false);
    box(rifle, [.075, .012, .01], [0, .171, -.126], accent, false, false);
    box(rifle, [.03, .055, .025], [0, .135, -.62], dark, false, false);
    box(rifle, [.012, .08, .025], [0, .183, -.62], accent, false, false);
    // serialized receiver markings and small controls
    for (const z of [-.03, .015, .06]) cylinder(rifle, .013, .013, .012, [.101, .025, z], accent, 12, [0, 0, Math.PI / 2]);
    box(rifle, [.018, .055, .06], [-.108, .018, .08], accent, false, false);
    muzzleFlash = new THREE.Mesh(new THREE.SphereGeometry(.09, 12, 8), new THREE.MeshBasicMaterial({ color: '#ffd68a', transparent: true, opacity: .9 }));
    muzzleFlash.position.set(0, .01, -.91); muzzleFlash.visible = false; rifle.add(muzzleFlash);
    muzzleLight = new THREE.PointLight('#ffbb65', 0, 3); muzzleLight.position.copy(muzzleFlash.position); rifle.add(muzzleLight);
    weaponGroup.userData.rifle = rifle;
  }

  function resize() {
    const rect = host.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    renderer.setSize(rect.width, rect.height, false);
    camera.aspect = rect.width / rect.height; camera.updateProjectionMatrix();
  }

  function updateHud() {
    $('#ammoCount').textContent = `${String(ammo).padStart(2, '0')} / ${String(maxAmmo).padStart(2, '0')}`;
    $('#scoreCount').textContent = String(score).padStart(4, '0');
    $('#ammoPips').innerHTML = Array.from({ length: maxAmmo }, (_, i) => `<i class="${i >= ammo ? 'spent' : ''}"></i>`).join('');
  }

  function say(message) {
    $('#rangeMessage').textContent = message;
    clearTimeout(hudTimer);
    hudTimer = setTimeout(() => { if (!reloading) $('#rangeMessage').textContent = 'LIVE FIRE · PAPER TARGETS ONLY'; }, 1700);
  }

  function equip(gun) {
    equipped = gun; maxAmmo = Math.max(6, Math.min(14, Math.round(7 + gun.fire / 13))); ammo = maxAmmo;
    score = 0; reloading = false; gameStarted = true;
    $('#reloadButton').disabled = false;
    $('#rangeOverlay').classList.add('hidden');
    $('#fpsWelcome').classList.remove('show');
    buildWeapon(gun); buildRangeTargets(); updateHud();
    $('#rangeMessage').textContent = 'LIVE FIRE · PAPER TARGETS ONLY';
    say('LIVE FIRE · PAPER TARGETS ONLY');
  }

  function audio() {
    if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === 'suspended') audioContext.resume();
    return audioContext;
  }

  function noiseBurst(ctx, time, duration, cutoff, gain, decay = 8) {
    const length = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    const source = ctx.createBufferSource(); source.buffer = buffer;
    const filter = ctx.createBiquadFilter(); filter.type = 'highpass'; filter.frequency.value = cutoff;
    const volume = ctx.createGain(); volume.gain.setValueAtTime(gain, time); volume.gain.exponentialRampToValueAtTime(.001, time + duration);
    source.connect(filter).connect(volume).connect(ctx.destination); source.start(time);
  }

  function shotSound() {
    if (!soundOn) return;
    const ctx = audio(), now = ctx.currentTime;
    // A designed arcade report: sharp broadband crack, low pressure thump, and short indoor reflection.
    noiseBurst(ctx, now, .11, 850, .72, 4.5);
    noiseBurst(ctx, now + .012, .2, 110, .42, 3.2);
    const thump = ctx.createOscillator(), envelope = ctx.createGain();
    thump.type = 'sine'; thump.frequency.setValueAtTime(105 + Math.random() * 22, now);
    thump.frequency.exponentialRampToValueAtTime(38, now + .16);
    envelope.gain.setValueAtTime(.48, now); envelope.gain.exponentialRampToValueAtTime(.001, now + .19);
    thump.connect(envelope).connect(ctx.destination); thump.start(now); thump.stop(now + .2);
    noiseBurst(ctx, now + .095, .22, 380, .12, 5.5);
  }

  function mechanicalSound(kind = 'click') {
    if (!soundOn) return;
    const ctx = audio(), now = ctx.currentTime;
    noiseBurst(ctx, now, kind === 'rack' ? .13 : .045, kind === 'rack' ? 350 : 900, kind === 'rack' ? .22 : .16, 6);
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.type = 'triangle'; osc.frequency.setValueAtTime(kind === 'rack' ? 155 : 260, now);
    osc.frequency.exponentialRampToValueAtTime(65, now + .07);
    gain.gain.setValueAtTime(.13, now); gain.gain.exponentialRampToValueAtTime(.001, now + .08);
    osc.connect(gain).connect(ctx.destination); osc.start(now); osc.stop(now + .09);
  }

  function beginReload() {
    if (!equipped || reloading || ammo === maxAmmo) return;
    reloading = true; $('#reloadButton').disabled = true;
    $('#fpsHost').classList.add('is-reloading');
    $('#rangeMessage').textContent = 'RELOADING · COVER YOUR LANE';
    mechanicalSound('click');
    setTimeout(() => mechanicalSound('rack'), 260);
    setTimeout(() => mechanicalSound('click'), 640);
    setTimeout(() => {
      ammo = maxAmmo; reloading = false; $('#fpsHost').classList.remove('is-reloading');
      $('#reloadButton').disabled = false; updateHud(); say('MAGAZINE SEATED · READY');
    }, 850);
  }

  function hitTest() {
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    const active = targets.filter(t => t.userData.active).flatMap(t => t.userData.hitMeshes);
    const hit = raycaster.intersectObjects(active, false)[0];
    if (!hit) { say('MISS · CHECK YOUR SIGHT PICTURE'); return; }
    const target = hit.object.userData.target;
    const local = target.worldToLocal(hit.point.clone());
    const radius = Math.hypot(local.x, local.y - 1.58);
    const points = radius < .065 ? 100 : radius < .16 ? 50 : radius < .25 ? 25 : 10;
    target.userData.active = false; target.userData.respawn = performance.now() + 1150;
    target.userData.points = points; target.userData.board.material = mat('#8d6856', .92);
    score += points; updateHud();
    if (score > best) { best = score; localStorage.setItem('cursedBest', String(best)); $('#bestScore').textContent = `BEST: ${String(best).padStart(4, '0')}`; }
    lastHit = performance.now(); say(`PAPER HIT · +${points} · ${radius < .065 ? 'CENTER RING' : 'SCORE RECORDED'}`);
    mechanicalSound('click');
  }

  function fire() {
    if (!equipped || !document.pointerLockElement || reloading) return;
    const now = performance.now();
    if (now - lastShot < Math.max(120, 650 - equipped.fire * 4)) return;
    lastShot = now;
    if (ammo <= 0) { say('EMPTY · PRESS R TO RELOAD'); mechanicalSound('click'); return; }
    ammo--; updateHud(); shotSound(); recoil = Math.min(.13, recoil + .075); muzzleTime = now + 55;
    hitTest();
    if (ammo === 0) setTimeout(() => { if (!ammo) say('EMPTY · PRESS R TO RELOAD'); }, 500);
  }

  function startRange() {
    if (!gameStarted) { $('#fpsWelcome').classList.add('show'); return; }
    host.requestPointerLock?.();
    audio();
  }

  function onMouseMove(event) {
    if (!document.pointerLockElement) return;
    yaw -= event.movementX * .0018;
    pitch = THREE.MathUtils.clamp(pitch - event.movementY * .0016, -1.05, 1.05);
    camera.rotation.set(pitch, yaw, 0);
  }

  function onKeyDown(event) {
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code) && document.pointerLockElement) event.preventDefault();
    keys.add(event.code);
    if (event.code === 'KeyR' && !event.repeat) beginReload();
    if (event.code === 'Space' && !event.repeat) fire();
  }

  function onKeyUp(event) { keys.delete(event.code); }

  function updateMovement(dt) {
    if (!document.pointerLockElement) return;
    const speed = keys.has('ShiftLeft') ? 1.65 : 3.1;
    const forward = Number(keys.has('KeyW') || keys.has('ArrowUp')) - Number(keys.has('KeyS') || keys.has('ArrowDown'));
    const side = Number(keys.has('KeyD') || keys.has('ArrowRight')) - Number(keys.has('KeyA') || keys.has('ArrowLeft'));
    const length = Math.hypot(forward, side) || 1;
    const dx = (Math.sin(yaw) * forward + Math.cos(yaw) * side) * speed * dt / length;
    const dz = (-Math.cos(yaw) * forward + Math.sin(yaw) * side) * speed * dt / length;
    camera.position.x = THREE.MathUtils.clamp(camera.position.x + dx, -8.1, 8.1);
    camera.position.z = THREE.MathUtils.clamp(camera.position.z + dz, -1.1, 9.2);
    if (forward || side) bobTime += dt * (keys.has('ShiftLeft') ? 11 : 8);
  }

  function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), .04), now = performance.now();
    updateMovement(dt);
    for (const target of targets) {
      target.position.x = target.userData.homeX + Math.sin(now * .00045 + target.userData.phase) * .34;
      if (!target.userData.active && now >= target.userData.respawn) {
        target.userData.active = true; target.userData.board.material = materials.paper;
      }
      target.visible = target.userData.active;
    }
    recoil = Math.max(0, recoil - dt * .48);
    if (weaponGroup) {
      const moving = document.pointerLockElement && (keys.has('KeyW') || keys.has('KeyA') || keys.has('KeyS') || keys.has('KeyD'));
      weaponGroup.position.y = -.31 + (moving ? Math.sin(bobTime) * .009 : Math.sin(now * .0017) * .002) - recoil * .38;
      weaponGroup.position.x = .32 + (moving ? Math.cos(bobTime * .5) * .008 : 0);
      weaponGroup.rotation.x = recoil * 1.9;
      const flash = now < muzzleTime;
      muzzleFlash.visible = flash;
      muzzleLight.intensity = flash ? 3.5 : 0;
      if (flash) muzzleFlash.scale.setScalar(.8 + Math.random() * .8);
    }
    if (reloading && magazine) magazine.position.y = -.27 - Math.sin(Math.min(1, (now % 850) / 850 * Math.PI) * Math.PI) * .12;
    renderer.render(scene, camera);
  }

  function setSound(enabled) { soundOn = enabled; if (enabled) audio(); }

  $('#fpsStart').addEventListener('click', startRange);
  host.addEventListener('click', () => { if (!document.pointerLockElement) startRange(); else fire(); });
  $('#reloadButton').addEventListener('click', beginReload);
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);
  document.addEventListener('pointerlockchange', () => {
    const locked = Boolean(document.pointerLockElement);
    $('#fpsWelcome').classList.toggle('show', gameStarted && !locked);
    $('#fpsHost').classList.toggle('is-playing', locked);
  });
  window.addEventListener('resize', resize);
  window.addEventListener('blur', () => keys.clear());

  buildRoom(); buildRangeTargets(); resize();
  window.CursedFPS = { equip, setSound, start: startRange };
  animate();
})();
