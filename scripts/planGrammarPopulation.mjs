import dotenv from "dotenv"
import { createClient } from "@supabase/supabase-js"

dotenv.config({ path: ".env.local" })
const topics = process.argv.slice(2)
if (!topics.length) throw new Error("Pass one or more topic IDs")
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } })
const difficulties = ["easy", "moderate", "hard"]
let missingSetsTotal = 0, incompleteTotal = 0
for (const topic of topics) {
  console.log(`\n${topic}`)
  for (const difficulty of difficulties) {
    const { data: tests, error } = await supabase.from("grammar_tests").select("id,test_number,question_count").eq("topic_id", topic).eq("difficulty", difficulty).eq("is_active", true)
    if (error) throw error
    const ids = (tests || []).map((test) => test.id)
    const { data: questions, error: questionError } = ids.length ? await supabase.from("grammar_questions").select("test_id").in("test_id", ids).eq("is_active", true) : { data: [], error: null }
    if (questionError) throw questionError
    const counts = new Map(ids.map((id) => [id, 0])); for (const question of questions || []) counts.set(question.test_id, (counts.get(question.test_id) || 0) + 1)
    const complete = (tests || []).filter((test) => test.question_count === 5 && counts.get(test.id) === 5).length
    const incomplete = (tests || []).length - complete
    const missing = Math.max(0, 10 - complete)
    missingSetsTotal += missing; incompleteTotal += incomplete
    console.log(`${difficulty.padEnd(10)} complete ${complete}/10 | missing sets ${missing} | missing questions ${missing * 5} | incomplete persisted ${incomplete}`)
  }
}
const expectedGeneration = missingSetsTotal, expectedAudits = missingSetsTotal
const maxLocalReplacement = missingSetsTotal * 10, maxAuditReplacement = missingSetsTotal * 10, maxReplacementAudits = missingSetsTotal * 2
console.log(`\nCost plan (zero OpenAI calls; zero writes)\nMissing sets: ${missingSetsTotal}\nMissing questions: ${missingSetsTotal * 5}\nIncomplete persisted sets: ${incompleteTotal}\nExpected generation calls: ${expectedGeneration}\nExpected set-audit calls: ${expectedAudits}\nExpected total OpenAI calls: ${expectedGeneration + expectedAudits}\nWorst-case local replacement calls: ${maxLocalReplacement}\nWorst-case audit replacement calls: ${maxAuditReplacement}\nWorst-case replacement-audit calls: ${maxReplacementAudits}\nEstimated maximum OpenAI calls: ${expectedGeneration + expectedAudits + maxLocalReplacement + maxAuditReplacement + maxReplacementAudits}`)
