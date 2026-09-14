# Agent instructions — UMBRA-L cartel

Contexto y convenciones para cualquier agente (o persona) que trabaje en este repo.

## Qué es esto

SPA de una sola página (Vite, JS vanilla, sin framework) con el cartel/horario de la fiesta UMBRA-L. Hay tres "vistas" — portada, escenario exterior, escenario interior — pero **una sola página real y una sola URL**: `/exterior` e `/interior` no son rutas del servidor ni cambian la barra de direcciones (nada de `pushState`, a propósito — se probó y daba la sensación de "seguir siendo páginas separadas"), son solo estado interno del router en memoria. Si alguien entra directo a esas URLs de todos modos (marcador o enlace viejo de cuando sí eran páginas reales), el servidor las redirige (302) a la raíz — ver `redirectOldRoutes()` en `vite.config.js`. Antes eran tres páginas HTML reales; se cambió a SPA para poder hacer una transición fiable entre vistas (ver más abajo) sin coordinar dos cargas de página distintas.

- `src/router.js` (`initRouter()`) monta la vista actual en `#app`, intercepta clics en `a[data-view]`, y vuelve a llamar `startGenreDance()`/`startCursorTilt()` en cada montaje (esos módulos seleccionan elementos del DOM recién creado, no quedan "enganchados" a la vista anterior). No toca `history` para nada — la URL no existe como concepto dentro de la SPA, solo el estado `currentViewKey` en memoria.
- `src/views.js` (`VIEWS`) define las tres vistas: cada una es una función que devuelve el HTML de `<main class="cartel">...</main>`, más `isHome` (activa el modo "sin scroll" de la portada, ver más abajo).
- El logo de la cabecera (`RETICLE_ICON` en `render.js`) es decorativo en la portada, pero **en las vistas de escenario va envuelto en un enlace de vuelta a la portada** (`LOGO_LINK` en `views.js`: `<a class="cartel__logo-link" data-view="home" href=".">`). Lleva `data-view="home"` a propósito, así que lo intercepta el mismo listener de `router.js` que el resto de la navegación (transición diagonal incluida, URL sin cambios); no hay que añadir nada más para que funcione. El `<a>` se queda inline y sin `display` propio para que el hueco del icono sea idéntico al del logo suelto (verificado pixel a pixel), y `.cartel__logo-link` en `style.css` solo quita el subrayado y añade el cambio de color al pasar el ratón.
- Los datos de los DJs se rellenan a mano en `src/djs.js` (campo `stage: 'interior' | 'exterior'`) a partir de un formulario externo (Notion) que no forma parte de este repo. La lógica de renderizado compartida (chips de género, logo, lineup, horas totales) vive en `src/render.js`.

## Reglas de privacidad

Los DJs rellenan un formulario con más campos de los que se muestran aquí. **Nunca añadas al cartel público:**
- La hora de llegada tal cual la escribió el DJ (`arrival` en `djs.js`) — solo se usa como dato interno para ordenar/calcular el horario mostrado, nunca se imprime literalmente

El formulario tenía un campo de contacto por WhatsApp (privado, nunca se mostró) que la organización sustituyó por un campo de **Instagram** — ese sí está pensado para ser público: se muestra como icono enlazado junto al nombre del DJ (`instagram` en `djs.js`, ver `renderInstagramLink()` en `src/render.js`) solo cuando el DJ lo ha rellenado.

Si en el futuro se conecta este proyecto a una fuente de datos real (API, export de Notion, etc.), `arrival` debe seguir tratándose como interno.

## Cómo se construye el horario

`src/schedule.js` NO usa horas de llegada para fijar el horario mostrado: cada escenario pasa su propia `eventStart` a `buildSchedule()`, que encadena sets consecutivos de `SET_MINUTES` sin huecos. El **orden** de actuación es directamente el orden de los DJs en el array `djs.js` (filtrado por `stage`) — es una curación manual, no un sort automático. Al reordenar, ten en cuenta el criterio ya aplicado: no abrir con schranz (desgasta pronto al público), subir la intensidad/BPM progresivamente, dejar los géneros más duros para el tramo final de cada escenario. Si cambias esto, mantén la propiedad de "sin huecos" salvo que se pida explícitamente lo contrario.

## Botón "Imprimir cartel" (desactivado temporalmente)

