/* Standalone portfolio build of Plot side quests: a tiny local stand-in for the Plot server.
   No accounts, no money, no network. Rounds are generated and scored in the browser with the same rules (GameCore). */
(function(){
const GC=window.GameCore;
const T={number_match:300,water_sort:1,traffic_jam:1,snake:30,checkers:2,ayo:2,ludo:1,word_search:1,memory:1,quiz:0.6,market_trader:12};
const MS={number_match:5,water_sort:3,traffic_jam:3,snake:3,checkers:5,ayo:5,ludo:5,word_search:3,memory:3,quiz:3,market_trader:5};
const CFG={max_level:100,max_paid_level:10,level_step:.2,level_step_high:.05,diminish:.7,floor:.2,paid_rounds_per_day:20,games:{}};
for(const k in T)CFG.games[k]={base:1,target:T[k],min_secs:MS[k]};
const S={};let N=0;const sh=(a,r=Math.random)=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const LS={get:k=>{try{return JSON.parse(localStorage.getItem('pf.'+k))}catch(e){return null}},set:(k,v)=>{try{localStorage.setItem('pf.'+k,JSON.stringify(v))}catch(e){}}};
let BANK=null;
function finish(s,score){const tg=T[s.game],out=score>=tg?'win':score>0?'partial':'loss';s.over=true;
 const U=(LS.get('lv.'+s.game)||1);let unlocked=U,level_up=false;if(out=='win'&&s.level>=U&&U<100){unlocked=U+1;level_up=true;LS.set('lv.'+s.game,unlocked)}
 return {ok:true,score,outcome:out,reward:out=='loss'?0:1,level:s.level,level_up,unlocked}}
const mmPairs=L=>L<=1?6:L<=4?8:L<=10?10:L<=30?12:15;
const SYMS=['🥭','🍍','🌽','🥥','🐟','🍞','📱','🚕','🏠','💰','🌴','🥁','⚽','🐐','🌶️','🍌','🚌','⭐'];
function qzQ(s){const q=s.qs[s.idx];return {n:s.idx+1,of:s.qs.length,q:q.q,secs:s.secs,opts:q.opts}}
function mtState(s){const i=Math.min(s.T-1,Math.floor((Date.now()-s.t0)/s.tk));s.i=i;const done=i>=s.T-1;
 return {i,px:s.px.slice(0,i+1),cash:s.cash,sh:s.sh,trades:s.trades,marks:s.marks,done,news:s.news.filter(n=>n.k<=i).map(n=>n.v)}}
window.DB={
 gameConfig:async()=>CFG,
 startGame:async(game,level=1)=>{const id='s'+(++N)+'_'+Date.now(),seed=(Math.random()*4294967296)>>>0,s={id,game,level,seed,t0:Date.now()};S[id]=s;const out={id,seed};
  if(game=='memory'){const n=mmPairs(level),pick=sh(SYMS.slice()).slice(0,n);s.cards=sh(pick.concat(pick));s.got=Array(2*n).fill(false);s.open=null;s.misses=0;
   s.allowed=Math.ceil(n*Math.max(.8,2-(level-1)*.06));Object.assign(out,{cards:2*n,cols:n<=6?3:n<=12?4:5,allowed:s.allowed})}
  if(game=='quiz'){if(!BANK)BANK=await (await fetch('../shared/quizbank.json')).json();const n=level<=2?5:level<=8?7:level<=25?8:10,maxd=level<=2?1:level<=6?2:3;
   const pool=sh(BANK.filter(q=>q[0]<=maxd)).sort((a,b)=>(b[0]==maxd)-(a[0]==maxd)).slice(0,n*3);s.qs=sh(pool).slice(0,n).map(q=>{const o=sh([0,1,2,3]);return {q:q[1],opts:o.map(k=>q[2][k]),right:o.indexOf(0)}});
   s.idx=0;s.correct=0;s.secs=Math.max(10,25-Math.floor((level-1)/3));s.asked=Date.now();Object.assign(out,{quiz:qzQ(s),pass:Math.ceil(n*.6)})}
  if(game=='market_trader'){const r=GC.rngOf(seed),Tn=120,ph=r()*6.28,ph2=r()*6.28,amp=.07+r()*.04;let w=0;s.px=[];
   for(let k=0;k<Tn;k++){w+=(r()-.5)*1.6;w*=.97;s.px.push(Math.round((100*(1+amp*Math.sin(k/10+ph)+.04*Math.sin(k/4.3+ph2))+w)*100)/100)}
   s.px[0]=100;s.T=Tn;s.tk=500;s.cash=10000;s.sh=0;s.trades=0;s.marks=[];s.news=[];s.t0=Date.now();
   s.fee=level<=11?Math.round(.03*Math.pow((level-1)/10,1.5)*1e4)/1e4:.03+.0002*(level-11);Object.assign(out,{ticks:Tn,tick_ms:500})}
  return out},
 verifyGame:async(id,log,c)=>{const s=S[id];let v=null;try{v=GC.verify(s.game,s.level,s.seed,log||{},c&&c.client_secs)}catch(e){}
  const score=v&&v.ok?+v.score:+(c&&c.client_score)||0;return finish(s,score)},
 mmFlip:async(id,i)=>{const s=S[id];if(s.over)throw new Error('This round is over');if(s.got[i]||s.open===i)throw new Error('Card already face up');
  if(s.open==null){s.open=i;return {i,sym:s.cards[i],first:true,misses:s.misses}}const a=s.open;s.open=null;
  if(s.cards[a]==s.cards[i]){s.got[a]=s.got[i]=true;return {i,sym:s.cards[i],a,match:true,misses:s.misses,done:s.got.every(Boolean)}}
  s.misses++;return {i,sym:s.cards[i],a,match:false,misses:s.misses,done:false}},
 mmFinish:async id=>{const s=S[id],n=s.cards.length/2,all=s.got.every(Boolean);const sc=!all?0:s.misses<=s.allowed?1:Math.max(.2,Math.round((1-(s.misses-s.allowed)/n*.5)*100)/100);return finish(s,sc)},
 qzAnswer:async(id,c)=>{const s=S[id];if(s.over||s.idx>=s.qs.length)throw new Error('This round is over');const q=s.qs[s.idx],late=Date.now()>s.asked+(s.secs+2)*1000,ok=!late&&c===q.right;
  s.idx++;if(ok)s.correct++;s.asked=Date.now();const done=s.idx>=s.qs.length;return {right:q.right,ok,late,correct:s.correct,done,next:done?null:qzQ(s)}},
 qzFinish:async id=>{const s=S[id],n=s.qs.length,sc=s.idx<n?0:Math.round(s.correct/n*100)/100;return Object.assign(finish(s,sc),{correct:s.correct,of:n})},
 mtTick:async id=>mtState(S[id]),
 mtTrade:async(id,side)=>{const s=S[id],st=mtState(s);if(st.done)throw new Error('Market closed');const p=s.px[st.i];
  if(side=='buy'&&s.cash>1){s.sh=s.cash*(1-s.fee)/p;s.cash=0;s.trades++;s.marks.push({k:st.i,b:1})}
  else if(side=='sell'&&s.sh>0){s.cash=s.sh*p*(1-s.fee);s.sh=0;s.trades++;s.marks.push({k:st.i,b:0})}return mtState(s)},
 mtFinish:async id=>{const s=S[id],p=s.px[s.T-1],val=s.cash+s.sh*p,pct=Math.round((val/10000-1)*1000)/10;
  const r=finish(s,s.trades>0?Math.max(0,pct):0);return Object.assign(r,{profit_pct:pct,final:Math.round(val),score:Math.max(0,pct),outcome:pct>=12?'win':pct>0?'partial':'loss'})},
 humanCheck:async()=>({ok:true})};

// standalone pre-round screen (level picker + how-to), replaces Plot's reward card
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
window.SA_OPEN=()=>{location.href='../'};
window.SA_PRE=async(id,lvl)=>{const G=window.Games,g=G._list.find(x=>x.id==id),X=G._X;const U=Math.max(LS.get('lv.'+id)||1,(G._lv[id]&&G._lv[id].unlocked)||1);G._lv[id]={unlocked:U};
 const L=Math.max(1,Math.min(U,lvl||LS.get('pick.'+id)||U));LS.set('pick.'+id,L);
 let o=document.getElementById('games');if(!o){o=document.createElement('div');o.id='games';document.body.appendChild(o)}o.classList.remove('hidden');document.documentElement.classList.add('gplaying');
 document.querySelectorAll('.gpop').forEach(e=>e.remove());
 const w0=Math.floor((L-1)/10)*10;
 o.innerHTML=`<div class="gwrap"><div class="ghead"><button class="gx" id="gBack" title="All games">‹</button><h2>${g.icon} ${esc(g.name)}</h2><button class="gx gi2" id="gSet" title="Sound & vibration">⚙️</button></div>
 <div class="gpre" style="--gc:linear-gradient(135deg,${g.c})"><div class="gpi">${g.icon}</div><p>${g.desc}</p>
  <div class="glvl"><small>Level ${L} of 100 · win a level to unlock the next</small>
  <div class="gwld">${Array.from({length:10},(_,w)=>{const lock=w*10+1>U;return `<button class="${w0==w*10?'on':''} ${lock?'lock':''}" data-w="${w}" ${lock?'disabled':''}><b>${lock?'🔒':''}World ${w+1}</b><small>${Math.max(0,Math.min(10,U-1-w*10))}/10</small></button>`}).join('')}</div>
  <div class="glvr">${Array.from({length:10},(_,k)=>w0+k+1).map(k=>k<=U?`<button class="${k==L?'on':''}" data-lv="${k}"><b>${k}</b><small>${k<U?'⭐':'▶'}</small></button>`:`<button class="lock" disabled><b>🔒${k}</b></button>`).join('')}</div></div>
  <p class="gsub">Free to play in your browser. Progress is saved on this device.</p></div>
  <button class="gstart" id="gGo">▶ Play</button><button class="gx2" id="gHow">❓ How to play</button>
  <p class="gsub sa-plot">One of 11 side quests inside <a href="https://plot-game.pages.dev" target="_blank" rel="noopener"><b>Plot: Build Your Empire</b></a> by Stephen Luka. <a href="../../">← Back to portfolio</a></p></div>`;
 o.querySelector('#gBack').onclick=()=>SA_OPEN();o.querySelector('#gSet').onclick=()=>X.settings();o.querySelector('#gHow').onclick=()=>X.howTo(id,g.name,G._how(g),true);
 o.querySelectorAll('[data-lv]').forEach(b=>b.onclick=()=>{X.sfx('select');SA_PRE(id,+b.dataset.lv)});
 o.querySelectorAll('[data-w]').forEach(b=>b.onclick=()=>{X.sfx('select');const w=+b.dataset.w;SA_PRE(id,Math.min(U,w*10+10))});
 o.querySelector('.gwld .on')?.scrollIntoView({inline:'center',block:'nearest'});
 o.querySelector('#gGo').onclick=async()=>{await X.howTo(id,g.name,G._how(g));G.play(id,L)}};
})();
