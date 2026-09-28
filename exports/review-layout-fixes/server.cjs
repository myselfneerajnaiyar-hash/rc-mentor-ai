const http=require('http');
const app=require('next')({dev:true,hostname:'localhost',port:3115,conf:{...require('../../next.config.cjs'),distDir:'.next-review-fixes'}});
app.prepare().then(()=>http.createServer(app.getRequestHandler()).listen(3115));
