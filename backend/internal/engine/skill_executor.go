package engine

import (
	"encoding/json"

	"collection-game/internal/domain"
)

// ExecuteSkill executes a skill by an actor against targets, returning the turn event.
func ExecuteSkill(session *domain.BattleSession, actor *domain.BattleUnit, skill *domain.BattleSkill, targetIDs []string) domain.TurnEvent {
	session.TurnCounter++
	event := domain.TurnEvent{
		TurnNumber: session.TurnCounter,
		ActorID:    actor.UnitID,
		ActorName:  actor.Name,
		SkillName:  skill.Name,
		SkillID:    skill.SkillID,
		EventType:  "skill",
	}

	targets := ResolveTargets(session, actor, skill, targetIDs)

	switch skill.SkillType {
	case domain.SkillTypeHeal:
		for _, t := range targets {
			if !t.IsAlive {
				continue
			}
			heal := CalculateHeal(actor, skill)
			t.HP += heal
			if t.HP > t.MaxHP {
				t.HP = t.MaxHP
			}
			result := domain.TargetResult{
				TargetID:   t.UnitID,
				TargetName: t.Name,
				Heal:       heal,
				HPAfter:    t.HP,
			}
			event.Targets = append(event.Targets, result)
		}
	case domain.SkillTypeBuff:
		effects := parseSkillEffects(skill.Effects)
		for _, t := range targets {
			if !t.IsAlive {
				continue
			}
			result := domain.TargetResult{
				TargetID:   t.UnitID,
				TargetName: t.Name,
				HPAfter:    t.HP,
			}
			for _, eff := range effects {
				applied := ApplyBuffDirect(t, eff.Type, eff.Value, eff.Duration, actor.UnitID)
				if applied {
					result.Applied = append(result.Applied, eff.Type)
				}
			}
			event.Targets = append(event.Targets, result)
		}
	case domain.SkillTypeDebuff:
		effects := parseSkillEffects(skill.Effects)
		for _, t := range targets {
			if !t.IsAlive {
				continue
			}
			result := domain.TargetResult{
				TargetID:   t.UnitID,
				TargetName: t.Name,
				HPAfter:    t.HP,
			}
			for _, eff := range effects {
				applied := ApplyStatusEffect(actor, t, eff.Type, eff.Value, eff.Duration)
				if applied {
					result.Applied = append(result.Applied, eff.Type)
				} else {
					result.Resisted = append(result.Resisted, eff.Type)
				}
			}
			event.Targets = append(event.Targets, result)
		}
	default: // damage
		for _, t := range targets {
			if !t.IsAlive {
				continue
			}
			dmgResult := CalculateDamage(actor, t, skill)

			// Apply shield absorption
			actualDmg := dmgResult.Damage
			if HasEffect(t.Buffs, "shield") {
				for i := range t.Buffs {
					if t.Buffs[i].EffectType == "shield" {
						absorbed := int(t.Buffs[i].Value)
						if absorbed >= actualDmg {
							t.Buffs[i].Value -= float64(actualDmg)
							actualDmg = 0
						} else {
							actualDmg -= absorbed
							t.Buffs[i].Value = 0
							t.Buffs[i].Duration = 0
						}
						break
					}
				}
			}

			// Apply endure: survive with 1 HP
			isKill := false
			t.HP -= actualDmg
			if t.HP <= 0 {
				if HasEffect(t.Buffs, "endure") {
					t.HP = 1
					removeEffect(t, "endure", true)
				} else {
					t.HP = 0
					t.IsAlive = false
					isKill = true
				}
			}

			result := domain.TargetResult{
				TargetID:   t.UnitID,
				TargetName: t.Name,
				Damage:     dmgResult.Damage,
				IsCrit:     dmgResult.IsCrit,
				IsKill:     isKill,
				HPAfter:    t.HP,
			}

			// Apply additional effects from the skill
			effects := parseSkillEffects(skill.Effects)
			for _, eff := range effects {
				if eff.Type == "damage" || eff.Type == "heal" {
					continue
				}
				if t.IsAlive {
					applied := ApplyStatusEffect(actor, t, eff.Type, eff.Value, eff.Duration)
					if applied {
						result.Applied = append(result.Applied, eff.Type)
					} else {
						result.Resisted = append(result.Resisted, eff.Type)
					}
				}
			}

			event.Targets = append(event.Targets, result)
		}
	}

	// Set cooldown
	if skill.SlotIndex > 0 && skill.MaxCooldown > 0 {
		skill.CurrentCD = skill.MaxCooldown
		// Update actor's skill
		for i := range actor.Skills {
			if actor.Skills[i].SlotIndex == skill.SlotIndex {
				actor.Skills[i].CurrentCD = skill.MaxCooldown
				break
			}
		}
	}

	// Reset ATB
	actor.ATBGauge = 0

	// Reduce cooldowns for all skills of this actor
	for i := range actor.Skills {
		if actor.Skills[i].CurrentCD > 0 && actor.Skills[i].SlotIndex != skill.SlotIndex {
			actor.Skills[i].CurrentCD--
		}
	}

	return event
}

