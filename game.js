import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js';
const canvas=document.querySelector('#game');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.8));renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;
const scene=new THREE.Scene();scene.background=new THREE.Color('#8bb6ce');scene.fog=new THREE.FogExp2('#9bbac6',.0021);
const camera=new THREE.PerspectiveCamera(62,innerWidth/innerHeight,.1,700);
const hemi=new THREE.HemisphereLight('#d9f5ff','#59604c',2.2);scene.add(hemi);
const sun=new THREE.DirectionalLight('#ffe3b3',3.1);sun.position.set(-80,120,60);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-120;sun.shadow.camera.right=120;sun.shadow.camera.top=120;sun.shadow.camera.bottom=-120;sun.shadow.bias=-.0002;scene.add(sun);
const sunBall=new THREE.Mesh(new THREE.SphereGeometry(13,20,16),new THREE.MeshBasicMaterial({color:'#ffca91'}));sunBall.position.set(-115,75,-190);scene.add(sunBall);
const mat=(color,rough=.8,metal=0)=>new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal});
const groundMat=mat('#8e9b7a'),roadMat=mat('#303a42'),sideMat=mat('#c6bda8'),lineMat=mat('#f3d9a8'),waterMat=new THREE.MeshStandardMaterial({color:'#398a9b',roughness:.27,metalness:.18});
const ground=new THREE.Mesh(new THREE.PlaneGeometry(520,520),groundMat);ground.rotation.x=-Math.PI/2;ground.position.y=-.12;ground.receiveShadow=true;scene.add(ground);
const water=new THREE.Mesh(new THREE.PlaneGeometry(260,600),waterMat);water.rotation.x=-Math.PI/2;water.position.set(-290,-.16,0);scene.add(water);
const city=new THREE.Group();scene.add(city);
function box(parent,w,h,d,material,x,y,z,cast=true){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);m.position.set(x,y,z);m.castShadow=cast;m.receiveShadow=true;parent.add(m);return m}
for(let v=-200;v<=200;v+=40){
 const r1=new THREE.Mesh(new THREE.PlaneGeometry(14,480),roadMat);r1.rotation.x=-Math.PI/2;r1.position.set(v,.005,0);r1.receiveShadow=true;city.add(r1);
 const r2=new THREE.Mesh(new THREE.PlaneGeometry(480,14),roadMat);r2.rotation.x=-Math.PI/2;r2.position.set(0,.006,v);r2.receiveShadow=true;city.add(r2);
 for(let t=-230;t<230;t+=10){const a=new THREE.Mesh(new THREE.PlaneGeometry(.18,4.2),lineMat);a.rotation.x=-Math.PI/2;a.position.set(v,.017,t);city.add(a);const b=new THREE.Mesh(new THREE.PlaneGeometry(4.2,.18),lineMat);b.rotation.x=-Math.PI/2;b.position.set(t,.018,v);city.add(b)}
 for(const s of [-1,1]){const sx=new THREE.Mesh(new THREE.PlaneGeometry(2.1,480),sideMat);sx.rotation.x=-Math.PI/2;sx.position.set(v+s*8.15,.012,0);city.add(sx);const sz=new THREE.Mesh(new THREE.PlaneGeometry(480,2.1),sideMat);sz.rotation.x=-Math.PI/2;sz.position.set(0,.013,v+s*8.15);city.add(sz)}
}
function windowTexture(seed){const c=document.createElement('canvas');c.width=128;c.height=256;const x=c.getContext('2d');x.fillStyle=['#bc9075','#c1aa89','#86999a','#d2aa84','#7d9299'][seed%5];x.fillRect(0,0,128,256);x.fillStyle='rgba(35,51,60,.75)';for(let yy=10;yy<250;yy+=24)for(let xx=9;xx<124;xx+=22){x.fillRect(xx,yy,13,14);if(((xx*yy+seed*31)%7)<3){x.fillStyle='#ffdfa1';x.fillRect(xx+2,yy+2,9,10);x.fillStyle='rgba(35,51,60,.75)'}}x.fillStyle='rgba(255,235,191,.45)';for(let yy=0;yy<256;yy+=24)x.fillRect(0,yy,128,2);const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.repeat.set(1,Math.max(1,seed%4));return new THREE.MeshStandardMaterial({map:tex,roughness:.9})}
let seed=932;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
const facade=Array.from({length:5},(_,i)=>windowTexture(i));
for(let gx=-5;gx<5;gx++)for(let gz=-5;gz<5;gz++){const cx=gx*40+20,cz=gz*40+20;if(cx < -186)continue;const count=2+Math.floor(rand()*3);for(let i=0;i<count;i++){const w=7+rand()*7,d=7+rand()*7,h=8+rand()*34,x=cx+(rand()-.5)*12,z=cz+(rand()-.5)*12,material=facade[Math.floor(rand()*facade.length)];const building=box(city,w,h,d,material,x,h/2,z);building.castShadow=true;box(city,w+.25,.38,d+.25,mat(['#ddd0b6','#566c70','#b5a68e'][Math.floor(rand()*3)]),x,h+.15,z,false);if(rand()>.55)box(city,1.7,1.1,1.7,mat('#677b7b'),x,h+.85,z,false)}}
const trunk=mat('#76513d'),leaf=mat('#277e73'),lampMetal=mat('#344752',.35,.55),lampGlow=new THREE.MeshBasicMaterial({color:'#ffe2a2'});
function palm(x,z,s=1){const g=new THREE.Group();g.position.set(x,0,z);g.scale.setScalar(s);scene.add(g);const t=new THREE.Mesh(new THREE.CylinderGeometry(.18,.28,5,7),trunk);t.position.y=2.5;t.castShadow=true;g.add(t);for(let i=0;i<7;i++){const a=i*Math.PI*2/7,f=new THREE.Mesh(new THREE.ConeGeometry(.38,4,5),leaf);f.position.set(Math.sin(a)*1.45,4.8+Math.sin(i*2)*.22,Math.cos(a)*1.45);f.rotation.z=Math.cos(a)*-.75;f.rotation.x=Math.sin(a)*.75;f.castShadow=true;g.add(f)}return g}
function lamp(x,z){box(scene,.16,5.6,.16,lampMetal,x,2.8,z);box(scene,1.2,.14,.16,lampMetal,x+.45,5.5,z);const bulb=new THREE.Mesh(new THREE.SphereGeometry(.22,8,8),lampGlow);bulb.position.set(x+.95,5.4,z);scene.add(bulb)}
for(let x=-170;x<150;x+=40)for(let z=-170;z<170;z+=40){if(rand()>.18)palm(x+(rand()-.5)*3,z+(rand()-.5)*3,.7+rand()*.45);if(rand()>.62)lamp(x+7.5,z+7.5)}
const prom=new THREE.Mesh(new THREE.PlaneGeometry(18,440),mat('#dfc7a0'));prom.rotation.x=-Math.PI/2;prom.position.set(-202,.02,0);scene.add(prom);for(let z=-210;z<220;z+=18)palm(-198,z,1.18);
const car=new THREE.Group();scene.add(car);
const paint=new THREE.MeshStandardMaterial({color:'#123d59',metalness:.72,roughness:.24}),trim=mat('#101a20',.3,.3),glass=new THREE.MeshStandardMaterial({color:'#a7d6df',metalness:.48,roughness:.15,transparent:true,opacity:.8}),rubber=mat('#161b20',.85),rim=mat('#b9d1d1',.23,.8),lampWhite=new THREE.MeshBasicMaterial({color:'#dffcff'}),tailMat=new THREE.MeshBasicMaterial({color:'#ff5351'});
box(car,2.3,.65,4.4,paint,0,.78,0);box(car,1.8,.75,2.15,paint,0,1.4,-.25);box(car,1.65,.58,1.55,glass,0,1.42,-.19,false);box(car,2.25,.13,1.15,paint,0,1.09,-1.45);box(car,2.15,.12,.8,paint,0,1.03,1.77);
for(const side of [-1,1]){for(const z of [-1.4,1.35]){const tire=new THREE.Mesh(new THREE.CylinderGeometry(.42,.42,.3,16),rubber);tire.rotation.z=Math.PI/2;tire.position.set(side*1.12,.43,z);tire.castShadow=true;car.add(tire);const hub=new THREE.Mesh(new THREE.CylinderGeometry(.22,.22,.32,12),rim);hub.rotation.z=Math.PI/2;hub.position.set(side*1.12,.43,z);car.add(hub)}box(car,.12,.2,.3,lampWhite,side*.77,.78,-2.14,false);box(car,.12,.18,.3,tailMat,side*.77,.78,2.15,false)}
const underglow=new THREE.PointLight('#29dcf1',2,5);underglow.position.y=.35;car.add(underglow);const tires=[];for(const x of [-1.12,1.12]){const p=new THREE.Group();p.position.set(x,.43,-1.4);car.add(p);tires.push(p)}
const checkpoints=[new THREE.Vector3(0,0,-80),new THREE.Vector3(80,0,-80),new THREE.Vector3(80,0,0),new THREE.Vector3(0,0,0),new THREE.Vector3(-80,0,0)];
let cpIndex=0,credits=0,gameStarted=false,boost=100,vel=0,yaw=0,steer=0,toastTimer=0;
const beacon=new THREE.Group();scene.add(beacon);const ring=new THREE.Mesh(new THREE.TorusGeometry(4.1,.24,10,40),new THREE.MeshBasicMaterial({color:'#5af5ed'}));ring.rotation.x=Math.PI/2;ring.position.y=3;beacon.add(ring);const ring2=new THREE.Mesh(new THREE.TorusGeometry(4.1,.11,8,40),new THREE.MeshBasicMaterial({color:'#a4fff8',transparent:true,opacity:.6}));ring2.rotation.x=Math.PI/2;ring2.position.y=3.45;beacon.add(ring2);const beam=new THREE.Mesh(new THREE.CylinderGeometry(.18,.5,7,12,1,true),new THREE.MeshBasicMaterial({color:'#37d7d2',transparent:true,opacity:.23,side:THREE.DoubleSide}));beam.position.y=3;beacon.add(beam);const ringLight=new THREE.PointLight('#48efdc',3,20);ringLight.position.y=5;beacon.add(ringLight);
const keys={};
addEventListener('keydown',e=>{const k=e.key.toLowerCase();keys[k]=true;if([' ','arrowup','arrowdown','arrowleft','arrowright'].includes(k))e.preventDefault();if(k==='r')resetCar()});addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);
document.querySelectorAll('.tc').forEach(b=>{const k=b.dataset.key;const on=e=>{e.preventDefault();keys[k]=true;b.classList.add('on')};const off=e=>{e.preventDefault();keys[k]=false;b.classList.remove('on')};b.addEventListener('pointerdown',on);b.addEventListener('pointerup',off);b.addEventListener('pointerleave',off);b.addEventListener('pointercancel',off)});
const start=()=>{gameStarted=true;document.querySelector('#start').classList.add('gone');canvas.focus()};document.querySelector('#play').addEventListener('click',start);addEventListener('keydown',e=>{if(!gameStarted&&['w','arrowup',' '].includes(e.key.toLowerCase()))start()});
function resetCar(){car.position.set(0,0,30);yaw=0;vel=0;car.rotation.y=yaw}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function toast(text){const el=document.querySelector('#toast');el.textContent=text;el.classList.add('show');toastTimer=2.1}
function update(dt,time){
 const throttle=keys.w||keys.arrowup,reverse=keys.s||keys.arrowdown,left=keys.a||keys.arrowleft,right=keys.d||keys.arrowright,hand=keys[' '],nitro=keys.shift;
 const max=nitro&&boost>0?36:24;
 if(throttle)vel+=(nitro&&boost>0?20:13)*dt;else if(reverse)vel-=12*dt;else vel*=Math.pow(.985,dt*60);
 if(hand)vel*=Math.pow(.95,dt*60);vel=clamp(vel,-10,max);if(nitro&&throttle&&boost>0)boost=Math.max(0,boost-25*dt);else boost=Math.min(100,boost+8*dt);
 const steering=(left?1:0)-(right?1:0);steer+=(steering-steer)*Math.min(1,dt*8);yaw+=steer*vel*.035*dt*(hand?.72:1);
 car.position.x-=Math.sin(yaw)*vel*dt;car.position.z-=Math.cos(yaw)*vel*dt;car.position.x=clamp(car.position.x,-222,205);car.position.z=clamp(car.position.z,-228,228);
 car.rotation.y=yaw;car.rotation.z=steer*clamp(Math.abs(vel)/24,0,1)*-.055;car.rotation.x=Math.sin(time*8)*Math.min(.008,Math.abs(vel)*.0004);tires.forEach(p=>p.rotation.y=-steer*.48);
 const speed=Math.round(Math.abs(vel)*4.3);document.querySelector('#speed').textContent=String(speed).padStart(3,'0');document.querySelector('#gear').textContent=vel<-.5?'R':Math.abs(vel)<.5?'N':vel>20?'4':vel>13?'3':vel>7?'2':'1';document.querySelector('#fuelbar').style.width=boost+'%';
 const target=checkpoints[cpIndex];beacon.position.set(target.x,0,target.z);beacon.rotation.y=time*.55;beacon.scale.setScalar(1+Math.sin(time*3)*.035);
 if(car.position.distanceTo(target)<7.5){cpIndex=(cpIndex+1)%checkpoints.length;credits+=100;document.querySelector('#score').textContent=String(credits).padStart(3,'0');document.querySelector('#checkpointnum').textContent=String(cpIndex+1).padStart(2,'0')+' / 05';toast(cpIndex===0?'ROUTE COMPLETE  ·  +100 CREDITS':'CHECKPOINT CLEARED  ·  +100 CREDITS')}
 if(toastTimer>0){toastTimer-=dt;if(toastTimer<=0)document.querySelector('#toast').classList.remove('show')}
 const behind=new THREE.Vector3(Math.sin(yaw)*10,6.2,Math.cos(yaw)*10);camera.position.lerp(car.position.clone().add(behind),1-Math.pow(.001,dt));camera.lookAt(car.position.x,car.position.y+1.4,car.position.z);updateMap();
}
const traffic=[];
for(let i=0;i<5;i++){const c=car.clone(true);c.traverse(o=>{if(o.isMesh&&o.material===paint)o.material=mat(['#d67c58','#d7c78c','#4f7c77','#d9e2dd','#a982a8'][i],.32,.42)});c.scale.setScalar(.78);scene.add(c);traffic.push({mesh:c,axis:i%2,road:(i-2)*40,offset:i*29,speed:5+i*.8})}
function updateTraffic(dt){for(const t of traffic){t.offset=(t.offset+t.speed*dt)%400;const p=-200+t.offset;if(t.axis===0){t.mesh.position.set(t.road+2,0,p);t.mesh.rotation.y=Math.PI}else{t.mesh.position.set(p,0,t.road-2);t.mesh.rotation.y=-Math.PI/2}}}
const mapCanvas=document.querySelector('#map'),mctx=mapCanvas.getContext('2d');
function updateMap(){const w=mapCanvas.width,h=mapCanvas.height,cx=car.position.x,cz=car.position.z,scale=.48;mctx.clearRect(0,0,w,h);mctx.save();mctx.beginPath();mctx.arc(w/2,h/2,w/2-1,0,Math.PI*2);mctx.clip();mctx.fillStyle='#84947e';mctx.fillRect(0,0,w,h);const sx=(-202-cx)*scale+w/2;mctx.fillStyle='#398a9b';mctx.fillRect(0,0,sx,h);mctx.fillStyle='#e0c89f';mctx.fillRect(sx-3,0,5,h);mctx.strokeStyle='#354047';mctx.lineWidth=6;for(let v=-200;v<=200;v+=40){const x=(v-cx)*scale+w/2,y=(v-cz)*scale+h/2;mctx.beginPath();mctx.moveTo(x,0);mctx.lineTo(x,h);mctx.stroke();mctx.beginPath();mctx.moveTo(0,y);mctx.lineTo(w,y);mctx.stroke()}const target=checkpoints[cpIndex];mctx.beginPath();mctx.arc(w/2+(target.x-cx)*scale,h/2+(target.z-cz)*scale,4,0,Math.PI*2);mctx.fillStyle='#53f6e8';mctx.fill();mctx.strokeStyle='#dcfffa';mctx.lineWidth=1;mctx.stroke();mctx.save();mctx.translate(w/2,h/2);mctx.rotate(yaw);mctx.beginPath();mctx.moveTo(0,-7);mctx.lineTo(5,6);mctx.lineTo(0,3);mctx.lineTo(-5,6);mctx.closePath();mctx.fillStyle='#fff';mctx.shadowColor='#4df4e7';mctx.shadowBlur=8;mctx.fill();mctx.restore();mctx.restore()}
updateMap();resetCar();camera.position.set(0,8,44);camera.lookAt(0,0,20);const clock=new THREE.Clock();let elapsed=0;
function frame(){requestAnimationFrame(frame);const dt=Math.min(clock.getDelta(),.035);elapsed+=dt;if(gameStarted)update(dt,elapsed);else{camera.position.lerp(new THREE.Vector3(0,9,47),.02);camera.lookAt(0,0,20)}updateTraffic(dt);renderer.render(scene,camera)}frame();
addEventListener('resize',()=>{renderer.setPixelRatio(Math.min(devicePixelRatio,1.8));renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix()});
