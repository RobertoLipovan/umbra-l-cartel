export const PRINT_BUTTON = `<a class="print-button no-print" href="#">Imprimir cartel</a>`

// Genera un PDF a partir de .cartel y lo descarga como umbral3.pdf.
// Los elementos marcados con "no-print" (navegación, este mismo botón,
// el aviso de scroll) se excluyen de la captura.
//
// No usamos html2pdf.js: su paginación automática está pensada para
// documentos tipo A4 y no para un elemento largo y estrecho como este
// cartel — el resultado era una página en blanco con una miniatura
// diminuta arriba. En su lugar generamos nosotros una única página de
// jsPDF con el tamaño exacto del contenido (sin márgenes ni recortes).
export function setupPrintButton() {
  const button = document.querySelector('.print-button')
  if (!button) return

  button.addEventListener('click', async (event) => {
    event.preventDefault()
    button.textContent = 'Generando PDF…'

    const cartel = document.querySelector('.cartel')
    // El fondo oscuro vive en el <body> (radial-gradient), .cartel en sí es
    // transparente. html2canvas captura .cartel de forma aislada, así que sin
    // esto el PDF sale con fondo blanco y el texto claro queda ilegible.
    cartel.style.backgroundColor = '#050505'

    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ])

      const canvas = await html2canvas(cartel, {
        backgroundColor: '#050505',
        scale: 2,
        ignoreElements: (el) => el.classList.contains('no-print'),
      })

      // mm a partir del tamaño real en pantalla (CSS px, no los píxeles del
      // canvas ya multiplicados por `scale`), asumiendo 96 CSS px = 1 pulgada.
      const widthMm = (cartel.offsetWidth / 96) * 25.4
      const heightMm = (cartel.offsetHeight / 96) * 25.4

      const doc = new jsPDF({
        unit: 'mm',
        format: [widthMm, heightMm],
        orientation: widthMm > heightMm ? 'landscape' : 'portrait',
      })
      // JPEG en vez de PNG: el fondo con degradado se comprime muchísimo
      // peor sin pérdida (PNG salía por encima de 15 MB para esta misma
      // imagen); a esta calidad no se aprecia diferencia visual.
      doc.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, widthMm, heightMm)
      doc.save('umbral3.pdf')
    } finally {
      cartel.style.backgroundColor = ''
      button.textContent = 'Imprimir cartel'
    }
  })
}
