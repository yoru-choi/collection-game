package auth

import (
	"context"
	"fmt"
	"time"
)

// Cache interface for token storage
type Cache interface {
	Set(ctx context.Context, key string, value interface{}, expiration time.Duration) error
	Get(ctx context.Context, key string, dest interface{}) error
	SetString(ctx context.Context, key string, value string, expiration time.Duration) error
	GetString(ctx context.Context, key string) (string, error)
	Exists(ctx context.Context, key string) (bool, error)
	Delete(ctx context.Context, keys ...string) error
}

// TokenService handles token storage in Valkey
type TokenService struct {
	cache             Cache
	refreshExpiration time.Duration
	accessExpiration  time.Duration
}

func NewTokenService(cache Cache, accessExp, refreshExp time.Duration) *TokenService {
	return &TokenService{
		cache:             cache,
		accessExpiration:  accessExp,
		refreshExpiration: refreshExp,
	}
}

// StoreRefreshToken stores refresh token in Valkey
// Key format: refresh_token:{user_id}:{token_id}
func (ts *TokenService) StoreRefreshToken(ctx context.Context, userID int64, tokenID string, token string) error {
	key := fmt.Sprintf("refresh_token:%d:%s", userID, tokenID)
	return ts.cache.SetString(ctx, key, token, ts.refreshExpiration)
}

// ValidateRefreshToken checks if refresh token exists in Valkey
func (ts *TokenService) ValidateRefreshToken(ctx context.Context, userID int64, tokenID string) (bool, error) {
	key := fmt.Sprintf("refresh_token:%d:%s", userID, tokenID)
	return ts.cache.Exists(ctx, key)
}

// RevokeRefreshToken removes refresh token from Valkey
func (ts *TokenService) RevokeRefreshToken(ctx context.Context, userID int64, tokenID string) error {
	key := fmt.Sprintf("refresh_token:%d:%s", userID, tokenID)
	return ts.cache.Delete(ctx, key)
}

// BlacklistToken adds access token to blacklist
// Key format: token_blacklist:{token_jti}
func (ts *TokenService) BlacklistToken(ctx context.Context, tokenID string) error {
	key := fmt.Sprintf("token_blacklist:%s", tokenID)
	return ts.cache.SetString(ctx, key, "revoked", ts.accessExpiration)
}

// IsTokenBlacklisted checks if token is blacklisted
func (ts *TokenService) IsTokenBlacklisted(ctx context.Context, tokenID string) (bool, error) {
	key := fmt.Sprintf("token_blacklist:%s", tokenID)
	return ts.cache.Exists(ctx, key)
}

// StoreUserSession stores active session information
// Key format: user_session:{user_id}
func (ts *TokenService) StoreUserSession(ctx context.Context, userID int64, sessionData string) error {
	key := fmt.Sprintf("user_session:%d", userID)
	return ts.cache.SetString(ctx, key, sessionData, 24*time.Hour)
}

// RevokeAllUserTokens revokes all tokens for a user (force logout all devices)
func (ts *TokenService) RevokeAllUserTokens(ctx context.Context, userID int64) error {
	// This would require storing all token IDs for a user
	// For now, we'll implement a simple version
	key := fmt.Sprintf("user_session:%d", userID)
	return ts.cache.Delete(ctx, key)
}
