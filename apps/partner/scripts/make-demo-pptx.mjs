#!/usr/bin/env node
// Writes public/demo/partner-demo-template.pptx: a one-slide PowerPoint file
// for a fictional partner, used to try brand import without a real template
// and as the fixture for tests/pptx-theme.test.ts.
//
//   node scripts/make-demo-pptx.mjs
//
// Accent 1 is a light teal that fails 4.5:1 on white on purpose, so the demo
// shows textSafe deepening it. Dates are fixed so a re-run gives the same bytes.
import { mkdirSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { deflateSync } from "node:zlib"
import { strToU8, zipSync } from "fflate"

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..")
const outFile = path.join(root, "public", "demo", "partner-demo-template.pptx")
const FIXED_DATE = "2026-01-01T00:00:00Z"

const NS = {
  a: "http://schemas.openxmlformats.org/drawingml/2006/main",
  r: "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
  p: "http://schemas.openxmlformats.org/presentationml/2006/main",
}
const PML = `xmlns:a="${NS.a}" xmlns:r="${NS.r}" xmlns:p="${NS.p}"`
const REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
const DECLARATION = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'

const TEAL = [0x14, 0xb8, 0xa6]
const DEEP_TEAL = [0x0f, 0x76, 0x6e]

// PNG ------------------------------------------------------------------------

const CRC_TABLE = Array.from({ length: 256 }, (_, index) => {
  let value = index
  for (let bit = 0; bit < 8; bit++) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1
  }
  return value >>> 0
})

function crc32(bytes) {
  let crc = 0xffffffff
  for (const byte of bytes) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const typed = Buffer.concat([Buffer.from(type, "ascii"), data])
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(typed))
  return Buffer.concat([length, typed, crc])
}

/** A 120x40 logo: a teal block with a deeper teal bar down its left edge. */
function logoPng(width = 120, height = 40, bar = 30) {
  const header = Buffer.alloc(13)
  header.writeUInt32BE(width, 0)
  header.writeUInt32BE(height, 4)
  header[8] = 8 // bit depth
  header[9] = 2 // truecolour RGB
  const rowLength = 1 + width * 3
  const raw = Buffer.alloc(rowLength * height)
  for (let y = 0; y < height; y++) {
    raw[y * rowLength] = 0 // filter: none
    for (let x = 0; x < width; x++) {
      const [r, g, b] = x < bar ? DEEP_TEAL : TEAL
      const at = y * rowLength + 1 + x * 3
      raw[at] = r
      raw[at + 1] = g
      raw[at + 2] = b
    }
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ])
}

// Package parts ----------------------------------------------------------------

function relationships(entries) {
  const rows = entries
    .map(([id, type, target]) => `<Relationship Id="${id}" Type="${type}" Target="${target}"/>`)
    .join("")
  return `${DECLARATION}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${rows}</Relationships>`
}

const contentTypes = `${DECLARATION}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">\
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>\
<Default Extension="xml" ContentType="application/xml"/>\
<Default Extension="png" ContentType="image/png"/>\
<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>\
<Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>\
<Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>\
<Override PartName="/ppt/slides/slide1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>\
<Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>\
<Override PartName="/ppt/presProps.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presProps+xml"/>\
<Override PartName="/ppt/viewProps.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.viewProps+xml"/>\
<Override PartName="/ppt/tableStyles.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.tableStyles+xml"/>\
<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>\
<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>\
</Types>`

const packageRels = relationships([
  ["rId1", `${REL}/officeDocument`, "ppt/presentation.xml"],
  [
    "rId2",
    "http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties",
    "docProps/core.xml",
  ],
  ["rId3", `${REL}/extended-properties`, "docProps/app.xml"],
])

const appProps = `${DECLARATION}<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" \
xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">\
<TotalTime>0</TotalTime><Words>12</Words><Application>make-demo-pptx</Application>\
<PresentationFormat>Widescreen</PresentationFormat><Paragraphs>2</Paragraphs><Slides>1</Slides>\
<Notes>0</Notes><HiddenSlides>0</HiddenSlides><MMClips>0</MMClips><ScaleCrop>false</ScaleCrop>\
<Company>Partner Demo</Company><LinksUpToDate>false</LinksUpToDate><SharedDoc>false</SharedDoc>\
<HyperlinksChanged>false</HyperlinksChanged><AppVersion>16.0000</AppVersion></Properties>`

const coreProps = `${DECLARATION}<cp:coreProperties \
xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" \
xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" \
xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">\
<dc:title>Partner Demo template</dc:title><dc:creator>Partner Demo</dc:creator>\
<cp:lastModifiedBy>Partner Demo</cp:lastModifiedBy><cp:revision>1</cp:revision>\
<dcterms:created xsi:type="dcterms:W3CDTF">${FIXED_DATE}</dcterms:created>\
<dcterms:modified xsi:type="dcterms:W3CDTF">${FIXED_DATE}</dcterms:modified></cp:coreProperties>`

