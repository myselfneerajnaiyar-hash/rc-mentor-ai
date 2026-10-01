const IST='Asia/Kolkata'
const DAY_MS=86400000

function istDateParts(date) {
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:IST,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date)
  return parts.reduce((value,part)=>part.type==='year'?{...value,year:Number(part.value)}:part.type==='month'?{...value,month:Number(part.value)}:part.type==='day'?{...value,day:Number(part.value)}:value,{})
}

export function catDaysRemaining(date) {
  const today=istDateParts(date)
  return Math.ceil((Date.UTC(2026,10,29)-Date.UTC(today.year,today.month-1,today.day))/DAY_MS)
}

export function nextIstMidnight(now) {
  const today=istDateParts(now)
  return Date.UTC(today.year,today.month-1,today.day+1)-330*60000
}

export function catDaysRemainingFromIstDate(istDate) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(istDate || '')) throw new TypeError('Expected an ISO calendar date')
  const today=new Date(`${istDate}T00:00:00Z`)
  if(Number.isNaN(today.valueOf())||today.toISOString().slice(0,10)!==istDate)throw new TypeError('Invalid calendar date')
  return Math.round((Date.UTC(2026,10,29)-today.getTime())/86400000)
}