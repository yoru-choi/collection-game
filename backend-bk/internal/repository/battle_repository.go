package repository

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	"collection-game/internal/domain"
)

type BattleRepository interface {
	Create(ctx context.Context, battle *domain.Battle) error
	GetByID(ctx context.Context, id int64) (*domain.Battle, error)
	GetActiveByUserID(ctx context.Context, userID int64) (*domain.Battle, error)
	UpdateState(ctx context.Context, id int64, state json.RawMessage, currentTurn int) error
	Finish(ctx context.Context, id int64, status string, rewards json.RawMessage) error
	CreateTurn(ctx context.Context, turn *domain.BattleTurn) error
	GetTurns(ctx context.Context, battleID int64) ([]*domain.BattleTurn, error)
}

type battleRepository struct {
	db *sql.DB
}

func NewBattleRepository(db *sql.DB) BattleRepository {
	return &battleRepository{db: db}
}

func (r *battleRepository) Create(ctx context.Context, battle *domain.Battle) error {
	query := `
		INSERT INTO battles (user_id, battle_type, reference_id, player_team, enemy_team, current_turn, battle_state, status, rewards)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING id, started_at
	`
	return r.db.QueryRowContext(
		ctx, query,
		battle.UserID, battle.BattleType, battle.ReferenceID,
		battle.PlayerTeam, battle.EnemyTeam, battle.CurrentTurn,
		battle.BattleState, battle.Status, battle.Rewards,
	).Scan(&battle.ID, &battle.StartedAt)
}

func (r *battleRepository) GetByID(ctx context.Context, id int64) (*domain.Battle, error) {
	query := `
		SELECT id, user_id, battle_type, reference_id, player_team, enemy_team,
		       current_turn, battle_state, status, rewards, started_at, finished_at
		FROM battles WHERE id = $1
	`
	b := &domain.Battle{}
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&b.ID, &b.UserID, &b.BattleType, &b.ReferenceID,
		&b.PlayerTeam, &b.EnemyTeam, &b.CurrentTurn,
		&b.BattleState, &b.Status, &b.Rewards,
		&b.StartedAt, &b.FinishedAt,
	)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("battle not found")
	}
	return b, err
}

func (r *battleRepository) GetActiveByUserID(ctx context.Context, userID int64) (*domain.Battle, error) {
	query := `
		SELECT id, user_id, battle_type, reference_id, player_team, enemy_team,
		       current_turn, battle_state, status, rewards, started_at, finished_at
		FROM battles WHERE user_id = $1 AND status = 'ongoing'
		ORDER BY started_at DESC LIMIT 1
	`
	b := &domain.Battle{}
	err := r.db.QueryRowContext(ctx, query, userID).Scan(
		&b.ID, &b.UserID, &b.BattleType, &b.ReferenceID,
		&b.PlayerTeam, &b.EnemyTeam, &b.CurrentTurn,
		&b.BattleState, &b.Status, &b.Rewards,
		&b.StartedAt, &b.FinishedAt,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return b, err
}

func (r *battleRepository) UpdateState(ctx context.Context, id int64, state json.RawMessage, currentTurn int) error {
	query := `UPDATE battles SET battle_state = $1, current_turn = $2 WHERE id = $3`
	_, err := r.db.ExecContext(ctx, query, state, currentTurn, id)
	return err
}

func (r *battleRepository) Finish(ctx context.Context, id int64, status string, rewards json.RawMessage) error {
	now := time.Now()
	query := `UPDATE battles SET status = $1, rewards = $2, finished_at = $3 WHERE id = $4`
	_, err := r.db.ExecContext(ctx, query, status, rewards, now, id)
	return err
}

func (r *battleRepository) CreateTurn(ctx context.Context, turn *domain.BattleTurn) error {
	query := `
		INSERT INTO battle_turns (battle_id, turn_number, actor_id, action_type, target_id, skill_id, damage, heal, effects, turn_result)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		RETURNING id, created_at
	`
	return r.db.QueryRowContext(
		ctx, query,
		turn.BattleID, turn.TurnNumber, turn.ActorID, turn.ActionType,
		turn.TargetID, turn.SkillID, turn.Damage, turn.Heal,
		turn.Effects, turn.TurnResult,
	).Scan(&turn.ID, &turn.CreatedAt)
}

func (r *battleRepository) GetTurns(ctx context.Context, battleID int64) ([]*domain.BattleTurn, error) {
	query := `
		SELECT id, battle_id, turn_number, actor_id, action_type, target_id, skill_id,
		       damage, heal, effects, turn_result, created_at
		FROM battle_turns WHERE battle_id = $1 ORDER BY turn_number
	`
	rows, err := r.db.QueryContext(ctx, query, battleID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var turns []*domain.BattleTurn
	for rows.Next() {
		t := &domain.BattleTurn{}
		err := rows.Scan(
			&t.ID, &t.BattleID, &t.TurnNumber, &t.ActorID, &t.ActionType,
			&t.TargetID, &t.SkillID, &t.Damage, &t.Heal,
			&t.Effects, &t.TurnResult, &t.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		turns = append(turns, t)
	}
	return turns, rows.Err()
}
