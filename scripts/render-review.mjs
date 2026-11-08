import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
const root=process.cwd(),out=join(root,"visual-review");
const mime={".html":"text/html",".js":"text/javascript",".css":"text/css",".png":"image/png",".woff":"font/woff"};
const server=createServer(async(req,res)=>{let p=new URL(req.url,"http://localhost").pathname;if(p==="/")p="/index.html";try{let b=await readFile(normalize(join(root,p)));res.writeHead(200,{"content-type":mime[extname(p)]||"application/octet-stream"}).end(b);}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,"127.0.0.1",r));
const browser=await chromium.launch({headless:true});await mkdir(out,{recursive:true});
const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
await page.goto("http://127.0.0.1:"+server.address().port+"/");
await page.evaluate(()=>{document.querySelector("#splash")?.click();document.querySelector("#ack-ok")?.click();});
const scenes=[["medvezhonok","bear",.2],["podem-na-noski","raise",.5],["velosiped","bike",.25],["tryapochki","rags",.3]];
for(const [name,id,p] of scenes){
 await page.evaluate(({id,p})=>{
   let host=document.getElementById("visual-render");
   if(!host){host=document.createElement("div");host.id="visual-render";document.body.appendChild(host);}
   document.body.style.background="#fff";host.style.cssText="position:fixed;inset:0;background:#fff;display:flex;align-items:center;justify-content:center;z-index:999999";
   AN.seed(1);AN.setFocus(AN[id].focus);
   host.innerHTML='<svg xmlns="http://www.w3.org/2000/svg" viewBox="'+AN.VIEWBOX+'" style="width:390px;max-width:100%;height:auto">'+AN.sketchify(AN[id].f(p))+'</svg>';
 },{id,p});
 await page.screenshot({path:join(out,name+".png")});
}
await browser.close();server.close();console.log("Rendered 4 review frames in visual-review/");
