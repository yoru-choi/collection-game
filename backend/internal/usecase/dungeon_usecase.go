package usecase

import (
	"context"
	"encoding/json"
	"fmt"

	"collection-game/internal/domain"
	"collection-game/internal/repository"
)

type DungeonUseCase interface {
	GetAllDungeons(ctx context.Context) ([]*domain.Dungeon, error)
	GetDungeonsByChapter(ctx context.Context, chapter int) ([]*domain.Dungeon, error)
	GetDungeonDetail(ctx context.Context, dungeonID int64) (*domain.Dungeon, error)
	GetUserProgress(ctx context.Context, userID int64) ([]*domain.DungeonProgress, error)

	EnterDungeon(ctx context.Context, userID int64, dungeonID int64) (*domain.BattleStateResponse, error)
	CompleteDungeon(ctx context.Context, userID int64, dungeonID int64, stars int, timeTaken int) error
}

type dungeonUseCase struct {
	dungeonRepo repository.DungeonRepository
	userRepo    repository.UserRepository
	charRepo    repository.CharacterRepository
	battleUC    BattleUseCase
}

func NewDungeonUseCase(
	dungeonRepo repository.DungeonRepository,
	userRepo repository.UserRepository,
	charRepo repository.CharacterRepository,
	battleUC BattleUseCase,
) DungeonUseCase {
	return &dungeonUseCase{
		dungeonRepo: dungeonRepo,
		userRepo:    userRepo,
		charRepo:    charRepo,
		battleUC:    battleUC,
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

func (uc *dungeonUseCase) EnterDungeon(ctx context.Context, userID int64, dungeonID int64) (*domain.BattleStateResponse, error) {
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

	waves, err := uc.buildWaves(ctx, dungeon)
	if err != nil {
		return nil, err
	}

	refID := dungeonID
	resp, err := uc.battleUC.StartBattle(ctx, userID, "dungeon", &refID, playerTeam, waves)
	if err != nil {
		return nil, fmt.Errorf("failed to start battle: %w", err)
	}

	return resp, nil
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

func (uc *dungeonUseCase) buildWaves(ctx context.Context, dungeon *domain.Dungeon) ([]domain.WaveConfig, error) {
	if dungeon == nil || dungeon.Stages == "" {
		return []domain.WaveConfig{}, nil
	}

	var stages []dungeonStage
	if err := json.Unmarshal([]byte(dungeon.Stages), &stages); err != nil {
		return []domain.WaveConfig{}, nil
	}
	if len(stages) == 0 {
		return []domain.WaveConfig{}, nil
	}

	waves := make([]domain.WaveConfig, 0, len(stages))
	for waveIdx, stage := range stages {
		wave := domain.WaveConfig{
			Wave:    waveIdx,
			Enemies: make([]domain.BattleUnit, 0, len(stage.Enemies)),
		}
		for enemyIdx, enemy := range stage.Enemies {
			char, err := uc.charRepo.GetByID(ctx, enemy.CharacterID)
			if err != nil {
				return nil, err
			}

			level := enemy.Level
			if level <= 0 {
				level = 1
			}

			stats := calculateScaledStats(char, level)
			unitID := fmt.Sprintf("enemy_%d_w%d", enemyIdx, waveIdx)

			wave.Enemies = append(wave.Enemies, domain.BattleUnit{
				UnitID:     unitID,
				Team:       "enemy",
				CharID:     char.ID,
				Name:       char.Name,
				Grade:      char.Grade,
				Element:    string(char.Element),
				Class:      string(char.Class),
				ImageURL:   char.ImageURL,
				Level:      level,
				Position:   enemyIdx,
				HP:         stats.HP,
				MaxHP:      stats.HP,
				ATK:        stats.ATK,
				DEF:        stats.DEF,
				SPD:        stats.SPD,
				CritRate:   15.0,
				CritDamage: 50.0,
				Accuracy:   85.0,
				Resistance: 15.0,
				ATBGauge:   0,
				IsAlive:    true,
				Skills:     generateDefaultEnemySkills(),
			})
		}
		waves = append(waves, wave)
	}

	return waves, nil
}

func generateDefaultEnemySkills() []domain.BattleSkill {
	return []domain.BattleSkill{
		{
			SkillID: 0, SlotIndex: 0,
			Name: "Attack", SkillType: domain.SkillTypeDamage,
			TargetType: domain.TargetSingleEnemy, Multiplier: 1.0,
			MaxCooldown: 0, CurrentCD: 0,
		},
		{
			SkillID: 0, SlotIndex: 1,
			Name: "Strong Attack", SkillType: domain.SkillTypeDamage,
			TargetType: domain.TargetSingleEnemy, Multiplier: 1.5,
			MaxCooldown: 2, CurrentCD: 0,
		},
		{
			SkillID: 0, SlotIndex: 2,
			Name: "Heavy Strike", SkillType: domain.SkillTypeDamage,
			TargetType: domain.TargetSingleEnemy, Multiplier: 2.5,
			MaxCooldown: 3, CurrentCD: 0,
		},
		{
			SkillID: 0, SlotIndex: 3,
			Name: "Special", SkillType: domain.SkillTypeDamage,
			TargetType: domain.TargetAllEnemies, Multiplier: 3.0,
			MaxCooldown: 5, CurrentCD: 0,
		},
	}
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
		CritRate:        detail.CritRate,
		CritDamage:      detail.CritDamage,
		Accuracy:        detail.Accuracy,
		Resistance:      detail.Resistance,
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