// ResolveTargets picks the actual target units based on skill target type and requested IDs.
func ResolveTargets(session *domain.BattleSession, actor *domain.BattleUnit, skill *domain.BattleSkill, requestedIDs []string) []*domain.BattleUnit {
	switch skill.TargetType {
	case domain.TargetSelf:
		return []*domain.BattleUnit{actor}

	case domain.TargetAllEnemies:
		return getAliveEnemies(session, actor.Team)

	case domain.TargetAllAllies:
		return getAliveAllies(session, actor.Team)

	case domain.TargetSingleAlly:
		allies := getAliveAllies(session, actor.Team)
		if len(requestedIDs) > 0 {
			for _, a := range allies {
				if a.UnitID == requestedIDs[0] {
					return []*domain.BattleUnit{a}
				}
			}
		}
		// Default: lowest HP ally
		if len(allies) > 0 {
			lowest := allies[0]
			for _, a := range allies[1:] {
				if float64(a.HP)/float64(a.MaxHP) < float64(lowest.HP)/float64(lowest.MaxHP) {
					lowest = a
				}
			}
			return []*domain.BattleUnit{lowest}
		}
		return nil

	default: // single_enemy
		enemies := getAliveEnemies(session, actor.Team)
		if len(requestedIDs) > 0 {
			for _, e := range enemies {
				if e.UnitID == requestedIDs[0] {
					return []*domain.BattleUnit{e}
				}
			}
		}
		// Default: lowest HP enemy
		if len(enemies) > 0 {
			lowest := enemies[0]
			for _, e := range enemies[1:] {
				if e.HP < lowest.HP {
					lowest = e
				}
			}
			return []*domain.BattleUnit{lowest}
		}
		return nil
	}
}

func getAliveEnemies(session *domain.BattleSession, actorTeam string) []*domain.BattleUnit {
	if actorTeam == "ally" {
		return aliveUnits(session.Enemies)
	}
	return aliveUnits(session.Allies)
}

func getAliveAllies(session *domain.BattleSession, actorTeam string) []*domain.BattleUnit {
	if actorTeam == "ally" {
		return aliveUnits(session.Allies)
	}
	return aliveUnits(session.Enemies)
}

func aliveUnits(units []*domain.BattleUnit) []*domain.BattleUnit {
	result := make([]*domain.BattleUnit, 0)
	for _, u := range units {
		if u.IsAlive {
			result = append(result, u)
		}
	}
	return result
}

// ApplyBuffDirect applies a buff directly without ACC/RES check (for self/ally buffs).
func ApplyBuffDirect(target *domain.BattleUnit, effectType string, value float64, duration int, sourceID string) bool {
	effect := domain.ActiveEffect{
		EffectType: effectType,
		Value:      value,
		Duration:   duration,
		SourceID:   sourceID,
	}
	if isBuff(effectType) {
		target.Buffs = append(target.Buffs, effect)
	} else {
		target.Debuffs = append(target.Debuffs, effect)
	}
	return true
}

func removeEffect(unit *domain.BattleUnit, effectType string, isBuff bool) {
	if isBuff {
		filtered := make([]domain.ActiveEffect, 0)
		for _, e := range unit.Buffs {
			if e.EffectType != effectType {
				filtered = append(filtered, e)
			}
		}
		unit.Buffs = filtered
	} else {
		filtered := make([]domain.ActiveEffect, 0)
		for _, e := range unit.Debuffs {
			if e.EffectType != effectType {
				filtered = append(filtered, e)
			}
		}
		unit.Debuffs = filtered
	}
}

type parsedEffect struct {
	Type     string  `json:"type"`
	Value    float64 `json:"value"`
	Duration int     `json:"duration"`
}

func parseSkillEffects(effectsJSON string) []parsedEffect {
	if effectsJSON == "" || effectsJSON == "null" || effectsJSON == "[]" {
		return nil
	}
	var effects []parsedEffect
	if err := json.Unmarshal([]byte(effectsJSON), &effects); err != nil {
		return nil
	}
	return effects
}
