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
  rellenos: ['parque', 'baldio', 'carros', 'barricada']
};
