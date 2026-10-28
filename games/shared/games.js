/* © 2026 Plot. All rights reserved. Proprietary — copying, redistribution or reuse of this code is prohibited. */
// Plot — side-quest games (r3, migration 025; polish r1). Every round is a server session (start_game -> id + seed);
// the level is built from the server seed and the result is checked by finish_game (min time, score caps,
// rate limits, diminishing rewards, human check every 10 games). Rewards are newly minted USD. Juice (sound, haptics, how-to,
// popups, confetti) comes from js/gamefx.js; nothing here changes what is sent to the server.
(function(){
const GC=window.GameCore; // shared generators/rules (js/gamecore.js, the same file the server verifier runs)
const $=s=>document.querySelector(s);const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const usd=n=>'$'+Math.round(n).toLocaleString();
const rngOf=seed=>{let a=seed>>>0;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}};
const NOOP=()=>{};const X0=window.FX||{sfx:NOOP,buzz:NOOP,fx:NOOP,settings:NOOP,howTo:async()=>false,hint:NOOP,toast:NOOP,float:NOOP,burst:NOOP,confetti:NOOP,countUp:(e,v)=>{e.textContent=usd(v)},best:()=>({}),ill:s=>s};
const LITE=()=>document.documentElement.classList.contains('lite');
// r62 juice layer (visual only): success streaks -> combo pop-ups, errors -> light shake, progress bar, press feedback, idle tips
let CMB={n:0,t:0};
function comboPop(n){if(LITE())return;const a=$('#gArea');if(!a)return;const d=document.createElement('div');d.className='gcombo';d.innerHTML=`<b>${n>=5?'🔥🔥':'🔥'} Combo ×${n}</b>`;a.appendChild(d);setTimeout(()=>d.remove(),1100);
 const r=d.getBoundingClientRect();X0.burst&&X0.burst(r.left+r.width/2,r.top+20,Math.min(4+n,10),'✨')}
const X=Object.assign({},X0,{fx:(snd,v)=>{X0.fx(snd,v);if(v=='success'){const t=Date.now();CMB.n=t-CMB.t<2400?CMB.n+1:1;CMB.t=t;if(CMB.n>=2)comboPop(CMB.n)}
  else if(v=='error'){CMB.n=0;if(!LITE()){const a=$('#gArea');if(a){a.classList.remove('gshk');void a.offsetWidth;a.classList.add('gshk')}}}}});
let JID='';const progT=v=>{const t=+(CFG?.games?.[JID]?.target||0);if(t>0)prog(v/t)};
const prog=f=>{const e=$('#gProg');if(e)e.style.transform=`scaleX(${Math.max(0,Math.min(1,f))})`};
const TIPS={traffic_jam:'Tap a vehicle whose arrow has a clear road — its passengers board from the queue.',snake:'Swipe on the board to turn. Eat apples, avoid your tail.',checkers:'Tap one of your red pieces, then a glowing square.',
 number_match:'Tap two equal numbers (or two that add to 10) with nothing between them.',water_sort:'Tap a tube, then the tube to pour into. Same colour or empty only.',market_trader:'Tap Buy all when the price looks low, Sell all when it looks high.',
 ludo:'Tap the dice, then a glowing token.',ayo:'Tap a glowing pit on your (bottom) row to sow its seeds.',word_search:'Tap the first letter of a word, then its last letter.',memory:'Tap any card to flip it, then another to find its pair.',quiz:'Tap the answer you think is right before the bar runs out.'};
function juiceStart(id){JID=id;CMB={n:0,t:0};const g=$('#games');if(g)g.dataset.g=id;let touched=false;const a=$('#gArea');
 const mark=()=>{touched=true};a&&a.addEventListener('pointerdown',mark,{once:true});
 setTimeout(()=>{if(!touched&&a&&a.isConnected&&TIPS[id])X0.hint(TIPS[id],{id:'idle_'+id,max:2,host:a})},7000)}
let pressBound=false;function bindPress(){if(pressBound)return;pressBound=true;const SEL='#games .gplay button,#games .bv,#games .wsc,#games .aypit,#games .mmc,#games .qzb,#games [data-t]';
 const up=()=>document.querySelectorAll('.gpress').forEach(e=>e.classList.remove('gpress'));
 document.addEventListener('pointerdown',e=>{const b=e.target.closest&&e.target.closest(SEL);if(!b||b.disabled)return;b.classList.add('gpress');X0.buzz&&X0.buzz(6)},{passive:true,capture:true});
 document.addEventListener('pointerup',up,{passive:true});document.addEventListener('pointercancel',up,{passive:true})}
// star rating for the finish screen: from the server's outcome and score only (no effect on pay)
function starsOf(id,r,score,result){if(!r||!r.ok||r.outcome=='loss'||!(r.reward>0||r.held>0||r.cap_reached))return r&&r.ok&&r.outcome!='loss'?1:0;
 const tg=+(CFG?.games?.[id]?.target||0);let st=r.outcome=='win'?3:tg>0&&score>=tg*.6?2:1;if(st==3&&((result&&result.hints>0)||(result&&result.misses>(SES&&SES.allowed||1e9))))st=2;return st}
const fx=(s,v)=>X.fx(s,v);
const at=(e,txt,cls)=>{if(!e)return;const r=e.getBoundingClientRect();X.float(r.left+r.width/2,r.top,txt,cls)};
const shake=e=>{if(!e)return;e.classList.remove('gshake');void e.offsetWidth;e.classList.add('gshake')};
const I=X.ill; // tiny SVG illustrations for the how-to cards
const LIST=[
 {id:'quiz',name:'Quiz Rounds',icon:'❓',c:'#5c6bc0,#29b6f6',desc:'Quick-fire questions on the world, Africa, science, sport and money.',best:'pts',
  how:[[I('<rect x="15" y="20" width="90" height="40" rx="8" fill="#fff"/><text x="60" y="47" font-size="18" text-anchor="middle" fill="#333">Abuja?</text>'),'Answer fast','Each question has 4 answers and a time bar. Tap the one you think is right before the bar runs out.'],
   [I('<text x="60" y="52" font-size="30" text-anchor="middle">✅</text>'),'Win the round','Get 3 in 5 right on early levels (60%) to win. Fewer right still scores points.'],
   [I('<text x="60" y="52" font-size="30" text-anchor="middle">📈</text>'),'Level up','Higher levels have more questions, harder ones, and a shorter timer.']]},
 {id:'memory',name:'Memory Match',icon:'🃏',c:'#ec407a,#ffa726',desc:'Flip cards and find the pairs — mangoes, danfos, drums and more.',best:'wins',
  how:[[I('<rect x="20" y="18" width="34" height="44" rx="6" fill="#ec407a"/><rect x="66" y="18" width="34" height="44" rx="6" fill="#fff"/><text x="83" y="48" font-size="22" text-anchor="middle">🥭</text>'),'Flip two','Tap a card to flip it, then tap another. If they match, they stay face up.'],
   [I('<text x="60" y="50" font-size="30" text-anchor="middle">🧠</text>'),'Remember','Cards that don\'t match flip back. Remember where they were!'],
   [I('<text x="60" y="50" font-size="30" text-anchor="middle">🏆</text>'),'Find every pair','Find all pairs to win. Early levels give lots of free misses; after that each miss costs a little score.']]},
 {id:'word_search',name:'Word Hunt',icon:'🔤',c:'#26a69a,#7e57c2',desc:'Find the hidden words — Naija food, cities and money words.',best:'wins',
  how:[[I('<rect x="20" y="15" width="80" height="50" rx="8" fill="#fff"/><text x="60" y="48" font-size="22" text-anchor="middle" fill="#333" font-weight="700">S U Y A</text><line x1="30" y1="41" x2="90" y2="41" stroke="#ef5350" stroke-width="12" stroke-linecap="round" opacity=".35"/>'),'Find the words','Every word in the list is hidden in the grid. Tap its first letter, then its last letter — or drag across it.'],
   [I('<path d="M30 60 L90 20" stroke="#42a5f5" stroke-width="10" stroke-linecap="round" opacity=".5"/>'),'More directions later','Early levels use across and down only. Higher levels add diagonals, then backwards words.'],
   [I('<text x="60" y="52" font-size="34" text-anchor="middle">🏆</text>'),'Find them all','Find every word to win. Bigger grids and more words pay more.']]},
 {id:'ayo',name:'Ayo',icon:'🌰',c:'#8d6e63,#ffb300',desc:'The classic Yoruba seed game (Oware). Outsow the computer and capture seeds.',best:'pts',
  how:[[I('<rect x="10" y="22" width="100" height="36" rx="18" fill="#8d6e63"/><circle cx="30" cy="40" r="9" fill="#5d4037"/><circle cx="60" cy="40" r="9" fill="#5d4037"/><circle cx="90" cy="40" r="9" fill="#5d4037"/>'),'Sow','Tap one of your pits on the bottom row. Its seeds are dropped one by one into the next pits, going right and round.'],
   [I('<circle cx="45" cy="40" r="12" fill="#5d4037"/><circle cx="41" cy="38" r="3" fill="#ffb300"/><circle cx="49" cy="42" r="3" fill="#ffb300"/><path d="M62 40h24" stroke="#ffb300" stroke-width="4"/>'),'Capture 2s and 3s','If your last seed lands on the computer\'s side and makes 2 or 3, you take them — and the pits before it too, while they are 2 or 3.'],
   [I('<text x="60" y="50" font-size="30" text-anchor="middle" fill="#ffb300">25+</text>'),'Win','More than 24 seeds wins. If the computer runs out of seeds you must feed it. Win, lose or draw.']]},
 {id:'ludo',name:'Ludo',icon:'🎲',c:'#e53935,#fbc02d',desc:'Race your tokens home before the computer. Capture to send them back!',best:'wins',
  how:[[I('<rect x="40" y="20" width="40" height="40" rx="8" fill="#fff" stroke="#333" stroke-width="2"/><circle cx="52" cy="32" r="4"/><circle cx="68" cy="48" r="4"/><circle cx="52" cy="48" r="4"/><circle cx="68" cy="32" r="4"/>'),'Roll and move','Tap the dice, then tap a glowing token. A 6 (or a 5 on early levels) brings a token out of your yard.'],
   [I('<circle cx="40" cy="40" r="12" fill="#e53935"/><circle cx="80" cy="40" r="12" fill="#fbc02d" opacity=".5"/><path d="M52 40 H66" stroke="#333" stroke-width="3"/>'),'Capture','Land on a computer token to send it back to its yard. ★ squares are safe. A 6 or a capture rolls again.'],
   [I('<polygon points="30,60 60,20 90,60" fill="#e53935"/>'),'Get home','Go round the board and up your red lane. You need the exact number to reach home. All tokens home first = win.']]},
 {id:'number_match',name:'Number Match',icon:'🔢',c:'#ff8a65,#ff5277',desc:'Pair equal numbers or pairs that add to 10 — any direction.',best:'pts',
  how:[[I('<rect x="10" y="20" width="28" height="28" rx="6" fill="#ffd54a"/><text x="24" y="40" font-size="18" text-anchor="middle" font-weight="800">7</text><rect x="46" y="20" width="28" height="28" rx="6" fill="#2b3d5c"/><rect x="82" y="20" width="28" height="28" rx="6" fill="#ffd54a"/><text x="96" y="40" font-size="18" text-anchor="middle" font-weight="800">3</text><path d="M38 60 Q60 74 82 60" stroke="#8bc34a" stroke-width="4" fill="none"/>'),'Pair them up','Tap two numbers that are <b>equal</b> or <b>add up to 10</b> with only empty cells between them.'],
   [I('<rect x="8" y="14" width="104" height="14" rx="4" fill="#2b3d5c"/><rect x="8" y="34" width="104" height="14" rx="4" fill="#8bc34a" opacity=".6"/><text x="60" y="45" font-size="11" text-anchor="middle" fill="#fff" font-weight="800">+25 row cleared</text><rect x="8" y="54" width="104" height="14" rx="4" fill="#2b3d5c"/>'),'Clear rows','Pairs connect across, up–down, <b>diagonally</b> and wrap to the next row. Empty rows vanish for bonus points.'],
   [I('<circle cx="60" cy="40" r="26" fill="#1e88e5"/><text x="60" y="48" font-size="26" text-anchor="middle" fill="#fff" font-weight="800">+</text>'),'Out of pairs?','Tap <b>➕ Add numbers</b> to copy the remaining numbers to the end. Clear the board for +200.']]},
 {id:'water_sort',name:'Color Water Sort',icon:'🧪',c:'#4dd0e1,#7c4dff',desc:'Pour until every tube holds one colour.',best:'moves',low:1,
  how:[[I('<rect x="20" y="10" width="22" height="60" rx="10" fill="#fff2" stroke="#fff" stroke-width="2"/><rect x="22" y="40" width="18" height="28" rx="8" fill="#e53935"/><rect x="22" y="26" width="18" height="14" fill="#1e88e5"/><rect x="78" y="10" width="22" height="60" rx="10" fill="#fff2" stroke="#fff" stroke-width="2"/><rect x="80" y="54" width="18" height="14" rx="6" fill="#1e88e5"/><path d="M46 20 Q60 4 74 20" stroke="#ffd54a" stroke-width="3" fill="none" marker-end="url(#a)"/>'),'Tap, then tap','Tap a tube to lift it, then tap where to pour. Or drag one tube onto another.'],
   [I('<rect x="48" y="10" width="22" height="60" rx="10" fill="#fff2" stroke="#fff" stroke-width="2"/><rect x="50" y="12" width="18" height="56" rx="8" fill="#43a047"/><text x="90" y="44" font-size="22">✨</text>'),'Same colour on top','You can only pour onto the same colour or into an empty tube.'],
   [I('<text x="60" y="50" font-size="30" text-anchor="middle">↶ 🔄</text>'),'Stuck?','Undo or restart any time. Finish with every tube a single colour.']]},
 {id:'traffic_jam',name:'Traffic Jam',icon:'🚌',c:'#ff7ac8,#3d8bff',desc:'Drive cars out of the jam and fill them with passengers.',best:'taps',low:1,
  how:[[I('<rect x="10" y="10" width="100" height="60" rx="10" fill="#d9dcf5"/><rect x="24" y="22" width="18" height="36" rx="6" fill="#3d8bff"/><path d="M33 46 V30 m-6 6 l6 -6 l6 6" stroke="#fff" stroke-width="3" fill="none"/><rect x="52" y="34" width="36" height="18" rx="6" fill="#ff4d4d"/><path d="M62 43 h18 m-6 -6 l6 6 l-6 6" stroke="#fff" stroke-width="3" fill="none"/>'),'Tap to drive out','Each vehicle drives along its arrow. If something is in the way it bumps and comes back.'],
   [I('<rect x="8" y="44" width="104" height="28" rx="6" fill="#5c6377"/><rect x="18" y="50" width="22" height="16" rx="4" fill="#3d8bff"/><rect x="48" y="50" width="22" height="16" rx="4" fill="#fff3" stroke="#fff" stroke-dasharray="3"/><circle cx="20" cy="18" r="5" fill="#3d8bff"/><rect x="16" y="24" width="8" height="12" rx="4" fill="#3d8bff"/><circle cx="36" cy="18" r="5" fill="#3d8bff"/><rect x="32" y="24" width="8" height="12" rx="4" fill="#3d8bff"/><circle cx="52" cy="18" r="5" fill="#ff4d4d"/><rect x="48" y="24" width="8" height="12" rx="4" fill="#ff4d4d"/>'),'Park & board','Out-going vehicles park in the slots. Passengers board vehicles of their colour; full vehicles leave and free the slot.'],
   [I('<text x="60" y="50" font-size="26" text-anchor="middle">🅿️ 🔒 💡</text>'),'Don\'t gridlock','If every slot holds the wrong colour, you lose. One extra 🔒 slot per round. Higher levels: more vehicles & colours, fewer slots.']]},
 {id:'snake',name:'Snake',icon:'🐍',c:'#81c784,#2e7d32',desc:'Eat, grow, go through walls — just don\'t bite yourself.',best:'apples',
  how:[[I('<path d="M20 60 H60 V30 H90" stroke="#8bc34a" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" fill="none"/><circle cx="104" cy="30" r="6" fill="#e53935"/>'),'Swipe to steer','Swipe on the board or tap the big arrow buttons under it. Higher levels move faster.'],
   [I('<circle cx="60" cy="40" r="14" fill="#e53935"/><path d="M60 26 q4 -8 10 -8" stroke="#43a047" stroke-width="3" fill="none"/>'),'Eat apples','Each apple is 1 point and makes you longer.'],
   [I('<rect x="10" y="10" width="100" height="60" rx="6" fill="none" stroke="#7dd3fc" stroke-width="4" stroke-dasharray="8 5"/><path d="M78 40 H112 M8 40 H34" stroke="#8bc34a" stroke-width="10" stroke-linecap="round"/><text x="60" y="47" font-size="18" text-anchor="middle">↔</text>'),'Walls wrap around','Go through a wall and you come back from the opposite side on the same line. Only biting yourself ends the round.']]},
 {id:'checkers',name:'Checkers',icon:'<svg class="ckico" viewBox="0 0 40 40" width="1em" height="1em" aria-hidden="true"><rect width="40" height="40" rx="6" fill="#f1d9b5"/><rect width="20" height="20" fill="#8d5a3b"/><rect x="20" y="20" width="20" height="20" fill="#8d5a3b"/><circle cx="10" cy="10" r="7.5" fill="#e53935" stroke="#7f1d1d" stroke-width="2"/><circle cx="30" cy="30" r="7.5" fill="#212121" stroke="#000" stroke-width="2"/><circle cx="10" cy="10" r="3.5" fill="none" stroke="#ffcdd2" stroke-width="1.5"/></svg>',c:'#ef5350,#8d6e63',desc:'Beat the computer. Capture backwards, flying kings.',best:'pts',
  how:[[I('<rect x="30" y="10" width="60" height="60" fill="#8b5a2b"/><circle cx="45" cy="55" r="10" fill="#d32f2f"/><circle cx="75" cy="25" r="10" fill="#4caf50" opacity=".5"/>'),'Move diagonally','Tap or drag a red piece onto a green square. Pieces step forward, but can <b>capture forwards and backwards</b>.'],
   [I('<circle cx="30" cy="58" r="10" fill="#d32f2f"/><circle cx="60" cy="40" r="10" fill="#333"/><path d="M34 50 L84 20" stroke="#ffd54a" stroke-width="3" stroke-dasharray="5 4"/>'),'Jumps are forced','If you can capture, you must. Keep jumping while you can.'],
   [I('<circle cx="60" cy="40" r="20" fill="#d32f2f"/><text x="60" y="48" font-size="20" text-anchor="middle" fill="#ffd54a">♛</text>'),'Flying kings','Reach the far row to crown a king. Kings fly any distance along a diagonal and can jump from far away. Win, lose or draw.']]},
 {id:'market_trader',name:'Market Trader',icon:'📈',c:'#26c6da,#1565c0',desc:'Buy low, sell high in 60 seconds. Can you beat the market?',best:'%',
  how:[[I('<polyline points="5,60 25,50 40,62 60,30 80,40 100,15 115,22" stroke="#4caf50" stroke-width="3" fill="none"/>'),'Watch the price','A seeded market runs for 60 seconds.'],
   [I('<rect x="10" y="24" width="45" height="32" rx="8" fill="#1e88e5"/><text x="32" y="45" font-size="12" text-anchor="middle" fill="#fff">BUY</text><rect x="65" y="24" width="45" height="32" rx="8" fill="#e53935"/><text x="87" y="45" font-size="12" text-anchor="middle" fill="#fff">SELL</text>'),'Buy low, sell high','Buy all with your cash, sell all to lock in profit.'],
   [I('<text x="60" y="50" font-size="26" text-anchor="middle">+25% = 💰</text>'),'Profit wins','Make +12% profit to win the level. Holdings are sold at the end.']]}];
let CFG=null,SES=null,stopFn=null,NTODAY={},REP={},LV={},PICK={},RUN=0;
const MPL=()=>(CFG&&CFG.max_paid_level)||10,mult=L=>1+((CFG&&CFG.level_step)??.2)*(Math.min(L,MPL())-1)+((CFG&&CFG.level_step_high)??.05)*Math.max(L-MPL(),0);const unl=id=>(LV[id]&&LV[id].unlocked)||1;
const PCAP=()=>(CFG&&CFG.paid_rounds_per_day)||20,LMAXC=()=>(CFG&&CFG.max_level)||100,paidTxt=id=>`Paid rounds today: ${Math.min(NTODAY[id]||0,PCAP())}/${PCAP()}`;
const howOf=g=>g.how;const _howOld=g=>[...g.how,[I('<text x="60" y="50" font-size="24" text-anchor="middle">💵 20/day</text>'),'20 paid rounds a day',`Each game pays for ${PCAP()} rounds a day (resets daily). After that you can play on for fun and levels still unlock, but rounds pay $0.`]];
const fmx=m=>'×'+(Math.round(m*100)/100);
function shell(){let o=$('#games');if(!o){o=document.createElement('div');o.id='games';document.body.appendChild(o);
  o.addEventListener('click',e=>{if(e.target.closest('.gbar button,.gx,.gcard,.gstart'))X.sfx('tap')},true)}
 o.classList.remove('hidden');document.documentElement.classList.add('gplaying');return o}
// Leaving the games removes every overlay the games/fx layer may have added (end pop-up, how-to, hint, confetti, floats),
// so nothing invisible is left on top of the map's panels (r6 tap bug).
function sweep(){document.querySelectorAll('.gpop,.fxmodal,.fxhint,.fxtoast,.fxfloat,.fxcoin,.fxconf,.wstream').forEach(e=>e.remove())}
function close(){RUN++;if(stopFn)stopFn();stopFn=null;$('#games')?.classList.add('hidden');document.documentElement.classList.remove('gplaying');sweep();window.refreshAll&&window.refreshAll();setTimeout(()=>window.Guide&&Guide.check&&Guide.check(),400)}
// Same formula as finish_game (display only): base × mult(L) × max(floor, diminish^n); n = back-to-back paid replays of this same level today (r15).
const repN=(g,L)=>REP[g]&&REP[g].level==L?REP[g].n:0;
const nextReward=(g,k=0,L=1)=>{const c=CFG.games[g];if((NTODAY[g]||0)+k>=PCAP())return 0;return c.base*mult(L)*Math.max(CFG.floor,Math.pow(CFG.diminish,repN(g,L)+k))};
const gear=()=>`<button class="gx gi2" id="gSet" title="Sound & vibration">⚙️</button>`;
async function open(){if(window.SA_OPEN)return SA_OPEN();const o=shell();delete o.dataset.g;o.innerHTML='<div class="gwrap"><div class="gskel"></div></div>';
 try{CFG=CFG||await DB.gameConfig();const [t,n,lv,rp]=await Promise.all([DB.gamesToday(),DB.gamesRewardedToday?DB.gamesRewardedToday().catch(()=>({})):{},DB.gameLevels?DB.gameLevels().catch(()=>({})):{},DB.gamesRepeatToday?DB.gamesRepeatToday().catch(()=>({})):{}]);NTODAY=n||{};LV=lv||{};REP=rp||{};
  const b=X.best?(id=>(JSON.parse(localStorage.getItem('plot.fx.best')||'{}'))[id]):()=>null;
  o.innerHTML=`<div class="gwrap"><div class="ghead"><h2>🎮 Games</h2>${gear()}<button class="gx" id="gClose">✕</button></div>
  <div class="ghero"><div><small>Earned today</small><b>${usd(t.earned)}</b></div>${t.paused?`<p class="gleft">⏸ Rewards paused pending a quick review by the founder.</p>`:''}
   <p>Real game USD, newly minted. Win a level to unlock the next: each level pays more: +${Math.round(((CFG.level_step??.2))*100)}% per level up to level ${MPL()} (${fmx(mult(MPL()))}), then +${Math.round(((CFG.level_step_high??.05))*100)}% per level up to ${fmx(mult(LMAXC()))} at level ${LMAXC()}. Replaying the same level back to back pays ${Math.round(CFG.diminish*100)}% of the last (min ${Math.round(CFG.floor*100)}%); moving to another level resets it, so a higher level always pays more. Each game pays for up to ${PCAP()} rounds a day (resets daily); after that, play on for fun. ${LMAXC()} levels per game.</p></div>
  <div class="glist">${LIST.filter(g=>CFG.games[g.id]).map((g,i)=>{const L=unl(g.id),nr=nextReward(g.id,0,L),fresh=!(NTODAY[g.id]>0),bb=b(g.id);return `<button class="gcard" data-g="${g.id}" style="--gc:linear-gradient(135deg,${g.c});animation-delay:${i*45}ms">
   <span class="gi">${g.icon}</span><i class="glv">Lv ${L}</i><b>${g.name}</b><small>${g.desc}</small><em>${(NTODAY[g.id]||0)>=PCAP()?'⛔ Paid rounds used up today':`${fresh?'🟢 Fresh · ':''}next up to ${usd(nr)}`}</em><i class="gpaid">${paidTxt(g.id)}</i>${bb!=null?`<i class="gbest">🏆 ${bb} ${g.best}</i>`:''}</button>`}).join('')}</div></div>`;
  $('#gClose').onclick=close;$('#gSet').onclick=()=>X.settings();o.querySelectorAll('[data-g]').forEach(b=>b.onclick=()=>pre(b.dataset.g));
 }catch(e){o.innerHTML=`<div class="gwrap"><button class="gx" onclick="Games.close()">✕</button><p>⚠ ${esc(e.message)}</p></div>`}}
// Pre-round card: reward preview with diminishing returns, best score, how-to. The server session starts only on "Play".
async function pre(id,lvl){if(window.SA_PRE)return SA_PRE(id,lvl);const o=shell(),g=LIST.find(x=>x.id==id);CFG=CFG||await DB.gameConfig();const c=CFG.games[id];
 const U=unl(id),L=PICK[id]=Math.max(1,Math.min(U,lvl||PICK[id]||U));
 const steps=[0,1,2,3].map(k=>nextReward(id,k,L)),bb=(JSON.parse(localStorage.getItem('plot.fx.best')||'{}'))[id];
 o.innerHTML=`<div class="gwrap"><div class="ghead"><button class="gx" id="gBack">‹</button><h2>${g.icon} ${g.name}</h2>${gear()}</div>
 <div class="gpre" style="--gc:linear-gradient(135deg,${g.c})"><div class="gpi">${g.icon}</div><p>${g.desc}</p>
  <div class="glvl"><small>Level ${L} of ${LMAXC()}</small><div class="gwld">${Array.from({length:Math.ceil(LMAXC()/10)},(_,w)=>{const s=Math.max(0,Math.min(10,U-1-w*10));return `<button class="${Math.ceil(L/10)==w+1?'on':''} ${w*10+1>U?'lock':''}" data-w="${w}" ${w*10+1>U?'disabled':''}><b>${w*10+1>U?'🔒':''}World ${w+1}</b><small>${'★'.repeat(Math.round(s/2))}${'☆'.repeat(5-Math.round(s/2))} ${s}/10</small></button>`}).join('')}</div>
  <div class="glvr">${Array.from({length:10},(_,k)=>Math.floor((L-1)/10)*10+k+1).filter(k=>k<=LMAXC()).map(k=>k<=U?`<button class="${k==L?'on':''}" data-lv="${k}"><b>${k}</b><small>${k<U?'⭐':'▶'} ${fmx(mult(k))}</small></button>`:`<button class="lock" disabled><b>🔒${k}</b><small>${fmx(mult(k))}</small></button>`).join('')}</div>
  <p class="gsub">Level ${L} pays <b>${fmx(mult(L))}</b>${repN(id,L)>0?` · ${repN(id,L)} replay${repN(id,L)>1?'s':''} of this level today, so the next pays ${Math.round(Math.max(CFG.floor,Math.pow(CFG.diminish,repN(id,L)))*100)}% (play a different level to reset)`:''}. ${L<U?'Replaying an easier level — fine for practice.':U>=LMAXC()?'Top level — well played!':`Score the full target to unlock level ${U+1}.`}</p>
  <p class="gsub gpaidp"><b>${paidTxt(id)}</b>${(NTODAY[id]||0)>=PCAP()?' — today\'s paid rounds are used up; play on for fun (resets at midnight).':''}</p></div>
  <div class="gladder">${steps.map((v,k)=>`<div class="${k?'':'now'}"><small>${k?'then':'this round'}</small><b>${usd(v)}</b></div>`).join('<span>›</span>')}</div>
  <p class="gsub">Max reward for a top score. Play at least ${c.min_secs}s per round. ${bb!=null?`Your best: <b>${bb} ${g.best}</b>.`:''}</p>
  <button class="gstart" id="gGo">▶ Play</button><button class="gx2" id="gHow">❓ How to play</button></div></div>`;
 $('#gBack').onclick=open;$('#gSet').onclick=()=>X.settings();$('#gHow').onclick=()=>X.howTo(id,g.name,howOf(g),true);
 o.querySelectorAll('[data-lv]').forEach(b=>b.onclick=()=>{X.sfx('select');pre(id,+b.dataset.lv)});
 o.querySelectorAll('[data-w]').forEach(b=>b.onclick=()=>{X.sfx('select');pre(id,Math.min(U,+b.dataset.w*10+(+b.dataset.w*10+10<=U?10:U-+b.dataset.w*10)))});o.querySelector('.gwld .on')?.scrollIntoView({inline:'center',block:'nearest'});
 o.querySelector('#gGo').onclick=async()=>{await X.howTo(id,g.name,howOf(g));play(id,L)};if(id=='market_trader'&&window.R46)R46.mtOwner(o.querySelector('.gpre'))}
// r11 human check: Cloudflare Turnstile every ~10 games; token verified server-side by the human-check edge function.
const TS_KEY='0x4AAAAAAFj1sNNe7bLNfZxv';
function tsLoad(){return window.turnstile?Promise.resolve():new Promise((ok,no)=>{const s=document.createElement('script');s.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';s.async=true;s.onload=ok;s.onerror=()=>no(new Error('Could not load the human check'));document.head.appendChild(s)})}
function humanCheck(){return new Promise(async res=>{const box=document.createElement('div');box.className='gpop on';
  box.innerHTML=`<div class="gpopc"><div class="gpopi">🙋</div><h3>Quick human check</h3><p class="gsub">Every few games we check a real person is playing. Rewards keep flowing after this.</p><div id="tsBox" style="display:flex;justify-content:center;min-height:70px"></div><p class="gsub" id="tsMsg"></p><div class="gbar"><button class="sec" id="tsX">Cancel</button></div></div>`;
  document.body.appendChild(box);let done=false;const fin=v=>{if(done)return;done=true;box.remove();res(v)};box.querySelector('#tsX').onclick=()=>fin(false);
  try{await tsLoad();const wid=turnstile.render(box.querySelector('#tsBox'),{sitekey:TS_KEY,action:'games',theme:'auto',
    callback:async tok=>{const m=box.querySelector('#tsMsg');m.textContent='Checking…';try{const r=await DB.humanCheck(tok);if(r&&r.ok){X.toast('✅ Thanks! Back to the game.');fin(true)}else throw new Error(r?.error||'failed')}catch(e){m.textContent='⚠ '+e.message+' — try again';turnstile.reset(wid)}},
    'error-callback':()=>{box.querySelector('#tsMsg').textContent='⚠ Human check could not load — check your connection and try again'},'expired-callback':()=>turnstile.reset(wid)})}
  catch(e){box.querySelector('#tsMsg').textContent='⚠ '+e.message}})}
async function play(id,L){L=L||PICK[id]||unl(id);if(stopFn)stopFn();stopFn=null;sweep();const o=shell();const g=LIST.find(x=>x.id==id);CFG=CFG||await DB.gameConfig().catch(()=>null);
 try{SES=await DB.startGame(id,L)}catch(e){if(/HUMAN_CHECK/.test(e.message)){if(await humanCheck())return play(id,L);return}X.fx('error','error');X.toast('⚠ '+esc(e.message));return}
 o.innerHTML=`<div class="gwrap gplay" data-game="${id}"><div class="ghead"><button class="gx" id="gBack">‹</button><h2>${g.icon} ${g.name} <small class="glvt">Lv ${L} · ${fmx(mult(L))}</small></h2><span id="gScore" class="gsc"></span><button class="gx gi2" id="gHelp">❓</button>${gear()}</div><div class="gprog"><i id="gProg"></i></div><div id="gArea"></div></div>`;bindPress();
 $('#gBack').onclick=()=>{RUN++;if(stopFn)stopFn();stopFn=null;sweep();pre(id,L)};$('#gSet').onclick=()=>X.settings();$('#gHelp').onclick=()=>X.howTo(id,g.name,howOf(g),true);
 const rng=rngOf(SES.seed);const area=$('#gArea');const t0=Date.now();let ended=false;const run=++RUN;
 const done=async(score,result={},log)=>{if(ended)return;ended=true;if(stopFn)stopFn();stopFn=null;result.client_secs=Math.round((Date.now()-t0)/1000);
  let r;try{r=id=='market_trader'?await DB.mtFinish(SES.id):id=='memory'?await DB.mmFinish(SES.id):id=='quiz'?await DB.qzFinish(SES.id):await DB.verifyGame(SES.id,log||{},{client_score:score,client_secs:result.client_secs})}catch(e){r={ok:false,reason:e.message,reward:0}}
  if(r&&r.score!=null&&r.ok)score=+r.score; // the server's replayed score is the one that counts
  if(r.paid_today!=null)NTODAY[id]=r.paid_today;else if(r.ok&&r.reward>0)NTODAY[id]=(NTODAY[id]||0)+1;if(r.ok&&(r.reward>0||r.held>0)&&r.repeat_n!=null)REP[id]={level:r.level,n:r.repeat_n};if(r.unlocked)LV[id]={...(LV[id]||{}),unlocked:r.unlocked};
  if(run!==RUN||$('#games')?.classList.contains('hidden'))return; // player already left: no pop-up over the map
  const loss=r.ok&&r.outcome=='loss';const won=r.ok&&r.reward>0&&!loss,bscore=g.low?(score>0?result.moves:0):score,bs=r.ok&&score>0?X.best(id,bscore,g.low):{};
  const why={'too fast':`Rounds must last at least ${CFG?.games?.[id]?.min_secs||'a few'} seconds.`,'implausible score rate':'That score came in too fast to count.'}[r.reason]||(/^not verified/.test(r.reason||'')?'The server replayed this round and it did not check out, so it was not paid.':esc(r.reason||''));
  const box=document.createElement('div');box.className='gpop';
  box.innerHTML=`<div class="gpopc ${won?'win':loss?'meh loss':r.ok?'meh':'bad'}"><div class="gpopi">${won?'🏆':loss?(id=='market_trader'?'📉':'😕'):r.ok?'🎯':'⚠️'}</div>${(()=>{const n=starsOf(id,r,score,result);return r.ok?`<div class="gstars" data-n="${n}">${[1,2,3].map(k=>`<i class="${k<=n?'on':''}" style="--d:${k*180}ms">★</i>`).join('')}</div>`:''})()}<h3>${won?(r.outcome=='win'?'Nice!':'Good round!'):loss?(id=='market_trader'?'Loss — no profit':'No score'):r.ok?'Round over':'Not rewarded'}</h3>
   <div class="gpops"><div><small>${id=='market_trader'?'Profit':'Score'}</small><b>${id=='market_trader'&&r.profit_pct!=null?(r.profit_pct>0?'+':'')+r.profit_pct+'%':score}</b></div><div><small>Level ${L}</small><b>${fmx(mult(L))}</b></div><div><small>Reward</small><b class="grw" id="gRw">$0</b></div></div>
   ${r.level_up?`<p class="gnew">🔓 Level ${L+1} unlocked!</p>`:''}
   ${bs.isNew?`<p class="gnew">⭐ New best: ${bscore} ${g.best}</p>`:bs.best!=null?`<p class="gsub">Best: ${bs.best} ${g.best}</p>`:''}${r.ok?'':`<p class="gsub">${why}</p>`}${id=='market_trader'&&r.ok&&r.tip?`<p class="gsub">💡 ${r.tip}${r.completion_min?' 🎟️':''}</p>`:''}${loss?`<p class="gsub">${id=='market_trader'?`You finished with ${usd(r.final||0)} from $10,000. `:''}No level-up this time. Have another go!</p>`:''}
   ${r.cap_reached?`<p class="gnew">You've used today's ${PCAP()} paid rounds for this game; play on for fun or try another game. Resets at midnight.</p>`:''}${r.paid_today!=null?`<p class="gsub">${paidTxt(id)}</p>`:''}
   ${r.note&&!r.cap_reached?`<p class="gsub">⚠ ${esc(r.note)}${r.held?` (${usd(r.held)} held)`:''}</p>`:''}
   ${r.today?`<p class="gsub">Today ${usd(r.today.earned)} · next ${g.name} up to ${usd(nextReward(id,0,L))}</p>`:''}
   <div class="gbar">${r.level_up?`<button id="gNext">▶ Level ${L+1}</button>`:''}<button id="gAgain" class="${r.level_up?'sec':''}">↻ Level ${L}</button><button class="sec" id="gMenu">All games</button></div></div>`;document.body.appendChild(box);
  requestAnimationFrame(()=>box.classList.add('on'));
  if(won){X0.fx('win','big');if(!LITE())setTimeout(()=>X.confetti(r.outcome=='win'?140:60),150);X.countUp($('#gRw'),r.reward,1000);setTimeout(()=>{X.sfx('coin');const e=$('#gRw');if(e&&!LITE()){const b=e.getBoundingClientRect();X0.burst&&X0.burst(b.left+b.width/2,b.top,8,'🪙')}},1050);box.querySelectorAll('.gstars i.on').forEach((e,k)=>setTimeout(()=>X.sfx('tick'),300+k*180))}else{X0.fx(r.ok?'lose':'error','error');$('#gRw').textContent=usd(r.reward||0);if(!LITE()){const c=box.querySelector('.gpopc');setTimeout(()=>{c.classList.add('gshk')},250)}}
  $('#gAgain').onclick=()=>{box.remove();pre(id,L)};if($('#gNext'))$('#gNext').onclick=()=>{box.remove();pre(id,L+1)};$('#gMenu').onclick=()=>{box.remove();open()}};
 const setScore=t=>{const e=$('#gScore');if(e&&e.textContent!=t){e.textContent=t;e.classList.remove('bump');void e.offsetWidth;e.classList.add('bump')}};
 GAMES[id](area,rng,done,setScore,L,SES);juiceStart(id);}

// ---------------- Number Match (Take Ten) ----------------
// Levels: fewer starting numbers and fewer ➕ Adds as the level rises (same 300-point target).
function numberMatch(A,rng,done,setScore,L=1){const W=9;let cells=[],sel=-1,score=0,adds=Math.max(1,6-L),pairs=0,lock=false;const LG={a:[]},fin=(sc,r)=>done(sc,r,LG);
 const s0=GC.nmInit(rng,L),n0=s0.n0;cells=s0.cells.slice();adds=s0.adds;
 const clear=(i,j,st)=>{for(let k=i+st;k<j;k+=st)if(cells[k])return false;return true};
 const free=(i,j)=>{if(i>j)[i,j]=[j,i];if(clear(i,j,1))return true;
  if((j-i)%W==0&&clear(i,j,W))return true;
  const dr=Math.floor(j/W)-Math.floor(i/W),dc=j%W-i%W;  // diagonals (both directions), no wrap
  if(dr>0&&Math.abs(dc)==dr)return clear(i,j,W+Math.sign(dc));return false};
 const match=(i,j)=>i!=j&&cells[i]&&cells[j]&&(cells[i]==cells[j]||cells[i]+cells[j]==10)&&free(i,j);
 const anyMove=()=>{for(let i=0;i<cells.length;i++)if(cells[i])for(let j=i+1;j<cells.length;j++)if(match(i,j))return true;return false};
 function render(){setScore(score+' pts');progT(score);
  A.innerHTML=`<div class="nm" style="grid-template-columns:repeat(${W},1fr)">${cells.map((v,i)=>`<button data-i="${i}" class="${v?'n'+v:'x'} ${i==sel?'s':''}">${v||''}</button>`).join('')}</div>
  <div class="gbar"><button id="nmAdd" ${adds?'':'disabled'}>➕ Add (${adds})</button><button class="sec" id="nmHint">💡 Hint −5</button><button class="sec" id="nmEnd">🏁 Finish</button></div>
  <p class="gsub">Equal or sum to 10, nothing in between — across, up–down, diagonal or wrap. +15 pair · +25 row · +200 clear. Level ${L}: ${n0} numbers, ${Math.max(1,6-L)} adds.</p>`;
  A.querySelectorAll('[data-i]').forEach(b=>b.onclick=()=>tap(+b.dataset.i,b));
  $('#nmAdd').onclick=()=>{if(!adds)return;adds--;LG.a.push('a');cells=cells.concat(cells.filter(Boolean));sel=-1;fx('levelup','success');render();A.querySelector('.nm').classList.add('grow')};
  $('#nmHint').onclick=()=>{LG.a.push('h');for(let i=0;i<cells.length;i++)for(let j=i+1;j<cells.length;j++)if(match(i,j)){A.querySelector(`[data-i="${i}"]`).classList.add('h');A.querySelector(`[data-i="${j}"]`).classList.add('h');score=Math.max(0,score-5);setScore(score+' pts');X.sfx('select');return}
   X.hint(adds?'No pairs left — tap ➕ Add to copy the numbers down.':'No pairs and no adds left — tap 🏁 Finish.',{host:A})};
  $('#nmEnd').onclick=()=>{if(lock)return;LG.a.push('f');fin(score,{pairs})};
  if(!anyMove()&&adds)X.hint('No pairs left — tap ➕ Add to copy the remaining numbers.',{id:'nm_stuck',host:A})}
 function tap(i,btn){if(lock||!cells[i])return;if(sel<0||sel==i){A.querySelector('.nm .s')?.classList.remove('s');sel=sel==i?-1:i;if(sel>=0)btn.classList.add('s');X.fx('select','tick');return}
  if(match(sel,i)){const a=A.querySelector(`[data-i="${sel}"]`);a.classList.add('pop');btn.classList.add('pop');at(btn,'+15');fx('match','tick');lock=true;const s0=sel;
   setTimeout(()=>{lock=false;LG.a.push([s0,i]);cells[s0]=0;cells[i]=0;score+=15;pairs++;let rows=0;
    for(let r=Math.floor(cells.length/W);r>=0;r--){const row=cells.slice(r*W,r*W+W);if(row.length==W&&row.every(v=>!v)){cells.splice(r*W,W);score+=25;rows++}}
    if(rows){fx('coin','success');X.toast(`🧹 Row cleared +${25*rows}`,A)}
    while(cells.length&&!cells[cells.length-1])cells.pop();sel=-1;
    if(!cells.some(Boolean)){score+=200;render();return fin(score,{pairs,cleared:true})}
    if(!anyMove()&&!adds){render();return fin(score,{pairs,stuck:true})}render()},170)}
  else{const ok=cells[sel]==cells[i]||cells[sel]+cells[i]==10;fx('error','error');shake(btn);
   if(ok)X.hint('Something is in between — pairs need a clear path.',{id:'nm_path',host:A});A.querySelector('.nm .s')?.classList.remove('s');sel=i;btn.classList.add('s')}}
 render()}

// ---------------- Color Water Sort ----------------
const WCOL=['#ff4d5e','#3d8bff','#3ccf6e','#ffd23f','#b14dff','#ff9a3c','#22d3ee','#ff6fb5','#8d6e63','#c6ff3d','#ffffff','#1a237e','#00897b','#ffab91'];
function solvable(tubes,cap){const key=t=>t.map(x=>x.join(',')).sort().join('|');const seen=new Set();let budget=150000;
 const won=t=>t.every(x=>!x.length||(x.length==cap&&x.every(c=>c==x[0])));
 const dfs=t=>{if(won(t))return true;if(--budget<0)return false;const k=key(t);if(seen.has(k))return false;seen.add(k);
  for(let a=0;a<t.length;a++){if(!t[a].length)continue;const c=t[a][t[a].length-1];let run=0;for(let i=t[a].length-1;i>=0&&t[a][i]==c;i--)run++;
   if(run==t[a].length&&run==cap)continue;
   for(let b=0;b<t.length;b++){if(a==b||t[b].length==cap)continue;const top=t[b][t[b].length-1];if(t[b].length&&top!=c)continue;if(!t[b].length&&run==t[a].length)continue;
    const n=Math.min(run,cap-t[b].length);const nt=t.map(x=>x.slice());for(let i=0;i<n;i++)nt[b].push(nt[a].pop());if(dfs(nt))return true}}return false};
 return dfs(tubes)}
// Levels: one more colour per level (4 at level 1, 11 from level 8), always 2 empty tubes.
// Pour animation (r6): lift → glide so the mouth sits over the target → tilt while a stream runs and the levels ease
// down/up together → return. All transform/flex-basis on the compositor via WAAPI; state applies once at the end.
function waterSort(A,rng,done,setScore,L=1){const P0=GC.wsInit(rng,L),cap=P0.cap,nc=P0.nc;let tubes=P0.tubes,moves=0,hist=[],sel=-1,busy=false,noProg=0;const LG={a:[]};
 // hidden layers (L10+): the bottom segments show as ? until they become the top of their tube once
 const hv=tubes.map(t=>Math.max(0,Math.min(P0.hidden,t.length-1)));
 const start=tubes.map(x=>x.slice());
 const full=x=>x.length==cap&&x.every(c=>c==x[0]);
 const won=()=>tubes.every(x=>!x.length||full(x));
 const canPour=(a,b)=>{const A1=tubes[a],B1=tubes[b];if(a==b||!A1.length||B1.length==cap)return false;const c=A1[A1.length-1];if(B1.length&&B1[B1.length-1]!=c)return false;if(!B1.length&&A1.every(x=>x==c))return false;return true};
 const legal=(a,b)=>{const A1=tubes[a],B1=tubes[b];if(a==b||!A1.length||B1.length==cap)return false;return !B1.length||B1[B1.length-1]==A1[A1.length-1]};
 const stuck=()=>{for(let a=0;a<tubes.length;a++)for(let b=0;b<tubes.length;b++)if(canPour(a,b))return false;return true};
 const setSel=i=>{A.querySelector('.tube.s')?.classList.remove('s');sel=i;if(i>=0)A.querySelector(`[data-t="${i}"]`)?.classList.add('s')};
 function render(){setScore(moves+' moves');prog(tubes.filter(t=>t.length==cap&&t.every(c=>c==t[0])).length/nc);A.innerHTML=`<div class="ws ${tubes.length>9?'many':''}">${tubes.map((t,i)=>`<button class="tube ${i==sel?'s':''} ${full(t)?'done':''}" data-t="${i}"><span class="liq">${(hv[i]=Math.min(hv[i],Math.max(0,t.length-1)),t.map((c,k)=>k<hv[i]?`<i style="--c:#55596a" class="hid">?</i>`:`<i style="--c:${WCOL[c]}" class="${k==t.length-1?'top':''}"></i>`).join(''))}</span></button>`).join('')}</div>
  <div class="gbar"><button class="sec" id="wsU" ${hist.length?'':'disabled'}>↶ Undo</button><button class="sec" id="wsR">🔄 Restart</button><button class="sec" id="wsG">🏳 Give up</button></div><p class="gsub">Level ${L}: ${nc} colours, ${tubes.length-nc} spare tubes${P0.hidden?`, up to ${P0.hidden} hidden (?) layers per tube — they show once uncovered`:''}. Tap a tube, then where to pour — or drag one tube onto another. Same colour or empty only.</p>`;
  $('#wsU').onclick=()=>{if(hist.length&&!busy){LG.a.push('u');tubes=hist.pop();moves++;sel=-1;X.sfx('tap');render()}};$('#wsR').onclick=()=>{if(busy)return;LG.a.push('r');tubes=start.map(x=>x.slice());hist=[];sel=-1;moves++;render()};$('#wsG').onclick=()=>{if(!busy){LG.a.push('g');done(0,{moves,gave_up:true},LG)}};
  const ws=A.querySelector('.ws');let drag=null;
  ws.onpointerdown=e=>{const b=e.target.closest('[data-t]');if(!b||busy)return;drag={i:+b.dataset.t,x:e.clientX,y:e.clientY,moved:false,el:b}};
  ws.onpointermove=e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(!drag.moved&&Math.hypot(dx,dy)>12&&tubes[drag.i].length){drag.moved=true;drag.el.classList.add('drag');try{ws.setPointerCapture(e.pointerId)}catch(_){}}
   if(drag.moved)drag.el.style.transform=`translate(${dx}px,${dy-14}px) rotate(${Math.max(-25,Math.min(25,dx/4))}deg)`};
  ws.onpointerup=ws.onpointercancel=e=>{if(!drag)return;const d=drag;drag=null;try{ws.releasePointerCapture(e.pointerId)}catch(_){}if(!d.moved){tap(d.i);return}
   d.el.style.transform='';d.el.classList.remove('drag');const tg=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-t]');
   if(tg&&+tg.dataset.t!=d.i){sel=d.i;tap(+tg.dataset.t,true)}else{setSel(-1)}}}
 function pour(from,to,quick){const a=tubes[from],b=tubes[to],c=a[a.length-1];let n=0;for(let k=a.length-1;k>=0&&a[k]==c&&b.length+n<cap;k--)n++;
  const apply=()=>{A.querySelectorAll('.wstream').forEach(e=>e.remove());document.querySelectorAll('.wstream').forEach(e=>e.remove());
   const before=tubes.filter(full).length;LG.a.push([from,to]);hist.push(tubes.map(x=>x.slice()));for(let k=0;k<n;k++)b.push(a.pop());moves++;sel=-1;busy=false;render();
   const after=tubes.filter(full).length;if(after>before){fx('match','success');const el=A.querySelector(`[data-t="${to}"]`);el&&el.classList.add('pop');at(el,'✨')}else{noProg++}
   if(won()){fx('levelup','big');return setTimeout(()=>done(1,{moves,level:L},LG),600)}
   if(stuck())X.hint('No pours left — tap ↶ Undo or 🔄 Restart.',{id:'ws_stuck',max:5,host:A});else if(noProg>=14){noProg=0;X.hint('Tip: use the empty tubes to park colours and build one colour at a time.',{id:'ws_tip',max:2,host:A})}};
  const fe=A.querySelector(`[data-t="${from}"]`),te=A.querySelector(`[data-t="${to}"]`);
  if(!fe||!te||!fe.animate||matchMedia('(prefers-reduced-motion: reduce)').matches){X.sfx('pourLong',.35);return apply()}
  busy=true;fe.classList.remove('s');
  const fr=fe.getBoundingClientRect(),tr=te.getBoundingClientRect(),right=tr.left>=fr.left,lift=sel==from?-18:0;
  const tx=tr.left+tr.width/2+(right?-1:1)*tr.width*.3,ty=tr.top-14,dx=tx-(fr.left+fr.width/2),dy=ty-fr.top-fr.height*.08,rot=right?72:-72;
  const T1=quick?200:300,TP=150+170*n,T2=280,TT=T1+TP+T2;
  fe.style.transformOrigin='50% 0';fe.style.zIndex=20;fe.style.transition='none';
  const mv=fe.animate([{transform:`translate(0,${lift}px) rotate(0)`,easing:'cubic-bezier(.3,.1,.3,1)'},{transform:`translate(${dx}px,${dy}px) rotate(${rot*.55}deg)`,offset:T1/TT,easing:'cubic-bezier(.4,0,.6,1)'},
   {transform:`translate(${dx}px,${dy}px) rotate(${rot}deg)`,offset:(T1+TP)/TT,easing:'cubic-bezier(.4,0,.2,1)'},{transform:'translate(0,0) rotate(0)'}],{duration:TT});
  // levels: source top segments drain, new target segments fill (same timing, eased)
  const segs=[...fe.querySelectorAll('.liq i')].slice(-n),tl=te.querySelector('.liq');
  segs.forEach(e=>e.animate([{flexBasis:'25%'},{flexBasis:'0%'}],{delay:T1,duration:TP,fill:'forwards',easing:'ease-in-out'}));
  tl.querySelector('.top')?.classList.remove('top');
  for(let k=0;k<n;k++){const e=document.createElement('i');e.style.setProperty('--c',WCOL[c]);e.style.flexBasis='0%';if(k==n-1)e.className='top';tl.appendChild(e);
   e.animate([{flexBasis:'0%'},{flexBasis:'25%'}],{delay:T1+40+k*(TP-40)/n,duration:(TP-40)/n,fill:'forwards',easing:'ease-in-out'})}
  te.classList.add('fill');
  // stream from the mouth into the target's liquid surface
  const surf=tr.bottom-6-(b.length/cap)*(tr.height*.94),st=document.createElement('div');st.className='wstream';
  Object.assign(st.style,{left:(tx-3)+'px',top:ty+'px',height:Math.max(8,surf-ty)+'px',background:`linear-gradient(${WCOL[c]},color-mix(in srgb,${WCOL[c]} 70%,#fff))`});document.body.appendChild(st);
  st.animate([{transform:'scaleY(0)',opacity:1},{transform:'scaleY(1)',opacity:1,offset:.12},{transform:'scaleY(1)',opacity:1,offset:.85},{transform:'scaleY(1) translateY(6px)',opacity:0}],{delay:T1-40,duration:TP+80,fill:'both',easing:'linear'});
  setTimeout(()=>{X.sfx('pourLong',TP/1000);X.buzz([6,60,6,60,6])},T1);
  const fin=()=>{if(!busy)return;fe.style.zIndex='';apply()};mv.onfinish=fin;setTimeout(fin,TT+120)}
 function tap(i,dragged){if(busy)return;if(sel<0){if(tubes[i].length){setSel(i);X.fx('select','tick')}return}if(sel==i){setSel(-1);X.sfx('tap');return}
  if(!legal(sel,i)){const b=tubes[i];if(b.length){X.fx('error','error');shake(A.querySelector(`[data-t="${i}"]`));
    X.hint(b.length==cap?'That tube is full.':'You can only pour onto the same colour or into an empty tube.',{id:'ws_rule',host:A})}
   if(tubes[i].length&&!dragged){setSel(i)}else setSel(-1);return}
  pour(sel,i,dragged)}
 render()}

// ---------------- Traffic Jam (Rush Hour style) ----------------
// 6×6 lot, exit on the right of row 3. Puzzles are generated from the server seed and solved by BFS so every level
// is solvable; higher levels search for longer minimum solutions (more cars, more moves).
// ---------------- Traffic Jam (Car Out / Bus Jam) ----------------
// Lot of vehicles with arrows. Tap one: it drives off along its arrow if the lane to the lot edge is clear (else bumps back).
// Exited vehicles park in slots; the passenger queue boards matching colours; full vehicles leave. Win: everyone boarded.
// Solvable by construction: vehicles are placed so each new one has a clear exit among those already placed, so reverse
// placement order always drives out; the passenger queue is produced by simulating that order with the same greedy boarding rule.
const BJCOL=['#ff4d4d','#3d8bff','#ffc928','#35c759','#ff7ac8','#a66bff','#ff9a2e','#22c7c7','#b07a4f','#e8eaed','#1f3a93','#9acd32'],BJD=[[0,-1],[1,0],[0,1],[-1,0]];
const bjCells=v=>{const r=[];for(let j=0;j<v.len;j++)r.push(v.dir%2?[v.x+j,v.y]:[v.x,v.y+j]);return r};
const bjFront=v=>v.dir==0?[v.x,v.y]:v.dir==1?[v.x+v.len-1,v.y]:v.dir==2?[v.x,v.y+v.len-1]:[v.x,v.y];
function bjPath(v,W,H,occ){const [dx,dy]=BJD[v.dir];let [x,y]=bjFront(v),d=0;for(;;){x+=dx;y+=dy;if(x<0||y<0||x>=W||y>=H)return{clear:true,d};const o=occ[y*W+x];if(o>=0)return{clear:false,d,by:o};d++}}
const bjGen=(rng,L)=>GC.bjGen(rng,L);
// 3D art (three.js + js/tj3d.js) is lazy-loaded the first time; any failure / no WebGL falls back to the 2D renderer.
const load3d=()=>window.TJ3D?Promise.resolve(window.TJ3D):!window.LazyLoad?Promise.reject():Promise.race([LazyLoad('js/three.min.js').then(()=>LazyLoad('js/tj3d.js')).then(()=>window.TJ3D),new Promise((_,j)=>setTimeout(j,9000))]);
function trafficJam(A,rng,done,setScore,L=1){A.innerHTML='<div class="gskel"></div><p class="gsub">Parking the cars…</p>';const t=performance.now();
 load3d().catch(()=>null).then(T3=>{if(A.isConnected)trafficJam2(A,rng,done,setScore,L,T3&&T3.ok&&localStorage.getItem('plot.fx.2d')!='1'?T3:null);window.__tjLoadMs=performance.now()-t})}
function trafficJam2(A,rng,done,setScore,L,T3){const P=bjGen(rng,L),{W,H,S,Q}=P,vs=P.vs.map(v=>({...v,gone:false}));
 const occ=new Int16Array(W*H).fill(-1);vs.forEach((v,i)=>bjCells(v).forEach(([x,y])=>occ[y*W+x]=i));
 const slots=Array(S+1).fill(null);let seq=0,extra=false,qi=0,taps=0,hints=0,over=false,timer=0;const t0=Date.now(),LG={a:[]};
 const veh=(v,i)=>`<div class="bv" data-i="${i}" style="left:calc(${v.x}*var(--cs));top:calc(${v.y}*var(--cs));width:calc(${v.dir%2?v.len:1}*var(--cs));height:calc(${v.dir%2?1:v.len}*var(--cs))"><div class="vb ${v.t}" style="--c:${BJCOL[v.col]};--len:${v.len};--r:${v.dir*90}deg"><i></i><b></b></div></div>`;
 A.innerHTML=`<div class="bj"><div class="bjq"><div class="bjqt" id="bjQ"></div><span class="bjn" id="bjN"></span></div>
  <div class="bjs" id="bjS">${slots.map((_,s)=>`<div class="bjsl${s==S?' lock':''}" data-s="${s}">${s==S?'🔒<small>+1 slot</small>':'<em>P</em>'}</div>`).join('')}</div>
  <div class="bjl" id="bjL" style="aspect-ratio:${W}/${H}">${vs.map(veh).join('')}</div></div>
  <div class="gbar"><button class="sec" id="bjH">💡 Hint</button><button class="sec" id="bjG">🏳 Give up</button></div>
  <p class="gsub">Level ${L} · ${vs.length} vehicles · ${P.nc} colours · ${S} slots. Tap a vehicle to drive it out along its arrow. Matching passengers hop in; full vehicles leave. Don't fill every slot with the wrong colours! </p>`;
 const Lb=$('#bjL'),els=[...Lb.querySelectorAll('.bv')],sEls=[...A.querySelectorAll('.bjsl')];
 const D3=T3?T3.lot(Lb,{W,H,vs,col:BJCOL}):null,RG=D3?T3.ring(A.querySelector('.bjq'),BJCOL):null;if(D3){Lb.classList.add('d3');Lb.style.aspectRatio=`${W+.6}/${((H+.6)*.9+.5).toFixed(2)}`;window.__pickXY=i=>D3.screen(i)}if(RG)A.querySelector('.bjq').classList.add('d3');
 const layout=()=>Lb.style.setProperty('--cs',Lb.clientWidth/W+'px');
 const qRender=shift=>{const n=Math.min(14,Q.length-qi);$('#bjQ').innerHTML=Array.from({length:n},(_,k)=>`<i class="bp" style="--c:${BJCOL[Q[qi+k]]}"></i>`).join('');$('#bjN').textContent=(Q.length-qi)+' 🧍';if(RG)RG.set(Q.slice(qi,qi+56),shift);
  if(shift)$('#bjQ').animate([{transform:'translateX(17px)'},{transform:'none'}],{duration:110,easing:'ease-out'})};
 const sRender=s=>{const e=sEls[s],o=slots[s];if(s==S&&!extra)return;e.classList.remove('lock');
  e.innerHTML=o&&!o.arriving?(D3?`<img class="vbi" alt="" src="${T3.sprite(o.v.t,o.v.len,BJCOL[o.v.col])}">`:`<div class="vb mini ${o.v.t}" style="--c:${BJCOL[o.v.col]};--len:${o.v.len}"><i></i></div>`)+`<span class="seat">${o.left}</span>`:'<em>P</em>'};
 const avail=()=>slots.map((o,s)=>s<S||extra?s:-1).filter(s=>s>=0);
 const clearTimer=()=>{clearTimeout(timer);timer=0};
 const loop=()=>{timer=0;if(over)return;if(qi>=Q.length){over=true;X.fx('levelup','big');$('#bjL').classList.add('won');D3&&D3.won();return setTimeout(()=>done(hints>2?0:1,{taps,hints,level:L,secs:(Date.now()-t0)/1000|0},LG),900)}
  const c=Q[qi],s0=avail().filter(s=>slots[s]&&!slots[s].leaving&&slots[s].left>0&&slots[s].v.col==c).sort((a,b)=>slots[a].q-slots[b].q)[0],s=s0!=null&&!slots[s0].arriving?s0:null;// oldest parked first (matches the generator and the server replay); wait while it is still arriving
  if(s!=null){const o=slots[s],p=$('#bjQ').firstElementChild;if(p){const a=RG?RG.exitRect():p.getBoundingClientRect(),b=sEls[s].getBoundingClientRect(),cl=p.cloneNode();cl.className='bp fly';if(RG){cl.classList.add('img');cl.style.backgroundImage=`url(${T3.sprite('person',0,BJCOL[c])})`}cl.style.cssText+=`;left:${a.left}px;top:${a.top}px`;document.body.appendChild(cl);
    cl.animate([{transform:'none'},{transform:`translate(${(b.left+b.width/2-a.left-6)*.5}px,${(b.top-a.top)*.5-18}px) scale(1.1)`},{transform:`translate(${b.left+b.width/2-a.left-6}px,${b.top+b.height/2-a.top-10}px) scale(.4)`,opacity:.3}],{duration:260,easing:'ease-in-out'}).onfinish=()=>cl.remove()}
   qi++;o.left--;qRender(true);setScore((Q.length-qi)+' left');prog(qi/Q.length);
   setTimeout(()=>{if(over&&qi<Q.length)return;sRender(s);const st=sEls[s].querySelector('.seat');st&&st.animate([{transform:'scale(1.5)'},{transform:'none'}],{duration:180});X.sfx('board');X.buzz&&X.buzz(8)},240);
   if(!o.left){o.leaving=true;setTimeout(()=>{const vb=sEls[s].querySelector('.vb,.vbi');X.fx('vroom','success');at(sEls[s],o.v.t=='bus'?'🚌 Full!':'🚗 Full!');sEls[s].classList.add('bjgo');setTimeout(()=>sEls[s].classList.remove('bjgo'),500);
     const fin=()=>{slots[s]=null;sRender(s);if(!timer)timer=setTimeout(loop,60)};if(vb)vb.animate([{transform:'none'},{transform:'translateY(-8px) scale(1.05)',offset:.25},{transform:'translateY(-160px) scale(.6)',opacity:0}],{duration:420,easing:'ease-in'}).onfinish=fin;else fin()},330)}
   timer=setTimeout(loop,125);return}
  const pending=slots.some(o=>o&&(o.arriving||o.leaving));
  if(!pending&&avail().every(s=>slots[s])){if(!extra){X.hint('All slots are full! Tap 🔒 to open the extra slot.',{host:A,id:'bj_full'});sEls[S].classList.add('pulse')}
   else{over=true;X.fx('lose','error');X.toast('🚧 Gridlock — no matching vehicle and no free slot.');setTimeout(()=>done(0,{taps,hints,level:L,gridlock:true},LG),900)}}};
 const kick=()=>{if(!timer)timer=setTimeout(loop,140)};
 const bump=(i,r)=>{const v=vs[i],[dx,dy]=BJD[v.dir],cs=Lb.clientWidth/W,dist=(r.d+.18)*cs;X.sfx('honk');X.buzz&&X.buzz([25,40,25]);if(D3)return D3.bump(i,r.d,260+r.d*60,r.by);
  els[i].animate([{transform:'none'},{transform:`translate(${dx*dist}px,${dy*dist}px)`,offset:.45},{transform:`translate(${dx*dist*.8}px,${dy*dist*.8}px)`,offset:.6},{transform:'none'}],{duration:260+r.d*60,easing:'cubic-bezier(.3,.7,.4,1)'});
  setTimeout(()=>{const b=els[r.by];b&&b.animate([{transform:'none'},{transform:`translate(${dx*4}px,${dy*4}px) rotate(${dx?2:-2}deg)`},{transform:`translate(${-dx*3}px,${-dy*3}px)`},{transform:'none'}],{duration:220})},(r.d*60+120))};
 const go=i=>{const v=vs[i];if(over||v.gone)return;const r=bjPath(v,W,H,occ);taps++;
  if(!r.clear)return bump(i,r);const s=avail().find(s=>!slots[s]);if(s==null){X.fx('error','error');X.toast('🅿️ No free slot — wait for a vehicle to fill up'+(extra?'':', or open the 🔒 slot')+'.');return}
  v.gone=true;LG.a.push(['d',i]);bjCells(v).forEach(([x,y])=>occ[y*W+x]=-1);slots[s]={v,left:v.cap,arriving:true,q:++seq};els.forEach(e=>e.classList.remove('hint'));
  const [dx,dy]=BJD[v.dir],cs=Lb.clientWidth/W,[fx0,fy0]=bjFront(v),cells=(dx>0?W-fx0:dx<0?fx0+1:dy>0?H-fy0:fy0+1)+v.len,dist=cells*cs;X.sfx('vroom');X.buzz&&X.buzz(12);
  const e=els[i];if(D3)return D3.drive(i,cells,260+cells*38,()=>{e.remove();slots[s].arriving=false;sRender(s);const m=sEls[s].querySelector('.vb,.vbi');m&&m.animate([{transform:'translateY(-30px) scale(.6)',opacity:0},{transform:'translateY(3px) scale(1.06)'},{transform:'none'}],{duration:300,easing:'ease-out'});kick()});
  e.style.zIndex=9;e.animate([{transform:'none'},{transform:`translate(${-dx*4}px,${-dy*4}px)`,offset:.12},{transform:`translate(${dx*dist}px,${dy*dist}px)`,opacity:.9}],{duration:260+cells*38,easing:'cubic-bezier(.5,0,.75,.4)',fill:'forwards'}).onfinish=()=>{e.remove();slots[s].arriving=false;sRender(s);
   const m=sEls[s].querySelector('.vb,.vbi');m&&m.animate([{transform:'translateY(-30px) scale(.6)',opacity:0},{transform:'translateY(3px) scale(1.06)'},{transform:'none'}],{duration:300,easing:'ease-out'});kick()}};
 Lb.addEventListener('click',e=>{if(D3){const i=D3.pick(e.clientX,e.clientY);if(i>=0)go(i);return}const b=e.target.closest('.bv');if(b)go(+b.dataset.i)});
 sEls[S].onclick=()=>{if(extra||over)return;extra=true;LG.a.push('x');sEls[S].classList.remove('pulse');X.sfx('purchase');X.fx('success','success');sRender(S);sEls[S].animate([{transform:'scale(.7)'},{transform:'scale(1.1)'},{transform:'none'}],{duration:300});kick()};
 $('#bjH').onclick=()=>{if(over)return;let best=-1,bk=1e9;vs.forEach((v,i)=>{if(v.gone||!bjPath(v,W,H,occ).clear)return;let k=Q.indexOf(v.col,qi);if(k<0)k=1e8;
   const sl=avail().filter(s=>slots[s]&&!slots[s].leaving&&slots[s].v.col==v.col).reduce((a,s)=>a+slots[s].left,0);k+=sl*0.5;if(k<bk){bk=k;best=i}});
  if(best<0)return;hints++;LG.a.push('h');els.forEach(e=>e.classList.remove('hint'));els[best].classList.add('hint');D3&&D3.hint(best);X.sfx('select');
  X.hint(hints>2?`Hint ${hints}.`:`Try the glowing vehicle — its passengers are coming up. (${hints}/2 free hints)`,{host:A});$('#bjH').textContent=`💡 Hint (${hints})`};
 $('#bjG').onclick=()=>{if(!over){over=true;clearTimer();LG.gave_up=true;done(0,{taps,hints,gave_up:true},LG)}};
 requestAnimationFrame(layout);addEventListener('resize',layout);qRender();setScore(Q.length+' left');prog(0);
 stopFn=()=>{over=true;clearTimer();removeEventListener('resize',layout);D3&&D3.dispose();RG&&RG.dispose();document.querySelectorAll('.bp.fly').forEach(e=>e.remove())}}

// ---------------- Snake ----------------
// Logic ticks every 140 ms exactly as before; drawing runs on rAF and interpolates between ticks for smooth motion.
// Levels: the snake ticks faster each level (180 ms at level 1, 68 ms by level 8, floor 52 ms).
function snake(A,rng,done,setScore,L=1){const N=18,STEP=GC.snStep(L),RK=GC.snRocks(rng,L),isRock=(x,y)=>RK.some(r=>r[0]==x&&r[1]==y);A.innerHTML=`<div class="snw"><canvas id="snC" class="snc"></canvas></div><div class="pad"><button data-d="0,-1" aria-label="Up">▲</button><button data-d="-1,0" aria-label="Left">◀</button><button data-d="1,0" aria-label="Right">▶</button><button data-d="0,1" aria-label="Down">▼</button></div><p class="gsub">Level ${L}: speed ×${(180/STEP).toFixed(1)}. Swipe on the board or use the arrow buttons (keys / WASD on a computer). Each apple = 1 point. Walls wrap around — biting yourself${RK.length?` or hitting one of the ${RK.length} rocks 🪨`:''} ends the round.</p>`;
 const cv=$('#snC'),S=Math.min(A.clientWidth||320,440,innerHeight-330>220?innerHeight-330:220),dpr=Math.min(2,devicePixelRatio||1);cv.width=cv.height=S*dpr;cv.style.width=cv.style.height=S+'px';
 const ctx=cv.getContext('2d'),cs=S/N;ctx.scale(dpr,dpr);
 let LG={t:[],n:0},sn=[[8,9],[7,9],[6,9]],prev=sn.map(p=>p.slice()),d=[1,0],q=[],food=null,score=0,alive=true,started=false,acc=0,last=0,raf=0,parts=[],cd=3,t0=performance.now();
 const place=()=>{do{food=[Math.floor(rng()*N),Math.floor(rng()*N)]}while(sn.some(p=>p[0]==food[0]&&p[1]==food[1])||isRock(food[0],food[1]))};place();
 const turn=(x,y)=>{const ld=q.length?q[q.length-1]:d;if((x==-ld[0]&&y==-ld[1])||(x==ld[0]&&y==ld[1]))return;if(q.length<2)q.push([x,y])};
 const tick=()=>{const tk=LG.n++;if(q.length){d=q.shift();LG.t.push([tk,d[0],d[1]])}prev=sn.map(p=>p.slice());const h=[(sn[0][0]+d[0]+N)%N,(sn[0][1]+d[1]+N)%N];
  if(sn.some(p=>p[0]==h[0]&&p[1]==h[1])||isRock(h[0],h[1])){alive=false;fx('lose','error');shake(cv);draw(1);return setTimeout(()=>done(score,{length:sn.length},LG),450)}
  sn.unshift(h);if(h[0]==food[0]&&h[1]==food[1]){score++;fx('eat','tick');for(let k=0;k<10;k++)parts.push({x:(food[0]+.5)*cs,y:(food[1]+.5)*cs,vx:(Math.random()-.5)*4,vy:(Math.random()-.5)*4,t:1});prev.push(prev[prev.length-1]);place();setScore(score+' 🍎');progT(score)}else sn.pop()};
 const grass=document.createElement('canvas');grass.width=grass.height=S*dpr;{const g=grass.getContext('2d');g.scale(dpr,dpr);for(let y=0;y<N;y++)for(let x=0;x<N;x++){g.fillStyle=(x+y)%2?'#2f7d3a':'#358a41';g.fillRect(x*cs,y*cs,cs,cs)}
  for(const [x,y] of RK){const cx=(x+.5)*cs,cy=(y+.5)*cs;g.fillStyle='#0004';g.beginPath();g.ellipse(cx+2,cy+cs*.3,cs*.42,cs*.14,0,0,7);g.fill();const rg=g.createRadialGradient(cx-cs*.15,cy-cs*.15,1,cx,cy,cs*.48);rg.addColorStop(0,'#bdbdbd');rg.addColorStop(1,'#5d5d5d');g.fillStyle=rg;g.beginPath();g.moveTo(cx-cs*.42,cy+cs*.25);g.lineTo(cx-cs*.3,cy-cs*.28);g.lineTo(cx+cs*.08,cy-cs*.42);g.lineTo(cx+cs*.42,cy-cs*.1);g.lineTo(cx+cs*.38,cy+cs*.3);g.closePath();g.fill()}
  for(const [x0,y0,x1,y1] of[[0,0,0,1],[0,0,1,0],[S,0,S-1,0],[0,S,0,S-1]]){const gr=g.createLinearGradient(x0*1,y0*1,x0+(x1-x0)*cs*.5,y0+(y1-y0)*cs*.5);gr.addColorStop(0,'#7dd3fc66');gr.addColorStop(1,'#7dd3fc00');g.fillStyle=gr;g.fillRect(0,0,S,S)}}
 function draw(k){ctx.drawImage(grass,0,0,S,S);
  const fx0=(food[0]+.5)*cs,fy0=(food[1]+.5)*cs,pulse=1+Math.sin(performance.now()/180)*.06;ctx.save();ctx.translate(fx0,fy0);ctx.scale(pulse,pulse);
  ctx.fillStyle='#0003';ctx.beginPath();ctx.ellipse(0,cs*.36,cs*.32,cs*.1,0,0,7);ctx.fill();const ag=ctx.createRadialGradient(-cs*.12,-cs*.12,1,0,0,cs*.42);ag.addColorStop(0,'#ff8a80');ag.addColorStop(1,'#d50000');
  ctx.fillStyle=ag;ctx.beginPath();ctx.arc(0,0,cs*.38,0,7);ctx.fill();ctx.fillStyle='#43a047';ctx.beginPath();ctx.ellipse(cs*.12,-cs*.38,cs*.14,cs*.07,-.6,0,7);ctx.fill();ctx.restore();
  // wrap-around: interpolate each segment in unwrapped space (it slides out of one edge and in from the opposite one),
  // chain the body continuously, then draw it shifted by ±board so both halves show while crossing an edge.
  const uw=(p,a)=>{const v=a.slice();for(const j of[0,1]){if(p[j]-v[j]>1)v[j]+=N;else if(v[j]-p[j]>1)v[j]-=N}return v};
  const pos0=sn.map((p,i)=>{const a=uw(p,prev[i]||prev[prev.length-1]);return[(a[0]+(p[0]-a[0])*k+.5)*cs,(a[1]+(p[1]-a[1])*k+.5)*cs]});
  for(let i=1;i<pos0.length;i++)for(const j of[0,1]){while(pos0[i][j]-pos0[i-1][j]>S/2)pos0[i][j]-=S;while(pos0[i-1][j]-pos0[i][j]>S/2)pos0[i][j]+=S}
  const xs=pos0.map(p=>p[0]),ys=pos0.map(p=>p[1]),OX=[0],OY=[0];if(Math.min(...xs)<cs)OX.push(S);if(Math.max(...xs)>S-cs)OX.push(-S);if(Math.min(...ys)<cs)OY.push(S);if(Math.max(...ys)>S-cs)OY.push(-S);
  for(const ox of OX)for(const oy of OY){const pos=pos0.map(p=>[p[0]+ox,p[1]+oy]);
  ctx.lineCap=ctx.lineJoin='round';ctx.strokeStyle='#0004';ctx.lineWidth=cs*.8;ctx.beginPath();pos.forEach((p,i)=>i?ctx.lineTo(p[0]+2,p[1]+3):ctx.moveTo(p[0]+2,p[1]+3));ctx.stroke();
  if(alive&&!LITE()){ctx.fillStyle='#0003';for(let i=pos.length-1;i>=0;i-=1){const p=pos[i];ctx.beginPath();ctx.arc(p[0]+2,p[1]+4,cs*(.44-.12*i/pos.length),0,7);ctx.fill()}}
  for(let i=pos.length-1;i>=0;i--){const p=pos[i],r=cs*(.42-.12*i/pos.length);ctx.fillStyle=`hsl(${88+i*28/pos.length},${62-i*10/pos.length}%,${i%2?52:58}%)`;if(!alive)ctx.fillStyle=i%2?'#9e9e9e':'#bdbdbd';ctx.beginPath();ctx.arc(p[0],p[1],r,0,7);ctx.fill();
   if(i<pos.length-1){const n=pos[i+1];ctx.beginPath();ctx.arc((p[0]+n[0])/2,(p[1]+n[1])/2,r*.95,0,7);ctx.fill()}}
  const h=pos[0];if(alive){const hg=ctx.createRadialGradient(h[0]-cs*.15,h[1]-cs*.18,1,h[0],h[1],cs*.5);hg.addColorStop(0,'#e6ee9c');hg.addColorStop(1,'#9e9d24');ctx.fillStyle=hg}else ctx.fillStyle='#9e9e9e';ctx.beginPath();ctx.arc(h[0],h[1],cs*.48,0,7);ctx.fill();
  const ex=d[1],ey=-d[0];for(const s of[-1,1]){const x=h[0]+d[0]*cs*.15+ex*s*cs*.2,y=h[1]+d[1]*cs*.15+ey*s*cs*.2;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x,y,cs*.13,0,7);ctx.fill();ctx.fillStyle='#111';ctx.beginPath();ctx.arc(x+d[0]*cs*.05,y+d[1]*cs*.05,cs*.07,0,7);ctx.fill()}
  if(!alive){ctx.font=`900 ${cs*.6}px system-ui`;ctx.textAlign='center';ctx.fillText('✖',h[0],h[1]+cs*.2)}}
  parts=parts.filter(p=>(p.t-=.04)>0);for(const p of parts){p.x+=p.vx;p.y+=p.vy;ctx.globalAlpha=p.t;ctx.fillStyle='#ffeb3b';ctx.beginPath();ctx.arc(p.x,p.y,3,0,7);ctx.fill()}ctx.globalAlpha=1;
  if(!started){ctx.fillStyle='#0008';ctx.fillRect(0,0,S,S);ctx.fillStyle='#fff';ctx.textAlign='center';ctx.font='900 64px system-ui';ctx.fillText(cd>0?cd:'GO!',S/2,S/2+20);ctx.font='700 15px system-ui';ctx.fillText('Swipe to steer',S/2,S/2+56)}}
 function loop(t){if(!started){const c=3-Math.floor((t-t0)/400);if(c!=cd){cd=c;X.sfx(c>0?'tick':'select');if(c<=0){X.buzz('tick')}}if(t-t0>=1600){started=true;last=t}}
  else if(alive){acc+=Math.min(t-last,400);last=t;while(acc>=STEP&&alive){acc-=STEP;tick()}}
  if(alive||parts.length)draw(alive&&started?Math.min(1,acc/STEP):1);if(alive||parts.length)raf=requestAnimationFrame(loop)}
 setScore('0 🍎');raf=requestAnimationFrame(loop);
 const KM={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0],w:[0,-1],s:[0,1],a:[-1,0],d:[1,0]};
 const onKey=e=>{const m=KM[e.key.length==1?e.key.toLowerCase():e.key];if(m){e.preventDefault();turn(...m)}};document.addEventListener('keydown',onKey);
 // Swipe anywhere on the board area: turns as soon as the finger has moved 18px, then re-anchors (fast zig-zags).
 const box=A.querySelector('.snw');let sw=null;
 box.addEventListener('pointerdown',e=>{sw={x:e.clientX,y:e.clientY};try{box.setPointerCapture(e.pointerId)}catch(_){}});
 box.addEventListener('pointermove',e=>{if(!sw)return;const dx=e.clientX-sw.x,dy=e.clientY-sw.y;if(Math.max(Math.abs(dx),Math.abs(dy))<18)return;
  Math.abs(dx)>Math.abs(dy)?turn(Math.sign(dx),0):turn(0,Math.sign(dy));X.buzz('tick');sw={x:e.clientX,y:e.clientY}});
 box.addEventListener('pointerup',()=>sw=null);box.addEventListener('pointercancel',()=>sw=null);
 A.querySelectorAll('[data-d]').forEach(b=>b.onpointerdown=e=>{e.preventDefault();turn(...b.dataset.d.split(',').map(Number));X.fx('tap','tick');b.classList.remove('hit');void b.offsetWidth;b.classList.add('hit')});
 stopFn=()=>{alive=false;parts=[];cancelAnimationFrame(raf);document.removeEventListener('keydown',onKey)}}

