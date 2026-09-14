let banner
let observer

// Se crea una sola vez y se cuelga de <body> (no de #app): igual que
// .page-mask, si viviera dentro de #app heredaría el `transform` del tilt del
// cursor como "containing block" y su `position: fixed` dejaría de fijarse al
// viewport real (ver tilt.js para la explicación completa de esta regla).
export function initStageBanner() {
  banner = document.createElement('div')
  banner.className = 'stage-banner'
  banner.setAttribute('aria-hidden', 'true')
  document.body.appendChild(banner)
}

// Se llama tras cada montaje de vista (ver router.js). En portada no hay
// franja: se oculta y se deja de observar. En exterior/interior, muestra el
// nombre del escenario y observa la frase ".cartel__stage" ("Escenario
// exterior/interior") para saber cuándo ha salido de la pantalla al hacer
// scroll.
export function updateStageBanner(viewKey) {
  if (observer) {
    observer.disconnect()
    observer = null
  }

  const stageLabel = document.querySelector('.cartel__stage')
  if (viewKey === 'home' || !stageLabel) {
    banner.classList.remove('stage-banner--visible')
    return
  }

  banner.textContent = viewKey.toUpperCase()
  observer = new IntersectionObserver(([entry]) => {
    banner.classList.toggle('stage-banner--visible', !entry.isIntersecting)
  })
  observer.observe(stageLabel)
}
