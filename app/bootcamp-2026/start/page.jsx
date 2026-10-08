import { Suspense } from 'react'
import AcquisitionStart from './AcquisitionStart'
import s from '../page.module.css'

export const metadata = {
  title: 'Boot Camp enrollment | Auctor',
  description: 'Start your CAT 2026 VARC Boot Camp.',
  robots: { index: false, follow: true },
}

export default function BootcampStartPage() {
  return <Suspense fallback={<main className={s.placeholder}><h1>Checking your Bootcamp access.</h1></main>}><AcquisitionStart /></Suspense>
}
