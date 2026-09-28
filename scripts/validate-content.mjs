import { groups, allWords, modes } from '../src/data/words.js'
import { turkishContent } from '../src/data/turkish.js'

const errors = []
const seen = new Set()

if (groups.length !== 10) errors.push(`Expected 10 groups, found ${groups.length}`)
if (allWords.length !== 150) errors.push(`Expected 150 words, found ${allWords.length}`)
if (modes.length !== 5) errors.push(`Expected 5 modes, found ${modes.length}`)
if (Object.keys(turkishContent).length !== 150) errors.push(`Expected 150 Turkish entries, found ${Object.keys(turkishContent).length}`)

for (const group of groups) {
  if (group.words.length !== 15) errors.push(`${group.title}: expected 15 words, found ${group.words.length}`)
  for (const item of group.words) {
    if (seen.has(item.word)) errors.push(`Duplicate word: ${item.word}`)
    seen.add(item.word)
    for (const field of ['word', 'part', 'definition', 'synonym', 'example', 'turkish', 'turkishExample']) {
      if (!item[field]?.trim()) errors.push(`${item.word || group.title}: missing ${field}`)
    }
    if (!new RegExp(`\\b${item.word}\\b`, 'i').test(item.example)) errors.push(`${item.word}: example must contain the exact headword`)
  }
}

for (const translatedWord of Object.keys(turkishContent)) {
  if (!seen.has(translatedWord)) errors.push(`Turkish entry has no matching headword: ${translatedWord}`)
}

if (errors.length) {
  console.error(`CONTENT VALIDATION FAILED\n- ${errors.join('\n- ')}`)
  process.exit(1)
}

console.log(`CONTENT VALIDATION PASSED: ${allWords.length} unique bilingual words · ${groups.length} groups · ${modes.length} exercise modes`)
