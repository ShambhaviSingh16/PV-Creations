PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS products (
 id INTEGER PRIMARY KEY, data TEXT NOT NULL CHECK(json_valid(data)),
 price_paise INTEGER NOT NULL CHECK(price_paise >= 100),
 stock INTEGER NOT NULL CHECK(stock >= 0), active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS orders (
 id TEXT PRIMARY KEY, attempt TEXT NOT NULL UNIQUE, fingerprint TEXT NOT NULL,
 access_hash TEXT NOT NULL, customer TEXT NOT NULL CHECK(json_valid(customer)), gift_note TEXT NOT NULL,
 subtotal INTEGER NOT NULL, shipping INTEGER NOT NULL, total INTEGER NOT NULL CHECK(total = subtotal + shipping),
 currency TEXT NOT NULL DEFAULT 'INR', payment_status TEXT NOT NULL DEFAULT 'pending',
 fulfillment_status TEXT NOT NULL DEFAULT 'awaiting_payment', payment_mode TEXT NOT NULL,
 provider_order_id TEXT UNIQUE, provider_payment_id TEXT UNIQUE, provider_state TEXT NOT NULL DEFAULT 'idle',
 reservation_status TEXT NOT NULL DEFAULT 'held', expires_at INTEGER NOT NULL,
 created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL,
 tracking_url TEXT, courier TEXT, tracking_number TEXT
);
CREATE TABLE IF NOT EXISTS order_items (
 id TEXT PRIMARY KEY, order_id TEXT NOT NULL REFERENCES orders(id), product_id INTEGER NOT NULL REFERENCES products(id),
 quantity INTEGER NOT NULL CHECK(quantity BETWEEN 1 AND 20), snapshot TEXT NOT NULL CHECK(json_valid(snapshot)), unit_price INTEGER NOT NULL CHECK(unit_price >= 100)
);
CREATE TRIGGER IF NOT EXISTS reserve_stock AFTER INSERT ON order_items BEGIN
 SELECT CASE WHEN (SELECT active FROM products WHERE id=NEW.product_id) <> 1 THEN RAISE(ABORT, 'Product unavailable') END;
 SELECT CASE WHEN (SELECT price_paise FROM products WHERE id=NEW.product_id) <> NEW.unit_price THEN RAISE(ABORT, 'Product price changed') END;
 UPDATE products SET stock = stock - NEW.quantity WHERE id = NEW.product_id;
END;
CREATE TABLE IF NOT EXISTS payment_events (id TEXT PRIMARY KEY, order_id TEXT, created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS audit_logs (id TEXT PRIMARY KEY, actor TEXT NOT NULL, action TEXT NOT NULL, record_id TEXT NOT NULL, created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS notification_jobs (
 id TEXT PRIMARY KEY, order_id TEXT NOT NULL REFERENCES orders(id), kind TEXT NOT NULL,
 state TEXT NOT NULL DEFAULT 'pending', attempts INTEGER NOT NULL DEFAULT 0, next_at INTEGER NOT NULL,
 UNIQUE(order_id,kind)
);
CREATE TABLE IF NOT EXISTS rate_limits (key TEXT PRIMARY KEY, hits INTEGER NOT NULL, expires_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS orders_pending ON orders(payment_status,reservation_status,expires_at);
CREATE INDEX IF NOT EXISTS order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS jobs_pending ON notification_jobs(state,next_at);
CREATE INDEX IF NOT EXISTS rate_expiry ON rate_limits(expires_at);
