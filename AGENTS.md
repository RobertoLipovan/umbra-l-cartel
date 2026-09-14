# Agent instructions — UMBRA-L cartel

Contexto y convenciones para cualquier agente (o persona) que trabaje en este repo.

## Qué es esto

SPA de una sola página (Vite, JS vanilla, sin framework) con el cartel/horario de la fiesta UMBRA-L. Hay tres "vistas" — portada, escenario exterior, escenario interior — pero **una sola página real** (`index.html` + `src/main.js`); `/exterior` e `/interior` NO son rutas del servidor, son solo estado interno del router reflejado en la URL vía `pushState` (para que la barra de direcciones se vea bien durante la sesión). Si alguien entra directo a esas URLs (marcador, enlace viejo, recarga), el servidor las redirige (302) a la raíz — ver `redirectOldRoutes()` en `vite.config.js`. Esto fue una decisión explícita: antes eran tres páginas HTML reales, se cambió a SPA para poder hacer una transición fiable entre vistas (ver más abajo) sin coordinar dos cargas de página distintas.

- `src/router.js` (`initRouter()`) monta la vista actual en `#app`, intercepta clics en `a[data-view]`, actualiza la URL con `history.pushState`/`popstate`, y vuelve a llamar `startGenreDance()`/`startCursorTilt()` en cada montaje (esos módulos seleccionan elementos del DOM recién creado, no quedan "enganchados" a la vista anterior).
- `src/views.js` (`VIEWS`) define las tres vistas: cada una es una función que devuelve el HTML de `<main class="cartel">...</main>`, más `path` (para la URL) e `isHome` (activa el modo "sin scroll" de la portada, ver más abajo).
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

`src/tilt.js` (`startCursorTilt()`, llamado desde `router.js` en cada `mount()`) inclina el `<body>` en 3D según la posición del cursor (`rotateX`/`rotateY`, `MAX_TILT_DEG = 2.5`). Necesita `perspective` en `html` y `transform-style: preserve-3d` en `body` (`style.css`). Al rotar en 3D, las esquinas del `body` se salen del viewport y provocan scroll fantasma — por eso `html` **y** `body` llevan `overflow-x: hidden` (el overflow lo causa el `body` rotado saliéndose de `html`, su padre; ponerlo solo en `body` no basta). La vista de escenario necesita `overflow-y` libre (el lineup es largo), así que esto NO se generaliza a `overflow: hidden` a secas en ninguno de los dos.

La vista de portada va un paso más allá: nunca debe tener scroll ni siquiera vertical. `router.js` alterna la clase `page-home` en `<html>` y `<body>` según `VIEWS[key].isHome` en cada `mount()` (no es un atributo estático del HTML, cambia con la vista). Con esa clase activa: `overflow: hidden` en ambos ejes, `height: 100vh` (no `min-height`), y `.cartel` pasa a `display:flex; flex-direction:column; justify-content:space-between` para repartir cabecera y pie en el alto exacto del viewport en vez de depender de `margin-bottom`.

Ese bloque **solo se aplica a partir de 641px de ancho** (`@media (min-width: 641px)`). En móvil el contenido crece más alto (los chips y los botones de escenario ocupan más filas al tener menos ancho), y forzar 100vh + overflow:hidden ahí recortaba el final del pie en vez de dejarlo fluir — en móvil la portada usa el comportamiento normal (scroll si hace falta, `margin-bottom` de toda la vida). Si la portada crece con más contenido en desktop, vigila que siga cabiendo en 100vh (con `overflow:hidden` un desbordamiento se recorta, no scrollea).

Dos ajustes más, específicos de móvil (`max-width: 640px`), para que la portada nunca tenga scroll ahí tampoco:
- `body.page-home { transform: none !important }` anula la rotación del tilt (con `!important` porque `tilt.js` fija el transform inline) — la propia rotación, aunque sea de solo unos grados, ya añadía overflow vertical residual.
- `body { padding-block: 2rem }` en vez de los `4rem` de desktop — con `4rem` (128px totales) el contenido de la portada se pasaba del alto de un móvil normal por ~36px; no es un bug del tilt, simplemente sobraba padding para esa pantalla.

## Transición diagonal entre vistas

`src/page-transition.js` añade una máscara verde diagonal (`.page-mask`, `<div>` creado una vez por `initPageMask()` y reutilizado toda la sesión) que cubre la pantalla al cambiar de vista y se retira tras el cambio. Al ser SPA, todo ocurre en el mismo documento — sin recargas reales que coordinar entre sí, todo el ciclo cubrir → cambiar contenido → retirar pasa por una sola función async (`wipeTransition(swapContent)`), llamada desde `router.js` tanto en clics como en `popstate` (atrás/adelante del navegador).

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
3. Para esta SPA en concreto, comprueba también la navegación entre vistas (clic + `popstate`) y que `/interior` y `/exterior` siguen redirigiendo (302) a la raíz — es fácil romper una de las dos cosas sin querer al tocar `router.js` o `vite.config.js`.

## Control de versiones

Cada cambio se commitea y se sube (`git add`, `git commit`, `git push`) sin esperar a que se pida explícitamente — no dejar cambios sueltos sin subir al terminar una tarea.

## Despliegue local

El servidor de desarrollo se sirve siempre dentro de una sesión `tmux` llamada `umbral`, nunca como proceso suelto en segundo plano — así es accesible/reiniciable de forma predecible. Se publica vía Tailscale (`tailscale serve` / `tailscale funnel`) bajo la ruta `/umbral3` en el mismo nodo que sirve otras apps — cualquier cambio a la configuración de Tailscale Serve/Funnel en ese nodo puede afectar a esas otras rutas, así que se revisa el `tailscale serve status` completo antes y después de tocarlo.
