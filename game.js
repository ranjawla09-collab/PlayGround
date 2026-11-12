(() => {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const viewport = document.getElementById('viewport');
  const items = [
    {id:'spawn',type:'platform',name:'Spawn Pad',x:-5,z:0,y:0,w:3.1,d:2.8,h:.55,color:'#5adbc1',spawn:true},
    {id:'cloud1',type:'platform',name:'Cloud Platform',x:-1.6,z:0,y:.55,w:2.5,d:2.2,h:.45,color:'#9b8cff'},
    {id:'bounce',type:'trampoline',name:'Jump Pad',x:1.55,z:-.85,y:1.05,w:2.2,d:2,h:.4,color:'#ef84b7'},
    {id:'checkpoint',type:'platform',name:'Checkpoint',x:4.5,z:-1.8,y:1.8,w:2.4,d:2.1,h:.45,color:'#ffc866',checkpoint:true},
    {id:'cloud2',type:'platform',name:'Cloud Platform',x:7.25,z:-.4,y:2.25,w:2.5,d:2.3,h:.48,color:'#65d8c3'},
    {id:'cloud3',type:'platform',name:'Cloud Platform',x:9.9,z:1.35,y:2.75,w:2.7,d:2.5,h:.48,color:'#a58bff'},
    {id:'finish',type:'platform',name:'Finish Portal',x:13,z:.2,y:3.05,w:3.1,d:3,h:.55,color:'#52d8c1',finish:true},
    {id:'star1',type:'star',name:'Star Collectible',x:-3,z:0,y:1.25,color:'#ffd36b',collected:false},
    {id:'star2',type:'star',name:'Star Collectible',x:-.7,z:.05,y:2.05,color:'#ffd36b',collected:false},
    {id:'star3',type:'star',name:'Star Collectible',x:2,z:-.8,y:2.95,color:'#ffd36b',collected:false},
    {id:'star4',type:'star',name:'Star Collectible',x:5,z:-1.7,y:3.55,color:'#ffd36b',collected:false},
    {id:'star5',type:'star',name:'Star Collectible',x:8.1,z:-.4,y:4,color:'#ffd36b',collected:false},
    {id:'star6',type:'star',name:'Star Collectible',x:11,z:1.2,y:4.65,color:'#ffd36b',collected:false},
    {id:'hazard1',type:'hazard',name:'Cloud Spikes',x:6.1,z:-1.6,y:2.25,w:.6,d:.6,h:.65,color:'#ff7184'}
  ];
  let selected = 'cloud1', mode = 'studio', tool = 'select', placing = null, zoom = 1, W=0,H=0,dpr=1, lastTime=0, elapsed=0, stars=0, won=false;
  const player={x:-5,z:0,y:.55,vy:0,ground:true,face:1,checkpoint:{x:-5,z:0,y:.55}};
  const keys={};
  let remote={x:4.5,z:-1.8,y:1.8,face:-1};
  let channel;
  try { channel=new BroadcastChannel('blockcraft-skyline-room'); channel.onmessage=e=>{if(e.data?.type==='move') remote=e.data.player; if(e.data?.type==='chat') addChat(e.data.name,e.data.text);}; } catch(e){}
  const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
  const selectedItem=()=>items.find(i=>i.id===selected);
  function resize(){const r=viewport.getBoundingClientRect();dpr=Math.min(devicePixelRatio||1,2);W=r.width;H=r.height;canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);}
  new ResizeObserver(resize).observe(viewport); resize();
  function scale(){return Math.min(W/24,H/12.5)*zoom;}
  function project(x,z,y=0){const s=scale();return {x:W*.5+(x-z)*s*.73,y:H*.57+(x+z)*s*.365-y*s*.95};}
  function poly(points,fill,stroke){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke();}}
  function shade(hex,amt){let n=parseInt(hex.slice(1),16),r=Math.max(0,Math.min(255,(n>>16)+amt)),g=Math.max(0,Math.min(255,((n>>8)&255)+amt)),b=Math.max(0,Math.min(255,(n&255)+amt));return `rgb(${r},${g},${b})`;}
  function drawBox(x,z,y,w,d,h,color,outline=false){const a=project(x-w/2,z-d/2,y+h),b=project(x+w/2,z-d/2,y+h),c=project(x+w/2,z+d/2,y+h),e=project(x-w/2,z+d/2,y+h);const ab=project(x-w/2,z-d/2,y),bc=project(x+w/2,z-d/2,y),ce=project(x+w/2,z+d/2,y),ea=project(x-w/2,z+d/2,y);poly([e,c,ce,ea],shade(color,-54));poly([c,b,bc,ce],shade(color,-30));poly([a,b,c,e],shade(color,3),outline?'#e7e9ff':'#ffffff21');if(outline){ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.lineTo(c.x,c.y);ctx.lineTo(e.x,e.y);ctx.closePath();ctx.strokeStyle='#e7eaff';ctx.lineWidth=1.5;ctx.setLineDash([4,3]);ctx.stroke();ctx.setLineDash([]);}}
  function drawStar(x,y,r,rot=0,color='#ffd36b'){ctx.save();ctx.translate(x,y);ctx.rotate(rot);ctx.beginPath();for(let i=0;i<10;i++){let a=-Math.PI/2+i*Math.PI/5,rr=i%2?r*.43:r;ctx.lineTo(Math.cos(a)*rr,Math.sin(a)*rr);}ctx.closePath();ctx.fillStyle=color;ctx.shadowColor=color;ctx.shadowBlur=15;ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle='#fff4c880';ctx.lineWidth=1;ctx.stroke();ctx.restore();}
  function drawCloud(x,y,s,alpha=.6){ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle='#b8c5e7';ctx.shadowColor='#9bacd8';ctx.shadowBlur=12;ctx.beginPath();ctx.ellipse(x,y,s*1.15,s*.3,0,0,Math.PI*2);ctx.ellipse(x-s*.32,y-s*.12,s*.45,s*.32,0,0,Math.PI*2);ctx.ellipse(x+s*.1,y-s*.2,s*.54,s*.42,0,0,Math.PI*2);ctx.ellipse(x+s*.47,y-s*.1,s*.4,s*.3,0,0,Math.PI*2);ctx.fill();ctx.restore();}
  function drawAvatar(x,z,y,color='#63dbc3',face=1,scaleFactor=1,isRemote=false){const p=project(x,z,y);const s=scale()*.44*scaleFactor;ctx.save();ctx.globalAlpha=isRemote?.78:1;ctx.fillStyle='#080d17aa';ctx.beginPath();ctx.ellipse(p.x,p.y+5*s,s*.43,s*.17,0,0,Math.PI*2);ctx.fill();drawBox(x,z,y,s*.7,s*.57,s*.62,shade(color,-18));drawBox(x,z,y+s*.62,s*.57,s*.55,s*.56,'#f1bf9c');drawBox(x,z,y+s*1.14,s*.6,s*.58,s*.17,'#4a3659');drawBox(x-face*s*.18,z,y+s*.61,s*.18,s*.08,s*.1,'#302638');const head=project(x,z,y+s*.94);ctx.fillStyle='#303047';ctx.fillRect(head.x-s*.18,head.y-s*.04,s*.07,s*.055);ctx.fillRect(head.x+s*.08,head.y-s*.04,s*.07,s*.055);ctx.restore();}
  function drawGrid(){ctx.save();const s=scale();ctx.lineWidth=1;for(let i=-16;i<=17;i++){let a=project(i,-14,-.12),b=project(i,14,-.12),c=project(-14,i,-.12),d=project(14,i,-.12);ctx.strokeStyle=i===0?'#8891b126':'#7f89a214';ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.beginPath();ctx.moveTo(c.x,c.y);ctx.lineTo(d.x,d.y);ctx.stroke();}ctx.restore();}
  function render(now=0){const dt=Math.min(.04,(now-lastTime)/1000||0);lastTime=now;if(mode==='play'&&!won)update(dt);ctx.clearRect(0,0,W,H);drawGrid();const clouds=[[-8,-5,54],[-5,5,45],[1,6,56],[8,-6,57],[13,-4,45],[-12,0,42]];clouds.forEach(([x,z,r],i)=>{const p=project(x,z,1.8+Math.sin(now*.0005+i)*.15);drawCloud(p.x,p.y,r, i%2?.32:.44)});
    items.filter(i=>i.type==='platform'||i.type==='trampoline').sort((a,b)=>(a.x+a.z)-(b.x+b.z)).forEach(item=>{drawBox(item.x,item.z,item.y,item.w||2,item.d||2,item.h||.45,item.color,item.id===selected&&mode==='studio');if(item.spawn){const p=project(item.x,item.z,item.y+(item.h||.5)+.1);ctx.fillStyle='#133732';ctx.font=`800 ${Math.max(7,scale()*.19)}px DM Sans`;ctx.textAlign='center';ctx.fillText('START',p.x,p.y+3);}if(item.checkpoint){const p=project(item.x,item.z,item.y+1);ctx.strokeStyle='#fff0c1';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(p.x,p.y+15);ctx.lineTo(p.x,p.y-22);ctx.lineTo(p.x+15,p.y-15);ctx.lineTo(p.x,p.y-8);ctx.stroke();}if(item.finish){const p=project(item.x,item.z,item.y+.1);ctx.save();ctx.strokeStyle='#a5ffe9';ctx.lineWidth=4;ctx.shadowColor='#4df0cb';ctx.shadowBlur=20;ctx.beginPath();ctx.ellipse(p.x,p.y-28,19,30,0,0,Math.PI*2);ctx.stroke();ctx.restore();}});
    items.filter(i=>i.type==='hazard').forEach(it=>{drawBox(it.x,it.z,it.y,it.w,it.d,.18,'#ff7387');for(let j=-1;j<=1;j++){const p=project(it.x+j*.19,it.z,it.y+.16);ctx.beginPath();ctx.moveTo(p.x-5,p.y+5);ctx.lineTo(p.x,p.y-8);ctx.lineTo(p.x+5,p.y+5);ctx.closePath();ctx.fillStyle='#ffc2c4';ctx.fill();}});
    items.filter(i=>i.type==='star'&&!i.collected).forEach((it,i)=>{const p=project(it.x,it.z,it.y+Math.sin(now*.002+i)*.09);drawStar(p.x,p.y,Math.max(7,scale()*.21),now*.0008,'#ffd36b');});
    if(mode==='play'){drawAvatar(remote.x,remote.z,remote.y,'#9b82ff',remote.face,.9,true);drawAvatar(player.x,player.z,player.y);}
    if(mode==='studio'){const p=project(3,-3,3.8+Math.sin(now*.001)*.06);drawAvatar(3,-3,3.8+Math.sin(now*.001)*.06,'#9b82ff',-1,.88,true);ctx.font='9px DM Sans';ctx.textAlign='center';ctx.fillStyle='#d5ccff';ctx.fillText('MIA',p.x,p.y-25);}
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
  function update(dt){let dx=0,dz=0;if(keys.KeyA||keys.ArrowLeft)dx-=1;if(keys.KeyD||keys.ArrowRight)dx+=1;if(keys.KeyW||keys.ArrowUp)dz-=1;if(keys.KeyS||keys.ArrowDown)dz+=1;const l=Math.hypot(dx,dz)||1;dx/=l;dz/=l;player.x+=dx*5*dt;player.z+=dz*5*dt;if(dx)player.face=dx>0?1:-1;player.vy-=12*dt;player.y+=player.vy*dt;
    if(player.y<-.5){player.x=player.checkpoint.x;player.z=player.checkpoint.z;player.y=player.checkpoint.y+2;player.vy=0;}player.ground=false;
    if(player.vy<=0){for(const it of items){if((it.type==='platform'||it.type==='trampoline')&&player.x>it.x-(it.w||2)/2-.18&&player.x<it.x+(it.w||2)/2+.18&&player.z>it.z-(it.d||2)/2-.18&&player.z<it.z+(it.d||2)/2+.18){const top=it.y+(it.h||.45);if(player.y<=top+.12&&player.y>=top-.45){player.y=top;player.vy=0;player.ground=true;if(it.checkpoint)player.checkpoint={x:it.x,z:it.z,y:top};if(it.type==='trampoline'&&player.ground&&keys.Space){player.vy=10;player.ground=false;}}}}
    }
    for(const it of items){if(it.type==='star'&&!it.collected&&Math.hypot(player.x-it.x,player.z-it.z)<.65&&Math.abs(player.y-it.y)<1.05){it.collected=true;stars++;$('#starCount').textContent=stars;showMessage('Star collected! Nice one ✨');setTimeout(()=>{if(!won)showMessage('Collect the stars and reach the portal!')},1300);}}
    const hazard=items.find(i=>i.type==='hazard'&&Math.abs(player.x-i.x)<.55&&Math.abs(player.z-i.z)<.55&&Math.abs(player.y-i.y)<1);if(hazard){player.x=player.checkpoint.x;player.z=player.checkpoint.z;player.y=player.checkpoint.y+1;player.vy=0;}
    const fin=items.find(i=>i.finish);if(fin&&Math.abs(player.x-fin.x)<1.2&&Math.abs(player.z-fin.z)<1.2&&player.y>=fin.y-.5){finish();}
    elapsed+=dt;const mins=String(Math.floor(elapsed/60)).padStart(2,'0'),secs=String(Math.floor(elapsed%60)).padStart(2,'0');$('#timerValue').textContent=`${mins}:${secs}`;
    if(channel&&Math.random()<.08)channel.postMessage({type:'move',player:{x:player.x,z:player.z,y:player.y,face:player.face}});
  }
  function showMessage(t){$('#playMessage span:last-child').textContent=t;}
  function finish(){won=true;$('#finalStars').textContent=stars;$('#finalTime').textContent=$('#timerValue').textContent;$('#gameOver').style.display='flex';}
  function startPlay(){mode='play';won=false;elapsed=0;stars=0;player.x=-5;player.z=0;player.y=.55;player.vy=0;player.ground=true;player.checkpoint={x:-5,z:0,y:.55};items.forEach(i=>{if(i.type==='star')i.collected=false;});$('#starCount').textContent='0';$('#timerValue').textContent='00:00';$('#gameOver').style.display='none';document.body.classList.add('play-mode');$('#sceneStatus').textContent='PLAYING LIVE';document.querySelector('[data-mode="play"]').classList.add('active');document.querySelector('[data-mode="studio"]').classList.remove('active');showMessage('Collect the stars and reach the portal!');}
  function stopPlay(){mode='studio';document.body.classList.remove('play-mode');$('#sceneStatus').textContent='EDITING WORLD';document.querySelector('[data-mode="studio"]').classList.add('active');document.querySelector('[data-mode="play"]').classList.remove('active');}
  function jump(){if(mode==='play'&&player.ground){player.vy=7.6;player.ground=false;}}
  window.addEventListener('keydown',e=>{if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();keys[e.code]=true;if(e.code==='Space')jump();if(mode==='studio'&&['1','2','3','4'].includes(e.key)){const types={1:'platform',2:'trampoline',3:'star',4:'hazard'};placing=types[e.key];$$('.object-button').forEach(b=>b.classList.toggle('active',b.dataset.place===placing));}});
  window.addEventListener('keyup',e=>keys[e.code]=false);window.addEventListener('blur',()=>Object.keys(keys).forEach(k=>keys[k]=false));
  $$('[data-mode]').forEach(b=>b.addEventListener('click',()=>b.dataset.mode==='play'?startPlay():stopPlay()));
  $('#resetButton').addEventListener('click',()=>startPlay());$('#replayButton').addEventListener('click',startPlay);
  function placeItem(type,x,z){const def={platform:{name:'Cloud Platform',y:1.1,w:2.4,d:2.2,h:.45,color:'#62d9c2'},trampoline:{name:'Jump Pad',y:1.1,w:2,d:2,h:.4,color:'#ed84b6'},star:{name:'Star Collectible',y:2.1,color:'#ffd36b'},hazard:{name:'Cloud Spikes',y:1.1,w:.8,d:.8,h:.55,color:'#ff7184'}}[type];const item={id:'item'+Date.now(),type,x,z,...def};items.push(item);selected=item.id;updateSelected();toast(`${def.name} added`);}
  canvas.addEventListener('click',e=>{if(mode!=='studio')return;const r=canvas.getBoundingClientRect(),s=scale(),u=(e.clientX-r.left-W/2)/(.73*s),v=(e.clientY-r.top-H*.57)/(.365*s),x=(u+v)/2,z=(v-u)/2;if(placing){placeItem(placing,Math.round(x*2)/2,Math.round(z*2)/2);placing=null;$$('.object-button').forEach(b=>b.classList.remove('active'));return;}let closest=null,dist=Infinity;for(const it of items){if(it.type==='star')continue;const p=project(it.x,it.z,it.y+it.h);const d=Math.hypot(p.x-(e.clientX-r.left),p.y-(e.clientY-r.top));if(d<dist){dist=d;closest=it;}}if(closest&&dist<90){selected=closest.id;updateSelected();}});
  $$('[data-place]').forEach(b=>b.addEventListener('click',()=>{placing=b.dataset.place;$$('[data-place]').forEach(x=>x.classList.toggle('active',x===b));toast(`Click anywhere to place ${b.querySelector('span:nth-child(2)').textContent.toLowerCase()}`);}));
  $$('[data-tool]').forEach(b=>b.addEventListener('click',()=>{$$('[data-tool]').forEach(x=>x.classList.toggle('active',x===b));tool=b.dataset.tool;}));
  function updateSelected(){const it=selectedItem();if(!it)return;$('#selectedName').textContent=it.name;$('#posX').value=it.x.toFixed(1);$('#posY').value=it.y.toFixed(1);$('#posZ').value=it.z.toFixed(1);$('#sizeX').value=(it.w||1).toFixed(1);$('#sizeY').value=(it.h||1).toFixed(1);$('#sizeZ').value=(it.d||1).toFixed(1);}
  ['posX','posY','posZ','sizeX','sizeY','sizeZ'].forEach(id=>$('#'+id).addEventListener('change',e=>{const it=selectedItem();if(!it)return;const map={posX:'x',posY:'y',posZ:'z',sizeX:'w',sizeY:'h',sizeZ:'d'};it[map[id]]=parseFloat(e.target.value)||0;}));
  $$('.swatch').forEach(b=>b.addEventListener('click',()=>{const it=selectedItem();if(it)it.color=b.dataset.color;$$('.swatch').forEach(x=>x.classList.toggle('active',x===b));}));
  $('.color-picker').addEventListener('click',()=>$('#colorInput').click());$('#colorInput').addEventListener('input',e=>{const it=selectedItem();if(it)it.color=e.target.value;});
  $('#deleteObject').addEventListener('click',()=>{const idx=items.findIndex(i=>i.id===selected);if(idx>=0&&!items[idx].spawn&&!items[idx].finish){items.splice(idx,1);selected=items[1].id;updateSelected();toast('Object deleted');}});
  $$('.right-tab').forEach(b=>b.addEventListener('click',()=>{$$('.right-tab').forEach(x=>x.classList.toggle('active',x===b));$('#propertiesPane').classList.toggle('hidden',b.dataset.pane!=='properties');$('#assetsPane').classList.toggle('hidden',b.dataset.pane!=='assets');}));
  $('#zoomIn').addEventListener('click',()=>{zoom=Math.min(1.4,zoom+.1);$('.zoom-label').textContent=Math.round(zoom*100)+'%';});$('#zoomOut').addEventListener('click',()=>{zoom=Math.max(.7,zoom-.1);$('.zoom-label').textContent=Math.round(zoom*100)+'%';});
  function toast(msg='Room link copied'){$('#toast b').textContent=msg;$('#toast').classList.add('show');setTimeout(()=>$('#toast').classList.remove('show'),2100);}$('#shareRoom').addEventListener('click',()=>{navigator.clipboard?.writeText(location.href+'?room=SKY-482').catch(()=>{});toast('Room link copied');});$('.invite-btn').addEventListener('click',()=>toast('Invite link copied'));$('.publish-btn').addEventListener('click',()=>toast('Your world is published!'));
  $('#chatToggle').addEventListener('click',()=>$('#chatPopover').classList.toggle('open'));$('#closeChat').addEventListener('click',()=>$('#chatPopover').classList.remove('open'));
  function addChat(name,text){const row=document.createElement('div');row.innerHTML=`<i class="online-avatar ${name==='mia.builds'?'mia':''}">${name==='mia.builds'?'M':'J'}</i><p><b>${name}</b><span></span></p>`;row.querySelector('span').textContent=text;$('.chat-messages').append(row);}
  $('#chatForm').addEventListener('submit',e=>{e.preventDefault();const input=e.currentTarget.querySelector('input');if(!input.value.trim())return;addChat('you',input.value);if(channel)channel.postMessage({type:'chat',name:'teammate',text:input.value});input.value='';});
  $$('[data-control]').forEach(b=>{const c=b.dataset.control,map={up:'KeyW',down:'KeyS',left:'KeyA',right:'KeyD'};const down=e=>{e.preventDefault();if(c==='jump')jump();else keys[map[c]]=true;},up=e=>{e.preventDefault();if(map[c])keys[map[c]]=false;};b.addEventListener('pointerdown',down);b.addEventListener('pointerup',up);b.addEventListener('pointerleave',up);});
  $('#searchObjects').addEventListener('input',e=>{$$('.tree-children .tree-row').forEach(row=>row.style.display=row.textContent.toLowerCase().includes(e.target.value.toLowerCase())?'flex':'none');});
  $$('.tree-children .tree-row').forEach(row=>row.addEventListener('click',()=>{$$('.tree-children .tree-row').forEach(x=>x.classList.remove('selected'));row.classList.add('selected');const name=row.dataset.object;const match=items.find(i=>i.name===name);if(match){selected=match.id;updateSelected();}}));
  $('#chatToggle').title='Open team chat';
  updateSelected();
})();
