<?php
declare(strict_types=1);
require __DIR__.'/bootstrap.php';
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: strict-origin-when-cross-origin');
header('Cache-Control: no-store');
header('Content-Security-Policy: frame-ancestors \'none\'');
$action=(string)($_GET['action']??'session');
$method=$_SERVER['REQUEST_METHOD']??'GET';
if($action==='webhook'){webhook();}
session_start_secure();
if($method==='POST')csrf_guard();
try{
 if($action==='session'&&$method==='GET')json_response(['configured'=>configured(),'user'=>configured()?user():null,'csrf'=>$_SESSION['csrf'],'payment_mode'=>'demo / Stripe test only']);
 if(!configured())api_error('Backend is not configured. Ask the store administrator to finish setup.',503);
 if($action==='catalog'&&$method==='GET'){
   $p=db()->query('SELECT sku,name,description,price_cents FROM products WHERE active=1 ORDER BY id')->fetchAll();
   json_response($p);
 }
 if($action==='register'&&$method==='POST'){
   $in=body_json();$name=clean_text($in['name']??'',120);$email=strtolower(clean_text($in['email']??'',190));$password=(string)($in['password']??'');
   if(strlen($name)<2||!filter_var($email,FILTER_VALIDATE_EMAIL)||strlen($password)<12||strlen($password)>256)api_error('Use a name, valid email and password of at least 12 characters.');
   try{$s=db()->prepare("INSERT INTO users(name,email,password_hash,role) VALUES(?,?,?,'customer')");$s->execute([$name,$email,password_hash($password,PASSWORD_DEFAULT)]);}
   catch(PDOException $e){if($e->getCode()==='23000')api_error('Email already registered',409);throw $e;}
   session_regenerate_id(true);$_SESSION['uid']=(int)db()->lastInsertId();$_SESSION['csrf']=bin2hex(random_bytes(24));json_response(['user'=>user(),'csrf'=>$_SESSION['csrf']],201);
 }
 if($action==='login'&&$method==='POST'){
   $in=body_json();$email=strtolower(clean_text($in['email']??'',190));$password=(string)($in['password']??'');$ip=$_SERVER['REMOTE_ADDR']??'unknown';$key=hash('sha256',$email.'|'.$ip);
   $s=db()->prepare('SELECT COUNT(*) FROM login_attempts WHERE key_hash=? AND attempted_at > DATE_SUB(NOW(),INTERVAL 15 MINUTE)');$s->execute([$key]);if((int)$s->fetchColumn()>=7)api_error('Too many attempts. Try again in 15 minutes.',429);
   $q=db()->prepare('SELECT id,password_hash FROM users WHERE email=?');$q->execute([$email]);$row=$q->fetch();
   if(!$row||!password_verify($password,$row['password_hash'])){
     db()->prepare('INSERT INTO login_attempts(key_hash) VALUES(?)')->execute([$key]);api_error('Incorrect email or password',401);
   }
   db()->prepare('DELETE FROM login_attempts WHERE key_hash=?')->execute([$key]);session_regenerate_id(true);$_SESSION['uid']=(int)$row['id'];$_SESSION['csrf']=bin2hex(random_bytes(24));json_response(['user'=>user(),'csrf'=>$_SESSION['csrf']]);
 }
 if($action==='logout'&&$method==='POST'){$_SESSION=[];session_regenerate_id(true);$_SESSION['csrf']=bin2hex(random_bytes(24));json_response(['logged_out'=>true,'csrf'=>$_SESSION['csrf']]);}
 if($action==='quote'&&$method==='POST'){
   $in=body_json();json_response(cart_quote($in['items']??[],clean_text($in['country']??'CA',2),clean_text($in['province']??'',3),clean_text($in['shipping_method']??'standard',20)));
 }
 if($action==='checkout'&&$method==='POST'){
   $u=must_user();$in=body_json();$country=clean_text($in['country']??'CA',2);$province=strtoupper(clean_text($in['province']??'',3));$postal=clean_text($in['postal_code']??'',20);$address=clean_text($in['address']??'',190);$city=clean_text($in['city']??'',90);$recipient=clean_text($in['recipient']??$u['name'],120);
   if(!preg_match('/^[A-Z]{2}$/',$province)||strlen($postal)<3||strlen($address)<5||strlen($city)<2||strlen($recipient)<2)api_error('Complete the shipping address.');
   $quote=cart_quote($in['items']??[],$country,$province,clean_text($in['shipping_method']??'standard',20));
   $shipping=['recipient'=>$recipient,'address'=>$address,'city'=>$city,'province'=>$province,'postal_code'=>$postal,'country'=>$country];
   $pdo=db();$pdo->beginTransaction();
   try{
    $public='ST-'.strtoupper(bin2hex(random_bytes(5)));$stripeKey=(string)cfg('stripe_test_secret','');$stripeConfigured=str_starts_with($stripeKey,'sk_test_')&&!!cfg('stripe_webhook_secret');
    $mode=$stripeConfigured?'pending':'demo';
    $s=$pdo->prepare('INSERT INTO orders(public_id,user_id,status,payment_status,subtotal_cents,shipping_cents,estimated_tax_cents,total_cents,shipping_method,shipping_json) VALUES(?,?,?,?,?,?,?,?,?,?)');
    $s->execute([$public,$u['id'],$mode,$stripeConfigured?'unpaid':'demo',$quote['subtotal_cents'],$quote['shipping_cents'],$quote['estimated_tax_cents'],$quote['total_cents'],$quote['shipping_method'],json_encode($shipping)]);
    $oid=(int)$pdo->lastInsertId();$items=$pdo->prepare('INSERT INTO order_items(order_id,product_id,variant_id,name,size_us,colorway,finish,materials_json,quantity,price_cents) VALUES(?,?,?,?,?,?,?,?,?,?)');
    foreach($quote['lines'] as $line)$items->execute([$oid,$line['product_id'],$line['variant_id'],$line['name'],$line['size'],$line['color'],$line['finish'],json_encode($line['materials']),$line['quantity'],$line['unit_cents']]);
    $pdo->commit();
   }catch(Throwable $e){$pdo->rollBack();throw $e;}
   if(!$stripeConfigured)json_response(['mode'=>'demo','order_id'=>$public,'message'=>'Demo order saved. No payment collected or goods shipped.','quote'=>$quote],201);
   // Stripe TEST mode only: checkout metadata ties a verified webhook to the server-side order.
   $fields=['mode'=>'payment','success_url'=>(string)cfg('site_url','https://elite-noir.com/STRYDE/').'?checkout=success&order='.$public,'cancel_url'=>(string)cfg('site_url','https://elite-noir.com/STRYDE/').'?checkout=cancelled','customer_email'=>$u['email'],'client_reference_id'=>$public,'metadata[order_id]'=>$public,'payment_method_types[0]'=>'card','expires_at'=>time()+1800];
   $n=0;foreach($quote['lines'] as $line){$pre='line_items['.$n.']';$fields[$pre.'[price_data][currency]']='cad';$fields[$pre.'[price_data][unit_amount]']=$line['unit_cents'];$fields[$pre.'[price_data][product_data][name]']=$line['name'].' / US '.$line['size'].' / '.$line['color'];$fields[$pre.'[quantity]']=$line['quantity'];$n++;}
   if($quote['shipping_cents']){$pre='line_items['.$n++.']';$fields[$pre.'[price_data][currency]']='cad';$fields[$pre.'[price_data][unit_amount]']=$quote['shipping_cents'];$fields[$pre.'[price_data][product_data][name]']='Shipping / '.$quote['shipping_method'];$fields[$pre.'[quantity]']=1;}
   if($quote['estimated_tax_cents']){$pre='line_items['.$n++.']';$fields[$pre.'[price_data][currency]']='cad';$fields[$pre.'[price_data][unit_amount]']=$quote['estimated_tax_cents'];$fields[$pre.'[price_data][product_data][name]']='Illustrative tax estimate (test mode only)';$fields[$pre.'[quantity]']=1;}
   if(!function_exists('curl_init'))api_error('PHP cURL extension required for Stripe',503);
   $ch=curl_init('https://api.stripe.com/v1/checkout/sessions');curl_setopt_array($ch,[CURLOPT_POST=>true,CURLOPT_POSTFIELDS=>http_build_query($fields),CURLOPT_RETURNTRANSFER=>true,CURLOPT_HTTPHEADER=>['Authorization: Bearer '.$stripeKey,'Content-Type: application/x-www-form-urlencoded'],CURLOPT_TIMEOUT=>20]);
   $result=curl_exec($ch);$code=curl_getinfo($ch,CURLINFO_HTTP_CODE);curl_close($ch);$session=json_decode($result?:'{}',true);
   if($code<200||$code>=300||empty($session['id'])||empty($session['url'])){
      db()->prepare("UPDATE orders SET status='checkout_error' WHERE id=?")->execute([$oid]);api_error('Payment provider could not start test checkout. Try again later.',502);
   }
   db()->prepare('UPDATE orders SET stripe_session_id=? WHERE id=?')->execute([$session['id'],$oid]);json_response(['mode'=>'stripe_test','order_id'=>$public,'url'=>$session['url'],'quote'=>$quote]);
 }
 if($action==='orders'&&$method==='GET'){
   $u=must_user();$s=db()->prepare('SELECT id,public_id,status,payment_status,total_cents,shipping_method,shipping_json,tracking_carrier,tracking_number,created_at FROM orders WHERE user_id=? ORDER BY id DESC LIMIT 50');$s->execute([$u['id']]);$orders=$s->fetchAll();
   $items=db()->prepare('SELECT name,size_us,colorway,finish,quantity,price_cents FROM order_items WHERE order_id=?');foreach($orders as &$o){$items->execute([$o['id']]);$o['items']=$items->fetchAll();$o['shipping']=json_decode($o['shipping_json'],true);unset($o['shipping_json'],$o['id']);}unset($o);json_response($orders);
 }
 if($action==='admin_dashboard'&&$method==='GET'){
   must_admin();$stats=db()->query("SELECT COUNT(*) order_count,COALESCE(SUM(CASE WHEN payment_status='paid' THEN total_cents ELSE 0 END),0) revenue_cents FROM orders")->fetch();$stats['customers']=(int)db()->query("SELECT COUNT(*) FROM users WHERE role='customer'")->fetchColumn();$stats['products']=(int)db()->query('SELECT COUNT(*) FROM products')->fetchColumn();json_response($stats);
 }
 if($action==='admin_settings'&&$method==='GET'){
   must_admin();json_response(['standard_cents'=>(int)store_setting('shipping_standard_cents',1500),'express_cents'=>(int)store_setting('shipping_express_cents',2900),'free_threshold_cents'=>(int)store_setting('free_shipping_threshold_cents',15000),'estimated_tax_rates'=>json_decode((string)store_setting('estimated_tax_rates','{}'),true)?:['BC'=>.12,'ON'=>.13,'AB'=>.05],'note'=>'Illustrative rates: do not use these as legal tax determinations.']);
 }
 if($action==='admin_settings'&&$method==='POST'){
   must_admin();$in=body_json();$entries=['shipping_standard_cents'=>'standard_cents','shipping_express_cents'=>'express_cents','free_shipping_threshold_cents'=>'free_threshold_cents'];
   foreach($entries as $key=>$field){$value=filter_var($in[$field]??null,FILTER_VALIDATE_INT);if($value===false||$value<0||$value>100000)api_error('Invalid shipping setting');$q=db()->prepare('INSERT INTO store_settings(setting_key,setting_value) VALUES(?,?) ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value)');$q->execute([$key,(string)$value]);}
   if(isset($in['estimated_tax_rates'])){$rates=$in['estimated_tax_rates'];if(!is_array($rates))api_error('Invalid tax estimates');foreach($rates as $province=>$rate)if(!preg_match('/^[A-Z]{2}$/',(string)$province)||!is_numeric($rate)||$rate<0||$rate>.3)api_error('Invalid provincial tax estimate');db()->prepare('INSERT INTO store_settings(setting_key,setting_value) VALUES(?,?) ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value)')->execute(['estimated_tax_rates',json_encode($rates)]);}
   json_response(['updated'=>true]);
 }
 if($action==='admin_products'&&$method==='GET'){
   must_admin();$rows=db()->query('SELECT p.id,p.sku,p.name,p.price_cents,p.active,v.id variant_id,v.size_us,v.colorway,v.stock FROM products p LEFT JOIN variants v ON v.product_id=p.id ORDER BY p.id,v.colorway,v.size_us')->fetchAll();json_response($rows);
 }
 if($action==='admin_products'&&$method==='POST'){
   must_admin();$in=body_json();$sku=clean_text($in['sku']??'',40);$name=clean_text($in['name']??'',120);$price=filter_var($in['price_cents']??null,FILTER_VALIDATE_INT);
   if(!$sku||!$name||$price===false||$price<0||$price>2000000)api_error('Invalid product');
   $s=db()->prepare('UPDATE products SET name=?,price_cents=?,active=? WHERE sku=?');$s->execute([$name,$price,empty($in['active'])?0:1,$sku]);json_response(['updated'=>$s->rowCount()]);
 }
 if($action==='admin_stock'&&$method==='POST'){
   must_admin();$in=body_json();$id=filter_var($in['variant_id']??null,FILTER_VALIDATE_INT);$stock=filter_var($in['stock']??null,FILTER_VALIDATE_INT);
   if(!$id||$stock===false||$stock<0||$stock>100000)api_error('Invalid inventory');$q=db()->prepare('UPDATE variants SET stock=? WHERE id=?');$q->execute([$stock,$id]);json_response(['updated'=>$q->rowCount()]);
 }
 if($action==='admin_orders'&&$method==='GET'){
   must_admin();$q=db()->query('SELECT o.id,o.public_id,o.status,o.payment_status,o.total_cents,o.shipping_json,o.tracking_carrier,o.tracking_number,o.created_at,u.email customer_email FROM orders o JOIN users u ON u.id=o.user_id ORDER BY o.id DESC LIMIT 100');$rows=$q->fetchAll();foreach($rows as &$o){$o['shipping']=json_decode($o['shipping_json'],true);unset($o['shipping_json']);}unset($o);json_response($rows);
 }
 if($action==='admin_order_update'&&$method==='POST'){
   must_admin();$in=body_json();$id=filter_var($in['id']??null,FILTER_VALIDATE_INT);$status=clean_text($in['status']??'',25);$carrier=clean_text($in['tracking_carrier']??'',80);$tracking=clean_text($in['tracking_number']??'',140);
   if(!$id||!in_array($status,['processing','shipped','delivered','cancelled','manual_review','demo'],true))api_error('Invalid order status');
   $query=db()->prepare('SELECT payment_status FROM orders WHERE id=?');$query->execute([$id]);$payment=$query->fetchColumn();if($payment===false)api_error('Order not found',404);
   if($payment!=='paid'&&!in_array($status,['cancelled','demo','manual_review'],true))api_error('Unpaid/demo orders cannot be fulfilled.');
   db()->prepare('UPDATE orders SET status=?,tracking_carrier=?,tracking_number=? WHERE id=?')->execute([$status,$carrier?:null,$tracking?:null,$id]);json_response(['updated'=>true]);
 }
 api_error('Unknown API action',404);
}catch(PDOException $e){error_log('STRYDE database error: '.$e->getMessage());api_error('Database error. Please contact support.',500);}catch(Throwable $e){error_log('STRYDE API error: '.$e->getMessage());api_error('Service error. Please try again.',500);}
function webhook(): never {
 $raw=file_get_contents('php://input');$secret=(string)cfg('stripe_webhook_secret');$sig=$_SERVER['HTTP_STRIPE_SIGNATURE']??'';
 if(!$secret||!$sig||!preg_match('/(?:^|,)t=(\d+)/',$sig,$m))api_error('Webhook unauthorized',400);
 $t=(int)$m[1];if(abs(time()-$t)>300)api_error('Webhook timestamp out of range',400);
 $valid=false;foreach(explode(',',$sig) as $part){if(str_starts_with($part,'v1=')&&hash_equals(substr($part,3),hash_hmac('sha256',$t.'.'.$raw,$secret)))$valid=true;}
 if(!$valid)api_error('Bad webhook signature',400);
 $event=json_decode($raw,true);if(!is_array($event))api_error('Invalid event',400);
 if(($event['type']??'')!=='checkout.session.completed')json_response(['ignored'=>true]);
 $obj=$event['data']['object']??[];if(($obj['payment_status']??'')!=='paid')json_response(['ignored'=>'unpaid']);$sid=$obj['id']??'';$public=$obj['client_reference_id']??'';
 $pdo=db();$pdo->beginTransaction();
 try{
  $s=$pdo->prepare('SELECT id,payment_status FROM orders WHERE public_id=? AND stripe_session_id=? FOR UPDATE');$s->execute([$public,$sid]);$order=$s->fetch();if(!$order){$pdo->rollBack();api_error('Order mismatch',404);}
  if($order['payment_status']==='paid'){$pdo->commit();json_response(['duplicate'=>true]);}
  $q=$pdo->prepare('SELECT variant_id,quantity FROM order_items WHERE order_id=?');$q->execute([$order['id']]);$items=$q->fetchAll();
  $review=false;$grouped=[];foreach($items as $item)$grouped[$item['variant_id']]=($grouped[$item['variant_id']]??0)+(int)$item['quantity'];
  foreach($grouped as $variantId=>$quantity){$v=$pdo->prepare('SELECT stock FROM variants WHERE id=? FOR UPDATE');$v->execute([$variantId]);if((int)$v->fetchColumn()<$quantity)$review=true;}
  if(!$review)foreach($grouped as $variantId=>$quantity){$pdo->prepare('UPDATE variants SET stock=stock-? WHERE id=?')->execute([$quantity,$variantId]);}
  $pdo->prepare('UPDATE orders SET payment_status=?,status=? WHERE id=?')->execute(['paid',$review?'manual_review':'processing',$order['id']]);$pdo->commit();json_response(['recorded'=>true,'manual_review'=>$review]);
 }catch(Throwable $e){if($pdo->inTransaction())$pdo->rollBack();error_log('STRYDE webhook error: '.$e->getMessage());api_error('Webhook processing failed',500);}
}
