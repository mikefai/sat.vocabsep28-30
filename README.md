# Lexicon 150

An English–Turkish SAT vocabulary study app built from the preparation materials in the parent `SAT` workspace.

## Content method

- Inspected every sibling project folder in the workspace; 11 contained SAT lesson or assessment content and one contained tooling metadata only.
- Weighted 69 high-signal question-bank, answer-key, passage, and vocabulary-support files most heavily.
- Counted recurring words across the broader readable corpus, then normalized common inflections (for example, `criteria` → `criterion`).
- Curated the final list for transfer value: exam reasoning language plus reusable science, social-science, and humanities vocabulary. Narrow proper nouns and one-off technical labels were excluded.
- Verified that all 150 headwords or their common inflections occur in the source corpus.

## Study design

The 150 words are arranged into 10 groups of 15. Every group can be practiced with:

1. Flashcards
2. Definition Match
3. Context Choice
4. Fill the Gap
5. Synonym Sprint

A word is marked mastered after three successful recalls. Progress is stored locally in the browser.

Each entry includes an English definition and example plus a Turkish translation and natural Turkish example sentence. Turkish support appears on revealed flashcards and after exercise answers.

## Run locally

```powershell
npm install
npm run dev
```

Validation commands:

```powershell
npm run validate
npm run audit:corpus
npm run build
```
