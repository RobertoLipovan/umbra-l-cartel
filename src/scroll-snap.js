// Imán entre las dos "pantallas" de la landing: el cartel (cabecera, 100dvh) y
// el arranque del lineup.
//
// Se probó primero con CSS puro (`scroll-snap-type: y proximity|mandatory` en
// `html` + `scroll-snap-align: start` en las dos secciones) y en Chromium no
// funcionó bien: con las secciones de 100vh el scroll quedaba clavado a 16px y
// no dejaba avanzar. Un `scroll-snap` que bloquea la página es peor que no
// tenerlo, así que el imán se hace aquí.
//
// Regla: si al terminar de hacer scroll la página está *entre* las dos
// pantallas (más abajo del cartel pero sin llegar al lineup) se coloca sola en
// la más cercana. Dentro del lineup no se toca nada: la lista es larga y el
// scroll debe ser libre.
//
// `SETTLE_MS` es la espera sin eventos de scroll para considerar que el gesto
// terminó. No se usa `scrollend` porque no está en todas las versiones de
// navegador que puede usar esto.
const SETTLE_MS = 140

// Margen de seguridad: mientras el scroll suave programático está en marcha
// llegan eventos de scroll, y sin esta bandera el imán volvería a dispararse.
const RELEASE_MS = 800

export function initScrollSnap() {
  const hero = document.querySelector('.cartel__header')
  if (!hero) return

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  let timer = null
  let programmatic = false

  // Posición (en el documento) del borde inferior del cartel = donde empieza
  // el lineup, o sea el segundo punto de imán.
  function limit() {
    return hero.getBoundingClientRect().bottom + window.scrollY
  }

  function settle() {
    if (programmatic) return

    const y = window.scrollY
    const edge = limit()

    // Ya en una de las dos pantallas, o más allá (leyendo el lineup): nada.
    if (y <= 0 || y >= edge) return

    // En zona muerta: se va a la pantalla más cercana.
    programmatic = true
    window.scrollTo({ top: y < edge / 2 ? 0 : edge, behavior: reducedMotion ? 'auto' : 'smooth' })

    window.setTimeout(() => {
      programmatic = false
    }, RELEASE_MS)
  }

  window.addEventListener(
    'scroll',
    () => {
      if (programmatic) return
      window.clearTimeout(timer)
      timer = window.setTimeout(settle, SETTLE_MS)
    },
    { passive: true },
  )
}
