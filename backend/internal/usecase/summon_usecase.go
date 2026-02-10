package usecase

import (
	"context"
	"fmt"

	"collection-game/internal/domain"
	"collection-game/internal/repository"
	"collection-game/pkg/utils"
)

type SummonUseCase interface {
	NormalSummon(ctx context.Context, userID int64) (*domain.SummonResult, error)
	PremiumSummon(ctx context.Context, userID int64) (*domain.SummonResult, error)
	GetSummonRates() map[int]float64
}

type summonUseCase struct {
	userRepo   repository.UserRepository
	charRepo   repository.CharacterRepository
	summonRepo repository.SummonRepository
}

func NewSummonUseCase(
	userRepo repository.UserRepository,
	charRepo repository.CharacterRepository,
	summonRepo repository.SummonRepository,
) SummonUseCase {
	return &summonUseCase{
		userRepo:   userRepo,
		charRepo:   charRepo,
		summonRepo: summonRepo,
	}
}

func (uc *summonUseCase) NormalSummon(ctx context.Context, userID int64) (*domain.SummonResult, error) {
	// Get user
	user, err := uc.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, err
	}

	// Check gold
	if user.Gold < domain.NormalSummonCost {
		return nil, fmt.Errorf("insufficient gold")
	}

	// Perform summon
	result, err := uc.performSummon(ctx, userID, domain.SummonTypeNormal, domain.GachaRates)
	if err != nil {
		return nil, err
	}

	// Deduct gold
	if err := uc.userRepo.UpdateCurrency(ctx, userID, 0, -domain.NormalSummonCost); err != nil {
		return nil, err
	}

	return result, nil
}

func (uc *summonUseCase) PremiumSummon(ctx context.Context, userID int64) (*domain.SummonResult, error) {
	// Get user
	user, err := uc.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, err
	}

	// Check crystals
	if user.Crystals < domain.PremiumSummonCost {
		return nil, fmt.Errorf("insufficient crystals")
	}

	// Perform summon
	result, err := uc.performSummon(ctx, userID, domain.SummonTypePremium, domain.PremiumGachaRates)
	if err != nil {
		return nil, err
	}

	// Deduct crystals
	if err := uc.userRepo.UpdateCurrency(ctx, userID, -domain.PremiumSummonCost, 0); err != nil {
		return nil, err
	}

	return result, nil
}

func (uc *summonUseCase) GetSummonRates() map[int]float64 {
	return domain.GachaRates
}

func (uc *summonUseCase) performSummon(
	ctx context.Context,
	userID int64,
	summonType domain.SummonType,
	rates map[int]float64,
) (*domain.SummonResult, error) {
	// Roll for grade
	grade := utils.SelectByProbability(rates)

	// Get random character of that grade
	characters, err := uc.charRepo.GetByGrade(ctx, grade)
	if err != nil || len(characters) == 0 {
		return nil, fmt.Errorf("no characters available for grade %d", grade)
	}

	// Pick random character from the grade
	selectedChar := characters[utils.RandomInt(0, len(characters)-1)]

	// Check if user already owns this character
	userChars, err := uc.charRepo.GetUserCharacters(ctx, userID)
	if err != nil {
		return nil, err
	}

	isNew := true
	for _, uc := range userChars {
		if uc.CharacterID == selectedChar.ID {
			isNew = false
			break
		}
	}

	// Create user character instance
	userChar := &domain.UserCharacter{
		UserID:      userID,
		CharacterID: selectedChar.ID,
		Level:       1,
		Exp:         0,
		CritRate:    5.0,
		CritDamage:  50.0,
		Accuracy:    0.0,
		Resistance:  0.0,
		Skill1Level: 1,
		Skill2Level: 1,
		Skill3Level: 1,
		Skill4Level: 1,
		Awakened:    false,
	}

	// Calculate initial stats
	userChar.CalculateStats(selectedChar)

	// Save user character
	if err := uc.charRepo.CreateUserCharacter(ctx, userChar); err != nil {
		return nil, err
	}

	// Save summon history
	history := &domain.SummonHistory{
		UserID:      userID,
		SummonType:  summonType,
		CharacterID: selectedChar.ID,
	}
	if err := uc.summonRepo.CreateHistory(ctx, history); err != nil {
		// Log error but don't fail the summon
		fmt.Printf("Failed to save summon history: %v\n", err)
	}

	return &domain.SummonResult{
		CharacterID: selectedChar.ID,
		Character:   selectedChar,
		IsNew:       isNew,
	}, nil
}
