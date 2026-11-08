import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {encodeSms,parseSms,validPhone} from '../lib/sms';
const phone='01712345678';
test('SMS AQ2 round trip requires contact',()=>{const s=encodeSms({area:'Koyra, Khulna',issue:'SHORTAGE',people:150,details:'Need water',contactPhone:phone});assert.deepEqual(parseSms(s),{area:'Koyra, Khulna',issue:'SHORTAGE',people:150,details:'Need water',contactPhone:phone});});
test('reject missing or invalid contact and legacy AQ1',()=>{for(const s of ['bad','AQ1|OTHER|Koyra|2|hi','AQ2|PUMP|Koyra|2|123|x','AQ2|FAKE|Koyra|10|01712345678|x'])assert.throws(()=>parseSms(s));assert.throws(()=>encodeSms({area:'Koyra',issue:'OTHER',people:3,details:'x',contactPhone:''}));assert.equal(validPhone(phone),true);});
test('sanitize separator and newline',()=>{const s=encodeSms({area:'Koyra|Khulna',issue:'PUMP',people:2,details:'A\nB',contactPhone:phone});assert.equal(s.split('|').length,6);assert.equal(parseSms(s).details,'A B');});
