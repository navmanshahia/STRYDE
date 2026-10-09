/* STRYDE Commerce OS — progressive enhancement over V3.2 storefront. */
(()=>{'use strict';
const $=s=>document.querySelector(s);const escapeHtml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let session={configured:false,user:null,csrf:''},open=false,screen='account',lastQuote=null;
const api=async (route,body)=>{
 const resp=await fetch('api/index.php?action='+encodeURIComponent(route),{credentials:'same-origin',cache:'no-store',headers:{Accept:'application/json',...(body!==undefined?{'Content-Type':'application/json','X-CSRF-Token':session.csrf}:{})},...(body!==undefined?{method:'POST',body:JSON.stringify(body)}:{})});
 let res;try{res=await resp.json()}catch{throw Error('The commerce server did not return JSON. Check the PHP installation.');}
 if(!resp.ok||!res.ok)throw Error(res.error||'Server unavailable');return res.data;
};
const getBag=()=>{try{const data=JSON.parse(localStorage.getItem('stryde-cart-v1')||'[]');return Array.isArray(data)?data.map(x=>({id:x.id,size:String(x.size),color:x.color||'solar',finish:x.finish||'reflective',materials:x.materials||null,qty:Number(x.qty)})).filter(x=>x.id&&x.size&&x.qty>0):[]}catch{return[]}};
const cash=n=>'C$'+(Number(n)/100).toFixed(2);
const markup=`<div id="commerce-scrim" hidden></div><aside class="commerce-drawer" id="commerce-drawer" role="dialog" aria-modal="true" aria-hidden="true" aria-label="STRYDE customer account and checkout"><header class="commerce-heading"><div><span>STRYDE / COMMERCE OS</span><h2 id="commerce-title">YOUR ACCOUNT</h2></div><button type="button" id="commerce-close" aria-label="Close">×</button></header><div class="commerce-body"><nav class="commerce-tabs"><button type="button" data-commerce-tab="account">Account</button><button type="button" data-commerce-tab="orders">Orders</button><button type="button" data-commerce-tab="checkout">Checkout</button></nav><div id="commerce-content"></div></div><p class="commerce-notice" id="commerce-message" role="status"></p></aside>`;
document.body.insertAdjacentHTML('beforeend',markup);
const panel=$('#commerce-drawer'),container=$('#commerce-content');
const action=document.createElement('button');action.id='commerce-account-trigger';action.type='button';action.className='commerce-header-account';action.innerHTML='<span aria-hidden="true">◉</span> ACCOUNT';
const header=$('.header-actions');if(header)header.prepend(action);
const message=t=>{$('#commerce-message').textContent=t||'';};
function show(tab='account'){open=true;screen=tab;panel.classList.add('visible');panel.setAttribute('aria-hidden','false');$('#commerce-scrim').hidden=false;document.body.classList.add('commerce-open');render();}
function hide(){open=false;panel.classList.remove('visible');panel.setAttribute('aria-hidden','true');$('#commerce-scrim').hidden=true;document.body.classList.remove('commerce-open');}
$('#commerce-close').addEventListener('click',hide);$('#commerce-scrim').addEventListener('click',hide);action.addEventListener('click',()=>show('account'));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&open)hide()});
const oldCheckout=$('#checkout');if(oldCheckout)oldCheckout.addEventListener('click',e=>{e.stopImmediatePropagation();e.preventDefault();const other=$('#cart-drawer');if(other){other.setAttribute('aria-hidden','true');}const shade=$('#scrim');if(shade)shade.hidden=true;document.body.style.overflow='';show('checkout')},true);
const loginForm=reg=>`<form class="commerce-form" data-commerce-form="${reg?'register':'login'}"><h3>${reg?'CREATE AN ACCOUNT':'WELCOME BACK'}</h3>${reg?'<label>Full name<input name="name" required maxlength="120" autocomplete="name"></label>':''}<label>Email<input name="email" type="email" required maxlength="190" autocomplete="email"></label><label>Password<input name="password" type="password" required minlength="12" autocomplete="${reg?'new-password':'current-password'}"></label><button class="commerce-primary" type="submit">${reg?'CREATE ACCOUNT':'SIGN IN'} ↗</button></form><button class="commerce-link" data-auth-switch="${reg?'login':'register'}">${reg?'Already have an account? Sign in':'New to STRYDE? Create an account'}</button>`;
let regMode=false;
async function render(){message('');$$('[data-commerce-tab]').forEach(b=>b.classList.toggle('selected',b.dataset.commerceTab===screen));$('#commerce-title').textContent=({account:'YOUR ACCOUNT',orders:'ORDER HISTORY',checkout:'SECURE CHECKOUT'})[screen];
 if(!session.configured){container.innerHTML='<div class="commerce-empty"><h3>COMMERCE SETUP REQUIRED</h3><p>This portfolio frontend is ready, but the PHP/MySQL backend has not been configured on hosting yet. No customer credentials or payments are collected.</p><p>Ask the administrator to follow <code>SETUP.md</code>.</p></div>';return;}
 if(screen==='account'){
 if(!session.user){container.innerHTML=loginForm(regMode);return;}
 container.innerHTML=`<div class="commerce-profile"><div class="commerce-avatar">S</div><small>CONNECTED ACCOUNT</small><h3>${escapeHtml(session.user.name)}</h3><p>${escapeHtml(session.user.email)}</p>${session.user.role==='admin'?'<a href="admin/" class="commerce-primary commerce-admin-link">OPEN ADMIN DASHBOARD ↗</a>':''}<button type="button" data-logout class="commerce-outline">SIGN OUT</button></div>`;
 }else if(screen==='orders'){
 if(!session.user){container.innerHTML='<p>Please sign in to view your order history.</p>'+loginForm(false);return;}
 container.innerHTML='<p>Loading orders…</p>';try{const orders=await api('orders');container.innerHTML=orders.length?orders.map(o=>`<article class="commerce-order"><small>${escapeHtml(o.public_id)} / ${escapeHtml(o.created_at)}</small><h3>${cash(o.total_cents)} — ${escapeHtml(o.status.toUpperCase())}</h3><p>Payment: ${escapeHtml(o.payment_status)} · ${escapeHtml(o.shipping_method)}</p>${o.items.map(i=>`<p>${escapeHtml(i.name)} · US ${escapeHtml(i.size_us)} · ${escapeHtml(i.colorway)} × ${Number(i.quantity)}</p>`).join('')}${o.tracking_number?`<strong>Tracking: ${escapeHtml(o.tracking_carrier)} / ${escapeHtml(o.tracking_number)}</strong>`:'<span class="muted">No shipping tracking assigned.</span>'}</article>`).join(''):'<div class="commerce-empty"><h3>NO ORDERS YET</h3><p>When you create a demo order, it appears here with its payment status.</p></div>'}catch(e){message(e.message)}
 }else if(screen==='checkout'){
 if(!getBag().length){container.innerHTML='<div class="commerce-empty"><h3>YOUR BAG IS EMPTY</h3><p>Add a sneaker and choose your size first.</p></div>';return;}
 if(!session.user){container.innerHTML='<p>Sign in or create an account to continue checkout.</p>'+loginForm(false);return;}
 container.innerHTML=`<div class="commerce-banner">TEST & DEMO COMMERCE ONLY — NOT ACCEPTING LIVE PAYMENTS</div><form class="commerce-form" data-commerce-form="checkout"><h3>SHIPPING DETAILS</h3><label>Recipient<input name="recipient" autocomplete="name" required value="${escapeHtml(session.user.name)}"></label><label>Street address<input name="address" autocomplete="street-address" required minlength="5"></label><label>City<input name="city" autocomplete="address-level2" required></label><div class="commerce-two"><label>Province<select name="province" required>${['BC','AB','ON','QC','MB','SK','NB','NS','NL','PE','NT','NU','YT'].map(x=>`<option value="${x}">${x}</option>`).join('')}</select></label><label>Postal code<input name="postal_code" autocomplete="postal-code" required minlength="3"></label></div><label>Shipping method<select name="shipping_method"><option value="standard">Standard — C$15 / Free over C$150</option><option value="express">Express — C$29</option></select></label><div id="commerce-quote"><p>Enter your address to calculate your order estimate.</p></div><button class="commerce-primary" type="button" id="commerce-estimate">CALCULATE TOTAL</button><button class="commerce-primary checkout-button" type="submit">CONTINUE TO TEST CHECKOUT ↗</button><p class="commerce-footnote">Tax totals are estimates. No real payment or shipping occurs without separate store configuration and fulfillment.</p></form>`;
 }
}
const $$=s=>Array.from(document.querySelectorAll(s));
$$('[data-commerce-tab]').forEach(b=>b.addEventListener('click',()=>{screen=b.dataset.commerceTab;render()}));
container.addEventListener('click',async e=>{
 const swap=e.target.closest('[data-auth-switch]');if(swap){regMode=swap.dataset.authSwitch==='register';render();return;}
 if(e.target.closest('[data-logout]')){try{session.csrf=(await api('logout',{})).csrf;session.user=null;render()}catch(err){message(err.message)}return;}
 if(e.target.closest('#commerce-estimate')){const f=container.querySelector('[data-commerce-form="checkout"]');await estimate(f)}
});
async function estimate(f){try{const d=Object.fromEntries(new FormData(f));lastQuote=await api('quote',{items:getBag(),country:'CA',province:d.province,shipping_method:d.shipping_method});$('#commerce-quote').innerHTML=`<div class="commerce-estimate"><div><span>Subtotal</span><strong>${cash(lastQuote.subtotal_cents)}</strong></div><div><span>Shipping</span><strong>${cash(lastQuote.shipping_cents)}</strong></div><div><span>Estimated taxes</span><strong>${cash(lastQuote.estimated_tax_cents)}</strong></div><div class="total"><span>Estimated total</span><strong>${cash(lastQuote.total_cents)}</strong></div></div><small>${escapeHtml(lastQuote.tax_disclaimer)}</small>`;message('');return true;}catch(e){message(e.message);return false}}
container.addEventListener('submit',async e=>{e.preventDefault();const f=e.target;if(!f.matches('[data-commerce-form]'))return;const data=Object.fromEntries(new FormData(f));const submit=f.querySelector('[type="submit"]');if(submit)submit.disabled=true;try{
 if(f.dataset.commerceForm==='register'||f.dataset.commerceForm==='login'){const info=await api(f.dataset.commerceForm,data);session.user=info.user;session.csrf=info.csrf;regMode=false;render();}
 else if(f.dataset.commerceForm==='checkout'){
   if(!await estimate(f))return;
   const order=await api('checkout',{...data,country:'CA',items:getBag()});
   if(order.mode==='stripe_test'&&order.url){location.assign(order.url);return;}
   container.innerHTML=`<div class="commerce-success"><h3>DEMO ORDER CREATED</h3><strong>${escapeHtml(order.order_id)}</strong><p>${escapeHtml(order.message)}</p><button class="commerce-primary" data-commerce-go-orders>VIEW ORDERS</button></div>`;
   message('No money was collected.');
 }
 }catch(err){message(err.message)}finally{if(submit)submit.disabled=false}});
container.addEventListener('click',e=>{if(e.target.closest('[data-commerce-go-orders]')){screen='orders';render()}});
api('session').then(s=>{session=s;if(s.configured)api('catalog').then(rows=>window.StrydeCatalog?.update(rows)).catch(()=>{});const params=new URLSearchParams(location.search);if(params.has('checkout'))show('orders')}).catch(e=>{session.configured=false;console.info('STRYDE commerce optional API:',e.message)});
window.STRYDE_COMMERCE={open:show};
})();
