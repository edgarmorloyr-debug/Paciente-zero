// Paciente Cero: el decorado de la ciudad (autos chocados, fuego, humo, basura, fachadas e interiores amueblados).
// No cambia ninguna regla del juego: solo agrega cosas que se ven. Las piezas repetidas se dibujan juntas
// (InstancedMesh) para que el teléfono no se ponga lento.
window.DECO = (() => {
  'use strict';
  const T = THREE;
  const geo = {
    caja: new T.BoxGeometry(1, 1, 1), cil: new T.CylinderGeometry(0.5, 0.5, 1, 12), cil6: new T.CylinderGeometry(0.5, 0.5, 1, 6),
    esf: new T.SphereGeometry(0.5, 10, 8), cono: new T.ConeGeometry(0.5, 1, 8), plano: new T.PlaneGeometry(1, 1),
    // prisma para los techos de dos aguas: largo en z, ancho en x, alto en y (base en y = -0.5)
    techo2: (() => { const g = new T.CylinderGeometry(0.5, 0.5, 1, 3, 1); g.rotateX(Math.PI / 2); g.rotateZ(Math.PI); g.computeBoundingBox(); const b = g.boundingBox; g.translate(0, -(b.min.y + b.max.y) / 2, 0); g.scale(1 / (b.max.x - b.min.x), 1 / (b.max.y - b.min.y), 1); return g; })()
  };
  const cacheM = {};
  const lam = (c, o = {}) => { const k = 'l' + c + JSON.stringify(o); return cacheM[k] || (cacheM[k] = new T.MeshLambertMaterial({ color: c, ...o })); };
  const bas = (c, o = {}) => { const k = 'b' + c + JSON.stringify(o); return cacheM[k] || (cacheM[k] = new T.MeshBasicMaterial({ color: c, ...o })); };
  function tex(w, h, f, rep) { const c = document.createElement('canvas'); c.width = w; c.height = h; f(c.getContext('2d'), w, h); const t = new T.CanvasTexture(c); t.anisotropy = 4; if (rep) t.wrapS = t.wrapT = T.RepeatWrapping; return t; }
  const rnd = (R, a, b) => a + R() * (b - a);
  const escoger = (R, l) => l[Math.floor(R() * l.length)];

  // ---------- texturas hechas a mano (una sola vez) ----------
  const TX = {};
  function texturas() {
    if (TX.asfalto) return TX;
    TX.asfalto = tex(256, 256, (g, w, h) => {
      g.fillStyle = '#808080'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 2600; i++) { const v = 100 + Math.random() * 60 | 0; g.fillStyle = `rgba(${v},${v},${v},.35)`; g.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 1 + Math.random() * 2); }
      g.strokeStyle = 'rgba(30,30,30,.55)'; g.lineWidth = 1.5;
      for (let i = 0; i < 9; i++) { let x = Math.random() * w, y = Math.random() * h; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 7; k++) { x += (Math.random() - 0.5) * 40; y += (Math.random() - 0.5) * 40; g.lineTo(x, y); } g.stroke(); }
      for (let i = 0; i < 5; i++) { g.fillStyle = `rgba(40,40,40,${0.15 + Math.random() * 0.2})`; g.fillRect(Math.random() * w, Math.random() * h, 20 + Math.random() * 50, 14 + Math.random() * 40); }
    }, true);
    TX.acera = tex(128, 128, (g, w, h) => {
      g.fillStyle = '#b4b4ae'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 700; i++) { const v = 130 + Math.random() * 50 | 0; g.fillStyle = `rgba(${v},${v},${v - 4},.35)`; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
      g.strokeStyle = 'rgba(40,40,40,.45)'; g.lineWidth = 2; for (let i = 0; i <= w; i += 32) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, h); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(w, i); g.stroke(); }
      g.fillStyle = 'rgba(30,30,30,.25)'; for (let i = 0; i < 4; i++) { g.beginPath(); g.ellipse(Math.random() * w, Math.random() * h, 8 + Math.random() * 16, 5 + Math.random() * 10, 0, 0, 6.29); g.fill(); }
    }, true);
    TX.sangre = tex(128, 128, (g) => {
      g.fillStyle = 'rgba(90,0,0,.85)'; g.beginPath(); g.ellipse(64, 64, 34, 26, 0.4, 0, 6.29); g.fill();
      for (let i = 0; i < 16; i++) { const a = Math.random() * 6.28, d = 30 + Math.random() * 28, r = 3 + Math.random() * 8; g.beginPath(); g.arc(64 + Math.cos(a) * d, 64 + Math.sin(a) * d, r, 0, 6.29); g.fill(); }
      g.fillStyle = 'rgba(140,10,10,.5)'; g.beginPath(); g.ellipse(58, 60, 18, 12, 0.4, 0, 6.29); g.fill();
    });
    TX.mancha = tex(128, 128, (g) => { g.fillStyle = 'rgba(10,10,12,.55)'; g.beginPath(); g.ellipse(64, 64, 52, 34, 0.2, 0, 6.29); g.fill(); g.fillStyle = 'rgba(60,40,90,.25)'; g.beginPath(); g.ellipse(70, 60, 26, 14, 0.2, 0, 6.29); g.fill(); });
    TX.papel = tex(64, 64, (g) => { g.fillStyle = '#e8e2d0'; g.fillRect(8, 10, 46, 40); g.fillStyle = 'rgba(0,0,0,.25)'; for (let y = 16; y < 46; y += 6) g.fillRect(12, y, 36, 2); });
    TX.fuego = tex(64, 64, (g, w) => { const r = g.createRadialGradient(32, 36, 0, 32, 36, 30); r.addColorStop(0, 'rgba(255,240,180,1)'); r.addColorStop(0.35, 'rgba(255,150,40,.85)'); r.addColorStop(1, 'rgba(255,60,0,0)'); g.fillStyle = r; g.fillRect(0, 0, w, w); });
    TX.humo = tex(64, 64, (g, w) => { const r = g.createRadialGradient(32, 32, 0, 32, 32, 30); r.addColorStop(0, 'rgba(70,70,70,.55)'); r.addColorStop(1, 'rgba(70,70,70,0)'); g.fillStyle = r; g.fillRect(0, 0, w, w); });
    TX.toldo = {};
    TX.grafitis = ['AYUDA', 'NO ENTRAR', 'PACIENTE 0', 'ZONA INFECTADA', 'SOBREVIVIENTES →', 'NO HAY CURA', 'ELLOS VIENEN'].map((t, i) => tex(256, 96, (g, w, h) => {
      const col = ['#e03030', '#30d0ff', '#f0e040', '#ffffff', '#ff60c0'][i % 5];
      g.font = 'italic 900 44px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      let fs = 44; while (g.measureText(t).width > w - 20 && fs > 20) { fs -= 2; g.font = `italic 900 ${fs}px system-ui, sans-serif`; }
      g.lineWidth = 8; g.strokeStyle = 'rgba(0,0,0,.6)'; g.strokeText(t, w / 2, h / 2); g.fillStyle = col; g.fillText(t, w / 2, h / 2);
      for (let k = 0; k < 6; k++) { g.fillStyle = col; g.fillRect(w / 2 - 90 + Math.random() * 180, h / 2 + 18, 3, 10 + Math.random() * 18); }
    }));
    TX.piso = {
      madera: tex(128, 128, (g, w, h) => { for (let y = 0; y < h; y += 16) { g.fillStyle = `hsl(28,${35 + Math.random() * 10}%,${26 + Math.random() * 8}%)`; g.fillRect(0, y, w, 16); g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, y, w, 1); g.fillRect((y * 7) % w, y, 1, 16); } }, true),
      baldosa: tex(128, 128, (g, w, h) => { for (let y = 0; y < h; y += 32) for (let x = 0; x < w; x += 32) { const v = 170 + Math.random() * 30 | 0; g.fillStyle = `rgb(${v},${v},${v - 6})`; g.fillRect(x + 1, y + 1, 30, 30); } g.fillStyle = 'rgba(80,60,40,.25)'; for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(Math.random() * w, Math.random() * h, 6 + Math.random() * 14, 0, 6.29); g.fill(); } }, true),
      alfombra: tex(128, 128, (g, w, h) => { g.fillStyle = '#5a1420'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(230,180,60,.5)'; g.lineWidth = 3; for (let i = 0; i < w; i += 32) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 32, 32); g.lineTo(i, 64); g.lineTo(i + 32, 96); g.lineTo(i, 128); g.stroke(); } }, true),
      cemento: tex(128, 128, (g, w, h) => { g.fillStyle = '#6a6a68'; g.fillRect(0, 0, w, h); for (let i = 0; i < 900; i++) { const v = 80 + Math.random() * 40 | 0; g.fillStyle = `rgba(${v},${v},${v},.4)`; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); } }, true)
    };
    TX.pared = tex(128, 128, (g, w, h) => {
      g.fillStyle = '#fff'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 10; i++) { const x = Math.random() * w, y = Math.random() * h * 0.7, r = g.createLinearGradient(x, y, x, y + 60); r.addColorStop(0, 'rgba(60,50,30,.18)'); r.addColorStop(1, 'rgba(60,50,30,0)'); g.fillStyle = r; g.fillRect(x - 8, y, 16 + Math.random() * 20, 60); }
      g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, h - 10, w, 10);
    }, true);
    return TX;
  }
  const decalMat = {};
  const matDecal = n => decalMat[n] || (decalMat[n] = new T.MeshLambertMaterial({ map: texturas()[n], transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
  function matToldo(color) {
    if (!TX.toldo[color]) TX.toldo[color] = new T.MeshLambertMaterial({ map: tex(64, 64, (g, w, h) => { for (let x = 0; x < w; x += 16) { g.fillStyle = (x / 16) % 2 ? '#f0ece0' : color; g.fillRect(x, 0, 16, h); } }) });
    return TX.toldo[color];
  }

  // ---------- piezas repetidas, dibujadas juntas ----------
  let lotes = new Map();
  const _m = new T.Matrix4(), _q = new T.Quaternion(), _e = new T.Euler(0, 0, 0, 'YXZ'), _p = new T.Vector3(), _s = new T.Vector3();
  function pieza(g, m, x, y, z, sx = 1, sy = 1, sz = 1, ry = 0, rx = 0, rz = 0) {
    const k = g.uuid + '|' + m.uuid; let L = lotes.get(k); if (!L) lotes.set(k, L = { g, m, mats: [] });
    _e.set(rx, ry, rz); _q.setFromEuler(_e); _p.set(x, y, z); _s.set(sx, sy, sz); L.mats.push(_m.compose(_p, _q, _s).clone());
  }
  function cerrar(grupo) {
    for (const L of lotes.values()) { const im = new T.InstancedMesh(L.g, L.m, L.mats.length); L.mats.forEach((m, i) => im.setMatrixAt(i, m)); im.instanceMatrix.needsUpdate = true; grupo.add(im); }
    lotes = new Map();
  }

  // ---------- cosas que se animan: fuego, humo, luces que parpadean ----------
  let fuegos = [], humos = [], parpadeos = [], brillos = [], luzFuego = [], t = 0;
  const salaAnim = { parpadeos: [] };
  function fuego(grupo, x, y, z, tam = 1) {
    texturas(); const sp = [];
    for (let i = 0; i < 4; i++) { const s = new T.Sprite(new T.SpriteMaterial({ map: TX.fuego, blending: T.AdditiveBlending, depthWrite: false, transparent: true })); s.position.set(x + (Math.random() - 0.5) * 0.6 * tam, y + 0.3 * tam, z + (Math.random() - 0.5) * 0.6 * tam); s.scale.setScalar(1.3 * tam); grupo.add(s); sp.push(s); }
    fuegos.push({ x, y, z, tam, sp, f: Math.random() * 10 });
    for (let i = 0; i < 6; i++) { const s = new T.Sprite(new T.SpriteMaterial({ map: TX.humo, transparent: true, depthWrite: false })); grupo.add(s); humos.push({ s, x, y, z, k: i / 6 }); }
  }
  function animar(dt, noche = 0) {
    t += dt;
    for (const f of fuegos) { f.f += dt * 12; f.sp.forEach((s, i) => { const k = 0.8 + Math.sin(f.f + i * 1.7) * 0.25 + Math.random() * 0.1; s.scale.set(1.3 * f.tam * k, 1.6 * f.tam * k, 1); s.material.opacity = 0.75 + Math.sin(f.f * 1.3 + i) * 0.2; }); }
    for (const h of humos) { h.k = (h.k + dt * 0.12) % 1; h.s.position.set(h.x + Math.sin(h.k * 6 + h.x) * 1.5 * h.k, h.y + 1 + h.k * 9, h.z + h.k * 2); h.s.scale.setScalar(1.2 + h.k * 5); h.s.material.opacity = Math.sin(h.k * Math.PI) * 0.75; }
    // las 3 luces de fuego se ponen en los fuegos más cercanos a la cámara
    if (luzFuego.length && Math.floor(t * 2) !== Math.floor((t - dt) * 2)) {
      const cerca = fuegos.slice().sort((a, b) => Math.hypot(a.x - camara.position.x, a.z - camara.position.z) - Math.hypot(b.x - camara.position.x, b.z - camara.position.z));
      luzFuego.forEach((l, i) => { const f = cerca[i]; if (f) l.position.set(f.x, f.y + 1.2, f.z); l.visible = !!f && !bajoTecho; });
    }
    luzFuego.forEach((l, i) => l.intensity = (1.4 + Math.sin(t * 17 + i * 3) * 0.3 + Math.random() * 0.25) * (0.5 + noche * 0.8));
    for (const p of parpadeos.concat(salaAnim.parpadeos)) p.m.visible = p.tipo === 'policia' ? Math.sin(t * 8 + p.f) > 0 : p.tipo === 'neon' ? (Math.sin(t * 0.7 + p.f) > -0.9 || Math.random() > 0.3) : p.tipo === 'focos' ? (Math.floor(t * 4) + p.i) % 2 === 0 : (Math.random() > 0.08 || Math.sin(t * 23 + p.f) > 0.5);
    for (const b of brillos) b.m.emissiveIntensity = b.base + noche * b.noche;
  }

  // ---------- la calle ----------
  function ciudad(c, grupo, R) {
    texturas();
    const M = c.mapa, P = D.lote + D.calle, nuevos = [];
    // asfalto con textura
    grupo.traverse(o => { if (o.isMesh && o.scale.x >= c.ancho + 100 && o.geometry.type === 'PlaneGeometry') { const tx = TX.asfalto.clone(); tx.needsUpdate = true; tx.repeat.set(o.scale.x / 8, o.scale.y / 8); o.material = new T.MeshLambertMaterial({ map: tx, color: new T.Color(M.calle).multiplyScalar(1.6) }); } });
    // aceras con baldosas (las bases de los lotes miden 0,16 de alto)
    const aceraMat = {};
    grupo.traverse(o => { if (o.isMesh && !o.isInstancedMesh && Math.abs(o.scale.y - 0.16) < 0.001 && o.scale.x >= 8) { const k = o.material.color.getHexString() + '_' + Math.round(o.scale.x) + 'x' + Math.round(o.scale.z); if (!aceraMat[k]) { const t = TX.acera.clone(); t.needsUpdate = true; t.repeat.set(o.scale.x / 3, o.scale.z / 3); aceraMat[k] = new T.MeshLambertMaterial({ map: t, color: o.material.color.clone().multiplyScalar(0.8) }); } o.material = aceraMat[k]; } });
    for (let i = 0; i < 3; i++) { const l = new T.PointLight(0xff8a30, 1.2, 14, 1.6); l.visible = false; grupo.add(l); luzFuego.push(l); }
    const inicio = { x: Math.round(M.w / 2) * P + D.calle / 2, z: c.fondo - D.calle / 2 };
    const libre = (x, z, r) => Math.hypot(x - inicio.x, z - inicio.z) > 16 && !puertas.some(p => Math.hypot(p.x - x, p.z - z) < r + 3) && !solidos.concat(nuevos).some(s => x > s.x0 - r && x < s.x1 + r && z > s.z0 - r && z < s.z1 + r);
    const colores = [0x7a2a24, 0x2a4a7a, 0xb8b0a0, 0x3a3a3a, 0x5a6a3a, 0x8a6a2a, 0x2a2a2e, 0xa04020];
    // por cada tramo de calle, entre dos cruces
    const tramos = [];
    for (let i = 0; i <= M.w; i++) for (let j = 0; j < M.h; j++) tramos.push({ vert: true, x: i * P + D.calle / 2, z: D.calle + j * P + D.lote / 2 });
    for (let j = 0; j <= M.h; j++) for (let i = 0; i < M.w; i++) tramos.push({ vert: false, x: D.calle + i * P + D.lote / 2, z: j * P + D.calle / 2 });
    for (const tr of tramos) {
      // un tramo tapado por un edificio grande no lleva nada
      if (solidos.some(s => tr.x > s.x0 && tr.x < s.x1 && tr.z > s.z0 && tr.z < s.z1)) continue;
      const lado = R() < 0.5 ? -1 : 1, off = (u, v) => tr.vert ? [tr.x + v, tr.z + u] : [tr.x + u, tr.z + v];
      const r = R();
      if (r < 0.42) { // autos chocados (a veces en llamas, a veces dos)
        for (let k = 0, n = R() < 0.3 ? 2 : 1; k < n; k++) {
          const [x, z] = off(rnd(R, -4, 4) + k * 5 * (R() < 0.5 ? -1 : 1), (k ? -lado : lado) * 1.3), giro = (tr.vert ? 0 : Math.PI / 2) + rnd(R, -0.6, 0.6);
          if (libre(x, z, 2.5)) { auto(grupo, x, z, giro, colores[Math.floor(R() * colores.length)], R() < 0.25, R); nuevos.push(caja2(x, z, 2, 4.3, giro)); }
        }
      } else if (r < 0.54) { // barricada de madera y sacos
        const [x, z] = off(rnd(R, -2, 2), lado * 1.6);
        if (libre(x, z, 2)) { const giro = tr.vert ? Math.PI / 2 : 0; barricada(x, z, giro); nuevos.push(caja2(x, z, 3.2, 0.7, giro)); }
      } else if (r < 0.68) { // contenedor de basura y bolsas
        const [x, z] = off(rnd(R, -4, 4), lado * 2.3);
        if (libre(x, z, 1.5)) { const giro = tr.vert ? Math.PI / 2 : 0; pieza(geo.caja, lam(0x2a5a3a), x, 0.7, z, 2, 1.4, 1.1, giro); pieza(geo.caja, lam(0x1e3e2a), x, 1.45, z, 2.05, 0.1, 1.15, giro, 0.2); nuevos.push(caja2(x, z, 2, 1.1, giro)); bolsas(x, z, R, tr.vert); if (R() < 0.3) fuego(grupo, x, 1.5, z, 0.8); }
      }
      // cosas sueltas que no estorban: papeles, sangre, manchas, conos, barriles, cuerpos
      const n = 2 + Math.floor(R() * 4);
      for (let k = 0; k < n; k++) {
        const [x, z] = off(rnd(R, -5, 5), rnd(R, -2.6, 2.6)), q = R();
        if (q < 0.3) pieza(geo.plano, matDecal('papel'), x, 0.03, z, 0.5, 0.5, 1, R() * 6, -Math.PI / 2);
        else if (q < 0.46) pieza(geo.plano, matDecal('sangre'), x, 0.025, z, rnd(R, 1, 2.4), rnd(R, 1, 2.4), 1, R() * 6, -Math.PI / 2);
        else if (q < 0.58) pieza(geo.plano, matDecal('mancha'), x, 0.022, z, rnd(R, 1.5, 3), rnd(R, 1, 2), 1, R() * 6, -Math.PI / 2);
        else if (q < 0.68) pieza(geo.cono, lam(0xff6a10), x, R() < 0.3 ? 0.18 : 0.35, z, 0.36, 0.7, 0.36, 0, 0, R() < 0.3 ? Math.PI / 2 : 0);
        else if (q < 0.78 && libre(x, z, 0.6)) { const quema = R() < 0.35; pieza(geo.cil, lam(quema ? 0x3a2a20 : escoger(R, [0x2a4a8a, 0x8a2a20, 0x4a5a2a])), x, 0.5, z, 0.6, 1, 0.6); nuevos.push({ x0: x - 0.35, x1: x + 0.35, z0: z - 0.35, z1: z + 0.35 }); if (quema) fuego(grupo, x, 1, z, 0.6); }
        else if (q < 0.88) cuerpo(x, z, R);
        else if (q < 0.95) { pieza(geo.caja, lam(0x6a6058), x, 0.15, z, rnd(R, 0.3, 0.8), 0.3, rnd(R, 0.3, 0.7), R() * 6); pieza(geo.caja, lam(0x5a5048), x + 0.4, 0.1, z + 0.2, 0.4, 0.2, 0.3, R() * 6); }
      }
      if (R() < 0.18) { const [x, z] = off(rnd(R, -3, 3), 0); pieza(geo.cil, lam(0x2a2a2a), x, 0.02, z, 1, 0.03, 1); }
    }
    // árboles en las aceras de algunos edificios
    for (const l of c.lotes) if (R() < 0.35 && !['raro', 'jefe'].includes(l.ed.cat)) {
      const lado = Math.floor(R() * 4); if (lado === l.puerta) continue;
      const [dx, dz] = [[0, 1], [0, -1], [1, 0], [-1, 0]][lado];
      const x = l.cx + dx * (l.ancho / 2 - 0.5) + (dz ? rnd(R, -l.ancho / 3, l.ancho / 3) : 0), z = l.cz + dz * (l.fondo / 2 - 0.5) + (dx ? rnd(R, -l.fondo / 3, l.fondo / 3) : 0);
      const h = rnd(R, 3, 5), seco = R() < 0.4;
      pieza(geo.cil6, lam(0x3a2a1a), x, h / 2, z, 0.3, h, 0.3);
      if (!seco) pieza(geo.esf, lam(escoger(R, [0x2e5a2a, 0x3a6a2a, 0x4a5a22])), x, h + 0.6, z, 2.6, 2.2, 2.6);
      else for (let k = 0; k < 3; k++) pieza(geo.cil6, lam(0x3a2a1a), x, h - 0.4, z, 0.1, 1.8, 0.1, R() * 6, 0.7);
    }
    // cosas en las veredas: bancas, hidrantes, buzones, basureros, cabinas de teléfono y señales
    for (const l of c.lotes) for (let lado = 0; lado < 4; lado++) {
      if (R() > 0.55) continue;
      const [dx, dz] = [[0, 1], [0, -1], [1, 0], [-1, 0]][lado], largo = dx ? l.fondo : l.ancho, giro = Math.atan2(dx, dz);
      const u = rnd(R, -largo / 2 + 1.5, largo / 2 - 1.5), x = l.cx + dx * (l.ancho / 2 - 0.55) + (dz ? u : 0), z = l.cz + dz * (l.fondo / 2 - 0.55) + (dx ? u : 0);
      if (puertas.some(p => Math.hypot(p.x - x, p.z - z) < 3)) continue;
      const q = R();
      if (q < 0.22) { pieza(geo.caja, lam(0x5a3a22), x, 0.45, z, 1.8, 0.08, 0.5, giro); pieza(geo.caja, lam(0x5a3a22), x - dx * 0.22, 0.75, z - dz * 0.22, 1.8, 0.5, 0.06, giro); for (const s of [-0.8, 0.8]) pieza(geo.caja, lam(0x2a2a2a), x + (dz ? s : 0), 0.22, z + (dx ? s : 0), 0.08, 0.45, 0.45, giro); }
      else if (q < 0.38) { pieza(geo.cil, lam(0xc02020), x, 0.38, z, 0.32, 0.76, 0.32); pieza(geo.esf, lam(0xc02020), x, 0.8, z, 0.3, 0.25, 0.3); pieza(geo.cil, lam(0xc02020), x, 0.5, z, 0.12, 0.14, 0.5, 0, Math.PI / 2); }
      else if (q < 0.52) { pieza(geo.caja, lam(0x2a4a8a), x, 0.65, z, 0.55, 0.9, 0.5, giro); pieza(geo.caja, lam(0x2a2a2a), x, 0.1, z, 0.1, 0.2, 0.1); }
      else if (q < 0.68) { pieza(geo.cil, lam(0x3a4a3a), x, 0.5, z, 0.6, 1, 0.6); if (R() < 0.5) bolsas(x, z, R, !!dx); }
      else if (q < 0.78) { pieza(geo.caja, lam(0x9a2a2a), x, 1.2, z, 1, 2.4, 1, giro); pieza(geo.caja, lam(0x6a8aa0, { transparent: true, opacity: 0.5 }), x + dx * 0.51, 1.3, z + dz * 0.51, 0.8, 1.6, 0.02, giro); solidos.push({ x0: x - 0.5, x1: x + 0.5, z0: z - 0.5, z1: z + 0.5 }); }
      else if (q < 0.9) { pieza(geo.caja, lam(0x5a5a5a), x, 1.3, z, 0.08, 2.6, 0.08); pieza(geo.caja, lam(R() < 0.5 ? 0xd02020 : 0x2a6a3a), x, 2.4, z, 0.7, 0.7, 0.04, giro, 0, Math.PI / 4); }
      else { pieza(geo.caja, lam(0x2a6a9a), x, 0.55, z, 0.5, 1.1, 0.45, giro); }
    }
    // postes de madera con cables a lo largo de algunas calles
    for (let i = 0; i <= M.w; i++) if (R() < 0.45) for (let j = 0; j <= M.h; j++) {
      const x = i * P + D.calle - 0.4, z = j * P + D.calle / 2 + D.lote * 0.5; if (z > c.fondo - 1) continue;
      pieza(geo.cil6, lam(0x4a3a2a), x, 4, z, 0.22, 8, 0.22); pieza(geo.caja, lam(0x4a3a2a), x, 7.4, z, 0.12, 0.12, 1.6);
      if (j < M.h) for (const o of [-0.6, 0, 0.6]) { const z2 = z + P / 2; pieza(geo.caja, bas(0x111111), x, 7.25 - 0.4, z2, 0.025, 0.025, P, 0); }
    }
    // humo saliendo de algunos techos (incendios lejanos)
    for (const l of c.lotes) if (R() < 0.14 && l.pisos >= 1) { const x = l.cx + rnd(R, -2, 2), z = l.cz + rnd(R, -2, 2), y = l.alto + 0.5; fuego(grupo, x, y, z, 1.6); }
    // faroles que fallan
    for (let i = 0; i <= M.w; i++) for (let j = 0; j <= M.h; j++) if (R() < 0.18) { const m = new T.Mesh(geo.caja, bas(0xfff0c0)); m.position.set(i * P + 1.1, 5.2, j * P + 1.1); m.scale.set(0.74, 0.28, 0.74); grupo.add(m); parpadeos.push({ m, tipo: 'falla', f: R() * 9 }); }
    cerrar(grupo);
    for (const s of nuevos) solidos.push(s);
  }
  // caja de choque alineada a los ejes que cubre una pieza girada
  function caja2(x, z, w, d, giro) { const c = Math.abs(Math.cos(giro)), s = Math.abs(Math.sin(giro)), hw = (w * c + d * s) / 2, hd = (w * s + d * c) / 2; return { x0: x - hw, x1: x + hw, z0: z - hd, z1: z + hd }; }
  function auto(grupo, x, z, giro, color, quema, R) {
    const col = quema ? 0x2a2420 : color, c = Math.cos(giro), s = Math.sin(giro), en = (u, v) => [x + c * u + s * v, z - s * u + c * v];
    pieza(geo.caja, lam(col), x, 0.62, z, 1.9, 0.75, 4.3, giro);
    let [cx, cz] = en(0, -0.25); pieza(geo.caja, lam(quema ? 0x1a1a1a : 0x1c2a34), cx, 1.25, cz, 1.7, 0.6, 2.2, giro);
    [cx, cz] = en(0, 1.4); pieza(geo.caja, lam(col), cx, 1.05, cz, 1.85, 0.08, 1.4, giro, -0.2);
    for (const [u, v] of [[-0.95, 1.4], [0.95, 1.4], [-0.95, -1.4], [0.95, -1.4]]) { const [wx, wz] = en(u, v); pieza(geo.cil, lam(0x141414), wx, 0.36, wz, 0.7, 0.28, 0.7, giro, 0, Math.PI / 2); }
    if (!quema) for (const u of [-0.6, 0.6]) { const [lx, lz] = en(u, 2.16); pieza(geo.caja, bas(0xfff0c8), lx, 0.7, lz, 0.32, 0.16, 0.04, giro); const [rx, rz] = en(u, -2.16); pieza(geo.caja, bas(0x8a1010), rx, 0.75, rz, 0.32, 0.14, 0.04, giro); }
    if (R() < 0.5) { const [px, pz] = en(1.25, 0.6); pieza(geo.caja, lam(col), px, 0.95, pz, 0.08, 0.6, 1.1, giro + 0.6); }
    pieza(geo.plano, matDecal('mancha'), x, 0.021, z, 3, 5, 1, giro, -Math.PI / 2);
    if (quema) fuego(grupo, x, 1.2, z, 1.4);
  }
  function barricada(x, z, giro) {
    const c = Math.cos(giro), s = Math.sin(giro);
    for (let i = -1; i <= 1; i++) pieza(geo.caja, lam(0xb8a070), x + c * i * 0.95, 0.35, z - s * i * 0.95, 0.9, 0.7, 0.6, giro + i * 0.1);
    for (let i = -1; i <= 1; i += 2) pieza(geo.caja, lam(0x8a6a3a), x + c * i * 1.2, 0.9, z - s * i * 1.2, 0.12, 1.8, 0.12, giro, 0, i * 0.3);
    pieza(geo.caja, lam(0xd8c040), x, 1.2, z, 3.2, 0.25, 0.08, giro);
  }
  function bolsas(x, z, R, vert) { for (let i = 0; i < 3 + Math.floor(R() * 3); i++) { const a = rnd(R, -1.6, 1.6), b = rnd(R, 0.8, 1.5) * (R() < 0.5 ? -1 : 1); pieza(geo.esf, lam(escoger(R, [0x161616, 0x1e2a1e, 0x2a2a3a])), x + (vert ? b * 0 + a * 0 + b : a), 0.28, z + (vert ? a : b), rnd(R, 0.6, 0.9), 0.55, rnd(R, 0.6, 0.9)); } }
  function cuerpo(x, z, R) {
    const g = R() * 6, c = Math.cos(g), s = Math.sin(g), ropa = escoger(R, [0x3a2a22, 0x2a3a4a, 0x4a3a2a, 0x5a2a26]);
    pieza(geo.caja, lam(ropa), x, 0.14, z, 0.45, 0.24, 0.7, g);
    pieza(geo.esf, lam(0x7d8f69), x + s * 0.55, 0.14, z + c * 0.55, 0.3, 0.26, 0.32, g);
    for (const u of [-0.14, 0.14]) pieza(geo.caja, lam(0x2a2723), x - s * 0.7 + c * u, 0.1, z - c * 0.7 - s * u, 0.16, 0.16, 0.75, g + u);
    for (const u of [-0.32, 0.32]) pieza(geo.caja, lam(0x7d8f69), x + c * u, 0.1, z - s * u + 0.1, 0.12, 0.12, 0.6, g + u * 2);
    pieza(geo.plano, matDecal('sangre'), x, 0.024, z, 1.6, 1.6, 1, g, -Math.PI / 2);
  }

  // ---------- fachadas: cada tipo de edificio con su cara ----------
  const CASAS = ['casa', 'medico', 'cazador', 'mansion', 'coleccionista'];
  const VIDRIERA = ['kiosco', 'cafeteria', 'restaurante', 'lavanderia', 'super', 'farmacia', 'delivery', 'armeria', 'ferreteria', 'mercado', 'herrero', 'casino', 'galeria', 'bolera', 'garra', 'tresenraya', 'oficina'];
  function fachada(o) {
    const { g, l, e, cat, bw, bd, alto, dx, dz, giro, fx, fz, R } = o;
    texturas();
    const tx = Math.cos(giro), tz = -Math.sin(giro), W = Math.abs(tx) * bw / 2 + Math.abs(tz) * bd / 2;
    const en = (u, y, out = 0) => [fx + tx * u + dx * out, y, fz + tz * u + dz * out];
    const caja_ = (u, y, out, w, h, d, m, rz = 0) => { const [x, yy, z] = en(u, y, out); pieza(geo.caja, m, x, yy, z, w, h, d, giro, 0, rz); };
    const malla = (m, u, y, out, sx, sy, sz, gm = geo.caja) => { const [x, yy, z] = en(u, y, out); const mm = new T.Mesh(gm, m); mm.position.set(x, yy, z); mm.rotation.y = giro; mm.scale.set(sx, sy, sz); g.add(mm); return mm; };
    // grafiti y sangre en la pared (a veces)
    if (R() < 0.4 && W > 3.5) { const k = Math.floor(R() * TX.grafitis.length), u = (R() < 0.5 ? -1 : 1) * rnd(R, 2, W - 1.4); malla(new T.MeshLambertMaterial({ map: TX.grafitis[k], transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1 }), u, rnd(R, 0.9, 1.6), 0.05, 2.6, 1, 1, geo.plano); }
    if (R() < 0.3) { const [x, y, z] = en(rnd(R, -W + 1, W - 1), 0.9, 0.04); pieza(geo.plano, matDecal('sangre'), x, y, z, 1.2, 1.6, 1, giro); }
    // vidrieras con luz por dentro a cada lado de la puerta
    if (VIDRIERA.includes(e.id) && W > 2.8) {
      const ancho = Math.min(W - 2.2, 4.5);
      for (const sgn of [-1, 1]) {
        const u = sgn * (1.6 + ancho / 2);
        const m = new T.MeshLambertMaterial({ color: 0x1a2630, emissive: e.cat === 'minijuego' ? 0xa050c0 : 0xffd8a0, emissiveIntensity: 0.05, polygonOffset: true, polygonOffsetFactor: -1 });
        malla(m, u, 1.45, 0.04, ancho, 1.9, 1, geo.plano); brillos.push({ m, base: 0.05, noche: 0.75 });
        caja_(u, 0.45, 0.08, ancho + 0.2, 0.12, 0.16, lam(0x2a2a2a)); caja_(u, 2.45, 0.08, ancho + 0.2, 0.12, 0.16, lam(0x2a2a2a));
        if (R() < 0.3) for (let i = 0; i < 3; i++) caja_(u + rnd(R, -ancho / 4, ancho / 4), rnd(R, 0.9, 2.1), 0.12, ancho * 0.85, 0.18, 0.05, lam(0x8a6a40), rnd(R, -0.3, 0.3));
        if (e.cat !== 'minijuego' && R() < 0.8) { const [ax, ay, az] = en(u, 2.95, 0.7); pieza(geo.caja, matToldo(escoger(R, ['#c0502a', '#2a7a4a', '#2a4a8a', '#8a2a2a'])), ax, ay, az, ancho + 0.3, 0.12, 1.4, giro, 0.35); }
      }
    } else if (W > 2 && !CASAS.includes(e.id)) {
      for (let i = 0; i < 3; i++) if (R() < 0.4) caja_(rnd(R, -W + 1, W - 1), rnd(R, 1, Math.max(1.2, alto - 1.2)), 0.06, rnd(R, 1, 1.8), 0.16, 0.05, lam(0x7a5a34), rnd(R, -0.3, 0.3));
    }
    // marco de neón alrededor del letrero en tiendas y minijuegos
    if (e.cat === 'tienda' || e.cat === 'minijuego') {
      const anchoCartel = Math.min((dx ? bd : bw) * 0.8, 7), y = 3 + anchoCartel / 8, h = anchoCartel / 4, m = bas(new T.Color(cat.letrero).getHex());
      for (const [u, yy, w, hh] of [[0, y + h / 2 + 0.06, anchoCartel + 0.2, 0.08], [0, y - h / 2 - 0.06, anchoCartel + 0.2, 0.08], [-anchoCartel / 2 - 0.06, y, 0.08, h + 0.2], [anchoCartel / 2 + 0.06, y, 0.08, h + 0.2]]) { const mm = malla(m, u, yy, 0.09, w, hh, 0.05); if (R() < 0.15) parpadeos.push({ m: mm, tipo: 'neon', f: R() * 9 }); }
    }
    // techo de dos aguas, porche y cerca en las casas
    if (CASAS.includes(e.id)) {
      const ancho = dx ? bd : bw, fondo = dx ? bw : bd, hT = Math.min(2.6, ancho * 0.3);
      const m = new T.Mesh(geo.techo2, lam(escoger(R, [0x6a2a20, 0x3a3030, 0x4a3a2a, 0x2a3a4a]))); m.position.set(l.cx, alto + 0.56 + hT / 2, l.cz); m.rotation.y = giro; m.scale.set(ancho + 0.8, hT, fondo + 0.8); g.add(m);
      const pw = Math.min(ancho - 1, 5);
      caja_(0, 2.75, 1.2, pw, 0.15, 2.4, lam(0x5a4030));
      for (const u of [-1, 1]) caja_(u * pw / 2.2, 1.35, 2.2, 0.18, 2.7, 0.18, lam(0xd8d0c0));
      for (let u = -W; u <= W; u += 0.55) if (Math.abs(u) > 1.5) caja_(u, 0.45, 2.9, 0.1, 0.9, 0.06, lam(R() < 0.12 ? 0x5a4a3a : 0xd8d0c0), R() < 0.1 ? 0.4 : 0);
      caja_(-W + 0.2, 0.75, 2.9, 0.05, 0.06, 0.06, lam(0xd8d0c0));
    }
    // azotea: aires acondicionados, tanque de agua y antena
    if (l.pisos >= 2 && !CASAS.includes(e.id)) {
      for (let i = 0, n = 1 + Math.floor(R() * 3); i < n; i++) pieza(geo.caja, lam(0x9a9c9e), l.cx + rnd(R, -bw / 3, bw / 3), alto + 0.95, l.cz + rnd(R, -bd / 3, bd / 3), 1.2, 0.8, 1.2, R() * 0.4);
      if (R() < 0.5) { const x = l.cx + rnd(R, -bw / 4, bw / 4), z = l.cz + rnd(R, -bd / 4, bd / 4); pieza(geo.cil, lam(0x5a4030), x, alto + 2.4, z, 2, 2, 2); for (const [a, b] of [[-0.7, -0.7], [0.7, -0.7], [-0.7, 0.7], [0.7, 0.7]]) pieza(geo.caja, lam(0x2a2a2a), x + a, alto + 1.0, z + b, 0.1, 1.2, 0.1); }
      if (R() < 0.4) pieza(geo.caja, lam(0x3a3a3a), l.cx + rnd(R, -bw / 3, bw / 3), alto + 2, l.cz + rnd(R, -bd / 3, bd / 3), 0.06, 3, 0.06);
    }
    // escalera de incendios en un costado
    if (l.pisos >= 2 && ['apartamentos', 'oficina', 'escuela'].includes(e.id)) {
      const sx = tx, sz = tz, Ws = Math.abs(sz) * bw / 2 + Math.abs(sx) * bd / 2, lado = Math.abs(sx) * bw / 2 + Math.abs(sz) * bd / 2;
      const cx = l.cx + sx * (lado + 0.6), cz = l.cz + sz * (lado + 0.6), gy = giro + Math.PI / 2;
      for (let p = 1; p < l.pisos; p++) {
        pieza(geo.caja, lam(0x2a2a2a), cx, p * D.altoPiso, cz, Math.min(3, Ws * 1.4), 0.08, 1.1, gy);
        pieza(geo.caja, lam(0x2a2a2a), cx + sx * 0.5, p * D.altoPiso + 0.55, cz + sz * 0.5, Math.min(3, Ws * 1.4), 0.05, 0.05, gy);
        pieza(geo.caja, lam(0x2a2a2a), cx, p * D.altoPiso - D.altoPiso / 2, cz, 0.6, D.altoPiso * 1.1, 0.08, gy, 0, 0.55);
      }
    }
    // detalles propios de cada lugar
    const techo = alto + 0.56;
    if (e.id === 'hospital' || e.id === 'farmacia' || e.id === 'medico') {
      const col = e.id === 'farmacia' ? 0x30e060 : 0xff3030, m = bas(col), u = W > 3 ? W * 0.55 : 0, y = e.id === 'hospital' ? techo + 1.4 : Math.min(alto - 0.6, 2.9);
      for (const [w, h] of [[1.4, 0.45], [0.45, 1.4]]) { const c = malla(m, u, y, 0.25, w, h, 0.15); if (e.id === 'farmacia') parpadeos.push({ m: c, tipo: 'neon', f: 0 }); }
    }
    if (e.id === 'laboratorio') { const mm = malla(bas(0xf0d020), 0, alto - 0.8, 0.12, 1.6, 1.6, 0.1); mm.rotation.z = Math.PI / 4; for (let i = 0; i < 2; i++) pieza(geo.cil, lam(0xd0d0c8), l.cx + rnd(R, -bw / 3, bw / 3), techo + 1.5, l.cz + rnd(R, -bd / 3, bd / 3), 0.9, 3, 0.9); }
    if (e.id === 'comisaria') { for (const [u, col] of [[-0.5, 0xff2020], [0.5, 0x2060ff]]) { const mm = malla(bas(col), u, techo + 0.25, -1, 0.9, 0.3, 0.5); parpadeos.push({ m: mm, tipo: 'policia', f: u > 0 ? Math.PI : 0 }); } const [x, , z] = en(Math.min(W - 1, 3), 0, 3.6); auto(g, x, z, giro + Math.PI / 2, 0xe8e8e8, false, R); }
    if (e.id === 'bomberos') { const u = W > 4 ? -W / 2 : 0, ww = Math.min(W, 5); caja_(u, 1.7, 0.06, ww, 3.2, 0.1, lam(0xb02020)); for (let i = 0; i < 5; i++) caja_(u, 0.5 + i * 0.6, 0.12, ww - 0.2, 0.05, 0.05, lam(0x701010)); }
    if (e.id === 'casino' || e.id === 'bolera' || e.id === 'arena') for (let u = -W + 0.5, i = 0; u <= W - 0.5; u += 0.7, i++) { const mm = malla(bas(0xffe080), u, alto - 0.3, 0.12, 0.2, 0.2, 0.2, geo.esf); parpadeos.push({ m: mm, tipo: 'focos', i }); }
    if (e.id === 'armeria') { const rv = KIT.revolverMini('magnum'), [x, y, z] = en(0, alto + 1.2, 0.2); rv.position.set(x, y, z); rv.rotation.y = giro + Math.PI / 2; rv.scale.setScalar(5); g.add(rv); }
    if (e.id === 'delivery') { const [x, , z] = en(-(W + 2), 0, 2.8); auto(g, x, z, giro, 0xe0a020, false, R); }
    if (e.cat === 'jefe' || e.cat === 'minijefe') for (let i = 0; i < 4; i++) { const [x, , z] = en(rnd(R, -W, W), 0, rnd(R, 0.6, 2.4)); pieza(geo.plano, matDecal('sangre'), x, 0.17, z, rnd(R, 1, 2), rnd(R, 1, 2), 1, R() * 6, -Math.PI / 2); }
  }
  // al empezar a construir una ciudad nueva
  function empezar() { fuegos = []; humos = []; parpadeos = []; brillos = []; luzFuego = []; lotes = new Map(); }
  function salirSala() { salaAnim.parpadeos = []; }

  // ---------- por dentro: muebles según el lugar ----------
  function sala(o) {
    texturas(); salaAnim.parpadeos = [];
    const { grupo, e, x0, z0, ancho, fondo, R, mueble, libre, pisoMesh, paredes } = o;
    const cat = e.cat, cx = x0 + ancho / 2;
    const tipoPiso = cat === 'minijuego' ? 'alfombra' : cat === 'tienda' || ['farmacia', 'hospital', 'laboratorio', 'medico', 'banos', 'lavanderia', 'super'].includes(e.id) ? 'baldosa' : ['raro', 'minijefe'].includes(cat) || ['garaje', 'estacionamiento'].includes(e.id) ? 'cemento' : 'madera';
    if (pisoMesh) { const t = TX.piso[tipoPiso].clone(); t.needsUpdate = true; t.repeat.set(ancho / 3, fondo / 3); pisoMesh.material = new T.MeshLambertMaterial({ map: t }); }
    if (paredes) for (const p of paredes) { const t = TX.pared.clone(); t.needsUpdate = true; t.repeat.set(Math.max(p.scale.x, p.scale.z) / 4, 1); p.material = new T.MeshLambertMaterial({ map: t, color: p.material.color }); }
    for (let i = 0; i < Math.max(1, Math.floor(ancho * fondo / 120)); i++) { const m = new T.Mesh(geo.caja, bas(0xfff2d0)); m.position.set(x0 + 2 + R() * (ancho - 4), 3.5, z0 + 2 + R() * (fondo - 4)); m.scale.set(1.2, 0.08, 0.4); grupo.add(m); if (R() < 0.3) salaAnim.parpadeos.push({ m, tipo: 'falla', f: R() * 9 }); }
    const estante = (x, z, w, gy, colores) => { mueble(x, z, gy ? 0.6 : w, gy ? w : 0.6, 2.2, 0x4a3a2a); for (let n = 0; n < 3; n++) for (let k = 0; k < Math.floor(w / 0.4); k++) { const u = -w / 2 + 0.2 + k * 0.4; pieza(geo.caja, lam(escoger(R, colores)), x + (gy ? 0 : u), 0.55 + n * 0.65, z + (gy ? u : 0), gy ? 0.65 : 0.3, 0.38, gy ? 0.3 : 0.65); } };
    if (cat === 'tienda') {
      const cols = { farmacia: [0xe8e8e8, 0x40c060, 0x4080e0, 0xe04040], armeria: [0x3a3a3a, 0x6a4a2a], delivery: [0xc8a060, 0xb08850, 0xd8b070], ferreteria: [0xd0a020, 0x8a2a2a, 0x4a4a4a], mercado: [0x6a2a8a, 0x2a2a2a], herrero: [0x3a3a3a] }[e.id] || [0x8a8a8a];
      for (let x = x0 + 1.8; x < x0 + ancho - 1.8; x += 3.2) estante(x, z0 + 0.6, 2.6, 0, cols);
      for (let z = z0 + 6.5; z < z0 + fondo - 3.5; z += 3.2) { estante(x0 + 0.6, z, 2.6, 1, cols); estante(x0 + ancho - 0.6, z, 2.6, 1, cols); }
      if (e.id === 'armeria') for (let i = 0; i < 6; i++) { const rv = KIT.revolverMini(escoger(R, KIT.MODEL_ORDER)); rv.position.set(x0 + 1.0, 1.3 + (i % 2) * 0.6, z0 + 6 + Math.floor(i / 2) * 1.2); rv.rotation.y = Math.PI / 2; rv.scale.setScalar(1.5); grupo.add(rv); }
      if (e.id === 'delivery') for (let i = 0; i < 8; i++) { const p = libre(1.5); mueble(p.x, p.z, 1, 1, 0.8 + Math.floor(R() * 2) * 0.8, 0xc8a060); }
    } else if (cat === 'minijuego') {
      for (let x = x0 + 1.2; x < x0 + ancho - 1.2; x += 1.6) { if (Math.abs(x - cx) < 4) continue; mueble(x, z0 + 0.6, 1, 0.9, 1.9, 0x2a1a3a); const m = new T.Mesh(geo.plano, bas(escoger(R, [0x40e0ff, 0xff40c0, 0xffe040]))); m.position.set(x, 1.4, z0 + 1.06); m.scale.set(0.7, 0.5, 1); grupo.add(m); salaAnim.parpadeos.push({ m, tipo: 'neon', f: R() * 9 }); }
      for (let i = 0; i < 2; i++) { const p = libre(2.5); mueble(p.x, p.z, 2.2, 2.2, 0.9, 0x1e5a2a); }
    } else if (cat === 'jefe' || e.id === 'medico') {
      const lab = e.id === 'laboratorio';
      for (let i = 0; i < Math.floor(ancho * fondo / 50); i++) {
        const p = libre(2);
        if (lab) { mueble(p.x, p.z, 2, 0.9, 0.95, 0xd8d8d0); for (let k = 0; k < 4; k++) { const m = new T.Mesh(geo.cil, bas(escoger(R, [0x40ff60, 0x40c0ff, 0xff40c0]), { transparent: true, opacity: 0.8 })); m.position.set(p.x - 0.7 + k * 0.45, 1.15, p.z); m.scale.set(0.16, 0.35, 0.16); grupo.add(m); } }
        else { mueble(p.x, p.z, 1, 2.1, 0.7, 0xe8e8f0); pieza(geo.caja, lam(0xb8c8d8), p.x, 0.78, p.z - 0.8, 0.9, 0.12, 0.4); pieza(geo.plano, matDecal('sangre'), p.x, 0.715, p.z, 0.8, 0.9, 1, R() * 6, -Math.PI / 2); }
      }
      if (lab) for (let i = 0; i < 2; i++) { const p = libre(2); mueble(p.x, p.z, 1.8, 1.6, 0.1, 0x3a3a3a); for (let k = 0; k < 8; k++) pieza(geo.cil, lam(0x5a5a5a), p.x - 0.8 + (k % 4) * 0.53, 1.1, p.z + (k < 4 ? -0.75 : 0.75), 0.05, 2.2, 0.05); }
    } else if (cat === 'minijefe') {
      if (e.id === 'gimnasio') for (let i = 0; i < 5; i++) { const p = libre(2); mueble(p.x, p.z, 0.5, 1.8, 0.5, 0x2a2a2a); pieza(geo.cil, lam(0x5a5a5a), p.x, 1.1, p.z, 0.05, 1.8, 0.05, 0, 0, Math.PI / 2); for (const s of [-1, 1]) pieza(geo.cil, lam(0x1a1a1a), p.x + s * 0.8, 1.1, p.z, 0.45, 0.12, 0.45, 0, 0, Math.PI / 2); }
      else if (e.id === 'comisaria') { for (let i = 0; i < 3; i++) { const p = libre(2); mueble(p.x, p.z, 1.6, 0.8, 0.8, 0x5a4a3a); } for (let k = 0; k < 10; k++) pieza(geo.cil, lam(0x5a5a5a), x0 + 1 + k * 0.4, 1.4, z0 + 2.2, 0.06, 2.8, 0.06); }
      else auto(grupo, cx, z0 + fondo - 6, Math.PI / 2, 0xb02020, false, R);
    } else if (cat === 'raro') {
      for (let x = x0 + 1.8; x < x0 + ancho - 1.8; x += 3.2) estante(x, z0 + 0.8, 2.6, 0, [0x5a4a2a, 0x3a4a2a, 0x6a6a6a]);
    } else {
      const muebles = [
        p => { mueble(p.x, p.z, 1.6, 0.9, 0.8, 0x6a4a2a); for (const s of [-1, 1]) pieza(geo.caja, lam(0x5a3a22), p.x + s * 0.4, 0.45, p.z + s * 0.75, 0.45, 0.9, 0.45, R() * 0.8); },
        p => { mueble(p.x, p.z, 2.2, 0.9, 0.85, escoger(R, [0x6a2a2a, 0x2a4a6a, 0x4a5a3a])); pieza(geo.caja, lam(0x3a2a2a), p.x, 1.0, p.z - 0.35, 2.2, 0.6, 0.2); },
        p => { mueble(p.x, p.z, 1.6, 2.1, 0.6, 0xe0d8c8); pieza(geo.caja, lam(0xf0f0f0), p.x, 0.7, p.z - 0.8, 1.2, 0.15, 0.4); },
        p => estante(p.x, p.z, 2, R() < 0.5 ? 1 : 0, [0x8a2a2a, 0x2a4a8a, 0xb08850, 0x2a6a3a]),
        p => mueble(p.x, p.z, 0.8, 0.7, 1.9, 0xd8d8d8)
      ];
      for (let i = 0; i < Math.floor(ancho * fondo / 22); i++) escoger(R, muebles)(libre(1.6));
      // cuadros en las paredes y una alfombra
      for (let i = 0; i < 3; i++) pieza(geo.caja, lam(escoger(R, [0x6a4a2a, 0x2a3a5a, 0x5a2a2a])), x0 + 1.5 + R() * (ancho - 3), 2, z0 + 0.05, 0.9, 0.7, 0.05);
      pieza(geo.plano, lam(escoger(R, [0x5a2a2a, 0x2a3a5a, 0x4a3a22])), cx, 0.015, z0 + fondo / 2, ancho * 0.4, fondo * 0.3, 1, 0, -Math.PI / 2);
    }
    for (let i = 0; i < Math.floor(ancho * fondo / 25); i++) { const x = x0 + 1 + R() * (ancho - 2), z = z0 + 1 + R() * (fondo - 2), q = R(); if (q < 0.4) pieza(geo.plano, matDecal('papel'), x, 0.02, z, 0.45, 0.45, 1, R() * 6, -Math.PI / 2); else if (q < 0.65 && cat !== 'tienda') pieza(geo.plano, matDecal('sangre'), x, 0.02, z, rnd(R, 0.8, 1.8), rnd(R, 0.8, 1.8), 1, R() * 6, -Math.PI / 2); else if (q < 0.85) pieza(geo.caja, lam(0x5a5048), x, 0.08, z, rnd(R, 0.2, 0.5), 0.16, rnd(R, 0.2, 0.4), R() * 6); }
    cerrar(grupo);
  }

  return { empezar, ciudad, fachada, sala, salirSala, animar, fuego, get cuentaFuegos() { return fuegos.length; } };
})();
