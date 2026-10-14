# Paciente Cero — Diseño completo (Seis Balas C)

Versión 1 · 14 de octubre de 2026 · Aprobado por el dueño el 14-10-2026.

Todas las cifras de este documento son **propuestas**. En el juego vivirán en un solo archivo de números para poder cambiarlas sin tocar el código.

---

## 1. La idea en una frase

Recorres una ciudad que cambia en cada partida, entras a sus edificios a buscar armas, vacunas y pistas, y das caza a los tres **Pacientes Cero** antes de que la infección te convierta en zombi.

**Decisiones ya tomadas (14-10-2026):**
- Es un juego aparte, con su propia dirección en internet. Seis Balas B queda guardado tal cual.
- Se juega en **primera persona**, como Seis Balas.
- Si te conviertes en zombi: **en grupo te unes a la horda contra tus compañeros; jugando solo, termina la partida**.
- Primero se escribe todo el diseño (este documento) y después se programa.

**Qué se reutiliza de Seis Balas:** personajes, revólveres y armas, tipos de zombi, minijefes, sonidos, Galería de tiro, Madame Zafira, Apocalipsis Delivery, el modo en grupo por internet, los controles del teléfono y el récord.

---

## 2. Cómo es una partida

1. Eliges personaje (los 6 de Seis Balas, cada uno con su arma inicial).
2. **Nivel 1:** apareces en el borde de un mapa al azar. Exploras edificios, juntas cosas y sigues las pistas hasta el Paciente Cero 1. Lo vences y te da un **poder**.
3. Se abre la **salida del nivel**, que es un carro, un puente o el metro, según el mapa. Al salir llegas a un mapa nuevo.
4. **Nivel 2 y nivel 3:** lo mismo, pero más difícil. Más zombis, edificios más peligrosos y un Paciente Cero más fuerte.
5. **Ganas** al vencer al Paciente Cero 3.
6. **Pierdes** si la infección llega al 100 % o si tu vida llega a 0. Te conviertes en zombi (ver la sección 9).

**Duración propuesta:** unos 12 a 15 minutos por nivel, unos 40 minutos por partida.

**Entre niveles:** una pantalla corta de resumen con los poderes conseguidos, las vacunas activas y el dinero. La partida se guarda sola aquí.

---

## 3. El mapa

### 3.1 La semilla

- Cada partida tiene una **semilla**: un número que decide cómo se arma el mapa. Con la misma semilla sale exactamente el mismo mapa.
- La semilla se ve en la pantalla de pausa (por ejemplo «Semilla 48213»). Así dos amigos pueden jugar el mismo mapa y comparar.
- En grupo, el anfitrión elige la semilla y todos reciben el mismo mapa.

### 3.2 La cuadrícula y los lotes

- El mapa es una cuadrícula de **lotes** separados por calles. Cada lote mide 12 × 12 metros y cada calle tiene 6 metros de ancho.
- Cada edificio ocupa un tamaño fijo de lote:

| Tamaño | Lotes que ocupa | Ejemplo |
|---|---|---|
| **A** chico | 1 × 1 | Kiosco, farmacia |
| **B** mediano | 2 × 1 | Armería, oficina |
| **C** grande | 2 × 2 | Casino, comisaría |
| **D** enorme | 3 × 3 | Hospital, laboratorio |

- Los lotes que sobran se llenan con cosas sin interior: parques, terrenos baldíos, carros abandonados, barricadas. Son lugares de paso donde aparecen zombis sueltos.

### 3.3 Los 6 tipos de mapa

| # | Mapa | Cuadrícula | Lotes A / B / C / D | Ambiente | Salida del nivel |
|---|---|---|---|---|---|
| 1 | **Pueblo** | 6 × 6 | 14 / 5 / 2 / 0 | Calles de tierra, casas bajas, atardecer | Camioneta |
| 2 | **Barrio** | 7 × 7 | 16 / 7 / 3 / 1 | Casas con jardín, plaza central, noche | Autobús escolar |
| 3 | **Centro** | 8 × 8 | 10 / 10 / 5 / 2 | Avenidas, edificios altos, lluvia | Entrada del metro |
| 4 | **Zona industrial y puerto** | 8 × 7 | 6 / 6 / 6 / 2 | Contenedores, grúas, niebla | Lancha |
| 5 | **Hospital y universidad** | 7 × 8 | 8 / 8 / 4 / 2 | Patios, pasarelas, noche fría | Helicóptero en la azotea |
| 6 | **Feria abandonada** | 7 × 7 | 12 / 6 / 3 / 1 | Carpas, atracciones, luces de colores | Tren de la feria |

