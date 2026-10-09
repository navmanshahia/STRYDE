# STRYDE Commerce OS — install and security guide

**Current release: concept sneaker storefront, simulated stock and demo/test payments only. DO NOT collect real money until the product, tax, fulfillment and security prerequisites are completed.**

## Requirements

- PHP 8.2+ with `pdo_mysql`, `mbstring`, `openssl`, `curl` (for Stripe) and HTTPS
- MySQL 8 / MariaDB with InnoDB; `proc_open`/`shell_exec` not required
- cPanel Git Version Control repository cloned **outside** `public_html`, with the default branch `main`
- Correct write permission for `$HOME/public_html/STRYDE`

## Deploy via Git HEAD

1. Pull/Update the STRYDE repository in **cPanel → Git Version Control**.
2. `.cpanel.yml` runs `deploy/cpanel-deploy.sh`. In cPanel → Manage → Deploy, click **Deploy HEAD Commit**. If the button is still missing, it depends on cPanel Git registration, clean worktree and host permissions; this file cannot enable cPanel features.
3. As an alternative, while in the *Git clone* folder (not `public_html/STRYDE`), run `bash deploy/cpanel-deploy.sh`.
4. The site is copied to `~/public_html/STRYDE`. It does not touch the private config file.

## Configure database + admin

1. In cPanel **MySQL Databases**, create a database/user with privileges. Use a strong DB password.
2. Copy `deploy/stryde-private.example.php` to **`~/stryde-private.php`**, *outside* `public_html`, and set `db_name`, `db_user`, and `db_password`. Never store API keys in a public folder or in Git.
3. Run via cPanel Terminal:

```sh
cd ~/public_html/STRYDE
php api/cli.php migrate
php api/cli.php seed
php api/cli.php admin you@example.com
```

Use a 12+ character unique administrator password. Seeded stock is fictitious. Navigate to your site, click **ACCOUNT** and sign in. Then open `/STRYDE/admin/`. The admin dashboard only allows sessions with role=admin.

## Payment modes

- **Unconfigured Stripe:** Checkout creates an unpaid **demo order** with no charge and no inventory reduction. Logged-in customer order history works.
- **Stripe TEST mode only:** Set `stripe_test_secret=sk_test_...` and `stripe_webhook_secret=whsec_...` in the **private** config. Set the Stripe webhook endpoint to `https://elite-noir.com/STRYDE/api/index.php?action=webhook`; subscribe to `checkout.session.completed`. In test mode, success is recorded only after a verified webhook. This system deliberately rejects live Stripe secret keys.
- **Taxes:** Admin-configured Canadian provincial rates are illustrative estimates. Verify product exemptions, registrations, destination and shipping treatment. For any real launch, use a compliant tax calculation service (such as Stripe Tax) before live payments.
- **Refunds and stock reservation:** Not automated. Payment success decrements stock after a verified webhook; if stock is insufficient, orders enter `manual_review`. Do not enable live orders without a stock-reservation strategy, refund workflows, email verification and complete QA.

## Admin capabilities

- Secure admin-only dashboard `/STRYDE/admin/`
- Manage server-authoritative prices and size/color inventory
- View customers' order shipping information and statuses
- Set tracking carrier and tracking number for verified paid orders only
- Edit demo shipping fees, free-shipping threshold and BC tax estimate

## Important limitations

- Concepts are not actual manufactured products. The available GLB is an unfinished technical study, not a scan of the hero sneaker; the default viewer uses original artwork with a PNG fallback if color WebP is missing.
- Real shipping carrier integration, automated shipping labels, refunds, transactional email, password reset, email verification, GDPR/privacy/legal policies, rate-limit hardening and production payment compliance are **not** included.
- Use HTTPS; disable public debug output; do not put private credentials into static JavaScript or commit them to Git.
- Verify `pdo_mysql` extension and filesystem paths in cPanel's PHP version; not all cPanel hosts expose Git deployment.

## Automatic demo mode (no MySQL or Stripe configuration)

**Default when `~/stryde-private.php` has not been configured:** On the first PHP API request, STRYDE automatically creates the private SQLite database at `~/stryde-demo-private/store.sqlite` (outside `public_html`) and seeds concept sneakers and simulated inventory. Requires PHP `pdo_sqlite` and a writable home directory. This is a **server-backed demo**—accounts and orders persist across browsers, with hashed passwords and secure sessions. Real payment collection remains disabled. Customers can create accounts immediately without administrator action.

To create the administrator securely on your own cPanel Terminal (never add admin passwords to Git or a web URL):

```bash
cd ~/public_html/STRYDE
php api/demo-admin.php owner@example.com
```

The command prompts for a name and a unique 12+ character password. Sign in through **ACCOUNT** and open `/STRYDE/admin/`. Never automatically promote public registrants to admin.

If the website says SQLite support is unavailable, use **cPanel → Select PHP Version → Extensions** to enable `pdo_sqlite` and `sqlite3`, or complete the separate MySQL production setup above. Do not disable password checks or use client-side-only fake authentication as a substitute.