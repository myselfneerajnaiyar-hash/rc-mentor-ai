import { validateGrammarTopicBlueprints } from "./grammarTopicBlueprints.mjs"

const result = validateGrammarTopicBlueprints()
console.log(JSON.stringify(result, null, 2))
if (!result.success) process.exitCode = 1
