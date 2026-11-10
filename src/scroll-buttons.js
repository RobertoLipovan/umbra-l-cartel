// Botones de bajar (del cartel al lineup) y subir (del lineup al cartel).
//
// Sustituyen al imán automático que hubo antes (`scroll-snap.js`, borrado): el
// salto forzado al soltar el scroll no iba fino. Ahora el scroll es libre y el
// usuario decide cuándo cambia de pantalla.
//
// Los dos botones se crean aquí y **cuelgan de `<body>`, no de `#app`**:
// `#app` tiene `will-change: transform`, que lo convierte en containing block
// de sus descendientes `position: fixed`. Dentro de `#app` se irían con el
// scroll en vez de quedarse fijos.
//
// Que sean `fixed` y no estén pegados al canto del cartel es a propósito: el
// cartel mide `100lvh` (el alto máximo del viewport en iOS), así que su borde
// inferior puede quedar detrás de la barra del navegador cuando está visible.
const SHOW_AFTER_RATIO = 0.5

const ARROW_DOWN = `
  <svg width="22" height="22" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path d="M10 4v12M4 10l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
`

const ARROW_UP = `
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path d="M10 16V4M4 10l6-6 6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
`

function crearBoton(modificador, etiqueta, svg) {
  const boton = document.createElement('button')
  boton.type = 'button'
  boton.className = `scroll-btn scroll-btn--${modificador}`
  boton.setAttribute('aria-label', etiqueta)
  boton.innerHTML = svg
  document.body.appendChild(boton)
  return boton
}

export function initScrollButtons() {
  const hero = document.querySelector('.cartel__header')
  const stages = document.querySelector('.stages')
  if (!hero || !stages) return

  const scrollToY = (top) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top, behavior: reduced ? 'auto' : 'smooth' })
  }

  const down = crearBoton('down', 'Bajar al cartel de horarios', ARROW_DOWN)
  const up = crearBoton('up', 'Volver arriba, al cartel', ARROW_UP)

  down.addEventListener('click', () => scrollToY(stages.getBoundingClientRect().top + window.scrollY))
  up.addEventListener('click', () => scrollToY(0))

  let ticking = false

  const update = () => {
    const enElLineup = window.scrollY > hero.getBoundingClientRect().height * SHOW_AFTER_RATIO
    down.classList.toggle('scroll-btn--hidden', enElLineup)
    up.classList.toggle('scroll-btn--visible', enElLineup)
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
