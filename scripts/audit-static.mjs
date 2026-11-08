import {readdirSync,readFileSync,existsSync} from 'node:fs';
import {join,relative} from 'node:path';
const root=process.cwd();let errors=[];let count=0;
function visit(dir){for(const ent of readdirSync(dir,{withFileTypes:true})){if(['node_modules','.next','.git'].includes(ent.name))continue;const file=join(dir,ent.name);if(ent.isDirectory())visit(file);else if(/\.(tsx|ts)$/.test(ent.name)){const code=readFileSync(file,'utf8');count++;const directive=/(?:^|\n)\s*['\"]use client['\"];?/g;const matches=[...code.matchAll(directive)];if(matches.length){const first=code.replace(/^\uFEFF/,'').trimStart();if(!/^['\"]use client['\"];?/.test(first))errors.push(relative(root,file)+': use client must precede imports');if(matches.length>1)errors.push(relative(root,file)+': duplicate client directives');}}}}
visit(join(root,'app'));visit(join(root,'components'));
for(const name of ['sql/007_org_applications_case_claims.sql','sql/008_public_case_privacy.sql','sql/009_public_report_redaction.sql','sql/010_sanitation_category.sql'])if(!existsSync(join(root,name)))errors.push('Missing '+name);
if(existsSync(join(root,'testwrite')))errors.push('Stray testwrite file');
if(errors.length){console.error(errors.join('\n'));process.exitCode=1}else console.log(`Static audit passed: ${count} TS/TSX files; required privacy migrations present.`);
