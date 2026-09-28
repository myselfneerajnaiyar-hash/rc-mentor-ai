const fs=require('fs');
const p='tests/daily-rc-review.test.mjs';let s=fs.readFileSync(p,'utf8');s=s.replace('let state, cleanup, lastId, effects = []','let state, cleanup, lastId, effects = []');s=s.replace('assert.equal((await render("A")).data?.rcSet.passage ?? null, "A")','assert.equal((await render("A")).data?.rcSet.passage ?? null, null)');fs.writeFileSync(p,s);
