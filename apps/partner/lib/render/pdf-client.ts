/**
 * Turns a pdfmake document definition into a PDF file in the browser. pdfmake
 * is about a megabyte, so it loads only when a partner first makes a PDF. Its
 * fonts are the Roboto files copied to /pdf-fonts at build time, and it may
 * fetch nothing else: the access policy refuses every other URL, so a document
 * can never pull in a remote image or font.
 */
const FONT_PATH = "/pdf-fonts/"

let loading: Promise<typeof import("pdfmake/build/pdfmake").default> | null = null

function loadPdfMake() {
  loading ??= import("pdfmake/build/pdfmake").then(({ default: pdfMake }) => {
    const base = `${window.location.origin}${FONT_PATH}`
    pdfMake.setFonts({
      Roboto: {
        normal: `${base}Roboto-Regular.ttf`,
        bold: `${base}Roboto-Medium.ttf`,
        italics: `${base}Roboto-Italic.ttf`,
        bolditalics: `${base}Roboto-MediumItalic.ttf`,
      },
    })
    pdfMake.setUrlAccessPolicy((url) => url.startsWith(base))
    return pdfMake
  })
  return loading
}

export async function renderPdf(docDefinition: object): Promise<Blob> {
  const pdfMake = await loadPdfMake()
  return pdfMake.createPdf(docDefinition).getBlob()
}

/** Saves a file through a temporary link; the object URL is released after. */
export function saveFile(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = fileName
  link.rel = "noopener"
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000)
}