// ---------------- Checkers (American rules) vs minimax AI ----------------
// board: 64 cells; 'r','R' = you (moving up), 'b','B' = computer; dark squares only.
// r6 rules: men step forward one square but capture forwards AND backwards; kings are flying kings (slide any
// distance, capture a piece any distance away and land on any empty square beyond). Captured pieces stay on the
// board until the move ends (can't be jumped twice). Crowning only when a move ends on the far row. Jumps are forced.
const CKD=[[-1,-1],[-1,1],[1,-1],[1,1]],ckIn=(r,c)=>r>=0&&r<8&&c>=0&&c<8;
function ckMoves(B,side){const caps=[],steps=[];const own=c=>c&&c.toLowerCase()==side,opp=c=>c&&c.toLowerCase()!=side,fwd=side=='r'?-1:1;
 const jumps=(b,i,king,path,taken)=>{let found=false;const r=i>>3,c=i&7;
  for(const [dr,dc] of CKD){
   if(king){let r1=r+dr,c1=c+dc;while(ckIn(r1,c1)&&!b[r1*8+c1]){r1+=dr;c1+=dc}if(!ckIn(r1,c1))continue;const m=r1*8+c1;if(!opp(b[m])||taken.includes(m))continue;
    for(let r2=r1+dr,c2=c1+dc;ckIn(r2,c2)&&!b[r2*8+c2];r2+=dr,c2+=dc){const t=r2*8+c2;found=true;const nb=b.slice();nb[i]=null;nb[t]=side;
     if(!jumps(nb,t,true,[...path,t],[...taken,m]))caps.push({path:[...path,t],taken:[...taken,m]})}}
   else{const r2=r+2*dr,c2=c+2*dc;if(!ckIn(r2,c2))continue;const m=(r+dr)*8+c+dc,t=r2*8+c2;
    if(opp(b[m])&&!taken.includes(m)&&!b[t]){found=true;const nb=b.slice();nb[i]=null;nb[t]=side;
     if(!jumps(nb,t,false,[...path,t],[...taken,m]))caps.push({path:[...path,t],taken:[...taken,m]})}}}
  return found};
 for(let i=0;i<64;i++)if(own(B[i])){const king=B[i]==B[i].toUpperCase();jumps(B,i,king,[i],[]);if(caps.length)continue;const r=i>>3,c=i&7;
  for(const [dr,dc] of CKD){if(!king&&dr!=fwd)continue;for(let r1=r+dr,c1=c+dc;ckIn(r1,c1)&&!B[r1*8+c1];r1+=dr,c1+=dc){steps.push({path:[i,r1*8+c1],taken:[]});if(!king)break}}}
 return caps.length?caps:steps}