const presentation = `${DECLARATION}<p:presentation ${PML} saveSubsetFonts="1">\
<p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>\
<p:sldIdLst><p:sldId id="256" r:id="rId2"/></p:sldIdLst>\
<p:sldSz cx="12192000" cy="6858000"/><p:notesSz cx="6858000" cy="9144000"/>\
<p:defaultTextStyle><a:lvl1pPr marL="0" algn="l"><a:defRPr sz="1800" kern="1200">\
<a:solidFill><a:schemeClr val="tx1"/></a:solidFill><a:latin typeface="+mn-lt"/></a:defRPr></a:lvl1pPr>\
</p:defaultTextStyle></p:presentation>`

const presentationRels = relationships([
  ["rId1", `${REL}/slideMaster`, "slideMasters/slideMaster1.xml"],
  ["rId2", `${REL}/slide`, "slides/slide1.xml"],
  ["rId3", `${REL}/theme`, "theme/theme1.xml"],
  ["rId4", `${REL}/presProps`, "presProps.xml"],
  ["rId5", `${REL}/viewProps`, "viewProps.xml"],
  ["rId6", `${REL}/tableStyles`, "tableStyles.xml"],
])

const presProps = `${DECLARATION}<p:presentationPr ${PML}/>`
const viewProps = `${DECLARATION}<p:viewPr ${PML}><p:gridSpacing cx="76200" cy="76200"/></p:viewPr>`
const tableStyles = `${DECLARATION}<a:tblStyleLst xmlns:a="${NS.a}" def="{5C22544A-7EE6-4342-B048-85BDC9FD1C3A}"/>`

const emptyGroup =
  '<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>' +
  '<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/>' +
  '<a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>'

const logoPicture = `<p:pic><p:nvPicPr><p:cNvPr id="2" name="Partner logo" descr="Partner Demo logo"/>\
<p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr userDrawn="1"/></p:nvPicPr>\
<p:blipFill><a:blip r:embed="rId3"/><a:stretch><a:fillRect/></a:stretch></p:blipFill>\
<p:spPr><a:xfrm><a:off x="10744200" y="304800"/><a:ext cx="1143000" cy="381000"/></a:xfrm>\
<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic>`

function levelStyle(size, colour, typeface) {
  return `<a:lvl1pPr><a:defRPr sz="${size}" kern="1200"><a:solidFill><a:schemeClr val="${colour}"/></a:solidFill>\
<a:latin typeface="${typeface}"/></a:defRPr></a:lvl1pPr>`
}

const slideMaster = `${DECLARATION}<p:sldMaster ${PML}><p:cSld>\
<p:bg><p:bgRef idx="1001"><a:schemeClr val="bg1"/></p:bgRef></p:bg>\
<p:spTree>${emptyGroup}${logoPicture}</p:spTree></p:cSld>\
<p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" \
accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>\
<p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst>\
<p:txStyles><p:titleStyle>${levelStyle(4400, "tx1", "+mj-lt")}</p:titleStyle>\
<p:bodyStyle>${levelStyle(2000, "tx1", "+mn-lt")}</p:bodyStyle>\
<p:otherStyle>${levelStyle(1800, "tx1", "+mn-lt")}</p:otherStyle></p:txStyles></p:sldMaster>`

const slideMasterRels = relationships([
  ["rId1", `${REL}/slideLayout`, "../slideLayouts/slideLayout1.xml"],
  ["rId2", `${REL}/theme`, "../theme/theme1.xml"],
  ["rId3", `${REL}/image`, "../media/image1.png"],
])

const slideLayout = `${DECLARATION}<p:sldLayout ${PML} type="blank" preserve="1">\
<p:cSld name="Blank"><p:spTree>${emptyGroup}</p:spTree></p:cSld>\
<p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>`

const slideLayoutRels = relationships([
  ["rId1", `${REL}/slideMaster`, "../slideMasters/slideMaster1.xml"],
])

function run(text, size, colour, typeface) {
  return `<a:r><a:rPr lang="en-US" sz="${size}" dirty="0"><a:solidFill><a:schemeClr val="${colour}"/></a:solidFill>\
<a:latin typeface="${typeface}"/></a:rPr><a:t>${text}</a:t></a:r>`
}

