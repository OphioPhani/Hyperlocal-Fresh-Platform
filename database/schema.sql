PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('vendor', 'buyer')),
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stock (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vendor_id INTEGER NOT NULL,
  product_name TEXT NOT NULL,
  quantity_kg REAL NOT NULL CHECK(quantity_kg >= 0),
  price_per_kg REAL NOT NULL CHECK(price_per_kg >= 0),
  availability TEXT NOT NULL CHECK(availability IN ('today', 'tomorrow')),
  surplus_action TEXT NOT NULL DEFAULT 'none' CHECK(surplus_action IN ('none', 'discount', 'storage')),
  discount_percent REAL NOT NULL DEFAULT 0 CHECK(discount_percent >= 0 AND discount_percent <= 100),
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vendor_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS requirements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  buyer_id INTEGER NOT NULL,
  request_group TEXT NOT NULL,
  product_name TEXT NOT NULL,
  quantity_kg REAL NOT NULL CHECK(quantity_kg > 0),
  max_price_per_kg REAL,
  needed_by TEXT NOT NULL DEFAULT 'today' CHECK(needed_by IN ('today', 'tomorrow')),
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'fulfilled', 'cancelled')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (buyer_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  buyer_id INTEGER NOT NULL,
  vendor_id INTEGER NOT NULL,
  stock_id INTEGER NOT NULL,
  request_group TEXT,
  quantity_kg REAL NOT NULL CHECK(quantity_kg > 0),
  unit_price REAL NOT NULL CHECK(unit_price >= 0),
  total_price REAL NOT NULL CHECK(total_price >= 0),
  delivery_cost REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK(status IN ('confirmed', 'in_transit', 'delivered', 'cancelled')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (buyer_id) REFERENCES users(id),
  FOREIGN KEY (vendor_id) REFERENCES users(id),
  FOREIGN KEY (stock_id) REFERENCES stock(id)
);

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_stock_vendor_id ON stock(vendor_id);
CREATE INDEX IF NOT EXISTS idx_stock_active ON stock(is_active);
CREATE INDEX IF NOT EXISTS idx_stock_product_name ON stock(product_name);
CREATE INDEX IF NOT EXISTS idx_requirements_buyer_id ON requirements(buyer_id);
CREATE INDEX IF NOT EXISTS idx_requirements_group ON requirements(request_group);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_vendor_id ON orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_orders_stock_id ON orders(stock_id);
