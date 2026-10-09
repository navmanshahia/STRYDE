<?php
declare(strict_types=1);
/* STRYDE private config lives OUTSIDE public_html: ~/stryde-private.php */
$configPath = dirname(__DIR__, 3) . '/stryde-private.php';
$config = is_file($configPath) ? require $configPath : [];
if (!is_array($config)) $config=[];
function cfg(string $key, mixed $default=null): mixed {
    global $config;
    $env=getenv('STRYDE_'.strtoupper($key));
    return $env!==false ? $env : ($config[$key]??$default);
}
function configured(): bool {return (bool)(cfg('db_host')&&cfg('db_name')&&cfg('db_user'));}
function db(): PDO {
    static $pdo=null;
    if($pdo!==null) return $pdo;
    if(!configured()) throw new RuntimeException('Backend needs database configuration. Follow SETUP.md.');
    $pdo=new PDO('mysql:host='.cfg('db_host').';port='.((int)cfg('db_port',3306)).';dbname='.cfg('db_name').';charset=utf8mb4',(string)cfg('db_user'),(string)cfg('db_password'),[
        PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES=>false,
    ]);
    return $pdo;
}
function session_start_secure(): void {
    if(session_status()===PHP_SESSION_ACTIVE)return;
    $https=(!empty($_SERVER['HTTPS'])&&$_SERVER['HTTPS']!=='off')||($_SERVER['HTTP_X_FORWARDED_PROTO']??'')==='https';
    session_name('STRYDESESSID');
    session_set_cookie_params(['lifetime'=>0,'path'=>(string)cfg('base_path','/STRYDE').'/','secure'=>$https,'httponly'=>true,'samesite'=>'Lax']);
    session_start();
    if(!isset($_SESSION['csrf']))$_SESSION['csrf']=bin2hex(random_bytes(24));
}
function api_error(string $message,int $status=400): never {http_response_code($status); header('Content-Type: application/json; charset=utf-8');echo json_encode(['ok'=>false,'error'=>$message],JSON_UNESCAPED_SLASHES);exit;}
function json_response(mixed $data,int $status=200): never {http_response_code($status);header('Content-Type: application/json; charset=utf-8');header('Cache-Control: no-store');echo json_encode(['ok'=>true,'data'=>$data],JSON_UNESCAPED_SLASHES|JSON_INVALID_UTF8_SUBSTITUTE);exit;}
function body_json(): array {if((int)($_SERVER['CONTENT_LENGTH']??0)>65536)api_error('Request too large',413);$raw=file_get_contents('php://input');$data=json_decode($raw?:'{}',true);if(!is_array($data))api_error('Invalid JSON');return $data;}
function csrf_guard(): void {session_start_secure();$csrf=$_SERVER['HTTP_X_CSRF_TOKEN']??'';if(!is_string($csrf)||!hash_equals((string)$_SESSION['csrf'],$csrf))api_error('Session expired. Refresh and retry.',419);}
function user(): ?array {session_start_secure();if(empty($_SESSION['uid']))return null;$s=db()->prepare('SELECT id,email,name,role,created_at FROM users WHERE id=? LIMIT 1');$s->execute([$_SESSION['uid']]);return $s->fetch()?:null;}
function must_user(): array {$u=user();if(!$u)api_error('Please sign in.',401);return $u;}
function must_admin(): array {$u=must_user();if($u['role']!=='admin')api_error('Administrator only.',403);return $u;}
function clean_text(mixed $v,int $max=160): string {return mb_substr(trim((string)($v??'')),0,$max);}
function money(int $cents): string {return '$'.number_format($cents/100,2);}
function store_setting(string $key, mixed $default): mixed {
  try {$q=db()->prepare('SELECT setting_value FROM store_settings WHERE setting_key=?');$q->execute([$key]);$val=$q->fetchColumn();return $val!==false ? $val : $default;}
  catch (Throwable $e) {return $default;}
}
function provincial_rate(string $province): float {
   $defaults=['AB'=>.05,'BC'=>.12,'MB'=>.12,'NB'=>.15,'NL'=>.15,'NS'=>.14,'NT'=>.05,'NU'=>.05,'ON'=>.13,'PE'=>.15,'QC'=>.14975,'SK'=>.11,'YT'=>.05];
   $rates=json_decode((string)store_setting('estimated_tax_rates',json_encode($defaults)),true);
   return (float)($rates[strtoupper($province)]??.05);
}
function cart_quote(array $lines,string $country,string $province,string $method='standard'): array {
    if($country!=='CA')api_error('This demo currently ships only to Canada.');
    if(!in_array($method,['standard','express'],true))api_error('Invalid shipping method');
    if(count($lines)<1||count($lines)>30)api_error('Your bag is empty or too large.');
    $pdo=db();$rows=[];$subtotal=0;$variantTotals=[];$variantStocks=[];
    $select=$pdo->prepare('SELECT p.id,p.name,p.price_cents,p.active,v.id variant_id,v.stock FROM products p JOIN variants v ON v.product_id=p.id WHERE p.sku=? AND v.size_us=? AND v.colorway=? AND p.active=1');
    foreach($lines as $line){
      if(!is_array($line))api_error('Invalid bag');
      $sku=clean_text($line['id']??'',32);$size=clean_text($line['size']??'',5);$color=clean_text($line['color']??'solar',20);$qty=filter_var($line['qty']??null,FILTER_VALIDATE_INT);
      if(!$qty||$qty<1||$qty>10||!in_array($size,['7','8','9','10','11','12'],true))api_error('Choose a valid size and quantity');
      $select->execute([$sku,$size,$color]);$p=$select->fetch();if(!$p)api_error('An item is no longer available.');if((int)$p['stock']<$qty)api_error($p['name'].' is out of stock in US '.$size);
      $materials=$line['materials']??null;
      if($materials!==null && !is_array($materials))api_error('Invalid customization');
      $custom=[];foreach(['upper','laces','sole'] as $k){if(isset($materials[$k]))$custom[$k]=clean_text($materials[$k],25);}
      $finish=clean_text($line['finish']??'reflective',20);
      if(!in_array($finish,['reflective','matte'],true))api_error('Invalid finish');
      $variantTotals[(int)$p['variant_id']]=($variantTotals[(int)$p['variant_id']]??0)+$qty;
      $variantStocks[(int)$p['variant_id']]=(int)$p['stock'];
      $subtotal+=(int)$p['price_cents']*$qty;
      $rows[]=['product_id'=>(int)$p['id'],'variant_id'=>(int)$p['variant_id'],'name'=>$p['name'],'sku'=>$sku,'size'=>$size,'color'=>$color,'finish'=>$finish,'materials'=>$custom,'quantity'=>$qty,'unit_cents'=>(int)$p['price_cents']];
    }
    foreach($variantTotals as $id=>$quantity)if($quantity>$variantStocks[$id])api_error('Requested quantity exceeds available stock.');
    if($subtotal>2000000)api_error('Order amount exceeds demo limit');
       $threshold=(int)store_setting('free_shipping_threshold_cents',15000);$standard=(int)store_setting('shipping_standard_cents',1500);$express=(int)store_setting('shipping_express_cents',2900);
   $shipping=$method==='express'?$express:($subtotal>=$threshold?0:$standard);
    // Estimates only. Rates and exemptions must be verified before accepting live payments.
    $tax=(int)round(($subtotal+$shipping)*provincial_rate($province));
    return ['currency'=>'cad','lines'=>$rows,'subtotal_cents'=>$subtotal,'shipping_cents'=>$shipping,'estimated_tax_cents'=>$tax,'total_cents'=>$subtotal+$shipping+$tax,'shipping_method'=>$method,'tax_disclaimer'=>'Illustrative Canadian sales-tax estimate; not a tax determination. Configure Stripe Tax and verify obligations before live sales.'];
}
