package domain

// RuneType represents the type of rune
type RuneType string

const (
	RuneTypeATK RuneType = "atk"
	RuneTypeDEF RuneType = "def"
	RuneTypeHP  RuneType = "hp"
	RuneTypeSPD RuneType = "spd"
	RuneTypeCRT RuneType = "crt"
	RuneTypeACC RuneType = "acc"
	RuneTypeRES RuneType = "res"
)

// RuneGrade represents rune quality
type RuneGrade string

const (
	RuneGradeNormal RuneGrade = "normal"
	RuneGradeMagic  RuneGrade = "magic"
	RuneGradeRare   RuneGrade = "rare"
	RuneGradeHero   RuneGrade = "hero"
	RuneGradeLegend RuneGrade = "legend"
)

// Rune represents equipment that enhances character stats
type Rune struct {
	ID              int64     `json:"id" db:"id"`
	UserCharacterID *int64    `json:"user_character_id,omitempty" db:"user_character_id"` // nil if not equipped
	UserID          int64     `json:"user_id" db:"user_id"`
	Slot            int       `json:"slot" db:"slot"` // 1-6
	RuneType        RuneType  `json:"rune_type" db:"rune_type"`
	Grade           RuneGrade `json:"grade" db:"grade"`
	Level           int       `json:"level" db:"level"`         // 0-15
	MainStat        string    `json:"main_stat" db:"main_stat"` // Main stat type
	MainStatValue   int       `json:"main_stat_value" db:"main_stat_value"`
	SubStat1        string    `json:"sub_stat_1,omitempty" db:"sub_stat_1"`
	SubStat1Value   int       `json:"sub_stat_1_value,omitempty" db:"sub_stat_1_value"`
	SubStat2        string    `json:"sub_stat_2,omitempty" db:"sub_stat_2"`
	SubStat2Value   int       `json:"sub_stat_2_value,omitempty" db:"sub_stat_2_value"`
	SubStat3        string    `json:"sub_stat_3,omitempty" db:"sub_stat_3"`
	SubStat3Value   int       `json:"sub_stat_3_value,omitempty" db:"sub_stat_3_value"`
	SubStat4        string    `json:"sub_stat_4,omitempty" db:"sub_stat_4"`
	SubStat4Value   int       `json:"sub_stat_4_value,omitempty" db:"sub_stat_4_value"`
}

// GetFixedSlotStats returns which stats are fixed for specific slots
func GetFixedSlotStats(slot int) []RuneType {
	fixedSlots := map[int][]RuneType{
		1: {RuneTypeATK},
		3: {RuneTypeDEF},
		5: {RuneTypeHP},
	}
	return fixedSlots[slot]
}

// IsEquipped returns true if the rune is equipped to a character
func (r *Rune) IsEquipped() bool {
	return r.UserCharacterID != nil
}
