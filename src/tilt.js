const MAX_TILT_DEG = 2.5
const PERSPECTIVE_PX = 1200

// Inclina #app en 3D siguiendo la posición del cursor, como un panel que
// rota hacia donde apuntas.
//
// La perspectiva va aquí, como función del propio transform, y NO como
// `perspective` en <html> (donde estaba antes): `perspective`, igual que
// `transform`, convierte al elemento en el "containing block" de sus
// descendientes `position: fixed`. Con la perspectiva en <html>, los
// elementos fixed que cuelgan de <body> (.stage-banner, .page-mask) dejaban
// de fijarse al viewport y pasaban a fijarse a <html> — es decir, al
// documento entero: la franja de escenario se iba con el scroll
// (getBoundingClientRect().y === -scrollY) y no se veía nunca.
//
// Se aplica a #app y NO a <body>: mismo motivo (si <body> tuviera el
// transform, .page-mask se fijaría a <body> — altísimo en la vista de
// escenario — e inflaría el documento). Rotando solo #app, que no es ancestro
// de .page-mask ni de .stage-banner (son hermanos bajo <body>), el viewport
// sigue siendo el containing block de ambos.
export function startCursorTilt() {
  const target = document.querySelector('#app')

  window.addEventListener('mousemove', (event) => {
    const x = event.clientX / window.innerWidth
    const y = event.clientY / window.innerHeight
    const rotateY = (x - 0.5) * 2 * MAX_TILT_DEG
    const rotateX = (0.5 - y) * 2 * MAX_TILT_DEG
    target.style.transform = `perspective(${PERSPECTIVE_PX}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`
  })

  document.addEventListener('mouseleave', () => {
    target.style.transform = `perspective(${PERSPECTIVE_PX}px) rotateX(0deg) rotateY(0deg)`
  })
}
