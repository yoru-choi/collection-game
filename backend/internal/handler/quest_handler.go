package handler

import (
	"net/http"
	"strconv"

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
	userID := r.Context().Value("user_id").(int64)

	quests, err := h.questUC.GetDailyQuests(r.Context(), userID)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Failed to get daily quests")
		return
	}

	utils.WriteJSON(w, http.StatusOK, quests)
}

// GetWeeklyQuests gets user's weekly quests
func (h *QuestHandler) GetWeeklyQuests(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(int64)

	quests, err := h.questUC.GetWeeklyQuests(r.Context(), userID)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Failed to get weekly quests")
		return
	}

	utils.WriteJSON(w, http.StatusOK, quests)
}

// GetAchievements gets user's achievements
func (h *QuestHandler) GetAchievements(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(int64)

	achievements, err := h.questUC.GetAchievements(r.Context(), userID)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Failed to get achievements")
		return
	}

	utils.WriteJSON(w, http.StatusOK, achievements)
}

// ClaimQuest claims quest rewards
func (h *QuestHandler) ClaimQuest(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(int64)

	vars := mux.Vars(r)
	questIDStr := vars["id"]
	questID, err := strconv.ParseInt(questIDStr, 10, 64)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid quest ID")
		return
	}

	rewards, err := h.questUC.ClaimQuest(r.Context(), userID, questID)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	utils.WriteJSON(w, http.StatusOK, rewards)
}

// GetDailyLogin gets user's daily login status
func (h *QuestHandler) GetDailyLogin(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(int64)

	dailyLogin, err := h.questUC.GetDailyLogin(r.Context(), userID)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Failed to get daily login")
		return
	}

	utils.WriteJSON(w, http.StatusOK, dailyLogin)
}
