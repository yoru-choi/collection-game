package usecase

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"collection-game/internal/domain"
	"collection-game/internal/repository"
)

type QuestUseCase struct {
	questRepo *repository.QuestRepository
	userRepo  repository.UserRepository
	charRepo  repository.CharacterRepository
}

func NewQuestUseCase(
	questRepo *repository.QuestRepository,
	userRepo repository.UserRepository,
	charRepo repository.CharacterRepository,
) *QuestUseCase {
	return &QuestUseCase{
		questRepo: questRepo,
		userRepo:  userRepo,
		charRepo:  charRepo,
	}
}

// GetDailyQuests gets user's daily quests
func (uc *QuestUseCase) GetDailyQuests(ctx context.Context, userID int64) ([]domain.UserQuestDetail, error) {
	return uc.questRepo.GetUserQuests(ctx, userID, "daily")
}

// GetWeeklyQuests gets user's weekly quests
func (uc *QuestUseCase) GetWeeklyQuests(ctx context.Context, userID int64) ([]domain.UserQuestDetail, error) {
	return uc.questRepo.GetUserQuests(ctx, userID, "weekly")
}

// GetAchievements gets user's achievements
func (uc *QuestUseCase) GetAchievements(ctx context.Context, userID int64) ([]domain.UserQuestDetail, error) {
	return uc.questRepo.GetUserQuests(ctx, userID, "achievement")
}

// UpdateQuestProgress updates quest progress for a user
func (uc *QuestUseCase) UpdateQuestProgress(ctx context.Context, userID int64, conditionType string, amount int) error {
	// Get all active quests with matching condition type
	quests, err := uc.questRepo.GetActiveQuests(ctx, "daily")
	if err != nil {
		return err
	}

	// Update progress for matching quests
	for _, quest := range quests {
		if quest.ConditionType == conditionType {
			err = uc.questRepo.UpdateQuestProgress(ctx, userID, quest.ID, amount)
			if err != nil {
				// Log error but continue with other quests
				continue
			}
		}
	}

	return nil
}

// ClaimQuest claims quest rewards
func (uc *QuestUseCase) ClaimQuest(ctx context.Context, userID int64, questID int64) (*domain.QuestRewards, error) {
	// Claim quest
	rewards, err := uc.questRepo.ClaimQuest(ctx, userID, questID)
	if err != nil {
		return nil, err
	}

	// Grant rewards to user
	if rewards.Crystals > 0 || rewards.Gold > 0 {
		err = uc.userRepo.UpdateCurrency(ctx, userID, int64(rewards.Crystals), int64(rewards.Gold))
		if err != nil {
			return nil, err
		}
	}

	if rewards.Exp > 0 {
		err = uc.userRepo.AddExp(ctx, userID, int64(rewards.Exp))
		if err != nil {
			return nil, err
		}
	}

	if rewards.Energy > 0 {
		err = uc.userRepo.AddEnergy(ctx, userID, rewards.Energy)
		if err != nil {
			return nil, err
		}
	}

	if err := uc.grantItemRewards(ctx, userID, rewards.Items); err != nil {
		return nil, err
	}

	return rewards, nil
}

// CompleteQuest marks quest as completed if requirements are met
func (uc *QuestUseCase) CompleteQuest(ctx context.Context, userID int64, questID int64) error {
	err := uc.questRepo.CompleteQuest(ctx, userID, questID)
	if errors.Is(err, sql.ErrNoRows) {
		return fmt.Errorf("quest not ready to complete")
	}
	return err
}

func (uc *QuestUseCase) grantItemRewards(ctx context.Context, userID int64, items []domain.RewardItem) error {
	if len(items) == 0 {
		return nil
	}

	var addCrystals int64
	var addGold int64
	var addExp int64
	var addEnergy int

	for _, item := range items {
		if item.Quantity <= 0 {
			continue
		}
		switch item.Type {
		case "crystal":
			addCrystals += int64(item.Quantity)
		case "gold":
			addGold += int64(item.Quantity)
		case "exp":
			addExp += int64(item.Quantity)
		case "energy":
			addEnergy += item.Quantity
		case "character":
			if item.ID == nil {
				return fmt.Errorf("character reward missing id")
			}
			for i := 0; i < item.Quantity; i++ {
				if err := uc.grantCharacter(ctx, userID, *item.ID); err != nil {
					return err
				}
			}
		default:
			return fmt.Errorf("unsupported reward item type: %s", item.Type)
		}
	}

	if addCrystals != 0 || addGold != 0 {
		if err := uc.userRepo.UpdateCurrency(ctx, userID, addCrystals, addGold); err != nil {
			return err
		}
	}
	if addExp > 0 {
		if err := uc.userRepo.AddExp(ctx, userID, addExp); err != nil {
			return err
		}
	}
	if addEnergy > 0 {
		if err := uc.userRepo.AddEnergy(ctx, userID, addEnergy); err != nil {
			return err
		}
	}

	return nil
}

func (uc *QuestUseCase) grantCharacter(ctx context.Context, userID int64, characterID int64) error {
	char, err := uc.charRepo.GetByID(ctx, characterID)
	if err != nil {
		return err
	}

	userChar := &domain.UserCharacter{
		UserID:      userID,
		CharacterID: char.ID,
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

	userChar.CalculateStats(char)
	return uc.charRepo.CreateUserCharacter(ctx, userChar)
}

// GetDailyLogin gets user's daily login status
func (uc *QuestUseCase) GetDailyLogin(ctx context.Context, userID int64) (*domain.UserDailyLogin, error) {
	dailyLogin, err := uc.questRepo.GetDailyLogin(ctx, userID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return uc.questRepo.CreateDailyLogin(ctx, userID)
		}
		return nil, err
	}

	return dailyLogin, nil
}
