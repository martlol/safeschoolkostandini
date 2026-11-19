import { handleReportRequest, reportReply } from './relay'

export async function main(event) {
  const { http } = event ?? {}
  let response

  if (!http || !['GET', 'POST'].includes(http.method)) {
    response = reportReply('invalid', 405)
  } else {
    try {
      const origin = new URL(process.env.PUBLIC_ORIGIN)
      if (origin.protocol !== 'https:') throw new Error('PUBLIC_ORIGIN must use HTTPS')
      const body = http.isBase64Encoded ? Buffer.from(http.body ?? '', 'base64') : http.body
      const request = new Request(new URL('/api/reports', origin), {
        method: http.method,
        headers: http.headers,
        body: http.method === 'POST' ? body : undefined,
      })
      response = await handleReportRequest(request, process.env)
    } catch {
      response = reportReply('unavailable', 503)
    }
  }

  return {
    statusCode: response.status,
    headers: Object.fromEntries(response.headers),
    body: await response.text(),
  }
}
