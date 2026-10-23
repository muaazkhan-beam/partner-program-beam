// The browser build of pdfmake 0.3 ships no types. Only what this app calls.
declare module "pdfmake/build/pdfmake" {
  type FontFaces = {
    normal: string
    bold?: string
    italics?: string
    bolditalics?: string
  }

  interface OutputDocument {
    getBlob(): Promise<Blob>
    getBuffer(): Promise<Uint8Array>
  }

  interface PdfMake {
    createPdf(docDefinition: object, options?: object): OutputDocument
    setFonts(fonts: Record<string, FontFaces>): void
    setUrlAccessPolicy(policy: (url: string) => boolean): void
  }

  const pdfMake: PdfMake
  export default pdfMake
}
