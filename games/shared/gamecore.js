/* © 2026 Plot. All rights reserved. Proprietary — copying, redistribution or reuse of this code is prohibited. */
// Plot — pure side-quest game rules (r13). Shared by the browser (js/games.js) and the server-side verifier
// (Cloudflare Pages _worker.js, /api/verify). No DOM here. Every round is generated from the server seed; the client
// sends a move log and the verifier replays it with these exact rules, so a reward needs a real, legal game.
(function(root){
const rngOf=seed=>{let a=seed>>>0;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}};

// ---------- Number Match ----------
// r49: L1-6 more starting numbers and Adds (27/6 at L1 -> 21/2 at L6), L7+ 18/1 as before.
// r13 levels 1-100: L1-5 unchanged (fewer numbers, fewer adds); from L6 the deal avoids easy neighbour pairs more and more
// (bias 0 -> .85 at L100), and every deal (all levels) is checked with a plain greedy player that must reach 300 points (else re-dealt, softer).
const LMAX=100,lvl=L=>Math.max(1,Math.min(LMAX,L|0));
function nmDeal(rng,L,bias){const W=9,n0=[27,27,27,24,24,21][L-1]||18,cells=[];
 for(let i=0;i<n0;i++){let v=1+Math.floor(rng()*9);if(bias&&i){const p=cells[i-1],q=i>=W?cells[i-W]:0,easy=x=>x==p||x+p==10||(q&&(x==q||x+q==10));if(easy(v)&&rng()<bias)v=1+Math.floor(rng()*9)}cells.push(v)}
 return{W,n0,cells,adds:[6,6,5,4,3,2][L-1]||1,score:0,pairs:0,over:false,end:null,bias}}
function nmGreedy(s0){const s={...s0,cells:s0.cells.slice()};for(let k=0;k<3000&&!s.over;k++){const p=nmHintPair(s);if(p)nmPair(s,p[0],p[1]);else if(!nmAdd(s))break}return s.score}
function nmInit(rng,L){L=lvl(L);const b=L<=5?0:Math.min(.85,(L-5)*.009);let s;
 for(let k=0;k<20;k++){s=nmDeal(rng,L,b*(1-k/20));if(nmGreedy(s)>=300)return s}return s}
function nmFree(s,i,j){const C=s.cells,W=s.W;if(i>j)[i,j]=[j,i];const clear=(st)=>{for(let k=i+st;k<j;k+=st)if(C[k])return false;return true};
 if(clear(1))return true;if((j-i)%W==0&&clear(W))return true;const dr=Math.floor(j/W)-Math.floor(i/W),dc=j%W-i%W;
 if(dr>0&&Math.abs(dc)==dr)return clear(W+Math.sign(dc));return false}
function nmMatch(s,i,j){const C=s.cells;return i!=j&&C[i]&&C[j]&&(C[i]==C[j]||C[i]+C[j]==10)&&nmFree(s,i,j)}
function nmAny(s){const C=s.cells;for(let i=0;i<C.length;i++)if(C[i])for(let j=i+1;j<C.length;j++)if(nmMatch(s,i,j))return true;return false}
function nmHintPair(s){const C=s.cells;for(let i=0;i<C.length;i++)for(let j=i+1;j<C.length;j++)if(nmMatch(s,i,j))return[i,j];return null}
// returns rows cleared, or -1 if illegal. Sets s.over/s.end when the round ends by itself.
function nmPair(s,i,j){if(s.over||!nmMatch(s,i,j))return -1;const C=s.cells,W=s.W;C[i]=0;C[j]=0;s.score+=15;s.pairs++;let rows=0;
 for(let r=Math.floor(C.length/W);r>=0;r--){const row=C.slice(r*W,r*W+W);if(row.length==W&&row.every(v=>!v)){C.splice(r*W,W);s.score+=25;rows++}}
 while(C.length&&!C[C.length-1])C.pop();
 if(!C.some(Boolean)){s.score+=200;s.over=true;s.end='cleared'}else if(!nmAny(s)&&!s.adds){s.over=true;s.end='stuck'}return rows}
function nmAdd(s){if(s.over||!s.adds)return false;s.adds--;s.cells=s.cells.concat(s.cells.filter(Boolean));return true}
function nmHint(s){if(s.over)return null;const p=nmHintPair(s);if(p)s.score=Math.max(0,s.score-5);return p}

// ---------- Water Sort ----------
function wsSolvable(tubes,cap){const key=t=>t.map(x=>x.join(',')).sort().join('|');const seen=new Set();let budget=150000;
 const won=t=>t.every(x=>!x.length||(x.length==cap&&x.every(c=>c==x[0])));
 const dfs=t=>{if(won(t))return true;if(--budget<0)return false;const k=key(t);if(seen.has(k))return false;seen.add(k);
  for(let a=0;a<t.length;a++){if(!t[a].length)continue;const c=t[a][t[a].length-1];let run=0;for(let i=t[a].length-1;i>=0&&t[a][i]==c;i--)run++;
   if(run==t[a].length&&run==cap)continue;
   for(let b=0;b<t.length;b++){if(a==b||t[b].length==cap)continue;const top=t[b][t[b].length-1];if(t[b].length&&top!=c)continue;if(!t[b].length&&run==t[a].length)continue;
    const n=Math.min(run,cap-t[b].length);const nt=t.map(x=>x.slice());for(let i=0;i<n;i++)nt[b].push(nt[a].pop());if(dfs(nt))return true}}return false};
 return dfs(tubes)}
// r49: colours 4..10 over L1-7, 11 from L8.
// r13: colours 6..11 over L1-6 (unchanged), then +1 colour every 25 levels (max 14); hidden layers (only the top of each
// tube is visible until uncovered): 1 from L10, 2 from L40, 3 from L70. Two empty tubes always; every deal is DFS-checked.
const wsColours=L=>{L=lvl(L);return L<=7?3+L:Math.min(14,11+Math.floor((L-6)/25))},wsHidden=L=>{L=lvl(L);return L<10?0:Math.min(3,1+Math.floor((L-10)/30))};
function wsInit(rng,L){const cap=4,nc=wsColours(L);let tubes,ok=false;
 for(let tries=0;tries<30;tries++){const seg=[];for(let c=0;c<nc;c++)for(let i=0;i<cap;i++)seg.push(c);
  for(let i=seg.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[seg[i],seg[j]]=[seg[j],seg[i]]}
  tubes=[];for(let t=0;t<nc;t++)tubes.push(seg.slice(t*cap,t*cap+cap));tubes.push([],[]);if(wsSolvable(tubes.map(x=>x.slice()),cap)){ok=true;break}}
 return{cap,nc,tubes,hidden:wsHidden(L),checked:ok}}
const wsFull=(x,cap)=>x.length==cap&&x.every(c=>c==x[0]);
const wsWon=(t,cap)=>t.every(x=>!x.length||wsFull(x,cap));
function wsLegal(t,cap,a,b){const A1=t[a],B1=t[b];if(!A1||!B1||a==b||!A1.length||B1.length==cap)return false;return !B1.length||B1[B1.length-1]==A1[A1.length-1]}
function wsPour(t,cap,a,b){const A1=t[a],B1=t[b],c=A1[A1.length-1];let n=0;for(let k=A1.length-1;k>=0&&A1[k]==c&&B1.length+n<cap;k--)n++;for(let k=0;k<n;k++)B1.push(A1.pop());return n}

// ---------- Traffic Jam (Car Out / Bus Jam) ----------
const BJD=[[0,-1],[1,0],[0,1],[-1,0]],BJN=12;
const bjCells=v=>{const r=[];for(let j=0;j<v.len;j++)r.push(v.dir%2?[v.x+j,v.y]:[v.x,v.y+j]);return r};
const bjFront=v=>v.dir==0?[v.x,v.y]:v.dir==1?[v.x+v.len-1,v.y]:v.dir==2?[v.x,v.y+v.len-1]:[v.x,v.y];
function bjPath(v,W,H,occ){const [dx,dy]=BJD[v.dir];let [x,y]=bjFront(v),d=0;for(;;){x+=dx;y+=dy;if(x<0||y<0||x>=W||y>=H)return{clear:true,d};const o=occ[y*W+x];if(o>=0)return{clear:false,d,by:o};d++}}
// r49: L1-7 eased (fewer colours/vehicles, 5 slots to L3, 4 to L7), meeting the old curve at L8.
// r13 levels: L1-8 unchanged. Then the lot grows (+1 every 31 levels, max 14 wide), +1 colour every 32 levels (max 12),
// it packs denser (2.2 -> 1.6 cells per vehicle cell), coaches (cap 14) from L40, and from L20 the solution keeps every slot busy
// (more colours interleaved in the queue). Solvable by construction (reverse placement order).
function bjParams(L){L=lvl(L);const W=L<=8?Math.min(11,7+(L>>1)):Math.min(14,11+Math.floor((L-8)/31)),nc=L<=8?[3,3,4,5,6,7,8,9][L-1]:Math.min(BJN,9+Math.floor((L-6)/32)),
 S=L<4?5:L<8?4:3,m=L<20?Math.max(1,S-1):S,D=L<=8?2.2:2.2-.6*(L-8)/92;return{W,H:W+1,nc,S,m,D}}
function bjGen(rng,L){L=lvl(L);const {W,H,nc,S,m,D}=bjParams(L);
 const types=[{t:'car',len:2,cap:4},{t:'van',len:2,cap:6}];if(L>=2)types.push({t:'bus',len:3,cap:10});if(L>=5)types.push({t:'van',len:2,cap:8},{t:'bus',len:3,cap:12});if(L>=40)types.push({t:'bus',len:3,cap:14});
 const occ=new Int16Array(W*H).fill(-1),vs=[];let fail=0;const want=Math.min(Math.round((14+5*L)*(L<8?.6+.05*L:1)),W*H/D|0);
 while(vs.length<want&&fail<900){const ty=types[rng()*types.length|0],dir=rng()*4|0,v={x:rng()*W|0,y:rng()*H|0,dir,len:ty.len,cap:ty.cap,t:ty.t};
  const cs=bjCells(v);if(cs.some(([x,y])=>x>=W||y>=H||occ[y*W+x]>=0)||!bjPath(v,W,H,occ).clear){fail++;continue}
  v.col=rng()*nc|0;cs.forEach(([x,y])=>occ[y*W+x]=vs.length);vs.push(v);fail=0}
 const R=vs.map((_,i)=>i).reverse(),slots=Array(S).fill(null),Q=[];let ri=0;
 while(ri<R.length||slots.some(s=>s)){const n=slots.filter(s=>s).length;
  if(ri<R.length&&(n==0||(n<m&&rng()<.45))){const i=R[ri++];slots[slots.indexOf(null)]={col:vs[i].col,left:vs[i].cap,q:ri};continue}
  const ps=slots.filter(s=>s),c=ps[rng()*ps.length|0].col;Q.push(c);let k=-1;slots.forEach((s,j)=>{if(s&&s.col==c&&(k<0||s.q<slots[k].q))k=j});slots[k].left--;if(!slots[k].left)slots[k]=null}
 return{W,H,S,nc,vs,Q,order:R}}
// Instant (no-animation) replay of a tap log: ['d',i] = vehicle i drove out, 'x' = extra slot opened, 'h' = hint.
function bjReplay(P,log){const {W,H,S,Q}=P,vs=P.vs.map(v=>({...v,gone:false})),occ=new Int16Array(W*H).fill(-1);vs.forEach((v,i)=>bjCells(v).forEach(([x,y])=>occ[y*W+x]=i));
 const slots=Array(S+1).fill(null);let seq=0,extra=false,qi=0,hints=0,end=null;
 const avail=()=>slots.map((o,s)=>s<S||extra?s:-1).filter(s=>s>=0);
 const board=()=>{for(;;){if(qi>=Q.length){end='won';return}const c=Q[qi];const s=avail().filter(s=>slots[s]&&slots[s].col==c).sort((a,b)=>slots[a].q-slots[b].q)[0];
  if(s==null)break;qi++;if(!--slots[s].left)slots[s]=null}
  if(avail().every(s=>slots[s])&&extra)end='gridlock'};
 for(const a of log){if(end)return{ok:false,why:'moves after the round ended'};
  if(a==='h'){hints++;continue}if(a==='x'){if(extra)return{ok:false,why:'extra slot twice'};extra=true;board();continue}
  if(!Array.isArray(a)||a[0]!=='d')return{ok:false,why:'bad log entry'};const i=a[1]|0,v=vs[i];if(!v||v.gone)return{ok:false,why:'bad vehicle'};
  if(!bjPath(v,W,H,occ).clear)return{ok:false,why:'vehicle blocked'};const s=avail().find(s=>!slots[s]);if(s==null)return{ok:false,why:'no free slot'};
  v.gone=true;bjCells(v).forEach(([x,y])=>occ[y*W+x]=-1);slots[s]={col:v.col,left:v.cap,q:++seq};board()}
 return{ok:true,won:end==='won',end,hints,left:Q.length-qi}}

// ---------- Snake ----------
// r49: L1-7 slower (180,165,150,136,122,106,88 ms), no rocks before L7; L8+ unchanged.
// r13: tick 140 ms at L1, -12 ms per level to 68 ms at L7, then slowly down to 52 ms at L100. Rocks from L6 (1 more about
// every 2.4 levels, max 40) sit only on even/even cells, so the board can never be cut in two; hitting a rock ends the round.
const SN_N=18,snStep=L=>{L=lvl(L);return L<=7?[180,165,150,136,122,106,88][L-1]:Math.round(68-16*(L-7)/93)},snRockN=L=>{L=lvl(L);return L<7?0:Math.min(40,Math.floor((L-3)*.42))};
function snRocks(rng,L){const n=snRockN(L),out=[];let g=0;while(out.length<n&&g++<4000){const x=2*Math.floor(rng()*9),y=2*Math.floor(rng()*9);
  if(y==8&&x<=12)continue;if(!out.some(r=>r[0]==x&&r[1]==y))out.push([x,y])}return out}
// r12: walls wrap around (leave one side, come back on the opposite side, same row/column); only biting yourself ends the round.
// turns: [[tick,dx,dy],...] = direction taken at that tick; ticks = number of ticks run (the last one is the crash).
function snReplay(rng,L,turns,ticks){const N=SN_N;let sn=[[8,9],[7,9],[6,9]],d=[1,0],food,score=0,ti=0;const rocks=snRocks(rng,L),rk=(x,y)=>rocks.some(r=>r[0]==x&&r[1]==y);
 const place=()=>{do{food=[Math.floor(rng()*N),Math.floor(rng()*N)]}while(rk(food[0],food[1])||sn.some(p=>p[0]==food[0]&&p[1]==food[1]))};place();
 if(!(ticks>0&&ticks<200000))return{ok:false,why:'bad tick count'};
 for(let t=0;t<ticks;t++){if(ti<turns.length&&turns[ti][0]===t){const nd=[turns[ti][1]|0,turns[ti][2]|0];ti++;
   if(Math.abs(nd[0])+Math.abs(nd[1])!=1||(nd[0]==-d[0]&&nd[1]==-d[1])||(nd[0]==d[0]&&nd[1]==d[1]))return{ok:false,why:'illegal turn'};d=nd}
  else if(ti<turns.length&&turns[ti][0]<t)return{ok:false,why:'turn log out of order'};
  const h=[(sn[0][0]+d[0]+N)%N,(sn[0][1]+d[1]+N)%N];
  if(rk(h[0],h[1])||sn.some(p=>p[0]==h[0]&&p[1]==h[1])){if(t!==ticks-1)return{ok:false,why:'crash before the end'};return{ok:true,score,ticks}}
  sn.unshift(h);if(h[0]==food[0]&&h[1]==food[1]){score++;place()}else sn.pop()}
 return{ok:false,why:'no crash at the end'}}

// ---------- Checkers ----------
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
// r49: L1-4 easier still (1-2 move look-ahead with many loose moves, varied openings).
// r14 (eased): L1-4 unchanged. The computer searches a bounded 3/4/5 moves ahead (L5-29 / L30-69 / L70+) and keeps some
// imperfection that fades within each band; L90+ you start one piece down. Its first 3 moves are picked loosely among
// near-equal options (seeded), so openings vary. Self-play target for a strong player: L50 ~40% wins, L100 ~15-25%.
const ckLevel=L=>{L=lvl(L);if(L<=4)return{depth:L<=2?1:2,noise:[1.6,1.3,1.1,.95][L-1],hand:0,open:3};
 if(L<30)return{depth:3,noise:.9-.6*(L-5)/24,hand:0,open:3};
 if(L<50)return{depth:4,noise:.35-.2*(L-30)/19,hand:0,open:3};
 if(L<90)return{depth:5,noise:.04-.04*(L-50)/39,hand:0,open:3};
 return{depth:5,noise:.3-.15*(L-90)/10,hand:1,open:3}};
function ckStart(L){const B=Array(64).fill(null);for(let i=0;i<64;i++){const r=i>>3,c=i&7;if((r+c)%2==1){if(r<3)B[i]='b';else if(r>4)B[i]='r'}}
 const h=L?ckLevel(L).hand:0;for(const i of[56,58,60,62].slice(0,h))B[i]=null;return B}
// opening = no captures yet and fewer than `open` computer pieces have left their starting squares
function ckOpening(B,lv){if(!lv.open)return false;let b=0,r=0,moved=0;for(let i=0;i<64;i++){const c=B[i];if(!c)continue;if(c.toLowerCase()=='b'){b++;if((i>>3)>2||c=='B')moved++}else r++}
 return b==12&&r==12-lv.hand&&moved<lv.open}
function ckAI(B,rng,L){const lv=ckLevel(L),ms=ckMoves(B,'b');let best=-1e9,pick=null;const nz=ckOpening(B,lv)?Math.max(lv.noise,.6):lv.noise;
 const dep=lv.depth>4&&ms.length>7?4:lv.depth; // bounded: busy positions search 4 ahead (keeps the server replay fast)
 for(const m of ms){const v=ckSearch(ckApply(B,m),dep-1,-1e9,1e9,'r')+rng()*nz;if(v>best){best=v;pick=m}}return pick}
const ckSame=(a,b)=>a.path.length==b.length&&a.path.every((x,k)=>x===b[k]);
// log: player move paths [[from,..,to],...] (or 'resign'). The computer's replies are recomputed here.
function ckReplay(rng,L,log){let B=ckStart(L),quiet=0;
 for(let k=0;k<log.length;k++){const p=log[k];if(p==='resign')return k==log.length-1?{ok:true,score:0,why:'resigned'}:{ok:false,why:'moves after resign'};
  if(!Array.isArray(p))return{ok:false,why:'bad log entry'};const m=ckMoves(B,'r').find(m=>ckSame(m,p));if(!m)return{ok:false,why:'illegal move'};
  B=ckApply(B,m);quiet=m.taken.length?0:quiet+1;const last=k==log.length-1;
  if(quiet>=80)return last?{ok:true,score:1,why:'draw'}:{ok:false,why:'moves after the end'};
  if(!ckMoves(B,'b').length)return last?{ok:true,score:2,why:'won'}:{ok:false,why:'moves after the end'};
  const a=ckAI(B,rng,L);B=ckApply(B,a);quiet=a.taken.length?0:quiet+1;
  if(quiet>=80)return last?{ok:true,score:1,why:'draw'}:{ok:false,why:'moves after the end'};
  if(!ckMoves(B,'r').length)return last?{ok:true,score:0,why:'lost'}:{ok:false,why:'moves after the end'}}
 return{ok:false,why:'game not finished'}}

// ---------- Ludo vs computer (r57) ----------
// 2 players (you = red, computer = yellow, opposite corners). Progress per token: -1 yard, 0..50 track, 51..55 home column, 56 home.
// Dice come from the server seed; the computer's choices are recomputed in the replay. A 6 or a capture gives another roll.
// Gentle early levels (like r49): L1-3 two tokens each, L4-7 three, L8+ four; you leave the yard on a 5 or 6 up to L9 (6 only from L10);
// the computer plays loose (random) at L1-2 and sharpens slowly; from L40 it also leaves the yard on a 5.
const LU_SAFE=[0,8,13,21,26,34,39,47];
const luLevel=L=>{L=lvl(L);return{tok:L<=3?2:L<=7?3:4,outP:L<=9?[5,6]:[6],outC:L<=5?[6]:L<40?[6]:[5,6],skill:L<=2?0:L<=5?.35:L<=10?.55:Math.min(.97,.6+L*.0045)}};
const luAbs=(side,p)=>p<0||p>50?-1:(p+side*26)%52;
function luNew(rng,L){const lv=luLevel(L);const s={L:lvl(L),lv,P:[Array(lv.tok).fill(-1),Array(lv.tok).fill(-1)],turn:0,roll:0,over:false,win:-1,n:0,ev:[]};luAdvance(s,rng);return s}
function luLegal(s,side,d){const out=[],o=side?s.lv.outC:s.lv.outP;s.P[side].forEach((p,i)=>{if(p==-1){if(o.includes(d))out.push(i)}else if(p<56&&p+d<=56)out.push(i)});return out}
function luApply(s,side,i){const d=s.roll,from=s.P[side][i],p=from<0?0:from+d;s.P[side][i]=p;let cap=0;const a=luAbs(side,p);
 if(a>=0&&!LU_SAFE.includes(a))s.P[1-side].forEach((q,j)=>{if(luAbs(1-side,q)==a){s.P[1-side][j]=-1;cap++}});
 s.ev.push(['m',side,i,from,p,cap,d]);if(s.P[side].every(x=>x==56)){s.over=true;s.win=side;s.ev.push(['w',side]);return}
 const again=d==6||cap>0;s.roll=0;if(!again)s.turn=1-side}
function luAI(s,ms,rng){const P=s.P[1],O=s.P[0],d=s.roll;const val=i=>{const f=P[i],p=f<0?0:f+d,a=luAbs(1,p);let v=p/10;if(p==56)v+=100;if(f<0)v+=40;
  if(a>=0&&!LU_SAFE.includes(a)&&O.some(q=>luAbs(0,q)==a))v+=60;if(a>=0&&LU_SAFE.includes(a))v+=15;
  if(a>=0&&!LU_SAFE.includes(a)&&O.some(q=>{const qa=luAbs(0,q);return qa>=0&&((a-qa+52)%52)>=1&&((a-qa+52)%52)<=6}))v-=25;return v};
 const r=rng();if(r>=s.lv.skill)return ms[Math.floor(rng()*ms.length)];let best=ms[0],bv=-1e9;for(const i of ms){const v=val(i);if(v>bv){bv=v;best=i}}return best}
// runs dice and computer moves until the player must choose (s.turn==0 && s.roll>0) or the game ends
function luAdvance(s,rng){while(!s.over){if(++s.n>3000){s.over=true;s.win=-1;s.ev.push(['t']);return}
  if(!s.roll){s.roll=1+Math.floor(rng()*6);s.ev.push(['r',s.turn,s.roll])}
  const ms=luLegal(s,s.turn,s.roll);if(!ms.length){s.ev.push(['p',s.turn,s.roll]);const six=s.roll==6;s.roll=0;if(!six)s.turn=1-s.turn;continue}
  if(s.turn==0)return;luApply(s,1,luAI(s,ms,rng))}}
function luPlay(s,rng,i){if(s.over||s.turn!=0||!s.roll)return false;if(!luLegal(s,0,s.roll).includes(i))return false;luApply(s,0,i);luAdvance(s,rng);return true}

// ---------- Ayo / Oware (r58) ----------
// pits 0-5 = player (left→right on the bottom row), 6-11 = computer; sow counter-clockwise (index+1), skip the origin pit on 12+ seeds.
// last seed lands on the opponent's side making 2 or 3 → capture, and keep capturing backwards while 2/3 on their side.
// grand slam (would take every opponent seed) captures nothing. If the opponent is empty you must feed them; if you can't, you take what's left.
// Over 24 seeds wins; 200 moves cap → each side keeps its own seeds. Player moves first.
function ayLevel(L){return{depth:L<=2?0:L<=5?1:L<=12?2:3,noise:L<=2?1:L<=5?.45:L<=12?.25:L<=30?.12:L<=60?.06:.02}}
function ayNew(L){return{b:Array(12).fill(4),st:[0,0],turn:0,n:0,over:false,win:-1}}
function aySow(b,p){const n=b[p];b[p]=0;let i=p;for(let k=0;k<n;k++){i=(i+1)%12;if(i==p)i=(i+1)%12;b[i]++}return i}
function aySim(s,side,p){const b=s.b.slice(),last=aySow(b,p),lo=side?0:6;let cap=0;
 if(last>=lo&&last<lo+6){const c=b.slice();let i=last,g=0;while(i>=lo&&(c[i]==2||c[i]==3)){g+=c[i];c[i]=0;i--}
  if(g&&c.slice(lo,lo+6).some(x=>x>0)){cap=g;for(let j=0;j<12;j++)b[j]=c[j]}}return{b,cap}}
function ayLegal(s,side){const lo=side*6,ms=[];for(let p=lo;p<lo+6;p++)if(s.b[p])ms.push(p);
 const olo=6-lo,oppEmpty=s.b.slice(olo,olo+6).every(x=>!x);if(!oppEmpty)return ms;
 return ms.filter(p=>aySim(s,side,p).b.slice(olo,olo+6).some(x=>x>0))}
function ayEnd(s){const t=s.st;if(t[0]>24||t[1]>24||(t[0]==24&&t[1]==24)){s.over=true;s.win=t[0]>t[1]?0:t[1]>t[0]?1:2;return true}
 if(!ayLegal(s,s.turn).length||s.n>=200){for(let p=0;p<12;p++){s.st[p<6?0:1]+=s.b[p];s.b[p]=0}s.over=true;s.win=t[0]>t[1]?0:t[1]>t[0]?1:2;return true}return false}
function ayApply(s,p){const side=s.turn,r=aySim(s,side,p);s.b=r.b;s.st[side]+=r.cap;s.n++;s.turn=1-side;ayEnd(s);return r.cap}
function ayClone(s){return{b:s.b.slice(),st:s.st.slice(),turn:s.turn,n:s.n,over:s.over,win:s.win}}
function aySearch(s,d,me){if(s.over||!d)return (s.st[me]-s.st[1-me])*10+(s.over?(s.win==me?1000:s.win==2?0:-1000):0);
 const ms=ayLegal(s,s.turn);let best=s.turn==me?-1e9:1e9;for(const p of ms){const c=ayClone(s);ayApply(c,p);const v=aySearch(c,d-1,me);best=s.turn==me?Math.max(best,v):Math.min(best,v)}return best}
function ayAI(s,rng,L){const lv=ayLevel(L),ms=ayLegal(s,1);if(ms.length==1)return ms[0];const r=rng();if(r<lv.noise||!lv.depth)return ms[Math.floor(rng()*ms.length)];
 let best=-1e9,bp=[];for(const p of ms){const c=ayClone(s);ayApply(c,p);const v=aySearch(c,lv.depth*2-1,1);if(v>best){best=v;bp=[p]}else if(v==best)bp.push(p)}return bp[Math.floor(rng()*bp.length)]}
// player move p (0-5) then computer replies until it's the player's turn again; returns list of [side,pit,cap] or false
function ayPlay(s,rng,L,p){if(s.over||s.turn!=0||!ayLegal(s,0).includes(p))return false;const ev=[[0,p,ayApply(s,p)]];
 while(!s.over&&s.turn==1){const q=ayAI(s,rng,L);ev.push([1,q,ayApply(s,q)])}return ev}
function ayScore(s){return s.win==0?2:s.win==2?1:0}

// ---------- Word search (r59) ----------
// grid of letters with hidden words; find each by marking its first and last letter. Directions open up with level.
const WP_WORDS=('JOLLOF EGUSI SUYA AGEGE AKURE ABUJA KANO NAIRA OKADA DANFO ADIRE GELE AGBADA FUFU AMALA ZOBO PUFF MOIMOI ' +
 'IBADAN ENUGU BENIN KADUNA JOS OYO DELTA NIGER OGUN EKO AYO OGBONO EFO BOLE KILISHI GARRI EBA AKARA DODO CHAPMAN ' +
 'MARKET FARM PLOT LAND TRADE BANK CASH GOLD COIN SEED RAIN SUN RIVER TOWN CITY ROAD SHOP BREAD FISH PHONE TAXI BUS ' +
 'HOUSE WATER TREE PALM YAM RICE BEANS CORN MANGO ORANGE LEMON SUGAR SALT HONEY MILK TEA GOAT COW CHICKEN EGG ' +
 'DRUM DANCE MUSIC FRIEND FAMILY SCHOOL BOOK PEN MAP STAR MOON CLOUD STORM WIND FIRE STONE IRON SILVER PROFIT WEALTH').split(' ');
const WP_D=[[0,1],[1,0],[1,1],[0,-1],[-1,0],[-1,1],[1,-1],[-1,-1]];
function wpLevel(L){return{n:L<=1?6:L<=4?7:L<=10?8:L<=30?9:10,k:L<=1?4:L<=4?5:L<=10?6:L<=30?7:8,dirs:L<=3?2:L<=9?3:L<=19?5:8}}
// r75: every word appears exactly once. Words that sit inside another chosen word (either way round) are skipped, and filler
// letters that happen to spell a word again (any of the 8 directions) are re-rolled; a grid that still can't be made clean is rebuilt.
const wpRev=w=>w.split('').reverse().join('');
function wpFind(g,n,w){const out=new Set();for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(g[r][c]==w[0])for(const [dr,dc] of WP_D){const r1=r+dr*(w.length-1),c1=c+dc*(w.length-1);if(r1<0||r1>=n||c1<0||c1>=n)continue;
  let ok=true;for(let i=1;i<w.length;i++)if(g[r+dr*i][c+dc*i]!=w[i]){ok=false;break}if(ok){const a=r*n+c,b=r1*n+c1;out.add(Math.min(a,b)+':'+Math.max(a,b))}}return out}
function wpGen(rng,L){const lv=wpLevel(L),n=lv.n,pool=WP_WORDS.filter(w=>w.length>=3&&w.length<=n),AB='AAABDEEEEFGHIIIJKLMNNOOOPRRSSTTUUWYZ';let P=null;
 for(let att=0;att<20;att++){const g=Array.from({length:n},()=>Array(n).fill('')),words=[],used=new Set();
  for(let t=0;t<400&&words.length<lv.k;t++){const w=pool[Math.floor(rng()*pool.length)];if(used.has(w))continue;
   if([...used].some(u=>u.includes(w)||u.includes(wpRev(w))||w.includes(u)||w.includes(wpRev(u))))continue;
   const [dr,dc]=WP_D[Math.floor(rng()*lv.dirs)];
   const r0=Math.floor(rng()*n),c0=Math.floor(rng()*n),r1=r0+dr*(w.length-1),c1=c0+dc*(w.length-1);if(r1<0||r1>=n||c1<0||c1>=n)continue;
   let ok=true;for(let i=0;i<w.length;i++){const x=g[r0+dr*i][c0+dc*i];if(x&&x!=w[i]){ok=false;break}}if(!ok)continue;
   for(let i=0;i<w.length;i++)g[r0+dr*i][c0+dc*i]=w[i];used.add(w);words.push({w,r0,c0,r1,c1})}
  const fixed=g.map(row=>row.map(x=>!!x));
  for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(!g[r][c])g[r][c]=AB[Math.floor(rng()*AB.length)];
  let clean=false;
  for(let pass=0;pass<60&&!clean;pass++){clean=true;
   for(const W of words){const own=Math.min(W.r0*n+W.c0,W.r1*n+W.c1)+':'+Math.max(W.r0*n+W.c0,W.r1*n+W.c1);
    for(const k of wpFind(g,n,W.w)){if(k==own)continue;clean=false;const [a,b]=k.split(':').map(Number),ar=Math.floor(a/n),ac=a%n,br=Math.floor(b/n),bc=b%n;
     const len=Math.max(Math.abs(br-ar),Math.abs(bc-ac)),dr=Math.sign(br-ar),dc=Math.sign(bc-ac),free=[];
     for(let i=0;i<=len;i++){const r=ar+dr*i,c=ac+dc*i;if(!fixed[r][c])free.push([r,c])}
     if(!free.length){pass=99;break}const [fr,fc]=free[Math.floor(rng()*free.length)];g[fr][fc]=AB[Math.floor(rng()*AB.length)]}
    if(pass>=99)break}}
  words.sort((a,b)=>a.w<b.w?-1:1);P={n,g,words};if(clean)break}
 return P}
// which word (index) does the line r0,c0 → r1,c1 mark? -1 if none
function wpMatch(P,r0,c0,r1,c1){for(let i=0;i<P.words.length;i++){const w=P.words[i];if((w.r0==r0&&w.c0==c0&&w.r1==r1&&w.c1==c1)||(w.r0==r1&&w.c0==c1&&w.r1==r0&&w.c1==c0))return i}return -1}

// ---------- verifier entry ----------
// returns {ok, score, result} — the server pays on this score, never on the client's.
function verify(game,level,seed,log,secs){const L=lvl(level),rng=rngOf(seed);log=log||{};
 try{switch(game){
  case 'number_match':{const s=nmInit(rng,L),a=log.a||[];for(const x of a){if(s.over)return{ok:false,why:'moves after the round ended'};
    if(x==='a'){if(!nmAdd(s))return{ok:false,why:'no adds left'}}else if(x==='h'){nmHint(s)}else if(x==='f'){s.over=true;s.end='finished'}
    else if(Array.isArray(x)){if(nmPair(s,x[0]|0,x[1]|0)<0)return{ok:false,why:'illegal pair'}}else return{ok:false,why:'bad log entry'}}
   if(!s.over)return{ok:false,why:'round not finished'};return{ok:true,score:s.score,result:{pairs:s.pairs,end:s.end}}}
  case 'water_sort':{const g=wsInit(rng,L),cap=g.cap,start=g.tubes.map(x=>x.slice());let t=g.tubes,hist=[],moves=0;const a=log.a||[];
   for(const x of a){if(x==='g')return{ok:true,score:0,result:{moves,gave_up:true}};if(x==='u'){if(hist.length){t=hist.pop();moves++}continue}if(x==='r'){t=start.map(y=>y.slice());hist=[];moves++;continue}
    if(!Array.isArray(x)||!wsLegal(t,cap,x[0]|0,x[1]|0))return{ok:false,why:'illegal pour'};hist.push(t.map(y=>y.slice()));wsPour(t,cap,x[0]|0,x[1]|0);moves++;
    if(wsWon(t,cap))return{ok:true,score:1,result:{moves}}}
   return{ok:false,why:'puzzle not solved'}}
  case 'traffic_jam':{const r=bjReplay(bjGen(rng,L),log.a||[]);if(!r.ok)return r;if(log.gave_up)return{ok:true,score:0,result:{gave_up:true,hints:r.hints}};
   if(r.end==='gridlock')return{ok:true,score:0,result:{gridlock:true}};if(!r.won)return{ok:false,why:'jam not cleared'};return{ok:true,score:r.hints>2?0:1,result:{hints:r.hints,taps:(log.a||[]).length}}}
  case 'snake':{const r=snReplay(rng,L,log.t||[],log.n|0);if(!r.ok)return r;if(secs!=null&&r.ticks*snStep(L)/1000>secs+3)return{ok:false,why:'game ran faster than real time'};return{ok:true,score:r.score,result:{ticks:r.ticks}}}
  case 'checkers':{const r=ckReplay(rng,L,log.m||[]);if(!r.ok)return r;return{ok:true,score:r.score,result:{why:r.why,moves:(log.m||[]).length}}}
  case 'ludo':{const s=luNew(rng,L),a=log.a||[];for(let k=0;k<a.length;k++){const x=a[k];if(x==='r')return k==a.length-1?{ok:true,score:0,result:{why:'resigned'}}:{ok:false,why:'moves after resign'};
    if(s.over)return{ok:false,why:'moves after the end'};if(!luPlay(s,rng,x|0))return{ok:false,why:'illegal move'}}
   if(!s.over)return{ok:false,why:'game not finished'};return{ok:true,score:s.win==0?1:0,result:{why:s.win==0?'won':s.win==1?'lost':'too long',moves:a.length}}}
  case 'ayo':{const s=ayNew(L),m=log.m||[];if(ayEnd(s))return{ok:false,why:'bad start'};for(let k=0;k<m.length;k++){const x=m[k];if(x==='r')return k==m.length-1?{ok:true,score:0,result:{why:'resigned'}}:{ok:false,why:'moves after resign'};
    if(s.over)return{ok:false,why:'moves after the end'};if(!ayPlay(s,rng,L,x|0))return{ok:false,why:'illegal move'}}
   if(!s.over)return{ok:false,why:'game not finished'};return{ok:true,score:ayScore(s),result:{why:['won','lost','draw'][s.win],seeds:s.st,moves:m.length}}}
  case 'word_search':{const P=wpGen(rng,L),f=log.f||[],got=new Set();if(log.gave_up)return{ok:true,score:0,result:{gave_up:true,found:0}};
    for(const x of f){if(!Array.isArray(x)||x.length!=4)return{ok:false,why:'bad mark'};const i=wpMatch(P,...x.map(v=>v|0));if(i<0)return{ok:false,why:'marked a word that is not there'};got.add(i)}
   if(got.size<P.words.length)return{ok:false,why:'game not finished'};return{ok:true,score:1,result:{words:P.words.length,marks:f.length}}}
  default:return{ok:false,why:'not verifiable here'}}}catch(e){return{ok:false,why:'replay error'}}}
root.GameCore={rngOf,nmInit,nmFree,nmMatch,nmAny,nmHintPair,nmPair,nmAdd,nmHint,wsSolvable,wsInit,wsFull,wsWon,wsLegal,wsPour,
 BJD,bjCells,bjFront,bjPath,bjGen,bjReplay,LMAX,lvl,nmGreedy,wsColours,wsHidden,bjParams,SN_N,snStep,snRockN,snRocks,snReplay,ckMoves,ckApply,ckEval,ckSearch,ckLevel,ckStart,ckAI,ckReplay,LU_SAFE,luLevel,luAbs,luNew,luLegal,luAI,luAdvance,luPlay,ayLevel,ayNew,aySow,aySim,ayLegal,ayEnd,ayApply,ayAI,ayPlay,ayScore,WP_WORDS,wpLevel,wpGen,wpMatch,wpFind,verify};
})(typeof window!=='undefined'?window:globalThis);
