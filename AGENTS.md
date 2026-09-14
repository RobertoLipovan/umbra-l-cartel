# Agent instructions — UMBRA-L cartel

Contexto y convenciones para cualquier agente (o persona) que trabaje en este repo.

## Qué es esto

Sitio estático multi-página (Vite, JS vanilla) con el cartel/horario de la fiesta UMBRA-L. Hay dos escenarios, cada uno con su propia página y horario independiente:
- `/` (`index.html` + `src/main.js`) — portada: enlaza a los dos escenarios, sin horario propio.
- `/exterior` (`exterior.html` + `src/exterior-main.js`) — sábado 16:00 en adelante.
- `/interior` (`interior.html` + `src/interior-main.js`) — sábado 23:00 en adelante, termina en un b2b de cierre sin hora fija (`closingSets` en `src/interior-main.js`).

Las rutas `/interior` y `/exterior` (sin `.html`) solo funcionan gracias al plugin `cleanUrls` en `vite.config.js`, que reescribe la petición al archivo `.html` correspondiente — necesario tanto en el dev server como en `vite preview`. Los datos de los DJs se rellenan a mano en `src/djs.js` (campo `stage: 'interior' | 'exterior'`) a partir de un formulario externo (Notion) que no forma parte de este repo. La lógica de renderizado común a ambas páginas vive en `src/render.js`.

## Reglas de privacidad

Los DJs rellenan un formulario con más campos de los que se muestran aquí. **Nunca añadas al cartel público:**
- La hora de llegada tal cual la escribió el DJ (`arrival` en `djs.js`) — solo se usa como dato interno para ordenar/calcular el horario mostrado, nunca se imprime literalmente

El formulario tenía un campo de contacto por WhatsApp (privado, nunca se mostró) que la organización sustituyó por un campo de **Instagram** — ese sí está pensado para ser público: se muestra como icono enlazado junto al nombre del DJ (`instagram` en `djs.js`, ver `renderInstagramLink()` en `src/render.js`) solo cuando el DJ lo ha rellenado.

Si en el futuro se conecta este proyecto a una fuente de datos real (API, export de Notion, etc.), `arrival` debe seguir tratándose como interno.

## Cómo se construye el horario

`src/schedule.js` NO usa horas de llegada para fijar el horario mostrado: cada escenario pasa su propia `eventStart` a `buildSchedule()`, que encadena sets consecutivos de `SET_MINUTES` sin huecos. El **orden** de actuación es directamente el orden de los DJs en el array `djs.js` (filtrado por `stage`) — es una curación manual, no un sort automático. Al reordenar, ten en cuenta el criterio ya aplicado: no abrir con schranz (desgasta pronto al público), subir la intensidad/BPM progresivamente, dejar los géneros más duros para el tramo final de cada escenario. Si cambias esto, mantén la propiedad de "sin huecos" salvo que se pida explícitamente lo contrario.

## Botón "Imprimir cartel" (desactivado temporalmente)

El import de `print.js`, `${PRINT_BUTTON}` en el pie y la llamada a `setupPrintButton()` están comentados (no borrados) en las tres páginas — desactivado a petición explícita, "por ahora". `print.js` en sí sigue intacto; para reactivarlo, descomentar esas tres líneas en `main.js`/`exterior-main.js`/`interior-main.js`. Mientras está desactivado, `html2canvas`/`jspdf` no entran en el bundle (tree-shaking), así que el build no los verás listados hasta que se reactive.

Cuando esté activo: cada página tiene un botón en el pie (`src/print.js`, `setupPrintButton()`) que genera un PDF y lo descarga siempre como `umbral3.pdf`, sea cual sea la página. Captura `.cartel` con `html2canvas`, ignorando cualquier elemento con la clase `no-print` (navegación, el propio botón, el aviso de scroll "CARTEL"), y mete esa imagen en un PDF de **una sola página de `jsPDF`** con el tamaño exacto del contenido — nada de paginación automática tipo A4: se probó con `html2pdf.js` primero y su lógica de reparto en páginas está pensada para documentos, no para un elemento largo y estrecho como este cartel (salía una página en blanco con una miniatura diminuta arriba). `html2canvas` y `jspdf` se cargan con `import()` dinámico solo al pulsar el botón, para no meter ~600 KB en el bundle inicial.

Dos detalles que costó descubrir y no hay que deshacer:
- El fondo oscuro vive en `<body>` (radial-gradient), así que antes de capturar se fuerza `background-color` inline en `.cartel` — si no, html2canvas lo captura con fondo blanco y el texto claro queda ilegible.
- La imagen se exporta como **JPEG** (calidad 0.92), no PNG: el degradado de fondo comprime fatal sin pérdida (PNG daba >15 MB para este mismo cartel; JPEG da ~400 KB sin diferencia visible).

## Baile de los chips de género

`src/genre-dance.js` (`startGenreDance()`, llamado desde las tres páginas) hace que cada 500ms, 5 chips de `.genres__item` elegidos al azar pasen a `.genres__item--active` (fondo verde relleno) y los 5 de la ronda anterior vuelvan al estado normal; la ronda siguiente evita repetir los mismos 5 (salvo que no haya suficientes chips para evitarlo). Es puramente decorativo — no toca el PDF de forma especial, así que "Imprimir cartel" puede capturar cualquier combinación de chips activos en el momento del clic; eso es intencional, no un bug.

## Tilt del cursor

