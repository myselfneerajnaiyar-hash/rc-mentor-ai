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

const TARGET = 1000;
const BATCH_SIZE = 20;

async function generateBatch(existingPhrases, startRank) {

const prompt = `

You are building the master idiom database for an advanced CAT VARC platform.

Generate EXACTLY ${BATCH_SIZE} NEW entries.

Existing idioms/phrasal verbs:

${existingPhrases.join(", ")}

IMPORTANT

Generate a healthy mix of:

- Idioms
- Phrasal Verbs

Examples

cut to the chase
spill the beans
beat around the bush
hit the nail on the head
burn the midnight oil
call off
bring up
carry out
look into
put off
run into
turn down
back up
phase out
rule out

Do NOT repeat any existing phrase.

For every entry provide:

phrase
meaning
type
example

Rules

type must be exactly one of:

idiom
phrasal_verb

Meaning should be simple English.

Example should naturally demonstrate the phrase.

Return ONLY valid JSON.

{
  "entries":[
    {
      "phrase":"",
      "meaning":"",
      "type":"",
      "example":""
    }
  ]
}

`;

const completion = await openai.chat.completions.create({

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

temperature:0.9

});

const text = completion.choices[0].message.content;

const start = text.indexOf("{");
const end = text.lastIndexOf("}") + 1;

const json = JSON.parse(text.slice(start,end));

return json.entries.map((x,index)=>({

...x,

frequency_rank:startRank+index

}));

}

async function insertEntries(entries){

const {error} = await supabase

.from("master_idioms")

.upsert(entries,{
onConflict:"phrase"
});

if(error){

console.log(error);

}else{

console.log(`Inserted ${entries.length} entries.`);

}

}

async function main(){

while(true){

const {data} = await supabase

.from("master_idioms")

.select("phrase");

const existing = data || [];

if(existing.length >= TARGET){

console.log("Master idioms complete.");

break;

}

console.log(`Current : ${existing.length}`);

const entries = await generateBatch(

existing.map(x=>x.phrase),

existing.length+1

);

await insertEntries(entries);

}

console.log("Done.");

}

main();