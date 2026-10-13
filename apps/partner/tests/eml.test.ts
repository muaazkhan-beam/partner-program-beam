import assert from "node:assert/strict"
import test from "node:test"

import { EmailParseError, parseAddress, parseEml } from "../lib/intake/eml"

const jonah = {
  name: "Jonah Reyes",
  address: "jonah.reyes@halden-freight.example",
  domain: "halden-freight.example",
}

const gmailForward = `Delivered-To: intake@portal.example
Received: from mail.partner.example
	by mx.portal.example; Mon, 5 Oct 2026 10:02:11 +0200
Received: from relay.partner.example
	by mail.partner.example; Mon, 5 Oct 2026 10:02:10 +0200
MIME-Version: 1.0
From: Mara Lind <mara@partner.example>
Date: Mon, 5 Oct 2026 10:02:09 +0200
Subject: Fwd: Questions before we pilot
To: intake@portal.example
Content-Type: multipart/alternative; boundary="000000000000a1b2c3"

--000000000000a1b2c3
Content-Type: text/plain; charset="UTF-8"

Hi team, Halden's ops lead sent these over. Can you help?

Mara

---------- Forwarded message ---------
From: Jonah Reyes <jonah.reyes@halden-freight.example>
Date: Fri, 2 Oct 2026 at 16:40
Subject: Questions before we pilot
To: Mara Lind <mara@partner.example>


Hi Mara,

Before we commit to a pilot we need answers to these:

1. Where is our shipment data stored?
2. Who at your company can see it?
3. Can we run it in the EU only?
4. How do you connect to our TMS?
5. What happens when the agent is unsure?
6. Can our dispatchers review before anything is sent?
7. How long are logs kept?
8. Do you hold an ISO 27001 certificate?
9. What does a three-month pilot cost?

Thanks,
Jonah

--000000000000a1b2c3
Content-Type: text/html; charset="UTF-8"

<div dir="ltr">Hi team, the HTML copy of the same forward.</div>

--000000000000a1b2c3--
`

function rejectsWith(code: EmailParseError["code"]) {
  return (error: unknown) => error instanceof EmailParseError && error.code === code
}

test("a Gmail forward gives the client as the sender and the partner as the forwarder", () => {
  const email = parseEml(gmailForward)
  assert.deepEqual(email.forwardedFrom, jonah)
  assert.deepEqual(email.from, {
    name: "Mara Lind",
    address: "mara@partner.example",
    domain: "partner.example",
  })
  assert.equal(email.senderDomain, "halden-freight.example")
  assert.equal(email.forwarderDomain, "partner.example")
  assert.equal(email.subject, "Fwd: Questions before we pilot")
  assert.equal(email.date, "Mon, 5 Oct 2026 10:02:09 +0200")
  assert.equal(
    email.forwarderNote,
    "Hi team, Halden's ops lead sent these over. Can you help?\n\nMara"
  )
  assert.equal(email.fromHtml, false)
  assert.ok(email.body.startsWith("Hi Mara,\n\nBefore we commit"))
  assert.ok(email.body.endsWith("Thanks,\nJonah"))
  assert.equal(email.body.match(/^\d\. /gm)?.length, 9)
  assert.doesNotMatch(email.body, /Forwarded message|^From:|^To:/m)
})

test("CRLF input gives the same result with LF-only lines", () => {
  const crlf = gmailForward.replace(/\n/g, "\r\n")
  const email = parseEml(crlf)
  assert.deepEqual(email, parseEml(gmailForward))
  assert.doesNotMatch(email.body, /\r/)
})

