import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { allWords } from '../src/data/words.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const satRoot = path.resolve(here, '..', '..')
const ignoredDirectories = new Set(['flashcards', 'node_modules', 'dist', '.git', '.vite', 'coverage', '.remember'])
const readableExtensions = new Set(['.js', '.jsx', '.ts', '.tsx', '.json', '.md', '.txt', '.html'])
const files = []

function collect(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue
    const fullPath = path.join(directory, entry.name)
    if (entry.isDirectory()) collect(fullPath)
    else if (readableExtensions.has(path.extname(entry.name).toLowerCase()) && entry.name !== 'package-lock.json') files.push(fullPath)
  }
}

collect(satRoot)
const documents = files.map((file) => fs.readFileSync(file, 'utf8').toLowerCase())

// Roots are used only when the corpus contains an inflected form instead of the
// dictionary headword (for example, "substantiated" rather than "substantiate").
const rootOverrides = {
  ambivalent: 'ambivalen', anomaly: 'anomal', buttress: 'buttress',
  compensate: 'compensat', constrain: 'constrain', contend: 'contend', corroborate: 'corroborat',
  criterion: 'criteri', demographic: 'demograph', derive: 'deriv', diminish: 'diminish',
  domesticate: 'domesticat', emission: 'emission', exacerbate: 'exacerbat', fluctuate: 'fluctuat',
  marginal: 'marginal', meticulous: 'meticul', persuade: 'persuad', prevalence: 'prevalen',
  reinforce: 'reinforc', resolute: 'resolut', substantiate: 'substantiat', supersede: 'supersed',
}

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const results = allWords.map(({ word }) => {
  const root = rootOverrides[word]
  const pattern = root ? `\\b${escapeRegExp(root)}[a-z]*\\b` : `\\b${escapeRegExp(word)}\\b`
  const regex = new RegExp(pattern, 'g')
  let hits = 0
  let documentsWithTerm = 0
  for (const document of documents) {
    const matches = document.match(regex)
    if (matches) {
      hits += matches.length
      documentsWithTerm += 1
    }
  }
  return { word, hits, documents: documentsWithTerm }
})

const missing = results.filter((item) => item.hits === 0)
const sourceFolders = new Set(files.map((file) => path.relative(satRoot, file).split(path.sep)[0]))

if (missing.length) {
  console.error(`CORPUS AUDIT FAILED: ${missing.map((item) => item.word).join(', ')}`)
  process.exit(1)
}

console.log(`CORPUS AUDIT PASSED: 150/150 words found across ${files.length} readable files in ${sourceFolders.size} SAT projects`)
console.log('Highest-frequency selected words:')
for (const item of [...results].sort((a, b) => b.hits - a.hits).slice(0, 12)) {
  console.log(`- ${item.word}: ${item.hits} mentions in ${item.documents} files`)
}