function ckApply(B,m){const b=B.slice();const f=m.path[0],t=m.path[m.path.length-1];let p=b[f];b[f]=null;m.taken.forEach(i=>b[i]=null);if(p=='r'&&(t>>3)==0)p='R';if(p=='b'&&(t>>3)==7)p='B';b[t]=p;return b}
function ckEval(B){let s=0;for(let i=0;i<64;i++){const c=B[i];if(!c)continue;const v=c=='b'?1+(i>>3)*.04:c=='B'?1.7:c=='r'?-(1+(7-(i>>3))*.04):-1.7;s+=v;if((i&7)>1&&(i&7)<6&&(i>>3)>1&&(i>>3)<6)s+=c.toLowerCase()=='b'?.05:-.05}return s}
function ckSearch(B,depth,a,b,side){const ms=ckMoves(B,side);if(!ms.length)return side=='b'?-100-depth:100+depth;if(!depth)return ckEval(B);
 if(side=='b'){let v=-1e9;for(const m of ms){v=Math.max(v,ckSearch(ckApply(B,m),depth-1,a,b,'r'));a=Math.max(a,v);if(a>=b)break}return v}
 let v=1e9;for(const m of ms){v=Math.min(v,ckSearch(ckApply(B,m),depth-1,a,b,'b'));b=Math.min(b,v);if(a>=b)break}return v}
