package usecase

import (
	"context"
	"time"

	"collection-game/internal/domain"
	"collection-game/internal/repository"
)

type UserUseCase interface {
	GetProfile(ctx context.Context, userID int64) (*domain.UserProfile, error)
	GetFullUser(ctx context.Context, userID int64) (*domain.User, error)
	UpdateEnergy(ctx context.Context, userID int64) error
}

type userUseCase struct {
	userRepo repository.UserRepository
}

func NewUserUseCase(userRepo repository.UserRepository) UserUseCase {
	return &userUseCase{
		userRepo: userRepo,
	}
}

func (uc *userUseCase) GetProfile(ctx context.Context, userID int64) (*domain.UserProfile, error) {
	user, err := uc.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, err
	}

	// Update energy before returning profile
	_ = uc.calculateAndUpdateEnergy(ctx, user)

	return user.ToProfile(), nil
}

func (uc *userUseCase) GetFullUser(ctx context.Context, userID int64) (*domain.User, error) {
	user, err := uc.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, err
	}

	// Update energy
	_ = uc.calculateAndUpdateEnergy(ctx, user)

	return user, nil
}

func (uc *userUseCase) UpdateEnergy(ctx context.Context, userID int64) error {
	user, err := uc.userRepo.GetByID(ctx, userID)
	if err != nil {
		return err
	}

	return uc.calculateAndUpdateEnergy(ctx, user)
}

// calculateAndUpdateEnergy calculates energy regen and updates if needed
func (uc *userUseCase) calculateAndUpdateEnergy(ctx context.Context, user *domain.User) error {
	if user.Energy >= user.MaxEnergy {
		return nil
	}

	now := time.Now()
	minutesPassed := int(now.Sub(user.LastEnergyUpdate).Minutes())

	if minutesPassed < 5 {
		return nil // Not enough time passed
	}

	energyToAdd := minutesPassed / 5
	newEnergy := user.Energy + energyToAdd

	if newEnergy > user.MaxEnergy {
		newEnergy = user.MaxEnergy
	}

	if newEnergy != user.Energy {
		user.Energy = newEnergy
		user.LastEnergyUpdate = now
		return uc.userRepo.UpdateEnergy(ctx, user.ID, newEnergy)
	}

	return nil
}