test("an Outlook forward behind a line of underscores", () => {
  const email = parseEml(`From: Mara Lind <mara@partner.example>
To: intake@portal.example
Subject: FW: Data residency for the Halden pilot
Date: Tue, 6 Oct 2026 08:15:00 +0000
Content-Type: text/plain; charset="us-ascii"
Content-Transfer-Encoding: 7bit

Forwarding from Halden, see below.

________________________________
From: Reyes, Jonah <jonah.reyes@halden-freight.example>
Sent: Monday, October 5, 2026 5:12 PM
To: Mara Lind <mara@partner.example>
Subject: Data residency for the Halden pilot

Mara,

Can all processing stay in the EU?

Jonah
`)
  assert.deepEqual(email.forwardedFrom, { ...jonah, name: "Reyes, Jonah" })
  assert.equal(email.forwarderNote, "Forwarding from Halden, see below.")
  assert.equal(email.body, "Mara,\n\nCan all processing stay in the EU?\n\nJonah")
  assert.equal(email.senderDomain, "halden-freight.example")
})

test("an Outlook '-----Original Message-----' block with a [mailto:] sender", () => {
  const email = parseEml(`From: Mara Lind <mara@partner.example>
Subject: FW: Single sign-on

-----Original Message-----
From: Priya Anand [mailto:priya.anand@orrin-labs.example]
Sent: Monday, October 5, 2026 9:00 AM
To: Mara Lind
Subject: Single sign-on

Does the platform support SAML with our identity provider?
`)
  assert.deepEqual(email.forwardedFrom, {
    name: "Priya Anand",
    address: "priya.anand@orrin-labs.example",
    domain: "orrin-labs.example",
  })
  assert.equal(email.forwarderNote, "")
  assert.equal(email.body, "Does the platform support SAML with our identity provider?")
})

test("an Apple Mail forward with quoted lines loses the '> ' prefix", () => {
  const email = parseEml(`From: Mara Lind <mara@partner.example>
Subject: Fwd: Audit logs
Date: Mon, 5 Oct 2026 12:01:00 +0200
Content-Type: text/plain; charset=utf-8
Content-Transfer-Encoding: 7bit

Another one from Halden.

Begin forwarded message:

> From: Jonah Reyes <jonah.reyes@halden-freight.example>
> Subject: Audit logs
> Date: 5 October 2026 at 11:20:04 CEST
> To: Mara Lind <mara@partner.example>
>
> Hi Mara,
>
> How long are audit logs kept?
>
> Jonah
`)
  assert.deepEqual(email.forwardedFrom, jonah)
  assert.equal(email.forwarderNote, "Another one from Halden.")
  assert.equal(email.body, "Hi Mara,\n\nHow long are audit logs kept?\n\nJonah")
})

test("quoted-printable joins soft line breaks and decodes UTF-8 bytes", () => {
  const email = parseEml(`From: =?UTF-8?Q?Ren=C3=A9e_Okafor?= <renee@brightwater.example>
Subject: Invoices
Content-Type: text/plain; charset=utf-8
Content-Transfer-Encoding: quoted-printable

Our caf=C3=A9 chain wants to automate supplier invoices across all forty-two =
locations, starting with M=C3=
=BCnster. Budget =3D one pilot.
`)
  assert.equal(
    email.body,
    "Our café chain wants to automate supplier invoices across all forty-two locations, starting with Münster. Budget = one pilot."
  )
  assert.equal(email.from?.name, "Renée Okafor")
})

test("quoted-printable respects an iso-8859-1 charset", () => {
  const email = parseEml(`From: Bjorn Lund <bjorn@nordvik-tools.example>
Subject: Hello
Content-Type: text/plain; charset=iso-8859-1
Content-Transfer-Encoding: quoted-printable

Gr=FC=DFe aus M=FCnster
`)
  assert.equal(email.body, "Grüße aus Münster")
})

test("a base64 text part is decoded as UTF-8", () => {
  const text = "Grüße from Orrin Labs.\r\nWe need SOC 2 evidence before Friday.\r\n"
  const encoded = Buffer.from(text, "utf8").toString("base64").replace(/.{20}/g, "$&\n")
  const email = parseEml(`From: Priya Anand <priya.anand@orrin-labs.example>
Subject: Evidence
Content-Type: text/plain; charset="utf-8"
Content-Transfer-Encoding: base64

${encoded}
`)
  assert.equal(email.body, "Grüße from Orrin Labs.\nWe need SOC 2 evidence before Friday.")
})

