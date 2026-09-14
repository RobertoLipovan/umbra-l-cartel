export const PRINT_BUTTON = `<a class="print-button no-print" href="#">Imprimir cartel</a>`

// Genera un PDF a partir de .cartel y lo descarga como umbral3.pdf.
// Los elementos marcados con "no-print" (navegación, este mismo botón,
// el aviso de scroll) se excluyen de la captura.
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
      const { default: html2pdf } = await import('html2pdf.js')

      await html2pdf()
        .set({
          filename: 'umbral3.pdf',
          margin: 10,
          html2canvas: {
            backgroundColor: '#050505',
            ignoreElements: (el) => el.classList.contains('no-print'),
          },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        })
        .from(cartel)
        .save()
    } finally {
      cartel.style.backgroundColor = ''
      button.textContent = 'Imprimir cartel'
    }
  })
}
