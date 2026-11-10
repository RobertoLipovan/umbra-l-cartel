# Agent instructions — UMBRA-L cartel

Contexto y convenciones para cualquier agente (o persona) que trabaje en este repo.

## Qué es esto

**Landing de una sola página** (Vite, JS vanilla, sin framework) con el cartel/horario de la fiesta UMBRA-L: la cabecera con el nombre y los géneros, y debajo los dos escenarios apilados (`<section class="stage" id="exterior">` y `#interior`), cada uno con su horario completo. **No hay navegación anidada ni vistas**: la antigua portada con dos botones y las vistas separadas por escenario se retiraron a petición explícita ("hazlo como una landing page, no así anidado"). Los botones de la cabecera son anclas normales (`href="#exterior"`, `href="#interior"`) que resuelve el navegador con el `scroll-behavior: smooth` de `html`, sin JavaScript.

- `src/router.js` (`initRouter()`) ya no enruta nada: monta la landing una sola vez en `#app` e inicializa la franja de escenario. El router de tres vistas, la transición diagonal y el reset de scroll siguen en el repo (`router.js` los documenta en un comentario) pero no se usan.
- `src/views.js` exporta `renderLanding()`, que devuelve el `<main class="cartel">` completo; `renderStageSection()` pinta una sección por escenario.
- La cabecera es **solo texto**: kicker (`UMBRA-L`, pequeño y espaciado), título grande (`Casa Techno 3.0`, que es `event.edition`) y el cartel de artistas. Se retiraron a petición el isotipo de retícula (`RETICLE_ICON`), las dos líneas diagonales verdes (eran `.cartel__header::before`/`::after`) y los botones de salto a cada escenario (`stage-nav`) — este último cambio posterior a la primera versión de la landing. `RETICLE_ICON` sigue exportado en `render.js` sin usarse, y `.cartel__logo*` / `.stage-nav*` siguen en `style.css` sin usarse, por si se recuperan.
- Ojo con el orden: el nombre corto **UMBRA-L** va en el kicker y el largo **Casa Techno 3.0** en el título (estuvieron al revés). Al ser más largo, el `clamp()` del título es más contenido que cuando el título era el nombre.
- **`/interior` y `/exterior` ya no existen como URLs**: la SPA no tiene rutas, y quien entre a esas direcciones (marcador o enlace viejo de cuando sí eran páginas reales) recibe un **302 a `/`**. Hay que mantenerlo en los dos sitios: el middleware `redirectOldRoutes()` de `vite.config.js` (dev) y dos reglas `location = /interior` / `location = /exterior` en el `nginx.conf` de producción.
- El cartel se edita en `src/lineup.json`, la **fuente de verdad única**: un objeto `event` (nombre, edición, fecha, desfase horario) y una lista de `stages`, cada uno con sus `sets` (`start`/`end` en hora local `HH:MM`, `artists`, `genres`, `bpm`) y opcionalmente `closing` (cierre de hora abierta). Un set con varios `artists` se pinta como B2B. `src/djs.js` es solo un adaptador que deriva de ahí un registro plano de artistas (para el cartel tipográfico de la cabecera) y expone `EVENT`/`STAGES`/`getStage()`. La lógica de renderizado compartida (cartel de artistas, logo, lineup, horas totales) vive en `src/render.js`.

## Reglas de privacidad

Los DJs rellenan un formulario con más campos de los que se muestran aquí. **Nunca añadas al cartel público:**
- La hora de llegada tal cual la escribió el DJ (el antiguo campo `arrival`, ya eliminado del JSON) — era un dato interno para ordenar/calcular, nunca se imprimía literalmente

El formulario tenía un campo de contacto por WhatsApp (privado, nunca se mostró) que la organización sustituyó por un campo de **Instagram** — ese sí está pensado para ser público: se muestra como icono enlazado junto al nombre del DJ (`instagram` en `lineup.json`, ver `renderInstagramLink()` en `src/render.js`) solo cuando el DJ lo ha rellenado.

