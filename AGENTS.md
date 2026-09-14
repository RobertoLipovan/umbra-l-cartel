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

## Botón "Imprimir cartel"

Cada página tiene un botón en el pie (`src/print.js`, `setupPrintButton()`) que genera un PDF y lo descarga siempre como `umbral3.pdf`, sea cual sea la página. Captura `.cartel` con `html2canvas`, ignorando cualquier elemento con la clase `no-print` (navegación, el propio botón, el aviso de scroll "CARTEL"), y mete esa imagen en un PDF de **una sola página de `jsPDF`** con el tamaño exacto del contenido — nada de paginación automática tipo A4: se probó con `html2pdf.js` primero y su lógica de reparto en páginas está pensada para documentos, no para un elemento largo y estrecho como este cartel (salía una página en blanco con una miniatura diminuta arriba). `html2canvas` y `jspdf` se cargan con `import()` dinámico solo al pulsar el botón, para no meter ~600 KB en el bundle inicial.

Dos detalles que costó descubrir y no hay que deshacer:
- El fondo oscuro vive en `<body>` (radial-gradient), así que antes de capturar se fuerza `background-color` inline en `.cartel` — si no, html2canvas lo captura con fondo blanco y el texto claro queda ilegible.
- La imagen se exporta como **JPEG** (calidad 0.92), no PNG: el degradado de fondo comprime fatal sin pérdida (PNG daba >15 MB para este mismo cartel; JPEG da ~400 KB sin diferencia visible).

## Baile de los chips de género

`src/genre-dance.js` (`startGenreDance()`, llamado desde las tres páginas) hace que cada 500ms, 5 chips de `.genres__item` elegidos al azar pasen a `.genres__item--active` (fondo verde relleno) y los 5 de la ronda anterior vuelvan al estado normal; la ronda siguiente evita repetir los mismos 5 (salvo que no haya suficientes chips para evitarlo). Es puramente decorativo — no toca el PDF de forma especial, así que "Imprimir cartel" puede capturar cualquier combinación de chips activos en el momento del clic; eso es intencional, no un bug.

## Diseño

Paleta e identidad tomadas de un branding real (logo tipo retícula/mira, negro + verde ácido `#c6ff1a`, tipografía Orbitron para títulos y Oswald para el resto). Si tienes acceso al archivo de fuente original del branding, esa es una mejora pendiente frente a la aproximación actual con Google Fonts.

## Verificación

Antes de dar por terminado un cambio visual:
1. `npm run build` debe compilar sin errores.
2. Si es posible, verifica visualmente el resultado. Este entorno no tiene un navegador integrado, pero suele haber `playwright-core` instalado globalmente junto con una build de Chromium cacheada (buscar en `~/.cache/ms-playwright/`), utilizable para tomar capturas de pantalla headless sin depender de un paquete del proyecto.

## Control de versiones

Cada cambio se commitea y se sube (`git add`, `git commit`, `git push`) sin esperar a que se pida explícitamente — no dejar cambios sueltos sin subir al terminar una tarea.

## Despliegue local

El servidor de desarrollo se sirve siempre dentro de una sesión `tmux` llamada `umbral`, nunca como proceso suelto en segundo plano — así es accesible/reiniciable de forma predecible. Se publica vía Tailscale (`tailscale serve` / `tailscale funnel`) bajo la ruta `/umbral3` en el mismo nodo que sirve otras apps — cualquier cambio a la configuración de Tailscale Serve/Funnel en ese nodo puede afectar a esas otras rutas, así que se revisa el `tailscale serve status` completo antes y después de tocarlo.
