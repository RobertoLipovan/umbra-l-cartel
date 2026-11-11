// Genera el PDF del cartel. Dos versiones, que es lo que ofrece el modal:
//
//   'grande'  → UNA página A3 **vertical** (297 × 420 mm) con el cartel
//               entero apilado: cabecera, escenario exterior y escenario
//               interior. Es el póster.
//   'pequena' → A4 vertical, repartido en varias páginas cortando el cartel a
//               lo alto. Es la versión "de casa": legible, en hojas normales.
//
// Nada de html2pdf.js: su paginación automática está pensada para documentos
// tipo A4 y con un elemento largo y estrecho como este sacaba una página en
// blanco con una miniatura diminuta arriba. El reparto en páginas lo hacemos
// aquí, dibujando la misma imagen desplazada en cada página y dejando que
// jsPDF recorte (ver `cortarEnA4`).

const FONDO = '#050505'

// Medidas de página en mm.
const A4 = { ancho: 210, alto: 297 }
const A3 = { ancho: 297, alto: 420 } // A3 vertical (portrait)
const MARGEN_A4 = 6
const MARGEN_A3 = 8

// Relación de aspecto que debe tener el bloque capturado para llenar la hoja
// sin dejar franjas vacías.
const ASPECTO_A3 = A3.ancho / A3.alto

// Resolución objetivo al imprimir en A3: 300 ppp es el estándar de calidad.
const PPP_OBJETIVO = 300

// Techos de seguridad: un canvas gigante agota la memoria de la pestaña
// (especialmente en móvil) y html2canvas falla sin decir por qué.
const MAX_LADO_PX = 8192
const MAX_AREA_PX = 16_000_000

// Escala de captura para la versión pequeña (A4), donde no hace falta tanto.
const ESCALA_A4 = 2

function esperarFotograma() {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()))
}

// Multiplicador de html2canvas necesario para que un bloque de `anchoCss` px,
// impreso a 297 mm, salga a ~300 ppp. Acotado por los techos de memoria.
function escalaParaImpresion(anchoCss, altoCss) {
  const pxNecesarios = (PPP_OBJETIVO * A3.ancho) / 25.4
  const ideal = pxNecesarios / anchoCss

  const porLado = MAX_LADO_PX / Math.max(anchoCss, altoCss)
  const porArea = Math.sqrt(MAX_AREA_PX / (anchoCss * altoCss))

  return Math.max(Math.min(ideal, porLado, porArea), 1.5)
}

// Reparte el cartel en dos columnas para el póster:
//   columna A → escenario exterior + interior hasta medianoche
//   columna B → el resto del interior (la madrugada), con letra más grande
//              porque es la parte importante de la fiesta
//
// Se hace manipulando el DOM en el momento de capturar y se deshace después
// (devuelve la función de limpieza), así la web normal no cambia.
function montarColumnasPoster(cartel) {
  const stages = cartel.querySelector('.stages')
  const exterior = cartel.querySelector('#exterior')
  const interior = cartel.querySelector('#interior')
  const lineup = interior && interior.querySelector('.lineup')
  if (!stages || !exterior || !interior || !lineup) return null

  const hijos = [...lineup.children]
  // El corte va justo en el salto de día (la madrugada empieza con el
  // encabezado "dom, 15/11").
  const corte = hijos.findIndex(
    (el) => el.classList.contains('lineup__day') && /dom|sáb|sab/i.test(el.textContent || '') && hijos.indexOf(el) > 0,
  )
  if (corte <= 0) return null

  const colA = document.createElement('div')
  colA.className = 'poster-col poster-col--a'
  const colB = document.createElement('div')
  colB.className = 'poster-col poster-col--b'

  const continuacion = document.createElement('section')
  continuacion.className = 'stage stage--cont'
  const listaB = document.createElement('ul')
  listaB.className = 'lineup'
  hijos.slice(corte).forEach((el) => listaB.appendChild(el))
  continuacion.appendChild(listaB)

  stages.appendChild(colA)
  stages.appendChild(colB)
  colA.appendChild(exterior)
  colA.appendChild(interior)
  colB.appendChild(continuacion)

  return () => {
    hijos.slice(corte).forEach((el) => lineup.appendChild(el))
    stages.appendChild(exterior)
    stages.appendChild(interior)
    continuacion.remove()
    colA.remove()
    colB.remove()
  }
}

