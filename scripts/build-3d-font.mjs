// Converts a subset of Bricolage Grotesque ExtraBold into the typeface JSON
// format used by three.js TextGeometry. Run with: node scripts/build-3d-font.mjs
// The output is committed, so this only needs to run again if the glyph set changes.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import opentype from 'opentype.js'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const source = resolve(
  root,
  'node_modules/@fontsource/bricolage-grotesque/files/bricolage-grotesque-latin-800-normal.woff',
)
const output = resolve(root, 'src/three/fonts/bricolage-800.typeface.json')
const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789>-–·/.&+ '

const buffer = readFileSync(source)
const font = opentype.parse(
  buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
)
const scale = 100000 / ((font.unitsPerEm || 2048) * 72)
const round = Math.round
const glyphs = {}

for (const character of characters) {
  const glyph = font.charToGlyph(character)
  if (!glyph) continue
  const box = glyph.getBoundingBox()
  const token = {
    ha: round(glyph.advanceWidth * scale),
    x_min: round(box.x1 * scale),
    x_max: round(box.x2 * scale),
    o: '',
  }
  for (const command of glyph.path.commands) {
    const type = command.type.toLowerCase() === 'c' ? 'b' : command.type.toLowerCase()
    token.o += `${type} `
    if (command.x !== undefined && command.y !== undefined) {
      token.o += `${round(command.x * scale)} ${round(command.y * scale)} `
    }
    if (command.x1 !== undefined && command.y1 !== undefined) {
      token.o += `${round(command.x1 * scale)} ${round(command.y1 * scale)} `
    }
    if (command.x2 !== undefined && command.y2 !== undefined) {
      token.o += `${round(command.x2 * scale)} ${round(command.y2 * scale)} `
    }
  }
  token.o = token.o.trim()
  glyphs[character] = token
}

const typeface = {
  glyphs,
  familyName: 'Bricolage Grotesque ExtraBold (subset)',
  ascender: round(font.ascender * scale),
  descender: round(font.descender * scale),
  underlinePosition: font.tables.post?.underlinePosition ?? -100,
  underlineThickness: font.tables.post?.underlineThickness ?? 50,
  boundingBox: {
    xMin: font.tables.head.xMin,
    xMax: font.tables.head.xMax,
    yMin: font.tables.head.yMin,
    yMax: font.tables.head.yMax,
  },
  resolution: 1000,
  original_font_information: {
    format: 0,
    copyright: 'Bricolage Grotesque, SIL Open Font License 1.1',
  },
}

mkdirSync(dirname(output), { recursive: true })
writeFileSync(output, JSON.stringify(typeface))
console.log(`Wrote ${Object.keys(glyphs).length} glyphs to ${output}`)
