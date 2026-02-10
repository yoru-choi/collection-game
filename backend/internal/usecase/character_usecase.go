package usecase

import (
	"context"
	"fmt"

	"collection-game/internal/domain"
	"collection-game/internal/repository"
)

type CharacterUseCase interface {
	GetUserCharacters(ctx context.Context, userID int64) ([]*domain.UserCharacter, error)
	GetUserCharacterDetail(ctx context.Context, userCharacterID int64) (*domain.CharacterDetail, error)
	LevelUp(ctx context.Context, userCharacterID int64, expCrystals int) error
}

type characterUseCase struct {
	charRepo repository.CharacterRepository
	userRepo repository.UserRepository
}

func NewCharacterUseCase(charRepo repository.CharacterRepository, userRepo repository.UserRepository) CharacterUseCase {
	return &characterUseCase{
		charRepo: charRepo,
		userRepo: userRepo,
	}
}

func (uc *characterUseCase) GetUserCharacters(ctx context.Context, userID int64) ([]*domain.UserCharacter, error) {
	return uc.charRepo.GetUserCharacters(ctx, userID)
}

func (uc *characterUseCase) GetUserCharacterDetail(ctx context.Context, userCharacterID int64) (*domain.CharacterDetail, error) {
	return uc.charRepo.GetUserCharacterDetail(ctx, userCharacterID)
}

func (uc *characterUseCase) LevelUp(ctx context.Context, userCharacterID int64, expCrystals int) error {
	// Get user character with detail
	detail, err := uc.charRepo.GetUserCharacterDetail(ctx, userCharacterID)
	if err != nil {
		return err
	}

	// Get user to verify ownership and resources
	user, err := uc.userRepo.GetByID(ctx, detail.UserID)
	if err != nil {
		return err
	}

	// Calculate exp to add (simple: 100 exp per crystal)
	expToAdd := int64(expCrystals * 100)

	// Check max level
	maxLevel := domain.GetMaxLevel(detail.Character.Grade)
	if detail.Level >= maxLevel {
		return fmt.Errorf("character is already at max level")
	}

	// Add exp
	detail.Exp += expToAdd

	// Calculate level ups (simple: 1000 exp per level)
	expPerLevel := int64(1000)
	newLevel := detail.Level
	remainingExp := detail.Exp

	for remainingExp >= expPerLevel && newLevel < maxLevel {
		newLevel++
		remainingExp -= expPerLevel
	}

	if newLevel > maxLevel {
		newLevel = maxLevel
		remainingExp = 0
	}

	// Update stats if leveled up
	if newLevel != detail.Level {
		detail.Level = newLevel
		detail.Exp = remainingExp
		detail.UserCharacter.CalculateStats(&detail.Character)
	}

	// Update character
	if err := uc.charRepo.UpdateUserCharacter(ctx, &detail.UserCharacter); err != nil {
		return err
	}

	// Deduct gold (if using gold for level up materials)
	goldCost := int64(expCrystals * 100)
	if user.Gold < goldCost {
		return fmt.Errorf("insufficient gold")
	}

	return uc.userRepo.UpdateCurrency(ctx, user.ID, 0, -goldCost)
}
