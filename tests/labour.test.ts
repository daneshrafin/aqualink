import {test} from 'node:test';import {strict as assert} from 'node:assert';import {estimateLabour} from '../lib/labour';
test('single worker standard and special',()=>{assert.equal(estimateLabour({workers:1,days:1,singleRate:1000,foodExtra:false}).total,1000);assert.equal(estimateLabour({workers:1,days:1,singleRate:1500,foodExtra:false}).total,1500)});
test('two and three workers',()=>{assert.equal(estimateLabour({workers:2,days:1,singleRate:1000,foodExtra:false}).total,1800);assert.equal(estimateLabour({workers:3,days:1,singleRate:1000,foodExtra:false}).total,2600)});
test('optional food',()=>assert.deepEqual(estimateLabour({workers:2,days:2,singleRate:1000,foodExtra:true}),{labour:3600,food:600,total:4200}));
test('invalid workers',()=>assert.throws(()=>estimateLabour({workers:0,days:1,singleRate:1000,foodExtra:false})));
