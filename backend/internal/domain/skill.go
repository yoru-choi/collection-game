package domain

// SkillType represents the type of skill effect
type SkillType string

const (
	SkillTypeDamage SkillType = "damage"
	SkillTypeHeal   SkillType = "heal"
	SkillTypeBuff   SkillType = "buff"
	SkillTypeDebuff SkillType = "debuff"
)

// TargetType represents who the skill targets
type TargetType string

const (
	TargetSelf        TargetType = "self"
	TargetSingleEnemy TargetType = "single_enemy"
	TargetAllEnemies  TargetType = "all_enemies"
	TargetSingleAlly  TargetType = "single_ally"
	TargetAllAllies   TargetType = "all_allies"
)

// Skill represents a character skill
type Skill struct {
	ID          int64      `json:"id" db:"id"`
	Name        string     `json:"name" db:"name"`
	Description string     `json:"description" db:"description"`
	SkillType   SkillType  `json:"skill_type" db:"skill_type"`
	TargetType  TargetType `json:"target_type" db:"target_type"`
	Cooldown    int        `json:"cooldown" db:"cooldown"`     // Turns
	Multiplier  float64    `json:"multiplier" db:"multiplier"` // Damage/Heal multiplier
	Effects     string     `json:"effects" db:"effects"`       // JSON string of effects
}

// SkillEffect represents various skill effects
type SkillEffect struct {
	Type     string  `json:"type"`           // buff, debuff, stun, heal, etc.
	Value    float64 `json:"value"`          // Effect value
	Duration int     `json:"duration"`       // Turns
	Stat     string  `json:"stat,omitempty"` // Which stat is affected (ATK, DEF, SPD, etc.)
}

// StatusEffect represents an active buff/debuff on a character
type StatusEffect struct {
	EffectType string  `json:"effect_type"`
	Value      float64 `json:"value"`
	Remaining  int     `json:"remaining"` // Remaining turns
	Stat       string  `json:"stat,omitempty"`
}
