package domain

import "time"

// Element represents character element type
type Element string

const (
	ElementFire  Element = "fire"
	ElementWater Element = "water"
	ElementWind  Element = "wind"
	ElementLight Element = "light"
	ElementDark  Element = "dark"
)

// Class represents character class
type Class string

const (
	ClassWarrior  Class = "warrior"
	ClassMage     Class = "mage"
	ClassHealer   Class = "healer"
	ClassAssassin Class = "assassin"
	ClassTank     Class = "tank"
	ClassSupport  Class = "support"
)

// Character represents the base character template
type Character struct {
	ID       int64   `json:"id" db:"id"`
	Name     string  `json:"name" db:"name"`
	Grade    int     `json:"grade" db:"grade"` // Star rating (1-5)
	Element  Element `json:"element" db:"element"`
	Class    Class   `json:"class" db:"class"`
	BaseHP   int     `json:"base_hp" db:"base_hp"`
	BaseATK  int     `json:"base_atk" db:"base_atk"`
	BaseDEF  int     `json:"base_def" db:"base_def"`
	BaseSPD  int     `json:"base_spd" db:"base_spd"`
	Skill1ID int64   `json:"skill_1_id" db:"skill_1_id"`
	Skill2ID int64   `json:"skill_2_id" db:"skill_2_id"`
	Skill3ID int64   `json:"skill_3_id" db:"skill_3_id"`
	Skill4ID int64   `json:"skill_4_id" db:"skill_4_id"`
	ImageURL string  `json:"image_url" db:"image_url"`
}

// UserCharacter represents a character owned by a user
type UserCharacter struct {
	ID          int64     `json:"id" db:"id"`
	UserID      int64     `json:"user_id" db:"user_id"`
	CharacterID int64     `json:"character_id" db:"character_id"`
	Level       int       `json:"level" db:"level"`
	Exp         int64     `json:"exp" db:"exp"`
	CurrentHP   int       `json:"current_hp" db:"current_hp"`
	CurrentATK  int       `json:"current_atk" db:"current_atk"`
	CurrentDEF  int       `json:"current_def" db:"current_def"`
	CurrentSPD  int       `json:"current_spd" db:"current_spd"`
	CritRate    float64   `json:"crit_rate" db:"crit_rate"`     // Critical rate (%)
	CritDamage  float64   `json:"crit_damage" db:"crit_damage"` // Critical damage (%)
	Accuracy    float64   `json:"accuracy" db:"accuracy"`       // Accuracy (%)
	Resistance  float64   `json:"resistance" db:"resistance"`   // Resistance (%)
	Skill1Level int       `json:"skill_1_level" db:"skill_1_level"`
	Skill2Level int       `json:"skill_2_level" db:"skill_2_level"`
	Skill3Level int       `json:"skill_3_level" db:"skill_3_level"`
	Skill4Level int       `json:"skill_4_level" db:"skill_4_level"`
	Awakened    bool      `json:"awakened" db:"awakened"` // Evolution status
	ObtainedAt  time.Time `json:"obtained_at" db:"obtained_at"`
}

// PartyMember represents a user-selected party slot
type PartyMember struct {
	UserID          int64 `json:"user_id" db:"user_id"`
	SlotIndex       int   `json:"slot_index" db:"slot_index"`
	UserCharacterID int64 `json:"user_character_id" db:"user_character_id"`
}

// CharacterDetail combines Character and UserCharacter info
type CharacterDetail struct {
	// User character info (from user_characters table)
	ID          int64     `json:"id"`
	UserID      int64     `json:"user_id"`
	CharacterID int64     `json:"character_id"` // references Character.ID
	Level       int       `json:"level"`
	Exp         int64     `json:"exp"`
	CurrentHP   int       `json:"current_hp"`
	CurrentATK  int       `json:"current_atk"`
	CurrentDEF  int       `json:"current_def"`
	CurrentSPD  int       `json:"current_spd"`
	CritRate    float64   `json:"crit_rate"`
	CritDamage  float64   `json:"crit_damage"`
	Accuracy    float64   `json:"accuracy"`
	Resistance  float64   `json:"resistance"`
	Skill1Level int       `json:"skill_1_level"`
	Skill2Level int       `json:"skill_2_level"`
	Skill3Level int       `json:"skill_3_level"`
	Skill4Level int       `json:"skill_4_level"`
	Awakened    bool      `json:"awakened"`
	ObtainedAt  time.Time `json:"obtained_at"`

	// Base character info (from characters table)
	Name     string  `json:"character_name"`
	Grade    int     `json:"grade"`
	Element  Element `json:"element"`
	Class    Class   `json:"class"`
	BaseHP   int     `json:"base_hp"`
	BaseATK  int     `json:"base_atk"`
	BaseDEF  int     `json:"base_def"`
	BaseSPD  int     `json:"base_spd"`
	ImageURL string  `json:"image_url"`
}

// GetMaxLevel returns the maximum level based on grade
func GetMaxLevel(grade int) int {
	maxLevels := map[int]int{
		1: 15,
		2: 25,
		3: 35,
		4: 45,
		5: 60,
	}
	if level, exists := maxLevels[grade]; exists {
		return level
	}
	return 15
}

// CalculateStats calculates current stats based on base stats and level
func (uc *UserCharacter) CalculateStats(baseChar *Character) {
	// Simple linear scaling for now
	levelMultiplier := 1.0 + float64(uc.Level-1)*0.05
	uc.CurrentHP = int(float64(baseChar.BaseHP) * levelMultiplier)
	uc.CurrentATK = int(float64(baseChar.BaseATK) * levelMultiplier)
	uc.CurrentDEF = int(float64(baseChar.BaseDEF) * levelMultiplier)
	uc.CurrentSPD = int(float64(baseChar.BaseSPD) * levelMultiplier)
}
