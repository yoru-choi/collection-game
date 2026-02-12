package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"collection-game/internal/domain"
	"collection-game/internal/middleware"
	"collection-game/internal/usecase"
	"collection-game/pkg/utils"
)

type ArenaHandler struct {
	arenaUC *usecase.ArenaUseCase
}

func NewArenaHandler(arenaUC *usecase.ArenaUseCase) *ArenaHandler {
	return &ArenaHandler{
		arenaUC: arenaUC,
	}
}

// GetMyArena gets user's arena status
func (h *ArenaHandler) GetMyArena(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		utils.Unauthorized(w, "user not authenticated")
		return
	}

	arena, err := h.arenaUC.GetMyArena(r.Context(), userID)
	if err != nil {
		utils.Error(w, http.StatusInternalServerError, "Failed to get arena status")
		return
	}

	utils.Success(w, arena)
}

// SetDefenseTeam sets user's defense team
func (h *ArenaHandler) SetDefenseTeam(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		utils.Unauthorized(w, "user not authenticated")
		return
	}

	var req domain.DefenseTeam
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.BadRequest(w, "Invalid request body")
		return
	}

	err := h.arenaUC.SetDefenseTeam(r.Context(), userID, req.CharacterIDs)
	if err != nil {
		utils.BadRequest(w, err.Error())
		return
	}

	utils.Success(w, map[string]string{
		"message": "Defense team set successfully",
	})
}

// GetRanking gets arena ranking
func (h *ArenaHandler) GetRanking(w http.ResponseWriter, r *http.Request) {
	limitStr := r.URL.Query().Get("limit")
	limit := 50
	if limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil {
			limit = l
		}
	}

	rankings, err := h.arenaUC.GetRanking(r.Context(), limit)
	if err != nil {
		utils.Error(w, http.StatusInternalServerError, "Failed to get rankings")
		return
	}

	utils.Success(w, rankings)
}

// Attack performs an arena attack
func (h *ArenaHandler) Attack(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		utils.Unauthorized(w, "user not authenticated")
		return
	}

	var req struct {
		DefenderID   int64   `json:"defender_id"`
		AttackerTeam []int64 `json:"attacker_team"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.BadRequest(w, "Invalid request body")
		return
	}

	won, ratingChange, err := h.arenaUC.Attack(r.Context(), userID, req.DefenderID, req.AttackerTeam)
	if err != nil {
		utils.BadRequest(w, err.Error())
		return
	}

	utils.Success(w, map[string]interface{}{
		"won":           won,
		"rating_change": ratingChange,
	})
}

// GetBattleHistory gets user's battle history
func (h *ArenaHandler) GetBattleHistory(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		utils.Unauthorized(w, "user not authenticated")
		return
	}

	limitStr := r.URL.Query().Get("limit")
	limit := 20
	if limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil {
			limit = l
		}
	}

	history, err := h.arenaUC.GetBattleHistory(r.Context(), userID, limit)
	if err != nil {
		utils.Error(w, http.StatusInternalServerError, "Failed to get battle history")
		return
	}

	utils.Success(w, history)
}
