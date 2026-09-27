'use client'
import s from './bootcamp.module.css'
import { ReviewSections } from './BootCampReviewSections'
import NumberedSentences from './NumberedSentences'
const label = value => value.replaceAll('_',' ')
function Answer({ question, value }) {
  if (value === null) return 'No answer'
  if (question.mode === 'MCQ') return `${value}. ${question.options.find(o => o.id === value)?.text || ''}`
  if (Array.isArray(value)) return value.join(' → ')
  return question.type === 'Sentence Placement' ? `Position [${value}]` : `Sentence ${value}`
}
function TypeAnalysis({ detail }) {
  if (!detail) return null
  return <section className={s.detail}>
    {detail.type === 'Para Jumble' && <><h3>Build the paragraph</h3><p>Opening sentence: {detail.openingSentence}</p><p>{detail.constructionLogic}</p>{detail.mandatoryPairs?.map((p,i) => <p key={i}><b>{p.first} → {p.second}:</b> {p.reason}</p>)}</>}
    {detail.type === 'Para Summary' && <><h3>Central idea & scope</h3><p>{detail.centralIdea}</p><p>{detail.scopeBoundary}</p></>}
    {detail.type === 'Sentence Placement' && <><h3>Why position [{detail.correctPosition}] fits</h3><p><b>Before the insertion:</b> {detail.beforeLogic}</p><p><b>After the insertion:</b> {detail.afterLogic}</p><p>{detail.whyCorrectFits}</p></>}
    {detail.type === 'Odd Sentence Out' && <><h3>Why sentence {detail.oddSentence} breaks the flow</h3><p>{detail.whyRemainingSentencesFit}</p></>}
    {detail.type === 'RC' && detail.stemAnalysis && <><h3>What the question asks</h3><p>{detail.stemAnalysis}</p></>}
  </section>
}

export default function BootCampTypeAnalysis({review,index,onSelect}) {
const q=review.questions[index],a=q.analysis;const selected=a.optionAnalysis?.find(o=>o.optionId===q.response);return <article key={q.id} className={s.panel}>
      <p className={s.eyebrow}>Q{index+1} · {q.type.toUpperCase()}</p><p className={s.muted}>Skill: {a.primarySkill}{a.difficulty ? ` · ${a.difficulty}` : ''}</p><span className={`${s.badge} ${q.outcome==='incorrect' ? s.incorrect : ''}`}>{label(q.outcome)}</span>
      <h2 className={s.question}>{q.text}</h2>{q.context && <p className={s.context}>{q.context}</p>}{q.sentenceToPlace && <div className={s.focus}>{q.sentenceToPlace}</div>}{q.sentences.length>0 && <NumberedSentences sentences={q.sentences}/>}
      <div className={s.reviewAnswers}><div><small>Your answer</small><Answer question={q} value={q.response}/></div><div><small>Correct answer</small><Answer question={q} value={q.answer}/></div></div>
      {q.type==='Sentence Placement' && <div className={s.placementPositions} aria-label="Displayed insertion positions">{[1,2,3,4].map(n=><span key={n} className={n===q.answer ? s.correctOption : n===q.response ? s.wrongOption : ''}>[{n}]<small>{n===q.response ? 'Your answer · ' : ''}{n===q.answer ? 'Correct' : 'Incorrect position'}</small></span>)}</div>}
      <section className={s.detail}><h3>Why?</h3><p>{a.explanation}</p></section>
      <ReviewSections items={[
        a.typeSpecific && {id:'notice',title:'What should you have noticed?',content:<TypeAnalysis detail={a.typeSpecific}/>},
        selected && !selected.isCorrect && {id:'trap',title:`The trap · ${selected.trapType || 'Selected option'}`,content:<><p><b>You chose {q.response}.</b> {selected.explanation}</p><p><b>Why it can look tempting:</b> {selected.looksCorrectBecause}</p><p className={s.muted}>This describes the option, not a diagnosis of your thinking.</p></>},
        a.evidence?.length>0 && {id:'evidence',title:'Evidence',content:<>{a.evidence.map((e,i)=><div key={i}><blockquote>{e.quote}</blockquote><p>{e.explanation}</p></div>)}{review.passage && <details><summary>Check in the original passage</summary><div className={s.passage}>{review.passage.text}</div></details>}</>},
        a.idealThinkingProcess?.length>0 && {id:'thinking',title:'Ideal thinking process',content:<ol>{a.idealThinkingProcess.map((step,i)=><li key={i}>{step}</li>)}</ol>},
        a.optionAnalysis?.length>0 && {id:'options',title:'Option analysis & elimination',content:a.optionAnalysis.map(o=><section className={s.optionAutopsy} key={o.optionId}><h3>{o.optionId} · {o.isCorrect ? 'Correct' : o.trapType || 'Distractor'}</h3><p>{o.explanation}</p>{!o.isCorrect && o.looksCorrectBecause && <p><b>Why it can look tempting:</b> {o.looksCorrectBecause}</p>}</section>)}
      ]}/>
      <div className={s.questionNav}><button className={s.secondary} disabled={index===0} onClick={()=>onSelect(index-1)}>← Previous</button><span className={s.muted}>{index+1} / {review.questions.length}</span>{index<review.questions.length-1 && <button className={s.secondary} onClick={()=>onSelect(index+1)}>Next explanation →</button>}</div>
    </article>
}