**Qué mapa toca en cada nivel:**
- Nivel 1: Pueblo o Barrio.
- Nivel 2: Centro, Zona industrial o Feria.
- Nivel 3: Hospital y universidad, o el que no salió en el nivel 2.

Así el juego empieza chico y tranquilo, y termina grande y peligroso.

### 3.4 Cómo se reparten los edificios

En cada mapa la semilla elige qué edificio va en cada lote, con estas reglas:
- **Siempre hay:** 1 Armería, 1 Farmacia, 1 Apocalipsis Delivery y la guarida del Paciente Cero.
- **Siempre hay al menos:** 1 minijuego, 1 casa con objetos y 1 edificio raro.
- **Minijefes:** 1 en el nivel 1, 2 en el nivel 2 y 3 en el nivel 3.
- **Jefe de habitación:** 1 por nivel, y es el único que guarda la última pista.
- El resto son edificios comunes.
- Las tiendas no quedan pegadas entre sí. La guarida del Paciente Cero queda lejos de donde apareces.

### 3.5 Ver el mapa

- **Minimapa redondo** arriba a la derecha (como en Seis Balas). Los edificios aparecen en gris hasta que pasas cerca; entonces se ve su icono.
- **Mapa grande** al tocar el minimapa. Marca dónde estás, los edificios ya vistos y las pistas encontradas.
- Los edificios ya vaciados quedan marcados con una ✓ en el mapa (en el juego se dibuja como icono, sin emojis).

---

## 4. Los 40 edificios

**Columnas de las tablas:**
- **Frec.:** qué tan seguido sale el edificio. **Común** sale en casi todos los mapas, **Normal** en algunos y **Raro** de vez en cuando.
- **Peligro:** de 1 (tranquilo) a 5 (muy peligroso).

### 4.1 Comunes: poco o nada, y zombis (14)

| # | Edificio | Lote | Frec. | Peligro | Qué hay adentro |
|---|---|---|---|---|---|
| 1 | Casa abandonada | A | Común | 1 | 1-3 caminantes, a veces 6 balas |
| 2 | Garaje | A | Común | 2 | Zombis encerrados que salen al abrir el portón; a veces una lata de gasolina (sirve para la salida del nivel) |
| 3 | Kiosco | A | Común | 1 | Casi vacío; a veces un poco de dinero |
| 4 | Lavandería | A | Común | 2 | Reptantes escondidos entre las máquinas |
| 5 | Baños públicos | A | Normal | 2 | Un corredor que embosca al entrar |
| 6 | Parada de autobús | A | Común | 1 | Al aire libre, zombis de paso, a veces un mapa con pistas |
| 7 | Cafetería | A | Común | 1 | Comida que cura un poco |
| 8 | Oficina | B | Común | 2 | Zombis oficinistas, cajones con dinero |
| 9 | Escuela | B | Normal | 3 | Pasillos largos, muchos zombis débiles |
| 10 | Edificio de apartamentos | B | Común | 3 | Varios cuartos cerrados; detrás de cada puerta puede haber algo o alguien |
| 11 | Restaurante | B | Normal | 2 | El Carnicero en la cocina; comida que cura |
| 12 | Supermercado saqueado | C | Normal | 3 | Muchos zombis, mucha comida, balas |
| 13 | Iglesia | C | Normal | 2 → 4 | Tranquila, pero si suena la campana llega una horda |
| 14 | Estacionamiento | C | Normal | 3 | Carros con alarma: si les disparas, atraen zombis; a veces una llave de carro |

### 4.2 Tiendas (6)