El import de `print.js`, `${PRINT_BUTTON}` en `views.js` (footer compartido) y la llamada a `setupPrintButton()` están comentados/omitidos — desactivado a petición explícita, "por ahora". `print.js` en sí sigue intacto; para reactivarlo, hay que volver a engancharlo (footer en `views.js` + llamada en `router.js`, tras cada `mount()` igual que `startGenreDance`/`startCursorTilt`, porque el botón se recrea en cada cambio de vista). Mientras está desactivado, `html2canvas`/`jspdf` no entran en el bundle (tree-shaking).

Cuando esté activo: genera un PDF con `html2canvas` capturando `.cartel` (ignorando cualquier elemento con la clase `no-print`) y lo mete en un PDF de **una sola página de `jsPDF`** con el tamaño exacto del contenido — nada de paginación automática tipo A4 (se probó con `html2pdf.js` primero y su reparto en páginas está pensado para documentos, no para un elemento largo y estrecho como este cartel). Descarga siempre como `umbral3.pdf`.

Dos detalles que costó descubrir y no hay que deshacer:
- El fondo oscuro vive en `<body>` (radial-gradient), así que antes de capturar se fuerza `background-color` inline en `.cartel` — si no, html2canvas lo captura con fondo blanco y el texto claro queda ilegible.
- La imagen se exporta como **JPEG** (calidad 0.92), no PNG: el degradado de fondo comprime fatal sin pérdida (PNG daba >15 MB para este mismo cartel; JPEG da ~400 KB sin diferencia visible).

## Baile de los chips de género

`src/genre-dance.js` (`startGenreDance()`, llamado desde `router.js` en cada `mount()`) hace que cada 500ms, 5 chips de `.genres__item` elegidos al azar pasen a `.genres__item--active` (tinte verde, no relleno sólido — se probó sólido y "mareaba") y los 5 de la ronda anterior vuelvan al estado normal; la ronda siguiente evita repetir los mismos 5 (salvo que no haya suficientes chips para evitarlo). Es puramente decorativo.

## Tilt del cursor

`src/tilt.js` (`startCursorTilt()`, llamado desde `router.js` en cada `mount()`) inclina **`#app`** en 3D según la posición del cursor (`rotateX`/`rotateY`, `MAX_TILT_DEG = 2.5`). La perspectiva va **como función del propio transform** — `transform: perspective(1200px) rotateX(...) rotateY(...)`, con `PERSPECTIVE_PX = 1200` en `tilt.js` — y NO como propiedad `perspective` en `html` (que es como estaba antes y rompía la franja de escenario, ver más abajo). `#app` sigue necesitando `transform-style: preserve-3d` (`style.css`).

**Importante: la rotación va en `#app`, nunca en `<body>` directamente.** Se probó sobre `body` primero y causaba un bug serio: cualquier ancestro con `transform` se convierte en el "containing block" de sus descendientes `position: fixed` (regla real de CSS). `.page-mask` (la máscara de la transición, ver más abajo) cuelga de `<body>`; si `<body>` tuviera el transform, la máscara dejaría de fijarse al viewport real y pasaría a fijarse a `<body>` — que en la vista de escenario es altísimo (todo el lineup), inflando la máscara (`inset: -25%` de un `body` de miles de píxeles) hasta el punto de añadir scroll vertical real de sobra: se podía bajar y "colarse" en la zona verde de la animación, con doble scrollbar visible. Rotando `#app` (que NO es ancestro de `.page-mask`, son hermanos bajo `body`) el problema desaparece, porque `<body>` se queda sin transform y `.page-mask` vuelve a fijarse correctamente al viewport.

**`perspective` tiene exactamente el mismo efecto que `transform` como containing block** (no solo `transform`, como se documentó al principio): un ancestro con `perspective` distinta de `none` también pasa a ser el containing block de sus descendientes `position: fixed`. Por eso la perspectiva del tilt NO puede vivir en `html` (donde estaba: `html { perspective: 1200px }`): al ser `<html>` ancestro de todo, `.stage-banner` y `.page-mask` (que cuelgan de `<body>` a propósito, ver sus secciones) dejaban de fijarse al viewport y se anclaban al documento entero — la franja quedaba en el `top: 0` de la página (`getBoundingClientRect().y === -scrollY`, se iba con el scroll y no se veía nunca) y la máscara, con su `inset: -25%`, inflaba el alto del documento (~390px de scroll de sobra en la vista de escenario). Moviendo la perspectiva al propio `transform` de `#app` (`perspective(1200px) ...`) el efecto 3D del tilt se mantiene igual y `<html>` se queda sin containing block propio.

