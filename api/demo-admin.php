<?php
declare(strict_types=1);
if(PHP_SAPI!=='cli'){http_response_code(404);exit;}
require __DIR__.'/demo.php';
$email=strtolower(trim((string)($argv[1]??'')));
if(!filter_var($email,FILTER_VALIDATE_EMAIL)){fwrite(STDERR,"Usage: php api/demo-admin.php owner@example.com\n");exit(1);}
try{$db=demo_db();}catch(Throwable $e){fwrite(STDERR,$e->getMessage()."\n");exit(1);}
echo 'Admin name: ';$name=trim((string)fgets(STDIN));
if(strlen($name)<2||strlen($name)>120){fwrite(STDERR,"Invalid admin name\n");exit(1);}
echo 'Admin password (12+ characters): ';
$tty=function_exists('posix_isatty')&&posix_isatty(STDIN);
if($tty&&function_exists('shell_exec'))shell_exec('stty -echo');
try{$password=rtrim((string)fgets(STDIN),"\r\n");}finally{if($tty&&function_exists('shell_exec')){shell_exec('stty echo');echo "\n";}}
if(strlen($password)<12){fwrite(STDERR,"Password must be 12+ characters\n");exit(1);}
$db->prepare("INSERT INTO users(name,email,password_hash,role) VALUES(?,?,?,'admin') ON CONFLICT(email) DO UPDATE SET name=excluded.name,password_hash=excluded.password_hash,role='admin'")->execute([$name,$email,password_hash($password,PASSWORD_DEFAULT)]);
echo "Admin ready. Sign in through the storefront, then open /STRYDE/admin/.\n";