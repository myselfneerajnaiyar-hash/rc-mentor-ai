import { readFile } from "node:fs/promises"

const since = process.argv[2] ? Date.parse(process.argv[2]) : 0
const lines = (await readFile("logs/grammar-openai-usage.jsonl", "utf8"))
  .split(/\r?\n/)
  .filter(Boolean)
const entries = lines.map((line) => JSON.parse(line)).filter((entry) => Date.parse(entry.timestamp) >= since)
const sum = (field) => entries.reduce((total, entry) => total + Number(entry[field] || 0), 0)
const input = sum("input_tokens")
const cached = sum("cached_input_tokens")
const output = sum("output_tokens")
const result = {
  since: new Date(since).toISOString(),
  through: entries.at(-1)?.timestamp || null,
  calls: entries.length,
  inputTokens: input,
  cachedInputTokens: cached,
  outputTokens: output,
  reasoningTokens: sum("reasoning_tokens"),
  totalTokens: sum("total_tokens"),
  estimatedUsd: ((input - cached) * 2 + cached * 0.5 + output * 8) / 1_000_000,
  callTypes: Object.fromEntries(
    Object.entries(Object.groupBy(entries, (entry) => entry.call_type || "unknown"))
      .map(([key, values]) => [key, values.length]),
  ),
}

console.log(JSON.stringify(result, null, 2))
