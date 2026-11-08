/* «Сильные стопы» — анимированные схемы упражнений (стиль «оживший набросок»). © 2026 KAKnetuz. Все права защищены. */
"use strict";

/* Одно упражнение — одна цельная сцена.
   Кадр 240×150 (AN.VIEWBOX). Сцена: AN[ключ] = {T: длительность цикла в секундах, focus: подсвечиваемая мышца, f(p): SVG для фазы p ∈ [0, 1]}.
   Персонаж и предметы рисуются в координатах рига (пол — y = 110) и переносятся в кадр камерой (camFit);
   стрелки и подписи рисуются уже в координатах кадра, чтобы их размер не зависел от масштаба сцены.
   Крупный план стопы — только там, где без него движения не понять: либо как вся сцена, либо «лупой» с выноской от стопы персонажа. */
var AN=(function(){
var PI=Math.PI,W=240,H=150,GROUND=142,FLOOR=110;

/* ---------- математика и примитивы ---------- */
function r(d){return d*PI/180;}
function dg(a){return a*180/PI;}
function dv(a){return [Math.sin(r(a)),Math.cos(r(a))];}           // угол от направления «вниз», + — к +x
function mv(p,v,l){return [p[0]+v[0]*l,p[1]+v[1]*l];}
function f1(n){return String(Math.round(n*10)/10);}
function f3(n){return String(Math.round(n*1000)/1000);}
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function ease(p){return (1-Math.cos(2*PI*p))/2;}                   // 0 → 1 → 0 за цикл
function sm(t){t=clamp(t,0,1);return t*t*(3-2*t);}
function seg(p,a,b){return sm((p-a)/(b-a));}
function lerp(a,b,t){return a+(b-a)*t;}
function nrm(v){var l=Math.hypot(v[0],v[1])||1;return [v[0]/l,v[1]/l];}
function rotP(p,c,deg){var a=r(deg),dx=p[0]-c[0],dy=p[1]-c[1];return [c[0]+dx*Math.cos(a)-dy*Math.sin(a),c[1]+dx*Math.sin(a)+dy*Math.cos(a)];}
function ln(a,b,c){return '<line x1="'+f1(a[0])+'" y1="'+f1(a[1])+'" x2="'+f1(b[0])+'" y2="'+f1(b[1])+'" class="'+c+'"/>';}
function ci(c,rr,cls){return '<circle cx="'+f1(c[0])+'" cy="'+f1(c[1])+'" r="'+f1(rr)+'" class="'+cls+'"/>';}
function tx(x,y,t,c,anc){return '<text x="'+f1(x)+'" y="'+f1(y)+'" text-anchor="'+(anc||"middle")+'" class="'+(c||"cap")+'">'+t+"</text>";}
function ik(a,b,l1,l2,side){
  var dx=b[0]-a[0],dy=b[1]-a[1],d=Math.hypot(dx,dy);
  var dd=Math.max(Math.abs(l1-l2)+0.01,Math.min(d,l1+l2-0.01));
  var ang=Math.atan2(dy,dx),A=Math.acos((l1*l1+dd*dd-l2*l2)/(2*l1*dd)),t=ang+side*A;
  var k=[a[0]+l1*Math.cos(t),a[1]+l1*Math.sin(t)],ex=b[0]-k[0],ey=b[1]-k[1],e=Math.hypot(ex,ey)||1;
  return [k,[k[0]+ex/e*l2,k[1]+ey/e*l2]];
}
function smoothPath(pts,closed){
  var n=pts.length,d="M"+f1(pts[0][0])+" "+f1(pts[0][1]),last=closed?n:n-1;
  for(var i=0;i<last;i++){
    var p0=closed?pts[(i-1+n)%n]:pts[Math.max(0,i-1)],p1=pts[i],p2=pts[(i+1)%n],p3=closed?pts[(i+2)%n]:pts[Math.min(n-1,i+2)];
    d+="C"+f1(p1[0]+(p2[0]-p0[0])/6)+" "+f1(p1[1]+(p2[1]-p0[1])/6)+" "+f1(p2[0]-(p3[0]-p1[0])/6)+" "+f1(p2[1]-(p3[1]-p1[1])/6)+" "+f1(p2[0])+" "+f1(p2[1]);
  }
  return d+(closed?"Z":"");
}
function path(d,c){return '<path d="'+d+'" class="'+c+'"/>';}

/* ---------- аннотации (в координатах кадра) ---------- */
function arrow(a,b){
  var dx=b[0]-a[0],dy=b[1]-a[1],L=Math.hypot(dx,dy)||1,ux=dx/L,uy=dy/L;
  var h1=[b[0]-ux*5.5-uy*3.4,b[1]-uy*5.5+ux*3.4],h2=[b[0]-ux*5.5+uy*3.4,b[1]-uy*5.5-ux*3.4];
  return ln(a,[b[0]-ux*3,b[1]-uy*3],"ac")+path("M"+f1(b[0])+" "+f1(b[1])+"L"+f1(h1[0])+" "+f1(h1[1])+"L"+f1(h2[0])+" "+f1(h2[1])+"Z","acf");
}
function arcA(cx,cy,R,a0,a1){ // дуга со стрелкой от угла a0 к a1 (градусы, 0 — вправо, по часовой)
  var p0=[cx+R*Math.cos(r(a0)),cy+R*Math.sin(r(a0))],p1=[cx+R*Math.cos(r(a1)),cy+R*Math.sin(r(a1))];
  var sw=a1>a0?1:0,lg=Math.abs(a1-a0)>180?1:0;
  var t=sw?[-Math.sin(r(a1)),Math.cos(r(a1))]:[Math.sin(r(a1)),-Math.cos(r(a1))],n=[-t[1],t[0]];
  var tip=[p1[0]+t[0]*4,p1[1]+t[1]*4],b1=[p1[0]-t[0]*1.5+n[0]*3.4,p1[1]-t[1]*1.5+n[1]*3.4],b2=[p1[0]-t[0]*1.5-n[0]*3.4,p1[1]-t[1]*1.5-n[1]*3.4];
  return path("M"+f1(p0[0])+" "+f1(p0[1])+"A"+f1(R)+" "+f1(R)+" 0 "+lg+" "+sw+" "+f1(p1[0])+" "+f1(p1[1]),"ac")+
         path("M"+f1(tip[0])+" "+f1(tip[1])+"L"+f1(b1[0])+" "+f1(b1[1])+"L"+f1(b2[0])+" "+f1(b2[1])+"Z","acf");
}
function view(t){return tx(7,12,t,"cap","start");}                 // подпись ракурса — всегда в левом верхнем углу
function note(t,on,x,anc){return tx(x===undefined?233:x,12,t,on?"capa":"cap",anc||"end");} // короткая подпись фазы — в правом верхнем углу
function dot(c){return ci(c,2.3,"acf");}                            // оранжевая точка — опора / неподвижная точка

/* камера: переносит сцену из координат рига в кадр */
function Cam(s,x,y){this.s=s;this.x=x;this.y=y;}
Cam.prototype.g=function(inner){return '<g transform="translate('+f1(this.x)+" "+f1(this.y)+") scale("+f3(this.s)+')">'+inner+"</g>";};
Cam.prototype.p=function(q){return [this.x+this.s*q[0],this.y+this.s*q[1]];};
function camFit(x0,y0,x1,gy,cx,maxS){ // прямоугольник сцены [x0..x1]×[y0..gy] → кадр; пол сцены gy ложится на GROUND
  var s=Math.min((W-16)/(x1-x0),(GROUND-24)/(gy-y0),maxS||9);  // верхняя полоса кадра (до y≈18) — для подписей
  return new Cam(s,(cx===undefined?W/2:cx)-s*(x0+x1)/2,GROUND-s*gy);
}
function floor(y,x0,x1){return ln([x0===undefined?4:x0,y],[x1===undefined?236:x1,y],"fl");}

/* лупа: круглый крупный план с выноской от точки сцены */
function inset(id,c,R,inner,from){
  var s="";
  if(from){var d=nrm([from[0]-c[0],from[1]-c[1]]);s+=ln(from,[c[0]+d[0]*R,c[1]+d[1]*R],"ldr")+ci(from,1.6,"ldrd");}
  s+='<defs><clipPath id="'+id+'"><circle cx="'+f1(c[0])+'" cy="'+f1(c[1])+'" r="'+f1(R-.6)+'"/></clipPath></defs>';
  s+=ci(c,R,"insb")+'<g clip-path="url(#'+id+')">'+inner+"</g>"+ci(c,R,"insr");
  return s;
}

/* ---------- карандашные примитивы ---------- */
var SKSEED=1,FOCUS=null;
function rnd(){var t=SKSEED+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;}
function jit(a){return (rnd()*2-1)*a;}
function jpts(pts,a){return pts.map(function(p){return [p[0]+jit(a),p[1]+jit(a)];});}
function skShape(pts,far,closed){ // заливка + два карандашных штриха
  if(closed===undefined)closed=true;
  var s=closed?path(smoothPath(pts,true),"skf"):"";
  s+=path(smoothPath(jpts(pts,.45),closed),"sk"+(far?" skfar":""));
  s+=path(smoothPath(jpts(pts,.7),closed),"sk sk2"+(far?" skfar":""));
  return s;
}
function ellPts(c,rx,ry,ang,n){var p=[],ca=Math.cos(ang),sa=Math.sin(ang);n=n||14;for(var i=0;i<n;i++){var t=2*PI*i/n,x=rx*Math.cos(t),y=ry*Math.sin(t);p.push([c[0]+x*ca-y*sa,c[1]+x*sa+y*ca]);}return p;}
function skJoint(c,rr){return path(smoothPath(jpts(ellPts(c,rr,rr,0,10),.3),true),"skj");}
function prof(arr,t){for(var i=1;i<arr.length;i++){if(t<=arr[i][0]){var a=arr[i-1],b=arr[i],k=(t-a[0])/(b[0]-a[0]);return a[1]+(b[1]-a[1])*k;}}return arr[arr.length-1][1];}
function limbPts(a,b,PA,PB){
  var d=nrm([b[0]-a[0],b[1]-a[1]]),n=[-d[1],d[0]],L=[],R=[],steps=9;
  for(var i=0;i<=steps;i++){var t=i/steps,c=[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t],wa=prof(PA,t),wb=prof(PB,t);
    L.push([c[0]+n[0]*wa,c[1]+n[1]*wa]);R.push([c[0]-n[0]*wb,c[1]-n[1]*wb]);}
  return L.concat(R.reverse());
}
function sideOf(a,b,v){var d=nrm([b[0]-a[0],b[1]-a[1]]);return (-d[1]*v[0]+d[0]*v[1])>=0?1:-1;}
function axisInfo(a,b,t,PA,PB){var d=nrm([b[0]-a[0],b[1]-a[1]]),n=[-d[1],d[0]],c=[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];return {d:d,n:n,c:c,wa:prof(PA,t),wb:prof(PB,t)};}
function skContour(a,b,t,PA,PB){var q=axisInfo(a,b,t,PA,PB),p1=[q.c[0]+q.n[0]*q.wa,q.c[1]+q.n[1]*q.wa],p2=[q.c[0]-q.n[0]*q.wb,q.c[1]-q.n[1]*q.wb],k=[q.c[0]+q.d[0]*1.6,q.c[1]+q.d[1]*1.6];
  return path("M"+f1(p1[0])+" "+f1(p1[1])+"Q"+f1(k[0]+jit(.3))+" "+f1(k[1]+jit(.3))+" "+f1(p2[0])+" "+f1(p2[1]),"skc");}
function skHatch(a,b,PA,PB,side,t0,t1,dens){ // лёгкая штриховка тени вдоль одной стороны
  var s="",step=dens||.1;
  for(var t=t0;t<=t1;t+=step){var q=axisInfo(a,b,t,PA,PB),w=side>0?q.wa:-q.wb,e=[q.c[0]+q.n[0]*w*.9,q.c[1]+q.n[1]*w*.9],i=[q.c[0]+q.n[0]*w*.3+q.d[0]*1.8,q.c[1]+q.n[1]*w*.3+q.d[1]*1.8];
    s+=ln(e,i,"skh");}
  return s;
}
function skLimb(a,b,PA,PB,far){return skShape(limbPts(a,b,PA,PB),far);}
function skMuscle(a,b,P,side,t0,t1,inset){ // рабочая мышца: оранжевый контур и штриховка
  var d=nrm([b[0]-a[0],b[1]-a[1]]),n=[-d[1]*side,d[0]*side],O=[],I=[],steps=10,s="",i;
  for(i=0;i<=steps;i++){var t=t0+(t1-t0)*i/steps,c=[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t],w=prof(P,t)-.8,m=Math.sin(PI*i/steps);
    O.push([c[0]+n[0]*w,c[1]+n[1]*w]);I.push([c[0]+n[0]*(w-w*inset*m),c[1]+n[1]*(w-w*inset*m)]);}
  for(i=1;i<steps;i++)s+=ln(O[i],I[Math.min(steps,i+1)],"skm");
  return s+path(smoothPath(jpts(O.concat(I.slice().reverse()),.2),true),"skm skmo");
}

/* ---------- персонаж сбоку ---------- */
var THF=[[0,5.9],[.3,5.5],[.8,3.9],[1,3.5]],THB=[[0,6.8],[.22,6.5],[.8,3.9],[1,3.4]];
var SHF=[[0,3.5],[.4,2.9],[1,2]],SHB=[[0,3.4],[.2,4.4],[.45,3.7],[.8,2.1],[1,2.2]];
var THO=[[0,6.6],[.3,5.8],[1,3.7]],THI=[[0,4.4],[.25,4.8],[1,3.5]],SHO=[[0,3.6],[.22,4.2],[.55,3.1],[1,2]],SHI=[[0,3.6],[.2,4.7],[.5,3.3],[1,2.1]];
var UA=[[0,2.8],[1,2.1]],FA=[[0,2.3],[.3,2.5],[1,1.5]],NECK=[[0,2.1],[1,1.9]];
function legPts(hip,L){ // L: {th: угол бедра, kn: сгиб колена, an: угол стопы} или {to: точка лодыжки, side}
  var knee,ank;
  if(L.to){var q=ik(hip,L.to,24,24,L.side||-1);knee=q[0];ank=q[1];}
  else{knee=mv(hip,dv(L.th),24);ank=mv(knee,dv(L.th-(L.kn||0)),24);}
  var s=dg(Math.atan2(ank[0]-knee[0],ank[1]-knee[1]));
  var f=L.fa!==undefined?L.fa:(L.flat?90:s+90+(L.an||0));
  var base=mv(ank,dv(s),2.5);
  return {knee:knee,ank:ank,heel:mv(base,dv(f),-3),toe:mv(base,dv(f),9)};
}
function armPts(sh,A){
  if(A.to){var q=ik(sh,A.to,17,15,A.side||1);return {el:q[0],hand:q[1]};}
  var el=mv(sh,dv(A.sh),17);return {el:el,hand:mv(el,dv(A.sh+(A.el||0)),15)};
}
function footShape(L){ // стопа персонажа сбоку: пятка, свод, подушечка, пальцы
  var f=nrm([L.toe[0]-L.heel[0],L.toe[1]-L.heel[1]]),u=[-f[1],f[0]];
  if((L.ank[0]-L.heel[0])*u[0]+(L.ank[1]-L.heel[1])*u[1]<0)u=[-u[0],-u[1]];
  return function(x,y){return [L.heel[0]+f[0]*x*.92+u[0]*y,L.heel[1]+f[1]*x*.92+u[1]*y];};
}
function akLeg(h,L,far){
  var td=[L.toe[0]-L.heel[0],L.toe[1]-L.heel[1]],sS=sideOf(L.knee,L.ank,td);
  var shv=[L.ank[0]-L.knee[0],L.ank[1]-L.knee[1]],dt=nrm([L.knee[0]-h[0],L.knee[1]-h[1]]),bend=-dt[1]*shv[0]+dt[0]*shv[1];
  var sT=Math.abs(bend)>3?(bend>0?-1:1):sideOf(h,L.knee,td);
  var TA=sT>0?THF:THB,TB=sT>0?THB:THF,SA=sS>0?SHF:SHB,SB=sS>0?SHB:SHF;
  var s=skLimb(h,L.knee,TA,TB,far)+skLimb(L.knee,L.ank,SA,SB,far),P=footShape(L);
  s+=skShape([P(-1.4,2.2),P(-.6,0),P(2.2,-.3),P(5,1),P(9,-.2),P(12.8,.4),P(13,1.4),P(11,2.3),P(7,3.6),P(3.6,5.6),P(.4,5.8)],far);
  if(!far){
    s+=skJoint(L.knee,3.5)+skJoint(L.ank,2.1);
    s+=skContour(L.knee,L.ank,.36,SA,SB)+skContour(h,L.knee,.55,TA,TB);
    s+=skHatch(L.knee,L.ank,SA,SB,-1,.15,.8)+skHatch(h,L.knee,TA,TB,-1,.2,.8);
    if(FOCUS==="calf")s+=skMuscle(L.knee,L.ank,SHB,-sS,.06,.6,.62);
    if(FOCUS==="shin")s+=skMuscle(L.knee,L.ank,SHF,sS,.08,.72,.85);
    if(FOCUS==="quad")s+=skMuscle(h,L.knee,THF,sT,.1,.9,.62);
    if(FOCUS==="arch")s+=path(smoothPath([P(1.6,.9),P(5,2.3),P(8.4,.9)],false),"skm skmw");
  }
  return s;
}
function akArm(sh,A,far){
  var s=skLimb(sh,A.el,UA,UA,far)+skLimb(A.el,A.hand,FA,FA,far);
  var d=nrm([A.hand[0]-A.el[0],A.hand[1]-A.el[1]]);
  s+=skShape(ellPts([A.hand[0]+d[0]*1.7,A.hand[1]+d[1]*1.7],1.8,2.8,Math.atan2(d[1],d[0])+PI/2,10),far);
  if(!far)s+=skJoint(A.el,2.4);
  return s;
}
function akHeadSide(c,up,face){ // голова сбоку: череп, острый подбородок, чёлка и хвостик
  var n=[-up[1],up[0]];if(n[0]*face<0)n=[-n[0],-n[1]];
  function P(x,y){return [c[0]+n[0]*x+up[0]*y,c[1]+n[1]*x+up[1]*y];}
  var s=skShape([P(0,7),P(4.6,5.4),P(6.2,1.4),P(5.8,-1.6),P(4.2,-5.4),P(2.4,-7.4),P(.4,-6.4),P(-2.6,-4.6),P(-5.6,-1.4),P(-6.2,2.4),P(-4.4,5.8)],false);
  s+=path(smoothPath(jpts([P(-1,-6.2),P(-.8,-1),P(-1.6,3.4)],.2),false),"skc");
  s+=path(smoothPath(jpts([P(6.2,-.2),P(3,-.6),P(-.4,-.4)],.2),false),"skc");
  s+=path(smoothPath(jpts([P(-5.6,2),P(-1,6.4),P(3.4,6.6),P(6.4,3.2),P(6.6,.8),P(4.6,2.6),P(2.4,3.4)],.3),false),"sk sk2");
  s+=path(smoothPath(jpts([P(-5.4,3.4),P(-9,2.2),P(-10.6,-3),P(-9.6,-9),P(-7.6,-13)],.35),false),"sk");
  s+=path(smoothPath(jpts([P(-5.6,2),P(-7.6,-1.6),P(-7.8,-7),P(-6.4,-11.4)],.35),false),"sk sk2");
  return s;
}
function akSide(hip,hipF,sh,shF,up,legs,arms,face){
  var s="",n=[-up[1],up[0]];
  var hd=mv(hip,up,39.5),nb=mv(hip,up,31.5);
  if(arms[1])s+=akArm(shF,arms[1],true);
  if(legs[1])s+=akLeg(hipF,legs[1],true);
  var tf=sideOf(hip,nb,[face,0])>0,TF=[[0,6.4],[.32,4.4],[.68,5.4],[1,4.6]],TB=[[0,7],[.3,4.6],[.68,5.1],[1,4.4]];
  s+=skShape(limbPts(mv(hip,up,-2.5),nb,tf?TF:TB,tf?TB:TF),false);
  s+=path(smoothPath(jpts([hip,mv(hip,up,14),nb].map(function(p,i){return i===1?[p[0]-n[0]*1.6*face,p[1]-n[1]*1.6*face]:p;}),.2),false),"skc");
  s+=skShape(limbPts(nb,mv(hip,up,34.5),NECK,NECK),false);
  if(legs[0])s+=akLeg(hip,legs[0],false)+skJoint(hip,5);
  if(arms[0])s+=akArm(sh,arms[0],false);
  return s+akHeadSide(hd,up,face);
}
/* fig: персонаж сбоку. o.hip — тазобедренный сустав ближней ноги; o.tor — наклон корпуса (0 — вертикально, −90 — лёжа на спине головой влево);
   o.legs/o.arms — [ближняя, дальняя]; o.far — смещение дальних конечностей; o.face — куда смотрит (1 — вправо). */
function fig(o){
  var hip=o.hip,t=r(o.tor||0),up=[Math.sin(t),-Math.cos(t)],fs=o.far||[0,0];
  var sh=mv(hip,up,30),hipF=[hip[0]+fs[0],hip[1]+fs[1]],shF=[sh[0]+fs[0],sh[1]+fs[1]];
  var legs=o.legs.map(function(L,i){return legPts(i?hipF:hip,L);});
  var arms=(o.arms||[]).map(function(A,i){return armPts(i?shF:sh,A);});
  var face=o.face||(legs[0]&&(legs[0].toe[0]-legs[0].heel[0])<0?-1:1);
  return {svg:akSide(hip,hipF,sh,shF,up,legs,arms,face),legs:legs,arms:arms,sh:sh,hip:hip,head:mv(hip,up,39.5)};
}
function grounded(build,fy){var g=build(0),m=-1e9;g.legs.forEach(function(L){m=Math.max(m,L.heel[1],L.toe[1]);});return build(fy-m-2.4);}
function walkFig(p,o){ // шаг на месте; пол «едет» под персонажем
  var w=2*PI*p,amp=o.amp||20;
  return grounded(function(hy){
    var legs=[0,1].map(function(i){var ph=w+i*PI,th=amp*Math.sin(ph),c=Math.cos(ph);return {th:th,kn:(o.kn||24)*Math.max(0,c),an:o.an(th,c,i)};});
    return fig({hip:[o.x||120,hy],tor:o.tor||2,far:[-2,-1],legs:legs,arms:o.arms(w,[o.x||120,hy])});
  },FLOOR);
}
function floorDashes(p,speed,x0,x1,y){var d="";for(var k=0;k<16;k++){var x=x0+((k*18-p*speed)%(x1-x0+18)+(x1-x0+18))%(x1-x0+18)-9;if(x>x0&&x<x1-7)d+=ln([x,y+3.5],[x+7,y+3.5],"fl");}return d;}

/* ---------- персонаж спереди / сзади ---------- */
function frontJoints(o){
  var hx=o.x,hy=o.y,J={hips:[[hx-6,hy],[hx+6,hy]],shs:[[hx-9.5,hy-28.5],[hx+9.5,hy-28.5]],knees:[],anks:[],els:[],hds:[]};
  for(var i=0;i<2;i++){var L=o.legs[i],hp=J.hips[i],sd=i?1:-1,knee,ank;
    if(L.tuck){var sk=J.knees[1-i]||[(J.hips[1-i][0]+o.legs[1-i].ank[0])/2-sd*1.5,(hy+o.legs[1-i].ank[1])/2];
      knee=[hp[0]+sd*17,hp[1]+15];ank=[sk[0]+sd*3.4,sk[1]+3];}
    else{ank=L.ank;knee=[(hp[0]+ank[0])/2+sd*1.5,(hp[1]+ank[1])/2];}
    J.knees[i]=knee;J.anks[i]=ank;
    var A=o.arms[i],sh=J.shs[i];
    if(A.hand){var q=ik(sh,A.hand,15,14,sd>0?1:-1);J.els[i]=q[0];J.hds[i]=q[1];}
    else{var el=[sh[0]+sd*15*Math.sin(r(A.a1)),sh[1]+15*Math.cos(r(A.a1))];J.els[i]=el;J.hds[i]=[el[0]+sd*14*Math.sin(r(A.a2)),el[1]+14*Math.cos(r(A.a2))];}}
  if(o.legs[0].tuck){J.anks[0]=[J.knees[1][0]-3.4,J.knees[1][1]+3];}
  return J;
}
function frontFoot(a,sd,o,back){ // стопа спереди (или сзади) в масштабе персонажа; tilt — опора на наружный край, rise — подъём на носки
  var m=-sd,t=o.tilt||0,P,piv=[a[0]-m*5,a[1]+6.9],ang=-m*t,s="";
  function T(q){var p=[a[0]+m*q[0],a[1]+q[1]];return t?rotP(p,piv,ang):p;}
  if(back){var h=o.rise||0;
    if(h>1.2)s+=skShape([[a[0]-5.2,a[1]+5.4],[a[0]+5.2,a[1]+5.4],[a[0]+5.4,a[1]+7.4],[a[0]-5.4,a[1]+7.4]].map(function(q){return [q[0],q[1]];}),false);
    s+=skShape([[-2.6,0],[-3.3,3.6-h],[-2.8,6.4-h],[0,7.3-h],[2.8,6.4-h],[3.3,3.6-h],[2.6,0]].map(T),false);
    return s;}
  P=[[-3,0],[-4.3,3.2],[-5,6.6],[-2,7.3],[1.8,7.5],[5,7],[5.8,5.6],[4.6,3],[3,.4]].map(T);
  s+=skShape(P,false);
  [[1.6,6.2],[3.6,6]].forEach(function(q){var u=T([q[0],q[1]]),v=T([q[0]+.2,7.3]);s+=ln(u,v,"skc");});
  return s;
}
function akHeadFront(c,back){
  function P(x,y){return [c[0]+x,c[1]-y];}
  var s=skShape([P(0,7.6),P(5.6,5.6),P(6.4,1),P(5.4,-2.6),P(3,-5.6),P(0,-7.4),P(-3,-5.6),P(-5.4,-2.6),P(-6.4,1),P(-5.6,5.6)],false);
  if(back){ // затылок: волосы целиком и хвостик по центру
    s+=path(smoothPath(jpts([P(-6.2,3),P(-3,6.6),P(3,6.6),P(6.2,3)],.25),false),"skc");
    s+=path(smoothPath(jpts([P(-5.4,-1),P(-2,-4.8),P(0,-5.4)],.25),false),"skc")+path(smoothPath(jpts([P(5.4,-1),P(2,-4.8),P(0,-5.4)],.25),false),"skc");
    s+=path(smoothPath(jpts([P(0,-.5),P(1.4,-6),P(.6,-12),P(-1,-15)],.3),false),"sk")+path(smoothPath(jpts([P(-.8,-.5),P(-1.2,-6.4),P(-.4,-12.4)],.3),false),"sk sk2");
    return s;}
  s+=path(smoothPath(jpts([P(0,7.4),P(.4,0),P(0,-7)],.2),false),"skc")+path(smoothPath(jpts([P(-5.8,-.4),P(0,-1.2),P(5.8,-.4)],.2),false),"skc");
  s+=path(smoothPath(jpts([P(-6.8,0),P(-6.6,5.6),P(-2,8.4),P(3,8.2),P(6.8,5),P(7,-1.4),P(6.4,-5)],.3),false),"sk sk2");
  s+=path(smoothPath(jpts([P(-6.4,4),P(-3,2),P(0,4.4),P(3,2),P(6.4,4)],.25),false),"sk sk2");
  s+=path(smoothPath(jpts([P(6.6,3),P(8.6,-2),P(8.4,-8),P(7,-11)],.3),false),"sk");
  return s;
}
/* akFront: персонаж спереди (o.back — со спины). o.x,o.y — центр таза; legs[i]: {ank, tilt, rise} или {tuck:1} (согнутая нога у колена опорной);
   arms[i]: {a1: угол плеча от «вниз», a2: угол предплечья} или {hand: точка}. Возвращает {svg, J}. */
function akFront(o){
  var J=frontJoints(o),hx=o.x,hy=o.y,s="",i,feet="";
  s+=skShape([[hx-9,hy-29.5],[hx-7.6,hy-20],[hx-5.4,hy-12],[hx-8.6,hy-3],[hx-9.2,hy+2],[hx,hy+4.5],[hx+9.2,hy+2],[hx+8.6,hy-3],[hx+5.4,hy-12],[hx+7.6,hy-20],[hx+9,hy-29.5],[hx,hy-31]],false);
  s+=path(smoothPath(jpts([[hx,hy-31],[hx+.5,hy-14],[hx,hy+3]],.2),false),"skc");
  if(o.back)s+=path(smoothPath(jpts([[hx-7,hy-25],[hx-4,hy-19],[hx-1.5,hy-21]],.2),false),"skc")+path(smoothPath(jpts([[hx+7,hy-25],[hx+4,hy-19],[hx+1.5,hy-21]],.2),false),"skc");
  else s+=path(smoothPath(jpts(ellPts([hx,hy-12],5.4,1.4,0,12),.2),true),"skc");
  s+=path(smoothPath(jpts(ellPts([hx,hy-1.5],9,2,0,12),.2),true),"skc");
  s+=skShape(limbPts([hx,hy-30],[hx,hy-35],NECK,NECK),false);
  for(i=0;i<2;i++){var sd=i?1:-1,L=o.legs[i],outA=sd<0,TA=outA?THO:THI,TB=outA?THI:THO,SA=outA?SHO:SHI,SB=outA?SHI:SHO,hp=J.hips[i],k=J.knees[i],a=J.anks[i];
    if(L.tilt){var m=-sd;a=rotP(a,[a[0]-m*5,a[1]+6.9],-m*L.tilt);}
    if(L.tuck){s+=skLimb(hp,k,TA,TB,false)+skLimb(k,a,SA,SB,false)+skJoint(k,3.4);
      s+=skShape(ellPts([a[0]-sd*1.5,a[1]+4.2],2.6,4.6,-sd*.35,10),false);continue;}
    s+=skLimb(hp,k,TA,TB,false)+skLimb(k,a,SA,SB,false);
    s+=skJoint(k,3.4)+skContour(k,a,.35,SA,SB)+skContour(hp,k,.5,TA,TB)+skHatch(k,a,SA,SB,outA?-1:1,.15,.8);
    if(FOCUS==="calf"||FOCUS==="shin")s+=skMuscle(k,a,outA?SHI:SHO,outA?-1:1,.08,FOCUS==="calf"?.52:.72,.8);
    if(FOCUS==="quad")s+=skMuscle(hp,k,TA,1,.12,.88,.7);
    feet+=frontFoot(o.back?J.anks[i]:J.anks[i],sd,{tilt:L.tilt,rise:L.rise},o.back);}
  s+=feet;
  for(i=0;i<2;i++){var sd2=i?1:-1;s+=akArm(J.shs[i],{el:J.els[i],hand:J.hds[i]},false)+skJoint(J.shs[i],3);}
  return {svg:s+akHeadFront([hx,hy-40.5],o.back),J:J};
}

/* ---------- крупные планы стопы ---------- */
/* внутренняя сторона стопы; пятка касается пола в (x, y); o: sc — масштаб, arch — подъём свода, s — «укорочение», curl — сгиб пальцев, shin — длина голени */
function footSideSk(x,y,o){
  var sc=o.sc||1.6,s=clamp(o.s||0,-1,1),arch=clamp(o.arch||0,-1,1.8),cu=clamp(o.curl||0,0,1),SL=o.shin||44;
  var Lf=40-7*s,bx=Lf-11,bl=4*cu,ah=3+6*arch+2.5*s,tip=bx+11-4*cu;
  var pts=[[1,.2],[.231*bx,-.75*ah],[.475*bx,-ah],[.731*bx,-.75*ah],[bx,-bl],[bx+4.5,-bl*.5+.1],[tip-2.6,.2],[tip+.9,-1.9],[tip-.8,-4.5],
           [bx+3.2,-6.4-bl*.8],[bx+.4,-7.4-bl],[.6*bx+2,-11.8-2*s-1.6*arch],[12.4,-19.6],[10.6,-26],[10.2,-SL],
           [1.6,-SL],[2.4,-31],[2.2,-24.5],[-.6,-17],[-3.4,-8.5],[-2.6,-2.6]];
  var g='<g transform="translate('+f1(x)+" "+f1(y)+") rotate("+f1(o.rot||0)+" "+f1((o.px||0)*sc)+" 0) scale("+f3(sc)+')">';
  g+=path(smoothPath(pts,true),"ftf");                                                                          // заливка
  g+=path(smoothPath(pts.slice(0,15),false),"ft")+path(smoothPath(pts.slice(15),false),"ft");                   // контур; голень сверху открыта — линия «уходит»
  g+=path("M2 -"+f1(SL-.5)+"L2.2 -"+f1(SL-6),"fsc")+path("M9.8 -"+f1(SL-.5)+"L10 -"+f1(SL-6),"fsc");
  g+='<circle cx="3.2" cy="-5.6" r="5.4" class="fsc"/><circle cx="8.6" cy="-19" r="2.6" class="fsc"/>';      // построение: пятка, лодыжка
  g+=path(smoothPath([[6.6,-17.6],[8.6,-15.6],[10.8,-17.8]],false),"fsd");                                    // внутренняя лодыжка
  g+=path(smoothPath([[4.4,-21],[4.6,-26],[4.2,-SL+5]],false),"fsd");                                         // ахиллово сухожилие
  g+=path(smoothPath([[4.2,-2],[.475*bx,-ah-1.8],[bx-1.4,-2.4-bl]],false),"fsd");                             // линия свода
  g+=path(smoothPath([[11.4,-18.4],[.66*bx+3,-10.2-bl*.3],[bx+1.4,-7-bl]],false),"fsc");                      // сухожилие на подъёме
  g+=path(smoothPath([[bx+3.1,-6.6-bl*.8],[bx+4,-3.6-bl*.6],[bx+3.2,-.6-bl*.4]],false),"fsd");                // основание большого пальца
  g+=path(smoothPath([[tip-5.6,-4.6],[tip-5.1,-2.6],[tip-5.6,-.4]],false),"fsc");                             // сгиб пальца
  g+=path(smoothPath([[tip-4.2,-4.6],[tip-2.6,-5.4],[tip-.8,-4.2]],false),"fsd");                             // ноготь
  for(var k=1;k<=3;k++){var x0=tip-2.4-3*k;g+=path(smoothPath([[x0,-.5],[x0+1.5,.8],[x0+3,-.4]],false),"fsd");}
  if(FOCUS==="arch")g+=path("M3.2 -2.8Q"+f1(0.45*bx)+" "+f1(-2*ah-6.2)+" "+f1(bx-2.4)+" "+f1(-bl-3)+"Q"+f1(0.45*bx)+" "+f1(-2*ah-2.2)+" 3.2 -2.8Z","mhl");
  return g+"</g>";
}
function footGeo(o){var s=clamp(o.s||0,-1,1),arch=clamp(o.arch||0,-1,1.8),cu=clamp(o.curl||0,0,1),bx=29-7*s;return {bx:bx,ah:3+6*arch+2.5*s,tip:bx+11-4*cu};}
function soleY(o,xl){var g=footGeo(o);return (xl<=0||xl>=g.bx)?0:-g.ah*Math.sin(PI*xl/g.bx);} // подошва в координатах стопы (≤ 0)
function restOnCircle(X,o,c,R,floorY){ // высота пятки, при которой подошва ложится на круг (мяч, скалку) и не проваливается в пол
  var sc=o.sc||1.6,g=footGeo(o),Y=floorY;
  for(var xl=-2;xl<=g.tip;xl+=.5){var wx=X+sc*xl,dx=wx-c[0];if(Math.abs(dx)<R)Y=Math.min(Y,c[1]-Math.sqrt(R*R-dx*dx)-sc*soleY(o,xl));}
  return Y;
}
/* стопа сверху (тыл) / снизу (подошва); пятка в начале координат, пальцы вверх */
function footTopSk(x,y,o){
  var sc=o.sc||1,c=o.cls||"ft",det=(c==="ft"||c==="solea");
  var s='<g transform="translate('+f1(x)+" "+f1(y)+") rotate("+f1(o.rot||0)+") scale("+f3((o.mir?-1:1)*sc*(o.sx||1))+" "+f3(sc*(o.sy||1))+')">';
  s+=path("M-6.8 -3C-9 -14 -10.2 -28 -9.6 -37L8.6 -40C10.2 -34 6.8 -24 6.2 -14C5.8 -5 4.6 1.5 0 1.5C-4.4 1.5 -6.2 0 -6.8 -3Z",c);
  [[5.6,-45.2,3.3,4.8,4],[.9,-46.8,1.85,3.4,0],[-2.8,-45.8,1.7,3.1,-5],[-6,-43.8,1.55,2.8,-12],[-8.7,-40.9,1.4,2.4,-24]].forEach(function(t){
    s+='<ellipse cx="'+t[0]+'" cy="'+t[1]+'" rx="'+t[2]+'" ry="'+t[3]+'" transform="rotate('+t[4]+" "+t[0]+" "+t[1]+')" class="'+c+'"/>';
    if(det&&!o.sole)s+='<ellipse cx="'+t[0]+'" cy="'+f1(t[1]-t[3]*.42)+'" rx="'+f1(t[2]*.55)+'" ry="'+f1(t[3]*.34)+'" transform="rotate('+t[4]+" "+t[0]+" "+t[1]+')" class="fsd"/>';
  });
  if(det&&!o.sole){s+=path("M-9.4 -36.6Q0 -40.8 8.8 -39","fsc")+'<circle cx="0" cy="-5" r="5.2" class="fsc"/>';
    [[5.4,-40.2],[.9,-41.8],[-2.8,-41],[-6,-39.4]].forEach(function(t){s+=path("M"+f1(t[0]*.3)+" -16L"+t[0]+" "+t[1],"fsc");});}
  if(det&&o.sole)s+=path("M-5.6 -6Q0 -2.6 4.4 -6","fsc")+path("M-8.6 -33Q0 -37 7.8 -35","fsc")+path("M4.6 -28Q3 -18 4.2 -9","fsd"); // пяточная подушка, подушечки, свод
  return s+(o.extra||"")+"</g>";
}
/* голень и стопа спереди; внутренняя сторона — к центру кадра (sd = −1 — левая в кадре нога). o: tilt — наружный край, lift — подъём, curl — пальцы поджаты */
function legFrontInner(cx,sd,cu,op){
  var m=sd<0?1:-1,X=function(v){return f1(cx+m*v);},I=cx+m*7.5,O=cx-m*7.5,s="";op=op||{};
  s+=path("M"+f1(O)+" 0C"+f1(O-m*3.5)+" 16 "+f1(O-m*2.5)+" 34 "+X(-5.5)+" 58L"+X(-5)+" 80L"+X(5)+" 80L"+X(5.5)+" 60C"+f1(I+m*1.5)+" 40 "+f1(I+m*5)+" 20 "+f1(I)+" 0","ftf");
  s+=path("M"+f1(O)+" 0C"+f1(O-m*3.5)+" 16 "+f1(O-m*2.5)+" 34 "+X(-5.5)+" 58L"+X(-5)+" 80","ft")+path("M"+X(5)+" 80L"+X(5.5)+" 60C"+f1(I+m*1.5)+" 40 "+f1(I+m*5)+" 20 "+f1(I)+" 0","ft");
  s+=path("M"+X(-5.6)+" 79C"+X(-6.8)+" 86 "+X(-10.2)+" 90 "+X(-9.8)+" 96.5L"+X(11.4)+" 96.5C"+X(11.8)+" 90 "+X(7.2)+" 86 "+X(5.4)+" 78Z","ft");
  s+=path("M"+X(1)+" 6C"+X(2.6)+" 30 "+X(2)+" 55 "+X(1.4)+" 76","fsd");                                          // гребень большеберцовой
  s+=path("M"+X(5.1)+" 73Q"+X(8.4)+" 78 "+X(5.5)+" 83","fsd")+path("M"+X(-5.1)+" 76.5Q"+X(-8.1)+" 81.5 "+X(-5.4)+" 86","fsd"); // лодыжки: внутренняя выше
  [[8.4,95],[3.6,95.6],[-.2,95.8],[-3.8,95.9]].forEach(function(t){s+=path("M"+X(1.2)+" 83.5L"+X(t[0])+" "+t[1],"fsc");});
  [[8.3,5.6,94.6],[3.6,3.7,95.6],[-.2,3.4,95.8],[-3.8,3.1,96],[-7.2,2.8,96.4]].forEach(function(t){
    var c=cx+m*t[0],w=t[1]/2,top=t[2],bot=102.2-4.6*(cu||0);
    s+=path("M"+f1(c-w)+" "+f1(top+1.6)+"Q"+f1(c-w)+" "+f1(top)+" "+f1(c)+" "+f1(top)+"Q"+f1(c+w)+" "+f1(top)+" "+f1(c+w)+" "+f1(top+1.6)+"L"+f1(c+w*.92)+" "+f1(bot-1.4)+"Q"+f1(c)+" "+f1(bot+.4)+" "+f1(c-w*.92)+" "+f1(bot-1.4)+"Z","ft");
    if(!cu)s+=path("M"+f1(c-w*.55)+" "+f1(top+2.4)+"Q"+f1(c)+" "+f1(top+1.2)+" "+f1(c+w*.55)+" "+f1(top+2.4)+"L"+f1(c+w*.5)+" "+f1(top+4.2)+"Q"+f1(c)+" "+f1(top+4.8)+" "+f1(c-w*.5)+" "+f1(top+4.2)+"Z","fsd");
  });
  if(FOCUS==="shin"&&!op.cuff)s+=path("M"+X(-2.5)+" 8C"+X(-6.5)+" 26 "+X(-5)+" 48 "+X(-2.5)+" 66C"+X(0)+" 48 "+X(.5)+" 26 "+X(-2.5)+" 8Z","mhl");
  if(op.cuff)s+=path("M"+f1(O-m*1)+" -2C"+f1(O-m*3.6)+" 16 "+f1(O-m*2.9)+" 30 "+f1(O-m*2.1)+" 40Q"+f1(cx)+" 42.6 "+f1(I+m*3.3)+" 39C"+f1(I+m*4.6)+" 24 "+f1(I+m*3.8)+" 10 "+f1(I+m*1)+" -2Z","cloth")+
     path("M"+f1(O-m*2.1)+" 40Q"+f1(cx)+" 42.6 "+f1(I+m*3.3)+" 39","sk")+path("M"+f1(O-m*2.6)+" -2C"+f1(O-m*5)+" 16 "+f1(O-m*4.2)+" 30 "+f1(O-m*3.4)+" 40","stripe");
  if(op.edge){var e="M"+X(-5.6)+" 80C"+X(-6.8)+" 86 "+X(-10.2)+" 90 "+X(-9.8)+" 96.5";s+=path(e,"edgeg")+path(e,"edgel");}
  return s;
}
function legFront(cx,sd,o){ // поворот вокруг наружного края стопы (опора на ребро), пол — y = 102
  var h=o.lift||0,t=(o.tilt||0)*(sd<0?-1:1),px=cx+sd*12,s="";
  var inner=rotP([cx-sd*12,102],[px,102],t),show=Math.abs(t)>1&&h<0.5;
  if(show)s+=path("M"+f1(px)+" 102L"+f1(inner[0])+" "+f1(inner[1])+"L"+f1(inner[0])+" 102Z","gap");
  s+='<g transform="rotate('+f1(t)+" "+f1(px)+' 102) translate(0 '+f1(-h)+')">'+legFrontInner(cx,sd,o.curl,o)+"</g>";
  if(show)s+=dot([px,102]);
  return s;
}

/* ---------- лёжа на спине, вид со стороны стоп ---------- */
/* Камера стоит у стоп и смотрит вдоль тела: ближе всего подошвы, дальше — ноги, корпус и голова (перспектива).
   o.feet[i]: {rot: поворот вокруг пятки внутрь (°), inv: разворот подошвы внутрь 0..1}; i=0 — левая в кадре стопа (правая нога). */
function lieEndBody(spread){
  var s=path("M42 147L98 5H142L198 147Z","mat"),c=120;   // коврик в перспективе: тело лежит, ноги к зрителю
  s+=skShape([[c-16,20],[c-8,9],[c,7],[c+8,9],[c+16,20],[c+13,29],[c,32],[c-13,29]],true);           // волосы на полу
  s+=skShape(ellPts([c,21],7.6,8.6,0,16),false)+path(smoothPath(jpts([[c-5,24],[c,27.6],[c+5,24]],.2),false),"skc");
  s+=skShape(limbPts([c,28],[c,36],[[0,3],[1,3.4]],[[0,3],[1,3.4]]),false);
  s+=skShape([[c-22,40],[c-9,35.5],[c,35],[c+9,35.5],[c+22,40],[c+18,52],[c+14,62],[c+17,72],[c,75],[c-17,72],[c-14,62],[c-18,52]],false);  // корпус
  s+=path(smoothPath(jpts([[c,37],[c+.5,55],[c,73]],.2),false),"skc")+path(smoothPath(jpts(ellPts([c,63],9,1.6,0,12),.2),true),"skc");
  [-1,1].forEach(function(sd){s+=skLimb([c+sd*21,41],[c+sd*(26+spread*4),58],[[0,3.6],[1,3]],[[0,3.6],[1,3]],false)+skLimb([c+sd*(26+spread*4),58],[c+sd*(28+spread*6),76],[[0,3],[1,2.6]],[[0,3],[1,2.6]],false)+
    skShape(ellPts([c+sd*(28.5+spread*6),80],2.6,4,0,10),false);});
  return s;
}
function lieEnd(o){
  var c=120,s=lieEndBody(0),feet="";
  [-1,1].forEach(function(sd,i){
    var F=o.feet[i],heel=[c+sd*21,134],hip=[c+sd*8,73];
    s+=skLimb(hip,[c+sd*20,118],[[0,8.4],[.45,7.6],[1,6.4]],[[0,8.4],[.45,7.6],[1,6.4]],false);   // нога уходит от зрителя
    var rot=-sd*(F.rot||0),inv=F.inv||0,sx=Math.cos(r(68*inv)),cls=o.sole?"solea":"ft";
    feet+=footTopSk(heel[0]-sd*inv*3,heel[1],{sc:1.1,rot:rot-sd*10*inv,mir:sd>0?1:0,sx:sx,cls:cls,sole:1});
    if(inv>.05){ // ребро стопы, которое становится видно при развороте подошвы
      var e=[heel[0]+sd*(6.4*sx+1.8),heel[1]];feet+=path(smoothPath(jpts([[e[0],e[1]-2],[e[0]+sd*2.2*inv,e[1]-24],[e[0]+sd*1.4*inv,e[1]-44]],.2),false),"fsd");}
  });
  return s+feet;
}

/* ---------- предметы ---------- */
function chair(x,y,gy){gy=gy||FLOOR;return path("M"+f1(x-16)+" "+f1(y)+"H"+f1(x+16),"pr")+ln([x-15,y],[x-15,y-36],"pr")+ln([x-13,y+1],[x-13,gy],"pr")+ln([x+13,y+1],[x+13,gy],"pr")+ln([x-15,y+3],[x+13,y+3],"prf");}
function chairBack(x,y,gy){ // стул сзади: спинка и ножки
  return ln([x-12,y],[x+12,y],"pr")+ln([x-11,y],[x-11,gy],"pr")+ln([x+11,y],[x+11,gy],"pr")+ln([x-11,y+18],[x+11,y+18],"pr")+ln([x-11,y+8],[x+11,y+8],"prf");}
function wallV(x,y0,y1,sideSign){ // стена: линия и штриховка с обратной стороны
  var s=ln([x,y0],[x,y1],"wall");for(var y=y0+4;y<y1;y+=7)s+=ln([x,y],[x+sideSign*5,y-5],"wallh");return s;}
function spikyBall(c,R,rot){var s="";for(var i=0;i<14;i++){var a=rot+i*PI/7;s+=ln([c[0]+R*Math.cos(a),c[1]+R*Math.sin(a)],[c[0]+(R+2.2)*Math.cos(a),c[1]+(R+2.2)*Math.sin(a)],"pr");}return s+ci(c,R,"ball");}

/* ======================================================================
   СЦЕНЫ
   ====================================================================== */
var A={};

/* ---------- сидя на стуле: общая поза ---------- */
function seatedFig(fa,an){
  var x=96,sy=86,hip=[x+2,sy-3];
  return fig({hip:hip,tor:-2,far:[-3,-1],legs:[{th:61,kn:0,fa:fa,an:an},{th:61,kn:0,fa:fa,an:an}],arms:[{to:[x+16,sy+4]},{to:[x+14,sy+4]}],face:1});
}
var CAM_SEAT=camFit(76,34,166,112);

/* 1. Круги стопами: сидя, пятки на полу, носок описывает круг — первую половину цикла внутрь, вторую наружу */
A.circles={T:6,focus:"shin",f:function(p){
  var dir=p<0.5?1:-1,th=2*PI*((p*2)%1)*dir,cam=CAM_SEAT;
  var g0=seatedFig(0),L=g0.legs[0],base=mv(L.ank,dv(61),2.5);
  var c=mv(base,dv(138),8.4),tg=[c[0]+4.6*Math.cos(th),c[1]+7.6*Math.sin(th)];
  var fa=dg(Math.atan2(tg[0]-base[0],tg[1]-base[1])),g=seatedFig(fa);
  var vc=cam.p(c),R=7.6*cam.s+6,a0=dg(th)%360;
  var s=cam.g(chair(96,86,112)+floor(112,46,196)+g.svg);
  s+=dir>0?arcA(vc[0],vc[1],R,-150,110):arcA(vc[0],vc[1],R,110,-150);
  s+=dot(cam.p(g.legs[0].heel));
  return s+note(dir>0?"круги внутрь":"круги наружу",true);
}};

/* 2. Носки от себя — на себя */
A.noski={T:2.6,focus:"shin",f:function(p){
  var u=ease(p),cam=CAM_SEAT,an=lerp(22,-46,u),g=seatedFig(undefined,an);
  var L=g.legs[0],vt=cam.p(L.ank),going=(p%1)<0.5;
  var s=cam.g(chair(96,86,112)+floor(112,46,196)+g.svg);
  s+=going?arcA(vt[0],vt[1],30,-75,5):arcA(vt[0],vt[1],30,5,-75);
  s+=dot(cam.p(L.heel));
  return s+note(going?"от себя":"на себя",true);
}};

/* 3–4. Ходьба на носках и на пятках */
var CAM_STAND=camFit(80,6,160,FLOOR);
A.soldier={T:1.2,focus:"calf",f:function(p){
  var cam=CAM_STAND,g=walkFig(p,{kn:22,an:function(){return -56;},arms:function(w,h){return [{to:[h[0]+2,h[1]-3],side:-1},{to:[h[0],h[1]-3],side:-1}];}});
  var s=cam.g(floor(FLOOR,60,180)+floorDashes(p,36,60,180,FLOOR)+g.svg);
  g.legs.forEach(function(L){if(L.toe[1]>FLOOR-3)s+=dot(cam.p(L.toe));});
  return s;
}};
A.penguin={T:1.3,focus:"shin",f:function(p){
  var cam=CAM_STAND,g=walkFig(p,{amp:12,kn:12,an:function(){return 34;},arms:function(w,h){return [{to:[h[0]-6,h[1]+1],side:1},{to:[h[0]-4,h[1]+1],side:1}];}});
  var s=cam.g(floor(FLOOR,60,180)+floorDashes(p,28,60,180,FLOOR)+g.svg);
  g.legs.forEach(function(L){if(L.heel[1]>FLOOR-3)s+=dot(cam.p(L.heel));});
  return s;
}};

/* 5. Медвежонок: спереди, шаг на наружных краях стоп; лупа — те же голени крупно */
var HANDS_ON_HIPS=[{a1:40,a2:-35},{a1:40,a2:-35}];
/* 5. Медвежонок: героиня в три четверти идёт на наружных краях стоп, руки на поясе; лупа спереди показывает те же стопы в той же фазе.
   Отдельный риг этой сцены (координаты рига: таз в (0,0), пол y = 53), по художественному эталону: топ, леггинсы с полосой, хвост. */
var BW={f:[.62,.3],l:[.46,-.18],w:[.5,.3],a:8,lift:6,roll:14};   // f — куда смотрит стопа, w — ось шага (к зрителю), l — «влево» для героини               // ось шага (вперёд — к зрителю вправо), ось «влево», полшага, подъём, крен стопы
function bwGait(p,i){ // фаза ноги: опора (стопа едет назад) → перенос (стопа поднимается и выносится вперёд)
  var s=(p+i/2)%1;
  if(s<0.5)return {u:BW.a*(1-4*s),lift:0,stance:1,k:s/0.5};
  var k=(s-0.5)/0.5;return {u:-BW.a+2*BW.a*sm(k),lift:BW.lift*Math.sin(PI*k),stance:0,k:k};
}
function bwP(o,x,z,y){return [o[0]+BW.f[0]*x+BW.l[0]*z,o[1]+BW.f[1]*x+BW.l[1]*z-y];}  // точка стопы (x вперёд, z влево, y вверх) → кадр
function bwFoot(ank,right,roll,curl){ // стопа почти в профиль (три четверти), стоит на наружном крае: внутренний край приподнят на roll°
  var base=[ank[0],ank[1]+6.6],cu=curl||0,F=[.9,.24],Lw=[.46,-.18],zi=right?5.4:-5.4,lift=Math.abs(zi)*Math.sin(r(roll));
  function P(x,y,z){z=z||0;return [base[0]+F[0]*x+Lw[0]*z,base[1]+F[1]*x+Lw[1]*z-y-(z?lift*Math.abs(z)/Math.abs(zi):0)];}
  var tip=13.4-1.4*cu,s="";
  s+=path(smoothPath([P(1.6,0),P(9.4,0),P(6.4,0,zi*.9)],true),"gap");                                                               // просвет под приподнятым внутренним краем
  var out=[P(-3.2,1.6),P(-2.4,0),P(3,0),P(9,0),P(11.6,.15),P(tip,.8+cu*.8),P(tip+.1,1.8+cu),P(tip-1.3,2.5+cu*.6),P(9.4,2.9),P(6,3.9),P(2.8,5.6),P(1,7.6),P(-1.4,7.8),P(-3.2,4.6)];
  s+=skShape(out,false);
  for(var k=0;k<3;k++){var x=tip-1.6-1.9*k;s+=path(smoothPath([P(x-.8,2.4+cu*.4-.2*k),P(x+.4,1.2+cu*.4),P(x,.3+cu*.3)],false),"fsd");}   // пальцы
  s+=path(smoothPath(jpts([P(1.6,6.2),P(5.4,4),P(10.2,2.5)],.12),false),"skc");                                                         // сухожилие подъёма
  s+=path(smoothPath([P(-.6,5.6),P(-1.6,4.3),P(-.4,3.2)],false),"skc");                                                                  // лодыжка
  var e=[P(-2.6,0),P(3,0),P(9,0),P(11.6,.2)];
  s+=path(smoothPath(e,false),"edgeg")+path(smoothPath(e,false),"edgel");                                                                // наружный край — опора
  return s;
}
var BW_TO=[[0,4.8],[.25,4.9],[.7,3.9],[1,3.1]],BW_TI=[[0,3.8],[.2,4.2],[.7,3.4],[1,3]],BW_SO=[[0,3],[.25,3.5],[.6,2.6],[1,1.8]],BW_SI=[[0,3],[.2,3.7],[.55,2.8],[1,1.9]];
function sub(P,k){var o=[];for(var i=0;i<=6;i++){var t=i/6;o.push([t,prof(P,t*k)]);}return o;}
function bwIK(hip,ank3){ // колено в 3D: шаг идёт к зрителю (ось z), колено сгибается вперёд; затем проекция в кадр
  var d=[ank3[0]-hip[0],ank3[1]-hip[1],ank3[2]],D=Math.hypot(d[0],d[1],d[2]),L1=27,L2=26,DD=Math.min(D,L1+L2-.05),e=[d[0]/D,d[1]/D,d[2]/D];
  var v=[-e[2]*e[0],-e[2]*e[1],1-e[2]*e[2]],vl=Math.hypot(v[0],v[1],v[2])||1;v=[v[0]/vl,v[1]/vl,v[2]/vl];
  var a=(L1*L1-L2*L2+DD*DD)/(2*DD),h=Math.sqrt(Math.max(0,L1*L1-a*a)),k=[hip[0]+e[0]*a+v[0]*h,hip[1]+e[1]*a+v[1]*h,e[2]*a+v[2]*h];
  function pr(q){return [q[0]+BW.w[0]*q[2],q[1]+BW.w[1]*q[2]];}
  var A3=[hip[0]+e[0]*DD,hip[1]+e[1]*DD,e[2]*DD];
  return [pr(k),pr(A3)];
}
function bwLeg(hip,ank3,right,g){
  var q=bwIK(hip,ank3),knee=q[0],a=q[1],TA=right?BW_TO:BW_TI,TB=right?BW_TI:BW_TO,SA=right?BW_SO:BW_SI,SB=right?BW_SI:BW_SO,C=[knee[0]+(a[0]-knee[0])*.62,knee[1]+(a[1]-knee[1])*.62];
  var s=skShape(limbPts(knee,a,SA,SB),false);                                                                       // голень (кожа)
  var ht=[hip[0]+(knee[0]-hip[0])*.06,hip[1]+(knee[1]-hip[1])*.06];
  s+=skShapeF(limbPts(ht,knee,TA,TB),"cloth")+skShapeF(limbPts(knee,C,sub(SA,.62),sub(SB,.62)),"cloth");          // леггинсы до середины икры
  s+=path(smoothPath(jpts([[C[0]-prof(SA,.62)*.98,C[1]+.3],[C[0],C[1]+1.2],[C[0]+prof(SB,.62)*.98,C[1]+.2]],.1),false),"sk");   // край леггинсов
  var d=nrm([knee[0]-hip[0],knee[1]-hip[1]]),n=[-d[1],d[0]],d2=nrm([C[0]-knee[0],C[1]-knee[1]]),n2=[-d2[1],d2[0]],w1=right?1:-1;
  s+=path(smoothPath([[hip[0]+n[0]*w1*4.4,hip[1]+n[1]*w1*4.4],[knee[0]+n[0]*w1*3.4+n2[0]*w1*.2,knee[1]+n[1]*w1*3.4],[C[0]+n2[0]*w1*prof(SA,.62)*.8,C[1]+n2[1]*w1*prof(SA,.62)*.8]],false),"stripe"); // полоса по наружному шву
  s+=skContour(knee,a,.78,SA,SB)+skJoint(knee,3);
  if(FOCUS==="shin")s+=skMuscle(knee,a,right?BW_SO:BW_SI,right?1:-1,.08,.58,.62);
  return {svg:s+bwFoot(a,right,BW.roll,.35),knee:knee,ank:a};
}
function bwArm(sh,el,hd){ // тонкая рука: плечо и предплечье; кисть рисуется отдельно поверх пояса
  return skShape(limbPts(sh,el,[[0,2.3],[.5,2.1],[1,1.8]],[[0,2.3],[.5,2.1],[1,1.8]]),false)+skShape(ellPts(el,1.9,1.9,0,10),false)+
         skShape(limbPts(el,hd,[[0,1.8],[.35,1.9],[1,1.3]],[[0,1.8],[.35,1.8],[1,1.3]]),false);
}
function bwHand(el,hd){var d=nrm([hd[0]-el[0],hd[1]-el[1]]);return skShape(ellPts([hd[0]+d[0]*1.3,hd[1]+d[1]*1.3],1.6,2.5,Math.atan2(d[1],d[0])+PI/2,10),false);}
function skShapeF(pts,fc){return path(smoothPath(pts,true),fc)+path(smoothPath(jpts(pts,.45),true),"sk")+path(smoothPath(jpts(pts,.7),true),"sk sk2");}
function bwHead(c,sway){
  function P(x,y){return [c[0]+x,c[1]+y];}
  var s="",tail=[P(-5.4,-7.6),P(-10,-9.4+sway*.3),P(-13.8,-6+sway*.6),P(-14.6,-.6+sway),P(-16.4,4.4+sway*1.3),P(-13.6,2.2+sway),P(-11.6,-2.6+sway*.6),P(-9.6,-6.4),P(-6.2,-5.4)];
  s+=skShape(tail,false)+path(smoothPath(jpts([P(-7,-7.2),P(-11.4,-6.4+sway*.5),P(-13.4,-1+sway*.9)],.2),false),"skc");        // хвост качается в такт шагу
  s+=skShape([P(-5.8,-1),P(-5.6,2.6),P(-3.6,5.6),P(.6,7.8),P(3.6,6.2),P(5.6,3),P(6.4,-.6),P(6,-4.6),P(3.6,-7.2),P(0,-8),P(-3.8,-7),P(-6,-4.4)],false);
  s+=path(smoothPath(jpts([P(-7,1.6),P(-7.6,-4),P(-5.6,-8.6),P(-1,-10.6),P(4,-9.8),P(7.2,-6.4),P(7.6,-1.6)],.25),false),"sk");          // волосы
  [[-6.4,-4.6,-4.4,-2.4],[-3.6,-8.6,-1.6,-2.2],[.2,-9.6,1.8,-3],[3.4,-9,4.6,-2.4],[6,-7,6.8,-.8]].forEach(function(b){s+=path(smoothPath(jpts([P(b[0],b[1]),P((b[0]+b[2])/2+.6,(b[1]+b[3])/2),P(b[2],b[3])],.15),false),"sk sk2");}); // чёлка
  s+=path(smoothPath(jpts([P(-6.6,-2.6),P(-7.2,1.6),P(-6.2,5.2)],.15),false),"sk sk2")+ci(P(-5.4,-7.6),1.1,"skj");                       // прядь у лица, резинка
  [[-2.4,.6,2.5],[3.3,.5,2.1]].forEach(function(e){s+=path("M"+f1(c[0]+e[0]-e[2]/2)+" "+f1(c[1]+e[1])+"Q"+f1(c[0]+e[0])+" "+f1(c[1]+e[1]-1.1)+" "+f1(c[0]+e[0]+e[2]/2)+" "+f1(c[1]+e[1]+.2),"eye")+
    '<ellipse cx="'+f1(c[0]+e[0]+.2)+'" cy="'+f1(c[1]+e[1]+.9)+'" rx="'+f1(e[2]*.26)+'" ry="'+f1(e[2]*.38)+'" class="iris"/>'+
    path("M"+f1(c[0]+e[0]-e[2]/2)+" "+f1(c[1]+e[1]-2.1)+"Q"+f1(c[0]+e[0])+" "+f1(c[1]+e[1]-2.9)+" "+f1(c[0]+e[0]+e[2]/2)+" "+f1(c[1]+e[1]-2.2),"skc");});   // глаза и брови
  s+=path("M"+f1(c[0]+2.3)+" "+f1(c[1]+2.4)+"l.5 1.2","skc")+path("M"+f1(c[0]+.4)+" "+f1(c[1]+4.7)+"Q"+f1(c[0]+1.6)+" "+f1(c[1]+5.4)+" "+f1(c[0]+2.8)+" "+f1(c[1]+4.6),"skc");  // нос, улыбка
  return s;
}
function bwFigure(p){
  var sw=-1.3*Math.sin(2*PI*p),bob=.9*Math.cos(4*PI*p),P0=[sw,bob],s="";
  function Q(x,y){return [P0[0]+x,P0[1]+y];}
  var G=[bwGait(p,0),bwGait(p,1)],base=[[-6.6,59],[6.4,58.5]],legs=[];
  for(var i=0;i<2;i++){var B=base[i],g=G[i];legs[i]={hip:i?Q(5.4,.6):Q(-5.6,0),ank:[B[0],B[1]-g.lift-6.6,g.u],g:g};}   // лодыжка в 3D: x, y, глубина
  // сначала дальняя (левая для героини, справа в кадре) нога, затем ближняя
  s+='<ellipse cx="1" cy="58.4" rx="20" ry="2.6" class="shd"/>';
  var L1=bwLeg(legs[1].hip,legs[1].ank,false,legs[1].g),L0=bwLeg(legs[0].hip,legs[0].ank,true,legs[0].g);
  s+=G[0].u<G[1].u?L0.svg+L1.svg:L1.svg+L0.svg;                       // ближняя к зрителю нога рисуется поверх
  var shL=Q(-7.6,-27.6),shR=Q(7.4,-28),hipL=Q(-7.6,-5.4),hipR=Q(7.2,-5.4),elL=Q(-14.4,-15.6),elR=Q(14,-16);
  s+=bwArm(shR,elR,hipR)+bwArm(shL,elL,hipL);                                                                  // руки под корпусом, кисти — поверх пояса
  var pel=[Q(-6.6,-6),Q(-3,-5.4),Q(3,-5.6),Q(6.4,-6.2),Q(8.6,-1),Q(9.4,3.8),Q(5.4,7.4),Q(.4,8.6),Q(-4.6,7.4),Q(-9.6,3.8),Q(-8.8,-1)];
  s+=path(smoothPath(pel,true),"cloth")+path(smoothPath(jpts([Q(-9.4,4.6),Q(-8.8,-1),Q(-6.6,-6),Q(0,-5.4),Q(6.4,-6.2),Q(8.6,-1),Q(9.2,4.6)],.35),false),"sk")+path(smoothPath(jpts([Q(.2,-3.6),Q(.5,3),Q(.3,7.4)],.15),false),"skc");   // таз леггинсов без нижнего контура   // пояс и бёдра леггинсов
  s+=path(smoothPath(jpts([Q(-6.4,-4.2),Q(0,-3.4),Q(6.2,-4.4)],.15),false),"skc");                                                          // резинка пояса
  s+=skShape([Q(-6.4,-6),Q(-5.6,-12),Q(-6.4,-19.4),Q(6.2,-19.8),Q(5.6,-12),Q(6.2,-6.4)],false)+ci(Q(-.2,-10),.5,"skj");                   // живот, пупок
  s+=path(smoothPath(jpts([Q(-6.4,-21),Q(0,-20.2),Q(6.2,-21.4)],.15),false),"skc");
  s+=skShape(limbPts(Q(.6,-29),Q(1.4,-34.2),NECK,NECK),false)+skShape([Q(-9,-28.2),Q(-5.4,-30),Q(0,-30.6),Q(5.6,-30.2),Q(8.8,-28.6),Q(7.4,-24.6),Q(-7.6,-24.2)],false);   // плечи и шея
  s+=skShapeF([Q(-6.6,-19.2),Q(-7.6,-23.6),Q(-6.6,-28),Q(-3.6,-27.4),Q(-1,-25.4),Q(1.6,-25.4),Q(4,-27.6),Q(6.6,-28.4),Q(7.4,-23.8),Q(6.4,-19.6),Q(0,-18.8)],"top"); // топ
  s+=bwHand(elR,hipR)+bwHand(elL,hipL);
  s+=bwHead(Q(1.8,-40.6),1.4*Math.sin(2*PI*p+1));
  return {svg:s,legs:[L0,L1],G:G};
}
A.bear={T:1.6,focus:"shin",f:function(p){
  var cam=new Cam(1.19,58,70.2),F=bwFigure(p),s=cam.g(F.svg);
  // лупа: те же стопы спереди, в той же фазе (левая в кадре — правая нога героини)
  var inner='<g transform="translate(180 18) scale(.98) translate(-178 0)">'+'<ellipse cx="178" cy="102.4" rx="56" ry="3" class="shd"/>'+
    legFront(156,-1,{tilt:BW.roll,lift:1.7*F.G[0].lift,curl:.35,cuff:1,edge:1})+legFront(200,1,{tilt:BW.roll,lift:1.7*F.G[1].lift,curl:.35,cuff:1,edge:1})+"</g>";
  var foot=F.G[0].stance?F.legs[0].ank:F.legs[1].ank;
  s+=inset("insBear",[181,79],56,inner,cam.p([foot[0]+4,foot[1]+6]));
  var a0=cam.p([24,56.6]);s+=arrow([a0[0],a0[1]],[a0[0]+18,a0[1]+4]);                                                                     // направление шага по полу
  return s+note("наружные края стоп",true);
}};

/* 6. Ходьба с перекатом: пятка → вся стопа → носок; оранжевая точка — где сейчас опора */
A.rollwalk={T:1.6,focus:"arch",f:function(p){
  var cam=CAM_STAND,g=walkFig(p,{amp:19,an:function(th,c){var w=sm((0.3-c)/0.6);return w*th*1.1+(1-w)*6;},arms:function(w){return [{sh:-14*Math.sin(w),el:14},{sh:14*Math.sin(w),el:14}];}});
  var s=cam.g(floor(FLOOR,60,180)+floorDashes(p,34,60,180,FLOOR)+g.svg);
  g.legs.forEach(function(L){
    var hy=L.heel[1],ty=L.toe[1];if(Math.max(hy,ty)<FLOOR-3)return;
    var P=footShape(L),q=Math.abs(hy-ty)<1.5?P(6.5,0):(hy>ty?P(0,0):P(12.6,0));s+=dot(cam.p(q));});
  return s;
}};

/* 7–9. Лёжа на спине — вид со стороны стоп */
A.ladoshki={T:3.2,focus:"shin",f:function(p){
  var u=sm(Math.min(1,ease(p)*1.25)),cam=new Cam(1,0,0);
  var cam=new Cam(.88,14.4,17),s=lieEnd({feet:[{inv:u,rot:6*u},{inv:u,rot:6*u}],sole:1});
  var going=(p%1)<0.5;
  var hl=cam.p([99,134]),hr=cam.p([141,134]);s=cam.g(s);
  s+='<g opacity="'+f1(Math.abs(Math.sin(2*PI*p)))+'">'+(going?arcA(hl[0],hl[1],52,-100,-76)+arcA(hr[0],hr[1],52,-80,-104):arcA(hl[0],hl[1],52,-76,-100)+arcA(hr[0],hr[1],52,-104,-80))+"</g>";
  return s+view("со стороны стоп")+note("подошвы внутрь",u>.5);
}};
A.claps={T:1.6,f:function(p){
  var u=sm(Math.min(1,ease(p)*1.3)),c=120,s=lieEndBody(0),hit=u>0.92;
  [-1,1].forEach(function(sd){
    var hp=[c+sd*9,74],knee=[c+sd*44,50],ank=[lerp(c+sd*24,c+sd*9,u),lerp(112,96,u)];
    s+=skLimb(hp,knee,[[0,8],[1,5.8]],[[0,8],[1,5.8]],false)+skJoint(knee,4)+skLimb(knee,ank,[[0,5.6],[.3,6.4],[1,3.6]],[[0,5.6],[.3,6.4],[1,3.6]],false);
    var ang=lerp(0,90,u)*(sd<0?-1:1),pts=[[-8,0],[8,0],[8.6,7],[0,9.6],[-8.6,7]].map(function(q){return rotP([ank[0]+q[0],ank[1]+q[1]+1],ank,ang);});
    s+=skShape(pts,false);
    var e1=rotP([ank[0]-7,ank[1]+9.6],ank,ang),e2=rotP([ank[0]+7,ank[1]+9.6],ank,ang);s+=ln(e1,e2,"ac");                   // подошва
  });
  var cam=new Cam(.88,14.4,17),P=function(q){return cam.p(q);};s=cam.g(s);
  if(hit)s+=ln(P([c,84]),P([c,77]),"ac")+ln(P([c-6,86]),P([c-11,80]),"ac")+ln(P([c+6,86]),P([c+11,80]),"ac");
  else s+='<g opacity="'+f1(1-u)+'">'+arrow(P([c-30,126]),P([c-15,110]))+arrow(P([c+30,126]),P([c+15,110]))+"</g>";
  return s+view("со стороны стоп")+note("хлопок подошвами",hit);
}};
A.wipers={T:2.4,f:function(p){
  var a=30*ease(p),s="";
  s+=lieEnd({feet:[{rot:a},{rot:a}]});
  s+=footTopSk(99,134,{sc:1.1,cls:"gh",sole:1})+footTopSk(141,134,{sc:1.1,mir:1,cls:"gh",sole:1});
  var cam=new Cam(.88,14.4,17),hl=cam.p([99,134]),hr=cam.p([141,134]),going=(p%1)<0.5;
  s=cam.g(s)+dot(hl)+dot(hr);
  s+=going?arcA(hl[0],hl[1],53,-88,-64)+arcA(hr[0],hr[1],53,-92,-116):arcA(hl[0],hl[1],53,-64,-88)+arcA(hr[0],hr[1],53,-116,-92);
  return s+view("со стороны стоп")+note("пятки на месте",true);
}};

/* ---------- сидя: крупный план стопы ---------- */
/* 10. Гусеница: пальцы сгибаются — пятка подтягивается, стопа «ползёт» вперёд, затем назад */
A.caterpillar={T:7,focus:"arch",f:function(p){
  var q=p*6,k=Math.min(5,Math.floor(q)),sub=q-k,h,sh;
  function st(t){if(t<0.5){var a=sm(t/0.5);return {h:7*a,s:a};}return {h:7,s:1-sm((t-0.5)/0.5)};}
  if(k<3){var a=st(sub);h=k*7+a.h;sh=a.s;}else{var b=st(1-sub);h=(5-k)*7+b.h;sh=b.s;}
  var cam=new Cam(1.62,-34,-36),x=46+h*1.6,m="";
  for(var i=0;i<5;i++)m+=ln([40+i*26,FLOOR+1],[40+i*26,FLOOR+4],"fl");
  var s=cam.g(floor(FLOOR,26,164)+m+footSideSk(x,FLOOR,{sc:1.6,s:sh,curl:sh*0.9,shin:40}));
  return s+(k<3?arrow([176,24],[214,24]):arrow([214,24],[176,24]))+note(k<3?"вперёд":"назад",true,170);
}};
/* 11. Собери платок: пальцы подгребают полотенце, груз на дальнем краю приближается */
A.towel={T:6,focus:"arch",f:function(p){
  var q=p*4,k=Math.min(3,Math.floor(q)),sub=q-k,cu=ease(sub);
  var pulled=(k+sm(Math.min(1,sub/0.5)))*8,E=196-pulled,hx=36,s=floor(108,33,207);
  var amp=1.5+pulled/10,bunch="M"+(hx-6)+" 106";
  for(var x=hx-6;x<=hx+46;x+=2)bunch+="L"+x+" "+f1(106-Math.abs(Math.sin((x-hx)/52*PI*(2+k)))*amp);
  s+=path(bunch+"L"+f1(hx+64)+" 106L"+f1(E)+" 106","twl");
  s+='<rect x="'+f1(E-2)+'" y="82" width="12" height="22" rx="3" class="prf"/><rect x="'+f1(E+1.5)+'" y="76" width="5" height="7" rx="1" class="prf"/>';
  s+=footSideSk(hx,104,{sc:1.6,curl:cu,shin:52});
  var cam=new Cam(1.3,-36,0);
  return cam.g(s)+arrow(cam.p([E-14,96]),cam.p([E-36,96]));
}};
/* 12. Уборка: спереди; пальцы захватывают предмет, нога переносит его в коробку со стороны большого пальца */
A.cleanup={T:5,focus:"arch",f:function(p){
  var ang,cu=0,carry=false,lift=0,drop=-1,k;
  // фазы: к предмету → захват → перенос → отпустить → назад
  var aItem=4.8,aBox=-14;
  if(p<0.15){ang=lerp(0,aItem,sm(p/0.15));}
  else if(p<0.3){ang=aItem;cu=sm((p-0.15)/0.1);carry=p>0.25;}
  else if(p<0.62){var k=sm((p-0.3)/0.32);ang=lerp(aItem,aBox,k);cu=1;carry=true;lift=22*sm(k*2.2);}
  else if(p<0.75){ang=aBox;cu=1-sm((p-0.62)/0.08);drop=sm((p-0.64)/0.11);lift=22;}
  else{var k2=sm((p-0.75)/0.25);ang=lerp(aBox,0,k2);lift=22*(1-sm(k2*1.6));}
  var cx=70,pivot=[cx,-90],s=floor(102,0,172),k=(102-lift)/102;   // подъём стопы сидя — голень укорачивается в перспективе
  s+=path("M102 86V102H134V86","pr")+ln([102,98],[134,98],"prf")+ci([111,95],2.6,"ball")+ci([121,96],2.6,"ball");          // коробка со стороны большого пальца
  s+=ci([30,99.5],2.6,"ball")+'<rect x="37" y="97" width="9" height="5" rx="1.2" class="ball"/>';                           // остальные предметы
  var toe=rotP([cx+1.6,102*k],pivot,ang);
  if(!carry&&drop<0&&p<0.3)s+=ci([toe[0],99.5],2.8,"ball");
  s+='<g transform="rotate('+f1(ang)+" "+f1(pivot[0])+" "+f1(pivot[1])+') scale(1 '+f3(k)+')">'+legFrontInner(cx,-1,cu)+"</g>";
  if(carry)s+=ci([toe[0],toe[1]-1.5],2.8,"ball");
  if(drop>=0&&drop<1)s+=ci([toe[0],lerp(toe[1]-1.5,96,drop)],2.8,"ball");
  var cam=new Cam(1.3,8,9.4);
  var arr=p<0.3?"":p<0.62?arrow(cam.p([96,46]),cam.p([126,46])):p>0.75?arrow(cam.p([126,46]),cam.p([96,46])):"";
  return cam.g(s)+arr;
}};
/* 13. Скалка: стопа катит скалку от пальцев к пятке с нажимом, затем короткие движения под сводом */
A.rollpin={T:6,focus:"arch",f:function(p){
  var o={sc:1.7,shin:38},R=7.5,cx=120,fy=FLOOR,g=footGeo(o),L=g.tip*o.sc,u,X;
  if(p<0.6){u=ease(p/0.6);X=cx-L*0.85+(L*0.78)*u;}else{u=0.5+0.5*Math.sin(2*PI*(p-0.6)/0.2);X=cx-g.bx*o.sc*0.62+6*u;}
  var c=[cx,fy-R],Y=restOnCircle(X,o,c,R,fy),rot=(X-(cx-L))/R;
  var s=floor(fy,21,219)+ci(c,R,"pin")+ci(c,R*.45,"prf")+ln([c[0]+R*.45*Math.cos(rot),c[1]+R*.45*Math.sin(rot)],[c[0]+R*Math.cos(rot),c[1]+R*Math.sin(rot)],"pr")+footSideSk(X,Y,o)+dot([c[0],c[1]-R]);
  var cam=new Cam(1.15,-18,15.5),mv2=Math.cos(p<0.6?2*PI*p/0.6:2*PI*(p-0.6)/0.2)<0;
  return cam.g(s)+(mv2?arrow([196,28],[224,28]):arrow([224,28],[196,28]))+note(p<0.6?"от пальцев к пятке":"под сводом",true);
}};
/* 14. Ёжик: катаем мячик, затем захватываем пальцами и поднимаем */
A.hedgehog={T:6,focus:"arch",f:function(p){
  var o={sc:1.7,shin:38,curl:0},R=11,cx=118,fy=FLOOR,X,Y,lift=0,bc=[cx,fy-R],phase1=p<0.5,s;
  if(phase1){var u=ease(p/0.5);X=cx-44+26*u;Y=restOnCircle(X,o,bc,R,fy);}
  else{ // пятка на полу, стопа ложится на мяч, пальцы обхватывают его спереди; затем нога поднимает мяч и держит
    var t=(p-0.5)/0.5;o.curl=sm(t/0.2)*(1-sm((t-0.88)/0.12));lift=16*seg(t,0.25,0.42)*(1-seg(t,0.72,0.88));
    var g=footGeo(o),d=o.sc*(g.bx+2),rise=2*R-o.sc*4*o.curl,th=-dg(Math.asin(clamp(rise/d,0,.9)));
    X=cx-d*Math.cos(r(th));Y=fy-lift;bc=[cx,fy-R-lift];o.rot=th;o.px=0;}
  s=floor(fy,21,219)+spikyBall(bc,R,X/R)+footSideSk(X,Y,o);
  var cam=new Cam(1.15,-18,15.5);
  s=cam.g(s);
  if(phase1)s+=(Math.cos(2*PI*p/0.5)<0?arrow([196,28],[224,28]):arrow([224,28],[196,28]));
  else if(lift>2&&lift<15.5)s+=arrow([206,118],[206,90]);
  return s+note(phase1?"1. катаем мячик":(lift>15.5?"2. держим 5 секунд":"2. захват пальцами"),true);
}};
/* 15. Художник: карандаш между первым и вторым пальцами рисует домик на листе (вид сверху) */
A.artist={T:6,focus:"arch",f:function(p){
  var pth=[[138,60],[180,60],[180,38],[159,20],[138,38],[138,60]],segs=[],tot=0,i;
  for(i=1;i<pth.length;i++){var l=Math.hypot(pth[i][0]-pth[i-1][0],pth[i][1]-pth[i-1][1]);segs.push(l);tot+=l;}
  var q=Math.min(1,p/0.82)*tot,drawn=[pth[0]],tipP=pth[0];
  for(i=1;i<pth.length;i++){
    if(q>=segs[i-1]){drawn.push(pth[i]);q-=segs[i-1];tipP=pth[i];}
    else{var t=q/segs[i-1];tipP=[lerp(pth[i-1][0],pth[i][0],t),lerp(pth[i-1][1],pth[i][1],t)];drawn.push(tipP);break;}
  }
  var sc=1.2,off=[-2*sc,-62*sc],heel=[tipP[0]-off[0],tipP[1]-off[1]];
  var pen0=[heel[0]-1.6*sc,heel[1]-43*sc];
  var s='<rect x="116" y="10" width="86" height="64" rx="2" class="pap"/>'+path("M"+drawn.map(function(q){return f1(q[0])+" "+f1(q[1]);}).join("L"),"ac");
  s+=footTopSk(heel[0],heel[1],{sc:sc,mir:1});
  s+=ln(pen0,tipP,"pen")+ci(tipP,1.8,"acf");
  return s+view("вид сверху");
}};

/* ---------- стоя ---------- */
/* 16. Короткая стопа: пятка и пальцы на полу, подушечка подтягивается к пятке, свод поднимается «мостиком» */
A.shortfoot={T:4,focus:"arch",f:function(p){
  var u=sm(Math.min(1,ease(p)*1.3)),sc=2.6,x=28,y=118,o={sc:sc,arch:1.7*u,s:0.45*u,shin:34};
  var g=footGeo(o),ax=x+0.45*g.bx*sc,ballX=x+g.bx*sc,tipX=x+g.tip*sc;
  var s=floor(y+.5,8,232);
  s+=footSideSk(x,y,{sc:sc,shin:34}).replace(/class="(ft|ftf|fsd|fsc)"/g,'class="gh"');
  s+=path("M"+f1(x+2)+" "+f1(y)+"Q"+f1(ax)+" "+f1(y-2*g.ah*sc+4)+" "+f1(ballX-2)+" "+f1(y)+"Z","gap");
  s+=footSideSk(x,y,o)+dot([x+2,y])+dot([tipX-4,y]);
  s+='<g opacity="'+f1(0.2+0.8*u)+'">'+arrow([ax,y-4],[ax,y-8-g.ah*sc*0.9])+arrow([ballX+14,y+10],[ballX-18,y+10])+"</g>";
  return s+note(u>0.5?"свод вверх, пальцы ровно":"свод расслаблен",u>0.5)+view("сбоку, изнутри");
}};
/* 17. Подъём на носки с мячом между лодыжками — со спины: видно, что пятки остаются ровными */
A.raise={T:2.6,focus:"calf",f:function(p){
  var u=ease(p),h=9*u,cam=camFit(52,6,176,FLOOR,118);
  var ay=102.6-h,b=akFront({x:110,y:57-h,back:1,legs:[{ank:[104,ay],rise:h},{ank:[116,ay],rise:h}],arms:[{a1:8,a2:4},{hand:[128,52]}]});
  var s=cam.g(floor(FLOOR,60,170)+chairBack(139,52,FLOOR)+b.svg+ci([110,ay-1],3.6,"ball")+ln([104,ay-12],[104,ay+8],"acd")+ln([116,ay-12],[116,ay+8],"acd"));
  var top=cam.p([110,6]);
  s+='<g opacity="'+f1(Math.abs(Math.sin(2*PI*p)))+'">'+(Math.sin(2*PI*p)>0?arrow([top[0]-40,58],[top[0]-40,40]):arrow([top[0]-40,40],[top[0]-40,58]))+"</g>";
  return s+view("со спины")+note("пятки ровно",u>.5);
}};
/* 18. Перекаты: с полной стопы на наружные края и обратно — спереди, лупа на стопы */
A.rollouts={T:2.8,focus:"shin",f:function(p){
  var u=ease(p),t=16*u,cam=camFit(0,6,100,FLOOR,62);
  var b=akFront({x:50,y:57,legs:[{ank:[43,102.6],tilt:t},{ank:[57,102.6],tilt:t}],arms:HANDS_ON_HIPS});
  var s=cam.g(floor(FLOOR,22,78)+b.svg);
  var inner='<g transform="translate(178 20) scale(.98) translate(-178 0)">'+floor(102,120,236)+legFront(156,-1,{tilt:t})+legFront(200,1,{tilt:t})+"</g>";
  s+=inset("insRoll",[178,82],56,inner,cam.p([50,FLOOR-2]));
  return s+note(u>.5?"на наружных краях":"на всей стопе",u>.5);
}};
/* 19. Канатоходец: приставной шаг боком по палке; лупа сбоку — палка под внутренним сводом */
A.tightrope={T:8,focus:"arch",f:function(p){
  var q=p*8,k=Math.min(7,Math.floor(q)),sub=q-k,dir=k<4?1:-1,j=k<4?k:k-4;
  var c=k<4?42+9*j:78-9*j,lead=dir>0?1:0;
  var a=sm(Math.min(1,sub/0.5)),b=sm(Math.max(0,(sub-0.5)/0.5)),feet=[c-6,c+6],lift=[0,0];
  feet[lead]+=dir*9*a;feet[1-lead]+=dir*9*b;lift[lead]=5*Math.sin(PI*a);lift[1-lead]=5*Math.sin(PI*b);
  var hx=(feet[0]+feet[1])/2,ay=97.4,cam=camFit(2,-10,120,FLOOR,64);
  var fg=akFront({x:hx,y:ay-45.4,legs:[{ank:[feet[0],ay-lift[0]]},{ank:[feet[1],ay-lift[1]]}],arms:[{a1:58,a2:78},{a1:58,a2:78}]});
  var s=cam.g(floor(FLOOR,8,124)+'<rect x="16" y="104.6" width="104" height="5.4" rx="2.7" class="pin"/>'+fg.svg);
  var o={sc:1.5,arch:1.4,shin:40},sx=150,stick=[sx+0.45*footGeo(o).bx*1.5,103];
  var inner=floor(110,120,236)+ci(stick,6.4,"pin")+footSideSk(sx,restOnCircle(sx,o,stick,6.4,110),o);
  s+=inset("insRope",[180,80],52,'<g transform="translate(180 82) scale(1.08) translate(-180 -84)">'+inner+"</g>",cam.p([feet[1],FLOOR-4]));
  s+=dir>0?arrow([28,18],[52,18]):arrow([52,18],[28,18]);
  return s+note("палка под сводом",true);
}};
/* 20. Цапля: стоим на одной ноге, другая согнута; опорная стопа не заваливается внутрь */
A.heron={T:3.2,focus:"calf",f:function(p){
  var rot=1.6*Math.sin(2*PI*p),cam=camFit(66,4,174,FLOOR);
  var b=akFront({x:120,y:57,legs:[{ank:[114,102.6]},{tuck:1}],arms:[{a1:90,a2:94},{a1:90,a2:94}]});
  var s=cam.g(floor(FLOOR,70,170)+'<g transform="rotate('+f1(rot)+' 114 109)">'+b.svg+"</g>"+ln([114,80],[114,108],"acd"));
  s+=dot(cam.p([114,FLOOR]));
  return s+note("стопа не заваливается",true);
}};

/* ---------- у стены ---------- */
/* 21. Пять точек: прижаться к стене, затем отойти на шаг и сохранить осанку */
A.fivepoints={T:6,f:function(p){
  var away=26*(seg(p,0.5,0.62)-seg(p,0.85,0.97)),cam=camFit(30,4,150,FLOOR);
  var mv1=p>0.5&&p<0.62,mv2=p>0.85&&p<0.97,ph=mv1?(p-0.5)/0.12:mv2?(p-0.85)/0.12:0,sw=(mv1||mv2)?12*Math.sin(PI*ph):0;
  var g=grounded(function(hy){return fig({hip:[64+away,hy],tor:0,far:[-1,0],legs:[{th:sw,kn:0,flat:1},{th:-sw,kn:0,flat:1}],arms:[{sh:5,el:0},{sh:5,el:0}],face:1});},FLOOR);
  var s=cam.g(wallV(56,2,FLOOR,-1)+floor(FLOOR,40,150)+g.svg);
  if(away<1){var pu=2+0.8*Math.sin(2*PI*p*3);[g.head[1]-1,g.sh[1]+6,g.hip[1]+1].forEach(function(y){s+=ci(cam.p([57.2,y]),pu,"acf");});}
  else s+=(mv1?arrow(cam.p([90,40]),cam.p([110,40])):mv2?arrow(cam.p([110,40]),cam.p([90,40])):"");
  return s+note(away<1?"затылок, лопатки, ягодицы у стены":"держим осанку",true);
}};
/* 22. Ангел на стене: руки и спина прижаты к стене, руки скользят вверх и вниз */
A.angel={T:4,f:function(p){
  var u=ease(p),a1=lerp(92,156,u),a2=lerp(180,172,u),cam=camFit(66,0,174,FLOOR);
  var b=akFront({x:120,y:58,legs:[{ank:[113,102.6]},{ank:[127,102.6]}],arms:[{a1:a1,a2:a2},{a1:a1,a2:a2}]});
  var s=cam.g('<rect x="70" y="2" width="100" height="108" class="wallp"/>'+floor(FLOOR,60,180)+b.svg);
  var up=(p%1)<0.5,el=cam.p(b.J.els[0]),er=cam.p(b.J.els[1]),y0=Math.max(el[1],34);
  s+=up?arrow([el[0]-12,y0+10],[el[0]-12,y0-8])+arrow([er[0]+12,y0+10],[er[0]+12,y0-8]):arrow([el[0]-12,y0-8],[el[0]-12,y0+10])+arrow([er[0]+12,y0-8],[er[0]+12,y0+10]);
  return s+view("спиной к стене")+note("руки не отрываются от стены",true);
}};
/* 23. Стульчик у стены: спина скользит по стене до угла в коленях ~100–110°, мяч между коленями */
A.wallsit={T:5,focus:"quad",f:function(p){
  var u=seg(p,0.08,0.38)-seg(p,0.72,0.96),hip=[64,lerp(68,86,u)],cam=camFit(36,4,132,FLOOR);
  var g=fig({hip:hip,tor:0,far:[-2,0],legs:[{to:[97,104.5],side:-1,flat:1},{to:[95,104.5],side:-1,flat:1}],arms:[{sh:6,el:4},{sh:6,el:4}],face:1});
  var kn=g.legs[0].knee,s=cam.g(wallV(56,2,FLOOR,-1)+floor(FLOOR,40,140)+g.svg+ci([kn[0]+3.6,kn[1]-1],4.4,"ball"));
  var dn=p<0.4,up=p>0.7;
  if(dn||up){var a=cam.p([48,40]);s+=dn?arrow([a[0],a[1]],[a[0],a[1]+24]):arrow([a[0],a[1]+24],[a[0],a[1]]);}
  return s+note(u>0.9?"держим":"",true);
}};

/* ---------- заминка ---------- */
/* 24. Велосипед лёжа */
A.bike={T:2.2,focus:"quad",f:function(p){
  var hip=[126,103],th=-2*PI*p,c=[hip[0]+14,hip[1]-42],R=10,cam=camFit(70,46,166,FLOOR);
  var legs=[0,1].map(function(i){var a=th+i*PI;return {to:[c[0]+R*Math.cos(a),c[1]+R*Math.sin(a)],side:-1,an:18*Math.sin(a)};});
  var g=fig({hip:hip,tor:-90,legs:legs,arms:[{sh:93,el:0},{sh:93,el:0}]});
  var vc=cam.p(c);
  return cam.g(floor(109,60,180)+g.svg)+arcA(vc[0],vc[1],R*cam.s+14,-40,60);
}};
/* 25. Растяжка икры с полотенцем: сидя, полотенце на передней части стопы, тянем на себя */
A.stowel={T:4,focus:"calf",f:function(p){
  var u=ease(p),hip=[66,104],an=lerp(0,20,u),hand=[lerp(101,96,u),lerp(80,78,u)],cam=camFit(30,50,140,FLOOR);
  var g=fig({hip:hip,tor:lerp(8,-3,u),far:[-2,-1],legs:[{th:90,kn:0,an:an},{th:90,kn:0,an:an}],arms:[{to:hand,side:1},{to:[hand[0]-2,hand[1]],side:1}],face:1});
  var L=g.legs[0],fd=nrm([L.toe[0]-L.heel[0],L.toe[1]-L.heel[1]]),n=[-fd[1],fd[0]];
  var t1=[L.toe[0]+n[0]*3,L.toe[1]+n[1]*3],t2=[L.heel[0]+fd[0]*7+n[0]*3,L.heel[1]+fd[1]*7+n[1]*3],hd=g.arms[0].hand;
  var s=cam.g(floor(FLOOR,30,140)+g.svg+path("M"+f1(hd[0])+" "+f1(hd[1])+"L"+f1(t1[0])+" "+f1(t1[1])+"L"+f1(t2[0])+" "+f1(t2[1])+"L"+f1(hd[0]+1)+" "+f1(hd[1]+2),"twl"));
  var a=cam.p([hd[0]+4,hd[1]-10]);
  return s+'<g opacity="'+f1(Math.max(0,Math.sin(2*PI*p)))+'">'+arrow(a,[a[0]-22,a[1]])+"</g>";
}};
/* 26. Растяжка у стены: задняя нога прямая, пятка прижата к полу */
A.swall={T:4,focus:"calf",f:function(p){
  var u=ease(p),hx=lerp(116,124,u),bk=[90,104.5],d=hx-bk[0],cam=camFit(72,6,174,FLOOR);
  var hy=bk[1]-Math.sqrt(Math.max(0,47.6*47.6-d*d)),tor=dg(Math.atan2(d,bk[1]-hy));
  var g=fig({hip:[hx,hy],tor:tor,far:[1,0],legs:[{to:bk,side:-1,flat:1},{to:[146,104.5],side:-1,flat:1}],arms:[{to:[163,50],side:1},{to:[162,52],side:1}],face:1});
  var s=cam.g(wallV(165,2,FLOOR,1)+floor(FLOOR,70,170)+g.svg);
  s+=dot(cam.p(g.legs[0].heel));
  var a=cam.p([hx-26,hy-12]);
  return s+'<g opacity="'+f1(Math.max(0,Math.sin(2*PI*p)))+'">'+arrow(a,[a[0]+16,a[1]])+"</g>"+note("пятка прижата к полу",true);
}};
/* 27. Тряпочки: ноги вверх, встряхиваем стопы, затем медленное дыхание */
A.rags={T:14,f:function(p){ // 4 с встряхиваем, затем один медленный вдох на 4 и выдох на 6
  var SH=4/14,shake=p<SH,w=2*PI*p*45,j=shake?1:0,cam=camFit(70,40,166,FLOOR);
  var legs=[{th:180+j*4*Math.sin(w),kn:j*(6+5*Math.sin(w*1.3)),an:j*28*Math.sin(w+1)},{th:178-j*4*Math.sin(w+0.7),kn:j*(6+5*Math.sin(w*1.1+1)),an:j*28*Math.sin(w+2)}];
  var g=fig({hip:[124,103],tor:-90,far:[2,0],legs:legs,arms:[{sh:93,el:0},{sh:93,el:0}]});
  var s=cam.g(floor(109,60,180)+g.svg),ft=cam.p(g.legs[0].toe);
  if(shake)s+=ln([ft[0]-18,ft[1]-2],[ft[0]-10,ft[1]-4],"ac")+ln([ft[0]-18,ft[1]+6],[ft[0]-10,ft[1]+6],"ac")+ln([ft[0]+10,ft[1]-4],[ft[0]+18,ft[1]-2],"ac")+ln([ft[0]+10,ft[1]+6],[ft[0]+18,ft[1]+6],"ac");
  var b=(p-SH)/(1-SH);
  if(!shake){var inh=b<0.4?sm(b/0.4):1-sm((b-0.4)/0.6),bc=cam.p([104,95]);s+=ci(bc,4+6*inh,"acd");}
  return s+note(shake?"трясём стопами":(b<0.4?"вдох на 4":"выдох на 6"),true);
}};

/* ---------- постобработка: второй карандашный штрих у предметов и стоп ---------- */
var SK_CLS={ft:1,fsd:1,pr:1,prf:1,wall:1,ball:1,twl:1,pap:1,solea:1,fl:1,pin:1};
function sketchify(svg){
  return svg.replace(/<(path|circle|ellipse|rect|line)\b([^>]*?)class="([a-z]+)"([^>]*?)\/>/g,function(all,tag,a,c,b){
    if(!SK_CLS[c])return all;
    var attrs=a+b,m=attrs.match(/transform="([^"]*)"/),off="translate("+f1(jit(.45))+" "+f1(jit(.45))+")";
    return all+"<"+tag+attrs.replace(/\s*transform="[^"]*"/g,"")+' class="'+c+' sk2d" transform="'+(m?off+" "+m[1]:off)+'"/>';
  });
}

Object.keys(A).forEach(function(k){if(A[k].focus===undefined)A[k].focus=null;});
A.VIEWBOX="0 0 "+W+" "+H;
A.setFocus=function(f){FOCUS=f||null;};
A.seed=function(n){SKSEED=n;};
A.sketchify=sketchify;
A.setStyle=function(){};            // совместимость: стиль один
return A;
})();
