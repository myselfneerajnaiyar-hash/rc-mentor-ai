require("dotenv").config({ path: ".env.local" });

const OpenAI = require("openai");
const { createClient } = require("@supabase/supabase-js");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TARGET = 500;
const BATCH_SIZE = 20;

async function generateBatch(existingTopics) {

const prompt = `

You are building the MASTER TOPIC DATABASE for an advanced CAT VARC platform.

Generate EXACTLY ${BATCH_SIZE} topic sets.

Each topic set must contain:

1 RC1 topic

1 RC2 topic

10 UNIQUE Speed Reading topics

Rules:

* RC1 topic must be different from RC2 topic.

* The 10 Speed topics must all be different.

* None of the 10 Speed topics may overlap with RC1 or RC2.

* Avoid generic topics.

BAD

AI
Social Media
Startups
Productivity
Climate Change

GOOD

History of Calendars
Science of Curiosity
Forest Ecology
Coffee Cultivation
Economics of Trust
History of Insurance
Urban Biodiversity
History of Bridges
Behavioral Finance
Planetary Geology
Architecture of Temples
History of Measurement
History of Photography
Evolution of Banking
Science of Taste
Animal Camouflage
Carbon Capture
History of Navigation
Marine Archaeology
Food Preservation

Already generated RC topics:

${existingTopics.join("\n")}

Do NOT repeat any RC topic above.

Return ONLY valid JSON.

{
  "rows":[
    {
      "rc1_topic":"",
      "rc2_topic":"",
      "speed_topics":[
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        ""
      ]
    }
  ]
}

`;

const completion = await openai.chat.completions.create({

model:"gpt-4.1",

response_format:{type:"json_object"},

messages:[
{
role:"system",
content:"Return JSON only."
},
{
role:"user",
content:prompt
}
],

temperature:0.9

});

return JSON.parse(
completion.choices[0].message.content
).rows;

}

async function insertRows(rows){

const {error}=await supabase

.from("master_topics")

.insert(rows);

if(error){

console.log(error);

}else{

console.log(`Inserted ${rows.length} topic rows`);

}

}

async function main(){

while(true){

const {data}=await supabase

.from("master_topics")

.select("rc1_topic,rc2_topic");

const existing=data||[];

if(existing.length>=TARGET){

console.log("Master topics complete.");

break;

}

const used=[];

existing.forEach(r=>{

used.push(r.rc1_topic);

used.push(r.rc2_topic);

});

console.log("Current:",existing.length);

const rows=await generateBatch(used);

await insertRows(rows);

}

console.log("Done.");

}

main();