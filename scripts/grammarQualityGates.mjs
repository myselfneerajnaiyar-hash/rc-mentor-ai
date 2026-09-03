const words = (value) => String(value || "").toLowerCase().match(/[a-z]+(?:'[a-z]+)?/g) || []
const meaningSignature = (value) => words(value).sort().join(" ")

export function preAuditQualityReasons(question, topic, difficulty) {
  const reasons = []
  const options = Object.entries(question?.options || {})
  const exact = options.map(([, text]) => String(text).trim().toLowerCase())
  if (new Set(exact).size !== exact.length) reasons.push("duplicate-options")
  const groups = new Map()
  for (const [id, text] of options) {
    const signature = meaningSignature(text)
    if (!groups.has(signature)) groups.set(signature, [])
    groups.get(signature).push(id)
  }
  if (topic === "modifiers" && ["Sentence Correction", "Best Revision", "Correct Sentence"].includes(question?.question_type)) {
    for (const ids of groups.values()) {
      if (ids.length < 2) continue
      const variants = ids.map((id) => String(question.options[id]))
      const onlyScopePair = variants.some((text) => /^only after\b/i.test(text.trim())) && variants.some((text) => /\bonly after\b/i.test(text) && !/^only after\b/i.test(text.trim()))
      const introductoryParentheticalPair = variants.some((text) => /^[^,]+,\s+(?:the\s+)?[A-Z][\w'-]*\b/.test(text)) && variants.some((text) => /^[A-Z][\w'-]*,\s+[^,]+,/.test(text))
      if (onlyScopePair || introductoryParentheticalPair) reasons.push(`equivalent-option-wording: ${ids.join(",")}`)
    }
  }
  const combined = `${question?.question_text || ""} ${options.map(([, text]) => text).join(" ")}`
  if (topic === "tenses") {
    const stem = String(question?.question_text || "")
    const pastReport = /\b(?:announced|said|reported|explained|stated|promised|confirmed)\b/i.test(stem)
    const futureReference = /\b(?:next\s+\w+|following\s+\w+|in\s+20\d{2}|later)\b/i.test(stem)
    const explicitlyBackshifted = /\b(?:in\s+20\d{2}|that year)\b/i.test(stem) && /\b(?:was|were|had been|later)\s+(?:cancelled|canceled|abandoned|postponed|superseded)\b/i.test(stem)
    const explicitlyCurrent = /\b(?:is|are|remains?|remain)\s+still\s+(?:scheduled|planned|expected|true|current)\b/i.test(stem)
    if (pastReport && futureReference && !explicitlyBackshifted && !explicitlyCurrent) reasons.push("reported-speech-viewpoint-underdetermined")
  }
  if (topic === "nouns" && /\bamount\s+of\s+data\b/i.test(combined) && /\ba\s+few(?:\s+\w+){0,2}\s+data\b/i.test(combined)) reasons.push("contradictory-data-countability")
  const styleAnalysis = `${question?.explanation?.why_distractor_fails || ""} ${Object.values(question?.option_analysis || {}).map((entry) => entry?.why_it_is_correct_or_wrong || "").join(" ")}`
  if (topic === "modifiers" && /\b(?:awkward|less direct|less natural|less preferred|more concise|stylistic)\b/i.test(styleAnalysis) && !/\b(?:dangling|misplaced|ambiguous|scope|attachment|meaning|ungrammatical|incorrect referent)\b/i.test(styleAnalysis)) reasons.push("style-preference-only")
  if (difficulty === "hard" && (question?.quality?.reasoning_steps || []).length < 2) reasons.push("hard-declared-mechanisms-missing")
  return [...new Set(reasons)]
}

export function failClosedAuditReasons(audit, difficulty, topic = null) {
  const reasons = []
  const evaluations = Array.isArray(audit?.option_evaluations) ? audit.option_evaluations : []
  const defensibleIds = Array.isArray(audit?.defensible_option_ids) ? audit.defensible_option_ids : []
  if (audit?.unique_defensible_answer !== true || defensibleIds.length !== 1 || evaluations.length !== 4 || evaluations.filter((item) => item?.defensible === true).length !== 1) reasons.push("unique-defensible-answer-failed")
  if (evaluations.some((item) => !item?.option_id || !item?.grammatical_status || !item?.semantic_status || typeof item?.defensible !== "boolean" || !item?.reason)) reasons.push("option-evaluations-incomplete")
  if (audit?.ambiguity_status !== "none") reasons.push(`ambiguity-${audit?.ambiguity_status || "missing"}`)
  if (audit?.context_sufficiency !== "sufficient") reasons.push("context-insufficient")
  if (audit?.style_dependency !== "none") reasons.push("style-dependent")
  if (audit?.semantic_consistency !== "consistent") reasons.push("semantic-contradiction")
  if (difficulty === "hard") {
    if (audit?.hard_mechanisms_independent !== true) reasons.push("hard-mechanisms-not-independent")
    const steps = Array.isArray(audit?.hard_reasoning_steps) ? audit.hard_reasoning_steps : []
    if (steps.length < 2 || new Set(steps.map(meaningSignature)).size < 2) reasons.push("hard-reasoning-mechanisms-insufficient")
    if (!audit?.mechanism_1 || !audit?.mechanism_2 || !audit?.mechanism_independence_explanation) reasons.push("hard-mechanism-evidence-incomplete")
    const categories = Array.isArray(audit?.hard_mechanism_categories) ? audit.hard_mechanism_categories : []
    if (categories.length < 2 || new Set(categories).size < 2) reasons.push("hard-mechanism-categories-not-distinct")
    if (topic === "nouns" && (!["contextual-sense", "quantifier-compatibility"].every((category) => categories.includes(category)) || categories.length < 3)) reasons.push("hard-nouns-three-mechanisms-missing")
    if (topic === "tenses" && categories.every((category) => category === "event-before-past-reference")) reasons.push("hard-tenses-repeated-sequencing")
    if (topic === "active-passive-voice" && categories.length === 2 && categories.includes("passive-auxiliary-chain") && categories.includes("patient-identification")) reasons.push("hard-voice-dependent-mechanisms")
  }
  return [...new Set(reasons)]
}