// Levels: deeper AI search and fewer deliberate mistakes as the level rises.
function checkers(A,rng,done,setScore,L=1){let B=GC.ckStart(L);const CK0=B.filter(x=>x&&x.toLowerCase()=='b').length;
 let sel=null,partial=null,quiet=0,turn='r',over=false,lastMv=null,dragFrom=null;const LG={m:[]};
 const finish=(score,why)=>{over=true;render();setTimeout(()=>done(score,{why,quiet},LG),700)};
 function legal(){return ckMoves(B,'r')}
 function render(){const ms=turn=='r'?legal():[];const from=new Set(ms.map(m=>m.path[0]));const tgt=new Set(sel!=null?ms.filter(m=>m.path[0]==sel&&(!partial||m.path.slice(1,partial.length).every((x,j)=>x==partial[j+1]))).map(m=>m.path[partial?partial.length:1]):[]);
  const cnt=c=>B.filter(x=>x&&x.toLowerCase()==c).length;setScore(`🔴 ${cnt('r')} · ⚫ ${cnt('b')}`);prog(1-cnt('b')/Math.max(1,CK0));const cap=ms.length&&ms[0].taken.length;const lm=new Set(lastMv||[]);
  A.innerHTML=`<div class="ckw"><div class="ck ${turn!='r'&&!over?'think':''}">${B.map((p,i)=>`<button data-i="${i}" class="${((i>>3)+(i&7))%2?'d':'l'} ${i==sel?'s':''} ${tgt.has(i)?'t':''} ${lm.has(i)?'lm':''} ${!over&&turn=='r'&&from.has(i)&&sel==null?(cap?'m mc':'m'):''}">${p?`<i class="${p.toLowerCase()=='r'?'pr':'pb'} ${p==p.toUpperCase()?'k':''}">${p==p.toUpperCase()?'♛':''}</i>`:''}</button>`).join('')}</div></div>
  <p class="gsub ckst">${over?'Game over.':turn=='r'?(cap?'⚡ <b>Capture available</b> — jumps are forced (backwards too).':'Your move (red). Kings ♛ fly along diagonals.'):'<span class="dotty">Computer is thinking</span>'} · Level ${L}</p><div class="gbar"><button class="sec" id="ckRes">🏳 Resign</button></div>`;
  $('#ckRes').onclick=()=>{if(!over){LG.m.push('resign');finish(0,'resigned')}};
  const bd=A.querySelector('.ck');
  bd.onpointerdown=e=>{const b=e.target.closest('[data-i]');if(!b)return;const i=+b.dataset.i;tap(i);if(sel===i){dragFrom={i,x:e.clientX,y:e.clientY};try{A.querySelector('.ck').setPointerCapture(e.pointerId)}catch(_){}}};
  bd.onpointermove=e=>{if(!dragFrom)return;const pc=bd.querySelector(`[data-i="${dragFrom.i}"] i`);if(pc){pc.style.transform=`translate(${e.clientX-dragFrom.x}px,${e.clientY-dragFrom.y}px) scale(1.15)`;pc.style.zIndex=9}};
  bd.onpointerup=bd.onpointercancel=e=>{if(!dragFrom)return;const d=dragFrom;dragFrom=null;const moved=Math.hypot(e.clientX-d.x,e.clientY-d.y)>10;
   const pc=bd.querySelector(`[data-i="${d.i}"] i`);if(pc){pc.style.transform='';pc.style.zIndex=''}
   if(moved){const t=document.elementFromPoint(e.clientX,e.clientY)?.closest('.ck [data-i]');if(t&&+t.dataset.i!=d.i)tap(+t.dataset.i)}}}
 function tap(i){if(over||turn!='r')return;const ms=legal();
  if(sel==null||(!partial&&ms.some(m=>m.path[0]==i))){if(ms.some(m=>m.path[0]==i)){if(sel!==i){sel=i;partial=null;X.fx('select','tick');render()}return}
   if(B[i]&&B[i].toLowerCase()=='r'){X.fx('error','error');shake(A.querySelector(`[data-i="${i}"]`));
    if(ms.length&&ms[0].taken.length){X.hint('A capture is available — jumps are forced. Pieces that can jump are glowing.',{id:'ck_forced',max:5,host:A});A.querySelectorAll('.mc').forEach(e=>{e.classList.remove('flash');void e.offsetWidth;e.classList.add('flash')})}
    else X.hint('That piece has no moves right now.',{host:A})}
   if(sel!=null){sel=null;partial=null;render()}return}
  const k=partial?partial.length:1;const cand=ms.filter(m=>m.path[0]==sel&&m.path.slice(1,k).every((x,j)=>x==partial[j+1])&&m.path[k]==i);
  if(!cand.length){if(sel!=null&&!B[i]){X.fx('error','error');if(ms[0]&&ms[0].taken.length)X.hint('You must jump — tap a green square.',{id:'ck_forced2',host:A})}return}const full=cand.find(m=>m.path.length==k+1);
  if(full&&cand.length==1||full&&!cand.some(m=>m.path.length>k+1)){play(full)}else{partial=(partial||[sel]).concat(i);X.fx('capture','tick');render()}}
 const sound=(m,b0)=>{const t=m.path[m.path.length-1],crowned=b0[m.path[0]]&&b0[m.path[0]]==b0[m.path[0]].toLowerCase()&&B[t]==B[t].toUpperCase();
  if(crowned)X.fx('crown','success');else if(m.taken.length)X.fx('capture',m.taken.length>1?'success':'tick');else X.fx('tap','tick')};
 function play(m){const b0=B;LG.m.push(m.path.slice());B=ckApply(B,m);lastMv=m.path;sound(m,b0);quiet=m.taken.length?0:quiet+1;sel=null;partial=null;if(quiet>=80)return finish(1,'draw (40 moves without capture)');
  turn='b';render();if(!ckMoves(B,'b').length)return finish(2,'computer has no moves');setTimeout(ai,450)}
 function ai(){if(over)return;const pick=GC.ckAI(B,rng,L);
  const b0=B;B=ckApply(B,pick);lastMv=pick.path;sound(pick,b0);quiet=pick.taken.length?0:quiet+1;turn='r';if(quiet>=80)return finish(1,'draw (40 moves without capture)');
  if(!legal().length)return finish(0,'no moves left');render();const ms2=legal();if(ms2[0]&&ms2[0].taken.length)X.hint('Capture available — jumps are forced!',{id:'ck_forced',max:5,host:A})}
 render();stopFn=()=>{over=true}}