`src/tilt.js` (`startCursorTilt()`, llamado desde las tres páginas) inclina el `<body>` en 3D según la posición del cursor (`rotateX`/`rotateY`, `MAX_TILT_DEG = 2.5`). Necesita `perspective` en `html` y `transform-style: preserve-3d` en `body` (`style.css`). Al rotar en 3D, las esquinas del `body` se salen del viewport y provocan scroll fantasma — por eso `html` **y** `body` llevan `overflow-x: hidden` (el overflow lo causa el `body` rotado saliéndose de `html`, su padre; poner `overflow:hidden` solo en `body` no basta, hace falta en los dos). Las páginas de escenario necesitan `overflow-y` libre (son largas), así que esto NO se generaliza a `overflow: hidden` a secas en ninguno de los dos.

La portada (`index.html`, clase `page-home` en `<html>` y `<body>`) va un paso más allá: nunca debe tener scroll ni siquiera vertical (con `min-height:100vh` normal, el tilt hacía parpadear la scrollbar al aparecer/desaparecer unos px de overflow). Por eso `html.page-home`/`body.page-home` fijan `overflow: hidden` en ambos ejes y `height: 100vh` (no `min-height`), y `.cartel` pasa a `display:flex; flex-direction:column; justify-content:space-between` para repartir cabecera y pie en el alto exacto del viewport en vez de depender de `margin-bottom`.

Este bloque **solo se aplica a partir de 641px de ancho** (`@media (min-width: 641px)`). En móvil el contenido crece más alto (los chips de género y los botones de escenario ocupan más filas al tener menos ancho), y forzar 100vh + overflow:hidden ahí recortaba el final del pie en vez de dejarlo fluir — en móvil la portada usa el comportamiento normal (scroll si hace falta, `margin-bottom` de toda la vida). Si la portada crece con más contenido en desktop, vigila que siga cabiendo en 100vh — con `overflow:hidden` un desbordamiento se recorta en vez de scrollear (y si no cabe, la solución es subir el breakpoint o quitar el truco, no forzarlo).

Dos ajustes más, específicos de móvil (`max-width: 640px`), para que la portada nunca tenga scroll ahí tampoco:
- `body.page-home { transform: none !important }` anula la rotación del tilt (con `!important` porque `tilt.js` fija el transform inline, de mayor especificidad) — la propia rotación, aunque sea de solo unos grados, ya añadía overflow vertical residual.
- `body { padding-block: 2rem }` en vez de los `4rem` de desktop — con `4rem` (128px totales) el contenido de la portada se pasaba del alto de un móvil normal por ~36px; no es un bug del tilt, simplemente sobraba padding para esa pantalla.

## Transición diagonal entre páginas

`src/page-transition.js` (`setupPageTransition()`, llamado desde las tres páginas) añade una máscara verde diagonal (`.page-mask`, `<div>` creado por JS y añadido a `document.body`) que cubre la pantalla al hacer clic en un enlace interno y se retira al cargar la página destino. Es un sitio multi-página real (no SPA ni View Transitions API), así que salida y entrada son dos animaciones independientes coordinadas a mano con `setTimeout`/`sessionStorage`, no una transición nativa del navegador.

- La dirección del barrido es aleatoria en cada clic (`DIRECTIONS`: 4 combinaciones de `skewX`/`skewY` con signo), a petición explícita — antes siempre iba en la misma dirección y se veía repetitivo.
- La dirección elegida al salir se guarda en `sessionStorage` (`STORAGE_KEY`) y la página siguiente la lee al entrar, para que el barrido se sienta continuo entre una página y la otra en vez de dar un salto visual; si no hay nada guardado (carga directa, refresco), la entrada elige una dirección al azar.
- Al cambiar de dirección en el `click`, hace falta quitar la clase `--animate`, fijar la posición oculta de la nueva dirección, forzar reflow (`void mask.offsetWidth`) y solo entonces reactivar la transición — si no, el navegador puede saltar directo a la posición final sin animar (la máscara podía llevar el skew de otra dirección de un ciclo anterior).
- `TRANSITION_MS` (500) debe coincidir con la duración del `transition` en `.page-mask--animate` en `style.css` — es el tiempo que se espera antes de navegar de verdad con `window.location.href`.
- Excluye de la intercepción los enlaces con `href="#..."` (anclas dentro de la misma página, como el aviso "CARTEL") y los que abren en pestaña nueva o apuntan a otro origen (Instagram).

## Diseño

Paleta e identidad tomadas de un branding real (logo tipo retícula/mira, negro + verde ácido `#c6ff1a`, tipografía Orbitron para títulos y Oswald para el resto). Si tienes acceso al archivo de fuente original del branding, esa es una mejora pendiente frente a la aproximación actual con Google Fonts.

El scrollbar (`scrollbar-color` + `::-webkit-scrollbar-*`) y la selección de texto (`::selection`) también están en verde ácido en vez de los estilos por defecto del navegador — mantener esto si tocas `style.css`.

## Verificación

Antes de dar por terminado un cambio visual:
1. `npm run build` debe compilar sin errores.
2. Si es posible, verifica visualmente el resultado. Este entorno no tiene un navegador integrado, pero suele haber `playwright-core` instalado globalmente junto con una build de Chromium cacheada (buscar en `~/.cache/ms-playwright/`), utilizable para tomar capturas de pantalla headless sin depender de un paquete del proyecto.

## Control de versiones

Cada cambio se commitea y se sube (`git add`, `git commit`, `git push`) sin esperar a que se pida explícitamente — no dejar cambios sueltos sin subir al terminar una tarea.

## Despliegue local

El servidor de desarrollo se sirve siempre dentro de una sesión `tmux` llamada `umbral`, nunca como proceso suelto en segundo plano — así es accesible/reiniciable de forma predecible. Se publica vía Tailscale (`tailscale serve` / `tailscale funnel`) bajo la ruta `/umbral3` en el mismo nodo que sirve otras apps — cualquier cambio a la configuración de Tailscale Serve/Funnel en ese nodo puede afectar a esas otras rutas, así que se revisa el `tailscale serve status` completo antes y después de tocarlo.
