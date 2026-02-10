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

type DungeonHandler struct {
	dungeonUC usecase.DungeonUseCase
}

func NewDungeonHandler(dungeonUC usecase.DungeonUseCase) *DungeonHandler {
	return &DungeonHandler{dungeonUC: dungeonUC}
}

// GET /api/v1/dungeons
func (h *DungeonHandler) GetDungeons(w http.ResponseWriter, r *http.Request) {
	chapterStr := r.URL.Query().Get("chapter")
	
	if chapterStr != "" {
		chapter, err := strconv.Atoi(chapterStr)
		if err != nil {
			utils.BadRequest(w, "invalid chapter number")
			return
		}
		
		dungeons, err := h.dungeonUC.GetDungeonsByChapter(r.Context(), chapter)
		if err != nil {
			utils.InternalServerError(w, err.Error())
			return
		}
		utils.Success(w, dungeons)
		return
	}

	dungeons, err := h.dungeonUC.GetAllDungeons(r.Context())
	if err != nil {
		utils.InternalServerError(w, err.Error())
		return
	}
	utils.Success(w, dungeons)
}

// GET /api/v1/dungeons/:id
func (h *DungeonHandler) GetDungeonDetail(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	dungeonID, err := strconv.ParseInt(vars["id"], 10, 64)
	if err != nil {
		utils.BadRequest(w, "invalid dungeon ID")
		return
	}

	dungeon, err := h.dungeonUC.GetDungeonDetail(r.Context(), dungeonID)
	if err != nil {
		utils.NotFound(w, "dungeon not found")
		return
	}
	utils.Success(w, dungeon)
}

// GET /api/v1/dungeons/progress
func (h *DungeonHandler) GetProgress(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		utils.Unauthorized(w, "user not authenticated")
		return
	}

	progress, err := h.dungeonUC.GetUserProgress(r.Context(), userID)
	if err != nil {
		utils.InternalServerError(w, err.Error())
		return
	}
	utils.Success(w, progress)
}

// POST /api/v1/dungeons/:id/enter
func (h *DungeonHandler) EnterDungeon(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		utils.Unauthorized(w, "user not authenticated")
		return
	}

	vars := mux.Vars(r)
	dungeonID, err := strconv.ParseInt(vars["id"], 10, 64)
	if err != nil {
		utils.BadRequest(w, "invalid dungeon ID")
		return
	}

	battle, err := h.dungeonUC.EnterDungeon(r.Context(), userID, dungeonID)
	if err != nil {
		utils.BadRequest(w, err.Error())
		return
	}

	utils.Success(w, battle)
}

type CompleteDungeonRequest struct {
	Stars      int `json:"stars"`
	TimeTaken  int `json:"time_taken"` // in seconds
}

// POST /api/v1/dungeons/:id/complete
func (h *DungeonHandler) CompleteDungeon(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		utils.Unauthorized(w, "user not authenticated")
		return
	}

	vars := mux.Vars(r)
	dungeonID, err := strconv.ParseInt(vars["id"], 10, 64)
	if err != nil {
		utils.BadRequest(w, "invalid dungeon ID")
		return
	}

	var req CompleteDungeonRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.BadRequest(w, "invalid request body")
		return
	}

	if req.Stars < 1 || req.Stars > 3 {
		utils.BadRequest(w, "stars must be between 1 and 3")
		return
	}

	if err := h.dungeonUC.CompleteDungeon(r.Context(), userID, dungeonID, req.Stars, req.TimeTaken); err != nil {
		utils.BadRequest(w, err.Error())
		return
	}

	utils.Success(w, map[string]string{"message": "dungeon completed successfully"})
}
