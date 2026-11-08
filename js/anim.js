/* «Сильные стопы» — анимированные схемы упражнений (стиль «набросок»). © 2026 KAKnetuz. Все права защищены. */
"use strict";

/* ---------- Exercise animations (inline SVG, viewBox 0 0 240 120) ---------- */
var AN=(function(){
var PI=Math.PI;
function r(d){return d*PI/180;}
function dg(a){return a*180/PI;}
function dv(a){return [Math.sin(r(a)),Math.cos(r(a))];} // angle from straight down, + toward +x
function mv(p,v,l){return [p[0]+v[0]*l,p[1]+v[1]*l];}
function f1(n){return String(Math.round(n*10)/10);}
function ln(a,b,c,w){return '<line x1="'+f1(a[0])+'" y1="'+f1(a[1])+'" x2="'+f1(b[0])+'" y2="'+f1(b[1])+'" class="'+(c||"k")+'"'+(w?' stroke-width="'+w+'"':"")+'/>';}
function pl(pts,c){return '<polyline points="'+pts.map(function(p){return f1(p[0])+","+f1(p[1]);}).join(" ")+'" class="'+(c||"k")+'"/>';}
function ci(c,rr,cls){return '<circle cx="'+f1(c[0])+'" cy="'+f1(c[1])+'" r="'+f1(rr)+'" class="'+cls+'"/>';}
function ease(p){return (1-Math.cos(2*PI*p))/2;}
function sm(t){t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);}
function seg(p,a,b){return sm((p-a)/(b-a));}
function lerp(a,b,t){return a+(b-a)*t;}
function gl(y){return ln([0,y],[240,y],"fl");}
function arrow(a,b){
  var dx=b[0]-a[0],dy=b[1]-a[1],L=Math.hypot(dx,dy)||1,ux=dx/L,uy=dy/L;
  var h1=[b[0]-ux*6-uy*4,b[1]-uy*6+ux*4],h2=[b[0]-ux*6+uy*4,b[1]-uy*6-ux*4];
  return ln(a,[b[0]-ux*3,b[1]-uy*3],"ac")+'<path d="M'+f1(b[0])+" "+f1(b[1])+"L"+f1(h1[0])+" "+f1(h1[1])+"L"+f1(h2[0])+" "+f1(h2[1])+'Z" class="acf"/>';
}
function arcA(cx,cy,R,a0,a1){
  var p0=[cx+R*Math.cos(r(a0)),cy+R*Math.sin(r(a0))],p1=[cx+R*Math.cos(r(a1)),cy+R*Math.sin(r(a1))];
  var sw=a1>a0?1:0,lg=Math.abs(a1-a0)>180?1:0;
  var t=sw?[-Math.sin(r(a1)),Math.cos(r(a1))]:[Math.sin(r(a1)),-Math.cos(r(a1))],n=[-t[1],t[0]];
  var tip=[p1[0]+t[0]*4,p1[1]+t[1]*4],b1=[p1[0]-t[0]*2+n[0]*4,p1[1]-t[1]*2+n[1]*4],b2=[p1[0]-t[0]*2-n[0]*4,p1[1]-t[1]*2-n[1]*4];
  return '<path d="M'+f1(p0[0])+" "+f1(p0[1])+"A"+R+" "+R+" 0 "+lg+" "+sw+" "+f1(p1[0])+" "+f1(p1[1])+'" class="ac"/>'+
         '<path d="M'+f1(tip[0])+" "+f1(tip[1])+"L"+f1(b1[0])+" "+f1(b1[1])+"L"+f1(b2[0])+" "+f1(b2[1])+'Z" class="acf"/>';
}
function ik(a,b,l1,l2,side){
  var dx=b[0]-a[0],dy=b[1]-a[1],d=Math.hypot(dx,dy);
  var dd=Math.max(Math.abs(l1-l2)+0.01,Math.min(d,l1+l2-0.01));
  var ang=Math.atan2(dy,dx),A=Math.acos((l1*l1+dd*dd-l2*l2)/(2*l1*dd)),t=ang+side*A;
  var k=[a[0]+l1*Math.cos(t),a[1]+l1*Math.sin(t)],ex=b[0]-k[0],ey=b[1]-k[1],e=Math.hypot(ex,ey)||1;
  return [k,[k[0]+ex/e*l2,k[1]+ey/e*l2]];
}

/* ---- Стиль C: анатомический силуэт, рабочая мышца подсвечена ---- */
var STYLE="A",FOCUS=null;
function nrm(v){var l=Math.hypot(v[0],v[1])||1;return [v[0]/l,v[1]/l];}
function smoothPath(pts,closed){
  var n=pts.length,d="M"+f1(pts[0][0])+" "+f1(pts[0][1]),last=closed?n:n-1;
  for(var i=0;i<last;i++){
    var p0=closed?pts[(i-1+n)%n]:pts[Math.max(0,i-1)],p1=pts[i],p2=pts[(i+1)%n],p3=closed?pts[(i+2)%n]:pts[Math.min(n-1,i+2)];
    d+="C"+f1(p1[0]+(p2[0]-p0[0])/6)+" "+f1(p1[1]+(p2[1]-p0[1])/6)+" "+f1(p2[0]-(p3[0]-p1[0])/6)+" "+f1(p2[1]-(p3[1]-p1[1])/6)+" "+f1(p2[0])+" "+f1(p2[1]);
  }
  return d+(closed?"Z":"");
}
function prof(arr,t){for(var i=1;i<arr.length;i++){if(t<=arr[i][0]){var a=arr[i-1],b=arr[i],k=(t-a[0])/(b[0]-a[0]);return a[1]+(b[1]-a[1])*k;}}return arr[arr.length-1][1];}
function limbPts(a,b,PA,PB,t0,t1,sc){
  var d=nrm([b[0]-a[0],b[1]-a[1]]),n=[-d[1],d[0]],L=[],R=[],steps=9;sc=sc||1;
  for(var i=0;i<=steps;i++){var t=t0+(t1-t0)*i/steps,c=[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t],wa=prof(PA,t)*sc,wb=prof(PB,t)*sc;
    L.push([c[0]+n[0]*wa,c[1]+n[1]*wa]);R.push([c[0]-n[0]*wb,c[1]-n[1]*wb]);}
  return L.concat(R.reverse());
}
function limb(a,b,PA,PB,cls){return '<path d="'+smoothPath(limbPts(a,b,PA,PB,0,1),true)+'" class="'+cls+'"/>';}
function hlLimb(a,b,PA,PB,t0,t1,sc,cls){ // мышца-«линза»: сужается к концам
  var d=nrm([b[0]-a[0],b[1]-a[1]]),n=[-d[1],d[0]],L=[],R=[],steps=9;
  for(var i=0;i<=steps;i++){var t=t0+(t1-t0)*i/steps,c=[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t],k=sc*Math.pow(Math.sin(Math.PI*i/steps),.7),wa=prof(PA,t)*k,wb=prof(PB,t)*k;
    L.push([c[0]+n[0]*wa,c[1]+n[1]*wa]);R.push([c[0]-n[0]*wb,c[1]-n[1]*wb]);}
  return '<path d="'+smoothPath(L.concat(R.reverse()),true)+'" class="'+cls+'"/>';
}
var SHIN_FRONT=[[0,4.3],[.3,3.4],[.7,2.8],[1,2.7]],SHIN_BACK=[[0,4.2],[.14,6.4],[.3,6.9],[.5,4.9],[.68,3.1],[.88,2.5],[1,3.1]];
var THIGH_FRONT=[[0,6.4],[.3,7],[.6,6.2],[.85,5],[1,4.7]],THIGH_BACK=[[0,7],[.3,6.6],[.7,5.1],[1,4.4]];
var UARM=[[0,3.9],[.4,3.6],[1,2.9]],FARM_A=[[0,3.1],[.25,3.6],[1,2.1]],FARM_B=[[0,3],[.25,3.2],[1,2]];
var TORSO_F=[[0,7.4],[.3,6.4],[.72,8.2],[1,7]],TORSO_B=[[0,7.8],[.3,6.6],[.72,7.6],[1,7]],NECK=[[0,2.9],[1,2.6]];
var THIGH_OUT=[[0,6.6],[.35,6.5],[.8,4.8],[1,4.4]],THIGH_IN=[[0,5],[.3,5.6],[.8,4.1],[1,4.3]];
var SHIN_OUT=[[0,4.3],[.2,5.1],[.5,3.7],[.85,2.6],[1,2.7]],SHIN_IN=[[0,4.3],[.17,5.9],[.42,4.3],[.85,2.6],[1,2.8]];
function muscle(a,b,P,side,t0,t1,inset,cls){
  var d=nrm([b[0]-a[0],b[1]-a[1]]),n=[-d[1]*side,d[0]*side],O=[],I=[],steps=8;
  for(var i=0;i<=steps;i++){var t=t0+(t1-t0)*i/steps,c=[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t],w=prof(P,t)-1,m=Math.sin(Math.PI*i/steps);
    O.push([c[0]+n[0]*w,c[1]+n[1]*w]);I.push([c[0]+n[0]*(w-w*inset*m),c[1]+n[1]*(w-w*inset*m)]);}
  return '<path d="'+smoothPath(O.concat(I.reverse()),true)+'" class="'+cls+'"/>';
}
function defLine(a,b,P,side,t0,t1,k){
  var d=nrm([b[0]-a[0],b[1]-a[1]]),n=[-d[1]*side,d[0]*side],pts=[];
  for(var i=0;i<=5;i++){var t=t0+(t1-t0)*i/5,c=[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t],w=prof(P,t)*k;pts.push([c[0]+n[0]*w,c[1]+n[1]*w]);}
  return '<path d="'+smoothPath(pts,false)+'" class="mdef"/>';
}
function footSil(L,cls,hlc){
  var f=nrm([L.toe[0]-L.heel[0],L.toe[1]-L.heel[1]]),u=[-f[1],f[0]];
  if((L.ank[0]-L.heel[0])*u[0]+(L.ank[1]-L.heel[1])*u[1]<0)u=[-u[0],-u[1]];
  function P(x,y){return [L.heel[0]+f[0]*x+u[0]*y,L.heel[1]+f[1]*x+u[1]*y];}
  var s='<path d="'+smoothPath([P(-1.8,2.6),P(-.8,0),P(2,-.4),P(5,1.1),P(9,-.3),P(12.6,.2),P(13.3,1.6),P(11.6,2.7),P(7.4,4.3),P(4.2,6.6),P(.4,6.8)],true)+'" class="'+cls+'"/>';
  if(hlc)s+='<path d="'+smoothPath([P(1.4,1),P(5,2.6),P(8.8,1),P(5,1.8)],true)+'" class="'+hlc+'"/>';
  return s;
}
function sideOf(a,b,v){var d=nrm([b[0]-a[0],b[1]-a[1]]);return (-d[1]*v[0]+d[0]*v[1])>=0?1:-1;}
function anatLeg(h,L,cls,hl,hlc){
  var td=[L.toe[0]-L.heel[0],L.toe[1]-L.heel[1]],sS=sideOf(L.knee,L.ank,td);
  var sh=[L.ank[0]-L.knee[0],L.ank[1]-L.knee[1]],dt=nrm([L.knee[0]-h[0],L.knee[1]-h[1]]),bend=-dt[1]*sh[0]+dt[0]*sh[1];
  var sT=Math.abs(bend)>3?(bend>0?-1:1):sideOf(h,L.knee,td);
  var s=limb(h,L.knee,sT>0?THIGH_FRONT:THIGH_BACK,sT>0?THIGH_BACK:THIGH_FRONT,cls)+limb(L.knee,L.ank,sS>0?SHIN_FRONT:SHIN_BACK,sS>0?SHIN_BACK:SHIN_FRONT,cls)+ci(L.knee,4.4,cls);
  s+=footSil(L,cls,hl==="arch"?hlc:null);
  s+=defLine(L.knee,L.ank,SHIN_BACK,-sS,.1,.55,.3)+defLine(h,L.knee,THIGH_FRONT,sT,.2,.8,.25);
  if(hl==="calf")s+=muscle(L.knee,L.ank,SHIN_BACK,-sS,.05,.6,.62,hlc);
  if(hl==="shin")s+=muscle(L.knee,L.ank,SHIN_FRONT,sS,.08,.72,.85,hlc);
  if(hl==="quad")s+=muscle(h,L.knee,THIGH_FRONT,sT,.1,.92,.62,hlc);
  if(hl==="ham")s+=muscle(h,L.knee,THIGH_BACK,-sT,.1,.88,.6,hlc);
  return s;
}
function anatArm(sh,A,cls){return limb(sh,A.el,UARM,UARM,cls)+limb(A.el,A.hand,FARM_A,FARM_B,cls)+ci(A.el,3.1,cls)+ci(A.hand,2.7,cls)+ci(sh,4,cls);}
function anatSide(hip,hipF,sh,shF,up,head,legs,arms){
  var s="",nk=mv(hip,up,30.5),nk2=mv(hip,up,36);
  if(arms[1])s+=anatArm(shF,arms[1],"anf");
  if(legs[1])s+=ci(hipF,6.4,"anf")+anatLeg(hipF,legs[1],"anf",FOCUS,"mhlf");
  var tf=sideOf(hip,nk,[1,0])>0;
  s+=limb(hip,nk,tf?TORSO_F:TORSO_B,tf?TORSO_B:TORSO_F,"an")+limb(nk,nk2,NECK,NECK,"an")+ci(hip,6.8,"an");
  if(legs[0])s+=anatLeg(hip,legs[0],"an",FOCUS,"mhl");
  if(arms[0])s+=anatArm(sh,arms[0],"an");
  return s+ci(head,7.6,"an");
}
function anatFront(o){
  var hx=o.x,hy=o.y,s="",i,hips=[[hx-6,hy],[hx+6,hy]],head=[hx,hy-43],shs=[[hx-11,hy-29],[hx+11,hy-29]];
  s+='<path d="'+smoothPath([[hx-9,hy+3],[hx-7.8,hy-12],[hx-12.6,hy-26],[hx-9.5,hy-31],[hx,hy-32],[hx+9.5,hy-31],[hx+12.6,hy-26],[hx+7.8,hy-12],[hx+9,hy+3],[hx,hy+5]],true)+'" class="an"/>';
  s+=limb([hx,hy-31],[hx,hy-36.5],NECK,NECK,"an")+ci(head,7.6,"an");
  for(i=0;i<2;i++){
    var L=o.legs[i],hp=hips[i],sd=i?1:-1,knee,ank;
    if(L.lift){var fl=24*Math.cos(r(80*L.lift));knee=[hp[0]+sd*3*L.lift,hp[1]+fl];ank=[knee[0]+sd*2,knee[1]+23];}
    else{ank=L.ank;knee=[(hp[0]+ank[0])/2+sd*1.5,(hp[1]+ank[1])/2];}
    var outA=sd<0; // +n смотрит влево для ноги, идущей вниз
    var TA=outA?THIGH_OUT:THIGH_IN,TB=outA?THIGH_IN:THIGH_OUT,SA=outA?SHIN_OUT:SHIN_IN,SB=outA?SHIN_IN:SHIN_OUT;
    s+=limb(hp,knee,TA,TB,"an")+limb(knee,ank,SA,SB,"an")+ci(knee,4.3,"an")+ci(ank,2.8,"an");
    s+='<ellipse cx="'+f1(ank[0]+sd*1.4)+'" cy="'+f1(ank[1]+2.8)+'" rx="4.8" ry="2.7" class="an"/>';
    s+=defLine(knee,ank,SHIN_IN,outA?-1:1,.12,.5,.35);
    if(FOCUS==="calf"||FOCUS==="shin")s+=hlLimb(knee,ank,SA,SB,.1,FOCUS==="calf"?.5:.7,.55,"mhl");
    if(FOCUS==="quad")s+=hlLimb(hp,knee,TA,TB,.15,.88,.55,"mhl");
    if(FOCUS==="arch")s+='<ellipse cx="'+f1(ank[0]-sd*1.2)+'" cy="'+f1(ank[1]+2.4)+'" rx="2.4" ry="1.4" class="mhl"/>';
  }
  for(i=0;i<2;i++){
    var A=o.arms[i],sd2=i?1:-1,sh=shs[i];
    var el=[sh[0]+sd2*15*Math.sin(r(A.a1)),sh[1]+15*Math.cos(r(A.a1))];
    var hd=[el[0]+sd2*14*Math.sin(r(A.a2)),el[1]+14*Math.cos(r(A.a2))];
    s+=anatArm(sh,{el:el,hand:hd},"an");
  }
  return s;
}

/* side-view stick figure, facing right */
function legPts(hip,L){
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
/* ---- Стили «Набросок» (S) и «Деревянный манекен» (W) ---- */
var SKSEED=1;
function rnd(){var t=SKSEED+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;}
function jit(a){return (rnd()*2-1)*a;}
function jpts(pts,a){return pts.map(function(p){return [p[0]+jit(a),p[1]+jit(a)];});}
function skShape(pts,far,closed){ // заливка + два карандашных штриха
  if(closed===undefined)closed=true;
  var s=closed?'<path d="'+smoothPath(pts,true)+'" class="skf"/>':"";
  s+='<path d="'+smoothPath(jpts(pts,.55),closed)+'" class="sk'+(far?" skfar":"")+'"/>';
  s+='<path d="'+smoothPath(jpts(pts,.9),closed)+'" class="sk sk2'+(far?" skfar":"")+'"/>';
  return s;
}
function ellPts(c,rx,ry,ang,n){var p=[],ca=Math.cos(ang),sa=Math.sin(ang);n=n||14;for(var i=0;i<n;i++){var t=2*Math.PI*i/n,x=rx*Math.cos(t),y=ry*Math.sin(t);p.push([c[0]+x*ca-y*sa,c[1]+x*sa+y*ca]);}return p;}
function skJoint(c,r){return '<path d="'+smoothPath(jpts(ellPts(c,r,r,0,10),.35),true)+'" class="skj"/>';}
function axisInfo(a,b,t,PA,PB){var d=nrm([b[0]-a[0],b[1]-a[1]]),n=[-d[1],d[0]],c=[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];return {d:d,n:n,c:c,wa:prof(PA,t),wb:prof(PB,t)};}
function skContour(a,b,t,PA,PB){var q=axisInfo(a,b,t,PA,PB),p1=[q.c[0]+q.n[0]*q.wa,q.c[1]+q.n[1]*q.wa],p2=[q.c[0]-q.n[0]*q.wb,q.c[1]-q.n[1]*q.wb],k=[q.c[0]+q.d[0]*1.8,q.c[1]+q.d[1]*1.8];
  return '<path d="M'+f1(p1[0])+' '+f1(p1[1])+'Q'+f1(k[0]+jit(.4))+' '+f1(k[1]+jit(.4))+' '+f1(p2[0])+' '+f1(p2[1])+'" class="skc"/>';}
function skHatch(a,b,PA,PB,side,t0,t1,cls,dens){ // штриховка вдоль одной стороны
  var s="",step=dens||.08;
  for(var t=t0;t<=t1;t+=step){var q=axisInfo(a,b,t,PA,PB),w=side>0?q.wa:-q.wb,e=[q.c[0]+q.n[0]*w*.92,q.c[1]+q.n[1]*w*.92],i=[q.c[0]+q.n[0]*w*.25+q.d[0]*2,q.c[1]+q.n[1]*w*.25+q.d[1]*2];
    s+='<line x1="'+f1(e[0])+'" y1="'+f1(e[1])+'" x2="'+f1(i[0])+'" y2="'+f1(i[1])+'" class="'+cls+'"/>';}
  return s;
}
function skLimb(a,b,PA,PB,far){return skShape(limbPts(a,b,PA,PB,0,1),far);}
function skLeg(h,L,far){
  var td=[L.toe[0]-L.heel[0],L.toe[1]-L.heel[1]],sS=sideOf(L.knee,L.ank,td);
  var shv=[L.ank[0]-L.knee[0],L.ank[1]-L.knee[1]],dt=nrm([L.knee[0]-h[0],L.knee[1]-h[1]]),bend=-dt[1]*shv[0]+dt[0]*shv[1];
  var sT=Math.abs(bend)>3?(bend>0?-1:1):sideOf(h,L.knee,td);
  var TA=sT>0?THIGH_FRONT:THIGH_BACK,TB=sT>0?THIGH_BACK:THIGH_FRONT,SA=sS>0?SHIN_FRONT:SHIN_BACK,SB=sS>0?SHIN_BACK:SHIN_FRONT;
  var s=skLimb(h,L.knee,TA,TB,far)+skLimb(L.knee,L.ank,SA,SB,far);
  var f=nrm(td),u=[-f[1],f[0]];if((L.ank[0]-L.heel[0])*u[0]+(L.ank[1]-L.heel[1])*u[1]<0)u=[-u[0],-u[1]];
  function P(x,y){return [L.heel[0]+f[0]*x+u[0]*y,L.heel[1]+f[1]*x+u[1]*y];}
  s+=skShape([P(-1.8,2.6),P(-.8,0),P(2,-.4),P(5,1.1),P(9,-.3),P(12.6,.2),P(13.3,1.6),P(11.6,2.7),P(7.4,4.3),P(4.2,6.6),P(.4,6.8)],far);
  if(!far){
    s+=skJoint(L.knee,4.6)+skJoint(h,6.2)+skJoint(L.ank,2.8);
    s+=skContour(L.knee,L.ank,.33,SA,SB)+skContour(L.knee,L.ank,.66,SA,SB)+skContour(h,L.knee,.5,TA,TB);
    s+=skHatch(L.knee,L.ank,SA,SB,-1,.12,.85,"skh")+skHatch(h,L.knee,TA,TB,-1,.15,.85,"skh");
    var hl=FOCUS;
    if(hl==="calf")s+=skMuscle(L.knee,L.ank,SHIN_BACK,-sS,.06,.6,.62);
    if(hl==="shin")s+=skMuscle(L.knee,L.ank,SHIN_FRONT,sS,.08,.72,.85);
    if(hl==="quad")s+=skMuscle(h,L.knee,THIGH_FRONT,sT,.1,.9,.62);
    if(hl==="arch")s+='<path d="'+smoothPath([P(1.4,1),P(5,2.6),P(8.8,1)],false)+'" class="skm skmw"/>';
  }
  return s;
}
function skMuscle(a,b,P,side,t0,t1,inset){ // мышца: оранжевый контур + штриховка
  var d=nrm([b[0]-a[0],b[1]-a[1]]),n=[-d[1]*side,d[0]*side],O=[],I=[],steps=10,s="";
  for(var i=0;i<=steps;i++){var t=t0+(t1-t0)*i/steps,c=[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t],w=prof(P,t)-1,m=Math.sin(Math.PI*i/steps);
    O.push([c[0]+n[0]*w,c[1]+n[1]*w]);I.push([c[0]+n[0]*(w-w*inset*m),c[1]+n[1]*(w-w*inset*m)]);}
  for(i=1;i<steps;i++)s+='<line x1="'+f1(O[i][0])+'" y1="'+f1(O[i][1])+'" x2="'+f1(I[Math.min(steps,i+1)][0])+'" y2="'+f1(I[Math.min(steps,i+1)][1])+'" class="skm"/>';
  return s+'<path d="'+smoothPath(jpts(O.concat(I.slice().reverse()),.3),true)+'" class="skm skmo"/>';
}
function skArm(sh,A,far){
  var s=skLimb(sh,A.el,UARM,UARM,far)+skLimb(A.el,A.hand,FARM_A,FARM_B,far);
  var d=nrm([A.hand[0]-A.el[0],A.hand[1]-A.el[1]]);
  s+=skShape(ellPts([A.hand[0]+d[0]*2,A.hand[1]+d[1]*2],2.4,3.4,Math.atan2(d[1],d[0])+Math.PI/2,10),far);
  if(!far)s+=skJoint(A.el,3.2)+skJoint(sh,4.2);
  return s;
}
function skHead(c,up){var ang=Math.atan2(up[1],up[0])+Math.PI/2,s=skShape(ellPts(c,6.6,7.8,ang,16),false);
  var n=[-up[1],up[0]];s+='<path d="M'+f1(c[0]-up[0]*7)+' '+f1(c[1]-up[1]*7)+'Q'+f1(c[0]+n[0]*2.4)+' '+f1(c[1]+n[1]*2.4)+' '+f1(c[0]+up[0]*7)+' '+f1(c[1]+up[1]*7)+'" class="skc"/>';
  s+='<path d="M'+f1(c[0]-n[0]*6.4+up[0]*.5)+' '+f1(c[1]-n[1]*6.4+up[1]*.5)+'Q'+f1(c[0]-up[0]*2)+' '+f1(c[1]-up[1]*2)+' '+f1(c[0]+n[0]*6.4+up[0]*.5)+' '+f1(c[1]+n[1]*6.4+up[1]*.5)+'" class="skc"/>';
  return s;}
function skSide(hip,hipF,sh,shF,up,head,legs,arms){
  var s="",n=[-up[1],up[0]],ang=Math.atan2(up[1],up[0])+Math.PI/2;
  if(arms[1])s+=skArm(shF,arms[1],true);
  if(legs[1])s+=skLeg(hipF,legs[1],true);
  s+='<path d="M'+f1(hip[0])+' '+f1(hip[1])+'Q'+f1(hip[0]+up[0]*16-n[0]*3)+' '+f1(hip[1]+up[1]*16-n[1]*3)+' '+f1(hip[0]+up[0]*34)+' '+f1(hip[1]+up[1]*34)+'" class="skc"/>';
  s+=skShape(ellPts([hip[0]+up[0]*21,hip[1]+up[1]*21],7,9.6,ang,16),false);           // грудная клетка
  s+=skShape(limbPts(mv(hip,up,-3),mv(hip,up,9),[[0,6.6],[1,6]],[[0,7.2],[1,6.2]],0,1),false); // таз
  s+=skShape(limbPts(mv(hip,up,30),mv(hip,up,36),NECK,NECK,0,1),false);
  if(legs[0])s+=skLeg(hip,legs[0],false);
  if(arms[0])s+=skArm(sh,arms[0],false);
  return s+skHead(head,up);
}
function frontJoints(o){
  var hx=o.x,hy=o.y,J={hx:hx,hy:hy,hips:[[hx-6,hy],[hx+6,hy]],head:[hx,hy-43],shs:[[hx-11,hy-29],[hx+11,hy-29]],knees:[],anks:[],els:[],hds:[]};
  for(var i=0;i<2;i++){var L=o.legs[i],hp=J.hips[i],sd=i?1:-1,knee,ank;
    if(L.lift){var fl=24*Math.cos(r(80*L.lift));knee=[hp[0]+sd*3*L.lift,hp[1]+fl];ank=[knee[0]+sd*2,knee[1]+23];}
    else{ank=L.ank;knee=[(hp[0]+ank[0])/2+sd*1.5,(hp[1]+ank[1])/2];}
    J.knees.push(knee);J.anks.push(ank);
    var A=o.arms[i],sh=J.shs[i],el=[sh[0]+sd*15*Math.sin(r(A.a1)),sh[1]+15*Math.cos(r(A.a1))];
    J.els.push(el);J.hds.push([el[0]+sd*14*Math.sin(r(A.a2)),el[1]+14*Math.cos(r(A.a2))]);}
  return J;
}
function skFront(o){
  var J=frontJoints(o),hx=J.hx,hy=J.hy,s="";
  s+=skShape(ellPts([hx,hy-21],10.5,10,0,16),false);
  s+=skShape([[hx-9,hy-6],[hx+9,hy-6],[hx+8.5,hy+2],[hx,hy+6],[hx-8.5,hy+2]],false);
  s+=skShape(limbPts([hx,hy-30],[hx,hy-36.5],NECK,NECK,0,1),false)+'<line x1="'+(hx)+'" y1="'+(hy-33)+'" x2="'+hx+'" y2="'+(hy+4)+'" class="skc"/>';
  for(var i=0;i<2;i++){var sd=i?1:-1,outA=sd<0,TA=outA?THIGH_OUT:THIGH_IN,TB=outA?THIGH_IN:THIGH_OUT,SA=outA?SHIN_OUT:SHIN_IN,SB=outA?SHIN_IN:SHIN_OUT,hp=J.hips[i],k=J.knees[i],a=J.anks[i];
    s+=skLimb(hp,k,TA,TB,false)+skLimb(k,a,SA,SB,false)+skShape(ellPts([a[0]+sd*1.4,a[1]+2.8],4.8,2.7,0,12),false);
    s+=skJoint(k,4.4)+skContour(k,a,.35,SA,SB)+skContour(hp,k,.5,TA,TB)+skHatch(k,a,SA,SB,outA?-1:1,.15,.8,"skh");
    if(FOCUS==="calf"||FOCUS==="shin")s+=skMuscle(k,a,outA?SHIN_IN:SHIN_OUT,outA?-1:1,.08,FOCUS==="calf"?.5:.7,.8);
    if(FOCUS==="quad")s+=skMuscle(hp,k,TA,1,.12,.88,.7);
    s+=skArm(J.shs[i],{el:J.els[i],hand:J.hds[i]},false);}
  return s+skHead(J.head,[0,-1]);
}
/* постобработка остальных элементов схемы под набросок: двойной штрих с дрожанием */
var SK_CLS={fsd:1,ft:1,ftn:1,pr:1,prf:1,wall:1,ball:1,twl:1,pap:1,solea:1,ac:1,acf:0,fl:1,sd:1};
function sketchify(svg){
  return svg.replace(/<(path|circle|ellipse|rect|line|polyline)\b([^>]*?)class="([a-z]+)"([^>]*?)\/>/g,function(all,tag,a,c,b){
    if(!SK_CLS[c])return all;
    // Preserve source transforms and apply only a small secondary pencil offset.
    // Avoid duplicating an existing transform attribute (invalid SVG).
    var attrs=a+b,match=attrs.match(/transform="([^"]*)"/);
    var offset="translate("+f1(jit(.45))+" "+f1(jit(.45))+")";
    var composed=match?offset+" "+match[1]:offset;
    var cleaned=attrs.replace(/\s*transform="[^"]*"/g,"");
    return all+'<'+tag+cleaned.replace(/class="[^"]*"/,"")+' class="'+c+' sk2d" transform="'+composed+'"/>';
  });
}

/* ---- Стиль «Набросок, аниме-персонаж» (A) ---- */
var A_THF=[[0,5.9],[.3,5.5],[.8,3.9],[1,3.5]],A_THB=[[0,6.8],[.22,6.5],[.8,3.9],[1,3.4]];
var A_SHF=[[0,3.5],[.4,2.9],[1,2]],A_SHB=[[0,3.4],[.2,4.4],[.45,3.7],[.8,2.1],[1,2.2]];
var A_THO=[[0,6.6],[.3,5.8],[1,3.7]],A_THI=[[0,4.4],[.25,4.8],[1,3.5]],A_SHO=[[0,3.6],[.22,4.2],[.55,3.1],[1,2]],A_SHI=[[0,3.6],[.2,4.7],[.5,3.3],[1,2.1]];
var A_UA=[[0,2.8],[1,2.1]],A_FA=[[0,2.3],[.3,2.5],[1,1.5]],A_NECK=[[0,2.1],[1,1.9]];
function akSect(c,w,dir){ // эллипс-сечение поперёк тела
  var ang=Math.atan2(dir[1],dir[0]);return '<path d="'+smoothPath(jpts(ellPts(c,1.6,w,ang,12),.25),true)+'" class="skc"/>';}
function akLeg(h,L,far){
  var td=[L.toe[0]-L.heel[0],L.toe[1]-L.heel[1]],sS=sideOf(L.knee,L.ank,td);
  var shv=[L.ank[0]-L.knee[0],L.ank[1]-L.knee[1]],dt=nrm([L.knee[0]-h[0],L.knee[1]-h[1]]),bend=-dt[1]*shv[0]+dt[0]*shv[1];
  var sT=Math.abs(bend)>3?(bend>0?-1:1):sideOf(h,L.knee,td);
  var TA=sT>0?A_THF:A_THB,TB=sT>0?A_THB:A_THF,SA=sS>0?A_SHF:A_SHB,SB=sS>0?A_SHB:A_SHF;
  var s=skLimb(h,L.knee,TA,TB,far)+skLimb(L.knee,L.ank,SA,SB,far);
  var f=nrm(td),u=[-f[1],f[0]];if((L.ank[0]-L.heel[0])*u[0]+(L.ank[1]-L.heel[1])*u[1]<0)u=[-u[0],-u[1]];
  function P(x,y){return [L.heel[0]+f[0]*x*.92+u[0]*y,L.heel[1]+f[1]*x*.92+u[1]*y];}
  s+=skShape([P(-1.4,2.2),P(-.6,0),P(2.2,-.3),P(5,1),P(9,-.2),P(12.8,.4),P(13,1.4),P(11,2.3),P(7,3.6),P(3.6,5.6),P(.4,5.8)],far);
  if(!far){
    s+=skJoint(L.knee,3.7)+skJoint(L.ank,2.2);
    s+=skContour(L.knee,L.ank,.33,SA,SB)+skContour(L.knee,L.ank,.66,SA,SB)+skContour(h,L.knee,.55,TA,TB);
    s+=skHatch(L.knee,L.ank,SA,SB,-1,.12,.85,"skh")+skHatch(h,L.knee,TA,TB,-1,.18,.85,"skh");
    if(FOCUS==="calf")s+=skMuscle(L.knee,L.ank,A_SHB,-sS,.06,.6,.62);
    if(FOCUS==="shin")s+=skMuscle(L.knee,L.ank,A_SHF,sS,.08,.72,.85);
    if(FOCUS==="quad")s+=skMuscle(h,L.knee,A_THF,sT,.1,.9,.62);
    if(FOCUS==="arch")s+='<path d="'+smoothPath([P(1.4,.9),P(5,2.4),P(8.6,.9)],false)+'" class="skm skmw"/>';
  }
  return s;
}
function akArm(sh,A,far){
  var s=skLimb(sh,A.el,A_UA,A_UA,far)+skLimb(A.el,A.hand,A_FA,A_FA,far);
  var d=nrm([A.hand[0]-A.el[0],A.hand[1]-A.el[1]]);
  s+=skShape(ellPts([A.hand[0]+d[0]*1.7,A.hand[1]+d[1]*1.7],1.8,2.8,Math.atan2(d[1],d[0])+Math.PI/2,10),far);
  if(!far)s+=skJoint(A.el,2.5)+skJoint(sh,3.2);
  return s;
}
function akHeadSide(c,up,face){ // голова: череп, острый подбородок, чёлка и хвостик
  var n=[-up[1],up[0]];if(n[0]*face<0)n=[-n[0],-n[1]];
  function P(x,y){return [c[0]+n[0]*x+up[0]*y,c[1]+n[1]*x+up[1]*y];} // x — вперёд (к лицу), y — вверх
  var s=skShape([P(0,7),P(4.6,5.4),P(6.2,1.4),P(5.8,-1.6),P(4.2,-5.4),P(2.4,-7.4),P(.4,-6.4),P(-2.6,-4.6),P(-5.6,-1.4),P(-6.2,2.4),P(-4.4,5.8)],false);
  s+='<path d="'+smoothPath(jpts([P(-1,-6.2),P(-.8,-1),P(-1.6,3.4)],.2),false)+'" class="skc"/>';             // линия уха/челюсти
  s+='<path d="'+smoothPath(jpts([P(6.2,-.2),P(3,-.6),P(-.4,-.4)],.2),false)+'" class="skc"/>';               // линия глаз
  s+='<path d="'+smoothPath(jpts([P(-5.6,2),P(-1,6.4),P(3.4,6.6),P(6.4,3.2),P(6.6,.8),P(4.6,2.6),P(2.4,3.4)],.35),false)+'" class="sk sk2"/>'; // волосы/чёлка
  s+='<path d="'+smoothPath(jpts([P(-5.4,3.4),P(-9,2.2),P(-10.6,-3),P(-9.6,-9),P(-7.6,-13)],.45),false)+'" class="sk"/>';   // хвостик
  s+='<path d="'+smoothPath(jpts([P(-5.6,2),P(-7.6,-1.6),P(-7.8,-7),P(-6.4,-11.4)],.45),false)+'" class="sk sk2"/>';
  return s;
}
function akSide(hip,hipF,sh,shF,up,head,legs,arms){
  var s="",n=[-up[1],up[0]],face=legs[0]&&(legs[0].toe[0]-legs[0].heel[0])<0?-1:1;
  var hd=mv(hip,up,39.5),nb=mv(hip,up,31.5);
  if(arms[1])s+=akArm(shF,arms[1],true);
  if(legs[1])s+=akLeg(hipF,legs[1],true);
  // торс: узкая талия, бёдра чуть шире (без акцента на формах)
  var tf=sideOf(hip,nb,[face,0])>0,TF=[[0,6.4],[.32,4.4],[.68,5.4],[1,4.6]],TB=[[0,7],[.3,4.6],[.68,5.1],[1,4.4]];
  s+=skShape(limbPts(mv(hip,up,-2.5),nb,tf?TF:TB,tf?TB:TF,0,1),false);
  s+='<path d="'+smoothPath(jpts([hip,mv(hip,up,14),nb].map(function(p,i){return i===1?[p[0]-n[0]*1.6*face,p[1]-n[1]*1.6*face]:p;}),.2),false)+'" class="skc"/>';
  s+=akSect(mv(hip,up,10),4.5,up)+akSect(mv(hip,up,1),6.8,up);
  s+=skShape(limbPts(nb,mv(hip,up,34.5),A_NECK,A_NECK,0,1),false);
  if(legs[0])s+=akLeg(hip,legs[0],false)+skJoint(hip,5.2);
  if(arms[0])s+=akArm(sh,arms[0],false);
  return s+akHeadSide(hd,up,face);
}
function akHeadFront(c){
  function P(x,y){return [c[0]+x,c[1]-y];}
  var s=skShape([P(0,7.6),P(5.6,5.6),P(6.4,1),P(5.4,-2.6),P(3,-5.6),P(0,-7.4),P(-3,-5.6),P(-5.4,-2.6),P(-6.4,1),P(-5.6,5.6)],false);
  s+='<path d="'+smoothPath(jpts([P(0,7.4),P(.4,0),P(0,-7)],.2),false)+'" class="skc"/>'+'<path d="'+smoothPath(jpts([P(-5.8,-.4),P(0,-1.2),P(5.8,-.4)],.2),false)+'" class="skc"/>';
  s+='<path d="'+smoothPath(jpts([P(-6.8,0),P(-6.6,5.6),P(-2,8.4),P(3,8.2),P(6.8,5),P(7,-1.4),P(6.4,-5)],.4),false)+'" class="sk sk2"/>';
  s+='<path d="'+smoothPath(jpts([P(-6.4,4),P(-3,2),P(0,4.4),P(3,2),P(6.4,4)],.3),false)+'" class="sk sk2"/>';   // чёлка
  s+='<path d="'+smoothPath(jpts([P(6.6,3),P(8.6,-2),P(8.4,-8),P(7,-11)],.4),false)+'" class="sk"/>';             // хвостик сбоку
  return s;
}
function akFront(o){
  var J=frontJoints(o),hx=J.hx,hy=J.hy,s="";
  var sh=[[hx-9.5,hy-28.5],[hx+9.5,hy-28.5]];
  s+=skShape([[hx-9,hy-29.5],[hx-7.6,hy-20],[hx-5.4,hy-12],[hx-8.6,hy-3],[hx-9.2,hy+2],[hx,hy+4.5],[hx+9.2,hy+2],[hx+8.6,hy-3],[hx+5.4,hy-12],[hx+7.6,hy-20],[hx+9,hy-29.5],[hx,hy-31]],false);
  s+='<path d="'+smoothPath(jpts([[hx,hy-31],[hx+.6,hy-14],[hx,hy+3]],.2),false)+'" class="skc"/>';
  s+='<path d="'+smoothPath(jpts(ellPts([hx,hy-12],5.6,1.5,0,12),.2),true)+'" class="skc"/>'+'<path d="'+smoothPath(jpts(ellPts([hx,hy-1.5],9,2,0,12),.2),true)+'" class="skc"/>';
  s+=skShape(limbPts([hx,hy-30],[hx,hy-35],A_NECK,A_NECK,0,1),false);
  for(var i=0;i<2;i++){var sd=i?1:-1,outA=sd<0,TA=outA?A_THO:A_THI,TB=outA?A_THI:A_THO,SA=outA?A_SHO:A_SHI,SB=outA?A_SHI:A_SHO,hp=J.hips[i],k=J.knees[i],a=J.anks[i];
    s+=skLimb(hp,k,TA,TB,false)+skLimb(k,a,SA,SB,false)+skShape(ellPts([a[0]+sd*1.2,a[1]+2.6],4.1,2.4,0,12),false);
    s+=skJoint(k,3.6)+skContour(k,a,.35,SA,SB)+skContour(hp,k,.5,TA,TB)+skHatch(k,a,SA,SB,outA?-1:1,.15,.8,"skh");
    if(FOCUS==="calf"||FOCUS==="shin")s+=skMuscle(k,a,outA?A_SHI:A_SHO,outA?-1:1,.08,FOCUS==="calf"?.5:.7,.8);
    if(FOCUS==="quad")s+=skMuscle(hp,k,TA,1,.12,.88,.7);
    s+=akArm(sh[i],{el:J.els[i],hand:J.hds[i]},false);}
  return s+akHeadFront([hx,hy-40.5]);
}

/* ---- Детализированные стопы для наброска ---- */
function P2(x,y){return f1(x)+" "+f1(y);}
function footSideSk(x,y,o){
  var sc=o.sc||1.6,s=o.s||0,arch=o.arch||0,cu=o.curl||0,SL=o.shin||44;
  // Limit decorative exaggeration so the toe and arch geometry remains plausible.
  s=Math.max(-1,Math.min(1,s));arch=Math.max(-1,Math.min(1.8,arch));cu=Math.max(0,Math.min(1,cu));
  var Lf=40-7*s,bx=Lf-11,bl=4*cu,ah=3+6*arch+2.5*s,tip=bx+11-4*cu;
  // плавный силуэт: подошва повторяет дугу свода (как у выемки под сводом в сцене)
  var pts=[[1,.2],[.231*bx,-.75*ah],[.475*bx,-ah],[.731*bx,-.75*ah],[bx,-bl],[bx+4.5,-bl*.5+.1],[tip-2.6,.2],[tip+.9,-1.9],[tip-.8,-4.5],
           [bx+3.2,-6.4-bl*.8],[bx+.4,-7.4-bl],[.6*bx+2,-11.8-2*s-1.6*arch],[12.4,-19.6],[10.6,-26],[10.2,-SL],
           [1.6,-SL],[2.4,-31],[2.2,-24.5],[-.6,-17],[-3.4,-8.5],[-2.6,-2.6]];
  var g='<g transform="translate('+f1(x)+" "+f1(y)+") rotate("+f1(o.rot||0)+" "+f1((o.px||0)*sc)+" 0) scale("+sc+')">';
  g+='<path d="'+smoothPath(pts,true)+'" class="ft"/>';
  g+='<ellipse cx="5.9" cy="'+(-SL)+'" rx="4.3" ry="1.1" class="fsc"/>';
  g+='<circle cx="3.2" cy="-5.6" r="5.4" class="fsc"/><circle cx="8.6" cy="-19" r="2.6" class="fsc"/>';      // круги построения: пятка, лодыжка
  g+='<path d="'+smoothPath([[6.6,-17.6],[8.6,-15.6],[10.8,-17.8]],false)+'" class="fsd"/>';                 // косточка лодыжки
  g+='<path d="'+smoothPath([[4.4,-21],[4.6,-26],[4.2,-SL+5]],false)+'" class="fsd"/>';                      // ахиллово сухожилие
  g+='<path d="'+smoothPath([[4.2,-2],[.475*bx,-ah-1.8],[bx-1.4,-2.4-bl]],false)+'" class="fsd"/>';          // линия внутреннего свода
  g+='<path d="'+smoothPath([[11.4,-18.4],[.66*bx+3,-10.2-bl*.3],[bx+1.4,-7-bl]],false)+'" class="fsc"/>';   // сухожилие на подъёме
  g+='<path d="'+smoothPath([[.56*bx,-11.6-2*s-1.6*arch],[.56*bx+1.6,-6.6],[.56*bx,-ah*1.1]],false)+'" class="fsc"/>'; // обхват
  g+='<path d="'+smoothPath([[bx+3.1,-6.6-bl*.8],[bx+4,-3.6-bl*.6],[bx+3.2,-.6-bl*.4]],false)+'" class="fsd"/>';      // основание большого пальца
  g+='<path d="'+smoothPath([[tip-5.6,-4.6],[tip-5.1,-2.6],[tip-5.6,-.4]],false)+'" class="fsc"/>';                    // сгиб пальца
  g+='<path d="'+smoothPath([[tip-4.2,-4.6],[tip-2.6,-5.4],[tip-.8,-4.2]],false)+'" class="fsd"/>';                    // ноготь
  for(var k=1;k<=3;k++){var x0=tip-2.4-3*k;g+='<path d="'+smoothPath([[x0,-.5],[x0+1.5,.8],[x0+3,-.4]],false)+'" class="fsd"/>';} // пальцы за большим
  if(FOCUS==="arch")g+='<path d="M3.2 -2.8Q'+P2(0.45*bx,-2*ah-6.2)+" "+P2(bx-2.4,-bl-3)+'Q'+P2(0.45*bx,-2*ah-2.2)+' 3.2 -2.8Z" class="mhl"/>';
  return g+"</g>";
}
function legFrontSkInner(cx,sd){ // голень и стопа спереди; внутренняя сторона — +m
  var m=sd<0?1:-1,X=function(v){return f1(cx+m*v);},I=cx+m*7.5,O=cx-m*7.5,s="";
  s+='<path d="M'+f1(O)+' 0C'+f1(O-m*3.5)+' 16 '+f1(O-m*2.5)+' 34 '+X(-5.5)+' 58L'+X(-5)+' 80L'+X(5)+' 80L'+X(5.5)+' 60C'+f1(I+m*1.5)+' 40 '+f1(I+m*5)+' 20 '+f1(I)+' 0Z" class="ft"/>';
  s+='<path d="M'+X(-5.6)+' 79C'+X(-6.8)+' 86 '+X(-10.2)+' 90 '+X(-9.8)+' 96.5L'+X(11.4)+' 96.5C'+X(11.8)+' 90 '+X(7.2)+' 86 '+X(5.4)+' 78Z" class="ft"/>';
  s+='<ellipse cx="'+f1(cx)+'" cy="0.5" rx="7.6" ry="1.4" class="fsc"/>';
  s+='<path d="M'+X(1)+' 6C'+X(2.6)+' 30 '+X(2)+' 55 '+X(1.4)+' 76" class="fsd"/>';                          // гребень большеберцовой
  s+='<path d="M'+X(5.1)+' 73Q'+X(8.4)+' 78 '+X(5.5)+' 83" class="fsd"/><path d="M'+X(-5.1)+' 76.5Q'+X(-8.1)+' 81.5 '+X(-5.4)+' 86" class="fsd"/>'; // косточки: внутренняя выше
  s+='<circle cx="'+X(6.2)+'" cy="78" r="2.4" class="fsc"/><circle cx="'+X(-6.2)+'" cy="81.4" r="2.4" class="fsc"/>';
  [[8.4,95],[3.6,95.6],[-.2,95.8],[-3.8,95.9]].forEach(function(t){s+='<path d="M'+X(1.2)+' 83.5L'+X(t[0])+' '+t[1]+'" class="fsc"/>';}); // сухожилия
  [[8.3,5.6,94.6],[3.6,3.7,95.6],[-.2,3.4,95.8],[-3.8,3.1,96],[-7.2,2.8,96.4]].forEach(function(t){
    var c=cx+m*t[0],w=t[1]/2,top=t[2],bot=102.2;
    s+='<path d="M'+f1(c-w)+' '+f1(top+1.6)+'Q'+f1(c-w)+' '+f1(top)+' '+f1(c)+' '+f1(top)+'Q'+f1(c+w)+' '+f1(top)+' '+f1(c+w)+' '+f1(top+1.6)+'L'+f1(c+w*.92)+' '+f1(bot-1.4)+'Q'+f1(c)+' '+f1(bot+.4)+' '+f1(c-w*.92)+' '+f1(bot-1.4)+'Z" class="ft"/>';
    s+='<path d="M'+f1(c-w*.55)+' '+f1(top+2.4)+'Q'+f1(c)+' '+f1(top+1.2)+' '+f1(c+w*.55)+' '+f1(top+2.4)+'L'+f1(c+w*.5)+' '+f1(top+4.2)+'Q'+f1(c)+' '+f1(top+4.8)+' '+f1(c-w*.5)+' '+f1(top+4.2)+'Z" class="fsd"/>'; // ноготь
  });
  if(FOCUS==="shin")s+='<path d="M'+X(-2.5)+' 8C'+X(-6.5)+' 26 '+X(-5)+' 48 '+X(-2.5)+' 66C'+X(0)+' 48 '+X(.5)+' 26 '+X(-2.5)+' 8Z" class="mhl"/>';
  return s;
}
function legBackSkInner(cx,sd){
  var m=sd<0?1:-1,X=function(v){return f1(cx+m*v);},s="";
  s+='<path d="M'+X(-9)+' 2C'+X(-13.5)+' 22 '+X(-12)+' 40 '+X(-6.5)+' 58L'+X(-4.8)+' 84C'+X(-6.8)+' 88 '+X(-8)+' 96 '+X(-6)+' 100Q'+f1(cx)+' 103 '+X(6)+' 100C'+X(8.5)+' 96 '+X(7.5)+' 88 '+X(5)+' 82L'+X(7)+' 58C'+X(14)+' 42 '+X(14.5)+' 22 '+X(9)+' 2Z" class="ft"/>';
  s+='<ellipse cx="'+f1(cx)+'" cy="2" rx="9" ry="1.6" class="fsc"/>';
  s+='<path d="M'+f1(cx)+' 10C'+X(1)+' 28 '+X(-.5)+' 44 '+f1(cx)+' 54" class="fsd"/>';                       // граница головок икроножной
  s+='<path d="M'+X(-3.6)+' 56L'+X(-2.4)+' 88M'+X(3.6)+' 56L'+X(2.4)+' 88" class="fsd"/>';                     // ахиллово сухожилие
  s+='<path d="M'+X(-5.5)+' 93Q'+f1(cx)+' 97.6 '+X(5.8)+' 93" class="fsc"/>';                                   // пяточная подушка
  s+='<path d="M'+X(5)+' 76Q'+X(8.4)+' 80.5 '+X(5.6)+' 85M'+X(-4.8)+' 79Q'+X(-7.8)+' 83.5 '+X(-5.2)+' 88" class="fsd"/>';
  s+='<path d="M'+X(-12.5)+' 30Q'+f1(cx)+' 33.5 '+X(14)+' 30M'+X(-6.3)+' 62Q'+f1(cx)+' 64 '+X(6.8)+' 62" class="fsc"/>';
  return s;
}
function footTopSk(x,y,o){
  var sc=o.sc||1,c=o.cls||"ft",det=(c==="ft");
  var s='<g transform="translate('+f1(x)+" "+f1(y)+") rotate("+f1(o.rot||0)+") scale("+f1((o.mir?-1:1)*sc*(o.sx||1))+" "+f1(sc*(o.sy||1))+')">';
  s+='<path d="M-6.8 -3C-9 -14 -10.2 -28 -9.6 -37L8.6 -40C10.2 -34 6.8 -24 6.2 -14C5.8 -5 4.6 1.5 0 1.5C-4.4 1.5 -6.2 0 -6.8 -3Z" class="'+c+'"/>';
  [[5.6,-45.2,3.3,4.8,4],[.9,-46.8,1.85,3.4,0],[-2.8,-45.8,1.7,3.1,-5],[-6,-43.8,1.55,2.8,-12],[-8.7,-40.9,1.4,2.4,-24]].forEach(function(t){
    s+='<ellipse cx="'+t[0]+'" cy="'+t[1]+'" rx="'+t[2]+'" ry="'+t[3]+'" transform="rotate('+t[4]+' '+t[0]+' '+t[1]+')" class="'+c+'"/>';
    if(det)s+='<ellipse cx="'+t[0]+'" cy="'+f1(t[1]-t[3]*.42)+'" rx="'+f1(t[2]*.55)+'" ry="'+f1(t[3]*.34)+'" transform="rotate('+t[4]+' '+t[0]+' '+t[1]+')" class="fsd"/>';
  });
  if(det){
    s+='<path d="M-9.4 -36.6Q0 -40.8 8.8 -39" class="fsc"/><circle cx="0" cy="-5" r="5.2" class="fsc"/>';
    [[5.4,-40.2],[.9,-41.8],[-2.8,-41],[-6,-39.4]].forEach(function(t){s+='<path d="M'+f1(t[0]*.3)+' -16L'+t[0]+' '+t[1]+'" class="fsc"/>';});
  }
  return s+(o.extra||"")+"</g>";
}

function fig(o){
  var hip=o.hip,t=r(o.tor||0),up=[Math.sin(t),-Math.cos(t)],fs=o.far||[0,0];
  var neck=mv(hip,up,33),head=mv(hip,up,42),sh=mv(hip,up,30);
  var hipF=[hip[0]+fs[0],hip[1]+fs[1]],shF=[sh[0]+fs[0],sh[1]+fs[1]];
  var legs=o.legs.map(function(L,i){return legPts(i?hipF:hip,L);});
  var arms=(o.arms||[]).map(function(A,i){return armPts(i?shF:sh,A);});
  function dl(g,h,c){return pl([h,g.knee,g.ank],c)+ln(g.heel,g.toe,c);}
  function da(g,h,c){return pl([h,g.el,g.hand],c);}
  var s="";
  if(arms[1])s+=da(arms[1],shF,"kf");
  if(legs[1])s+=dl(legs[1],hipF,"kf");
  s+=ln(hip,neck)+ci(head,7.5,"hd")+dl(legs[0],hip,"k");
  if(arms[0])s+=da(arms[0],sh,"k");
  if(STYLE==="C")s=anatSide(hip,hipF,sh,shF,up,head,legs,arms);
  if(STYLE==="S")s=skSide(hip,hipF,sh,shF,up,head,legs,arms);
  if(STYLE==="A")s=akSide(hip,hipF,sh,shF,up,head,legs,arms);
  return {svg:s,legs:legs,arms:arms,head:head,sh:sh,hip:hip};
}
function grounded(build,fy){
  var g=build(0),m=-1e9;
  g.legs.forEach(function(L){m=Math.max(m,L.heel[1],L.toe[1]);});
  return build(fy-m-2.5);
}
function walk(p,o){
  var w=2*PI*p,amp=o.amp||20;
  var g=grounded(function(hy){
    var legs=[0,1].map(function(i){var ph=w+i*PI,th=amp*Math.sin(ph),c=Math.cos(ph);return {th:th,kn:(o.kn||24)*Math.max(0,c),an:o.an(th,c)};});
    return fig({hip:[118,hy],tor:o.tor||2,far:[-2,-1],legs:legs,arms:o.arms(w)});
  },110);
  var d="";for(var k=0;k<14;k++){var x=((k*20-p*60)%280+280)%280-20;d+=ln([x,114],[x+8,114],"fl");}
  return o.bare?g.svg:gl(110)+d+g.svg;
}
function chair(x,y){
  return '<rect x="'+(x-16)+'" y="'+y+'" width="32" height="4" rx="2" class="prf"/>'+ln([x-13,y+4],[x-13,112],"pr")+ln([x+13,y+4],[x+13,112],"pr")+ln([x-15,y+2],[x-15,y-34],"pr");
}
function seated(an,extra){
  var x=96,sy=86,hip=[x+2,sy-3];
  var g=fig({hip:hip,tor:-2,far:[-3,-1],legs:[{th:61,kn:0,an:an},{th:61,kn:0,an:an}],arms:[{to:[x+16,sy+4]},{to:[x+14,sy+4]}]});
  return chair(x,sy)+gl(112)+(extra||"")+g.svg;
}

/* front-view figure */
function figF(o){
  var hx=o.x,hy=o.y,s="",i,hips=[[hx-6,hy],[hx+6,hy]],neck=[hx,hy-34],head=[hx,hy-43],shs=[[hx-11,hy-29],[hx+11,hy-29]];
  for(i=0;i<2;i++){
    var L=o.legs[i],hp=hips[i],sd=i?1:-1,knee,ank;
    if(L.lift){var fl=24*Math.cos(r(80*L.lift));knee=[hp[0]+sd*3*L.lift,hp[1]+fl];ank=[knee[0]+sd*2,knee[1]+23];}
    else{ank=L.ank;knee=[(hp[0]+ank[0])/2+sd*1.5,(hp[1]+ank[1])/2];}
    s+=pl([hp,knee,ank],"k")+ln([ank[0]-sd*1.5,ank[1]+3],[ank[0]+sd*6,ank[1]+3],"k");
    if(L.lift>0.3)s+=ci(knee,3.4,"hd");
  }
  s+=ln(hips[0],hips[1])+ln([hx,hy],neck)+ln(shs[0],shs[1])+ci(head,7.5,"hd");
  for(i=0;i<2;i++){
    var A=o.arms[i],sd2=i?1:-1,sh=shs[i];
    var el=[sh[0]+sd2*15*Math.sin(r(A.a1)),sh[1]+15*Math.cos(r(A.a1))];
    var hd=[el[0]+sd2*14*Math.sin(r(A.a2)),el[1]+14*Math.cos(r(A.a2))];
    s+=pl([sh,el,hd],"k");
  }
  if(STYLE==="C")s=anatFront(o);
  if(STYLE==="S")s=skFront(o);
  if(STYLE==="A")s=akFront(o);
  if(o.rot)s='<g transform="rotate('+f1(o.rot)+" "+f1(o.rx)+" "+f1(o.ry)+')">'+s+"</g>";
  if(o.sc)s='<g transform="translate('+f1(hx)+' 110) scale('+o.sc+") translate("+f1(-hx)+' -110)">'+s+"</g>";
  return s;
}

/* close-up foot, side view, facing right; heel contact at (x,y) */
function footSide(x,y,o){
  o=o||{};
  if(STYLE==="A"||STYLE==="S")return footSideSk(x,y,o);
  var sc=o.sc||1.6,s=o.s||0,arch=o.arch||0,cu=o.curl||0,SL=o.shin||44;
  var Lf=40-7*s,bx=Lf-11,bl=4*cu,ah=3+6*arch+2.5*s,tip=bx+11-4*cu;
  var d="M0 0Q"+f1(0.45*bx)+" "+f1(-2*ah)+" "+f1(bx)+" "+f1(-bl)+
        "Q"+f1(bx+6)+" "+f1(-bl*0.4)+" "+f1(tip)+" 0"+
        "Q"+f1(tip+2.5)+" -2.5 "+f1(tip-1)+" -5"+
        "Q"+f1(bx+5)+" "+f1(-7.5-2*cu)+" "+f1(bx)+" "+f1(-8-bl)+
        "Q"+f1(0.55*bx)+" "+f1(-15-3*s-2*arch)+" 11 -21"+
        "L1 -21C-3 -16 -5 -5 0 0Z";
  var g='<g transform="translate('+f1(x)+" "+f1(y)+") rotate("+f1(o.rot||0)+" "+f1((o.px||0)*sc)+" 0) scale("+sc+')">';
  g+='<path d="'+d+'" class="ft"/>';
  if(FOCUS==="arch")g+='<path d="M3 -2.6Q'+f1(0.45*bx)+" "+f1(-2*ah-5)+" "+f1(bx-2)+" "+f1(-bl-2.6)+'" class="mhls"/>';
  g+='<path d="M'+f1(bx+0.5)+" "+f1(-bl-0.5)+"Q"+f1(bx+2)+" "+f1(-4-bl)+" "+f1(bx+0.5)+" "+f1(-7.5-bl)+'" class="ftd"/>';
  g+='<g transform="rotate('+f1(o.ka||0)+' 6 -21)"><rect x="1" y="'+(-SL)+'" width="10" height="'+(SL-17)+'" class="ftn"/><path d="M1 -18V'+(-SL)+"M11 -18V"+(-SL)+'" class="ft"/></g>';
  return g+"</g>";
}
function footLen(o){return (40-7*((o&&o.s)||0))*((o&&o.sc)||1.6);}

/* foot seen from above (or sole from below); heel at origin, toes up */
var FT="M-7 -3C-9 -14 -10.5 -29 -9.5 -36C-8.5 -43 7.5 -45 9 -38.5C10.5 -31 6.5 -23 6 -14C5.6 -5 4.5 1.5 0 1.5C-4.5 1.5 -6.3 0 -7 -3Z";
var TOES=[[6.2,-45,3.4],[1.4,-47.4,2.4],[-2.6,-46.6,2.2],[-6,-44.6,2],[-8.8,-41.6,1.8]];
function footTop(x,y,o){
  o=o||{};
  if(STYLE==="A"||STYLE==="S")return footTopSk(x,y,o);var sc=o.sc||1,c=o.cls||"ft";
  var s='<g transform="translate('+f1(x)+" "+f1(y)+") rotate("+f1(o.rot||0)+") scale("+f1((o.mir?-1:1)*sc*(o.sx||1))+" "+f1(sc*(o.sy||1))+')"><path d="'+FT+'" class="'+c+'"/>';
  TOES.forEach(function(t){s+='<circle cx="'+t[0]+'" cy="'+t[1]+'" r="'+t[2]+'" class="'+c+'"/>';});
  return s+(o.extra||"")+"</g>";
}
function rotP(p,c,deg){var a=r(deg),dx=p[0]-c[0],dy=p[1]-c[1];return [c[0]+dx*Math.cos(a)-dy*Math.sin(a),c[1]+dx*Math.sin(a)+dy*Math.cos(a)];}

/* lower legs seen from behind */
function legBack(cx,sd,o){
  var h=o.lift||0,t=(o.tilt||0)*(sd<0?-1:1),px=cx+sd*7;
  var leg="M"+(cx-9)+" 2C"+(cx-14)+" 28 "+(cx-13)+" 52 "+(cx-6)+" 76L"+(cx-6)+" 89Q"+(cx-8)+" 100 "+cx+" 100Q"+(cx+8)+" 100 "+(cx+6)+" 89L"+(cx+6)+" 76C"+(cx+13)+" 52 "+(cx+14)+" 28 "+(cx+9)+" 2";
  var s='<g transform="rotate('+f1(t)+" "+px+' 101)">';
  if(h>0.5)s+='<path d="M'+(cx-6)+" "+f1(100-h)+"L"+(cx-8)+" 102L"+(cx+8)+" 102L"+(cx+6)+" "+f1(100-h)+'Z" class="sole"/>';
  s+='<g transform="translate(0 '+f1(-h)+')">'+((STYLE==="A"||STYLE==="S")?legBackSkInner(cx,sd):'<path d="'+leg+'" class="ft"/><path d="M'+cx+' 60V90" class="ftd"/>');
  if(FOCUS==="calf")s+='<path d="M'+(cx-8.5)+' 14C'+(cx-12.5)+' 32 '+(cx-10)+' 50 '+(cx-2)+' 60C'+(cx-1.5)+' 44 '+(cx-2.5)+' 26 '+(cx-8.5)+' 14Z" class="mhl"/><path d="M'+(cx+8.5)+' 14C'+(cx+12.5)+' 32 '+(cx+10)+' 50 '+(cx+2)+' 60C'+(cx+1.5)+' 44 '+(cx+2.5)+' 26 '+(cx+8.5)+' 14Z" class="mhl"/>';
  if(o.axis)s+=ln([cx,6],[cx,99],"dsa");
  return s+"</g></g>";
}

var A={};

/* ---- Блок 1 ---- */
A.circles={T:3,f:function(p){
  var hip=[98,83],th=2*PI*p,Lp=legPts(hip,{th:61,kn:0}),base=mv(Lp.ank,dv(61),2.5);
  var c=mv(base,dv(138),8.5),tg=[c[0]+5*Math.cos(th),c[1]+8*Math.sin(th)];
  var fa=dg(Math.atan2(tg[0]-base[0],tg[1]-base[1]));
  var g=fig({hip:hip,tor:-2,far:[-3,-1],legs:[{th:61,kn:0,fa:fa},{th:61,kn:0,fa:fa}],arms:[{to:[112,90]},{to:[110,90]}]});
  return chair(96,86)+gl(112)+'<ellipse cx="'+f1(c[0])+'" cy="'+f1(c[1])+'" rx="6.5" ry="9.5" class="dsa"/>'+g.svg+ci(tg,2.8,"acf");
}};
A.noski={T:2.6,f:function(p){
  var u=ease(p);
  return seated(lerp(16,-48,u),arcA(146,92,16,u<0.5?-40:20,u<0.5?20:-40));
}};
A.soldier={T:1.2,f:function(p){return walk(p,{kn:22,an:function(){return -58;},arms:function(){return [{sh:-25,el:64},{sh:-25,el:64}];}});}};
A.penguin={T:1.3,f:function(p){return walk(p,{amp:12,kn:12,an:function(){return 30;},arms:function(){return [{sh:-30,el:-8},{sh:-30,el:-8}];}});}};

/* ---- Блок 2: лёжа ---- */
A.claps={T:1.6,f:function(p){
  var u=sm(Math.min(1,ease(p)*1.3)),s=gl(106);
  [-1,1].forEach(function(sd){
    var hp=[120+sd*12,64],knee=[120+sd*56,28],ank=[lerp(120+sd*28,120+sd*10,u),lerp(96,74,u)];
    var ang=lerp(0,90,u)*(sd<0?-1:1);
    s+=STYLE==="A"?skLimb(hp,knee,A_THF,A_THB,true)+skLimb(knee,ank,A_SHB,A_SHF,false)+skJoint(knee,3.6):ln(hp,knee,"kf")+ln(knee,ank,"k")+ci(knee,4,"hd");
    s+='<g transform="rotate('+f1(ang)+" "+f1(ank[0])+" "+f1(ank[1])+')"><rect x="'+f1(ank[0]-7)+'" y="'+f1(ank[1]+1)+'" width="14" height="6" rx="3" class="ft"/>'+ln([ank[0]-6,ank[1]+7],[ank[0]+6,ank[1]+7],"ac")+"</g>";
  });
  if(u>0.9)s+=ln([120,62],[120,56],"ac")+ln([113,64],[109,59],"ac")+ln([127,64],[131,59],"ac");
  return s;
}};

/* ---- Блок 2: сидя ---- */
A.caterpillar={T:7,f:function(p){
  var q=p*6,k=Math.min(5,Math.floor(q)),sub=q-k,h,s;
  function st(t){if(t<0.5){var a=sm(t/0.5);return {h:7*a,s:a};}return {h:7,s:1-sm((t-0.5)/0.5)};}
  if(k<3){var a=st(sub);h=k*7+a.h;s=a.s;}else{var b=st(1-sub);h=(5-k)*7+b.h;s=b.s;}
  var x=34+h*1.6,m="";
  for(var i=0;i<9;i++)m+=ln([30+i*22,109],[30+i*22,113],"fl");
  return gl(106)+m+footSide(x,105,{sc:1.6,s:s,curl:s*0.9,shin:48})+(k<3?arrow([168,24],[198,24]):arrow([198,24],[168,24]));
}};
A.towel={T:6,f:function(p){
  var q=p*4,k=Math.min(3,Math.floor(q)),sub=q-k,cu=ease(sub);
  var pulled=(k+sm(Math.min(1,sub/0.5)))*8,E=212-pulled,hx=40,s=gl(108);
  var amp=1.5+pulled/10,bunch="M"+(hx-6)+" 106";
  for(var x=hx-6;x<=hx+46;x+=2)bunch+="L"+x+" "+f1(106-Math.abs(Math.sin((x-hx)/52*PI*(2+k)))*amp);
  s+='<path d="'+bunch+"L"+f1(hx+64)+" 106L"+f1(E)+' 106" class="twl"/>';
  s+='<rect x="'+f1(E-2)+'" y="82" width="12" height="22" rx="3" class="prf"/><rect x="'+f1(E+1.5)+'" y="76" width="5" height="7" rx="1" class="prf"/>';
  s+=footSide(hx,104,{sc:1.6,curl:cu,shin:48});
  return s+arrow([E-14,96],[E-34,96]);
}};
A.cleanup={T:4,f:function(p){
  var home=[128,114],item=[192,114],box=[46,114],tipOff=[-2,-64];
  var hpos,carry=false,dropT=0;
  if(p<0.2)hpos=[lerp(home[0],item[0],sm(p/0.2)),home[1]];
  else if(p<0.3)hpos=item;
  else if(p<0.6){hpos=[lerp(item[0],box[0],sm((p-0.3)/0.3)),item[1]];carry=true;}
  else if(p<0.7){hpos=box;dropT=(p-0.6)/0.1;}
  else hpos=[lerp(box[0],home[0],sm((p-0.7)/0.3)),box[1]];
  var tip=[hpos[0]+tipOff[0],hpos[1]+tipOff[1]],s="";
  s+='<path d="M24 38V76H68V38" class="pr"/><rect x="24" y="64" width="44" height="12" class="prf"/>'+ci([36,70],3,"ball")+ci([48,71],3,"ball");
  s+='<rect x="200" y="78" width="6" height="6" rx="1.5" class="ball"/>'+ci([170,92],3,"ball");
  if(p>=0.2&&p<0.3)s+=ci(tip,6,"dsa");
  if(p<0.2||p>0.92)s+=ci([item[0]-2,item[1]-64],3.4,"ball");
  s+=footTop(hpos[0],hpos[1],{sc:1.3,mir:1});
  if(carry||(p>=0.2&&p<0.3))s+=ci([tip[0],tip[1]+1],3.4,"ball");
  if(dropT)s+=ci([box[0]-2,lerp(tip[1],68,sm(dropT))],3.4,"ball");
  return s;
}};
A.rollpin={T:3,f:function(p){
  var u=ease(p),R=8,cx=124,fy=110,hx=cx-46+32*u,rot=(hx-(cx-46))/R;
  var e=[cx+R*Math.cos(rot),fy-R+R*Math.sin(rot)];
  return gl(fy)+'<rect x="'+(cx-3)+'" y="'+(fy-2*R)+'" width="6" height="'+(2*R)+'" class="sole"/>'+ci([cx,fy-R],R,"prf")+ln([cx,fy-R],e,"pr")+
         footSide(hx,fy-2*R,{sc:1.5,shin:44})+arrow([60,20],[84,20])+arrow([84,20],[60,20]);
}};
A.artist={T:6,f:function(p){
  var path=[[140,50],[176,50],[176,28],[158,12],[140,28],[140,50]],segs=[],tot=0,i;
  for(i=1;i<path.length;i++){var l=Math.hypot(path[i][0]-path[i-1][0],path[i][1]-path[i-1][1]);segs.push(l);tot+=l;}
  var q=Math.min(1,p/0.82)*tot,drawn=[path[0]],tipP=path[0];
  for(i=1;i<path.length;i++){
    if(q>=segs[i-1]){drawn.push(path[i]);q-=segs[i-1];tipP=path[i];}
    else{var t=q/segs[i-1];tipP=[lerp(path[i-1][0],path[i][0],t),lerp(path[i-1][1],path[i][1],t)];drawn.push(tipP);break;}
  }
  var sc=1.1,off=[-3.8*sc,-64*sc],heel=[tipP[0]-off[0],tipP[1]-off[1]];
  var pen0=[heel[0]-3.6*sc,heel[1]-47*sc];
  return '<rect x="126" y="4" width="64" height="58" rx="2" class="pap"/>'+pl(drawn,"ac")+footTop(heel[0],heel[1],{sc:sc,mir:1})+ln(pen0,tipP,"pr",3)+ci(tipP,2,"acf");
}};

/* ---- Блок 2: стоя ---- */
A.heron={T:3.2,f:function(p){
  var rot=2.5*Math.sin(2*PI*p);
  return gl(110)+figF({x:120,y:57,legs:[{ank:[114,105]},{lift:1}],arms:[{a1:88,a2:92},{a1:88,a2:92}],rot:rot,rx:114,ry:108});
}};

/* ---- Блок 3 ---- */
A.fivepoints={T:6,f:function(p){
  var away=26*(seg(p,0.5,0.62)-seg(p,0.85,0.97));
  var mv1=p>0.5&&p<0.62,mv2=p>0.85&&p<0.97,ph=mv1?(p-0.5)/0.12:mv2?(p-0.85)/0.12:0;
  var sw=(mv1||mv2)?12*Math.sin(PI*ph):0;
  var g=grounded(function(hy){return fig({hip:[64+away,hy],tor:0,far:[-1,0],legs:[{th:sw,kn:0,flat:1},{th:-sw,kn:0,flat:1}],arms:[{sh:5,el:0},{sh:5,el:0}]});},110);
  var s='<rect x="40" y="0" width="16" height="110" class="wall"/>'+ln([56,0],[56,110],"pr")+gl(110)+g.svg;
  if(away<1){
    var pu=2.6+1*Math.sin(2*PI*p*4);
    [g.head[1],g.sh[1]+8,g.hip[1]].forEach(function(y){s+=ci([57.5,y],pu,"acf");});
  }
  return s;
}};
A.angel={T:4,f:function(p){
  var u=ease(p),a1=lerp(92,158,u),a2=lerp(180,172,u);
  return '<rect x="44" y="0" width="152" height="110" class="wall"/>'+gl(110)+
    figF({x:120,y:57,sc:0.86,legs:[{ank:[113,105]},{ank:[127,105]}],arms:[{a1:a1,a2:a2},{a1:a1,a2:a2}]});
}};
A.wallsit={T:5,f:function(p){
  var u=seg(p,0.08,0.38)-seg(p,0.72,0.96),hip=[64,lerp(68,86,u)];
  var g=fig({hip:hip,tor:0,far:[-2,0],legs:[{to:[97,104.5],side:-1,flat:1},{to:[95,104.5],side:-1,flat:1}],arms:[{sh:6,el:4},{sh:6,el:4}]});
  var kn=g.legs[0].knee;
  return '<rect x="40" y="0" width="16" height="110" class="wall"/>'+ln([56,0],[56,110],"pr")+gl(110)+g.svg+ci([kn[0]+4,kn[1]-1],4.5,"ball");
}};

/* ---- Блок 4 ---- */
A.bike={T:2,f:function(p){
  var hip=[126,103],th=-2*PI*p,c=[hip[0]+14,hip[1]-42],R=10;
  var legs=[0,1].map(function(i){var a=th+i*PI;return {to:[c[0]+R*Math.cos(a),c[1]+R*Math.sin(a)],side:-1,an:18*Math.sin(a)};});
  var g=fig({hip:hip,tor:-90,legs:legs,arms:[{sh:93,el:0},{sh:93,el:0}]});
  return gl(109)+ci(c,R+5,"dsh")+g.svg;
}};
A.stowel={T:4,f:function(p){
  var u=ease(p),hip=[66,104],an=lerp(0,20,u),hand=[lerp(101,96,u),lerp(80,78,u)];
  var g=fig({hip:hip,tor:lerp(8,-3,u),far:[-2,-1],legs:[{th:90,kn:0,an:an},{th:90,kn:0,an:an}],arms:[{to:hand,side:1},{to:[hand[0]-2,hand[1]],side:1}]});
  var L=g.legs[0],fd=[L.toe[0]-L.heel[0],L.toe[1]-L.heel[1]],fl=Math.hypot(fd[0],fd[1]);fd=[fd[0]/fl,fd[1]/fl];
  var nrm=[-fd[1],fd[0]];
  var t1=[L.toe[0]+nrm[0]*3,L.toe[1]+nrm[1]*3],t2=[L.heel[0]+fd[0]*7+nrm[0]*3,L.heel[1]+fd[1]*7+nrm[1]*3];
  var hd=g.arms[0].hand;
  return gl(110)+g.svg+'<path d="M'+f1(hd[0])+" "+f1(hd[1])+"L"+f1(t1[0])+" "+f1(t1[1])+"L"+f1(t2[0])+" "+f1(t2[1])+"L"+f1(hd[0]+1)+" "+f1(hd[1]+2)+'" class="twl"/>';
}};
A.swall={T:4,f:function(p){
  var u=ease(p),hx=lerp(116,124,u),bk=[90,104.5],d=hx-bk[0];
  var hy=bk[1]-Math.sqrt(Math.max(0,47.6*47.6-d*d)),tor=dg(Math.atan2(d,bk[1]-hy));
  var g=fig({hip:[hx,hy],tor:tor,far:[1,0],legs:[{to:bk,side:-1,flat:1},{to:[146,104.5],side:-1,flat:1}],arms:[{to:[163,50],side:1},{to:[162,52],side:1}]});
  return '<rect x="165" y="0" width="16" height="110" class="wall"/>'+ln([165,0],[165,110],"pr")+gl(110)+g.svg+arrow([84,84],[84,100]);
}};
A.rags={T:4,f:function(p){
  var shake=p<0.55,w=2*PI*p*14,j=shake?1:0;
  var legs=[{th:180+j*4*Math.sin(w),kn:j*(6+5*Math.sin(w*1.3)),an:j*28*Math.sin(w+1)},{th:178-j*4*Math.sin(w+0.7),kn:j*(6+5*Math.sin(w*1.1+1)),an:j*28*Math.sin(w+2)}];
  var g=fig({hip:[124,103],tor:-90,far:[2,0],legs:legs,arms:[{sh:93,el:0},{sh:93,el:0}]});
  var s=gl(109)+g.svg;
  if(shake)s+=ln([140,50],[146,48],"ac")+ln([140,58],[147,58],"ac")+ln([106,50],[100,48],"ac")+ln([106,58],[99,58],"ac");
  else s+='<circle cx="104" cy="96" r="'+f1(3+3*ease((p-0.55)/0.45*2%1))+'" class="dsa"/>';
  return s;
}};

/* ---- подписи, панели, стопы спереди ---- */
function tx(x,y,t,c,anc){return '<text x="'+f1(x)+'" y="'+f1(y)+'" text-anchor="'+(anc||"middle")+'" class="'+(c||"cap")+'">'+t+"</text>";}
function divider(){return ln([120,8],[120,112],"dsh");}
function grp(x,y,sc,inner){return '<g transform="translate('+f1(x)+" "+f1(y)+") scale("+sc+')">'+inner+"</g>";}
function legFront(cx,sd,o){
  var h=o.lift||0,t=(o.tilt||0)*(sd<0?-1:1),px=cx+sd*12,m=sd<0?1:-1,s="";
  var inner=rotP([cx-sd*12,102],[px,102],t),show=Math.abs(t)>1&&h<0.5;
  if(show)s+='<path d="M'+f1(px)+" 102L"+f1(inner[0])+" "+f1(inner[1])+"L"+f1(inner[0])+' 102Z" class="gap"/>';
  s+='<g transform="rotate('+f1(t)+" "+px+' 102) translate(0 '+f1(-h)+')">';
  if(STYLE==="A"||STYLE==="S"){s+=legFrontSkInner(cx,sd)+"</g>";if(show)s+=ci([px,102],2.6,"acf");return s;}
  if(STYLE==="C"){var I=cx+m*7.5,O=cx-m*7.5;
    s+='<path d="M'+f1(O)+' 0C'+f1(O-m*3.5)+' 16 '+f1(O-m*2.5)+' 34 '+f1(cx-m*5.5)+' 58L'+f1(cx-m*5)+' 84L'+f1(cx+m*5)+' 84L'+f1(cx+m*5.5)+' 60C'+f1(I+m*1.5)+' 40 '+f1(I+m*5)+' 20 '+f1(I)+' 0Z" class="ft"/>';
    s+='<path d="M'+f1(cx+m*1.5)+' 10C'+f1(cx+m*3)+' 30 '+f1(cx+m*1.5)+' 50 '+f1(cx+m*1)+' 70" class="ftd"/>';
    if(FOCUS==="shin")s+='<path d="M'+f1(cx-m*2.5)+' 8C'+f1(cx-m*6.5)+' 26 '+f1(cx-m*5)+' 48 '+f1(cx-m*2.5)+' 66C'+f1(cx)+' 48 '+f1(cx+m*.5)+' 26 '+f1(cx-m*2.5)+' 8Z" class="mhl"/>';
  }else s+='<path d="M'+(cx-7)+" 0C"+(cx-9)+" 30 "+(cx-8)+" 60 "+(cx-6)+" 84L"+(cx+6)+" 84C"+(cx+8)+" 60 "+(cx+9)+" 30 "+(cx+7)+' 0" class="ft"/>';
  s+='<path d="M'+(cx-12)+" 102C"+(cx-13)+" 94 "+(cx-9)+" 86 "+(cx-5)+" 84L"+(cx+5)+" 84C"+(cx+9)+" 86 "+(cx+13)+" 94 "+(cx+12)+' 102Z" class="ft"/>';
  [[8.5,3],[3.6,2.2],[-0.4,2],[-4.2,1.8],[-7.8,1.6]].forEach(function(q){s+=ci([cx+m*q[0],100.5-q[1]*0.4],q[1],"ft");});
  s+="</g>";
  if(show)s+=ci([px,102],2.6,"acf");
  return s;
}
function lying(an,sc,x,y){
  var g=fig({hip:[100,100],tor:-90,legs:[{th:90,kn:0,an:an},{th:90,kn:0,an:an}],arms:[{sh:93,el:0},{sh:93,el:0}]});
  return grp(x,y,sc,ln([45,106],[160,106],"fl")+g.svg);
}
var HANDS_ON_HIPS=[{a1:40,a2:-35},{a1:40,a2:-35}];

A.bear={T:1.6,f:function(p){
  var w=2*PI*p,l1=7*Math.max(0,Math.sin(w)),l2=7*Math.max(0,-Math.sin(w));
  return ln([8,110],[66,110],"fl")+figF({x:36,y:57,sc:0.55,legs:[{ank:[31,105-l1*1.4]},{ank:[41,105-l2*1.4]}],arms:HANDS_ON_HIPS})+
    ln([92,102],[236,102],"fl")+legFront(140,-1,{tilt:14,lift:l1})+legFront(186,1,{tilt:14,lift:l2})+
    tx(165,116,"спереди: идём на наружных краях","capa");
}};
A.raise={T:2.6,f:function(p){
  var u=ease(p),h=13*u;
  var g=grounded(function(hy){return fig({hip:[56,hy],tor:2,far:[-2,0],legs:[{th:0,kn:0,an:-40*u},{th:0,kn:0,an:-40*u}],arms:[{to:[80,51],side:1},{sh:6,el:0}]});},110);
  var a=g.legs[0].ank;
  return chair(95,84)+ln([4,110],[116,110],"fl")+g.svg+ci([a[0]+1,a[1]+1],4,"ball")+tx(40,118,"сбоку")+
    divider()+ln([126,102],[236,102],"fl")+legBack(163,-1,{lift:h,axis:1})+legBack(197,1,{lift:h,axis:1})+ci([180,82-h],10,"ball")+
    tx(181,116,"сзади: пятки ровно");
}};
A.rollwalk={T:2.4,f:function(p){
  var left=grp(-30.5,27.5,0.75,walk((p*2)%1,{bare:1,an:function(th,c){var w=sm((0.3-c)/0.6);return w*th*1.1+(1-w)*6;},arms:function(w){return [{sh:-14*Math.sin(w),el:14},{sh:14*Math.sin(w),el:14}];}}));
  var sc=1.3,X=138,Y=100,bx=29,rot=0,px=0,lift=0,act=0,cp=null;
  if(p<0.25){rot=lerp(-22,0,sm(p/0.25));cp=[X,Y];act=0;}
  else if(p<0.5){cp=[X+14*sc,Y];act=1;}
  else if(p<0.8){rot=lerp(0,32,sm((p-0.5)/0.3));px=bx;cp=[X+bx*sc,Y];act=2;}
  else{var k=sm((p-0.8)/0.2);rot=lerp(32,-22,k);px=lerp(bx,0,k);lift=10*Math.sin(PI*k);act=-1;}
  var s=ln([6,110],[114,110],"fl")+left+divider()+ln([126,Y+1],[236,Y+1],"fl")+footSide(X,Y-lift,{sc:sc,rot:rot,px:px,shin:40});
  if(cp)s+=ci(cp,3,"acf");
  s+=tx(138,116,"пятка",act===0?"capa":"cap")+tx(155,116,"→")+tx(180,116,"вся стопа",act===1?"capa":"cap")+tx(205,116,"→")+tx(223,116,"носок",act===2?"capa":"cap");
  return s;
}};
A.wipers={T:2.4,f:function(p){
  var a=11*ease(p),s=lying(0,0.8,-8.4,15)+tx(58,114,"лёжа, ноги прямые")+divider();
  [[164,0],[200,1]].forEach(function(q){s+='<rect x="'+(q[0]-5)+'" y="88" width="10" height="34" class="ft"/>';});
  s+=footTop(164,90,{cls:"gh"})+footTop(200,90,{mir:1,cls:"gh"})+footTop(164,90,{rot:a})+footTop(200,90,{mir:1,rot:-a});
  s+=ci([164,90],2.6,"acf")+ci([200,90],2.6,"acf")+arcA(164,90,54,252,266)+arcA(200,90,54,288,274);
  return s+tx(182,12,"вид сверху: пятки на месте","capa");
}};
A.ladoshki={T:3.2,f:function(p){
  var u=sm(Math.min(1,ease(p)*1.25)),s=lying(25*u,0.9,-37,4)+arcA(96,94,12,300,245)+tx(58,116,"сбоку: носки на себя")+divider();
  // вид сверху на лежащего: голова вверху, ноги вниз, стопы торчат носками к потолку
  if(STYLE==="A")s+=skShape([[171,18],[189,18],[186.6,29],[187.4,40.5],[172.6,40.5],[173.4,29]],false)+skLimb([170.5,19.5],[167.5,40],A_UA,A_UA,false)+skLimb([189.5,19.5],[192.5,40],A_UA,A_UA,false)+skShape(ellPts([180,9],5,5.8,0,12),false);
  else s+=ci([180,9],5.5,"hd")+ln([180,15],[180,40])+ln([171,19],[189,19])+pl([[171,19],[168,40]],"k")+pl([[189,19],[192,40]],"k")+ln([174,40],[186,40]);
  [-1,1].forEach(function(sd){
    var ank=[180+sd*(18-6*u),76],ang=sd*85*u,c=[ank[0],ank[1]+10],m=-sd,toes="";
    s+=STYLE==="A"?skLimb([180+sd*6,40],ank,[[0,4.8],[.5,3.6],[1,2.6]],[[0,4.8],[.5,3.8],[1,2.6]],false):ln([180+sd*6,40],ank);
    [[7.5,2.9],[2.8,2.2],[-1.5,2],[-5.4,1.8],[-8.8,1.6]].forEach(function(q){toes+=ci([c[0]+m*q[0],c[1]-1.5],q[1],"ft");});
    s+='<g transform="rotate('+f1(ang)+" "+f1(c[0])+" "+f1(c[1])+')"><rect x="'+f1(c[0]-13)+'" y="'+f1(c[1]-6)+'" width="26" height="12" rx="6" class="ft"/>'+toes+
       ln([c[0]-10,c[1]+6.5],[c[0]+10,c[1]+6.5],"ac")+"</g>";
  });
  s+=tx(128,12,"вид сверху","cap","start");
  return s+tx(182,116,u>0.5?"подошвы — как ладошки":"оранжевое — подошвы",u>0.5?"capa":"cap");
}};

/* ---- отпечаток стопы (правая нога, вид сверху: пятка внизу, большой палец слева) ---- */
function printPath(cx,cy,inset,mir){ // inset 0 = плоская стопа (широкая середина), 1 = свод поднят (выемка)
  var k=mir?-1:1,X=function(dx){return f1(cx+k*dx);},Y=function(dy){return f1(cy+dy);};
  return "M"+X(0)+" "+Y(30)+"C"+X(-10)+" "+Y(30)+" "+X(-9)+" "+Y(16)+" "+X(-8)+" "+Y(12)+
         "Q"+X(-15+23*inset)+" "+Y(-1)+" "+X(-10)+" "+Y(-16)+
         "C"+X(-11)+" "+Y(-28)+" "+X(-5)+" "+Y(-32)+" "+X(1)+" "+Y(-31)+
         "C"+X(9)+" "+Y(-30)+" "+X(13)+" "+Y(-24)+" "+X(11)+" "+Y(-14)+
         "L"+X(9)+" "+Y(12)+"C"+X(9)+" "+Y(24)+" "+X(8)+" "+Y(30)+" "+X(0)+" "+Y(30)+"Z";
}
function printToes(cx,cy,mir,cls){
  var k=mir?-1:1,s="";
  [[-6,-38,3.6],[0,-39.5,2.6],[4.6,-38.5,2.3],[8.6,-36,2.1],[11.6,-32.5,1.9]].forEach(function(q){s+=ci([cx+k*q[0],cy+q[1]],q[2],cls);});
  return s;
}

A.shortfoot={T:4,f:function(p){
  // Reference movement: keep heel and toes in contact, shorten the foot gently
  // without clawing the toes. Diagram is schematic, not a clinical measurement.
  var u=sm(Math.min(1,ease(p)*1.3)),sc=1.55,x=14,y=96;
  var o={sc:sc,arch:1.7*u,s:0.45*u,shin:40};
  var bx=40-7*o.s-11,ah=3+6*o.arch+2.5*o.s;
  var ax=x+0.45*bx*sc,ballX=x+bx*sc,tipX=x+(bx+11)*sc;
  var s=ln([2,y+1],[132,y+1],"fl");
  s+=footSide(x,y,{sc:sc,shin:40}).replace(/class="ft[nd]?"/g,'class="gh"');
  s+='<g transform="translate('+x+" "+y+") scale("+sc+')"><path d="M0 0Q'+f1(0.45*bx)+" "+f1(-2*ah)+" "+f1(bx)+' 0Z" class="gap"/></g>';
  s+=footSide(x,y,o);
  // Both support points stay grounded; only the arch and forefoot approach change.
  s+=ci([x,y],2.4,"acf")+ci([tipX,y],2.4,"acf");
  s+='<g opacity="'+f1(0.25+0.75*u)+'">'+arrow([ax,y-1],[ax,y-4-ah*sc*0.85])+arrow([ballX+6,y+12],[ballX-12,y+12])+"</g>";
  s+=tx(3,y+21,"свод вверх",u>0.5?"capa":"cap","start")+tx(116,y+21,"пальцы на полу","cap","end");
  s+=divider();
  s+=tx(182,10,"схема опоры");
  s+='<path d="'+printPath(182,72,u,0)+'" class="solea"/>'+printToes(182,72,0,"solea");
  s+=tx(182,116,u>0.5?"свод активирован":"стопа расслаблена",u>0.5?"capa":"cap");
  return s;
}};

A.tightrope={T:8,f:function(p){
  var q=p*8,k=Math.min(7,Math.floor(q)),sub=q-k,dir=k<4?-1:1,j=k<4?k:k-4;
  var c=k<4?82-9*j:46+9*j,lead=dir<0?0:1;
  var a=sm(Math.min(1,sub/0.5)),b=sm(Math.max(0,(sub-0.5)/0.5));
  var feet=[c-5,c+5],lift=[0,0];
  feet[lead]+=dir*9*a;feet[1-lead]+=dir*9*b;
  lift[lead]=6*Math.sin(PI*a);lift[1-lead]=6*Math.sin(PI*b);
  var hx=(feet[0]+feet[1])/2,ay=98.5;
  var s=ln([2,110],[116,110],"fl")+'<rect x="10" y="102" width="100" height="7" rx="3.5" class="prf"/>';
  s+=figF({x:hx,y:ay-48,sc:0.8,legs:[{ank:[feet[0],ay-lift[0]]},{ank:[feet[1],ay-lift[1]]}],arms:[{a1:65,a2:80},{a1:65,a2:80}]});
  s+=(dir<0?arrow([34,14],[14,14]):arrow([86,14],[106,14]))+tx(60,119,"шаг боком, держась за опору");
  s+=divider();
  // сбоку: стопа на палке, палка под серединой стопы
  var lf=Math.max(lift[0],lift[1])*1.4,X=142,Y=103-lf;
  s+=ln([124,110],[236,110],"fl")+ci([X+23,103],7,"prf")+ln([X+23,96],[X+23,110],"pr");
  s+=footSide(X,Y,{sc:1.45,arch:1.6,shin:40});
  s+=tx(181,10,"сбоку: палка под сводом","capa");
  return s;
}};

A.rollouts={T:2.8,f:function(p){
  var u=ease(p),t=14*u;
  var s=ln([2,102],[116,102],"fl")+'<g transform="translate(0 6) scale(0.92)">'+legFront(38,-1,{tilt:t})+legFront(84,1,{tilt:t})+"</g>";
  s+=tx(60,118,"спереди");
  s+=divider()+tx(181,10,"отпечаток: опора стопы");
  [[160,1],[204,0]].forEach(function(q){
    var cx=q[0],mir=q[1],id="rc"+(mir?"L":"R")+Math.round(u*1000),w=24*(1-0.78*u),xo=mir?cx-14:cx+14-w;
    s+='<defs><clipPath id="'+id+'"><rect x="'+f1(xo)+'" y="0" width="'+f1(w)+'" height="120"/></clipPath></defs>';
    s+='<path d="'+printPath(cx,70,0.35,mir)+'" class="ft"/>'+printToes(cx,70,mir,"ft");
    s+='<g clip-path="url(#'+id+')"><path d="'+printPath(cx,70,0.35,mir)+'" class="solea"/>'+printToes(cx,70,mir,"solea")+"</g>";
  });
  return s+tx(181,116,u>0.5?"опора на наружный край":"опора на всю стопу",u>0.5?"capa":"cap");
}};

A.hedgehog={T:6,f:function(p){
  // слева: сидя на стуле, стопа на мячике
  var g=fig({hip:[40,81],tor:-2,far:[-2,0],legs:[{to:[64,97],side:-1,flat:1},{to:[62,97],side:-1,flat:1}],arms:[{to:[56,86]},{to:[54,86]}]});
  var s=chair(38,84)+ln([2,111],[116,111],"fl")+g.svg+ci([68,104.5],6,"ball")+tx(60,10,"сидя на стуле")+divider();
  // справа: крупный план
  var R=11,cx=182,fy=108,hx,lift=0,cu=0,bx=cx,by=fy-R,ph=p<0.5;
  if(ph){var u=ease(p/0.5);hx=cx-40+22*u;}
  else{var t=(p-0.5)/0.5;hx=cx-44;cu=sm(t/0.2)*(1-sm((t-0.85)/0.15));lift=14*seg(t,0.25,0.45)*(1-seg(t,0.68,0.88));bx=hx+44;by=fy-R-lift;}
  var rot=hx/R,sp="";
  for(var i=0;i<12;i++){var a=rot+i*PI/6;sp+=ln([bx+R*Math.cos(a),by+R*Math.sin(a)],[bx+(R+3)*Math.cos(a),by+(R+3)*Math.sin(a)],"pr");}
  s+=ln([124,fy],[236,fy],"fl")+sp+ci([bx,by],R,"ball")+footSide(hx,fy-2*R-lift,{sc:1.45,curl:cu,shin:40});
  if(ph)s+=arrow([150,20],[176,20])+arrow([176,20],[150,20])+tx(182,116,"1. катаем мячик","capa");
  else s+=(lift>2?arrow([224,90],[224,62]):"")+tx(182,116,"2. захват пальцами и подъём","capa");
  return s;
}};

/* 26 individual anatomical movement studies: supplementary close-ups below each scene.
   Every study uses the same detailed sketch-foot geometry and its own motion model. */
var ANIME_STUDIES={
  circles:{label:"вращение в голеностопе",view:"top",rot:30,spread:0,curl:0},
  noski:{label:"сгибание и разгибание стопы",view:"side",rot:25,spread:0,curl:0},
  soldier:{label:"опора на носки",view:"side",rot:24,spread:0,curl:0},
  penguin:{label:"опора на пятки",view:"side",rot:-24,spread:0,curl:0},
  claps:{label:"подошвы вместе",view:"top",rot:0,spread:-26,curl:0},
  caterpillar:{label:"сокращение стопы",view:"side",rot:0,spread:0,curl:1},
  towel:{label:"захват ткани",view:"side",rot:0,spread:0,curl:0.85},
  cleanup:{label:"поднять предмет",view:"side",rot:0,spread:0,curl:1},
  rollpin:{label:"скалка под сводом",view:"side",rot:0,spread:0,curl:0},
  artist:{label:"рисование стопой",view:"top",rot:24,spread:0,curl:0},
  heron:{label:"опорная стопа без завала",view:"top",rot:0,spread:0,curl:0},
  fivepoints:{label:"контроль осанки у стены",view:"top",rot:0,spread:0,curl:0},
  angel:{label:"скольжение рук по стене",view:"top",rot:0,spread:0,curl:0},
  wallsit:{label:"колени вперёд, свод поднят",view:"side",rot:0,spread:0,curl:0},
  bike:{label:"педали и работа голеностопа",view:"side",rot:18,spread:0,curl:0},
  stowel:{label:"растяжение с полотенцем",view:"side",rot:-20,spread:0,curl:0},
  swall:{label:"задняя пятка на полу",view:"side",rot:0,spread:0,curl:0},
  rags:{label:"расслабление голеностопа",view:"top",rot:10,spread:0,curl:0},
  bear:{label:"наружный край стопы",view:"top",rot:0,spread:15,curl:0},
  raise:{label:"подъём на носки с мячом",view:"side",rot:22,spread:0,curl:0},
  rollwalk:{label:"опора: пятка → носок",view:"side",rot:22,spread:0,curl:0},
  wipers:{label:"пятки неподвижны",view:"top",rot:0,spread:-18,curl:0},
  ladoshki:{label:"носки на себя, подошвы внутрь",view:"side",rot:-18,spread:0,curl:0},
  tightrope:{label:"палка под внутренним сводом",view:"top",rot:0,spread:0,curl:0},
  rollouts:{label:"опора снаружи",view:"top",rot:0,spread:15,curl:0},
  hedgehog:{label:"перекат мяча и захват",view:"side",rot:0,spread:0,curl:0.6},
};
function motionDetail(name,p){
  var u=ease(p),s='<path d="M4 128H236" class="fl"/>';
  if(name==="heron"){
    // Support leg is stationary; the other knee rises, not the supporting foot.
    s+=tx(8,139,"Цапля: стойка на одной ноге","cap","start");
    s+=ln([72,169],[158,169],"fl")+footSide(80,169,{sc:.7,shin:30});
    s+=ln([105,144],[126,144-15*u],"sk")+ln([126,144-15*u],[144,157-22*u],"sk");
    s+=ci([126,144-15*u],3,"prf")+arrow([160,160],[160,160-22*u]);
  }else if(name==="angel"||name==="fivepoints"){
    var arm=name==="angel",y=158-17*u;
    s+=tx(8,139,arm?"Ангел: руки скользят по стене":"Осанка: шаг от стены","cap","start");
    s+='<rect x="96" y="143" width="4" height="30" class="wall"/>';
    var x=arm?120:120+20*u;
    s+=ci([x,148],5,"sk")+ln([x,153],[x,165],"sk");
    s+=ln([x,156],[x-12,arm?y:158],"sk")+ln([x,156],[x+12,arm?y:158],"sk");
    s+=ln([x,165],[x-8,173],"sk")+ln([x,165],[x+8,173],"sk");
    s+=arrow(arm?[170,165]:[145,173],arm?[170,146]:[167,173]);
  }else if(name==="wallsit"){
    s+=tx(8,139,"Стульчик: спина у стены","cap","start");
    s+='<rect x="62" y="144" width="5" height="30" class="wall"/>';
    var h=148+12*u;
    s+=ci([78,h-7],5,"sk")+ln([77,h-2],[78,h+11],"sk");
    s+=ln([78,h+11],[101,164],"sk")+ln([101,164],[111,173],"sk");
    s+=ln([78,h+11],[95,166],"sk")+ln([95,166],[102,173],"sk");
    s+=arrow([150,147],[150,164]);
  }else if(name==="rollpin"||name==="hedgehog"){
    var ball=name==="hedgehog",x=83+26*u,rad=ball?9:7;
    s+=tx(8,139,ball?"Ёжик: катим и захватываем":"Скалка: перекат под сводом","cap","start");
    s+=ln([35,174],[173,174],"fl");
    if(ball){s+=ci([x,166],rad,"ball");for(var i=0;i<10;i++){var a=i*PI/5;s+=ln([x+rad*Math.cos(a),166+rad*Math.sin(a)],[x+(rad+2)*Math.cos(a),166+(rad+2)*Math.sin(a)],"pr");}}
    else{s+='<rect x="'+f1(x-6)+'" y="160" width="12" height="14" rx="5" class="ball"/>'+ln([x,160],[x,174],"pr");}
    s+=footSide(61+19*u,160,{sc:.92,shin:24,curl:ball?u*.65:0});
    s+=arrow([85,146],[112,146]);
  }else if(name==="tightrope"){
    s+=tx(8,139,"Канатоходец: приставной шаг","cap","start");
    s+=ln([37,164],[195,164],"pr");
    var d=18*u;
    s+=footTop(83+d,167,{sc:.65,rot:90});
    s+=footTop(117+d*.5,167,{sc:.65,rot:90,mir:1});
    s+=arrow([141,147],[141+18*u,147]);
  }else return null;
  return s+tx(231,163,u>.5?"движение":"исходно",u>.5?"capa":"cap","end");
}
function animeStudy(name,p){
  var o=ANIME_STUDIES[name];if(!o)return "";
  var custom=motionDetail(name,p);if(custom!==null)return custom;
  var t=ease(p),a=t*o.rot,spread=t*o.spread,cu=t*o.curl;
  var s='<path d="M4 128H236" class="fl"/>'+tx(8,139,o.label,"cap","start");
  // Foot close-up: movement direction is encoded in the geometry, not just arrows.
  if(o.view==="top"){
    s+=footTop(67,168,{sc:.64,rot:-a-spread*.5});
    s+=footTop(105,168,{sc:.64,rot:a+spread*.5,mir:1});
    if(o.rot||o.spread)s+=arrow([155,160],[155+Math.max(-20,Math.min(20,a+spread)),151]);
  }else{
    s+=footSide(49,169,{sc:.92,shin:28,rot:a,curl:cu,arch:name==="caterpillar"?1.6*t:0,s:name==="caterpillar"?.5*t:0});
    if(o.rot||o.curl||name==="caterpillar")s+=arrow([158,165],[158+Math.max(-18,Math.min(18,a*.6)),148-9*cu]);
  }
  s+=tx(231,163,t>.5?"движение":"исходно",t>.5?"capa":"cap","end");
  return s;
}
Object.keys(ANIME_STUDIES).forEach(function(name){
  var original=A[name].f;
  A[name].f=function(p){return original(p)+animeStudy(name,p);};
});

A.setFocus=function(f){FOCUS=f||null;};A.setStyle=function(x){STYLE=x;};A.seed=function(n){SKSEED=n;};A.sketchify=function(s){return sketchify(s);};
return A;
})();
