import sqlite3, pathlib, re, tempfile, concurrent.futures, time
root=pathlib.Path(__file__).resolve().parents[1]
sql=''.join(p.read_text() for p in sorted((root/'drizzle').glob('*.sql')))
source=(root/'app/api/claims/route.ts').read_text()
active=re.search(r'export const active="([^"]+)"', (root/'lib/registry.ts').read_text()).group(1)
query=re.search(r'const query=`([^`]+)`',source).group(1).replace('${active}',active)
with tempfile.TemporaryDirectory() as tmp:
 path=tmp+'/claims.db'
 conn=sqlite3.connect(path);conn.executescript(sql)
 conn.execute("INSERT INTO gifts(id,category,title,description,price,ready,group_gift,outside,year) VALUES('trump','toys','Trump','',500000,1,1,100000,2026)")
 conn.execute("INSERT INTO gifts(id,category,title,description,price,ready,group_gift) VALUES('toy','toys','Toy','',5000,1,0)")
 conn.commit()
 def reserve(n,gift,amount):
  c=sqlite3.connect(path,timeout=10)
  try:
   r=c.execute(query,(str(n),'session','Family',amount,gift,2026,amount,amount));c.commit();return r.rowcount
  finally:c.close()
 with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
  result=list(pool.map(lambda n:reserve(n,'trump',200000),range(8)))
 assert sum(result)==2,result
 assert reserve(20,'trump',1)==0
 conn.execute("INSERT INTO gifts(id,category,title,description,price,ready,group_gift) VALUES('money','invest','Money','',0,1,1)");conn.commit()
 assert reserve(21,'money',1000)==0
 assert conn.execute('SELECT SUM(amount) FROM claims').fetchone()[0]==400000
 with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
  result=list(pool.map(lambda n:reserve(n+30,'toy',5000),range(8)))
 assert sum(result)==1,result
 assert reserve(50,'toy',1000)==0
 conn.execute("UPDATE claims SET status='reserved',expires=0 WHERE gift='toy'");conn.commit()
 assert reserve(51,'toy',5000)==1
 conn.execute("UPDATE claims SET status='sent',expires=0 WHERE id='51'");conn.commit()
 assert reserve(52,'toy',5000)==0
 conn.execute("UPDATE claims SET status='cancelled' WHERE id='51'");conn.commit()
 assert reserve(53,'toy',5000)==1
 conn.execute("UPDATE gifts SET ready=0 WHERE id='toy'");conn.commit()
 assert reserve(54,'toy',5000)==0
 print('PASS: post-purchase recording, no investment claims, simultaneous claims, dollar cap, outside contributions, whole-gift enforcement, expiry, sent gift capacity, cancellation, disabled gifts')
