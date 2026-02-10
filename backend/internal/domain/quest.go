package domain

import (
	"encoding/json"
	"time"
)

// Quest represents a quest
type Quest struct {
	ID              int64           `json:"id" db:"id"`
	Name            string          `json:"name" db:"name"`
	Description     *string         `json:"description" db:"description"`
	QuestType       string          `json:"quest_type" db:"quest_type"`         // daily, weekly, monthly, story, achievement
	ConditionType   string          `json:"condition_type" db:"condition_type"` // login, summon, dungeon_clear, etc.
	ConditionTarget int             `json:"condition_target" db:"condition_target"`
	Rewards         json.RawMessage `json:"rewards" db:"rewards"`
	OrderIndex      int             `json:"order_index" db:"order_index"`
	IsActive        bool            `json:"is_active" db:"is_active"`
	CreatedAt       time.Time       `json:"created_at" db:"created_at"`
}

// UserQuest represents a user's quest progress
type UserQuest struct {
	ID          int64      `json:"id" db:"id"`
	UserID      int64      `json:"user_id" db:"user_id"`
	QuestID     int64      `json:"quest_id" db:"quest_id"`
	Progress    int        `json:"progress" db:"progress"`
	IsCompleted bool       `json:"is_completed" db:"is_completed"`
	IsClaimed   bool       `json:"is_claimed" db:"is_claimed"`
	StartedAt   time.Time  `json:"started_at" db:"started_at"`
	CompletedAt *time.Time `json:"completed_at" db:"completed_at"`
	ClaimedAt   *time.Time `json:"claimed_at" db:"claimed_at"`
	ExpiresAt   *time.Time `json:"expires_at" db:"expires_at"`
}

// UserQuestDetail includes quest information
type UserQuestDetail struct {
	UserQuest
	Quest Quest `json:"quest"`
}

// DailyLoginReward represents daily login rewards
type DailyLoginReward struct {
	ID      int64           `json:"id" db:"id"`
	Day     int             `json:"day" db:"day"`
	Rewards json.RawMessage `json:"rewards" db:"rewards"`
}

// UserDailyLogin tracks user's daily login streak
type UserDailyLogin struct {
	ID             int64     `json:"id" db:"id"`
	UserID         int64     `json:"user_id" db:"user_id"`
	LoginDay       int       `json:"login_day" db:"login_day"`
	LastLoginDate  time.Time `json:"last_login_date" db:"last_login_date"`
	TotalLoginDays int       `json:"total_login_days" db:"total_login_days"`
}

// QuestRewards represents the structure of rewards JSON
type QuestRewards struct {
	Crystals int          `json:"crystals,omitempty"`
	Gold     int          `json:"gold,omitempty"`
	Exp      int          `json:"exp,omitempty"`
	Energy   int          `json:"energy,omitempty"`
	Items    []RewardItem `json:"items,omitempty"`
}

// RewardItem represents an item reward
type RewardItem struct {
	Type     string `json:"type"` // character, rune, material
	ID       *int64 `json:"id,omitempty"`
	Quantity int    `json:"quantity"`
}
