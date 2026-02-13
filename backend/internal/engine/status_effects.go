package engine

import (
	"math"
	"math/rand"

	"collection-game/internal/domain"
)

// ProcessTurnStartEffects processes effects at the start of a unit's turn.
// Returns: events from DoTs, whether the unit can act, and forced target (taunt).
func ProcessTurnStartEffects(unit *domain.BattleUnit, turnNumber int) (events []domain.TurnEvent, canAct bool, forcedTargetID string) {
	canAct = true
	forcedTargetID = ""

	if !unit.IsAlive {
		canAct = false
		return
	}

	// Check stun/freeze/sleep - skip turn
	if HasEffect(unit.Debuffs, "stun") || HasEffect(unit.Debuffs, "freeze") {
		canAct = false
		return
	}
	if HasEffect(unit.Debuffs, "sleep") {
		canAct = false
		return
	}

	// Process DoT effects
	// Poison: 5% MaxHP per turn
	if HasEffect(unit.Debuffs, "poison") {
		dot := int(math.Round(float64(unit.MaxHP) * 0.05))
		unit.HP -= dot
		if unit.HP <= 0 {
			unit.HP = 0
			unit.IsAlive = false
		}
		events = append(events, domain.TurnEvent{
			TurnNumber: turnNumber,
			ActorID:    unit.UnitID,
			ActorName:  unit.Name,
			SkillName:  "Poison",
			EventType:  "dot",
			Targets: []domain.TargetResult{{
				TargetID:   unit.UnitID,
				TargetName: unit.Name,
				Damage:     dot,
				HPAfter:    unit.HP,
				IsKill:     !unit.IsAlive,
			}},
		})
	}

	// Burn: 3% MaxHP per turn
	if HasEffect(unit.Debuffs, "burn") {
		dot := int(math.Round(float64(unit.MaxHP) * 0.03))
		unit.HP -= dot
		if unit.HP <= 0 {
			unit.HP = 0
			unit.IsAlive = false
		}
		events = append(events, domain.TurnEvent{
			TurnNumber: turnNumber,
			ActorID:    unit.UnitID,
			ActorName:  unit.Name,
			SkillName:  "Burn",
			EventType:  "dot",
			Targets: []domain.TargetResult{{
				TargetID:   unit.UnitID,
				TargetName: unit.Name,
				Damage:     dot,
				HPAfter:    unit.HP,
				IsKill:     !unit.IsAlive,
			}},
		})
	}

	// Taunt: force attack the taunter
	for _, d := range unit.Debuffs {
		if d.EffectType == "taunt" && d.SourceID != "" {
			forcedTargetID = d.SourceID
			break
		}
	}

	return
}

// ApplyStatusEffect attempts to apply a status effect (ACC vs RES check).
func ApplyStatusEffect(source, target *domain.BattleUnit, effectType string, value float64, duration int) bool {
	// Immune buff blocks all debuffs
	if HasEffect(target.Buffs, "immune") {
		return false
	}

	acc := source.Accuracy
	if acc <= 0 {
		acc = 85.0
	}
	res := target.Resistance
	if res <= 0 {
		res = 15.0
	}

	// Glancing reduces debuff chance by 50%
	if HasEffect(source.Debuffs, "glancing") {
		acc *= 0.5
	}

	// Hit chance: ACC - RES, minimum 15%
	hitChance := math.Max(15.0, acc-res)
	if rand.Float64()*100 >= hitChance {
		return false
	}

	effect := domain.ActiveEffect{
		EffectType: effectType,
		Value:      value,
		Duration:   duration,
		SourceID:   source.UnitID,
	}

	// Determine if it's a buff or debuff
	if isBuff(effectType) {
		target.Buffs = append(target.Buffs, effect)
	} else {
		target.Debuffs = append(target.Debuffs, effect)
	}

	return true
}

// TickEffectDurations decreases duration of all effects and removes expired ones.
func TickEffectDurations(unit *domain.BattleUnit) {
	unit.Buffs = tickAndFilter(unit.Buffs)
	unit.Debuffs = tickAndFilter(unit.Debuffs)
}

func tickAndFilter(effects []domain.ActiveEffect) []domain.ActiveEffect {
	result := make([]domain.ActiveEffect, 0, len(effects))
	for i := range effects {
		effects[i].Duration--
		if effects[i].Duration > 0 {
			result = append(result, effects[i])
		}
	}
	return result
}

func isBuff(effectType string) bool {
	buffs := map[string]bool{
		"atk_up": true, "def_up": true, "spd_up": true,
		"crit_up": true, "immune": true, "invincible": true,
		"shield": true, "endure": true,
	}
	return buffs[effectType]
}
