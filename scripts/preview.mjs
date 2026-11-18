import { createServer } from 'node:http'
import { Readable } from 'node:stream'
import worker from '../dist/server/index.js'

const server = createServer(async (incoming, outgoing) => {
  try {
    const method = incoming.method
    const body = method === 'GET' || method === 'HEAD' ? undefined : Readable.toWeb(incoming)
    const request = new Request(new URL(incoming.url, `http://${incoming.headers.host}`), {
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

server.listen(4173, '127.0.0.1', () => console.log('SafeSchool · http://127.0.0.1:4173/'))
