package usecase

import (
	"context"
	"encoding/json"
	"errors"
	"math"

	"collection-game/internal/domain"
	"collection-game/internal/repository"
)

type ArenaUseCase struct {
	arenaRepo     *repository.ArenaRepository
	userRepo      repository.UserRepository
	characterRepo repository.CharacterRepository
}

func NewArenaUseCase(
	arenaRepo *repository.ArenaRepository,
	userRepo repository.UserRepository,
	characterRepo repository.CharacterRepository,
) *ArenaUseCase {
	return &ArenaUseCase{
		arenaRepo:     arenaRepo,
		userRepo:      userRepo,
		characterRepo: characterRepo,
	}
}

// GetMyArena gets user's arena status
func (uc *ArenaUseCase) GetMyArena(ctx context.Context, userID int64) (*domain.Arena, error) {
	const currentSeason = 1 // TODO: Get from config or system
	return uc.arenaRepo.GetOrCreateArena(ctx, userID, currentSeason)
}

// SetDefenseTeam sets user's defense team
func (uc *ArenaUseCase) SetDefenseTeam(ctx context.Context, userID int64, characterIDs []int64) error {
	// Validate team size
	if len(characterIDs) == 0 || len(characterIDs) > 4 {
		return errors.New("defense team must have 1-4 characters")
	}

	// Validate that user owns all characters
	for _, charID := range characterIDs {
		_, err := uc.characterRepo.GetUserCharacterByID(ctx, charID)
		if err != nil {
			return errors.New("character not found or not owned")
		}
	}

	const currentSeason = 1
	return uc.arenaRepo.UpdateDefenseTeam(ctx, userID, currentSeason, characterIDs)
}

// GetRanking gets arena ranking
func (uc *ArenaUseCase) GetRanking(ctx context.Context, limit int) ([]domain.ArenaRankingEntry, error) {
	if limit <= 0 || limit > 100 {
		limit = 50
	}

	const currentSeason = 1
	return uc.arenaRepo.GetRanking(ctx, currentSeason, limit)
}

// Attack performs an arena attack
func (uc *ArenaUseCase) Attack(ctx context.Context, attackerID int64, defenderID int64, attackerTeam []int64) (bool, int, error) {
	// Validate attacker team
	if len(attackerTeam) == 0 || len(attackerTeam) > 4 {
		return false, 0, errors.New("attacker team must have 1-4 characters")
	}

	const currentSeason = 1

	// Get attacker and defender arena records
	attackerArena, err := uc.arenaRepo.GetOrCreateArena(ctx, attackerID, currentSeason)
	if err != nil {
		return false, 0, err
	}

	defenderArena, err := uc.arenaRepo.GetOrCreateArena(ctx, defenderID, currentSeason)
	if err != nil {
		return false, 0, err
	}

	// Get defender's defense team
	var defenderTeam []int64
	if len(defenderArena.DefenseTeam) > 0 {
		err = json.Unmarshal(defenderArena.DefenseTeam, &defenderTeam)
		if err != nil {
			return false, 0, err
		}
	}

	if len(defenderTeam) == 0 {
		return false, 0, errors.New("defender has no defense team set")
	}

	// Simulate battle (simplified)
	won := uc.simulateBattle(attackerTeam, defenderTeam)

	// Calculate rating change (ELO-style)
	ratingChange := uc.calculateRatingChange(attackerArena.Rating, defenderArena.Rating, won)

	// Update arena records
	err = uc.arenaRepo.UpdateArenaResult(ctx, attackerID, currentSeason, won, ratingChange)
	if err != nil {
		return false, 0, err
	}

	err = uc.arenaRepo.UpdateArenaResult(ctx, defenderID, currentSeason, !won, -ratingChange)
	if err != nil {
		return false, 0, err
	}

	// Record battle history
	attackerTeamJSON, _ := json.Marshal(attackerTeam)
	defenderTeamJSON, _ := json.Marshal(defenderTeam)

	winnerID := attackerID
	if !won {
		winnerID = defenderID
	}

	history := &domain.ArenaHistory{
		AttackerID:   attackerID,
		DefenderID:   defenderID,
		AttackerTeam: attackerTeamJSON,
		DefenderTeam: defenderTeamJSON,
		WinnerID:     winnerID,
		RatingChange: ratingChange,
		SeasonID:     currentSeason,
	}

	err = uc.arenaRepo.RecordBattle(ctx, history)
	if err != nil {
		return false, 0, err
	}

	return won, ratingChange, nil
}

// GetBattleHistory gets user's battle history
func (uc *ArenaUseCase) GetBattleHistory(ctx context.Context, userID int64, limit int) ([]domain.ArenaHistory, error) {
	if limit <= 0 || limit > 50 {
		limit = 20
	}

	const currentSeason = 1
	return uc.arenaRepo.GetBattleHistory(ctx, userID, currentSeason, limit)
}

// simulateBattle simulates a battle (simplified version)
func (uc *ArenaUseCase) simulateBattle(attackerTeam []int64, defenderTeam []int64) bool {
	// TODO: Implement actual battle simulation
	// For now, use a simple random-based approach with slight advantage to attacker
	// Real implementation should consider character stats, skills, etc.

	attackerPower := len(attackerTeam) * 100
	defenderPower := len(defenderTeam) * 95 // Slight disadvantage for defender

	// Simple probability calculation
	winChance := float64(attackerPower) / float64(attackerPower+defenderPower)

	// For now, return true if win chance > 0.5 (deterministic for testing)
	return winChance > 0.5
}

// calculateRatingChange calculates ELO-style rating change
func (uc *ArenaUseCase) calculateRatingChange(attackerRating int, defenderRating int, won bool) int {
	const K = 32.0 // K-factor for ELO

	expectedScore := 1.0 / (1.0 + math.Pow(10, float64(defenderRating-attackerRating)/400.0))

	actualScore := 0.0
	if won {
		actualScore = 1.0
	}

	change := K * (actualScore - expectedScore)
	return int(math.Round(change))
}
