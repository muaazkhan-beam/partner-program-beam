// Copies the Roboto faces that ship with pdfmake (Apache 2.0) into
// public/pdf-fonts, so client PDFs and their on-screen preview use the same
// font files. Run before dev and build; the folder is gitignored.
import { copyFileSync, mkdirSync } from "node:fs"
import { createRequire } from "node:module"
import path from "node:path"

const require = createRequire(import.meta.url)
const source = path.join(path.dirname(require.resolve("pdfmake/package.json")), "fonts", "Roboto")
const target = path.join(import.meta.dirname, "..", "public", "pdf-fonts")
const faces = ["Roboto-Regular.ttf", "Roboto-Medium.ttf", "Roboto-Italic.ttf", "Roboto-MediumItalic.ttf"]

mkdirSync(target, { recursive: true })
for (const face of faces) copyFileSync(path.join(source, face), path.join(target, face))
console.log(`Copied ${faces.length} PDF fonts to public/pdf-fonts`)
