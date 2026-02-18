package usecase

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"collection-game/internal/domain"
	"collection-game/internal/engine"
	"collection-game/internal/repository"
)

type BattleUseCase interface {
	StartBattle(ctx context.Context, userID int64, battleType string, referenceID *int64, playerTeam []domain.TeamMember, waves []domain.WaveConfig) (*domain.BattleStateResponse, error)
	GetState(ctx context.Context, userID int64, battleID int64) (*domain.BattleStateResponse, error)
	SubmitAction(ctx context.Context, userID int64, battleID int64, action domain.BattleActionRequest) (*domain.BattleStateResponse, error)
	SetAutoMode(ctx context.Context, userID int64, battleID int64, auto bool) (*domain.BattleStateResponse, error)
	SetSpeed(ctx context.Context, userID int64, battleID int64, speed float64) (*domain.BattleStateResponse, error)
	Surrender(ctx context.Context, userID int64, battleID int64) error
	GetResult(ctx context.Context, userID int64, battleID int64) (*domain.BattleResultResponse, error)
}

type battleUseCase struct {
	battleRepo repository.BattleRepository
	skillRepo  repository.SkillRepository
}

func NewBattleUseCase(battleRepo repository.BattleRepository, skillRepo repository.SkillRepository) BattleUseCase {
	return &battleUseCase{
		battleRepo: battleRepo,
		skillRepo:  skillRepo,
	}
}

func (uc *battleUseCase) StartBattle(ctx context.Context, userID int64, battleType string, referenceID *int64, playerTeam []domain.TeamMember, waves []domain.WaveConfig) (*domain.BattleStateResponse, error) {
	// Build BattleSession
	allies := make([]*domain.BattleUnit, len(playerTeam))
	for i, m := range playerTeam {
		allies[i] = teamMemberToBattleUnit(m, fmt.Sprintf("ally_%d", i), "ally")
	}

	// Load skills for allies
	if err := uc.loadSkillsForUnits(ctx, allies, playerTeam); err != nil {
		return nil, fmt.Errorf("failed to load ally skills: %w", err)
	}

	// First wave enemies
	var firstWaveEnemies []*domain.BattleUnit
	if len(waves) > 0 {
		for i := range waves[0].Enemies {
			enemy := waves[0].Enemies[i]
			firstWaveEnemies = append(firstWaveEnemies, &enemy)
		}
	}

	session := &domain.BattleSession{
		CurrentWave:     0,
		TotalWaves:      len(waves),
		Waves:           waves,
		Allies:          allies,
		Enemies:         firstWaveEnemies,
		TickCount:       0,
		LastTickTime:    time.Now(),
		SpeedMultiplier: 1.0,
		AutoMode:        false,
		Phase:           domain.PhaseInWave,
		TurnCounter:     0,
	}

	sessionJSON, err := json.Marshal(session)
	if err != nil {
		return nil, err
	}

	playerTeamJSON, _ := json.Marshal(playerTeam)
	enemyTeamJSON, _ := json.Marshal(waves)

	battle := &domain.Battle{
		UserID:      userID,
		BattleType:  battleType,
		ReferenceID: referenceID,
		PlayerTeam:  playerTeamJSON,
		EnemyTeam:   enemyTeamJSON,
		CurrentTurn: 0,
		BattleState: sessionJSON,
		Status:      "ongoing",
		Rewards:     json.RawMessage(`{}`),
	}

	if err := uc.battleRepo.Create(ctx, battle); err != nil {
		return nil, fmt.Errorf("failed to create battle: %w", err)
	}

	return uc.buildStateResponse(battle.ID, session), nil
}

