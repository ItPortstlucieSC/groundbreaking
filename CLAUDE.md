# groundbreaking · micrositio del estadio de Port St. Lucie SC

Micrositio de la primera palada del estadio (12/12/2026). Lo general (marca, ramas, voz) está en el `CLAUDE.md` de la
carpeta madre `PSLSC/`. Este archivo es lo propio de este repo.

## Estado
- Arrancó desde `docs/frentes/groundbreaking/sitio-base/` (versión B del lienzo). Brief completo:
  `../docs/frentes/groundbreaking/BRIEF.md`.
- HTML + CSS + JS estándar, sin frameworks, hasta que se defina dónde se publica (si termina en WordPress, aplican las
  reglas de bloques del sitio del club: CSS bajo `.pslsc`, JS como data URI).

## Ramas
- `main` = lo publicado. `develop` = trabajo. Nada a `main` sin el OK de Martín.

## Ver localmente
```bash
python3 -m http.server 4321   # → http://localhost:4321/
```

## Intro (pantalla de carga)
Mismo patrón que `pslsc-school` (ver su README, sección "Intro"). Al entrar se reproduce el video del estadio
("Port St Lucie Stadium - Video Final", sin audio) a pantalla completa con una línea aqua y un *Loading %* que avanzan
con el video; 0,6 s antes del final la página sube fundiéndose con él (0,9 s). Se saltea con **Skip intro** o Escape.
Sin JS, con *reduced motion*, sin autoplay (modo ahorro de iOS) o si el video no arranca en 5 s, no hay intro.
Todo está en `index.html`: CSS (bloque "Intro" al final del `<style>`), clase `intro-on` en el `<head>`, el marcado
`.intro` al principio del `<body>` y el script "intro" al final.

- **Corte:** cuadros 0–446 (18,6 s). Termina en la vista aérea (la misma toma del hero); desde el 447 el video se funde
  al negro con el escudo, que queda afuera.
- **Encuadre:** apaisado, el video cubre la pantalla. Vertical, franja 16:9 de 160vw (se ve el 62% central del ancho)
  sobre el verde profundo `#0B2A2A`, con la línea pegada al borde de arriba del video.
- **Calidad:** 720p en teléfonos (3 MB) y 1080p en pantallas grandes (5,7 MB), H.264 CRF 31.
- **Regenerar** (desde la raíz del repo, con el video fuente en la raíz; usar `bash`, en zsh `$X264` no se separa):

  ```bash
  X264="-c:v libx264 -preset slow -profile:v high -pix_fmt yuv420p -color_primaries bt709 -color_trc bt709 -colorspace bt709 -movflags +faststart -an"
  SRC="Port St Lucie Stadium - Video Final.mp4"
  ffmpeg -i "$SRC" -frames:v 447 -crf 31 $X264 assets/intro/intro-1080.mp4
  ffmpeg -i "$SRC" -frames:v 447 -vf scale=1280:720:flags=lanczos -crf 31 $X264 assets/intro/intro-720.mp4
  ffmpeg -i "$SRC" -frames:v 1 -vf scale=1280:720:flags=lanczos poster.png   # → assets/intro/intro-poster.webp (calidad 78)
  ```
- El video fuente (60 MB) no se versiona (`.gitignore`).
- El `http.server` de Python no soporta pedidos `Range`: en Chrome la intro anda, pero Safari no reproduce el video y
  se saltea la intro. Un hosting real (Vercel, etc.) sí los soporta.

## Reglas
- Fases: "Antes" (hasta el 12/12) y "Después" (desde el 13/12). Sin fase "Durante": el día del evento el contenido vive
  en redes.
- Copy en inglés.
- El chequeo de edad del muro deja los datos siempre en manos de un adulto.
