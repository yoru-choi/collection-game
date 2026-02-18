package engine

import (
	"fmt"
	"math"
	"sort"
	"time"

	"collection-game/internal/domain"
)

const (
	TickIntervalMS = 100 // 100ms per tick
	ATBMax         = 100.0
)

// AdvanceTicks simulates the given number of ATB ticks.
// Returns all turn events that occurred during the ticks.
func AdvanceTicks(session *domain.BattleSession, elapsedMS int64) []domain.TurnEvent {
	if session.Phase == domain.PhaseBattleEnd || session.Phase == domain.PhaseActionSelect {
		return nil
	}

	if session.Phase == domain.PhaseReady {
		session.Phase = domain.PhaseInWave
	}

	tickCount := elapsedMS / TickIntervalMS
	if tickCount <= 0 {
		return nil
	}

	var allEvents []domain.TurnEvent

	for tick := int64(0); tick < tickCount; tick++ {
		if session.Phase == domain.PhaseBattleEnd || session.Phase == domain.PhaseActionSelect {
			break
		}

		session.TickCount++

		// Advance ATB for all alive units
		allUnits := getAllAliveUnits(session)
		for _, unit := range allUnits {
			spdMod := getEffectiveSPD(unit)
			increment := float64(spdMod) / 100.0 * session.SpeedMultiplier
			unit.ATBGauge += increment
		}

		// Process units that reached ATB max (sorted by ATB descending, then SPD descending)
		readyUnits := getReadyUnits(session)
		for _, unit := range readyUnits {
			if session.Phase == domain.PhaseBattleEnd || session.Phase == domain.PhaseActionSelect {
				break
			}

			if !unit.IsAlive || unit.ATBGauge < ATBMax {
				continue
			}

			// Cap ATB at max
			unit.ATBGauge = ATBMax

			// Process turn start effects (DoTs, stun check, etc.)
			dotEvents, canAct, forcedTarget := ProcessTurnStartEffects(unit, session.TurnCounter+1)
			allEvents = append(allEvents, dotEvents...)

			if !unit.IsAlive {
				checkBattleEnd(session)
				continue
			}

			// Tick effect durations at turn start
			TickEffectDurations(unit)

			// Reduce skill cooldowns
			for i := range unit.Skills {
				if unit.Skills[i].CurrentCD > 0 {
					unit.Skills[i].CurrentCD--
				}
			}

			if !canAct {
				// Skip turn (stunned/frozen/asleep)
				unit.ATBGauge = 0
				continue
			}

			// Determine if we should auto-act or wait for player input
			isAlly := unit.Team == "ally"

			if isAlly && !session.AutoMode {
				// Manual mode: pause for player action selection
				session.Phase = domain.PhaseActionSelect
				session.ActiveUnitID = unit.UnitID
				break
			}

			// Auto mode or enemy: AI selects action
			skillIdx, targetIDs := SelectAIAction(session, unit)
			if forcedTarget != "" {
				targetIDs = []string{forcedTarget}
				skillIdx = 0 // forced basic attack when taunted
			}

			if skillIdx >= 0 && skillIdx < len(unit.Skills) {
				skill := &unit.Skills[skillIdx]
				event := ExecuteSkill(session, unit, skill, targetIDs)
				allEvents = append(allEvents, event)
			} else {
				unit.ATBGauge = 0
			}

			// Check if wave/battle is over
			checkWaveEnd(session, &allEvents)
			if session.Phase == domain.PhaseBattleEnd {
				break
			}
		}
	}

	session.LastTickTime = time.Now()
	return allEvents
}

// ExecutePlayerAction processes a manual player action.
func ExecutePlayerAction(session *domain.BattleSession, action domain.BattleActionRequest) (*domain.TurnEvent, error) {
	if session.Phase != domain.PhaseActionSelect {
		return nil, fmt.Errorf("not in action select phase")
	}

	if session.ActiveUnitID != action.UnitID {
		return nil, fmt.Errorf("not this unit's turn, expected %s got %s", session.ActiveUnitID, action.UnitID)
	}

	unit := findUnit(session, action.UnitID)
	if unit == nil || !unit.IsAlive {
		return nil, fmt.Errorf("unit not found or dead")
	}

	if action.SkillIndex < 0 || action.SkillIndex >= len(unit.Skills) {
		return nil, fmt.Errorf("invalid skill index")
	}

	skill := &unit.Skills[action.SkillIndex]
	if skill.CurrentCD > 0 {
		return nil, fmt.Errorf("skill on cooldown (%d turns remaining)", skill.CurrentCD)
	}

	// Silence check: only basic attack allowed
	if HasEffect(unit.Debuffs, "silence") && action.SkillIndex > 0 {
		return nil, fmt.Errorf("silenced: can only use basic attack")
	}

	event := ExecuteSkill(session, unit, skill, action.TargetIDs)

	// Resume battle
	session.Phase = domain.PhaseInWave
	session.ActiveUnitID = ""

	// Check wave/battle end
	checkWaveEnd(session, nil)

	return &event, nil
}

