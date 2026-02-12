package usecase

import (
	"context"
	"database/sql"
	"errors"

	"collection-game/internal/domain"
	"collection-game/internal/repository"
)

type GuildUseCase struct {
	guildRepo *repository.GuildRepository
	userRepo  repository.UserRepository
}

func NewGuildUseCase(
	guildRepo *repository.GuildRepository,
	userRepo repository.UserRepository,
) *GuildUseCase {
	return &GuildUseCase{
		guildRepo: guildRepo,
		userRepo:  userRepo,
	}
}

// GetAll gets all guilds with pagination
func (uc *GuildUseCase) GetAll(ctx context.Context, page int, limit int) ([]domain.Guild, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	offset := (page - 1) * limit
	return uc.guildRepo.GetAll(ctx, limit, offset)
}

// GetByID gets a guild by ID
func (uc *GuildUseCase) GetByID(ctx context.Context, id int64) (*domain.Guild, error) {
	return uc.guildRepo.GetByID(ctx, id)
}

// Create creates a new guild
func (uc *GuildUseCase) Create(ctx context.Context, userID int64, req *domain.CreateGuildRequest) (*domain.Guild, error) {
	// Check if user already has a guild
	_, err := uc.guildRepo.GetUserGuild(ctx, userID)
	if err == nil {
		return nil, errors.New("user already in a guild")
	}
	if err != sql.ErrNoRows {
		return nil, err
	}

	// Check if guild name already exists
	_, err = uc.guildRepo.GetByName(ctx, req.Name)
	if err == nil {
		return nil, errors.New("guild name already exists")
	}
	if err != sql.ErrNoRows {
		return nil, err
	}

	// Create guild
	guild := &domain.Guild{
		Name:        req.Name,
		LeaderID:    userID,
		Description: req.Description,
		Emblem:      req.Emblem,
	}

	err = uc.guildRepo.Create(ctx, guild)
	if err != nil {
		return nil, err
	}

	// Add creator as leader
	err = uc.guildRepo.AddMember(ctx, guild.ID, userID, "leader")
	if err != nil {
		return nil, err
	}

	return guild, nil
}

// Update updates guild information
func (uc *GuildUseCase) Update(ctx context.Context, userID int64, guildID int64, req *domain.UpdateGuildRequest) error {
	// Get guild
	guild, err := uc.guildRepo.GetByID(ctx, guildID)
	if err != nil {
		return err
	}

	// Check if user is leader
	if guild.LeaderID != userID {
		return errors.New("only guild leader can update guild")
	}

	// Update fields
	if req.Description != nil {
		guild.Description = req.Description
	}
	if req.Notice != nil {
		guild.Notice = req.Notice
	}
	if req.Emblem != nil {
		guild.Emblem = req.Emblem
	}

	return uc.guildRepo.Update(ctx, guild)
}

// GetMembers gets all members of a guild
func (uc *GuildUseCase) GetMembers(ctx context.Context, guildID int64) ([]domain.GuildMemberDetail, error) {
	return uc.guildRepo.GetMembers(ctx, guildID)
}

// Join joins a guild
func (uc *GuildUseCase) Join(ctx context.Context, userID int64, guildID int64) error {
	// Check if user already has a guild
	_, err := uc.guildRepo.GetUserGuild(ctx, userID)
	if err == nil {
		return errors.New("user already in a guild")
	}
	if err != sql.ErrNoRows {
		return err
	}

	// Check if guild exists and has space
	guild, err := uc.guildRepo.GetByID(ctx, guildID)
	if err != nil {
		return err
	}

	if guild.MembersCount >= guild.MaxMembers {
		return errors.New("guild is full")
	}

	// Add member
	return uc.guildRepo.AddMember(ctx, guildID, userID, "member")
}

// Leave leaves a guild
func (uc *GuildUseCase) Leave(ctx context.Context, userID int64) error {
	// Get user's guild
	guild, err := uc.guildRepo.GetUserGuild(ctx, userID)
	if err != nil {
		if err == sql.ErrNoRows {
			return errors.New("user is not in a guild")
		}
		return err
	}

	// Check if user is leader
	if guild.LeaderID == userID {
		return errors.New("guild leader cannot leave, transfer leadership first")
	}

	return uc.guildRepo.RemoveMember(ctx, guild.ID, userID)
}

// GetMyGuild gets the guild that the user belongs to
func (uc *GuildUseCase) GetMyGuild(ctx context.Context, userID int64) (*domain.Guild, error) {
	return uc.guildRepo.GetUserGuild(ctx, userID)
}
