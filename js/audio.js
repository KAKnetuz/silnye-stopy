/* «Сильные стопы» — сигналы, голосовые подсказки, удержание экрана, музыка. © 2026 KAKnetuz. Все права защищены. */
"use strict";

/* ---------- Settings, sound, voice, screen ---------- */
var SET=Object.assign({beep:true,voice:true,music:true,vkind:"female"},store.get("ss_set",{}));   // vkind — голос подсказок: "female" | "male"
var AC=null;
function unlock(){
  try{
    if(!AC){var C=window.AudioContext||window.webkitAudioContext;if(C)AC=new C();}
    if(AC&&AC.state==="suspended")AC.resume();
  }catch(e){}
  primeSpeech();
}
function ensureAudio(){ // Android «усыпляет» звук после блокировки экрана, звонка или голосовой подсказки — будим
  try{if(AC&&AC.state!=="running"&&AC.state!=="closed")AC.resume();}catch(e){}
}
function beep(f,d,v,delay){
  if(!AC||!SET.beep||S.muted)return;
  ensureAudio();
  try{
    var t=AC.currentTime+(delay||0),o=AC.createOscillator(),g=AC.createGain();
    o.type="sine";o.frequency.value=f;
    g.gain.setValueAtTime(0.0001,t);
    g.gain.exponentialRampToValueAtTime(v||0.2,t+0.012);
    g.gain.exponentialRampToValueAtTime(0.0001,t+d);
    o.connect(g);g.connect(AC.destination);o.start(t);o.stop(t+d+0.03);
  }catch(e){}
}
function tone(k){
  switch(k){
    case "tick": beep(880,.07,.14);break;
    case "ready": beep(660,.1,.14);break;
    case "go": beep(1320,.2,.22);break;
    case "soft": beep(587,.18,.16);break;
    case "end": beep(988,.12,.2);beep(1318,.18,.2,.14);break;
    case "done": beep(784,.12,.2);beep(988,.12,.2,.13);beep(1318,.28,.22,.26);break;
    case "start": beep(1047,.55,.26);break;                  // длинный сигнал «старт», как в Табате
    case "bell": bell(784,0,.3);bell(784,.32,.3);break;      // двойной гонг — конец упражнения
  }
}
function bell(f,delay,v){
  if(!AC||!SET.beep||S.muted)return;
  try{
    var t=AC.currentTime+(delay||0);
    [[1,1],[2.76,.45],[5.4,.22],[8.93,.1]].forEach(function(q){
      var o=AC.createOscillator(),g=AC.createGain();o.type="sine";o.frequency.value=f*q[0];
      g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(v*q[1],t+0.006);
      g.gain.exponentialRampToValueAtTime(0.0001,t+1.5/Math.sqrt(q[0]));
      o.connect(g);g.connect(AC.destination);o.start(t);o.stop(t+1.6);
    });
  }catch(e){}
}

/* ---------- Music: спокойная непрерывная мелодия для занятий ----------
   Web Audio scheduling uses audio clock; no noise percussion or convolution.
   One persistent master gain avoids pumping caused by repeated render calls. */
