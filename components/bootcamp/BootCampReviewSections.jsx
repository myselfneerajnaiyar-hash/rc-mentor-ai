'use client'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import s from './bootcamp.module.css'
export function ReviewSections({ items }) {
  return <Accordion type="multiple" className={s.disclosures}>{items.filter(Boolean).map(item=><AccordionItem key={item.id} value={item.id}><AccordionTrigger>{item.title}</AccordionTrigger><AccordionContent><div className={s.analysisBody}>{item.content}</div></AccordionContent></AccordionItem>)}</Accordion>
}
