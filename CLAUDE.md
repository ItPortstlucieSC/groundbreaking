# groundbreaking · micrositio del estadio de Port St. Lucie SC

Micrositio de la primera palada del estadio (12/12/2026). Lo general (marca, ramas, voz) está en el `CLAUDE.md` de la
carpeta madre `PSLSC/`. Este archivo es lo propio de este repo.

## Estado
- Arrancó desde `docs/frentes/groundbreaking/sitio-base/` (versión B del lienzo). Brief completo:
  `../docs/frentes/groundbreaking/BRIEF.md`.
- HTML + CSS + JS estándar, sin frameworks, hasta que se defina dónde se publica (si termina en WordPress, aplican las
  reglas de bloques del sitio del club: CSS bajo `.pslsc`, JS como data URI).

## Dónde se ve
- **Público (Vercel, cuenta de Mariano, proyecto `groundbreaking`)**: https://groundbreaking-eight.vercel.app/. `/v2/` redirige a la raíz
  (`vercel.json`) porque ese link llegó a circular. Se publica con `npx vercel deploy --prod --yes` desde la raíz del
  repo (el vínculo está en `.vercel/`, ignorado por git; `.vercelignore` deja afuera `docs/`). No está conectado al
  repo de GitHub: hay que volver a correr el deploy después de cada push.
- Sin hosting: `https://raw.githack.com/ItPortstlucieSC/groundbreaking/develop/index.html` (pantalla intermedia).

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

## Hero vivo (continúa la intro)
La toma aérea con la que termina la intro sigue de fondo del hero. **Modo actual: still animado** (decidido el 22-oct
después de tres generaciones de video en las que siempre quedaba gente congelada): `assets/hero/still.webp` es el
último cuadro de la intro, y sobre él van tres capas CSS dentro de `.hero-live` (fijo, recortado por el hero):

- `.hero-still`: deriva de cámara muy lenta, `heroDrift` 44 s ida y vuelta, de escala 1 (encuadre exacto de la intro)
  a 1,075 con un leve desplazamiento.
- `.hero-cloud`: sombra de nube apenas visible (óvalo difuminado, multiply, opacidad .2) que cruza la escena en 70 s.
- `.hero-flare`: `assets/hero/flare.webp` (resplandor cálido desde el sol, arriba a la izquierda) en modo screen, que
  aparece unos 3 s cada 18 s (`heroFlare`).

Las animaciones arrancan con `html.hero-playing`, que pone el script "hero" en el empalme (último cuadro de la intro, o
Skip/Escape). Con reduced motion no hay animación. `?hero=video` activa el modo video (`.hero-video`, loop de Seedance
`assets/hero/loop-1080.mp4` / `loop-720.mp4`, 10 s) para comparar; las clases de estado van en `<html>` porque `#app`
se re-renderiza (morphdom) y pisa las del hero. Poster y fondo de respaldo: `assets/hero/loop-poster.webp` (= still).

- **Historial del video** (por si se retoma): v1 (6 s, anclaje original) con autos cercanos circulando al revés,
  jugadores y palmeras congelados y media plaza estática; v2a (10 s, anclaje original, prompt con reglas por zona) corrige
  autos y jugadores, sin flare y palmeras casi quietas; v2b (anclaje con un tercio de la gente, editado con GPT Image 2.5)
  más viva y con flare, pero igual con buena parte de la gente clavada al piso. Prompts, anclajes, salidas crudas y los
  scripts `review.py` (análisis por zona) y `flare.sh` (flare en posproducción) están en `docs/hero-loop/`.

- **Encuadre idéntico al de la intro:** el `<video class="hero-video">` es `position:fixed` cubriendo la pantalla (como la
  intro) y el hero lo recorta con `clip-path:inset(0)`; el hero mide `100svh - --hero-top` (lo que hay arriba: barra de
  vista previa, util y nav; lo mide el script "hero loop" y lo deja en `<html>`). Al scrollear el fondo queda fijo.
