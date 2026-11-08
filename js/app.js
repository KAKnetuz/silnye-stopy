/* «Сильные стопы» — движок тренировки, экраны, настройки, запуск. © 2026 KAKnetuz. Все права защищены. */
"use strict";

/* ---------- Engine ---------- */
var S={view:"home",ex:0,st:0,phase:"idle",segs:[],si:0,segEnd:0,remain:0,startedAt:0,muted:false,lastBeep:-1,drawnKey:""};
function ex(){return EX[S.ex];}
function step(){return ex().steps[S.st];}
function prevReal(){var s=ex().steps;for(var j=S.st-1;j>=0;j--){if(s[j].k!=="rest")return s[j];}return null;}
function sideWord(st){return st.sideText||(st.side==="L"?"Левая нога":"Правая нога");}

function compile(st){
  var prev=prevReal(),segs=[];
  var prepMs=(st.side&&prev&&prev.side&&prev.side!==st.side)?5000:3000;
  if(st.k==="time"){segs.push({p:"prep",ms:prepMs},{p:"work",ms:st.sec*1000});}
  else if(st.k==="hold"){
    segs.push({p:"prep",ms:prepMs});
    for(var r=1;r<=st.reps;r++){segs.push({p:"hold",ms:st.hold*1000,rep:r});if(r<st.reps)segs.push({p:"relax",ms:st.relax*1000,rep:r});}
  }
  else if(st.k==="rest"){segs.push({p:"rest",ms:st.sec*1000});}
  else if(st.k==="breath"){segs.push({p:"breath",ms:st.sec*1000});}
  return segs;
}

function settle(){ // привести текущий шаг в состояние ожидания
  S.segs=[];S.si=0;
  S.phase="idle"; // любое упражнение начинается с «Старт» — без музыки до начала
}

function runStep(){
  var st=step();
  if(st.k==="reps"){
    S.phase="manual";
    tone("start");
    var pre=st.sets>1?(ex().setWord||"Подход")+" "+st.set+". ":"";
    say(pre+(st.side?sideWord(st)+". ":"")+st.text);
    render();return;
  }
  S.segs=compile(st);S.si=0;S.phase="run";
  startSeg();render();
}

function startSeg(){
  var seg=S.segs[S.si],st=step();
  S.segEnd=now()+seg.ms;S.lastBeep=-1;
  switch(seg.p){
    case "prep":
      tone("ready");
      if(st.side&&prevReal()&&prevReal().side&&prevReal().side!==st.side) say("Смени ногу. "+sideWord(st));
      else if(st.side) say(sideWord(st));
      else say(st.label||"Приготовься");
      break;
    case "work": tone("start");say("Начали");break;
    case "hold": tone(seg.rep===1?"start":"go");say(String(seg.rep));break;
    case "relax": tone("soft");say("Расслабь");break;
    case "rest": tone("soft");say("Отдых");break;
    case "breath": tone("soft");say("Отдыхаем. Вдох на четыре, выдох на шесть");break;
  }
}

function tickWanted(seg,sec){
  if(seg.p==="prep")return sec<=2;
  if(seg.p==="breath")return false;
  return seg.ms>=6000;
}

function tick(){
  if(S.phase!=="run")return;
  var t=now(),guard=0;
  while(S.phase==="run"&&t>=S.segEnd&&guard++<60){endSeg();}
  if(S.phase!=="run")return;
  var seg=S.segs[S.si],sec=Math.ceil((S.segEnd-t)/1000);
  if(sec>=1&&sec<=3&&sec!==S.lastBeep){
    if(tickWanted(seg,sec))tone("tick");
    S.lastBeep=sec;
  }
  drawDial();
}

function endSeg(){
  if(S.si+1<S.segs.length){S.si++;startSeg();render();}
  else stepDone();
}

function stepDone(){
  var cur=step();if(cur.k!=="rest"&&cur.k!=="breath")tone("bell");
  if(S.st+1<ex().steps.length){S.st++;runStep();}
  else exDone();
}

function exDone(){
  vibrate([180,90,180]);
  var finished=ex();
  if(S.ex+1<EX.length){
    S.ex++;S.st=0;settle();saveProgress();
    toast("«"+finished.short+"» — готово");
    say("Готово. Дальше: "+ex().short);
    render();
  }else finish();
}

function finish(){
  S.phase="idle";wake(false);musicStop();tone("done");
  var h=store.get("ss_hist",[]);if(h.indexOf(today())<0){h.push(today());store.set("ss_hist",h);}
  store.set("ss_progress",null);
  var mins=S.startedAt?Math.max(1,Math.round((Date.now()-S.startedAt)/60000)):0;
  $("d-time").textContent=mins;$("d-time").nextElementSibling.textContent=plural(mins,["минута","минуты","минут"]);
  var st=streak();$("d-streak").textContent=st;$("d-streak-w").textContent=plural(st,["день","дня","дней"])+" подряд";
  var nm=st>0&&st%7===0,dm=$("d-medal");dm.hidden=!nm;
  if(nm)dm.querySelector(".md-big").innerHTML=medalSvg(false);
  say(nm?"Тренировка закончена. Новая медаль! Семь дней без пропусков!":"Тренировка закончена. Молодец!");
  show("done");
}

