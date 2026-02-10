package domain

import (
	"encoding/json"
	"time"
)

// ShopItem represents an item in the shop
type ShopItem struct {
	ID             int64           `json:"id" db:"id"`
	Name           string          `json:"name" db:"name"`
	Description    *string         `json:"description" db:"description"`
	ItemType       string          `json:"item_type" db:"item_type"`         // character, rune, material, energy, gold, crystal, package
	CurrencyType   string          `json:"currency_type" db:"currency_type"` // crystal, gold, glory, guild
	Price          int             `json:"price" db:"price"`
	ItemData       json.RawMessage `json:"item_data" db:"item_data"`
	Stock          int             `json:"stock" db:"stock"`               // -1 for unlimited
	RefreshType    *string         `json:"refresh_type" db:"refresh_type"` // daily, weekly, monthly, never
	AvailableFrom  *time.Time      `json:"available_from" db:"available_from"`
	AvailableUntil *time.Time      `json:"available_until" db:"available_until"`
	IsActive       bool            `json:"is_active" db:"is_active"`
	CreatedAt      time.Time       `json:"created_at" db:"created_at"`
	UpdatedAt      time.Time       `json:"updated_at" db:"updated_at"`
}

// ShopPurchase represents a user's purchase history
type ShopPurchase struct {
	ID           int64     `json:"id" db:"id"`
	UserID       int64     `json:"user_id" db:"user_id"`
	ShopItemID   int64     `json:"shop_item_id" db:"shop_item_id"`
	Quantity     int       `json:"quantity" db:"quantity"`
	TotalPrice   int       `json:"total_price" db:"total_price"`
	CurrencyType string    `json:"currency_type" db:"currency_type"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
}

// ShopUserRefresh tracks user-specific shop refresh state
type ShopUserRefresh struct {
	ID             int64     `json:"id" db:"id"`
	UserID         int64     `json:"user_id" db:"user_id"`
	ShopItemID     int64     `json:"shop_item_id" db:"shop_item_id"`
	PurchasedCount int       `json:"purchased_count" db:"purchased_count"`
	LastRefresh    time.Time `json:"last_refresh" db:"last_refresh"`
}

// PurchaseRequest represents a purchase request
type PurchaseRequest struct {
	ShopItemID int64 `json:"shop_item_id" binding:"required"`
	Quantity   int   `json:"quantity" binding:"required,min=1"`
}

// ShopItemData represents the structure of item_data JSON
type ShopItemData struct {
	CharacterID *int64         `json:"character_id,omitempty"`
	RuneType    *string        `json:"rune_type,omitempty"`
	Materials   map[string]int `json:"materials,omitempty"`
	Amount      int            `json:"amount,omitempty"`
	Bonus       map[string]int `json:"bonus,omitempty"`
	Package     []PackageItem  `json:"package,omitempty"`
}

// PackageItem represents an item within a package
type PackageItem struct {
	Type   string `json:"type"`
	ID     *int64 `json:"id,omitempty"`
	Amount int    `json:"amount"`
}
