gsap.registerPlugin(ScrollTrigger);

/* ============================================================
   THREE.JS STAGE
   ============================================================ */
const stageEl = document.getElementById('stage');
const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true, powerPreference:'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
stageEl.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, window.innerWidth/window.innerHeight, 0.1, 200);
camera.position.set(0,0,14);

// Lighting — warm gold key + cool rim for metallic depth
const keyLight = new THREE.PointLight(0xffdca0, 6, 60, 2);
keyLight.position.set(6, 8, 10);
scene.add(keyLight);
const rimLight = new THREE.PointLight(0x8892a8, 2.2, 60, 2);
rimLight.position.set(-8, -4, -6);
scene.add(rimLight);
const ambient = new THREE.AmbientLight(0x2a2620, 1.1);
scene.add(ambient);

const goldMat = () => new THREE.MeshStandardMaterial({ color:0xcda23a, metalness:1, roughness:0.28, emissive:0x2a1c05, emissiveIntensity:0.15 });
const goldMatDim = () => new THREE.MeshStandardMaterial({ color:0x8a6b1d, metalness:1, roughness:0.42 });
const glassMat = () => new THREE.MeshPhysicalMaterial({ color:0xffffff, metalness:0, roughness:0.05, transmission:0.9, transparent:true, opacity:0.22, thickness:1.2 });

function setGroupOpacity(group, value){
  group.traverse(o=>{
    if(o.isMesh || o.isLine || o.isLineSegments || o.isPoints){
      if(o.material){
        o.material.transparent = true;
        if(o.material.opacity === undefined || o.userData.baseOpacity === undefined){
          o.userData.baseOpacity = o.material.opacity !== undefined ? o.material.opacity : 1;
        }
        o.material.opacity = o.userData.baseOpacity * value;
      }
    }
  });
  group.visible = value > 0.001;
}

/* ---------- Background starfield (always subtly present) ---------- */
const starGeo = new THREE.BufferGeometry();
const starCount = 500;
const starPos = new Float32Array(starCount*3);
for(let i=0;i<starCount;i++){
  starPos[i*3]   = (Math.random()-0.5)*60;
  starPos[i*3+1] = (Math.random()-0.5)*60;
  starPos[i*3+2] = (Math.random()-0.5)*60 - 10;
}
starGeo.setAttribute('position', new THREE.BufferAttribute(starPos,3));
const starMat = new THREE.PointsMaterial({ color:0xf1d78c, size:0.045, transparent:true, opacity:0.35 });
const stars = new THREE.Points(starGeo, starMat);
scene.add(stars);

/* ---------- ACT 1: HERO — interlocking rings + glass core ---------- */
const heroGroup = new THREE.Group();
const ringGeo1 = new THREE.TorusGeometry(3.1, 0.09, 32, 120);
const ring1 = new THREE.Mesh(ringGeo1, goldMat());
ring1.rotation.x = Math.PI/2.4;
heroGroup.add(ring1);

const ringGeo2 = new THREE.TorusGeometry(2.4, 0.06, 32, 120);
const ring2 = new THREE.Mesh(ringGeo2, goldMat());
ring2.rotation.x = Math.PI/6;
ring2.rotation.y = Math.PI/3;
heroGroup.add(ring2);

const ringGeo3 = new THREE.TorusGeometry(3.7, 0.045, 32, 120);
const ring3 = new THREE.Mesh(ringGeo3, goldMatDim());
ring3.rotation.x = -Math.PI/3.2;
ring3.rotation.y = Math.PI/5;
heroGroup.add(ring3);

const coreGeo = new THREE.IcosahedronGeometry(1.15, 1);
const core = new THREE.Mesh(coreGeo, glassMat());
heroGroup.add(core);

const blockGeo = new THREE.BoxGeometry(0.5,0.5,0.5);
for(let i=0;i<5;i++){
  const b = new THREE.Mesh(blockGeo, i%2===0?goldMat():goldMatDim());
  const a = (i/5) * Math.PI*2;
  b.position.set(Math.cos(a)*4.4, Math.sin(a*1.3)*1.2, Math.sin(a)*4.4);
  b.rotation.set(Math.random(), Math.random(), Math.random());
  heroGroup.add(b);
}
heroGroup.position.set(3.4, 0, 0);
scene.add(heroGroup);

