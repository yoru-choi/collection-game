-- Create shop_items table
CREATE TABLE IF NOT EXISTS shop_items (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    item_type VARCHAR(20) NOT NULL CHECK (item_type IN ('character', 'rune', 'material', 'energy', 'gold', 'crystal', 'package')),
    currency_type VARCHAR(20) NOT NULL CHECK (currency_type IN ('crystal', 'gold', 'glory', 'guild')),
    price INT NOT NULL,
    item_data JSONB NOT NULL,
    stock INT DEFAULT -1, -- -1 means unlimited
    refresh_type VARCHAR(20) CHECK (refresh_type IN ('daily', 'weekly', 'monthly', 'never')) DEFAULT 'never',
    available_from TIMESTAMP,
    available_until TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_shop_items_type ON shop_items(item_type);
CREATE INDEX idx_shop_items_currency ON shop_items(currency_type);
CREATE INDEX idx_shop_items_active ON shop_items(is_active);

-- Create shop_purchases table for tracking user purchases
CREATE TABLE IF NOT EXISTS shop_purchases (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    shop_item_id BIGINT NOT NULL REFERENCES shop_items(id),
    quantity INT NOT NULL DEFAULT 1,
    total_price INT NOT NULL,
    currency_type VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_shop_purchases_user_id ON shop_purchases(user_id);
CREATE INDEX idx_shop_purchases_item_id ON shop_purchases(shop_item_id);
CREATE INDEX idx_shop_purchases_created_at ON shop_purchases(created_at DESC);

-- Create shop_user_refresh table to track daily/weekly shop resets per user
CREATE TABLE IF NOT EXISTS shop_user_refresh (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    shop_item_id BIGINT NOT NULL REFERENCES shop_items(id) ON DELETE CASCADE,
    purchased_count INT NOT NULL DEFAULT 0,
    last_refresh TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, shop_item_id)
);

-- Create indexes
CREATE INDEX idx_shop_user_refresh_user_id ON shop_user_refresh(user_id);

-- Create trigger
CREATE TRIGGER update_shop_items_updated_at BEFORE UPDATE ON shop_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
