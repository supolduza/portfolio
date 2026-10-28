/* © 2026 Plot. All rights reserved. Proprietary — copying, redistribution or reuse of this code is prohibited. */
// Plot — shared game juice (polish r1): synthesized WebAudio SFX, haptics, settings, how-to cards, hints,
// end-of-round popup with count-up + confetti, floating text. Lazy-loaded with games/farmplay. No assets.
(function(){if(window.FX)return;
// CSS for games + fx lives here so it loads lazily with the games (not on the map's critical path). Source: polish/gamefx.css
{const st=document.createElement('style');st.id='fxcss';st.textContent=`html.gplaying,html.gplaying body{overscroll-behavior:none}
html.gplaying #gRing,html.gplaying #gHint,html.gplaying #gChip,html.gplaying #gTip,html.gplaying #gModal{display:none!important}
.ckico{display:inline-block;width:.9em;height:.9em;border-radius:50%;background:radial-gradient(circle at 35% 30%,#ff8a80,#e53935 45%,#9c1c1c);box-shadow:0 .08em 0 #0007,inset 0 0 0 .12em #ffffff30;vertical-align:-.1em}
#games{position:fixed;inset:0;z-index:1800;background:radial-gradient(120% 80% at 50% 0%,#24345e 0%,#121a33 55%,#0b1020 100%);color:#eef2ff;overflow:auto;font-size:15px;overscroll-behavior:contain;-webkit-tap-highlight-color:transparent;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
#games button{font-family:inherit;-webkit-user-select:none;user-select:none;touch-action:manipulation}
.gwrap{max-width:560px;margin:0 auto;padding:calc(10px + env(safe-area-inset-top)) max(12px,env(safe-area-inset-right)) calc(40px + env(safe-area-inset-bottom)) max(12px,env(safe-area-inset-left))}
.gplay{user-select:none;-webkit-user-select:none}
#games .ghead{display:flex;align-items:center;gap:8px;position:sticky;top:0;z-index:3;padding:4px 0;background:linear-gradient(#121a33,#121a33e0 70%,transparent)}
#games .ghead h2{margin:6px 0;flex:1;font-size:20px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#games .gx{background:#ffffff1a;color:#fff;border:0;border-radius:50%;width:38px;height:38px;flex:0 0 38px;font-size:18px;cursor:pointer;box-shadow:inset 0 -2px 0 #0004;transition:transform .12s}
#games .gx:active{transform:scale(.9)}#games .gi2{font-size:16px}
#games .gsc{font-weight:800;color:#1b1300;background:linear-gradient(#ffe27a,#ffc23a);padding:5px 10px;border-radius:20px;font-size:13px;white-space:nowrap;box-shadow:0 2px 0 #b3800a}
#games .gsc:empty{display:none}#games .gsc.bump{animation:gbump .3s}
@keyframes gbump{40%{transform:scale(1.18)}}
#games .gsub,.gpop .gsub{color:#a9b6d6;font-size:13px;line-height:1.4}
.gskel{height:300px;border-radius:18px;background:linear-gradient(90deg,#ffffff0d,#ffffff1a,#ffffff0d);background-size:200% 100%;animation:gsk 1.2s infinite}
@keyframes gsk{to{background-position:-200% 0}}
.ghero{background:linear-gradient(135deg,#ffd54a22,#7c4dff22);border:1px solid #ffffff1f;border-radius:18px;padding:12px 14px;margin:6px 0 12px}
.ghero small{display:block;color:#a9b6d6;font-size:12px}.ghero b{font-size:26px;color:#ffd54a}.ghero span{color:#a9b6d6}.ghero p{margin:8px 0 0;color:#c9d3ee;font-size:12.5px}
.gprog{height:8px;background:#0006;border-radius:6px;overflow:hidden;margin-top:6px}.gprog i{display:block;height:100%;background:linear-gradient(90deg,#8bc34a,#ffd54a);border-radius:6px}
.glist{display:grid;grid-template-columns:1fr 1fr;gap:10px}
#games .gcard{position:relative;display:flex;flex-direction:column;align-items:flex-start;gap:3px;text-align:left;background:#1a2547;color:#fff;border:0;border-radius:18px;padding:12px;cursor:pointer;overflow:hidden;
 box-shadow:0 6px 18px #0006,inset 0 1px 0 #ffffff22;animation:gin .35s backwards;transition:transform .15s}
#games .gcard::before{content:"";position:absolute;inset:0 0 auto 0;height:70px;background:var(--gc);opacity:.9;border-radius:18px 18px 40% 40%/18px 18px 26px 26px}
#games .gcard>*{position:relative}#games .gcard:hover{transform:translateY(-2px)}#games .gcard:active{transform:scale(.97)}
#games .gcard .gi{font-size:34px;width:56px;height:56px;display:grid;place-items:center;background:#fff;border-radius:16px;box-shadow:0 4px 10px #0004;margin:6px 0 8px}
#games .gcard b{font-size:15px}#games .gcard small{color:#b8c3e3;font-size:12px}#games .gcard em{color:#9be15d;font-style:normal;font-size:12px;font-weight:700;margin-top:2px}
.gbest{font-style:normal;font-size:11px;color:#ffd54a}
@keyframes gin{from{opacity:0;transform:translateY(12px)}}
.gpre{background:#1a2547;border-radius:22px;padding:18px;text-align:center;box-shadow:0 10px 30px #0007;position:relative;overflow:hidden;margin-top:6px}
.gpre::before{content:"";position:absolute;inset:0 0 auto;height:110px;background:var(--gc)}.gpre>*{position:relative}
.gpi{font-size:52px;width:92px;height:92px;margin:4px auto 8px;display:grid;place-items:center;background:#fff;border-radius:26px;box-shadow:0 8px 20px #0005;animation:gfloat 2.4s ease-in-out infinite}
@keyframes gfloat{50%{transform:translateY(-5px) rotate(-3deg)}}
.gladder{display:flex;align-items:center;justify-content:center;gap:4px;margin:12px 0 4px;flex-wrap:wrap}.gladder span{color:#56658f}
.gladder div{background:#0004;border-radius:12px;padding:6px 8px;min-width:56px}.gladder small{display:block;font-size:10px;color:#a9b6d6}.gladder b{font-size:14px;color:#c9d3ee}
.gladder .now{background:linear-gradient(#ffe27a,#ffc23a);color:#1b1300;transform:scale(1.08)}.gladder .now small,.gladder .now b{color:#1b1300}.gladder .now b{font-size:17px}
.gstart{display:block;width:100%;margin:12px 0 6px;padding:15px;border:0;border-radius:16px;font-size:19px;font-weight:900;color:#fff;background:linear-gradient(#5ee07a,#22a447);box-shadow:0 5px 0 #157a31;cursor:pointer;transition:transform .1s}
.gstart:active{transform:translateY(3px);box-shadow:0 2px 0 #157a31}
.gx2{background:none;border:0;color:#a9c4ff;font-size:14px;cursor:pointer;padding:8px}
.gbar{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}
.gbar button{flex:1;padding:11px 8px;border:0;border-radius:14px;background:linear-gradient(#4fa3ff,#1e6fe0);color:#fff;font-size:14.5px;font-weight:700;cursor:pointer;box-shadow:0 4px 0 #154ea3;transition:transform .08s}
.gbar button:active{transform:translateY(3px);box-shadow:0 1px 0 #154ea3}
.gbar button.sec{background:linear-gradient(#5d6d93,#46557a);box-shadow:0 4px 0 #2f3a57}.gbar button:disabled{opacity:.45}
.gbar.big button{font-size:18px;padding:15px}.gbar .sell{background:linear-gradient(#ff6b6b,#e03131);box-shadow:0 4px 0 #a51e1e}
.gshake{animation:gsh .3s}@keyframes gsh{25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}
/* end popup */
.gpop{position:fixed;inset:0;z-index:2900;display:flex;align-items:center;justify-content:center;padding:16px;background:#0000;transition:background .25s;font-family:system-ui,sans-serif}
.gpop.on{background:#050a18b0}
.gpopc{width:100%;max-width:360px;background:linear-gradient(#24345e,#17213f);color:#fff;border-radius:26px;padding:22px 18px 10px;text-align:center;box-shadow:0 20px 60px #000a,inset 0 1px 0 #fff3;transform:scale(.6);opacity:0;transition:transform .35s cubic-bezier(.2,1.6,.4,1),opacity .2s}
.gpop.on .gpopc{transform:none;opacity:1}
.gpopc.win{border:3px solid #ffd54a}.gpopc.bad{border:3px solid #ef5350}.gpopc.meh{border:3px solid #5d6d93}
.gpopi{font-size:56px;margin-top:-56px;filter:drop-shadow(0 6px 10px #0008);animation:gfloat 2s infinite}
.gpopc h3{margin:4px 0 10px;font-size:26px;font-weight:900}
.gpops{display:flex;gap:10px}.gpops div{flex:1;background:#0004;border-radius:16px;padding:10px}.gpops small{display:block;color:#a9b6d6;font-size:12px}.gpops b{font-size:24px}
.grw{color:#9be15d}.gnew{color:#ffd54a;font-weight:800;animation:gbump .6s 2}
/* number match */
.nm{display:grid;gap:5px;margin-top:6px}.nm.grow{animation:gin .3s}
.nm button{aspect-ratio:1;border:0;border-radius:10px;background:linear-gradient(#33457a,#26365f);color:#fff;font-size:min(5.4vw,22px);font-weight:800;cursor:pointer;box-shadow:0 3px 0 #18223f;transition:transform .1s,background .1s;padding:0}
.nm button.n1,.nm button.n9{color:#ff9eb0}.nm button.n2,.nm button.n8{color:#8fd3ff}.nm button.n3,.nm button.n7{color:#b8f28a}.nm button.n4,.nm button.n6{color:#ffd27a}.nm button.n5{color:#d7b4ff}
.nm button.x{background:#ffffff08;box-shadow:none;color:transparent}.nm button.s{background:linear-gradient(#ffe27a,#ffc23a);color:#1b1300;transform:translateY(-2px) scale(1.06);box-shadow:0 5px 0 #b3800a}
.nm button.h{outline:3px solid #9be15d;animation:gbump .6s 2}.nm button.pop{animation:gpopout .17s forwards}
@keyframes gpopout{to{transform:scale(1.35);opacity:0}}
/* water sort */
.ws{display:flex;flex-wrap:wrap;gap:22px 12px;justify-content:center;margin:30px 0 8px;touch-action:none}.ws.many{gap:20px 8px}.ws.many .tube{width:min(11.5vw,48px);height:calc(min(11.5vw,48px)*3.4)}
.wstream{position:fixed;z-index:30;width:6px;border-radius:3px;transform-origin:50% 0;pointer-events:none;box-shadow:0 0 6px #fff6}
.tube{position:relative;width:min(13vw,52px);height:calc(min(13vw,52px)*3.4);padding:0 4px 5px;background:linear-gradient(90deg,#ffffff26,#ffffff0a 40%,#ffffff1f);border:2px solid #cfe0ffaa;border-top:0;border-radius:6px 6px 30px 30px;cursor:pointer;
 transition:transform .18s cubic-bezier(.3,1.5,.5,1),box-shadow .2s;display:flex;align-items:flex-end;will-change:transform}
.tube::before{content:"";position:absolute;top:-2px;left:-6px;right:-6px;height:7px;border-radius:4px;background:#cfe0ffcc}
.tube::after{content:"";position:absolute;left:18%;top:10%;width:14%;height:70%;border-radius:8px;background:#ffffff40;pointer-events:none}
.tube .liq{display:flex;flex-direction:column-reverse;width:100%;height:94%;border-radius:0 0 24px 24px;overflow:hidden}
.tube i{display:block;background:linear-gradient(90deg,color-mix(in srgb,var(--c) 80%,#000),var(--c) 45%,color-mix(in srgb,var(--c) 75%,#fff));flex:0 0 25%}
.tube i.top{box-shadow:inset 0 3px 0 #ffffff55}
.tube.s{transform:translateY(-18px);box-shadow:0 10px 20px #0006;border-color:#ffd54a}.tube.drag{transition:none;z-index:9;border-color:#ffd54a}
.tube.done{border-color:#9be15d;box-shadow:0 0 16px #9be15d88}.tube.pop{animation:gbump .45s}.tube.fill{border-color:#8fd3ff}
/* traffic jam — car out / bus jam */
.gplay[data-game=traffic_jam] .garea{background:linear-gradient(#eef0fb,#d9dcf5)}
.bj{margin:0 -6px;user-select:none;-webkit-user-select:none}
.bjq{position:relative;height:40px;margin:2px 0 4px;background:linear-gradient(#fff,#e7e9f8);border-radius:20px;box-shadow:inset 0 -3px 0 #c6cae6,0 3px 8px #0002;overflow:hidden;display:flex;align-items:center;padding:0 8px}
.bjqt{display:flex;gap:5px;flex:1;align-items:flex-end;height:30px}.bjn{font-weight:800;color:#3b4166;font-size:13px;padding-left:6px}
.bp{position:relative;flex:0 0 12px;width:12px;height:24px;display:block}
.bp::before{content:"";position:absolute;left:1px;top:0;width:10px;height:10px;border-radius:50%;background:var(--c);box-shadow:inset -2px -2px 0 #0002}
.bp::after{content:"";position:absolute;left:0;top:11px;width:12px;height:13px;border-radius:6px 6px 3px 3px;background:var(--c);box-shadow:inset -2px -3px 0 #0002}
.bjq .bp:first-child{animation:bjhop .5s infinite alternate}@keyframes bjhop{to{transform:translateY(-3px)}}
.bp.fly{position:fixed;z-index:3000;pointer-events:none}
.bjs{display:flex;gap:6px;justify-content:center;background:#5c6377;padding:8px 6px;border-radius:14px;box-shadow:inset 0 3px 0 #0003;margin-bottom:8px}
.bjsl{flex:1;max-width:64px;height:66px;border:2px dashed #ffffffaa;border-radius:10px;display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;color:#fff;font-weight:800}
.bjsl em{font-style:normal;opacity:.6;font-size:18px}.bjsl.lock{background:#ffffff18;border-style:solid;border-color:#ffd54a;font-size:18px;cursor:pointer}.bjsl.lock small{font-size:9px;color:#ffd54a}
.bjsl.pulse{animation:gbump .6s infinite}
.bjsl .seat{position:absolute;bottom:-6px;right:-6px;min-width:20px;height:20px;border-radius:10px;background:#fff;color:#222;font-size:12px;display:grid;place-items:center;box-shadow:0 2px 0 #0003;padding:0 3px}
.bjl{position:relative;width:100%;max-width:460px;margin:0 auto;background:#c9cdea;border-radius:18px;box-shadow:inset 0 0 0 3px #b4b9df,0 6px 14px #0002;touch-action:manipulation}
.bjl.won{animation:gbump .5s}
.bv{position:absolute;display:grid;place-items:center;cursor:pointer;will-change:transform}
.vb{position:relative;width:calc(var(--cs) * .84);height:calc(var(--cs) * (var(--len) - .14));transform:rotate(var(--r,0deg));border-radius:calc(var(--cs) * .3) calc(var(--cs) * .3) calc(var(--cs) * .18) calc(var(--cs) * .18);
 background:linear-gradient(90deg,color-mix(in srgb,var(--c) 75%,#000) 0 9%,var(--c) 9% 82%,color-mix(in srgb,var(--c) 60%,#fff) 82% 91%,color-mix(in srgb,var(--c) 75%,#000) 91%);box-shadow:0 3px 0 #0004;flex:0 0 auto}
.bv .vb{position:absolute;left:50%;top:50%;margin-left:calc(var(--cs) * -.42);margin-top:calc(var(--cs) * (var(--len) - .14) / -2)}
.vb>i{position:absolute;left:14%;right:14%;top:9%;height:calc(var(--cs) * .26);border-radius:40% 40% 15% 15%;background:linear-gradient(#cfefff,#7cc8ff);box-shadow:inset 0 -2px 0 #0002}
.vb.bus>i{height:calc(var(--cs) * .2)}.vb.bus::before{content:"";position:absolute;left:16%;right:16%;top:28%;bottom:10%;background:repeating-linear-gradient(#ffffff55 0 4px,transparent 4px 9px);border-radius:4px}
.vb.van::before{content:"";position:absolute;left:14%;right:14%;top:38%;bottom:8%;border-radius:4px;background:#ffffff33}
.vb>b{position:absolute;left:50%;top:58%;width:calc(var(--cs) * .34);height:calc(var(--cs) * .34);transform:translate(-50%,-50%);background:no-repeat center/contain url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 10'%3E%3Cpath d='M5 1 L9 6 H6.4 V9 H3.6 V6 H1 Z' fill='white'/%3E%3C/svg%3E");filter:drop-shadow(0 1px 0 #0005)}
.vb.bus>b{top:55%}
.bv:active .vb{filter:brightness(1.1)}
.bv.hint .vb{animation:gbump .7s infinite;box-shadow:0 0 0 3px #fff,0 0 16px 4px #ffd54a}
.vb.mini{--cs:30px;transform:none;height:calc(var(--cs) * (var(--len) - .2))}
.bjl.d3{background:none;box-shadow:none}.bjl.d3 .bv{visibility:hidden;pointer-events:none}
.tj3d,.tj3dr{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:manipulation}
.bjq.d3{height:112px;background:none;box-shadow:none;padding:0;margin:-4px 0 0}.bjq.d3 .bjqt{position:absolute;visibility:hidden}.bjq.d3 .bjn{position:absolute;right:8px;top:6px;background:#fff;border-radius:10px;padding:2px 8px;z-index:2;box-shadow:0 2px 0 #0002}
.bp.fly.img{width:16px;height:24px;background:center/contain no-repeat}.bp.fly.img::before,.bp.fly.img::after{display:none}
.vbi{height:62px;width:auto;max-width:100%;object-fit:contain;filter:drop-shadow(0 2px 2px #0004)}
/* levels */
.glvl{background:#0003;border-radius:16px;padding:8px;margin:10px 0 4px}.glvl>small{display:block;color:#a9b6d6;font-size:11px;text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px}
.glvr{display:flex;gap:6px;overflow-x:auto;padding:2px 2px 6px;scroll-snap-type:x proximity;-webkit-overflow-scrolling:touch}
.glvr button{flex:0 0 auto;min-width:54px;padding:6px 8px;border:0;border-radius:12px;background:#ffffff1a;color:#fff;cursor:pointer;scroll-snap-align:center;transition:transform .15s,background .15s}
.glvr button b{display:block;font-size:17px}.glvr button small{font-size:11px;color:#9be15d;font-weight:700}
.glvr button.on{background:linear-gradient(#ffe27a,#ffc23a);color:#1b1300;transform:scale(1.06);box-shadow:0 3px 0 #b3800a}.glvr button.on small{color:#5a3d00}
.glvr button.lock{opacity:.5}.gwld{display:flex;gap:6px;overflow-x:auto;padding:2px 2px 8px;-webkit-overflow-scrolling:touch}.gwld button{flex:0 0 auto;padding:5px 9px;border:0;border-radius:10px;background:#ffffff14;color:#fff;cursor:pointer;font-size:12px}.gwld button b{display:block;font-size:12px}.gwld button small{font-size:10px;color:#ffd54a;letter-spacing:-1px}.gwld button.on{background:#ffffff40;outline:2px solid #ffd54a}.gwld button.lock{opacity:.45}.gpaid{display:block;font-style:normal;font-size:11px;opacity:.85;margin-top:2px}.gpaidp{margin-top:4px}.liq i.hid{display:flex;align-items:center;justify-content:center;color:#fffc;font-weight:900;font-size:13px;font-style:normal}.glv{position:absolute!important;right:10px;top:10px;font-style:normal;font-size:11px;font-weight:800;background:#000a;color:#ffd54a;border-radius:10px;padding:2px 7px}
.glvt{font-size:12px;color:#ffd54a;font-weight:700}
/* snake */
.snw{touch-action:none;padding:4px 0}.snc{display:block;margin:6px auto;border-radius:16px;box-shadow:0 8px 24px #0007,0 0 0 4px #1f5e2a;max-width:100%}
.pad{display:grid;grid-template-columns:repeat(3,min(26vw,92px));grid-template-rows:repeat(2,min(15vw,62px));gap:8px;justify-content:center;touch-action:none;margin-top:4px}
.pad button{border:0;border-radius:16px;background:linear-gradient(#5b70ad,#36467a);color:#fff;font-size:26px;box-shadow:0 5px 0 #1f2a4a,inset 0 1px 0 #ffffff33;touch-action:none}.pad button:active{transform:translateY(3px);box-shadow:0 1px 0 #1f2a4a}
.pad [data-d="0,-1"]{grid-column:2}.pad [data-d="-1,0"]{grid-column:1;grid-row:2}.pad [data-d="1,0"]{grid-column:3;grid-row:2}.pad [data-d="0,1"]{grid-column:2;grid-row:2}
.pad.hidden{display:none}.pad button.hit{animation:gbump .18s}
/* checkers */
.ckw{padding:6px;background:linear-gradient(#8a5a33,#5d3a1e);border-radius:14px;box-shadow:0 10px 26px #0008,inset 0 2px 0 #ffffff33;max-width:560px;margin:6px -6px}
.gplay[data-game=checkers] .gsub{text-align:center}
.ck{display:grid;grid-template-columns:repeat(8,1fr);border-radius:8px;overflow:hidden;touch-action:none}
.ck button{aspect-ratio:1;border:0;padding:0;display:flex;align-items:center;justify-content:center;cursor:pointer;position:relative}
.ck .l{background:#f3e0bf}.ck .d{background:#a8743f}.ck .lm{background:#c99b3c}.ck .s{background:#d9a514}.ck .t::after{content:"";width:34%;height:34%;border-radius:50%;background:#7CFC8Acc;box-shadow:0 0 10px #7CFC8A;animation:gpulse2 1s infinite}
@keyframes gpulse2{50%{transform:scale(1.25)}}
.ck .m i{box-shadow:0 0 0 3px #ffd54a,0 4px 0 #0007}.ck .mc i{box-shadow:0 0 0 3px #ff7043,0 0 14px #ff7043,0 4px 0 #0007}.ck .flash i{animation:gbump .35s 3}
.ck i{width:80%;height:80%;border-radius:50%;display:flex;align-items:center;justify-content:center;font-style:normal;color:#ffd54a;font-size:min(6vw,26px);box-shadow:0 4px 0 #0007;transition:transform .18s cubic-bezier(.3,1.4,.5,1);position:relative;text-shadow:0 1px 0 #0008}
.ck .pr{background:radial-gradient(circle at 35% 30%,#ff8a80,#e53935 45%,#9c1c1c);border:2px solid #7a1414}
.ck .pb{background:radial-gradient(circle at 35% 30%,#78839b,#2c3342 45%,#111520);border:2px solid #0a0d14}
.ck i::before{content:"";position:absolute;inset:16%;border-radius:50%;border:2px solid #ffffff2e}
.ck .s i{transform:scale(1.12) translateY(-2px)}.ck.think{opacity:.92}
.dotty::after{content:"…";animation:gdots 1s steps(3) infinite}@keyframes gdots{0%{content:"."}50%{content:".."}100%{content:"..."}}
/* market */
.mtw{position:relative;margin:8px 0}.mtc{display:block;width:100%;border-radius:16px;box-shadow:0 8px 22px #0007}
.mtclock{height:6px;background:#0006;border-radius:4px;margin-top:6px;overflow:hidden}.mtclock i{display:block;height:100%;background:linear-gradient(90deg,#ffd54a,#ff7043);transition:width .5s linear}
.mtinfo{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;font-size:14px}.mtinfo div{background:#ffffff10;border-radius:12px;padding:6px 8px}
.mtinfo small{display:block;color:#a9b6d6;font-size:11px}.mtinfo b{font-size:14px;white-space:nowrap}.mtinfo em{font-style:normal;font-size:11px;display:block}
.up{color:#4ade80}.dn{color:#f87171}
@media(max-width:420px){.glist{gap:8px}#games .gcard{padding:10px}#games .gcard small{display:none}.mtinfo{grid-template-columns:repeat(2,1fr)}}
/* fx shared */
.fxmodal{position:fixed;inset:0;z-index:3100;background:#050a18b8;display:flex;align-items:center;justify-content:center;padding:16px;animation:gfade .2s;font-family:system-ui,sans-serif}
.fxmodal.out{opacity:0;transition:opacity .2s}@keyframes gfade{from{opacity:0}}
.fxcard{width:100%;max-width:340px;background:linear-gradient(#24345e,#17213f);color:#fff;border-radius:24px;padding:18px;box-shadow:0 20px 60px #000a;text-align:center;animation:gin .3s}
.fxcard h3{margin:2px 0 10px;font-size:21px}.fxk{color:#a9b6d6;font-size:11px;text-transform:uppercase;letter-spacing:.08em}
.fxill{background:#0005;border-radius:18px;padding:10px;margin:6px 0 10px}.fxsvg{width:100%;max-height:120px;animation:gin .3s}
.fxst{display:block;font-size:17px;color:#ffd54a}.fxcard p{color:#c9d3ee;line-height:1.45;margin:6px 0}
.fxdots{display:flex;justify-content:center;gap:6px;margin:8px}.fxdots i{width:8px;height:8px;border-radius:50%;background:#ffffff33}.fxdots i.on{background:#ffd54a;width:20px;border-radius:4px}
.fxbar{display:flex;gap:8px}.fxbtn{flex:1;padding:12px;border:0;border-radius:14px;background:linear-gradient(#5ee07a,#22a447);color:#fff;font-weight:800;font-size:16px;box-shadow:0 4px 0 #157a31;cursor:pointer}
.fxbtn.sec{background:#ffffff1f;box-shadow:none}
.fxrow{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 4px;border-bottom:1px solid #ffffff14;text-align:left}.fxrow.off{opacity:.5}.fxrow small{color:#a9b6d6}
.fxrow input[type=checkbox]{width:22px;height:22px;accent-color:#22a447}.fxrow input[type=range]{flex:1;max-width:160px;accent-color:#ffd54a}
.fxset .fxbtn{margin-top:12px;width:100%}
.fxhint{position:fixed;left:50%;bottom:calc(18px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:3050;background:linear-gradient(#fff7d1,#ffe38a);color:#3a2a00;padding:10px 14px;border-radius:16px;max-width:min(92vw,420px);font-size:14px;font-weight:600;box-shadow:0 8px 24px #0007;animation:ghint .3s cubic-bezier(.2,1.5,.4,1);font-family:system-ui,sans-serif}
.fxhint.out{opacity:0;transform:translate(-50%,10px);transition:.3s}@keyframes ghint{from{transform:translate(-50%,30px);opacity:0}}
.fxtoast{position:fixed;left:50%;top:calc(70px + env(safe-area-inset-top));transform:translateX(-50%);z-index:3050;background:#000c;color:#fff;padding:8px 14px;border-radius:20px;font-weight:700;font-size:14px;animation:ghint .25s;pointer-events:none;font-family:system-ui,sans-serif;white-space:nowrap}
.fxtoast.out{opacity:0;transition:.3s}
.fxfloat{position:fixed;z-index:3060;transform:translate(-50%,-50%);font:900 20px system-ui,sans-serif;color:#9be15d;text-shadow:0 2px 0 #0008,0 0 8px #0006;pointer-events:none;animation:gflt 1.1s ease-out forwards;white-space:nowrap}
.fxfloat.neg{color:#ff8a80}@keyframes gflt{0%{opacity:0;transform:translate(-50%,-30%) scale(.6)}15%{opacity:1;transform:translate(-50%,-60%) scale(1.15)}100%{opacity:0;transform:translate(-50%,-260%)}}
.fxcoin{position:fixed;z-index:3060;font-size:18px;pointer-events:none;transform:translate(-50%,-50%);animation:gcoin .85s cubic-bezier(.2,.8,.4,1) forwards}
@keyframes gcoin{to{transform:translate(calc(-50% + var(--dx)),calc(-50% + var(--dy))) scale(.6);opacity:0}}
.fxconf{position:fixed;inset:0;width:100%;height:100%;z-index:3200;pointer-events:none}
.nm button{will-change:transform}.nm button.s{transition:transform .12s cubic-bezier(.3,1.5,.5,1),background .1s}
@media(prefers-reduced-motion:reduce){.gpi,.gpopi,#games .gcard{animation:none}}
`;document.head.appendChild(st)}
const LS=k=>{try{return JSON.parse(localStorage.getItem('plot.fx.'+k))}catch(e){return null}},SS=(k,v)=>{try{localStorage.setItem('plot.fx.'+k,JSON.stringify(v))}catch(e){}};
const set={mute:false,vol:.7,vib:true,...(LS('set')||{})};
let ac=null,master=null;
function ctx(){if(!ac){const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;ac=new C();master=ac.createGain();master.gain.value=set.vol;master.connect(ac.destination)}
 if(ac.state=='suspended')ac.resume().catch(()=>{});return ac}
// iOS/Safari: audio must be started inside a user gesture. Unlock on the first one, with a silent buffer.
const unlock=()=>{const c=ctx();if(!c)return;try{const b=c.createBuffer(1,1,22050),s=c.createBufferSource();s.buffer=b;s.connect(master);s.start(0)}catch(e){}
 if(c.state!='suspended'){['pointerdown','touchend','keydown'].forEach(e=>removeEventListener(e,unlock,true))}};
['pointerdown','touchend','keydown'].forEach(e=>addEventListener(e,unlock,true));
function tone(f,t,d,{type='sine',v=.25,f2=null,at=.005}={}){const c=ac,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(f,t);
 if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+d);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+at);g.gain.exponentialRampToValueAtTime(.0008,t+d);
 o.connect(g);g.connect(master);o.start(t);o.stop(t+d+.02)}
