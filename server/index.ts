import assets from 'virtual:safeschool-assets'
import { parseReport, reportDetails } from '../src/report'

type Env = {
  APPS_SCRIPT_URL?: string
  APPS_SCRIPT_RELAY_KEY?: string
}

const MAX_REQUEST_BYTES = 32_768
const deliveryCodes = { sent: 200, pending: 503, limited: 429, failed: 502 } as const

function reply(status: string, code: number) {
  return Response.json({ status }, { status: code, headers: { 'Cache-Control': 'no-store' } })
}

function relayConfig(env: Env) {
  const url = env.APPS_SCRIPT_URL?.trim() ?? ''
  const key = env.APPS_SCRIPT_RELAY_KEY?.trim() ?? ''
  if (!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(url) || key.length < 32) return null
  return { url, key }
}

async function readSubmission(request: Request) {
  const reader = request.body?.getReader()
  if (!reader) return null
  const decoder = new TextDecoder()
  let bytes = 0
  let body = ''
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    bytes += value.byteLength
    if (bytes > MAX_REQUEST_BYTES) {
      await reader.cancel()
      return null
    }
    body += decoder.decode(value, { stream: true })
  }
  return JSON.parse(body + decoder.decode())
}

async function sendReport(request: Request, url: URL, env: Env) {
  if (request.method !== 'POST') return reply('invalid', 405)
  if (request.headers.get('Origin') !== url.origin) return reply('invalid', 403)
  if (request.headers.get('Content-Type')?.split(';')[0] !== 'application/json') return reply('invalid', 415)

  const config = relayConfig(env)
  if (!config) return reply('unavailable', 503)

  let payload
  try {
    payload = await readSubmission(request)
  } catch {
    return reply('invalid', 400)
  }
  const id = payload?.id
  const report = parseReport(payload?.report)
  if (typeof id !== 'string' || !/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(id) || !report) {
    return reply('invalid', 400)
  }

  const message = reportDetails(report).map(([label, value]) => `${label}: ${value}`).join('\n\n')
  try {
    const signal = AbortSignal.timeout(24_000)
    let result = await fetch(config.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: config.key, id, message }),
      redirect: 'manual',
      signal,
    })
    if (result.status === 302 || result.status === 303) {
      const location = result.headers.get('Location')
      if (!location || new URL(location).origin !== 'https://script.googleusercontent.com') return reply('unavailable', 503)
      result = await fetch(location, { redirect: 'error', signal })
    }
    if (!result.ok || !result.headers.get('Content-Type')?.startsWith('application/json')) return reply('pending', 502)
    const { status } = await result.json() as { status?: keyof typeof deliveryCodes | 'unavailable' }
    if (status === 'unavailable') return reply(status, 503)
    if (status && Object.hasOwn(deliveryCodes, status)) return reply(status, deliveryCodes[status])
    return reply('pending', 502)
  } catch {
    return reply('pending', 502)
  }
}

export default {
  fetch(request: Request, env: Env) {
    const url = new URL(request.url)
    if (url.pathname === '/api/reports' && request.method === 'GET') {
      return relayConfig(env) ? reply('ready', 200) : reply('unavailable', 503)
    }
    if (url.pathname === '/api/reports') return sendReport(request, url, env)
    if (request.method !== 'GET' && request.method !== 'HEAD') return new Response(null, { status: 405 })
    const path = url.pathname === '/' ? '/index.html' : url.pathname
    const asset = Object.hasOwn(assets, path) ? assets[path] : undefined
    if (!asset) return new Response(null, { status: 404 })

    const headers = {
      'Content-Type': asset.type,
      'Cache-Control': path.startsWith('/assets/') ? 'private, max-age=31536000, immutable' : 'private, no-cache',
      'X-Content-Type-Options': 'nosniff',
    }
    if (request.method === 'HEAD') return new Response(null, { headers })
    const binary = atob(asset.data)
    const bytes = new Uint8Array(binary.length)
    for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index)
    return new Response(bytes, { headers })
  },
}