// ---------------- Market Trader ----------------
// r10: the price series lives only on the server (no seed, no future prices in the browser). The client polls
// mt_tick for the prices revealed so far; Buy/Sell execute on the server at the current tick; the server scores it.
// Levels: a trading fee per trade (none at level 1, gently rising to 3% at level 11) and weaker trends make +25% harder.
function marketTrader(A,rng,done,setScore,L=1,SES={}){const T=SES.ticks||120,start=10000,TK=SES.tick_ms||500;let st={i:0,px:[100],cash:start,sh:0,trades:0,marks:[],fee:L<=11?Math.round(.03*Math.pow((L-1)/10,1.5)*1e4)/1e4:.03+.0002*(L-11),news:[]},busy=false,stop=false,fin=false;
 A.innerHTML=`<div class="mtw"><canvas id="mtC" class="mtc"></canvas><div class="mtclock"><i id="mtT"></i></div></div><div class="mtinfo" id="mtI"></div><div class="gbar big"><button id="mtB">🟢 Buy all</button><button id="mtS" class="sell">🔴 Sell all</button></div><p class="gsub">60 seconds of a live market. Buy low, sell high; whatever you hold is sold at the final price. Make +12% profit to win.${st.fee?` Level ${L} fee: ${(st.fee*100).toFixed(2).replace(/0$/,'')}% per trade.`:''}${L>=20?' 📰 News shocks move the price suddenly — more often at higher levels.':''}</p>`;
 const cv=$('#mtC'),W=Math.min(A.clientWidth||340,540),H=Math.round(Math.min(230,W*.55)),dpr=Math.min(2,devicePixelRatio||1);cv.width=W*dpr;cv.height=H*dpr;cv.style.height=H+'px';const ctx=cv.getContext('2d');ctx.scale(dpr,dpr);
 const P=()=>st.px.map(Number),cur=()=>{const p=P();return p[p.length-1]},val=()=>st.cash+st.sh*cur();
 const draw=()=>{if(!$('#mtC'))return;const seen=P(),i=seen.length-1,mn=Math.min(...seen)*.97,mx=Math.max(...seen)*1.03,X0=k=>k/(T-1)*W,Y0=p=>H-8-(p-mn)/(mx-mn)*(H-16);
  const bg=ctx.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#10243c');bg.addColorStop(1,'#0a1626');ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
  ctx.strokeStyle='#ffffff10';ctx.lineWidth=1;for(let g=1;g<4;g++){ctx.beginPath();ctx.moveTo(0,H*g/4);ctx.lineTo(W,H*g/4);ctx.stroke()}
  const up=seen[i]>=seen[Math.max(0,i-1)],col=val()>=start?'#4ade80':'#f87171';
  ctx.beginPath();seen.forEach((p,k)=>k?ctx.lineTo(X0(k),Y0(p)):ctx.moveTo(X0(k),Y0(p)));const fill=ctx.createLinearGradient(0,0,0,H);fill.addColorStop(0,col+'55');fill.addColorStop(1,col+'00');
  ctx.save();ctx.lineTo(X0(i),H);ctx.lineTo(0,H);ctx.closePath();ctx.fillStyle=fill;ctx.fill();ctx.restore();
  ctx.beginPath();seen.forEach((p,k)=>k?ctx.lineTo(X0(k),Y0(p)):ctx.moveTo(X0(k),Y0(p)));ctx.strokeStyle=col;ctx.lineWidth=2.5;ctx.lineJoin='round';ctx.stroke();
  for(const m of st.marks||[]){if(m.k>i)continue;ctx.fillStyle=m.b?'#22c55e':'#ef4444';ctx.beginPath();const x=X0(m.k),y=Y0(seen[m.k]);if(m.b){ctx.moveTo(x,y+6);ctx.lineTo(x-6,y+16);ctx.lineTo(x+6,y+16)}else{ctx.moveTo(x,y-6);ctx.lineTo(x-6,y-16);ctx.lineTo(x+6,y-16)}ctx.fill()}
  const cx0=X0(i),cy0=Y0(seen[i]);ctx.fillStyle=col;ctx.beginPath();ctx.arc(cx0,cy0,5+Math.sin(performance.now()/120)*1.2,0,7);ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.stroke();
  ctx.font='700 12px system-ui';ctx.textAlign=cx0>W-60?'right':'left';ctx.fillStyle='#fff';ctx.fillText(seen[i].toFixed(2),cx0+(cx0>W-60?-10:10),cy0-8);
  const pr=(val()/start-1)*100,left=Math.ceil((T-1-i)*TK/1000);$('#mtT').style.width=(100*(T-1-i)/(T-1))+'%';
  $('#mtI').innerHTML=`<div><small>Price</small><b class="${up?'up':'dn'}">${seen[i].toFixed(2)} ${up?'▲':'▼'}</b></div><div><small>${st.sh>0?'Holding':'Cash'}</small><b>${st.sh>0?(+st.sh).toFixed(1)+' sh':usd(st.cash)}</b></div><div><small>Value</small><b>${usd(val())}</b><em class="${pr>=0?'up':'dn'}">${pr>=0?'+':''}${pr.toFixed(1)}%</em></div><div><small>Time</small><b class="${left<=10?'dn':''}">${left}s</b></div>`;
  setScore((pr>=0?'+':'')+pr.toFixed(1)+'%');prog(st.i/T);$('#mtB').disabled=busy||st.cash<=1||st.done;$('#mtS').disabled=busy||st.sh<=0||st.done};
 const NEWS=['📰 Breaking news jolts the market!','📰 Surprise report — prices swing!','📰 Rumour hits the trading floor!','📰 Big announcement moves the price!'];
 const apply=n=>{const li=st.i,ln=(st.news||[]).length;st={...st,...n};if((st.news||[]).length>ln&&ln+1>0&&st.i>0){X.toast(NEWS[st.news[st.news.length-1]%NEWS.length]);X.fx('tick','tick')}st.cash=+st.cash;st.sh=+st.sh;if(st.i>li){const left=Math.ceil((T-1-st.i)*TK/1000);if(left<=5&&left>0&&st.i%2==0)X.fx('tick','tick')}draw();
  if(st.done&&!fin){fin=true;stop=true;clearInterval(iv);setTimeout(()=>done(Math.max(0,Math.round((val()/start-1)*1000)/10),{final:Math.round(val()),trades:st.trades}),300)}};
 const trade=async(side,e)=>{if(busy||st.done)return;busy=true;draw();const before=st.cash;try{apply(await DB.mtTrade(SES.id,side));
   if(side=='buy')fx('purchase','tick');else{const g=st.cash-start;fx(g>=0?'coin':'error',g>=0?'success':'error');at(e&&e.target,(g>=0?'+':'')+usd(g).replace('$-','-$'),g>=0?'':'neg')}}
  catch(err){X.toast('⚠ '+esc(err.message))}busy=false;draw()};
 $('#mtB').onclick=e=>trade('buy',e);$('#mtS').onclick=e=>trade('sell',e);
 let inflight=false;const poll=async()=>{if(stop||inflight)return;inflight=true;try{const n=await DB.mtTick(SES.id);if(!stop)apply(n)}catch(_){}inflight=false};
 const iv=setInterval(poll,TK);poll();draw();
 stopFn=()=>{stop=true;clearInterval(iv)}}

