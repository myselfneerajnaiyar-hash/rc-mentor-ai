// Trap labels are authored per option. This adapter only standardizes known
// labels; it never classifies an option from its question or explanation text.
export const TRAP_TYPES = [
  'Half Truth / Partial Truth', 'Extreme Wording', 'Outside Scope', 'Distorted Claim',
  'Causal Leap', 'Unsupported Inference', 'Reversal / Opposite Meaning', 'Scope Shift',
  'Too Broad', 'Too Narrow', 'Irrelevant Detail', 'Premise–Conclusion Confusion',
  'Comparison Mismatch', 'Misread Quantifier', 'Author Attitude Misread',
  'Chronology / Sequence Error', 'Logical Connector Misread', 'Attractive but Unanswerable', 'Other'
]

const aliases = new Map([
  ['half truth / partial truth','Half Truth / Partial Truth'], ['partial truth','Half Truth / Partial Truth'], ['half truth','Half Truth / Partial Truth'],
  ['extreme wording','Extreme Wording'], ['extreme language','Extreme Wording'],
  ['outside scope','Outside Scope'], ['distorted claim','Distorted Claim'], ['main idea distortion','Distorted Claim'], ['scope distortion','Distorted Claim'],
  ['causal leap','Causal Leap'], ['cause effect','Causal Leap'], ['correlation','Causal Leap'],
  ['unsupported inference','Unsupported Inference'], ['inference inflation','Unsupported Inference'],
  ['reversal / opposite meaning','Reversal / Opposite Meaning'], ['opposite meaning','Reversal / Opposite Meaning'],
  ['scope shift','Scope Shift'], ['too broad','Too Broad'], ['too narrow','Too Narrow'], ['irrelevant detail','Irrelevant Detail'],
  ['premise–conclusion confusion','Premise–Conclusion Confusion'], ['premise-conclusion confusion','Premise–Conclusion Confusion'],
  ['comparison mismatch','Comparison Mismatch'], ['comparison trap','Comparison Mismatch'],
  ['misread quantifier','Misread Quantifier'], ['author attitude misread','Author Attitude Misread'], ['tone distortion','Author Attitude Misread'],
  ['chronology / sequence error','Chronology / Sequence Error'], ['chronology confusion','Chronology / Sequence Error'], ['chronology error','Chronology / Sequence Error'],
  ['outside knowledge','Outside Scope'],
  ['logical connector misread','Logical Connector Misread'], ['attractive but unanswerable','Attractive but Unanswerable'], ['other','Other']
])

export function normalizeTrapType(value) {
  if (typeof value !== 'string' || !value.trim()) return null
  return aliases.get(value.trim().toLocaleLowerCase()) || 'Other'
}

export const trapLesson = trap => ({
  'Half Truth / Partial Truth':'A true passage detail can still miss the question. Check that the option answers the full claim, including its scope and qualifications.',
  'Extreme Wording':'Check absolute words such as “always,” “only,” or “never” against the passage’s actual level of certainty.',
  'Outside Scope':'Ask whether the option answers this question using the passage, rather than introducing a related but separate issue.',
  'Distorted Claim':'Compare the option with the author’s full claim; preserve what the author actually emphasizes.',
  'Causal Leap':'When an option claims cause and effect, look for evidence that establishes causation rather than association alone.',
  'Unsupported Inference':'Keep the conclusion within what the passage supports; plausibility alone is not evidence.',
  'Reversal / Opposite Meaning':'Check the direction of the passage’s claim before accepting an option that reverses it.',
  'Scope Shift':'Match the option’s subject and scope to the question and the passage’s claim.',
  'Too Broad':'Reject an option that extends a qualified claim to a wider group or situation than the passage supports.',
  'Too Narrow':'Check that the option captures the full point rather than one supporting detail.',
  'Irrelevant Detail':'A repeated passage detail is useful only if it answers what the question asks.',
  'Premise–Conclusion Confusion':'Separate the evidence offered from the conclusion it is meant to support.',
  'Comparison Mismatch':'Compare like with like; verify that both sides use the same measure, group, or time period.',
  'Misread Quantifier':'Track words such as “some,” “most,” and “all” without strengthening or weakening them.',
  'Author Attitude Misread':'Use the author’s evaluative language and qualifications to identify attitude and its intensity.',
  'Chronology / Sequence Error':'Track the order of events and do not treat sequence alone as proof of cause.',
  'Logical Connector Misread':'Follow connectors such as “although,” “therefore,” and “unless” to preserve the relationship between claims.',
  'Attractive but Unanswerable':'Choose the option that answers the asked question with available evidence, even when another sounds plausible.',
})[trap] || null

export const trapDescription = trap => ({
  'Half Truth / Partial Truth':'You choose a true passage detail that does not fully answer the question or preserve the claim’s qualifications.',
  'Extreme Wording':'You choose wording stronger or more absolute than the passage supports.',
  'Outside Scope':'You choose a related idea that falls outside what the question asks.',
  'Distorted Claim':'You choose an option that changes the author’s central claim or emphasis.',
  'Causal Leap':'You choose a cause-and-effect claim when the passage establishes only a relationship or sequence.',
  'Unsupported Inference':'You accept a plausible conclusion that the passage does not establish.',
  'Reversal / Opposite Meaning':'You choose an option that reverses the passage’s meaning or direction.',
  'Scope Shift':'You move the claim to a different subject, condition, or level of scope.',
  'Too Broad':'You extend the passage’s claim beyond the group or situation it covers.',
  'Too Narrow':'You reduce the answer to a detail and miss the full claim.',
  'Irrelevant Detail':'You select a passage detail that does not resolve the question.',
  'Premise–Conclusion Confusion':'You confuse supporting evidence with the conclusion it supports.',
  'Comparison Mismatch':'You compare unlike measures, groups, or time periods.',
  'Misread Quantifier':'You change the force of a quantity word such as “some,” “most,” or “all.”',
  'Author Attitude Misread':'You read the author’s attitude or its intensity differently from the language used.',
  'Chronology / Sequence Error':'You misread event order or treat sequence as proof of causation.',
  'Logical Connector Misread':'You miss how a connector changes the relationship between ideas.',
  'Attractive but Unanswerable':'You choose a plausible option that the available evidence cannot answer.',
})[trap] || null
