import test from 'node:test';
import assert from 'node:assert/strict';
import { acquireBodyScrollLock } from '../lib/ui/bodyScrollLock.mjs';
function body(value='',priority='') {return {style:{value,priority,getPropertyValue(){return this.value},getPropertyPriority(){return this.priority},setProperty(_key,v,p=''){this.value=v;this.priority=p},removeProperty(){this.value='';this.priority=''}}};}
test('independent owners cannot release each other; original inline style and priority return',()=>{
 const target=body('scroll','important');const closeA=acquireBodyScrollLock(target),closeB=acquireBodyScrollLock(target);
 closeA();assert.equal(target.style.value,'hidden');closeA();assert.equal(target.style.value,'hidden');closeB();assert.equal(target.style.value,'scroll');assert.equal(target.style.priority,'important');
});
test('reverse cleanup, repeated open/close, and Strict Mode effect replay leave no lock',()=>{
 const target=body();
 for(let i=0;i<10;i++){const replay=acquireBodyScrollLock(target);replay();const closeA=acquireBodyScrollLock(target),closeB=acquireBodyScrollLock(target);closeB();assert.equal(target.style.value,'hidden');closeA();assert.equal(target.style.value,'');closeB();assert.equal(target.style.value,'');}
});
test('different documents keep independent lock ownership',()=>{const a=body(),b=body();const closeA=acquireBodyScrollLock(a),closeB=acquireBodyScrollLock(b);closeA();assert.equal(b.style.value,'hidden');closeB();assert.equal(b.style.value,'');});
