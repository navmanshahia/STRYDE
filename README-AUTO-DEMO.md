# STRYDE V6.1 — Zero-config demo commerce

The existing V6 storefront is preserved. When the MySQL configuration file is absent, PHP automatically creates an **SQLite demo store** outside `public_html` on its first API request.

- Customer registration and login with hashed passwords, server sessions and CSRF tokens.
- Price-validated bag, Canadian shipping and illustrative taxes, free/express shipping choices.
- Simulated orders, history and tracking; **no charge, no fulfillment**.
- Admin: protected order management, simulated inventory and prices, demo tax/shipping settings.
- Admin account requires the secure one-time terminal command `php api/demo-admin.php owner@example.com`.
- No database credentials, Stripe keys or MySQL installation necessary.

Requires PHP 8.2+, `pdo_sqlite`, `mbstring`, HTTPS and writable home directory. If SQLite is unavailable, the interface reports what extension is missing; accounts should **not** fall back to insecure browser-only impersonation.

Copy the entire package to `~/public_html/STRYDE`; preserve the private directory `~/stryde-demo-private` between deployments. The installer is idempotent and retains prior demo orders and users.

This is a test demonstration, not a production checkout. Never use customer-identifying real data or collect payments in demo mode.