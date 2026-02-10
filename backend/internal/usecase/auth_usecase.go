package usecase

import (
	"context"
	"errors"
	"fmt"
	"time"

	"collection-game/internal/domain"
	"collection-game/internal/repository"
	"collection-game/pkg/auth"
)

type AuthUseCase interface {
	Register(ctx context.Context, username, email, password string) (*auth.TokenPair, error)
	Login(ctx context.Context, username, password string) (*auth.TokenPair, error)
	RefreshToken(ctx context.Context, refreshToken string) (*auth.TokenPair, error)
}

type authUseCase struct {
	userRepo repository.UserRepository
	jwt      *auth.JWT
}

func NewAuthUseCase(userRepo repository.UserRepository, jwt *auth.JWT) AuthUseCase {
	return &authUseCase{
		userRepo: userRepo,
		jwt:      jwt,
	}
}

func (uc *authUseCase) Register(ctx context.Context, username, email, password string) (*auth.TokenPair, error) {
	// Validate input
	if username == "" || email == "" || password == "" {
		return nil, errors.New("username, email, and password are required")
	}

	if len(password) < 6 {
		return nil, errors.New("password must be at least 6 characters")
	}

	// Check if username exists
	existingUser, _ := uc.userRepo.GetByUsername(ctx, username)
	if existingUser != nil {
		return nil, errors.New("username already exists")
	}

	// Check if email exists
	existingEmail, _ := uc.userRepo.GetByEmail(ctx, email)
	if existingEmail != nil {
		return nil, errors.New("email already exists")
	}

	// Hash password
	passwordHash, err := auth.HashPassword(password)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	// Create user
	user := &domain.User{
		Username:         username,
		Email:            email,
		PasswordHash:     passwordHash,
		Level:            1,
		Exp:              0,
		Crystals:         300,  // Starting crystals
		Gold:             5000, // Starting gold
		Energy:           100,
		MaxEnergy:        100,
		LastEnergyUpdate: time.Now(),
	}

	if err := uc.userRepo.Create(ctx, user); err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	// Generate tokens
	tokens, err := uc.jwt.GenerateTokenPair(user.ID, user.Username)
	if err != nil {
		return nil, fmt.Errorf("failed to generate tokens: %w", err)
	}

	return tokens, nil
}

func (uc *authUseCase) Login(ctx context.Context, username, password string) (*auth.TokenPair, error) {
	// Get user by username
	user, err := uc.userRepo.GetByUsername(ctx, username)
	if err != nil {
		return nil, errors.New("invalid username or password")
	}

	// Check password
	if !auth.CheckPassword(password, user.PasswordHash) {
		return nil, errors.New("invalid username or password")
	}

	// Generate tokens
	tokens, err := uc.jwt.GenerateTokenPair(user.ID, user.Username)
	if err != nil {
		return nil, fmt.Errorf("failed to generate tokens: %w", err)
	}

	return tokens, nil
}

func (uc *authUseCase) RefreshToken(ctx context.Context, refreshToken string) (*auth.TokenPair, error) {
	// Validate refresh token
	claims, err := uc.jwt.ValidateToken(refreshToken)
	if err != nil {
		return nil, err
	}

	// Generate new token pair
	tokens, err := uc.jwt.GenerateTokenPair(claims.UserID, claims.Username)
	if err != nil {
		return nil, fmt.Errorf("failed to generate tokens: %w", err)
	}

	return tokens, nil
}