// ---------------- Ludo vs computer (r57) ----------------
// Rules + dice + the computer's moves live in js/gamecore.js (the server replays the same code). Board is one inline SVG,
// tokens are DOM discs moved with CSS transforms (cheap on budget phones); every roll and hop is animated from the engine's events.
const LU_PATH=(()=>{const p=[],seg=(x0,y0,dx,dy,n)=>{for(let k=0;k<n;k++)p.push([x0+dx*k,y0+dy*k])};
 seg(1,8,1,0,5);seg(6,9,0,1,6);p.push([7,14]);seg(8,14,0,-1,6);seg(9,8,1,0,6);p.push([14,7]);seg(14,6,-1,0,6);seg(8,5,0,-1,6);p.push([7,0]);seg(6,0,0,1,6);seg(5,6,-1,0,6);p.push([0,7],[0,8]);return p})();
const LU_COL=['#e53935','#fbc02d'],LU_YARD=[[[1.6,10.6],[3.4,10.6],[1.6,12.4],[3.4,12.4]],[[10.6,1.6],[12.4,1.6],[10.6,3.4],[12.4,3.4]]];
function luXY(side,p,i){if(p<0)return LU_YARD[side][i];if(p<=50)return LU_PATH[(p+side*26)%52];if(p<56)return side?[14-(p-50),7]:[p-50,7];return side?[7.75,7]:[6.25,7]}
function luBoard(){const c=(x,y,f,ex='')=>`<rect x="${x}" y="${y}" width="1" height="1" fill="${f}" stroke="#0002" stroke-width=".04" ${ex}/>`;let s='';
 LU_PATH.forEach(([x,y],k)=>{s+=c(x,y,k==0?LU_COL[0]:k==26?LU_COL[1]:'#fffdf7');if(GC.LU_SAFE.includes(k)&&k%26)s+=`<text x="${x+.5}" y="${y+.72}" font-size=".62" text-anchor="middle" fill="#9e9e9e">★</text>`});
 for(let k=1;k<6;k++){s+=c(k,7,LU_COL[0]);s+=c(14-k,7,LU_COL[1])}
 const yard=(x,y,col,on)=>`<rect x="${x+.15}" y="${y+.15}" width="5.7" height="5.7" rx=".7" fill="${col}"/><rect x="${x+.9}" y="${y+.9}" width="4.2" height="4.2" rx=".5" fill="#fff" opacity="${on?.95:.55}"/>`;
 return `<svg viewBox="0 0 15 15" class="lub"><defs><linearGradient id="luBg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff8e7"/><stop offset="1" stop-color="#f1e3c4"/></linearGradient></defs><rect width="15" height="15" rx=".5" fill="url(#luBg)"/>
 ${yard(0,9,LU_COL[0],1)}${yard(9,0,LU_COL[1],1)}${yard(0,0,'#43a047')}${yard(9,9,'#1e88e5')}${s}
 <polygon points="6,6 9,6 7.5,7.5" fill="#43a047"/><polygon points="9,6 9,9 7.5,7.5" fill="${LU_COL[1]}"/><polygon points="9,9 6,9 7.5,7.5" fill="#1e88e5"/><polygon points="6,9 6,6 7.5,7.5" fill="${LU_COL[0]}"/></svg>`}
