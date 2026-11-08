import test from 'node:test';
import assert from 'node:assert/strict';
import {answerFota,type FotaContext} from '../lib/fota';
import {demoReports} from '../lib/demo';
import {initialCases} from '../lib/orgDemo';
const context:FotaContext={lang:'en',route:'/',reports:demoReports,cases:initialCases};

test('FOTA reads the actual current report status and recommends its next step',()=>{
  const answer=answerFota('Please check aq-101',context);
  assert.match(answer.text,/Pending review/);assert.match(answer.steps![0],/Verify/);
  assert.equal(answer.reference,'AQ-101');assert.ok(answer.links.some(l=>l.href==='/operations?q=AQ-101'));
  const updated=answerFota('status now',{...context,reference:'AQ-101',reports:demoReports.map(r=>r.id==='AQ-101'?{...r,status:'verified'}:r)});
  assert.match(updated.text,/Verified/);assert.ok(updated.links.some(l=>l.href==='/cases?q=AQ-101'));
});

test('FOTA handles Bangla IDs, language and missing references without invented statuses',()=>{
  const bn=answerFota('AQ-১০১ এর অবস্থা',{...context,lang:'bn'});
  assert.match(bn.text,/যাচাইয়ের অপেক্ষায়/);assert.equal(bn.reference,'AQ-101');
  const missing=answerFota('AQ-9999999',context);assert.match(missing.text,/cannot find/);assert.equal(missing.links[0].href,'/track?id=AQ-9999999');
});

test('FOTA keeps all case categories on the same linked task path',()=>{
  for(const record of initialCases.filter(c=>c.status==='assigned'&&c.orgId)){
    const answer=answerFota(record.id,context);
    assert.ok(answer.links.some(l=>l.href==='/ngo/tasks?case='+record.id),record.id);
  }
});

test('contextual help selects the current page rather than generic reporting',()=>{
  for(const [route,expected] of [['/ngo/tasks','/ngo/tasks'],['/cases','/cases'],['/dashboard','/dashboard?demo=1'],['/market-prices','/market-prices'],['/map','/map']]){
    assert.ok(answerFota('ki korbo ekhane',{...context,route}).links.some(l=>l.href===expected),route);
  }
  assert.ok(answerFota('এখানে কী করব',{...context,lang:'bn',route:'/cases'}).links.some(l=>l.href==='/cases'));
});

test('FOTA distinguishes budget planning, supply estimates and demo contact information',()=>{
  assert.ok(answerFota('budget zero',context).links.some(l=>l.href==='/dashboard?demo=1'));
  assert.ok(answerFota('sanitation costs',context).links.some(l=>l.href==='/market-prices'));
  assert.match(answerFota('contact email',context).text,/not active/);
  assert.match(answerFota('is this water safe to drink',context).text,/cannot verify/);
  assert.match(answerFota('tell me live weather now',context).text,/cannot browse/);
});