| # | Edificio | Lote | Frec. | Qué vende |
|---|---|---|---|---|
| 15 | **Armería** | B | Siempre | Armas para comprar (más variedad que en ningún lado): las 13 armas de Seis Balas, 4 a la vez, cambian por nivel |
| 16 | **Farmacia** | A | Siempre | Vacunas y botiquines |
| 17 | **Apocalipsis Delivery** | A | Siempre | Balas (el mismo de Seis Balas) |
| 18 | Ferretería | B | Común | Mejoras de arma: mira, cargador, cañón, empuñadura |
| 19 | Mercado negro | A | Raro | 3 cosas raras y caras que cambian en cada visita (vacunas fuertes, poderes menores) |
| 20 | Taller del herrero | B | Normal | Sube el nivel de tu arma (más daño o más balas por cargador) |

### 4.3 Casas con objetos (5)

| # | Edificio | Lote | Frec. | Peligro | Qué hay adentro |
|---|---|---|---|---|---|
| 21 | Casa del médico | A | Normal | 2 | 1-2 vacunas guardadas en un botiquín |
| 22 | Casa del cazador | A | Normal | 2 | Una mejora de arma segura |
| 23 | Búnker | B | Raro | 3 | 3 cajas de suministros; la puerta necesita una llave que está en otro edificio del mapa |
| 24 | Mansión | C | Raro | 4 | Muchos cuartos, objetos valiosos y un zombi especial escondido |
| 25 | Casa del coleccionista | B | Raro | 2 | Un objeto raro en una vitrina (hay que romperla, y eso hace ruido) |

### 4.4 Minijuegos (7)

| # | Edificio | Lote | Frec. | Cómo se juega |
|---|---|---|---|---|
| 26 | **Zombie Casino** | C | Normal | Tragamonedas y ruleta. Apuestas dinero y puedes ganar dinero, vacunas o un arma. El crupier es un zombi elegante |
| 27 | **Tres en raya zombi** | B | Normal | Juegas tres en raya contra un zombi en una mesa gigante. Ganas: premio. Empatas: nada. Pierdes: se suelta la horda del local |
| 28 | Galería de tiro | B | Normal | La de Seis Balas: aciertas a los blancos por tiempo |
| 29 | Carpa de Madame Zafira | A | Normal | La ruleta de la suerte de Seis Balas: premio o castigo |
| 30 | Bolera zombi | B | Raro | Lanzas una bola contra zombis en fila; cuantos más tumbes, mejor premio |
| 31 | Máquina de la garra | A | Común | Pagas un poco e intentas sacar un objeto con la garra |
| 32 | Arena de pelea | C | Raro | Aguantas 60 segundos contra oleadas; si sobrevives, un premio grande |

### 4.5 Edificios raros: cajas de armas cerradas (3)

En estos edificios las armas están en cajas cerradas. **Abrir una caja cuesta balas, porque hay que dispararle a la cerradura.** Cuanto mejor la caja, más disparos necesita.

| # | Edificio | Lote | Frec. | Qué hay adentro |
|---|---|---|---|---|
| 33 | Almacén sellado | B | Normal | 3 cajas: chica (3 balas), mediana (6 balas) y grande (12 balas). Cada una trae un arma o una mejora |
| 34 | Contenedor militar | A | Raro | 1 caja blindada (18 balas) con un arma fuerte: minigun, bazuca o tesla |
| 35 | Bóveda del banco | C | Raro | Cajas fuertes. Cuantas más balas gastas, mejor premio, pero cada disparo hace ruido y atrae zombis |

### 4.6 Minijefes y jefes de habitación (5)

| # | Edificio | Lote | Tipo | Quién está |
|---|---|---|---|---|
| 36 | Comisaría | C | Minijefe | El Guardia de Seguridad (de Seis Balas), con antidisturbios |
| 37 | Estación de bomberos | C | Minijefe | El Pirómano: deja el suelo en llamas |
| 38 | Gimnasio | B | Minijefe | El Forzudo: empuja y derriba |
| 39 | **Laboratorio** | D | Jefe de habitación | La Abominación. Al vencerla dejas la **última pista** del Paciente Cero |
| 40 | **Hospital** | D | Jefe de habitación | Un jefe distinto en cada nivel. En el nivel 3 el hospital es siempre la guarida del Paciente Cero final |