- **Empalme:** la salida de la intro ya no transforma `#app` (ancestro del hero, rompería el `fixed`): suben y aparecen
  `.pvstrip`, los hijos de `.pg` salvo el hero, y dentro del hero solo `.hero-hud` y `.hero-c2`; el fondo del hero ya está
  en su lugar debajo de la intro. El loop se carga cuando la intro empieza a reproducir y arranca en el evento `ended`
  de la intro (su cuadro 0 es ese último cuadro); con Skip, Escape o video que no arranca, arranca al instante.
- **Vertical:** la franja de la intro hace zoom (`--zoom`, calculado en el script de la intro) hasta el encuadre cover
  del hero durante los 0,9 s de salida; apaisado `--zoom` = 1.
- **Sin JS / reduced motion:** queda el poster. El `kb` (Ken Burns) del `.hero-bg` está apagado en el hero sobrio.
- **Trampa (Chrome):** el `<video>` del hero sale del `<template>` clonado por el render y Chrome no le aplica el
  `muted` del atributo (`muted` queda en false aunque el atributo esté): `play()` sin gesto se rechaza con
  NotAllowedError y queda el poster fijo. Por eso el script fuerza `video.muted = true` antes de `play()` y reintenta
  con el primer gesto. En headless no se ve si se pasa `--autoplay-policy=no-user-gesture-required`: probar sin la flag.
  morphdom le saca el atributo `src` en cada re-render (el countdown, cada segundo) pero el video sigue: `currentSrc`
  no cambia hasta un `load()`.
- **Regenerar el loop (modo video):** anclaje `docs/hero-loop/anchor-b-menos-gente.png` como primer y último frame en Seedance 2.0,
  10 s, 16:9, 1080p, sin audio, con el prompt B de `docs/hero-loop/prompt-loop-v2.txt`; después (con `bash`, no zsh):

  ```bash
  X264="-c:v libx264 -preset slow -profile:v high -pix_fmt yuv420p -color_primaries bt709 -color_trc bt709 -colorspace bt709 -movflags +faststart -an"
  ffmpeg -i docs/hero-loop/loop-v2b-seedance.mp4 -crf 27 $X264 assets/hero/loop-1080.mp4
  ffmpeg -i docs/hero-loop/loop-v2b-seedance.mp4 -vf scale=1280:720:flags=lanczos -crf 27 $X264 assets/hero/loop-720.mp4
  ffmpeg -i docs/hero-loop/loop-v2b-seedance.mp4 -frames:v 1 poster.png   # → assets/hero/loop-poster.webp (calidad 80)
  ```
  Juntura: comparar último y primer cuadro a baja resolución (480×270, suprime el ruido de compresión); si supera el
  ruido de encode (~2/255), fundir la cola hacia el cuadro 0 congelado, no hacia la cabeza (eso deja un salto al loopear).
  Si el modelo no hace el flare, `docs/hero-loop/flare.sh` lo superpone en posproducción (resplandor cálido desde arriba
  a la izquierda, 2,4 s, entrada y salida suaves).
- **Ver localmente con Range** (Safari): `npx -y http-server . -p 4321 -c-1`.

## La versión actual
**Una sola versión (2-nov-2026):** lo que se trabajó como "v2" en `index.html` pasó a la raíz (`index.html`,
`config.js`, con `assets/` sin `../`) y `v2/` se eliminó en `develop`. La v1 de Martín queda en `main` y en la historia
de git (`eee3bf2`). Lo que sigue es la historia de cómo se llegó acá; donde dice "v2" hoy es la raíz.

Página aparte para no pisar la v1 al publicar: misma base que `index.html` (comparte `assets/`, referenciados como
`../assets/`) con los ajustes pedidos el 22-oct:
- Contador centrado y translúcido mientras carga el video (`.intro__cd`, misma fecha objetivo `2026-12-12T10:00-05:00`,
  lo actualiza el script de la intro y se apaga al salir).
- Sin la franja de vista previa ni la barra verde de arriba del nav (`.pvstrip` y `.util`); el EN/ES pasó al `.nav-r`
  y el 3-nov se quitó del todo (selector, CSS `.lang` y estado `lang`; el copy es solo en inglés).
- Hero sin los pills ("Render · video loop", "US-1 & Walton Rd").
- Sin la card "From first shovel to gates open" (`.bx-when`); el bento queda con 3 cards.
- Intro a pantalla completa también en vertical (cover, recortada; sin la franja 16:9 ni el zoom de salida), con la
  línea de carga arriba y el contador en el tercio inferior (`.intro__cd{top:78%}`).
