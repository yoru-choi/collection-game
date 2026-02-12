package repository

import (
	"context"
	"database/sql"

	"collection-game/internal/domain"
)

type ShopRepository struct {
	db *sql.DB
}

func NewShopRepository(db *sql.DB) *ShopRepository {
	return &ShopRepository{db: db}
}

// GetActiveItems gets all active shop items
func (r *ShopRepository) GetActiveItems(ctx context.Context, currencyType string) ([]domain.ShopItem, error) {
	query := `
		SELECT id, name, description, item_type, currency_type, price, item_data,
		       stock, refresh_type, available_from, available_until, is_active,
		       created_at, updated_at
		FROM shop_items
		WHERE is_active = true
		  AND (currency_type = $1 OR $1 = '')
		  AND (available_from IS NULL OR available_from <= NOW())
		  AND (available_until IS NULL OR available_until >= NOW())
		ORDER BY item_type, price
	`

	rows, err := r.db.QueryContext(ctx, query, currencyType)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []domain.ShopItem
	for rows.Next() {
		var item domain.ShopItem
		err := rows.Scan(
			&item.ID, &item.Name, &item.Description, &item.ItemType,
			&item.CurrencyType, &item.Price, &item.ItemData, &item.Stock,
			&item.RefreshType, &item.AvailableFrom, &item.AvailableUntil,
			&item.IsActive, &item.CreatedAt, &item.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		items = append(items, item)
	}

	return items, nil
}

// GetByID gets a shop item by ID
func (r *ShopRepository) GetByID(ctx context.Context, id int64) (*domain.ShopItem, error) {
	query := `
		SELECT id, name, description, item_type, currency_type, price, item_data,
		       stock, refresh_type, available_from, available_until, is_active,
		       created_at, updated_at
		FROM shop_items
		WHERE id = $1
	`

	var item domain.ShopItem
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&item.ID, &item.Name, &item.Description, &item.ItemType,
		&item.CurrencyType, &item.Price, &item.ItemData, &item.Stock,
		&item.RefreshType, &item.AvailableFrom, &item.AvailableUntil,
		&item.IsActive, &item.CreatedAt, &item.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	return &item, nil
}

// RecordPurchase records a purchase
func (r *ShopRepository) RecordPurchase(ctx context.Context, purchase *domain.ShopPurchase) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Insert purchase record
	query := `
		INSERT INTO shop_purchases (user_id, shop_item_id, quantity, total_price, currency_type)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, created_at
	`

	err = tx.QueryRowContext(ctx, query,
		purchase.UserID, purchase.ShopItemID, purchase.Quantity,
		purchase.TotalPrice, purchase.CurrencyType,
	).Scan(&purchase.ID, &purchase.CreatedAt)
	if err != nil {
		return err
	}

	// Update stock if limited
	query = `
		UPDATE shop_items
		SET stock = stock - $1
		WHERE id = $2 AND stock > 0
	`
	_, err = tx.ExecContext(ctx, query, purchase.Quantity, purchase.ShopItemID)
	if err != nil {
		return err
	}

	return tx.Commit()
}

// GetUserPurchases gets user's purchase history
func (r *ShopRepository) GetUserPurchases(ctx context.Context, userID int64, limit int) ([]domain.ShopPurchase, error) {
	query := `
		SELECT id, user_id, shop_item_id, quantity, total_price, currency_type, created_at
		FROM shop_purchases
		WHERE user_id = $1
		ORDER BY created_at DESC
		LIMIT $2
	`

	rows, err := r.db.QueryContext(ctx, query, userID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var purchases []domain.ShopPurchase
	for rows.Next() {
		var p domain.ShopPurchase
		err := rows.Scan(
			&p.ID, &p.UserID, &p.ShopItemID, &p.Quantity,
			&p.TotalPrice, &p.CurrencyType, &p.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		purchases = append(purchases, p)
	}

	return purchases, nil
}
