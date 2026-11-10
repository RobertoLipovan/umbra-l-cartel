// Genera el PDF del cartel. Dos versiones, que es lo que ofrece el modal:
//
//   'grande'  → UNA página A1 (594 × 841 mm) con el cartel completo: arriba la
//               cabecera con el nombre y los artistas y debajo el horario de
//               los dos escenarios. Es el póster.
//   'pequena' → A4 vertical, repartido en varias páginas cortando el cartel a
//               lo alto. Es la versión "de casa": legible, en hojas normales.
//               No se escala el cartel entero a una sola A4 porque quedaría
//               ilegible (el cartel es mucho más alto que ancho).
//
// Nada de html2pdf.js: su paginación automática está pensada para documentos
// tipo A4 y con un elemento largo y estrecho como este sacaba una página en
// blanco con una miniatura diminuta arriba. El reparto en páginas lo hacemos
// aquí, dibujando la misma imagen desplazada en cada página y dejando que
// jsPDF recorte (ver `cortarEnA4`).

const FONDO = '#050505'

// Medidas de página en mm (vertical).
const A4 = { ancho: 210, alto: 297 }
const A1 = { ancho: 594, alto: 841 }
const MARGEN_A4 = 6
const MARGEN_A1 = 12

// Escala de captura. 2 da buena nitidez con un peso de archivo razonable.
const ESCALA = 2

function esperarFotograma() {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()))
}

async function capturarCartel() {
  const cartel = document.querySelector('.cartel')
  if (!cartel) throw new Error('No encuentro el cartel en la página')

  // El fondo oscuro vive en <body> (radial-gradient) y .cartel en sí es
  // transparente: html2canvas captura el elemento aislado, así que sin forzar
  // aquí un fondo el PDF sale blanco y el texto claro queda ilegible.
  const fondoPrevio = cartel.style.backgroundColor
  cartel.style.backgroundColor = FONDO

  try {
    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
      import('html2canvas'),
      import('jspdf'),
    ])

    // Un frame para que el navegador aplique el fondo antes de capturar.
    await esperarFotograma()

    const canvas = await html2canvas(cartel, {
      backgroundColor: FONDO,
      scale: ESCALA,
      useCORS: true,
      ignoreElements: (el) => el.classList.contains('no-print'),
    })

    // JPEG en vez de PNG: el degradado de fondo comprime muchísimo peor sin
    // pérdida (PNG salía por encima de 15 MB para este mismo cartel; JPEG da
    // unos cientos de KB sin diferencia visible a esta calidad).
    const imagen = canvas.toDataURL('image/jpeg', 0.92)

    return { jsPDF, imagen, anchoPx: canvas.width, altoPx: canvas.height }
  } finally {
    cartel.style.backgroundColor = fondoPrevio
  }
}

// A1 vertical con el cartel entero (cabecera arriba, horario debajo) escalado
// para que quepa completo, sin recortes, pegado al margen superior.
//
// El cartel es muy alto y estrecho (relación ~1:4), así que el que manda es el
// alto: se escala hasta llenar el alto útil y queda una franja centrada
// horizontalmente. Escalar por ancho lo sacaría de la página.
function paginaA1(jsPDF, imagen, anchoPx, altoPx) {
  const doc = new jsPDF({ unit: 'mm', format: 'a1', orientation: 'portrait' })

  const anchoUtil = A1.ancho - MARGEN_A1 * 2
  const altoUtil = A1.alto - MARGEN_A1 * 2

  const escala = Math.min(anchoUtil / anchoPx, altoUtil / altoPx)
  const anchoMm = anchoPx * escala
  const altoMm = altoPx * escala

  // El cartel es tan vertical que al escalarlo sobra muchísimo ancho a los
  // lados. En vez de dejar dos franjas blancas, se pinta la hoja entera del
  // mismo negro que el cartel: la imagen se funde con el fondo y parece un
  // póster a sangre en vez de un recorte pegado en el centro.
  doc.setFillColor(FONDO)
  doc.rect(0, 0, A1.ancho, A1.alto, 'F')

  doc.addImage(imagen, 'JPEG', (A1.ancho - anchoMm) / 2, MARGEN_A1, anchoMm, altoMm)
  return doc
}

// A4 vertical en varias páginas: la imagen se dibuja entera en cada página,
// desplazada hacia arriba lo que ocupa una página, y jsPDF recorta lo que cae
// fuera. Así cada hoja muestra su franja sin huecos ni solapes.
function cortarEnA4(jsPDF, imagen, anchoPx, altoPx) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })

  const anchoUtil = A4.ancho - MARGEN_A4 * 2
  const altoUtil = A4.alto - MARGEN_A4 * 2

  const anchoMm = anchoUtil
  const altoMm = (altoPx / anchoPx) * anchoMm

  const paginas = Math.max(1, Math.ceil(altoMm / altoUtil))

  for (let i = 0; i < paginas; i += 1) {
    if (i > 0) doc.addPage()
    doc.addImage(
      imagen,
      'JPEG',
      MARGEN_A4,
      MARGEN_A4 - i * altoUtil,
      anchoMm,
      altoMm,
    )
  }

  return doc
}

export async function imprimirCartel(version) {
  const { jsPDF, imagen, anchoPx, altoPx } = await capturarCartel()

  const doc =
    version === 'pequena'
      ? cortarEnA4(jsPDF, imagen, anchoPx, altoPx)
      : paginaA1(jsPDF, imagen, anchoPx, altoPx)

  doc.save(version === 'pequena' ? 'umbral-cartel-pequena.pdf' : 'umbral-cartel-grande.pdf')
}