- Intro robusta (22-oct, noche; Mariano no veía la carga en su iPhone): si el autoplay se rechaza (bajo consumo en
  iOS), el video da error, no arranca en 12 s o se traba 8 s, la intro NO se saltea: pasa a `.intro--still` (el
  still del hero, `.intro__still`), la línea completa la carga en 2,8 s y entra la página; mientras espera, la línea
  avanza con el buffer hasta 15 %. La red de seguridad del `<head>` pasó de 4 a 8 s. Reduce Motion sigue sin intro.
- Nav sticky: `.pg{overflow:clip}` (con `hidden` el `.pg` era contenedor de scroll y anulaba el `position:sticky`).
- Bloques que aparecen al entrar en pantalla: clase `rv` en el template (cabeceras de sección, cards del bento,
  countdown, ticket, grillas), `IntersectionObserver` en el script "reveal" del final del body, animación `rvIn`
  con escalonado por `nth-child`. Como `#app` se re-renderiza cada segundo, el hook `onBeforeElUpdated` de morphdom
  conserva `is-in` y el script re-escanea cada 0,8 s. Con reduced motion no hay animación.
- Tira de postales (`#postcards`, sección `.pcs`) debajo del countdown: "One postcard, yours twice" + ticket
  "Register and pick your postcard" + las cuatro postales reales del overlay (`.pc.f1`–`.f4`, su CSS copiado con el
  prefijo `.pcs`, escaladas con `--pcs-scale` = ancho del marco / 720, que mide el script "reveal") + la línea
  "Today · by email / December 12 · printed". Unifica lo que estaba repetido: se quitaron la mini postal del hero
  y el ticket del countdown (el countdown quedó a una columna); el CTA del hero lleva a `#postcards`. La elección
  marcada (01) es estática: la selección real va en el registro. Mockup de origen: canvas "Postcards strip options"
  (https://claude.ai/artifact/RptXHdwj2BzWBB8668speG), opción B.
  También se quitó el pasaporte de sellos (`.pass`, "Every step unlocks a stamp"): la postal reemplaza esa mecánica.
  Énfasis (22-oct): titular 42 px, postales inclinadas (±1,5–2,5°) que se enderezan al hover, ticket a 84 px; mide
  ~430 px en escritorio. Fondo verde `#0F3B3A` con halo aquamarine (`.pcs::before`). Se probó en amarillo `#FFD45C`
  (el sol de la postal de Luca) y se descartó por excesivo (22-oct).
- Flujo de registro (22-oct): las postales de la tira caen desde arriba en 4 tiempos al entrar en pantalla
  (`pcsDrop`, delays 0/.16/.32/.48 s, etiquetas y chips después). Cada postal es un `<button data-pick-card="n">`;
  la elección vive en `<html data-pick="n">` (fuera de `#app`, así el re-render de morphdom no la pisa) y el CSS
  pinta la elegida, cambia "Pick"→"Picked ✓" (`::before`) y el ticket pasa a "Postcard 0n picked · one step left /
  Great pick. Now register", con un salto (`tkPop`) y la flecha del GO empujando (`tkNudge`, clase `pcs-nudge` en
  `<html>` 2,2 s) y luego un vaivén permanente (`tkArrow`). Sin elección, el ticket dice "Pick a postcard, then
  register".
- Modal de registro (`.mdl`, `[data-mdl]`, fuera de `#app`; se abre con cualquier `a[href="#register"]` o con el
  hash): 1 · la postal (clon del `.pcs-grid`, misma selección vía `data-pick`, escala `--mdl-scale` en el modal),
  2 · nombre y email + check "I only want the digital postcard" (oculta y des-requiere el domicilio), 3 · street,
  city, state, ZIP. Submit: valida elección y campos, muestra el panel "You're in" con el resumen. **Sin backend**:
  el `TODO` en el script "registro" marca dónde enviar el payload `{postcard, name, email, digital?, street, city,
  state, zip}`. Escape, la X, el fondo y "Back to the site" cierran; `html.mdl-open` bloquea el scroll.
