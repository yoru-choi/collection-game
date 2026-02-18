package engine

import (
	"math"
	"math/rand"

	"collection-game/internal/domain"
)

// CalculateDamage computes damage from attacker to defender using a skill.
// Formula: ATK * Multiplier * (ATK / (ATK + DEF)) * ElementAdv * CritBonus
func CalculateDamage(attacker, defender *domain.BattleUnit, skill *domain.BattleSkill) domain.DamageResult {
	effATK := ApplyBuffModifierATK(attacker)
	effDEF := ApplyBuffModifierDEF(defender)

	if effDEF < 1 {
		effDEF = 1
	}

	multiplier := skill.Multiplier
	if multiplier <= 0 {
		multiplier = 1.0
	}

	// Base damage: ATK * Multiplier * ATK/(ATK+DEF)
	ratio := float64(effATK) / float64(effATK+effDEF)
	baseDmg := float64(effATK) * multiplier * ratio

	// Element advantage
	elemMult := GetElementMultiplier(attacker.Element, defender.Element)
	baseDmg *= elemMult

	// Crit check
	isCrit := false
	critRate := attacker.CritRate
	if critRate <= 0 {
		critRate = 15.0 // default 15%
	}
	// Check for glancing (debuff disables crit)
	if !HasEffect(attacker.Debuffs, "glancing") && rand.Float64()*100 < critRate {
		isCrit = true
		critDmg := attacker.CritDamage
		if critDmg <= 0 {
			critDmg = 50.0 // default +50%
		}
		baseDmg *= (1.0 + critDmg/100.0)
	}

	// Glancing hit: reduce damage by 30%
	if HasEffect(attacker.Debuffs, "glancing") {
		baseDmg *= 0.7
	}

	// Invincible check
	if HasEffect(defender.Buffs, "invincible") {
		baseDmg = 0
	}

	dmg := int(math.Max(1, math.Round(baseDmg)))
	if baseDmg == 0 {
		dmg = 0
	}

	return domain.DamageResult{
		Damage:       dmg,
		IsCrit:       isCrit,
		ElementBonus: elemMult,
		EffectiveATK: effATK,
		EffectiveDEF: effDEF,
	}
}

// CalculateHeal computes healing amount.
func CalculateHeal(healer *domain.BattleUnit, skill *domain.BattleSkill) int {
	effATK := ApplyBuffModifierATK(healer)
	multiplier := skill.Multiplier
	if multiplier <= 0 {
		multiplier = 1.0
	}
	heal := float64(effATK) * multiplier
	return int(math.Max(1, math.Round(heal)))
}

// GetElementMultiplier returns damage multiplier based on attacker/defender elements.
func GetElementMultiplier(atkElement, defElement string) float64 {
	advantages := map[string]string{
		"fire":  "wind",
		"wind":  "water",
		"water": "fire",
		"light": "dark",
		"dark":  "light",
	}
	if adv, ok := advantages[atkElement]; ok && adv == defElement {
		return 1.5
	}
	// Disadvantage (reverse)
	if adv, ok := advantages[defElement]; ok && adv == atkElement {
		return 0.75
	}
	return 1.0
}

// ApplyBuffModifierATK returns effective ATK considering buffs/debuffs.
func ApplyBuffModifierATK(unit *domain.BattleUnit) int {
	atk := float64(unit.ATK)
	if HasEffect(unit.Buffs, "atk_up") {
		atk *= 1.3
	}
	if HasEffect(unit.Debuffs, "atk_down") {
		atk *= 0.7
	}
	return int(math.Round(atk))
}

// ApplyBuffModifierDEF returns effective DEF considering buffs/debuffs.
func ApplyBuffModifierDEF(unit *domain.BattleUnit) int {
	def := float64(unit.DEF)
	if HasEffect(unit.Buffs, "def_up") {
		def *= 1.3
	}
	if HasEffect(unit.Debuffs, "def_down") {
		def *= 0.7
	}
	return int(math.Round(def))
}

// HasEffect checks if a unit has a specific effect.
func HasEffect(effects []domain.ActiveEffect, effectType string) bool {
	for _, e := range effects {
		if e.EffectType == effectType {
			return true
		}
	}
	return false
}
