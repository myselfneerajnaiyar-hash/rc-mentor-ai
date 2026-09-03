import dotenv from "dotenv"
import { createClient } from "@supabase/supabase-js"

dotenv.config({ path: ".env.local" })
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const topics = process.argv.slice(2).length ? process.argv.slice(2) : ["subject-verb-agreement", "pronouns", "nouns"]
const difficulties = ["easy", "moderate", "hard"]

for (const topic of topics) {
  for (const difficulty of difficulties) {
    const { data: tests, error: testError } = await supabase.from("grammar_tests").select("id,test_number,question_count,is_active").eq("topic_id", topic).eq("difficulty", difficulty).eq("is_active", true).order("test_number")
    if (testError) throw testError
    const ids = (tests || []).map((test) => test.id)
    const { data: questions, error: questionError } = ids.length ? await supabase.from("grammar_questions").select("id,test_id,question_text,options,dedup_hash,correct_answer,primary_skill,trap_type,question_type,audit_payload,is_active").in("test_id", ids).eq("is_active", true) : { data: [], error: null }
    if (questionError) throw questionError
    const counts = new Map(ids.map((id) => [id, 0]))
    for (const question of questions || []) counts.set(question.test_id, (counts.get(question.test_id) || 0) + 1)
    const incomplete = (tests || []).filter((test) => test.question_count !== 5 || counts.get(test.id) !== 5).map((test) => test.test_number)
    const normalized = (value) => String(value || "").trim().toLowerCase().replace(/\s+/g, " ")
    const questionTexts = (questions || []).map((question) => normalized(question.question_text))
    const optionBlocks = (questions || []).map((question) => JSON.stringify(question.options || []))
    const duplicates = (values) => values.length - new Set(values).size
    const invalidMetadata = (questions || []).filter((question) => !question.correct_answer || !question.primary_skill || !question.trap_type || !question.question_type || !question.audit_payload).length
    console.log(JSON.stringify({ topic, difficulty, sets: tests?.length || 0, questions: questions?.length || 0, incompleteSets: incomplete, duplicateQuestionTexts: duplicates(questionTexts), duplicateOptionBlocks: duplicates(optionBlocks), invalidMetadata }))
  }
}
