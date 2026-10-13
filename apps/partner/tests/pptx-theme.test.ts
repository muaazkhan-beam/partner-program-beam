import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"
import { inflateSync } from "node:zlib"

import { strToU8, zipSync } from "fflate"

import { contrastRatio, logoPalette, textSafe } from "../lib/brand/palette"
import {
  PptxError,
  describeFont,
  parseRels,
  parseThemeXml,
  readPptx,
} from "../lib/brand/pptx-theme"

const fixture = new Uint8Array(
  readFileSync(new URL("../public/demo/partner-demo-template.pptx", import.meta.url))
)

const IMAGE = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image"
const THEME = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme"

const themeXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Harbourlight &amp; Co">
  <a:themeElements>
    <a:clrScheme name="Harbourlight">
      <a:dk1><a:sysClr val="windowText" lastClr="000000"/></a:dk1>
      <a:lt1><a:sysClr val="window"/></a:lt1>
      <a:dk2><a:srgbClr val="1F2A37"/></a:dk2>
      <!-- <a:accent2><a:srgbClr val="FF0000"/></a:accent2> -->
      <a:accent1><a:srgbClr val='14B8A6'><a:lumMod val="75000"/></a:srgbClr></a:accent1>
      <a:accent10><a:srgbClr val="123456"/></a:accent10>
      <a:hlink><a:srgbClr val="not-hex"/></a:hlink>
    </a:clrScheme>
    <a:fontScheme name="Harbourlight">
      <a:majorFont><a:latin typeface="Georgia" panose="02040502050405020303"/><a:ea typeface=""/></a:majorFont>
      <a:minorFont><a:latin typeface=" Arial "/><a:ea typeface=""/></a:minorFont>
    </a:fontScheme>
  </a:themeElements>
</a:theme>`

function rels(rows: Array<[string, string, string]>) {
  const body = rows
    .map(([id, type, target]) => `<Relationship Id="${id}" Type="${type}" Target="${target}"/>`)
    .join("")
  return `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${body}</Relationships>`
}

/** Decodes the fixture's logo: 8-bit RGB, every row unfiltered. */
function decodePng(bytes: Uint8Array) {
  const view = Buffer.from(bytes)
  let width = 0
  let height = 0
  const idat: Buffer[] = []
  for (let at = 8; at < view.length;) {
    const length = view.readUInt32BE(at)
    const type = view.toString("ascii", at + 4, at + 8)
    const data = view.subarray(at + 8, at + 8 + length)
    if (type === "IHDR") {
      width = data.readUInt32BE(0)
      height = data.readUInt32BE(4)
      assert.equal(data[9], 2, "truecolour RGB")
    }
    if (type === "IDAT") idat.push(data)
    at += 12 + length
  }
  const raw = inflateSync(Buffer.concat(idat))
  const rgba = new Uint8ClampedArray(width * height * 4)
  for (let y = 0; y < height; y++) {
    const row = y * (1 + width * 3)
    assert.equal(raw[row], 0, "unfiltered row")
    for (let x = 0; x < width; x++) {
      rgba.set([...raw.subarray(row + 1 + x * 3, row + 4 + x * 3), 255], (y * width + x) * 4)
    }
  }
  return { data: rgba, width, height }
}

function codeOf(run: () => unknown) {
  try {
    run()
  } catch (error) {
    assert.ok(error instanceof PptxError)
    return error.code
  }
  return "no error"
}

test("a theme's colours come from srgbClr or the sysClr's last colour, lower-case", () => {
  const theme = parseThemeXml(themeXml)
  assert.equal(theme.name, "Harbourlight & Co")
  assert.deepEqual(theme.colors, {
    dk1: "#000000",
    lt1: "#ffffff",
    dk2: "#1f2a37",
    accent1: "#14b8a6",
  })
  assert.deepEqual(theme.fonts, { major: "Georgia", minor: "Arial" })
})

test("a theme with no colour scheme or fonts reads as empty, not as an error", () => {
  assert.deepEqual(parseThemeXml("<a:theme/>"), { colors: {}, fonts: {} })
  assert.deepEqual(parseThemeXml(""), { colors: {}, fonts: {} })
})

test("relationships are read whatever order their attributes come in", () => {
  const xml = `<?xml version="1.0"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="../theme/theme1.xml" Id="rId2" Type="${THEME}"/>
  <Relationship Type="${IMAGE}" TargetMode="Internal" Target="../media/logo%20mark.png" Id="rId3" />
  <Relationship Id='rId4' Type='${IMAGE}' Target='../media/a&amp;b.svg'></Relationship>
  <Relationship Id="rId5" Type="${IMAGE}"/>
