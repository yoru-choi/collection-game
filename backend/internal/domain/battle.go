package domain

import (
	"encoding/json"
	"time"
)

// Battle represents an ongoing battle
type Battle struct {
	ID          int64           `json:"id" db:"id"`
	UserID      int64           `json:"user_id" db:"user_id"`
	BattleType  string          `json:"battle_type" db:"battle_type"` // dungeon, arena, guild_war, boss_raid
	ReferenceID *int64          `json:"reference_id" db:"reference_id"`
	PlayerTeam  json.RawMessage `json:"player_team" db:"player_team"`
	EnemyTeam   json.RawMessage `json:"enemy_team" db:"enemy_team"`
	CurrentTurn int             `json:"current_turn" db:"current_turn"`
	BattleState json.RawMessage `json:"battle_state" db:"battle_state"`
	Status      string          `json:"status" db:"status"` // ongoing, victory, defeat, timeout
	Rewards     json.RawMessage `json:"rewards" db:"rewards"`
	StartedAt   time.Time       `json:"started_at" db:"started_at"`
	FinishedAt  *time.Time      `json:"finished_at" db:"finished_at"`
}

// BattleTurn represents a single turn in battle
type BattleTurn struct {
	ID         int64           `json:"id" db:"id"`
	BattleID   int64           `json:"battle_id" db:"battle_id"`
	TurnNumber int             `json:"turn_number" db:"turn_number"`
	ActorID    int64           `json:"actor_id" db:"actor_id"`       // user_character_id
	ActionType string          `json:"action_type" db:"action_type"` // attack, skill, item, defend, pass
	TargetID   *int64          `json:"target_id" db:"target_id"`
	SkillID    *int64          `json:"skill_id" db:"skill_id"`
	Damage     int             `json:"damage" db:"damage"`
	Heal       int             `json:"heal" db:"heal"`
	Effects    json.RawMessage `json:"effects" db:"effects"`
	TurnResult json.RawMessage `json:"turn_result" db:"turn_result"`
	CreatedAt  time.Time       `json:"created_at" db:"created_at"`
}

// Friend represents a friend relationship
type Friend struct {
	ID          int64      `json:"id" db:"id"`
	UserID      int64      `json:"user_id" db:"user_id"`
	FriendID    int64      `json:"friend_id" db:"friend_id"`
	Status      string     `json:"status" db:"status"` // pending, accepted, blocked
	RequestedAt time.Time  `json:"requested_at" db:"requested_at"`
	AcceptedAt  *time.Time `json:"accepted_at" db:"accepted_at"`
}

// FriendDetail includes user information
type FriendDetail struct {
	Friend
	FriendUsername string `json:"friend_username"`
	FriendLevel    int    `json:"friend_level"`
}

// FriendPoints tracks friendship points for gacha
type FriendPoints struct {
	ID               int64      `json:"id" db:"id"`
	UserID           int64      `json:"user_id" db:"user_id"`
	Points           int        `json:"points" db:"points"`
	LastSentDate     *time.Time `json:"last_sent_date" db:"last_sent_date"`
	LastReceivedDate *time.Time `json:"last_received_date" db:"last_received_date"`
}

// BattleAction represents a player's action in battle
type BattleAction struct {
	ActionType string `json:"action_type" binding:"required"` // attack, skill, item, defend
	ActorID    int64  `json:"actor_id" binding:"required"`
	TargetID   *int64 `json:"target_id"`
	SkillID    *int64 `json:"skill_id"`
}

// TeamMember represents a character in a team
type TeamMember struct {
	UserCharacterID int64  `json:"user_character_id"`
	CharacterID     int64  `json:"character_id"`
	Name            string `json:"name"`
	Grade           int    `json:"grade"`
	Element         string `json:"element"`
	Class           string `json:"class"`
	ImageURL        string `json:"image_url"`
	Level           int    `json:"level"`
	Position        int    `json:"position"` // 0-3 for 4-member team
	CurrentHP       int    `json:"current_hp"`
	MaxHP           int    `json:"max_hp"`
	Atk             int    `json:"atk"`
	Def             int    `json:"def"`
	Spd             int    `json:"spd"`
	Buffs           []Buff `json:"buffs,omitempty"`
	Debuffs         []Buff `json:"debuffs,omitempty"`
}

// BattleStart represents the initial battle payload for clients
type BattleStart struct {
	ID         int64        `json:"id"`
	Status     string       `json:"status"`
	PlayerTeam []TeamMember `json:"player_team"`
	EnemyTeam  []TeamMember `json:"enemy_team"`
}

// Buff represents a status effect
type Buff struct {
	Type     string `json:"type"` // atk_up, def_up, stun, silence, etc.
	Value    int    `json:"value,omitempty"`
	Duration int    `json:"duration"`
	Stacks   int    `json:"stacks,omitempty"`
}

// BattleState represents the current state of a battle
type BattleState struct {
	PlayerTeam []TeamMember `json:"player_team"`
	EnemyTeam  []TeamMember `json:"enemy_team"`
	TurnOrder  []TurnOrder  `json:"turn_order"`
}

// TurnOrder represents the turn order
type TurnOrder struct {
	CharacterID int64  `json:"character_id"`
	Team        string `json:"team"` // player or enemy
	Position    int    `json:"position"`
}
