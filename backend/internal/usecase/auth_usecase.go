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
	Logout(ctx context.Context, accessToken string, refreshToken string) error
}

type authUseCase struct {
	userRepo     repository.UserRepository
	jwt          *auth.JWT
	tokenService *auth.TokenService
}

func NewAuthUseCase(userRepo repository.UserRepository, jwt *auth.JWT, tokenService *auth.TokenService) AuthUseCase {
	return &authUseCase{
		userRepo:     userRepo,
		jwt:          jwt,
		tokenService: tokenService,
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

	// Store refresh token in Valkey
	refreshClaims, err := uc.jwt.ValidateToken(tokens.RefreshToken)
	if err != nil {
		return nil, fmt.Errorf("failed to validate refresh token: %w", err)
	}

	if err := uc.tokenService.StoreRefreshToken(ctx, user.ID, refreshClaims.TokenID, tokens.RefreshToken); err != nil {
		return nil, fmt.Errorf("failed to store refresh token: %w", err)
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

	// Store refresh token in Valkey
	refreshClaims, err := uc.jwt.ValidateToken(tokens.RefreshToken)
	if err != nil {
		return nil, fmt.Errorf("failed to validate refresh token: %w", err)
	}

	if err := uc.tokenService.StoreRefreshToken(ctx, user.ID, refreshClaims.TokenID, tokens.RefreshToken); err != nil {
		return nil, fmt.Errorf("failed to store refresh token: %w", err)
	}

	return tokens, nil
}

func (uc *authUseCase) RefreshToken(ctx context.Context, refreshToken string) (*auth.TokenPair, error) {
	// Validate refresh token
	claims, err := uc.jwt.ValidateToken(refreshToken)
	if err != nil {
		return nil, err
	}

	// Check if refresh token exists in Valkey
	valid, err := uc.tokenService.ValidateRefreshToken(ctx, claims.UserID, claims.TokenID)
	if err != nil || !valid {
		return nil, errors.New("invalid or expired refresh token")
	}

	// Revoke old refresh token (Token Rotation)
	if err := uc.tokenService.RevokeRefreshToken(ctx, claims.UserID, claims.TokenID); err != nil {
		return nil, fmt.Errorf("failed to revoke old refresh token: %w", err)
	}

	// Generate new token pair
	tokens, err := uc.jwt.GenerateTokenPair(claims.UserID, claims.Username)
	if err != nil {
		return nil, fmt.Errorf("failed to generate tokens: %w", err)
	}

	// Store new refresh token in Valkey
	newRefreshClaims, err := uc.jwt.ValidateToken(tokens.RefreshToken)
	if err != nil {
		return nil, fmt.Errorf("failed to validate new refresh token: %w", err)
	}

	if err := uc.tokenService.StoreRefreshToken(ctx, claims.UserID, newRefreshClaims.TokenID, tokens.RefreshToken); err != nil {
		return nil, fmt.Errorf("failed to store new refresh token: %w", err)
	}

	return tokens, nil
}

func (uc *authUseCase) Logout(ctx context.Context, accessToken string, refreshToken string) error {
	// Validate access token
	accessClaims, err := uc.jwt.ValidateToken(accessToken)
	if err != nil && err != auth.ErrExpiredToken {
		// If token is invalid (not just expired), still try to clean up
		return nil
	}

	// Blacklist access token
	if accessClaims != nil {
		if err := uc.tokenService.BlacklistToken(ctx, accessClaims.TokenID); err != nil {
			return fmt.Errorf("failed to blacklist access token: %w", err)
		}
	}

	// Validate and revoke refresh token
	if refreshToken != "" {
		refreshClaims, err := uc.jwt.ValidateToken(refreshToken)
		if err == nil {
			if err := uc.tokenService.RevokeRefreshToken(ctx, refreshClaims.UserID, refreshClaims.TokenID); err != nil {
				return fmt.Errorf("failed to revoke refresh token: %w", err)
			}
		}
	}

	return nil
}
