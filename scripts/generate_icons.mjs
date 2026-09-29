// Regenerates every icon raster in public/ from public/favicon.svg.
//
// Chrome does the rasterising, so the PNGs are exactly what a browser draws
// from the same file - no separate copy of the artwork to keep in sync. Run it
// whenever the sock changes, then bump the ?v= in index.html and
// site.webmanifest, because iOS and Google's favicon service cache an icon
// against its URL forever.
//
//   node scripts/generate_icons.mjs
//
// Needs Chrome at the path below and nothing else; there are no npm deps.

import { spawn } from 'node:child_process'
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const PORT = 9335
const here = dirname(fileURLToPath(import.meta.url))
const publicDir = resolve(here, '..', 'public')

// Transparent unless a background is named: the favicons and the Android icons
// sit on whatever the browser's chrome is, while iOS composites a home-screen
// icon over black if it is given alpha, so that one gets a real white page.
const OUTPUTS = [
  { file: 'favicon-16x16.png', size: 16 },
  { file: 'favicon-32x32.png', size: 32 },
  { file: 'favicon-48x48.png', size: 48 },
  { file: 'android-chrome-192x192.png', size: 192 },
  { file: 'android-chrome-512x512.png', size: 512 },
  { file: 'apple-touch-icon.png', size: 180, background: '#ffffff' },
]
const ICO_SIZES = [16, 32, 48, 64, 128, 256]

const svg = readFileSync(join(publicDir, 'favicon.svg'), 'utf8')
const profile = mkdtempSync(join(tmpdir(), 'skieta-icons-'))
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const chrome = spawn(CHROME, [
  '--headless=new',
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${profile}`,
  '--no-first-run',
  '--no-default-browser-check',
  '--hide-scrollbars',
  '--force-device-scale-factor=1',
  'about:blank',
], { stdio: 'ignore' })

async function target() {
  for (let i = 0; i < 60; i++) {
    try {
      const list = await fetch(`http://127.0.0.1:${PORT}/json/list`).then((r) => r.json())
      const page = list.find((t) => t.type === 'page')
      if (page) return page
    } catch { /* still starting */ }
    await sleep(250)
  }
  throw new Error('Chrome did not open a debugging port')
}

const page = await target()
const ws = new WebSocket(page.webSocketDebuggerUrl)
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej })

let nextId = 1
const pending = new Map()
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data)
  if (!msg.id || !pending.has(msg.id)) return
  const { resolve: ok, reject } = pending.get(msg.id)
  pending.delete(msg.id)
  msg.error ? reject(new Error(msg.error.message)) : ok(msg.result)
}
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const id = nextId++
    pending.set(id, { resolve, reject })
    ws.send(JSON.stringify({ id, method, params }))
  })

await send('Page.enable')

async function render(size, background) {
  const html = `<!doctype html><meta charset="utf8"><style>
    html,body{margin:0;padding:0;width:${size}px;height:${size}px;background:${background ?? 'transparent'}}
    svg{display:block;width:${size}px;height:${size}px}
  </style>${svg}`
  await send('Page.navigate', { url: 'data:text/html;charset=utf-8,' + encodeURIComponent(html) })
  await sleep(250)
  await send('Emulation.setDeviceMetricsOverride', { width: size, height: size, deviceScaleFactor: 1, mobile: false })
  await send('Emulation.setDefaultBackgroundColorOverride', background ? {} : { color: { r: 0, g: 0, b: 0, a: 0 } })
  const shot = await send('Page.captureScreenshot', {
    format: 'png',
    clip: { x: 0, y: 0, width: size, height: size, scale: 1 },
  })
  return Buffer.from(shot.data, 'base64')
}

for (const { file, size, background } of OUTPUTS) {
  const png = await render(size, background)
  writeFileSync(join(publicDir, file), png)
  console.log(`${file}  ${size}x${size}${background ? ' on ' + background : ' transparent'}`)
}

// A modern .ico is just PNGs in a directory structure: a 6 byte header, one
// 16 byte entry per size, then the files themselves.
const images = []
for (const size of ICO_SIZES) images.push({ size, png: await render(size) })

const header = Buffer.alloc(6)
header.writeUInt16LE(0, 0)
header.writeUInt16LE(1, 2)
header.writeUInt16LE(images.length, 4)
const entries = Buffer.alloc(16 * images.length)
let offset = header.length + entries.length
images.forEach((image, i) => {
  const at = i * 16
  entries.writeUInt8(image.size >= 256 ? 0 : image.size, at)
  entries.writeUInt8(image.size >= 256 ? 0 : image.size, at + 1)
  entries.writeUInt8(0, at + 2)
  entries.writeUInt8(0, at + 3)
  entries.writeUInt16LE(1, at + 4)
  entries.writeUInt16LE(32, at + 6)
  entries.writeUInt32LE(image.png.length, at + 8)
  entries.writeUInt32LE(offset, at + 12)
  offset += image.png.length
})
writeFileSync(join(publicDir, 'favicon.ico'), Buffer.concat([header, entries, ...images.map((i) => i.png)]))
console.log(`favicon.ico  ${ICO_SIZES.join(', ')}`)

try { await send('Browser.close') } catch { /* already gone */ }
ws.close()
chrome.kill()
// Best effort: Chrome can still hold files in its profile for a moment after
// it is asked to close, and a failed cleanup of a temp directory is not a
// reason to fail a run that already wrote every icon.
try { rmSync(profile, { recursive: true, force: true }) } catch { /* the OS will sweep it */ }
process.exit(0)
