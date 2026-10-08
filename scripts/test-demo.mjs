import ts from 'typescript';
import {readFile,mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
const directory=await mkdtemp(join(tmpdir(),'holiday-demo-'));
try{
 await writeFile(join(directory,'package.json'),'{"type":"module"}');
 for(const name of ['catalog','demo']){
  const source=await readFile(new URL('../lib/'+name+'.ts',import.meta.url),'utf8');
  const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText.replace("from './catalog'","from './catalog.js'");
  await writeFile(join(directory,name+'.js'),compiled);
 }
 const {createDemoState,demoPurchase,demoOwnerChange}=await import(pathToFileURL(join(directory,'demo.js')).href);
 const first=createDemoState(),second=createDemoState();
 const gift=first.gifts.find(g=>g.category==='toys'&&g.allocated===0);
 const input={id:'purchase-1',gift:gift.id,name:'Demo visitor',amount:gift.price};
 demoPurchase(first,input);
 assert.equal(first.gifts.find(g=>g.id===gift.id).allocated,gift.price);
 assert.equal(second.gifts.find(g=>g.id===gift.id).allocated,0,'Visitors must have independent sample data');
 assert.throws(()=>demoPurchase(first,{...input,id:'purchase-2'}),/already taken/);
 demoPurchase(first,input);assert.equal(first.claims.filter(c=>c.id===input.id).length,1,'Repeated submits must be idempotent');
 assert.throws(()=>demoPurchase(first,{...input,id:'bad',gift:'529',amount:100}),/already taken/);
 demoOwnerChange(first,{action:'claim',id:input.id,status:'cancelled'});
 assert.equal(first.gifts.find(g=>g.id===gift.id).allocated,0);
 demoOwnerChange(first,{action:'claim',id:input.id,status:'cancelled'});assert.equal(gift.allocated,0,'Releasing twice must not subtract twice');
 demoOwnerChange(first,{gift:{...gift,title:'Edited example'}});assert.equal(first.gifts.find(g=>g.id===gift.id).title,'Edited example');
 assert.equal(createDemoState().gifts.find(g=>g.id===gift.id).title,second.gifts.find(g=>g.id===gift.id).title,'Reset restores the sample catalog');
 console.log('PASS: isolated visitors, purchase capacity, duplicate submission, closed fund, claim release, owner edits, reset');
}finally{await rm(directory,{recursive:true,force:true});}
