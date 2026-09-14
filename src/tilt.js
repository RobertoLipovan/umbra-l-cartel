const MAX_TILT_DEG = 2.5

// Inclina #app en 3D siguiendo la posición del cursor, como un panel que
// rota hacia donde apuntas. Necesita `perspective` en <html> y
// `transform-style: preserve-3d` en #app (ver style.css).
//
// Se aplica a #app y NO a <body>: cualquier ancestro con `transform` se
// convierte en el "containing block" de sus descendientes `position: fixed`
// (regla real de CSS, no un bug). .page-mask cuelga de <body>, así que si
// <body> tuviera el transform, la máscara dejaría de fijarse al viewport de
// verdad y pasaría a fijarse a <body> — que en la vista Exterior es
// altísimo (todo el lineup), inflando la máscara y añadiendo scroll real de
// sobra. Rotando solo #app (que no es ancestro de .page-mask), <body> se
// queda sin transform y .page-mask se comporta con normalidad.
export function startCursorTilt() {
  const target = document.querySelector('#app')

  window.addEventListener('mousemove', (event) => {
    const x = event.clientX / window.innerWidth
    const y = event.clientY / window.innerHeight
    const rotateY = (x - 0.5) * 2 * MAX_TILT_DEG
    const rotateX = (0.5 - y) * 2 * MAX_TILT_DEG
    target.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`
  })

  document.addEventListener('mouseleave', () => {
    target.style.transform = 'rotateX(0deg) rotateY(0deg)'
  })
}
