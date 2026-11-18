import { readdir, readFile } from 'node:fs/promises'
import { extname } from 'node:path'
import { build } from 'vite'

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
}

const client = await build({ configFile: false, build: { write: false } })
const assets = Object.create(null)

function addAsset(name, source) {
  const type = mimeTypes[extname(name)]
  if (!type) throw new Error(`Specify the media type for ${name}`)
  assets[`/${name}`] = { type, data: Buffer.from(source).toString('base64') }
}

for (const output of client.output) {
  addAsset(output.fileName, output.type === 'asset' ? output.source : output.code)
}

for (const name of await readdir('public')) addAsset(name, await readFile(`public/${name}`))

const assetModule = 'virtual:safeschool-assets'
await build({
  configFile: false,
  plugins: [{
    name: 'safeschool-assets',
    resolveId(id) { if (id === assetModule) return `\0${id}` },
    load(id) { if (id === `\0${assetModule}`) return `export default ${JSON.stringify(assets)}` },
  }],
  build: {
    ssr: 'server/index.ts',
    outDir: 'dist',
    emptyOutDir: true,
    copyPublicDir: false,
    rollupOptions: { output: { entryFileNames: 'server/index.js' } },
  },
})
