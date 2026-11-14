// Estado en vivo del cartel: tacha los sets que ya han terminado y marca el que
// está sonando ahora.
//
// Las horas del cartel ya vienen resueltas como Date absolutos (ver
// schedule.js), así que aquí solo se comparan con `new Date()`. No se usa la
// zona horaria del navegador para nada más: si el visitante está en otro país,
// el "ahora" sigue siendo el del evento (Madrid), porque los Date ya llevan el
// desfase del evento dentro.
//
// Se refresca cada 30 s (suficiente: los sets duran 1 h) y a demanda con el
// evento `live:refresh` (lo usa print.js para no imprimir el cartel tachado).

const SELECTOR = '.lineup__item[data-inicio]'
const CADA_MS = 30_000

function estadoDe(inicio, fin, ahora) {
  if (fin && ahora >= fin) return 'pasado'
  if (ahora >= inicio) return 'ahora'
  return 'futuro'
}

export function refreshLive(ahora = new Date()) {
  for (const item of document.querySelectorAll(SELECTOR)) {
    const inicio = new Date(item.dataset.inicio)
    const fin = item.dataset.fin ? new Date(item.dataset.fin) : null
    const estado = estadoDe(inicio, fin, ahora)

    // 'futuro' = sin atributo (estado por defecto, sin estilos extra).
    if (estado === 'futuro') item.removeAttribute('data-estado')
    else item.setAttribute('data-estado', estado)
  }
}

export function startLive() {
  refreshLive()
  setInterval(refreshLive, CADA_MS)
  window.addEventListener('live:refresh', () => refreshLive())
}
