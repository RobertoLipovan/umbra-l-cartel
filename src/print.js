// Genera el PDF del cartel. Dos versiones, que es lo que ofrece el modal:
//
//   'grande'  → UNA página del tamaño exacto del cartel (sin márgenes ni
//               recortes). Es el "póster": sirve para imprimir en grande (una
//               copistería o una plotter aceptan un tamaño a medida).
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

// Ancho de página A4 vertical (mm) y márgenes interiores.
const A4 = { ancho: 210, alto: 297 }
const MARGEN_A4 = 6

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

// Una sola página con el tamaño real del cartel (px CSS → mm a 96 ppp).
function paginaTamanoReal(jsPDF, imagen, anchoPx, altoPx) {
  const anchoMm = (anchoPx / ESCALA / 96) * 25.4
  const altoMm = (altoPx / ESCALA / 96) * 25.4

  const doc = new jsPDF({
    unit: 'mm',
    format: [anchoMm, altoMm],
    orientation: anchoMm > altoMm ? 'landscape' : 'portrait',
  })

  doc.addImage(imagen, 'JPEG', 0, 0, anchoMm, altoMm)
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
      : paginaTamanoReal(jsPDF, imagen, anchoPx, altoPx)

  doc.save(version === 'pequena' ? 'umbral-cartel-pequena.pdf' : 'umbral-cartel-grande.pdf')
}
