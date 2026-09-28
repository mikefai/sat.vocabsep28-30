import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpen,
  Check,
  ChevronRight,
  CircleHelp,
  FileText,
  Keyboard,
  ListChecks,
  PencilLine,
  RotateCcw,
  Sparkles,
  X,
  Zap,
} from 'lucide-react'
import { allWords, groups, modes } from './data/words.js'

const STORAGE_KEY = 'lexicon-150-progress-v3'
const modeIcons = { flashcards: BookOpen, definition: ListChecks, context: FileText, gap: PencilLine, synonym: Zap }

function readProgress() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { scores: {}, studied: [] }
  } catch {
    return { scores: {}, studied: [] }
  }
}

function seededOptions(items, currentIndex) {
  const offsets = [0, 4, 9, 12]
  const selected = offsets.map((offset) => items[(currentIndex + offset) % items.length])
  const shift = currentIndex % selected.length
  return [...selected.slice(shift), ...selected.slice(0, shift)]
}

function GroupNav({ groupIndex, setGroupIndex, progress, openOverview }) {
  return (
    <aside className="group-nav" aria-label="Vocabulary groups">
      <div className="mobile-group-label">Choose a word group</div>
      <div className="group-list">
        {groups.map((group, index) => {
          const mastered = group.words.filter((item) => (progress.scores[item.word] || 0) >= 3).length
          return (
            <button
              className={`group-button ${index === groupIndex ? 'active' : ''}`}
              key={group.id}
              onClick={() => setGroupIndex(index)}
              aria-current={index === groupIndex ? 'true' : undefined}
            >
              <span className="group-number">{String(index + 1).padStart(2, '0')}</span>
              <span className="group-copy">
                <strong>{group.title}</strong>
                <small>{group.description}</small>
              </span>
              <span className="group-count">{mastered} / 15</span>
            </button>
          )
        })}
      </div>
      <button className="overview-link" onClick={openOverview}>
        <BarChart3 size={18} />
        View overall progress
        <ChevronRight size={17} />
      </button>
    </aside>
  )
}

