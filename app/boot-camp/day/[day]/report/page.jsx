import { notFound } from 'next/navigation'
import BootCampSession from '@/components/bootcamp/BootCampSession'
export default function BootCampReportPage({params}) {
  const day=Number(params.day)
  if(!Number.isInteger(day)||day<1||day>50)notFound()
  return <BootCampSession key={day} dayRoute reportRoute dayNumber={day}/>
}
