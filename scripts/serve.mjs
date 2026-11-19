import { createServer } from 'node:http'
import { Readable } from 'node:stream'
import worker from '../dist/server/index.js'

const preview = process.argv.includes('--preview')
const hostname = preview ? '127.0.0.1' : '0.0.0.0'
const port = preview ? 4173 : Number(process.env.PORT ?? 8080)
const configuredUrl = !preview && process.env.PUBLIC_ORIGIN ? new URL(process.env.PUBLIC_ORIGIN) : undefined
if (configuredUrl && !['https:', 'http:'].includes(configuredUrl.protocol)) throw new Error('PUBLIC_ORIGIN must use HTTP or HTTPS.')

const server = createServer(async (incoming, outgoing) => {
  try {
    const target = incoming.url ?? '/'
    if (!target.startsWith('/')) return outgoing.writeHead(400).end()
    const forwardedProtocol = incoming.headers['x-forwarded-proto']
    const protocol = !preview && typeof forwardedProtocol === 'string' && forwardedProtocol.split(',')[0].trim() === 'https' ? 'https' : 'http'
    const origin = configuredUrl?.origin ?? `${protocol}://${incoming.headers.host ?? `localhost:${port}`}`
    const method = incoming.method
    const body = method === 'GET' || method === 'HEAD' ? undefined : Readable.toWeb(incoming)
    const request = new Request(`${origin}${target}`, {
      method, headers: incoming.headers, body, duplex: 'half',
    })
    const response = await worker.fetch(request, process.env)
    outgoing.writeHead(response.status, Object.fromEntries(response.headers))
    if (response.body) Readable.fromWeb(response.body).pipe(outgoing)
    else outgoing.end()
  } catch {
    outgoing.writeHead(500).end()
  }
})

server.listen(port, hostname, () => console.log(`SafeSchool · http://${hostname}:${port}/`))
