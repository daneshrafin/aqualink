import {readdirSync,readFileSync,existsSync} from 'node:fs';
import {join,relative} from 'node:path';
const root=process.cwd(), routes=new Set(['/']);
function scanRoutes(dir,parts=[]){for(const item of readdirSync(dir,{withFileTypes:true})){if(item.isDirectory())scanRoutes(join(dir,item.name),[...parts,item.name]);else if(item.name==='page.tsx')routes.add('/'+parts.filter(x=>!x.startsWith('(')).join('/'));}}
scanRoutes(join(root,'app'));
const errors=[];let links=0;
function scan(dir){for(const item of readdirSync(dir,{withFileTypes:true})){if(['node_modules','.next','.git'].includes(item.name))continue;const f=join(dir,item.name);if(item.isDirectory())scan(f);else if(/\.(tsx|ts)$/.test(item.name)){const s=readFileSync(f,'utf8');for(const m of s.matchAll(/\b(?:href|pathname)\s*=\s*["'](\/[\w/-]*)["']/g)){links++;const path=m[1].replace(/\/$/,'')||'/';if(!routes.has(path)&&!path.startsWith('/api/'))errors.push(`${relative(root,f)}: unknown route ${path}`)}}}}
scan(join(root,'app'));scan(join(root,'components'));
for(const p of ['/report','/track','/map','/dashboard','/market-prices','/cases','/organizations','/guide','/account'])if(!routes.has(p))errors.push(`Missing critical page ${p}`);
if(errors.length){console.error(errors.join('\n'));process.exitCode=1}else console.log(`Route audit passed: ${routes.size} page routes, ${links} literal internal links checked.`);
