<?php
declare(strict_types=1);
require __DIR__.'/bootstrap.php';
if(PHP_SAPI!=='cli')exit('CLI only');
$cmd=$argv[1]??'';$pdo=db();
if($cmd==='migrate'){
 $script=file_get_contents(__DIR__.'/schema.sql');
 foreach(explode(';',$script) as $query){if(trim($query))$pdo->exec($query);}
 echo "Database schema installed.\n";
}else if($cmd==='seed'){
 $products=[['aerodyne','AERODYNE ONE',22000],['volt','VOLT PRO',24500],['nexus','NEXUS',21000],['phantom','PHANTOM',23000]];
 foreach($products as [$sku,$name,$price]){
   $pdo->prepare('INSERT INTO products(sku,name,description,price_cents) VALUES(?,?,?,?) ON DUPLICATE KEY UPDATE name=VALUES(name)')->execute([$sku,$name,'STRYDE experimental portfolio collection',$price]);
   $q=$pdo->prepare('SELECT id FROM products WHERE sku=?');$q->execute([$sku]);$pid=(int)$q->fetchColumn();
   $color=['aerodyne'=>'solar','volt'=>'solar','nexus'=>'ice','phantom'=>'violet'][$sku];
   foreach(['7','8','9','10','11','12'] as $size){$pdo->prepare('INSERT IGNORE INTO variants(product_id,size_us,colorway,stock) VALUES(?,?,?,?)')->execute([$pid,$size,$color,10]);}
   if($sku==='aerodyne')foreach(['ice','volt','violet'] as $color)foreach(['7','8','9','10','11','12'] as $size){$pdo->prepare('INSERT IGNORE INTO variants(product_id,size_us,colorway,stock) VALUES(?,?,?,?)')->execute([$pid,$size,$color,10]);}
 }
 echo "Demo catalog seeded. Inventory is simulated, NOT physical stock.\n";
}else if($cmd==='admin'){
 $email=strtolower(trim((string)($argv[2]??'')));if(!filter_var($email,FILTER_VALIDATE_EMAIL))exit("Usage: php api/cli.php admin email@example.com\n");
 fwrite(STDOUT,"Admin name: ");$name=trim((string)fgets(STDIN));
 fwrite(STDOUT,"Admin password: ");if(function_exists("system") && function_exists("stream_isatty") && stream_isatty(STDIN)) {system("stty -echo");$pw=trim((string)fgets(STDIN));system("stty echo");echo "\n";} else {$pw=trim((string)fgets(STDIN));}
 if(strlen($pw)<12)exit("Password must contain at least 12 characters.\n");
 $pdo->prepare("INSERT INTO users(name,email,password_hash,role) VALUES(?,?,?,'admin') ON DUPLICATE KEY UPDATE password_hash=VALUES(password_hash),role='admin'")->execute([$name,$email,password_hash($pw,PASSWORD_DEFAULT)]);
 echo "Admin created. Remove terminal history if credentials were recorded.\n";
}else echo "Usage: php api/cli.php migrate|seed|admin <email>\n";
