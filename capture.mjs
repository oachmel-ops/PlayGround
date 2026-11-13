import { createRequire } from 'node:module'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

const url = process.env.CAPTURE_URL
const output = process.env.CAPTURE_DIR
if (!url || !output) throw new Error('Set CAPTURE_URL and CAPTURE_DIR.')
let target
try {
  target = new URL(url)
  if (!['http:', 'https:'].includes(target.protocol)) throw new Error('Unsupported URL protocol')
} catch (error) {
  console.error(`Invalid CAPTURE_URL: ${error.message}`)
  process.exit(1)
}
try {
  mkdirSync(output, { recursive: true })
} catch (error) {
  console.error(`Cannot create CAPTURE_DIR: ${error.message}`)
  process.exit(1)
}

const runtime = join(process.env.HOME || '', '.local/share/omgithub-playwright')
const require = createRequire(join(runtime, 'package.json'))
let chromium, config
try {
  ;({ chromium } = require('playwright'))
  config = require('node:fs').readFileSync(join(runtime, process.platform === 'darwin' ? 'metal.json' : 'linux.json'), 'utf8')
  config = JSON.parse(config)
} catch (error) {
  console.error(`Browser automation setup failed: ${error.message}`)
  process.exit(75)
}
if (process.platform === 'linux') {
  try {
    process.env.DISPLAY ||= ':' + require('node:fs').readFileSync(join(runtime, 'display'), 'utf8').trim()
  } catch (error) {
    console.error(`Browser display setup failed: ${error.message}`)
    process.exit(75)
  }
}

let browser
let exitCode = 0
const defects = []
const transient = error => {
  const wrapped = new Error(error?.message || String(error))
  wrapped.exitCode = 75
  return wrapped
}
try {
  browser = await chromium.launch({ ...config.browser.launchOptions, timeout: 30000 }).catch(error => { throw transient(error) })
  for (const [name, viewport, mobile] of [
    ['desktop', { width: 1440, height: 900 }, false],
    ['mobile', { width: 390, height: 844 }, true],
  ]) {
    const page = await browser.newPage({ viewport, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: 1 }).catch(error => { throw transient(error) })
    const pageDefects = []
    page.on('pageerror', error => pageDefects.push(`JavaScript error: ${error.message}`))
    page.on('response', response => {
      if (response.status() >= 400 && new URL(response.url()).origin === target.origin) {
        pageDefects.push(`HTTP ${response.status()} for ${response.url()}`)
      }
    })
    let response
    try {
      response = await page.goto(target.href, { waitUntil: 'load', timeout: 45000 })
    } catch (error) {
      await page.close().catch(() => {})
      throw transient(error)
    }
    if (!response) {
      await page.close().catch(() => {})
      throw transient(new Error('Navigation completed without an HTTP response'))
    }
    if (response.status() >= 500 || [408, 429].includes(response.status())) {
      await page.close().catch(() => {})
      throw transient(new Error(`Preview temporarily returned HTTP ${response.status()}`))
    }
    if (!response.ok()) {
      await page.close().catch(() => {})
      throw new Error(`Preview returned HTTP ${response.status()}`)
    }
    try {
      await page.locator('#title-screen h1').waitFor({ state: 'visible', timeout: 15000 })
      await page.locator('#game').waitFor({ state: 'visible' })
      await page.evaluate(async () => {
        if (document.fonts?.ready) await document.fonts.ready
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      })
    } catch (error) {
      await page.close().catch(() => {})
      throw new Error(`Rendered game content was not ready (${name}): ${error.message}`)
    }
    if (pageDefects.length) defects.push(...pageDefects)
    try {
      await page.screenshot({ path: join(output, `final-${name}.png`), fullPage: false, timeout: 30000 })
      console.log(`Saved ${join(output, `final-${name}.png`)}`)
    } catch (error) {
      await page.close().catch(() => {})
      if (error.name === 'TimeoutError' || !browser.isConnected()) throw transient(error)
      throw error
    }
    await page.close()
  }
  if (defects.length) throw new Error(`Page rendering defects: ${defects.join('; ')}`)
} catch (error) {
  console.error(error)
  exitCode = error.exitCode || 1
} finally {
  if (browser) {
    try {
      await browser.close()
    } catch (error) {
      console.error(`Could not close capture browser cleanly: ${error.message}`)
      if (!exitCode) exitCode = 75
    }
  }
}
process.exitCode = exitCode