function noise(t,d,{v=.15,f=2000,q=1,type='bandpass'}={}){const c=ac,n=c.sampleRate*d|0,b=c.createBuffer(1,n,c.sampleRate),a=b.getChannelData(0);for(let i=0;i<n;i++)a[i]=Math.random()*2-1;
 const s=c.createBufferSource(),fl=c.createBiquadFilter(),g=c.createGain();s.buffer=b;fl.type=type;fl.frequency.value=f;fl.Q.value=q;g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+d);
 s.connect(fl);fl.connect(g);g.connect(master);s.start(t)}
const SND={
 tap:t=>tone(880,t,.05,{type:'triangle',v:.15,f2:660}),
 select:t=>tone(620,t,.07,{type:'triangle',v:.18,f2:900}),
 pour:t=>{for(let i=0;i<5;i++)tone(320-i*30,t+i*.06,.09,{v:.16,f2:180-i*15});noise(t,.35,{v:.05,f:900,q:2})},
 match:t=>{tone(660,t,.09,{type:'triangle',v:.2});tone(990,t+.07,.14,{type:'triangle',v:.2})},
 coin:t=>{tone(988,t,.08,{type:'square',v:.08});tone(1319,t+.07,.22,{type:'square',v:.08})},
 pay:t=>{tone(1568,t,.06,{type:'triangle',v:.1});tone(2093,t+.05,.12,{type:'triangle',v:.08})},
 harvest:t=>{tone(520,t,.09,{v:.22,f2:880});noise(t,.05,{v:.06,f:3000})},
 purchase:t=>{noise(t,.08,{v:.2,f:4000,q:.7});tone(1046,t+.06,.1,{type:'square',v:.07});tone(1568,t+.14,.25,{type:'square',v:.07})},
 levelup:t=>{[523,659,784,1046,1319].forEach((f,i)=>tone(f,t+i*.07,.18,{type:'triangle',v:.18}));noise(t+.35,.3,{v:.04,f:6000})},
 win:t=>{[523,659,784].forEach((f,i)=>tone(f,t+i*.11,.16,{type:'triangle',v:.2}));[1046,1319,1568].forEach(f=>tone(f,t+.36,.6,{type:'triangle',v:.12}))},
 lose:t=>{[392,330,262].forEach((f,i)=>tone(f,t+i*.16,.22,{type:'sawtooth',v:.08,f2:f*.94}))},
 error:t=>{tone(140,t,.12,{type:'square',v:.08});tone(120,t+.12,.16,{type:'square',v:.08})},
 eat:t=>{tone(300,t,.06,{type:'square',v:.08,f2:900});tone(1200,t+.05,.05,{type:'triangle',v:.1})},
 capture:t=>{noise(t,.06,{v:.18,f:1500});tone(240,t,.12,{v:.2,f2:120})},
 crown:t=>{[784,988,1175,1568].forEach((f,i)=>tone(f,t+i*.06,.2,{type:'triangle',v:.15}))},
 tick:t=>tone(1200,t,.025,{type:'square',v:.04}),
 // r6: liquid pour — brown noise through a sweeping band-pass (the "glug" rises as the tube fills) + rising bubble blips
 vroom:t=>{tone(70,t,.32,{type:'sawtooth',v:.1,f2:210});tone(140,t+.02,.25,{type:'square',v:.03,f2:320})},
 honk:t=>{tone(415,t,.11,{type:'square',v:.07});tone(523,t,.11,{type:'square',v:.05});tone(415,t+.15,.09,{type:'square',v:.06})},
 board:t=>tone(620+Math.random()*200,t,.07,{v:.12,f2:1150}),
 pourLong:(t,d=.5)=>{const c=ac;d=Math.max(.2,Math.min(1.6,d));const n=c.sampleRate*d|0,b=c.createBuffer(1,n,c.sampleRate),a=b.getChannelData(0);let l=0;for(let i=0;i<n;i++){l=l*.96+(Math.random()*2-1)*.04;a[i]=l*7}
  const s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain(),lfo=c.createOscillator(),lg=c.createGain();s.buffer=b;f.type='bandpass';f.Q.value=4;f.frequency.setValueAtTime(380,t);f.frequency.exponentialRampToValueAtTime(1300,t+d);
  lfo.frequency.value=11;lg.gain.value=180;lfo.connect(lg);lg.connect(f.frequency);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.55,t+.04);g.gain.setValueAtTime(.55,t+d-.1);g.gain.linearRampToValueAtTime(0,t+d);
  s.connect(f);f.connect(g);g.connect(master);s.start(t);lfo.start(t);lfo.stop(t+d+.05);
  const k=Math.round(d*12);for(let i=0;i<k;i++){const tt=t+(i+Math.random()*.6)*d/k,base=380+700*i/k;tone(base,tt,.045,{v:.06,f2:base*1.9})}}};
