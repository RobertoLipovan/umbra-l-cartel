const TRANSITION_MS = 500
const STORAGE_KEY = 'umbral3:page-mask-direction'

// 4 direcciones posibles de barrido; cada una define el skew (según eje) y
// hacia dónde queda la máscara oculta (fuera de pantalla).
const DIRECTIONS = [
  { skew: 'skewX(-12deg)', hidden: 'translateX(-140%)' },
  { skew: 'skewX(-12deg)', hidden: 'translateX(140%)' },
  { skew: 'skewY(-12deg)', hidden: 'translateY(-140%)' },
  { skew: 'skewY(-12deg)', hidden: 'translateY(140%)' },
]

function randomDirection() {
  return DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)]
}

// Si la página anterior guardó la dirección con la que salió, la entrada de
// esta continúa en la misma (el barrido se siente continuo); si no (carga
// directa, refresco), se elige una al azar.
function readStoredDirection() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    sessionStorage.removeItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

// Máscara diagonal en el verde corporativo: cubre la pantalla justo antes de
// navegar a otra página del sitio, y se retira (wipe) al cargar la nueva.
// Es un sitio multi-página real (no SPA), así que la salida y la entrada son
// dos animaciones independientes coordinadas a mano, no una view-transition.
export function setupPageTransition() {
  const mask = document.createElement('div')
  mask.className = 'page-mask'
  mask.setAttribute('aria-hidden', 'true')
  document.body.appendChild(mask)

  const entryDirection = readStoredDirection() || randomDirection()

  // Entrada: la máscara ya cubre la pantalla al cargar (sin transición) y
  // se retira en diagonal justo después.
  mask.style.transform = `${entryDirection.skew} translate(0, 0)`
  requestAnimationFrame(() => {
    mask.classList.add('page-mask--animate')
    requestAnimationFrame(() => {
      mask.style.transform = `${entryDirection.skew} ${entryDirection.hidden}`
    })
  })

  document.querySelectorAll('a[href]').forEach((link) => {
    const rawHref = link.getAttribute('href') || ''
    if (rawHref.startsWith('#') || link.target === '_blank') return

    const url = new URL(link.href, window.location.href)
    if (url.origin !== window.location.origin) return

    link.addEventListener('click', (event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey) return

      event.preventDefault()
      const exitDirection = randomDirection()

      // Coloca la máscara en su posición oculta para la nueva dirección sin
      // transición (puede llevar el skew de la dirección de entrada, que era
      // otra), fuerza reflow, y ya sí anima cubriendo la pantalla.
      mask.classList.remove('page-mask--animate')
      mask.style.transform = `${exitDirection.skew} ${exitDirection.hidden}`
      void mask.offsetWidth
      mask.classList.add('page-mask--animate')
      mask.style.transform = `${exitDirection.skew} translate(0, 0)`

      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(exitDirection))
      } catch {
        // sessionStorage no disponible (navegación privada, etc.): la
        // siguiente página simplemente elegirá una dirección al azar.
      }

      setTimeout(() => {
        window.location.href = link.href
      }, TRANSITION_MS)
    })
  })
}
