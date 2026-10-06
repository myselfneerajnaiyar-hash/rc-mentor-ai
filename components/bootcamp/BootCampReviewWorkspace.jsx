'use client'
import { useEffect, useRef, useState } from 'react'
import DetailedRCReview, { QuestionAnalysis } from '@/components/review/DetailedRCReview'
import { dailyRCReview, dailyRCQuestion, dailyRCResponse, reviewObservation } from '@/lib/bootcamp/review.mjs'
import s from './review-workspace.module.css'
import NumberedSentences from './NumberedSentences'
import BootCampTypeAnalysis from './BootCampTypeAnalysis'
const outcomes={correct:'Correct',incorrect:'Incorrect',skipped:'Skipped',not_reached:'Not reached',timed_out:'Timed out'}
const nextLabels={warmup:'Continue to RC 1',va:'Continue to Day Report',rc1:'Continue to RC 2',rc2:'Continue to RC 3',rc3:'Continue to Verbal Ability'}
export default function BootCampReviewWorkspace({ dayNumber=1, review, attemptId, phase='review', commentary, busy, onContinue, onAsk, preview=false }) {
  const [index,setIndex]=useState(0),[detail,setDetail]=useState(null),[evidenceIndex,setEvidenceIndex]=useState(0),[passageOpen,setPassageOpen]=useState(false)
  const dialog=useRef(null)
  const storageKey=`bootcamp-review:${attemptId}:${review.key}`
  useEffect(()=>{try{const stored=Number(sessionStorage.getItem(storageKey));if(Number.isInteger(stored)&&stored>=0&&stored<review.questions.length)setIndex(stored)}catch{/* Selection can remain local when storage is unavailable. */}},[storageKey,review.questions.length])
  useEffect(()=>{if(detail && !dialog.current.open)dialog.current.showModal();if(!detail && dialog.current.open)dialog.current.close()},[detail])
  const q=review.questions[index],a=q.analysis,insight=reviewObservation(review,q.id)
  const evidence=a.evidence || [], selectedOption=a.optionAnalysis?.find(o=>o.optionId===q.response)
  const choose=i=>{setIndex(i);setEvidenceIndex(0);setPassageOpen(false);try{sessionStorage.setItem(storageKey,String(i))}catch{/* No effect on saved attempt data. */}}
  const firstEvidence=evidence[evidenceIndex]
  const paragraphs=(review.passage?.text || '').split(/\n\s*\n/).filter(Boolean)
  const normalize=text=>text.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()
  const fragment=firstEvidence ? normalize(firstEvidence.quote).split(' ').slice(0,8).join(' ') : ''
  const answer=value=>value===null?'No answer':Array.isArray(value)?value.join(' \u2192 '):q.type==='Sentence Placement'?`Position [${value}]`:q.mode!=='MCQ'?`Sentence ${value}`:value
  const footerLabel=nextLabels[review.key]
  return <section className={s.workspace} aria-label={`${review.label} review workspace`}>
    <header className={s.header}><div><p>Day {String(dayNumber).padStart(2,'0')} · {review.label} review</p><h1>Make the reasoning yours.</h1></div><div className={s.score}><strong>{review.result.correct}/{review.result.total} <small>correct</small></strong><div>{Object.keys(outcomes).map(k=><span key={k}>{review.result[k]} {outcomes[k].toLowerCase()}</span>)}</div></div></header>
    <div className={s.columns}>
      {review.passage && <section className={s.debrief} aria-label="Passage debrief">
        <header><div><p className={s.debriefEyebrow}>BIRBAL · THE READING ROOM</p><h2>PASSAGE DEBRIEF</h2></div><button className={s.textButton} onClick={()=>setDetail('fullPassage')}>View full passage</button></header>
        <div><section><h3>The central argument</h3><p>{review.passageAnalysis.coreTheme}</p></section><section><h3>The author's move</h3><p>{review.passageAnalysis.authorIntent}</p></section>{review.passageAnalysis.readingPsychology?.possibleReadingMistakes?.length > 0 && <section><h3>Reading lesson</h3>{review.passageAnalysis.readingPsychology.possibleReadingMistakes.map((lesson,i)=><p key={i}>{lesson}</p>)}</section>}</div>
        <button className={s.analysisCta} onClick={()=>setDetail('passage')}>Open detailed passage analysis <span aria-hidden="true">&rarr;</span></button>
      </section>}
      <section className={s.evidencePanel} aria-label="Question evidence">
        <nav className={s.questionNav} aria-label="Review questions">{review.questions.map((item,i)=><button key={item.id} onClick={()=>choose(i)} aria-label={`Question ${i+1}: ${outcomes[item.outcome]}`} aria-current={index===i?'true':undefined} className={item.outcome==='correct'?s.correct:item.outcome==='incorrect'?s.incorrect:s.unanswered}>Q{i+1}<span aria-hidden="true">{item.outcome==='correct'?'✓':item.outcome==='incorrect'?'×':'—'}</span></button>)}<button className={`${s.analysisCta} ${s.analysisLink}`} onClick={()=>setDetail('question')}>View full question analysis <span aria-hidden="true">→</span></button></nav>
        <div className={s.evidenceBody} key={q.id}>
          <div className={s.metadata}><span>Question {index+1} · {q.type}</span><span>{outcomes[q.outcome]}</span></div><p className={s.skill}>Skill: {a.primarySkill}</p><h2 className={s.question}>{q.text}</h2>
          {q.context && <p className={s.questionContext}>{q.context}</p>}{q.sentenceToPlace && <blockquote className={s.sentenceToPlace}>{q.sentenceToPlace}</blockquote>}{q.sentences?.length>0 && <NumberedSentences sentences={q.sentences}/>}
          <div className={s.answers}><div><small>Your answer</small><strong className={q.outcome==='correct'?s.correct:q.outcome==='incorrect'?s.incorrect:''}>{answer(q.response)}</strong></div><div><small>Correct answer</small><strong className={s.correct}>{answer(q.answer)}</strong></div><span>{Math.round((q.active_ms || 0)/1000)}s active view time</span></div>
          {q.mode==='MCQ' && <div className={s.options} aria-label="All answer options">{q.options.map(o=><div key={o.id} className={`${s.option} ${o.id===q.answer?s.correctOption:o.id===q.response?s.wrongOption:''}`}><b>{o.id}</b><div><span>{o.text}</span><small>{o.id===q.response?'Your answer · ':''}{o.id===q.answer?'Correct':'Incorrect option'}</small></div></div>)}</div>}
          <div className={s.insightRow}><section className={s.reasoning}><h3>Why?</h3><p>{a.explanation}</p></section>
          {firstEvidence && <section className={s.evidence}><div className={s.evidenceHeading}><h3>The evidence</h3>{evidence.length>1 && <nav aria-label="Evidence excerpts">{evidence.map((_,i)=><button key={i} onClick={()=>setEvidenceIndex(i)} aria-pressed={i===evidenceIndex} aria-label={`Evidence ${i+1}`}>{i+1}</button>)}</nav>}</div><blockquote>{firstEvidence.quote}</blockquote><p>{firstEvidence.explanation}</p></section>}
          </div>
          {selectedOption?.trapType && <details className={s.trap}><summary>The trap · {selectedOption.trapType}</summary><p>{selectedOption.explanation}</p>{selectedOption.looksCorrectBecause && <p>{selectedOption.looksCorrectBecause}</p>}</details>}
          {review.passage && <button className={s.textButton} aria-expanded={passageOpen} onClick={()=>setPassageOpen(!passageOpen)}>{passageOpen?'Hide full passage':'View full passage'}</button>}
          {passageOpen && <div className={s.passage} role="region" tabIndex={0} aria-label="Full passage">{paragraphs.map((p,i)=><p key={i} className={fragment && normalize(p).includes(fragment)?s.highlight:''}><small>P{i+1}</small>{p}</p>)}</div>}
        </div>
      </section>
      <aside className={s.trainer} aria-label="Birbal’s interpretation">
        <header><img src="/Birbal avatar.jpeg" alt="Birbal"/><div><p>BIRBAL</p><span>Your VARC trainer · Q{index+1}</span></div></header>
        <div className={s.trainerBody}><dl><div><dt>Observation</dt><dd>{insight.observation}</dd></div><div><dt>Interpretation</dt><dd>{insight.interpretation}</dd></div><div><dt>Confidence</dt><dd>{insight.confidence}</dd></div><div><dt>Take this forward</dt><dd>{a.idealThinkingProcess?.[0] || a.explanation}</dd></div></dl>
          {commentary && <section className={s.reflection}><h3>Birbal’s block reflection</h3>{commentary ? <><p>{commentary.text}</p><p>{commentary.focus}</p></> : <p role="status">Birbal is reviewing your saved performance…</p>}</section>}
        </div>
      </aside>

    </div>
    <footer className={s.actions}>{!preview && <button className={s.ask} onClick={()=>onAsk(q.id)}>Ask Birbal <span aria-hidden="true">Q{index+1}</span></button>}<span className={s.checkpoint}>{phase==='commentary'?'Trainer reflection':'Detailed review'} · Next: {nextLabels[review.key]?.replace('Continue to ','')}</span><button className={s.continue} disabled={busy} onClick={onContinue}>{footerLabel} <span aria-hidden="true">→</span></button></footer>
    <dialog ref={dialog} className={s.detailDialog} aria-label={detail==='fullPassage'?'Full passage':detail==='passage'?'Detailed passage analysis':'Detailed question analysis'} onCancel={()=>setDetail(null)}><div className={s.dialogHeader}><span>{review.label} · {detail==='passage'?'Passage analysis':`Question ${index+1}`}</span><button onClick={()=>setDetail(null)}>Back to review</button></div><div className={s.dialogBody}>{detail==='question' && q.mode==='MCQ' && q.context && <p className={s.questionContext}>{q.context}</p>}{detail==='fullPassage' ? <div className={s.fullPassage}>{paragraphs.map((p,i)=><p key={i}>{p}</p>)}</div> : detail==='passage' ? <DetailedRCReview data={dailyRCReview(review)}/> : detail==='question' ? q.mode!=='MCQ' ? <BootCampTypeAnalysis review={review} index={index} onSelect={choose}/> : <QuestionAnalysis key={q.id} question={dailyRCQuestion(q)} attempt={dailyRCResponse(q)} index={index} total={review.questions.length} onPrevious={()=>choose(index-1)} onNext={()=>choose(index+1)} onRevealEvidence={review.passage ? quote=>{setDetail(null);setEvidenceIndex(Math.max(0,evidence.findIndex(e=>e.quote===quote)));setPassageOpen(true)} : undefined}/> : null}</div></dialog>
  </section>
}
