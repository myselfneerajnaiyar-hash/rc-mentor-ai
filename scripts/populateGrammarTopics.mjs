import { spawn } from "node:child_process"
import dotenv from "dotenv"
import { createClient } from "@supabase/supabase-js"

dotenv.config({ path: ".env.local" })
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const topics = process.argv.slice(2)
if (!topics.length) throw new Error("Pass one or more topic IDs")
const difficulties = ["easy", "moderate", "hard"]
const maxAttemptsPerSet = 1
const totals = { calls: 0, inputTokens: 0, cachedInputTokens: 0, outputTokens: 0, reasoningTokens: 0, totalTokens: 0, generated: 0, accepted: 0, rejected: 0, replacements: 0, auditorRejections: 0, inconsistencies: 0, retries: 0 }
const blockedSets = []
let stoppedAt = null

async function bankState(topic, difficulty) {
  const { data: tests, error } = await supabase.from("grammar_tests").select("id,test_number,question_count").eq("topic_id", topic).eq("difficulty", difficulty).eq("is_active", true)
  if (error) throw error
  if (!tests?.length) return { complete: 0, completeNumbers: [], incomplete: [] }
  const ids = tests.map((test) => test.id)
  const { data: questions, error: questionError } = await supabase.from("grammar_questions").select("test_id").in("test_id", ids).eq("is_active", true)
  if (questionError) throw questionError
  const counts = new Map(ids.map((id) => [id, 0]))
  for (const question of questions || []) counts.set(question.test_id, (counts.get(question.test_id) || 0) + 1)
  const completeTests = tests.filter((test) => test.question_count === 5 && counts.get(test.id) === 5)
  const complete = completeTests.length
  const incomplete = tests.filter((test) => test.question_count !== 5 || counts.get(test.id) !== 5).map((test) => test.test_number)
  return { complete, completeNumbers: completeTests.map((test) => test.test_number), incomplete }
}

function seedSet(topic, difficulty, nextSetNumber) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ["scripts/seedGrammarBank.mjs", "--topic", topic, "--difficulty", difficulty, "--count", "5", "--efficient-set", "--set-number", String(nextSetNumber)], { cwd: process.cwd(), env: process.env, stdio: ["ignore", "pipe", "pipe"] })
    let output = ""
    child.stdout.on("data", (chunk) => { const text = chunk.toString(); output += text; process.stdout.write(text) })
    child.stderr.on("data", (chunk) => { const text = chunk.toString(); output += text; process.stderr.write(text) })
    child.on("error", reject)
    child.on("close", (code) => resolve({ code, output }))
  })
}

const metric = (output, label) => Number((output.match(new RegExp(`${label}\\s*(\\d+)`)) || [])[1] || 0)
const estimatedUsd = (input, cached, output) => ((input - cached) * 2 + cached * 0.5 + output * 8) / 1_000_000
function absorbMetrics(output) {
  totals.calls += metric(output, "Total calls:")
  totals.inputTokens += metric(output, "Input tokens:")
  totals.cachedInputTokens += metric(output, "Cached input tokens:")
  totals.outputTokens += metric(output, "Output tokens:")
  totals.reasoningTokens += metric(output, "Reasoning tokens:")
  totals.totalTokens += metric(output, "Total tokens:")
  totals.generated += metric(output, "Initial questions generated:") + metric(output, "Replacement questions generated:")
  totals.accepted += metric(output, "Final accepted:")
  totals.rejected += metric(output, "Locally rejected:") + metric(output, "Set audit rejected:")
  totals.replacements += metric(output, "Replacement calls:")
  totals.auditorRejections += metric(output, "Set audit rejected:")
  totals.inconsistencies += metric(output, "Auditor inconsistencies:")
}

