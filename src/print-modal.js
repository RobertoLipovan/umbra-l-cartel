// Botón de impresora (arriba a la derecha) y modal para elegir el tamaño de
// impresión.
//
// El modal es un `<dialog>` nativo con `showModal()`: así el foco queda
// atrapado dentro, `Esc` cierra y el fondo se desactiva sin escribir nada de
// eso a mano. El botón y el diálogo se crean aquí y cuelgan de `<body>` (no de
// `#app`) por el mismo motivo que los botones de scroll: `#app` tiene
// `will-change: transform` y eso lo convierte en containing block de los
// descendientes `position: fixed`.
//
// El botón OK genera el PDF con `imprimirCartel()` de `src/print.js` (que carga
// html2canvas y jsPDF en diferido, así no pesan en el bundle inicial) y lo
// descarga. Mientras genera, el botón se bloquea y pasa a "Generando…" para
// que no se pueda lanzar dos veces.

const PRINTER_ICON = `
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M7 9V4h10v5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M7 18H5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
    <rect x="7" y="14" width="10" height="6" rx="1" stroke="currentColor" stroke-width="2" />
  </svg>
`

const OPTIONS = [
  { value: 'grande', label: 'Versión grande', desc: 'Una página del tamaño real del cartel' },
  { value: 'pequena', label: 'Versión pequeña', desc: 'Hojas A4, para imprimir en casa' },
]

function renderOpciones() {
  return OPTIONS.map(
    ({ value, label, desc }) => `
      <label class="print-option">
        <input type="radio" name="print-size" value="${value}" />
        <span class="print-option__body">
          <span class="print-option__label">${label}</span>
          <span class="print-option__desc">${desc}</span>
        </span>
      </label>
    `,
  ).join('')
}

export function initPrintModal() {
  // --- Botón de la impresora, arriba a la derecha ---
  const trigger = document.createElement('button')
  trigger.type = 'button'
  trigger.className = 'print-btn no-print'
  trigger.setAttribute('aria-label', 'Imprimir cartel')
  trigger.setAttribute('aria-haspopup', 'dialog')
  trigger.innerHTML = PRINTER_ICON
  document.body.appendChild(trigger)

  // --- Modal ---
  const dialog = document.createElement('dialog')
  dialog.className = 'print-modal'
  dialog.setAttribute('aria-labelledby', 'print-modal-title')
  dialog.innerHTML = `
    <div class="print-modal__inner">
      <button type="button" class="print-modal__close" aria-label="Cerrar">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        </svg>
      </button>

      <h2 class="print-modal__title" id="print-modal-title">Imprimir cartel</h2>
      <p class="print-modal__hint">¿En qué tamaño lo quieres?</p>

      <div class="print-modal__options" role="radiogroup" aria-label="Tamaño de impresión">
        ${renderOpciones()}
      </div>

      <p class="print-modal__error" role="alert" hidden></p>

      <div class="print-modal__actions">
        <button type="button" class="print-modal__ok" disabled>OK</button>
      </div>
    </div>
  `
  document.body.appendChild(dialog)

  const ok = dialog.querySelector('.print-modal__ok')
  const radios = [...dialog.querySelectorAll('input[name="print-size"]')]

  trigger.addEventListener('click', () => {
    dialog.showModal()
    // Si ya había una opción marcada de una apertura anterior, el foco va al
    // botón OK; si no, a la primera opción.
    const elegida = radios.find((radio) => radio.checked)
    ;(elegida ? ok : radios[0]).focus()
  })

  dialog.querySelector('.print-modal__close').addEventListener('click', () => dialog.close())

  // Clic en el fondo (el propio <dialog>, fuera del panel) cierra.
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close()
  })

  radios.forEach((radio) => {
    radio.addEventListener('change', () => {
      ok.disabled = false
    })
  })

  const error = dialog.querySelector('.print-modal__error')

  ok.addEventListener('click', async () => {
    const elegida = radios.find((radio) => radio.checked)
    if (!elegida || ok.disabled) return

    // El import de print.js es diferido: así html2canvas y jsPDF no entran en
    // el bundle inicial y solo se descargan si alguien imprime de verdad.
    const textoOk = ok.textContent
    ok.disabled = true
    ok.textContent = 'Generando…'
    error.hidden = true

    try {
      const { imprimirCartel } = await import('./print.js')
      await imprimirCartel(elegida.value)
      dialog.close()
    } catch (fallo) {
      console.error(fallo)
      error.textContent = 'No se ha podido generar el PDF. Inténtalo otra vez.'
      error.hidden = false
    } finally {
      ok.textContent = textoOk
      ok.disabled = !radios.some((radio) => radio.checked)
    }
  })

  // Al cerrar, el foco vuelve al botón que lo abrió (el nativo no siempre lo
  // hace cuando el botón no es un <button type=submit>).
  dialog.addEventListener('close', () => trigger.focus())
}