/* ---------- ACT 2: PROBLEM — chaos to structure ---------- */
const chaosGroup = new THREE.Group();
const chaosCount = 26;
const chaosMeshes = [];
const chaosGeo = new THREE.BoxGeometry(0.32,0.32,0.32);
for(let i=0;i<chaosCount;i++){
  const m = new THREE.Mesh(chaosGeo, i%3===0?goldMat():goldMatDim());
  const scatter = new THREE.Vector3((Math.random()-0.5)*7,(Math.random()-0.5)*5,(Math.random()-0.5)*5);
  const col = i % 4;
  const row = Math.floor(i/4);
  const structured = new THREE.Vector3(col*0.5 - 0.75, row*0.42 - 1.2, 0);
  m.position.copy(scatter);
  m.userData.scatter = scatter;
  m.userData.structured = structured;
  m.userData.rot = new THREE.Vector3(Math.random()*2, Math.random()*2, Math.random()*2);
  chaosGroup.add(m);
  chaosMeshes.push(m);
}
chaosGroup.position.set(-2.6,0,0);
scene.add(chaosGroup);

/* ---------- ACT 3: ECOSYSTEM — node graph ---------- */
const ecoGroup = new THREE.Group();
const nodeNames = ['Strategy','People','Systems','Brand','Sales','Operations','Growth'];
const nodeSphereGeo = new THREE.SphereGeometry(0.14, 24, 24);
const nodes = [];
const centerNode = new THREE.Mesh(new THREE.SphereGeometry(0.26,32,32), goldMat());
ecoGroup.add(centerNode);
const lineMat = new THREE.LineBasicMaterial({ color:0xc9a227, transparent:true, opacity:0.55 });
for(let i=0;i<nodeNames.length;i++){
  const a = (i/nodeNames.length)*Math.PI*2;
  const r = 3.1;
  const pos = new THREE.Vector3(Math.cos(a)*r, Math.sin(a*0.7)*1.1, Math.sin(a)*r);
  const sph = new THREE.Mesh(nodeSphereGeo, i%2===0?goldMat():glassMat());
  sph.position.copy(pos);
  ecoGroup.add(sph);
  nodes.push({mesh:sph, name:nodeNames[i], angle:a});
  const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,0), pos]);
  const line = new THREE.Line(g, lineMat.clone());
  ecoGroup.add(line);
}
scene.add(ecoGroup);

/* ---------- ACT 4: TRANSFORMATION — fragments converge ---------- */
const transGroup = new THREE.Group();
const fragCount = 40;
const fragMeshes = [];
const icosaGeo = new THREE.IcosahedronGeometry(1.7, 1);
const posAttr = icosaGeo.attributes.position;
for(let i=0;i<fragCount;i++){
  const idx = Math.floor(Math.random() * (posAttr.count/3)) * 3;
  const target = new THREE.Vector3(posAttr.getX(idx), posAttr.getY(idx), posAttr.getZ(idx));
  const frag = new THREE.Mesh(new THREE.TetrahedronGeometry(0.22), Math.random()>0.5?goldMat():goldMatDim());
  const scattered = target.clone().multiplyScalar(4 + Math.random()*3).add(new THREE.Vector3((Math.random()-0.5)*3,(Math.random()-0.5)*3,(Math.random()-0.5)*3));
  frag.position.copy(scattered);
  frag.userData.scattered = scattered;
  frag.userData.target = target;
  transGroup.add(frag);
  fragMeshes.push(frag);
}
const glowLight = new THREE.PointLight(0xffdca0, 0, 20, 2);
transGroup.add(glowLight);
scene.add(transGroup);

/* ---------- ACT 5: FINAL — emerging monolith ---------- */
const finalGroup = new THREE.Group();
const monoGeo = new THREE.OctahedronGeometry(1.6, 0);
const mono = new THREE.Mesh(monoGeo, goldMat());
finalGroup.add(mono);
const monoRing = new THREE.Mesh(new THREE.TorusGeometry(2.6,0.03,16,100), goldMatDim());
monoRing.rotation.x = Math.PI/2.3;
finalGroup.add(monoRing);
finalGroup.scale.set(0.001,0.001,0.001);
scene.add(finalGroup);

