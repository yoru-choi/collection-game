package usecase

import (
	"context"
	"fmt"

	"collection-game/internal/domain"
	"collection-game/internal/repository"
)

type DungeonUseCase interface {
	GetAllDungeons(ctx context.Context) ([]*domain.Dungeon, error)
	GetDungeonsByChapter(ctx context.Context, chapter int) ([]*domain.Dungeon, error)
	GetDungeonDetail(ctx context.Context, dungeonID int64) (*domain.Dungeon, error)
	GetUserProgress(ctx context.Context, userID int64) ([]*domain.DungeonProgress, error)
	
	EnterDungeon(ctx context.Context, userID int64, dungeonID int64) (*domain.Battle, error)
	CompleteDungeon(ctx context.Context, userID int64, dungeonID int64, stars int, timeTaken int) error
}

type dungeonUseCase struct {
	dungeonRepo repository.DungeonRepository
	userRepo    repository.UserRepository
}

func NewDungeonUseCase(dungeonRepo repository.DungeonRepository, userRepo repository.UserRepository) DungeonUseCase {
	return &dungeonUseCase{
		dungeonRepo: dungeonRepo,
		userRepo:    userRepo,
	}
}

func (uc *dungeonUseCase) GetAllDungeons(ctx context.Context) ([]*domain.Dungeon, error) {
	return uc.dungeonRepo.GetAll(ctx)
}

func (uc *dungeonUseCase) GetDungeonsByChapter(ctx context.Context, chapter int) ([]*domain.Dungeon, error) {
	return uc.dungeonRepo.GetByChapter(ctx, chapter)
}

func (uc *dungeonUseCase) GetDungeonDetail(ctx context.Context, dungeonID int64) (*domain.Dungeon, error) {
	return uc.dungeonRepo.GetByID(ctx, dungeonID)
}

func (uc *dungeonUseCase) GetUserProgress(ctx context.Context, userID int64) ([]*domain.DungeonProgress, error) {
	return uc.dungeonRepo.GetAllUserProgress(ctx, userID)
}

func (uc *dungeonUseCase) EnterDungeon(ctx context.Context, userID int64, dungeonID int64) (*domain.Battle, error) {
	// Get dungeon info
	dungeon, err := uc.dungeonRepo.GetByID(ctx, dungeonID)
	if err != nil {
		return nil, err
	}

	// Get user
	user, err := uc.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, err
	}

	// Check energy
	if user.Energy < dungeon.EnergyCost {
		return nil, fmt.Errorf("insufficient energy: need %d, have %d", dungeon.EnergyCost, user.Energy)
	}

	// Consume energy
	user.Energy -= dungeon.EnergyCost
	if err := uc.userRepo.Update(ctx, user); err != nil {
		return nil, err
	}

	// Create battle instance (simplified)
	battle := &domain.Battle{
		ID:           fmt.Sprintf("battle_%d_%d", userID, dungeonID),
		UserID:       userID,
		DungeonID:    dungeonID,
		CurrentStage: 1,
		TurnCount:    0,
		IsCompleted:  false,
		Victory:      false,
	}

	return battle, nil
}

func (uc *dungeonUseCase) CompleteDungeon(ctx context.Context, userID int64, dungeonID int64, stars int, timeTaken int) error {
	// Get dungeon for rewards
	dungeon, err := uc.dungeonRepo.GetByID(ctx, dungeonID)
	if err != nil {
		return err
	}

	// Get or create progress
	progress, err := uc.dungeonRepo.GetUserProgress(ctx, userID, dungeonID)
	if err != nil {
		return err
	}

	if progress == nil {
		// First clear
		progress = &domain.DungeonProgress{
			UserID:     userID,
			DungeonID:  dungeonID,
			Cleared:    true,
			Stars:      stars,
			BestTime:   timeTaken,
			ClearCount: 1,
		}
		if err := uc.dungeonRepo.CreateProgress(ctx, progress); err != nil {
			return err
		}
	} else {
		// Update existing progress
		progress.Cleared = true
		progress.ClearCount++
		if stars > progress.Stars {
			progress.Stars = stars
		}
		if timeTaken < progress.BestTime || progress.BestTime == 0 {
			progress.BestTime = timeTaken
		}
		if err := uc.dungeonRepo.UpdateProgress(ctx, progress); err != nil {
			return err
		}
	}

	// Grant rewards
	return uc.userRepo.UpdateCurrency(ctx, userID, 0, int64(dungeon.GoldReward))
}