production: for (const topic of topics) for (const difficulty of difficulties) {
  const initial = await bankState(topic, difficulty)
  if (initial.incomplete.length) throw new Error(`${topic} ${difficulty} has incomplete persisted sets ${initial.incomplete.join(",")}; left untouched`)
  const completedNumbers = new Set(initial.completeNumbers)
  console.log(`\n${topic.toUpperCase()} — ${difficulty.toUpperCase()} | resume ${completedNumbers.size}/10 sets`)
  for (let setNumber = 1; setNumber <= 10; setNumber += 1) {
    if (completedNumbers.has(setNumber)) continue
    let completed = false
    let lastReason = "bounded attempt persisted nothing"
    for (let attempt = 1; attempt <= maxAttemptsPerSet && !completed; attempt += 1) {
      console.log(`\n${topic.toUpperCase()} ${difficulty} Set ${setNumber}/10 | attempt ${attempt}/${maxAttemptsPerSet}`)
      const result = await seedSet(topic, difficulty, setNumber)
      absorbMetrics(result.output)
      totals.retries += metric(result.output, "Retries:")
      if (result.code !== 0) {
        if (/429[\s\S]*(?:credit_balance_exhausted|insufficient_quota)|(?:credit_balance_exhausted|insufficient_quota)[\s\S]*429/i.test(result.output)) {
          stoppedAt = { topic, difficulty, set: setNumber, reason: "429 credit_balance_exhausted" }
          console.error(`CREDIT STOP | ${topic} | ${difficulty} | Set ${setNumber} | 429 credit_balance_exhausted`)
          break production
        }
        lastReason = `seeder exited ${result.code}`
        break
      }
      const state = await bankState(topic, difficulty)
      if (state.incomplete.length) throw new Error(`${topic} ${difficulty} produced incomplete persisted sets ${state.incomplete.join(",")}`)
      completed = state.completeNumbers.includes(setNumber)
      if (completed) {
        completedNumbers.add(setNumber)
        const setCalls = metric(result.output, "Total calls:"), setInput = metric(result.output, "Input tokens:"), setOutput = metric(result.output, "Output tokens:"), setTokens = metric(result.output, "Total tokens:")
        console.log(`${topic} | ${difficulty} | Set ${setNumber} | Calls ${setCalls} | Input tokens ${setInput} | Output tokens ${setOutput} | Total tokens ${setTokens} | Estimated USD $${estimatedUsd(setInput, metric(result.output, "Cached input tokens:"), setOutput).toFixed(6)}`)
        console.log(`CUMULATIVE | Calls ${totals.calls} | Input ${totals.inputTokens} | Cached ${totals.cachedInputTokens} | Output ${totals.outputTokens} | Reasoning ${totals.reasoningTokens} | Total ${totals.totalTokens} | Estimated USD $${estimatedUsd(totals.inputTokens, totals.cachedInputTokens, totals.outputTokens).toFixed(6)} | Generated ${totals.generated} | Accepted ${totals.accepted} | Rejected ${totals.rejected} | Replacements ${totals.replacements} | Auditor rejections ${totals.auditorRejections} | Inconsistencies ${totals.inconsistencies}`)
        console.log(`${topic.toUpperCase()} — ${difficulty.toUpperCase()} Set ${setNumber}/10 COMPLETE | 5/5 approved`)
        console.log(`${topic.toUpperCase()} — ${difficulty.toUpperCase()} | Sets ${completedNumbers.size}/10 | Questions ${completedNumbers.size * 5}/50`)
      } else console.log(`Attempt persisted nothing; continuing within the bounded per-set attempt cap.`)
    }
    if (!completed) {
      blockedSets.push({ topic, difficulty, set: setNumber, reason: lastReason })
      console.error(`BLOCKED SET | ${topic} | ${difficulty} | Set ${setNumber} | ${lastReason}; moving to next set`)
    }
  }
  console.log(`${topic.toUpperCase()} — ${difficulty.toUpperCase()} FINISHED RUN | ${completedNumbers.size}/10 sets | ${completedNumbers.size * 5}/50 questions`)
}
console.log(`\nPRODUCTION TOTALS ${JSON.stringify({ ...totals, estimatedUsd: estimatedUsd(totals.inputTokens, totals.cachedInputTokens, totals.outputTokens), blockedSets, stoppedAt })}`)