**Premio por vencerlos:**
- Minijefe: dinero, una vacuna y una pista.
- Jefe de habitación: la última pista y un objeto raro.

### 4.7 Sorpresas (pueden pasar en cualquier edificio común)

| Sorpresa | Probabilidad | Qué pasa |
|---|---|---|
| Sobreviviente | 5 % | Te da algo o te acompaña un rato disparando |
| Radio | 8 % | Una voz te da una pista del Paciente Cero |
| Trampa | 6 % | Se cierra la puerta y salen zombis |
| Zombi dormido | 10 % | Si pasas sin correr, no despierta |
| Alijo escondido | 4 % | Dinero y balas detrás de un mueble que se puede romper |

---

## 5. Los Pacientes Cero

### 5.1 Cómo se encuentran: pistas

Cada Paciente Cero se esconde en un edificio del mapa. Para dar con él hacen falta **3 pistas**:

1. **Primera pista** (radio, parada de autobús, oficina o minijefe): marca en el mapa la **zona** donde está. Es un círculo grande.
2. **Segunda pista** (otra pista o un minijefe): achica el círculo.
3. **Tercera pista** (siempre la da el jefe de habitación): marca el **edificio exacto**.

Si te apuras, puedes buscar sin las 3 pistas. Pero la guarida está cerrada hasta que tengas la tercera, o hasta que pasen 10 minutos del nivel. Así nadie se queda atascado.

### 5.2 Los tres Pacientes Cero

| Nivel | Nombre | Cómo pelea | Poder que deja al vencerlo |
|---|---|---|---|
| 1 | **La Enfermera** (Paciente Cero 1) | Rápida. Lanza jeringas que suben tu infección. Llama a 4 caminantes cada vez que pierde un cuarto de su vida | **Sangre fuerte:** tu infección sube un 25 % más lento por el resto de la partida |
| 2 | **El Mensajero** (Paciente Cero 2) | Corre por todo el edificio. Se esconde y deja zombis «bomba» que explotan con gas | **Olfato:** los edificios con objetos brillan en el minimapa |
| 3 | **El Primero** (Paciente Cero 3, el jefe final) | En 3 fases: primero lanza objetos pesados; luego trepa por las paredes; al final se transforma en algo enorme | Ganas la partida |

**Fuerza de los Pacientes Cero:**
- Cuanto más difícil el modo (Normal, Difícil, Apocalipsis, como en Seis Balas), más vida y más daño tienen.
- En grupo, su vida aumenta según cuántos juegan.

---

## 6. Infección y vacunas

### 6.1 La barra de infección

- Empieza en 0 %.
- **Cada golpe de zombi suma infección:**

| Golpe | Infección |
|---|---|
| Normal | +3 % |
| Fuerte (carnicero, jefe) | +6 % |
| Escupidor | +4 % |

- **Además sube sola:** una vez que tienes algo de infección, sube 1 % cada 20 segundos.
- **Etapas:**

| Infección | Efecto |
|---|---|
| 0-24 % | Sin efecto |
| 25-49 % | La pantalla se ve un poco verdosa en los bordes |
| 50-74 % | La estamina se gasta más rápido |
| 75-99 % | A veces la vista tiembla; los zombis te notan desde más lejos |
| 100 % | Te conviertes en zombi |

### 6.2 Las vacunas

Cada vacuna **baja la infección** y además es un **modificador**: cambia tus barras de vida, estamina o habilidades mientras dura su efecto.

| Vacuna | Baja la infección | Efecto extra | Dura | Precio | Dónde sale |
|---|---|---|---|---|---|
| **Vacuna básica** | −20 % | Nada | — | 40 $ | Farmacia, casas |
| **Vacuna roja** | −15 % | +25 vida máxima | Todo el nivel | 90 $ | Farmacia, médico |
| **Vacuna azul** | −15 % | +30 % estamina, corres más | Todo el nivel | 90 $ | Farmacia, médico |
| **Vacuna amarilla** | −15 % | Recargas un 25 % más rápido | Todo el nivel | 90 $ | Farmacia, casino |
| **Vacuna verde** | −10 % | Durante 2 minutos los golpes no infectan | 2 min | 120 $ | Mercado negro, minijefes |
| **Vacuna negra** | −40 % | −15 vida máxima (cuesta salud) | Todo el nivel | 70 $ | Mercado negro |
| **Vacuna experimental** | −30 % | Al azar: un bono bueno o uno malo | Todo el nivel | 60 $ | Casino, Zafira |
| **Suero del Paciente Cero** | −100 % (te cura todo) | +10 % daño | Toda la partida | No se vende | Solo al vencer a un Paciente Cero |