const slide = `${DECLARATION}<p:sld ${PML}><p:cSld><p:spTree>${emptyGroup}\
<p:sp><p:nvSpPr><p:cNvPr id="2" name="Title"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>\
<p:spPr><a:xfrm><a:off x="914400" y="2286000"/><a:ext cx="10363200" cy="1600200"/></a:xfrm>\
<a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/></p:spPr>\
<p:txBody><a:bodyPr wrap="square" rtlCol="0"><a:noAutofit/></a:bodyPr><a:lstStyle/>\
<a:p>${run("Partner Demo", 4400, "accent2", "+mj-lt")}</a:p>\
<a:p>${run("A sample template for trying brand import", 2000, "tx2", "+mn-lt")}</a:p>\
</p:txBody></p:sp></p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>`

const slideRels = relationships([
  ["rId1", `${REL}/slideLayout`, "../slideLayouts/slideLayout1.xml"],
])

function colour(slot, value) {
  return `<a:${slot}><a:srgbClr val="${value}"/></a:${slot}>`
}

function fontCollection(tag, typeface) {
  return `<a:${tag}><a:latin typeface="${typeface}"/><a:ea typeface=""/><a:cs typeface=""/></a:${tag}>`
}

const solidFill = '<a:solidFill><a:schemeClr val="phClr"/></a:solidFill>'
const line = (width) =>
  `<a:ln w="${width}" cap="flat" cmpd="sng" algn="ctr">${solidFill}<a:prstDash val="solid"/></a:ln>`

// fmtScheme is required by the schema even when nothing uses it.
const theme = `${DECLARATION}<a:theme xmlns:a="${NS.a}" name="Partner Demo"><a:themeElements>\
<a:clrScheme name="Partner Demo">\
<a:dk1><a:sysClr val="windowText" lastClr="000000"/></a:dk1>\
<a:lt1><a:sysClr val="window" lastClr="FFFFFF"/></a:lt1>\
${colour("dk2", "1F2A37")}${colour("lt2", "F3F4F6")}\
${colour("accent1", "14B8A6")}${colour("accent2", "0F766E")}${colour("accent3", "F59E0B")}\
${colour("accent4", "6366F1")}${colour("accent5", "64748B")}${colour("accent6", "0EA5E9")}\
${colour("hlink", "0F766E")}${colour("folHlink", "6366F1")}</a:clrScheme>\
<a:fontScheme name="Partner Demo">${fontCollection("majorFont", "Georgia")}${fontCollection("minorFont", "Arial")}</a:fontScheme>\
<a:fmtScheme name="Partner Demo">\
<a:fillStyleLst>${solidFill.repeat(3)}</a:fillStyleLst>\
<a:lnStyleLst>${line(6350)}${line(12700)}${line(19050)}</a:lnStyleLst>\
<a:effectStyleLst>${"<a:effectStyle><a:effectLst/></a:effectStyle>".repeat(3)}</a:effectStyleLst>\
<a:bgFillStyleLst>${solidFill.repeat(3)}</a:bgFillStyleLst>\
</a:fmtScheme></a:themeElements><a:objectDefaults/><a:extraClrSchemeLst/></a:theme>`

// [Content_Types].xml goes first, as Office writes it.
const files = {
  "[Content_Types].xml": strToU8(contentTypes),
  "_rels/.rels": strToU8(packageRels),
  "docProps/app.xml": strToU8(appProps),
  "docProps/core.xml": strToU8(coreProps),
  "ppt/presentation.xml": strToU8(presentation),
  "ppt/_rels/presentation.xml.rels": strToU8(presentationRels),
  "ppt/presProps.xml": strToU8(presProps),
  "ppt/viewProps.xml": strToU8(viewProps),
  "ppt/tableStyles.xml": strToU8(tableStyles),
  "ppt/slideMasters/slideMaster1.xml": strToU8(slideMaster),
  "ppt/slideMasters/_rels/slideMaster1.xml.rels": strToU8(slideMasterRels),
  "ppt/slideLayouts/slideLayout1.xml": strToU8(slideLayout),
  "ppt/slideLayouts/_rels/slideLayout1.xml.rels": strToU8(slideLayoutRels),
  "ppt/slides/slide1.xml": strToU8(slide),
  "ppt/slides/_rels/slide1.xml.rels": strToU8(slideRels),
  "ppt/theme/theme1.xml": strToU8(theme),
  "ppt/media/image1.png": new Uint8Array(logoPng()),
}

// A local-time date, so the zip's DOS timestamps and bytes match in every timezone.
const zipped = zipSync(files, { level: 9, mtime: new Date(2026, 0, 1) })
mkdirSync(path.dirname(outFile), { recursive: true })
writeFileSync(outFile, zipped)
console.log(`Wrote ${path.relative(root, outFile)} (${zipped.length} bytes)`)