- Muro con backend (22-oct): `docs/wall/Code.gs` (Apps Script sobre un Google Sheet: pestañas `messages` y
  `registrations`, moderación por columna `status`, honeypot y 1 envío/email/minuto) + `docs/wall/README.md` con el
  deploy. La URL del web app va en `config.js` (`window.GB_API`); `?api=` la pisa para probar con
  `docs/wall/mock-server.mjs`. Sheet actual (22-oct, Drive de Mariano, cambiable por otro):
  https://docs.google.com/spreadsheets/d/158ywNxMUd1Ubt7RAEFI6A4qUPAGmgsLlBPdxokqGZxA/edit. Web app en `config.js`; con `GB_API` vacío aparece una etiqueta roja
  "Demo mode · nothing is saved". `docs/wall/` es el proyecto clasp del script (ID en `.clasp.json`): para publicar
  cambios, `clasp push` + `create-version` + `update-deployment` a la implementación `AKfycbyLk…` (ver README).
  Versión 3 activa desde el 23-oct: publica al instante; `hidden` en la columna status lo saca del muro. Sin URL, los formularios corren en modo demo (no guardan, avisan en consola).
  El componente carga los aprobados en `componentDidMount` (`_addMessages`: banda de 9 columnas debajo de las 42
  tarjetas de muestra, el mundo `W×H` crece) y expone `window.gbWall.add`. "Leave your message" abre el modal
  `[data-wmdl]`: mensaje (140), nombre como aparece, insignia, sticker, email (nunca se muestra), consentimiento y
  el check "I'm 13 or older" (3-nov, antes 18; decidido 22-oct: sin opción "en nombre de mi hijo"). Al enviar: botón en estado de
  carga ≥1,1 s. Política decidida el 22-oct (tarde): **se publica al instante** (`auto_approve` TRUE en la pestaña
  `config` del Sheet; el script lee eso, sin redeploy): el modal se cierra solo, el muro se centra y enfoca la
  tarjeta nueva (`is-new`) y un toast lo confirma. El sitio solo muestra `status = approved`: para sacar un mensaje
  ofensivo se elige `hidden` en el desplegable de esa columna y desaparece en la próxima carga. Con `auto_approve`
  FALSE entran como `pending` y el sitio muestra el panel de gracias "yours will be on the wall in the next few days". El selector de mensajes grandes (`.wsel`, prev/next) se quitó; en su lugar `.wall-why` explica el muro y
  que en la inauguración los mensajes se imprimen y se tiran como papelitos desde las tribunas. El modal de
  postales envía `type: 'register'` al mismo endpoint. Pendiente: si al publicar se quitan las 42 tarjetas de muestra.
