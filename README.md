# STRYDE V6 — Commerce OS (demo/test release)

Original STRYDE V3.2 cinematic sneaker storefront, repaired engineering/viewer controls, plus PHP/MySQL account, inventory, demo checkout, Stripe **test** checkout, orders, tracking, shipping/tax estimates and admin dashboard.

**Important:** This is a portfolio commerce demonstration using **concept sneakers** and **simulated stock**. It is not ready to take real payments or ship physical sneakers.

See [SETUP.md](SETUP.md) for cPanel/Git HEAD deployment, database setup, environment config, Stripe test webhook and limitations.

Frontend: open `index.html` using a local server. Backend routes under `api/index.php` require PHP/MySQL credentials and database migration.

### What's working in demo mode
- Customer registration, secure password hashes, login and account sessions
- Catalog and quote pricing verified server-side
- Demo order creation and order history
- Admin account portal with price, inventory, fulfillment and shipping estimate controls
- Stripe test session setup when test credentials are configured; signed webhook verification
- Engineering panel; PNG fallback for missing design WebP artwork

No credentials are included in this repository.
