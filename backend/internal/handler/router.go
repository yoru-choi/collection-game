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
	authHandler *AuthHandler,
	userHandler *UserHandler,
	characterHandler *CharacterHandler,
	summonHandler *SummonHandler,
	wsHandler *WebSocketHandler,
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

	// API v1 routes
	api := r.PathPrefix("/api/v1").Subrouter()

	// Auth routes (no auth required)
	auth := api.PathPrefix("/auth").Subrouter()
	auth.HandleFunc("/register", authHandler.Register).Methods("POST")
	auth.HandleFunc("/login", authHandler.Login).Methods("POST")
	auth.HandleFunc("/refresh", authHandler.Refresh).Methods("POST")

	// Protected routes
	protected := api.PathPrefix("").Subrouter()
	protected.Use(middleware.AuthMiddleware(jwt))

	// User routes
	protected.HandleFunc("/user/profile", userHandler.GetProfile).Methods("GET")

	// Character routes
	protected.HandleFunc("/characters", characterHandler.GetUserCharacters).Methods("GET")
	protected.HandleFunc("/characters/{id}", characterHandler.GetCharacterDetail).Methods("GET")
	protected.HandleFunc("/characters/{id}/level-up", characterHandler.LevelUp).Methods("POST")

	// Summon routes
	protected.HandleFunc("/summon/normal", summonHandler.NormalSummon).Methods("POST")
	protected.HandleFunc("/summon/premium", summonHandler.PremiumSummon).Methods("POST")
	protected.HandleFunc("/summon/rates", summonHandler.GetRates).Methods("GET")

	// WebSocket route
	r.HandleFunc("/ws", wsHandler.HandleConnection)

	return &Router{router: r}
}

func (r *Router) ServeHTTP(w http.ResponseWriter, req *http.Request) {
	r.router.ServeHTTP(w, req)
}