function sfx(n,a){if(set.mute||!SND[n])return;const c=ctx();if(!c||c.state!='running')return;try{SND[n](c.currentTime+.01,a)}catch(e){}}
// Haptics: Android/Chrome only. iOS Safari has no navigator.vibrate -> silently nothing.
const VIB={tick:8,tap:8,success:[18,40,28],error:[50,40,50],big:[30,50,30,50,140]};
function buzz(n){if(!set.vib||!navigator.vibrate)return;try{navigator.vibrate(VIB[n]||n)}catch(e){}}
function fx(s,v){sfx(s);if(v)buzz(v)}
function save(){SS('set',set);if(master)master.gain.value=set.vol}
const el=(h,cls,parent=document.body)=>{const d=document.createElement('div');if(cls)d.className=cls;d.innerHTML=h;parent.appendChild(d);return d};
function settings(){document.querySelector('.fxset')?.remove();const canVib=!!navigator.vibrate;
 const d=el(`<div class="fxcard"><h3>⚙️ Game settings</h3>
  <label class="fxrow"><span>🔊 Sound</span><input type="checkbox" id="fxS" ${set.mute?'':'checked'}></label>
  <label class="fxrow"><span>Volume</span><input type="range" id="fxV" min="0" max="1" step=".05" value="${set.vol}"></label>
  <label class="fxrow ${canVib?'':'off'}"><span>📳 Vibration${canVib?'':' <small>(not supported here)</small>'}</span><input type="checkbox" id="fxB" ${set.vib?'checked':''} ${canVib?'':'disabled'}></label>
  <button class="fxbtn" id="fxOk">Done</button></div>`,'fxset fxmodal');
 d.querySelector('#fxS').onchange=e=>{set.mute=!e.target.checked;save();sfx('select')};
 d.querySelector('#fxV').oninput=e=>{set.vol=+e.target.value;save()};d.querySelector('#fxV').onchange=()=>sfx('coin');
 d.querySelector('#fxB').onchange=e=>{set.vib=e.target.checked;save();buzz('success')};
 const x=()=>d.remove();d.querySelector('#fxOk').onclick=x;d.onclick=e=>{if(e.target==d)x()}}
