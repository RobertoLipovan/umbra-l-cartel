const MAX_TILT_DEG = 2.5

// Inclina el <body> en 3D siguiendo la posición del cursor, como un panel
// que rota hacia donde apuntas. Necesita `perspective` en <html> y
// `transform-style: preserve-3d` en <body> (ver style.css).
export function startCursorTilt() {
  const target = document.body

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
