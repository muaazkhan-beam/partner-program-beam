import assert from "node:assert/strict"
import test from "node:test"

import {
  detectColumns,
  fillCsv,
  parseCsv,
  questionsFromCsv,
  safeCell,
  toCsv,
  type CsvAnswer,
} from "../lib/intake/csv"

test("quoted fields keep their commas and line breaks", () => {
  const parsed = parseCsv(
    'Ref,Question\nAV-01,"Do you encrypt data at rest, and in transit?"\nAV-02,"Describe your backups.\nInclude retention."\n'
  )
  assert.deepEqual(parsed.headers, ["Ref", "Question"])
  assert.deepEqual(parsed.rows, [
    ["AV-01", "Do you encrypt data at rest, and in transit?"],
    ["AV-02", "Describe your backups.\nInclude retention."],
  ])
  assert.equal(parsed.delimiter, ",")
})

test("doubled quotes inside a quoted field read as one quote", () => {
  const parsed = parseCsv('Question\n"Is there a ""clean desk"" policy?"\n""\n"x"""')
  assert.deepEqual(parsed.rows, [['Is there a "clean desk" policy?'], [""], ['x"']])
})

test("a UTF-8 BOM is stripped and the first header stays clean", () => {
  const parsed = parseCsv("﻿Ref,Frage\n1,Wird Datenverschlüsselung eingesetzt?")
  assert.deepEqual(parsed.headers, ["Ref", "Frage"])
  assert.deepEqual(parsed.rows, [["1", "Wird Datenverschlüsselung eingesetzt?"]])
})

test("CRLF, LF and bare CR line endings all split records", () => {
  const expected = [
    ["1", "Is MFA enforced?"],
    ["2", "Are logs retained?"],
  ]
  assert.deepEqual(
    parseCsv("Ref,Question\r\n1,Is MFA enforced?\r\n2,Are logs retained?\r\n").rows,
    expected
  )
  assert.deepEqual(
    parseCsv("Ref,Question\r1,Is MFA enforced?\r2,Are logs retained?").rows,
    expected
  )
  assert.deepEqual(parseCsv('Ref,Question\r\n1,"Is MFA\r\nenforced?"').rows, [
    ["1", "Is MFA\r\nenforced?"],
  ])
})

test("semicolon files are detected and commas inside cells survive", () => {
  const parsed = parseCsv(
    "Nr.;Anforderung;Hinweis\n1;Backups, täglich?;Ja\n2;Zugriff, rollenbasiert?;"
  )
  assert.equal(parsed.delimiter, ";")
  assert.deepEqual(parsed.headers, ["Nr.", "Anforderung", "Hinweis"])
  assert.deepEqual(parsed.rows[0], ["1", "Backups, täglich?", "Ja"])
  assert.deepEqual(parsed.rows[1], ["2", "Zugriff, rollenbasiert?", ""])
})

test("tab files are detected", () => {
  const parsed = parseCsv(
    "ID\tQuestion\tOwner\nQ1\tDo you run annual penetration tests, internally?\tIT\n"
  )
  assert.equal(parsed.delimiter, "\t")
  assert.deepEqual(parsed.rows, [["Q1", "Do you run annual penetration tests, internally?", "IT"]])
})

test("delimiters inside quotes in the first line do not vote", () => {
  const parsed = parseCsv('"Hosting, region, provider";Answer\nEU;Yes')
  assert.equal(parsed.delimiter, ";")
  assert.deepEqual(parsed.headers, ["Hosting, region, provider", "Answer"])
  assert.equal(parseCsv("Question\nIs data encrypted?").delimiter, ",")
})

test("short rows are padded, headers trimmed and trailing blank lines dropped", () => {
  const parsed = parseCsv(" Ref , Question ,Notes\n1,Is MFA enforced?\n2\n\n,,\n\n")
  assert.deepEqual(parsed.headers, ["Ref", "Question", "Notes"])
  assert.deepEqual(parsed.rows, [
    ["1", "Is MFA enforced?", ""],
    ["2", "", ""],
  ])
  assert.deepEqual(parseCsv(""), { headers: [], rows: [], delimiter: "," })
})

test("a trailing delimiter on data rows widens the headers so columns line up", () => {
  const parsed = parseCsv("Ref,Question\n1,Is MFA enforced?,\n")
  assert.deepEqual(parsed.headers, ["Ref", "Question", ""])
  assert.deepEqual(parsed.rows, [["1", "Is MFA enforced?", ""]])
})

test("detectColumns reads a named Question and Ref", () => {
  const parsed = parseCsv(
    "Ref, Domain, Question, Notes\nAC-1,Access,Is MFA enforced for all staff?,\nAC-2,Access,Are leavers removed within a day?,Fast"
  )
  assert.deepEqual(detectColumns(parsed.headers, parsed.rows), { question: 2, ref: 0 })
})

test("detectColumns finds questions by their question marks when the first row is data", () => {
  const parsed = parseCsv(
    [
      "1,Do you encrypt customer data at rest?,Yes",
      "2,Do you run annual penetration tests?,",
      "3,Is MFA enforced for all staff?,Yes",
      "4,Can customers export their data?,No",
    ].join("\n")
  )
  assert.deepEqual(detectColumns(parsed.headers, parsed.rows), { question: 1, ref: 0 })
})

test("detectColumns spots a ref column by its codes when the header says nothing", () => {
  const parsed = parseCsv(
    [
      "Topic,Code,Ask of the vendor,Answer",
      "Antivirus,AV-01,Which endpoint protection is installed on laptops?,",
      "Questions,Q3,How quickly are critical patches applied?,",
      "Backups,1.2,Where are backups stored and for how long?,",
      "Access,4a,How is privileged access reviewed?,",
    ].join("\n")
  )
  assert.deepEqual(detectColumns(parsed.headers, parsed.rows), { question: 2, ref: 1 })
})

