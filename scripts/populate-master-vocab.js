import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({
  path: ".env.local",
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TARGET = 300;
const BATCH_SIZE = 20;
async function generateBatch(existingWords, startRank) {

const prompt = `

You are building the master vocabulary database for an advanced Reading Comprehension platform.

Generate EXACTLY ${BATCH_SIZE} NEW English words.

Existing words:
${existingWords.join(", ")}

IMPORTANT:

These words should be the kind that frequently appear in:

- Philosophy
- Psychology
- Sociology
- Economics
- Anthropology
- History
- Political Theory
- Public Policy
- Literary Criticism
- Scientific essays
- The Economist
- Aeon
- Psyche
- New York Times
- The Guardian
- Long-form editorials
- Research articles

DO NOT generate easy words like:

important
factor
approach
derive
evaluate
complex
issue
result
method
process
require
develop
significant
change
effect
system
structure
problem
evidence
analysis
theory

Choose words that educated readers repeatedly encounter but aspirants often struggle with.

Examples of the expected level:

aberration
equivocal
obfuscate
pernicious
cogent
ephemeral
prescient
intransigent
paradigm
hegemony
teleology
reification
conflation
orthodoxy
heterodoxy
dichotomy
zeitgeist
untenable
ostensible
equanimity

Mix:
- nouns
- verbs
- adjectives
- adverbs

For every word provide:

- meaning (simple English)
- part_of_speech
- usage
- root
- exactly 3 synonyms
- exactly 3 antonyms

Return ONLY valid JSON.

{
  "words":[
    {
      "word":"",
      "meaning":"",
      "part_of_speech":"",
      "usage":"",
      "root":"",
      "synonyms":"a,b,c",
      "antonyms":"x,y,z"
    }
  ]
}

`;

const completion =
await openai.chat.completions.create({

model:"gpt-4.1",

messages:[
{
role:"system",
content:"You are an expert English lexicographer. Return JSON only."
},
{
role:"user",
content:prompt
}
],

temperature:0.8

});

const text=completion.choices[0].message.content;

const start=text.indexOf("{");
const end=text.lastIndexOf("}")+1;

const json=JSON.parse(text.slice(start,end));

return json.words.map((w,index)=>({

...w,

frequency_rank:startRank+index

}));

}
async function insertWords(words){

const {error}=await supabase

.from("master_vocab")

.upsert(words,{
onConflict:"word"
});

if(error){

console.log(error);

}
else{

console.log(`Inserted ${words.length} words.`);

}

}
async function main(){

while(true){

const {data}=await supabase

.from("master_vocab")

.select("word");

const existing=data||[];

if(existing.length>=TARGET){

console.log("Master vocab complete.");

break;

}

console.log(`Current : ${existing.length}`);

const words=await generateBatch(

existing.map(x=>x.word),

existing.length+1

);

await insertWords(words);

}

console.log("Done.");

}

main();