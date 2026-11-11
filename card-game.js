(() => {
  // The card matchup replaces the original solo dice loop while reusing its scoreboard and field.
  state.possession = 'away';
  state.gameOver = true;
  document.querySelectorAll('.main-column > .card:not(.scoreboard), .side-column').forEach(el => { el.hidden = true; });
  const main = document.querySelector('.main-column');
  const panel = document.createElement('section');
  panel.className = 'card card-match';
  panel.id = 'cardMatch';
  main.append(panel);

  const offenseDeck = [
    ['Power run','RUN',3,7,'🏃'],['Inside zone','RUN',2,6,'🧱'],['QB sneak','RUN',1,4,'🏈'],['Draw play','RUN',2,9,'↘'],['Outside sweep','RUN',1,11,'💨'],
    ['Quick slant','PASS',4,11,'🎯'],['Screen pass','PASS',2,10,'👐'],['Quick out','PASS',3,9,'➡'],['Play action','PLAY ACTION',5,17,'🎭'],['Deep post','PASS',0,25,'🚀']
  ].map(([name,type,min,max,icon],i)=>({id:`o${i}`,name,type,min,max,icon}));
  const defenseDeck = [
    ['Stonewall front','RUN',-5,'🧱'],['Goal-line stand','RUN',-7,'🛡️'],['Edge contain','RUN',-4,'↔'],['Run blitz','RUN',-3,'⚡'],['Cover 2','PASS',-5,'☂️'],
    ['Man coverage','PASS',-6,'👀'],['Safety help','PASS',-4,'🦺'],['Corner blitz','ALL',-3,'💥'],['Prevent defense','PASS',-2,'🌐'],['Spy the QB','ALL',-2,'🔎']
  ].map(([name,type,yards,icon],i)=>({id:`d${i}`,name,type,yards,icon}));
  let game;
  const mix = a => { for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a };
  const newDeck = cards => mix([...cards,...cards]);
  const player = () => ({offense:newDeck(offenseDeck),defense:newDeck(defenseDeck),offHand:[],defHand:[],offDiscard:[],defDiscard:[],timeouts:3});
  const draw = (p,type,n=1) => {const deck=type==='offense'?p.offense:p.defense, discard=type==='offense'?p.offDiscard:p.defDiscard, hand=type==='offense'?p.offHand:p.defHand, source=type==='offense'?offenseDeck:defenseDeck;for(let i=0;i<n&&hand.length<7;i++){if(!deck.length)deck.push(...mix(discard.splice(0)),...newDeck(source));hand.push(deck.pop())}};
  const teamName = side => {const t=teams.find(x=>x.abbr===game.teams[side]);return t?`${t.city} ${t.nickname}`:`Player ${side==='home'?1:2}`};
  const activeSide = () => game.possession;
  const physical = () => game.possession==='home'?game.progress:100-game.progress;
  const say = text => {game.feed.unshift({time:timeText(game.clock),text});game.feed=game.feed.slice(0,7);$('#feed').innerHTML=game.feed.map((x,i)=>`<div class="feed-item ${i===0?'highlight-feed':''}"><span class="feed-time">${x.time}</span><span class="feed-marker">•</span><span class="feed-copy">${x.text}</span></div>`).join('')};
  function freshGame(){
    game={scores:{home:0,away:0},half:1,clock:900,position:25,progress:25,down:1,toGo:10,possession:'home',phase:'offense',players:{home:player(),away:player()},chosenOff:null,goForIt:false,feed:[],gameOver:false,teams:{home:$('#homeTeamSelect').value,away:$('#awayTeamSelect').value}};
    for(const side of ['home','away']){draw(game.players[side],'offense',5);draw(game.players[side],'defense',5)}
    say('Kickoff! Player 1 starts at their own 25. Each coach has five offense and five defense cards.');
    $('#resultBanner').textContent='';render();
  }
  function render(){
    const home=teams.find(t=>t.abbr===game.teams.home),away=teams.find(t=>t.abbr===game.teams.away);
    $('#homeScore').textContent=game.scores.home;$('#awayScore').textContent=game.scores.away;
    $('#homeCity').textContent=`PLAYER 1 · ${home.city.toUpperCase()}`;$('#homeName').textContent=home.nickname;$('#homeBadge').textContent=home.abbr;$('#homeBadge').style.background=home.color;
    $('#awayCity').textContent=`PLAYER 2 · ${away.city.toUpperCase()}`;$('#awayName').textContent=away.nickname;$('#awayBadge').textContent=away.abbr;$('#awayBadge').style.background=away.color;
    $('#homeEndzone').textContent=`◀ ${home.nickname.toUpperCase()} END ZONE`;$('#awayEndzone').textContent=`${away.nickname.toUpperCase()} END ZONE ▶`;
    $('#quarterLabel').textContent=game.gameOver?'FINAL':`${game.half===1?'1ST':'2ND'} HALF`;$('#clockLabel').textContent=timeText(game.clock);$('#possessionTime').textContent=timeText(game.clock);
    const side=activeSide(),progress=game.progress,ballPos=physical();
    $('#possessionLabel').textContent=`${side==='home'?'PLAYER 1':'PLAYER 2'} BALL`;$('#possessionLabel').style.color=side==='home'?'var(--lime)':'var(--blue)';
    $('#downDistance').innerHTML=`${['','1st','2nd','3rd','4th'][game.down]} &amp; ${game.toGo}`;$('#ballOn').textContent=`${side==='home'?'P1':'P2'} ${Math.max(0,Math.min(99,progress))}`;
    $('#ballMarker').style.left=`${ballPos}%`;$('#firstDownMarker').style.left=`${side==='home'?Math.min(100,ballPos+game.toGo):Math.max(0,ballPos-game.toGo)}%`;$('#ballMarker').style.opacity=1;$('#firstDownMarker').style.opacity='.95';
    $('#driveCount').textContent='—';$('#yardsStat').textContent='—';$('#turnoverStat').textContent='—';$('#gameStatus').textContent=game.gameOver?'FINAL WHISTLE':'HEAD-TO-HEAD CARD GAME';$('#recordLabel').textContent=`${game.scores.home}–${game.scores.away}`;
    renderPanel();
  }
  function cardButton(card,type,index){return `<button class="match-card" data-card="${index}" data-type="${type}"><span class="match-card-icon">${card.icon}</span><b>${card.name}</b><small>${type==='offense'?`${card.type} · ${card.min}–${card.max} yd`:`${card.type==='ALL'?'ANY PLAY':`VS ${card.type}`} · ${card.yards} yd`}</small></button>`}
  function renderPanel(){
    if(game.gameOver){panel.innerHTML=`<div class="match-heading"><div><div class="eyebrow">FINAL WHISTLE</div><h2>${game.scores.home===game.scores.away?'It’s a tie!':`${teamName(game.scores.home>game.scores.away?'home':'away')} wins!`}</h2></div><button class="match-button" data-action="new">NEW GAME</button></div><p class="match-copy">Final score: ${teamName('home')} ${game.scores.home} — ${game.scores.away} ${teamName('away')}.</p>`;return}
    const side=activeSide(),defender=side==='home'?'away':'home',acting=game.phase==='offense'?side:defender,p=game.players[acting],isTimeoutAvailable=p.timeouts>0;
    let title='',description='',cards='';
    if(game.phase==='handoff'){
      title=`Pass the device to ${teamName(defender)}`;description=`${teamName(side)} has locked in an offensive card. The choice is hidden. ${teamName(defender)}, choose a defense card.`;
      cards=`<div class="privacy-card"><span>🔒</span><b>Offensive call locked</b><small>Don’t reveal your card choice.</small></div><button class="match-button" data-action="ready">${teamName(defender)} IS READY →</button>`;
    }else{
      const isOffense=game.phase==='offense';title=`${teamName(acting)} · ${isOffense?'choose offense':'choose defense'}`;
      description=isOffense?`Secretly select one of your ${p.offHand.length} offense cards. Then pass the device to the defender.`:`Choose one of your ${p.defHand.length} defense cards to counter the play.`;
      const hand=isOffense?p.offHand:p.defHand;cards=`<div class="match-cards">${hand.map((c,i)=>cardButton(c,isOffense?'offense':'defense',i)).join('')}</div>`;
    }
    const timeout=`<button class="timeout-button" data-action="timeout" ${isTimeoutAvailable?'':'disabled'}>⏱ ${teamName(acting)} TIMEOUTS: ${p.timeouts} · REFRESH HAND</button>`;
    const special=game.down===4&&game.phase==='offense'&&!game.goForIt?`<div class="special-actions"><span>4TH & ${game.toGo}</span><button data-action="punt">PUNT</button>${game.progress>=60?'<button data-action="fieldgoal">FIELD GOAL</button>':''}<button data-action="go">GO FOR IT</button></div>`:'';
    panel.innerHTML=`<div class="match-heading"><div><div class="eyebrow">SECRET PLAY CALL</div><h2>${title}</h2></div><span class="half-pill">${game.half===1?'FIRST':'SECOND'} HALF · ${timeText(game.clock)}</span></div><p class="match-copy">${description}</p>${cards}${timeout}${special}<div class="match-status" aria-live="polite">${game.down===4?'A failed fourth-down conversion gives the ball to the other coach.':'Four downs to gain 10 yards. First down earns bonus cards.'}</div>`;
  }
  function timeForPlay(){game.clock=Math.max(0,game.clock-(35+Math.floor(Math.random()*31)));if(game.clock===0){if(game.half===1){game.half=2;game.clock=900;for(const side of ['home','away'])game.players[side].timeouts=3;say('Halftime! The second half begins; each coach gets three new timeouts.');game.possession=game.possession==='home'?'away':'home';game.position=game.possession==='home'?25:75;game.progress=25;game.down=1;game.toGo=10;game.phase='offense';game.chosenOff=null;game.goForIt=false}else{game.gameOver=true;say('End of the second half. That’s the game!')}return true}return false}
  function changePossession(scored=false){game.possession=game.possession==='home'?'away':'home';if(scored){game.position=game.possession==='home'?25:75;game.progress=25}else{game.progress=100-game.progress;game.position=game.possession==='home'?game.progress:100-game.progress}game.down=1;game.toGo=10;game.phase='offense';game.chosenOff=null;game.goForIt=false}
  function finishPlay(defCard){
    const offense=game.possession,defense=offense==='home'?'away':'home',op=game.players[offense],dp=game.players[defense],off=game.chosenOff;
    if(timeForPlay()){op.offHand.push(off);dp.defHand.push(defCard);game.chosenOff=null;render();return}
    const base=off.min+Math.floor(Math.random()*(off.max-off.min+1)),matched=defCard.type==='ALL'||defCard.type===off.type;
    let yards=base+(matched?defCard.yards:Math.max(-1,Math.floor(defCard.yards/2)));
    let turnover=Math.random()<(matched?0.035:0.018);if(defCard.name==='Corner blitz'&&off.type!=='RUN')turnover=Math.random()<0.09;
    yards=Math.max(-8,Math.min(35,yards));if(turnover){say(`${teamName(defense)} forces a turnover with ${defCard.name}!`);op.offDiscard.push(off);dp.defDiscard.push(defCard);changePossession();render();return}
    game.progress=Math.max(0,Math.min(100,game.progress+yards));game.position=offense==='home'?game.progress:100-game.progress;
    const gained=Math.max(0,yards),text=`${off.name} vs. ${defCard.name}: ${yards>=0?'+':''}${yards} yard${Math.abs(yards)===1?'':'s'}.`;
    op.offDiscard.push(off);dp.defDiscard.push(defCard);draw(op,'offense');draw(dp,'defense');
    if(game.progress>=100){game.scores[offense]+=7;say(`Touchdown, ${teamName(offense)}! Seven points.`);if(!game.gameOver)changePossession(true);render();return}
    if(game.progress<=0){game.scores[defense]+=2;say(`Safety! ${teamName(defense)} scores two.`);if(!game.gameOver)changePossession(true);render();return}
    say(text);
    game.goForIt=false;
    if(gained>=game.toGo){game.down=1;game.toGo=Math.min(10,100-game.progress);draw(op,'offense',2);draw(dp,'defense',2);say('First down! Both coaches draw two bonus cards.')}else{game.down++;game.toGo=Math.max(1,game.toGo-yards)}
    if(game.down>4){say(`Turnover on downs. ${teamName(defense)} takes over.`);changePossession()}else{game.phase='offense';game.chosenOff=null}
    render();
  }
  function chooseSpecial(action){const side=game.possession,other=side==='home'?'away':'home';if(timeForPlay()){render();return}if(action==='punt'){ say(`${teamName(side)} punts. ${teamName(other)} takes over at its own 25.`);game.possession=other;game.position=other==='home'?25:75;game.progress=25;game.down=1;game.toGo=10;game.phase='offense'}else if(action==='fieldgoal'){const distance=117-game.progress,prob=Math.max(.35,Math.min(.97,1-(distance-20)*.012));if(Math.random()<prob){game.scores[side]+=3;say(`Field goal is good! ${teamName(side)} adds three.`);changePossession(true)}else{say('Field goal is no good. The other coach takes over at the spot.');changePossession()}}else{game.phase='offense'}render()}
  function doTimeout(side){const p=game.players[side];if(!p.timeouts)return;p.timeouts--;p.offDiscard.push(...p.offHand.splice(0));p.defDiscard.push(...p.defHand.splice(0));draw(p,'offense',5);draw(p,'defense',5);say(`${teamName(side)} calls timeout and draws a fresh five-card hand.`);render()}
  panel.addEventListener('click',e=>{
    const btn=e.target.closest('button');if(!btn)return;const action=btn.dataset.action;
    if(action==='new'){freshGame();return}if(action==='ready'){game.phase='defense';render();return}if(action==='timeout'){const acting=game.phase==='offense'?game.possession:(game.possession==='home'?'away':'home');doTimeout(acting);return}
    if(action==='go'){game.goForIt=true;render();return}if(['punt','fieldgoal'].includes(action)){chooseSpecial(action);return}
    if(btn.dataset.card!==undefined){const idx=Number(btn.dataset.card),side=game.phase==='offense'?game.possession:(game.possession==='home'?'away':'home'),hand=game.players[side][game.phase==='offense'?'offHand':'defHand'],card=hand.splice(idx,1)[0];if(!card)return;if(game.phase==='offense'){game.chosenOff=card;game.phase='handoff';render()}else finishPlay(card)}
  });
  // Intercept the old solo-game controls; team changes still start a fresh head-to-head game.
  ['homeTeamSelect','awayTeamSelect'].forEach(id=>$('#'+id).addEventListener('change',e=>{e.stopImmediatePropagation();const changed=id==='homeTeamSelect'?'home':'away',other=changed==='home'?'away':'home',value=e.currentTarget.value;if(value===$(`#${other}TeamSelect`).value){const replacement=teams.find(t=>t.abbr!==value);$(`#${other}TeamSelect`).value=replacement.abbr}freshGame()},true));
  $('#newGameBtn').addEventListener('click',e=>{e.stopImmediatePropagation();freshGame()},true);
  $('#helpBtn').addEventListener('click',e=>{e.stopImmediatePropagation();showModal('How to play','<p><b>Two coaches, one device:</b> Player 1 uses the home team and Player 2 the away team. Each starts with five offense cards and five defense cards. Take turns passing the device; offensive picks are hidden during the handoff.</p><p><b>Play calling:</b> The offense secretly picks a run, pass, or play-action card. The defender chooses a defense card. Reveal the matchup, move the ball by the yards shown, and advance the down. Gain 10 yards within four downs for a first down; both coaches then draw two bonus cards.</p><p><b>Timeouts:</b> Each coach gets three per half. Use a timeout to discard your current hands and draw five fresh offense and five fresh defense cards. Unused timeouts refresh at halftime.</p><p><b>Scoring:</b> Touchdown = 7, field goal = 3, safety = 2. On fourth down, punt, attempt a field goal when inside the opponent’s 40, or go for it. A failed conversion gives possession to the other coach. The player with the most points at the end of the second half wins.</p><p><b>Choose teams:</b> Use the scoreboard selectors to set both NFL teams. Avoid showing your hand when passing the device.</p>','GOT IT')},true);
  $('#homeTeamSelect').value=state.homeTeam;$('#awayTeamSelect').value=state.awayTeam;
  freshGame();
})();
