import s from './bootcamp.module.css'
const label = value => value.replaceAll('_',' ')
export function OutcomeCounts({ result }) { return <div className={s.counts}>{['correct','incorrect','skipped','not_reached','timed_out'].map(k => <span key={k}><b>{result[k]}</b> {label(k)}</span>)}</div> }
export { default } from './BootCampReviewWorkspace'
