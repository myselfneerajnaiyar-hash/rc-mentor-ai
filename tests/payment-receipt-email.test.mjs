import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"
import vm from "node:vm"
import ts from "typescript"

async function loadModule(file, dependencies, globals = {}) {
  const source = await readFile(new URL(file, import.meta.url), "utf8")
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  })
  const exports = {}
  vm.runInNewContext(compiled.outputText, {
    exports, Response, console, ...globals,
    require(name) {
      assert.ok(Object.hasOwn(dependencies, name), `Unexpected dependency: ${name}`)
      return dependencies[name]
    },
  }, { filename: file })
  return exports
}

test("successful payment receipt omits promotional coupons while retaining actual payment details", async () => {
  let sent
  const { sendPaymentReceipt } = await loadModule("../lib/email/sendPaymentReceipt.js", {
    "@/lib/resend": { resend: { emails: { send: async (...args) => { sent = args; return { data: { id: "receipt-1" } } } } } },
  })

  await sendPaymentReceipt({
    email: "student@example.test",
    name: "Student",
    plan: "monthly",
    amountPaise: 23940,
    expiresAt: "2026-11-16T00:00:00.000Z",
    paymentId: "pay-test",
  })

  assert.match(sent[0].html, /Amount Paid:<\/strong> ₹239\.40/)
  assert.match(sent[0].html, /Monthly Plan/)
  assert.doesNotMatch(sent[0].html, /AUCTOR20|AUCTOR30|20% OFF Auctor RC|30% OFF Auctor RC/)
})

test("legacy payment confirmation route omits promotional coupons and retains the supplied amount", async () => {
  let sent
  class Resend {
    constructor() {
      this.emails = { send: async message => { sent = message; return { id: "receipt-2" } } }
    }
  }
  const { POST } = await loadModule("../app/api/send-payment-email/route.js", {
    resend: { Resend },
  }, { process: { env: { RESEND_API_KEY: "test-only" } } })

  await POST({ json: async () => ({ email: "student@example.test", name: "Student", plan: "Monthly Premium", amount: "239.40", expiry: "16 Nov 2026" }) })

  assert.match(sent.html, /Amount Paid:<\/strong> ₹239\.40/)
  assert.doesNotMatch(sent.html, /AUCTOR20|AUCTOR30|20% OFF Auctor RC|30% OFF Auctor RC/)
})

test("shared promotion remains enabled for other automated email flows", async () => {
  let sent
  const { sendEmail } = await loadModule("../lib/email/sendEmail.js", {
    resend: { Resend: class { constructor() { this.emails = { send: async message => { sent = message; return { id: "other-email" } } } } } },
    "@/lib/email/promotion": { AUCTOR30_PROMOTION_HTML: "<p>Use code: AUCTOR30</p>" },
  }, { process: { env: { RESEND_API_KEY: "test-only" } } })

  await sendEmail({ to: "student@example.test", subject: "Other automated email", html: "Existing content" })
  assert.match(sent.html, /Existing content/)
  assert.match(sent.html, /AUCTOR30/)
})