func (uc *battleUseCase) GetState(ctx context.Context, userID int64, battleID int64) (*domain.BattleStateResponse, error) {
	battle, err := uc.battleRepo.GetByID(ctx, battleID)
	if err != nil {
		return nil, err
	}
	if battle.UserID != userID {
		return nil, fmt.Errorf("not your battle")
	}

	session, err := uc.unmarshalSession(battle.BattleState)
	if err != nil {
		return nil, err
	}

	if battle.Status == "ongoing" && session.Phase != domain.PhaseActionSelect {
		// Lazy tick calculation
		elapsed := time.Since(session.LastTickTime).Milliseconds()
		if elapsed > 0 {
			events := engine.AdvanceTicks(session, elapsed)
			session.EventLog = append(session.EventLog, events...)

			// Persist updated state
			if err := uc.saveSession(ctx, battle.ID, session); err != nil {
				return nil, err
			}

			// Check if battle ended
			if session.Phase == domain.PhaseBattleEnd {
				status := "defeat"
				if !engine.AllAlliesDead(session) {
					status = "victory"
				}
				uc.battleRepo.Finish(ctx, battle.ID, status, json.RawMessage(`{}`))
			}
		}
	}

	resp := uc.buildStateResponse(battle.ID, session)
	// Include recent events
	if len(session.EventLog) > 20 {
		resp.Events = session.EventLog[len(session.EventLog)-20:]
	} else {
		resp.Events = session.EventLog
	}
	// Clear event log after sending
	session.EventLog = nil
	uc.saveSession(ctx, battle.ID, session)

	return resp, nil
}

func (uc *battleUseCase) SubmitAction(ctx context.Context, userID int64, battleID int64, action domain.BattleActionRequest) (*domain.BattleStateResponse, error) {
	battle, err := uc.battleRepo.GetByID(ctx, battleID)
	if err != nil {
		return nil, err
	}
	if battle.UserID != userID {
		return nil, fmt.Errorf("not your battle")
	}
	if battle.Status != "ongoing" {
		return nil, fmt.Errorf("battle already ended")
	}

	session, err := uc.unmarshalSession(battle.BattleState)
	if err != nil {
		return nil, err
	}

	event, err := engine.ExecutePlayerAction(session, action)
	if err != nil {
		return nil, err
	}

	if event != nil {
		session.EventLog = append(session.EventLog, *event)
	}

	// Continue ticking after player action
	events := engine.AdvanceTicks(session, engine.TickIntervalMS*5)
	session.EventLog = append(session.EventLog, events...)

	if err := uc.saveSession(ctx, battle.ID, session); err != nil {
		return nil, err
	}

	// Check battle end
	if session.Phase == domain.PhaseBattleEnd {
		status := "defeat"
		if !engine.AllAlliesDead(session) {
			status = "victory"
		}
		uc.battleRepo.Finish(ctx, battle.ID, status, json.RawMessage(`{}`))
	}

	resp := uc.buildStateResponse(battle.ID, session)
	resp.Events = session.EventLog
	session.EventLog = nil
	uc.saveSession(ctx, battle.ID, session)

	return resp, nil
}

func (uc *battleUseCase) SetAutoMode(ctx context.Context, userID int64, battleID int64, auto bool) (*domain.BattleStateResponse, error) {
	battle, err := uc.battleRepo.GetByID(ctx, battleID)
	if err != nil {
		return nil, err
	}
	if battle.UserID != userID {
		return nil, fmt.Errorf("not your battle")
	}

	session, err := uc.unmarshalSession(battle.BattleState)
	if err != nil {
		return nil, err
	}

	session.AutoMode = auto

	// If switching to auto mode while in action select, let AI take the turn
	if auto && session.Phase == domain.PhaseActionSelect && session.ActiveUnitID != "" {
		unit := uc.findUnit(session, session.ActiveUnitID)
		if unit != nil && unit.IsAlive {
			skillIdx, targetIDs := engine.SelectAIAction(session, unit)
			if skillIdx >= 0 && skillIdx < len(unit.Skills) {
				skill := &unit.Skills[skillIdx]
				event := engine.ExecuteSkill(session, unit, skill, targetIDs)
				session.EventLog = append(session.EventLog, event)
			}
			session.Phase = domain.PhaseInWave
			session.ActiveUnitID = ""
		}
	}

	if err := uc.saveSession(ctx, battle.ID, session); err != nil {
		return nil, err
	}

	return uc.buildStateResponse(battle.ID, session), nil
}