function advance(){ // перейти к следующему шагу без автозапуска
  var steps=ex().steps;
  if(S.st+1<steps.length){S.st++;while(step().k==="rest"&&S.st+1<steps.length)S.st++;}
  else if(S.ex+1<EX.length){S.ex++;S.st=0;}
  else{finish();return;}
  hush();settle();saveProgress();render();
}
function back(){
  if(S.st>0){S.st--;while(S.st>0&&step().k==="rest")S.st--;}
  else if(S.ex>0){S.ex--;S.st=0;}
  hush();settle();render();
}

function mainAction(){
  unlock();
  switch(S.phase){
    case "idle": if(!S.startedAt)S.startedAt=Date.now(); wake(true); runStep(); break;
    case "run": S.remain=S.segEnd-now(); S.phase="paused"; hush(); render(); break;
    case "paused": S.segEnd=now()+S.remain; S.phase="run"; wake(true); render(); break;
    case "manual": if(!S.startedAt)S.startedAt=Date.now(); wake(true); stepDone(); break;
  }
}
function skipAction(){
  unlock();
  if(S.phase==="run"||S.phase==="paused"){hush();stepDone();}
  else advance();
}

/* ---------- Rendering ---------- */
var CIRC=565.49;
function chip(text,cls,foot){
  var el=document.createElement("span");el.className="chip"+(cls?" "+cls:"");
  if(foot)el.insertAdjacentHTML("beforeend",footSvg(foot));
  el.appendChild(document.createTextNode(text));
  return el;
}

function render(){
  if(S.view!=="work")return;
  var e=ex(),st=step(),b=BLOCKS[e.bi];
  $("w-block").textContent="Блок "+b.n+" · "+b.name;
  $("w-count").textContent=(S.ex+1)+" / "+EX.length;
  $("w-prog").style.width=((S.ex+S.st/e.steps.length)/EX.length*100).toFixed(2)+"%";
  $("w-group").textContent=e.grp||b.name;
  $("w-name").textContent=e.name;
  $("w-dose").textContent="Дозировка: "+e.dose;
  $("w-start").textContent=e.start;
  $("w-how").textContent=e.how;
  $("w-goal").textContent=e.goal;
  if(S.animEx!==S.ex){S.animEx=S.ex;startAnim();}
  var nx=EX[S.ex+1];$("w-next").textContent=nx?"Дальше: "+nx.name:"Это последнее упражнение";

  var c=$("w-chips");c.textContent="";
  if(st.k==="rest"){
    var nxt=e.steps[S.st+1];
    c.appendChild(chip("Отдых перед подходом "+(nxt?nxt.set:"")+" из "+(nxt?nxt.sets:""),"rest"));
  }else{
    if(st.label)c.appendChild(chip(st.label));
    if(st.side)c.appendChild(chip(sideWord(st),"",st.side));
    if(st.sets>1)c.appendChild(chip((e.setWord||"Подход")+" "+st.set+" из "+st.sets));
    if(st.more)c.appendChild(chip("Правой — больше","more"));
  }

  var m=$("w-main");m.classList.remove("is-pause","is-done");
  if(S.phase==="idle")m.textContent="Старт";
  else if(S.phase==="run"){m.textContent="Пауза";m.classList.add("is-pause");}
  else if(S.phase==="paused")m.textContent="Продолжить";
  else if(S.phase==="manual"){m.textContent="Готово";m.classList.add("is-done");}
  $("w-prev").disabled=(S.ex===0&&S.st===0);
  var mu=$("w-mute");mu.innerHTML=S.muted?ICON_MUTE:ICON_VOL;mu.setAttribute("aria-label",S.muted?"Включить звук":"Выключить звук");

  // pips for hold steps
  var p=$("w-pips");p.textContent="";
  if(st.k==="hold"){for(var i=0;i<st.reps;i++)p.appendChild(document.createElement("i"));}
  drawDial(true);
  updateMusic();
}

function setArc(frac,snap){
  var a=$("w-arc");
  if(snap){a.style.transition="none";a.setAttribute("stroke-dashoffset",(CIRC*(1-frac)).toFixed(2));void a.getBoundingClientRect();a.style.transition="";}
  else a.setAttribute("stroke-dashoffset",(CIRC*(1-frac)).toFixed(2));
}