test("multipart/alternative picks text/plain even when html comes first", () => {
  const email = parseEml(`From: Priya Anand <priya.anand@orrin-labs.example>
Subject: Two copies
Content-Type: multipart/alternative; boundary=alt-01

--alt-01
Content-Type: text/html; charset=utf-8

<p>The <b>HTML</b> copy.</p>
--alt-01
Content-Type: text/plain; charset=utf-8

The plain copy.
--alt-01--
`)
  assert.equal(email.body, "The plain copy.")
  assert.equal(email.fromHtml, false)
})

test("nested multipart/mixed skips attachments and finds the plain body", () => {
  const email = parseEml(`From: Mara Lind <mara@partner.example>
Subject: Fwd: Security questionnaire
Content-Type: multipart/mixed; boundary="outer-7f3a"

This is a multi-part message in MIME format.

--outer-7f3a
Content-Type: text/plain; name="notes.txt"
Content-Disposition: attachment; filename="notes.txt"

Attached notes, not the body.
--outer-7f3a
Content-Type: multipart/alternative; boundary="outer-7f3a-inner"

--outer-7f3a-inner
Content-Type: text/html; charset=utf-8

<p>HTML version</p>
--outer-7f3a-inner
Content-Type: text/plain; charset=utf-8

Plain version of the questionnaire.
--outer-7f3a-inner--

--outer-7f3a
Content-Type: application/pdf; name="questionnaire.pdf"
Content-Transfer-Encoding: base64

JVBERi0xLjQK
--outer-7f3a--
`)
  assert.equal(email.body, "Plain version of the questionnaire.")
})

test("an html-only email is reduced to text, never markup", () => {
  const email = parseEml(`From: Mara Lind <mara@partner.example>
Subject: Fwd: Pricing
Content-Type: text/html; charset="UTF-8"

<html><head><style>p { color: red }</style><title>Ignore me</title></head><body>
<div dir="ltr">Pricing questions from Halden &amp; co.<br><br>
<div class="gmail_quote"><div dir="ltr" class="gmail_attr">---------- Forwarded message ---------<br>From: <strong class="gmail_sendername" dir="auto">Jonah Reyes</strong> <span dir="auto">&lt;<a href="mailto:jonah.reyes@halden-freight.example">jonah.reyes@halden-freight.example</a>&gt;</span><br>Date: Fri, 2 Oct 2026 at 16:40<br>Subject: Pricing<br>To: Mara Lind &lt;<a href="mailto:mara@partner.example">mara@partner.example</a>&gt;<br></div><br><br>
<div dir="ltr"><p>Is pricing per seat &gt; or per task?</p><p>We&#39;d also like a &quot;pilot&quot; rate.</p><script>alert(1)</script>
<ul><li>Item&nbsp;one</li><li>Item &#8212; two &#x26; more</li></ul></div>



</div></div></body></html>
`)
  assert.equal(email.fromHtml, true)
  assert.deepEqual(email.forwardedFrom, jonah)
  assert.equal(email.forwarderNote, "Pricing questions from Halden & co.")
  assert.equal(
    email.body,
    'Is pricing per seat > or per task?\nWe\'d also like a "pilot" rate.\nItem one\nItem — two & more'
  )
  assert.doesNotMatch(email.body, /<|alert|color|Ignore me/)
})

test("RFC 2047 words decode in Subject and From, joined across adjacent words", () => {
  const email = parseEml(`From: =?ISO-8859-1?Q?Bj=F6rn_Lund?= <bjorn@nordvik-tools.example>
Subject: =?UTF-8?B?UXVlc3Rpb25zIGFib3V0IA==?= =?UTF-8?Q?the_pilot_=E2=80=93_caf=C3?=
 =?UTF-8?Q?=A9_sites?= in Uppsala

Body.
`)
  assert.equal(email.subject, "Questions about the pilot – café sites in Uppsala")
  assert.deepEqual(email.from, {
    name: "Björn Lund",
    address: "bjorn@nordvik-tools.example",
    domain: "nordvik-tools.example",
  })
})

