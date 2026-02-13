package engine

import (
	"collection-game/internal/domain"
)

// SelectAIAction chooses a skill and targets for an AI-controlled unit.
func SelectAIAction(session *domain.BattleSession, actor *domain.BattleUnit) (skillIndex int, targetIDs []string) {
	// Priority logic:
	// 1. Healer + ally HP < 50% → use heal skill
	// 2. Use strongest available skill (highest slot with CD=0)
	// 3. Default: basic attack (slot 0)

	allies := getAliveAllies(session, actor.Team)
	enemies := getAliveEnemies(session, actor.Team)

	// Check forced target from taunt
	forcedTarget := ""
	for _, d := range actor.Debuffs {
		if d.EffectType == "taunt" && d.SourceID != "" {
			forcedTarget = d.SourceID
			break
		}
	}

	// Silence: can only use basic attack
	isSilenced := HasEffect(actor.Debuffs, "silence")

	// Check if we should heal
	if !isSilenced && forcedTarget == "" {
		for _, skill := range actor.Skills {
			if skill.SkillType == domain.SkillTypeHeal && skill.CurrentCD == 0 {
				// Check if any ally needs healing (< 50% HP)
				needsHeal := false
				var healTarget *domain.BattleUnit
				for _, a := range allies {
					hpRatio := float64(a.HP) / float64(a.MaxHP)
					if hpRatio < 0.5 {
						needsHeal = true
						if healTarget == nil || float64(a.HP)/float64(a.MaxHP) < float64(healTarget.HP)/float64(healTarget.MaxHP) {
							healTarget = a
						}
					}
				}
				if needsHeal && healTarget != nil {
					targets := []string{healTarget.UnitID}
					if skill.TargetType == domain.TargetAllAllies || skill.TargetType == domain.TargetSelf {
						targets = nil
					}
					return skill.SlotIndex, targets
				}
			}
		}

		// Check if we should buff
		for _, skill := range actor.Skills {
			if skill.SkillType == domain.SkillTypeBuff && skill.CurrentCD == 0 {
				targets := []string{actor.UnitID}
				if skill.TargetType == domain.TargetAllAllies {
					targets = nil
				}
				return skill.SlotIndex, targets
			}
		}
	}

	// Use strongest available damage skill (highest slot index first)
	if !isSilenced && forcedTarget == "" {
		for i := len(actor.Skills) - 1; i >= 1; i-- {
			skill := actor.Skills[i]
			if skill.CurrentCD == 0 && (skill.SkillType == domain.SkillTypeDamage || skill.SkillType == domain.SkillTypeDebuff) {
				target := selectDamageTarget(enemies, "")
				if target != nil {
					return skill.SlotIndex, []string{target.UnitID}
				}
			}
		}
	}

	// Default: basic attack (slot 0)
	target := selectDamageTarget(enemies, forcedTarget)
	if target != nil {
		return 0, []string{target.UnitID}
	}

	return 0, nil
}

// selectDamageTarget picks the best target for a damage skill.
func selectDamageTarget(enemies []*domain.BattleUnit, forcedTargetID string) *domain.BattleUnit {
	if len(enemies) == 0 {
		return nil
	}

	// If forced (taunt), find that target
	if forcedTargetID != "" {
		for _, e := range enemies {
			if e.UnitID == forcedTargetID && e.IsAlive {
				return e
			}
		}
	}

	// Target lowest HP enemy
	lowest := enemies[0]
	for _, e := range enemies[1:] {
		if e.HP < lowest.HP {
			lowest = e
		}
	}
	return lowest
}
