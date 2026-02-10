package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"collection-game/internal/middleware"
	"collection-game/internal/usecase"
	"collection-game/pkg/utils"

	"github.com/gorilla/mux"
)

type CharacterHandler struct {
	charUC usecase.CharacterUseCase
}

func NewCharacterHandler(charUC usecase.CharacterUseCase) *CharacterHandler {
	return &CharacterHandler{charUC: charUC}
}

func (h *CharacterHandler) GetUserCharacters(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		utils.Unauthorized(w, "user not authenticated")
		return
	}

	characters, err := h.charUC.GetUserCharacters(r.Context(), userID)
	if err != nil {
		utils.InternalServerError(w, err.Error())
		return
	}

	utils.Success(w, characters)
}

func (h *CharacterHandler) GetCharacterDetail(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	charID, err := strconv.ParseInt(vars["id"], 10, 64)
	if err != nil {
		utils.BadRequest(w, "invalid character ID")
		return
	}

	detail, err := h.charUC.GetUserCharacterDetail(r.Context(), charID)
	if err != nil {
		utils.NotFound(w, "character not found")
		return
	}

	// Verify ownership
	userID, _ := middleware.GetUserIDFromContext(r.Context())
	if detail.UserID != userID {
		utils.Unauthorized(w, "not authorized to view this character")
		return
	}

	utils.Success(w, detail)
}

type LevelUpRequest struct {
	ExpCrystals int `json:"exp_crystals"`
}

func (h *CharacterHandler) LevelUp(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	charID, err := strconv.ParseInt(vars["id"], 10, 64)
	if err != nil {
		utils.BadRequest(w, "invalid character ID")
		return
	}

	var req LevelUpRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.BadRequest(w, "invalid request body")
		return
	}

	if req.ExpCrystals <= 0 {
		utils.BadRequest(w, "exp_crystals must be positive")
		return
	}

	if err := h.charUC.LevelUp(r.Context(), charID, req.ExpCrystals); err != nil {
		utils.BadRequest(w, err.Error())
		return
	}

	utils.Success(w, map[string]string{"message": "character leveled up successfully"})
}