function ModeNav({ mode, setMode }) {
  return (
    <nav className="mode-nav" aria-label="Exercise type">
      {modes.map((item) => {
        const Icon = modeIcons[item.id]
        return (
          <button
            key={item.id}
            className={mode === item.id ? 'active' : ''}
            onClick={() => setMode(item.id)}
            aria-pressed={mode === item.id}
          >
            <Icon size={19} />
            <span>{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

function WordRail({ words, index, setIndex, progress }) {
  return (
    <div className="word-rail" aria-label="Words in this group">
      {words.map((item, itemIndex) => {
        const score = progress.scores[item.word] || 0
        return (
          <button
            key={item.word}
            className={`${index === itemIndex ? 'active' : ''} ${score >= 3 ? 'mastered' : ''}`}
            onClick={() => setIndex(itemIndex)}
            aria-label={`${itemIndex + 1}. ${item.word}${score >= 3 ? ', mastered' : ''}`}
          >
            {score >= 3 ? <Check size={14} strokeWidth={2.5} /> : itemIndex + 1}
          </button>
        )
      })}
    </div>
  )
}

function Flashcard({ word, flipped, setFlipped, onRate }) {
  return (
    <section className={`flashcard ${flipped ? 'flipped' : ''}`} aria-live="polite">
      {!flipped ? (
        <button className="card-face card-front" onClick={() => setFlipped(true)} aria-label={`Flip ${word.word} to reveal its meaning`}>
          <span className="word">{word.word}</span>
          <span className="part">{word.part}</span>
          <span className="hairline" />
          <span className="flip-prompt">Flip to reveal meaning</span>
          <RotateCcw size={31} />
        </button>
      ) : (
        <div className="card-face card-back">
          <div className="back-heading">
            <span className="word small-word">{word.word}</span>
            <span className="part">{word.part}</span>
          </div>
          <p className="definition">{word.definition}</p>
          <p className="synonym-line"><span>Closest synonym</span>{word.synonym}</p>
          <p className="example">“{word.example}”</p>
          <div className="turkish-block" lang="tr">
            <span className="turkish-label">Türkçe</span>
            <strong>{word.turkish}</strong>
            <p>“{word.turkishExample}”</p>
          </div>
          <div className="rating-actions">
            <button className="secondary" onClick={() => onRate(false)}>Study again</button>
            <button className="primary" onClick={() => onRate(true)}><Check size={18} /> I know it</button>
          </div>
        </div>
      )}
    </section>
  )
}

function MultipleChoice({ word, words, index, mode, answered, selected, onSelect }) {
  const isDefinition = mode === 'definition'
  const isContext = mode === 'context'
  const options = useMemo(() => seededOptions(words, index), [words, index])
  const prompt = isDefinition ? word.word : isContext ? word.example.replace(new RegExp(`\\b${word.word}\\b`, 'i'), '________') : word.word
  const eyebrow = isDefinition ? 'Choose the best definition' : isContext ? 'Complete the sentence in context' : 'Choose the closest synonym'
  const optionText = (item) => isDefinition ? item.definition : isContext ? item.word : item.synonym

  return (
    <section className="exercise-card" aria-live="polite">
      <p className="exercise-instruction">{eyebrow}</p>
      <h2 className={isContext ? 'context-prompt' : ''}>{prompt}</h2>
      {!isContext && <p className="part quiz-part">{word.part}</p>}
      <div className="choice-list">
        {options.map((item, optionIndex) => {
          const correct = item.word === word.word
          const chosen = selected === item.word
          let state = ''
          if (answered && correct) state = 'correct'
          else if (answered && chosen) state = 'incorrect'
          return (
            <button
              key={`${item.word}-${optionIndex}`}
              className={state}
              onClick={() => !answered && onSelect(item.word, correct)}
              disabled={answered}
            >
              <span className="choice-letter">{String.fromCharCode(65 + optionIndex)}</span>
              <span>{optionText(item)}</span>
              {answered && correct && <Check size={18} />}
              {answered && chosen && !correct && <X size={18} />}
            </button>
          )
        })}
      </div>
      {answered && (
        <div className={`feedback ${selected === word.word ? 'good' : 'try'}`}>
          <strong>{selected === word.word ? 'Exactly.' : `The answer is “${word.word}.”`}</strong>
          <span>{word.definition}</span>
          <span className="feedback-turkish" lang="tr"><strong>Türkçe:</strong> {word.turkish}</span>
          <span className="feedback-example" lang="tr">{word.turkishExample}</span>
        </div>
      )}
    </section>
  )
}

function FillGap({ word, answered, selected, onSubmit }) {
  const [value, setValue] = useState('')
  useEffect(() => setValue(''), [word.word])
  const cloze = word.example.replace(new RegExp(`\\b${word.word}\\b`, 'i'), '________')
  const correct = selected === word.word

  return (
    <section className="exercise-card gap-card" aria-live="polite">
      <p className="exercise-instruction">Type the missing vocabulary word</p>
      <h2 className="context-prompt">{cloze}</h2>
      <p className="gap-hint">Meaning: {word.definition}</p>
      <form onSubmit={(event) => { event.preventDefault(); if (value.trim()) onSubmit(value.trim(), value.trim().toLowerCase() === word.word.toLowerCase()) }}>
        <label htmlFor="gap-answer">Your answer</label>
        <div className="answer-row">
          <input
            id="gap-answer"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Type the word"
            autoComplete="off"
            disabled={answered}
          />
          <button className="primary" disabled={answered || !value.trim()}>Check answer</button>
        </div>
      </form>
      {answered && (
        <div className={`feedback ${correct ? 'good' : 'try'}`}>
          <strong>{correct ? 'Correct.' : `The answer is “${word.word}.”`}</strong>
          <span>Closest synonym: {word.synonym}</span>
          <span className="feedback-turkish" lang="tr"><strong>Türkçe:</strong> {word.turkish}</span>
          <span className="feedback-example" lang="tr">{word.turkishExample}</span>
        </div>
      )}
    </section>
  )
}

function ProgressPanel({ group, progress, mode }) {
  const studiedSet = new Set(progress.studied)
  const studied = group.words.filter((item) => studiedSet.has(item.word)).length
  const mastered = group.words.filter((item) => (progress.scores[item.word] || 0) >= 3).length
  return (
    <aside className="progress-panel">
      <h3>Your progress</h3>
      <p>{group.title}</p>
      <div className="progress-track"><span style={{ width: `${(mastered / 15) * 100}%` }} /></div>
      <strong className="progress-total">{mastered} / 15 mastered</strong>
      <dl>
        <div><dt><span className="dot studied" /> Studied</dt><dd>{studied}</dd></div>
        <div><dt><span className="dot remaining" /> Remaining</dt><dd>{15 - studied}</dd></div>
        <div><dt><span className="dot mastered" /> Mastered</dt><dd>{mastered}</dd></div>
      </dl>
      <div className="shortcut-block">
        <h4><Keyboard size={17} /> Keyboard</h4>
        {mode === 'flashcards' ? (
          <><p><kbd>Space</kbd> Flip card</p><p><kbd>←</kbd><kbd>→</kbd> Move</p></>
        ) : mode === 'gap' ? <p><kbd>Enter</kbd> Submit typed answer</p> : <p><kbd>1–4</kbd> Choose the best answer</p>}
      </div>
      <div className="study-tip">
        <CircleHelp size={19} />
        <p><strong>Mastery rule</strong><br />Earn three correct recalls for a word to master it.</p>
      </div>
    </aside>
  )
}

function Overview({ progress, close, reset }) {
  const masteredTotal = allWords.filter((item) => (progress.scores[item.word] || 0) >= 3).length
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={close}>
      <section className="overview-modal" role="dialog" aria-modal="true" aria-labelledby="overview-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-heading">
          <div><p>Corpus progress</p><h2 id="overview-title">{masteredTotal} of 150 mastered</h2></div>
          <button className="icon-button" onClick={close} aria-label="Close progress overview"><X /></button>
        </div>
        <div className="overview-bar"><span style={{ width: `${(masteredTotal / 150) * 100}%` }} /></div>
        <div className="overview-groups">
          {groups.map((group, index) => {
            const mastered = group.words.filter((item) => (progress.scores[item.word] || 0) >= 3).length
            return <div key={group.id}><span>{String(index + 1).padStart(2, '0')} · {group.title}</span><strong>{mastered}/15</strong></div>
          })}
        </div>
        <div className="method-note">
          <strong>How the list was built</strong>
          <p>Terms were ranked and curated from 69 high-signal question-bank, answer-key, passage, and vocabulary-support files across 11 SAT projects. Repeated reasoning language and transferable passage vocabulary were prioritized over topic-specific jargon.</p>
        </div>
        <button className="reset-button" onClick={reset}><RotateCcw size={16} /> Reset all progress</button>
      </section>
    </div>
  )
}

export default function App() {
  const [groupIndex, setGroupIndex] = useState(0)
  const [wordIndex, setWordIndex] = useState(0)
  const [mode, setMode] = useState('flashcards')
  const [flipped, setFlipped] = useState(false)
  const [answered, setAnswered] = useState(false)
  const [selected, setSelected] = useState('')
  const [progress, setProgress] = useState(readProgress)
  const [overviewOpen, setOverviewOpen] = useState(false)

  const group = groups[groupIndex]
  const word = group.words[wordIndex]
  const masteredTotal = allWords.filter((item) => (progress.scores[item.word] || 0) >= 3).length

  useEffect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)), [progress])

  const clearExercise = useCallback(() => {
    setFlipped(false)
    setAnswered(false)
    setSelected('')
  }, [])

  const changeGroup = (nextGroup) => {
    setGroupIndex(nextGroup)
    setWordIndex(0)
    clearExercise()
  }

  const changeMode = (nextMode) => {
    setMode(nextMode)
    clearExercise()
  }

  const move = useCallback((direction) => {
    setWordIndex((current) => (current + direction + group.words.length) % group.words.length)
    clearExercise()
  }, [clearExercise, group.words.length])

  const record = (correct, submittedValue = word.word) => {
    const normalized = submittedValue.toLowerCase() === word.word.toLowerCase() ? word.word : submittedValue
    setSelected(normalized)
    setAnswered(true)
    setProgress((current) => {
      const scores = { ...current.scores }
      const oldScore = scores[word.word] || 0
      scores[word.word] = correct ? Math.min(3, oldScore + 1) : Math.max(0, oldScore - 1)
      return { scores, studied: [...new Set([...current.studied, word.word])] }
    })
  }

  const rateCard = (known) => {
    setProgress((current) => {
      const scores = { ...current.scores }
      const oldScore = scores[word.word] || 0
      scores[word.word] = known ? Math.min(3, oldScore + 1) : Math.max(0, oldScore - 1)
      return { scores, studied: [...new Set([...current.studied, word.word])] }
    })
    move(1)
  }

  useEffect(() => {
    const handleKey = (event) => {
      if (event.target.matches('input, textarea') || overviewOpen) return
      if (event.key === 'ArrowLeft') move(-1)
      if (event.key === 'ArrowRight') move(1)
      if (event.code === 'Space' && mode === 'flashcards') {
        event.preventDefault()
        setFlipped((current) => !current)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [mode, move, overviewOpen])

  const reset = () => {
    if (window.confirm('Reset all mastery and study history?')) {
      setProgress({ scores: {}, studied: [] })
      setOverviewOpen(false)
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => { changeGroup(0); changeMode('flashcards') }} aria-label="Lexicon 150 home">
          <span>LEXICON</span> <strong>150</strong>
        </button>
        <div className="overall-mastery" aria-label={`${masteredTotal} of 150 words mastered`}>
          <BookOpen size={22} />
          <div><strong>{masteredTotal} mastered</strong><span>{Math.round((masteredTotal / 150) * 100)}% of the collection</span></div>
          <div className="mini-meter"><span style={{ width: `${(masteredTotal / 150) * 100}%` }} /></div>
        </div>
        <button className="header-action" onClick={() => setOverviewOpen(true)}><Sparkles size={18} /><span>Study report</span></button>
      </header>

      <div className="workspace">
        <GroupNav groupIndex={groupIndex} setGroupIndex={changeGroup} progress={progress} openOverview={() => setOverviewOpen(true)} />
        <main className="study-area">
          <ModeNav mode={mode} setMode={changeMode} />
          <div className="study-heading">
            <div><p>Group {String(groupIndex + 1).padStart(2, '0')} · {mode === 'flashcards' ? 'Study' : modes.find((item) => item.id === mode)?.label}</p><h1>{group.title}</h1></div>
            <span>{wordIndex + 1} / 15</span>
          </div>
          <WordRail words={group.words} index={wordIndex} setIndex={(next) => { setWordIndex(next); clearExercise() }} progress={progress} />

          <div className="content-grid">
            <div className="learning-surface">
              {mode === 'flashcards' && <Flashcard word={word} flipped={flipped} setFlipped={setFlipped} onRate={rateCard} />}
              {['definition', 'context', 'synonym'].includes(mode) && (
                <MultipleChoice word={word} words={group.words} index={wordIndex} mode={mode} answered={answered} selected={selected} onSelect={(value, correct) => record(correct, value)} />
              )}
              {mode === 'gap' && <FillGap word={word} answered={answered} selected={selected} onSubmit={(value, correct) => record(correct, value)} />}

              <div className="navigation-actions">
                <button className="secondary" onClick={() => move(-1)}><ArrowLeft size={18} /> Previous</button>
                {mode === 'flashcards' ? (
                  <button className="primary main-action" onClick={() => setFlipped((current) => !current)}><RotateCcw size={19} /> {flipped ? 'Show word' : 'Flip'}</button>
                ) : (
                  <button className="primary main-action" onClick={() => move(1)} disabled={!answered}>Next word <ArrowRight size={18} /></button>
                )}
                <button className="secondary" onClick={() => move(1)}>Next <ArrowRight size={18} /></button>
              </div>
            </div>
            <ProgressPanel group={group} progress={progress} mode={mode} />
          </div>
        </main>
      </div>
      <footer><span>150 transferable words · 10 groups · 5 exercise modes</span><span>Progress stays on this device.</span></footer>
      {overviewOpen && <Overview progress={progress} close={() => setOverviewOpen(false)} reset={reset} />}
    </div>
  )
}
