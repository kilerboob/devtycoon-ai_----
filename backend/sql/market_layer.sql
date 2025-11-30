-- LAYER 16: Markets schema

CREATE TABLE IF NOT EXISTS market_items (
  id SERIAL PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN ('software','hardware','services')),
  name TEXT NOT NULL,
  description TEXT,
  base_price NUMERIC(12,2) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  rarity TEXT DEFAULT 'common',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS market_orders (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  item_id INT NOT NULL REFERENCES market_items(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('buy','sell')),
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed','cancelled')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS market_transactions (
  id SERIAL PRIMARY KEY,
  order_id INT NOT NULL REFERENCES market_orders(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  item_id INT NOT NULL REFERENCES market_items(id) ON DELETE CASCADE,
  quantity INT NOT NULL,
  total_price NUMERIC(12,2) NOT NULL,
  commission NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- DarkHub
CREATE TABLE IF NOT EXISTS darkhub_items (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low','medium','high','legendary')),
  price NUMERIC(12,2) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  commission_rate NUMERIC(5,2) NOT NULL DEFAULT 10.0, -- percent
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_market_items_category ON market_items(category);
CREATE INDEX IF NOT EXISTS idx_market_orders_user ON market_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_market_transactions_user ON market_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_darkhub_items_risk ON darkhub_items(risk_level);