function drawDial(force){
  if(S.view!=="work")return;
  var st=step(),d=$("w-dial"),big=$("w-big"),sub=$("w-sub"),br=$("w-breath");
  var key=S.ex+"."+S.st+"."+S.si+"."+S.phase,snap=force||key!==S.drawnKey;S.drawnKey=key;
  br.hidden=true;big.classList.remove("txt");
  if(S.phase==="idle"){
    d.dataset.p="idle";setArc(0,true);
    if(st.k==="hold"){big.textContent=st.reps+" × "+st.hold+" с";big.classList.add("txt");}
    else if(st.k==="reps"){big.textContent=st.text;big.classList.add("txt");}
    else big.textContent=fmt(st.sec||0);
    sub.textContent="Нажми «Старт»";
    pips(0,-1);return;
  }
  if(S.phase==="manual"){
    d.dataset.p="manual";setArc(1,true);
    big.textContent=st.text;big.classList.add("txt");
    sub.textContent="Сделай и нажми «Готово»";
    return;
  }
  var seg=S.segs[S.si];if(!seg)return;
  var rem=S.phase==="paused"?S.remain:S.segEnd-now();rem=Math.max(0,rem);
  var frac=1-rem/seg.ms,secs=Math.ceil(rem/1000);
  d.dataset.p=seg.p;
  setArc(1-frac,snap);
  big.textContent=fmt(secs);
  var t="";
  switch(seg.p){
    case "prep": t=st.side?sideWord(st):(st.label||"Приготовься");break;
    case "work": t=st.label||"Выполняй";break;
    case "hold": t="Держи · "+seg.rep+" из "+st.reps;break;
    case "relax": t="Расслабь · "+seg.rep+" из "+st.reps;break;
    case "rest": t="Отдых";break;
    case "breath":
      var el=(seg.ms-rem)/1000,cyc=el%10,inh=cyc<4;
      t=inh?"Вдох":"Выдох";
      var sc=inh?0.55+0.45*(cyc/4):1-0.45*((cyc-4)/6);
      br.hidden=false;
      if(!window.matchMedia||!window.matchMedia("(prefers-reduced-motion: reduce)").matches)br.style.transform="scale("+sc.toFixed(3)+")";
      break;
  }
  sub.textContent=S.phase==="paused"?"Пауза":t;
  if(st.k==="hold"){
    var done=seg.p==="prep"?0:(seg.p==="hold"?seg.rep-1:seg.rep);
    pips(done,seg.p==="hold"?seg.rep-1:-1);
  }
}
function pips(done,cur){
  var items=$("w-pips").children;
  for(var i=0;i<items.length;i++){items[i].className=(i<done?"on":"")+(i===cur?" cur":"");}
}

var REDUCED=false;try{REDUCED=window.matchMedia("(prefers-reduced-motion: reduce)").matches;}catch(e){}
var animCur=null,animT0=0,animRAF=0,animLast=0;
var FOCUS_BY={circles:"shin",noski:"shin",soldier:"calf",penguin:"shin",bear:"shin",rollwalk:"arch",ladoshki:"shin",claps:"shin",wipers:null,caterpillar:"arch",towel:"arch",cleanup:"arch",rollpin:"arch",hedgehog:"arch",artist:"arch",shortfoot:"arch",raise:"calf",rollouts:"shin",tightrope:"arch",heron:"calf",fivepoints:null,angel:null,wallsit:"quad",bike:"quad",stowel:"calf",swall:"calf",rags:null};
function drawAnim(){if(!animCur)return;var t=now(),p=REDUCED?0.3:((t-animT0)/1000/animCur.T)%1;
  AN.setFocus(FOCUS_BY[ex().anim]);AN.seed(REDUCED?7:Math.floor(t/140)*977+3); // линии наброска «дышат» ~7 раз в секунду
  var svg=$("w-anim-svg");
  svg.setAttribute("aria-label","Схема упражнения: "+ex().name+". Исходное положение: "+ex().start+". Движение: "+ex().how);
  svg.innerHTML=AN.sketchify(animCur.f(p));}
var animVisible=true;
function animLoop(ts){animRAF=0;if(S.view!=="work"||!animCur||document.hidden)return;if(animVisible&&ts-animLast>=50){animLast=ts;drawAnim();}animRAF=requestAnimationFrame(animLoop);} // 20 кадров в секунду, пауза вне экрана
function startAnim(){animCur=AN[ex().anim]||null;animT0=now();drawAnim();if(!REDUCED&&!animRAF)animRAF=requestAnimationFrame(animLoop);}
function stopAnim(){if(animRAF)cancelAnimationFrame(animRAF);animRAF=0;}

var toastT=null;
function toast(msg){var t=$("toast");t.textContent=msg;t.classList.add("show");clearTimeout(toastT);toastT=setTimeout(function(){t.classList.remove("show");},2200);}

/* ---------- Тема оформления ---------- */
var THEME_META=null;
function applyTheme(t){
  var r=document.documentElement;
  try{
    if(t==="light"||t==="dark")r.setAttribute("data-theme",t);
    else if(window.__hostTheme)r.setAttribute("data-theme",window.__hostTheme);
    else r.removeAttribute("data-theme");
  }catch(e){}
  try{ // цвет строки состояния в установленной версии
    var ms=document.querySelectorAll('meta[name="theme-color"]');
    if(!THEME_META){THEME_META=[];ms.forEach(function(m){THEME_META.push(m.getAttribute("content"));});}
    ms.forEach(function(m,i){m.setAttribute("content",t==="dark"?"#0E1521":t==="light"?"#ECF0F4":THEME_META[i]);});
  }catch(e){}
  ["auto","light","dark"].forEach(function(id){var b=$("th-"+id);if(b)b.setAttribute("aria-checked",(t===id||(id==="auto"&&t!=="light"&&t!=="dark"))?"true":"false");});
}