// How-to card: steps = [[svgOrEmoji, title, text], ...]. Shows once per key unless force.
function howTo(key,title,steps,force){return new Promise(res=>{const seen=LS('howto')||{};if(seen[key]&&!force)return res(false);
 let i=0;const d=el('','fxmodal fxhow');const draw=()=>{const s=steps[i];d.innerHTML=`<div class="fxcard"><small class="fxk">How to play · ${i+1}/${steps.length}</small><h3>${title}</h3>
  <div class="fxill">${s[0]}</div><b class="fxst">${s[1]}</b><p>${s[2]}</p><div class="fxdots">${steps.map((_,k)=>`<i class="${k==i?'on':''}"></i>`).join('')}</div>
  <div class="fxbar">${i?'<button class="fxbtn sec" id="fxP">Back</button>':'<button class="fxbtn sec" id="fxSk">Skip</button>'}<button class="fxbtn" id="fxN">${i<steps.length-1?'Next':'Let\'s play!'}</button></div></div>`;
  const fin=()=>{seen[key]=1;SS('howto',seen);d.classList.add('out');setTimeout(()=>d.remove(),200);res(true)};
  d.querySelector('#fxN').onclick=()=>{sfx('tap');if(i<steps.length-1){i++;draw()}else fin()};
  d.querySelector('#fxP')&&(d.querySelector('#fxP').onclick=()=>{i--;draw()});d.querySelector('#fxSk')&&(d.querySelector('#fxSk').onclick=fin)};draw()})}
