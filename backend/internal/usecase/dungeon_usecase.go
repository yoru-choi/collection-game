package usecase

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"collection-game/internal/domain"
	"collection-game/internal/repository"
)

type DungeonUseCase interface {
	GetAllDungeons(ctx context.Context) ([]*domain.Dungeon, error)
	GetDungeonsByChapter(ctx context.Context, chapter int) ([]*domain.Dungeon, error)
	GetDungeonDetail(ctx context.Context, dungeonID int64) (*domain.Dungeon, error)
	GetUserProgress(ctx context.Context, userID int64) ([]*domain.DungeonProgress, error)

	EnterDungeon(ctx context.Context, userID int64, dungeonID int64) (*domain.BattleStart, error)
	CompleteDungeon(ctx context.Context, userID int64, dungeonID int64, stars int, timeTaken int) error
}

type dungeonUseCase struct {
	dungeonRepo repository.DungeonRepository
	userRepo    repository.UserRepository
	charRepo    repository.CharacterRepository
}

func NewDungeonUseCase(
	dungeonRepo repository.DungeonRepository,
	userRepo repository.UserRepository,
	charRepo repository.CharacterRepository,
) DungeonUseCase {
	return &dungeonUseCase{
		dungeonRepo: dungeonRepo,
		userRepo:    userRepo,
		charRepo:    charRepo,
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

func (uc *dungeonUseCase) EnterDungeon(ctx context.Context, userID int64, dungeonID int64) (*domain.BattleStart, error) {
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

	playerTeam, err := uc.buildPlayerTeam(ctx, userID)
	if err != nil {
		return nil, err
	}

	enemyTeam, err := uc.buildEnemyTeam(ctx, dungeon)
	if err != nil {
		return nil, err
	}

	return &domain.BattleStart{
		ID:         time.Now().UnixNano(),
		Status:     "ongoing",
		PlayerTeam: playerTeam,
		EnemyTeam:  enemyTeam,
	}, nil
}

type dungeonStage struct {
	Wave    int `json:"wave"`
	Enemies []struct {
		CharacterID int64 `json:"character_id"`
		Level       int   `json:"level"`
	} `json:"enemies"`
}

func (uc *dungeonUseCase) buildPlayerTeam(ctx context.Context, userID int64) ([]domain.TeamMember, error) {
	party, err := uc.charRepo.GetUserParty(ctx, userID)
	if err != nil {
		return nil, err
	}

	team := make([]domain.TeamMember, 0, 4)
	if len(party) > 0 {
		for _, member := range party {
			detail, err := uc.charRepo.GetUserCharacterDetail(ctx, member.UserCharacterID)
			if err != nil {
				return nil, err
			}
			team = append(team, mapDetailToTeamMember(detail, member.SlotIndex))
		}
		return team, nil
	}

	userChars, err := uc.charRepo.GetUserCharacters(ctx, userID)
	if err != nil {
		return nil, err
	}

	max := 4
	if len(userChars) < max {
		max = len(userChars)
	}
	for i := 0; i < max; i++ {
		detail, err := uc.charRepo.GetUserCharacterDetail(ctx, userChars[i].ID)
		if err != nil {
			return nil, err
		}
		team = append(team, mapDetailToTeamMember(detail, i))
	}

	return team, nil
}

func (uc *dungeonUseCase) buildEnemyTeam(ctx context.Context, dungeon *domain.Dungeon) ([]domain.TeamMember, error) {
	if dungeon == nil || dungeon.Stages == "" {
		return []domain.TeamMember{}, nil
	}

	var stages []dungeonStage
	if err := json.Unmarshal([]byte(dungeon.Stages), &stages); err != nil {
		return []domain.TeamMember{}, nil
	}
	if len(stages) == 0 {
		return []domain.TeamMember{}, nil
	}

	team := make([]domain.TeamMember, 0, len(stages[0].Enemies))
	for idx, enemy := range stages[0].Enemies {
		char, err := uc.charRepo.GetByID(ctx, enemy.CharacterID)
		if err != nil {
			return nil, err
		}

		level := enemy.Level
		if level <= 0 {
			level = 1
		}

		stats := calculateScaledStats(char, level)
		team = append(team, domain.TeamMember{
			UserCharacterID: 0,
			CharacterID:     char.ID,
			Name:            char.Name,
			Grade:           char.Grade,
			Element:         string(char.Element),
			Class:           string(char.Class),
			ImageURL:        char.ImageURL,
			Level:           level,
			Position:        idx,
			CurrentHP:       stats.HP,
			MaxHP:           stats.HP,
			Atk:             stats.ATK,
			Def:             stats.DEF,
			Spd:             stats.SPD,
		})
	}

	return team, nil
}

type scaledStats struct {
	HP  int
	ATK int
	DEF int
	SPD int
}

func calculateScaledStats(char *domain.Character, level int) scaledStats {
	if char == nil {
		return scaledStats{}
	}
	levelMultiplier := 1.0 + float64(level-1)*0.05
	return scaledStats{
		HP:  int(float64(char.BaseHP) * levelMultiplier),
		ATK: int(float64(char.BaseATK) * levelMultiplier),
		DEF: int(float64(char.BaseDEF) * levelMultiplier),
		SPD: int(float64(char.BaseSPD) * levelMultiplier),
	}
}

func mapDetailToTeamMember(detail *domain.CharacterDetail, position int) domain.TeamMember {
	return domain.TeamMember{
		UserCharacterID: detail.ID,
		CharacterID:     detail.CharacterID,
		Name:            detail.Name,
		Grade:           detail.Grade,
		Element:         string(detail.Element),
		Class:           string(detail.Class),
		ImageURL:        detail.ImageURL,
		Level:           detail.Level,
		Position:        position,
		CurrentHP:       detail.CurrentHP,
		MaxHP:           detail.CurrentHP,
		Atk:             detail.CurrentATK,
		Def:             detail.CurrentDEF,
		Spd:             detail.CurrentSPD,
	}
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
	crystals := int64(0)
	gold := int64(dungeon.GoldReward)
	exp := int64(dungeon.ExpReward)

	if len(dungeon.Rewards) > 0 {
		var rewards []struct {
			Type   string `json:"type"`
			Amount int    `json:"amount"`
		}
		if err := json.Unmarshal([]byte(dungeon.Rewards), &rewards); err == nil {
			for _, reward := range rewards {
				switch reward.Type {
				case "gold":
					gold += int64(reward.Amount)
				case "crystal":
					crystals += int64(reward.Amount)
				case "exp":
					exp += int64(reward.Amount)
				default:
					// Non-MVP rewards (materials, runes, etc.) are ignored for now
				}
			}
		}
	}

	if exp > 0 {
		if err := uc.userRepo.AddExp(ctx, userID, exp); err != nil {
			return err
		}
	}
	return uc.userRepo.UpdateCurrency(ctx, userID, crystals, gold)
}