/* ---------- Версия, предупреждение, инвентарь, настройки, копия, напоминание ---------- */
var APP_VERSION="1.7",APP_DATE="08.11.2026";
var DISCLAIMER="Это дополнение к лечению, которое назначил ортопед, а не замена ему. Стельки, плавание и осмотры у врача остаются обязательными. Если во время занятия появилась боль в стопе, лодыжке, колене или спине — прекратите упражнение и обратитесь к лечащему врачу. Перед началом покажите комплекс ортопеду или инструктору ЛФК.";
function openSheet(id){$(id).hidden=false;}
function closeSheet(id){$(id).hidden=true;}
function disclaimerHTML(){return DISCLAIMER.split(/(?<=\.) /).map(function(s){return "<p>"+s+"</p>";}).join("");}
function maybeAck(){if(!store.get("ss_ack",false)){$("ack-text").innerHTML=disclaimerHTML();openSheet("sh-ack");}}
function planEquipment(){var need={};EX.forEach(function(e){(EQ_BY[e.short]||[]).forEach(function(k){need[k]=1;});});return Object.keys(EQ).filter(function(k){return need[k];});}
function showEquipment(){
  var list=$("eq-list");list.textContent="";
  planEquipment().forEach(function(k){
    var li=document.createElement("li");li.innerHTML='<label for="eq-'+k+'"><input type="checkbox" id="eq-'+k+'"><span></span></label>';
    li.querySelector("span").textContent=EQ[k];list.appendChild(li);
  });
  $("eq-sub").textContent="Вариант «"+PLANS[PLAN].title+"». Отметьте то, что уже под рукой, или сразу нажмите «Начать».";
  openSheet("sh-eq");
}
function pad2(n){return String(n).padStart(2,"0");}
function remDates(){
  var tv=($("rem-time").value||"18:00").split(":"),d=new Date();d.setDate(d.getDate()+1);d.setHours(+tv[0]||0,+tv[1]||0,0,0);
  var e=new Date(d.getTime()+30*60000),f=function(x){return x.getFullYear()+pad2(x.getMonth()+1)+pad2(x.getDate())+"T"+pad2(x.getHours())+pad2(x.getMinutes())+"00";};
  return [f(d),f(e)];
}
var REM_TITLE="Сильные стопы — гимнастика",REM_TEXT="Ежедневное занятие для стоп в приложении «Сильные стопы».";
function updateRemLink(){
  var dd=remDates(),tz="";try{tz=Intl.DateTimeFormat().resolvedOptions().timeZone||"";}catch(e){}
  $("rem-google").href="https://calendar.google.com/calendar/render?action=TEMPLATE&text="+encodeURIComponent(REM_TITLE)+"&details="+encodeURIComponent(REM_TEXT)+"&dates="+dd[0]+"/"+dd[1]+"&recur="+encodeURIComponent("RRULE:FREQ=DAILY")+(tz?"&ctz="+encodeURIComponent(tz):"");
}
function downloadICS(){
  var dd=remDates();
  var ics=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Silnye Stopy//RU","BEGIN:VEVENT","UID:"+Date.now()+"@silnye-stopy","DTSTAMP:"+dd[0],"DTSTART:"+dd[0],"DTEND:"+dd[1],"RRULE:FREQ=DAILY","SUMMARY:"+REM_TITLE,"DESCRIPTION:"+REM_TEXT,"BEGIN:VALARM","TRIGGER:PT0M","ACTION:DISPLAY","DESCRIPTION:"+REM_TITLE,"END:VALARM","END:VEVENT","END:VCALENDAR"].join("\r\n");
  try{var a=document.createElement("a");a.href=URL.createObjectURL(new Blob([ics],{type:"text/calendar"}));a.download="silnye-stopy-napominanie.ics";document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},1500);toast("Файл скачан — откройте его в календаре");}
  catch(e){toast("Не удалось скачать файл — нажмите «Google Календарь»");}
}
function b64e(s){return btoa(unescape(encodeURIComponent(s)));}
function b64d(s){return decodeURIComponent(escape(atob(s)));}
function makeBackup(){
  var data={v:1,hist:store.get("ss_hist",[]),set:store.get("ss_set",{}),plan:store.get("ss_plan","short"),theme:store.get("ss_theme","auto"),rem:store.get("ss_rem","18:00")};
  $("bk-code").value="SS1:"+b64e(JSON.stringify(data));$("bk-copy").hidden=false;
  $("bk-msg").textContent="Код создан, занятий в копии: "+data.hist.length+". Сохраните его, например в заметках или в сообщении самой себе.";
}
function copyBackup(){
  var t=$("bk-code");
  try{navigator.clipboard.writeText(t.value).then(function(){toast("Код скопирован");},function(){t.select();toast("Код выделен — скопируйте вручную");});}
  catch(e){t.select();toast("Код выделен — скопируйте вручную");}
}
function restoreBackup(){
  var raw=($("bk-code").value||"").replace(/\s+/g,""),msg=$("bk-msg");
  try{
    if(raw.indexOf("SS1:")!==0)throw 0;
    var d=JSON.parse(b64d(raw.slice(4)));
    if(!d||!Array.isArray(d.hist))throw 0;
    var ok=d.hist.filter(function(k){return /^\d{4}-\d{2}-\d{2}$/.test(k);}),all={};
    store.get("ss_hist",[]).concat(ok).forEach(function(k){all[k]=1;});
    store.set("ss_hist",Object.keys(all).sort());
    if(d.set&&typeof d.set==="object"){SET=Object.assign(SET,d.set);store.set("ss_set",SET);}
    if(d.theme){store.set("ss_theme",d.theme);applyTheme(d.theme);}
    if(d.rem){store.set("ss_rem",d.rem);$("rem-time").value=d.rem;updateRemLink();}
    syncSettings();renderHome();
    msg.textContent="Готово. Восстановлено занятий: "+ok.length+", всего теперь: "+Object.keys(all).length+".";
  }catch(e){msg.textContent="Не получилось: код повреждён или скопирован не полностью. Он начинается с «SS1:» — вставьте его целиком.";}
}
function syncSettings(){$("opt-beep").checked=!!SET.beep;$("opt-voice").checked=!!SET.voice;$("opt-music").checked=!!SET.music;}
function openSettings(){syncSettings();show("settings");var wm=document.querySelector("#settings .wmain");if(wm)wm.scrollTop=0;}

