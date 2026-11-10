let banner
let labels = []
let ticking = false

// Se crea una sola vez y se cuelga de <body> (no de #app): igual que hacía
// .page-mask, si viviera dentro de #app heredaría cualquier `transform` de un
// ancestro como "containing block" y su `position: fixed` dejaría de fijarse al
// viewport real.
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

  // En la landing hay un `.cartel__stage` por escenario. La franja muestra el
  // último cuyo titular ya ha pasado por arriba, es decir el escenario en el
  // que estás leyendo.
  labels = [...document.querySelectorAll('.cartel__stage')]

  window.addEventListener('scroll', requestUpdate, { passive: true })
  window.addEventListener('resize', requestUpdate, { passive: true })
  updateVisibility()
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
  // Se cuenta como "pasado" cuando el titular ya está a la altura de la
  // franja (no solo cuando su borde superior cruza el 0): al saltar a un
  // ancla se aterriza con el titular exactamente en el borde, y por
  // redondeos sub-píxel llegar a 0 exacto no era fiable.
  const threshold = banner.offsetHeight || 0

  let current = null
  for (const label of labels) {
    if (label.getBoundingClientRect().top <= threshold) current = label
  }

  if (!current) {
    banner.classList.remove('stage-banner--visible')
    return
  }

  banner.textContent = current.dataset.stage.toUpperCase()
  banner.classList.add('stage-banner--visible')
}
