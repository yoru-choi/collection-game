package usecase

import (
	"context"
	"fmt"

	"collection-game/internal/domain"
	"collection-game/internal/repository"
	"collection-game/pkg/utils"
)

type SummonUseCase interface {
	NormalSummon(ctx context.Context, userID int64, count int) (*domain.SummonBatchResult, error)
	PremiumSummon(ctx context.Context, userID int64, count int) (*domain.SummonBatchResult, error)
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

func (uc *summonUseCase) NormalSummon(ctx context.Context, userID int64, count int) (*domain.SummonBatchResult, error) {
	// Get user
	user, err := uc.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, err
	}

	if count == 0 {
		count = 1
	}
	if count != 1 && count != 10 {
		return nil, fmt.Errorf("invalid summon count")
	}

	totalCost := int64(domain.NormalSummonCost) * int64(count)

	// Check crystals
	if user.Crystals < totalCost {
		return nil, fmt.Errorf("insufficient crystals")
	}

	// Perform summon
	result, err := uc.performMultiSummon(ctx, userID, domain.SummonTypeNormal, count, domain.GachaRates)
	if err != nil {
		return nil, err
	}

	// Deduct crystals
	if err := uc.userRepo.UpdateCurrency(ctx, userID, -totalCost, 0); err != nil {
		return nil, err
	}

	result.RemainingCrystals = user.Crystals - totalCost

	return result, nil
}

func (uc *summonUseCase) PremiumSummon(ctx context.Context, userID int64, count int) (*domain.SummonBatchResult, error) {
	// Get user
	user, err := uc.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, err
	}

	if count == 0 {
		count = 1
	}
	if count != 1 && count != 10 {
		return nil, fmt.Errorf("invalid summon count")
	}

	totalCost := int64(domain.PremiumSummonCost) * int64(count)

	// Check crystals
	if user.Crystals < totalCost {
		return nil, fmt.Errorf("insufficient crystals")
	}

	// Perform summon
	result, err := uc.performMultiSummon(ctx, userID, domain.SummonTypePremium, count, domain.PremiumGachaRates)
	if err != nil {
		return nil, err
	}

	// Deduct crystals
	if err := uc.userRepo.UpdateCurrency(ctx, userID, -totalCost, 0); err != nil {
		return nil, err
	}

	result.RemainingCrystals = user.Crystals - totalCost

	return result, nil
}

func (uc *summonUseCase) GetSummonRates() map[int]float64 {
	return domain.GachaRates
}

func (uc *summonUseCase) performMultiSummon(
	ctx context.Context,
	userID int64,
	summonType domain.SummonType,
	count int,
	rates map[int]float64,
) (*domain.SummonBatchResult, error) {
	if count <= 0 {
		return nil, fmt.Errorf("invalid summon count")
	}

	bonus := 0
	if count == 10 {
		bonus = 1 // 10+1 bonus
	}
	rolls := count + bonus

	results := make([]domain.SummonResult, 0, rolls)
	guaranteed := count == 10
	hasFourPlus := false

	for i := 0; i < rolls; i++ {
		var (
			result *domain.SummonResult
			grade  int
			err    error
		)

		forceFourPlus := guaranteed && !hasFourPlus && i == rolls-1
		if forceFourPlus {
			grade = 4
			result, err = uc.performSummonWithGrade(ctx, userID, summonType, grade)
		} else {
			result, grade, err = uc.performSummon(ctx, userID, summonType, rates)
		}
		if err != nil {
			return nil, err
		}

		if grade >= 4 {
			hasFourPlus = true
		}
		results = append(results, *result)
	}

	return &domain.SummonBatchResult{
		Results: results,
	}, nil
}

func (uc *summonUseCase) performSummon(
	ctx context.Context,
	userID int64,
	summonType domain.SummonType,
	rates map[int]float64,
) (*domain.SummonResult, int, error) {
	// Roll for grade
	grade := utils.SelectByProbability(rates)

	result, err := uc.performSummonWithGrade(ctx, userID, summonType, grade)
	if err != nil {
		return nil, 0, err
	}

	return result, grade, nil
}

func (uc *summonUseCase) performSummonWithGrade(
	ctx context.Context,
	userID int64,
	summonType domain.SummonType,
	grade int,
) (*domain.SummonResult, error) {

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