/* ---------- Quotes splash ---------- */
var QUOTES=[{"t": "Без дисциплины не имеет значения, насколько ты хорош. Без дисциплины ты ничто", "a": "Майк Тайсон", "p": 1}, {"t": "Сильный характер выковывается, только когда преодолеваешь сопротивление — и в спортивном зале, и в жизни", "a": "Арнольд Шварценеггер", "p": 1}, {"t": "Победит не тот, кто сильнее, а тот, кто готов идти до конца", "a": "Федор Емельяненко", "p": 1}, {"t": "Способность побеждать самого себя, без сомнения, является самым ценным из всего, что дарит спорт", "a": "Ольга Корбут", "p": 1}, {"t": "Триумф не дарует настоящей силы, её формирует борьба", "a": "Арнольд Шварценеггер", "p": 1}, {"t": "Я промахнулся более 9000 раз за карьеру. Проиграл почти 300 матчей. 26 раз мне доверяли победный бросок — и я промахивался. Я терпел неудачи снова и снова. Именно поэтому я преуспел", "a": "Майкл Джордан"}, {"t": "Многие люди терпят неудачу только потому, что сдаются в двух шагах от успеха", "a": "Саймон Хартли", "p": 1}, {"t": "Я ненавидел каждую минуту тренировки, но я сказал себе: „Не уходи, страдай сейчас и живи всю оставшуюся жизнь чемпионом“", "a": "Мохаммед Али", "p": 1}, {"t": "Самые трудные дни — это лучшие дни, потому что именно там создаются чемпионы", "a": "Гэби Дуглас", "p": 1}, {"t": "Если ты чувствуешь, что сдаёшься, вспомни, ради чего ты держался до этого", "a": "Джаред Лето", "p": 1}, {"t": "Теннис — это 90% психология. Остальное — техника", "a": "Бьорн Борг", "p": 1}, {"t": "Если ты не контролируешь свой ум, ты не сможешь контролировать игру", "a": "Новак Джокович", "p": 1}, {"t": "Настрой — это всё. Ты можешь быть в лучшей форме, но, если голова сдалась — ты проиграл", "a": "Джон Макинрой", "p": 1}, {"t": "Тело достигает того, во что верит разум", "a": ""}, {"t": "Первый раунд выигрывается не кулаками, а уверенностью", "a": "Джордж Форман", "p": 1}, {"t": "Если ваш уровень не растет, он снижается", "a": "Джим Афремов", "p": 1}, {"t": "Я делаю то, что другие не делают, поэтому завтра сделаю то, чего другие не могут", "a": ""}, {"t": "Начните оттуда, где вы сейчас находитесь. Используйте то, что у вас есть, и делайте всё, что можете", "a": "Артур Эш", "p": 1}, {"t": "Каждый день — это еще один шанс изменить свою жизнь", "a": ""}, {"t": "В каждом матче я играю одинаково — так, как будто это финал", "a": "Лионель Месси", "p": 1}, {"t": "Победа — лучший способ пережить поражение", "a": "Александр Овечкин", "p": 1}, {"t": "Если ты хочешь быть лучше остальных, то приготовься делать то, что остальные не хотят делать", "a": "Майкл Фелпс", "p": 1}, {"t": "Путь к победе нужно спокойно подготовить, тогда и результат будет", "a": "Инна Дериглазова", "p": 1}, {"t": "Мой главный соперник — это я сама. Я всегда боролась только с самой собой", "a": "Елена Исинбаева", "p": 1}, {"t": "Спящему не достанется ничего, кроме снов", "a": "Серена Уильямс", "p": 1}, {"t": "Каждый день надо тренироваться так, чтобы следующая тренировка была лучше прошлой!", "a": ""}, {"t": "Занятия спортом никогда не бывают лишними", "a": ""}, {"t": "Я не перестаю тренироваться, и это с каждой минутой укрепляет мой дух и тело", "a": ""}, {"t": "Мне подвластно покорение любых вершин", "a": ""}, {"t": "Всегда выбирайте самый трудный путь — на нём вы не встретите конкурентов", "a": "Шарль де Голль", "p": 1}, {"t": "Вы можете быть кем угодно, если вы уделите этому время", "a": "Конор Макгрегор", "p": 1}, {"t": "Каждое занятие — ещё один кирпичик в своде твоей стопы", "a": ""}, {"t": "Маленькие шаги каждый день дают большой результат", "a": ""}, {"t": "Сильные стопы — фундамент для всего, что ты захочешь сделать", "a": ""}, {"t": "Сегодняшние полчаса — вклад в то, как ты будешь ходить через десять лет", "a": ""}, {"t": "Не обязательно быть лучшим. Обязательно — не пропускать", "a": ""}, {"t": "Регулярность сильнее таланта", "a": ""}, {"t": "Медаль за неделю достаётся тем, кто не сдаётся на четвёртый день", "a": ""}, {"t": "Тело запоминает то, что ты повторяешь", "a": ""}, {"t": "Сделал сегодня — завтра будет легче", "a": ""}, {"t": "Чемпионы тоже начинали с простых упражнений", "a": ""}, {"t": "Пять минут разминки лучше, чем ноль", "a": ""}, {"t": "Своды стопы растут вместе с тобой — помоги им", "a": ""}];
var splashT=null;
function showSplash(){
  var last=store.get("ss_q",-1),i=Math.floor(Math.random()*QUOTES.length);
  if(QUOTES.length>1&&i===last)i=(i+1)%QUOTES.length;
  store.set("ss_q",i);
  $("q-text").textContent=QUOTES[i].t;
  var au=$("q-author");au.textContent=QUOTES[i].a?(QUOTES[i].p?"— приписывается: ":"— ")+QUOTES[i].a:"";au.hidden=!QUOTES[i].a;
  var sp=$("splash");sp.hidden=false;sp.classList.remove("go");void sp.offsetWidth;sp.classList.add("go");
  var dur=Math.min(11000,Math.max(4500,2000+QUOTES[i].t.length*55));sp.querySelector(".splash-bar i").style.transitionDuration=dur+"ms";
  clearTimeout(splashT);splashT=setTimeout(hideSplash,dur);
}
function hideSplash(){clearTimeout(splashT);var was=!$("splash").hidden;$("splash").hidden=true;if(was)maybeAck();}