// Contextual hint bubble inside a container (auto-hides). Each id shown at most `max` times ever.
let hintT=0;function hint(txt,{id=null,max=3,ms=3800,host=null}={}){if(id){const h=LS('hints')||{};if((h[id]||0)>=max)return;h[id]=(h[id]||0)+1;SS('hints',h)}
 document.querySelector('.fxhint')?.remove();clearTimeout(hintT);const d=el(`💡 ${txt}`,'fxhint',host||document.body);d.onclick=()=>d.remove();hintT=setTimeout(()=>{d.classList.add('out');setTimeout(()=>d.remove(),300)},ms)}
function toast(txt,host){const d=el(txt,'fxtoast',host||document.body);setTimeout(()=>{d.classList.add('out');setTimeout(()=>d.remove(),300)},1600)}
// Floating "+$" text at viewport coords.
function float(x,y,txt,cls=''){const d=el(txt,'fxfloat '+cls);d.style.left=x+'px';d.style.top=y+'px';setTimeout(()=>d.remove(),1100)}
function burst(x,y,n=10,ch='🪙'){for(let k=0;k<n;k++){const d=el(ch,'fxcoin');const a=Math.random()*Math.PI*2,r=40+Math.random()*60;d.style.left=x+'px';d.style.top=y+'px';
 d.style.setProperty('--dx',Math.cos(a)*r+'px');d.style.setProperty('--dy',Math.sin(a)*r-30+'px');d.style.animationDelay=(k*15)+'ms';setTimeout(()=>d.remove(),900)}}
