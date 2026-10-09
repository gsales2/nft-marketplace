import { readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'
import { brotliCompress, gzip, constants } from 'node:zlib'

const brotli = promisify(brotliCompress)
const gzipAsync = promisify(gzip)

async function compressDirectory(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name)
    if (entry.isDirectory()) await compressDirectory(file)
    else if (/\.(html|css|js|svg|json)$/.test(entry.name)) {
      const source = await readFile(file)
      const [br, gz] = await Promise.all([
        brotli(source, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } }),
        gzipAsync(source, { level: 9 }),
      ])
      await Promise.all([writeFile(`${file}.br`, br), writeFile(`${file}.gz`, gz)])
    }
  }
}
await compressDirectory('dist')
