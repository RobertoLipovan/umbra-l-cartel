// Botones de bajar (del cartel al lineup) y subir (del lineup al cartel).
//
// Sustituyen al imán automático de `scroll-snap.js`, retirado a petición: el
// salto forzado al soltar el scroll no terminaba de ir fino y molestaba más
// que ayudaba. Ahora el scroll es libre y el usuario decide cuándo cambia de
// pantalla.
//
// El botón de bajar vive en el HTML de la cabecera (`.scroll-btn--down`), donde
// puede posicionarse en absoluto respecto al cartel. El de subir se crea aquí y
// **cuelga de `<body>`, no de `#app`**: `#app` tiene `will-change: transform`,
// que lo convierte en containing block de sus descendientes `position: fixed`
// (misma razón por la que `.stage-banner` cuelga de `<body>`); si viviera
// dentro, se iría con el scroll en vez de quedarse fijo.
const SHOW_AFTER_RATIO = 0.5

const ARROW_UP = `
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path d="M10 16V4M4 10l6-6 6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
`

export function initScrollButtons() {
  const down = document.querySelector('.scroll-btn--down')
  const hero = document.querySelector('.cartel__header')

  const scrollToY = (top) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top, behavior: reduced ? 'auto' : 'smooth' })
  }

  // Bajar: al inicio del lineup (justo debajo del cartel).
  if (down) {
    down.addEventListener('click', () => {
      const stages = document.querySelector('.stages')
      if (!stages) return
      const top = stages.getBoundingClientRect().top + window.scrollY
      scrollToY(top)
    })
  }

  if (!hero) return

  const up = document.createElement('button')
  up.type = 'button'
  up.className = 'scroll-btn scroll-btn--up'
  up.setAttribute('aria-label', 'Volver arriba, al cartel')
  up.innerHTML = ARROW_UP
  document.body.appendChild(up)

  up.addEventListener('click', () => scrollToY(0))

  let ticking = false
  const update = () => {
    const threshold = hero.getBoundingClientRect().height * SHOW_AFTER_RATIO
    up.classList.toggle('scroll-btn--visible', window.scrollY > threshold)
  }

  window.addEventListener(
    'scroll',
    () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        ticking = false
        update()
      })
    },
    { passive: true },
  )

  update()
}
