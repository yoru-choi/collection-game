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

type GuildHandler struct {
	guildUC *usecase.GuildUseCase
}

func NewGuildHandler(guildUC *usecase.GuildUseCase) *GuildHandler {
	return &GuildHandler{
		guildUC: guildUC,
	}
}

// GetAll gets all guilds
func (h *GuildHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	pageStr := r.URL.Query().Get("page")
	limitStr := r.URL.Query().Get("limit")

	page := 1
	limit := 20

	if pageStr != "" {
		if p, err := strconv.Atoi(pageStr); err == nil {
			page = p
		}
	}
	if limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil {
			limit = l
		}
	}

	guilds, err := h.guildUC.GetAll(r.Context(), page, limit)
	if err != nil {
		utils.Error(w, http.StatusInternalServerError, "Failed to get guilds")
		return
	}

	utils.Success(w, guilds)
}

// GetByID gets a guild by ID
func (h *GuildHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	idStr := vars["id"]
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		utils.BadRequest(w, "Invalid guild ID")
		return
	}

	guild, err := h.guildUC.GetByID(r.Context(), id)
	if err != nil {
		utils.Error(w, http.StatusNotFound, "Guild not found")
		return
	}

	utils.Success(w, guild)
}

// Create creates a new guild
func (h *GuildHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		utils.Unauthorized(w, "user not authenticated")
		return
	}

	var req domain.CreateGuildRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.BadRequest(w, "Invalid request body")
		return
	}

	guild, err := h.guildUC.Create(r.Context(), userID, &req)
	if err != nil {
		utils.BadRequest(w, err.Error())
		return
	}

	utils.Success(w, guild)
}

// Update updates guild information
func (h *GuildHandler) Update(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		utils.Unauthorized(w, "user not authenticated")
		return
	}

	vars := mux.Vars(r)
	idStr := vars["id"]
	guildID, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		utils.BadRequest(w, "Invalid guild ID")
		return
	}

	var req domain.UpdateGuildRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.BadRequest(w, "Invalid request body")
		return
	}

	err = h.guildUC.Update(r.Context(), userID, guildID, &req)
	if err != nil {
		utils.BadRequest(w, err.Error())
		return
	}

	utils.Success(w, map[string]string{"message": "Guild updated successfully"})
}

// GetMembers gets all members of a guild
func (h *GuildHandler) GetMembers(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	idStr := vars["id"]
	guildID, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		utils.BadRequest(w, "Invalid guild ID")
		return
	}

	members, err := h.guildUC.GetMembers(r.Context(), guildID)
	if err != nil {
		utils.Error(w, http.StatusInternalServerError, "Failed to get guild members")
		return
	}

	utils.Success(w, members)
}

// Join joins a guild
func (h *GuildHandler) Join(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		utils.Unauthorized(w, "user not authenticated")
		return
	}

	vars := mux.Vars(r)
	idStr := vars["id"]
	guildID, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		utils.BadRequest(w, "Invalid guild ID")
		return
	}

	err = h.guildUC.Join(r.Context(), userID, guildID)
	if err != nil {
		utils.BadRequest(w, err.Error())
		return
	}

	utils.Success(w, map[string]string{"message": "Joined guild successfully"})
}

// Leave leaves a guild
func (h *GuildHandler) Leave(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		utils.Unauthorized(w, "user not authenticated")
		return
	}

	err := h.guildUC.Leave(r.Context(), userID)
	if err != nil {
		utils.BadRequest(w, err.Error())
		return
	}

	utils.Success(w, map[string]string{"message": "Left guild successfully"})
}

// GetMyGuild gets user's guild
func (h *GuildHandler) GetMyGuild(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		utils.Unauthorized(w, "user not authenticated")
		return
	}

	guild, err := h.guildUC.GetMyGuild(r.Context(), userID)
	if err != nil {
		utils.Error(w, http.StatusNotFound, "Not in a guild")
		return
	}

	utils.Success(w, guild)
}