- Puedes llevar **3 vacunas** en el bolsillo y usarlas cuando quieras. La tecla V, o un botón en el teléfono.
- Puedes tener **2 efectos de vacuna activos a la vez**. Si te pones una tercera, reemplaza a la más vieja.

### 6.3 Las barras del jugador

| Barra | Para qué sirve | Base |
|---|---|---|
| **Vida** | Si llega a 0, caes | 100 |
| **Estamina** | Se gasta al correr, empujar y esquivar; se recupera al caminar | 100 |
| **Infección** | Si llega a 100 %, te conviertes | 0 % |
| **Habilidad** | La habilidad especial de tu personaje (la tecla Q de Seis Balas) | Se carga al matar zombis |

---

## 7. Armas, balas y dinero

### 7.1 Armas

- Empiezas con el arma de tu personaje.
- **Puedes llevar 2 armas** y cambiar entre ellas con la rueda del ratón o con un botón en el teléfono.
- **Dónde se consiguen más armas:**
  - Armería (comprar);
  - cajas de los edificios raros (gastando balas);
  - casino y bolera (premio);
  - Mercado negro (cara).
- **Mejoras:** se compran en la Ferretería o se encuentran en casas. Se ponen en el arma que tengas en la mano.
- **Taller del herrero:** sube el nivel del arma (1 a 5).

### 7.2 Balas

- Las balas son contadas, como en Seis Balas B. Se compran en Apocalipsis Delivery y algunos zombis las sueltan.
- **Abrir cajas cuesta balas:** es una decisión importante. ¿Gastas 12 balas por un arma mejor, o las guardas para el jefe?

### 7.3 Dinero

**Cómo se gana:**

| Fuente | Dinero |
|---|---|
| Zombi | 2-5 $ |
| Minijefe | 60 $ |
| Jefe de habitación | 120 $ |
| Cajones, kioscos y alijos | 5-40 $ |
| Minijuegos | Lo que ganes |

**Precios de referencia:**

| Cosa | Precio |
|---|---|
| 12 balas | 25 $ |
| Vacuna básica | 40 $ |
| Mejora | 60-150 $ |
| Arma en la Armería | 120-400 $ |

**Entre niveles:** el dinero, las armas y las mejoras se conservan. Los efectos de las vacunas de «todo el nivel» se acaban.

---

## 8. Zombis

Se usan los zombis de Seis Balas:
- **Comunes:** caminante, reptante, corredor, perro.
- **Especiales:** escupidor, gritona, antidisturbios, oficial zombi, hinchado.
- **Fuertes:** carnicero, asaltante, abominación, hachero, caballero, motosierra.

**Dónde aparecen:**
- **En la calle:** grupos chicos de caminantes y perros que se mueven por el mapa.
- **Dentro de los edificios:** según el peligro del edificio. Se activan al entrar.

**El ruido atrae:**
- Los disparos y las alarmas atraen a los zombis de la calle cercanos.
- La campana de la iglesia y la bóveda del banco atraen a muchos.

**Cada nivel trae más zombis especiales:**

| Nivel | Zombis especiales |
|---|---|
| 1 | Casi ninguno |
| 2 | Algunos |
| 3 | Muchos |

---

## 9. Jugar en grupo y la horda

- **De 2 a 4 jugadores** con el mismo sistema que Seis Balas: sala, código y chat de voz.
- **Todos ven el mismo mapa**, porque el anfitrión manda la semilla.
- **Cada uno tiene su propia infección y sus propias vacunas.** Las vacunas se pueden regalar a un compañero.

**Cuando un jugador se convierte:**
- Pasa al **lado de la horda**: juega como un zombi especial. Elige entre corredor, escupidor o carnicero, y vuelve a elegir cada vez que reaparece.
- Como zombi: corre y golpea, y sus golpes infectan a los vivos.
- Si los vivos lo matan, reaparece como zombi 20 segundos después, lejos de ellos.
- **Gana puntos de horda** por cada golpe que da y cada vivo que convierte.

