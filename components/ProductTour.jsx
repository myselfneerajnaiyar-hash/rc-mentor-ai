"use client";
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
export function startProductTour(){window.dispatchEvent(new Event('auctor:replay-tour'));}
export function tourSteps(isCatStudent,brandName,mobile,capabilities={showDailyRC:isCatStudent,showCATSectionals:isCatStudent}){
 const steps=[{popover:{title:'Welcome to '+brandName,description:'Build your reading habit with daily practice. Let us show you where to begin.'}}];
 const add=(element,title,description)=>steps.push({element,popover:{title,description,side:'bottom',align:'center'}});
 if(capabilities.showDailyRC)add('#daily-rc','Daily RC Challenge','Practise a fresh CAT passage and review your saved answers.');
 add('#daily-workout','Daily Workout','Train reading, vocabulary and speed together in one guided session.');
 add('#word-hunt','Word Hunt','Build vocabulary with a quick daily puzzle.');
 add('#rc-generator','RC Practice','Generate a passage or bring your own for focused reading practice.');
 add('#vocab-lab','Vocabulary Lab','Learn words, practise recall and revisit your word bank.');
 add('#speed-drill','Speed Reading Gym','Build reading speed while checking comprehension.');
 if(capabilities.showCATSectionals)add('#sectionals','CAT Sectionals','Explore CAT papers and mock tests. Start tests on desktop and review attempts on either device.');
 add(mobile?'#practice-discovery':'#precision','Precision Training',mobile?'Open All practice, choose Reading, then Precision Training to focus on specific question types.':'Practise the reading question types you want to improve.');
 if(mobile)add('.auctor-mobile-nav','Your daily navigation','Use Home, Today, Practice and Profile. Replay this tour from your Profile whenever you need it.');
 else if(!isCatStudent){add('#editorial','Editorial Decoder','Explore editorials with Birbal.');}
 return steps;
}
export function launchProductTour(steps,{onComplete,onClose}){
 let saving=false;
 const finish=async()=>{
  if(saving)return;saving=true;
  const button=document.querySelector('.driver-popover-next-btn');if(button){button.textContent='Saving...';button.disabled=true;}
  try{await onComplete();if(instance.isActive())instance.destroy();}
  catch{if(!instance.isActive())return;if(button){button.textContent='Retry saving';button.disabled=false;}const description=document.querySelector('.driver-popover-description');if(description)description.textContent='Your completion could not be saved. Retry, or close and take the tour again next visit.';}
  finally{saving=false;}
 };
 const instance=driver({steps,showProgress:true,animate:false,allowClose:true,allowScroll:true,disableActiveInteraction:true,stagePadding:8,stageRadius:16,nextBtnText:'Next',prevBtnText:'Back',doneBtnText:'Finish',popoverClass:'auctor-tour',onDoneClick:finish,onNextClick:()=>instance.isLastStep()?finish():instance.moveNext(),onDestroyed:onClose,onPopoverRender:(popover)=>{
  const skip=document.createElement('button');skip.type='button';skip.className='tour-skip';skip.textContent='Skip Tour';skip.onclick=()=>instance.destroy();popover.footer.prepend(skip);
 }});
 document.body.classList.add('product-tour-active');
 try{instance.drive();return instance;}catch(error){instance.destroy();document.body.classList.remove('product-tour-active');throw error;}
}
