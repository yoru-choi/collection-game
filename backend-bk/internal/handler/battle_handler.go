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

type BattleHandler struct {
	battleUC usecase.BattleUseCase
}

func NewBattleHandler(battleUC usecase.BattleUseCase) *BattleHandler {
	return &BattleHandler{battleUC: battleUC}
}

func (h *BattleHandler) getBattleID(r *http.Request) (int64, error) {
	vars := mux.Vars(r)
	return strconv.ParseInt(vars["id"], 10, 64)
}

// GET /api/v1/battle/:id/state
func (h *BattleHandler) GetState(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		utils.Unauthorized(w, "user not authenticated")
		return
	}

	battleID, err := h.getBattleID(r)
	if err != nil {
		utils.BadRequest(w, "invalid battle ID")
		return
	}

	state, err := h.battleUC.GetState(r.Context(), userID, battleID)
	if err != nil {
		utils.BadRequest(w, err.Error())
		return
	}

	utils.Success(w, state)
}

// POST /api/v1/battle/:id/action
func (h *BattleHandler) SubmitAction(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		utils.Unauthorized(w, "user not authenticated")
		return
	}

	battleID, err := h.getBattleID(r)
	if err != nil {
		utils.BadRequest(w, "invalid battle ID")
		return
	}

	var action domain.BattleActionRequest
	if err := json.NewDecoder(r.Body).Decode(&action); err != nil {
		utils.BadRequest(w, "invalid request body")
		return
	}

	state, err := h.battleUC.SubmitAction(r.Context(), userID, battleID, action)
	if err != nil {
		utils.BadRequest(w, err.Error())
		return
	}

	utils.Success(w, state)
}

// POST /api/v1/battle/:id/auto
func (h *BattleHandler) SetAutoMode(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		utils.Unauthorized(w, "user not authenticated")
		return
	}

	battleID, err := h.getBattleID(r)
	if err != nil {
		utils.BadRequest(w, "invalid battle ID")
		return
	}

	var req struct {
		Auto bool `json:"auto"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.BadRequest(w, "invalid request body")
		return
	}

	state, err := h.battleUC.SetAutoMode(r.Context(), userID, battleID, req.Auto)
	if err != nil {
		utils.BadRequest(w, err.Error())
		return
	}

	utils.Success(w, state)
}

// POST /api/v1/battle/:id/speed
func (h *BattleHandler) SetSpeed(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		utils.Unauthorized(w, "user not authenticated")
		return
	}

	battleID, err := h.getBattleID(r)
	if err != nil {
		utils.BadRequest(w, "invalid battle ID")
		return
	}

	var req struct {
		Speed float64 `json:"speed"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.BadRequest(w, "invalid request body")
		return
	}

	state, err := h.battleUC.SetSpeed(r.Context(), userID, battleID, req.Speed)
	if err != nil {
		utils.BadRequest(w, err.Error())
		return
	}

	utils.Success(w, state)
}

// POST /api/v1/battle/:id/surrender
func (h *BattleHandler) Surrender(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		utils.Unauthorized(w, "user not authenticated")
		return
	}

	battleID, err := h.getBattleID(r)
	if err != nil {
		utils.BadRequest(w, "invalid battle ID")
		return
	}

	if err := h.battleUC.Surrender(r.Context(), userID, battleID); err != nil {
		utils.BadRequest(w, err.Error())
		return
	}

	utils.Success(w, map[string]string{"message": "surrendered"})
}

// GET /api/v1/battle/:id/result
func (h *BattleHandler) GetResult(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		utils.Unauthorized(w, "user not authenticated")
		return
	}

	battleID, err := h.getBattleID(r)
	if err != nil {
		utils.BadRequest(w, "invalid battle ID")
		return
	}

	result, err := h.battleUC.GetResult(r.Context(), userID, battleID)
	if err != nil {
		utils.BadRequest(w, err.Error())
		return
	}

	utils.Success(w, result)
}
