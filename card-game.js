(() => {
  const $ = s => document.querySelector(s);
  const panel = document.querySelector('.main-column').appendChild(document.createElement('section'));
  panel.className = 'card card-match'; panel.id = 'cardMatch';
  document.querySelectorAll('.main-column > .play-card, .side-column > .playbook-card, .side-column > .bottom-card').forEach(el => { el.hidden = true; });
  const offenseCards = [
    {name:'Inside Run',type:'run',icon:'🏃',min:2,max:8,base:.78},
    {name:'Outside Sweep',type:'run',icon:'💨',min:2,max:13,base:.65},
    {name:'Short Pass',type:'short',icon:'🎯',min:3,max:14,base:.72},
    {name:'Deep Pass',type:'deep',icon:'🚀',min:8,max:32,base:.43},
    {name:'Punt',type:'special',icon:'📣',min:35,max:50,base:1},
    {name:'Field Goal',type:'special',icon:'🥅',min:0,max:0,base:.72}
  ];
  const defenseCards = [
    {name:'Run Blitz',type:'run',icon:'⚡'},
    {name:'Zone Coverage',type:'zone',icon:'🌐'},
    {name:'Man Coverage',type:'man',icon:'👀'},
    {name:'Special Teams',type:'special',icon:'🛡️'}
  ];
  const labels = ['','1ST','2ND','3RD','4TH'];
  let game, pendingCpu;
  const modeName = () => game.mode === 'cpu' ? 'CPU' : 'PLAYER 2';
  const teamName = side => { const t=teams.find(x=>x.abbr===game.teams[side]); return t?.nickname || (side==='home'?'HOME':'AWAY'); };
  const rand = (a,b) => Math.floor(Math.random()*(b-a+1))+a;
  const diceRoll = () => [rand(1,6),rand(1,6)];
  const clockText = () => timeText(game.clock);
  function log(text, kind='') {
    game.feed.unshift({time:clockText(),text,kind}); game.feed=game.feed.slice(0,7);
    $('#feed').innerHTML=game.feed.map((x,i)=>`<div class="feed-item ${i===0?'highlight-feed':''}"><span class="feed-time">${x.time}</span><span class="feed-marker">${x.kind==='score'?'✦':x.kind==='turnover'?'↻':'•'}</span><span class="feed-copy">${x.text}</span></div>`).join('');
  }
  function freshGame(mode) {
    clearTimeout(pendingCpu);
    game={mode,score:{home:0,away:0},quarter:1,clock:900,progress:25,down:1,toGo:10,possession:'home',phase:'offense',selected:null,offCall:null,feed:[],gameOver:false,clockExpired:false,drives:1,teams:{home:$('#homeTeamSelect').value,away:$('#awayTeamSelect').value},turnovers:0,yards:0};
    log(`Kickoff! ${teamName('home')} starts at its own 25.`); render();
  }
  function fieldSetup() {
    const field=$('#field'); if(!field||field.querySelector('.portrait-field'))return;
    field.querySelectorAll('.yardlines,.yard-labels,.field-markers').forEach(el=>el.hidden=true);
    field.insertAdjacentHTML('beforeend','<div class="portrait-field"><div class="endzone endzone-away">AWAY END ZONE</div><div class="field-grid"></div><div class="yard-stamps"><i>10</i><i>20</i><i>30</i><i>40</i><i>50</i><i>40</i><i>30</i><i>20</i><i>10</i></div><div class="p-first"></div><div class="p-ball">🏈</div><div class="endzone endzone-home">HOME END ZONE</div></div>');
  }
  function renderField() {
    const pct=game.possession==='home'?100-game.progress:game.progress;
    const first=game.possession==='home'?100-Math.min(100,game.progress+game.toGo):Math.min(100,game.progress+game.toGo);
    $('.p-ball').style.top=`${5+pct*.9}%`;$('.p-first').style.top=`${5+first*.9}%`;
    $('.endzone-home').textContent=`${teamName('home').toUpperCase()} END ZONE`;
    $('.endzone-away').textContent=`${teamName('away').toUpperCase()} END ZONE`;
    $('#ballOn').textContent=`${game.progress<50?'OWN':'OPP'} ${game.progress<50?game.progress:100-game.progress}`;
  }
  function render() {
    if(!game)return; fieldSetup();
    const home=teams.find(t=>t.abbr===game.teams.home),away=teams.find(t=>t.abbr===game.teams.away);
    $('#homeScore').textContent=game.score.home;$('#awayScore').textContent=game.score.away;
    $('#homeCity').textContent=`${game.mode==='cpu'?'YOU':'PLAYER 1'} · ${home.city.toUpperCase()}`;$('#homeName').textContent=home.nickname;$('#homeBadge').textContent=home.abbr;$('#homeBadge').style.background=home.color;
    $('#awayCity').textContent=`${game.mode==='cpu'?'CPU':'PLAYER 2'} · ${away.city.toUpperCase()}`;$('#awayName').textContent=away.nickname;$('#awayBadge').textContent=away.abbr;$('#awayBadge').style.background=away.color;
    $('#homeEndzone').textContent=`◀ ${home.nickname.toUpperCase()} END ZONE`;$('#awayEndzone').textContent=`${away.nickname.toUpperCase()} END ZONE ▶`;
    $('#quarterLabel').textContent=game.gameOver?'FINAL':`${labels[game.quarter]} QUARTER`;$('#clockLabel').textContent=clockText();$('#possessionTime').textContent=clockText();
    $('#possessionLabel').textContent=`${game.possession==='home'?'YOUR BALL':`${game.mode==='cpu'?'CPU':teamName('away').toUpperCase()} BALL`}`;$('#possessionLabel').style.color=game.possession==='home'?'var(--lime)':'var(--blue)';
    $('#downDistance').innerHTML=`${labels[game.down].toLowerCase()} &amp; ${game.toGo}`;renderField();
    $('#driveCount').textContent=game.drives;$('#yardsStat').textContent=game.yards;$('#turnoverStat').textContent=game.turnovers;$('#recordLabel').textContent=`${game.score.home}–${game.score.away}`;
    $('#gameStatus').textContent=game.gameOver?'FINAL WHISTLE':game.mode==='cpu'?'SUNDAY SHOWDOWN · VS CPU':'PASS & PLAY · TWO COACHES';
    renderPanel();
  }
  function cardMarkup(card,index,type) {
    const sub=type==='offense'?card.type==='special'?'SPECIAL TEAMS':`${card.type.toUpperCase()} PLAY`:`${card.type==='special'?'SPECIAL':card.type.toUpperCase()} DEFENSE`;
    return `<button class="match-card ${game.selected===index?'picked':''}" data-card="${index}" data-type="${type}" draggable="true"><span class="match-card-icon">${card.icon}</span><b>${card.name}</b><small>${sub}</small></button>`;
  }
  function renderPanel() {
    if(game.gameOver){panel.innerHTML=`<div class="match-heading"><div><div class="eyebrow">FINAL WHISTLE</div><h2>${game.score.home===game.score.away?'It’s a tie!':`${teamName(game.score.home>game.score.away?'home':'away')} wins!`}</h2></div><button class="match-button" data-action="menu">NEW GAME</button></div><p class="match-copy">Final score · ${game.score.home} — ${game.score.away}. Start a new matchup to play again.</p>`;return}
    if(!game.mode){panel.innerHTML=`<div class="eyebrow">PICK YOUR MATCHUP</div><h2 class="mode-title">Ready for kickoff?</h2><p class="match-copy">Call the play. Read the defense. March 100 yards to glory.</p><div class="mode-grid"><button class="mode-choice" data-mode="cpu"><span>🤖</span><b>Solo vs CPU</b><small>Call offense and defend against the computer.</small></button><button class="mode-choice" data-mode="pass"><span>📱</span><b>Pass &amp; Play</b><small>Two coaches take turns with hidden calls.</small></button></div>`;return}
    if(game.phase==='conversion'){
      const scorer=game.conversionTeam, userControls=scorer==='home'||game.mode==='pass';
      if(!userControls){panel.innerHTML=`<div class="eyebrow">TOUCHDOWN · 6 POINTS</div><h2>${teamName(scorer)} lines up for the extra point…</h2><p class="match-copy">CPU chooses a safe kick.</p>`;return}
      panel.innerHTML=`<div class="eyebrow">TOUCHDOWN · 6 POINTS</div><h2>Go for one or two?</h2><p class="match-copy">${teamName(scorer)} scored. Choose the conversion before kickoff.</p><div class="decision-grid"><button class="decision-card" data-action="kick-xp"><b>🥅 Extra point</b><small>Kick · 1 point · reliable</small></button><button class="decision-card" data-action="try-two"><b>🏈 Two-point try</b><small>Run or pass · 2 points · 48% chance</small></button></div>`;return;
    }
    const side=game.possession,defender=side==='home'?'away':'home',isCpuOffense=game.mode==='cpu'&&side==='away';
    const isOff=game.phase==='offense',defenseTurn=game.phase==='defense';
    let title='',desc='',cards='',actions='';
    if(game.phase==='handoff'){
      title=`Pass device to ${teamName(defender)}`;desc=`${teamName(side)} has locked its play call. Keep the screen private.`;
      actions=`<div class="privacy-card"><span>🔒</span><div><b>Play call hidden</b><small>The offense is committed.</small></div></div><button class="match-button match-drop" data-action="ready">DEFENSE IS READY →</button>`;
    } else if(isOff) {
      title=`${side==='home'?'Your offense':`${teamName(side)} offense`} · choose a play`;
      desc=`${labels[game.down]} & ${game.toGo} · Select a card, then snap. Dice and defensive matchup set the result.`;
      const available=offenseCards.map((c,i)=>({c,i})).filter(({c})=>c.type!=='special'||game.down===4&&(c.name!=='Field Goal'||game.progress>=55));
      cards=`<div class="match-cards offense-hand">${available.map(({c,i})=>cardMarkup(c,i,'offense')).join('')}</div>`;
      if(game.selected!==null)actions=`<button class="match-button match-drop" data-action="snap">SNAP THE BALL · ${offenseCards[game.selected].name.toUpperCase()} →</button>`;
    } else if(defenseTurn) {
      title=`${defender==='home'?'Your defense':`${teamName(defender)} defense`} · call the counter`;
      desc=`The offense is set. Pick a defense card; both calls reveal together.`;
      cards=`<div class="match-cards defense-hand">${defenseCards.map((c,i)=>cardMarkup(c,i,'defense')).join('')}</div>`;
      if(game.selected!==null)actions=`<button class="match-button match-drop" data-action="reveal">REVEAL THE PLAY →</button>`;
    }
    const help=game.down===4&&game.phase==='offense'?`<div class="fourth-note">4TH DOWN · Punt or field goal are in your playbook. Go for it to keep the drive alive.</div>`:'';
    const dice=game.lastDice?`<div class="roll-result"><span>DICE ROLL</span><b>${game.lastDice[0]} + ${game.lastDice[1]} = ${game.lastDice[0]+game.lastDice[1]}</b><small>${game.lastResult||''}</small></div>`:'';
    panel.innerHTML=`<div class="match-heading"><div><div class="eyebrow">${game.mode==='cpu'?'GAME PLAN':'SECRET PLAY CALL'}</div><h2>${title}</h2></div><span class="half-pill">Q${game.quarter} · ${clockText()}</span></div><p class="match-copy">${desc}</p>${cards}${actions}${help}${dice}<div class="match-status" aria-live="polite">${game.down===4?'A failed fourth down turns it over.':'Gain 10 yards in four downs for a fresh set.'}</div>`;
  }
  function cpuDefense() { return defenseCards[rand(0,3)]; }
  function lockOffense(index) {
    game.offCall=offenseCards[index];game.selected=null;
    if(game.mode==='pass'){game.phase='handoff';game.pendingDefense=game.possession==='home'?'away':'home';render();return}
    if(game.possession==='home'){resolvePlay(game.offCall,cpuDefense());return}
    game.phase='defense';game.selected=null;render();
  }
  function advanceClock() {
    if(game.clockExpired)return;
    game.clock=Math.max(0,game.clock-30);
    if(game.clock===0){
      if(game.quarter<4){game.quarter++;game.clock=900;log(game.quarter===3?'Halftime. Third quarter kickoff!':`${labels[game.quarter]} quarter begins.`);if(game.quarter===3){game.possession=game.possession==='home'?'away':'home';game.progress=25;game.down=1;game.toGo=10}}
      else {game.clockExpired=true;game.gameOver=true;log('Final whistle. That’s the game!','score')}
    }
  }
  function nextPossession({kickoff=false,spot=null}={}) {
    const prev=game.possession;game.possession=prev==='home'?'away':'home';game.progress=kickoff?25:Math.max(1,Math.min(99,spot===null?100-game.progress:spot));game.down=1;game.toGo=10;game.phase='offense';game.selected=null;game.offCall=null;game.drives++;
  }
  function finishDriveAfterScore() { nextPossession({kickoff:true}); }
  function touchdown(side) {
    game.score[side]+=6;game.conversionTeam=side;game.phase='conversion';game.selected=null;game.offCall=null;
    if(game.clockExpired)game.gameOver=false;
    log(`Touchdown, ${teamName(side)}! Six points.`,'score');
    if(side==='away'&&game.mode==='cpu'){pendingCpu=setTimeout(()=>{if(!game||game.gameOver)return;game.score.away+=1;log('CPU extra point is good.');afterConversion()},650)}
  }
  function afterConversion() {
    game.conversionTeam=null;
    if(game.clockExpired){game.gameOver=true;log('Final whistle. That’s the game!','score');render();return}
    finishDriveAfterScore();render();if(game.possession==='away'&&game.mode==='cpu')scheduleCpu();
  }
  function finishTurnover(spot,reason) {game.turnovers++;log(reason,'turnover');nextPossession({spot});}
  function resolvePlay(off,def) {
    const side=game.possession;game.lastDice=diceRoll();const total=game.lastDice[0]+game.lastDice[1];
    let matchup=0,turnoverBonus=0;
    if(off.type==='run'&&def.type==='run'){matchup=-.17;turnoverBonus=.025}
    if(off.type==='run'&&['zone','man'].includes(def.type))matchup=.06;
    if(off.type==='short'&&def.type==='man')matchup=-.16;
    if(off.type==='short'&&def.type==='zone')matchup=-.04;
    if(off.type==='deep'&&def.type==='zone')matchup=-.19;
    if(off.type==='deep'&&def.type==='man')matchup=.08;
    let text='';
    if(off.name==='Punt'){
      const yards=rand(35,50)+(total>=10?5:0);log(`Punt · ${def.name}: ${yards} yards. The return is downed.`);advanceClock();nextPossession({spot:Math.max(15,100-(game.progress+yards))});game.lastResult=`Punt · ${yards} yards`;game.phase='offense';render();if(game.possession==='away'&&game.mode==='cpu')scheduleCpu();return;
    }
    if(off.name==='Field Goal'){
      const distance=117-game.progress,prob=Math.max(.08,Math.min(.94,.94-Math.max(0,distance-20)*.012+(def.type==='special'?-.12:0)+(total>=10?.08:0)));
      if(Math.random()<prob){game.score[side]+=3;text=`Field goal is good from ${distance} yards! ${teamName(side)} adds 3.`;log(text,'score');advanceClock();nextPossession({kickoff:true})}
      else {text=`${distance}-yard field goal is no good. Turnover on downs.`;log(text,'turnover');game.turnovers++;advanceClock();nextPossession({spot:100-game.progress})}
      game.lastResult=text;game.lastDice=game.lastDice;render();if(game.possession==='away'&&game.mode==='cpu')scheduleCpu();return;
    }
    let chance=off.base+matchup+(total<=4?-.20:total<=6?-.10:total>=11?.12:total>=10?.07:0);
    if(def.type==='special')chance-=.04;
    const intercepted=(off.type==='short'||off.type==='deep')&&Math.random()<(off.type==='deep'?.075:.035)+(def.type==='zone'?.035:def.type==='man'?.02:0)+(total<=4?.035:0);
    const fumble=off.type==='run'&&Math.random()<.028+(def.type==='run'?.025:0);
    advanceClock();
    if(intercepted||fumble){text=intercepted?`${def.name} reads it! Pass intercepted.`:`The ball is loose! ${def.name} forces a fumble.`;game.lastResult=text;finishTurnover(100-game.progress,text);render();if(game.possession==='away'&&game.mode==='cpu')scheduleCpu();return;}
    let yards;
    if(Math.random()<Math.max(.12,Math.min(.94,chance))){yards=rand(off.min,off.max);if(total>=10)yards+=rand(1,4);if(def.type==='run'&&off.type==='run')yards-=rand(2,5);if(total===12)yards+=3;}
    else yards=off.type==='deep'?-rand(1,8):-rand(1,4);
    yards=Math.max(-8,Math.min(35,yards));game.progress=Math.max(0,Math.min(100,game.progress+yards));if(side==='home')game.yards+=Math.max(0,yards);
    text=`${off.name} vs ${def.name}: ${yards>=0?'+':''}${yards} yards. Roll ${total}.`;
    game.lastResult=`${yards>=0?'+':''}${yards} yards · ${total>=10?'big roll':total<=4?'low roll':'steady'}`;
    if(game.progress>=100){touchdown(side);render();return}
    if(game.progress<=0){const other=side==='home'?'away':'home';game.score[other]+=2;log(`Safety! ${teamName(other)} scores 2.`,'score');game.lastResult='Safety · 2 points';nextPossession({kickoff:true});render();if(game.possession==='away'&&game.mode==='cpu')scheduleCpu();return}
    log(text);
    if(yards>=game.toGo){game.down=1;game.toGo=Math.min(10,100-game.progress);log('First down! Chains move.')}
    else {game.down++;game.toGo=Math.max(1,game.toGo-yards)}
    if(game.down>4){game.lastResult='Turnover on downs';finishTurnover(100-game.progress,`${teamName(side)} turns it over on downs.`)}
    else {game.phase='offense';game.selected=null;game.offCall=null}
    if(game.gameOver){render();return}render();if(game.possession==='away'&&game.mode==='cpu')scheduleCpu();
  }
  function scheduleCpu(){clearTimeout(pendingCpu);if(!game||game.mode!=='cpu'||game.possession!=='away'||game.gameOver||game.phase==='conversion')return;pendingCpu=setTimeout(cpuOffense,700)}
  function cpuOffense(){if(game.gameOver||game.possession!=='away')return;let off;
    if(game.down===4&&game.progress>=55&&Math.random()<.55)off=offenseCards[5];
    else if(game.down===4&&game.progress<55&&Math.random()<.7)off=offenseCards[4];
    else off=offenseCards[[0,1,2,3][rand(0,3)]];
    game.offCall=off;game.phase='defense';game.selected=null;render();
    // CPU attacks are resolved after a short defensive-read pause; the human picks the counter.
  }
  function chooseConversion(action){const side=game.conversionTeam;if(!side)return;if(action==='kick-xp'){game.score[side]+=1;log(`${teamName(side)} extra point is good.`,'score')}else{const roll=diceRoll(),made=Math.random()<.48+(roll[0]+roll[1]>=10?.14:0);game.lastDice=roll;if(made){game.score[side]+=2;log(`${teamName(side)} converts the two-point try!`,'score')}else log('Two-point attempt is stopped.','turnover')};advanceClock();if(!game.gameOver)afterConversion();else render()}
  panel.addEventListener('click',e=>{
    const btn=e.target.closest('button');if(!btn)return;
    if(btn.dataset.mode){freshGame(btn.dataset.mode);return}
    const action=btn.dataset.action;
    if(action==='menu'){game.mode=null;game.gameOver=false;render();return}
    if(action==='ready'){game.phase='defense';game.selected=null;render();return}
    if(action==='snap'){lockOffense(game.selected);return}
    if(action==='reveal'){const def=defenseCards[game.selected];resolvePlay(game.offCall,def);return}
    if(action==='kick-xp'||action==='try-two'){chooseConversion(action);return}
    if(btn.dataset.card!==undefined){game.selected=Number(btn.dataset.card);render()}
  });
  let dragIndex=null;
  panel.addEventListener('dragstart',e=>{const card=e.target.closest('.match-card');if(card){dragIndex=Number(card.dataset.card);e.dataTransfer.setData('text/plain',card.dataset.card);e.dataTransfer.effectAllowed='move'}});
  panel.addEventListener('dragover',e=>{if(e.target.closest('.match-drop'))e.preventDefault()});
  panel.addEventListener('drop',e=>{const target=e.target.closest('.match-drop');if(!target)return;e.preventDefault();if(dragIndex!==null){game.selected=dragIndex;render();const action=target.dataset.action;if(action==='snap')lockOffense(dragIndex);else if(action==='reveal')resolvePlay(game.offCall,defenseCards[dragIndex])}dragIndex=null});
  // Scoreboard team pickers start a fresh matchup and retain the current game mode.
  ['homeTeamSelect','awayTeamSelect'].forEach(id=>$( '#'+id).addEventListener('change',e=>{e.stopImmediatePropagation();const changed=id==='homeTeamSelect'?'home':'away',other=changed==='home'?'away':'home';if(e.target.value===$(`#${other}TeamSelect`).value){const replacement=teams.find(t=>t.abbr!==e.target.value);$(`#${other}TeamSelect`).value=replacement.abbr}freshGame(game?.mode||'cpu')},true));
  $('#newGameBtn').addEventListener('click',e=>{e.stopImmediatePropagation();game.mode=null;render()},true);
  $('#helpBtn').addEventListener('click',e=>{e.stopImmediatePropagation();showModal('How to play','<p><b>Play solo or pass and play:</b> Choose CPU or two-player mode. On offense, select a play and snap. In pass-and-play, pass the device after the hidden call so the defender can choose a counter.</p><p><b>Four downs:</b> Gain 10 yards to reset the downs. Turnovers, interceptions, fumbles, and failed fourth downs give the ball to the opponent. Punt or attempt a field goal on fourth down.</p><p><b>Dice &amp; matchups:</b> Every play rolls two six-sided dice. High rolls boost gains; low rolls make stops and turnovers more likely. Defensive counters change the play odds. Each play uses 30 seconds of the 15-minute quarter clock.</p><p><b>Scoring:</b> Touchdown = 6, extra point = 1, two-point try = 2, field goal = 3, safety = 2. Four quarters; most points wins.</p><p><b>Controls:</b> Tap a card to select, then snap/reveal. You can also drag a card onto the action button.</p>','GOT IT')},true);
  // Prevent the legacy single-player interval from touching the new card game.
  state.gameOver=true;state.possession='away';game={mode:null};renderPanel();fieldSetup();
})();
