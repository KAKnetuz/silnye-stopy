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

/* ---------- Music: лёгкий ритм только во время упражнения ---------- */
var MVOL=0.2,MUS={on:false,bus:null,timer:null,next:0,i:0,noise:null,pulse:null};
/* 8-бит: мелодия на «пищалке» (импульс 25%), бас — треугольник, ударные — шум. 144 уд/мин, 8 тактов по 16 шестнадцатых */
var S16=60/100/4,LOOP=256;
/* Хэндпан ре мажор (D3 A3 B3 C#4 D4 E4 F#4 G4 A4 B4 C#5 D5 E5 F#5): «перекаты» двумя руками, таки, мелодия из двух частей по 8 тактов */
var NOTE={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
function nm(s){var sh=s[1]==="#"?1:0;return 12*(parseInt(s.slice(-1),10)+1)+NOTE[s[0]]+sh;}
var HP=[50,57,59,61,62,64,66,67,69,71,73,74,76,78];
var CHD={D:{b:50,mid:[62,66,69]},A:{b:57,mid:[61,64,69]},Bm:{b:59,mid:[62,66,71]},G:{b:59,mid:[62,67,71]},Fm:{b:57,mid:[61,66,69]}};
var PROG=["D","A","Bm","G","D","A","G","A","G","A","Fm","Bm","G","A","D","D"];
var MEL=["F#5 - E5 D5 E5 - A4 -","C#5 - D5 E5 C#5 - A4 -","D5 - F#5 - E5/D5 C#5 B4 -","D5 - - B4 G4 - B4 D5",
         "F#5 - E5 D5 E5 - F#5/E5 D5","E5 - C#5 - A4 - C#5 E5","D5 - B4 - G4/A4 B4 D5 E5","C#5 - - - . . A4/B4 C#5",
         "D5 - . D5 E5 - D5 B4","C#5 - . C#5 E5 - C#5 A4","A4 - C#5 - F#5 - E5 C#5","D5 - F#5 - E5/D5 C#5/B4 D5 -",
         "B4 - D5 - G4/B4 D5/E5 F#5 -","E5 - C#5 - E5/F#5 E5/C#5 A4 -","D5 - F#5 - A4 - D5 -","D5 - - - . . . ."];
var LEAD=[];
MEL.forEach(function(bar,bi){
  bar.split(" ").forEach(function(tok,j){
    var st=bi*16+j*2;
    if(tok==="-"){if(LEAD.length)LEAD[LEAD.length-1][2]+=2;}
    else if(tok.indexOf("/")>0)tok.split("/").forEach(function(q,k){LEAD.push([st+k,nm(q),1]);});
    else if(tok!==".")LEAD.push([st,nm(tok),2]);
  });
});
var LEADAT={};LEAD.forEach(function(n){LEADAT[n[0]]=n;});
var ROLL={2:0,3:1,5:0,6:1,7:2,10:0,11:1,13:2,14:1,15:0}; // «перекаты» по средним нотам: номер ноты аккорда
function mtof(m){return 440*Math.pow(2,(m-69)/12);}
function musBus(){
  if(MUS.bus||!AC)return MUS.bus;
  MUS.bus=AC.createGain();MUS.bus.gain.value=0.0001;MUS.bus.connect(AC.destination);
  var sr=AC.sampleRate,L=Math.floor(sr*1.8),ir=AC.createBuffer(2,L,sr);   // короткое «уличное» эхо
  for(var ch=0;ch<2;ch++){var dd=ir.getChannelData(ch);for(var k=0;k<L;k++)dd[k]=(Math.random()*2-1)*Math.pow(1-k/L,4);}
  MUS.verb=AC.createConvolver();MUS.verb.buffer=ir;
  var wet=AC.createGain();wet.gain.value=0.35;MUS.verb.connect(wet);wet.connect(MUS.bus);
  var nl=Math.floor(sr*0.15),nb=AC.createBuffer(1,nl,sr),nd=nb.getChannelData(0);for(var j=0;j<nl;j++)nd[j]=Math.random()*2-1;
  MUS.noise=nb;MUS.pass=-1;MUS.motif=null;
  return MUS.bus;
}
function outFor(m){ // ноты раскладываются по стерео: низкие по центру, высокие чуть в стороны, как у живого инструмента
  var p=AC.createStereoPanner?AC.createStereoPanner():null;
  if(p){p.pan.value=Math.max(-0.6,Math.min(0.6,((HP.indexOf(m)%2)?1:-1)*(m-57)/40));p.connect(MUS.bus);p.connect(MUS.verb);return p;}
  var g=AC.createGain();g.connect(MUS.bus);g.connect(MUS.verb);return g;
}
function pan(m,t,v){ // звук хэндпана: основной тон + октава + квинта над октавой, долгое затухание
  var f=mtof(m),out=outFor(m);
  [[1,1,2.8,0],[2,0.3,1.4,3],[3,0.09,0.8,-4]].forEach(function(q){
    var o=AC.createOscillator(),g=AC.createGain();o.type="sine";o.frequency.value=f*q[0];o.detune.value=q[3];
    g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(v*q[1],t+0.005);g.gain.exponentialRampToValueAtTime(0.0001,t+q[2]);
    o.connect(g);g.connect(out);o.start(t);o.stop(t+q[2]+0.05);
  });
}
function tak(t,v,hi){ // удар ладонью по корпусу: короткий шум + глухой «тук»
  var s=AC.createBufferSource(),fl=AC.createBiquadFilter(),g=AC.createGain();
  s.buffer=MUS.noise;fl.type="bandpass";fl.frequency.value=hi?2400:1100;fl.Q.value=1.2;
  g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(0.0001,t+0.06);
  s.connect(fl);fl.connect(g);g.connect(MUS.bus);g.connect(MUS.verb);s.start(t);s.stop(t+0.08);
  if(!hi){var o=AC.createOscillator(),og=AC.createGain();o.frequency.setValueAtTime(190,t);o.frequency.exponentialRampToValueAtTime(110,t+0.08);
    og.gain.setValueAtTime(v*0.8,t);og.gain.exponentialRampToValueAtTime(0.0001,t+0.1);o.connect(og);og.connect(MUS.bus);o.start(t);o.stop(t+0.12);}
}
function mstep(i,t){
  var bar=Math.floor(i/16),s=i%16,C=CHD[PROG[bar]],hum=function(){return (Math.random()-0.5)*0.016;};
  if(s===0)pan(C.b,t,0.32);                                        // бас на «раз»
  if(s===8)pan(C.b+(C.b<57?7:0),t+hum(),0.2);                      // и на «три»
  if(s===4||s===12)tak(t+hum(),0.3,false);                          // таки ладонью
  if(s===1||s===9)tak(t+hum(),0.07,true);                           // лёгкие касания
  if(s===14&&bar%2===1)tak(t+hum(),0.16,false);                     // синкопа
  if(ROLL[s]!==undefined)pan(C.mid[ROLL[s]],t+hum(),0.085+Math.random()*0.03); // перекаты
  var ld=LEADAT[i];if(ld)pan(ld[1],t+hum(),0.25+Math.random()*0.04);           // мелодия
}
function mschedule(){
  if(!MUS.on||!AC)return;
  if(AC.state!=="running"){ensureAudio();return;}
  if(MUS.next<AC.currentTime)MUS.next=AC.currentTime+0.05; // после задержки не «догоняем» пропущенное
  while(MUS.next<AC.currentTime+0.3){mstep(MUS.i,MUS.next);MUS.next+=S16;MUS.i=(MUS.i+1)%LOOP;}
}
function musGain(target,sec){
  if(!MUS.bus)return;
  var g=MUS.bus.gain,t=AC.currentTime;
  try{g.cancelScheduledValues(t);g.setValueAtTime(Math.max(0.0001,g.value),t);g.linearRampToValueAtTime(Math.max(0.0001,target),t+sec);}catch(e){}
}
function musicStart(){
  if(MUS.on||!AC||!musBus())return;
  ensureAudio();
  MUS.on=true;MUS.next=AC.currentTime+0.08;
  musGain(MVOL,0.8);mschedule();MUS.timer=setInterval(mschedule,60);
}
function musicStop(){
  if(!MUS.on)return;
  MUS.on=false;clearInterval(MUS.timer);musGain(0,0.35);
}
function duck(on){if(MUS.on)musGain(on?MVOL*0.3:MVOL,0.15);}
function updateMusic(){
  var want=false;
  if(SET.music&&!S.muted&&S.view==="work"&&!document.hidden){
    if(S.phase==="manual")want=true;
    else if(S.phase==="run"){var sg=S.segs[S.si];want=!!sg&&(sg.p==="work"||sg.p==="hold"||sg.p==="relax");}
  }
  if(want){ensureAudio();if(MUS.on&&!MUS.duckT)musGain(MVOL,0.2);musicStart();}else musicStop();
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