- 22-oct, tarde: se quitó por completo el módulo "The Traveling Shovel" (`#shovel`, mapa SVG y paradas), con sus
  links en nav, menú móvil y footer; la card "B · Where" del bento ahora abre Google Maps (US-1 & Walton Rd) en
  otra pestaña. El `state.pos`/`onSlide` del componente quedaron sin uso. En la cabecera del muro el lead es
  `.wall-hl` "Be part of the wall →" (Ferryman, subrayado aquamarine, abre el modal) + la instrucción debajo.
  **Copy del muro reescrito (27-oct, revisión de UX writing; Mariano: "el componente entero es un poco confuso"):**
  el problema era que la frase a completar no se señalaba como tal, había tres verbos para la misma acción ("Be part
  of the wall", "Leave your message", "Put it on the wall") y el confeti se explicaba cuatro veces. Ahora: eyebrow
  "Community wall · Finish the sentence", el H2 es la frase con el hueco a la vista (`.wall-blank`), un lead de una
  idea ("Finish it and pin it on the wall. On December 12, every message gets printed and rains down from the stands.")
  y **un solo CTA en todos lados: "Add your message →"** (`.wall-cta` en el lead, botón de abajo; en el modal "Add it
  to the wall →"). La instrucción de uso vive solo en el HUD ("Drag · Scroll to zoom · Tap a card to read"). El bloque
  "Why a wall" pasó a "Your message / Add yours. It goes up right away." con una línea de confianza (email con el club,
  moderación) y el mismo botón, sin `.flag`. Modal: título "Finish the sentence.", la frase aparece solo como label del
  campo, placeholder con "e.g.", "Name on the card", "You're a…", "2 · Your email" con ayuda "Only the club sees it.
  Never on the wall." (`.mdl-help`), checkbox de consentimiento en una sola afirmación y la moderación como ayuda
  debajo (`.mdl-help-chk`). Toast al publicar: "Thanks, {nombre}. It's on the wall." Se quitó el CSS de `.wall-hl`.
- 26-oct: el tour (`#tour`) se rehízo como recorrido de 6 paradas con render real (`assets/tour/gate|plaza|terrace|
  pitch|district|lawn.webp`, 1600×900 q80, sacados del deck "Media Push · Groundbreaking" del 28-sep que dejó Mariano en
  `~/Desktop/groundbreaking | walk through/`). Luca (bust) cuenta en primera persona qué vas a hacer en cada lugar, en
  globos de historieta: 3 líneas por parada (guion `STOPS` en `renderVals`, aprobado el 26-oct; todo sale de los
  documentos del club), tipeadas letra por letra solo con CSS (un `<i>` por letra con `animation-delay`; el bloque
  `.sc-dlg` lleva `id="tour-{parada}-{línea}"`, así morphdom lo recrea al cambiar de línea y las animaciones arrancan de
  cero; el tipeo espera a que `.scene.rv` tenga `is-in`). Un toque en el globo o en Next mientras tipea completa la
  línea (clase `tour-done` en `<html>`, fuera del re-render); después Next pasa de línea, de parada y al final muestra
  el ticket "Register · get your postcard" + "Take the tour again". Estado en `ts`/`tl`/`tend`. Índice: directorio de
  señalética (`.dir`: tótem "Stadium directory" en escritorio con "● You are here", tira horizontal de placas en móvil;
  reemplazó a la aérea con pines, que quedaba rara ahí). **27-oct, tarde: más cartel.** Pictograma por parada
  (`.dir-ic.ic-{img}`, SVG de trazo en `mask` con `currentColor`, 6 íconos en el CSS móvil), tapa crema con "06 stops"
  (`.dir-h` + `.dir-hc`), marco grueso con línea interior y tornillos en las esquinas (`.dir::before`), poste con base
  debajo (`.dir::after`, cae en la celda vacía de la grilla), "You are here" con punto rojo en una segunda línea de la
  placa activa. En móvil, las placas llevan pictograma, borde crema y radio chico. Las filas clipean (`overflow:hidden`,
  nombre con elipsis) porque el tótem tiene `overflow:visible` para el poste. **Probado y descartado el mismo día
  (Mariano: "queda muy pesado"):** flechas direccionales por parada en las placas, y un segundo cartel con un plano
  cenital dibujado en SVG a partir de la aérea (no hay plano de planta; la posición del Lawn era deducida). Si se
  retoma, la idea y lo aprendido quedaron en el historial de esta sesión; el repo no conserva el código. Luca va en un marco de retrato (`.sc-port`, cuadrado
  redondeado con borde aquamarina) como en los diálogos de videojuego. **Desde el 27-oct es video:** siete loops 1:1
  mudos en `assets/luca/` (`face-idle-a/b/c.mp4` = vivo: sonrisa corta / cejas de saludo / casi quieto, este con
  `data-weight="2"`; `face-talk-a/b.mp4` = frases largas, `face-talk-c/d.mp4` = frases cortas; `face-poster.webp` = primer
  cuadro real, de fondo del marco), apilados dentro de `.sc-port` y manejados por **`assets/luca/luca-face.js`**
  (`LucaFace.mount`; copia del módulo del repo del sitio del club, no editarlo acá). Todos los clips empiezan y terminan en
  el mismo cuadro, y el reproductor **corta solo en tramos de reposo** medidos cuadro a cuadro (`META` dentro del módulo):
  al final de un clip, o antes si cambia el estado y hay reposo a mano; un clip de habla termina la frase antes de pasar a
  "vivo"; para empezar a hablar elige el clip de habla más corto que cubra lo que falta de texto. El glue (script "luca"
  del final del body) detecta el tipeo igual que `tourNext` (última letra con opacidad < 1, sin `tour-done`, escena en
  pantalla), le pasa cuándo termina (`--dur` del globo − 150 ms) y **retiene el tipeo** (`html.luca-wait`, hasta 900 ms)
  hasta que Luca arranca a hablar, así salen juntos. `.sc-port` lleva `data-keep` y el hook `onBeforeElUpdated` de
  morphdom devuelve `false` en esos nodos (el re-render de cada segundo no les toca clases ni `src`); por eso el `id` del
  diálogo pasó del `.sc-dlg` al botón `.sc-bub` (lo que se recrea por línea es solo el globo). Tamaño (27-oct, tarde):
  100 px en móvil y 142 en escritorio, montado sobre la esquina inferior izquierda del render (`margin-top` negativo =
  gap de la grilla + 30/40 px que pisa el render; `.sc-dlg` alinea arriba y la flecha del globo subió a `top:16px`).
  Los clips se cargan cuando el tour se acerca (`IntersectionObserver`, margen 60 %) y se pausan al alejarse; `muted`
  forzado por JS y reintento con el primer gesto, como el hero. Reduce Motion: solo el póster. Origen, método y cómo
  regenerar: `docs/luca/face/README.md` del repo del sitio del club (PSLSC Website); `post.py` de ahí copia videos y
  módulo a `assets/luca/`. Título elegido por
  Mariano: antetítulo "Six stops with Luca", h2 "Meet your future home." (se evitó "walk through": al club le suena a
  recorrer el estadio a pie); el CTA del hero pasó a "Meet the stadium" y el de la card A a "Take a look →". Se quitaron las seis "experiencias" que no existían (penal contra Luca,
  camiseta con tu nombre, etc.) y el ticket por sector. Reduce Motion: texto completo, sin tipeo. Chequeo headless:
  `python3 docs/tour/shoot.py` (Playwright con el Chrome instalado; salta la intro con Escape y recorre el tour).
  Segunda vuelta (26-oct, tarde): el directorio se estira a la altura exacta del render (grid de dos filas,
  `grid-template-areas:"win dir" "body ."`, filas del tótem con `flex:1`); el render activo siempre en leve
  movimiento (Ken Burns `scKb`/`scKb2`, 16 s ida y vuelta, alternado por parada; sin movimiento con Reduce
  Motion); la sección `#tour` pasó ANTES de `#build` ("Drag to see it rise"), y `#build` quedó en crema (sin
  `bg-con`) para que no se pegue al muro, que también es `bg-con`. Ojo con los nombres de las aéreas:
  `assets/aerial.webp` es la aérea nocturna ACTUAL (la del deck y la intro) e `assets/iso-night.webp` es un render
  VIEJO con torres residenciales; iso-night se usaba en el plano del tour (ya no existe), en la card A del bento y en
  `.mini-post .pb`, y esos dos usos pasaron a `aerial.webp`. `aerial.webp` también va en el slider y en los rellenos
  de texto `.post-big`/`.big`.
Para regenerarla desde la v1 hay que rehacer esos cambios (no hay build): es una copia editada, no una derivación.

## Postales (solo digital desde el 4-nov)
Propuesta: `../docs/frentes/groundbreaking/PROPUESTA-postales.md`. **Decisión del club (4-nov): la postal es solo digital, llega
por mail.** No hay impresas, domicilio, países ni cierre del 7/12. Firma provisoria: Gustavo Suárez, Founder & CEO (es lo único
que queda abierto). Reemplaza lo que más arriba se cuenta de la tira con ticket, los chips y el modal con checkbox de "digital".

- **Tira (`#postcards`):** "One postcard, yours today." + "Pick your favorite and we email it to you today, with your name on
  the back." + las 4 postales + **un botón del sitio** ("Get my postcard →") con la nota "By email · Free". Tocar una postal abre
  el registro con esa elegida. En móvil, carrusel con snap y el botón debajo. El mismo botón reemplazó al ticket del tour.
- **Frentes:** coral y amarillo quedan solo en stickers: "Greetings from" (01) pasó a `#0E8C79` y el sol de Luca (04) a arena
  `#E9D4A7`. En escritorio, texto y botón arriba y las postales en fila a todo el ancho (el abanico solapado se descartó).
- **Registro (`[data-mdl]`, `.pmd`):** 2 pasos (Postcard · You). La postal de la izquierda se da vuelta sola al pasar al paso 2
  (o con "Flip") y **se llena en vivo** con el nombre y el mensaje EN/ES; el bloque de dirección del dorso dice "BY EMAIL".
  Paso 2: nombre en la postal, email, idioma del mensaje (arranca en inglés) y un consentimiento obligatorio con 18+. Entra con
  la 01 elegida. En móvil, el dorso hace zoom a la mitad del mensaje y todo el paso entra sin scroll a 390 × 844.
- **Payload:** `{type:'register', postcard, digital_only:true, consent:true, name, email, message_lang, hp}`. `Code.gs` todavía
  acepta domicilio (si `digital_only` es false lo pide); se puede simplificar, pero no hace falta.
- **Lo que falta para publicar:** el **mail no sale todavía** (ActiveCampaign + imagen de la postal con el nombre), aunque el
  copy diga "we email it to you today". `Code.gs` nuevo **sin desplegar** (ver `docs/wall/README.md`): el de producción descarta
  `message_lang` y `consent`. La firma y las tipografías manuscritas del dorso son provisorias.

## Slider (feature/slider)
Propuesta y motivos: `../docs/frentes/groundbreaking/PROPUESTA-slider.md`. Reemplaza lo que más arriba se cuenta de "Drag to see it rise".

- **La cara izquierda es una imagen generada con IA a partir del render** (`assets/terreno.webp`, 1280×720; calza con el render),
  no una foto: por eso dice "The ground vs. 2028" / "THE GROUND" y la nota "Illustration of the site before construction."
  **"Today" va solo con una foto real del lote**: cuando llegue, cambiar el archivo, kicker y etiqueta, y sacar la nota. Va al
  natural, sin duotono (decisión de Martín, 2-nov).
- **La posición vive en `--cmp` sobre `.cmp`**, que lleva `data-keep`: morphdom no la toca y arrastrar no re-renderiza la página
  (el componente ya no tiene `pos` ni `onSlide`). Todo está en el script "Slider", después del de "reveal".
- **Pointer events, no el range:** en iOS el range solo responde si tocás el pulgar, que es invisible. El `<input>` queda para
  teclado y lectores de pantalla (flechas ±1, Shift + flecha ±10). Con el dedo la línea recién se mueve si el gesto arrancó
  horizontal, porque Safari manda `pointermove` antes de ceder al scroll (probado en el simulador de iPhone).
- **Las etiquetas viven dentro de su cara**, así que la línea las recorta y nunca quedan sobre la imagen equivocada.
- Arranca con el 72 % de la caja del lado del terreno, para que haya que arrastrar para ver el estadio. Al entrar en pantalla, un barrido de 72 % a 56 % y vuelta, una vez (sin él con Reduce Motion). La manija dice "Drag" hasta
  el primer arrastre (`data-cmp-touched` en `<html>`).

## Logo del estadio (feature/logo)
Logo "Groundbreaking" de marketing (3-nov): estadio de línea con el escudo + la palabra. El `.ai` trae tres versiones (aqua sobre
negro, negro, blanco); de ahí salen `assets/logo-groundbreaking-negro.svg` (nav, sobre crema) y `-aqua.svg` (footer, sobre verde),
vectoriales, sin fondo y recortados al dibujo (`pdftocairo -svg` + quitar el rectángulo de fondo y ajustar el `viewBox`). Se usan
con sus colores originales, sin recolorear. Alto: 40 px en el nav móvil, 54 en escritorio, 56 en el footer. Reemplazó al
pictograma dibujado a mano + "PORT ST. LUCIE / STADIUM".

## Reglas
- Fases: "Antes" (hasta el 12/12) y "Después" (desde el 13/12). Sin fase "Durante": el día del evento el contenido vive
  en redes.
- Copy en inglés.
- El chequeo de edad del muro es "I'm 13 or older" (3-nov; antes 18+): es el piso de COPPA para pedirle el email a un
  menor sin permiso de los padres. El consentimiento del registro de postales sigue en 18+.