Si en el futuro se conecta este proyecto a una fuente de datos real (API, export de Notion, etc.), cualquier dato de contacto o de logística debe seguir tratándose como interno y no entrar en `lineup.json`.

## Cómo se construye el horario

Las horas son **datos, no cálculo**: cada set de `src/lineup.json` trae su `start` y su `end` en hora local de Madrid (`HH:MM`, sin fecha). `src/schedule.js` (`buildSchedule()`) solo las convierte a `Date` usando `event.day` + `event.utcOffset`, y aplica la regla de cambio de día: cualquier hora anterior a `event.nextDayBefore` (`12:00`) pertenece al día siguiente, porque el evento cruza medianoche. Esa conversión construye el ISO con el desfase explícito (`2026-10-03T15:00:00+02:00`) a propósito: `setHours`/`setDate` operan en la zona del runtime y darían horas equivocadas en un servidor en UTC.

Consecuencias que hay que respetar al editar el JSON:

- **El orden del array ES el orden del cartel.** Es curación manual, no un sort automático. Criterio aplicado: no abrir con schranz (desgasta pronto al público), subir intensidad/BPM progresivamente, dejar los géneros más duros para el tramo final.
- **Puede haber huecos** (en el cartel de 2026 hay una pausa de 30 min a medianoche). No se pintan como fila, solo se ven en las horas de cada set. Por eso `renderHoursLine()` **suma las duraciones reales** de los sets en lugar de restar último-fin menos primer-inicio, y el texto dice "horas de música", sin "ininterrumpida".
- **Duración libre por set**: no hay `SET_MINUTES`. Hay bloques de 2h y de 1h.
- **Cierre abierto**: `stage.closing` (p. ej. `Secret line up` a las 09:30) se pinta con `→` y sin hora de fin, reutilizando el estilo `.lineup__item--open`.
- **Sin datos todavía**: `genres: ["Por confirmar"]` no aparece en los chips de género (`PLACEHOLDER_GENRES` en `render.js`) y en el lineup se pinta atenuado; `bpm: null` simplemente no pinta el chip de BPM; `tba: true` pinta "Por anunciar" y atenúa la fila entera.

## Botón "Imprimir cartel" (desactivado temporalmente)

El import de `print.js`, `${PRINT_BUTTON}` en `views.js` (footer compartido) y la llamada a `setupPrintButton()` están comentados/omitidos — desactivado a petición explícita, "por ahora". `print.js` en sí sigue intacto; para reactivarlo, hay que volver a engancharlo (footer en `views.js` + llamada en `router.js`, tras cada `mount()`, porque el botón se recrea en cada cambio de vista). Mientras está desactivado, `html2canvas`/`jspdf` no entran en el bundle (tree-shaking).

Cuando esté activo: genera un PDF con `html2canvas` capturando `.cartel` (ignorando cualquier elemento con la clase `no-print`) y lo mete en un PDF de **una sola página de `jsPDF`** con el tamaño exacto del contenido — nada de paginación automática tipo A4 (se probó con `html2pdf.js` primero y su reparto en páginas está pensado para documentos, no para un elemento largo y estrecho como este cartel). Descarga siempre como `umbral3.pdf`.

Dos detalles que costó descubrir y no hay que deshacer:
- El fondo oscuro vive en `<body>` (radial-gradient), así que antes de capturar se fuerza `background-color` inline en `.cartel` — si no, html2canvas lo captura con fondo blanco y el texto claro queda ilegible.
- La imagen se exporta como **JPEG** (calidad 0.92), no PNG: el degradado de fondo comprime fatal sin pérdida (PNG daba >15 MB para este mismo cartel; JPEG da ~400 KB sin diferencia visible).

## Baile de los chips de género — DESACTIVADO