func (uc *battleUseCase) SetSpeed(ctx context.Context, userID int64, battleID int64, speed float64) (*domain.BattleStateResponse, error) {
	battle, err := uc.battleRepo.GetByID(ctx, battleID)
	if err != nil {
		return nil, err
	}
	if battle.UserID != userID {
		return nil, fmt.Errorf("not your battle")
	}

	session, err := uc.unmarshalSession(battle.BattleState)
	if err != nil {
		return nil, err
	}

	if speed != 1.0 && speed != 2.0 {
		speed = 1.0
	}
	session.SpeedMultiplier = speed

	if err := uc.saveSession(ctx, battle.ID, session); err != nil {
		return nil, err
	}

	return uc.buildStateResponse(battle.ID, session), nil
}

func (uc *battleUseCase) Surrender(ctx context.Context, userID int64, battleID int64) error {
	battle, err := uc.battleRepo.GetByID(ctx, battleID)
	if err != nil {
		return err
	}
	if battle.UserID != userID {
		return fmt.Errorf("not your battle")
	}
	if battle.Status != "ongoing" {
		return fmt.Errorf("battle already ended")
	}

	return uc.battleRepo.Finish(ctx, battle.ID, "defeat", json.RawMessage(`{}`))
}

func (uc *battleUseCase) GetResult(ctx context.Context, userID int64, battleID int64) (*domain.BattleResultResponse, error) {
	battle, err := uc.battleRepo.GetByID(ctx, battleID)
	if err != nil {
		return nil, err
	}
	if battle.UserID != userID {
		return nil, fmt.Errorf("not your battle")
	}

	session, err := uc.unmarshalSession(battle.BattleState)
	if err != nil {
		return nil, err
	}

	result := &domain.BattleResultResponse{
		BattleID:     battle.ID,
		Result:       battle.Status,
		WavesCleared: session.CurrentWave,
	}

	if battle.Status == "victory" && battle.ReferenceID != nil {
		// Rewards are calculated by dungeon_usecase.CompleteDungeon
		// Here we just return the result status
		result.Gold = 100
		result.Exp = 50
	}

	return result, nil
}

// Helper methods

func (uc *battleUseCase) unmarshalSession(data json.RawMessage) (*domain.BattleSession, error) {
	session := &domain.BattleSession{}
	if err := json.Unmarshal(data, session); err != nil {
		return nil, fmt.Errorf("failed to unmarshal battle session: %w", err)
	}
	return session, nil
}

func (uc *battleUseCase) saveSession(ctx context.Context, battleID int64, session *domain.BattleSession) error {
	data, err := json.Marshal(session)
	if err != nil {
		return err
	}
	return uc.battleRepo.UpdateState(ctx, battleID, data, session.TurnCounter)
}

func (uc *battleUseCase) buildStateResponse(battleID int64, session *domain.BattleSession) *domain.BattleStateResponse {
	return &domain.BattleStateResponse{
		BattleID:        battleID,
		Phase:           session.Phase,
		CurrentWave:     session.CurrentWave,
		TotalWaves:      session.TotalWaves,
		Allies:          session.Allies,
		Enemies:         session.Enemies,
		ActiveUnitID:    session.ActiveUnitID,
		AutoMode:        session.AutoMode,
		SpeedMultiplier: session.SpeedMultiplier,
		TurnCounter:     session.TurnCounter,
	}
}

