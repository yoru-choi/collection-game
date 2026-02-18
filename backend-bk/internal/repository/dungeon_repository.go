package repository

import (
	"context"
	"database/sql"
	"fmt"

	"collection-game/internal/domain"
)

type DungeonRepository interface {
	GetByID(ctx context.Context, id int64) (*domain.Dungeon, error)
	GetAll(ctx context.Context) ([]*domain.Dungeon, error)
	GetByType(ctx context.Context, dungeonType domain.DungeonType) ([]*domain.Dungeon, error)
	GetByChapter(ctx context.Context, chapter int) ([]*domain.Dungeon, error)
	
	// Dungeon Progress
	GetUserProgress(ctx context.Context, userID int64, dungeonID int64) (*domain.DungeonProgress, error)
	GetAllUserProgress(ctx context.Context, userID int64) ([]*domain.DungeonProgress, error)
	UpdateProgress(ctx context.Context, progress *domain.DungeonProgress) error
	CreateProgress(ctx context.Context, progress *domain.DungeonProgress) error
}

type dungeonRepository struct {
	db *sql.DB
}

func NewDungeonRepository(db *sql.DB) DungeonRepository {
	return &dungeonRepository{db: db}
}

func (r *dungeonRepository) GetByID(ctx context.Context, id int64) (*domain.Dungeon, error) {
	query := `
		SELECT id, name, dungeon_type, difficulty, chapter, stage, 
		       energy_cost, stages, rewards, exp_reward, gold_reward
		FROM dungeons WHERE id = $1
	`
	dungeon := &domain.Dungeon{}
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&dungeon.ID, &dungeon.Name, &dungeon.DungeonType, &dungeon.Difficulty,
		&dungeon.Chapter, &dungeon.Stage, &dungeon.EnergyCost,
		&dungeon.Stages, &dungeon.Rewards, &dungeon.ExpReward, &dungeon.GoldReward,
	)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("dungeon not found")
	}
	return dungeon, err
}

func (r *dungeonRepository) GetAll(ctx context.Context) ([]*domain.Dungeon, error) {
	query := `
		SELECT id, name, dungeon_type, difficulty, chapter, stage,
		       energy_cost, stages, rewards, exp_reward, gold_reward
		FROM dungeons ORDER BY chapter, stage
	`
	return r.executeDungeonQuery(ctx, query)
}

func (r *dungeonRepository) GetByType(ctx context.Context, dungeonType domain.DungeonType) ([]*domain.Dungeon, error) {
	query := `
		SELECT id, name, dungeon_type, difficulty, chapter, stage,
		       energy_cost, stages, rewards, exp_reward, gold_reward
		FROM dungeons WHERE dungeon_type = $1 ORDER BY chapter, stage
	`
	return r.executeDungeonQuery(ctx, query, dungeonType)
}

func (r *dungeonRepository) GetByChapter(ctx context.Context, chapter int) ([]*domain.Dungeon, error) {
	query := `
		SELECT id, name, dungeon_type, difficulty, chapter, stage,
		       energy_cost, stages, rewards, exp_reward, gold_reward
		FROM dungeons WHERE chapter = $1 ORDER BY stage
	`
	return r.executeDungeonQuery(ctx, query, chapter)
}

func (r *dungeonRepository) executeDungeonQuery(ctx context.Context, query string, args ...interface{}) ([]*domain.Dungeon, error) {
	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var dungeons []*domain.Dungeon
	for rows.Next() {
		d := &domain.Dungeon{}
		err := rows.Scan(
			&d.ID, &d.Name, &d.DungeonType, &d.Difficulty,
			&d.Chapter, &d.Stage, &d.EnergyCost,
			&d.Stages, &d.Rewards, &d.ExpReward, &d.GoldReward,
		)
		if err != nil {
			return nil, err
		}
		dungeons = append(dungeons, d)
	}
	return dungeons, rows.Err()
}

func (r *dungeonRepository) GetUserProgress(ctx context.Context, userID int64, dungeonID int64) (*domain.DungeonProgress, error) {
	query := `
		SELECT id, user_id, dungeon_id, cleared, stars, best_time, clear_count, updated_at
		FROM dungeon_progress WHERE user_id = $1 AND dungeon_id = $2
	`
	progress := &domain.DungeonProgress{}
	err := r.db.QueryRowContext(ctx, query, userID, dungeonID).Scan(
		&progress.ID, &progress.UserID, &progress.DungeonID,
		&progress.Cleared, &progress.Stars, &progress.BestTime,
		&progress.ClearCount, &progress.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, nil // No progress yet
	}
	return progress, err
}

func (r *dungeonRepository) GetAllUserProgress(ctx context.Context, userID int64) ([]*domain.DungeonProgress, error) {
	query := `
		SELECT id, user_id, dungeon_id, cleared, stars, best_time, clear_count, updated_at
		FROM dungeon_progress WHERE user_id = $1 ORDER BY dungeon_id
	`
	rows, err := r.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var progressList []*domain.DungeonProgress
	for rows.Next() {
		p := &domain.DungeonProgress{}
		err := rows.Scan(
			&p.ID, &p.UserID, &p.DungeonID,
			&p.Cleared, &p.Stars, &p.BestTime,
			&p.ClearCount, &p.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		progressList = append(progressList, p)
	}
	return progressList, rows.Err()
}

func (r *dungeonRepository) CreateProgress(ctx context.Context, progress *domain.DungeonProgress) error {
	query := `
		INSERT INTO dungeon_progress (user_id, dungeon_id, cleared, stars, best_time, clear_count)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, updated_at
	`
	return r.db.QueryRowContext(
		ctx, query,
		progress.UserID, progress.DungeonID, progress.Cleared,
		progress.Stars, progress.BestTime, progress.ClearCount,
	).Scan(&progress.ID, &progress.UpdatedAt)
}

func (r *dungeonRepository) UpdateProgress(ctx context.Context, progress *domain.DungeonProgress) error {
	query := `
		UPDATE dungeon_progress
		SET cleared = $1, stars = $2, best_time = $3, clear_count = $4, updated_at = CURRENT_TIMESTAMP
		WHERE id = $5
		RETURNING updated_at
	`
	return r.db.QueryRowContext(
		ctx, query,
		progress.Cleared, progress.Stars, progress.BestTime, progress.ClearCount, progress.ID,
	).Scan(&progress.UpdatedAt)
}
