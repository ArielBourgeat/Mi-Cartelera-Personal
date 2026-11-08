import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const allowed = new Set(['.ts', '.tsx', '.css', '.html', '.json', '.md'])

function readStdin() {
  try {
    return readFileSync(0, 'utf8')
  } catch {
    return ''
  }
}

function fileFromPayload(raw) {
  if (!raw.trim()) return ''
  try {
    const payload = JSON.parse(raw)
    const input = payload.tool_input ?? payload.toolInput ?? {}
    return input.file_path ?? input.filePath ?? ''
  } catch {
    return ''
  }
}

const filePath = fileFromPayload(readStdin())
if (!filePath || !allowed.has(path.extname(filePath).toLowerCase())) {
  process.exit(0)
}

const absolute = path.isAbsolute(filePath) ? filePath : path.join(root, filePath)
const prettierBin = path.join(root, 'node_modules', 'prettier', 'bin', 'prettier.cjs')
spawnSync(process.execPath, [prettierBin, '--write', absolute], {
  cwd: root,
  stdio: 'ignore',
})
process.exit(0)
