import { Suspense } from 'react'
import SignupPage from '../../signup/page'

export const metadata = { title: 'Start CAT VARC Boot Camp | Auctor', robots: { index: false, follow: true } }

export default function BootcampSignupPage() {
  return <Suspense fallback={null}><SignupPage /></Suspense>
}
