package domain

import "time"

// DungeonType represents the type of dungeon
type DungeonType string

const (
	DungeonTypeStory      DungeonType = "story"
	DungeonTypeElement    DungeonType = "element"
	DungeonTypeExperience DungeonType = "experience"
	DungeonTypeGold       DungeonType = "gold"
	DungeonTypeBoss       DungeonType = "boss"
)

// Difficulty represents dungeon difficulty
type Difficulty string

const (
	DifficultyNormal Difficulty = "normal"
	DifficultyHard   Difficulty = "hard"
	DifficultyHell   Difficulty = "hell"
)

// Dungeon represents a dungeon/stage
type Dungeon struct {
	ID          int64       `json:"id" db:"id"`
	Name        string      `json:"name" db:"name"`
	DungeonType DungeonType `json:"dungeon_type" db:"dungeon_type"`
	Difficulty  Difficulty  `json:"difficulty" db:"difficulty"`
	Chapter     int         `json:"chapter" db:"chapter"`
	Stage       int         `json:"stage" db:"stage"`
	EnergyCost  int         `json:"energy_cost" db:"energy_cost"`
	Stages      string      `json:"stages" db:"stages"`   // JSON array of enemy configurations
	Rewards     string      `json:"rewards" db:"rewards"` // JSON array of possible rewards
	ExpReward   int         `json:"exp_reward" db:"exp_reward"`
	GoldReward  int         `json:"gold_reward" db:"gold_reward"`
}

// DungeonProgress tracks user's progress through dungeons
type DungeonProgress struct {
	ID         int64     `json:"id" db:"id"`
	UserID     int64     `json:"user_id" db:"user_id"`
	DungeonID  int64     `json:"dungeon_id" db:"dungeon_id"`
	Cleared    bool      `json:"cleared" db:"cleared"`
	Stars      int       `json:"stars" db:"stars"`         // 0-3 stars
	BestTime   int       `json:"best_time" db:"best_time"` // In seconds
	ClearCount int       `json:"clear_count" db:"clear_count"`
	UpdatedAt  time.Time `json:"updated_at" db:"updated_at"`
}

// BattleResult contains the outcome of a battle action
type BattleResult struct {
	Success  bool           `json:"success"`
	Damage   int            `json:"damage,omitempty"`
	Healing  int            `json:"healing,omitempty"`
	Critical bool           `json:"critical,omitempty"`
	Effects  []StatusEffect `json:"effects,omitempty"`
	Message  string         `json:"message"`
}
