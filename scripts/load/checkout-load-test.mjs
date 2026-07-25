const endpoint=process.env.SIDRA_CHECKOUT_TEST_ENDPOINT;
const concurrency=Number(process.env.CONCURRENCY??100);
const total=Number(process.env.REQUESTS??concurrency);
if(!endpoint) throw new Error("SIDRA_CHECKOUT_TEST_ENDPOINT is required. Use staging only.");
const orderKeys=Array.from({length:total},(_,i)=>`phase13-${Date.now()}-${i}`);
const started=Date.now();
const results=await Promise.all(orderKeys.map(async(idempotencyKey)=>{const response=await fetch(endpoint,{method:"POST",headers:{"content-type":"application/json","x-sidra-load-test":"true"},body:JSON.stringify({idempotencyKey,scenario:"concurrentCheckoutIntegrity"})});return {idempotencyKey,status:response.status,body:await response.text()};}));
const successful=results.filter(x=>x.status>=200&&x.status<300);const duplicates=new Set();const seen=new Set();for(const item of successful){if(seen.has(item.body))duplicates.add(item.body);seen.add(item.body);}console.log(JSON.stringify({concurrency,total,durationMs:Date.now()-started,successful:successful.length,failed:results.length-successful.length,duplicateResponseBodies:duplicates.size},null,2));if(duplicates.size>0)process.exitCode=1;
