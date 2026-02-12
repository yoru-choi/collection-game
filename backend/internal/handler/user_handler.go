package handler

import (
	"encoding/json"
	"net/http"

	"collection-game/internal/middleware"
	"collection-game/internal/usecase"
	"collection-game/pkg/utils"
)

type UserHandler struct {
	userUC usecase.UserUseCase
}

func NewUserHandler(userUC usecase.UserUseCase) *UserHandler {
	return &UserHandler{userUC: userUC}
}

func (h *UserHandler) GetProfile(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		utils.Unauthorized(w, "user not authenticated")
		return
	}

	profile, err := h.userUC.GetProfile(r.Context(), userID)
	if err != nil {
		utils.InternalServerError(w, err.Error())
		return
	}

	utils.Success(w, profile)
}

func (h *UserHandler) GetInventory(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		utils.Unauthorized(w, "user not authenticated")
		return
	}

	// Get user profile with updated energy
	profile, err := h.userUC.GetProfile(r.Context(), userID)
	if err != nil {
		utils.InternalServerError(w, err.Error())
		return
	}

	// Return inventory summary
	inventory := map[string]interface{}{
		"crystals":   profile.Crystals,
		"gold":       profile.Gold,
		"energy":     profile.Energy,
		"max_energy": profile.MaxEnergy,
		"level":      profile.Level,
		"exp":        profile.Exp,
	}

	utils.Success(w, inventory)
}

type UpdateProfileRequest struct {
	Username string `json:"username"`
	Email    string `json:"email"`
}

func (h *UserHandler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		utils.Unauthorized(w, "user not authenticated")
		return
	}

	var req UpdateProfileRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.BadRequest(w, "invalid request body")
		return
	}

	profile, err := h.userUC.UpdateProfile(r.Context(), userID, req.Username, req.Email)
	if err != nil {
		utils.BadRequest(w, err.Error())
		return
	}

	utils.Success(w, profile)
}
