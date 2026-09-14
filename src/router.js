import { VIEWS } from './views.js'
import { startGenreDance } from './genre-dance.js'
import { startCursorTilt } from './tilt.js'
import { initPageMask, wipeTransition } from './page-transition.js'

let currentViewKey = 'home'

function mount(viewKey) {
  currentViewKey = viewKey
  const view = VIEWS[viewKey]

  document.querySelector('#app').innerHTML = view.render()
  document.documentElement.classList.toggle('page-home', view.isHome)
  document.body.classList.toggle('page-home', view.isHome)

  // Se vuelven a llamar en cada montaje: genre-dance/tilt seleccionan
  // elementos del DOM recién creado, no quedan "enganchados" de la vista
  // anterior.
  startGenreDance()
  startCursorTilt()
}

export function initRouter() {
  initPageMask()
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
