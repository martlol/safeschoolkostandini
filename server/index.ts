import assets from 'virtual:safeschool-assets'
import { handleReportRequest } from '../functions/packages/api/reports/relay'
import type { ReportEnvironment } from '../functions/packages/api/reports/relay'

export default {
  fetch(request: Request, env: ReportEnvironment) {
    const { pathname } = new URL(request.url)
    if (pathname === '/api/reports') return handleReportRequest(request, env)
    if (request.method !== 'GET' && request.method !== 'HEAD') return new Response(null, { status: 405 })
    const path = pathname === '/' ? '/index.html' : pathname
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