const LU_PIPS={1:[4],2:[0,8],3:[0,4,8],4:[0,2,6,8],5:[0,2,4,6,8],6:[0,2,3,5,6,8]};
const luDie=n=>Array.from({length:9},(_,k)=>`<i class="${(LU_PIPS[n]||[]).includes(k)?'on':''}"></i>`).join('');
function ludo(A,rng,done,setScore,L=1){const S=GC.luNew(rng,L),T=S.lv.tok,LG={a:[]};let busy=true,over=false,waitRoll=null;const wait=ms=>new Promise(r=>setTimeout(r,ms));
 A.innerHTML=`<div class="luw"><div class="lubw">${luBoard()}<div class="lut" id="luT">${[0,1].map(sd=>Array.from({length:T},(_,i)=>`<button class="lutk s${sd}" data-s="${sd}" data-i="${i}" aria-label="${sd?'Computer':'Your'} token ${i+1}"></button>`).join('')).join('')}</div></div>
  <div class="lubar"><div class="lupl s1"><b>🤖 Computer</b><small id="luC"></small></div><button class="ludie" id="luD">${luDie(1)}</button><div class="lupl s0"><b>🔴 You</b><small id="luY"></small></div></div>
  <p class="gsub" id="luM">Get all ${T} tokens home before the computer. A ${S.lv.outP.join(' or ')} brings a token out; a 6 or a capture rolls again. ★ squares are safe.</p></div>
  <div class="gbar"><button class="sec" id="luR">🏳 Resign</button></div>`;
 const tk=[0,1].map(sd=>[...A.querySelectorAll(`.lutk.s${sd}`)]),D=$('#luD'),M=$('#luM');
 const score=()=>{const h=sd=>S.P[sd].filter(p=>p==56).length;setScore(`🏠 ${h(0)}/${T} · 🤖 ${h(1)}/${T}`);prog(h(0)/T);$('#luY').textContent=`${h(0)}/${T} home`;$('#luC').textContent=`${h(1)}/${T} home`};
 const cur=[[...S.P[0]].fill(-1),[...S.P[1]].fill(-1)];// drawn positions (the engine may be ahead while events animate)
 const draw=(sd,i,p)=>{cur[sd][i]=p;const others=cur[sd].filter((q,j)=>j<i&&q==p&&p>=0).length,[x,y]=luXY(sd,p,i),o=p>=0?others*.18:0;tk[sd][i].style.transform=`translate(${(x+o)*100}%,${(y-o)*100}%)`;tk[sd][i].classList.toggle('home',p==56)};
 for(const sd of[0,1])for(let i=0;i<T;i++)draw(sd,i,-1);
 const roll=async(sd,n)=>{D.className='ludie s'+sd;if(sd==0){D.classList.add('ask');M.innerHTML='🎲 <b>Your roll</b> — tap the dice';X.sfx('select');await new Promise(r=>waitRoll=r);waitRoll=null;D.classList.remove('ask')}
  D.classList.add('spin');X.sfx('tap');for(let k=0;k<5;k++){D.innerHTML=luDie(1+Math.floor(Math.random()*6));await wait(60)}D.classList.remove('spin');D.innerHTML=luDie(n);X.buzz&&X.buzz(8);if(n==6)X.fx('select','tick');await wait(sd?380:160)};
 const move=async([,sd,i,from,to,cap])=>{if(from<0){draw(sd,i,0);X.fx('levelup','tick');await wait(260)}else for(let p=from+1;p<=to;p++){draw(sd,i,p);X.sfx('tick');await wait(p==to?150:110)}
  if(cap){for(let j=0;j<T;j++){const q=cur[1-sd][j];if(q>=0&&q<=50&&GC.luAbs(1-sd,q)==GC.luAbs(sd,to)){tk[1-sd][j].classList.add('hit');draw(1-sd,j,-1);setTimeout(()=>tk[1-sd][j].classList.remove('hit'),500)}}
   X.fx(sd?'error':'capture',sd?'error':'success');at(tk[sd][i],sd?'💥 Captured!':'💥 +Capture');await wait(380)}
  if(to==56){X.fx(sd?'tap':'match','success');if(!sd)at(tk[sd][i],'🏠')}score()};
 const run=async()=>{busy=true;while(S.ev.length&&!over){const e=S.ev.shift();if(e[0]=='r')await roll(e[1],e[2]);else if(e[0]=='p'){M.textContent=e[1]?`Computer rolled ${e[2]} — no move.`:`You rolled ${e[2]} — no move this time.`;await wait(e[1]?500:800)}
   else if(e[0]=='m')await move(e);else if(e[0]=='w'||e[0]=='t'){over=true;score();const won=e[0]=='w'&&e[1]==0;X.fx(won?'levelup':'lose',won?'big':'error');M.innerHTML=won?'🏆 <b>You win!</b>':e[0]=='t'?'Game ran too long.':'🤖 The computer got home first.';return setTimeout(()=>done(won?1:0,{why:won?'won':'lost'},LG),900)}}
  busy=false;if(over)return;const ms=GC.luLegal(S,0,S.roll);tk[0].forEach((b,i)=>b.classList.toggle('can',ms.includes(i)));
  if(ms.length==1){M.innerHTML=`You rolled <b>${S.roll}</b>.`;await wait(380);return pick(ms[0])}
  M.innerHTML=`You rolled <b>${S.roll}</b> — tap a glowing token to move it.`};
 const pick=i=>{if(busy||over)return;if(!GC.luLegal(S,0,S.roll).includes(i)){X.fx('error','error');shake(tk[0][i]);return}tk[0].forEach(b=>b.classList.remove('can'));LG.a.push(i);GC.luPlay(S,rng,i);run()};
 A.querySelector('#luT').onclick=e=>{const b=e.target.closest('.lutk.s0');if(b)pick(+b.dataset.i)};D.onclick=()=>waitRoll&&waitRoll();
 $('#luR').onclick=()=>{if(over)return;over=true;LG.a.push('r');done(0,{why:'resigned'},LG)};
 score();run();stopFn=()=>{over=true;waitRoll&&waitRoll()}}

