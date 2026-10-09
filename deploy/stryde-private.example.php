<?php
/* COPY this example to ~/stryde-private.php (outside public_html).
   Never commit real values or put this file inside the web root. */
return [
    'base_path' => '/STRYDE',
    'site_url' => 'https://elite-noir.com/STRYDE/',
    'db_host' => 'localhost',
    'db_port' => 3306,
    'db_name' => 'CPANEL_DATABASE_NAME',
    'db_user' => 'CPANEL_DATABASE_USER',
    'db_password' => 'REPLACE_WITH_STRONG_PASSWORD',
    // Leave blank for safe demo checkout (no money collected)
    'stripe_test_secret' => '', // sk_test_...
    'stripe_webhook_secret' => '', // whsec_...
];
