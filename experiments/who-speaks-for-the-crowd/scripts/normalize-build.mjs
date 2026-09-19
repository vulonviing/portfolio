import { readFile, writeFile } from 'node:fs/promises'

const outputFile = new URL('../../../who-speaks-for-the-crowd/index.html', import.meta.url)
const html = await readFile(outputFile, 'utf8')

await writeFile(outputFile, html.replace(/\r\n?/g, '\n'), 'utf8')
