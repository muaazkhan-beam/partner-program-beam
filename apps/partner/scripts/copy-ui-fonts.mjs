// Copies Beam UI's Satoshi font into the gitignored public/fonts. Satoshi is
// licensed for use, not redistribution, so it is never committed here: it
// comes from a Beam UI checkout named by BEAM_UI_FONTS_DIR (the folder that
// holds Satoshi-Variable.woff2). Without one the app falls back to Arial.
import { copyFileSync, existsSync, mkdirSync } from "node:fs"
import path from "node:path"

const source = process.env.BEAM_UI_FONTS_DIR
const target = path.join(import.meta.dirname, "..", "public", "fonts")
const faces = ["Satoshi-Variable.woff2", "Satoshi-VariableItalic.woff2"]

if (!source || !faces.every((face) => existsSync(path.join(source, face)))) {
  console.log("Satoshi not copied: set BEAM_UI_FONTS_DIR to Beam UI's src/fonts. Using Arial.")
} else {
  mkdirSync(target, { recursive: true })
  for (const face of faces) copyFileSync(path.join(source, face), path.join(target, face))
  console.log(`Copied ${faces.length} Satoshi faces to public/fonts`)
}
