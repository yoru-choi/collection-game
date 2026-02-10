package domain

import "time"

// SummonType represents the type of summon
type SummonType string

const (
	SummonTypeNormal  SummonType = "normal"
	SummonTypePremium SummonType = "premium"
)

// SummonResult represents the result of a summon
type SummonResult struct {
	CharacterID int64      `json:"character_id"`
	Character   *Character `json:"character"`
	IsNew       bool       `json:"is_new"` // First time obtaining this character
}

// SummonHistory tracks user's summon history
type SummonHistory struct {
	ID          int64      `json:"id" db:"id"`
	UserID      int64      `json:"user_id" db:"user_id"`
	SummonType  SummonType `json:"summon_type" db:"summon_type"`
	CharacterID int64      `json:"character_id" db:"character_id"`
	CreatedAt   time.Time  `json:"created_at" db:"created_at"`
}

// Gacha rates based on PRD
var GachaRates = map[int]float64{
	1: 50.0, // 1-star: 50%
	2: 30.0, // 2-star: 30%
	3: 15.0, // 3-star: 15%
	4: 4.0,  // 4-star: 4%
	5: 1.0,  // 5-star: 1%
}

// PremiumGachaRates - higher rates for premium summons
var PremiumGachaRates = map[int]float64{
	1: 20.0, // 1-star: 20%
	2: 30.0, // 2-star: 30%
	3: 35.0, // 3-star: 35%
	4: 12.0, // 4-star: 12%
	5: 3.0,  // 5-star: 3%
}

// Summon costs
const (
	NormalSummonCost  = 100 // Gold cost
	PremiumSummonCost = 300 // Crystal cost
)
