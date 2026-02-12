package handler

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"

	"collection-game/internal/middleware"
	"collection-game/internal/usecase"
	"collection-game/pkg/utils"
)

type SummonHandler struct {
	summonUC usecase.SummonUseCase
}

func NewSummonHandler(summonUC usecase.SummonUseCase) *SummonHandler {
	return &SummonHandler{summonUC: summonUC}
}

type SummonRequest struct {
	Count int `json:"count"`
}

func (h *SummonHandler) NormalSummon(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		utils.Unauthorized(w, "user not authenticated")
		return
	}

	var req SummonRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil && !errors.Is(err, io.EOF) {
		utils.BadRequest(w, "invalid request body")
		return
	}

	result, err := h.summonUC.NormalSummon(r.Context(), userID, req.Count)
	if err != nil {
		utils.BadRequest(w, err.Error())
		return
	}

	utils.Success(w, result)
}

func (h *SummonHandler) PremiumSummon(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		utils.Unauthorized(w, "user not authenticated")
		return
	}

	var req SummonRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil && !errors.Is(err, io.EOF) {
		utils.BadRequest(w, "invalid request body")
		return
	}

	result, err := h.summonUC.PremiumSummon(r.Context(), userID, req.Count)
	if err != nil {
		utils.BadRequest(w, err.Error())
		return
	}

	utils.Success(w, result)
}

func (h *SummonHandler) GetRates(w http.ResponseWriter, r *http.Request) {
	rates := h.summonUC.GetSummonRates()
	utils.Success(w, rates)
}