</Relationships>`
  assert.deepEqual(parseRels(xml), [
    { id: "rId2", type: THEME, target: "../theme/theme1.xml" },
    { id: "rId3", type: IMAGE, target: "../media/logo%20mark.png" },
    { id: "rId4", type: IMAGE, target: "../media/a&b.svg" },
  ])
})

test("the demo template gives its theme, fonts, logo and company", () => {
  const read = readPptx(fixture)
  assert.equal(read.theme.name, "Partner Demo")
  assert.equal(read.theme.colors.accent1, "#14b8a6")
  assert.equal(read.theme.colors.dk1, "#000000")
  assert.equal(read.theme.colors.lt1, "#ffffff")
  assert.equal(read.theme.colors.folHlink, "#6366f1")
  assert.equal(Object.keys(read.theme.colors).length, 12)
  assert.deepEqual(read.theme.fonts, { major: "Georgia", minor: "Arial" })
  assert.equal(read.company, "Partner Demo")
  assert.ok(read.logo)
  assert.equal(read.logo.name, "image1.png")
  assert.equal(read.logo.mime, "image/png")
  assert.deepEqual([...read.logo.bytes.subarray(0, 4)], [0x89, 0x50, 0x4e, 0x47])
})

test("the demo's logo yields its teals, and its light accent is deepened for text", () => {
  const read = readPptx(fixture)
  assert.ok(read.logo)
  assert.deepEqual(logoPalette(decodePng(read.logo.bytes)), ["#14b8a6", "#0f766e"])

  const accent = read.theme.colors.accent1 ?? ""
  assert.ok(contrastRatio(accent, "#ffffff") < 4.5)
  const safe = textSafe(accent)
  assert.equal(safe.adjusted, true)
  assert.ok(contrastRatio(safe.hex, "#ffffff") >= 4.5)
})

test("a file that is not a zip is refused as not-zip", () => {
  assert.equal(
    codeOf(() => readPptx(strToU8("%PDF-1.7 not a slide deck"))),
    "not-zip"
  )
  assert.equal(
    codeOf(() => readPptx(new Uint8Array())),
    "not-zip"
  )
  // The zip signature with nothing behind it.
  assert.equal(
    codeOf(() => readPptx(new Uint8Array([0x50, 0x4b, 3, 4, 0, 0]))),
    "not-zip"
  )
})

test("a zip with no PowerPoint theme is refused as not-pptx", () => {
  const word = zipSync({
    "word/document.xml": strToU8("<w:document/>"),
    "word/theme/theme1.xml": strToU8(themeXml),
  })
  assert.equal(
    codeOf(() => readPptx(word)),
    "not-pptx"
  )
})

test("without master relationships the theme falls back to theme1", () => {
  const read = readPptx(zipSync({ "ppt/theme/theme1.xml": strToU8(themeXml) }))
  assert.equal(read.theme.colors.accent1, "#14b8a6")
  assert.equal(read.logo, undefined)
  assert.equal(read.company, undefined)
})

test("the theme is found through the master, and the logo skips backdrops and other formats", () => {
  const masterXml = `<p:sldMaster xmlns:p="p" xmlns:r="r" xmlns:a="a"><p:cSld>
