// Todas las cifras de Paciente Cero viven aquí (ver DISENO.md).
// Cambiar un número en este archivo cambia el juego sin tocar el resto del código.
window.DATOS = {
  // medidas en metros
  lote: 12,
  calle: 6,

  jugador: { velocidad: 5.2, correr: 1.75, alto: 1.7, radio: 0.45, verDesde: 28, puertaCerca: 5 },

  // cuántos lotes ocupa cada tamaño (ancho x fondo)
  tamanos: { A: [1, 1], B: [2, 1], C: [2, 2], D: [3, 3] },

  // altura estándar: cada piso mide lo mismo; cada edificio dice cuántos pisos tiene [mínimo, máximo]
  altoPiso: 3.2,
  pretil: 0.4, // borde del techo

  // los 6 tipos de mapa: cuadrícula ancho x fondo y cuántos lotes de cada tamaño
  mapas: [
    { id: 'pueblo', nombre: 'Pueblo', w: 7, h: 6, lotes: { A: 10, B: 4, C: 2, D: 1 }, nivel: 1, salida: 'Camioneta',
      cielo: 0xe8a06a, niebla: 0xd29068, nieblaLejos: 150, luz: 1.0, sol: 0xffc890, calle: 0x6e5c44, acera: 0x8a7656, relleno: 0x6f7a3e },
    { id: 'barrio', nombre: 'Barrio', w: 7, h: 7, lotes: { A: 14, B: 6, C: 3, D: 1 }, nivel: 1, salida: 'Autobús escolar',
      cielo: 0x1c2a4a, niebla: 0x22304e, nieblaLejos: 120, luz: 0.55, sol: 0x9fb4ff, calle: 0x34373c, acera: 0x6d6f73, relleno: 0x3f6a34 },
    { id: 'centro', nombre: 'Centro', w: 8, h: 8, lotes: { A: 8, B: 8, C: 4, D: 2 }, nivel: 2, salida: 'Entrada del metro',
      cielo: 0x5a6470, niebla: 0x5e6874, nieblaLejos: 110, luz: 0.7, sol: 0xd8e2ee, calle: 0x2c2e31, acera: 0x7b7d80, relleno: 0x4d5a40 },
    { id: 'puerto', nombre: 'Zona industrial y puerto', w: 8, h: 7, lotes: { A: 4, B: 5, C: 5, D: 2 }, nivel: 2, salida: 'Lancha',
      cielo: 0x8c9498, niebla: 0x9aa2a6, nieblaLejos: 75, luz: 0.75, sol: 0xe6eef0, calle: 0x3e3f3d, acera: 0x5f605c, relleno: 0x5b5446 },
    { id: 'hospital', nombre: 'Hospital y universidad', w: 7, h: 8, lotes: { A: 6, B: 7, C: 4, D: 2 }, nivel: 3, salida: 'Helicóptero en la azotea',
      cielo: 0x141c2a, niebla: 0x1a2232, nieblaLejos: 105, luz: 0.5, sol: 0xb8d0ff, calle: 0x30343a, acera: 0x8d949c, relleno: 0x355a3a },
    { id: 'feria', nombre: 'Feria abandonada', w: 7, h: 7, lotes: { A: 12, B: 6, C: 3, D: 1 }, nivel: 2, salida: 'Tren de la feria',
      cielo: 0x2a1838, niebla: 0x34203f, nieblaLejos: 115, luz: 0.6, sol: 0xffb0e0, calle: 0x4a3b2c, acera: 0x6e5a44, relleno: 0x4a5a2c }
  ],

  // qué mapas pueden tocar en cada nivel
  mapasPorNivel: { 1: ['pueblo', 'barrio'], 2: ['centro', 'puerto', 'feria'], 3: ['hospital'] },

  // grupos de edificios: nombre y colores (pared, techo, letrero)
  categorias: {
    comun: { nombre: 'Común', pared: 0x8e8778, techo: 0x4a4540, letrero: '#d9d2c2' },
    tienda: { nombre: 'Tienda', pared: 0x9a6a3c, techo: 0x5a3418, letrero: '#ffb347' },
    casa: { nombre: 'Casa con objetos', pared: 0x6f8a62, techo: 0x34452c, letrero: '#a8e08c' },
    minijuego: { nombre: 'Minijuego', pared: 0x6a4a8a, techo: 0x3a2850, letrero: '#e09cff' },
    raro: { nombre: 'Edificio raro', pared: 0x55606a, techo: 0x2a3036, letrero: '#9cd8ff' },
    minijefe: { nombre: 'Minijefe', pared: 0x8a5048, techo: 0x4a2420, letrero: '#ff9c8c' },
    jefe: { nombre: 'Jefe de habitación', pared: 0x7a2a2a, techo: 0x3a1010, letrero: '#ff6060' }
  },

  // qué tan seguido sale cada edificio (peso para el sorteo)
  frecuencia: { comun: 6, normal: 3, raro: 1 },

  // los 40 edificios (DISENO.md, sección 4). frec: comun | normal | raro | siempre
  edificios: [
    { id: 'casa', n: 1, nombre: 'Casa abandonada', cat: 'comun', lote: 'A', frec: 'comun', pisos: [1, 2], peligro: 1 },
    { id: 'garaje', n: 2, nombre: 'Garaje', cat: 'comun', lote: 'A', frec: 'comun', pisos: [1, 1], peligro: 2 },
    { id: 'kiosco', n: 3, nombre: 'Kiosco', cat: 'comun', lote: 'A', frec: 'comun', pisos: [1, 1], peligro: 1 },
    { id: 'lavanderia', n: 4, nombre: 'Lavandería', cat: 'comun', lote: 'A', frec: 'comun', pisos: [1, 1], peligro: 2 },
    { id: 'banos', n: 5, nombre: 'Baños públicos', cat: 'comun', lote: 'A', frec: 'normal', pisos: [1, 1], peligro: 2 },
    { id: 'parada', n: 6, nombre: 'Parada de autobús', cat: 'comun', lote: 'A', frec: 'comun', pisos: [1, 1], peligro: 1 },
    { id: 'cafeteria', n: 7, nombre: 'Cafetería', cat: 'comun', lote: 'A', frec: 'comun', pisos: [1, 1], peligro: 1 },
    { id: 'oficina', n: 8, nombre: 'Oficina', cat: 'comun', lote: 'B', frec: 'comun', pisos: [2, 3], peligro: 2 },
    { id: 'escuela', n: 9, nombre: 'Escuela', cat: 'comun', lote: 'B', frec: 'normal', pisos: [2, 2], peligro: 3 },
    { id: 'apartamentos', n: 10, nombre: 'Edificio de apartamentos', cat: 'comun', lote: 'B', frec: 'comun', pisos: [3, 3], peligro: 3 },
    { id: 'restaurante', n: 11, nombre: 'Restaurante', cat: 'comun', lote: 'B', frec: 'normal', pisos: [1, 1], peligro: 2 },
    { id: 'super', n: 12, nombre: 'Supermercado saqueado', cat: 'comun', lote: 'C', frec: 'normal', pisos: [1, 1], peligro: 3 },
    { id: 'iglesia', n: 13, nombre: 'Iglesia', cat: 'comun', lote: 'C', frec: 'normal', pisos: [1, 1], peligro: 2 },
    { id: 'estacionamiento', n: 14, nombre: 'Estacionamiento', cat: 'comun', lote: 'C', frec: 'normal', pisos: [2, 2], peligro: 3 },

    { id: 'armeria', n: 15, nombre: 'Armería', cat: 'tienda', lote: 'B', frec: 'siempre', pisos: [1, 1], peligro: 0 },
    { id: 'farmacia', n: 16, nombre: 'Farmacia', cat: 'tienda', lote: 'A', frec: 'siempre', pisos: [1, 1], peligro: 0 },
    { id: 'delivery', n: 17, nombre: 'Apocalipsis Delivery', cat: 'tienda', lote: 'A', frec: 'siempre', pisos: [1, 1], peligro: 0 },
    { id: 'ferreteria', n: 18, nombre: 'Ferretería', cat: 'tienda', lote: 'B', frec: 'comun', pisos: [1, 1], peligro: 0 },
    { id: 'mercado', n: 19, nombre: 'Mercado negro', cat: 'tienda', lote: 'A', frec: 'raro', pisos: [1, 1], peligro: 1 },
    { id: 'herrero', n: 20, nombre: 'Taller del herrero', cat: 'tienda', lote: 'B', frec: 'normal', pisos: [1, 1], peligro: 0 },

    { id: 'medico', n: 21, nombre: 'Casa del médico', cat: 'casa', lote: 'A', frec: 'normal', pisos: [2, 2], peligro: 2 },
    { id: 'cazador', n: 22, nombre: 'Casa del cazador', cat: 'casa', lote: 'A', frec: 'normal', pisos: [1, 1], peligro: 2 },
    { id: 'bunker', n: 23, nombre: 'Búnker', cat: 'casa', lote: 'B', frec: 'raro', pisos: [1, 1], peligro: 3 },
    { id: 'mansion', n: 24, nombre: 'Mansión', cat: 'casa', lote: 'C', frec: 'raro', pisos: [2, 2], peligro: 4 },
    { id: 'coleccionista', n: 25, nombre: 'Casa del coleccionista', cat: 'casa', lote: 'B', frec: 'raro', pisos: [2, 2], peligro: 2 },

    { id: 'casino', n: 26, nombre: 'Zombie Casino', cat: 'minijuego', lote: 'C', frec: 'normal', pisos: [2, 2], peligro: 2 },
    { id: 'tresenraya', n: 27, nombre: 'Tres en raya zombi', cat: 'minijuego', lote: 'B', frec: 'normal', pisos: [1, 1], peligro: 2 },
    { id: 'galeria', n: 28, nombre: 'Galería de tiro', cat: 'minijuego', lote: 'B', frec: 'normal', pisos: [1, 1], peligro: 1 },
    { id: 'zafira', n: 29, nombre: 'Carpa de Madame Zafira', cat: 'minijuego', lote: 'A', frec: 'normal', pisos: [1, 1], peligro: 1 },
    { id: 'bolera', n: 30, nombre: 'Bolera zombi', cat: 'minijuego', lote: 'B', frec: 'raro', pisos: [1, 1], peligro: 2 },
    { id: 'garra', n: 31, nombre: 'Máquina de la garra', cat: 'minijuego', lote: 'A', frec: 'comun', pisos: [1, 1], peligro: 1 },
    { id: 'arena', n: 32, nombre: 'Arena de pelea', cat: 'minijuego', lote: 'C', frec: 'raro', pisos: [2, 2], peligro: 4 },

    { id: 'almacen', n: 33, nombre: 'Almacén sellado', cat: 'raro', lote: 'B', frec: 'normal', pisos: [1, 1], peligro: 2 },
    { id: 'contenedor', n: 34, nombre: 'Contenedor militar', cat: 'raro', lote: 'A', frec: 'raro', pisos: [1, 1], peligro: 2 },
    { id: 'boveda', n: 35, nombre: 'Bóveda del banco', cat: 'raro', lote: 'C', frec: 'raro', pisos: [2, 2], peligro: 3 },

    { id: 'comisaria', n: 36, nombre: 'Comisaría', cat: 'minijefe', lote: 'C', frec: 'normal', pisos: [2, 2], peligro: 4 },
    { id: 'bomberos', n: 37, nombre: 'Estación de bomberos', cat: 'minijefe', lote: 'C', frec: 'normal', pisos: [2, 2], peligro: 4 },
    { id: 'gimnasio', n: 38, nombre: 'Gimnasio', cat: 'minijefe', lote: 'B', frec: 'normal', pisos: [1, 1], peligro: 4 },
    { id: 'laboratorio', n: 39, nombre: 'Laboratorio', cat: 'jefe', lote: 'D', frec: 'normal', pisos: [3, 3], peligro: 5 },
    { id: 'hospital', n: 40, nombre: 'Hospital', cat: 'jefe', lote: 'D', frec: 'normal', pisos: [4, 4], peligro: 5 }
  ],

  // reglas de reparto (DISENO.md, sección 3.4)
  reglas: {
    siempre: ['armeria', 'farmacia', 'delivery'],
    alMenosUno: ['minijuego', 'casa', 'raro'],
    minijefesPorNivel: { 1: 1, 2: 2, 3: 3 },
    distanciaEntreTiendas: 2 // en lotes
  },

  // lotes sin edificio
  rellenos: ['parque', 'baldio', 'carros', 'barricada'],

  // ---------- ambiente: hora del día y clima (DISENO.md, sección 3.7) ----------
  // Los efectos solo cambian números. Cada efecto es un multiplicador (1 = normal):
  //   vista: hasta dónde ves · zombiVelocidad · zombiCantidad · zombiDano · zombisDormidos
  //   infeccionGolpe: infección por golpe · infeccionSola: lo que sube sola · estaminaGasto
  //   ruidoDisparo: desde qué distancia tus disparos atraen zombis · deteccion: desde dónde te notan
  //   dinero · premios
  ambiente: {
    duracionDia: 960,        // segundos de juego que dura un día completo (16 minutos)
    vistaBase: 150,          // metros que se ven con vista 1
    vistaMinima: 20,
    transicionClima: 25,     // segundos que tarda en cambiar el clima
    climaDura: [240, 360],   // segundos que dura cada clima
    mezclaColorMapa: 0.25,   // cuánto conserva el cielo el color propio de cada mapa

    // colores del cielo a lo largo del día (h = hora; noche: 0 de día, 1 de noche)
    horas: [
      { h: 0, cielo: 0x0b1020, luz: 0.32, sol: 0x7080b0, noche: 1 },
      { h: 5, cielo: 0x0f1428, luz: 0.32, sol: 0x7080b0, noche: 1 },
      { h: 6.5, cielo: 0xd89aa8, luz: 0.7, sol: 0xffc0b0, noche: 0.35 },
      { h: 8.5, cielo: 0x9cc8ec, luz: 1.1, sol: 0xfff4e0, noche: 0 },
      { h: 17, cielo: 0x9cc4e8, luz: 1.05, sol: 0xfff0d8, noche: 0 },
      { h: 19, cielo: 0xe88a50, luz: 0.75, sol: 0xffa060, noche: 0.25 },
      { h: 20.5, cielo: 0x141a30, luz: 0.34, sol: 0x7080b0, noche: 1 },
      { h: 24, cielo: 0x0b1020, luz: 0.32, sol: 0x7080b0, noche: 1 }
    ],

    // momentos del día: desde qué hora hasta qué hora y sus efectos
    momentos: [
      { id: 'amanecer', nombre: 'Amanecer', desde: 5, hasta: 8, efectos: { vista: 0.75, zombisDormidos: 2 },
        texto: 'Ves un poco menos · el doble de zombis dormidos' },
      { id: 'dia', nombre: 'Día', desde: 8, hasta: 18, efectos: { vista: 1, zombiVelocidad: 0.9, zombiCantidad: 0.8 },
        texto: 'Zombis 10 % más lentos y 20 % menos' },
      { id: 'atardecer', nombre: 'Atardecer', desde: 18, hasta: 20, efectos: { vista: 0.85 },
        texto: 'Normal' },
      { id: 'noche', nombre: 'Noche', desde: 20, hasta: 5, efectos: { vista: 0.5, zombiVelocidad: 1.15, zombiCantidad: 1.3, dinero: 1.25 },
        texto: 'Ves la mitad (linterna encendida) · zombis 15 % más rápidos y 30 % más · dinero +25 %' }
    ],

    // climas: peso = qué tan seguido sale; soloMapas = solo en esos mapas; color = tono del cielo
    climas: [
      { id: 'despejado', nombre: 'Despejado', peso: 4, efectos: {}, texto: 'Sin efecto',
        color: null, mezcla: 0, luz: 1, lluvia: 0 },
      { id: 'nublado', nombre: 'Nublado', peso: 3, efectos: { vista: 0.85 }, texto: 'Ves un 15 % menos',
        color: 0x7a8088, mezcla: 0.45, luz: 0.8, lluvia: 0 },
      { id: 'lluvia', nombre: 'Lluvia', peso: 2, efectos: { vista: 0.75, ruidoDisparo: 0.6, estaminaGasto: 1.1 },
        texto: 'Ves un 25 % menos · tus disparos atraen zombis desde un 40 % menos lejos · estamina −10 %',
        aviso: 'Empieza a llover: tus disparos se oyen menos', color: 0x5a6068, mezcla: 0.55, luz: 0.65, lluvia: 0.6 },
      { id: 'tormenta', nombre: 'Tormenta', peso: 1, efectos: { vista: 0.6, ruidoDisparo: 0.6 },
        texto: 'Ves un 40 % menos · los relámpagos lo iluminan todo · cada trueno atrae a los zombis cercanos',
        aviso: 'Se viene una tormenta: cuidado con los truenos', color: 0x30343c, mezcla: 0.7, luz: 0.5, lluvia: 1, rayos: [6, 14] },
      { id: 'niebla', nombre: 'Niebla', peso: 2, masEn: { puerto: 2 }, efectos: { vista: 0.4, deteccion: 0.6 },
        texto: 'Ves un 60 % menos · los zombis te notan desde un 40 % menos lejos',
        aviso: 'Baja la niebla: los zombis tampoco te ven bien', color: 0xb8bcc0, mezcla: 0.75, luz: 0.85, lluvia: 0 },
      { id: 'calor', nombre: 'Ola de calor', peso: 2, soloMapas: ['pueblo', 'puerto'], efectos: { estaminaGasto: 1.25, infeccionSola: 1.2 },
        texto: 'La estamina se gasta un 25 % más rápido · la infección sube sola un 20 % más rápido',
        aviso: 'Ola de calor: te cansas más rápido', color: 0xf0c870, mezcla: 0.35, luz: 1.1, lluvia: 0 }
    ],

    // evento raro: solo de noche
    lunaRoja: { nombre: 'Luna roja', prob: 0.05, efectos: { zombiDano: 1.25, infeccionGolpe: 1.5, premios: 2 },
      texto: 'Zombis pegan un 25 % más · los golpes infectan un 50 % más · todos los premios ×2',
      aviso: 'Sale la Luna roja: premios dobles, zombis furiosos', color: 0x6a1010, mezcla: 0.5 }
  },

  // ---------- jugabilidad (DISENO.md, secciones 2, 5, 6, 7 y 8) ----------
  juego: {
    niveles: 3,
    // personajes de Seis Balas con su arma y su ventaja en Paciente Cero
    personajes: {
      sheriff: { nombre: 'El Sheriff', arma: 'paci', ventaja: 'Justiciero: +10 % de daño y empieza con 12 balas más', dano: 1.1, balasExtra: 12 },
      johnny: { nombre: 'Johnny R.', arma: 'corto', ventaja: 'Gambler: +25 % de suerte en minijuegos y cajas', suerte: 1.25 },
      armando: { nombre: 'Don Velorio', arma: 'viejo', ventaja: 'Viejo zorro: una vez por partida se levanta con 30 % de vida', revivir: 0.3 },
      lilith: { nombre: 'Lilith', arma: 'uzi', ventaja: 'Hija de la noche: +30 % de estamina y ve mejor de noche', estamina: 1.3, vistaNoche: 1.3 },
      carlos: { nombre: 'Geronimo', arma: 'cowboy', ventaja: 'Dos revólveres de acero .44: dispara con los dos', dosManos: true },
      francois: { nombre: 'Françoise', arma: 'magnum', ventaja: 'Precavida: la infección le sube un 20 % más lento y recibe 12 balas al empezar cada nivel', infeccionSola: 0.8, balasNivel: 12 }
    },

    jugador: {
      vida: 100, estamina: 100,
      gastoCorrer: 16, recuperaEstamina: 20, // por segundo
      balasIniciales: 36, dineroInicial: 40,
      recargaBase: 1.5, // segundos de recarga con una recarga de 1
      bolsillo: 3, vacunasActivas: 2,
      habilidad: { nombre: 'Ojo muerto', muertesParaCargar: 18, dura: 5, lentitud: 0.35 }
    },

    infeccion: {
      golpe: 3, golpeFuerte: 6, escupitajo: 4,
      subeSola: 1, cadaSegundos: 20, // +1 % cada 20 s, si ya tienes algo de infección
      etapas: [
        { desde: 25, texto: 'La vista se pone verdosa' },
        { desde: 50, texto: 'La estamina se gasta más rápido', estaminaGasto: 1.3 },
        { desde: 75, texto: 'La vista tiembla y los zombis te notan de más lejos', deteccion: 1.3 }
      ]
    },

    // vacunas: baja = cuánto baja la infección; dura: 'nivel', 'partida' o segundos
    vacunas: {
      basica: { nombre: 'Vacuna básica', baja: 20, precio: 40, color: '#e8e8e8', texto: 'Baja la infección 20 %' },
      roja: { nombre: 'Vacuna roja', baja: 15, precio: 90, color: '#ff5a5a', dura: 'nivel', efecto: { vidaMax: 25 }, texto: '−15 % infección · +25 de vida máxima en este nivel' },
      azul: { nombre: 'Vacuna azul', baja: 15, precio: 90, color: '#5aa8ff', dura: 'nivel', efecto: { estaminaMax: 1.3, velocidad: 1.1 }, texto: '−15 % infección · +30 % estamina y corres más en este nivel' },
      amarilla: { nombre: 'Vacuna amarilla', baja: 15, precio: 90, color: '#ffd84a', dura: 'nivel', efecto: { recarga: 1.25 }, texto: '−15 % infección · recargas un 25 % más rápido en este nivel' },
      verde: { nombre: 'Vacuna verde', baja: 10, precio: 120, color: '#6ae06a', dura: 120, efecto: { inmune: 1 }, texto: '−10 % infección · 2 minutos sin infectarte' },
      negra: { nombre: 'Vacuna negra', baja: 40, precio: 70, color: '#3a3a3a', dura: 'nivel', efecto: { vidaMax: -15 }, texto: '−40 % infección · −15 de vida máxima en este nivel' },
      experimental: { nombre: 'Vacuna experimental', baja: 30, precio: 60, color: '#c070ff', dura: 'nivel', azar: true, texto: '−30 % infección · un efecto al azar, bueno o malo' },
      suero: { nombre: 'Suero del Paciente Cero', baja: 100, precio: 0, color: '#ff3a3a', dura: 'partida', efecto: { dano: 1.1 }, texto: 'Te cura toda la infección · +10 % de daño toda la partida' }
    },
    experimentales: [
      { texto: 'Te sientes fuerte: +15 % de daño', efecto: { dano: 1.15 } },
      { texto: 'Piernas ligeras: corres un 15 % más', efecto: { velocidad: 1.15 } },
      { texto: 'Mareo: −20 % de estamina', efecto: { estaminaMax: 0.8 } },
      { texto: 'Fiebre: la infección sube sola un 30 % más rápido', efecto: { infeccionSola: 1.3 } }
    ],

    // tiendas: qué vende cada una
    tiendas: {
      armeria: { titulo: 'Armería', ofertas: 4, precioArma: { paci: 120, corto: 120, viejo: 140, cowboy: 140, magnum: 260, uzi: 280, mp5: 300, ballesta: 320, jackpot: 220, minigun: 380, tesla: 400, bazuca: 400 } },
      farmacia: { titulo: 'Farmacia', vacunas: ['basica', 'roja', 'azul', 'amarilla'], botiquin: { precio: 30, cura: 40 } },
      delivery: { titulo: 'Apocalipsis Delivery', paquetes: [{ balas: 12, precio: 25 }, { balas: 36, precio: 65 }, { balas: 72, precio: 120 }] },
      ferreteria: { titulo: 'Ferretería', mejoras: { dano: { nombre: 'Cañón reforzado', texto: '+15 % de daño', precio: 70, valor: 1.15 }, recarga: { nombre: 'Cargador rápido', texto: 'Recarga 25 % más rápida', precio: 60, valor: 1.25 }, mira: { nombre: 'Mira', texto: 'Disparos un 40 % más precisos', precio: 60, valor: 0.6 } } },
      mercado: { titulo: 'Mercado negro', vacunas: ['verde', 'negra', 'experimental'], recargo: 1.2 },
      herrero: { titulo: 'Taller del herrero', nivelMax: 5, precioNivel: 90, danoNivel: 0.12 }
    },

    dinero: { zombi: [2, 5], minijefe: 60, jefe: 120, cajon: [5, 40] },

    // zombis
    zombis: {
      enCalle: { 1: 7, 2: 10, 3: 13 },          // cuántos andan por la calle a la vez
      porPeligro: 2,                             // zombis dentro de un edificio = peligro x esto (± 1)
      tiposCalle: { 1: ['walker', 'walker', 'walker', 'crawler', 'dog'], 2: ['walker', 'walker', 'runner', 'crawler', 'dog', 'spitter', 'copz'], 3: ['walker', 'runner', 'runner', 'spitter', 'copz', 'armored', 'bloater', 'dog'] },
      tiposDentro: { 1: ['walker', 'walker', 'crawler', 'runner'], 2: ['walker', 'runner', 'crawler', 'spitter', 'copz'], 3: ['walker', 'runner', 'spitter', 'armored', 'bloater', 'screamer'] },
      vidaPorNivel: [1, 1.25, 1.55], danoPorNivel: [1, 1.15, 1.3],
      notan: 16,        // metros desde los que te notan
      ruidoDisparo: 34, // metros a los que llega el ruido de un disparo
      fuertes: ['brute', 'bloater', 'saw', 'abom', 'boss', 'armored'],
      soltarBalas: 0.18, soltarDinero: 0.5,
      reaparecer: [6, 12]  // segundos entre zombis nuevos en la calle
    },

    // minijefes y jefes de habitación
    minijefes: {
      comisaria: { nombre: 'El Guardia de Seguridad', tipo: 'armored', escala: 1.5, vida: 900, dano: 22, velocidad: 1.8, escolta: ['copz', 'copz'] },
      bomberos: { nombre: 'El Pirómano', tipo: 'brute', look: 'Bombero', escala: 1.3, vida: 1000, dano: 24, velocidad: 1.5, escupe: true },
      gimnasio: { nombre: 'El Forzudo', tipo: 'brute', escala: 1.45, vida: 1100, dano: 28, velocidad: 1.7, embiste: true }
    },
    jefes: {
      laboratorio: { nombre: 'La Abominación', tipo: 'abom', escala: 1, vida: 2200, dano: 34, velocidad: 1.3 },
      hospital: { nombre: 'El Jefe de Planta', tipo: 'boss', look: 'Cirujano', escala: 1, vida: 2400, dano: 32, velocidad: 1.4 }
    },

    // los tres Pacientes Cero (DISENO.md, sección 5)
    pacientes: [
      { nombre: 'La Enfermera', tipo: 'walker', look: 'Enfermera', escala: 1.35, vida: 2600, dano: 18, velocidad: 3.2, jeringas: true, llama: 4,
        poder: { id: 'sangre', nombre: 'Sangre fuerte', texto: 'Tu infección sube un 25 % más lento', efecto: { infeccionSola: 0.75 } } },
      { nombre: 'El Mensajero', tipo: 'runner', look: 'Motociclista', escala: 1.3, vida: 3600, dano: 22, velocidad: 4.6, bombas: true, llama: 5,
        poder: { id: 'olfato', nombre: 'Olfato', texto: 'Los edificios con objetos brillan en el minimapa', efecto: { olfato: 1 } } },
      { nombre: 'El Primero', tipo: 'boss', escala: 1.25, vida: 6000, dano: 30, velocidad: 2.2, fases: 3, jeringas: true, llama: 6,
        poder: { id: 'victoria', nombre: 'Cura', texto: 'Ganaste la partida', efecto: {} } }
    ],
    pistas: { necesarias: 3, guaridaAbreEn: 600 }, // la guarida se abre sola a los 10 minutos del nivel

    // sorpresas en edificios comunes (DISENO.md, 4.7)
    sorpresas: { sobreviviente: 0.05, radio: 0.08, trampa: 0.06, dormido: 0.1, alijo: 0.04 },

    // edificios raros: cajas que se abren a balazos (disparos para abrir)
    cajas: { almacen: [3, 6, 12], contenedor: [18], boveda: [4, 8, 12] },

    // minijuegos
    minijuegos: {
      casino: { apuestas: [10, 25, 50], simbolos: ['Calavera', 'Bala', 'Vacuna', 'Moneda', 'Cerebro'], pagos: { tres: 8, dos: 1.5 } },
      tresenraya: { premio: 60, horda: 6 },
      galeria: { costo: 15, segundos: 20, blancos: 14, premioPorBlanco: 6 },
      zafira: { costo: 20 },
      bolera: { costo: 15, pinos: 8, premioPorPino: 8 },
      garra: { costo: 10, prob: 0.35 },
      arena: { segundos: 60, premio: 150 }
    }
  }
};