var MVOL=0.13;
var MUS={on:false,bus:null,timer:null,next:0,i:0,ducked:false,context:null};
var MUSIC_STEP=60/76/2; // 76 BPM, eighth-note pulse
var MUSIC_CHORDS=[
  [50,57,62,66,69], // D major
  [47,54,59,62,66], // B minor
  [43,50,55,59,62], // G major
  [45,52,57,61,64], // A major
  [50,57,62,66,69],
  [47,54,59,62,66],
  [43,50,55,59,62],
  [45,52,57,61,64]
];
var MUSIC_PATTERN=[2,3,4,3,2,1,3,4];
function mtof(m){return 440*Math.pow(2,(m-69)/12);}
function musBus(){
  if(!AC)return null;
  if(MUS.bus&&MUS.context===AC)return MUS.bus;
  MUS.context=AC;
  MUS.bus=AC.createGain();
  MUS.bus.gain.value=0.0001;
  MUS.bus.connect(AC.destination);
  return MUS.bus;
}
function musGain(target,sec){
  if(!MUS.bus||!AC||AC.state==="closed")return;
  var g=MUS.bus.gain,t=AC.currentTime;
  try{
    g.cancelScheduledValues(t);
    g.setValueAtTime(Math.max(0.0001,g.value),t);
    g.linearRampToValueAtTime(Math.max(0.0001,target),t+Math.max(0.01,sec));
  }catch(e){}
}
function musicNote(m,t,vol,duration){
  var o=AC.createOscillator(),g=AC.createGain();
  o.type="sine";o.frequency.setValueAtTime(mtof(m),t);
  // Rounded attack and release avoid clicks; soft harmonics, no broadband noise.
  g.gain.setValueAtTime(0.0001,t);
  g.gain.linearRampToValueAtTime(vol,t+0.045);
  g.gain.exponentialRampToValueAtTime(0.0001,t+duration);
  o.connect(g);g.connect(MUS.bus);
  o.start(t);o.stop(t+duration+0.03);
  o.onended=function(){o.disconnect();g.disconnect();};
}
function mstep(i,t){
  var chord=MUSIC_CHORDS[Math.floor(i/8)%MUSIC_CHORDS.length];
  var s=i%8;
  if(s===0)musicNote(chord[0],t,0.13,MUSIC_STEP*7.5);
  musicNote(chord[MUSIC_PATTERN[s]],t,0.085,MUSIC_STEP*1.75);
}
function mschedule(){
  if(!MUS.on||!AC)return;
  if(AC.state!=="running"){ensureAudio();return;}
  var now=AC.currentTime;
  if(MUS.next<now+0.025)MUS.next=now+0.07; // skip late notes, never burst-catch-up
  var n=0;
  while(MUS.next<now+0.45&&n++<4){
    mstep(MUS.i,MUS.next);
    MUS.next+=MUSIC_STEP;
    MUS.i=(MUS.i+1)%64;
  }
}
function musicStart(){
  if(MUS.on||!AC||!musBus())return;
  ensureAudio();
  MUS.on=true;MUS.i=0;MUS.next=AC.currentTime+0.09;
  musGain(MUS.ducked?MVOL*0.25:MVOL,0.8);
  mschedule();
  MUS.timer=setInterval(mschedule,100);
}
function musicStop(){
  if(!MUS.on)return;
  MUS.on=false;clearInterval(MUS.timer);MUS.timer=null;
  musGain(0,0.35);
}
function duck(on){
  MUS.ducked=!!on;
  if(MUS.on)musGain(on?MVOL*0.25:MVOL,0.25);
}
function updateMusic(){
  var want=false;
  if(SET.music&&!S.muted&&S.view==="work"&&!document.hidden){
    if(S.phase==="manual")want=true;
    else if(S.phase==="run"){
      var sg=S.segs[S.si];
      want=!!sg&&(sg.p==="work"||sg.p==="hold"||sg.p==="relax");
    }
  }
  if(want){ensureAudio();musicStart();}
  else musicStop();
}
function vibrate(p){try{if(SET.beep&&!S.muted&&navigator.vibrate)navigator.vibrate(p);}catch(e){}}

/* Голос подсказок. Браузер не сообщает пол голоса, поэтому мужской и женский голоса узнаём по имени:
   Google TTS на Android — ru-ru-x-rud / ru-ru-x-ruf (мужские), ru-ru-x-ruc / -rue / -dfc (женские); Windows — Pavel, Dmitry; Apple — Yuri; Microsoft онлайн — Dmitry. */
