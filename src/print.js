// Genera el PDF del cartel. Dos versiones, que es lo que ofrece el modal:
//
//   'grande'  → UNA página A3 **vertical** (297 × 420 mm) con el cartel
//               entero apilado: cabecera, escenario exterior y escenario
//               interior. Es el póster.
//   'pequena' → el MISMO póster, en una sola hoja A4 vertical. Solo cambia el
//               tamaño del papel, no el diseño.
//
// Nada de html2pdf.js: su paginación automática está pensada para documentos
// tipo A4 y con un elemento largo y estrecho como este sacaba una página en
// blanco con una miniatura diminuta arriba.

const FONDO = '#050505'

// Medidas de página en mm.
const A3 = { ancho: 297, alto: 420, margen: 8 } // A3 vertical (portrait)
const A4 = { ancho: 210, alto: 297, margen: 6 } // A4 vertical: misma hoja, más pequeña

// Relación de aspecto que debe tener el bloque capturado para llenar la hoja
// sin dejar franjas vacías.
const ASPECTO = A3.ancho / A3.alto // 1/raíz(2): igual para A3 y A4 vertical

// Resolución objetivo al imprimir en A3: 300 ppp es el estándar de calidad.
const PPP_OBJETIVO = 300

// Techos de seguridad: un canvas gigante agota la memoria de la pestaña
// (especialmente en móvil) y html2canvas falla sin decir por qué.
const MAX_LADO_PX = 8192
const MAX_AREA_PX = 16_000_000

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
        cartel.style.width = `${Math.round(alto * ASPECTO)}px`
        void cartel.offsetWidth
      }
    }

    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
      import('html2canvas'),
      import('jspdf'),
    ])

    await esperarFotograma()

    const medidas = cartel.getBoundingClientRect()
    const escala = escalaParaImpresion(medidas.width, medidas.height)

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

// Página única con el póster: la imagen ya viene con la relación correcta
// (.print-poster + ancho calculado), así que se centra y se escala.
//
// OJO con las unidades: el documento se crea en **mm** y jsPDF guarda el
// pageSize interno en la unidad del documento, así que se fija en mm. Mezclar
// valores en mm con un documento en pt fue el bug que dejaba el cartel
// diminuto pegado a una esquina de la hoja.
function paginaPoster(jsPDF, imagen, anchoPx, altoPx, hoja) {
  const doc = new jsPDF({
    unit: 'mm',
    format: [hoja.ancho, hoja.alto],
    orientation: 'portrait',
  })

  doc.internal.pageSize.width = hoja.ancho
  doc.internal.pageSize.height = hoja.alto
  if (doc.internal.pages && doc.internal.pages[0]) {
    doc.internal.pages[0].width = hoja.ancho
    doc.internal.pages[0].height = hoja.alto
  }

  const anchoUtil = hoja.ancho - hoja.margen * 2
  const altoUtil = hoja.alto - hoja.margen * 2

  const escala = Math.min(anchoUtil / anchoPx, altoUtil / altoPx)
  const anchoMm = anchoPx * escala
  const altoMm = altoPx * escala

  // Fondo negro a sangre: así no queda ni un borde blanco.
  doc.setFillColor(FONDO)
  doc.rect(0, 0, hoja.ancho, hoja.alto, 'F')

  doc.addImage(
    imagen,
    'JPEG',
    (hoja.ancho - anchoMm) / 2,
    (hoja.alto - altoMm) / 2,
    anchoMm,
    altoMm,
  )
  return doc
}

export async function imprimirCartel(version) {
  // Las dos versiones son el MISMO póster; solo cambia el tamaño de la hoja.
  const esGrande = version !== 'pequena'
  const { jsPDF, imagen, anchoPx, altoPx } = await capturarCartel({ poster: true })

  const doc = paginaPoster(jsPDF, imagen, anchoPx, altoPx, esGrande ? A3 : A4)

  doc.save(esGrande ? 'umbral-cartel-grande.pdf' : 'umbral-cartel-pequena.pdf')
}
