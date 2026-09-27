import s from './bootcamp.module.css'
export default function BootCampRCActivity({ passage, children }) {
  return <div className={s.readingGrid}><article className={`${s.panel} ${s.passagePanel}`}><p className={s.eyebrow}>Read for the argument</p><div className={s.passage}>{passage.text}</div></article><div>{children}</div></div>
}