/* initial visibility */
setGroupOpacity(heroGroup, 1);
setGroupOpacity(chaosGroup, 0);
setGroupOpacity(ecoGroup, 0);
setGroupOpacity(transGroup, 0);
setGroupOpacity(finalGroup, 0);

/* ---------- render loop ---------- */
const clock = new THREE.Clock();
function animate(){
  const t = clock.getElapsedTime();
  heroGroup.rotation.y = t*0.12;
  ring2.rotation.z = t*0.2;
  ring3.rotation.z = -t*0.15;
  core.rotation.y = t*0.3;

  chaosGroup.rotation.y = t*0.08;
  chaosMeshes.forEach(m=>{ m.rotation.x += 0.004; m.rotation.y += 0.006; });

  ecoGroup.rotation.y = t*0.06;
  nodes.forEach((n,i)=>{ n.mesh.position.y += Math.sin(t*0.6 + i)*0.0008; });

  transGroup.rotation.y = t*0.15;
  finalGroup.rotation.y = t*0.1;

  stars.rotation.y = t*0.01;

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();

window.addEventListener('resize', ()=>{
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* ============================================================
   SCROLL CHOREOGRAPHY
   ============================================================ */
const camTarget = { x:0, y:0, z:14, lx:0, ly:0, lz:0 };
function setCam(x,y,z,lx,ly,lz){ camTarget.x=x; camTarget.y=y; camTarget.z=z; camTarget.lx=lx; camTarget.ly=ly; camTarget.lz=lz; }
gsap.ticker.add(()=>{
  camera.position.x += (camTarget.x - camera.position.x)*0.05;
  camera.position.y += (camTarget.y - camera.position.y)*0.05;
  camera.position.z += (camTarget.z - camera.position.z)*0.05;
  camera.lookAt(camTarget.lx, camTarget.ly, camTarget.lz);
});

const opacityState = { hero:1, chaos:0, eco:0, trans:0, final:0 };
function applyOpacities(){
  setGroupOpacity(heroGroup, opacityState.hero);
  setGroupOpacity(chaosGroup, opacityState.chaos);
  setGroupOpacity(ecoGroup, opacityState.eco);
  setGroupOpacity(transGroup, opacityState.trans);
  setGroupOpacity(finalGroup, opacityState.final);
}

/* HERO -> fade as problem approaches */
ScrollTrigger.create({
  trigger:'#hero', start:'top top', end:'bottom top', scrub:0.5,
  onUpdate(self){ opacityState.hero = 1-self.progress; applyOpacities(); setCam(0,0,14,0,0,0); }
});

/* PROBLEM: chaos -> structure */
ScrollTrigger.create({
  trigger:'#problem', start:'top bottom', end:'bottom top', scrub:0.5,
  onUpdate(self){
    const p = self.progress;
    opacityState.chaos = Math.sin(Math.min(p*1.6,1) * Math.PI);
    applyOpacities();
    chaosMeshes.forEach(m=>{
      m.position.lerpVectors(m.userData.scatter, m.userData.structured, Math.min(p*1.4,1));
    });
    setCam(-2.6, 0, 9, -2.6, 0, 0);
  }
});

/* ECOSYSTEM: camera dolly through nodes + labels */
const labelContainer = document.getElementById('node-labels');
const labelEls = nodes.map(n=>{
  const el = document.createElement('div');
  el.className = 'node-label';
  el.innerHTML = '<span class="dot"></span>'+n.name;
  labelContainer.appendChild(el);
  return el;
});
ScrollTrigger.create({
  trigger:'#ecosystem', start:'top top', end:'bottom bottom', scrub:0.6,
  onUpdate(self){
    const p = self.progress;
    const fade = Math.sin(Math.min(p*1.3,1) * Math.PI) * (p<0.9?1:1-(p-0.9)*10);
    opacityState.eco = Math.max(fade,0);
    opacityState.hero = 0; opacityState.chaos = 0;
    applyOpacities();
    const angle = p * Math.PI * 0.9;
    setCam(Math.sin(angle)*6, 1.4, Math.cos(angle)*6, 0,0,0);
    labelEls.forEach(el=> el.style.opacity = opacityState.eco > 0.35 ? 1 : 0);
  }
});
gsap.ticker.add(()=>{
  nodes.forEach((n,i)=>{
    const v = n.mesh.getWorldPosition(new THREE.Vector3()).project(camera);
    const x = (v.x*0.5+0.5) * window.innerWidth;
    const y = (-v.y*0.5+0.5) * window.innerHeight;
    labelEls[i].style.left = x+'px';
    labelEls[i].style.top = y+'px';
  });
});

/* TRANSFORMATION: fragments converge */
ScrollTrigger.create({
  trigger:'#transformation', start:'top top', end:'bottom bottom', scrub:0.6,
  onUpdate(self){
    const p = self.progress;
    opacityState.eco = 0;
    opacityState.trans = Math.sin(Math.min(p*1.3,1)*Math.PI) * (p<0.92?1:1-(p-0.92)*12);
    opacityState.trans = Math.max(opacityState.trans, 0);
    applyOpacities();
    fragMeshes.forEach(f=>{
      f.position.lerpVectors(f.userData.scattered, f.userData.target, Math.min(p*1.25,1));
    });
    glowLight.intensity = Math.min(p*1.4,1) * 3;
    setCam(0, 0, 8.5 - p*2, 0,0,0);
  }
});

/* FINAL: monolith emerges */
ScrollTrigger.create({
  trigger:'#final', start:'top bottom', end:'bottom bottom', scrub:0.6,
  onUpdate(self){
    const p = self.progress;
    opacityState.trans = 0;
    opacityState.final = Math.min(p*2,1);
    applyOpacities();
    const s = 0.001 + p*1.4;
    finalGroup.scale.set(s,s,s);
    setCam(0,0, 10 - p*4, 0,0,0);
  }
});

/* ============================================================
   UI: nav, reveals, magnetic buttons, tilt cards, horizontal scroll
   ============================================================ */
const navEl = document.getElementById('nav');
ScrollTrigger.create({ start: 50, end: 99999, onUpdate(self){ navEl.classList.toggle('compact', self.scroll() > 40); } });

/* mobile nav toggle */
const navToggle = document.getElementById('nav-toggle');
const navLinksEl = document.getElementById('nav-links');
navToggle.addEventListener('click', ()=>{
  const open = navLinksEl.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
});
navLinksEl.querySelectorAll('a').forEach(a=>{
  a.addEventListener('click', ()=>{
    navLinksEl.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

document.querySelectorAll('.reveal').forEach(el=>{
  gsap.fromTo(el, {opacity:0, y:26}, {
    opacity:1, y:0, duration:1.1, ease:'power3.out',
    scrollTrigger:{ trigger:el, start:'top 88%' }
  });
});

/* magnetic buttons */
document.querySelectorAll('.magnetic').forEach(btn=>{
  btn.addEventListener('mousemove', e=>{
    const r = btn.getBoundingClientRect();
    const x = e.clientX - r.left - r.width/2;
    const y = e.clientY - r.top - r.height/2;
    gsap.to(btn, { x:x*0.28, y:y*0.5, duration:0.4, ease:'power2.out' });
  });
  btn.addEventListener('mouseleave', ()=>{
    gsap.to(btn, { x:0, y:0, duration:0.5, ease:'elastic.out(1,0.4)' });
  });
});

/* tilt cards */
document.querySelectorAll('.tilt-card').forEach(card=>{
  card.addEventListener('mousemove', e=>{
    const r = card.getBoundingClientRect();
    const px = (e.clientX - r.left)/r.width - 0.5;
    const py = (e.clientY - r.top)/r.height - 0.5;
    gsap.to(card, { rotateY: px*8, rotateX: -py*8, duration:0.4, ease:'power2.out', transformPerspective:800 });
  });
  card.addEventListener('mouseleave', ()=>{
    gsap.to(card, { rotateY:0, rotateX:0, duration:0.6, ease:'power3.out' });
  });
});

/* horizontal scroll for support section */
const track = document.getElementById('support-track');
const progressDots = document.querySelectorAll('#support-progress span');
ScrollTrigger.create({
  trigger:'#support', start:'top top', end:'bottom bottom', scrub:0.6,
  onUpdate(self){
    const maxX = track.scrollWidth - window.innerWidth;
    gsap.set(track, { x: -maxX * self.progress });
    const idx = Math.min(3, Math.floor(self.progress*4));
    progressDots.forEach((d,i)=> d.classList.toggle('active', i===idx));
  }
});

ScrollTrigger.refresh();