/* ---------- Medals ---------- */
var MEDAL='<svg viewBox="0 0 24 28" class="md%C%" aria-hidden="true"><path d="M6 0h5l2 9-4 3z" class="md-r"/><path d="M18 0h-5l-2 9 4 3z" class="md-r"/><circle cx="12" cy="18" r="9" class="md-c"/><text x="12" y="21.5" text-anchor="middle" class="md-t">7</text></svg>';
function medalSvg(off){return MEDAL.replace("%C%",off?" off":"");}
function medalCount(){
  var h=store.get("ss_hist",[]).slice().sort(),n=0,run=0,prev=null;
  h.forEach(function(k){
    var d=new Date(k+"T12:00:00");
    if(prev&&Math.round((d-prev)/86400000)===1)run++;else{n+=Math.floor(run/7);run=1;}
    prev=d;
  });
  return n+Math.floor(run/7);
}

/* ---------- Home ---------- */
function streak(){
  var h=store.get("ss_hist",[]),d=new Date(),c=0;
  if(h.indexOf(dkey(d))<0)d.setDate(d.getDate()-1);
  while(h.indexOf(dkey(d))>=0){c++;d.setDate(d.getDate()-1);}
  return c;
}
function renderHome(){
  var h=store.get("ss_hist",[]),s=streak();
  $("h-streak").textContent=s;
  $("h-streak-w").textContent=plural(s,["день","дня","дней"])+" подряд";
  var cyc=s===0?0:(s%7===0?7:s%7),doneToday=h.indexOf(today())>=0,wk=$("h-week");wk.textContent="";
  for(var i=1;i<=7;i++){
    var c=document.createElement("div");c.className="wk"+(i<=cyc?" on":"");
    if(i===7)c.innerHTML=medalSvg(cyc<7);else c.textContent=i;
    wk.appendChild(c);
  }
  var m=medalCount(),md=$("h-medals");
  md.innerHTML=m?medalSvg(false)+'<span>× '+m+"</span>":medalSvg(true)+"<span>0</span>";
  var left=7-cyc,note;
  if(s===0)note="Занимайся <b>7 дней подряд</b> — получишь медаль. Пропуск дня начинает серию заново.";
  else if(cyc===7&&doneToday)note="<b>Медаль получена!</b> Завтра начинается новая неделя.";
  else if(!doneToday)note="Сегодня ещё не занимались — <b>не прерывай серию</b>. До медали: "+left+" "+plural(left,["день","дня","дней"])+".";
  else note="Сегодня готово. До медали: <b>"+left+" "+plural(left,["день","дня","дней"])+"</b>.";
  $("h-note").innerHTML=note+" Всего занятий: "+h.length+".";
  var pr=store.get("ss_progress",null),rb=$("h-resume");
  if(pr&&pr.date===today()&&(pr.plan||"full")===PLAN&&pr.ex>0&&pr.ex<EX.length&&h.indexOf(today())<0){
    rb.hidden=false;rb.textContent="Продолжить с упражнения "+(pr.ex+1)+" — "+EX[pr.ex].short;rb.dataset.ex=pr.ex;
  }else rb.hidden=true;
}
function planSec(id){return PLANS[id].blocks.reduce(function(a,b){return a+b.ex.reduce(function(x,e){return x+exSec(e);},0);},0);}
function renderTabs(){
  ["short","full"].forEach(function(id){
    var t=$("tab-"+id),n=PLANS[id].blocks.reduce(function(x,b){return x+b.ex.length;},0);
    t.setAttribute("aria-selected",PLAN===id?"true":"false");t.tabIndex=PLAN===id?0:-1;t.setAttribute("aria-controls","h-blocks");
    t.querySelector("small").textContent="≈ "+Math.round(planSec(id)/60)+" мин · "+n+" упр.";
  });
}
function setPlan(id){usePlan(id);store.set("ss_plan",PLAN);buildBlocks();renderTabs();renderHome();}
function buildBlocks(){
  var root=$("h-blocks"),total=0;root.textContent="";
  BLOCKS.forEach(function(b){
    var sec=b.ex.reduce(function(a,e){return a+exSec(e);},0);total+=sec;
    var s=document.createElement("section");s.className="blk";
    s.innerHTML='<div class="blk-h"><span class="blk-n">Блок '+b.n+'</span><h2></h2><span class="blk-t">≈ '+Math.round(sec/60)+' мин</span></div>';
    s.querySelector("h2").textContent=b.name;
    var ol=null;
    b.ex.forEach(function(e){
      if(e.group||!ol){
        if(e.group){var g=document.createElement("p");g.className="sub";g.textContent=e.group;s.appendChild(g);}
        ol=document.createElement("ol");ol.className="exl";s.appendChild(ol);
      }
      var li=document.createElement("li"),bt=document.createElement("button");
      bt.type="button";bt.className="exr";bt.setAttribute("aria-label","Начать с упражнения «"+e.short+"»");
      bt.innerHTML='<span class="exr-i">'+e.num+'</span><span class="exr-b"><span class="exr-n"></span><span class="exr-d"></span></span>'+CHEV;
      bt.querySelector(".exr-n").textContent=e.name;bt.querySelector(".exr-d").textContent=e.dose;
      bt.addEventListener("click",function(){startFrom(e.idx);});
      li.appendChild(bt);ol.appendChild(li);
    });
    root.appendChild(s);
  });
  $("h-meta").textContent=PLANS[PLAN].title+": "+BLOCKS.length+" блока · "+EX.length+" упражнений · ≈ "+Math.round(total/60)+" мин";
}