function ayo(A,rng,done,setScore,L=1){const S=GC.ayNew(L),LG={m:[]};let busy=false,over=false;const wait=ms=>new Promise(r=>setTimeout(r,ms));
 const pit=i=>`<button class="aypit ${i<6?'me':'ai'}" data-p="${i}" aria-label="${i<6?'Your':'Computer'} pit ${i<6?i+1:12-i}"><span class="ays"></span><b></b></button>`;
 A.innerHTML=`<div class="ayw"><div class="aybd"><div class="ayst ai"><small>🤖</small><b id="ayC">0</b></div>
  <div class="ayrows"><div class="ayrow">${[11,10,9,8,7,6].map(pit).join('')}</div><div class="ayrow">${[0,1,2,3,4,5].map(pit).join('')}</div></div>
  <div class="ayst me"><small>You</small><b id="ayY">0</b></div></div>
  <p class="gsub" id="ayM">Tap one of your pits (bottom row) to sow its seeds to the right and round. End on the computer's side making <b>2 or 3</b> to capture. Over 24 seeds wins.</p></div>
  <div class="gbar"><button class="sec" id="ayR">🏳 Resign</button></div>`;
 const P=[...A.querySelectorAll('.aypit')].sort((a,b)=>a.dataset.p-b.dataset.p),M=$('#ayM');
 const seeds=n=>Array.from({length:Math.min(n,12)},(_,k)=>`<i style="--a:${(k*137)%360}deg;--r:${k?(k<6?150:250):0}%"></i>`).join('');
 const paint=(b,st)=>{b.forEach((n,i)=>{P[i].querySelector('b').textContent=n;P[i].querySelector('.ays').innerHTML=seeds(n)});$('#ayY').textContent=st[0];$('#ayC').textContent=st[1];setScore(`🌰 ${st[0]} · 🤖 ${st[1]}`);{const tot=b.reduce((a,n)=>a+n,0)+st[0]+st[1];prog(tot?st[0]/(tot/2):0)}
  const ms=!over&&!busy&&S.turn==0?GC.ayLegal(S,0):[];P.forEach((e,i)=>e.classList.toggle('can',ms.includes(i)))};
 const anim=async(side,p,cap,before,st)=>{const b=before.slice();let n=b[p],i=p;b[p]=0;P[p].classList.add('src');paint(b,st);X.sfx('tap');await wait(220);
  while(n--){i=(i+1)%12;if(i==p)i=(i+1)%12;b[i]++;paint(b,st);P[i].classList.remove('drop');void P[i].offsetWidth;P[i].classList.add('drop');X.sfx('tick');await wait(over?60:130)}P[p].classList.remove('src');
  if(cap){X.fx(side?'error':'capture',side?'error':'success');at(P[i],side?`🤖 +${cap}`:`+${cap} 🌰`);await wait(300)}};
 const play=async p=>{if(busy||over)return;if(!GC.ayLegal(S,0).includes(p)){X.fx('error','error');shake(P[p]);if(S.b[p]&&S.b.slice(6).every(x=>!x))M.innerHTML='The computer has no seeds — you must <b>feed</b> it.';return}
  busy=true;LG.m.push(p);const before=S.b.slice(),st0=S.st.slice();let snap={b:before,st:st0};const ev=[];
  // replay on a copy so each animation starts from the right board
  const C={b:before.slice(),st:st0.slice(),turn:0,n:S.n,over:false,win:-1};const res=GC.ayPlay(S,rng,L,p);
  for(const [side,q,cap] of res){const b0=C.b.slice(),s0=C.st.slice();C.turn=side;GC.ayApply(C,q);if(side){M.textContent='🤖 Computer is sowing…';await wait(450)}await anim(side,q,cap,b0,s0)}
  busy=false;paint(S.b,S.st);if(S.over){over=true;paint(S.b,S.st);const sc=GC.ayScore(S);X.fx(sc==2?'levelup':sc==1?'tap':'lose',sc==2?'big':'error');
   M.innerHTML=sc==2?`🏆 <b>You win ${S.st[0]}–${S.st[1]}!</b>`:sc==1?`🤝 Draw ${S.st[0]}–${S.st[1]}.`:`🤖 The computer wins ${S.st[1]}–${S.st[0]}.`;return setTimeout(()=>done(sc,{why:['won','lost','draw'][S.win],seeds:S.st},LG),1000)}
  M.innerHTML='Your turn — tap a glowing pit.'};
 A.querySelector('.ayrows').onclick=e=>{const b=e.target.closest('.aypit.me');if(b)play(+b.dataset.p)};
 $('#ayR').onclick=()=>{if(over)return;over=true;LG.m.push('r');done(0,{why:'resigned'},LG)};
 paint(S.b,S.st);stopFn=()=>{over=true}}

function wordSearch(A,rng,done,setScore,L=1){const P=GC.wpGen(rng,L),n=P.n,LG={f:[]},found=new Set();let a=null,over=false;
 const COL=['#ef5350','#42a5f5','#66bb6a','#ffa726','#ab47bc','#26c6da','#ec407a','#d4e157'];
 A.innerHTML=`<div class="wsw"><div class="wsl" id="wsL">${P.words.map((w,i)=>`<span data-i="${i}">${w.w}</span>`).join('')}</div>
  <div class="wsg" style="--n:${n}"><svg class="wsv" viewBox="0 0 ${n} ${n}" id="wsV"></svg>${P.g.map((row,r)=>row.map((ch,c)=>`<button class="wsc" data-r="${r}" data-c="${c}">${ch}</button>`).join('')).join('')}</div>
  <p class="gsub" id="wsM">Tap the <b>first</b> letter of a word, then its <b>last</b> letter (or drag across it). Words run ${['','across and down','across, down and diagonally','in more directions — some backwards','in all 8 directions'][[0,0,1,2,2,3,3,3,4][GC.wpLevel(L).dirs]]}.</p></div>
  <div class="gbar"><button class="sec" id="wsG">🏳 Give up</button></div>`;
 const cell=(r,c)=>A.querySelector(`.wsc[data-r="${r}"][data-c="${c}"]`),M=$('#wsM'),V=$('#wsV');
 const score=()=>{setScore(`🔤 ${found.size}/${P.words.length}`);prog(found.size/P.words.length)};
 const line=(r0,c0,r1,c1,col,cls)=>`<line class="${cls}" x1="${c0+.5}" y1="${r0+.5}" x2="${c1+.5}" y2="${r1+.5}" stroke="${col}"/>`;
 const draw=(tmp)=>{V.innerHTML=[...found].map(i=>{const w=P.words[i];return line(w.r0,w.c0,w.r1,w.c1,COL[i%COL.length],'wsf')}).join('')+(tmp||'')};
 const sel=(r,c,on)=>{const e=cell(r,c);e&&e.classList.toggle('sel',on)};
 const mark=(r0,c0,r1,c1)=>{sel(r0,c0,false);M.innerHTML='Tap the first letter of a word, then its last letter.';const dr=r1-r0,dc=c1-c0;if(!(dr==0||dc==0||Math.abs(dr)==Math.abs(dc))||(dr==0&&dc==0)){draw();return}
  const i=GC.wpMatch(P,r0,c0,r1,c1);if(i<0||found.has(i)){X.fx('error','error');draw(line(r0,c0,r1,c1,'rgba(255,255,255,.5)','wsx'));setTimeout(()=>draw(),350);return}
  found.add(i);LG.f.push([r0,c0,r1,c1]);draw();M.innerHTML=`Nice! <b>${P.words.length-found.size}</b> to go.`;const ch=$(`#wsL [data-i="${i}"]`);ch.classList.add('got');ch.style.setProperty('--wc',COL[i%COL.length]);X.fx('match','success');at(cell(r1,c1),'✓ '+P.words[i].w);score();
  if(found.size==P.words.length){over=true;X.fx('levelup','big');M.innerHTML='🏆 <b>All words found!</b>';setTimeout(()=>done(1,{words:found.size},LG),900)}};
 const at2=e=>{const t=document.elementFromPoint(e.clientX,e.clientY);return t&&t.closest&&t.closest('.wsc')};
 let drag=null;const G2=A.querySelector('.wsg');
 G2.addEventListener('pointerdown',e=>{if(over)return;const b=at2(e);if(!b)return;e.preventDefault();const r=+b.dataset.r,c=+b.dataset.c;
  if(a){const [r0,c0]=a;a=null;mark(r0,c0,r,c);return}drag={r,c,moved:false};sel(r,c,true);X.sfx('tap')});
 G2.addEventListener('pointermove',e=>{if(!drag)return;const b=at2(e);if(!b)return;const r=+b.dataset.r,c=+b.dataset.c;if(r!=drag.r||c!=drag.c){drag.moved=true;draw(line(drag.r,drag.c,r,c,'rgba(255,213,79,.7)','wsx'))}});
 const up=e=>{if(!drag)return;const d=drag;drag=null;const b=at2(e);if(d.moved&&b){mark(d.r,d.c,+b.dataset.r,+b.dataset.c)}else{a=[d.r,d.c];M.innerHTML='Now tap the <b>last</b> letter of the word.'}};
 G2.addEventListener('pointerup',up);G2.addEventListener('pointercancel',()=>{drag=null});
 $('#wsG').onclick=()=>{if(over)return;over=true;done(0,{gave_up:true},{f:LG.f,gave_up:true})};
 score();stopFn=()=>{over=true}}

function memory(A,rng,done,setScore,L=1){const N=SES.cards|0,cols=SES.cols|0,allowed=SES.allowed|0,face=Array(N).fill(null),got=Array(N).fill(false);let busy=false,over=false,misses=0,pairs=0,firstI=null;
 A.innerHTML=`<div class="mmw"><div class="mmg" style="--c:${cols}">${Array.from({length:N},(_,i)=>`<button class="mmc" data-i="${i}" aria-label="Card ${i+1}"><span class="mmb">?</span><span class="mmf"></span></button>`).join('')}</div>
  <p class="gsub" id="mmM">Flip two cards at a time and find all <b>${N/2}</b> pairs. Up to <b>${allowed}</b> misses still wins.</p></div>
  <div class="gbar"><button class="sec" id="mmG">🏳 Give up</button></div>`;
 const C=[...A.querySelectorAll('.mmc')],M=$('#mmM');const wait=ms=>new Promise(r=>setTimeout(r,ms));
 const score=()=>{setScore(`🃏 ${pairs}/${N/2} · ❌ ${misses}/${allowed}`);prog(pairs/(N/2))};
 const show=(i,sym)=>{C[i].querySelector('.mmf').textContent=sym;C[i].classList.add('up')};
 const hide=i=>C[i].classList.remove('up');
 const flip=async i=>{if(busy||over||got[i]||i===firstI)return;busy=true;X.sfx('tap');let r;try{r=await DB.mmFlip(SES.id,i)}catch(e){busy=false;X.toast('⚠ '+esc(e.message));return}
  show(i,r.sym);misses=r.misses;
  if(r.first){firstI=i;busy=false;score();return}
  firstI=null;if(r.match){got[i]=got[r.a]=true;pairs++;C[i].classList.add('got');C[r.a].classList.add('got');X.fx('match','success');at(C[i],'✓ Pair');score();
   if(r.done){over=true;X.fx('levelup','big');M.innerHTML=misses<=allowed?'🏆 <b>All pairs found!</b>':`All pairs found with ${misses} misses.`;busy=false;return setTimeout(()=>done(1,{misses},{}),800)}}
  else{X.fx('error','error');score();if(misses==allowed+1)M.innerHTML='Past the free misses — keep going!';await wait(750);hide(i);hide(r.a)}
  busy=false};
 A.querySelector('.mmg').onclick=e=>{const b=e.target.closest('.mmc');if(b)flip(+b.dataset.i)};
 $('#mmG').onclick=()=>{if(over)return;over=true;done(0,{gave_up:true},{})};
 score();stopFn=()=>{over=true}}

function quiz(A,rng,done,setScore,L=1){let Q=SES.quiz,busy=false,over=false,correct=0,tmr=null,left=0;const pass=SES.pass|0;
 A.innerHTML=`<div class="qzw"><div class="qzt"><i id="qzBar"></i></div><p class="qzn" id="qzN"></p><h3 class="qzq" id="qzQ"></h3><div class="qzo" id="qzO"></div>
  <p class="gsub" id="qzM">Get <b>${pass}</b> of ${Q.of} right to win. Faster is fine — just answer before the bar runs out.</p></div>
  <div class="gbar"><button class="sec" id="qzG">🏳 Give up</button></div>`;
 const O=$('#qzO'),bar=$('#qzBar');const wait=ms=>new Promise(r=>setTimeout(r,ms));
 const score=()=>{setScore(`✅ ${correct}/${Q.of}`);prog(correct/Q.of)};
 const show=q=>{Q=q;$('#qzN').textContent=`Question ${q.n} of ${q.of}`;$('#qzQ').textContent=q.q;O.innerHTML=q.opts.map((o,i)=>`<button class="qzb" data-i="${i}">${esc(o)}</button>`).join('');
  left=q.secs*10;clearInterval(tmr);bar.style.width='100%';bar.className='';tmr=setInterval(()=>{left--;bar.style.width=Math.max(0,left/(q.secs*10)*100)+'%';if(left<q.secs*3)bar.className='low';if(left<=0){clearInterval(tmr);answer(-1)}},100)};
 const answer=async c=>{if(busy||over)return;busy=true;clearInterval(tmr);let r;try{r=await DB.qzAnswer(SES.id,c)}catch(e){busy=false;X.toast('⚠ '+esc(e.message));return}
  const B=[...O.querySelectorAll('.qzb')];B.forEach(b=>b.disabled=true);B[r.right]&&B[r.right].classList.add('right');
  if(r.ok){X.fx('match','success');at(B[c],'+1')}else{X.fx('error','error');if(c>=0&&B[c])B[c].classList.add('wrong');if(c<0)X.toast("⏱ Time's up")}
  correct=r.correct;score();await wait(r.ok?700:1300);
  if(r.done){over=true;const w=correct>=pass;X.fx(w?'levelup':'lose',w?'big':'error');$('#qzQ').textContent=w?`🏆 ${correct}/${Q.of} — you win!`:`${correct}/${Q.of} correct`;O.innerHTML='';busy=false;return setTimeout(()=>done(correct,{correct},{}),700)}
  busy=false;show(r.next)};
 O.onclick=e=>{const b=e.target.closest('.qzb');if(b)answer(+b.dataset.i)};
 $('#qzG').onclick=()=>{if(over)return;over=true;clearInterval(tmr);done(0,{gave_up:true},{})};
 show(Q);score();stopFn=()=>{over=true;clearInterval(tmr)}}

const GAMES={ludo,ayo,word_search:wordSearch,memory,quiz,number_match:numberMatch,water_sort:waterSort,traffic_jam:trafficJam,snake:snake,checkers:checkers,market_trader:marketTrader};
window.Games={open,close,play,pre,_list:LIST,_how:howOf,_X:X,_lv:LV,_g:GAMES,_ck:{ckMoves,ckApply},_solvable:GC.wsSolvable,_bj:{bjGen,bjPath},_log:()=>window.__glog};
})();