Retirado a petición explícita ("quita la animación de los géneros"). `src/genre-dance.js` (`startGenreDance()`) sigue en el repo intacto, pero **ya no se importa ni se llama** desde `router.js`, así que no entra en el bundle. Mientras está activo: cada 500ms, 5 chips de `.genres__item` elegidos al azar pasan a `.genres__item--active` (tinte verde, no relleno sólido — se probó sólido y "mareaba") y los 5 de la ronda anterior vuelven al estado normal; la ronda siguiente evita repetir los mismos 5 (salvo que no haya suficientes chips para evitarlo). Era puramente decorativo.

Para reactivarlo: importar `startGenreDance` en `router.js`, llamarlo dentro de `mount()` y recuperar la regla `.genres__item--active` (y el `transition` de `.genres__item`) en `style.css`, que se quitaron junto con la animación.

## Tilt del cursor — DESACTIVADO

Retirado a petición explícita ("quita la animación de cursor"). `src/tilt.js` (`startCursorTilt()`) sigue en el repo intacto, pero **ya no se importa ni se llama** desde `router.js`, así que no entra en el bundle. `#app` ya no lleva `transform-style: preserve-3d` (se quitó con la animación).

Todo lo que sigue documenta cómo estaba montado, porque es la explicación de por qué `.page-mask` y `.stage-banner` cuelgan de `<body>` y no de `#app` — esa decisión **sigue vigente** aunque el tilt ya no exista:

`src/tilt.js` (`startCursorTilt()`) inclinaba **`#app`** en 3D según la posición del cursor (`rotateX`/`rotateY`, `MAX_TILT_DEG = 2.5`). La perspectiva iba **como función del propio transform** — `transform: perspective(1200px) rotateX(...) rotateY(...)`, con `PERSPECTIVE_PX = 1200` en `tilt.js` — y NO como propiedad `perspective` en `html` (que es como estaba antes y rompía la franja de escenario, ver más abajo). `#app` necesitaba `transform-style: preserve-3d` (`style.css`).

Para reactivarlo: importar `startCursorTilt` en `router.js`, llamarlo dentro de `mount()`, devolver `transform-style: preserve-3d` a `#app` y comprobar que la franja de escenario y la máscara de transición siguen fijándose al viewport.

**Importante: la rotación va en `#app`, nunca en `<body>` directamente.** Se probó sobre `body` primero y causaba un bug serio: cualquier ancestro con `transform` se convierte en el "containing block" de sus descendientes `position: fixed` (regla real de CSS). `.page-mask` (la máscara de la transición, ver más abajo) cuelga de `<body>`; si `<body>` tuviera el transform, la máscara dejaría de fijarse al viewport real y pasaría a fijarse a `<body>` — que en la vista de escenario es altísimo (todo el lineup), inflando la máscara (`inset: -25%` de un `body` de miles de píxeles) hasta el punto de añadir scroll vertical real de sobra: se podía bajar y "colarse" en la zona verde de la animación, con doble scrollbar visible. Rotando `#app` (que NO es ancestro de `.page-mask`, son hermanos bajo `body`) el problema desaparece, porque `<body>` se queda sin transform y `.page-mask` vuelve a fijarse correctamente al viewport.

**`perspective` tiene exactamente el mismo efecto que `transform` como containing block** (no solo `transform`, como se documentó al principio): un ancestro con `perspective` distinta de `none` también pasa a ser el containing block de sus descendientes `position: fixed`. Por eso la perspectiva del tilt NO puede vivir en `html` (donde estaba: `html { perspective: 1200px }`): al ser `<html>` ancestro de todo, `.stage-banner` y `.page-mask` (que cuelgan de `<body>` a propósito, ver sus secciones) dejaban de fijarse al viewport y se anclaban al documento entero — la franja quedaba en el `top: 0` de la página (`getBoundingClientRect().y === -scrollY`, se iba con el scroll y no se veía nunca) y la máscara, con su `inset: -25%`, inflaba el alto del documento (~390px de scroll de sobra en la vista de escenario). Moviendo la perspectiva al propio `transform` de `#app` (`perspective(1200px) ...`) el efecto 3D del tilt se mantiene igual y `<html>` se queda sin containing block propio.