var MALE_RE=/(#male|\bmale\b|муж|x-rud|x-ruf|pavel|павел|dmitr|дмитр|yuri|юри|maxim|максим|ruslan|руслан|alexand|aleksand|александр|artem|артём|ermil|filipp|филипп)/i;
var FEMALE_RE=/(female|жен|x-ruc|x-rue|x-dfc|irina|ирина|milena|милена|svetlana|светлан|elena|елена|dariya|darya|дарья|alena|алён|ekaterina|екатерин|anna\b|анна|katya|катя|tatyana|татьян|polina|полина|oksana|оксана)/i;
var ruVoice=null,voicesKnown=false,maleFallback=false;
function voiceKey(v){return (v.name||"")+" "+(v.voiceURI||"");}
function loadVoices(){
  try{
    var vs=window.speechSynthesis.getVoices();
    if(vs&&vs.length){
      voicesKnown=true;
      var ru=vs.filter(function(v){return /^ru/i.test(v.lang);});
      var male=ru.filter(function(v){return MALE_RE.test(voiceKey(v))&&!/female/i.test(voiceKey(v));});
      var female=ru.filter(function(v){return FEMALE_RE.test(voiceKey(v));});
      var local=function(a){return a.find(function(v){return v.localService;})||a[0]||null;};   // офлайн-голос надёжнее сетевого
      if(SET.vkind==="male"){ruVoice=local(male)||local(ru);maleFallback=!male.length&&!!ru.length;}
      else{ruVoice=local(female)||local(ru.filter(function(v){return !MALE_RE.test(voiceKey(v));}))||local(ru);maleFallback=false;}
    }
    $("voice-note").hidden=!(voicesKnown&&!ruVoice&&SET.voice);
  }catch(e){}
}
var canSpeak=("speechSynthesis" in window)&&("SpeechSynthesisUtterance" in window);
if(canSpeak){loadVoices();try{window.speechSynthesis.addEventListener("voiceschanged",loadVoices);}catch(e){}}
var lastUtt=null,sayTimer=null,primed=false;
function primeSpeech(){ // Chrome на Android включает речь только после первой фразы, сказанной по нажатию
  if(primed||!canSpeak||!SET.voice)return;primed=true;
  try{var u=new SpeechSynthesisUtterance(" ");u.volume=0;u.lang="ru-RU";lastUtt=u;window.speechSynthesis.speak(u);}catch(e){}
}
function say(t){
  if(!canSpeak||!SET.voice||S.muted||!t)return;
  if(!ruVoice)loadVoices(); // голоса на Android подгружаются не сразу — перепроверяем перед каждой фразой
  try{
    var ss=window.speechSynthesis,busy=ss.speaking||ss.pending;
    if(busy)ss.cancel();
    clearTimeout(sayTimer);
    var go=function(){
      try{
        if(ss.paused)ss.resume();
        var u=new SpeechSynthesisUtterance(t);u.lang="ru-RU";if(ruVoice)u.voice=ruVoice;u.rate=1.05;
        if(SET.vkind==="male"&&maleFallback)u.pitch=0.55;   // мужского голоса на устройстве нет — говорим тем, что есть, но ниже
        u.onstart=function(){duck(true);clearTimeout(MUS.duckT);MUS.duckT=setTimeout(function(){duck(false);},Math.max(1500,t.length*90));};u.onend=u.onerror=function(){clearTimeout(MUS.duckT);duck(false);};
        lastUtt=u; // держим ссылку, иначе Chrome может оборвать фразу
        ss.speak(u);
      }catch(e){}
    };
    if(busy)sayTimer=setTimeout(go,90);else go(); // сразу после cancel() Chrome теряет новую фразу
  }catch(e){}
}
function hush(){try{if(canSpeak)window.speechSynthesis.cancel();}catch(e){}}

var WL=null;
function wake(on){
  try{
    if(on){
      if(!WL&&navigator.wakeLock){
        navigator.wakeLock.request("screen").then(function(w){WL=w;w.addEventListener("release",function(){WL=null;});}).catch(function(){WL=null;});
      }
    }else if(WL){var w=WL;WL=null;w.release().catch(function(){});}
  }catch(e){WL=null;}
}
