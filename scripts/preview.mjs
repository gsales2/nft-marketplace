import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import path from 'node:path'

const argument = (name, fallback) => {
  const index = process.argv.indexOf(`--${name}`)
  return index < 0 ? fallback : process.argv[index + 1]
}
const host = argument('host', '127.0.0.1')
const port = Number(argument('port', '4173'))
const root = path.resolve('dist')
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
}
const isFile = async (file) => {
  try {
    return (await stat(file)).isFile()
  } catch {
    return false
  }
}

createServer(async (request, response) => {
  try {
    if (!['GET', 'HEAD'].includes(request.method)) {
      response.writeHead(405).end()
      return
    }
    const pathname = decodeURIComponent(new URL(request.url, `http://${host}`).pathname)
    const candidate = path.resolve(root, `.${pathname}`)
    if (candidate !== root && !candidate.startsWith(`${root}${path.sep}`)) {
      response.writeHead(403).end()
      return
    }
    let file = candidate
    if (!(await isFile(file))) {
      file = (await isFile(`${candidate}.html`))
        ? `${candidate}.html`
        : path.join(root, 'index.html')
      if (path.extname(pathname) && !(await isFile(candidate))) {
        response.writeHead(404).end()
        return
      }
    }
    const headers = {
      'Content-Type': types[path.extname(file)] ?? 'application/octet-stream',
      'X-Content-Type-Options': 'nosniff',
      Vary: 'Accept-Encoding',
      'Cache-Control': file.includes(`${path.sep}assets${path.sep}`)
        ? 'public, max-age=31536000, immutable'
        : file.includes(`${path.sep}images${path.sep}`)
          ? 'public, max-age=3600'
          : 'no-cache',
    }
    if (pathname === '/mockServiceWorker.js') {
      headers['Cache-Control'] = 'no-store'
      headers['Service-Worker-Allowed'] = '/'
    }
    const accepted = request.headers['accept-encoding'] ?? ''
    for (const [encoding, suffix] of [
      ['br', '.br'],
      ['gzip', '.gz'],
    ]) {
      if (accepted.includes(encoding) && (await isFile(`${file}${suffix}`))) {
        headers['Content-Encoding'] = encoding
        file += suffix
        break
      }
    }
    const body = await readFile(file)
    response.writeHead(200, { ...headers, 'Content-Length': body.length })
    response.end(request.method === 'HEAD' ? undefined : body)
  } catch {
    response.writeHead(500).end()
  }
}).listen(port, host, () => console.log(`Production preview: http://${host}:${port}`))