Al rotar en 3D, las esquinas de `#app` se salen del viewport y provocan scroll fantasma — por eso `html` y `body` llevan `overflow-x: hidden`. La vista de escenario necesita `overflow-y` libre (el lineup es largo), así que esto NO se generaliza a `overflow: hidden` a secas en ninguno de los dos. Nota: con `overflow:hidden` activo, `scrollHeight` puede seguir reportando un valor inflado por la rotación aunque el scroll esté realmente bloqueado — para comprobar si hay scroll de verdad, no te fíes de `scrollHeight > clientHeight`, prueba a forzar `scrollTop`/`scrollLeft` y comprueba si se mueve.

La vista de portada va un paso más allá: nunca debe tener scroll ni siquiera vertical. `router.js` alterna la clase `page-home` en `<html>` y `<body>` según `VIEWS[key].isHome` en cada `mount()` (no es un atributo estático del HTML, cambia con la vista). Con esa clase activa: `overflow: hidden` en ambos ejes, `height: 100vh` (no `min-height`), y `.cartel` pasa a `display:flex; flex-direction:column; justify-content:space-between` para repartir cabecera y pie en el alto exacto del viewport en vez de depender de `margin-bottom`.

Ese bloque **solo se aplica a partir de 641px de ancho** (`@media (min-width: 641px)`). En móvil el contenido crece más alto (los chips y los botones de escenario ocupan más filas al tener menos ancho), y forzar 100vh + overflow:hidden ahí recortaba el final del pie en vez de dejarlo fluir — en móvil la portada usa el comportamiento normal (scroll si hace falta, `margin-bottom` de toda la vida). Si la portada crece con más contenido en desktop, vigila que siga cabiendo en 100vh (con `overflow:hidden` un desbordamiento se recorta, no scrollea).

Dos ajustes más, específicos de móvil (`max-width: 640px`), para que la portada nunca tenga scroll ahí tampoco:
- `body.page-home #app { transform: none !important }` anula la rotación del tilt (con `!important` porque `tilt.js` fija el transform inline) — la propia rotación, aunque sea de solo unos grados, ya añadía overflow vertical residual.
- `body { padding-block: 2rem }` en vez de los `4rem` de desktop — con `4rem` (128px totales) el contenido de la portada se pasaba del alto de un móvil normal por ~36px; no es un bug del tilt, simplemente sobraba padding para esa pantalla.

## Franja del nombre de escenario al hacer scroll

`src/stage-banner.js` muestra una franja verde fija arriba de toda la pantalla con "EXTERIOR" o "INTERIOR" en cuanto la frase `.cartel__stage` ("Escenario exterior/interior", en la cabecera) deja de verse al hacer scroll, y la oculta en cuanto vuelve a verse.

- El `<div class="stage-banner">` se crea **una sola vez** (`initStageBanner()`, llamado desde `initRouter()`) y cuelga de `<body>`, **no de `#app`** — mismo motivo que `.page-mask` (ver sección de tilt más arriba): si viviera dentro de `#app` heredaría su `transform` como containing block y su `position: fixed` dejaría de fijarse al viewport real.
- **La franja solo funciona si el viewport es su containing block.** Estuvo un tiempo sin verse nunca: el `perspective: 1200px` que tenía `html` hacía de `<html>` containing block de todos los `position: fixed`, así que la franja se posicionaba en el `top: 0` del documento y se iba con el scroll (la clase `stage-banner--visible` se aplicaba bien y el transform era correcto, pero `getBoundingClientRect().y` era `-scrollY`). Si vuelve a "no verse", comprobar esto primero con Playwright: `banner.offsetParent` debe ser `null` (si devuelve `HTML` o `BODY`, hay un `transform`/`perspective`/`will-change` en un ancestro) y con `window.scrollTo(0, 600)` su `rect.y` debe seguir siendo `0`.
- **La visibilidad se calcula con `getBoundingClientRect()` en un listener de `scroll` limitado a una vez por frame (`requestAnimationFrame`), no con `IntersectionObserver`.** Se probó primero con `IntersectionObserver` y en móvil, con scroll con inercia (fling) y la barra de direcciones ocultándose/mostrándose, llegó a reportar "visible" otra vez a mitad del gesto — la franja se veía solo un instante. Midiendo la posición real (`stageLabel.getBoundingClientRect().bottom <= 0`) en cada frame el resultado es siempre el actual, sin depender de cuándo decide disparar el observer por debajo.
- `updateStageBanner(viewKey)` se llama en cada `mount()` (`router.js`) y actualiza qué elemento vigilar (`stageLabel`, variable de módulo) y el texto de la franja. En portada no existe `.cartel__stage`, así que simplemente oculta la franja y deja `stageLabel` a `null` (el listener de scroll, que es único y permanente desde `initStageBanner()`, no hace nada si no hay `stageLabel`).
- Mostrar/ocultar es una transición CSS de `transform` (`translateY(-100%)` ↔ `translateY(0)`, 0.35s) en `.stage-banner`/`.stage-banner--visible` — se desliza hacia abajo para aparecer y hacia arriba para desaparecer, a petición explícita.
- `z-index: 500`, por debajo de `.page-mask` (9999): durante una transición de vista la máscara verde debe tapar también la franja.

