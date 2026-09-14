# Agent instructions — UMBRA-L cartel

Contexto y convenciones para cualquier agente (o persona) que trabaje en este repo.

## Qué es esto

Página estática (Vite, JS vanilla) que muestra el cartel/horario de la fiesta UMBRA-L: lista de DJs, horario, BPM y géneros. Los datos de los DJs se rellenan a mano en `src/djs.js` a partir de un formulario externo (Notion) que no forma parte de este repo.

## Reglas de privacidad

Los DJs rellenan un formulario con más campos de los que se muestran aquí. **Nunca añadas al cartel público:**
- Contacto (WhatsApp u otro)
- La hora de llegada tal cual la escribió el DJ (`arrival` en `djs.js`) — solo se usa como dato interno para ordenar/calcular el horario mostrado, nunca se imprime literalmente

Si en el futuro se conecta este proyecto a una fuente de datos real (API, export de Notion, etc.), estos dos campos deben seguir tratándose como internos.

## Cómo se construye el horario

`src/schedule.js` NO usa horas de llegada para fijar el horario mostrado: el evento empieza a una hora fija (`EVENT_START`) y encadena sets consecutivos de `SET_MINUTES` sin huecos. El campo `arrival` de cada DJ en `djs.js` solo determina el **orden** de actuación entre ellos. Si cambias esto, mantén la propiedad de "sin huecos" salvo que se pida explícitamente lo contrario.

## Diseño

Paleta e identidad tomadas de un branding real (logo tipo retícula/mira, negro + verde ácido `#c6ff1a`, tipografía Orbitron para títulos y Oswald para el resto). Si tienes acceso al archivo de fuente original del branding, esa es una mejora pendiente frente a la aproximación actual con Google Fonts.

## Verificación

Antes de dar por terminado un cambio visual:
1. `npm run build` debe compilar sin errores.
2. Si es posible, verifica visualmente el resultado. Este entorno no tiene un navegador integrado, pero suele haber `playwright-core` instalado globalmente junto con una build de Chromium cacheada (buscar en `~/.cache/ms-playwright/`), utilizable para tomar capturas de pantalla headless sin depender de un paquete del proyecto.

## Despliegue local

El servidor de desarrollo se sirve siempre dentro de una sesión `tmux` llamada `umbral`, nunca como proceso suelto en segundo plano — así es accesible/reiniciable de forma predecible. Se publica vía Tailscale (`tailscale serve` / `tailscale funnel`) bajo la ruta `/umbral3` en el mismo nodo que sirve otras apps — cualquier cambio a la configuración de Tailscale Serve/Funnel en ese nodo puede afectar a esas otras rutas, así que se revisa el `tailscale serve status` completo antes y después de tocarlo.
