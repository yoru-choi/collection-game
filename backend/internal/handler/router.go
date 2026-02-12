package handler

import (
	"net/http"
	"time"

	"collection-game/internal/middleware"
	"collection-game/pkg/auth"

	"github.com/gorilla/mux"
)

type Router struct {
	router *mux.Router
}

func NewRouter(
	jwt *auth.JWT,
	tokenService *auth.TokenService,
	authHandler *AuthHandler,
	userHandler *UserHandler,
	characterHandler *CharacterHandler,
	summonHandler *SummonHandler,
	dungeonHandler *DungeonHandler,
	arenaHandler *ArenaHandler,
	questHandler *QuestHandler,
	guildHandler *GuildHandler,
	shopHandler *ShopHandler,
	wsHandler *WebSocketHandler,
	docsHandler *DocsHandler,
) *Router {
	r := mux.NewRouter()

	// Apply global middleware
	r.Use(middleware.LoggingMiddleware)
	r.Use(middleware.CORSMiddleware)

	// Rate limiter: 100 requests per minute
	rateLimiter := middleware.NewRateLimiter(100, time.Minute)
	r.Use(rateLimiter.RateLimitMiddleware)

	// Health check
	r.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"ok"}`))
	}).Methods("GET")

	// Docs
	r.HandleFunc("/openapi.json", docsHandler.ServeOpenAPI).Methods("GET")
	r.HandleFunc("/docs", docsHandler.ServeDocs).Methods("GET")
	r.HandleFunc("/asyncapi.yaml", docsHandler.ServeAsyncAPI).Methods("GET")
	r.HandleFunc("/swagger/index.html", docsHandler.ServeSwaggerUI).Methods("GET")

	// API v1 routes
	api := r.PathPrefix("/api/v1").Subrouter()

	// Auth routes (no auth required)
	auth := api.PathPrefix("/auth").Subrouter()
	auth.HandleFunc("/register", authHandler.Register).Methods("POST")
	auth.HandleFunc("/login", authHandler.Login).Methods("POST")
	auth.HandleFunc("/refresh", authHandler.Refresh).Methods("POST")
	auth.HandleFunc("/logout", authHandler.Logout).Methods("POST")

	// Protected routes
	protected := api.PathPrefix("").Subrouter()
	protected.Use(middleware.AuthMiddleware(jwt, tokenService))

	// User routes
	protected.HandleFunc("/user/profile", userHandler.GetProfile).Methods("GET")
	protected.HandleFunc("/user/profile", userHandler.UpdateProfile).Methods("PUT")
	protected.HandleFunc("/user/inventory", userHandler.GetInventory).Methods("GET")

	// Character routes
	protected.HandleFunc("/characters", characterHandler.GetUserCharacters).Methods("GET")
	protected.HandleFunc("/characters/{id}", characterHandler.GetCharacterDetail).Methods("GET")
	protected.HandleFunc("/characters/{id}/level-up", characterHandler.LevelUp).Methods("POST")
	protected.HandleFunc("/characters/{id}/awaken", characterHandler.Awaken).Methods("POST")
	protected.HandleFunc("/party", characterHandler.GetParty).Methods("GET")
	protected.HandleFunc("/party", characterHandler.SetParty).Methods("PUT")

	// Summon routes
	protected.HandleFunc("/summon/normal", summonHandler.NormalSummon).Methods("POST")
	protected.HandleFunc("/summon/premium", summonHandler.PremiumSummon).Methods("POST")
	protected.HandleFunc("/summon/rates", summonHandler.GetRates).Methods("GET")

	// Dungeon routes
	protected.HandleFunc("/dungeons", dungeonHandler.GetDungeons).Methods("GET")
	protected.HandleFunc("/dungeons/progress", dungeonHandler.GetProgress).Methods("GET")
	protected.HandleFunc("/dungeons/{id:[0-9]+}", dungeonHandler.GetDungeonDetail).Methods("GET")
	protected.HandleFunc("/dungeons/{id:[0-9]+}/enter", dungeonHandler.EnterDungeon).Methods("POST")
	protected.HandleFunc("/dungeons/{id:[0-9]+}/complete", dungeonHandler.CompleteDungeon).Methods("POST")

	// Arena routes
	protected.HandleFunc("/arena", arenaHandler.GetMyArena).Methods("GET")
	protected.HandleFunc("/arena/defense", arenaHandler.SetDefenseTeam).Methods("PUT")
	protected.HandleFunc("/arena/ranking", arenaHandler.GetRanking).Methods("GET")
	protected.HandleFunc("/arena/attack", arenaHandler.Attack).Methods("POST")
	protected.HandleFunc("/arena/history", arenaHandler.GetBattleHistory).Methods("GET")

	// Quest routes
	protected.HandleFunc("/quests/daily", questHandler.GetDailyQuests).Methods("GET")
	protected.HandleFunc("/quests/weekly", questHandler.GetWeeklyQuests).Methods("GET")
	protected.HandleFunc("/quests/achievements", questHandler.GetAchievements).Methods("GET")
	protected.HandleFunc("/quests/{id}/complete", questHandler.CompleteQuest).Methods("POST")
	protected.HandleFunc("/quests/{id}/claim", questHandler.ClaimQuest).Methods("POST")
	protected.HandleFunc("/login/daily", questHandler.GetDailyLogin).Methods("GET")

	// Guild routes
	protected.HandleFunc("/guilds", guildHandler.GetAll).Methods("GET")
	protected.HandleFunc("/guilds", guildHandler.Create).Methods("POST")
	protected.HandleFunc("/guilds/my", guildHandler.GetMyGuild).Methods("GET")
	protected.HandleFunc("/guilds/{id:[0-9]+}", guildHandler.GetByID).Methods("GET")
	protected.HandleFunc("/guilds/{id:[0-9]+}", guildHandler.Update).Methods("PUT")
	protected.HandleFunc("/guilds/{id:[0-9]+}/join", guildHandler.Join).Methods("POST")
	protected.HandleFunc("/guilds/{id:[0-9]+}/leave", guildHandler.Leave).Methods("POST")
	protected.HandleFunc("/guilds/{id:[0-9]+}/members", guildHandler.GetMembers).Methods("GET")

	// Shop routes
	protected.HandleFunc("/shop/items", shopHandler.GetItems).Methods("GET")
	protected.HandleFunc("/shop/purchase", shopHandler.Purchase).Methods("POST")
	protected.HandleFunc("/shop/history", shopHandler.GetPurchaseHistory).Methods("GET")

	// WebSocket route
	r.HandleFunc("/ws", wsHandler.HandleConnection)

	return &Router{router: r}
}

func (r *Router) ServeHTTP(w http.ResponseWriter, req *http.Request) {
	r.router.ServeHTTP(w, req)
}
