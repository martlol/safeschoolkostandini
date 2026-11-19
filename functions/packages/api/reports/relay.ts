import { parseReport, reportDetails } from './report'

export type ReportEnvironment = {
  APPS_SCRIPT_URL?: string
  APPS_SCRIPT_RELAY_KEY?: string
}

const MAX_REQUEST_BYTES = 32_768
const deliveryCodes = { sent: 200, pending: 503, limited: 429, failed: 502 } as const

export function reportReply(status: string, code: number) {
  return Response.json({ status }, { status: code, headers: { 'Cache-Control': 'no-store' } })
}

function relayConfig(env: ReportEnvironment) {
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

export async function handleReportRequest(request: Request, env: ReportEnvironment) {
  const config = relayConfig(env)
  if (request.method === 'GET') return config ? reportReply('ready', 200) : reportReply('unavailable', 503)
  if (request.method !== 'POST') return reportReply('invalid', 405)
  if (request.headers.get('Origin') !== new URL(request.url).origin) return reportReply('invalid', 403)
  if (request.headers.get('Content-Type')?.split(';')[0] !== 'application/json') return reportReply('invalid', 415)
  if (!config) return reportReply('unavailable', 503)

  let payload
  try {
    payload = await readSubmission(request)
  } catch {
    return reportReply('invalid', 400)
  }
  const id = payload?.id
  const report = parseReport(payload?.report)
  if (typeof id !== 'string' || !/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(id) || !report) {
    return reportReply('invalid', 400)
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
      if (!location || new URL(location).origin !== 'https://script.googleusercontent.com') return reportReply('unavailable', 503)
      result = await fetch(location, { redirect: 'manual', signal })
    }
    if (!result.ok || !result.headers.get('Content-Type')?.startsWith('application/json')) return reportReply('pending', 502)
    const { status } = await result.json() as { status?: keyof typeof deliveryCodes | 'unavailable' }
    if (status === 'unavailable') return reportReply(status, 503)
    if (status && Object.hasOwn(deliveryCodes, status)) return reportReply(status, deliveryCodes[status])
    return reportReply('pending', 502)
  } catch {
    return reportReply('pending', 502)
  }
}
