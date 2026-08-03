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

const TARGET = 500;
const BATCH_SIZE = 20;

async function generateBatch(existingOpenings) {

const prompt = `

You are building the master sentence opening database for an advanced CAT VARC platform.

Generate EXACTLY ${BATCH_SIZE} NEW sentence openings.

Existing openings:

${existingOpenings.join(", ")}

IMPORTANT

These openings will be used ONLY for Vocabulary Fill in the Blank questions.

Generate a diverse mix.

Examples:

The archaeologist argued that

The philosopher insisted that

The diplomat observed that

The editor maintained that

The psychologist suggested that

The economist warned that

The historian noted that

The linguist remarked that

The playwright believed that

The botanist explained that

The anthropologist argued that

The conservationist maintained that

The architect observed that

The astronomer suggested that

The curator remarked that

The jurist maintained that

The epidemiologist warned that

The sociologist proposed that

The ecologist concluded that

The critic insisted that

DO NOT repeat any existing opening.

DO NOT generate generic openings like:

The scientist...
The researcher...
The student...
The teacher...

Every opening should sound natural.

For every opening provide:

opening

category

Category must be one of:

history
science
arts
politics
economics
psychology
law
medicine
environment
literature
culture
technology
business
education
philosophy

Return ONLY valid JSON.

{
  "entries":[
    {
      "opening":"",
      "category":""
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
content:"You are an expert English editor. Return JSON only."
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

return json.entries;

}

async function insertEntries(entries){

const {error}=await supabase

.from("master_fill_openings")

.upsert(entries,{
onConflict:"opening"
});

if(error){

console.log(error);

}else{

console.log(`Inserted ${entries.length} openings.`);

}

}

async function main(){

while(true){

const {data}=await supabase

.from("master_fill_openings")

.select("opening");

const existing=data||[];

if(existing.length>=TARGET){

console.log("Master fill openings complete.");

break;

}

console.log(`Current : ${existing.length}`);

const entries=await generateBatch(

existing.map(x=>x.opening)

);

await insertEntries(entries);

}

console.log("Done.");

}

main();