// Confetti on a full-screen canvas, rAF, auto-stops.
function confetti(n=120,ms=2200){const c=document.createElement('canvas');c.className='fxconf';document.body.appendChild(c);const d=Math.min(2,devicePixelRatio||1);
 c.width=innerWidth*d;c.height=innerHeight*d;const g=c.getContext('2d');g.scale(d,d);const C=['#ffd54a','#ff6b6b','#4dd0e1','#81c784','#ba68c8','#ff9f43'];
 const P=Array.from({length:n},()=>({x:innerWidth/2+(Math.random()-.5)*80,y:innerHeight*.35,vx:(Math.random()-.5)*9,vy:-Math.random()*10-4,r:Math.random()*6,s:4+Math.random()*5,c:C[Math.random()*6|0],w:Math.random()*.3}));
 const t0=performance.now();let last=t0;const f=t=>{const dt=Math.min(2,(t-last)/16.7);last=t;g.clearRect(0,0,innerWidth,innerHeight);
  for(const p of P){p.vy+=.28*dt;p.vx*=.99;p.x+=p.vx*dt;p.y+=p.vy*dt;p.r+=p.w*dt;g.save();g.translate(p.x,p.y);g.rotate(p.r);g.fillStyle=p.c;g.fillRect(-p.s/2,-p.s/4,p.s,p.s/2);g.restore()}
  if(t-t0<ms)requestAnimationFrame(f);else c.remove()};requestAnimationFrame(f)}
function countUp(e,to,ms=900,fmt=v=>'$'+Math.round(v).toLocaleString()){const t0=performance.now();let lastTick=0;const f=t=>{const k=Math.min(1,(t-t0)/ms),v=to*(1-Math.pow(1-k,3));e.textContent=fmt(v);
 if(t-lastTick>70&&k<1){lastTick=t;sfx('tick')}if(k<1)requestAnimationFrame(f)};requestAnimationFrame(f)}
function best(id,score,lowerBetter){const b=LS('best')||{};const old=b[id];const isNew=score>0&&(old==null||(lowerBetter?score<old:score>old));if(isNew){b[id]=score;SS('best',b)}return{best:isNew?score:old,isNew,old}}
const ill=(svg,extra='')=>`<svg viewBox="0 0 120 80" class="fxsvg ${extra}">${svg}</svg>`;
window.FX={sfx,buzz,fx,settings,howTo,hint,toast,float,burst,confetti,countUp,best,ill,get set(){return set},el,unlock};
})();