Al rotar en 3D, las esquinas de `#app` se salen del viewport y provocan scroll fantasma — por eso `html` y `body` llevan `overflow-x: hidden`. La vista de escenario necesita `overflow-y` libre (el lineup es largo), así que esto NO se generaliza a `overflow: hidden` a secas en ninguno de los dos. Nota: con `overflow:hidden` activo, `scrollHeight` puede seguir reportando un valor inflado por la rotación aunque el scroll esté realmente bloqueado — para comprobar si hay scroll de verdad, no te fíes de `scrollHeight > clientHeight`, prueba a forzar `scrollTop`/`scrollLeft` y comprueba si se mueve.

La vista de portada va un paso más allá: nunca debe tener scroll ni siquiera vertical. `router.js` alterna la clase `page-home` en `<html>` y `<body>` según `VIEWS[key].isHome` en cada `mount()` (no es un atributo estático del HTML, cambia con la vista). Con esa clase activa: `overflow: hidden` en ambos ejes, `height: 100vh` (no `min-height`), y `.cartel` pasa a `display:flex; flex-direction:column; justify-content:space-between` para repartir cabecera y pie en el alto exacto del viewport en vez de depender de `margin-bottom`.

Ese bloque **solo se aplica a partir de 641px de ancho** (`@media (min-width: 641px)`). En móvil el contenido crece más alto (los chips y los botones de escenario ocupan más filas al tener menos ancho), y forzar 100vh + overflow:hidden ahí recortaba el final del pie en vez de dejarlo fluir — en móvil la portada usa el comportamiento normal (scroll si hace falta, `margin-bottom` de toda la vida). Si la portada crece con más contenido en desktop, vigila que siga cabiendo en 100vh (con `overflow:hidden` un desbordamiento se recorta, no scrollea).

Dos ajustes más, específicos de móvil (`max-width: 640px`), para que la portada nunca tenga scroll ahí tampoco:
- `body.page-home #app { transform: none !important }` anula la rotación del tilt (con `!important` porque `tilt.js` fija el transform inline) — la propia rotación, aunque sea de solo unos grados, ya añadía overflow vertical residual.
- `body { padding-block: 2rem }` en vez de los `4rem` de desktop — con `4rem` (128px totales) el contenido de la portada se pasaba del alto de un móvil normal por ~36px; no es un bug del tilt, simplemente sobraba padding para esa pantalla.

## Franja del nombre de escenario al hacer scroll

`src/stage-banner.js` muestra una franja verde fija arriba de toda la pantalla con "EXTERIOR" o "INTERIOR" según el escenario por el que vas leyendo, y la oculta cuando estás por encima del primer titular.