func (uc *battleUseCase) findUnit(session *domain.BattleSession, unitID string) *domain.BattleUnit {
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

func (uc *battleUseCase) loadSkillsForUnits(ctx context.Context, units []*domain.BattleUnit, teamMembers []domain.TeamMember) error {
	// Collect all character IDs to load their skills
	var charIDs []int64
	for _, m := range teamMembers {
		charIDs = append(charIDs, m.CharacterID)
	}

	// For each unit, look up their character's skill IDs and load skill data
	for i, unit := range units {
		if i >= len(teamMembers) {
			break
		}
		// We need to get the character's skill IDs from the characters table
		// For now, generate default skills if DB lookup fails
		skillIDs := []int64{}
		// Try to collect skill IDs from the team member's character
		member := teamMembers[i]
		_ = member // skill IDs come from characters table, loaded separately

		// Load skills by ID if available
		if len(skillIDs) > 0 {
			skills, err := uc.skillRepo.GetByIDs(ctx, skillIDs)
			if err == nil {
				for j, s := range skills {
					unit.Skills = append(unit.Skills, domain.BattleSkill{
						SkillID:     s.ID,
						SlotIndex:   j,
						Name:        s.Name,
						SkillType:   s.SkillType,
						TargetType:  s.TargetType,
						Multiplier:  s.Multiplier,
						MaxCooldown: s.Cooldown,
						CurrentCD:   0,
						Effects:     s.Effects,
					})
				}
			}
		}

		// Ensure at least basic attack exists
		if len(unit.Skills) == 0 {
			unit.Skills = generateDefaultSkills(unit)
		}
	}
	return nil
}

func teamMemberToBattleUnit(m domain.TeamMember, unitID string, team string) *domain.BattleUnit {
	critRate := m.CritRate
	if critRate <= 0 {
		critRate = 15.0
	}
	critDmg := m.CritDamage
	if critDmg <= 0 {
		critDmg = 50.0
	}
	acc := m.Accuracy
	if acc <= 0 {
		acc = 85.0
	}
	res := m.Resistance
	if res <= 0 {
		res = 15.0
	}

	return &domain.BattleUnit{
		UnitID:     unitID,
		Team:       team,
		CharID:     m.CharacterID,
		Name:       m.Name,
		Grade:      m.Grade,
		Element:    m.Element,
		Class:      m.Class,
		ImageURL:   m.ImageURL,
		Level:      m.Level,
		Position:   m.Position,
		HP:         m.MaxHP,
		MaxHP:      m.MaxHP,
		ATK:        m.Atk,
		DEF:        m.Def,
		SPD:        m.Spd,
		CritRate:   critRate,
		CritDamage: critDmg,
		Accuracy:   acc,
		Resistance: res,
		ATBGauge:   0,
		IsAlive:    true,
	}
}

func generateDefaultSkills(unit *domain.BattleUnit) []domain.BattleSkill {
	skills := []domain.BattleSkill{
		{
			SkillID: 0, SlotIndex: 0,
			Name: "Basic Attack", SkillType: domain.SkillTypeDamage,
			TargetType: domain.TargetSingleEnemy, Multiplier: 1.0,
			MaxCooldown: 0, CurrentCD: 0,
		},
		{
			SkillID: 0, SlotIndex: 1,
			Name: "Power Strike", SkillType: domain.SkillTypeDamage,
			TargetType: domain.TargetSingleEnemy, Multiplier: 1.8,
			MaxCooldown: 2, CurrentCD: 0,
		},
		{
			SkillID: 0, SlotIndex: 2,
			Name: "Heavy Blow", SkillType: domain.SkillTypeDamage,
			TargetType: domain.TargetSingleEnemy, Multiplier: 2.5,
			MaxCooldown: 3, CurrentCD: 0,
		},
		{
			SkillID: 0, SlotIndex: 3,
			Name: "Ultimate", SkillType: domain.SkillTypeDamage,
			TargetType: domain.TargetAllEnemies, Multiplier: 4.0,
			MaxCooldown: 5, CurrentCD: 0,
		},
	}

	// Healers get heal skills
	if unit.Class == "healer" || unit.Class == "support" {
		skills[1] = domain.BattleSkill{
			SkillID: 0, SlotIndex: 1,
			Name: "Heal", SkillType: domain.SkillTypeHeal,
			TargetType: domain.TargetSingleAlly, Multiplier: 1.5,
			MaxCooldown: 2, CurrentCD: 0,
		}
		skills[2] = domain.BattleSkill{
			SkillID: 0, SlotIndex: 2,
			Name: "Group Heal", SkillType: domain.SkillTypeHeal,
			TargetType: domain.TargetAllAllies, Multiplier: 1.0,
			MaxCooldown: 3, CurrentCD: 0,
		}
	}

	return skills
}
