let banner
let stageLabel
let ticking = false

// Se crea una sola vez y se cuelga de <body> (no de #app): igual que
// .page-mask, si viviera dentro de #app heredaría el `transform` del tilt del
// cursor como "containing block" y su `position: fixed` dejaría de fijarse al
// viewport real (ver tilt.js para la explicación completa de esta regla).
//
// El estado se decide leyendo getBoundingClientRect() en cada scroll,
// limitado a una vez por frame con requestAnimationFrame — no con
// IntersectionObserver: en móvil, con scroll con inercia (fling) y la barra
// de direcciones ocultándose, el observer llegó a reportar brevemente
// "visible" otra vez a mitad del gesto (se veía la franja solo un instante).
// Midiendo la posición real en cada frame el resultado es siempre el actual,
// sin depender de cuándo decide disparar el observer por debajo.
export function initStageBanner() {
  banner = document.createElement('div')
  banner.className = 'stage-banner'
  banner.setAttribute('aria-hidden', 'true')
  document.body.appendChild(banner)

  window.addEventListener('scroll', requestUpdate, { passive: true })
}

function requestUpdate() {
  if (ticking) return
  ticking = true
  requestAnimationFrame(() => {
    ticking = false
    updateVisibility()
  })
}

function updateVisibility() {
  if (!stageLabel) return
  const hidden = stageLabel.getBoundingClientRect().bottom <= 0
  banner.classList.toggle('stage-banner--visible', hidden)
}

// Se llama tras cada montaje de vista (ver router.js). En portada no hay
// franja: se oculta y se deja de comprobar. En exterior/interior, muestra el
// nombre del escenario y empieza a vigilar la frase ".cartel__stage"
// ("Escenario exterior/interior") de la vista recién montada.
export function updateStageBanner(viewKey) {
  stageLabel = document.querySelector('.cartel__stage')

  if (viewKey === 'home' || !stageLabel) {
    stageLabel = null
    banner.classList.remove('stage-banner--visible')
    return
  }

  banner.textContent = viewKey.toUpperCase()
  updateVisibility()
}