async function capturarCartel(opciones = {}) {
  const cartel = document.querySelector('.cartel')
  if (!cartel) throw new Error('No encuentro el cartel en la página')

  const fondoPrevio = cartel.style.backgroundColor
  const clasePrevia = cartel.className
  const anchoPrevio = cartel.style.width
  let desmontarColumnas = null

  // El fondo oscuro vive en <body>; html2canvas captura el elemento aislado,
  // así que sin forzarlo aquí el PDF saldría con fondo transparente/blanco.
  cartel.style.backgroundColor = FONDO

  try {
    if (opciones.poster) {
      cartel.classList.add('print-poster')
      desmontarColumnas = montarColumnasPoster(cartel)
      // El alto depende del número de artistas. Se ajusta el ancho para que
      // la relación coincida con la de la hoja y no queden franjas vacías.
      // Varias pasadas: al cambiar el ancho los textos reflowan y el alto se
      // mueve, así que hay que iterar hasta que deje de cambiar.
      void cartel.offsetWidth
      for (let i = 0; i < 4; i += 1) {
        const alto = cartel.getBoundingClientRect().height
        if (!alto) break
        cartel.style.width = `${Math.round(alto * ASPECTO_A3)}px`
        void cartel.offsetWidth
      }
    }

    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
      import('html2canvas'),
      import('jspdf'),
    ])

    await esperarFotograma()

    const medidas = cartel.getBoundingClientRect()
    const escala = opciones.poster
      ? escalaParaImpresion(medidas.width, medidas.height)
      : ESCALA_A4

    const canvas = await html2canvas(cartel, {
      backgroundColor: FONDO,
      scale: escala,
      useCORS: true,
      logging: false,
      ignoreElements: (el) => el.classList.contains('no-print'),
    })

    // JPEG a 0.95: el PNG a 300 ppp salía de 46 MB (inviable de enviar). A
    // esta resolución cada artefacto de compresión mide ~0.08 mm, así que en
    // papel no se aprecia, y el archivo baja a unos pocos MB.
    const imagen = canvas.toDataURL('image/jpeg', 0.95)

    return {
      jsPDF,
      imagen,
      anchoPx: canvas.width,
      altoPx: canvas.height,
      escala,
    }
  } finally {
    if (desmontarColumnas) desmontarColumnas()
    cartel.className = clasePrevia
    cartel.style.backgroundColor = fondoPrevio
    cartel.style.width = anchoPrevio
  }
}

// A3 vertical (297 × 420 mm). La imagen ya viene con la relación correcta
// (.print-poster + ancho calculado), así que se centra y se escala.
//
// OJO con las unidades: el documento se crea en **mm** y jsPDF guarda el
// pageSize interno en la unidad del documento, así que se fija en mm. Mezclar
// valores en mm con un documento en pt fue el bug que dejaba el cartel
// diminuto pegado a una esquina de la hoja.
function paginaA3(jsPDF, imagen, anchoPx, altoPx) {
  const doc = new jsPDF({
    unit: 'mm',
    format: [A3.ancho, A3.alto],
    orientation: 'portrait',
  })

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

  // Fondo negro a sangre: así no queda ni un borde blanco.
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
    doc.addImage(imagen, 'JPEG', MARGEN_A4, MARGEN_A4 - i * altoUtil, anchoMm, altoMm)
  }

  return doc
}

export async function imprimirCartel(version) {
  const esPoster = version !== 'pequena'
  const { jsPDF, imagen, anchoPx, altoPx } = await capturarCartel({ poster: esPoster })

  const doc = esPoster
    ? paginaA3(jsPDF, imagen, anchoPx, altoPx)
    : cortarEnA4(jsPDF, imagen, anchoPx, altoPx)

  doc.save(esPoster ? 'umbral-cartel-grande.pdf' : 'umbral-cartel-pequena.pdf')
}
