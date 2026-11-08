import test from 'node:test';
import assert from 'node:assert/strict';
import {dismissWithMotion} from '../src/motion.js';
function fixture({reduced=false,mobile=true}={}){
 const pending=[],calls=[];let fallback,cleared=false;
 const panel={animate:animate};
 function animate(frames,options){let resolve,reject;const finished=new Promise((a,b)=>{resolve=a;reject=b;});const result={finished,cancel(){}};pending.push({resolve,reject});calls.push({frames,options});return result;}
 const overlay={dataset:{},querySelector:()=>panel,animate};
 const env={matchMedia:q=>({matches:q.includes('reduced')?reduced:mobile}),getComputedStyle:()=>({transform:'matrix(1,0,0,1,0,4)',opacity:'.8'}),setTimeout(fn){fallback=fn;return 1;},clearTimeout(){cleared=true;}};
 return {overlay,panel,env,pending,calls,fallback:()=>fallback(),cleared:()=>cleared};
}
test('reduced motion and unsupported animation close immediately',()=>{
 for(const mode of ['reduced','unsupported']){const f=fixture({reduced:mode==='reduced'});if(mode==='unsupported')delete f.panel.animate;let count=0;dismissWithMotion(f.overlay,()=>count++,f.env);assert.equal(count,1);assert.equal(f.calls.length,0);}
});
test('sheet dismissal starts at the visible frame and completes once',async()=>{
 const f=fixture();let count=0;dismissWithMotion(f.overlay,()=>count++,f.env);dismissWithMotion(f.overlay,()=>count++,f.env);
 assert.equal(f.calls.length,2);assert.equal(count,0);assert.match(f.calls[0].frames[0].transform,/matrix/);assert.match(f.calls[0].frames[1].transform,/translateY/);
 f.pending.forEach(x=>x.resolve());await new Promise(r=>setImmediate(r));f.fallback();assert.equal(count,1);assert.ok(f.cleared());
});
test('cancelled animations still unlock the dialog',async()=>{
 const f=fixture();let closed=false;dismissWithMotion(f.overlay,()=>closed=true,f.env);f.pending[0].reject(new Error('interrupted'));await new Promise(r=>setImmediate(r));assert.ok(closed);
});
test('background animation has a bounded close fallback',()=>{
 const f=fixture({mobile:false});let closed=false;dismissWithMotion(f.overlay,()=>closed=true,f.env);assert.equal(f.calls[0].frames[1].transform,'scale(.975)');f.fallback();assert.ok(closed);
});
test('failed animation setup never locks the dialog',()=>{
 const f=fixture();f.panel.animate=()=>{throw Error('not available');};let closed=false;dismissWithMotion(f.overlay,()=>closed=true,f.env);assert.ok(closed);
});
