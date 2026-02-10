package usecase

import (
	"context"

	"collection-game/internal/domain"
	"collection-game/internal/repository"
)

type QuestUseCase struct {
	questRepo *repository.QuestRepository
	userRepo  *repository.UserRepository
}

func NewQuestUseCase(
	questRepo *repository.QuestRepository,
	userRepo *repository.UserRepository,
) *QuestUseCase {
	return &QuestUseCase{
		questRepo: questRepo,
		userRepo:  userRepo,
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
	if rewards.Crystals > 0 {
		err = uc.userRepo.AddCrystals(ctx, userID, int64(rewards.Crystals))
		if err != nil {
			return nil, err
		}
	}

	if rewards.Gold > 0 {
		err = uc.userRepo.AddGold(ctx, userID, int64(rewards.Gold))
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

	// TODO: Grant item rewards

	return rewards, nil
}

// GetDailyLogin gets user's daily login status
func (uc *QuestUseCase) GetDailyLogin(ctx context.Context, userID int64) (*domain.UserDailyLogin, error) {
	return uc.questRepo.GetDailyLogin(ctx, userID)
}
