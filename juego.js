// Paciente Cero: la jugabilidad. Armas y zombis de Seis Balas (kit.js), edificios por dentro,
// infección y vacunas, tiendas, minijuegos, pistas, los tres Pacientes Cero y los 3 niveles.
// Todas las cifras salen de datos.js (DATOS.juego).
window.JUEGO = (() => {
  'use strict';
  const JG = D.juego, KI = window.KIT, MODELS = KI.MODELS, ZDEF = KI.ZDEF;
  const rnd = (a, b) => a + Math.random() * (b - a), escoger = l => l[Math.floor(Math.random() * l.length)];
  const limitar = (v, a, b) => v < a ? a : v > b ? b : v;
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

  // ================= sonido (archivos de Seis Balas) =================
  const Snd = (() => {
    let ctx = null, master = null; const buf = {};
    const lista = ['shot_sheriff.wav', 'shot_sheriff_2.wav', 'shot_johnny.wav', 'shot_johnny_2.wav', 'shot_velorio.wav', 'shot_velorio_2.wav', 'shot_francois.wav', 'shot_francois_2.wav', 'shot_lilith.wav', 'shot_lilith_2.wav',
      'rl_open.wav', 'rl_close.wav', 'rl_in0.wav', 'rl_in1.wav', 'step_concrete0.mp3', 'step_concrete1.mp3', 'step_concrete2.mp3', 'zom_enemy0.mp3', 'zom_enemy1.mp3', 'zom_enemy2.mp3', 'zom_enemy3.mp3', 'zom_enemy4.mp3',
      'zom_ghoul0.mp3', 'zom_ghoul1.mp3', 'zom_ghoul2.mp3', 'zom_ghoul3.mp3', 'zom_ghoul4.mp3', 'zom_ghoul5.mp3', 'door_open.mp3', 'door_close.mp3', 'coins.mp3', 'jingle_buy.mp3', 'jingle_boss.mp3', 'jingle_item.mp3',
      'error.mp3', 'confirm.mp3', 'metalClick.mp3', 'metalLatch.mp3', 'fall0.mp3', 'fall1.mp3', 'fall2.mp3', 'clang0.mp3', 'clang1.mp3', 'chips.mp3', 'dice.mp3'];
    function iniciar() {
      if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
      master = ctx.createGain(); master.gain.value = 0.8; master.connect(ctx.destination);
      for (const n of lista) fetch('snd/' + n).then(r => r.arrayBuffer()).then(a => new Promise((ok, mal) => ctx.decodeAudioData(a, ok, mal))).then(b => { buf[n] = b; }).catch(() => {});
    }
    function tocar(n, vol = 1, ritmo = 1, x = null, z = null) {
      if (!ctx || !buf[n]) return;
      let v = vol, lado = 0;
      if (x !== null) { const dx = x - J.x, dz = z - J.z, d = Math.hypot(dx, dz); v *= Math.max(0, 1 - d / 40); if (v < 0.02) return; lado = limitar((dx * Math.cos(J.giro) - dz * Math.sin(J.giro)) / Math.max(d, 1), -0.8, 0.8); }
      const s = ctx.createBufferSource(); s.buffer = buf[n]; s.playbackRate.value = ritmo;
      const g = ctx.createGain(); g.gain.value = v; s.connect(g);
      if (ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = lado; g.connect(p); p.connect(master); } else g.connect(master);
      s.start();
    }
    return { iniciar, tocar, uno: (base, n, ext, ...a) => tocar(base + Math.floor(Math.random() * n) + ext, ...a) };
  })();
  const SONIDO_ARMA = { paci: 'shot_sheriff', corto: 'shot_johnny', viejo: 'shot_velorio', magnum: 'shot_francois', cowboy: 'shot_francois', uzi: 'shot_lilith', mp5: 'shot_lilith', minigun: 'shot_lilith', tesla: 'shot_johnny', jackpot: 'shot_sheriff', ballesta: 'shot_johnny', bazuca: 'shot_velorio' };

  // ================= estado del jugador =================
  let P = null;
  const nuevoArma = id => ({ id, nivel: 1, mej: {}, tambor: MODELS[id].cap });
  function jugadorNuevo(per) {
    const pj = JG.personajes[per], J0 = JG.jugador;
    return { per, vida: J0.vida, estamina: J0.estamina, infeccion: 0, dinero: J0.dineroInicial, balas: J0.balasIniciales + (pj.balasExtra || 0),
      armas: [nuevoArma(pj.arma)], armaI: 0, bolsillo: ['basica'], vac: [], poderes: [], nivel: 1, pistas: 0, pacientes: 0,
      explorados: 0, muertes: 0, habilidad: 0, revivio: false, llave: false, llaveLote: -1, tNivel: 0, lotes: {}, guarida: -1, pistaCentro: null, vencido: false };
  }
  const per = () => JG.personajes[P.per];
  // multiplicadores: personaje, vacunas activas y poderes
  function mult(k) {
    let m = 1; const pj = per();
    if (k === 'dano' && pj.dano) m *= pj.dano;
    if (k === 'estaminaMax' && pj.estamina) m *= pj.estamina;
    if (k === 'infeccionSola' && pj.infeccionSola) m *= pj.infeccionSola;
    for (const v of P.vac) { const e = v.efecto || {}; if (e[k] != null) m *= e[k]; }
    for (const p of P.poderes) { const e = p.efecto || {}; if (e[k] != null) m *= e[k]; }
    return m;
  }
  const vidaMax = () => JG.jugador.vida + P.vac.reduce((s, v) => s + ((v.efecto || {}).vidaMax || 0), 0);
  const estaminaMax = () => JG.jugador.estamina * mult('estaminaMax');
  const inmune = () => P.vac.some(v => (v.efecto || {}).inmune);
  const etapa = () => JG.infeccion.etapas.filter(e => P.infeccion >= e.desde).pop() || {};
  const arma = () => P.armas[P.armaI];
  const amb_ = k => efectos()[k] || 1;

  // ================= arma en la mano (modelos de Seis Balas) =================
  const manos = [];
  const raizArma = new THREE.Group(); camara.add(raizArma);
  const luzArma = new THREE.PointLight(0xffe0bc, 0.8, 1.2, 2); luzArma.position.set(0.05, 0.08, -0.15); camara.add(luzArma);
  function crearMano(lado) {
    const root = new THREE.Group(), k = new THREE.Group(); root.add(k); raizArma.add(root);
    if (lado) root.scale.x = -1;
    const flash = new THREE.Group();
    { const a = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.22), KI.flashMat); flash.add(a); const b = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.32), KI.flashMat); b.rotation.y = Math.PI / 2; b.position.z = -0.12; flash.add(b); }
    flash.visible = false;
    const flashLight = new THREE.PointLight(0xffc27a, 0, 12, 1.8);
    return { lado, root, k, flash, flashLight, patada: 0, fl: 0 };
  }
  function armarVista() {
    for (const h of manos) raizArma.remove(h.root); manos.length = 0;
    if (!P) return;
    const id = arma().id, dos = per().dosManos && id === per().arma;
    for (let i = 0; i < (dos ? 2 : 1); i++) {
      const h = crearMano(i); h.skin629 = P.per === 'carlos' && id === 'cowboy';
      KI.buildGun(h, id); manos.push(h);
      h.root.position.set(i ? -0.13 : 0.13, -0.135, -0.33);
    }
  }
  let cd = 0, recarga = 0, gatillo = false, manoSig = 0, cadaPaso = 0;

  // ================= zombis =================
  const zs = [];
  let zid = 1;
  const zonaActual = () => dentro ? dentro.idx : -1;
  function crearZombi(tipo, x, z, op = {}) {
    const k = KI.buildZombie(tipo), d = ZDEF[tipo], n = P.nivel - 1, esc = op.escala || 1;
    if (op.look && KI.LOOKS[op.look]) try { KI.LOOKS[op.look](k); } catch (e) { /* algunos disfraces piden piezas que este modelo no tiene */ }
    k.root.scale.setScalar(esc);
    k.root.position.set(x, 0, z); escena.add(k.root);
    const vel = (op.velocidad || rnd(d.speed[0], d.speed[1])) * (op.jefe ? 1 : amb_('zombiVelocidad'));
    const zo = { id: zid++, k, tipo, d, x, z, yaw: Math.random() * 6.28, zona: op.zona != null ? op.zona : -1,
      vida: op.vida || d.hp * JG.zombis.vidaPorNivel[n], dano: op.dano || d.dmg * JG.zombis.danoPorNivel[n], vel, esc: (d.scale || 1) * esc,
      estado: op.duerme ? 'duerme' : op.persigue ? 'persigue' : 'vaga', fase: Math.random() * 6, t: 0, atk: 0, cdAtk: 0.5, golpe: 0,
      escupe: tipo === 'spitter' || !!op.escupe, cdEsc: rnd(2, 4), jefe: op.jefe || null, nombre: op.nombre, muerto: false, caida: 0,
      rumbo: Math.random() * 6.28, cambioRumbo: rnd(2, 5), gru: rnd(2, 8), flash: 0, atascado: 0 };
    zo.vidaMax = zo.vida;
    k.phase = zo.fase; k.t = 0; k.gait = KI.pickGait(tipo);
    zs.push(zo); return zo;
  }
  function quitarZombi(zo) { escena.remove(zo.k.root); const i = zs.indexOf(zo); if (i >= 0) zs.splice(i, 1); }
  // esferas de golpe: cabeza, cuerpo y piernas
  function zonasGolpe(zo) {
    const s = zo.esc, y = zo.tipo === 'crawler' ? 0.45 : 1;
    if (zo.d.quad) return [{ c: V3(zo.x + Math.sin(zo.yaw) * 0.55 * s, 0.75 * s, zo.z + Math.cos(zo.yaw) * 0.55 * s), r: 0.2 * s, cabeza: true }, { c: V3(zo.x, 0.6 * s, zo.z), r: 0.42 * s }];
    return [{ c: V3(zo.x, 1.62 * s * y, zo.z), r: 0.2 * s, cabeza: true }, { c: V3(zo.x, 1.12 * s * y, zo.z), r: 0.37 * s }, { c: V3(zo.x, 0.48 * s * y, zo.z), r: 0.3 * s }];
  }
  function alertar(x, z, radio) { for (const zo of zs) if (!zo.muerto && zo.zona === zonaActual() && Math.hypot(zo.x - x, zo.z - z) < radio && zo.estado !== 'persigue') { zo.estado = 'persigue'; zo.gru = 0; } }
  function chocaEn(x, z, r) {
    const L = limites || { x0: 0, x1: ciudad.ancho, z0: 0, z1: ciudad.fondo };
    if (x < L.x0 + r || z < L.z0 + r || x > L.x1 - r || z > L.z1 - r) return true;
    for (const s of solidos) if (x > s.x0 - r && x < s.x1 + r && z > s.z0 - r && z < s.z1 + r) return true;
    return false;
  }
  function moverZombi(zo, dx, dz) {
    const r = 0.35 * zo.esc;
    if (!chocaEn(zo.x + dx, zo.z, r)) zo.x += dx; else zo.atascado++;
    if (!chocaEn(zo.x, zo.z + dz, r)) zo.z += dz; else zo.atascado++;
  }
  function animarZombi(zo, dt, mueve, ataca) {
    const k = zo.k; zo.t += dt; k.t = zo.t;
    zo.fase += dt * (mueve ? 2.2 + zo.vel * 1.4 : 0.6); k.phase = zo.fase;
    const sw = Math.sin(zo.fase);
    if (k.legs) k.legs.forEach((l, i) => l.rotation.x = Math.sin(zo.fase + (i % 2 ? Math.PI : 0) + (i > 1 ? 1 : 0)) * (mueve ? 0.7 : 0.05));
    else if (k.legL && zo.tipo !== 'crawler') { k.legL.rotation.x = sw * (mueve ? 0.55 : 0.05); k.legR.rotation.x = -sw * (mueve ? 0.55 : 0.05); }
    if (k.armLG && !k.legs) {
      const brazo = ataca ? -2.4 + zo.golpe * 1.8 : -1.35;
      k.armLG.rotation.x = brazo + Math.sin(zo.fase * 0.5) * 0.12; k.armRG.rotation.x = brazo - Math.sin(zo.fase * 0.5 + 1) * 0.12;
    }
    if (k.jaw) k.jaw.rotation.x = 0.3 + Math.abs(Math.sin(zo.t * 3)) * 0.25;
    if (k.gait && k.armLG && !k.legs) try { KI.applyGait(k, sw, mueve, dt, !ataca); } catch (e) { k.gait = null; }
    k.root.position.set(zo.x, k.root.position.y, zo.z); k.root.rotation.y = zo.yaw;
    if (zo.flash > 0) { zo.flash -= dt; for (const m of k.mats) if (m.emissive) m.emissive.setHex(zo.flash > 0 ? 0x661010 : 0x000000); }
  }
  function actualizarZombis(dt) {
    const lento = ojo > 0 ? JG.jugador.habilidad.lentitud : 1, zona = zonaActual(), dtz = dt * lento;
    const notan = JG.zombis.notan * amb_('deteccion') * (etapa().deteccion || 1);
    for (const zo of zs.slice()) {
      if (zo.muerto) {
        zo.caida += dt; const k = zo.k;
        if (k.legs) k.fall.rotation.z = Math.min(1.5, zo.caida * 4); else k.fall.rotation.x = -Math.min(1.5, zo.caida * 4);
        if (zo.caida > 3) k.root.position.y = -(zo.caida - 3) * 0.6;
        if (zo.caida > 5) quitarZombi(zo);
        continue;
      }
      if (zo.zona !== zona) continue;
      const dx = J.x - zo.x, dz = J.z - zo.z, dist = Math.hypot(dx, dz);
      let mueve = false, ataca = false;
      zo.gru -= dt; if (zo.gru <= 0 && dist < 25) { zo.gru = rnd(4, 10); const fuerte = zo.d.big || zo.jefe; Snd.uno(fuerte ? 'zom_enemy' : 'zom_ghoul', fuerte ? 5 : 6, '.mp3', 0.5, rnd(0.9, 1.1), zo.x, zo.z); }
      if (zo.estado === 'duerme') { if (dist < 3 || (dist < 9 && corriendo)) zo.estado = 'persigue'; animarZombi(zo, dt, false, false); continue; }
      if (zo.estado === 'vaga') {
        if (dist < notan) zo.estado = 'persigue';
        zo.cambioRumbo -= dt; if (zo.cambioRumbo <= 0 || zo.atascado > 4) { zo.rumbo = Math.random() * 6.28; zo.cambioRumbo = rnd(3, 7); zo.atascado = 0; }
        const v = zo.vel * 0.35 * dtz; moverZombi(zo, Math.sin(zo.rumbo) * v, Math.cos(zo.rumbo) * v); zo.yaw = zo.rumbo; mueve = true;
      }
      if (zo.estado === 'persigue') {
        zo.yaw = Math.atan2(dx, dz);
        const alcance = (zo.d.reach || 1.25) * (zo.jefe ? Math.max(1, zo.esc * 0.75) : 1) + 0.35;
        if (zo.jefe) jefeIA(zo, dt, dist);
        if (zo.escupe && dist > 4 && dist < 15) { zo.cdEsc -= dtz; if (zo.cdEsc <= 0) { zo.cdEsc = rnd(2.5, 4); proyectil(zo, zo.tipoProy || (zo.jefe ? 'fuego' : 'acido')); } }
        if (dist > alcance) {
          let v = zo.vel * dtz; if (zo.carga > 0) { zo.carga -= dt; v *= 3.2; }
          let ang = zo.yaw; if (zo.atascado > 6) { ang += (zo.id % 2 ? 1 : -1) * 1.2; if (zo.atascado > 40) zo.atascado = 0; }
          const ax = zo.x, az = zo.z; moverZombi(zo, Math.sin(ang) * v, Math.cos(ang) * v);
          if (Math.hypot(zo.x - ax, zo.z - az) > v * 0.7) zo.atascado = Math.max(0, zo.atascado - 1);
          mueve = true;
        } else {
          ataca = true; zo.cdAtk -= dtz;
          if (zo.atk <= 0 && zo.cdAtk <= 0) { zo.atk = 0.45; zo.cdAtk = zo.jefe ? 1.1 : 1.3; }
        }
        if (zo.atk > 0) {
          ataca = true; zo.atk -= dtz; zo.golpe = 1 - zo.atk / 0.45;
          if (zo.atk <= 0 && dist <= alcance + 0.3) golpearJugador(zo.dano * amb_('zombiDano'), JG.zombis.fuertes.includes(zo.tipo) || zo.jefe ? JG.infeccion.golpeFuerte : JG.infeccion.golpe);
        }
      }
      // separarse de los demás zombis
      for (const o of zs) if (o !== zo && !o.muerto && o.zona === zo.zona) {
        const ex = zo.x - o.x, ez = zo.z - o.z, ed = Math.hypot(ex, ez), min = 0.35 * (zo.esc + o.esc);
        if (ed < min && ed > 0.001) { const f = (min - ed) * 0.5; if (!chocaEn(zo.x + ex / ed * f, zo.z + ez / ed * f, 0.3)) { zo.x += ex / ed * f; zo.z += ez / ed * f; } }
      }
      animarZombi(zo, dtz, mueve, ataca);
    }
  }
  function danarZombi(zo, dano) {
    if (zo.muerto) return;
    zo.vida -= dano; zo.flash = 0.08; if (zo.estado !== 'persigue') zo.estado = 'persigue';
    if (zo.vida <= 0) matarZombi(zo);
  }
  function matarZombi(zo) {
    zo.muerto = true; zo.caida = 0; P.muertes++;
    Snd.uno('fall', 3, '.mp3', 0.6, 1, zo.x, zo.z);
    if (ojo <= 0) P.habilidad = Math.min(1, P.habilidad + 1 / JG.jugador.habilidad.muertesParaCargar);
    if (zo.jefe) return jefeVencido(zo);
    if (zo.bolo) return;
    const premios = amb_('premios');
    if (Math.random() < JG.zombis.soltarDinero) soltar('dinero', zo.x, zo.z, Math.round(rnd(...JG.dinero.zombi) * amb_('dinero') * premios));
    if (Math.random() < JG.zombis.soltarBalas) soltar('balas', zo.x + 0.4, zo.z, 6);
    if (dentro) {
      if (dentro.trampa && !zs.some(o => !o.muerto && o.zona === dentro.idx)) { dentro.trampa = false; avisar('La puerta se abrió'); }
      estadoLote(dentro.idx).vivos = zs.filter(o => !o.muerto && o.zona === dentro.idx && !o.jefe && !o.escolta).length;
    }
  }

  // ================= proyectiles (ácido, jeringas, fuego, rocas) =================
  const proys = [];
  const geoProy = new THREE.SphereGeometry(0.14, 8, 6);
  const matProy = { acido: new THREE.MeshBasicMaterial({ color: 0xa6ff4a }), jeringa: new THREE.MeshBasicMaterial({ color: 0x8ae0ff }), fuego: new THREE.MeshBasicMaterial({ color: 0xff7a20 }), roca: new THREE.MeshLambertMaterial({ color: 0x6a6058 }) };
  function proyectil(zo, tipo) {
    const m = new THREE.Mesh(geoProy, matProy[tipo]); if (tipo === 'roca') m.scale.setScalar(2.2);
    const y = 1.4 * zo.esc, d = Math.hypot(J.x - zo.x, J.z - zo.z) || 1, v = tipo === 'roca' ? 13 : 16;
    m.position.set(zo.x, y, zo.z); escena.add(m);
    proys.push({ m, vx: (J.x - zo.x) / d * v, vz: (J.z - zo.z) / d * v, vy: (D.jugador.alto - y) / d * v, t: 0, zona: zo.zona,
      dano: { acido: 6, jeringa: 6, fuego: 10, roca: 20 }[tipo], inf: { acido: JG.infeccion.escupitajo, jeringa: 6, fuego: 0, roca: 0 }[tipo] });
  }
  function actualizarProys(dt) {
    for (const p of proys.slice()) {
      p.t += dt; p.m.position.x += p.vx * dt; p.m.position.y += p.vy * dt; p.m.position.z += p.vz * dt;
      const x = p.m.position.x, z = p.m.position.z;
      const fin_ = () => { escena.remove(p.m); proys.splice(proys.indexOf(p), 1); };
      if (p.zona !== zonaActual() || p.t > 3 || chocaEn(x, z, 0.05)) { fin_(); continue; }
      if (Math.hypot(x - J.x, z - J.z) < 0.7) { golpearJugador(p.dano, p.inf); fin_(); }
    }
  }

  // ================= el jugador recibe daño e infección =================
  let rojo = 0;
  function golpearJugador(dano, inf) {
    if (!P || estado === 'fin') return;
    P.vida -= dano; rojo = 1; Snd.uno('clang', 2, '.mp3', 0.5, rnd(0.7, 0.9));
    if (inf && !inmune()) P.infeccion = Math.min(100, P.infeccion + inf * amb_('infeccionGolpe'));
    if (P.vida <= 0) {
      if (per().revivir && !P.revivio) { P.revivio = true; P.vida = vidaMax() * per().revivir; avisar('Don Velorio se levanta otra vez'); return; }
      fin('muerto');
    } else if (P.infeccion >= 100) fin('convertido');
  }

  // ================= disparar =================
  const _dir = new THREE.Vector3(), _o = new THREE.Vector3();
  const trazos = [];
  const matTrazo = new THREE.MeshBasicMaterial({ color: 0xffe0a0, transparent: true, opacity: 0.7 });
  function trazo(a, b) {
    const d = b.clone().sub(a), l = d.length(); if (l < 0.05) return;
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 1, 4), matTrazo);
    m.position.copy(a).addScaledVector(d, 0.5); m.scale.y = l; m.quaternion.setFromUnitVectors(V3(0, 1, 0), d.normalize()); escena.add(m); trazos.push({ m, t: 0.06 });
  }
  // distancia hasta la pared más cercana en la dirección del disparo
  function distanciaPared(o, d) {
    let mejor = 200;
    const L = limites; if (L) for (const [p, v, a, b] of [[o.x, d.x, L.x0, L.x1], [o.z, d.z, L.z0, L.z1]]) { if (Math.abs(v) > 1e-6) { const t = ((v > 0 ? b : a) - p) / v; if (t > 0) mejor = Math.min(mejor, t); } }
    for (const s of solidos) {
      let t0 = 0, t1 = mejor, ok = true;
      for (const [p, v, a, b] of [[o.x, d.x, s.x0, s.x1], [o.z, d.z, s.z0, s.z1]]) {
        if (Math.abs(v) < 1e-6) { if (p < a || p > b) ok = false; continue; }
        let ta = (a - p) / v, tb = (b - p) / v; if (ta > tb) [ta, tb] = [tb, ta];
        t0 = Math.max(t0, ta); t1 = Math.min(t1, tb);
      }
      if (ok && t0 <= t1 && t0 > 0) {
        // los muebles bajos no tapan un disparo que pasa por encima
        const y = o.y + d.y * t0; if (s.alto && y > s.alto) continue;
        mejor = Math.min(mejor, t0);
      }
    }
    return mejor;
  }
  const objetivos = []; // cajas, vitrinas y blancos: { c, r, golpe() }
  function disparar() {
    if (!P || cd > 0 || recarga > 0 || estado !== 'jugar') return;
    const a = arma(), m = MODELS[a.id];
    if (a.tambor <= 0) {
      if (P.balas > 0) empezarRecarga();
      else { Snd.tocar('metalClick.mp3', 0.6); if (!disparar.av) { disparar.av = 1; avisar('Sin balas: busca Apocalipsis Delivery o zombis que suelten balas'); setTimeout(() => disparar.av = 0, 4000); } }
      return;
    }
    a.tambor--; Snd.iniciar();
    const dos = manos.length === 2;
    cd = m.cd * (dos ? 0.62 : 1);
    const h = manos[dos ? manoSig++ % 2 : 0];
    h.patada = Math.min(1, h.patada + 0.5 * (m.recoil || 1)); h.fl = 0.05; h.flash.visible = true; h.flashLight.intensity = 3;
    J.cabeceo = Math.min(1.2, J.cabeceo + 0.01 * (m.recoil || 1));
    const son = SONIDO_ARMA[a.id] || 'shot_sheriff';
    Snd.tocar(son + (Math.random() < 0.5 ? '.wav' : '_2.wav'), 0.75, a.id === 'cowboy' && P.per === 'carlos' ? 0.88 : rnd(0.96, 1.04));
    const dispersa = 0.012 * (m.spread || 1) * (a.mej.mira ? JG.tiendas.ferreteria.mejoras.mira.valor : 1) * (corriendo ? 1.7 : 1);
    camara.getWorldDirection(_dir); _dir.x += rnd(-dispersa, dispersa); _dir.y += rnd(-dispersa, dispersa); _dir.z += rnd(-dispersa, dispersa); _dir.normalize();
    camara.getWorldPosition(_o);
    alertar(J.x, J.z, JG.zombis.ruidoDisparo * amb_('ruidoDisparo'));
    if (dentro && dentro.boveda) { dentro.disparos = (dentro.disparos || 0) + 1; if (dentro.disparos % 3 === 0) llegaZombiPuerta(); }
    const pared = distanciaPared(_o, _dir);
    const dano = m.dmg * mult('dano') * (1 + (a.nivel - 1) * JG.tiendas.herrero.danoNivel) * (a.mej.dano ? JG.tiendas.ferreteria.mejoras.dano.valor : 1);
    const imp = [];
    for (const zo of zs) if (!zo.muerto && zo.zona === zonaActual()) for (const g of zonasGolpe(zo)) {
      const oc = g.c.clone().sub(_o), t = oc.dot(_dir); if (t < 0 || t > pared) continue;
      if (oc.lengthSq() - t * t < g.r * g.r) imp.push({ t, zo, cabeza: g.cabeza });
    }
    for (const ob of objetivos) { const oc = ob.c.clone().sub(_o), t = oc.dot(_dir); if (t > 0 && t < pared + 0.5 && oc.lengthSq() - t * t < ob.r * ob.r) imp.push({ t, ob }); }
    imp.sort((x, y) => x.t - y.t);
    let atraviesa = (m.pierce || 0) + 1, fin_ = pared; const vistos = new Set();
    for (const i of imp) {
      if (atraviesa <= 0) break;
      if (i.ob) { i.ob.golpe(); fin_ = i.t; break; }
      if (vistos.has(i.zo)) continue; vistos.add(i.zo);
      const golpe = dano * (i.cabeza ? 2 : 1) * (a.id === 'corto' && i.t < 6 ? 1.6 : 1);
      danarZombi(i.zo, golpe); fin_ = i.t; atraviesa--;
      if (i.cabeza && !i.zo.muerto) flotante('¡A la cabeza!');
      if (m.boom) explosion(_o.clone().addScaledVector(_dir, i.t), m.boom, m.boomDmg);
      if (m.chain) cadena(i.zo, m.chain, golpe * 0.6);
    }
    if (m.boom && !imp.length) explosion(_o.clone().addScaledVector(_dir, Math.min(pared, 40)), m.boom, m.boomDmg);
    const boca = new THREE.Vector3(); h.flash.getWorldPosition(boca);
    trazo(boca, _o.clone().addScaledVector(_dir, Math.min(fin_, 60)));
    if (m.jackpot && Math.random() < 1 / 50) { P.dinero += 20; avisar('Jackpot: +20 $'); Snd.tocar('coins.mp3'); }
  }
  function explosion(c, radio, dano) {
    for (const zo of zs) if (!zo.muerto && zo.zona === zonaActual()) { const d = Math.hypot(zo.x - c.x, zo.z - c.z); if (d < radio) danarZombi(zo, dano * (1 - d / radio * 0.6)); }
    if (Math.hypot(J.x - c.x, J.z - c.z) < radio * 0.6) golpearJugador(20, 0);
    const m = new THREE.Mesh(new THREE.SphereGeometry(radio * 0.5, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffa040, transparent: true, opacity: 0.7 })); m.position.copy(c); escena.add(m); trazos.push({ m, t: 0.25, crece: true });
    Snd.tocar('shot_velorio.wav', 1, 0.6);
  }
  function cadena(desde, n, dano) {
    let ult = desde; const usados = new Set([desde]);
    for (let i = 0; i < n; i++) {
      const sig = zs.filter(z => !z.muerto && !usados.has(z) && z.zona === zonaActual()).sort((a, b) => Math.hypot(a.x - ult.x, a.z - ult.z) - Math.hypot(b.x - ult.x, b.z - ult.z))[0];
      if (!sig || Math.hypot(sig.x - ult.x, sig.z - ult.z) > 6) break;
      trazo(V3(ult.x, 1.2, ult.z), V3(sig.x, 1.2, sig.z)); danarZombi(sig, dano); usados.add(sig); ult = sig;
    }
  }
  function empezarRecarga() {
    const a = arma(), m = MODELS[a.id];
    if (recarga > 0 || a.tambor >= m.cap || P.balas <= 0) return;
    recarga = JG.jugador.recargaBase / (m.reload || 1) / mult('recarga') / (a.mej.recarga ? JG.tiendas.ferreteria.mejoras.recarga.valor : 1);
    Snd.tocar('rl_open.wav', 0.6);
  }
  function terminarRecarga() { const a = arma(), t = Math.min(MODELS[a.id].cap - a.tambor, P.balas); a.tambor += t; P.balas -= t; Snd.tocar('rl_close.wav', 0.6); }
  function cambiarArma(i) {
    if (P.armas.length < 2) return;
    P.armaI = i == null ? (P.armaI + 1) % P.armas.length : limitar(i, 0, P.armas.length - 1); recarga = 0; armarVista(); Snd.tocar('metalLatch.mp3', 0.5);
  }

  // ================= cosas que se recogen =================
  const recogibles = [];
  const geoRec = { dinero: new THREE.CylinderGeometry(0.16, 0.16, 0.05, 12), balas: new THREE.BoxGeometry(0.3, 0.2, 0.22), vacuna: new THREE.CylinderGeometry(0.07, 0.07, 0.34, 8), comida: new THREE.BoxGeometry(0.3, 0.22, 0.3), mejora: new THREE.BoxGeometry(0.42, 0.22, 0.24), llave: new THREE.TorusGeometry(0.12, 0.03, 6, 12), radio: new THREE.BoxGeometry(0.34, 0.22, 0.14) };
  const matRec = { dinero: new THREE.MeshBasicMaterial({ color: 0xffd040 }), balas: new THREE.MeshLambertMaterial({ color: 0xc8a040, emissive: 0x302008 }), comida: new THREE.MeshLambertMaterial({ color: 0x60c060, emissive: 0x103010 }), mejora: new THREE.MeshLambertMaterial({ color: 0xc04020, emissive: 0x300800 }), llave: new THREE.MeshBasicMaterial({ color: 0xffe080 }), radio: new THREE.MeshLambertMaterial({ color: 0x404850, emissive: 0x081018 }) };
  function soltar(tipo, x, z, valor, extra = {}) {
    let m;
    if (tipo === 'arma') { m = KI.revolverMini(valor); m.scale.setScalar(1.6); }
    else m = new THREE.Mesh(geoRec[tipo] || geoRec.balas, tipo === 'vacuna' ? new THREE.MeshBasicMaterial({ color: JG.vacunas[valor].color }) : matRec[tipo] || matRec.balas);
    m.position.set(x, 0.45, z); escena.add(m);
    const r = { tipo, valor, x, z, m, zona: extra.zona != null ? extra.zona : zonaActual(), id: extra.id, t: Math.random() * 6 };
    recogibles.push(r); return r;
  }
  function recoger(r) {
    if (r.tipo === 'vacuna' && P.bolsillo.length >= JG.jugador.bolsillo) { if (!recoger.av) { avisar('Bolsillo lleno: usa una vacuna (V o tócala)'); recoger.av = 1; setTimeout(() => recoger.av = 0, 3000); } return; }
    const nombre = { dinero: `+${r.valor} $`, balas: `+${r.valor} balas`, comida: `+${r.valor} de vida`, vacuna: JG.vacunas[r.valor] && JG.vacunas[r.valor].nombre, llave: 'Llave del búnker' }[r.tipo];
    if (r.tipo === 'dinero') { P.dinero += r.valor; Snd.tocar('coins.mp3', 0.5); }
    else if (r.tipo === 'balas') { P.balas += r.valor; Snd.tocar('rl_in0.wav', 0.6); }
    else if (r.tipo === 'comida') { P.vida = Math.min(vidaMax(), P.vida + r.valor); Snd.tocar('confirm.mp3', 0.5); }
    else if (r.tipo === 'vacuna') { P.bolsillo.push(r.valor); Snd.tocar('jingle_item.mp3', 0.5); }
    else if (r.tipo === 'arma') darArma(r.valor);
    else if (r.tipo === 'mejora') darMejora();
    else if (r.tipo === 'llave') { P.llave = true; Snd.tocar('jingle_item.mp3', 0.6); }
    else if (r.tipo === 'radio') darPista('Una voz en la radio te da una pista');
    if (nombre) flotante(nombre);
    escena.remove(r.m); recogibles.splice(recogibles.indexOf(r), 1);
    if (r.id != null && dentro) estadoLote(dentro.idx).cogidos.push(r.id);
  }
  function darArma(id) {
    if (P.armas.some(a => a.id === id)) { P.balas += 18; avisar(`Ya tenías ${MODELS[id].name}: +18 balas`); return; }
    if (P.armas.length >= 2) { const vieja = P.armas[P.armaI]; P.armas[P.armaI] = nuevoArma(id); avisar(`${MODELS[id].name} en lugar de ${MODELS[vieja.id].name}`); }
    else { P.armas.push(nuevoArma(id)); P.armaI = P.armas.length - 1; avisar(`Nueva arma: ${MODELS[id].name} (cambia con ${TACTIL ? 'el botón de armas' : '1 y 2'})`); }
    armarVista(); Snd.tocar('jingle_item.mp3', 0.6);
  }
  function darMejora(tipo) {
    const op = Object.keys(JG.tiendas.ferreteria.mejoras).filter(k => !arma().mej[k]);
    if (!op.length) { P.dinero += 40; avisar('Tu arma ya tiene todas las mejoras: +40 $'); return; }
    const k = tipo && op.includes(tipo) ? tipo : escoger(op); arma().mej[k] = true;
    avisar(`${JG.tiendas.ferreteria.mejoras[k].nombre}: ${JG.tiendas.ferreteria.mejoras[k].texto}`); Snd.tocar('jingle_item.mp3', 0.6);
  }
  function actualizarRecogibles(dt) {
    for (const r of recogibles.slice()) {
      if (r.zona !== zonaActual()) { r.m.visible = false; continue; }
      r.m.visible = true; r.t += dt; r.m.rotation.y += dt * 2; r.m.position.y = 0.45 + Math.sin(r.t * 3) * 0.08;
      if (r.tipo !== 'radio' && Math.hypot(r.x - J.x, r.z - J.z) < 1.3) recoger(r);
    }
  }
  function flotante(t) { const f = $('#flotante'); f.textContent = t; f.classList.remove('ver'); void f.offsetWidth; f.classList.add('ver'); }

  // ================= vacunas =================
  function usarVacuna(i = 0) {
    const id = P.bolsillo[i]; if (!id) { flotante('No tienes vacunas'); return; }
    const v = JG.vacunas[id]; P.bolsillo.splice(i, 1);
    P.infeccion = Math.max(0, P.infeccion - v.baja);
    let efecto = v.efecto, texto = v.texto;
    if (v.azar) { const e = escoger(JG.experimentales); efecto = e.efecto; texto = '−30 % infección · ' + e.texto; }
    if (efecto && Object.keys(efecto).length) {
      if (v.dura === 'partida') P.poderes.push({ id: 'suero' + P.poderes.length, nombre: v.nombre, efecto });
      else { P.vac.push({ id, nombre: v.nombre, efecto, quedan: typeof v.dura === 'number' ? v.dura : null }); while (P.vac.length > JG.jugador.vacunasActivas) P.vac.shift(); }
    }
    P.vida = Math.min(P.vida, vidaMax());
    avisar(`${v.nombre}: ${texto}`); Snd.tocar('confirm.mp3', 0.6);
  }

  // ================= pistas =================
  function darPista(texto) {
    if (P.pistas >= JG.pistas.necesarias) return;
    P.pistas++;
    const g = ciudad.lotes[P.guarida], radio = [0, 60, 30, 0][P.pistas];
    const a = Math.random() * 6.28, d = Math.random() * radio * 0.6;
    P.pistaCentro = P.pistas >= 3 ? { x: g.cx, z: g.cz, r: 0 } : { x: g.cx + Math.cos(a) * d, z: g.cz + Math.sin(a) * d, r: radio };
    avisar(P.pistas >= 3 ? `${texto}: ¡ya sabes dónde está el Paciente Cero! Míralo en el mapa` : `${texto} (pista ${P.pistas} de 3): mira el círculo naranja en el mapa`);
    Snd.tocar('jingle_item.mp3', 0.7);
  }
  const guaridaAbierta = () => P.pistas >= JG.pistas.necesarias || P.tNivel >= JG.pistas.guaridaAbreEn;
  function estadoLote(i) { return P.lotes[i] || (P.lotes[i] = { visto: false, vivos: null, cogidos: [], abiertas: [], jefe: false, usado: false, vidaJefe: null }); }

  // ================= por dentro de los edificios =================
  let dentro = null, solidosCiudad = null, salaG = null, afuera = null;
  const OX = -4000, OZ = 0; // las salas se arman lejos de la ciudad
  const TAM_SALA = { A: [11, 11], B: [20, 12], C: [20, 20], D: [28, 28] };
  const COL_SALA = {
    piso: { comun: 0x5a4a3a, tienda: 0x6a5a48, casa: 0x5a4430, minijuego: 0x2a1a3a, raro: 0x3a3e44, minijefe: 0x4a3a34, jefe: 0x3a2a2a },
    pared: { comun: 0x8a8070, tienda: 0x9a7a5a, casa: 0x7a8a6a, minijuego: 0x4a2a5a, raro: 0x5a6068, minijefe: 0x7a5a50, jefe: 0x5a3030 }
  };
  function entrar(l) {
    const idx = ciudad.lotes.indexOf(l), e = l.ed, st = estadoLote(idx);
    if (idx === P.guarida && !guaridaAbierta()) { avisar('Está cerrado por dentro. Junta las 3 pistas (o espera a que se abra)'); Snd.tocar('error.mp3', 0.5); return; }
    if (e.id === 'bunker' && !P.llave) { avisar('El búnker está cerrado con llave. La llave está en otro edificio común'); Snd.tocar('error.mp3', 0.5); return; }
    Snd.tocar('door_open.mp3', 0.7);
    afuera = { x: J.x, z: J.z, giro: J.giro };
    if (!st.visto) { st.visto = true; P.explorados++; }
    const [w0, d0] = TAM_SALA[l.tam], ancho = l.ancho >= l.fondo ? w0 : d0, fondo = l.ancho >= l.fondo ? d0 : w0;
    const x0 = OX - ancho / 2, z0 = OZ - fondo / 2;
    dentro = { idx, l, e, x0, z0, ancho, fondo, cx: OX, cz: OZ, salida: { x: OX, z: z0 + fondo - 0.6 } };
    usables = [];
    solidosCiudad = solidos; solidos = []; limites = { x0, x1: x0 + ancho, z0, z1: z0 + fondo };
    salaG = new THREE.Group(); escena.add(salaG); bajoTecho = true;
    const cat = e.cat, R = azar(ciudad.semilla * 1000 + idx * 7 + P.nivel);
    const piso = caja(salaG, OX, -0.05, OZ, ancho, 0.1, fondo, mat(COL_SALA.piso[cat]));
    const pared = mat(COL_SALA.pared[cat]), alto = 3.6, paredes = [];
    paredes.push(caja(salaG, OX, alto / 2, z0 - 0.2, ancho + 0.8, alto, 0.4, pared));
    paredes.push(caja(salaG, x0 - 0.2, alto / 2, OZ, 0.4, alto, fondo, pared), caja(salaG, x0 + ancho + 0.2, alto / 2, OZ, 0.4, alto, fondo, pared));
    const lado = (ancho - 2.4) / 2;
    paredes.push(caja(salaG, x0 + lado / 2, alto / 2, z0 + fondo + 0.2, lado, alto, 0.4, pared), caja(salaG, x0 + ancho - lado / 2, alto / 2, z0 + fondo + 0.2, lado, alto, 0.4, pared));
    caja(salaG, OX, alto - 0.3, z0 + fondo + 0.2, 2.4, 0.6, 0.4, pared);
    caja(salaG, OX, alto + 0.05, OZ, ancho + 0.8, 0.1, fondo + 0.8, mat(0x7a7268));
    const pm = new THREE.MeshBasicMaterial({ color: 0x9be37a, transparent: true, opacity: 0.3 }); caja(salaG, OX, 1.5, z0 + fondo + 0.3, 2.4, 3, 0.05, pm);
    const luz = new THREE.PointLight(cat === 'minijuego' ? 0xd0a0ff : cat === 'jefe' ? 0xff7060 : 0xffe0b0, 1.4, Math.max(ancho, fondo) * 1.4, 1.2); luz.position.set(OX, alto - 0.4, OZ); salaG.add(luz);
    salaG.add(new THREE.AmbientLight(0x909090, 0.5));
    const mueble = (x, z, w, d, h, color) => { caja(salaG, x, h / 2, z, w, h, d, mat(color)); const s = rect(x, z, w, d); s.alto = h; solidos.push(s); };
    const libre = (m = 2) => { for (let i = 0; i < 40; i++) { const x = x0 + m + R() * (ancho - m * 2), z = z0 + m + R() * (fondo - m * 2 - 2); if (!solidos.some(s => x > s.x0 - 1.2 && x < s.x1 + 1.2 && z > s.z0 - 1.2 && z < s.z1 + 1.2)) return { x, z }; } return { x: OX + (R() - 0.5) * 3, z: OZ - 1 }; };
    // muebles: el decorado arma cada lugar según lo que es; si no está, unas cajas sueltas
    if (window.DECO) DECO.sala({ grupo: salaG, e: idx === P.guarida ? { ...e, cat: 'comun', id: 'guarida' } : e, x0, z0, ancho, fondo, R, mueble, libre, pisoMesh: piso, paredes });
    const nMuebles = window.DECO || cat === 'tienda' || cat === 'minijuego' || idx === P.guarida ? 0 : Math.floor(ancho * fondo / 90);
    for (let i = 0; i < nMuebles; i++) { const p = libre(2.5); mueble(p.x, p.z, 1 + R() * 2.5, 0.8 + R() * 1.2, 0.9 + R() * 1.0, escoger([0x5a4030, 0x4a4a50, 0x6a5a40])); }
    J.x = dentro.salida.x; J.z = dentro.salida.z - 0.6; J.giro = 0;
    contenido(R, st, libre, mueble);
    if (idx !== P.guarida && e.cat !== 'minijefe' && e.cat !== 'jefe') avisar(`${e.nombre} · ${D.categorias[cat].nombre}`);
  }
  function salir() {
    if (!dentro) return;
    if (dentro.trampa) { avisar('La puerta está trabada: acaba con los zombis'); Snd.tocar('error.mp3', 0.5); return; }
    if (dentro.mini) terminarMini3D(false);
    const st = estadoLote(dentro.idx);
    st.vivos = zs.filter(o => !o.muerto && o.zona === dentro.idx && !o.jefe && !o.escolta).length;
    const jefe = zs.find(o => !o.muerto && o.zona === dentro.idx && o.jefe); if (jefe) st.vidaJefe = jefe.vida;
    for (const zo of zs.filter(o => o.zona === dentro.idx)) quitarZombi(zo);
    for (const r of recogibles.filter(r => r.zona === dentro.idx)) { escena.remove(r.m); recogibles.splice(recogibles.indexOf(r), 1); }
    for (const p of proys.slice()) { escena.remove(p.m); proys.splice(proys.indexOf(p), 1); }
    objetivos.length = 0; usables = [];
    if (window.DECO) DECO.salirSala();
    escena.remove(salaG); salaG = null; solidos = solidosCiudad; limites = null; dentro = null; bajoTecho = false;
    J.x = afuera.x; J.z = afuera.z; J.giro = afuera.giro + Math.PI;
    Snd.tocar('door_close.mp3', 0.6); guardar();
  }
  // lo que hay adentro según el tipo de edificio
  function contenido(R, st, libre, mueble) {
    const { e, idx, z0, ancho } = dentro, cat = e.cat, n = P.nivel;
    const tipos = JG.zombis.tiposDentro[n];
    const ponerZombis = (cuantos, op = {}) => { for (let i = 0; i < cuantos; i++) { const p = libre(1.5); crearZombi(op.tipo || escoger(tipos), p.x, p.z, { zona: idx, ...op }); } };
    const objeto = (tipo, valor, id, p = libre(1.5)) => { if (!st.cogidos.includes(id)) soltar(tipo, p.x, p.z, valor, { zona: idx, id }); };
    const nZombis = () => st.vivos != null ? st.vivos : Math.max(0, Math.round((e.peligro * JG.zombis.porPeligro + Math.floor(R() * 3) - 1) * amb_('zombiCantidad')));
    const vendedor = texto => {
      const k = KI.buildZombie('bandit'); k.root.position.set(dentro.cx, 0, z0 + 2.2); salaG.add(k.root);
      mueble(dentro.cx, z0 + 3.4, Math.min(ancho - 3, 7), 0.9, 1.05, 0x6a4a2a);
      const u = { x: dentro.cx, z: z0 + 4.8, r: 2.6, texto, accion: () => abrirTienda(e.id) }; usables.push(u); return u;
    };
    if (idx === P.guarida) return guaridaSala(st);
    if (cat === 'tienda') { vendedor(`Comprar en ${e.nombre}`); return; }
    if (cat === 'comun' || cat === 'casa') {
      const S = JG.sorpresas, primera = st.vivos == null;
      if (primera) {
        st.sorpresa = R() < S.radio ? 'radio' : R() < S.sobreviviente ? 'sobreviviente' : R() < S.trampa ? 'trampa' : R() < S.alijo ? 'alijo' : R() < S.dormido ? 'dormido' : null;
        if (e.id === 'parada' && R() < 0.5) st.sorpresa = 'radio';
      }
      ponerZombis(nZombis(), { duerme: primera && st.sorpresa === 'dormido' });
      if (primera && e.id === 'restaurante') ponerZombis(1, { tipo: 'brute', vida: 400 });
      if (primera && e.id === 'mansion') ponerZombis(1, { tipo: 'brute' });
      const loot = { casa: [['balas', 6]], kiosco: [['dinero', 15]], cafeteria: [['comida', 20]], restaurante: [['comida', 30]], super: [['comida', 25], ['balas', 12], ['comida', 25]], oficina: [['dinero', 25], ['dinero', 15]], garaje: [['balas', 6]], lavanderia: [['dinero', 10]], escuela: [['balas', 12]], apartamentos: [['dinero', 20], ['balas', 6]], iglesia: [['comida', 20]], estacionamiento: [['balas', 12]], parada: [['dinero', 8]], banos: [['balas', 6]],
        medico: [['vacuna', 'basica'], ['vacuna', escoger(['roja', 'azul', 'amarilla'])]], cazador: [['mejora', 1], ['balas', 12]], bunker: [['balas', 36], ['vacuna', 'roja'], ['mejora', 1]], mansion: [['dinero', 120], ['vacuna', escoger(['verde', 'roja'])]], coleccionista: [] }[e.id] || [['balas', 6]];
      loot.forEach(([t, v], i) => objeto(t, v, 'l' + i));
      if (e.id === 'coleccionista' && !st.abiertas.includes('vitrina')) vitrina(st, libre);
      if (P.llaveLote === idx && !P.llave) objeto('llave', 1, 'llave');
      if (st.sorpresa === 'radio' && !st.cogidos.includes('radio')) { const p = libre(2), r = soltar('radio', p.x, p.z, 1, { zona: idx, id: 'radio' }); const u = { x: p.x, z: p.z, texto: 'Escuchar la radio', accion: () => { recoger(r); usables.splice(usables.indexOf(u), 1); } }; usables.push(u); }
      if (st.sorpresa === 'alijo') { objeto('dinero', 40, 'a1'); objeto('balas', 12, 'a2'); }
      if (st.sorpresa === 'sobreviviente' && !st.cogidos.includes('sob')) {
        const k = KI.buildZombie('bandit'), p = libre(2); k.root.position.set(p.x, 0, p.z); salaG.add(k.root);
        const u = { x: p.x, z: p.z, texto: 'Hablar con el sobreviviente', accion: () => { st.cogidos.push('sob'); const v = escoger(['basica', 'roja', 'azul']); let txt = '+18 balas'; if (P.bolsillo.length < JG.jugador.bolsillo) { P.bolsillo.push(v); txt = JG.vacunas[v].nombre; } else P.balas += 18; avisar(`Sobreviviente: «Toma, a mí ya no me sirve» (${txt})`); salaG.remove(k.root); usables.splice(usables.indexOf(u), 1); Snd.tocar('jingle_item.mp3', 0.6); } };
        usables.push(u);
      }
      if (st.sorpresa === 'trampa' && primera) { dentro.trampa = true; ponerZombis(3, { persigue: true }); avisar('¡Una trampa! La puerta se cerró: acaba con los zombis'); }
      return;
    }
    if (cat === 'raro') { cajasRaras(st, libre); if (e.id === 'boveda') dentro.boveda = true; ponerZombis(Math.min(2, nZombis())); if (st.vivos == null) avisar(`${e.nombre}: dispárale a las cerraduras para abrir las cajas`); return; }
    if (cat === 'minijefe' || cat === 'jefe') {
      const M = cat === 'minijefe' ? JG.minijefes[e.id] : JG.jefes[e.id], vmax = M.vida * JG.zombis.vidaPorNivel[n - 1];
      if (!st.jefe) {
        const z = crearZombi(M.tipo, dentro.cx, z0 + 4, { zona: idx, jefe: { ...M, rol: cat }, nombre: M.nombre, escala: M.escala, vida: st.vidaJefe || vmax, dano: M.dano, velocidad: M.velocidad, look: M.look, escupe: M.escupe || cat === 'jefe', persigue: true });
        z.vidaMax = vmax;
        if (cat === 'minijefe') for (const t of M.escolta || []) { const p = libre(2); const ez = crearZombi(t, p.x, p.z, { zona: idx }); ez.escolta = true; }
        else ponerZombis(st.vivos != null ? st.vivos : 3);
        avisar(cat === 'jefe' ? `${M.nombre}: vencerlo te da la última pista` : `${M.nombre} está aquí: vencerlo te da una pista`); Snd.tocar('jingle_boss.mp3', 0.7);
      } else ponerZombis(Math.min(2, nZombis()));
      return;
    }
    if (cat === 'minijuego') { const u = vendedor(NOMBRE_MINI[e.id]); u.accion = () => abrirMini(e.id); }
  }
  function vitrina(st, libre) {
    const p = libre(2.5), m = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.4, 0.8), new THREE.MeshLambertMaterial({ color: 0x9fd8ff, transparent: true, opacity: 0.45 })); m.position.set(p.x, 0.7, p.z); salaG.add(m);
    const s = rect(p.x, p.z, 1.2, 0.8); solidos.push(s);
    const arma_ = escoger(['magnum', 'mp5', 'ballesta', 'jackpot']);
    const g = KI.revolverMini(arma_); g.position.set(p.x, 0.75, p.z); g.scale.setScalar(1.6); salaG.add(g);
    const ob = { c: V3(p.x, 0.8, p.z), r: 0.75, golpe: () => {
      salaG.remove(m); salaG.remove(g); solidos.splice(solidos.indexOf(s), 1); objetivos.splice(objetivos.indexOf(ob), 1); st.abiertas.push('vitrina');
      Snd.tocar('clang1.mp3', 0.8, 1.4); alertar(J.x, J.z, 40); llegaZombiPuerta(); llegaZombiPuerta();
      soltar('arma', p.x, p.z + 1, arma_, { zona: dentro.idx, id: 'vit' }); avisar('Rompiste la vitrina: el ruido atrae zombis');
    } };
    objetivos.push(ob);
  }
  function cajasRaras(st, libre) {
    (JG.cajas[dentro.e.id] || [6]).forEach((n, i) => {
      if (st.abiertas.includes('c' + i)) return;
      const p = libre(2), tam = 0.7 + n / 18 * 0.7;
      const m = new THREE.Mesh(new THREE.BoxGeometry(tam * 1.4, tam, tam), new THREE.MeshLambertMaterial({ color: dentro.e.id === 'contenedor' ? 0x4a5a3a : dentro.e.id === 'boveda' ? 0x8a8e96 : 0x7a5a32 }));
      m.position.set(p.x, tam / 2, p.z); salaG.add(m); const s = rect(p.x, p.z, tam * 1.4, tam); s.alto = tam; solidos.push(s);
      const cerr = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.24, 0.06), new THREE.MeshBasicMaterial({ color: 0xffd040 })); cerr.position.set(p.x, tam * 0.6, p.z + tam / 2 + 0.03); salaG.add(cerr);
      let faltan = n;
      const ob = { c: V3(p.x, tam / 2, p.z), r: tam * 0.8, golpe: () => {
        faltan--; Snd.tocar('clang0.mp3', 0.6, rnd(1.1, 1.3)); flotante(faltan > 0 ? `Cerradura: faltan ${faltan} disparos` : '¡Caja abierta!');
        if (faltan > 0) return;
        salaG.remove(cerr); m.material.color.multiplyScalar(0.6); objetivos.splice(objetivos.indexOf(ob), 1); st.abiertas.push('c' + i);
        const suerte = per().suerte || 1, id = dentro.e.id;
        if (id === 'contenedor') soltar('arma', p.x, p.z + tam + 0.6, escoger(['minigun', 'bazuca', 'tesla']));
        else if (id === 'boveda') soltar('dinero', p.x, p.z + tam + 0.6, Math.round(n * 9 * suerte * amb_('premios')));
        else if (Math.random() < 0.5 * suerte || n >= 12) soltar('arma', p.x, p.z + tam + 0.6, escoger(n >= 12 ? ['magnum', 'mp5', 'uzi', 'ballesta'] : ['corto', 'viejo', 'paci', 'cowboy', 'jackpot']));
        else soltar('mejora', p.x, p.z + tam + 0.6, 1);
      } };
      objetivos.push(ob);
    });
  }
  function llegaZombiPuerta() { if (!dentro) return; crearZombi(escoger(JG.zombis.tiposDentro[P.nivel]), dentro.salida.x + rnd(-1, 1), dentro.salida.z - 0.5, { zona: dentro.idx, persigue: true }); }

  // ================= la guarida y los jefes =================
  function guaridaSala(st) {
    const PC = JG.pacientes[P.nivel - 1];
    if (P.vencido) { avisar('Aquí ya no queda nada. Ve a la salida del nivel'); return; }
    const z = crearZombi(PC.tipo, dentro.cx, dentro.z0 + 4, { zona: dentro.idx, jefe: { ...PC, rol: 'paciente', fase: 1, llamadas: 0 }, nombre: PC.nombre, escala: PC.escala, vida: st.vidaJefe || PC.vida, dano: PC.dano, velocidad: PC.velocidad, look: PC.look, escupe: PC.jeringas, persigue: true });
    z.vidaMax = PC.vida; if (PC.jeringas) z.tipoProy = 'jeringa';
    avisar(`¡${PC.nombre}, el Paciente Cero ${P.nivel}!`); Snd.tocar('jingle_boss.mp3', 0.9);
  }
  function jefeIA(zo, dt, dist) {
    const j = zo.jefe, frac = zo.vida / zo.vidaMax;
    if (j.embiste) { zo.cdCarga = (zo.cdCarga == null ? 4 : zo.cdCarga) - dt; if (zo.cdCarga <= 0 && dist > 4) { zo.cdCarga = 5; zo.carga = 0.8; flotante(`${zo.nombre} embiste`); } }
    if (j.rol !== 'paciente') return;
    const cortes = [0.75, 0.5, 0.25];
    while (j.llamadas < cortes.length && frac < cortes[j.llamadas]) {
      j.llamadas++;
      for (let i = 0; i < (j.llama || 3); i++) crearZombi(j.bombas ? 'bloater' : j.fases ? 'runner' : 'walker', dentro.salida.x + rnd(-3, 3), dentro.salida.z - rnd(0.5, 2), { zona: dentro.idx, persigue: true });
      avisar(`${zo.nombre} llama a su horda`);
    }
    if (j.bombas) { zo.cdSalto = (zo.cdSalto == null ? 6 : zo.cdSalto) - dt; if (zo.cdSalto <= 0) { zo.cdSalto = 7; const L = limites; zo.x = limitar(J.x + rnd(-8, 8), L.x0 + 2, L.x1 - 2); zo.z = limitar(J.z + rnd(-8, 8), L.z0 + 2, L.z1 - 2); flotante('El Mensajero desaparece y aparece en otro lado'); } }
    if (j.fases) {
      const fase = frac > 0.66 ? 1 : frac > 0.33 ? 2 : 3;
      if (fase !== j.fase) { j.fase = fase; if (fase === 2) { zo.vel *= 1.35; avisar('El Primero se vuelve más rápido'); } if (fase === 3) { zo.k.root.scale.multiplyScalar(1.3); zo.esc *= 1.3; zo.dano *= 1.3; avisar('El Primero se transforma'); } }
      if (fase === 1) { zo.cdRoca = (zo.cdRoca == null ? 3 : zo.cdRoca) - dt; if (zo.cdRoca <= 0) { zo.cdRoca = 3.2; proyectil(zo, 'roca'); } }
    }
  }
  function jefeVencido(zo) {
    const j = zo.jefe, st = estadoLote(dentro.idx), premios = amb_('premios');
    st.jefe = true; Snd.tocar('jingle_buy.mp3', 0.8);
    for (const o of zs.filter(o => o.escolta && !o.muerto)) o.estado = 'persigue';
    if (j.rol === 'minijefe') { soltar('dinero', zo.x, zo.z, Math.round(JG.dinero.minijefe * premios)); soltar('vacuna', zo.x + 1, zo.z, escoger(['basica', 'roja', 'azul', 'amarilla'])); darPista(`Venciste a ${zo.nombre}`); return; }
    if (j.rol === 'jefe') { soltar('dinero', zo.x, zo.z, Math.round(JG.dinero.jefe * premios)); if (Math.random() < 0.5) soltar('mejora', zo.x + 1, zo.z, 1); else soltar('vacuna', zo.x + 1, zo.z, 'verde'); while (P.pistas < 3) darPista(`Venciste a ${zo.nombre}`); return; }
    P.vencido = true; P.pacientes++;
    const pod = JG.pacientes[P.nivel - 1].poder;
    if (P.nivel >= JG.niveles) { avisar('¡Venciste al Primero! La ciudad está a salvo'); setTimeout(() => fin('victoria'), 2500); return; }
    P.poderes.push(pod);
    if (P.bolsillo.length < JG.jugador.bolsillo) P.bolsillo.push('suero'); else { P.bolsillo.unshift('suero'); usarVacuna(0); }
    avisar(`¡Venciste a ${zo.nombre}! Poder: ${pod.nombre}. Ganaste un Suero del Paciente Cero. Ve a la salida: ${ciudad.mapa.salida}`);
  }

  // ================= zombis de la calle =================
  let reaparece = 0;
  function puntoCalle(lejos = 28, cerca = 55) {
    for (let i = 0; i < 25; i++) {
      const enX = Math.random() < 0.5, linea = Math.floor(Math.random() * ((enX ? ciudad.mapa.w : ciudad.mapa.h) + 1)) * PASO + D.calle / 2 + rnd(-1.5, 1.5);
      const a = rnd(2, (enX ? ciudad.fondo : ciudad.ancho) - 2), x = enX ? linea : a, z = enX ? a : linea, d = Math.hypot(x - J.x, z - J.z);
      if (d > lejos && d < cerca && !chocaEn(x, z, 0.5)) return { x, z };
    }
    return null;
  }
  function zombisCalle(dt) {
    if (dentro) return;
    const quiero = Math.round(JG.zombis.enCalle[P.nivel] * amb_('zombiCantidad')), hay = zs.filter(z => z.zona === -1 && !z.muerto);
    for (const z of hay) if (Math.hypot(z.x - J.x, z.z - J.z) > 75) quitarZombi(z);
    reaparece -= dt;
    if (hay.length < quiero && reaparece <= 0) {
      reaparece = rnd(...JG.zombis.reaparecer) * (hay.length < quiero / 2 ? 0.3 : 1);
      const p = puntoCalle(); if (p) crearZombi(escoger(JG.zombis.tiposCalle[P.nivel]), p.x, p.z, { zona: -1, duerme: Math.random() < 0.15 * amb_('zombisDormidos') });
    }
  }

  // ================= cosas con las que se interactúa =================
  let usables = [], cercano = null;
  function usablesCiudad() {
    const l = [];
    for (const p of puertas) {
      const idx = ciudad.lotes.indexOf(p.lote), e = p.lote.ed, guar = idx === P.guarida && P.pistas >= 3 && !P.vencido;
      l.push({ x: p.x, z: p.z, texto: guar ? 'Entrar a la guarida del Paciente Cero' : `Entrar: ${e.nombre}`, sub: D.categorias[e.cat].nombre + (estadoLote(idx).visto ? ' · ya entraste' : ''), accion: () => entrar(p.lote) });
    }
    if (P.vencido && salidaPos) l.push({ x: salidaPos.x, z: salidaPos.z, r: 4.5, texto: `Subir a: ${ciudad.mapa.salida}`, sub: P.nivel >= JG.niveles ? 'Terminar la partida' : `Ir al nivel ${P.nivel + 1}`, accion: siguienteNivel });
    return l;
  }
  function buscarCercano() {
    const lista = dentro ? [{ x: dentro.salida.x, z: dentro.salida.z, texto: 'Salir a la calle', accion: salir, r: 2.2 }, ...usables] : usablesCiudad();
    let mejor = null, dm = 99;
    for (const u of lista) { const d = Math.hypot(u.x - J.x, u.z - J.z); if (d < (u.r || 2.6) && d < dm) { dm = d; mejor = u; } }
    cercano = mejor;
    const av = $('#aviso'), bt = $('#btn-usar');
    if (mejor) { av.style.display = 'block'; av.innerHTML = `${mejor.texto}${mejor.sub ? `<small>${mejor.sub}</small>` : ''}<small>${TACTIL ? 'Toca «Usar»' : 'Tecla E'}</small>`; bt.classList.add('ver'); }
    else { av.style.display = 'none'; bt.classList.remove('ver'); }
  }
  function usar() { buscarCercano(); if (cercano && estado === 'jugar') { Snd.iniciar(); cercano.accion(); buscarCercano(); } }

  // ================= ventanas: tiendas y minijuegos =================
  function panel(titulo, html, alCerrar) {
    estado = 'panel'; gatillo = false; if (document.exitPointerLock) document.exitPointerLock();
    $('#panel-titulo').textContent = titulo; $('#panel-cuerpo').innerHTML = html; $('#panel').classList.add('ver');
    pintarDineroPanel(); panel.alCerrar = alCerrar || null;
  }
  const pintarDineroPanel = () => { $('#panel-dinero').textContent = `${P.dinero} $ · ${P.balas} balas · vacunas ${P.bolsillo.length} de ${JG.jugador.bolsillo}`; };
  function cerrarPanel() {
    $('#panel').classList.remove('ver'); tab = null;
    if (!P) return;
    estado = 'jugar';
    if (panel.alCerrar) { const f = panel.alCerrar; panel.alCerrar = null; f(); }
    if (!TACTIL && lienzo.requestPointerLock) lienzo.requestPointerLock();
  }
  const fila = (nombre, texto, precio, accion, extra = '') => `<div class="fila"><div><b>${nombre}</b><small>${texto}</small></div><button class="btn-comprar" data-a="${accion}" ${extra}>${precio === 0 ? 'Gratis' : precio + ' $'}</button></div>`;
  function abrirTienda(id) {
    const T = JG.tiendas[id], st = estadoLote(dentro.idx);
    let html = '';
    if (id === 'armeria') {
      if (!st.ofertas) st.ofertas = KI.MODEL_ORDER.slice().sort(() => Math.random() - 0.5).filter(a => !P.armas.some(x => x.id === a)).slice(0, T.ofertas);
      html = st.ofertas.map(a => fila(MODELS[a].name, `${MODELS[a].desc} (${MODELS[a].cap} balas)`, T.precioArma[a], 'arma:' + a)).join('') || '<p class="nota">No queda nada a la venta.</p>';
      html += '<p class="nota">Puedes llevar 2 armas. Si ya tienes 2, la nueva reemplaza a la que tienes en la mano.</p>';
    } else if (id === 'farmacia') {
      html = T.vacunas.map(v => fila(JG.vacunas[v].nombre, JG.vacunas[v].texto, JG.vacunas[v].precio, 'vac:' + v)).join('') + fila('Botiquín', `Cura ${T.botiquin.cura} de vida`, T.botiquin.precio, 'cura');
    } else if (id === 'delivery') {
      html = T.paquetes.map((p, i) => fila(`${p.balas} balas`, 'Sirven para todas tus armas', p.precio, 'balas:' + i)).join('');
    } else if (id === 'ferreteria') {
      html = Object.entries(T.mejoras).map(([k, m]) => fila(m.nombre, `${m.texto} (para el arma en tu mano)${arma().mej[k] ? ' · ya la tiene' : ''}`, m.precio, 'mej:' + k, arma().mej[k] ? 'disabled' : '')).join('');
    } else if (id === 'mercado') {
      html = T.vacunas.map(v => fila(JG.vacunas[v].nombre, JG.vacunas[v].texto, Math.round(JG.vacunas[v].precio * T.recargo), 'vacm:' + v)).join('');
    } else if (id === 'herrero') {
      const a = arma(), p = T.precioNivel * a.nivel;
      html = fila(`Subir ${MODELS[a.id].name} al nivel ${a.nivel + 1}`, `+${Math.round(T.danoNivel * 100)} % de daño por nivel (máximo ${T.nivelMax})`, p, 'nivel', a.nivel >= T.nivelMax ? 'disabled' : '');
    }
    panel(T.titulo, html);
  }
  function comprar(accion) {
    const [t, v] = accion.split(':'), T = JG.tiendas;
    if (t === 'mini') return jugarMini(v);
    const pagar = p => { if (P.dinero < p) { Snd.tocar('error.mp3', 0.6); flotante('No te alcanza el dinero'); return false; } P.dinero -= p; Snd.tocar('jingle_buy.mp3', 0.6); return true; };
    const lleno = () => { if (P.bolsillo.length >= JG.jugador.bolsillo) { Snd.tocar('error.mp3', 0.6); flotante('Bolsillo lleno: usa una vacuna primero'); return true; } return false; };
    if (t === 'arma' && pagar(T.armeria.precioArma[v])) { darArma(v); const st = estadoLote(dentro.idx); st.ofertas = st.ofertas.filter(a => a !== v); }
    if ((t === 'vac' || t === 'vacm') && !lleno() && pagar(Math.round(JG.vacunas[v].precio * (t === 'vacm' ? T.mercado.recargo : 1)))) { P.bolsillo.push(v); flotante(JG.vacunas[v].nombre); }
    if (t === 'cura' && pagar(T.farmacia.botiquin.precio)) { P.vida = Math.min(vidaMax(), P.vida + T.farmacia.botiquin.cura); flotante(`+${T.farmacia.botiquin.cura} de vida`); }
    if (t === 'balas') { const p = T.delivery.paquetes[+v]; if (pagar(p.precio)) { P.balas += p.balas; flotante(`+${p.balas} balas`); } }
    if (t === 'mej' && !arma().mej[v] && pagar(T.ferreteria.mejoras[v].precio)) darMejora(v);
    if (t === 'nivel' && arma().nivel < T.herrero.nivelMax && pagar(T.herrero.precioNivel * arma().nivel)) { arma().nivel++; flotante(`Arma al nivel ${arma().nivel}`); }
    if (dentro && dentro.e.cat === 'tienda') { const y = $('#panel-cuerpo').scrollTop; abrirTienda(dentro.e.id); $('#panel-cuerpo').scrollTop = y; }
  }
  const NOMBRE_MINI = { casino: 'Jugar en el Zombie Casino', tresenraya: 'Jugar tres en raya contra el zombi', galeria: 'Jugar en la Galería de tiro', zafira: 'Hablar con Madame Zafira', bolera: 'Jugar a la Bolera zombi', garra: 'Probar la Máquina de la garra', arena: 'Entrar a la Arena de pelea' };
  function abrirMini(id) {
    const M = JG.minijuegos[id], st = estadoLote(dentro.idx);
    if (id === 'casino') return panel('Zombie Casino', `<div class="rodillos" id="rodillos"><span>?</span><span>?</span><span>?</span></div><p class="nota">Tres iguales pagan ×${M.pagos.tres}; dos iguales, ×${M.pagos.dos}.</p>` + M.apuestas.map(a => fila(`Apostar ${a} $`, 'Tirar de la palanca', a, 'mini:casino-' + a)).join(''));
    if (id === 'zafira') return panel('Carpa de Madame Zafira', '<p class="nota">«La ruleta del destino: puede darte un regalo… o un castigo.»</p>' + fila('Girar la ruleta', 'Premio o castigo al azar', M.costo, 'mini:zafira'));
    if (id === 'garra') return panel('Máquina de la garra', '<p class="nota">Con suerte sacas una vacuna.</p>' + fila('Probar la garra', `${Math.round(M.prob * 100 * (per().suerte || 1))} % de sacar algo`, M.costo, 'mini:garra'));
    if (id === 'tresenraya') {
      if (st.usado) return panel('Tres en raya zombi', '<p class="nota">El zombi ya no quiere jugar contigo.</p>');
      tab = null;
      return panel('Tres en raya zombi', `<p class="nota">Tú eres la X. Si ganas, premio; si empatas, nada; si pierdes, se suelta la horda.</p><div class="tablero" id="tablero">${[...Array(9)].map((_, i) => `<button data-c="${i}" aria-label="Casilla ${i + 1}"></button>`).join('')}</div>`);
    }
    if (st.usado && id === 'arena') return panel('Arena de pelea', '<p class="nota">Ya ganaste aquí.</p>');
    const txt = { galeria: `Dispara a todos los blancos que puedas en ${M.segundos} segundos (${M.premioPorBlanco} $ cada uno)`, bolera: `Derriba la fila de ${M.pinos} zombis-bolo en 25 segundos (${M.premioPorPino} $ cada uno). Las balas atraviesan la fila si apuntas bien`, arena: `Aguanta ${M.segundos} segundos contra oleadas de zombis (premio ${M.premio} $)` }[id];
    return panel({ galeria: 'Galería de tiro', bolera: 'Bolera zombi', arena: 'Arena de pelea' }[id], `<p class="nota">${txt}</p>` + fila('Empezar', 'El juego empieza al cerrar esta ventana', M.costo || 0, 'mini:' + id));
  }
  function jugarMini(v) {
    const [id, apuesta] = v.split('-'), M = JG.minijuegos[id], suerte = per().suerte || 1, premios = amb_('premios');
    const pagar = p => { if (P.dinero < p) { Snd.tocar('error.mp3', 0.6); flotante('No te alcanza el dinero'); return false; } P.dinero -= p; return true; };
    if (id === 'casino') {
      const a = +apuesta; if (!pagar(a)) return;
      Snd.tocar('chips.mp3', 0.7);
      const S = M.simbolos, r = [escoger(S), escoger(S), escoger(S)]; if (Math.random() < 0.12 * suerte) r[2] = r[1] = r[0];
      const iguales = r[0] === r[1] && r[1] === r[2] ? 3 : (r[0] === r[1] || r[1] === r[2] || r[0] === r[2]) ? 2 : 0;
      const gana = Math.round(a * (iguales === 3 ? M.pagos.tres : iguales === 2 ? M.pagos.dos : 0) * premios);
      P.dinero += gana; $('#rodillos').innerHTML = r.map(s => `<span>${s}</span>`).join('');
      flotante(gana ? `¡Ganaste ${gana} $!` : 'Nada esta vez'); if (gana) Snd.tocar('coins.mp3', 0.7);
      return pintarDineroPanel();
    }
    if (id === 'zafira') {
      if (!pagar(M.costo)) return; Snd.tocar('dice.mp3', 0.7);
      const tiros = [['Regalo: 60 $', () => P.dinero += 60], ['Regalo: una vacuna roja', () => P.bolsillo.length < 3 ? P.bolsillo.push('roja') : P.dinero += 90], ['Regalo: +24 balas', () => P.balas += 24], ['Regalo: una mejora para tu arma', () => darMejora()],
        ['Castigo: +10 % de infección', () => P.infeccion = Math.min(99, P.infeccion + 10)], ['Castigo: pierdes 30 $', () => P.dinero = Math.max(0, P.dinero - 30)], ['Castigo: llegan 3 zombis', () => { for (let i = 0; i < 3; i++) llegaZombiPuerta(); }]];
      const r = Math.random() < 0.6 * suerte ? escoger(tiros.slice(0, 4)) : escoger(tiros.slice(4));
      cerrarPanel(); r[1](); avisar('Madame Zafira: ' + r[0]); return;
    }
    if (id === 'garra') {
      if (!pagar(M.costo)) return; Snd.tocar('metalClick.mp3', 0.7);
      if (Math.random() < M.prob * suerte) { const v2 = escoger(['basica', 'azul', 'amarilla']); if (P.bolsillo.length < 3) { P.bolsillo.push(v2); flotante(`¡Sacaste ${JG.vacunas[v2].nombre}!`); } else { P.dinero += 30; flotante('¡Premio! +30 $'); } Snd.tocar('jingle_item.mp3', 0.6); }
      else flotante('La garra se resbaló');
      return pintarDineroPanel();
    }
    if (!pagar(M.costo || 0)) return; panel.alCerrar = () => empezarMini3D(id); cerrarPanel();
  }
  // tres en raya: el zombi gana si puede; si no, casi siempre bloquea
  const LINEAS = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
  let tab = null;
  function jugadaTres(c) {
    if (!tab) tab = Array(9).fill('');
    if (tab[c]) return; tab[c] = 'X'; Snd.tocar('metalClick.mp3', 0.5);
    const ganador = t => LINEAS.find(l => tab[l[0]] === t && tab[l[1]] === t && tab[l[2]] === t);
    const botones = () => document.querySelectorAll('#tablero button');
    const pintar = () => botones().forEach((b, i) => { b.textContent = tab[i]; b.disabled = !!tab[i]; });
    const terminar = (texto, f) => { pintar(); botones().forEach(b => b.disabled = true); estadoLote(dentro.idx).usado = true; tab = null; setTimeout(() => { cerrarPanel(); avisar(texto); f(); }, 900); };
    const premio = JG.minijuegos.tresenraya.premio;
    if (ganador('X')) return terminar(`¡Le ganaste al zombi! +${premio} $ y una vacuna`, () => { P.dinero += Math.round(premio * amb_('premios')); if (P.bolsillo.length < 3) P.bolsillo.push('basica'); Snd.tocar('coins.mp3'); });
    if (tab.every(x => x)) return terminar('Empate: el zombi se aburre', () => {});
    const libres = tab.map((x, i) => x ? -1 : i).filter(i => i >= 0);
    const busca = t => { for (const l of LINEAS) { const v = l.map(i => tab[i]); if (v.filter(x => x === t).length === 2 && v.includes('')) return l[v.indexOf('')]; } return -1; };
    let o = busca('O'); if (o < 0 && Math.random() < 0.8) o = busca('X'); if (o < 0) o = tab[4] ? escoger(libres) : 4;
    tab[o] = 'O';
    if (ganador('O')) return terminar('Perdiste: ¡se suelta la horda!', () => { for (let i = 0; i < JG.minijuegos.tresenraya.horda; i++) llegaZombiPuerta(); });
    if (tab.every(x => x)) return terminar('Empate: el zombi se aburre', () => {});
    pintar();
  }
  function empezarMini3D(id) {
    const M = JG.minijuegos[id]; dentro.mini = { id, t: M.segundos || 25, puntos: 0, objetos: [] };
    const mi = dentro.mini, x0 = dentro.x0, z0 = dentro.z0;
    if (id === 'galeria') {
      const ponerBlanco = () => {
        const x = x0 + 2 + Math.random() * (dentro.ancho - 4), z = z0 + 1.5 + Math.random() * 4, y = 0.8 + Math.random() * 1.6;
        const m = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.06, 16), new THREE.MeshBasicMaterial({ color: 0xff4a3a })); m.rotation.x = Math.PI / 2; m.position.set(x, y, z); salaG.add(m);
        const ob = { c: V3(x, y, z), r: 0.42, golpe: () => { mi.puntos++; salaG.remove(m); objetivos.splice(objetivos.indexOf(ob), 1); Snd.tocar('clang0.mp3', 0.5, 1.5); flotante(`Blancos: ${mi.puntos}`); if (mi.t > 0) ponerBlanco(); } };
        objetivos.push(ob); mi.objetos.push(m);
      };
      for (let i = 0; i < 3; i++) ponerBlanco();
    }
    if (id === 'bolera') { for (let i = 0; i < M.pinos; i++) { const z = crearZombi('walker', dentro.cx + (i % 3 - 1) * 0.8, z0 + 2 + Math.floor(i / 3) * 0.8, { zona: dentro.idx, vida: 50, duerme: true }); z.bolo = true; } }
    if (id === 'arena') { mi.oleada = 0; }
    avisar({ galeria: '¡Dispara a los blancos!', bolera: '¡Derriba a los zombis-bolo!', arena: `¡Aguanta ${M.segundos} segundos!` }[id]);
    Snd.tocar('confirm.mp3', 0.7);
  }
  function actualizarMini3D(dt) {
    const mi = dentro && dentro.mini; if (!mi) { $('#reloj-mini').classList.remove('ver'); return; }
    mi.t -= dt; $('#reloj-mini').textContent = Math.max(0, Math.ceil(mi.t)) + ' s'; $('#reloj-mini').classList.add('ver');
    if (mi.id === 'arena') { mi.oleada -= dt; if (mi.oleada <= 0) { mi.oleada = 6; for (let i = 0; i < 2 + P.nivel; i++) llegaZombiPuerta(); } }
    if (mi.id === 'bolera') { const quedan = zs.filter(z => z.bolo && !z.muerto).length; mi.puntos = JG.minijuegos.bolera.pinos - quedan; if (!quedan) mi.t = 0; }
    if (mi.t <= 0) terminarMini3D(true);
  }
  function terminarMini3D(completo) {
    const mi = dentro.mini; if (!mi) return; dentro.mini = null; $('#reloj-mini').classList.remove('ver');
    for (const m of mi.objetos) salaG.remove(m); objetivos.length = 0;
    for (const z of zs.filter(z => z.bolo)) quitarZombi(z);
    if (!completo) return;
    const M = JG.minijuegos[mi.id];
    let gana = mi.id === 'galeria' ? mi.puntos * M.premioPorBlanco : mi.id === 'bolera' ? mi.puntos * M.premioPorPino : M.premio;
    if (mi.id === 'arena') { estadoLote(dentro.idx).usado = true; for (const z of zs.filter(z => z.zona === dentro.idx && !z.muerto)) danarZombi(z, 99999); }
    gana = Math.round(gana * amb_('premios')); P.dinero += gana; avisar(`Fin del juego: ganaste ${gana} $`); Snd.tocar('coins.mp3', 0.7);
  }

  // ================= niveles =================
  let salidaPos = null, salidaG = null;
  function prepararNivel(nuevo) {
    if (nuevo || P.guarida < 0 || !ciudad.lotes[P.guarida]) {
      const ini = { x: ciudad.ancho / 2, z: ciudad.fondo };
      const cand = ciudad.lotes.map((l, i) => ({ l, i })).filter(o => ['comun', 'casa'].includes(o.l.ed.cat) && o.l.ed.id !== 'bunker' && o.l.tam !== 'A')
        .sort((a, b) => Math.hypot(b.l.cx - ini.x, b.l.cz - ini.z) - Math.hypot(a.l.cx - ini.x, a.l.cz - ini.z));
      P.guarida = cand.length ? cand[Math.floor(Math.random() * Math.min(3, cand.length))].i : 0;
      const llaves = ciudad.lotes.map((l, i) => ({ l, i })).filter(o => o.l.ed.cat === 'comun' && o.i !== P.guarida);
      P.llaveLote = llaves.length ? escoger(llaves).i : -1;
    }
    // el vehículo de salida espera donde empezaste
    if (salidaG) escena.remove(salidaG);
    salidaG = new THREE.Group(); escena.add(salidaG);
    const col = { pueblo: 0x8a3a2a, barrio: 0xe0b020, centro: 0x3a5a8a, puerto: 0x3a6a8a, hospital: 0xd8d8d8, feria: 0xa03a8a }[ciudad.mapa.id];
    caja(salidaG, 0, 1.1, 0, 2.4, 1.6, 5, mat(col)); caja(salidaG, 0, 2.2, -0.6, 2.2, 0.9, 2.6, mat(0x223038));
    for (const [x, z] of [[-1.2, 1.6], [1.2, 1.6], [-1.2, -1.6], [1.2, -1.6]]) caja(salidaG, x, 0.4, z, 0.3, 0.8, 0.8, mat(0x111111));
    const x = Math.round(ciudad.mapa.w / 2) * PASO + D.calle / 2 + 0.1, z = ciudad.fondo - D.calle / 2;
    salidaG.position.set(x - 12, 0, z); salidaG.rotation.y = Math.PI / 2;
    salidaPos = { x: x - 12, z };
  }
  function siguienteNivel() {
    if (P.nivel >= JG.niveles) return fin('victoria');
    estado = 'panel'; gatillo = false; if (document.exitPointerLock) document.exitPointerLock();
    P.vac = P.vac.filter(v => v.quedan != null); // los efectos «de todo el nivel» se acaban
    const sig = P.nivel + 1;
    $('#panel-titulo').textContent = `Nivel ${P.nivel} superado`;
    $('#panel-cuerpo').innerHTML = `<p class="nota">Venciste a ${JG.pacientes[P.nivel - 1].nombre}.</p><p class="nota"><b>Poderes:</b> ${P.poderes.map(p => p.nombre).join(', ') || 'ninguno'}<br><b>Dinero:</b> ${P.dinero} $ · <b>Balas:</b> ${P.balas}<br><b>Vacunas:</b> ${P.bolsillo.map(v => JG.vacunas[v].nombre).join(', ') || 'ninguna'}</p><button class="btn principal" id="btn-sig">Ir al nivel ${sig}</button>`;
    pintarDineroPanel(); $('#panel').classList.add('ver'); $('#panel-cerrar').style.display = 'none';
    $('#btn-sig').onclick = () => {
      $('#panel').classList.remove('ver'); $('#panel-cerrar').style.display = '';
      P.nivel = sig; P.pistas = 0; P.pistaCentro = null; P.vencido = false; P.lotes = {}; P.tNivel = 0; P.llave = false; P.guarida = -1;
      if (per().balasNivel) P.balas += per().balasNivel;
      for (const z of zs.slice()) quitarZombi(z);
      for (const r of recogibles.slice()) { escena.remove(r.m); recogibles.splice(recogibles.indexOf(r), 1); }
      const semilla = (ciudad.semilla * 31 + sig * 977) % 90000 + 10000;
      prepararCiudad(semilla, mapaDelNivel(semilla, sig), sig);
      ciudad.enJuego = true; prepararNivel(true); estado = 'jugar'; guardar();
      avisar(`Nivel ${sig}: ${ciudad.mapa.nombre}. Busca al Paciente Cero ${sig}`);
      if (!TACTIL && lienzo.requestPointerLock) lienzo.requestPointerLock();
    };
  }

  // ================= fin de la partida =================
  function fin(como) {
    if (estado === 'fin' || !P) return;
    if (dentro) { dentro.trampa = false; salir(); }
    estado = 'fin'; gatillo = false; if (document.exitPointerLock) document.exitPointerLock();
    let rec = null; try { rec = JSON.parse(localStorage.getItem('pc_record')); } catch (e) { rec = null; }
    const yo = { nivel: P.nivel, pacientes: P.pacientes, explorados: P.explorados, muertes: P.muertes };
    const mejor = !rec || yo.pacientes > rec.pacientes || (yo.pacientes === rec.pacientes && yo.explorados > rec.explorados);
    try { if (mejor) localStorage.setItem('pc_record', JSON.stringify(yo)); localStorage.removeItem(CLAVE); } catch (e) { /* sin espacio o modo privado */ }
    const titulo = { victoria: '¡Ganaste! La ciudad está a salvo', muerto: 'Caíste… y te convertiste en zombi', convertido: 'La infección te convirtió en zombi' }[como];
    $('#fin-titulo').textContent = titulo;
    $('#fin-txt').innerHTML = `Nivel alcanzado: <b>${P.nivel}</b> · Pacientes Cero vencidos: <b>${P.pacientes}</b><br>Edificios explorados: <b>${P.explorados}</b> · Zombis eliminados: <b>${P.muertes}</b>${mejor ? '<br><b>¡Nuevo récord!</b>' : `<br>Tu récord: ${rec.pacientes} pacientes y ${rec.explorados} edificios`}`;
    $('#fin').classList.add('ver'); $('#hud').classList.remove('ver'); $('#hud-juego').classList.remove('ver');
    Snd.tocar(como === 'victoria' ? 'jingle_buy.mp3' : 'jingle_boss.mp3', 0.8, como === 'victoria' ? 1 : 0.7);
    P = null; ciudad.enJuego = false; for (const z of zs.slice()) quitarZombi(z); armarVista();
    for (const r of recogibles.slice()) { escena.remove(r.m); recogibles.splice(recogibles.indexOf(r), 1); }
    if (salidaG) { escena.remove(salidaG); salidaG = null; }
  }

  // ================= controles =================
  let corriendo = false, ojo = 0, cansado = false, seMueve = false;
  function habilidad() { if (!P || P.habilidad < 1 || ojo > 0) return; P.habilidad = 0; ojo = JG.jugador.habilidad.dura; avisar('Ojo muerto: los zombis van más lentos'); Snd.tocar('jingle_item.mp3', 0.6, 0.7); }
  addEventListener('keydown', e => {
    if (!P || estado !== 'jugar') return;
    if (e.code === 'KeyR') empezarRecarga();
    if (e.code === 'KeyE' || e.code === 'KeyF') usar();
    if (e.code === 'KeyV') usarVacuna(0);
    if (e.code === 'KeyQ') habilidad();
    if (e.code === 'Digit1') cambiarArma(0); if (e.code === 'Digit2') cambiarArma(1);
  });
  addEventListener('mousedown', e => { if (e.button === 0 && bloqueado && P) { gatillo = true; disparar(); } });
  addEventListener('mouseup', e => { if (e.button === 0) gatillo = false; });
  addEventListener('wheel', () => { if (bloqueado && P && estado === 'jugar') cambiarArma(); });
  function boton(sel, f, suelta) {
    const b = $(sel);
    b.addEventListener('touchstart', e => { e.preventDefault(); e.stopPropagation(); Snd.iniciar(); f(); }, { passive: false });
    if (suelta) { b.addEventListener('touchend', e => { e.preventDefault(); suelta(); }); b.addEventListener('touchcancel', () => suelta()); }
    b.addEventListener('click', () => { if (!TACTIL) f(); });
  }
  boton('#btn-disparar', () => { gatillo = true; disparar(); }, () => { gatillo = false; });
  boton('#btn-recargar', () => P && empezarRecarga());
  boton('#btn-usar', usar);
  boton('#btn-hab', habilidad);
  boton('#btn-cambiar', () => P && cambiarArma());
  $('#vacunas').addEventListener('click', e => { const b = e.target.closest('[data-v]'); if (b && P && estado === 'jugar') usarVacuna(+b.dataset.v); });
  $('#panel-cerrar').addEventListener('click', cerrarPanel);
  $('#panel-cuerpo').addEventListener('click', e => { const b = e.target.closest('[data-a]'); if (b && !b.disabled) comprar(b.dataset.a); const c = e.target.closest('[data-c]'); if (c && !c.disabled) jugadaTres(+c.dataset.c); });
  $('#btn-fin').addEventListener('click', () => { $('#fin').classList.remove('ver'); mostrarInicio(); });

  // ================= HUD =================
  let cuentaHud = 0;
  function pintarHud() {
    const a = arma(), m = MODELS[a.id];
    const barra = (id, v, max) => { $(id).style.width = limitar(v / max * 100, 0, 100) + '%'; };
    barra('#b-vida i', P.vida, vidaMax()); $('#b-vida span').textContent = `Vida ${Math.max(0, Math.ceil(P.vida))}`;
    barra('#b-est i', P.estamina, estaminaMax()); $('#b-est span').textContent = cansado ? 'Cansado' : 'Estamina';
    barra('#b-inf i', P.infeccion, 100); $('#b-inf span').textContent = `Infección ${Math.floor(P.infeccion)} %`;
    $('#b-inf i').style.background = P.infeccion < 50 ? '#5ad05a' : P.infeccion < 75 ? '#e0c040' : '#e04040';
    $('#dinero').textContent = `${P.dinero} $`;
    $('#municion').innerHTML = `<b>${a.tambor}</b> / ${m.cap} <small>· ${P.balas} en la caja</small><br><small>${m.name}${a.nivel > 1 ? ' · nivel ' + a.nivel : ''}${recarga > 0 ? ' · recargando' : ''}</small>`;
    $('#vacunas').innerHTML = [0, 1, 2].map(i => { const v = P.bolsillo[i]; return v ? `<button data-v="${i}" style="--c:${JG.vacunas[v].color}" aria-label="Usar ${JG.vacunas[v].nombre}"><i></i><span>${JG.vacunas[v].nombre.replace('Vacuna ', '').replace('Suero del Paciente Cero', 'Suero')}</span></button>` : '<button disabled><i></i><span>vacío</span></button>'; }).join('');
    $('#pistas').textContent = P.vencido ? `Paciente Cero ${P.nivel} vencido: ve a la salida (${ciudad.mapa.salida})` : `Nivel ${P.nivel} · Pistas: ${P.pistas} de 3${guaridaAbierta() ? ' · guarida abierta' : ` · la guarida se abre sola en ${Math.ceil((JG.pistas.guaridaAbreEn - P.tNivel) / 60)} min`}`;
    $('#btn-hab').classList.toggle('lista', P.habilidad >= 1); $('#btn-hab').style.setProperty('--p', Math.round(P.habilidad * 100) + '%');
    $('#btn-cambiar').style.display = P.armas.length > 1 ? '' : 'none';
    const jefe = zs.find(z => z.jefe && !z.muerto && z.zona === zonaActual());
    $('#jefe').style.display = jefe ? 'block' : 'none';
    if (jefe) { $('#jefe span').textContent = jefe.nombre; $('#jefe i').style.width = limitar(jefe.vida / jefe.vidaMax * 100, 0, 100) + '%'; }
    $('#efecto-vac').textContent = [...P.vac.map(v => v.nombre + (v.quedan ? ` (${Math.ceil(v.quedan)} s)` : '')), ...P.poderes.map(p => p.nombre)].join(' · ');
  }

  // ================= ciclo =================
  function actualizar(dt) {
    if (!P) return;
    if (estado !== 'jugar') { gatillo = false; return; }
    P.tNivel += dt;
    const gasto = JG.jugador.gastoCorrer * amb_('estaminaGasto') * (etapa().estaminaGasto || 1);
    if (corriendo) { P.estamina -= gasto * dt; if (P.estamina <= 0) { P.estamina = 0; cansado = true; } }
    else P.estamina = Math.min(estaminaMax(), P.estamina + JG.jugador.recuperaEstamina * dt);
    if (cansado && P.estamina > 20) cansado = false;
    if (P.infeccion > 0) { P.infeccion += JG.infeccion.subeSola / JG.infeccion.cadaSegundos * dt * amb_('infeccionSola') * mult('infeccionSola'); if (P.infeccion >= 100) { P.infeccion = 100; return fin('convertido'); } }
    for (const v of P.vac.slice()) if (v.quedan != null) { v.quedan -= dt; if (v.quedan <= 0) P.vac.splice(P.vac.indexOf(v), 1); }
    if (ojo > 0) ojo -= dt;
    cd -= dt; if (recarga > 0) { recarga -= dt; if (recarga <= 0) terminarRecarga(); }
    if (gatillo && MODELS[arma().id].auto) disparar();
    for (const h of manos) {
      h.patada = Math.max(0, h.patada - dt * 6); h.k.position.z = h.patada * 0.06; h.k.rotation.x = h.patada * 0.25;
      if (h.fl > 0) { h.fl -= dt; if (h.fl <= 0) { h.flash.visible = false; h.flashLight.intensity = 0; } }
      h.root.position.y = -0.135 - (recarga > 0 ? 0.08 : 0) + Math.sin(cadaPaso * 2) * 0.006;
      h.root.rotation.x = recarga > 0 ? 0.6 : 0;
      if (h.cylSpin && recarga > 0) h.cylSpin.rotation.z += dt * 10;
    }
    for (const t of trazos.slice()) { t.t -= dt; if (t.crece) t.m.scale.multiplyScalar(1 + dt * 4); if (t.t <= 0) { escena.remove(t.m); trazos.splice(trazos.indexOf(t), 1); } }
    zombisCalle(dt); actualizarZombis(dt); actualizarProys(dt); actualizarRecogibles(dt); actualizarMini3D(dt);
    if (!P) return; // la partida pudo terminar en este cuadro
    if (seMueve) { const antes = cadaPaso; cadaPaso += dt * (corriendo ? 9 : 6); if (Math.floor(cadaPaso / Math.PI) !== Math.floor(antes / Math.PI)) Snd.uno('step_concrete', 3, '.mp3', 0.22, rnd(0.9, 1.1)); }
    rojo = Math.max(0, rojo - dt * 2);
    $('#velo').style.opacity = rojo * 0.6; $('#verdoso').style.opacity = limitar((P.infeccion - 20) / 100, 0, 0.6);
    $('#ojo').style.opacity = ojo > 0 ? 0.5 : 0;
    if (P.infeccion >= 75 && Math.random() < dt * 0.4) J.giro += rnd(-0.03, 0.03);
    if (++cuentaHud % 6 === 0) { buscarCercano(); pintarHud(); }
  }
  // lo usa el movimiento del jugador (index.html)
  function velocidad(quiereCorrer, mueve) {
    seMueve = mueve;
    if (!P) return quiereCorrer ? D.jugador.correr : 1;
    corriendo = quiereCorrer && mueve && !cansado && P.estamina > 0;
    return (corriendo ? D.jugador.correr : 1) * mult('velocidad');
  }

  // ================= mapa: pistas, guarida, salida y zombis =================
  function dibujarMapa(g, esc, ox, oy, grande, px1) {
    if (!P) return;
    if (P.poderes.some(p => (p.efecto || {}).olfato)) for (const l of ciudad.lotes) if (['casa', 'raro'].includes(l.ed.cat) && !estadoLote(ciudad.lotes.indexOf(l)).visto) { g.fillStyle = 'rgba(255,220,80,.35)'; g.fillRect(ox + l.x0 * esc, oy + l.z0 * esc, l.ancho * esc, l.fondo * esc); }
    if (P.pistaCentro && P.pistas < 3 && !P.vencido) { g.strokeStyle = '#ff8a1f'; g.lineWidth = 3 * px1; g.setLineDash([8 * px1, 6 * px1]); g.beginPath(); g.arc(ox + P.pistaCentro.x * esc, oy + P.pistaCentro.z * esc, P.pistaCentro.r * esc, 0, 6.29); g.stroke(); g.setLineDash([]); }
    if (P.pistas >= 3 && !P.vencido && ciudad.lotes[P.guarida]) {
      const l = ciudad.lotes[P.guarida]; g.strokeStyle = '#ff3030'; g.lineWidth = 4 * px1; g.strokeRect(ox + l.x0 * esc, oy + l.z0 * esc, l.ancho * esc, l.fondo * esc);
      if (grande) { g.fillStyle = '#ff6060'; g.font = `700 ${15 * px1}px system-ui`; g.textAlign = 'center'; const tw = g.measureText('PACIENTE CERO').width / 2 + 4; g.fillText('PACIENTE CERO', limitar(ox + l.cx * esc, tw, g.canvas.width - tw), Math.max(18 * px1, oy + l.z0 * esc - 6 * px1)); }
    }
    if (P.vencido && salidaPos) { g.fillStyle = '#9be37a'; g.beginPath(); g.arc(ox + salidaPos.x * esc, oy + salidaPos.z * esc, 7 * px1, 0, 6.29); g.fill(); if (grande) { g.font = `700 ${15 * px1}px system-ui`; g.textAlign = 'center'; g.fillText('SALIDA', ox + salidaPos.x * esc, oy + salidaPos.z * esc - 12 * px1); } }
    if (!dentro) { g.fillStyle = '#ff4040'; for (const z of zs) if (!z.muerto && z.zona === -1 && z.estado === 'persigue') { g.beginPath(); g.arc(ox + z.x * esc, oy + z.z * esc, 2.5 * px1, 0, 6.29); g.fill(); } }
  }

  // ================= guardar, cargar y empezar =================
  function guardado() { return P ? { P: JSON.parse(JSON.stringify(P)), afuera: dentro ? afuera : null } : null; }
  function limpiar() {
    for (const z of zs.slice()) quitarZombi(z);
    for (const r of recogibles.slice()) { escena.remove(r.m); recogibles.splice(recogibles.indexOf(r), 1); }
    cd = 0; recarga = 0; gatillo = false; ojo = 0; cansado = false;
  }
  function cargar(g) {
    limpiar(); P = Object.assign(jugadorNuevo(g.P.per), g.P); KI.setChar(P.per);
    if (g.afuera) { J.x = g.afuera.x; J.z = g.afuera.z; }
    prepararNivel(false); armarVista(); mostrarHud();
    avisar(`Seguimos: nivel ${P.nivel}, ${ciudad.mapa.nombre}`);
  }
  function nuevaPartida(perId) {
    limpiar(); P = jugadorNuevo(perId); KI.setChar(perId);
    prepararNivel(true); armarVista(); mostrarHud();
    avisar(`Nivel 1: ${ciudad.mapa.nombre}. Busca pistas del Paciente Cero: minijefes, radios y el jefe de habitación`);
  }
  function mostrarHud() { $('#hud-juego').classList.add('ver'); pintarHud(); buscarCercano(); }
  function salirAlInicio() { if (dentro) { dentro.trampa = false; if (dentro.mini) terminarMini3D(false); salir(); } $('#hud-juego').classList.remove('ver'); limpiar(); P = null; armarVista(); if (salidaG) { escena.remove(salidaG); salidaG = null; } }
  function elegirPersonaje(alElegir) {
    let elegido = null;
    $('#personajes').innerHTML = Object.entries(JG.personajes).map(([id, p]) => `<button class="pj" data-p="${id}"><img src="img/${id}.webp" alt=""><b>${p.nombre}</b><small>${MODELS[p.arma].name}</small><small class="vent">${p.ventaja}</small></button>`).join('');
    $('#btn-empezar').disabled = true;
    $('#personajes').onclick = e => { const b = e.target.closest('[data-p]'); if (!b) return; elegido = b.dataset.p; document.querySelectorAll('.pj').forEach(x => x.classList.toggle('activo', x === b)); $('#btn-empezar').disabled = false; Snd.iniciar(); Snd.tocar('metalLatch.mp3', 0.5); };
    $('#btn-empezar').onclick = () => { if (!elegido) return; Snd.iniciar(); $('#elegir').classList.remove('ver'); alElegir(elegido); };
    $('#btn-volver-pj').onclick = () => { $('#elegir').classList.remove('ver'); $('#inicio').classList.add('ver'); };
    $('#inicio').classList.remove('ver'); $('#elegir').classList.add('ver');
  }

  return {
    actualizar, velocidad, dibujarMapa, guardado, cargar, nuevaPartida, elegirPersonaje, salirAlInicio, Snd,
    posMapa: () => afuera || J,
    get activo() { return !!P; }, get dentro() { return dentro; }, get P() { return P; }, zs,
    _prueba: { entrar, salir, disparar, crearZombi, golpearJugador, darPista, usarVacuna, abrirTienda, comprar, fin, siguienteNivel, matarZombi, danarZombi, abrirMini, jugadaTres, usar, buscarCercano, manos, objetivos, recogibles, get cercano() { return cercano; }, get salidaPos() { return salidaPos; } }
  };
})();
