import {z} from 'zod';
import {toyCatalog,clothingCatalog,miscCatalog} from './catalog';
import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '@/app/chatgpt-auth';
export function db():D1Database {const binding=(env as unknown as {DB:D1Database}).DB;if(!binding)throw new Error('Storage unavailable');return binding;}
export async function isAdmin(){const u=await getChatGPTUser();const email=(env as unknown as {ADMIN_EMAIL?:string}).ADMIN_EMAIL;return !!u&&!!email&&u.email.toLowerCase()===email.toLowerCase();}
export const active="(status IN ('sent','received') OR (status='reserved' AND expires>unixepoch()))";
export async function seed(){await db().batch([
 db().prepare("INSERT OR IGNORE INTO gifts (id,category,title,description,price,group_gift,year) VALUES ('trump','invest','Trump account','A gift for his future. The 2026 contribution allowance is shared across family and employer gifts.',500000,1,2026)"),
 db().prepare("INSERT OR IGNORE INTO gifts (id,category,title,description,price,group_gift) VALUES ('529','invest','College fund · 529','Help Carter build his education fund, one holiday gift at a time.',0,1)"),
 db().prepare("INSERT OR IGNORE INTO gifts (id,category,title,description,price,group_gift) VALUES ('custodial','invest','Investment account','Give by Venmo or check. The parent will deposit your gift into Carter’s custodial account.',0,1)")]);
for(const toy of [...toyCatalog.map(g=>({...g,category:'toys'})),...clothingCatalog.map(g=>({...g,category:'clothes'})),...miscCatalog.map(g=>({...g,category:'misc'}))]){await db().batch([
 db().prepare("INSERT OR IGNORE INTO gifts (id,category,title,description,price,ready,group_gift,url,image,details,instructions) SELECT ?,?,?,?,?,1,0,?,?,?,? WHERE NOT EXISTS(SELECT 1 FROM applied_setups WHERE id=?)").bind(toy.id,toy.category,toy.title,toy.description,toy.price,toy.url,toy.image,toy.details,toy.instructions,'catalog:'+toy.id),
 db().prepare('INSERT OR IGNORE INTO applied_setups (id) SELECT ? FROM gifts WHERE id=?').bind('catalog:'+toy.id,toy.id)
]);}
// Replace the two sample puree pouches once, preserving any purchase history.
for(const id of ['misc-gerber-apple','misc-gerber-pear']){const marker='replace-pouches-stonyfield-20261007:'+id;await db().batch([
 db().prepare('UPDATE gifts SET hidden=1 WHERE id=? AND NOT EXISTS(SELECT 1 FROM applied_setups WHERE id=?)').bind(id,marker),
 db().prepare('INSERT OR IGNORE INTO applied_setups(id) VALUES (?)').bind(marker)
]);}
// Remove only the assistant-added freshness wording from persisted gifts, once.
const freshnessFragments=["Please confirm the printed expiry with the seller before ordering. A date after July 2027 would allow use through Carter’s 6–12 month stage. ", " Opened, unheated leftover milk: refrigerate sealed immediately, max. 6°C, and use within 24 hours. Discard feeding leftovers.", " Once opened, use the powder within 3 weeks; keep dry at room temperature. Follow the package preparation instructions.", " For babies under 1, squeeze into a clean spoon or bowl. Refrigerate untouched leftovers within 1 hour; use within 24 hours. Do not save food fed directly from the package.", " Serve from a spoon or bowl. Refrigerate untouched leftovers within 1 hour; use within 24 hours. Do not save food fed directly from the package."];
for(const gift of miscCatalog.filter(g=>g.id.startsWith('misc-hipp-')||g.id.startsWith('misc-gerber-'))){
 const marker='remove-freshness-20261007:'+gift.id;
 const current=await db().prepare('SELECT instructions FROM gifts WHERE id=?').bind(gift.id).first<{instructions:string}>();
 if(!current)continue;
 const cleaned=freshnessFragments.reduce((value,fragment)=>value.replace(fragment,''),current.instructions);
 await db().batch([
  db().prepare('UPDATE gifts SET instructions=? WHERE id=? AND instructions=? AND NOT EXISTS(SELECT 1 FROM applied_setups WHERE id=?)').bind(cleaned,gift.id,current.instructions,marker),
  db().prepare('INSERT OR IGNORE INTO applied_setups(id) SELECT ? FROM gifts WHERE id=? AND instructions=?').bind(marker,gift.id,cleaned)
 ]);
}
const configuration=(env as unknown as {GIFT_SETUP?:string;GIFT_SETUPS?:string});
const setupSchema=z.object({version:z.string().min(1).max(120),id:z.enum(['trump','529','custodial']),url:z.string().url(),outside:z.number().int().min(0),instructions:z.string().max(2000),details:z.string().max(2000).optional(),description:z.string().max(2000).optional(),secondary_url:z.string().url().optional()});
const setups=[...(configuration.GIFT_SETUP?[setupSchema.parse(JSON.parse(configuration.GIFT_SETUP))]:[]),...(configuration.GIFT_SETUPS?z.array(setupSchema).max(10).parse(JSON.parse(configuration.GIFT_SETUPS)):[])];
for(const setup of setups){
const url=safeUrl(setup.url);
await db().batch([
 db().prepare(`UPDATE gifts SET url=?,outside=?,instructions=?,details=COALESCE(?,details),description=COALESCE(?,description),secondary_url=COALESCE(?,secondary_url),ready=1 WHERE id=? AND NOT EXISTS(SELECT 1 FROM applied_setups WHERE id=?) AND (price=0 OR price-? >= COALESCE((SELECT SUM(amount) FROM claims WHERE gift=gifts.id AND ${active}),0))`).bind(url,setup.outside,setup.instructions,setup.details??null,setup.description??null,setup.secondary_url?safeUrl(setup.secondary_url):null,setup.id,setup.version,setup.outside),
 db().prepare('INSERT OR IGNORE INTO applied_setups (id) SELECT ? FROM gifts WHERE id=? AND url=? AND outside=? AND ready=1').bind(setup.version,setup.id,url,setup.outside)
]);
}
const directInstructions=[
 ['trump','Open the contribution link or scan the QR code to give directly to Carter’s Trump account. The contribution page shows the current amount available for this year.'],
 ['529','Give directly using Ugift code DEMO-CODE, or Venmo @your-venmo with the note “Carter Holidays — 529.” You can also give the parent a check, and she will deposit your gift into Carter’s 529.'],
 ['custodial','Venmo @your-venmo with the note “Carter Holidays — custodial investments,” or give the parent a check. The parent will deposit your gift into Carter’s custodial investment account.']
];
for(const [id,instructions] of directInstructions){const marker='winter-gifting-20261007:'+id;await db().batch([
 db().prepare("UPDATE gifts SET instructions=?,description=replace(description,'Christmas','holiday') WHERE id=? AND NOT EXISTS(SELECT 1 FROM applied_setups WHERE id=?)").bind(instructions,id,marker),
 db().prepare('INSERT OR IGNORE INTO applied_setups (id) SELECT ? FROM gifts WHERE id=?').bind(marker,id)
]);}
}

export function session(request:Request){const c=request.headers.get('cookie')?.match(/(?:^|;\s*)carter_session=([a-f0-9]{64})(?:;|$)/)?.[1];return c??Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');}
export async function digest(value:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),b=>b.toString(16).padStart(2,'0')).join('');}
export function json(value:unknown,status=200,cookie?:string){return Response.json(value,{status,headers:{'Cache-Control':'no-store',...(cookie?{'Set-Cookie':`carter_session=${cookie}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=31536000`}:{})}});}
export function sameOrigin(request:Request){const origin=request.headers.get('origin');return !!origin&&origin===new URL(request.url).origin;}
export function safeUrl(value:unknown){if(!value)return '';const u=new URL(String(value));if(u.protocol!=='https:')throw new Error('Links must start with https://');return u.href;}
