'use client'
import { useEffect, useRef, useCallback } from 'react'
import ChatMentor from '@/components/ChatMentor'
import { bootcampRequest } from '@/lib/bootcamp/client'
const LABELS = {warmup:'Warm-up',rc1:'RC 1',rc2:'RC 2',rc3:'RC 3',va:'Verbal Ability'}
import s from './chat.module.css'
export default function BootCampChat({ dayNumber=1, attemptId, block, questionId, open, onClose }) {
  const dialog=useRef(null)
  useEffect(()=>{
    if(open && !dialog.current.open)dialog.current.showModal()
    if(!open && dialog.current.open)dialog.current.close()
  },[open])
  const transport=useCallback(messages=>bootcampRequest('/chat','POST',{attemptId,block,questionId,messages,dayNumber}),[attemptId,block,questionId,dayNumber])
  const questionNumber=questionId?.match(/-q(\d+)$/)?.[1]
  const label=block ? `Day ${dayNumber} / ${LABELS[block]} review${questionNumber ? ` / Q${questionNumber}` : ''}` : `Day ${dayNumber} / Boot Camp`
  return <dialog ref={dialog} className={`${s.dialog} ${questionId ? s.reviewDrawer : ''}`} aria-label="Boot Camp conversation with Birbal" onCancel={onClose} onClick={e=>{if(e.target===dialog.current)onClose()}}>
    <ChatMentor transport={transport} onClose={onClose} contextLabel={label} initialMessage={questionNumber ? `We're reviewing ${LABELS[block]}, question ${questionNumber}. I have your saved answer, the passage evidence and the interpretation beside it. What would you like to understand?` : block ? `Let's look at your ${LABELS[block]} together. I can refer to the completed questions, your answers and their explanations. What would you like to unpack?` : "I'm Birbal, your VARC trainer. Ask me about today's plan or the blocks you've completed. We'll use your actual work to find a useful next step."} quickPrompts={questionNumber ? ['Why was my answer wrong?','Which evidence supports the answer?','Was I too slow?'] : block ? ['Explain Q3 step by step','What did my answers show?','Which evidence should I revisit?'] : ['What is today’s training plan?','What should I focus on next?','Explain my latest completed block']}/>
  </dialog>
}
