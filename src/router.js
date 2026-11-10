import { renderLanding } from './views.js'
import { initStageBanner } from './stage-banner.js'

// La web es una sola landing: se monta una vez y no hay navegación entre
// vistas. Los enlaces de la cabecera son anclas (`#exterior`, `#interior`) que
// resuelve el navegador con el scroll suave de `html`, sin JavaScript.
//
// Aquí vivía el router de la SPA de tres vistas (portada + dos escenarios),
// con transición de máscara diagonal (`page-transition.js`). Los módulos de
// aquello siguen en el repo sin enganchar (ver AGENTS.md), por si se quiere
// volver al modelo de vistas.
export function initRouter() {
  document.querySelector('#app').innerHTML = renderLanding()

  initStageBanner()
}