// RunFullAutoBattle runs an entire battle in auto mode (for arena simulation).
// Returns the final session state after all waves.
func RunFullAutoBattle(session *domain.BattleSession, maxTurns int) {
	session.AutoMode = true
	session.SpeedMultiplier = 2.0
	session.Phase = domain.PhaseInWave

	for i := 0; i < maxTurns; i++ {
		if session.Phase == domain.PhaseBattleEnd {
			break
		}
		// Simulate a single large tick batch
		AdvanceTicks(session, TickIntervalMS*10)
	}

	// If battle didn't end in maxTurns, consider it a loss
	if session.Phase != domain.PhaseBattleEnd {
		session.Phase = domain.PhaseBattleEnd
	}
}

// Helper functions

func getAllAliveUnits(session *domain.BattleSession) []*domain.BattleUnit {
	var result []*domain.BattleUnit
	for _, u := range session.Allies {
		if u.IsAlive {
			result = append(result, u)
		}
	}
	for _, u := range session.Enemies {
		if u.IsAlive {
			result = append(result, u)
		}
	}
	return result
}

func getReadyUnits(session *domain.BattleSession) []*domain.BattleUnit {
	var ready []*domain.BattleUnit
	for _, u := range session.Allies {
		if u.IsAlive && u.ATBGauge >= ATBMax {
			ready = append(ready, u)
		}
	}
	for _, u := range session.Enemies {
		if u.IsAlive && u.ATBGauge >= ATBMax {
			ready = append(ready, u)
		}
	}
	// Sort by ATB descending, then by SPD descending
	sort.Slice(ready, func(i, j int) bool {
		if ready[i].ATBGauge != ready[j].ATBGauge {
			return ready[i].ATBGauge > ready[j].ATBGauge
		}
		return ready[i].SPD > ready[j].SPD
	})
	return ready
}

func getEffectiveSPD(unit *domain.BattleUnit) int {
	spd := float64(unit.SPD)
	if HasEffect(unit.Buffs, "spd_up") {
		spd *= 1.3
	}
	if HasEffect(unit.Debuffs, "spd_down") {
		spd *= 0.7
	}
	return int(math.Max(1, math.Round(spd)))
}

func findUnit(session *domain.BattleSession, unitID string) *domain.BattleUnit {
	for _, u := range session.Allies {
		if u.UnitID == unitID {
			return u
		}
	}
	for _, u := range session.Enemies {
		if u.UnitID == unitID {
			return u
		}
	}
	return nil
}

func checkBattleEnd(session *domain.BattleSession) {
	alliesAlive := false
	for _, u := range session.Allies {
		if u.IsAlive {
			alliesAlive = true
			break
		}
	}
	if !alliesAlive {
		session.Phase = domain.PhaseBattleEnd
	}
}

func checkWaveEnd(session *domain.BattleSession, events *[]domain.TurnEvent) {
	// Check if all allies are dead -> defeat
	alliesAlive := false
	for _, u := range session.Allies {
		if u.IsAlive {
			alliesAlive = true
			break
		}
	}
	if !alliesAlive {
		session.Phase = domain.PhaseBattleEnd
		return
	}

	// Check if all enemies are dead -> wave clear
	enemiesAlive := false
	for _, u := range session.Enemies {
		if u.IsAlive {
			enemiesAlive = true
			break
		}
	}

	if !enemiesAlive {
		// Wave cleared
		session.CurrentWave++
		if session.CurrentWave >= session.TotalWaves {
			// All waves done -> victory
			session.Phase = domain.PhaseBattleEnd
			return
		}

		// Load next wave
		if session.CurrentWave < len(session.Waves) {
			nextWave := session.Waves[session.CurrentWave]
			session.Enemies = make([]*domain.BattleUnit, len(nextWave.Enemies))
			for i := range nextWave.Enemies {
				enemy := nextWave.Enemies[i]
				session.Enemies[i] = &enemy
			}
		}

		// Keep allies ATB (don't reset), resume battle
		session.Phase = domain.PhaseInWave
	}
}

// AllAlliesDead returns true if all ally units are dead.
func AllAlliesDead(session *domain.BattleSession) bool {
	for _, u := range session.Allies {
		if u.IsAlive {
			return false
		}
	}
	return true
}

// AllEnemiesDead returns true if all current enemy units are dead.
func AllEnemiesDead(session *domain.BattleSession) bool {
	for _, u := range session.Enemies {
		if u.IsAlive {
			return false
		}
	}
	return true
}
