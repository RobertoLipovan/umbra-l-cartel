const TRANSITION_MS = 500

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

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function nextFrame() {
  return new Promise((resolve) => requestAnimationFrame(resolve))
}

let mask

// Máscara diagonal en el verde corporativo, creada una sola vez y reutilizada
// para todas las transiciones (SPA: todo ocurre en el mismo documento, sin
// recargas reales, así que no hace falta coordinar nada entre páginas).
export function initPageMask() {
  mask = document.createElement('div')
  mask.className = 'page-mask'
  mask.setAttribute('aria-hidden', 'true')
  document.body.appendChild(mask)

  // Al cargar: la máscara cubre la pantalla y se retira en diagonal.
  const dir = randomDirection()
  mask.style.transform = `${dir.skew} translate(0, 0)`
  requestAnimationFrame(() => {
    mask.classList.add('page-mask--animate')
    requestAnimationFrame(() => {
      mask.style.transform = `${dir.skew} ${dir.hidden}`
    })
  })
}

// Cubre la pantalla, ejecuta `swapContent` (cambiar la vista actual) y
// retira la máscara — dirección aleatoria en cada llamada.
export async function wipeTransition(swapContent) {
  const dir = randomDirection()

  mask.classList.remove('page-mask--animate')
  mask.style.transform = `${dir.skew} ${dir.hidden}`
  void mask.offsetWidth // fuerza reflow antes de reactivar la transición
  mask.classList.add('page-mask--animate')
  mask.style.transform = `${dir.skew} translate(0, 0)`

  await wait(TRANSITION_MS)
  swapContent()
  await nextFrame()
  await nextFrame()
  mask.style.transform = `${dir.skew} ${dir.hidden}`
}
