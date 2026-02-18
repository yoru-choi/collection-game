package repository

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"

	"collection-game/internal/domain"
)

type ArenaRepository struct {
	db *sql.DB
}

func NewArenaRepository(db *sql.DB) *ArenaRepository {
	return &ArenaRepository{db: db}
}

// GetOrCreateArena gets or creates arena record for user
func (r *ArenaRepository) GetOrCreateArena(ctx context.Context, userID int64, seasonID int) (*domain.Arena, error) {
	// Try to get existing arena record
	arena, err := r.GetArena(ctx, userID, seasonID)
	if err == nil {
		return arena, nil
	}
	if !errors.Is(err, sql.ErrNoRows) {
		return nil, err
	}

	// Create new arena record
	query := `
		INSERT INTO arena (user_id, season_id, rating, rank)
		VALUES ($1, $2, 1000, 0)
		RETURNING id, user_id, rank, rating, win_count, lose_count, defense_team, season_id, updated_at
	`

	arena = &domain.Arena{}
	err = r.db.QueryRowContext(ctx, query, userID, seasonID).Scan(
		&arena.ID,
		&arena.UserID,
		&arena.Rank,
		&arena.Rating,
		&arena.WinCount,
		&arena.LoseCount,
		&arena.DefenseTeam,
		&arena.SeasonID,
		&arena.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	return arena, nil
}

// GetArena gets arena record for user
func (r *ArenaRepository) GetArena(ctx context.Context, userID int64, seasonID int) (*domain.Arena, error) {
	query := `
		SELECT id, user_id, rank, rating, win_count, lose_count, defense_team, season_id, updated_at
		FROM arena
		WHERE user_id = $1 AND season_id = $2
	`

	arena := &domain.Arena{}
	err := r.db.QueryRowContext(ctx, query, userID, seasonID).Scan(
		&arena.ID,
		&arena.UserID,
		&arena.Rank,
		&arena.Rating,
		&arena.WinCount,
		&arena.LoseCount,
		&arena.DefenseTeam,
		&arena.SeasonID,
		&arena.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	return arena, nil
}

// UpdateDefenseTeam updates user's defense team
func (r *ArenaRepository) UpdateDefenseTeam(ctx context.Context, userID int64, seasonID int, team []int64) error {
	teamJSON, err := json.Marshal(team)
	if err != nil {
		return err
	}

	query := `
		UPDATE arena
		SET defense_team = $1, updated_at = NOW()
		WHERE user_id = $2 AND season_id = $3
	`

	result, err := r.db.ExecContext(ctx, query, teamJSON, userID, seasonID)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return errors.New("arena record not found")
	}

	return nil
}

// UpdateArenaResult updates arena record after a battle
func (r *ArenaRepository) UpdateArenaResult(ctx context.Context, userID int64, seasonID int, won bool, ratingChange int) error {
	query := `
		UPDATE arena
		SET rating = rating + $1,
		    win_count = CASE WHEN $2 THEN win_count + 1 ELSE win_count END,
		    lose_count = CASE WHEN $2 THEN lose_count ELSE lose_count + 1 END,
		    updated_at = NOW()
		WHERE user_id = $3 AND season_id = $4
	`

	_, err := r.db.ExecContext(ctx, query, ratingChange, won, userID, seasonID)
	return err
}

// GetRanking gets top users by rating
func (r *ArenaRepository) GetRanking(ctx context.Context, seasonID int, limit int) ([]domain.ArenaRankingEntry, error) {
	query := `
		SELECT a.rank, a.user_id, u.username, a.rating, a.win_count
		FROM arena a
		JOIN users u ON a.user_id = u.id
		WHERE a.season_id = $1
		ORDER BY a.rating DESC, a.win_count DESC
		LIMIT $2
	`

	rows, err := r.db.QueryContext(ctx, query, seasonID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var rankings []domain.ArenaRankingEntry
	rank := 1
	for rows.Next() {
		var entry domain.ArenaRankingEntry
		err := rows.Scan(
			&entry.Rank,
			&entry.UserID,
			&entry.Username,
			&entry.Rating,
			&entry.WinCount,
		)
		if err != nil {
			return nil, err
		}
		entry.Rank = rank
		rankings = append(rankings, entry)
		rank++
	}

	return rankings, nil
}

// RecordBattle records a battle in history
func (r *ArenaRepository) RecordBattle(ctx context.Context, history *domain.ArenaHistory) error {
	query := `
		INSERT INTO arena_history (
			attacker_id, defender_id, attacker_team, defender_team,
			winner_id, battle_log, rating_change, season_id
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id, created_at
	`

	err := r.db.QueryRowContext(ctx, query,
		history.AttackerID,
		history.DefenderID,
		history.AttackerTeam,
		history.DefenderTeam,
		history.WinnerID,
		history.BattleLog,
		history.RatingChange,
		history.SeasonID,
	).Scan(&history.ID, &history.CreatedAt)

	return err
}

// GetBattleHistory gets user's recent battle history
func (r *ArenaRepository) GetBattleHistory(ctx context.Context, userID int64, seasonID int, limit int) ([]domain.ArenaHistory, error) {
	query := `
		SELECT id, attacker_id, defender_id, attacker_team, defender_team,
		       winner_id, COALESCE(battle_log, 'null'::jsonb), rating_change, season_id, created_at
		FROM arena_history
		WHERE (attacker_id = $1 OR defender_id = $1) AND season_id = $2
		ORDER BY created_at DESC
		LIMIT $3
	`

	rows, err := r.db.QueryContext(ctx, query, userID, seasonID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var history []domain.ArenaHistory
	for rows.Next() {
		var h domain.ArenaHistory
		err := rows.Scan(
			&h.ID,
			&h.AttackerID,
			&h.DefenderID,
			&h.AttackerTeam,
			&h.DefenderTeam,
			&h.WinnerID,
			&h.BattleLog,
			&h.RatingChange,
			&h.SeasonID,
			&h.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		history = append(history, h)
	}

	return history, nil
}

// UpdateRanks updates all ranks based on current ratings
func (r *ArenaRepository) UpdateRanks(ctx context.Context, seasonID int) error {
	query := `
		WITH ranked AS (
			SELECT id, ROW_NUMBER() OVER (ORDER BY rating DESC, win_count DESC) as new_rank
			FROM arena
			WHERE season_id = $1
		)
		UPDATE arena a
		SET rank = r.new_rank, updated_at = NOW()
		FROM ranked r
		WHERE a.id = r.id
	`

	_, err := r.db.ExecContext(ctx, query, seasonID)
	return err
}
