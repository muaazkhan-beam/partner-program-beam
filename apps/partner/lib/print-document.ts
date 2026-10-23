/**
 * Opens the browser's print dialog for a self-contained HTML document, where
 * "Save as PDF" is one choice. The document is printed from an invisible
 * same-origin frame, so nothing navigates and the page's CSP still applies
 * (the document carries no script). The page title is swapped for the
 * document's own while the dialog is open, because browsers name the PDF
 * after the top-level title.
 */
export function printDocument(html: string, title: string) {
  const frame = document.createElement("iframe")
  frame.setAttribute("aria-hidden", "true")
  frame.tabIndex = -1
  frame.style.cssText =
    "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden"
  frame.srcdoc = html
  frame.onload = () => {
    const view = frame.contentWindow
    if (!view) return
    const previousTitle = document.title
    const restoreTitle = () => {
      document.title = previousTitle
    }
    const remove = () => window.setTimeout(() => frame.remove(), 500)
    document.title = title
    view.addEventListener(
      "afterprint",
      () => {
        restoreTitle()
        remove()
      },
      { once: true }
    )
    view.focus()
    view.print()
    // The PDF name is taken when the dialog opens, so the title can go back
    // straight away. The frame stays until afterprint, or a minute for
    // browsers that never fire it.
    window.setTimeout(restoreTitle, 1000)
    window.setTimeout(() => frame.remove(), 60_000)
  }
  document.body.appendChild(frame)
}