- El `<div class="stage-banner">` se crea **una sola vez** (`initStageBanner()`, llamado desde `initRouter()`) y cuelga de `<body>`, **no de `#app`**: si viviera dentro de `#app` heredaría cualquier `transform` de un ancestro como containing block y su `position: fixed` dejaría de fijarse al viewport real.
- **La franja solo funciona si el viewport es su containing block.** Estuvo un tiempo sin verse nunca: un `perspective: 1200px` en `html` hacía de `<html>` containing block de todos los `position: fixed`, así que la franja se posicionaba en el `top: 0` del documento y se iba con el scroll (la clase `stage-banner--visible` se aplicaba bien y el transform era correcto, pero `getBoundingClientRect().y` era `-scrollY`). Si vuelve a "no verse", comprobar esto primero con Playwright: `banner.offsetParent` debe ser `null` (si devuelve `HTML` o `BODY`, hay un `transform`/`perspective`/`will-change` en un ancestro) y con `window.scrollTo(0, 600)` su `rect.y` debe seguir siendo `0`.
- **La visibilidad se calcula con `getBoundingClientRect()` en un listener de `scroll` limitado a una vez por frame (`requestAnimationFrame`), no con `IntersectionObserver`.** Se probó primero con `IntersectionObserver` y en móvil, con scroll con inercia (fling) y la barra de direcciones ocultándose/mostrándose, llegó a reportar "visible" otra vez a mitad del gesto — la franja se veía solo un instante. Midiendo la posición real en cada frame el resultado es siempre el actual, sin depender de cuándo decide disparar el observer por debajo.
- Con la landing hay **un `.cartel__stage` por escenario** (con `data-stage="exterior|interior"`). En cada frame se recorre la lista y gana **el último cuyo `top` ya pasó el umbral**, que es `banner.offsetHeight` (no `0`): al saltar a un ancla se aterriza con el titular exactamente en el borde y, por redondeos sub-píxel, comparar contra `0` no era fiable (la franja se quedaba en el escenario anterior).
- Mostrar/ocultar es una transición CSS de `transform` (`translateY(-100%)` ↔ `translateY(0)`, 0.35s) en `.stage-banner`/`.stage-banner--visible` — se desliza hacia abajo para aparecer y hacia arriba para desaparecer, a petición explícita.
- `z-index: 500`.

## Modelo de vistas anterior (retirado)

Todo esto ya no se usa; queda documentado porque explica decisiones que siguen en el CSS y porque hay código sin enganchar en el repo. Si algún día se vuelve al modelo de portada + dos escenarios:

- `page-transition.js` (`wipeTransition()`) hacía una máscara verde diagonal (`.page-mask`) entre vistas, con dirección aleatoria por transición; `TRANSITION_MS` (500) tenía que coincidir con `.page-mask--animate` en `style.css`.
- `router.js` reseteaba el scroll en cada `mount()` (`resetScroll()`), porque en una SPA el navegador no lo reinicia solo. El salto tenía que ser **instantáneo**: con `scroll-behavior: smooth` en `html`, un `scrollTo(0,0)` normal se anima y se vería al retirar la máscara. Poner `scroll-behavior: auto` inline **no basta** sin forzar el recálculo de estilos (`void getComputedStyle(root).scrollBehavior`) antes del `scrollTo`.
- La portada usaba la clase `page-home` en `<html>`/`<body>` para no tener scroll nunca (100vh + `overflow: hidden`). **Se eliminó del HTML y del CSS**: con la landing impedía hacer scroll y dejaba la página muerta.

## Cartel tipográfico de la cabecera

Debajo del título principal va **la lista de artistas en grande**, tipo cartel de fiesta: mayúsculas, Orbitron negrita y **tamaños y estilos alternados**. Antes había ahí chips de género; se sustituyeron a petición explícita ("no hayan géneros, si no, artistas, en grande, en mayúscula, negrita, varía tamaños y estilos"). Los géneros siguen viéndose por set, dentro del lineup.

- `renderBilling(names)` en `render.js` pinta `<ul class="billing">` con un `<li>` por artista. El tamaño (`xl`/`lg`/`md`/`sm`/`xs`) y el estilo (`solid`/`accent`/`outline`/`wide`) salen de `BILLING_PATTERN`, un patrón **fijo de 10 entradas que se repite**. No es aleatorio a propósito: con `Math.random()` el cartel cambiaría en cada recarga, y además esto hace el render determinista (y testeable).
- Si añades/quitas artistas en `lineup.json`, el patrón se recoloca solo (es por índice). Si el resultado no te gusta para un artista concreto, lo más simple es **ajustar el orden del array** en `lineup.json`, no tocar el patrón.
- `views.js` (`billingNames()`) deduplica por nombre (Leks toca dos veces y aparece una) y **excluye `TBA`**, que es un hueco por anunciar, no un artista.
- `-webkit-text-stroke` es lo que hace los nombres en contorno (`--outline`, relleno transparente). Está soportado en todos los navegadores actuales.

