import BootCampSession from '@/components/bootcamp/BootCampSession'
export const metadata = { title: 'Boot Camp | Auctor', robots: { index:false, follow:false } }
export const dynamic = 'force-dynamic'
export default function BootCampPage() {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date())
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]))
  return <BootCampSession initialIstDate={`${values.year}-${values.month}-${values.day}`} />
}
