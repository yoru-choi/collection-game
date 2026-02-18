package repository

import (
	"context"
	"database/sql"

	"collection-game/internal/domain"
)

type SummonRepository interface {
	CreateHistory(ctx context.Context, history *domain.SummonHistory) error
	GetUserHistory(ctx context.Context, userID int64, limit int) ([]*domain.SummonHistory, error)
}

type summonRepository struct {
	db *sql.DB
}

func NewSummonRepository(db *sql.DB) SummonRepository {
	return &summonRepository{db: db}
}

func (r *summonRepository) CreateHistory(ctx context.Context, history *domain.SummonHistory) error {
	query := `
		INSERT INTO summon_history (user_id, summon_type, character_id)
		VALUES ($1, $2, $3)
		RETURNING id, created_at
	`
	return r.db.QueryRowContext(
		ctx, query,
		history.UserID, history.SummonType, history.CharacterID,
	).Scan(&history.ID, &history.CreatedAt)
}

func (r *summonRepository) GetUserHistory(ctx context.Context, userID int64, limit int) ([]*domain.SummonHistory, error) {
	query := `
		SELECT id, user_id, summon_type, character_id, created_at
		FROM summon_history
		WHERE user_id = $1
		ORDER BY created_at DESC
		LIMIT $2
	`
	rows, err := r.db.QueryContext(ctx, query, userID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var history []*domain.SummonHistory
	for rows.Next() {
		h := &domain.SummonHistory{}
		err := rows.Scan(&h.ID, &h.UserID, &h.SummonType, &h.CharacterID, &h.CreatedAt)
		if err != nil {
			return nil, err
		}
		history = append(history, h)
	}
	return history, rows.Err()
}
