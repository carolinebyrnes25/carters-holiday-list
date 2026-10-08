import {toyCatalog, clothingCatalog, miscCatalog} from './catalog';
export type DemoGift={id:string;category:string;title:string;description:string;price:number;outside:number;group_gift:number;ready:number;year:number|null;url:string;secondary_url:string;image:string;details:string;instructions:string;allocated:number;received:number;sent:number};
export type DemoClaim={id:string;gift:string;name:string;title:string;amount:number;status:string;expires:number;url:string;secondary_url:string;instructions:string;group_gift:number};
export type DemoState={gifts:DemoGift[];claims:DemoClaim[]};
const defaults={outside:0,group_gift:0,ready:1,year:null,url:'',secondary_url:'',image:'',details:'',instructions:'',allocated:0,received:0,sent:0};
export function createDemoState():DemoState{
 const gifts:DemoGift[]=[
  {...defaults,id:'custodial',category:'invest',title:'Investment account',description:'A little head start for his future. Try an example contribution.',price:0,group_gift:1},
  {...defaults,id:'trump',category:'invest',title:'Trump account',description:'A sample annual goal for the demo. Contributions here are examples only.',price:500000,group_gift:1,outside:100000},
  {...defaults,id:'529',category:'invest',title:'College fund · 529',description:'This sample fund is complete. The maxed-out state keeps the next action clear.',price:1000000,group_gift:1,outside:1000000},
  ...[{catalog:toyCatalog,category:'toys'},{catalog:clothingCatalog,category:'clothes'},{catalog:miscCatalog,category:'misc'}].flatMap(({catalog,category})=>catalog.filter(g=>!g.id.startsWith('misc-gerber')).map(g=>({...defaults,...g,category,details:g.details??'',instructions:''})))
 ];
 const sample=gifts.find(g=>g.id==='toy-peekaboo-dog')!;
 sample.allocated=sample.price;sample.sent=sample.price;
 return {gifts,claims:[{id:'sample-purchase',gift:sample.id,name:'Sample guest',title:sample.title,amount:sample.price,status:'sent',expires:0,url:sample.url,secondary_url:'',instructions:'',group_gift:0}]};
}
export function demoPurchase(state:DemoState,input:{id:string;gift:string;name:string;amount:number}){
 const gift=state.gifts.find(g=>g.id===input.gift);
 if(!gift||!gift.ready)throw new Error('This sample gift is unavailable.');
 if(!input.name.trim()||input.name.length>80)throw new Error('Enter a name of up to 80 characters.');
 if(!Number.isSafeInteger(input.amount)||input.amount<=0)throw new Error('Enter a valid amount.');
 if(state.claims.some(c=>c.id===input.id))return;
 const left=gift.price-gift.outside-gift.allocated;
 if(gift.id==='529'||(gift.price&&input.amount>left))throw new Error('This sample gift is already taken.');
 if(!gift.group_gift&&input.amount!==gift.price)throw new Error('Mark the whole sample gift purchased.');
 gift.allocated+=input.amount;gift.sent+=input.amount;
 state.claims.push({...input,name:input.name.trim(),title:gift.title,status:'sent',expires:0,url:gift.url,secondary_url:'',instructions:'',group_gift:gift.group_gift});
}
export function demoOwnerChange(state:DemoState,input:Record<string,unknown>){
 if(input.gift){const gift=input.gift as DemoGift;if(!gift.title?.trim())throw new Error('Enter a gift name.');const index=state.gifts.findIndex(g=>g.id===gift.id);if(index>=0)state.gifts[index]={...gift};else state.gifts.push({...gift,id:crypto.randomUUID()});return;}
 if(input.action==='remove'||input.action==='delete'){state.gifts=state.gifts.filter(g=>g.id!==input.id);return;}
 if(input.action==='restore'){const original=createDemoState().gifts.find(g=>g.id===input.id);if(original&&!state.gifts.some(g=>g.id===original.id))state.gifts.push(original);return;}
 if(input.action==='claim'){
  const claim=state.claims.find(c=>c.id===input.id);if(!claim)return;
  const gift=state.gifts.find(g=>g.id===claim.gift);
  if(input.status==='cancelled'&&claim.status!=='cancelled'&&gift){gift.allocated-=claim.amount;if(claim.status==='sent')gift.sent-=claim.amount;if(claim.status==='received')gift.received-=claim.amount;}
  if(input.status==='received'&&claim.status==='sent'&&gift){gift.sent-=claim.amount;gift.received+=claim.amount;}
  claim.status=String(input.status);
 }
}
