import { VIEWS } from './views.js'
import { startGenreDance } from './genre-dance.js'
import { startCursorTilt } from './tilt.js'
import { initPageMask, wipeTransition } from './page-transition.js'
import { initStageBanner, updateStageBanner } from './stage-banner.js'

let currentViewKey = 'home'

// Cada vista empieza siempre arriba del todo. En una SPA el navegador no
// reinicia el scroll por su cuenta (como sí haría al cargar una página nueva),
// así que al enlazar desde una zona ya bajada —p. ej. el botón "Interior" al
// final del lineup exterior— la vista nueva heredaba el scroll de la anterior
// y aparecía ya desplazada.
//
// El salto no se ve: wipeTransition() llama a mount() con la máscara verde
// cubriendo la pantalla. Y tiene que ser un salto instantáneo, no animado:
// `html` tiene `scroll-behavior: smooth` (style.css) y con eso window.scrollTo
// sería un desplazamiento animado que seguiría viéndose al retirar la máscara
// (se aterrizaría en la vista nueva a mitad del recorrido).
//
// Se desactiva un instante con un estilo inline (gana a la regla de la hoja) y
// se restaura al momento. Ojo: hay que FORZAR el recálculo de estilos antes de
// scrollear (leer el valor calculado); sin eso Chromium sigue leyendo el
// `smooth` de la hoja y anima igual — medido con Playwright, justo después de
// la llamada el scroll seguía en 772 en vez de 0. Con el recálculo forzado
// salta instantáneo (0), que es lo que hace esta función.
function resetScroll() {
  const root = document.documentElement
  const previous = root.style.scrollBehavior
  root.style.scrollBehavior = 'auto'
  void getComputedStyle(root).scrollBehavior
  window.scrollTo(0, 0)
  root.style.scrollBehavior = previous
}

function mount(viewKey) {
  currentViewKey = viewKey
  const view = VIEWS[viewKey]

  document.querySelector('#app').innerHTML = view.render()

  // Antes de updateStageBanner(): si no, la franja de escenario se calcularía
  // con el scroll de la vista anterior y aparecería un instante para luego
  // esconderse.
  resetScroll()

  document.documentElement.classList.toggle('page-home', view.isHome)
  document.body.classList.toggle('page-home', view.isHome)

  // Se vuelven a llamar en cada montaje: genre-dance/tilt/stage-banner
  // seleccionan elementos del DOM recién creado, no quedan "enganchados" de
  // la vista anterior.
  startGenreDance()
  startCursorTilt()
  updateStageBanner(viewKey)
}

export function initRouter() {
  initPageMask()
  initStageBanner()
  mount('home')

  // La URL no cambia nunca (sigue siendo una sola página de verdad, sin
  // pushState ni rutas de mentira): solo cambia el contenido de #app.
  document.body.addEventListener('click', (event) => {
    const link = event.target.closest('a[data-view]')
    if (!link || event.metaKey || event.ctrlKey || event.shiftKey) return

    event.preventDefault()
    const viewKey = link.dataset.view
    if (viewKey === currentViewKey) return

    wipeTransition(() => mount(viewKey))
  })
}
