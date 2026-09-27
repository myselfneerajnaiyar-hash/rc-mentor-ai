import s from './review-workspace.module.css'
export default function NumberedSentences({sentences}) {return <ol className={s.numberedSentences} aria-label="Numbered sentences">{sentences.map(sentence=><li key={sentence.number} value={sentence.number}><span className={s.sentenceNumber}>{sentence.number}</span><span>{sentence.text}</span></li>)}</ol>}
