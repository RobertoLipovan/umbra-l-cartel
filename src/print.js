// Genera el PDF del cartel. Dos versiones, que es lo que ofrece el modal:
//
//   'grande'  → UNA página A3 **horizontal** (420 × 297 mm) con el cartel
//               reorganizado: cabecera ancha y los dos escenarios en dos
//               columnas. Es el póster.
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

// Medidas de página en mm (horizontal/landscape).
const A4 = { ancho: 210, alto: 297 }
const A3 = { ancho: 420, alto: 297 }  // A3 horizontal (landscape)
const MARGEN_A4 = 6
const MARGEN_A3 = 10

// Relación de aspecto que debe tener el bloque capturado para llenar la hoja.
const ASPECTO_A3 = A3.ancho / A3.alto

// Escala de captura.
const ESCALA = 2

function esperarFotograma() {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()))
}

async function capturarCartel(opciones = {}) {
  const cartel = document.querySelector('.cartel')
  if (!cartel) throw new Error('No encuentro el cartel en la página')

  const fondoPrevio = cartel.style.backgroundColor
  cartel.style.backgroundColor = FONDO

  const clasePrintA3 = 'print-a3'
  const clasePrevia = cartel.className
  const anchoPrevio = cartel.style.width
  if (opciones.layoutA3) {
    cartel.classList.add(clasePrintA3)
    // El layout de impresión fija un ancho base, pero el alto depende del
    // número de artistas del cartel. Para que el PDF llene la hoja A3 hay que
    // ajustar el ancho a la relación 1,41:1 que pide la página; si no, el
    // bloque entra por alto y sobran dos franjas negras a los lados.
    // Se itera dos veces porque al ensanchar el bloque los textos pueden
    // ocupar menos líneas y cambiar el alto.
    void cartel.offsetWidth
    for (let i = 0; i < 2; i += 1) {
      const altoActual = cartel.getBoundingClientRect().height
      if (!altoActual) break
      cartel.style.width = `${Math.round(altoActual * ASPECTO_A3)}px`
      void cartel.offsetWidth
    }
  }

  try {
    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
      import('html2canvas'),
      import('jspdf'),
    ])

    await esperarFotograma()

    const canvas = await html2canvas(cartel, {
      backgroundColor: FONDO,
      scale: ESCALA,
      useCORS: true,
      ignoreElements: (el) => el.classList.contains('no-print'),
    })

    cartel.className = clasePrevia
    cartel.style.backgroundColor = ''
    cartel.style.width = anchoPrevio

    const imagen = canvas.toDataURL('image/jpeg', 0.92)

    return { jsPDF, imagen, anchoPx: canvas.width, altoPx: canvas.height }
  } catch (e) {
    cartel.className = clasePrevia
    cartel.style.backgroundColor = ''
    cartel.style.width = anchoPrevio
    throw e
  }
}

// A3 horizontal (420 × 297 mm): la imagen ya viene con el layout de dos
// columnas (.print-a3), así que la centramos y la escalamos para llenar.
//
// OJO con las unidades: el documento se crea en **mm** y el pageSize interno
// de jsPDF se guarda en la unidad del documento, así que se fija en mm
// (420 × 297), NO en puntos. Mezclar mm al dibujar con un doc en pt fue
// justo el bug que dejaba el cartel diminuto en una esquina de la hoja.
function paginaA3(jsPDF, imagen, anchoPx, altoPx) {
  const doc = new jsPDF({ unit: 'mm', format: [A3.ancho, A3.alto], orientation: 'landscape' })

  // jsPDF hardcodea los formatos con nombre (a3 = portrait), pero con un
  // array de formato respeta el orden dado. Forzamos además el pageSize
  // interno por si la versión lo normaliza.
  doc.internal.pageSize.width = A3.ancho
  doc.internal.pageSize.height = A3.alto
  if (doc.internal.pages && doc.internal.pages[0]) {
    doc.internal.pages[0].width = A3.ancho
    doc.internal.pages[0].height = A3.alto
  }

  const anchoUtil = A3.ancho - MARGEN_A3 * 2
  const altoUtil = A3.alto - MARGEN_A3 * 2

  const escala = Math.min(anchoUtil / anchoPx, altoUtil / altoPx)
  const anchoMm = anchoPx * escala
  const altoMm = altoPx * escala

  // Fondo negro a sangre (coordenadas en mm, igual que el documento).
  doc.setFillColor(FONDO)
  doc.rect(0, 0, A3.ancho, A3.alto, 'F')

  doc.addImage(
    imagen,
    'JPEG',
    (A3.ancho - anchoMm) / 2,
    (A3.alto - altoMm) / 2,
    anchoMm,
    altoMm,
  )
  return doc
}

// A4 vertical en varias páginas.
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
    layoutA3: version === 'grande',
  })

  const doc =
    version === 'pequena'
      ? cortarEnA4(jsPDF, imagen, anchoPx, altoPx)
      : paginaA3(jsPDF, imagen, anchoPx, altoPx)

  doc.save(version === 'pequena' ? 'umbral-cartel-pequena.pdf' : 'umbral-cartel-grande.pdf')
}