import test from 'node:test'
import assert from 'node:assert/strict'
import { calendarCellLabel } from '../lib/bootcamp/calendar-display.mjs'

test('past published day with no attempt is clearly catch-up available',()=>{
  assert.equal(calendarCellLabel({unlocked:true,available:true,state:'OPEN_BACKLOG',status:'not_started'}), 'CATCH-UP AVAILABLE')
})

test('past unlocked day without valid published content stays unavailable and says why',()=>{
  assert.equal(calendarCellLabel({unlocked:true,available:false,state:'OPEN_BACKLOG',status:'not_started'}), 'CONTENT PREPARING')
})

test('completed past day keeps its completed state for review',()=>{
  assert.equal(calendarCellLabel({unlocked:true,available:true,state:'COMPLETED',status:'completed'}), 'COMPLETED')
})

test('simulated current day includes today and its content readiness',()=>{
  assert.equal(calendarCellLabel({unlocked:true,available:false,state:'TODAY',status:'not_started'},true), 'TODAY · CONTENT PREPARING')
  assert.equal(calendarCellLabel({unlocked:true,available:true,state:'TODAY',status:'not_started'},true), 'TODAY')
})
