# Paciente Cero

Juego 3D en primera persona (Seis Balas C): recorres una ciudad que cambia en cada partida, entras a sus edificios a buscar armas, vacunas y pistas, y das caza a los tres Pacientes Cero antes de que la infección te convierta en zombi.

- El diseño completo y aprobado está en `DISENO.md`.
- Rama de trabajo: `en-pruebas`. Lo que se publica es `main`.
- Es un juego aparte de Seis Balas (repositorio `seis-balas`); no comparte récords ni partidas guardadas.

## Archivos

- `index.html`: la ciudad, el ambiente (hora y clima), el minimapa y los menús.
- `juego.js`: la jugabilidad (armas, zombis, edificios por dentro, infección y vacunas, tiendas, minijuegos, pistas, Pacientes Cero y niveles).
- `datos.js`: todas las cifras del juego.
- `kit.js`: modelos de revólveres y zombis copiados de Seis Balas.
- `snd/` e `img/`: sonidos (CC0, ver `snd/CREDITOS.txt`) y fotos de los personajes, también de Seis Balas.
