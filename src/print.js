// Genera el PDF del cartel. Dos versiones, que es lo que ofrece el modal:
//
//   'grande'  → UNA página A1 **horizontal** (841 × 594 mm) con el cartel
//               reorganizado: cabecera ancha y los dos escenarios en dos
//               columnas, para que el texto se lea grande y no quede espacio
//               muerto.
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

// Medidas de página en mm.
const A4 = { ancho: 210, alto: 297 }
const A1 = { ancho: 841, alto: 594 } // A1 horizontal (landscape)
const MARGEN_A4 = 6
const MARGEN_A1 = 12

// Escala de captura. 2 da buena nitidez con un peso de archivo razonable.
const ESCALA = 2

function esperarFotograma() {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()))
}

async function capturarCartel(opciones = {}) {
  const cartel = document.querySelector('.cartel')
  if (!cartel) throw new Error('No encuentro el cartel en la página')

  // El fondo oscuro vive en <body> (radial-gradient) y .cartel en sí es
  // transparente: html2canvas captura el elemento aislado, así que sin forzar
  // aquí un fondo el PDF sale blanco y el texto claro queda ilegible.
  const fondoPrevio = cartel.style.backgroundColor
  cartel.style.backgroundColor = FONDO

  // Para la versión A1 aplicamos un layout especial: dos columnas.
  const clasePrintA1 = 'print-a1'
  const clasePrevia = cartel.className
  if (opciones.layoutA1) {
    cartel.classList.add(clasePrintA1)
  }

  try {
    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
      import('html2canvas'),
      import('jspdf'),
    ])

    // Un frame para que el navegador aplique el layout y el fondo.
    await esperarFotograma()

    const canvas = await html2canvas(cartel, {
      backgroundColor: FONDO,
      scale: ESCALA,
      useCORS: true,
      ignoreElements: (el) => el.classList.contains('no-print'),
    })

    // Restaurar clases y fondo.
    cartel.className = clasePrevia
    cartel.style.backgroundColor = ''

    // JPEG en vez de PNG: el degradado de fondo comprime muchísimo peor sin
    // pérdida (PNG salía por encima de 15 MB para este mismo cartel; JPEG da
    // unos cientos de KB sin diferencia visible a esta calidad).
    const imagen = canvas.toDataURL('image/jpeg', 0.92)

    return { jsPDF, imagen, anchoPx: canvas.width, altoPx: canvas.height }
  } catch (e) {
    cartel.className = clasePrevia
    cartel.style.backgroundColor = ''
    throw e
  }
}

// A1 horizontal (841 × 594 mm): la imagen ya viene con el layout de dos
// columnas, así que la centramos y la escalamos para llenar la hoja.
function paginaA1(jsPDF, imagen, anchoPx, altoPx) {
  // jsPDF 4.x tiene bug con A1 landscape: los formatos estándar A0-A10 están hardcoded a portrait.
  // Workaround: crear doc sin formato estándar y forzar pageSize en points.
  const doc = new jsPDF({ unit: 'pt' })
  doc.internal.pageSize.width = 841 * 72 / 25.4
  doc.internal.pageSize.height = 594 * 72 / 25.4
  if (doc.internal.pages && doc.internal.pages[0]) {
    doc.internal.pages[0].width = 841 * 72 / 25.4
    doc.internal.pages[0].height = 594 * 72 / 25.4
  }

  const anchoUtil = A1.ancho - MARGEN_A1 * 2
  const altoUtil = A1.alto - MARGEN_A1 * 2

  const escala = Math.min(anchoUtil / anchoPx, altoUtil / altoPx)
  const anchoMm = anchoPx * escala
  const altoMm = altoPx * escala

  // Fondo negro a sangre.
  doc.setFillColor(FONDO)
  doc.rect(0, 0, A1.ancho, A1.alto, 'F')

  doc.addImage(imagen, 'JPEG', (A1.ancho - anchoMm) / 2, (A1.alto - altoMm) / 2, anchoMm, altoMm)
  return doc
}

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
  const { jsPDF, imagen, anchoPx, altoPx } = await capturarCartel({
    layoutA1: version === 'grande',
  })

  const doc =
    version === 'pequena'
      ? cortarEnA4(jsPDF, imagen, anchoPx, altoPx)
      : paginaA1(jsPDF, imagen, anchoPx, altoPx)

  doc.save(version === 'pequena' ? 'umbral-cartel-pequena.pdf' : 'umbral-cartel-grande.pdf')
}