test("folded headers are unfolded and an mbox From line is skipped", () => {
  const email = parseEml(`From jonah.reyes@halden-freight.example Fri Oct  2 16:40:00 2026
Subject: A long subject line that the sending client
 folded onto a second line
From: Jonah Reyes
	<jonah.reyes@halden-freight.example>
content-type: text/plain;
	charset="utf-8"

Short body.
`)
  assert.equal(
    email.subject,
    "A long subject line that the sending client folded onto a second line"
  )
  assert.deepEqual(email.from, jonah)
  assert.equal(email.body, "Short body.")
})

test("an email that is not a forward keeps its whole body", () => {
  const body = "Hi Mara,\n\n1. Where is our data stored?\n2. Who can see it?\n\nJonah"
  const email = parseEml(`From: Jonah Reyes <jonah.reyes@halden-freight.example>
To: Mara Lind <mara@partner.example>
Subject: Questions before we pilot

${body}
`)
  assert.equal(email.body, body)
  assert.equal(email.forwardedFrom, undefined)
  assert.equal(email.forwarderNote, undefined)
  assert.equal(email.forwarderDomain, undefined)
  assert.equal(email.senderDomain, "halden-freight.example")
})

test("an Outlook reply quoting an earlier message is the sender's own email", () => {
  const email = parseEml(`From: Jonah Reyes <jonah.reyes@halden-freight.example>
Subject: RE: Pilot timeline

Mara, we can start in November.

________________________________
From: Mara Lind <mara@partner.example>
Sent: Monday, October 5, 2026 9:00 AM
Subject: Pilot timeline

When could you start?
`)
  assert.equal(email.forwardedFrom, undefined)
  assert.equal(email.senderDomain, "halden-freight.example")
  assert.ok(email.body.startsWith("Mara, we can start in November."))
})

test("a signature rule of underscores without a From line is not a forward", () => {
  const email = parseEml(`From: Jonah Reyes <jonah.reyes@halden-freight.example>
Subject: Quick question

Do you integrate with our TMS?

__________________
Jonah Reyes | Halden Freight
`)
  assert.equal(email.forwardedFrom, undefined)
  assert.ok(email.body.endsWith("Jonah Reyes | Halden Freight"))
})

test("a forward sent as an attached message reads the client from the attachment", () => {
  const email = parseEml(`From: Mara Lind <mara@partner.example>
Subject: FW: Retention policy
Content-Type: multipart/mixed; boundary="fwd-2c"

--fwd-2c
Content-Type: text/plain; charset=utf-8

See the attached email from Orrin Labs.
--fwd-2c
Content-Type: message/rfc822
Content-Disposition: attachment; filename="Retention policy.eml"

From: Priya Anand <priya.anand@orrin-labs.example>
To: Mara Lind <mara@partner.example>
Subject: Retention policy
Content-Type: text/plain; charset=utf-8

How long do you keep our documents?
--fwd-2c--
`)
  assert.equal(email.forwardedFrom?.address, "priya.anand@orrin-labs.example")
  assert.equal(email.forwarderNote, "See the attached email from Orrin Labs.")
  assert.equal(email.body, "How long do you keep our documents?")
  assert.equal(email.senderDomain, "orrin-labs.example")
  assert.equal(email.forwarderDomain, "partner.example")
})

test("blank input is 'empty' and text without headers is 'not-email'", () => {
  assert.throws(() => parseEml(""), rejectsWith("empty"))
  assert.throws(() => parseEml(" \r\n\n\t"), rejectsWith("empty"))
  assert.throws(() => parseEml("Hi Mara,\n\nCan you send the deck?"), rejectsWith("not-email"))
  assert.throws(() => parseEml("Content-Type: text/plain\n\nNo sender."), rejectsWith("not-email"))
})

test("an email with no text or html part is 'no-text'", () => {
  const raw = `From: Mara Lind <mara@partner.example>
Subject: Scan
Content-Type: multipart/mixed; boundary=b1

--b1
Content-Type: image/png; name="scan.png"
Content-Transfer-Encoding: base64

iVBORw0KGgo=
--b1--
`
  assert.throws(() => parseEml(raw), rejectsWith("no-text"))
  assert.throws(() => parseEml("Subject: Nothing here\n\n   \n"), rejectsWith("no-text"))
})

