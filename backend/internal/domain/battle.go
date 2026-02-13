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
	UserCharacterID int64   `json:"user_character_id"`
	CharacterID     int64   `json:"character_id"`
	Name            string  `json:"name"`
	Grade           int     `json:"grade"`
	Element         string  `json:"element"`
	Class           string  `json:"class"`
	ImageURL        string  `json:"image_url"`
	Level           int     `json:"level"`
	Position        int     `json:"position"` // 0-3 for 4-member team
	CurrentHP       int     `json:"current_hp"`
	MaxHP           int     `json:"max_hp"`
	Atk             int     `json:"atk"`
	Def             int     `json:"def"`
	Spd             int     `json:"spd"`
	CritRate        float64 `json:"crit_rate"`
	CritDamage      float64 `json:"crit_damage"`
	Accuracy        float64 `json:"accuracy"`
	Resistance      float64 `json:"resistance"`
	Buffs           []Buff  `json:"buffs,omitempty"`
	Debuffs         []Buff  `json:"debuffs,omitempty"`
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

// BattleState represents the current state of a battle (legacy, kept for compatibility)
type BattleStateLegacy struct {
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

// ============================================================
// ATB Battle System Types
// ============================================================

// BattlePhase represents the current phase of a battle
type BattlePhase string

const (
	PhaseReady        BattlePhase = "ready"
	PhaseInWave       BattlePhase = "in_wave"
	PhaseActionSelect BattlePhase = "action_select"
	PhaseAnimating    BattlePhase = "animating"
	PhaseWaveClear    BattlePhase = "wave_clear"
	PhaseBattleEnd    BattlePhase = "battle_end"
)

// BattleSession holds the full ATB battle state (stored as JSONB in battles.battle_state)
type BattleSession struct {
	CurrentWave     int            `json:"current_wave"`
	TotalWaves      int            `json:"total_waves"`
	Waves           []WaveConfig   `json:"waves"`
	Allies          []*BattleUnit  `json:"allies"`
	Enemies         []*BattleUnit  `json:"enemies"`
	TickCount       int64          `json:"tick_count"`
	LastTickTime    time.Time      `json:"last_tick_time"`
	SpeedMultiplier float64        `json:"speed_multiplier"` // 1.0 or 2.0
	AutoMode        bool           `json:"auto_mode"`
	Phase           BattlePhase    `json:"phase"`
	ActiveUnitID    string         `json:"active_unit_id,omitempty"`
	TurnCounter     int            `json:"turn_counter"`
	EventLog        []TurnEvent    `json:"event_log,omitempty"`
}

// WaveConfig defines enemies for one wave
type WaveConfig struct {
	Wave    int           `json:"wave"`
	Enemies []BattleUnit `json:"enemies"`
}

// BattleUnit represents a unit in combat with ATB gauge
type BattleUnit struct {
	UnitID    string         `json:"unit_id"`    // "ally_0", "enemy_0_w1", etc.
	Team      string         `json:"team"`       // "ally" or "enemy"
	CharID    int64          `json:"char_id"`    // character template ID
	Name      string         `json:"name"`
	Grade     int            `json:"grade"`
	Element   string         `json:"element"`
	Class     string         `json:"class"`
	ImageURL  string         `json:"image_url"`
	Level     int            `json:"level"`
	Position  int            `json:"position"`

	// Current stats
	HP         int     `json:"hp"`
	MaxHP      int     `json:"max_hp"`
	ATK        int     `json:"atk"`
	DEF        int     `json:"def"`
	SPD        int     `json:"spd"`
	CritRate   float64 `json:"crit_rate"`
	CritDamage float64 `json:"crit_damage"`
	Accuracy   float64 `json:"accuracy"`
	Resistance float64 `json:"resistance"`

	// ATB
	ATBGauge float64 `json:"atb_gauge"` // 0-100

	// Skills
	Skills []BattleSkill `json:"skills"`

	// Active effects
	Buffs   []ActiveEffect `json:"buffs,omitempty"`
	Debuffs []ActiveEffect `json:"debuffs,omitempty"`

	// State
	IsAlive bool `json:"is_alive"`
}

// BattleSkill represents a skill during battle
type BattleSkill struct {
	SkillID    int64      `json:"skill_id"`
	SlotIndex  int        `json:"slot_index"` // 0-3
	Name       string     `json:"name"`
	SkillType  SkillType  `json:"skill_type"`
	TargetType TargetType `json:"target_type"`
	Multiplier float64    `json:"multiplier"`
	MaxCooldown int       `json:"max_cooldown"`
	CurrentCD  int        `json:"current_cd"`
	Effects    string     `json:"effects"` // JSON effects string
}

// ActiveEffect represents a buff or debuff on a unit
type ActiveEffect struct {
	EffectType string  `json:"effect_type"` // stun, poison, atk_up, def_down, etc.
	Value      float64 `json:"value"`
	Duration   int     `json:"duration"`   // remaining turns
	SourceID   string  `json:"source_id"`  // who applied it
}

// TurnEvent represents what happened during a turn
type TurnEvent struct {
	TurnNumber int            `json:"turn_number"`
	ActorID    string         `json:"actor_id"`
	ActorName  string         `json:"actor_name"`
	SkillName  string         `json:"skill_name"`
	SkillID    int64          `json:"skill_id"`
	Targets    []TargetResult `json:"targets"`
	EventType  string         `json:"event_type"` // attack, skill, dot, status_expire
}

// TargetResult represents the result on one target
type TargetResult struct {
	TargetID   string  `json:"target_id"`
	TargetName string  `json:"target_name"`
	Damage     int     `json:"damage,omitempty"`
	Heal       int     `json:"heal,omitempty"`
	IsCrit     bool    `json:"is_crit,omitempty"`
	IsKill     bool    `json:"is_kill,omitempty"`
	HPAfter    int     `json:"hp_after"`
	Applied    []string `json:"applied,omitempty"` // effects applied
	Resisted   []string `json:"resisted,omitempty"` // effects resisted
}

// DamageResult holds calculated damage details
type DamageResult struct {
	Damage        int
	IsCrit        bool
	ElementBonus  float64
	EffectiveATK  int
	EffectiveDEF  int
}

// ============================================================
// API Request/Response Types
// ============================================================

// BattleActionRequest is the client's action submission
type BattleActionRequest struct {
	UnitID     string  `json:"unit_id"`
	SkillIndex int     `json:"skill_index"`
	TargetIDs  []string `json:"target_ids"`
}

// BattleStateResponse is returned by GET /battle/:id/state
type BattleStateResponse struct {
	BattleID        int64          `json:"battle_id"`
	Phase           BattlePhase    `json:"phase"`
	CurrentWave     int            `json:"current_wave"`
	TotalWaves      int            `json:"total_waves"`
	Allies          []*BattleUnit  `json:"allies"`
	Enemies         []*BattleUnit  `json:"enemies"`
	ActiveUnitID    string         `json:"active_unit_id,omitempty"`
	AutoMode        bool           `json:"auto_mode"`
	SpeedMultiplier float64        `json:"speed_multiplier"`
	TurnCounter     int            `json:"turn_counter"`
	Events          []TurnEvent    `json:"events,omitempty"`
}

// BattleResultResponse is returned by GET /battle/:id/result
type BattleResultResponse struct {
	BattleID    int64  `json:"battle_id"`
	Result      string `json:"result"` // victory, defeat
	WavesCleared int   `json:"waves_cleared"`
	Gold        int64  `json:"gold"`
	Exp         int64  `json:"exp"`
	Crystals    int64  `json:"crystals"`
}
