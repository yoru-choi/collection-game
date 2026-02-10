package handler

import (
	"encoding/json"
	"net/http"

	"collection-game/internal/usecase"
	"collection-game/pkg/utils"
)

type AuthHandler struct {
	authUC usecase.AuthUseCase
}

func NewAuthHandler(authUC usecase.AuthUseCase) *AuthHandler {
	return &AuthHandler{authUC: authUC}
}

type RegisterRequest struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type RefreshRequest struct {
	RefreshToken string `json:"refresh_token"`
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.BadRequest(w, "invalid request body")
		return
	}

	tokens, err := h.authUC.Register(r.Context(), req.Username, req.Email, req.Password)
	if err != nil {
		utils.BadRequest(w, err.Error())
		return
	}

	utils.Success(w, tokens)
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.BadRequest(w, "invalid request body")
		return
	}

	tokens, err := h.authUC.Login(r.Context(), req.Username, req.Password)
	if err != nil {
		utils.Unauthorized(w, err.Error())
		return
	}

	utils.Success(w, tokens)
}

func (h *AuthHandler) Refresh(w http.ResponseWriter, r *http.Request) {
	var req RefreshRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.BadRequest(w, "invalid request body")
		return
	}

	tokens, err := h.authUC.RefreshToken(r.Context(), req.RefreshToken)
	if err != nil {
		utils.Unauthorized(w, err.Error())
		return
	}

	utils.Success(w, tokens)
}

func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	// Get tokens from request
	accessToken := r.Header.Get("Authorization")
	if accessToken != "" {
		// Remove "Bearer " prefix
		if len(accessToken) > 7 && accessToken[:7] == "Bearer " {
			accessToken = accessToken[7:]
		}
	}

	var req struct {
		RefreshToken string `json:"refresh_token"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		// If no body, just proceed with access token
		req.RefreshToken = ""
	}

	// Perform logout (blacklist tokens)
	if err := h.authUC.Logout(r.Context(), accessToken, req.RefreshToken); err != nil {
		utils.InternalServerError(w, err.Error())
		return
	}

	utils.Success(w, map[string]string{
		"message": "logged out successfully",
	})
}
