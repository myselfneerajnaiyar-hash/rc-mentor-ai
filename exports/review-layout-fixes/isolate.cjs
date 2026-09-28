const fs=require('fs'),path=require('path');
const root=process.cwd(),target=path.join(root,'exports/review-layout-fixes/workspace');fs.mkdirSync(target,{recursive:true});
const exclude=new Set(['node_modules','.git','.next','exports','android','.agents','.codex','tests','docs','supabase','logs']);
for(const item of fs.readdirSync(root,{withFileTypes:true})){if(exclude.has(item.name)||item.name.startsWith('.next'))continue;fs.cpSync(path.join(root,item.name),path.join(target,item.name),{recursive:true});}
if(!fs.existsSync(path.join(target,'node_modules')))fs.symlinkSync(path.join(root,'node_modules'),path.join(target,'node_modules'),'junction');
