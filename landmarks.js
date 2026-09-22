/* Hitos de Buenos Aires modelados en 3D con geometría procedural.
   Unidades: metros. x = este, y = norte, z = arriba. Colores en 0..1.
   Coordenadas confirmadas contra OpenStreetMap (landmarks_geo.py). */
(function(){
'use strict';
function Mesh(){ this.P=[]; this.N=[]; this.C=[]; }
Mesh.prototype.tri=function(a,b,c,col){
  const ux=b[0]-a[0],uy=b[1]-a[1],uz=b[2]-a[2], vx=c[0]-a[0],vy=c[1]-a[1],vz=c[2]-a[2];
  let nx=uy*vz-uz*vy, ny=uz*vx-ux*vz, nz=ux*vy-uy*vx; const l=Math.hypot(nx,ny,nz)||1; nx/=l;ny/=l;nz/=l;
  for(const p of [a,b,c]){ this.P.push(p[0],p[1],p[2]); this.N.push(nx,ny,nz); this.C.push(col[0],col[1],col[2]); }
};
Mesh.prototype.quad=function(a,b,c,d,col){ this.tri(a,b,c,col); this.tri(a,c,d,col); };
Mesh.prototype.quad2=function(a,b,c,d,col){ this.quad(a,b,c,d,col); this.quad(a,d,c,b,col); }; // dos caras
// prisma de base rectangular que puede afinarse hacia arriba (w,d = medio ancho / media profundidad)
Mesh.prototype.frustum=function(cx,cy,w0,d0,w1,d1,z0,h,col,top=true,colTop){
  const B=[[cx-w0,cy-d0,z0],[cx+w0,cy-d0,z0],[cx+w0,cy+d0,z0],[cx-w0,cy+d0,z0]];
  const T=[[cx-w1,cy-d1,z0+h],[cx+w1,cy-d1,z0+h],[cx+w1,cy+d1,z0+h],[cx-w1,cy+d1,z0+h]];
  for(let i=0;i<4;i++){ const j=(i+1)%4; this.quad(B[i],B[j],T[j],T[i],col); }
  if(top) this.quad(T[0],T[1],T[2],T[3],colTop||col);
  return this;
};
Mesh.prototype.box=function(cx,cy,w,d,z0,h,col,colTop){ return this.frustum(cx,cy,w/2,d/2,w/2,d/2,z0,h,col,true,colTop); };
Mesh.prototype.pyramid=function(cx,cy,w,d,z0,h,col){
  const B=[[cx-w/2,cy-d/2,z0],[cx+w/2,cy-d/2,z0],[cx+w/2,cy+d/2,z0],[cx-w/2,cy+d/2,z0]], A=[cx,cy,z0+h];
  for(let i=0;i<4;i++) this.tri(B[i],B[(i+1)%4],A,col); return this;
};
Mesh.prototype.cyl=function(cx,cy,r0,r1,z0,h,col,seg=20,top=true,colTop,sy=1){
  const pts=k=>{const a=k/seg*Math.PI*2;return [Math.cos(a),Math.sin(a)*sy]};
  for(let k=0;k<seg;k++){ const [c0,s0]=pts(k),[c1,s1]=pts(k+1);
    this.quad([cx+c0*r0,cy+s0*r0,z0],[cx+c1*r0,cy+s1*r0,z0],[cx+c1*r1,cy+s1*r1,z0+h],[cx+c0*r1,cy+s0*r1,z0+h],col);
    if(top) this.tri([cx,cy,z0+h],[cx+c0*r1,cy+s0*r1,z0+h],[cx+c1*r1,cy+s1*r1,z0+h],colTop||col); }
  return this;
};
// cúpula (dir=1 hacia arriba, -1 hacia abajo); k = achatamiento vertical
Mesh.prototype.dome=function(cx,cy,r,z0,col,seg=20,rings=7,k=1,dir=1){
  for(let i=0;i<rings;i++){ const a0=i/rings*Math.PI/2, a1=(i+1)/rings*Math.PI/2;
    const r0=Math.cos(a0)*r, r1=Math.cos(a1)*r, z_0=z0+dir*Math.sin(a0)*r*k, z_1=z0+dir*Math.sin(a1)*r*k;
    for(let s=0;s<seg;s++){ const b0=s/seg*Math.PI*2, b1=(s+1)/seg*Math.PI*2;
      const p00=[cx+Math.cos(b0)*r0,cy+Math.sin(b0)*r0,z_0], p01=[cx+Math.cos(b1)*r0,cy+Math.sin(b1)*r0,z_0];
      const p10=[cx+Math.cos(b0)*r1,cy+Math.sin(b0)*r1,z_1], p11=[cx+Math.cos(b1)*r1,cy+Math.sin(b1)*r1,z_1];
      if(dir>0){ if(i===rings-1) this.tri(p00,p01,p10,col); else this.quad(p00,p01,p11,p10,col); }
      else { if(i===rings-1) this.tri(p00,p10,p01,col); else this.quad(p00,p10,p11,p01,col); } } }
  return this;
};
// anillo tipo estadio (paredes exterior e interior y coronamiento); sy achata en y
Mesh.prototype.ring=function(cx,cy,rO,rI,z0,h,col,seg=36,sy=1,colTop){
  for(let k=0;k<seg;k++){ const a0=k/seg*Math.PI*2, a1=(k+1)/seg*Math.PI*2;
    const o0=[cx+Math.cos(a0)*rO,cy+Math.sin(a0)*rO*sy], o1=[cx+Math.cos(a1)*rO,cy+Math.sin(a1)*rO*sy];
    const i0=[cx+Math.cos(a0)*rI,cy+Math.sin(a0)*rI*sy], i1=[cx+Math.cos(a1)*rI,cy+Math.sin(a1)*rI*sy];
    this.quad([...o0,z0],[...o1,z0],[...o1,z0+h],[...o0,z0+h],col);
    this.quad([...i1,z0],[...i0,z0],[...i0,z0+h*.55],[...i1,z0+h*.55],col); // tribuna interior más baja
    this.quad([...o0,z0+h],[...o1,z0+h],[...i1,z0+h*.55],[...i0,z0+h*.55],colTop||col); }
  return this;
};
// prisma inclinado entre dos centros (mástil)
Mesh.prototype.beam=function(a,b,w,col){
  const dx=b[0]-a[0],dy=b[1]-a[1]; const L=Math.hypot(dx,dy)||1; const px=-dy/L*w, py=dx/L*w;
  const A=[[a[0]-px,a[1]-py,a[2]-w],[a[0]+px,a[1]+py,a[2]-w],[a[0]+px,a[1]+py,a[2]+w],[a[0]-px,a[1]-py,a[2]+w]];
  const B=[[b[0]-px,b[1]-py,b[2]-w],[b[0]+px,b[1]+py,b[2]-w],[b[0]+px,b[1]+py,b[2]+w],[b[0]-px,b[1]-py,b[2]+w]];
  for(let i=0;i<4;i++){ const j=(i+1)%4; this.quad2(A[i],A[j],B[j],B[i],col); }
  return this;
};
Mesh.prototype.build=function(){
  const n=this.P.length/3;
  return {attributes:{positions:{value:new Float32Array(this.P),size:3},normals:{value:new Float32Array(this.N),size:3},colors:{value:new Float32Array(this.C),size:3},texCoords:{value:new Float32Array(n*2),size:2}}};
};

const STONE=[.88,.89,.92], STONE2=[.78,.8,.85], WHITE=[.96,.97,.99], GREEN=[.36,.74,.63], PINK=[.96,.6,.66], GOLD=[1,.82,.25],
  RED=[.95,.2,.28], BRICK=[.78,.43,.33], TERRA=[.86,.55,.36], SLATE=[.42,.52,.63], CYAN=[.35,.88,1], STEEL=[.74,.79,.87], BLUE=[.12,.3,.82], YEL=[1,.84,.12], GLASS=[.55,.8,.95];

const LM=[
 {id:'obelisco',n:'Obelisco',y:1936,h:68,fp:12,major:1,d:'El símbolo de la ciudad: 67,5 metros en el cruce de la 9 de Julio y Corrientes. Se levantó en 1936 por el cuarto centenario de la primera fundación.',
  m:M=>{M.box(0,0,12,12,0,1.5,STONE2); M.frustum(0,0,3.5,3.5,1.75,1.75,1.5,62,WHITE,false); M.pyramid(0,0,3.5,3.5,63.5,4.5,WHITE);}},
 {id:'congreso',n:'Congreso de la Nación',y:1906,h:80,fp:130,major:1,d:'El Palacio del Congreso cierra la Avenida de Mayo frente a la Plaza del Congreso. Su cúpula de bronce verde llega a unos 80 metros.',
  m:M=>{M.box(0,0,112,64,0,30,STONE); M.box(0,-38,64,14,0,26,STONE2); for(let i=0;i<10;i++) M.cyl(-27+i*6,-45,1.5,1.5,0,24,WHITE,10,false); M.pyramid(0,-38,66,14,26,7,STONE);
    M.cyl(0,6,26,24,30,16,STONE,28); for(let i=0;i<16;i++){const a=i/16*Math.PI*2; M.cyl(Math.cos(a)*24,6+Math.sin(a)*24,1.4,1.4,30,14,WHITE,6,false);}
    M.dome(0,6,24,46,GREEN,28,9,1.25); M.cyl(0,6,4.5,3.6,74,8,GREEN,14); M.dome(0,6,4.5,82,GOLD,12,4,1.5);}},
 {id:'casarosada',n:'Casa Rosada',y:1898,h:28,fp:110,major:1,d:'La sede del Poder Ejecutivo, frente a la Plaza de Mayo. Su rosa es una de las postales de Buenos Aires.',
  m:M=>{M.box(0,0,90,70,0,22,PINK); M.box(-47,0,8,22,0,27,PINK); M.box(-47,0,5,10,0,14,[.35,.2,.24]); M.frustum(0,0,45,35,40,30,22,4,[.8,.5,.55]);}},
 {id:'cabildo',n:'Cabildo',y:1751,h:32,fp:55,major:0,d:'El edificio colonial donde se gestó la Revolución de Mayo de 1810. Hoy es museo, frente a la Plaza de Mayo.',
  m:M=>{M.box(0,0,18,50,0,13,WHITE); M.box(0,0,9,9,13,13,WHITE); M.pyramid(0,0,9,9,26,5,[.8,.45,.35]); M.frustum(0,0,9,25,7,23,13,2,[.8,.45,.35]);}},
 {id:'catedral',n:'Catedral Metropolitana',y:null,h:48,fp:100,major:0,d:'Su fachada de doce columnas parece un templo griego. Adentro está el mausoleo del general San Martín.',
  m:M=>{M.box(0,0,70,95,0,24,STONE); M.box(0,-52,72,10,0,22,STONE2); for(let i=0;i<12;i++) M.cyl(-33+i*6,-57,1.2,1.2,0,20,WHITE,8,false); M.pyramid(0,-52,72,10,22,7,STONE);
    M.cyl(0,10,11,11,24,8,STONE,20); M.dome(0,10,11,32,[.55,.62,.7],20,6,1.3);}},
 {id:'colon',n:'Teatro Colón',y:1908,h:36,fp:120,major:1,d:'Uno de los teatros líricos con mejor acústica del mundo, inaugurado en 1908 frente a la Plaza Lavalle.',
  m:M=>{M.box(0,0,110,75,0,28,[.92,.88,.8]); M.box(-58,0,12,40,0,30,[.92,.88,.8]); M.frustum(0,0,55,37,48,30,28,7,SLATE); for(let i=0;i<5;i++) M.cyl(-65,-14+i*7,1.2,1.2,0,24,WHITE,8,false);}},
 {id:'barolo',n:'Palacio Barolo',y:1923,h:100,fp:40,major:0,d:'Rascacielos de 100 metros inspirado en la Divina Comedia, sobre la Avenida de Mayo. En la cima tiene un faro.',
  m:M=>{M.box(0,0,36,28,0,60,[.9,.86,.78]); M.frustum(0,0,9,9,7,7,60,22,[.9,.86,.78]); M.cyl(0,0,6,5,82,6,[.9,.86,.78],12); M.cyl(0,0,3.2,3.2,88,7,GOLD,12); M.dome(0,0,3.6,95,[.9,.86,.78],12,4,1.4);}},
 {id:'kavanagh',n:'Edificio Kavanagh',y:1936,h:120,fp:45,major:0,d:'Rascacielos racionalista de 1936 frente a la Plaza San Martín; fue el edificio de hormigón más alto de Sudamérica.',
  m:M=>{M.box(0,0,44,40,0,58,STONE); M.box(4,3,32,28,58,26,STONE); M.box(7,6,20,18,84,20,STONE); M.box(9,8,11,10,104,12,STONE); M.cyl(9,8,.5,.5,116,6,WHITE,6,false);}},
 {id:'torremonumental',n:'Torre Monumental',y:1916,h:76,fp:20,major:1,d:'La antigua Torre de los Ingleses, con su reloj de cuatro caras frente a la estación Retiro.',
  m:M=>{M.box(0,0,17,17,0,48,BRICK); M.box(0,0,15,15,48,10,WHITE); M.box(0,0,12,12,58,6,BRICK); M.cyl(0,0,5,5,64,4,WHITE,12); M.dome(0,0,5,68,[.45,.62,.6],12,5,1.5);}},
 {id:'floralis',n:'Floralis Genérica',y:2002,h:24,fp:34,major:1,d:'Flor gigante de acero y aluminio que abre sus pétalos de día y los cierra de noche, en la Plaza de las Naciones Unidas.',
  m:M=>{M.cyl(0,0,9,9,0,1.2,[.2,.25,.32],24); M.cyl(0,0,1.4,1.2,1.2,8,STEEL,10);
    for(let k=0;k<6;k++){ const a=k/6*Math.PI*2, a1=a-.28, a2=a+.28; const b=[Math.cos(a)*2,Math.sin(a)*2,9], l=[Math.cos(a1)*9,Math.sin(a1)*9,17], r=[Math.cos(a2)*9,Math.sin(a2)*9,17], t=[Math.cos(a)*15,Math.sin(a)*15,24];
      M.quad2(b,l,t,r,STEEL);} M.dome(0,0,2.2,9,GOLD,10,3,1);}},
 {id:'planetario',n:'Planetario Galileo Galilei',y:1966,h:30,fp:42,major:1,d:'El platillo volador de los bosques de Palermo: una esfera plateada sobre tres patas, abierta en 1966.',
  m:M=>{for(let k=0;k<3;k++){const a=k/3*Math.PI*2+.5; M.beam([Math.cos(a)*16,Math.sin(a)*16,0],[Math.cos(a)*9,Math.sin(a)*9,12],1.1,STEEL);}
    M.dome(0,0,20,15,[.8,.84,.9],28,7,.55,-1); M.cyl(0,0,20.4,20.4,14.5,1.4,CYAN,32); M.dome(0,0,20,15.9,[.9,.93,.97],28,8,.75);}},
 {id:'puentemujer',n:'Puente de la Mujer',y:2001,h:40,fp:100,major:0,d:'Puente giratorio de Santiago Calatrava sobre el Dique 3 de Puerto Madero; su mástil evoca una pareja bailando tango.',
  m:M=>{M.box(0,0,100,6,5,1.6,WHITE); M.box(-48,0,6,8,0,5,STONE2); M.box(48,0,6,8,0,5,STONE2); const top=[-2,0,40]; M.beam([-24,0,6.6],top,1.3,WHITE);
    for(let i=1;i<=7;i++){ const x=-20+i*6; M.beam(top,[x,0,6.6],.18,[.85,.9,.98]); }}},
 {id:'bombonera',n:'La Bombonera',y:1940,h:40,fp:170,major:1,d:'El estadio de Boca Juniors, en La Boca. Tiene una tribuna recta que lo hace "latir" cuando se llena.',
  m:M=>{M.ring(0,0,86,52,0,34,BLUE,40,.74,YEL); M.box(0,-58,120,6,0,38,YEL); M.box(0,0,95,58,0,.6,[.2,.6,.3]);}},
 {id:'monumental',n:'Estadio Monumental',y:1938,h:34,fp:250,major:1,d:'El estadio de River Plate en Núñez, el más grande del país.',
  m:M=>{M.ring(0,0,122,76,0,32,WHITE,48,.82,RED); M.box(0,0,100,64,0,.6,[.2,.6,.3]); M.ring(0,0,123,121,20,3,RED,48,.82);}},
 {id:'aguas',n:'Palacio de Aguas Corrientes',y:1894,h:32,fp:95,major:0,d:'Un depósito de agua disfrazado de palacio: su fachada tiene más de 170.000 piezas de cerámica y terracota.',
  m:M=>{M.box(0,0,90,90,0,22,TERRA); M.frustum(0,0,45,45,36,36,22,8,SLATE); for(const [x,y] of [[-42,-42],[42,-42],[42,42],[-42,42]]){ M.box(x,y,12,12,0,27,TERRA); M.frustum(x,y,6,6,2,2,27,6,SLATE);}}},
 {id:'derecho',n:'Facultad de Derecho',y:1949,h:34,fp:180,major:0,d:'La mole de columnas de la UBA junto a la Floralis Genérica, sobre la avenida Figueroa Alcorta.',
  m:M=>{M.box(0,0,170,60,0,30,STONE); M.box(0,-36,70,12,0,28,STONE2); for(let i=0;i<14;i++) M.cyl(-32.5+i*5,-43,1.4,1.4,0,26,WHITE,8,false); M.pyramid(0,-36,72,12,28,6,STONE);}},
 {id:'usina',n:'Usina del Arte',y:1916,h:56,fp:75,major:0,d:'Antigua usina eléctrica de ladrillo con torre del reloj, reciclada como centro cultural en La Boca.',
  m:M=>{M.box(0,0,70,40,0,24,BRICK); M.frustum(0,0,35,20,31,16,24,6,[.4,.3,.3]); M.box(30,-15,11,11,0,46,BRICK); M.box(30,-15,9,9,46,4,WHITE); M.pyramid(30,-15,11,11,50,7,[.4,.3,.3]);}},
 {id:'espanoles',n:'Monumento de los Españoles',y:1927,h:26,fp:26,major:0,d:'Monumento blanco regalado por la colectividad española, en la rotonda de Libertador y Sarmiento.',
  m:M=>{M.box(0,0,22,22,0,3,STONE2); M.frustum(0,0,7,7,5,5,3,6,WHITE); M.cyl(0,0,3.2,2.6,9,13,WHITE,14); M.box(0,0,3,3,22,4,GOLD);}},
 {id:'torreespacial',n:'Torre Espacial',y:null,h:215,fp:26,major:1,d:'La torre más alta de la ciudad, en el Parque de la Ciudad de Villa Soldati. Desde el sur se ve de todos lados.',
  m:M=>{M.cyl(0,0,6,3.5,0,170,WHITE,14,false); M.cyl(0,0,9,13,170,6,[.85,.9,.96],18); M.cyl(0,0,13,13,176,8,GLASS,18); M.dome(0,0,13,184,WHITE,18,5,.5); M.cyl(0,0,.8,.4,190,25,RED,6,false);}},
 {id:'jardinjapones',n:'Jardín Japonés',y:1967,h:8,fp:40,major:0,d:'Jardín con estanque de carpas y puente rojo en los bosques de Palermo, regalo de la comunidad japonesa.',
  m:M=>{ const seg=12,L=34; for(let i=0;i<seg;i++){ const x0=-L/2+i*L/seg, x1=x0+L/seg, z0=Math.sin(i/seg*Math.PI)*5, z1=Math.sin((i+1)/seg*Math.PI)*5;
      M.quad2([x0,-2.5,z0+.6],[x1,-2.5,z1+.6],[x1,2.5,z1+.6],[x0,2.5,z0+.6],RED); M.quad2([x0,-2.5,z0],[x1,-2.5,z1],[x1,-2.5,z1+1.8],[x0,-2.5,z0+1.8],RED); M.quad2([x0,2.5,z0],[x1,2.5,z1],[x1,2.5,z1+1.8],[x0,2.5,z0+1.8],RED); }
    M.cyl(0,-12,9,9,0,.3,[.15,.45,.6],24); M.cyl(0,12,9,9,0,.3,[.15,.45,.6],24);}},
 {id:'caminito',n:'Caminito',y:1959,h:12,fp:60,major:1,d:'El pasaje museo de La Boca, con casas de chapa pintadas de colores y tango en la calle.',
  m:M=>{ const cols=[RED,YEL,BLUE,GREEN,[1,.5,.2],[.8,.3,.7]]; for(let i=0;i<6;i++){ const x=-25+i*10, y=(i%2?7:-7); M.box(x,y,8,9,0,7+(i%3)*2,cols[i]); M.frustum(x,y,4,4.5,.5,4.5,7+(i%3)*2,3,[.5,.5,.55]); }}},
 {id:'abasto',n:'Abasto',y:1934,h:44,fp:120,major:0,d:'El viejo mercado de abasto art déco, hoy shopping. El barrio del Abasto es tierra de Gardel.',
  m:M=>{M.box(0,0,110,85,0,26,[.9,.87,.8]); for(const [x,y] of [[-48,-36],[48,-36],[48,36],[-48,36]]){ M.box(x,y,16,16,0,36,[.9,.87,.8]); M.box(x,y,11,11,36,6,[.9,.87,.8]); }
    M.frustum(0,0,55,42,50,37,26,3,[.7,.72,.78]);}},
 {id:'tribunales',n:'Palacio de Justicia',y:1942,h:48,fp:110,major:0,d:'Tribunales: el palacio de la Corte Suprema frente a la Plaza Lavalle, a una cuadra del Teatro Colón.',
  m:M=>{M.box(0,0,100,100,0,30,STONE); M.box(0,0,40,40,30,12,STONE); M.frustum(0,0,20,20,15,15,42,6,SLATE); M.box(0,-53,50,8,0,26,STONE2);}}
];
const coords = {"obelisco":[-34.603709,-58.38163],"congreso":[-34.609824,-58.392732],"casarosada":[-34.608069,-58.370276],"cabildo":[-34.60888,-58.373673],"catedral":[-34.607474,-58.373277],"colon":[-34.601086,-58.383187],"barolo":[-34.609662,-58.385728],"kavanagh":[-34.595322,-58.374597],"torremonumental":[-34.592182,-58.37374],"floralis":[-34.581689,-58.394002],"planetario":[-34.569649,-58.411721],"puentemujer":[-34.608016,-58.365129],"bombonera":[-34.635517,-58.364916],"monumental":[-34.5449672,-58.4512225],"aguas":[-34.600312,-58.394678],"derecho":[-34.582483,-58.391851],"usina":[-34.628761,-58.357116],"espanoles":[-34.574966,-58.415056],"torreespacial":[-34.6728515,-58.4498158],"jardinjapones":[-34.57514,-58.409263],"caminito":[-34.639359,-58.362569],"abasto":[-34.602952,-58.41069],"tribunales":[-34.6022244,-58.3859412]};
LM.forEach(l=>{ const c=coords[l.id]; l.lat=c[0]; l.lng=c[1]; const M=new Mesh(); l.m(M); l.mesh=M.build(); delete l.m; });
window.LANDMARKS=LM;
})();
