(() => {
  const $ = (s) => document.querySelector(s);
  const blueprints = [
    { id: 'peashooter', name: 'Peashooter', type: 'POCKET CLASS', glyph: '◉', color: '#d8f047', fire: 48, chaos: 17, accuracy: 86, weird: 34, shape: 'pistol', flavor: 'Small, polite, and deeply underqualified.' },
    { id: 'spud', name: 'Spud Cannon', type: 'ROOT VEGETABLE', glyph: '✳', color: '#ff7955', fire: 28, chaos: 36, accuracy: 69, weird: 53, shape: 'cannon', flavor: 'A potato-based argument for poor decisions.' },
    { id: 'raygun', name: 'Raygun 9000', type: 'SPACE JUNK', glyph: '⌁', color: '#8fdcff', fire: 73, chaos: 49, accuracy: 78, weird: 61, shape: 'ray', flavor: 'Recovered from a suspiciously chatty meteor.' },
    { id: 'sock', name: 'Ghost Sock', type: 'HAUNTED LAUNDRY', glyph: '☾', color: '#cf9aff', fire: 39, chaos: 82, accuracy: 55, weird: 89, shape: 'sock', flavor: 'It knows what happened to the other one.' }
  ];
  const namesA = ['Unlicensed', 'Haunted', 'Forbidden', 'Overdue', 'Grandma’s', 'Sentient', 'Budget', 'Suspicious'];
  const namesB = ['Soup Launcher', 'Bad Omen', 'Bonk Machine', 'Panic Button', 'Wobble Maker', 'Shrimp Cannon', 'Oopsinator', 'Doom Kazoo'];
  const verdicts = ['OSHA has left the chat.', 'It passed inspection in a dream.', 'The warranty is already screaming.', 'Technically a musical instrument.', 'Do not feed after midnight.', 'Please stop making eye contact with it.', 'Confidence: questionable. Vibes: immaculate.'];
  let selected = [], current = null, serial = 1, score = 0, best = Number(localStorage.getItem('cursedBest') || 0), ammo = 0, maxAmmo = 0;
  let lastShot = 0, reloading = false, soundOn = false, audio = null, mouse = { x: 550, y: 170 }, shots = [], particles = [], targets = [], lastTime = 0, toastTimer;
  const weaponCanvas = $('#weaponCanvas'), wctx = weaponCanvas.getContext('2d');
  const range = $('#rangeCanvas'), ctx = range.getContext('2d');
  $('#bestScore').textContent = `BEST: ${String(best).padStart(4, '0')}`;

  function renderBlueprints() {
    $('#blueprintList').innerHTML = blueprints.map((b) => `<button class="blueprint-card ${selected.includes(b.id) ? 'selected' : ''}" data-id="${b.id}" aria-pressed="${selected.includes(b.id)}"><span class="card-art" style="color:${b.color}">${b.glyph}</span><span class="card-text"><b>${b.name}</b><span>${b.type}</span></span></button>`).join('');
    document.querySelectorAll('.blueprint-card').forEach(card => card.addEventListener('click', () => toggleBlueprint(card.dataset.id)));
  }
  function toggleBlueprint(id) {
    if (selected.includes(id)) selected = selected.filter(x => x !== id);
    else if (selected.length < 2) selected.push(id);
    else { selected = [selected[1], id]; }
    updateSelection(); renderBlueprints();
  }
  function updateSelection() {
    $('#selectionCount').textContent = `${selected.length} / 2`;
    [0,1].forEach(i => { const b = blueprints.find(x => x.id === selected[i]); $(`#slot${i ? 'Two' : 'One'} b`).textContent = b ? b.name.toUpperCase() : 'EMPTY'; });
    $('#forgeButton').disabled = selected.length !== 2;
  }
  function clamp(n, min=8, max=96) { return Math.max(min, Math.min(max, Math.round(n))); }
  function combine(a, b, prompt='') {
    const words = prompt.toLowerCase();
    let chaos = clamp((a.chaos + b.chaos) / 2 + Math.random()*22 - 7);
    let fire = clamp((a.fire + b.fire) / 2 + Math.random()*18 - 8);
    let accuracy = clamp((a.accuracy + b.accuracy) / 2 + Math.random()*18 - 9);
    if (/chaos|wild|unhinged|cursed|haunt|banana|spooky|weird|soup|shrimp/.test(words)) chaos = clamp(chaos + 19);
    if (/fast|rapid|zoom|speed|turbo/.test(words)) fire = clamp(fire + 18);
    if (/precise|sniper|laser|aim|calm/.test(words)) accuracy = clamp(accuracy + 17);
    if (/slow|heavy|chunky|chonky/.test(words)) fire = clamp(fire - 14);
    const terms = prompt.trim().replace(/[.,!?]+/g,'').split(/\s+/).filter(Boolean);
    const word = terms.length ? terms[Math.floor(Math.random()*terms.length)] : '';
    const adjective = word ? word[0].toUpperCase()+word.slice(1).toLowerCase() : namesA[Math.floor(Math.random()*namesA.length)];
    const weaponName = `${adjective} ${namesB[Math.floor(Math.random()*namesB.length)]}`;
    const type = chaos > 75 ? 'REALITY-ADJACENT' : fire > 70 ? 'HIGH VELOCITY NONSENSE' : 'UNCLASSIFIED HYBRID';
    const flavor = prompt.trim() ? `Machine interpretation: “${prompt.trim()}.” It took that personally.` : `${a.name} and ${b.name} have made an unholy little compromise.`;
    const gun = { name: weaponName, type, fire, chaos, accuracy, weird: clamp((chaos + (100-accuracy))/2 + Math.random()*20), color: chaos > 70 ? '#d8f047' : b.color, shape: b.shape, parentA: a, parentB: b, flavor, curse: clamp(chaos*.72 + b.weird*.22 + Math.random()*22), prompt: prompt.trim() };
    showWeapon(gun);
  }
  function showWeapon(g) {
    current = g;
    const stage = $('#weaponStage'); stage.classList.add('has-weapon'); stage.classList.remove('forge-flash'); void stage.offsetWidth; stage.classList.add('forge-flash');
    $('#stageSpecimen').textContent = `CA-${String(serial).padStart(3,'0')}`;
    $('#curseIndex').innerHTML = `${g.curse}<small>%</small>`;
    $('#weaponStamp').textContent = `CA-${String(serial).padStart(3,'0')} / FIELD-TESTABLE`;
    $('#weaponType').textContent = g.type;
    $('#weaponName').textContent = g.name;
    $('#weaponDesc').textContent = g.flavor;
    $('#safetyVerdict').textContent = verdicts[Math.floor(Math.random()*verdicts.length)];
    const values = [g.fire,g.chaos,g.accuracy,g.weird];
    const rows = [...document.querySelectorAll('.stat-row')];
    rows.forEach((row,i) => { row.querySelector('i').style.width = `${values[i]}%`; row.querySelector('b').textContent = `${values[i]}%`; });
    $('#testButton').disabled = false;
    serial++;
    renderWeapon(g);
    equip(g);
    toast(`${g.name.toUpperCase()} HAS ENTERED THE CHAT`);
    if (soundOn) beep(240, .08, 'sawtooth');
  }
  function renderWeapon(g) {
    const c=wctx; c.clearRect(0,0,720,320); c.save(); c.translate(360,165);
    const glow=g.color;
    c.shadowColor=glow; c.shadowBlur=22;
    // exaggerated, deliberately impossible arcade blaster silhouette
    c.fillStyle='#242720'; c.strokeStyle='#d9dfbd'; c.lineWidth=3;
    c.beginPath(); c.moveTo(-224,-31); c.lineTo(-131,-36); c.lineTo(-112,-63); c.lineTo(99,-63); c.lineTo(120,-43); c.lineTo(222,-40); c.lineTo(257,-25); c.lineTo(257,15); c.lineTo(216,26); c.lineTo(104,27); c.lineTo(84,46); c.lineTo(25,49); c.lineTo(7,119); c.lineTo(-45,119); c.lineTo(-69,44); c.lineTo(-158,34); c.lineTo(-224,12); c.closePath(); c.fill(); c.stroke();
    c.shadowBlur=0;
    // color rails and receiver details
    c.fillStyle=glow; c.globalAlpha=.88; c.beginPath(); c.moveTo(-180,-26);c.lineTo(84,-51);c.lineTo(106,-30);c.lineTo(-140,-8);c.closePath();c.fill(); c.globalAlpha=1;
    c.fillStyle='#171914'; c.fillRect(-75,-19,141,34); c.strokeStyle='#73776a'; c.lineWidth=2; c.strokeRect(-75,-19,141,34);
    for(let i=0;i<5;i++){c.fillStyle=i%2? '#6c7061':glow;c.fillRect(-55+i*22,-12,9,20)}
    // impossible stock and grip
    c.fillStyle='#34382e'; c.beginPath();c.moveTo(-150,13);c.lineTo(-218,18);c.lineTo(-248,0);c.lineTo(-239,-23);c.lineTo(-176,-28);c.closePath();c.fill();c.stroke();
    c.fillStyle='#282b24'; c.beginPath();c.moveTo(6,29);c.lineTo(73,24);c.lineTo(52,105);c.lineTo(4,114);c.lineTo(-18,50);c.closePath();c.fill();c.stroke();
    // muzzle, chosen to feel delightfully wrong
    c.fillStyle='#c9ccae';c.strokeStyle='#dfe3c5'; c.beginPath();c.moveTo(222,-40);c.lineTo(270,-54);c.lineTo(297,-42);c.lineTo(288,-14);c.lineTo(261,-9);c.lineTo(257,15);c.lineTo(219,18);c.closePath();c.fill();c.stroke();
    c.fillStyle='#141510';c.beginPath();c.ellipse(281,-31,10,8,-.4,0,Math.PI*2);c.fill();
    // cursed attachment, varying by source
    c.strokeStyle=glow;c.fillStyle=glow;
    if(g.shape==='sock') { c.globalAlpha=.95;c.beginPath();c.moveTo(19,-61);c.bezierCurveTo(8,-94,51,-105,66,-81);c.lineTo(84,-65);c.lineTo(49,-59);c.closePath();c.fill();c.globalAlpha=1;c.fillStyle='#27231e';c.fillRect(39,-79,9,4);c.fillRect(56,-77,9,4); }
    else if(g.shape==='cannon') { c.lineWidth=7;c.beginPath();c.arc(-6,-56,30,Math.PI,Math.PI*2);c.stroke();c.fillStyle='#ff7955';c.beginPath();c.arc(-6,-84,5,0,Math.PI*2);c.fill(); }
    else if(g.shape==='ray') { c.lineWidth=4;c.beginPath();c.moveTo(15,-63);c.lineTo(45,-104);c.lineTo(75,-62);c.moveTo(45,-102);c.lineTo(45,-71);c.stroke();c.fillStyle='#e2fbff';c.beginPath();c.arc(45,-103,7,0,Math.PI*2);c.fill(); }
    else { c.fillStyle=glow;c.beginPath();c.arc(5,-78,9,0,Math.PI*2);c.fill();c.fillRect(1,-94,8,24); }
    // a dangling, haunted charm
    c.strokeStyle='#a1a48e';c.lineWidth=2;c.beginPath();c.moveTo(-118,33);c.quadraticCurveTo(-144,60,-123,77);c.stroke();c.fillStyle=glow;c.beginPath();c.arc(-122,81,7,0,Math.PI*2);c.fill();
    c.font='bold 11px monospace';c.fillStyle='#e7e8d5';c.fillText('???',-35,40);
    c.restore();
  }
  function equip(g) {
    if (window.CursedFPS) window.CursedFPS.equip(g);
  }
  function updateAmmo() { $('#ammoCount').textContent=`${String(ammo).padStart(2,'0')} / ${String(maxAmmo).padStart(2,'0')}`; $('#ammoPips').innerHTML=Array.from({length:maxAmmo},(_,i)=>`<i class="${i>=ammo?'spent':''}"></i>`).join(''); }
  function reload() { if(!current||reloading||ammo===maxAmmo)return; reloading=true;$('#rangeMessage').textContent='RELOADING… DON\'T LOOK DIRECTLY AT IT';$('#reloadButton').disabled=true;setTimeout(()=>{ammo=maxAmmo;reloading=false;updateAmmo();$('#rangeMessage').textContent='RELOAD COMPLETE · QUESTIONABLE AS EVER';$('#reloadButton').disabled=false;if(soundOn)beep(380,.14,'triangle')},750); }
  function shoot() {
    if(!current)return;
    const now=performance.now(); if(now-lastShot<Math.max(90,650-current.fire*5)||reloading)return; lastShot=now;
    if(ammo<=0){$('#rangeMessage').textContent='EMPTY. THE GUN IS THINKING.';if(soundOn)beep(95,.08,'square');return}
    ammo--;updateAmmo(); const spread=(100-current.accuracy)*.42+current.chaos*.15; const sx=mouse.x+(Math.random()-.5)*spread, sy=mouse.y+(Math.random()-.5)*spread;
    shots.push({x1:550,y1:300,x2:sx,y2:sy,life:9,color:current.color});
    let hit=null; for(const t of targets){if(!t.alive)continue;const ty=t.y+Math.sin(t.phase)*t.bob;const d=Math.hypot(sx-t.x,sy-ty);if(d<t.r+spread*.18){hit=t;break}}
    if(hit){hit.alive=false;score+=10+Math.round(current.chaos/10);$('#scoreCount').textContent=String(score).padStart(4,'0');$('#rangeMessage').textContent=['NICE SHOT. WEIRDLY.','TARGET DOWN-ish.','THE CARDBOARD NEVER STOOD A CHANCE.','POINTS! THE LAB IS PLEASED.'][Math.floor(Math.random()*4)];for(let i=0;i<12;i++)particles.push({x:hit.x,y:hit.y,vx:(Math.random()-.5)*4,vy:(Math.random()-.5)*4-1,life:30,color:current.color});if(soundOn)beep(540+Math.random()*200,.075,'triangle');
      if(targets.every(t=>!t.alive)){score+=25;$('#scoreCount').textContent=String(score).padStart(4,'0');$('#rangeMessage').textContent='RANGE CLEAR! +25 STYLE POINTS';targets.forEach((t,i)=>{setTimeout(()=>{t.alive=true;t.phase=Math.random()*8},500+i*180)})}
    } else {$('#rangeMessage').textContent=ammo===0?'EMPTY. THE GUN IS THINKING.':'MISS. THE TARGET IS FEELING CONFIDENT.';if(soundOn)beep(180,.05,'sawtooth')}
    if(score>best){best=score;localStorage.setItem('cursedBest',String(best));$('#bestScore').textContent=`BEST: ${String(best).padStart(4,'0')}`}
    if(ammo===0)setTimeout(()=>{if(ammo===0)$('#rangeMessage').textContent='OUT OF AMMO · PRESS R TO RELOAD'},650);
  }
  function drawTarget(t,time){const x=t.x+Math.sin(time*.0006+t.phase)*13, y=t.y+Math.sin(time*.002+t.phase)*t.bob;ctx.save();ctx.translate(x,y);ctx.fillStyle='#a7a38b';ctx.strokeStyle='#383a31';ctx.lineWidth=2;ctx.fillRect(-4,24,8,26);ctx.fillStyle='#d2cbb0';ctx.beginPath();ctx.roundRect(-t.r,-t.r,t.r*2,t.r*2,8);ctx.fill();ctx.stroke();ctx.fillStyle='#36372f';ctx.beginPath();ctx.arc(-7,-3,2.4,0,7);ctx.arc(7,-3,2.4,0,7);ctx.fill();ctx.strokeStyle='#514d40';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,6,6,.2,Math.PI-.2);ctx.stroke();ctx.fillStyle='#ff7955';ctx.fillRect(-2,-t.r-8,4,8);ctx.restore()}
  function drawRange(time,dt){const cw=range.width,ch=range.height;ctx.clearRect(0,0,cw,ch);let grad=ctx.createLinearGradient(0,0,0,ch);grad.addColorStop(0,'#1d211a');grad.addColorStop(1,'#11130f');ctx.fillStyle=grad;ctx.fillRect(0,0,cw,ch);
    // range scenery
    ctx.strokeStyle='#35382c';ctx.lineWidth=1;for(let i=0;i<11;i++){let x=i*cw/10;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,ch);ctx.stroke()}for(let y=42;y<ch;y+=43){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(cw,y);ctx.stroke()}
    ctx.fillStyle='#24271f';ctx.fillRect(0,ch*.76,cw,ch*.24);ctx.strokeStyle='#46483a';ctx.beginPath();ctx.moveTo(0,ch*.76);ctx.lineTo(cw,ch*.76);ctx.stroke();
    targets.forEach(t=>{if(t.alive)drawTarget(t,time)});
    shots=shots.filter(s=>s.life>0);shots.forEach(s=>{ctx.globalAlpha=s.life/9;ctx.strokeStyle=s.color;ctx.lineWidth=2;ctx.shadowColor=s.color;ctx.shadowBlur=9;ctx.beginPath();ctx.moveTo(s.x1,s.y1);ctx.lineTo(s.x2,s.y2);ctx.stroke();ctx.shadowBlur=0;s.life--});ctx.globalAlpha=1;
    particles=particles.filter(p=>p.life>0);particles.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.12;p.life--;ctx.globalAlpha=p.life/30;ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,4,4)});ctx.globalAlpha=1;
    // aim reticle
    const cx=mouse.x,cy=mouse.y;ctx.strokeStyle=current?current.color:'#d8f047';ctx.globalAlpha=.8;ctx.lineWidth=1;ctx.beginPath();ctx.arc(cx,cy,10,0,7);ctx.moveTo(cx-16,cy);ctx.lineTo(cx-5,cy);ctx.moveTo(cx+5,cy);ctx.lineTo(cx+16,cy);ctx.moveTo(cx,cy-16);ctx.lineTo(cx,cy-5);ctx.moveTo(cx,cy+5);ctx.lineTo(cx,cy+16);ctx.stroke();ctx.globalAlpha=1;
    if(current){ // tiny first-person impossible blaster
      ctx.save();ctx.translate(cw*.5,ch+18);ctx.rotate((mouse.x-cw/2)/cw*.2);ctx.fillStyle='#252920';ctx.strokeStyle='#c8ccb1';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-55,18);ctx.lineTo(-40,-31);ctx.lineTo(36,-31);ctx.lineTo(56,0);ctx.lineTo(36,16);ctx.lineTo(13,15);ctx.lineTo(3,56);ctx.lineTo(-23,56);ctx.lineTo(-28,14);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle=current.color;ctx.fillRect(-37,-26,68,6);ctx.restore();
    }
  }
  function resizeRange(){const rect=range.getBoundingClientRect();const dpr=Math.min(devicePixelRatio||1,2);range.width=Math.round(rect.width*dpr);range.height=Math.round(rect.height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);range._logicalW=rect.width;range._logicalH=rect.height;}
  function animation(time){const dt=Math.min(40,time-lastTime);lastTime=time; if(range._logicalW){ctx.setTransform(range.width/range._logicalW,0,0,range.height/range._logicalH,0,0);targets.forEach(t=>{t.x+=t.speed*dt*.05;if(t.x<60||t.x>range._logicalW-60)t.speed*=-1});drawRange(time,dt)}requestAnimationFrame(animation)}
  function updateMouse(e){const r=range.getBoundingClientRect();mouse.x=Math.max(0,Math.min(r.width,e.clientX-r.left));mouse.y=Math.max(0,Math.min(r.height,e.clientY-r.top));}
  function toast(text){const el=$('#toast');el.textContent=text;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2100)}
  function beep(freq,duration,type){try{audio=audio||new(window.AudioContext||window.webkitAudioContext)();const o=audio.createOscillator(),g=audio.createGain();o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(.035,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+duration)}catch(_){}}

  $('#forgeButton').addEventListener('click',()=>{if(selected.length===2){combine(blueprints.find(x=>x.id===selected[0]),blueprints.find(x=>x.id===selected[1]));}});
  function promptGenerate(){const prompt=$('#promptInput').value.trim();const a=blueprints[Math.floor(Math.random()*blueprints.length)], b=blueprints.filter(x=>x.id!==a.id)[Math.floor(Math.random()*(blueprints.length-1))];selected=[a.id,b.id];updateSelection();renderBlueprints();combine(a,b,prompt);$('#promptInput').value='';}
  $('#promptForge').addEventListener('click',promptGenerate);$('#promptInput').addEventListener('keydown',e=>{if(e.key==='Enter')promptGenerate()});
  $('#testButton').addEventListener('click',()=>$('#rangeSection').scrollIntoView({behavior:'smooth'}));$('#overlayForge').addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));
  $('#soundToggle').addEventListener('click',()=>{soundOn=!soundOn;$('#soundLabel').textContent=soundOn?'SOUND ON':'SOUND OFF';window.CursedFPS?.setSound(soundOn);if(soundOn)beep(440,.1,'sine')});
  window.addEventListener('resize',resizeRange);
  renderBlueprints();updateSelection();resizeRange();requestAnimationFrame(animation);
})();