/* ---------- Views ---------- */
function show(v){
  S.view=v;
  $("work").hidden=v!=="work";$("done").hidden=v!=="done";$("settings").hidden=v!=="settings";
  if(v!=="work"){stopAnim();musicStop();}
  if(v==="home"){renderHome();window.scrollTo(0,0);}
}
function saveProgress(){store.set("ss_progress",{date:today(),ex:S.ex,plan:PLAN});}
function startFrom(i){
  unlock();
  S.ex=i;S.st=0;S.startedAt=0;S.muted=false;S.animEx=-1;settle();
  show("work");render();
  var wm=document.querySelector(".wmain");if(wm)wm.scrollTop=0;
}
function closeWork(){
  S.phase="idle";hush();wake(false);
  if(S.ex>0)saveProgress();
  show("home");
}

/* ---------- Wiring ---------- */
function start(data){
  usePlan(store.get("ss_plan","short"));
  buildBlocks();renderTabs();
  ["short","full"].forEach(function(id){$("tab-"+id).addEventListener("click",function(){if(PLAN!==id)setPlan(id);});
    $("tab-"+id).addEventListener("keydown",function(e){if(e.key==="ArrowLeft"||e.key==="ArrowRight"){var o=id==="short"?"full":"short";setPlan(o);$("tab-"+o).focus();e.preventDefault();}});});
  $("opt-beep").checked=!!SET.beep;$("opt-voice").checked=!!SET.voice;
  $("opt-beep").addEventListener("change",function(e){SET.beep=e.target.checked;store.set("ss_set",SET);if(SET.beep){unlock();tone("ready");}});
  applyTheme(store.get("ss_theme","auto"));
  ["auto","light","dark"].forEach(function(id){$("th-"+id).addEventListener("click",function(){store.set("ss_theme",id);applyTheme(id);});});
  $("opt-music").checked=!!SET.music;
  $("opt-music").addEventListener("change",function(e){SET.music=e.target.checked;store.set("ss_set",SET);updateMusic();});
  $("opt-voice").addEventListener("change",function(e){SET.voice=e.target.checked;store.set("ss_set",SET);loadVoices();if(SET.voice){primed=false;primeSpeech();say("Подсказки включены");}});
  $("h-start").addEventListener("click",function(){unlock();showEquipment();});
  $("eq-go").addEventListener("click",function(){closeSheet("sh-eq");startFrom(0);});
  $("eq-cancel").addEventListener("click",function(){closeSheet("sh-eq");});
  $("sh-eq").addEventListener("click",function(e){if(e.target===this)closeSheet("sh-eq");});
  $("ack-ok").addEventListener("click",function(){store.set("ss_ack",true);closeSheet("sh-ack");});
  $("h-settings").addEventListener("click",openSettings);
  $("s-back").addEventListener("click",function(){show("home");});
  $("h-about").addEventListener("click",function(){$("ack-text").innerHTML=disclaimerHTML();openSheet("sh-ack");});
  $("s-disclaimer").textContent=DISCLAIMER;
  $("s-ver").textContent="Версия "+APP_VERSION+" от "+APP_DATE+".";
  $("h-ver").textContent="Версия "+APP_VERSION;
  $("rem-time").value=store.get("ss_rem","18:00");updateRemLink();
  $("rem-time").addEventListener("change",function(){store.set("ss_rem",this.value);updateRemLink();});
  $("rem-ics").addEventListener("click",downloadICS);
  $("bk-make").addEventListener("click",makeBackup);
  $("bk-copy").addEventListener("click",copyBackup);
  $("bk-restore").addEventListener("click",restoreBackup);

  $("h-resume").addEventListener("click",function(e){startFrom(parseInt(e.currentTarget.dataset.ex,10)||0);});
  $("w-main").addEventListener("click",mainAction);
  $("w-skip").addEventListener("click",skipAction);
  $("w-prev").addEventListener("click",back);
  $("w-close").addEventListener("click",closeWork);
  $("w-mute").addEventListener("click",function(){S.muted=!S.muted;if(S.muted)hush();render();});
  $("d-home").addEventListener("click",function(){show("home");});
  $("splash").addEventListener("click",hideSplash);
  document.addEventListener("keydown",function(e){
    if(e.key==="Escape"){if(!$("sh-eq").hidden){closeSheet("sh-eq");return;}if(S.view==="settings"){show("home");return;}}
    if(S.view!=="work")return;
    if(e.code==="Space"&&e.target.tagName!=="BUTTON"){e.preventDefault();mainAction();}
    else if(e.key==="ArrowRight")skipAction();
    else if(e.key==="ArrowLeft")back();
  });
  document.addEventListener("visibilitychange",function(){
    if(document.hidden){musicStop();return;}
    ensureAudio();updateMusic();
    try{if(canSpeak){window.speechSynthesis.cancel();loadVoices();}}catch(e){}
    if(S.view==="work"&&(S.phase==="run"||S.phase==="manual"))wake(true);
  });
  setInterval(tick,100);
  try{new IntersectionObserver(function(es){animVisible=es[0].isIntersecting;}).observe(document.querySelector(".anim"));}catch(e){}
  document.addEventListener("visibilitychange",function(){if(!document.hidden&&S.view==="work"&&animCur&&!animRAF&&!REDUCED)animRAF=requestAnimationFrame(animLoop);});

  renderHome();
  if(!(data&&data.view))showSplash();
  if(data&&data.view==="work"&&typeof data.ex==="number"){
    startFrom(Math.min(Math.max(0,data.ex),EX.length-1));
    S.st=Math.min(data.st||0,ex().steps.length-1);settle();render();
  }
}
try{if(window.claude&&window.claude.hot&&window.claude.hot.snapshot)window.claude.hot.snapshot(function(){return {view:S.view,ex:S.ex,st:S.st};});}catch(e){}
var hot=window.claude&&window.claude.hot;
if(hot&&hot.ready)hot.ready(start);else start((hot&&hot.data)||{});
