/* «Сильные стопы» — общие помощники: DOM, хранилище, даты, иконки. © 2026 KAKnetuz. Все права защищены. */
"use strict";

/* ---------- Helpers ---------- */
var $=function(id){return document.getElementById(id);};
var store={
  get:function(k,d){try{var v=localStorage.getItem(k);return v==null?d:JSON.parse(v);}catch(e){return d;}},
  set:function(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}
};
function pad(n){return String(n).padStart(2,"0");}
function dkey(d){return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());}
function today(){return dkey(new Date());}
function plural(n,f){var a=Math.abs(n)%100,b=a%10;if(a>10&&a<20)return f[2];if(b>1&&b<5)return f[1];if(b===1)return f[0];return f[2];}
function fmt(s){return s>=60?Math.floor(s/60)+":"+pad(s%60):String(s);}
function now(){return performance.now();}

function stepSec(s){
  switch(s.k){
    case "time": return s.sec+3;
    case "hold": return 3+s.reps*(s.hold+s.relax)-s.relax;
    case "rest": case "breath": return s.sec;
    case "reps": var n=parseInt(s.text,10); return n?Math.max(15,n*2):90;
  }
  return 0;
}
function exSec(e){return e.steps.reduce(function(a,s){return a+stepSec(s);},0)+15;}

var FOOT='<svg viewBox="0 0 20 28" fill="currentColor" aria-hidden="true"><g%T%><path d="M5.2 14.2c0-3.3 2.1-5.3 5.1-5.3s5 2.2 4.6 6.1c-.3 3-1.3 4.2-1.3 7.1 0 3.1-1.7 5.2-4 5.2s-3.8-2.1-3.8-5c0-3.1-.6-4.8-.6-8.1z"/><circle cx="14.4" cy="5.6" r="2.3"/><circle cx="11.1" cy="3.9" r="1.6"/><circle cx="8.4" cy="3.8" r="1.4"/><circle cx="6.1" cy="4.8" r="1.2"/><circle cx="4.3" cy="6.6" r="1.05"/></g></svg>';
function footSvg(side){return FOOT.replace("%T%",side==="R"?' transform="translate(20 0) scale(-1 1)"':"");}
var ICON_VOL='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4.5 4.5 0 0 1 0 6M18 6.5a8 8 0 0 1 0 11"/></svg>';
var ICON_MUTE='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/></svg>';
var CHEV='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>';
