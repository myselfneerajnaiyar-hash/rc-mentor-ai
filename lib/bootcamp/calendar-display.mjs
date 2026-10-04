const labels={TODAY:'TODAY',OPEN_BACKLOG:'CATCH-UP AVAILABLE',IN_PROGRESS:'IN PROGRESS',ATTEMPTED:'ATTEMPTED',COMPLETED:'COMPLETED',PREVIEW:'PREVIEW',LOCKED:'LOCKED'}

export function calendarCellLabel(training, isToday=false) {
  if(!training)return 'LOCKED'
  if(training.status==='completed'||training.state==='COMPLETED')return 'COMPLETED'
  if(!training.unlocked)return labels[training.state]||'LOCKED'
  if(!training.available)return isToday?'TODAY · CONTENT PREPARING':'CONTENT PREPARING'
  if(isToday||training.state==='TODAY')return 'TODAY'
  return labels[training.state]||'LOCKED'
}
