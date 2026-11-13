import { cpSync, mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'

const project = process.cwd()
const output = join(project, 'dist')
const files = ['index.html', 'game.js', 'styles.css', 'manifest.webmanifest', 'service-worker.js']

rmSync(output, { recursive: true, force: true })
mkdirSync(output, { recursive: true })
for (const file of files) cpSync(join(project, file), join(output, file))
cpSync(join(project, 'assets'), join(output, 'assets'), { recursive: true })
console.log(`Built static game into ${output}`)
