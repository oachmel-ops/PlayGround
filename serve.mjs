import { createReadStream, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(fileURLToPath(new URL('./dist', import.meta.url)))
const port = Number(process.env.PORT || 3000)
const types = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
}

const server = createServer((request, response) => {
  let pathname
  try {
    pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname)
  } catch {
    response.writeHead(400).end('Bad Request')
    return
  }
  let file = resolve(root, `.${pathname}`)
  if (file !== root && !file.startsWith(root + sep)) {
    response.writeHead(403).end('Forbidden')
    return
  }
  try {
    if (statSync(file).isDirectory()) file = resolve(file, 'index.html')
  } catch {
    if (!extname(file)) file = resolve(root, 'index.html')
  }
  try {
    const info = statSync(file)
    if (!info.isFile() || (file !== root && !file.startsWith(root + sep))) throw new Error('Not a file')
    response.writeHead(200, {
      'Content-Length': info.size,
      'Content-Type': types[extname(file)] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    })
    createReadStream(file).pipe(response)
  } catch {
    response.writeHead(404).end('Not Found')
  }
})

server.listen(port, '0.0.0.0', () => {
  console.log(`Umbral de Ceniza serving ${root} on port ${port}`)
})
