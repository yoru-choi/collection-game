package handler

import (
	"net/http"
	"strconv"

	"collection-game/internal/middleware"
	"collection-game/internal/usecase"
	"collection-game/pkg/utils"

	"github.com/gorilla/mux"
)

type QuestHandler struct {
	questUC *usecase.QuestUseCase
}

func NewQuestHandler(questUC *usecase.QuestUseCase) *QuestHandler {
	return &QuestHandler{
		questUC: questUC,
	}
}

// GetDailyQuests gets user's daily quests
func (h *QuestHandler) GetDailyQuests(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		utils.Unauthorized(w, "user not authenticated")
		return
	}

	quests, err := h.questUC.GetDailyQuests(r.Context(), userID)
	if err != nil {
		utils.Error(w, http.StatusInternalServerError, "Failed to get daily quests")
		return
	}

	utils.Success(w, quests)
}

// GetWeeklyQuests gets user's weekly quests
func (h *QuestHandler) GetWeeklyQuests(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		utils.Unauthorized(w, "user not authenticated")
		return
	}

	quests, err := h.questUC.GetWeeklyQuests(r.Context(), userID)
	if err != nil {
		utils.Error(w, http.StatusInternalServerError, "Failed to get weekly quests")
		return
	}

	utils.Success(w, quests)
}

// GetAchievements gets user's achievements
func (h *QuestHandler) GetAchievements(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		utils.Unauthorized(w, "user not authenticated")
		return
	}

	achievements, err := h.questUC.GetAchievements(r.Context(), userID)
	if err != nil {
		utils.Error(w, http.StatusInternalServerError, "Failed to get achievements")
		return
	}

	utils.Success(w, achievements)
}

// ClaimQuest claims quest rewards
func (h *QuestHandler) ClaimQuest(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		utils.Unauthorized(w, "user not authenticated")
		return
	}

	vars := mux.Vars(r)
	questIDStr := vars["id"]
	questID, err := strconv.ParseInt(questIDStr, 10, 64)
	if err != nil {
		utils.BadRequest(w, "Invalid quest ID")
		return
	}

	rewards, err := h.questUC.ClaimQuest(r.Context(), userID, questID)
	if err != nil {
		utils.BadRequest(w, err.Error())
		return
	}

	utils.Success(w, rewards)
}

// GetDailyLogin gets user's daily login status
func (h *QuestHandler) GetDailyLogin(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		utils.Unauthorized(w, "user not authenticated")
		return
	}

	dailyLogin, err := h.questUC.GetDailyLogin(r.Context(), userID)
	if err != nil {
		utils.Error(w, http.StatusInternalServerError, "Failed to get daily login")
		return
	}

	utils.Success(w, dailyLogin)
}

// CompleteQuest marks a quest as completed
func (h *QuestHandler) CompleteQuest(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		utils.Unauthorized(w, "user not authenticated")
		return
	}

	vars := mux.Vars(r)
	questIDStr := vars["id"]
	questID, err := strconv.ParseInt(questIDStr, 10, 64)
	if err != nil {
		utils.BadRequest(w, "Invalid quest ID")
		return
	}

	if err := h.questUC.CompleteQuest(r.Context(), userID, questID); err != nil {
		utils.BadRequest(w, err.Error())
		return
	}

	utils.Success(w, map[string]string{"message": "quest completed"})
}