## Transición diagonal entre vistas

`src/page-transition.js` añade una máscara verde diagonal (`.page-mask`, `<div>` creado una vez por `initPageMask()` y reutilizado toda la sesión) que cubre la pantalla al cambiar de vista y se retira tras el cambio. Al ser SPA, todo ocurre en el mismo documento — sin recargas reales que coordinar entre sí, todo el ciclo cubrir → cambiar contenido → retirar pasa por una sola función async (`wipeTransition(swapContent)`), llamada desde `router.js` en cada clic sobre `a[data-view]`.

- La dirección del barrido es aleatoria en cada transición (`DIRECTIONS`: 4 combinaciones de `skewX`/`skewY` con signo) — a petición explícita, antes siempre iba igual y se veía repetitivo.
- Al cambiar de dirección, hace falta quitar la clase `--animate`, fijar la posición oculta de la nueva dirección, forzar reflow (`void mask.offsetWidth`) y solo entonces reactivar la transición y animar a "cubriendo" — si no, el navegador puede saltar directo sin animar (la máscara podía llevar el skew de la dirección anterior).
- `TRANSITION_MS` (500) debe coincidir con la duración del `transition` en `.page-mask--animate` en `style.css`.
- El router excluye de la intercepción los enlaces sin `data-view` (anclas internas como `#lineup`, o links externos tipo Instagram) — solo los `<a data-view="...">` de la navegación entre vistas disparan la transición.

## Diseño

Paleta e identidad tomadas de un branding real (logo tipo retícula/mira, negro + verde ácido `#c6ff1a`, tipografía Orbitron para títulos y Oswald para el resto). Si tienes acceso al archivo de fuente original del branding, esa es una mejora pendiente frente a la aproximación actual con Google Fonts.

El scrollbar (`scrollbar-color` + `::-webkit-scrollbar-*`) y la selección de texto (`::selection`) también están en verde ácido en vez de los estilos por defecto del navegador — mantener esto si tocas `style.css`.

## Verificación

Antes de dar por terminado un cambio visual:
1. `npm run build` debe compilar sin errores.
2. Si es posible, verifica visualmente el resultado. Este entorno no tiene un navegador integrado, pero suele haber `playwright-core` instalado globalmente junto con una build de Chromium cacheada (buscar en `~/.cache/ms-playwright/`), utilizable para tomar capturas de pantalla headless sin depender de un paquete del proyecto.
3. Para esta SPA en concreto, comprueba también la navegación entre vistas (clic en cada `a[data-view]`, la URL debe permanecer siempre igual) y que `/interior` y `/exterior` siguen redirigiendo (302) a la raíz — es fácil romper una de las dos cosas sin querer al tocar `router.js` o `vite.config.js`.

## Control de versiones

Cada cambio se commitea y se sube (`git add`, `git commit`, `git push`) sin esperar a que se pida explícitamente — no dejar cambios sueltos sin subir al terminar una tarea.

## Despliegue local

El servidor de desarrollo se sirve siempre dentro de una sesión `tmux` llamada `umbral`, nunca como proceso suelto en segundo plano — así es accesible/reiniciable de forma predecible. Se publica vía Tailscale (`tailscale serve` / `tailscale funnel`) bajo la ruta `/umbral3` en el mismo nodo que sirve otras apps — cualquier cambio a la configuración de Tailscale Serve/Funnel en ese nodo puede afectar a esas otras rutas, así que se revisa el `tailscale serve status` completo antes y después de tocarlo.
