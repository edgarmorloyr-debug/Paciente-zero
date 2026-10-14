// Piezas reutilizadas de Seis Balas (modelos de revólver y de zombis). Copiadas tal cual del juego original;
// solo se cambió lo necesario para que funcionen solas. No calcula nada del juego: solo arma modelos 3D.
(function () {
'use strict';
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const damp = (a, b, k, dt) => lerp(a, b, 1 - Math.exp(-k * dt));
const pick = a => a[Math.floor(Math.random() * a.length)];
const TAU = Math.PI * 2;
const IS_TOUCH = (window.matchMedia && matchMedia('(pointer: coarse)').matches) || ('ontouchstart' in window);
const MAX_TEX = IS_TOUCH ? 1024 : 4096;
const renderer = null; // los reflejos de las armas usan una textura simple
let game = null;
const world = { shirts: [], idx: 0, hat: null, hatP: 0 };
const allyMats = { cowboy: new THREE.MeshLambertMaterial({ color: 0x6a4524 }), helmet: new THREE.MeshLambertMaterial({ color: 0x4a5a32 }), swat: new THREE.MeshLambertMaterial({ color: 0x15181d }), case: new THREE.MeshLambertMaterial({ color: 0x3a2a1a }), veil: new THREE.MeshLambertMaterial({ color: 0x111114 }), band: new THREE.MeshLambertMaterial({ color: 0xeeeeee }), steel: new THREE.MeshLambertMaterial({ color: 0xb8bcc4 }), wood: new THREE.MeshLambertMaterial({ color: 0x5a3a20 }), tnt: new THREE.MeshLambertMaterial({ color: 0xc0302a, emissive: 0x200404 }) };
const allyGeo = { rifle: new THREE.BoxGeometry(0.05, 0.08, 0.78), smg: new THREE.BoxGeometry(0.06, 0.1, 0.36), case: new THREE.BoxGeometry(0.1, 0.24, 0.32), shotgun: new THREE.BoxGeometry(0.07, 0.08, 0.6), blade: new THREE.BoxGeometry(0.02, 0.09, 0.5), stick: new THREE.CylinderGeometry(0.035, 0.035, 0.22, 8), dome: new THREE.SphereGeometry(0.2, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), veil: new THREE.BoxGeometry(0.34, 0.36, 0.3), band: new THREE.BoxGeometry(0.35, 0.05, 0.31) };
function canvasTex(w, h, draw, rep) {
  const k = Math.min(1, MAX_TEX / Math.max(w, h)), c = document.createElement('canvas'); c.width = Math.round(w * k); c.height = Math.round(h * k);
  const g = c.getContext('2d'); if (k < 1) g.scale(k, k);
  draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep); }
  t.anisotropy = 4;
  return t;
}
const glowTex = canvasTex(64, 64, (g, w) => {
  const gr = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, w, w);
});
const SHIRTS = [0x3b2f2a, 0x4a3b2c, 0x2f3a44, 0x5a2a26, 0x3d3d3d, 0x6b5a3e, 0x2c3b2e, 0x553f53];
const PANTS = [0x2a2723, 0x22303a, 0x3a3027, 0x1f2421];
function bx(w, h, d) { return new THREE.BoxGeometry(w, h, d); }
function cyl(rt, rb, h, s = 10) { return new THREE.CylinderGeometry(rt, rb, h, s); }
const MODELS = {
  paci: { name: 'Revólver Pacificador', desc: 'El clásico de seis balas. Equilibrado en todo.', cap: 6, dmg: 55, cd: 0.32, reload: 1, spread: 1, recoil: 1, pierce: 0, price: 30, L: 0.27, R: 0.011 },
  corto: { name: 'Revólver corto', desc: 'Ligero y rapidísimo de disparar y recargar. Solo 5 balas y pierde fuerza de lejos.', cap: 5, dmg: 42, cd: 0.17, reload: 1.5, spread: 1.55, recoil: 0.6, pierce: 0, price: 35, L: 0.09, R: 0.012, near: true },
  viejo: { name: 'Revólver viejo', desc: 'Una reliquia de pólvora negra. Golpea fuerte y echa mucho humo, pero es lento.', cap: 6, dmg: 92, cd: 0.5, reload: 0.7, spread: 1.15, recoil: 1.45, pierce: 0, price: 25, L: 0.31, R: 0.011 },
  magnum: { name: 'Revólver Magnum', desc: 'Preciso y brutal. Cada bala atraviesa a un zombi más.', cap: 6, dmg: 135, cd: 0.55, reload: 0.85, spread: 0.55, recoil: 2, pierce: 1, price: 120, L: 0.43, R: 0.015 },
  minigun: { name: 'Revólver minigun', desc: 'Un revólver gigante de 60 balas que dispara como una ametralladora. Mantén el gatillo.', cap: 60, dmg: 24, cd: 0.065, reload: 1, spread: 1.5, recoil: 0.18, pierce: 0, price: 280, L: 0.36, R: 0.02, auto: true }
};
Object.assign(MODELS, {
  mp5: { name: 'Revólver MP5', desc: 'Tambor de 30 balas que dispara en ráfagas de 3. Mantén el gatillo.', cap: 30, dmg: 32, cd: 0.07, burst: 3, burstGap: 0.3, reload: 1, spread: 1.2, recoil: 0.35, pierce: 0, price: 300, L: 0.2, R: 0.012, rc: 0.046, auto: true },
  ballesta: { name: 'Revólver ballesta', desc: 'Estacas que atraviesan a toda la fila de zombis sin perder fuerza.', cap: 6, dmg: 170, cd: 0.55, reload: 0.8, spread: 0.6, recoil: 0.9, pierce: 99, noFall: true, price: 320, L: 0.3, R: 0.008, tr: 0x8a5a2a },
  tesla: { name: 'Revólver Tesla', desc: 'Rayos que saltan de zombi en zombi (hasta 3). Mantén el gatillo; al vaciarse se enfría.', cap: 20, dmg: 42, cd: 0.2, reload: 0.7, spread: 0.7, recoil: 0.25, pierce: 0, price: 420, L: 0.26, R: 0.016, rc: 0.042, auto: true, chain: 3, tr: 0x9ac8ff },
  cowboy: { name: 'Cowboy revolver', desc: 'De acción simple, como los de antes: antes de cada disparo tienes que amartillarlo (un toque echa el martillo atrás, el siguiente dispara). 8 balas.', cap: 8, dmg: 47, cd: 0.376, reload: 0.85, spread: 1.15, recoil: 1.15, pierce: 0, price: 26, L: 0.3, R: 0.011, cock: true },
  uzi: { name: 'Revólver UZI', desc: 'Un revólver con alma de metralleta: 25 balas que escupe sin parar. Mantén el gatillo.', cap: 25, dmg: 22, cd: 0.06, reload: 1, spread: 1.45, recoil: 0.22, pierce: 0, price: 260, L: 0.12, R: 0.011, rc: 0.04, auto: true },
  jackpot: { name: 'Revólver Jackpot', desc: 'Una tragamonedas con gatillo. Cada disparo tiene 1 entre 50 de darte 20 $ y 1 entre 1000 de darte 500 $.', cap: 6, dmg: 50, cd: 0.4, reload: 1, spread: 1, recoil: 1, pierce: 0, price: 200, L: 0.24, R: 0.012, jackpot: true, tr: 0xffd040 },
  bazuca: { name: 'Revólver bazuca', desc: 'Cuatro cohetes con una explosión enorme. Cuidado: si estalla cerca, también te quema a ti.', cap: 4, dmg: 90, cd: 1, reload: 0.55, spread: 0.6, recoil: 2.6, pierce: 0, price: 520, L: 0.42, R: 0.045, rc: 0.062, boom: 4.5, boomDmg: 420, tr: 0xffa040 }
});
const MODEL_ORDER = ['paci', 'corto', 'viejo', 'uzi', 'cowboy', 'magnum', 'minigun', 'mp5', 'ballesta', 'tesla', 'jackpot', 'bazuca'];
const phong = (c, s, h) => new THREE.MeshPhongMaterial({ color: c, specular: s, shininess: h });
const GM = {
  blue: phong(0x3a3c42, 0x9a9a9a, 70), steel: phong(0x5b5e66, 0xbbbbbb, 90), chrome: phong(0xaeb2ba, 0xffffff, 130), black: phong(0x1c1d20, 0x666666, 40),
  brassF: phong(0xb88a3a, 0xffe0a0, 90), wood: phong(0x6e3b1b, 0x3a2412, 25), woodL: phong(0x9a6a3a, 0x3a2412, 25), rubber: phong(0x18181a, 0x222222, 8),
  brass: phong(0xd09a3e, 0xffe4a8, 100), spent: phong(0x4d3b1f, 0x221100, 10), empty: new THREE.MeshBasicMaterial({ color: 0x050505 }),
  skin: new THREE.MeshLambertMaterial({ color: 0xb98264 }), sleeve: new THREE.MeshLambertMaterial({ color: 0x3b2a1d }), orange: new THREE.MeshBasicMaterial({ color: 0xff7a20 })
};
const flashMat = new THREE.MeshBasicMaterial({ map: glowTex, color: 0xffc070, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, side: THREE.DoubleSide });
// ---- Armas: materiales de metal con reflejos, madera con vetas y siluetas de revólver de verdad ----
const gunEnv = (() => {
  const t = canvasTex(256, 128, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#1a2233'); gr.addColorStop(0.42, '#3b3a44'); gr.addColorStop(0.5, '#c88a4a'); gr.addColorStop(0.56, '#3a2a1e'); gr.addColorStop(1, '#0c0907');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    for (const [x, y, r, c] of [[40, 30, 18, 'rgba(255,240,210,.9)'], [170, 22, 24, 'rgba(255,230,190,.7)'], [120, 58, 30, 'rgba(255,170,90,.55)'], [220, 70, 14, 'rgba(255,200,140,.6)']]) { const rg = g.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, c); rg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = rg; g.fillRect(x - r, y - r, r * 2, r * 2); }
  });
  t.mapping = THREE.EquirectangularReflectionMapping;
  try { const pm = new THREE.PMREMGenerator(renderer); const e = pm.fromEquirectangular(t).texture; pm.dispose(); return e; } catch (e) { return t; }
})();
const woodTex = (base, dark, light) => canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 70; i++) { const y0 = Math.random() * h, a = 2 + Math.random() * 6, f = 0.01 + Math.random() * 0.03, ph = Math.random() * 6; g.strokeStyle = Math.random() < 0.6 ? dark : light; g.globalAlpha = 0.25 + Math.random() * 0.4; g.lineWidth = 0.6 + Math.random() * 2.2; g.beginPath(); for (let x = 0; x <= w; x += 4) { const y = y0 + Math.sin(x * f + ph) * a + Math.sin(x * 0.11 + ph) * 0.8; x ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); }
  g.globalAlpha = 1;
});
const checkTex = canvasTex(128, 128, (g, w, h) => { g.fillStyle = '#808080'; g.fillRect(0, 0, w, h); g.strokeStyle = '#202020'; g.lineWidth = 2; for (let i = -w; i < w * 2; i += 8) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + h, h); g.stroke(); g.beginPath(); g.moveTo(i, h); g.lineTo(i + h, 0); g.stroke(); } }, 1);
const caseTex = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#4a4a55'; g.fillRect(0, 0, w, h);
  const cols = ['rgba(150,90,40,.5)', 'rgba(70,90,160,.55)', 'rgba(120,60,120,.45)', 'rgba(200,170,110,.35)', 'rgba(40,50,70,.6)'];
  for (let i = 0; i < 90; i++) { const x = Math.random() * w, y = Math.random() * h, r = 8 + Math.random() * 34, rg = g.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, cols[i % cols.length]); rg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = rg; g.fillRect(x - r, y - r, r * 2, r * 2); }
});
const rustTex = canvasTex(128, 128, (g, w, h) => { g.fillStyle = '#6a6a6e'; g.fillRect(0, 0, w, h); for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(${120 + Math.random() * 60},${60 + Math.random() * 30},30,${Math.random() * 0.35})`; const r = 1 + Math.random() * 5; g.fillRect(Math.random() * w, Math.random() * h, r, r); } });
const std = (o) => new THREE.MeshStandardMaterial(Object.assign({ envMap: gunEnv, envMapIntensity: 1.5 }, o));
Object.assign(GM, {
  blue: std({ color: 0x262b36, metalness: 0.9, roughness: 0.32 }),
  steel: std({ color: 0x8a8e96, metalness: 1, roughness: 0.3 }),
  chrome: std({ color: 0xd2d4da, metalness: 1, roughness: 0.14 }),
  black: std({ color: 0x1b1c20, metalness: 0.6, roughness: 0.55 }),
  stain: std({ color: 0xa6aab2, metalness: 1, roughness: 0.38 }),
  polish: std({ color: 0xf2f4f8, metalness: 0.55, roughness: 0.3 }),
  caseH: std({ color: 0xffffff, map: caseTex, metalness: 0.85, roughness: 0.3 }),
  brassF: std({ color: 0x9c7432, metalness: 1, roughness: 0.5, envMapIntensity: 0.7 }),
  rust: std({ color: 0xffffff, map: rustTex, metalness: 0.7, roughness: 0.7 }),
  wood: std({ map: woodTex('#4a240e', '#1a0a03', '#7a3e18'), metalness: 0, roughness: 0.45, envMapIntensity: 0.5 }),
  woodL: std({ map: woodTex('#6e4422', '#2e1a0a', '#9a6a3a'), metalness: 0, roughness: 0.75, envMapIntensity: 0.3 }),
  ivory: std({ color: 0xece2c8, metalness: 0, roughness: 0.35, envMapIntensity: 0.6 }),
  rubber: std({ color: 0x1a1a1c, bumpMap: checkTex, bumpScale: 0.004, metalness: 0, roughness: 0.85, envMapIntensity: 0.3 }),
  brass: std({ color: 0xd8a446, metalness: 1, roughness: 0.25 }),
  spent: std({ color: 0x4d3b1f, metalness: 0.6, roughness: 0.7 }),
  bore: new THREE.MeshBasicMaterial({ color: 0x050505 }),
  screw: std({ color: 0xc0c4cc, metalness: 1, roughness: 0.25 }),
  glove: new THREE.MeshLambertMaterial({ color: 0x6a4428 }), gloveD: new THREE.MeshLambertMaterial({ color: 0x4a2e1a }),
  heat: new THREE.MeshStandardMaterial({ color: 0x2a1a14, emissive: 0xff4a10, emissiveIntensity: 0.0, metalness: 0.6, roughness: 0.5 })
});
// Perfil 2D (adelante = u positivo, arriba = v) extruido de lado a lado y centrado.
function profileGeo(pts, depth, bevel = 0.004, holes = []) {
  const s = new THREE.Shape(); pts.forEach(([u, v], i) => i ? s.lineTo(u, v) : s.moveTo(u, v));
  for (const hp of holes) { const p = new THREE.Path(); hp.forEach(([u, v], i) => i ? p.lineTo(u, v) : p.moveTo(u, v)); s.holes.push(p); }
  const g = new THREE.ExtrudeGeometry(s, { depth: depth - bevel * 2, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel * 0.9, bevelSegments: 2, curveSegments: 6 });
  const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 9, uv.getY(i) * 9);
  g.translate(0, 0, -(depth - bevel * 2) / 2); g.rotateY(Math.PI / 2);   // u→ -z (adelante), extrusión → x
  g.computeVertexNormals(); return g;
}
const arc = (cu, cv, r, a0, a1, n = 6) => { const o = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; o.push([cu + Math.cos(a) * r, cv + Math.sin(a) * r]); } return o; };
// Piezas propias de los revólveres exagerados
const tlMat = new THREE.MeshStandardMaterial({ color: 0x9ad8ff, emissive: 0x3a90ff, emissiveIntensity: 1.2, roughness: 0.2 });
function gunExtras(id, P_, rot, L, R, LOOK) {
  const by = 0.03, bz = -0.07;
  if (id === 'uzi') {
    P_(bx(0.024, 0.17, 0.04), GM.black, 0, -0.09, 0.03).rotation.x = -0.1;
    P_(bx(0.03, 0.028, 0.12), GM.black, 0, 0.0, bz - 0.03);
  } else if (id === 'mp5') {
    P_(bx(0.026, 0.15, 0.05), GM.black, 0, -0.08, -0.03).rotation.x = -0.15;
    P_(bx(0.034, 0.03, 0.16), GM.black, 0, 0.0, bz - 0.06);
    P_(bx(0.02, 0.05, 0.14), GM.rubber, 0, 0.02, 0.14); P_(bx(0.02, 0.07, 0.03), GM.rubber, 0, -0.01, 0.2);
  } else if (id === 'bazuca') {
    rot(P_(cyl(R * 1.25, R * 0.95, 0.06, 20), GM.black, 0, by, 0.1)); rot(P_(cyl(R * 0.7, R * 0.7, 0.002, 16), GM.bore, 0, by, 0.131));
    rot(P_(new THREE.ConeGeometry(R * 0.8, 0.07, 14), new THREE.MeshStandardMaterial({ color: 0x5a6a3a, roughness: 0.6 }), 0, by, bz - L - 0.03)).rotation.x = -Math.PI / 2;
    P_(bx(0.014, 0.03, 0.03), GM.black, 0, by + R + 0.012, bz - L * 0.6);
  } else if (id === 'ballesta') {
    for (const s of [-1, 1]) { const lb = P_(bx(0.16, 0.012, 0.016), LOOK.frame, s * 0.08, by, bz - L + 0.03); lb.rotation.y = s * 0.35; }
    P_(bx(0.25, 0.002, 0.002), GM.ivory, 0, by, bz - L + 0.075);
    rot(P_(cyl(0.006, 0.006, L * 0.9, 8), GM.wood, 0, by + 0.016, bz - L * 0.45)); rot(P_(new THREE.ConeGeometry(0.01, 0.03, 8), GM.steel, 0, by + 0.016, bz - L * 0.92)).rotation.x = -Math.PI / 2;
  } else if (id === 'tesla') {
    for (let i = 0; i < 3; i++) rot(P_(new THREE.TorusGeometry(R * 1.6, 0.004, 8, 20), GM.brass, 0, by, bz - 0.05 - i * L * 0.3));
    P_(new THREE.SphereGeometry(0.022, 14, 10), tlMat, 0, by + R + 0.028, bz - 0.02);
    rot(P_(cyl(R * 0.5, R * 0.5, L * 0.95, 10), tlMat, 0, by, bz - L * 0.5));
  } else if (id === 'jackpot') {
    for (let i = 0; i < 3; i++) P_(bx(0.012, 0.016, 0.016), [GM.orange, GM.brass, GM.chrome][i], 0.019, 0.025, 0.02 - i * 0.018);
    P_(bx(0.006, 0.05, 0.006), GM.chrome, 0.022, 0.06, 0.05); P_(new THREE.SphereGeometry(0.009, 10, 8), GM.orange, 0.022, 0.088, 0.05);

  }
}
const G629_NAME = 'Revólver de acero .44';
const isG629 = (id, h) => id === 'cowboy' && ((h && h.skin629) || (game && game.char === 'carlos'));
const gunName = id => isG629(id) ? G629_NAME : MODELS[id].name;
function buildGun(h, id) {
  if (h.muzzle) { h.muzzle.remove(h.flash); h.muzzle.remove(h.flashLight); }
  while (h.k.children.length) { const c = h.k.children[0]; h.k.remove(c); c.traverse(o => { if (o.geometry) o.geometry.dispose(); }); }
  const g629 = isG629(id, h), m = MODELS[id], N = m.cap, L = g629 ? 0.36 : m.L, R = g629 ? 0.0125 : m.R, mini = id === 'minigun';
  const P_ = (geo, mat, x, y, z, parent = h.k) => { const o = new THREE.Mesh(geo, mat); o.position.set(x, y, z); parent.add(o); return o; };
  const LOOK = {
    paci: { frame: GM.caseH, barrel: GM.blue, cyl: GM.blue, grip: GM.wood, trig: GM.brassF },
    corto: { frame: GM.chrome, barrel: GM.chrome, cyl: GM.chrome, grip: GM.ivory, trig: GM.chrome },
    viejo: { frame: GM.brassF, barrel: GM.rust, cyl: GM.rust, grip: GM.woodL, trig: GM.brassF },
    magnum: { frame: GM.stain, barrel: GM.stain, cyl: GM.stain, grip: GM.rubber, trig: GM.stain },
    g629: { frame: GM.polish, barrel: GM.polish, cyl: GM.polish, grip: GM.woodL, trig: GM.steel },
    minigun: { frame: GM.black, barrel: GM.steel, cyl: GM.blue, grip: GM.rubber, trig: GM.steel },
    uzi: { frame: GM.black, barrel: GM.black, cyl: GM.chrome, grip: GM.rubber, trig: GM.chrome },
    cowboy: { frame: GM.blue, barrel: GM.blue, cyl: GM.steel, grip: GM.ivory, trig: GM.brassF },
    mp5: { frame: GM.black, barrel: GM.black, cyl: GM.blue, grip: GM.rubber, trig: GM.steel },
    ballesta: { frame: GM.woodL, barrel: GM.steel, cyl: GM.wood, grip: GM.wood, trig: GM.brassF },
    tesla: { frame: GM.brassF, barrel: GM.blue, cyl: GM.brassF, grip: GM.wood, trig: GM.brassF },
    jackpot: { frame: GM.brass, barrel: GM.chrome, cyl: GM.brass, grip: GM.ivory, trig: GM.orange },
    bazuca: { frame: GM.blue, barrel: GM.black, cyl: GM.blue, grip: GM.rubber, trig: GM.steel }
  }[g629 ? 'g629' : id];
  const cylG = new THREE.Group(); h.k.add(cylG); const cylSpin = new THREE.Group(); cylG.add(cylSpin);
  const hammer = new THREE.Group(); h.k.add(hammer);
  let spinG = null, muzzleY = 0.03, muzzleZ;
  h.caps = [];
  const rot = o => { o.rotation.x = Math.PI / 2; return o; };
  if (mini) {
    // cuerpo con asa de transporte y protector de cañones
    P_(profileGeo([[-0.09, -0.04], [0.09, -0.04], [0.1, 0.035], [0.06, 0.05], [-0.07, 0.05], [-0.095, 0.03]], 0.056, 0.006), LOOK.frame, 0, 0, 0.01);
    P_(profileGeo([[-0.06, 0.05], [-0.05, 0.1], [0.06, 0.1], [0.07, 0.05], [0.05, 0.05], [0.045, 0.085], [-0.035, 0.085], [-0.045, 0.05]], 0.016, 0.003), LOOK.frame, 0, 0, 0.01);
    cylG.position.set(0, 0.012, -0.05);
    rot(P_(cyl(0.064, 0.064, 0.1, 28), LOOK.cyl, 0, 0, 0, cylSpin));
    for (let i = 0; i < 6; i++) { const a = (i + 0.5) * TAU / 6; P_(bx(0.012, 0.012, 0.09), GM.black, Math.sin(a) * 0.062, Math.cos(a) * 0.062, 0, cylSpin); }
    for (let i = 0; i < 12; i++) { const a = i * TAU / 12, c = rot(P_(cyl(0.008, 0.008, 0.006, 10), GM.brass, Math.sin(a) * 0.046, Math.cos(a) * 0.046, 0.051, cylSpin)); h.caps.push(c); }
    spinG = new THREE.Group(); spinG.position.set(0, 0.012, -0.1); h.k.add(spinG);
    for (let i = 0; i < 6; i++) { const a = i * TAU / 6; rot(P_(cyl(0.0085, 0.0085, 0.34, 12), LOOK.barrel, Math.sin(a) * 0.024, Math.cos(a) * 0.024, -0.17, spinG)); rot(P_(cyl(0.0045, 0.0045, 0.002, 8), GM.bore, Math.sin(a) * 0.024, Math.cos(a) * 0.024, -0.341, spinG)); }
    for (const zz of [-0.04, -0.2]) rot(P_(cyl(0.038, 0.038, 0.014, 20), LOOK.frame, 0, 0, zz, spinG));
    h.heatRing = rot(P_(cyl(0.039, 0.039, 0.03, 20), GM.heat, 0, 0, -0.32, spinG));
    hammer.position.set(0, 0.04, 0.085); P_(bx(0.012, 0.03, 0.016), GM.steel, 0, 0.012, 0, hammer);
    P_(profileGeo([[0.005, -0.03], [-0.01, -0.05], [-0.03, -0.14], [-0.075, -0.14], [-0.07, -0.11], [-0.05, -0.03]], 0.04, 0.008), LOOK.grip, 0, 0, 0.03);
    rot(P_(new THREE.TorusGeometry(0.02, 0.0035, 8, 16, Math.PI), LOOK.frame, 0, -0.04, 0.0)).rotation.set(0, Math.PI / 2, Math.PI);
    P_(profileGeo([[0, 0], [-0.004, -0.02], [0.004, -0.026], [0.006, -0.004]], 0.006, 0.0015), LOOK.trig, 0, -0.035, 0.004);
    muzzleY = 0.012; muzzleZ = -0.45;
  } else {
    const corto = id === 'corto', viejo = id === 'viejo', magnum = id === 'magnum';
    // armazón con ventana para el tambor
    const rc = m.rc || (corto ? 0.031 : 0.034), cl = id === 'escopeta' ? 0.085 : 0.07;
    const fb = Math.min(-0.036, -rc - 0.004), wT = 0.005 + rc + 0.002, wB = 0.005 - rc - 0.002, fT = Math.max(0.058, wT + 0.016);
    const fw = id === 'escopeta' ? 0.036 : 0.032, top = magnum || g629 ? 0.054 : 0.05;
    const frameOut = [[0.078, top - 0.004], [0.075, 0.008], [0.075, fb + 0.006], [0.04, fb], [-0.02, fb], [-0.045, fb + 0.012], [-0.075, -0.012], [-0.08, 0.04], [-0.07, fT], [0.02, fT], [0.045, fT - 0.002], [0.06, 0.05], [0.075, top - 0.002]];
    const wF = -0.036 - cl / 2, wR = -0.034 + cl / 2, frameWin = [[wF, wB], [wF, wT], [wR, wT], [wR, wB]];
    P_(profileGeo(frameOut.map(([z, v]) => [-z, v]), fw, 0.004, [frameWin.map(([z, v]) => [-z, v])]), LOOK.frame, 0, 0, 0);
    // cañón
    const bseg = viejo ? 8 : 20;
    rot(P_(cyl(R, R * 1.06, L, bseg), LOOK.barrel, 0, 0.03, -0.07 - L / 2));
    rot(P_(cyl(R * 0.55, R * 0.55, 0.002, 10), GM.bore, 0, 0.03, -0.0712 - L));
    rot(P_(cyl(R * 1.18, R * 1.18, 0.012, bseg), LOOK.barrel, 0, 0.03, -0.075 - 0.006));
    if (magnum) {
      P_(bx(0.014, 0.012, L), LOOK.barrel, 0, 0.046, -0.07 - L / 2);
      for (let i = 0; i < 8; i++) P_(bx(0.016, 0.003, 0.003), GM.black, 0, 0.0525, -0.08 - i * (L - 0.02) / 8);
      P_(bx(0.022, 0.024, L * 0.96), LOOK.barrel, 0, 0.012, -0.07 - L * 0.48);
      P_(bx(0.014, 0.012, 0.016), GM.black, 0, 0.064, 0.04);
    } else if (g629) {
      // acero pulido: costilla lisa arriba y funda corta del extractor (no de largo completo como el Magnum)
      P_(bx(0.01, 0.008, L * 0.97), LOOK.barrel, 0, 0.043, -0.07 - L * 0.485);
      P_(bx(0.019, 0.022, L * 0.46), LOOK.barrel, 0, 0.012, -0.07 - L * 0.23);
      rot(P_(cyl(0.0105, 0.0105, 0.012, 14), LOOK.barrel, 0, 0.012, -0.07 - L * 0.46));
    } else if (viejo) {
      P_(bx(0.008, 0.014, L * 0.6), GM.steel, 0, 0.008, -0.07 - L * 0.3);
      P_(bx(0.01, 0.006, 0.05), GM.brassF, 0, 0.0, -0.09);
    } else {
      const el_ = Math.min(0.16, L * 0.6);
      rot(P_(cyl(0.0068, 0.0068, el_, 10), LOOK.barrel, 0, 0.011, -0.07 - el_ / 2));
      rot(P_(cyl(0.0085, 0.0085, 0.008, 10), GM.screw, 0, 0.011, -0.07 - el_));
    }
    P_(profileGeo([[0, 0], [0.003, 0.014], [0.012, 0.014], [0.014, 0]], 0.0045, 0.001), magnum ? GM.orange : LOOK.barrel, 0, 0.03 + R * 0.8, -0.07 - L + 0.016);
    P_(bx(0.006, 0.01, 0.01), LOOK.frame, -0.007, top + 0.004, 0.04); P_(bx(0.006, 0.01, 0.01), LOOK.frame, 0.007, top + 0.004, 0.04);
    gunExtras(id, P_, rot, L, R, LOOK);
    // tambor con estrías y biseles
    cylG.position.set(0, 0.005, -0.035);
    const lathe = new THREE.LatheGeometry([[0.0001, -cl / 2], [rc - 0.006, -cl / 2], [rc, -cl / 2 + 0.006], [rc, cl / 2 - 0.004], [rc - 0.003, cl / 2], [0.0001, cl / 2]].map(([r, y]) => new THREE.Vector2(r, y)), 28);
    rot(P_(lathe, LOOK.cyl, 0, 0, 0, cylSpin));
    if (!viejo) for (let i = 0; i < N; i++) { const a = (i + 0.5) * TAU / N; P_(bx(0.009, 0.006, cl * 0.62), GM.black, Math.sin(a) * rc * 0.96, Math.cos(a) * rc * 0.96, -0.004, cylSpin); }
    else for (let i = 0; i < N; i++) { const a = (i + 0.5) * TAU / N; rot(P_(cyl(0.004, 0.004, 0.008, 6), GM.steel, Math.sin(a) * rc * 0.62, Math.cos(a) * rc * 0.62, cl / 2 + 0.003, cylSpin)); }
    for (let i = 0; i < N; i++) { const a = i * TAU / N, c = rot(P_(cyl(0.0085, 0.0085, 0.006, 12), GM.brass, Math.sin(a) * rc * 0.62, Math.cos(a) * rc * 0.62, cl / 2, cylSpin)); h.caps.push(c); }
    rot(P_(cyl(0.006, 0.006, 0.004, 10), GM.screw, 0, 0, -cl / 2 - 0.001, cylSpin));
    // martillo con espuela
    hammer.position.set(0, 0.032, 0.072);
    if (!corto) P_(profileGeo([[0.004, -0.012], [-0.006, 0.018], [-0.022, 0.032], [-0.026, 0.026], [-0.012, 0.012], [-0.006, -0.012]], 0.009, 0.0015), GM.steel, 0, 0, 0, hammer);
    else P_(bx(0.01, 0.014, 0.012), GM.steel, 0, 0.004, 0, hammer);
    // guardamonte y gatillo curvo
    const tg = new THREE.Group(); tg.position.set(0, -0.034, 0.004); tg.rotation.y = Math.PI / 2; h.k.add(tg);
    const tgm = P_(new THREE.TorusGeometry(0.02, 0.0032, 8, 18, Math.PI), LOOK.trig, 0, 0, 0, tg); tgm.rotation.z = Math.PI;
    P_(profileGeo([[0, 0], [-0.006, -0.012], [-0.002, -0.022], [0.005, -0.016], [0.004, -0.002]], 0.006, 0.0015), LOOK.trig, 0, -0.036, 0.004);
    // tornillos del armazón
    for (const [y, z] of [[0.02, 0.05], [-0.018, 0.045], [0.024, -0.062]]) for (const s of [-1, 1]) { const sc = P_(cyl(0.004, 0.004, 0.002, 10), GM.screw, s * (fw / 2 + 0.001), y, z); sc.rotation.z = Math.PI / 2; }
    // cachas
    const gl = corto ? 0.082 : magnum ? 0.115 : 0.105;
    const k_ = gl / 0.105;
    const grip = corto
      ? [[-0.032, -0.028], [-0.03, -0.05], [-0.034, -0.072], ...arc(-0.05, -0.084, 0.016, -0.6, -2.9, 7), [-0.07, -0.07], [-0.078, -0.05], [-0.08, -0.032], [-0.07, -0.024]]
      : magnum
        ? [[-0.03, -0.028], [-0.036, -0.05], [-0.032, -0.064], [-0.04, -0.074], [-0.036, -0.088], [-0.046, -0.1], [-0.05, -0.12], [-0.06, -0.138], [-0.09, -0.136], [-0.094, -0.1], [-0.088, -0.06], [-0.082, -0.03], [-0.06, -0.024]]
        : [[-0.03, -0.028], [-0.034, -0.05 * k_], [-0.043, -0.077 * k_], [-0.055, -0.103 * k_], ...arc(-0.077, -0.112 * k_, 0.02, -0.3, -2.8, 8), [-0.098, -0.085 * k_], [-0.091, -0.055], [-0.082, -0.03], [-0.06, -0.024]];
    if (magnum) for (let i = 0; i < 3; i++) P_(cyl(0.006, 0.006, 0.042, 8), GM.rubber, 0, -0.06 - i * 0.026, 0.035 + i * 0.006).rotation.z = Math.PI / 2;
    P_(profileGeo(grip, fw + 0.008, 0.007), LOOK.grip, 0, 0, 0);
    P_(profileGeo(grip.map(([u, v]) => [u + 0.004, v]), fw - 0.006, 0.002), LOOK.frame, 0, -0.002, 0);
    if (!corto && !magnum) for (const s of [-1, 1]) { const md = P_(cyl(0.006, 0.006, 0.002, 12), GM.brassF, s * (fw / 2 + 0.0055), -0.07, 0.065); md.rotation.z = Math.PI / 2; }
    muzzleZ = -0.075 - L;
  }
  // mano con guante de cuero que rodea la empuñadura
  const hand = new THREE.Group(); hand.name = 'hand'; h.k.add(hand);
  P_(bx(0.044, 0.08, 0.05), GM.glove, 0.008, -0.075, 0.09, hand).rotation.x = -0.38;
  for (let i = 0; i < 3; i++) { const f = P_(cyl(0.0095, 0.0095, 0.05, 8), GM.glove, -0.004, -0.06 - i * 0.022, 0.03 + i * 0.008, hand); f.rotation.z = Math.PI / 2; f.rotation.y = 0.25; }
  P_(bx(0.012, 0.012, 0.04), GM.glove, -0.004, -0.032, 0.02, hand).rotation.x = -0.6;
  const th = P_(cyl(0.009, 0.009, 0.055, 8), GM.glove, -0.024, -0.026, 0.05, hand); th.rotation.x = Math.PI / 2 - 0.35; th.rotation.z = -0.2;
  P_(cyl(0.032, 0.036, 0.05, 14), GM.gloveD, 0.02, -0.12, 0.15, hand).rotation.x = Math.PI / 2 - 0.45;
  P_(cyl(0.04, 0.042, 0.3, 14), GM.sleeve, 0.04, -0.16, 0.3, hand).rotation.x = Math.PI / 2 - 0.45;
  const muzzle = new THREE.Object3D(); muzzle.position.set(0, muzzleY, muzzleZ); h.k.add(muzzle);
  muzzle.add(h.flash); muzzle.add(h.flashLight);
  const gunG = new THREE.Group(); for (const c of h.k.children.slice()) if (c !== hand) gunG.add(c); h.k.add(gunG); h.gunG = gunG;
  h.k.traverse(o => { if (o.isMesh) { o.castShadow = false; o.renderOrder = 1; } });
  Object.assign(h, { cylG, cylSpin, hammer, muzzle, spinG, spinV: 0, model: id, cap: N });
}
// luz suave pegada a la cámara: ilumina el arma de noche sin cambiar el resto del mapa
/* ===================== HUMANOS: zombis y policías ===================== */
// Caja con bordes redondeados y, si se pide, más ancha arriba que abajo (hombros y cintura).
function roundBox(w, h, d, r, seg = 4, taper = 0) {
  const g = new THREE.BoxGeometry(w, h, d, seg, seg, seg), p = g.attributes.position, v = new THREE.Vector3(), c = new THREE.Vector3();
  const ix = w / 2 - r, iy = h / 2 - r, iz = d / 2 - r;
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i); c.set(clamp(v.x, -ix, ix), clamp(v.y, -iy, iy), clamp(v.z, -iz, iz));
    v.sub(c); if (v.lengthSq() > 1e-9) v.setLength(r); v.add(c);
    if (taper) { const k = 1 + taper * (v.y / h); v.x *= k; }
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals(); return g;
}
const limbGeo = (rTop, rBot, len, seg = 9) => new THREE.CylinderGeometry(rTop, rBot, len, seg, 3).translate(0, -len / 2, 0);
const ZG = {
  torso: roundBox(0.48, 0.66, 0.28, 0.09, 4, 0.22), head: roundBox(0.28, 0.32, 0.29, 0.1, 4),
  arm: limbGeo(0.08, 0.056, 0.62), leg: limbGeo(0.1, 0.068, 0.76), hand: roundBox(0.075, 0.13, 0.05, 0.022, 2), foot: roundBox(0.12, 0.08, 0.24, 0.035, 2),
  jaw: roundBox(0.2, 0.07, 0.17, 0.03, 2), socket: new THREE.BoxGeometry(0.085, 0.07, 0.03), nose: new THREE.BoxGeometry(0.05, 0.07, 0.05), tooth: new THREE.BoxGeometry(0.022, 0.03, 0.015), hair: roundBox(0.3, 0.08, 0.3, 0.035, 2),
  eye: new THREE.BoxGeometry(0.065, 0.045, 0.02), mouth: new THREE.BoxGeometry(0.15, 0.045, 0.02), bigMouth: new THREE.BoxGeometry(0.17, 0.12, 0.02),
  belly: new THREE.SphereGeometry(0.22, 10, 8), rib: new THREE.BoxGeometry(0.3, 0.03, 0.02), pus: new THREE.SphereGeometry(0.06, 6, 5),
  helmet: new THREE.BoxGeometry(0.36, 0.3, 0.37), visor: new THREE.BoxGeometry(0.34, 0.12, 0.02), vest: new THREE.BoxGeometry(0.56, 0.5, 0.34),
  capCrown: new THREE.BoxGeometry(0.32, 0.1, 0.32), capBrim: new THREE.BoxGeometry(0.32, 0.03, 0.14), badge: new THREE.BoxGeometry(0.07, 0.08, 0.02),
  brim: new THREE.CylinderGeometry(0.34, 0.34, 0.03, 12), cone: new THREE.ConeGeometry(0.18, 0.22, 10), pistol: new THREE.BoxGeometry(0.05, 0.08, 0.22),
  spike: new THREE.ConeGeometry(0.06, 0.25, 6),
  dBody: new THREE.BoxGeometry(0.32, 0.34, 0.85), dHead: new THREE.BoxGeometry(0.24, 0.24, 0.34), dLeg: new THREE.BoxGeometry(0.09, 0.48, 0.09).translate(0, -0.24, 0), dTail: new THREE.BoxGeometry(0.05, 0.05, 0.35).translate(0, 0, -0.17), ear: new THREE.BoxGeometry(0.06, 0.1, 0.03)
};
const mouthMat = new THREE.MeshBasicMaterial({ color: 0x120404 });
const zSkinTex = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#e6e6e0'; g.fillRect(0, 0, w, h);
  const blot = (x, y, r, c) => { const rg = g.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, c); rg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = rg; g.fillRect(x - r, y - r, r * 2, r * 2); };
  for (let i = 0; i < 60; i++) blot(Math.random() * w, Math.random() * h, 8 + Math.random() * 30, `rgba(${60 + Math.random() * 40},${70 + Math.random() * 30},${50 + Math.random() * 30},.35)`);
  for (let i = 0; i < 14; i++) blot(Math.random() * w, Math.random() * h, 10 + Math.random() * 22, 'rgba(90,60,110,.35)');
  for (let i = 0; i < 18; i++) blot(Math.random() * w, Math.random() * h, 4 + Math.random() * 14, 'rgba(110,10,10,.6)');
  g.strokeStyle = 'rgba(60,40,80,.35)'; g.lineWidth = 1.2;
  for (let i = 0; i < 22; i++) { let x = Math.random() * w, y = Math.random() * h; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (Math.random() - 0.5) * 24; y += Math.random() * 16; g.lineTo(x, y); } g.stroke(); }
  for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(0,0,0,${Math.random() * 0.12})`; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
});
const zClothTex = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#d8d8d8'; g.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 3) { g.fillStyle = `rgba(0,0,0,${0.04 + Math.random() * 0.05})`; g.fillRect(0, y, w, 1); }
  const blot = (x, y, r, c) => { const rg = g.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, c); rg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = rg; g.fillRect(x - r, y - r, r * 2, r * 2); };
  for (let i = 0; i < 40; i++) blot(Math.random() * w, Math.random() * h, 10 + Math.random() * 36, 'rgba(50,40,25,.3)');
  for (let i = 0; i < 16; i++) { const x = Math.random() * w, y = Math.random() * h * 0.7; blot(x, y, 12 + Math.random() * 26, 'rgba(90,6,6,.6)'); g.fillStyle = 'rgba(80,6,6,.45)'; g.fillRect(x - 2, y, 3 + Math.random() * 3, 20 + Math.random() * 50); }
  for (let i = 0; i < 9; i++) { const x = Math.random() * w, y = Math.random() * h; g.fillStyle = 'rgba(15,10,8,.85)'; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 7; k++) g.lineTo(x + (Math.random() - 0.5) * 30, y + (Math.random() - 0.5) * 24); g.fill(); }
});
const toothMat = new THREE.MeshLambertMaterial({ color: 0xd8cfa0 }), socketMat = new THREE.MeshBasicMaterial({ color: 0x0a0605 }), hairMat = new THREE.MeshLambertMaterial({ color: 0x1e1a16 }), shoeMat = new THREE.MeshLambertMaterial({ color: 0x1a1612 });
const ribMat = new THREE.MeshLambertMaterial({ color: 0xcfc4a8 });
const pusMat = new THREE.MeshLambertMaterial({ color: 0xc8d040, emissive: 0x3a4a08 });
const armorMat = new THREE.MeshLambertMaterial({ color: 0x23262b });
// Caballero zombi: placas de armadura (una bala tumba cada placa) y el corazón escondido detrás de una
const KG = { chest: new THREE.BoxGeometry(0.44, 0.26, 0.07), belly: new THREE.BoxGeometry(0.4, 0.2, 0.07), back: new THREE.BoxGeometry(0.44, 0.4, 0.07), pauldron: new THREE.BoxGeometry(0.2, 0.12, 0.3), helm: new THREE.BoxGeometry(0.33, 0.36, 0.35), plume: new THREE.BoxGeometry(0.04, 0.16, 0.3), heart: new THREE.SphereGeometry(0.085, 10, 8) };
const knightMat = new THREE.MeshPhongMaterial({ color: 0x9aa0aa, specular: 0xffffff, shininess: 80 });
const plumeMat = new THREE.MeshLambertMaterial({ color: 0x9a1a1a });
const heartMat = new THREE.MeshBasicMaterial({ color: 0xff2a3a });
// Hacha: en la mano del hachero y como proyectil
const axeHandleMat = new THREE.MeshLambertMaterial({ color: 0x5a3a20 }), axeBladeMat = new THREE.MeshPhongMaterial({ color: 0xb8bcc4, specular: 0xffffff, shininess: 90 });
const AXG = { handle: new THREE.BoxGeometry(0.04, 0.5, 0.04), blade: new THREE.BoxGeometry(0.03, 0.16, 0.2) };
// Motosierra: motor naranja, espada de acero y una cadena de dientes que corre
const SAWG = { eng: new THREE.BoxGeometry(0.2, 0.26, 0.34), cap: new THREE.BoxGeometry(0.16, 0.06, 0.2), grip: new THREE.TorusGeometry(0.1, 0.022, 6, 12, Math.PI), bar: new THREE.BoxGeometry(0.035, 0.78, 0.12), tip: new THREE.CylinderGeometry(0.06, 0.06, 0.035, 12), tooth: new THREE.BoxGeometry(0.05, 0.03, 0.03), pipe: new THREE.CylinderGeometry(0.025, 0.025, 0.08, 8), apron: new THREE.BoxGeometry(0.42, 0.5, 0.02) };
const sawMats = { eng: new THREE.MeshLambertMaterial({ color: 0xe86a10, emissive: 0x2a0e00 }), dark: new THREE.MeshLambertMaterial({ color: 0x1c1c1e }), bar: new THREE.MeshLambertMaterial({ color: 0xb8bcc4, emissive: 0x1a1c20 }), tooth: new THREE.MeshLambertMaterial({ color: 0x3a3a3e, emissive: 0x0a0a0a }), blood: new THREE.MeshLambertMaterial({ color: 0x6a0a08, emissive: 0x200000 }) };
function sawModel() {
  const g = new THREE.Group();
  const add = (geo, mat, x, y, zz) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, zz); g.add(m); return m; };
  add(SAWG.eng, sawMats.eng, 0, 0, 0); add(SAWG.cap, sawMats.dark, 0, 0.16, 0.02);
  const gr = add(SAWG.grip, sawMats.dark, 0, 0.12, -0.08); gr.rotation.y = Math.PI / 2;
  add(SAWG.pipe, sawMats.dark, 0.11, 0.02, -0.08).rotation.z = Math.PI / 2;
  add(SAWG.bar, sawMats.bar, 0, -0.5, 0.02); add(SAWG.tip, sawMats.bar, 0, -0.89, 0.02).rotation.z = Math.PI / 2;
  // la cadena: dientes a lo largo del borde que se desplazan para que se vea girar
  const ch = new THREE.Group(); g.add(ch);
  for (let i = 0; i < 16; i++) { const y = -0.14 - i * 0.05; for (const e of [-1, 1]) { const t = new THREE.Mesh(SAWG.tooth, i % 5 === 2 ? sawMats.blood : sawMats.tooth); t.position.set(0, y, 0.02 + e * 0.07); ch.add(t); } }
  g.userData.chain = ch;
  return g;
}
function axeModel() { const g = new THREE.Group(); const h = new THREE.Mesh(AXG.handle, axeHandleMat); g.add(h); const b = new THREE.Mesh(AXG.blade, axeBladeMat); b.position.set(0, 0.2, 0.1); g.add(b); return g; }
const visorMat = new THREE.MeshLambertMaterial({ color: 0x0c1420, emissive: 0x0a1830 });
const badgeMat = new THREE.MeshLambertMaterial({ color: 0xd8b040, emissive: 0x3a2a08 });
const strawMat = new THREE.MeshLambertMaterial({ color: 0xc8a850 });
const pistolMat = new THREE.MeshLambertMaterial({ color: 0x15161a });
const spikeMat = new THREE.MeshLambertMaterial({ color: 0xd8ccb0 });
const copCapMat = new THREE.MeshLambertMaterial({ color: 0x141a2a });
const copEyeMat = new THREE.MeshBasicMaterial({ color: 0x202020 });
const ZDEF = {
  walker: { name: 'Caminante', hp: 100, speed: [1.25, 1.85], dmg: 13, reach: 1.25, scale: 1, pts: 100, eye: 0xffd84a, drop: 0.1, gold: 1, skin: [0x7d8f69, 0x6f7f62, 0x8a9478, 0x7a8a7a, 0x8f8a6a] },
  crawler: { name: 'Reptante', hp: 55, speed: [1.0, 1.35], dmg: 9, reach: 1.15, scale: 1, pts: 120, eye: 0xffa020, drop: 0.1, gold: 1, skin: [0x6a7058, 0x727a62] },
  runner: { name: 'Corredor', hp: 62, speed: [4.1, 4.8], dmg: 8, reach: 1.2, scale: 0.94, pts: 150, eye: 0xff2020, drop: 0.12, gold: 1, skin: [0xa8ab98, 0x9da08c] },
  dog: { name: 'Perro', hp: 40, speed: [5.0, 5.8], dmg: 8, reach: 1.15, scale: 1, pts: 130, eye: 0xff3030, drop: 0.08, gold: 1, skin: [0x4a3a30, 0x3a3028, 0x5a4a3a], quad: true },
  spitter: { name: 'Escupidor', hp: 90, speed: [1.6, 2.0], dmg: 11, reach: 1.25, scale: 1.05, pts: 200, eye: 0xa6ff4a, drop: 0.18, gold: 1, skin: [0x7fa04a, 0x6f9a40] },
  screamer: { name: 'Gritona', hp: 75, speed: [1.9, 2.3], dmg: 10, reach: 1.25, scale: 1.02, pts: 220, eye: 0xff70ff, drop: 0.16, gold: 1, skin: [0xc8c4b8, 0xbab6aa] },
  armored: { name: 'Antidisturbios', hp: 150, speed: [1.4, 1.7], dmg: 16, reach: 1.3, scale: 1.08, pts: 260, eye: 0x60c0ff, drop: 0.18, gold: 1, skin: [0x7d8f69, 0x8a9478] },
  copz: { name: 'Oficial zombi', hp: 120, speed: [1.5, 1.9], dmg: 14, reach: 1.25, scale: 1, pts: 180, eye: 0xffd84a, drop: 0.2, gold: 1, skin: [0x8a9478, 0x9aa088] },
  bloater: { name: 'Hinchado', hp: 170, speed: [0.95, 1.15], dmg: 14, reach: 1.4, scale: 1.25, pts: 250, eye: 0xd0ff40, drop: 0.3, gold: 5, big: true, skin: [0x8aa060, 0x7f9a58] },
  brute: { name: 'Carnicero', hp: 520, speed: [1.15, 1.3], dmg: 30, reach: 1.95, scale: 1.65, pts: 600, eye: 0xff6a1a, drop: 0.6, gold: 5, big: true, skin: [0x5f6b55, 0x66705a] },
  boss: { name: 'Jefe', hp: 1, speed: [1, 1], dmg: 45, reach: 2.2, scale: 2, pts: 5000, eye: 0xff2a00, drop: 1, gold: 5, big: true, skin: [0x6a5048, 0x5a6a50] },
  bandit: { name: 'Asaltante', hp: 110, speed: [2.0, 2.4], dmg: 9, reach: 1.25, scale: 1, pts: 250, eye: 0x2a1a10, drop: 0.35, gold: 4, skin: [0xc89a78, 0xa87a58, 0x8a5a3a], human: true },
  abom: { name: 'Abominación', hp: 1000, speed: [1.05, 1.15], dmg: 40, reach: 2.9, scale: 2.35, pts: 3000, eye: 0xff2a00, drop: 1, gold: 5, big: true, skin: [0x6a5048, 0x705a4a] },
  axer: { name: 'Hachero', hp: 95, speed: [1.5, 1.9], dmg: 12, reach: 1.25, scale: 1.05, pts: 220, eye: 0xffa040, drop: 0.2, gold: 2, skin: [0x6f7a5a, 0x7a8462] },
  knight: { name: 'Caballero', turn: 1.15, hp: 9999, speed: [1.05, 1.3], dmg: 22, reach: 1.45, scale: 1.12, pts: 500, eye: 0xff3030, drop: 0.6, gold: 6, skin: [0x6a7058, 0x5f6b55] },
  saw: { name: 'Motosierra', hp: 380, speed: [1.2, 1.4], dmg: 36, reach: 1.75, scale: 1.3, pts: 450, eye: 0xff5020, drop: 0.45, gold: 4, big: true, skin: [0x6a7a58, 0x5f6e50, 0x748060] }
};
const eyeMats = {}; Object.keys(ZDEF).forEach(k => eyeMats[k] = new THREE.MeshBasicMaterial({ color: ZDEF[k].eye }));
const bellyMat = new THREE.MeshLambertMaterial({ color: 0x6fae2a, emissive: 0x2a5a08 });
const zombies = [];
let zid = 0;
function humanoid(z, o, mk) {
  const hipY = o.crawl ? 0.24 : 0.8;
  z.legL = mk(ZG.leg, o.pants, 'limb', z.body, -0.12, hipY, 0);
  z.legR = mk(ZG.leg, o.pants, 'limb', z.body, 0.12, hipY, 0);
  for (const lg of [z.legL, z.legR]) { const f = new THREE.Mesh(ZG.foot, shoeMat); f.position.set(0, -0.74, 0.05); lg.add(f); }
  z.torsoG = new THREE.Group(); z.torsoG.position.y = hipY; z.body.add(z.torsoG);
  z.torso = mk(ZG.torso, o.shirt, 'body', z.torsoG, 0, 0.33, 0);
  z.neck = new THREE.Group(); z.neck.position.y = 0.68; z.torsoG.add(z.neck);
  z.head = mk(ZG.head, o.skin, 'head', z.neck, 0, 0.16, 0);
  for (const sx of [-1, 1]) { const e = new THREE.Mesh(ZG.eye, o.eye); e.position.set(sx * 0.065, 0.035, o.zombie ? 0.142 : 0.146); z.head.add(e); if (o.zombie) { const so = new THREE.Mesh(ZG.socket, socketMat); so.position.set(sx * 0.065, 0.035, 0.133); z.head.add(so); } }
  if (o.zombie) {
    const no = new THREE.Mesh(ZG.nose, o.skin); no.position.set(0, -0.015, 0.145); z.head.add(no);
    const jaw = new THREE.Mesh(ZG.jaw, o.skin); jaw.position.set(0, -0.14, 0.04); jaw.rotation.x = o.bigMouth ? 0.55 : 0.28; z.head.add(jaw); z.jaw = jaw;
    const mo = new THREE.Mesh(o.bigMouth ? ZG.bigMouth : ZG.mouth, mouthMat); mo.scale.set(1, 1.8, 1); mo.position.set(0, -0.095, 0.135); z.head.add(mo);
    for (let i = 0; i < 5; i++) if (Math.random() < 0.8) { const t = new THREE.Mesh(ZG.tooth, toothMat); t.position.set(-0.05 + i * 0.025, -0.075, 0.142); t.rotation.z = (Math.random() - 0.5) * 0.4; z.head.add(t); }
    for (let i = 0; i < 4; i++) if (Math.random() < 0.6) { const t = new THREE.Mesh(ZG.tooth, toothMat); t.position.set(-0.04 + i * 0.026, 0.02, 0.08); jaw.add(t); }
    if (!o.hat && Math.random() < 0.55) { const hr = new THREE.Mesh(ZG.hair, hairMat); hr.position.set(rand(-0.03, 0.03), 0.15, -0.02); hr.scale.set(rand(0.6, 1), 1, rand(0.6, 1)); hr.rotation.y = rand(-0.4, 0.4); z.head.add(hr); }
  } else { const mo = new THREE.Mesh(o.bigMouth ? ZG.bigMouth : ZG.mouth, mouthMat); mo.position.set(0, -0.08, 0.146); z.head.add(mo); }
  z.armLG = new THREE.Group(); z.armLG.position.set(-0.33, 0.6, 0); z.torsoG.add(z.armLG);
  z.armRG = new THREE.Group(); z.armRG.position.set(0.33, 0.6, 0); z.torsoG.add(z.armRG);
  z.armL = mk(ZG.arm, o.skin, 'limb', z.armLG); z.armR = mk(ZG.arm, o.skin, 'limb', z.armRG);
  for (const a of [z.armL, z.armR]) { const hd = new THREE.Mesh(ZG.hand, o.skin); hd.position.set(0, -0.66, 0.01); a.add(hd); }
  if (o.crawl) { z.torsoG.rotation.x = 1.3; z.neck.rotation.x = -1.15; z.legL.rotation.x = 1.45; z.legR.rotation.x = 1.5; z.legL.scale.y = 0.6; z.legR.scale.y = 0.45; }
  if (o.hat) addHat(z.head, o.hat);
}
function addHat(head, type) {
  const put = (geo, mat, x, y, zz) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, zz); m.castShadow = true; head.add(m); return m; };
  if (type === 'cop') { put(ZG.capCrown, copCapMat, 0, 0.2, 0); put(ZG.capBrim, pistolMat, 0, 0.16, 0.2); put(ZG.badge, badgeMat, 0, 0.21, 0.165); }
  else if (type === 'straw') { put(ZG.brim, strawMat, 0, 0.17, 0); put(ZG.cone, strawMat, 0, 0.28, 0); }
  else if (type === 'cowboy') { put(ZG.brim, allyMats.cowboy, 0, 0.17, 0).scale.set(1.15, 1, 1.15); put(ZG.capCrown, allyMats.cowboy, 0, 0.25, 0).scale.set(0.85, 1.7, 0.85); }
  else if (type === 'swat') { put(allyGeo.dome, allyMats.swat, 0, 0.1, 0).scale.set(1.08, 1.05, 1.12); }
  else if (type === 'helmet') { put(allyGeo.dome, allyMats.helmet, 0, 0.1, 0).scale.set(1.05, 1, 1.1); }
  else if (type === 'veil') { put(allyGeo.veil, allyMats.veil, 0, 0.04, -0.03); put(allyGeo.band, allyMats.band, 0, 0.16, -0.02); }
  else if (type === 'cap') { const c = pick([copCapMat, pistolMat, strawMat]); put(ZG.capCrown, c, 0, 0.2, 0); put(ZG.capBrim, c, 0, 0.16, 0.2); }
}
/* ===== Disfraces de zombi: cada mapa tiene los suyos ===== */
const LT = {
  plaid: canvasTex(128, 128, (g, w, h) => { g.fillStyle = '#b02a22'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(20,10,10,.5)'; for (let i = 0; i < w; i += 32) { g.fillRect(i, 0, 12, h); g.fillRect(0, i, w, 12); } g.fillStyle = 'rgba(255,240,200,.25)'; for (let i = 16; i < w; i += 32) { g.fillRect(i, 0, 3, h); g.fillRect(0, i, w, 3); } }),
  polka: canvasTex(128, 128, (g, w, h) => { g.fillStyle = '#e8d020'; g.fillRect(0, 0, w, h); const c = ['#e02a6a', '#2a7ae0', '#30c050']; for (let i = 0; i < 26; i++) { g.fillStyle = c[i % 3]; g.beginPath(); g.arc(Math.random() * w, Math.random() * h, 6 + Math.random() * 6, 0, 7); g.fill(); } }),
  camo: canvasTex(128, 128, (g, w, h) => { g.fillStyle = '#5a6a3a'; g.fillRect(0, 0, w, h); const c = ['#3a4424', '#7a7a4a', '#2a2a1a']; for (let i = 0; i < 40; i++) { g.fillStyle = c[i % 3]; g.beginPath(); g.ellipse(Math.random() * w, Math.random() * h, 8 + Math.random() * 14, 5 + Math.random() * 8, Math.random() * 3, 0, 7); g.fill(); } }),
  bandage: canvasTex(128, 128, (g, w, h) => { g.fillStyle = '#cfc4a0'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 9) { g.fillStyle = `rgba(80,60,30,${0.15 + Math.random() * 0.2})`; g.fillRect(0, y, w, 2); g.save(); g.translate(0, y); g.rotate((Math.random() - 0.5) * 0.15); g.fillStyle = 'rgba(255,250,230,.25)'; g.fillRect(0, 2, w, 4); g.restore(); } for (let i = 0; i < 10; i++) { g.fillStyle = 'rgba(110,60,20,.3)'; g.fillRect(Math.random() * w, Math.random() * h, 14, 9); } }),
  ember: canvasTex(128, 128, (g, w, h) => { g.fillStyle = '#1a1210'; g.fillRect(0, 0, w, h); for (let i = 0; i < 40; i++) { const x = Math.random() * w, y = Math.random() * h, r = 2 + Math.random() * 6, rg = g.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, '#ffb040'); rg.addColorStop(0.5, '#c03a10'); rg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = rg; g.fillRect(x - r, y - r, r * 2, r * 2); } g.strokeStyle = 'rgba(255,90,20,.6)'; for (let i = 0; i < 12; i++) { g.beginPath(); let x = Math.random() * w, y = Math.random() * h; g.moveTo(x, y); for (let k = 0; k < 4; k++) { x += (Math.random() - 0.5) * 20; y += (Math.random() - 0.5) * 20; g.lineTo(x, y); } g.stroke(); } }),
  stripes: canvasTex(128, 128, (g, w, h) => { g.fillStyle = '#e8b81a'; g.fillRect(0, 0, w, h); g.fillStyle = '#d8d8d0'; g.fillRect(0, 70, w, 10); g.fillRect(0, 100, w, 10); g.fillStyle = 'rgba(0,0,0,.25)'; for (let i = 0; i < 300; i++) g.fillRect(Math.random() * w, Math.random() * h, 2, 2); })
};
const lookCache = new Map(), memo = (k, f) => { if (!lookCache.has(k)) lookCache.set(k, f()); return lookCache.get(k); };
const LM = (c, o = {}) => memo('m' + c + Object.entries(o).map(([k, v]) => k + (v && v.uuid ? v.uuid : v)).join(), () => new THREE.MeshLambertMaterial(Object.assign({ color: c }, o)));
const LG = { box: (w, h, d, r = 0.02) => { r = Math.min(r, Math.min(w, h, d) * 0.45); return memo(`b${w},${h},${d},${r}`, () => roundBox(w, h, d, r, 2)); }, sph: (r) => memo('s' + r, () => new THREE.SphereGeometry(r, 10, 8)), cyl: (a, b, h, s = 12) => memo(`c${a},${b},${h},${s}`, () => new THREE.CylinderGeometry(a, b, h, s)), cone: (r, h) => memo(`k${r},${h}`, () => new THREE.ConeGeometry(r, h, 14, 1, true)), torus: () => memo('t', () => new THREE.TorusGeometry(0.04, 0.008, 6, 14)) };
const addL = (parent, geo, mat, x, y, z, rx = 0, ry = 0, rz = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); parent.add(m); return m; };
const clearHat = z => { z.head.children.filter(c => c.material === hairMat).forEach(c => z.head.remove(c)); };
const LOOKS = {
  'Granjero': z => { z.mats[1].map = LT.plaid; z.mats[1].color.set(0xffffff); z.mats[2].color.set(0x2e4a7e); addL(z.torso, LG.box(0.4, 0.32, 0.05), z.mats[2], 0, -0.12, 0.13); for (const s of [-1, 1]) addL(z.torso, LG.box(0.05, 0.36, 0.03), z.mats[2], s * 0.12, 0.14, 0.14); clearHat(z); addHat(z.head, 'straw'); },
  'Payaso': z => { z.mats[1].map = LT.polka; z.mats[1].color.set(0xffffff); z.mats[2].map = LT.polka; z.mats[2].color.set(0xffffff); z.mats[0].color.set(0xe8e4dc); addL(z.head, LG.sph(0.04), LM(0xff2020), 0, -0.015, 0.16); clearHat(z); for (const s of [-1, 1]) addL(z.head, LG.sph(0.09), LM(0xe03010), s * 0.14, 0.1, -0.02); addL(z.torso, LG.sph(0.05), LM(0x2a7ae0), 0, 0.22, 0.15); },
  'Bombero': z => { z.mats[1].map = LT.stripes; z.mats[1].color.set(0xffffff); z.mats[2].color.set(0x2a2a20); clearHat(z); const h = addL(z.head, LG.sph(0.19), LM(0xc81e1e), 0, 0.09, -0.01); h.scale.set(1, 0.75, 1.15); addL(z.head, LG.cyl(0.24, 0.24, 0.02, 16), LM(0xa81616), 0, 0.05, -0.04); addL(z.torso, LG.cyl(0.07, 0.07, 0.4), LM(0xb8bcc4), 0, 0.02, -0.2); },
  'Enfermera': z => { z.mats[1].color.set(0x8ac8d8); z.mats[2].color.set(0x8ac8d8); clearHat(z); addL(z.head, LG.box(0.2, 0.07, 0.14), LM(0xf4f4f4), 0, 0.17, 0.02); addL(z.head, LG.box(0.22, 0.1, 0.03), LM(0xd8eef4), 0, -0.07, 0.15); addL(z.torso, LG.box(0.06, 0.06, 0.01), LM(0xd02020), -0.12, 0.18, 0.145); },
  'Cirujano': z => { z.mats[1].color.set(0x3a8a6a); z.mats[2].color.set(0x3a8a6a); clearHat(z); const c = addL(z.head, LG.sph(0.16), LM(0x3a8a6a), 0, 0.1, -0.01); c.scale.set(1, 0.6, 1.05); addL(z.head, LG.box(0.22, 0.1, 0.03), LM(0x6ab0e0), 0, -0.07, 0.15); for (const a of [z.armL, z.armR]) a.children[0].material = LM(0x4a7ad8); },
  'Minero': z => { z.mats[1].color.set(0x5a4a3a); z.mats[2].color.set(0x3a3a46); clearHat(z); const h = addL(z.head, LG.sph(0.18), LM(0xe8c020), 0, 0.1, -0.01); h.scale.set(1, 0.7, 1.1); const l = addL(z.head, LG.cyl(0.04, 0.04, 0.04), memo('lamp', () => new THREE.MeshBasicMaterial({ color: 0xfff4c0 })), 0, 0.14, 0.17, Math.PI / 2); const gl = new THREE.Sprite(memo('lampGlow', () => new THREE.SpriteMaterial({ map: glowTex, color: 0xfff0b0, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }))); gl.scale.set(0.5, 0.5, 1); gl.position.set(0, 0.14, 0.22); z.head.add(gl); },
  'Novia': z => { z.mats[1].color.set(0xf0ece4); z.mats[2].color.set(0xf0ece4); const sk = addL(z.body, LG.cone(0.42, 0.85), LM(0xeeeae0, { side: THREE.DoubleSide }), 0, 0.44, 0); clearHat(z); const v = addL(z.head, LG.box(0.34, 0.5, 0.02), LM(0xffffff, { transparent: true, opacity: 0.55 }), 0, -0.05, -0.16); addL(z.head, LG.cyl(0.13, 0.13, 0.03), LM(0xf4f0e0), 0, 0.16, -0.02); },
  'Vaquero': z => { z.mats[1].color.set(0x7a3a22); z.mats[2].color.set(0x3a3028); clearHat(z); addHat(z.head, 'cowboy'); addL(z.torso, LG.box(0.56, 0.36, 0.34), LM(0x8a6a3a), 0, 0.16, 0); addL(z.body, LG.box(0.46, 0.06, 0.3), LM(0x3a2414), 0, 0.82, 0); },
  'Carbonizado': z => { for (const m of z.mats) { m.map = LT.ember; m.color.set(0xffffff); m.emissive = new THREE.Color(0x401000); } clearHat(z); },
  'Ahogado': z => { z.mats[0].color.set(0x7a9ab0); z.mats[1].color.set(0x4a5a6a); z.mats[2].color.set(0x2a3440); z.torso.scale.set(1.18, 1.05, 1.25); z.head.scale.setScalar(1.12); for (let i = 0; i < 7; i++) addL(z.torso, LG.box(0.03, rand(0.15, 0.3), 0.01), LM(0x2a5a2a), rand(-0.2, 0.2), rand(-0.3, 0), 0.145); },
  'Momia': z => { for (const m of z.mats) { m.map = LT.bandage; m.color.set(0xffffff); } clearHat(z); addL(z.head, LG.box(0.3, 0.06, 0.31), LM(0xcfc4a0, { map: LT.bandage }), 0, 0.09, 0, 0, 0, 0.2); },
  'Soldado': z => { z.mats[1].map = LT.camo; z.mats[1].color.set(0xffffff); z.mats[2].map = LT.camo; z.mats[2].color.set(0xffffff); clearHat(z); addHat(z.head, 'helmet'); addL(z.torso, LG.box(0.52, 0.42, 0.33), LM(0x4a5030), 0, 0.06, 0); },
  'Motociclista': z => { z.mats[1].color.set(0x141416); z.mats[2].color.set(0x22303a); clearHat(z); const h = addL(z.head, LG.sph(0.21), LM(0x1a1a1e), 0, 0.03, 0); addL(z.head, LG.box(0.26, 0.1, 0.05), LM(0x101828, { emissive: 0x0a1830 }), 0, 0.03, 0.18); addL(z.torso, LG.box(0.12, 0.12, 0.02), LM(0xc0c0c8), 0.1, 0.2, 0.145); },
  'Oficinista': z => { z.mats[1].color.set(0xe8e8e8); z.mats[2].color.set(0x22242a); addL(z.torso, LG.box(0.06, 0.4, 0.02), LM(0xb01818), 0, 0.08, 0.145); for (const s of [-1, 1]) addL(z.head, LG.torus(), LM(0x1a1a1a), s * 0.065, 0.035, 0.15); },
  'Cajero': z => { z.mats[1].color.set(0x9a2a2a); z.mats[2].color.set(0x22303a); clearHat(z); addHat(z.head, 'cap'); addL(z.torso, LG.box(0.42, 0.5, 0.02), LM(0x2a6a3a), 0, -0.08, 0.15); addL(z.torso, LG.box(0.12, 0.05, 0.01), LM(0xf0f0f0), 0.1, 0.22, 0.16); },
  'Chef': z => { z.mats[1].color.set(0xf2f2f2); z.mats[2].color.set(0x2a2a2a); clearHat(z); addL(z.head, LG.cyl(0.15, 0.12, 0.26), LM(0xffffff), 0, 0.26, -0.01); addL(z.torso, LG.box(0.42, 0.55, 0.02), LM(0xf8f8f8), 0, -0.1, 0.15); for (let i = 0; i < 3; i++) addL(z.torso, LG.sph(0.015), LM(0x202020), 0.08, 0.2 - i * 0.1, 0.16); }
};
const MAP_LOOKS = [['Novia', 'Momia', 'Vaquero', 'Carbonizado', 'Minero'], ['Granjero', 'Vaquero', 'Payaso', 'Ahogado', 'Minero'], ['Bombero', 'Motociclista', 'Soldado', 'Payaso', 'Enfermera', 'Carbonizado'], ['Cajero', 'Chef', 'Enfermera', 'Payaso', 'Oficinista'], ['Payaso', 'Payaso', 'Vaquero', 'Chef', 'Granjero'], ['Oficinista', 'Novia', 'Momia', 'Enfermera', 'Cajero'], ['Ahogado', 'Ahogado', 'Motociclista', 'Cajero', 'Carbonizado'], ['Bombero', 'Soldado', 'Motociclista', 'Carbonizado', 'Enfermera', 'Cirujano'], ['Payaso', 'Chef', 'Cajero', 'Novia', 'Vaquero'], ['Oficinista', 'Cirujano', 'Enfermera', 'Bombero', 'Soldado', 'Motociclista'], ['Minero', 'Minero', 'Carbonizado', 'Soldado', 'Bombero'], ['Cirujano', 'Oficinista', 'Soldado', 'Enfermera', 'Cirujano'], ['Oficinista', 'Oficinista', 'Cajero', 'Momia', 'Novia'], ['Oficinista', 'Chef', 'Enfermera', 'Motociclista', 'Payaso'], ['Granjero', 'Vaquero', 'Payaso', 'Cajero', 'Chef'], ['Soldado', 'Cirujano', 'Momia', 'Carbonizado'], ['Minero', 'Soldado', 'Bombero', 'Granjero', 'Ahogado'], ['Oficinista'], ['Novia', 'Momia', 'Enfermera', 'Cirujano'], ['Ahogado', 'Ahogado', 'Vaquero', 'Cajero'], ['Granjero', 'Novia', 'Momia', 'Payaso'], ['Chef', 'Chef', 'Payaso', 'Cajero'], ['Ahogado', 'Ahogado', 'Ahogado', 'Soldado'], ['Soldado', 'Motociclista', 'Oficinista', 'Bombero'], ['Ahogado', 'Ahogado', 'Granjero', 'Novia', 'Chef'], ['Oficinista', 'Oficinista', 'Motociclista', 'Cajero', 'Enfermera'], ['Cajero', 'Novia', 'Vaquero', 'Payaso', 'Oficinista'], ['Cajero', 'Cajero', 'Chef', 'Oficinista', 'Enfermera'], ['Minero', 'Oficinista', 'Carbonizado', 'Bombero']];
/* ===== Formas de caminar: cada zombi saca una al azar (velocidad propia) ===== */
const GAITS_WALK = { clasico: 1, arrastra: 0.8, encorvado: 0.95, tambaleante: 0.9, cuellorroto: 1, espasmos: 1.06, colgando: 0.85 };
const GAITS_RUN = { sprint: 1, atras: 1.06, frenetico: 0.97 };
function pickGait(type) {
  if (type === 'runner') return pick(Object.keys(GAITS_RUN));
  if (['walker', 'copz', 'spitter', 'screamer', 'armored'].includes(type)) return pick(Object.keys(GAITS_WALK));
  return null;
}
function applyGait(z, sw, moving, dt, idle) {
  const g = z.gait, ph = z.phase, t = z.t, mv = moving ? 1 : 0.25;
  if (g === 'arrastra') {
    z.legR.rotation.x = -0.08 + sw * 0.12 * mv; z.legR.rotation.z = 0.1;
    z.body.position.y = -Math.abs(Math.sin(ph)) * 0.06 * mv; z.torsoG.rotation.z = 0.12 + Math.sin(ph) * 0.14 * mv;
    if (idle) { z.armRG.rotation.x = -0.2 + sw * 0.25; z.armRG.rotation.z = 0.15; z.armLG.rotation.x = -1.55 + Math.sin(t * 2 + z.seed) * 0.12; }
  } else if (g === 'encorvado') {
    if (idle) { z.torsoG.rotation.x = damp(z.torsoG.rotation.x, 0.6, 8, dt); z.neck.rotation.x = -0.75; z.armLG.rotation.x = -0.35 - sw * 0.55; z.armRG.rotation.x = -0.35 + sw * 0.55; }
    z.body.position.y -= 0.05;
  } else if (g === 'tambaleante') {
    z.torsoG.rotation.z = Math.sin(ph * 0.5) * 0.3 + Math.sin(t * 1.7 + z.seed) * 0.1; z.body.position.x = Math.sin(ph * 0.5) * 0.1 * mv;
    z.neck.rotation.z = Math.sin(t * 1.1 + z.seed) * 0.5;
    if (idle) { z.armLG.rotation.x = -0.9 + Math.sin(t * 1.3 + z.seed) * 0.45; z.armRG.rotation.x = -0.7 + Math.sin(t * 1.6 + z.seed * 2) * 0.45; z.armLG.rotation.z = -0.25; z.armRG.rotation.z = 0.25; }
  } else if (g === 'cuellorroto') {
    z.neck.rotation.z = 1.0 + Math.sin(ph) * 0.12 * mv; z.neck.rotation.x = 0.25;
    if (idle) { z.armRG.rotation.x = -0.12 + sw * 0.3; z.armRG.rotation.z = 0.12; z.armLG.rotation.x = -1.6 + Math.sin(t * 2 + z.seed) * 0.1; }
  } else if (g === 'espasmos') {
    z.twT = (z.twT || rand(0.4, 1.5)) - dt;
    if (z.twT <= 0) { z.twT = rand(0.35, 1.6); z.twK = 1; z.twA = rand(-0.9, 0.9); z.twB = rand(-1.2, 0.6); z.twC = rand(-0.35, 0.35); }
    if (z.twK > 0) { z.twK = Math.max(0, z.twK - dt * 6); const k = z.twK; z.neck.rotation.z += z.twA * k; z.torsoG.rotation.z += z.twC * k; if (idle) z.armRG.rotation.x += z.twB * k; }
  } else if (g === 'colgando') {
    z.neck.rotation.x = 0.4 + Math.sin(t * 0.8 + z.seed) * 0.08;
    if (idle) { z.armLG.rotation.x = -0.12 - sw * 0.28; z.armRG.rotation.x = -0.12 + sw * 0.28; z.armLG.rotation.z = -0.05; z.armRG.rotation.z = 0.05; }
  } else if (g === 'atras') {
    if (idle) { z.torsoG.rotation.x = damp(z.torsoG.rotation.x, 0.7, 10, dt); z.armLG.rotation.x = 1.0 + sw * 0.15; z.armRG.rotation.x = 1.0 - sw * 0.15; z.armLG.rotation.z = -0.2; z.armRG.rotation.z = 0.2; z.neck.rotation.x = -0.6; }
  } else if (g === 'frenetico') {
    if (idle) { z.armLG.rotation.x = -1.7 + Math.sin(t * 15 + z.seed) * 1.0; z.armRG.rotation.x = -1.7 + Math.cos(t * 13 + z.seed) * 1.0; z.armLG.rotation.z = -0.4 + Math.sin(t * 9) * 0.3; z.armRG.rotation.z = 0.4 + Math.cos(t * 11) * 0.3; z.neck.rotation.z = Math.sin(t * 9) * 0.35; }
  }
}
function buildZombie(type) {
  const d = ZDEF[type], s = d.scale;
  const skin = new THREE.MeshLambertMaterial({ color: pick(d.skin) });
  const shirt = new THREE.MeshLambertMaterial({ color: type === 'copz' ? 0x1f2c4a : type === 'armored' ? 0x2a2e36 : pick(world.shirts.length ? world.shirts : SHIRTS) });
  const pants = new THREE.MeshLambertMaterial({ color: type === 'copz' ? 0x151a25 : world.idx === 1 && Math.random() < 0.5 ? 0x2e4a6e : pick(PANTS) });
  const root = new THREE.Group(), fall = new THREE.Group(), body = new THREE.Group();
  root.add(fall); fall.add(body); body.scale.setScalar(s);
  const z = { id: zid++, type, def: d, s, root, fall, body, mats: [skin, shirt, pants], hits: [], seed: Math.random() * 100, eOn: false };
  const mk = (geo, mat, part, parent, x = 0, y = 0, zz = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, zz); m.castShadow = !IS_TOUCH || part === 'body'; m.userData = { zombie: z, part }; parent.add(m); z.hits.push(m); return m; };
  if (d.quad) {
    z.torsoG = new THREE.Group(); z.neck = new THREE.Group(); z.armLG = new THREE.Group(); z.armRG = new THREE.Group();
    z.torso = mk(ZG.dBody, skin, 'body', body, 0, 0.58, 0);
    z.headG = new THREE.Group(); z.headG.position.set(0, 0.72, 0.45); body.add(z.headG);
    z.head = mk(ZG.dHead, skin, 'head', z.headG, 0, 0, 0.14);
    for (const sx of [-1, 1]) { const e = new THREE.Mesh(ZG.eye, eyeMats[type]); e.position.set(sx * 0.07, 0.05, 0.171); z.head.add(e); const ear = new THREE.Mesh(ZG.ear, skin); ear.position.set(sx * 0.08, 0.16, -0.05); z.head.add(ear); }
    const mo = new THREE.Mesh(ZG.mouth, mouthMat); mo.position.set(0, -0.07, 0.171); z.head.add(mo);
    z.legs = [];
    for (const [x, zz] of [[-0.11, 0.3], [0.11, 0.3], [-0.11, -0.3], [0.11, -0.3]]) z.legs.push(mk(ZG.dLeg, skin, 'limb', body, x, 0.48, zz));
    z.tail = new THREE.Mesh(ZG.dTail, skin); z.tail.position.set(0, 0.68, -0.42); body.add(z.tail);
    if (Math.random() < 0.5) { const r = new THREE.Mesh(ZG.rib, ribMat); r.scale.set(0.7, 1, 1); r.position.set(0.161, 0.58, 0.05); r.rotation.y = Math.PI / 2; body.add(r); }
    return z;
  }
  if (!d.human) skin.map = zSkinTex; shirt.map = zClothTex; pants.map = zClothTex;
  if (type === 'bandit') shirt.color.setHex(pick([0x5a3a22, 0x2a2a2e, 0x6a2a1e, 0x3a4a5a]));
  const o = { skin, shirt, pants, eye: eyeMats[type], crawl: type === 'crawler', bigMouth: type === 'screamer', zombie: true };
  if (type === 'copz') o.hat = 'cop';
  else if (type === 'bandit') o.hat = 'cowboy';
  else if (world.hat && Math.random() < world.hatP && type !== 'armored' && type !== 'abom' && type !== 'boss') o.hat = world.hat;
  humanoid(z, o, mk);
  if (Math.random() < 0.4 && !d.big && !d.human) for (let i = 0; i < 3; i++) { const r = new THREE.Mesh(ZG.rib, ribMat); r.position.set(0.06, -0.05 + i * 0.07, 0.145); z.torso.add(r); }
  if (type === 'spitter') { const b = mk(ZG.belly, bellyMat, 'body', z.torso, 0, -0.08, 0.13); b.scale.set(1, 0.9, 0.8); }
  if (type === 'bandit') {
    const band = new THREE.Mesh(bx(0.24, 0.1, 0.06), new THREE.MeshLambertMaterial({ color: 0xa8281e })); band.position.set(0, -0.06, 0.13); z.head.add(band); z.mats.push(band.material);
    const g = revolverMini('paci'); g.position.set(0, -0.68, 0.03); g.scale.setScalar(1.3); g.rotation.x = Math.PI / 2; z.armRG.add(g);
  }
  if (type === 'brute') { z.torso.scale.set(1.3, 1.05, 1.25); z.armLG.position.x = -0.4; z.armRG.position.x = 0.4; z.armL.scale.set(1.4, 1.1, 1.4); z.armR.scale.set(1.4, 1.1, 1.4); }
  if (type === 'runner') z.torso.scale.set(0.88, 1, 0.9);
  if (type === 'screamer') { z.torso.scale.set(0.8, 1.08, 0.8); z.armL.scale.set(0.8, 1.3, 0.8); z.armR.scale.set(0.8, 1.3, 0.8); }
  if (type === 'bloater') {
    z.torso.scale.set(1.5, 1.1, 1.6); z.armLG.position.x = -0.42; z.armRG.position.x = 0.42;
    const b = mk(ZG.belly, skin, 'body', z.torso, 0, -0.1, 0.1); b.scale.set(1.35, 1.2, 1.3);
    for (let i = 0; i < 7; i++) { const p = new THREE.Mesh(ZG.pus, pusMat); p.position.set(rand(-0.22, 0.22), rand(-0.25, 0.25), 0.15 + rand(0, 0.05)); p.scale.setScalar(rand(0.6, 1.4)); z.torso.add(p); }
  }
  if (type === 'armored') {
    z.helmet = mk(ZG.helmet, armorMat, 'helmet', z.head, 0, 0.03, 0);
    const v = new THREE.Mesh(ZG.visor, visorMat); v.position.set(0, 0, 0.19); z.helmet.add(v);
    z.vest = mk(ZG.vest, armorMat, 'vest', z.torso, 0, 0.02, 0);
    z.helmetHp = 140;
  }
  if (type === 'copz') { const b = new THREE.Mesh(ZG.badge, badgeMat); b.position.set(-0.12, 0.15, 0.145); z.torso.add(b); }
  if (type === 'saw') {
    // gordo y pesado: panza enorme, brazos gruesos y la motosierra en las dos manos
    z.torso.scale.set(1.45, 1.08, 1.45); z.armLG.position.x = -0.36; z.armRG.position.x = 0.36; z.armL.scale.set(1.5, 1.05, 1.5); z.armR.scale.set(1.5, 1.05, 1.5);
    const b = mk(ZG.belly, skin, 'body', z.torso, 0, -0.12, 0.12); b.scale.set(1.35, 1.15, 1.2);
    const ap = new THREE.Mesh(SAWG.apron, new THREE.MeshLambertMaterial({ color: 0x8a7a5a })); ap.position.set(0, -0.1, 0.36); z.torso.add(ap); z.mats.push(ap.material);
    const w = sawModel(); w.position.set(0, -0.74, 0.06); w.scale.setScalar(1 / 1.5); z.armR.add(w); z.saw = w;
  }
  if (type === 'axer' && z.armR) { const a = axeModel(); a.position.set(0, -0.62, 0.08); a.rotation.x = -1.2; z.armR.add(a); z.handAxe = a; z.spitCd = rand(1.5, 3); }
  if (type === 'knight') {
    z.plates = [];
    const P = [[KG.chest, z.torso, 0, 0.12, 0.165], [KG.belly, z.torso, 0, -0.14, 0.16], [KG.back, z.torso, 0, 0.05, -0.165], [KG.pauldron, z.torso, -0.3, 0.26, 0], [KG.pauldron, z.torso, 0.3, 0.26, 0], [KG.helm, z.head, 0, 0.03, 0]];
    for (const [g, par, x, y, zz] of P) { const m = mk(g, knightMat, 'plate', par, x, y, zz); m.userData.plate = true; z.plates.push(m); }
    const plume = new THREE.Mesh(KG.plume, plumeMat); plume.position.set(0, 0.22, -0.05); z.plates[5].add(plume);
    const hp = z.plates[Math.floor(Math.random() * 5)];   // el corazón está detrás de una placa del cuerpo, al azar
    z.heartPlate = hp; const h = new THREE.Mesh(KG.heart, heartMat); h.position.copy(hp.position); h.position.multiplyScalar(0.82); h.visible = false; hp.parent.add(h); z.heart = h;
  }
  if (type === 'abom') {
    z.torso.scale.set(1.4, 1.15, 1.3); z.armRG.position.x = 0.42; z.armR.scale.set(1.8, 1.35, 1.8); z.armL.scale.set(1.1, 1.15, 1.1);
    for (let i = 0; i < 6; i++) { const sp = new THREE.Mesh(ZG.spike, spikeMat); sp.position.set(rand(-0.2, 0.2), rand(-0.2, 0.25), -0.15); sp.rotation.x = -1.9 + rand(-0.3, 0.3); z.torso.add(sp); }
    const h2 = new THREE.Mesh(ZG.head, skin); h2.scale.setScalar(0.7); h2.position.set(-0.3, 0.32, 0.02); h2.rotation.z = 0.5; z.torso.add(h2);
    const e2 = new THREE.Mesh(ZG.eye, eyeMats.abom); e2.position.set(0, 0.03, 0.151); h2.add(e2);
  }
  if ((type === 'walker' || type === 'runner') && !o.hat && Math.random() < 0.45) { z.look = pick(MAP_LOOKS[Math.max(0, world.idx)]); LOOKS[z.look](z); }
  return z;
}
const RV_COL = { paci: [0x3a3e46, 0x7a4a24], corto: [0x22252a, 0x2a1a10], viejo: [0x8a6a3a, 0x5a3a20], magnum: [0xd0d4dc, 0x1a1a1a], cowboy: [0x2a3040, 0xe8e0c8], uzi: [0x1a1a1e, 0x1a1a1e], mp5: [0x1c1d20, 0x18181a], ballesta: [0x9a6a3a, 0x6e3b1b], tesla: [0xb88a3a, 0x3a90ff], jackpot: [0xd09a3e, 0xece2c8], bazuca: [0x3a3c42, 0x5a6a3a], escopeta: [0x2a3a6a, 0x7a4a24], minigun: [0x4a4e56, 0x2a2a2a] };
function revolverMini(id) {
  const Md = MODELS[id] || MODELS.paci, [fc, gc] = RV_COL[id] || RV_COL.paci, g = new THREE.Group(), fm = LM(fc, { emissive: 0x141518 }), gm = LM(gc);
  const L = Math.round((Md.L * 1.1 + 0.06) * 100) / 100, r = Math.round((Md.R || 0.011) * 1400) / 1000, cr = id === 'escopeta' || id === 'minigun' ? 0.045 : 0.035;
  addL(g, LG.box(0.05, 0.06, 0.1, 0.01), fm, 0, 0.07, 0.03);
  addL(g, LG.cyl(cr, cr, 0.075, 10), fm, 0, 0.075, 0.03, Math.PI / 2);
  if (id === 'minigun') for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; addL(g, LG.cyl(0.01, 0.01, L, 6), fm, Math.round(Math.cos(a) * 25) / 1000, 0.08 + Math.round(Math.sin(a) * 25) / 1000, 0.08 + L / 2, Math.PI / 2); }
  else addL(g, LG.cyl(r, r, L, 8), fm, 0, 0.09, 0.08 + L / 2, Math.PI / 2);
  addL(g, LG.box(0.045, 0.12, 0.055, 0.012), gm, 0, 0, -0.03, 0.35);
  return g;
}
window.KIT = { buildGun, buildZombie, applyGait, pickGait, GAITS_WALK, GAITS_RUN, ZDEF, MODELS, MODEL_ORDER, GM, glowTex, flashMat, world, revolverMini, LOOKS, MAP_LOOKS, setChar: c => { game = { char: c }; } };
})();