test("detectColumns never picks one column for both", () => {
  const single = parseCsv("ID\nDo you encrypt data at rest?\nIs MFA enforced?")
  assert.deepEqual(detectColumns(single.headers, single.rows), { question: 0 })

  const control = parseCsv(
    "Control ID,Control,Yes,No\nA.5.1,Information security policies are approved by management,X,\nA.5.2,Roles and responsibilities are defined,X,"
  )
  assert.deepEqual(detectColumns(control.headers, control.rows), { question: 1, ref: 0 })
})

test("a Yes/No column called No is not mistaken for a reference", () => {
  const parsed = parseCsv(
    "Question,Yes,No\nIs MFA enforced?,X,\nAre backups tested?,,X\nIs data encrypted?,,X"
  )
  assert.deepEqual(detectColumns(parsed.headers, parsed.rows), { question: 0 })
})

test("detectColumns returns null on a numbers-only sheet", () => {
  const parsed = parseCsv("2024,2025,2026\n10,12,14\n3.5,4.1,4.8\n")
  assert.equal(detectColumns(parsed.headers, parsed.rows), null)
  assert.equal(detectColumns([], []), null)
})

test("questionsFromCsv keeps file order, skips blanks and falls back to row numbers", () => {
  const parsed = parseCsv(
    [
      "Ref,Question",
      "AC-1,Is MFA enforced?",
      "AC-2,   ",
      ",Are leavers removed within a day?",
      "AC-4,  Are access reviews quarterly?  ",
    ].join("\n")
  )
  assert.deepEqual(questionsFromCsv(parsed, { question: 1, ref: 0 }), [
    { ref: "AC-1", text: "Is MFA enforced?", row: 0 },
    { ref: "3", text: "Are leavers removed within a day?", row: 2 },
    { ref: "AC-4", text: "Are access reviews quarterly?", row: 3 },
  ])
  assert.deepEqual(
    questionsFromCsv(parsed, { question: 1 }).map((question) => question.ref),
    ["1", "3", "4"]
  )
})

test("fillCsv keeps the client's order and appends exactly three columns", () => {
  const parsed = parseCsv(
    "Ref,Question,Owner\nAC-1,Is MFA enforced?,IT\nAC-2,Are backups tested?\nAC-3,Is data encrypted?,Ops"
  )
  const answers = new Map<number, CsvAnswer>([
    [2, { answer: "Yes, AES-256 at rest.", source: "Encryption policy v2", status: "Answered" }],
    [0, { answer: '=HYPERLINK("http://example.test")', source: "Access policy", status: "-check" }],
  ])
  const filled = fillCsv(parsed, answers)
  assert.deepEqual(filled.headers, ["Ref", "Question", "Owner", "From Beam", "Source", "Status"])
  assert.deepEqual(filled.rows, [
    [
      "AC-1",
      "Is MFA enforced?",
      "IT",
      '\'=HYPERLINK("http://example.test")',
      "Access policy",
      "'-check",
    ],
    ["AC-2", "Are backups tested?", "", "", "", ""],
    [
      "AC-3",
      "Is data encrypted?",
      "Ops",
      "Yes, AES-256 at rest.",
      "Encryption policy v2",
      "Answered",
    ],
  ])
  assert.deepEqual(parsed.rows[1], ["AC-2", "Are backups tested?", ""])

  const renamed = fillCsv(parsed, new Map(), ["Antwort", "Quelle", "+Status"])
  assert.deepEqual(renamed.headers.slice(3), ["Antwort", "Quelle", "'+Status"])
  assert.ok(renamed.rows.every((row) => row.length === 6))
})

test("toCsv round-trips through parseCsv", () => {
  const headers = ["Ref", "Question", "From Beam"]
  const rows = [
    ["AV-01", 'Is there a "clean desk" policy?', "Yes, enforced; audited yearly"],
    ["AV-02", "Describe backups.\nInclude retention.", "  padded  "],
    ["AV-03", "Tabs\tinside", ""],
  ]
  for (const delimiter of [",", ";", "\t"] as const) {
    const text = toCsv(headers, rows, { delimiter })
    assert.ok(text.startsWith("﻿"))
    assert.ok(text.endsWith("\r\n"))
    assert.deepEqual(parseCsv(text), { headers, rows, delimiter })
  }
})

test("toCsv quotes only when it must and can leave the BOM off", () => {
  assert.equal(
    toCsv(
      ["a", "b"],
      [
        ["plain", "with,comma"],
        [" lead", 'say "hi"'],
      ],
      { bom: false }
    ),
    'a,b\r\nplain,"with,comma"\r\n" lead","say ""hi"""\r\n'
  )
  assert.equal(toCsv(["a"], [["x;y"]], { delimiter: ";", bom: false }), 'a\r\n"x;y"\r\n')
})

test("safeCell neutralises formulas and leaves ordinary text alone", () => {
  assert.equal(
    safeCell('=HYPERLINK("http://example.test","Click")'),
    '\'=HYPERLINK("http://example.test","Click")'
  )
  assert.equal(safeCell("+cmd|' /C calc'!A0"), "'+cmd|' /C calc'!A0")
  assert.equal(safeCell("-1+1"), "'-1+1")
  assert.equal(safeCell("@SUM(A1:A2)"), "'@SUM(A1:A2)")
  assert.equal(safeCell("\t=1"), "'\t=1")
  assert.equal(safeCell("\r=1"), "'\r=1")
  assert.equal(safeCell("Yes, see policy = v2"), "Yes, see policy = v2")
  assert.equal(safeCell(""), "")
})
