// A complete, textured-photo-free character: sculpted head, eyes, ears and hair.
export function createAvatar(T){
 const root=new T.Group();
 const mat=(color,roughness=.65)=>new T.MeshStandardMaterial({color,roughness});
 const skin=mat('#c88d6c'),earInner=mat('#aa6654'),hair=mat('#30231e'),hairLight=mat('#493228'),beard=mat('#594035'),lip=mat('#a76459'),white=mat('#fff5e7',.28),iris=mat('#68402a',.28),pupil=mat('#181313',.2);
 function oval(parent,m,x,y,z,sx,sy,sz){const o=new T.Mesh(new T.SphereGeometry(1,40,28),m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);parent.add(o);return o;}
 function stroke(parent,m,points,r){const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));const o=new T.Mesh(new T.TubeGeometry(curve,32,r,10,false),m);parent.add(o);return o;}
 // Continuous sculpted head: ring widths taper into a rounded chin and crown.
 const profile=[[-1.35,.04,.07],[-1.27,.34,.40],[-1.12,.57,.57],[-.9,.73,.67],[-.6,.88,.77],[-.25,.98,.82],[.15,1,.86],[.55,.97,.87],[.95,.88,.81],[1.25,.66,.63],[1.43,.35,.37],[1.49,.02,.03]];
 const curve=new T.CatmullRomCurve3(profile.map(([y,x,z])=>new T.Vector3(x,y,z)));
 const positions=[],indices=[];const rows=90,cols=100;
 for(let j=0;j<=rows;j++){const p=curve.getPoint(j/rows);for(let i=0;i<=cols;i++){const a=i/cols*Math.PI*2;let x=Math.sin(a)*p.x,z=Math.cos(a)*p.z;const front=Math.max(0,Math.cos(a));z+=.065*Math.exp(-(((p.y+.28)/.35)**2))*front**6;positions.push(x,p.y,z);}}
 for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){let a=j*(cols+1)+i,b=a+cols+1;indices.push(a,a+1,b,a+1,b+1,b);}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setIndex(indices);geo.computeVertexNormals();root.add(new T.Mesh(geo,skin));
 // Ears have independent outer and inner forms and remain visible in profile.
 for(const side of [-1,1]){const ear=oval(root,skin,side*.99,-.08,0,.20,.35,.18);ear.rotation.z=-side*.13;oval(root,earInner,side*1.035,-.07,.137,.115,.225,.045);oval(root,skin,side*1.01,-.11,.17,.055,.10,.05);}
 // Eye whites are embedded into sockets; raised lids cover their edges.
 for(const side of [-1,1]){const x=side*.40;oval(root,earInner,x,.24,.788,.31,.205,.14);oval(root,white,x,.24,.842,.275,.168,.128);oval(root,iris,x,.235,.964,.108,.112,.034);oval(root,pupil,x,.235,.993,.048,.059,.012);oval(root,white,x-.027,.276,1.006,.022,.024,.009);
 stroke(root,skin,[[x-.27,.24,.86],[x-.18,.375,.9],[x,.411,.92],[x+.18,.36,.9],[x+.27,.24,.86]],.044);
 stroke(root,skin,[[x-.27,.24,.86],[x-.15,.104,.91],[x,.09,.923],[x+.17,.13,.9],[x+.27,.24,.86]],.032);
 stroke(root,hair,[[x-.28,.53,.79],[x-.15,.59,.84],[x+.04,.60,.85],[x+.23,.54,.80]],.056);}
 // Nose bridge, rounded tip and nostrils, fully modeled in depth.
 oval(root,skin,0,.03,.87,.13,.32,.19);oval(root,skin,0,-.18,1.015,.20,.17,.24);
 for(const side of [-1,1]){oval(root,skin,side*.15,-.24,.98,.105,.10,.12);oval(root,earInner,side*.115,-.296,1.055,.047,.028,.024);}
 // Fitted short beard shell follows the actual jaw surface, not a flat decal.
 const bp=[],bi=[];for(let j=0;j<=35;j++){let y=-1.28+j/35*.89;let lower=profile.findIndex(p=>p[0]>=y);let lo=profile[Math.max(0,lower-1)],hi=profile[Math.max(1,lower)];let f=(y-lo[0])/(hi[0]-lo[0]);let w=lo[1]+(hi[1]-lo[1])*f,d=lo[2]+(hi[2]-lo[2])*f;
 for(let i=0;i<=64;i++){let a=-1.45+i/64*2.9;let front=Math.cos(a);let yy=y+.15*Math.sin(a)**2;bp.push(Math.sin(a)*(w+.006),yy,front*(d+.012)+.065*Math.exp(-(((y+.28)/.35)**2))*Math.max(0,front)**6);}}
 for(let j=0;j<35;j++)for(let i=0;i<64;i++){let a=j*65+i,b=a+65;bi.push(a,a+1,b,a+1,b+1,b);}const bg=new T.BufferGeometry();bg.setAttribute('position',new T.Float32BufferAttribute(bp,3));bg.setIndex(bi);bg.computeVertexNormals();root.add(new T.Mesh(bg,beard));
 // Skin around the mouth keeps the beard as a short, sculpted boundary.
 const mouth=new T.Group();root.add(mouth);oval(mouth,skin,0,-.54,.777,.37,.20,.072);
 stroke(mouth,lip,[[-.29,-.535,.833],[-.15,-.50,.856],[0,-.52,.873],[.15,-.50,.856],[.29,-.535,.833]],.034);
 stroke(mouth,lip,[[-.28,-.546,.84],[0,-.595,.88],[.28,-.546,.84]],.045);
 stroke(mouth,beard,[[-.30,-.43,.82],[-.16,-.40,.866],[-.04,-.42,.867]],.029);stroke(mouth,beard,[[.04,-.42,.867],[.16,-.40,.866],[.30,-.43,.82]],.029);
 // Solid scalp cap with a low rear hairline, plus swept sculptural locks.
 const hp=[],hi=[];for(let j=0;j<=35;j++)for(let i=0;i<=80;i++){let a=i/80*Math.PI*2;let end=1.36+.57*(1-Math.cos(a))/2;let t=j/35*end;hp.push(1.035*Math.sin(t)*Math.sin(a),.35+1.20*Math.cos(t),.96*Math.sin(t)*Math.cos(a));}
 for(let j=0;j<35;j++)for(let i=0;i<80;i++){let a=j*81+i,b=a+81;hi.push(a,b,a+1,a+1,b,b+1);}const hg=new T.BufferGeometry();hg.setAttribute('position',new T.Float32BufferAttribute(hp,3));hg.setIndex(hi);hg.computeVertexNormals();root.add(new T.Mesh(hg,hair));
 for(let row=0;row<4;row++)for(let i=0;i<7;i++){let x=-.78+i*.245,y=1.03+Math.sqrt(Math.max(0,1-x*x))*.31+row*.06,z=.67-row*.32;let lock=oval(root,(i+row)%3===0?hairLight:hair,x,y,z,.19,.37,.23);lock.rotation.z=-.55;lock.rotation.x=.23+row*.13;}
 root.userData.mouth=mouth;
 return root;
}
