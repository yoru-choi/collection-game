package repository

import (
	"context"
	"database/sql"
	"encoding/json"

	"collection-game/internal/domain"
)

type QuestRepository struct {
	db *sql.DB
}

func NewQuestRepository(db *sql.DB) *QuestRepository {
	return &QuestRepository{db: db}
}

// GetActiveQuests gets all active quests of a specific type
func (r *QuestRepository) GetActiveQuests(ctx context.Context, questType string) ([]domain.Quest, error) {
	query := `
		SELECT id, name, description, quest_type, condition_type, condition_target,
		       rewards, order_index, is_active, created_at
		FROM quests
		WHERE is_active = true AND quest_type = $1
		ORDER BY order_index
	`

	rows, err := r.db.QueryContext(ctx, query, questType)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var quests []domain.Quest
	for rows.Next() {
		var q domain.Quest
		err := rows.Scan(
			&q.ID,
			&q.Name,
			&q.Description,
			&q.QuestType,
			&q.ConditionType,
			&q.ConditionTarget,
			&q.Rewards,
			&q.OrderIndex,
			&q.IsActive,
			&q.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		quests = append(quests, q)
	}

	return quests, nil
}

// GetUserQuests gets user's quest progress
func (r *QuestRepository) GetUserQuests(ctx context.Context, userID int64, questType string) ([]domain.UserQuestDetail, error) {
	query := `
		SELECT uq.id, uq.user_id, uq.quest_id, uq.progress, uq.is_completed, uq.is_claimed,
		       uq.started_at, uq.completed_at, uq.claimed_at, uq.expires_at,
		       q.id, q.name, q.description, q.quest_type, q.condition_type, q.condition_target,
		       q.rewards, q.order_index, q.is_active, q.created_at
		FROM user_quests uq
		JOIN quests q ON uq.quest_id = q.id
		WHERE uq.user_id = $1 AND q.quest_type = $2
		ORDER BY q.order_index
	`

	rows, err := r.db.QueryContext(ctx, query, userID, questType)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var userQuests []domain.UserQuestDetail
	for rows.Next() {
		var uq domain.UserQuestDetail
		err := rows.Scan(
			&uq.ID,
			&uq.UserID,
			&uq.QuestID,
			&uq.Progress,
			&uq.IsCompleted,
			&uq.IsClaimed,
			&uq.StartedAt,
			&uq.CompletedAt,
			&uq.ClaimedAt,
			&uq.ExpiresAt,
			&uq.Quest.ID,
			&uq.Quest.Name,
			&uq.Quest.Description,
			&uq.Quest.QuestType,
			&uq.Quest.ConditionType,
			&uq.Quest.ConditionTarget,
			&uq.Quest.Rewards,
			&uq.Quest.OrderIndex,
			&uq.Quest.IsActive,
			&uq.Quest.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		userQuests = append(userQuests, uq)
	}

	return userQuests, nil
}

// UpdateQuestProgress updates user's quest progress
func (r *QuestRepository) UpdateQuestProgress(ctx context.Context, userID int64, questID int64, progress int) error {
	query := `
		INSERT INTO user_quests (user_id, quest_id, progress, is_completed)
		VALUES ($1, $2, $3, $3 >= (SELECT condition_target FROM quests WHERE id = $2))
		ON CONFLICT (user_id, quest_id, started_at)
		DO UPDATE SET 
			progress = user_quests.progress + $3,
			is_completed = user_quests.progress + $3 >= (SELECT condition_target FROM quests WHERE id = $2),
			completed_at = CASE 
				WHEN user_quests.progress + $3 >= (SELECT condition_target FROM quests WHERE id = $2) THEN NOW()
				ELSE user_quests.completed_at
			END
	`

	_, err := r.db.ExecContext(ctx, query, userID, questID, progress)
	return err
}

// ClaimQuest marks quest as claimed and returns rewards
func (r *QuestRepository) ClaimQuest(ctx context.Context, userID int64, questID int64) (*domain.QuestRewards, error) {
	// First, get quest rewards
	var rewardsJSON []byte
	query := `
		UPDATE user_quests
		SET is_claimed = true, claimed_at = NOW()
		WHERE user_id = $1 AND quest_id = $2 AND is_completed = true AND is_claimed = false
		RETURNING (SELECT rewards FROM quests WHERE id = $2)
	`

	err := r.db.QueryRowContext(ctx, query, userID, questID).Scan(&rewardsJSON)
	if err != nil {
		return nil, err
	}

	var rewards domain.QuestRewards
	if len(rewardsJSON) > 0 {
		if err := json.Unmarshal(rewardsJSON, &rewards); err != nil {
			return nil, err
		}
	}
	return &rewards, nil
}

// CompleteQuest marks quest as completed if progress meets the target
func (r *QuestRepository) CompleteQuest(ctx context.Context, userID int64, questID int64) error {
	query := `
		UPDATE user_quests uq
		SET is_completed = true,
			completed_at = NOW()
		FROM quests q
		WHERE uq.user_id = $1
			AND uq.quest_id = $2
			AND uq.quest_id = q.id
			AND uq.is_claimed = false
			AND uq.progress >= q.condition_target
	`

	result, err := r.db.ExecContext(ctx, query, userID, questID)
	if err != nil {
		return err
	}

	affected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if affected == 0 {
		return sql.ErrNoRows
	}

	return nil
}

// GetDailyLogin gets user's daily login record
func (r *QuestRepository) GetDailyLogin(ctx context.Context, userID int64) (*domain.UserDailyLogin, error) {
	query := `
		SELECT id, user_id, login_day, last_login_date, total_login_days
		FROM user_daily_login
		WHERE user_id = $1
	`

	var dl domain.UserDailyLogin
	err := r.db.QueryRowContext(ctx, query, userID).Scan(
		&dl.ID,
		&dl.UserID,
		&dl.LoginDay,
		&dl.LastLoginDate,
		&dl.TotalLoginDays,
	)
	if err != nil {
		return nil, err
	}

	return &dl, nil
}

func (r *QuestRepository) CreateDailyLogin(ctx context.Context, userID int64) (*domain.UserDailyLogin, error) {
	query := `
		INSERT INTO user_daily_login (user_id, login_day, last_login_date, total_login_days)
		VALUES ($1, 1, CURRENT_DATE, 1)
		RETURNING id, user_id, login_day, last_login_date, total_login_days
	`

	var dl domain.UserDailyLogin
	err := r.db.QueryRowContext(ctx, query, userID).Scan(
		&dl.ID,
		&dl.UserID,
		&dl.LoginDay,
		&dl.LastLoginDate,
		&dl.TotalLoginDays,
	)
	if err != nil {
		return nil, err
	}

	return &dl, nil
}