**Cómo termina la partida en grupo:**
- **Ganan los vivos** si alguno vence al Paciente Cero 3.
- **Gana la horda** si todos se convierten.
- Al final, una pantalla de resultados con dos premios: «Mejor superviviente» y «Mejor zombi».

**Jugando solo:** al convertirte, una animación corta muestra tu transformación y aparece la pantalla final con tu récord (nivel alcanzado, pacientes vencidos, edificios explorados).

---

## 10. Controles

| Acción | Computadora | Teléfono |
|---|---|---|
| Moverse | W A S D | Palanca izquierda |
| Mirar y apuntar | Ratón | Arrastrar el dedo a la derecha |
| Disparar | Clic izquierdo | Botón de disparo |
| Recargar | R | Botón |
| Correr (gasta estamina) | Mayúscula | Empujar la palanca hasta el borde |
| Usar o entrar | E | Botón que aparece al acercarte |
| Ponerse una vacuna | V | Botón de jeringa |
| Cambiar de arma | Rueda o 1/2 | Tocar el icono del arma |
| Habilidad | Q | Botón |
| Agarre (soltarse) | G | Tocar rápido (como en Seis Balas) |
| Mapa | M o Tab | Tocar el minimapa |

---

## 11. Pantallas

1. **Inicio:** botón grande naranja «Jugar»; debajo, «Jugar en grupo», «Cómo se juega», «Récords».
2. **Elegir personaje:** igual que Seis Balas.
3. **En el juego:**
   - arriba a la izquierda, las barras de vida, estamina e infección (verde que se vuelve rojo), y el dinero;
   - arriba a la derecha, el minimapa;
   - abajo a la derecha, el arma y las balas;
   - abajo a la izquierda, las 3 vacunas del bolsillo y el poder del Paciente Cero.
4. **Mapa grande:** el mapa con los edificios vistos, las pistas y el círculo de la guarida.
5. **Tienda:** Armería, Farmacia, Ferretería y las demás, con la misma forma de las tiendas de Seis Balas.
6. **Resumen entre niveles.**
7. **Final:** victoria, derrota o convertido.

---

## 12. Respuestas del dueño (14-10-2026)

1. **Nombres de los Pacientes Cero:** La Enfermera, El Mensajero y El Primero.
2. **Reloj:** no hay reloj por nivel; la infección que sube sola es la que apura.
3. **Edificios ya vaciados:** se puede volver a entrar, pero ya no hay nada y pueden aparecer zombis de la calle.
4. **Nombre del juego:** «Paciente Cero».
5. **Récord:** uno propio, separado del de Seis Balas.

---

## 13. Plan para construirlo (cuando apruebes este diseño)

Un paso a la vez, cada uno con fotos antes de publicar.

| Paso | Qué se hace | Qué podrás probar |
|---|---|---|
| 1 | Crear el juego aparte (su lugar en GitHub y su dirección en internet) | Una página de inicio |
| 2 | La ciudad: semilla, cuadrícula, calles y 6 edificios simples (sin interior) | Caminar por un pueblo distinto cada partida |
| 3 | Entrar a los edificios: interiores de los tamaños A, B, C y D | Entrar y salir de los edificios |
| 4 | Zombis en la calle y en los edificios, más el ruido que atrae | Pelear por la ciudad |
| 5 | Infección y vacunas | La barra sube con los golpes y baja con las vacunas |
| 6 | Tiendas: Armería, Farmacia, Apocalipsis Delivery | Comprar armas, vacunas y balas |
| 7 | Pistas y el Paciente Cero 1 | Un nivel completo de principio a fin |
| 8 | Los 40 edificios, por grupos (comunes, casas, raros, minijuegos, jefes) | Variedad en cada partida |
| 9 | Los 6 mapas y los niveles 2 y 3 con sus Pacientes Cero | Una partida entera |
| 10 | Modo en grupo y la horda | Jugar con amigos |
| 11 | Tutorial, récords, logros y pulido | El juego listo |
