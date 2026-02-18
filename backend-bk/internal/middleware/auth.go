package middleware

import (
	"context"
	"net/http"
	"strings"

	"collection-game/pkg/auth"
	"collection-game/pkg/utils"
)

type contextKey string

const (
	UserIDKey   contextKey = "userID"
	UsernameKey contextKey = "username"
)

// AuthMiddleware validates JWT tokens and checks blacklist
func AuthMiddleware(jwt *auth.JWT, tokenService *auth.TokenService) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Get token from Authorization header
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				utils.Unauthorized(w, "missing authorization header")
				return
			}

			// Check Bearer prefix
			parts := strings.Split(authHeader, " ")
			if len(parts) != 2 || parts[0] != "Bearer" {
				utils.Unauthorized(w, "invalid authorization header format")
				return
			}

			token := parts[1]

			// Validate token
			claims, err := jwt.ValidateToken(token)
			if err != nil {
				utils.Unauthorized(w, "invalid or expired token")
				return
			}

			// Check if token is blacklisted (logged out)
			if tokenService != nil {
				blacklisted, err := tokenService.IsTokenBlacklisted(r.Context(), claims.TokenID)
				if err == nil && blacklisted {
					utils.Unauthorized(w, "token has been revoked")
					return
				}
			}

			// Add user info to context
			ctx := context.WithValue(r.Context(), UserIDKey, claims.UserID)
			ctx = context.WithValue(ctx, UsernameKey, claims.Username)

			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// GetUserIDFromContext extracts user ID from context
func GetUserIDFromContext(ctx context.Context) (int64, bool) {
	userID, ok := ctx.Value(UserIDKey).(int64)
	return userID, ok
}

// GetUsernameFromContext extracts username from context
func GetUsernameFromContext(ctx context.Context) (string, bool) {
	username, ok := ctx.Value(UsernameKey).(string)
	return username, ok
}
