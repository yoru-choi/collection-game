package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"collection-game/internal/domain"
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

	characters, err := h.charUC.GetUserCharacterDetails(r.Context(), userID)
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
  userID, ok := middleware.GetUserIDFromContext(r.Context())
  if !ok {
    utils.Unauthorized(w, "user not authenticated")
    return
  }

	vars := mux.Vars(r)
	charID, err := strconv.ParseInt(vars["id"], 10, 64)
	if err != nil {
		utils.BadRequest(w, "invalid character ID")
		return
	}

	// Verify ownership
	detail, err := h.charUC.GetUserCharacterDetail(r.Context(), charID)
	if err != nil {
		utils.NotFound(w, "character not found")
		return
	}
	if detail.UserID != userID {
		utils.Unauthorized(w, "not authorized to modify this character")
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

	updated, err := h.charUC.LevelUp(r.Context(), charID, req.ExpCrystals)
	if err != nil {
		utils.BadRequest(w, err.Error())
		return
	}

	utils.Success(w, updated)
}

func (h *CharacterHandler) Awaken(w http.ResponseWriter, r *http.Request) {
  userID, ok := middleware.GetUserIDFromContext(r.Context())
  if !ok {
    utils.Unauthorized(w, "user not authenticated")
    return
  }

	vars := mux.Vars(r)
	charID, err := strconv.ParseInt(vars["id"], 10, 64)
	if err != nil {
		utils.BadRequest(w, "invalid character ID")
		return
	}

	// Verify ownership
	detail, err := h.charUC.GetUserCharacterDetail(r.Context(), charID)
	if err != nil {
		utils.NotFound(w, "character not found")
		return
	}
	if detail.UserID != userID {
		utils.Unauthorized(w, "not authorized to modify this character")
		return
	}

	updated, err := h.charUC.Awaken(r.Context(), charID)
	if err != nil {
		utils.BadRequest(w, err.Error())
		return
	}

	utils.Success(w, updated)
}

type PartyRequest struct {
	CharacterIDs []int64 `json:"character_ids"`
}

func (h *CharacterHandler) GetParty(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		utils.Unauthorized(w, "user not authenticated")
		return
	}

	party, err := h.charUC.GetUserParty(r.Context(), userID)
	if err != nil {
		utils.InternalServerError(w, err.Error())
		return
	}

	utils.Success(w, party)
}

func (h *CharacterHandler) SetParty(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		utils.Unauthorized(w, "user not authenticated")
		return
	}

	var req PartyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.BadRequest(w, "invalid request body")
		return
	}

	if len(req.CharacterIDs) > 4 {
		utils.BadRequest(w, "party must have 1-4 characters")
		return
	}

	seen := map[int64]bool{}
	members := make([]*domain.PartyMember, 0, len(req.CharacterIDs))
	for idx, charID := range req.CharacterIDs {
		if charID == 0 {
			utils.BadRequest(w, "invalid character id")
			return
		}
		if seen[charID] {
			utils.BadRequest(w, "duplicate character id")
			return
		}
		seen[charID] = true

		detail, err := h.charUC.GetUserCharacterDetail(r.Context(), charID)
		if err != nil {
			utils.NotFound(w, "character not found")
			return
		}
		if detail.UserID != userID {
			utils.Unauthorized(w, "not authorized to use this character")
			return
		}

		members = append(members, &domain.PartyMember{
			UserID:          userID,
			SlotIndex:       idx,
			UserCharacterID: charID,
		})
	}

	if err := h.charUC.SetUserParty(r.Context(), userID, members); err != nil {
		utils.InternalServerError(w, err.Error())
		return
	}

	utils.Success(w, map[string]string{"message": "party updated"})
}