<p:bg><p:bgPr><a:blipFill><a:blip r:embed="rId3"/></a:blipFill></p:bgPr></p:bg>
<p:spTree><p:pic><p:blipFill><a:blip r:embed="rId5"/></p:blipFill></p:pic></p:spTree>
</p:cSld></p:sldMaster>`
  const read = readPptx(
    zipSync({
      "ppt/theme/theme1.xml": strToU8("<a:theme name='Wrong'/>"),
      "ppt/theme/theme2.xml": strToU8(themeXml),
      "ppt/slideMasters/slideMaster1.xml": strToU8(masterXml),
      "ppt/slideMasters/_rels/slideMaster1.xml.rels": strToU8(
        rels([
          ["rId1", THEME, "../theme/theme2.xml"],
          ["rId2", IMAGE, "../media/image1.emf"],
          ["rId3", IMAGE, "../media/backdrop.jpg"],
          ["rId4", IMAGE, "https://example.invalid/remote.png"],
          ["rId5", IMAGE, "../media/Logo%20Mark.JPEG"],
        ])
      ),
      "ppt/media/image1.emf": new Uint8Array([1, 2, 3]),
      "ppt/media/backdrop.jpg": new Uint8Array([4, 5, 6]),
      "ppt/media/Logo Mark.JPEG": new Uint8Array([0xff, 0xd8, 0xff]),
      "docProps/app.xml": strToU8("<Properties><Company> Fjord &amp; Pine </Company></Properties>"),
    })
  )
  assert.equal(read.theme.name, "Harbourlight & Co")
  assert.deepEqual(read.logo, {
    name: "Logo Mark.JPEG",
    mime: "image/jpeg",
    bytes: new Uint8Array([0xff, 0xd8, 0xff]),
  })
  assert.equal(read.company, "Fjord & Pine")
})

test("a logo over 2 MB is left out rather than inflated", () => {
  const read = readPptx(
    zipSync(
      {
        "ppt/theme/theme1.xml": strToU8(themeXml),
        "ppt/slideMasters/_rels/slideMaster1.xml.rels": strToU8(
          rels([["rId1", IMAGE, "../media/huge.png"]])
        ),
        "ppt/media/huge.png": new Uint8Array(2 * 1024 * 1024 + 1),
      },
      { level: 0 }
    )
  )
  assert.equal(read.logo, undefined)
})

test("declared sizes past the limits are refused as too-large before inflating", () => {
  const big = new Uint8Array(5 * 1024 * 1024 + 1)
  // Stored rather than deflated, which keeps the test fast and changes nothing.
  const stored = { level: 0 } as const
  assert.equal(
    codeOf(() => readPptx(zipSync({ "ppt/theme/theme1.xml": big }, stored))),
    "too-large"
  )

  const chunk = new Uint8Array(4 * 1024 * 1024)
  const many = Object.fromEntries(
    Array.from({ length: 7 }, (_, index) => [`ppt/theme/theme${index + 1}.xml`, chunk])
  )
  assert.equal(
    codeOf(() => readPptx(zipSync(many, stored))),
    "too-large"
  )

  // Large parts we never read, such as slide photos, do not count against the limit.
  const read = readPptx(
    zipSync({ "ppt/theme/theme1.xml": strToU8(themeXml), "ppt/media/photo.jpg": big }, stored)
  )
  assert.equal(read.theme.colors.accent1, "#14b8a6")
})

test("fonts map to what a PDF can carry: serif to Times, everything else to Roboto", () => {
  assert.deepEqual(describeFont("Georgia"), { name: "Georgia", inPdf: "Times" })
  assert.deepEqual(describeFont("Arial"), { name: "Arial", inPdf: "Roboto" })
  assert.deepEqual(describeFont(undefined), { inPdf: "Roboto" })
  assert.deepEqual(describeFont("  "), { inPdf: "Roboto" })
  assert.equal(describeFont("Times New Roman").inPdf, "Times")
  assert.equal(describeFont("EB Garamond").inPdf, "Times")
  assert.equal(describeFont("Book Antiqua").inPdf, "Times")
  assert.equal(describeFont("Noto Serif").inPdf, "Times")
  assert.equal(describeFont("Microsoft Sans Serif").inPdf, "Roboto")
  assert.equal(describeFont("Roboto").inPdf, "Roboto")
  assert.equal(describeFont("Calibri").inPdf, "Roboto")
})