test("parseAddress reads the common mailbox forms", () => {
  assert.deepEqual(parseAddress("Jonah Reyes <jonah.reyes@Halden-Freight.EXAMPLE>"), jonah)
  assert.deepEqual(parseAddress('"Reyes, Jonah" <jonah.reyes@halden-freight.example>'), {
    ...jonah,
    name: "Reyes, Jonah",
  })
  assert.deepEqual(parseAddress("jonah.reyes@halden-freight.example"), {
    address: "jonah.reyes@halden-freight.example",
    domain: "halden-freight.example",
  })
  assert.deepEqual(parseAddress("<jonah.reyes@halden-freight.example>"), {
    address: "jonah.reyes@halden-freight.example",
    domain: "halden-freight.example",
  })
  assert.deepEqual(parseAddress("jonah.reyes@halden-freight.example (Jonah Reyes)"), jonah)
  assert.deepEqual(parseAddress("Jonah Reyes [mailto:jonah.reyes@halden-freight.example]"), jonah)
  assert.deepEqual(
    parseAddress(
      "Jonah Reyes <jonah.reyes@halden-freight.example<mailto:jonah.reyes@halden-freight.example>>"
    ),
    jonah
  )
  assert.equal(
    parseAddress("mara@partner.example, jonah.reyes@halden-freight.example")?.address,
    "mara@partner.example"
  )
})

test("parseAddress returns undefined when there is no usable address", () => {
  assert.equal(parseAddress(""), undefined)
  assert.equal(parseAddress("Jonah Reyes"), undefined)
  assert.equal(parseAddress("Jonah <not an address>"), undefined)
  assert.equal(parseAddress("jonah@localhost"), undefined)
})

test("Outlook HTML forwards are found by the From/Sent pair or the <hr> rule", () => {
  const desktop = parseEml(`From: Mara Lind <mara@partner.example>
Subject: FW: Pricing
Content-Type: text/html; charset="us-ascii"
Content-Transfer-Encoding: quoted-printable

<html><body><p class=3DMsoNormal>Please see below.<o:p></o:p></p>
<div style=3D"border:none;border-top:solid #E1E1E1 1.0pt"><p class=3DMsoNormal><b>From:</b> =
Jonah Reyes &lt;jonah.reyes@halden-freight.example&gt;<br><b>Sent:</b> Monday, October 5, 2026 =
9:00 AM<br><b>To:</b> Mara Lind &lt;mara@partner.example&gt;<br><b>Subject:</b> Pricing</p></div>
<p class=3DMsoNormal>Is there a volume discount?</p></body></html>
`)
  assert.deepEqual(desktop.forwardedFrom, jonah)
  assert.equal(desktop.forwarderNote, "Please see below.")
  assert.equal(desktop.body, "Is there a volume discount?")

  const web = parseEml(`From: Mara Lind <mara@partner.example>
Subject: FW: Onboarding
Content-Type: text/html; charset="utf-8"

<div>FYI</div><hr style="display:inline-block;width:98%" tabindex="-1"><div id="divRplyFwdMsg">
<b>From:</b> Priya Anand &lt;priya.anand@orrin-labs.example&gt;<br><b>Date:</b> Monday, 5 October 2026<br>
<b>Subject:</b> Onboarding</div><div>How long does onboarding take?</div>
`)
  assert.equal(web.forwardedFrom?.domain, "orrin-labs.example")
  assert.equal(web.forwarderNote, "FYI")
  assert.equal(web.body, "How long does onboarding take?")
})

test("an unclosed <style> hides the rest, as it would in a browser", () => {
  const email = parseEml(`From: Mara Lind <mara@partner.example>
Subject: Broken
Content-Type: text/html

<p>Visible question?</p><style>${"<style>".repeat(5000)}
`)
  assert.equal(email.body, "Visible question?")
})
