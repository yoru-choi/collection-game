package domain

import (
	"encoding/json"
	"time"
)

// Arena represents a user's arena status
type Arena struct {
	ID          int64           `json:"id" db:"id"`
	UserID      int64           `json:"user_id" db:"user_id"`
	Rank        int             `json:"rank" db:"rank"`
	Rating      int             `json:"rating" db:"rating"`
	WinCount    int             `json:"win_count" db:"win_count"`
	LoseCount   int             `json:"lose_count" db:"lose_count"`
	DefenseTeam json.RawMessage `json:"defense_team" db:"defense_team"`
	SeasonID    int             `json:"season_id" db:"season_id"`
	UpdatedAt   time.Time       `json:"updated_at" db:"updated_at"`
}

// ArenaHistory represents a PvP battle record
type ArenaHistory struct {
	ID           int64           `json:"id" db:"id"`
	AttackerID   int64           `json:"attacker_id" db:"attacker_id"`
	DefenderID   int64           `json:"defender_id" db:"defender_id"`
	AttackerTeam json.RawMessage `json:"attacker_team" db:"attacker_team"`
	DefenderTeam json.RawMessage `json:"defender_team" db:"defender_team"`
	WinnerID     int64           `json:"winner_id" db:"winner_id"`
	BattleLog    json.RawMessage `json:"battle_log" db:"battle_log"`
	RatingChange int             `json:"rating_change" db:"rating_change"`
	SeasonID     int             `json:"season_id" db:"season_id"`
	CreatedAt    time.Time       `json:"created_at" db:"created_at"`
}

// ArenaRankingEntry represents a ranking list entry
type ArenaRankingEntry struct {
	Rank     int    `json:"rank"`
	UserID   int64  `json:"user_id"`
	Username string `json:"username"`
	Rating   int    `json:"rating"`
	WinCount int    `json:"win_count"`
}

// DefenseTeam represents the defense team structure
type DefenseTeam struct {
	CharacterIDs []int64 `json:"character_ids"`
}

// AttackRequest represents an attack request
type AttackRequest struct {
	AttackerTeam []int64 `json:"attacker_team"`
}
