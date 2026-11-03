const enc = new TextEncoder();
export class HttpError extends Error {constructor(status,message){super(message);this.status=status;}}
export const fail=(status,message)=>{throw new HttpError(status,message);};
export const now=()=>Date.now();
export const id=()=>crypto.randomUUID();
const hex=b=>Array.from(new Uint8Array(b),x=>x.toString(16).padStart(2,'0')).join('');
export const sha=async value=>hex(await crypto.subtle.digest('SHA-256',enc.encode(value)));
export async function sign(secret,text){const key=await crypto.subtle.importKey('raw',enc.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);return hex(await crypto.subtle.sign('HMAC',key,enc.encode(text)));}
export async function validSignature(secret,text,signature){if(!/^[a-f0-9]{64}$/i.test(signature||''))return false;const key=await crypto.subtle.importKey('raw',enc.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['verify']);const bytes=Uint8Array.from(signature.match(/../g),x=>parseInt(x,16));return crypto.subtle.verify('HMAC',key,bytes,enc.encode(text));}
export function text(value,label,min=1,max=200){if(typeof value!=='string'||value.trim().length<min||value.trim().length>max)fail(400,`Please check ${label}.`);return value.trim();}
export function customerInput(c={}){if(!c||typeof c!=='object'||Array.isArray(c))fail(400,'Enter valid delivery details.');const value={name:text(c.name,'name',2,80),email:text(c.email,'email',5,150).toLowerCase(),phone:text(c.phone,'phone',10,16),address:text(c.address,'address',8,240),city:text(c.city,'city',2,80),state:text(c.state,'state',2,80),pincode:text(c.pincode,'PIN code',6,6),country:'IN'};if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email)||!/^\+?[0-9]{10,15}$/.test(value.phone)||!/^[1-9][0-9]{5}$/.test(value.pincode))fail(400,'Enter a valid email, phone number and Indian PIN code.');return value;}
export function shippingCost(customer,subtotal,env){let rule;try{rule=JSON.parse(env.SHIPPING_RULES||'null');}catch{}if(!rule||!Array.isArray(rule.states)||!rule.states.length||!Number.isSafeInteger(rule.flatPaise)||rule.flatPaise<0)fail(503,'Delivery charges are not configured yet.');if(!rule.states.includes('*')&&!rule.states.some(s=>s.toLowerCase()===customer.state.toLowerCase()))fail(400,'Delivery is not available to this state.');if(rule.pinPrefixes?.length&&!rule.pinPrefixes.some(p=>customer.pincode.startsWith(p)))fail(400,'Delivery is not available to this PIN code.');return Number.isSafeInteger(rule.freeAbovePaise)&&subtotal>=rule.freeAbovePaise?0:rule.flatPaise;}
export async function catalog(db,includeInactive=false){const r=await db.prepare(`SELECT * FROM products ${includeInactive?'':'WHERE active = 1'} ORDER BY id`).all();return r.results.map(p=>({...JSON.parse(p.data),id:p.id,price:p.price_paise/100,stock:p.stock,active:!!p.active}));}
export function paymentMode(env,local){if(local)return 'demo';if(env.PAYMENTS_ENABLED!=='true')return 'disabled';if(env.RAZORPAY_KEY_ID?.startsWith('rzp_test_')&&env.RAZORPAY_KEY_SECRET)return 'test';if(env.RAZORPAY_KEY_ID?.startsWith('rzp_live_')&&env.RAZORPAY_KEY_SECRET&&env.CATALOG_APPROVED==='true'&&env.POLICIES_APPROVED==='true'&&['SHIPPING_POLICY','RETURNS_POLICY','PRIVACY_POLICY','TERMS_POLICY'].every(key=>typeof env[key]==='string'&&env[key].trim().length>=60))return 'live';return 'disabled';}
export async function gateway(env,path,body,fetcher=fetch){if(!env.RAZORPAY_KEY_ID||!env.RAZORPAY_KEY_SECRET)fail(503,'Payments are not configured.');const r=await fetcher(`https://api.razorpay.com/v1/${path}`,{method:body?'POST':'GET',headers:{Authorization:`Basic ${btoa(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`)}`,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(15000)});if(!r.ok)fail(502,'The payment service could not complete this request. Please retry.');return r.json();}
export async function orderById(db,orderId){return db.prepare('SELECT * FROM orders WHERE id = ?').bind(orderId).first();}
export async function secureOrder(db,orderId,token){const o=await orderById(db,orderId);if(!o||typeof token!=='string'||await sha(token)!==o.access_hash)fail(404,'Order not found. Use your private order link.');return o;}
export async function orderView(db,o,privateData=false){const items=await db.prepare('SELECT * FROM order_items WHERE order_id = ?').bind(o.id).all();return {id:o.id,items:items.results.map(i=>({...JSON.parse(i.snapshot),qty:i.quantity,unitPrice:i.unit_price/100})),subtotal:o.subtotal/100,shipping:o.shipping/100,total:o.total/100,paymentStatus:o.payment_status,status:o.fulfillment_status,mode:o.payment_mode,createdAt:o.created_at,trackingUrl:o.tracking_url,courier:o.courier,trackingNumber:o.tracking_number,...(privateData?{customer:JSON.parse(o.customer),giftNote:o.gift_note}: {})};}
export async function checkout(db,env,input,local=false){
 if(!input||typeof input!=='object'||Array.isArray(input))fail(400,'Invalid checkout request.');if(!env.ORDER_TOKEN_SECRET)fail(503,'Checkout is not configured.');const mode=paymentMode(env,local);if(mode==='disabled')fail(503,'Online orders are not open yet.');
 const attempt=text(input.attempt,'checkout reference',36,36);if(!/^[a-f0-9-]{36}$/i.test(attempt))fail(400,'Invalid checkout reference.');
 const customer=customerInput(input.customer);const giftNote=typeof input.giftNote==='string'?input.giftNote.trim():'';if(giftNote.length>300)fail(400,'Gift message must be under 300 characters.');
 if(!Array.isArray(input.items)||!input.items.length||input.items.length>20)fail(400,'Choose between 1 and 20 items.');
 const token=await sign(env.ORDER_TOKEN_SECRET,attempt);const fingerprint=await sha(JSON.stringify({customer,items:input.items,giftNote}));
 const existing=await db.prepare('SELECT * FROM orders WHERE attempt = ?').bind(attempt).first();
 if(existing){if(existing.fingerprint!==fingerprint)fail(409,'Your checkout changed. Start a new checkout.');if(existing.payment_status==='paid')return {order:await orderView(db,existing),token};if(existing.reservation_status!=='held'||existing.expires_at<now())fail(409,'This checkout expired. Please start again.');return paymentSetup(db,env,existing,token);}
 const products=await catalog(db);const lines=[];let subtotal=0;const combined=new Map();
 for(const item of input.items){const p=products.find(p=>p.id===item.id);if(!p||!Number.isInteger(item.qty)||item.qty<1||item.qty>20||!p.options.includes(item.option))fail(400,'A product, design or quantity is no longer available.');if(mode==='live'&&p.sample)fail(409,'This sample product is not available for purchase.');const qty=(combined.get(p.id)||0)+item.qty;combined.set(p.id,qty);if(qty>20||qty>p.stock)fail(409,`${p.name} does not have enough availability.`);const price=Math.round(p.price*100);subtotal+=price*item.qty;lines.push({p,qty:item.qty,option:item.option,price});}
 if(subtotal>10000000)fail(400,'Please contact us for large orders.');const shipping=shippingCost(customer,subtotal,env),orderId=id(),time=now();
 const statements=[db.prepare('INSERT INTO orders (id,attempt,fingerprint,access_hash,customer,gift_note,subtotal,shipping,total,payment_mode,expires_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(orderId,attempt,fingerprint,await sha(token),JSON.stringify(customer),giftNote,subtotal,shipping,subtotal+shipping,mode,time+20*60000,time,time)];
 for(const line of lines)statements.push(db.prepare('INSERT INTO order_items (id,order_id,product_id,quantity,snapshot,unit_price) VALUES (?,?,?,?,?,?)').bind(id(),orderId,line.p.id,line.qty,JSON.stringify({id:line.p.id,name:line.p.name,image:line.p.image,option:line.option,leadDays:line.p.leadDays}),line.price));
 try{await db.batch(statements);}catch(e){const raced=await db.prepare('SELECT * FROM orders WHERE attempt = ?').bind(attempt).first();if(raced&&raced.fingerprint===fingerprint)return paymentSetup(db,env,raced,token);fail(409,'Availability changed. Refresh your bag and try again.');}
 return paymentSetup(db,env,await orderById(db,orderId),token);
}
async function paymentSetup(db,env,o,token){
 if(o.payment_mode==='demo')return {order:await orderView(db,o),token};
 if(!o.provider_order_id){
  const claimed=await db.prepare("UPDATE orders SET provider_state='creating' WHERE id=? AND provider_state='idle' AND provider_order_id IS NULL AND payment_status='pending' AND reservation_status='held' AND expires_at>?").bind(o.id,now()).run();
  if(!claimed.meta.changes){o=await orderById(db,o.id);if(!o.provider_order_id)fail(409,o.provider_state==='uncertain'?'Payment setup needs owner review. Do not pay again; please contact us.':'Payment checkout is being prepared. Wait a moment and retry.');}
  else {
   try{
    const created=await gateway(env,'orders',{amount:o.total,currency:'INR',receipt:o.id,notes:{store_order_id:o.id}});
    await db.prepare("UPDATE orders SET provider_order_id=?,provider_state='ready' WHERE id=? AND provider_state='creating'").bind(created.id,o.id).run();
    o=await orderById(db,o.id);
   }catch(e){await db.prepare("UPDATE orders SET provider_state='uncertain' WHERE id=? AND provider_state='creating'").bind(o.id).run();throw e;}
  }
 }
 return {order:await orderView(db,o),token,keyId:env.RAZORPAY_KEY_ID,providerOrderId:o.provider_order_id,amount:o.total,currency:'INR'};
}
export async function settle(db,o,paymentId,eventId){
 if(o.provider_payment_id&&o.provider_payment_id!==paymentId)fail(409,'A different payment is already linked.');
 // All updates are conditional on the persisted state, not an earlier read. Duplicate callbacks cannot duplicate fulfillment or stock changes.
 await db.batch([
 db.prepare('INSERT OR IGNORE INTO payment_events (id,order_id,created_at) VALUES (?,?,?)').bind(eventId,o.id,now()),
 db.prepare("UPDATE orders SET payment_status='paid', fulfillment_status=CASE WHEN reservation_status='held' THEN 'confirmed' ELSE 'payment_review' END, reservation_status=CASE WHEN reservation_status='held' THEN 'committed' ELSE reservation_status END, provider_payment_id=?,updated_at=? WHERE id=? AND payment_status='pending' AND (provider_payment_id IS NULL OR provider_payment_id=?)").bind(paymentId,now(),o.id,paymentId),
 db.prepare("INSERT OR IGNORE INTO notification_jobs (id,order_id,kind,next_at) SELECT ?,id,'payment_received',? FROM orders WHERE id=? AND payment_status='paid'").bind(id(),now(),o.id)
 ]);return orderById(db,o.id);
}
export async function verifyPayment(db,env,o,paymentId){if(!/^pay_[a-zA-Z0-9]+$/.test(paymentId||''))fail(400,'Invalid payment reference.');const p=await gateway(env,`payments/${paymentId}`);if(p.order_id!==o.provider_order_id||p.amount!==o.total||p.currency!=='INR')fail(400,'Payment does not match this order.');if(p.status!=='captured')return {pending:true,order:await orderView(db,o)};const updated=await settle(db,o,p.id,`capture:${p.id}`);return {order:await orderView(db,updated)};}
export async function expireReservations(db){const rows=await db.prepare("SELECT id FROM orders WHERE reservation_status='held' AND payment_status='pending' AND expires_at < ? LIMIT 30").bind(now()).all();for(const {id:orderId} of rows.results){
 // Stock restoration and release are one transaction. Repeated/overlapping jobs cannot restore stock twice.
 await db.batch([db.prepare("UPDATE products SET stock=stock+COALESCE((SELECT SUM(quantity) FROM order_items WHERE product_id=products.id AND order_id=?),0) WHERE EXISTS (SELECT 1 FROM orders WHERE id=? AND reservation_status='held' AND payment_status='pending')").bind(orderId,orderId),db.prepare("UPDATE orders SET reservation_status='released',fulfillment_status='expired',updated_at=? WHERE id=? AND reservation_status='held' AND payment_status='pending'").bind(now(),orderId)]);
}}