`renderGenres()` / `uniqueGenres()` y las clases `.genres*` en `style.css` **siguen en el repo sin usar** por si se quieren recuperar los chips.

## Diseño

Paleta e identidad tomadas de un branding real (logo tipo retícula/mira, negro + verde ácido `#c6ff1a`, tipografía Orbitron para títulos y Oswald para el resto). Si tienes acceso al archivo de fuente original del branding, esa es una mejora pendiente frente a la aproximación actual con Google Fonts.

El scrollbar (`scrollbar-color` + `::-webkit-scrollbar-*`) y la selección de texto (`::selection`) también están en verde ácido en vez de los estilos por defecto del navegador — mantener esto si tocas `style.css`.

## Verificación

Antes de dar por terminado un cambio visual:
1. `npm run build` debe compilar sin errores.
2. Si es posible, verifica visualmente el resultado. Este entorno no tiene un navegador integrado, pero suele haber `playwright-core` instalado globalmente junto con una build de Chromium cacheada (buscar en `~/.cache/ms-playwright/`), utilizable para tomar capturas de pantalla headless sin depender de un paquete del proyecto.
3. Para esta landing en concreto, comprueba además: que las dos secciones (`#exterior`, `#interior`) existen y que las anclas de la cabecera saltan a ellas; que la franja de escenario cambia a INTERIOR al llegar abajo; que **la página hace scroll** (el fallo clásico es dejar `page-home` o un `overflow: hidden` heredado en `<html>`/`<body>`, y entonces todo parece "roto" porque nada se mueve); y que `/interior` y `/exterior` siguen devolviendo 302 a la raíz.

## Control de versiones

Cada cambio se commitea y se sube (`git add`, `git commit`, `git push`) sin esperar a que se pida explícitamente — no dejar cambios sueltos sin subir al terminar una tarea.

## Despliegue

Hay **dos** despliegues del mismo código y hay que mantenerlos coherentes:

1. **Producción — `https://umbral.rlip.dev/`** (la URL pública, la que se comparte).
   - Código: este repo. Runtime: `~/services/umbral-web/` (contenedor `nginx:alpine`, puerto `127.0.0.1:8102`).
   - `nginx.conf` sirve el **build estático** (`npm run build`) desde `./app`, montado `:ro`. Los cambios no se ven hasta recompilar y copiar.
   - Se publica por **Cloudflare Tunnel** (`cloudflared`, config en `~/.cloudflared/config.yml`, túnel `rlip`), no por Tailscale.
   - `vite.config.js` tiene `base: '/'` porque la app va en la raíz del subdominio.
   - `nginx.conf` incluye dos reglas `location = /interior` y `location = /exterior` que devuelven **302 a `/`** (la SPA no tiene rutas reales). Si se toca el enrutado, hay que mantenerlas: sin ellas nginx sirve la SPA con 200 en esas URLs.
   - Despliegue: `npm run build`, **borrar `~/services/umbral-web/app/*` antes de copiar** (si no quedan assets viejos con hash huérfanos) y `cp -r dist/* app/`.

2. **Desarrollo — sesión `tmux` `umbral`** (`umbral.service` de systemd --user), Vite dev server en el puerto 5173. Nunca como proceso suelto en segundo plano, así es accesible/reiniciable de forma predecible. Sigue expuesto por Tailscale en `/umbral3`; cualquier cambio a la configuración de Tailscale Serve/Funnel en ese nodo puede afectar a otras rutas, así que se revisa el `tailscale serve status` completo antes y después de tocarlo. **Ojo**: el dev server va con `base: '/'`, así que la ruta `/umbral3` solo funciona por el fallback de Vite, no porque el build esté pensado para esa subruta.
