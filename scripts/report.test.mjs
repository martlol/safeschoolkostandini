import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { createContext, runInContext } from 'node:vm'
import worker from '../dist/server/index.js'

const origin = 'https://safeschool.example'
const scriptUrl = 'https://script.google.com/macros/s/test-script/exec'
const responseUrl = 'https://script.googleusercontent.com/macros/echo?test=1'
const relayKey = 'synthetic-relay-key-for-testing-only'
const env = { APPS_SCRIPT_URL: scriptUrl, APPS_SCRIPT_RELAY_KEY: relayKey }
const id = '5b5db827-f3d2-48b7-a8f0-50060ebef59a'
const report = {
  category: 'verbal', description: 'Përshkrim tërësisht fiktiv.', date: '2020-02-29', place: 'Vend prove', repeated: 'Jo',
  firstName: 'Emër prove', lastName: 'Mbiemër prove', className: 'Klasa provë', teacher: 'Mësues prove',
}

function request(fields = report, source = origin) {
  return new Request(`${origin}/api/reports`, {
    method: 'POST', headers: { Origin: source, 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, report: fields }),
  })
}

test('requires every identity field before forwarding and rejects cross-origin requests', async () => {
  for (const field of ['firstName', 'lastName', 'className', 'teacher']) {
    const response = await worker.fetch(request({ ...report, [field]: ' ' }), env)
    assert.equal(response.status, 400, field)
  }
  assert.equal((await worker.fetch(request(report, 'https://other.example'), env)).status, 403)
  assert.equal((await worker.fetch(request({ ...report, date: '2025-02-31' }), env)).status, 400)
  assert.deepEqual(await (await worker.fetch(request(), {})).json(), { status: 'unavailable' })
})

test('relays a complete email through Apps Script and returns success once across retries', async (t) => {
  const receipts = new Map([['APPS_SCRIPT_RELAY_KEY', relayKey]])
  const sent = []
  let mailAvailable = true
  const props = {
    getProperty: (key) => receipts.get(key) ?? null,
    getProperties: () => Object.fromEntries(receipts),
    setProperty: (key, value) => receipts.set(key, value),
    deleteProperty: (key) => receipts.delete(key),
  }
  const context = createContext({
    PropertiesService: { getScriptProperties: () => props },
    LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock() {} }) },
    ContentService: { MimeType: { JSON: 'application/json' }, createTextOutput: (body) => ({ setMimeType: (type) => ({ body, type }) }) },
    MailApp: {
      getRemainingDailyQuota: () => 100,
      sendEmail(email) {
        if (!mailAvailable) throw new Error('Simulated mail failure')
        sent.push(email)
      },
    },
  })
  runInContext(await readFile('apps-script/Code.gs', 'utf8'), context)
  let output
  t.mock.method(globalThis, 'fetch', async (url, init) => {
    assert.equal(init.redirect, 'manual', 'Cloudflare Workers supports manual redirect handling')
    if (url === scriptUrl) {
      assert.equal(init.method, 'POST')
      output = context.doPost({ postData: { contents: init.body } })
      return new Response(null, { status: 302, headers: { Location: responseUrl } })
    }
    assert.equal(url, responseUrl)
    assert.equal(init.body, undefined)
    return new Response(output.body, { headers: { 'Content-Type': output.type } })
  })

  mailAvailable = false
  assert.deepEqual(await (await worker.fetch(request(), env)).json(), { status: 'failed' })
  assert.equal(sent.length, 0)
  assert.deepEqual(await (await worker.fetch(request(), { ...env, APPS_SCRIPT_RELAY_KEY: 'an-invalid-key-but-long-enough-for-testing' })).json(), { status: 'unavailable' })

  mailAvailable = true
  for (const attempt of [1, 2]) {
    const response = await worker.fetch(request({ ...report, idNumber: 'ID-FIKTIV' }), env)
    assert.equal(response.status, 200, `attempt ${attempt}`)
    assert.deepEqual(await response.json(), { status: 'sent' })
  }
  assert.equal(sent.length, 1)
  assert.equal(sent[0].to, 'sherbimipsikosocialkonstandink@gmail.com')
  for (const value of [report.firstName, report.lastName, report.className, report.teacher]) {
    assert.ok(sent[0].body.includes(value))
  }
  assert.equal(receipts.get(`receipt:${id}`).split(':')[0], 'sent')
  assert.doesNotMatch(sent[0].body, /ID-FIKTIV|kartës së identitetit/)
  assert.ok(![...receipts.values()].some((value) => value.includes(report.description)))
})
