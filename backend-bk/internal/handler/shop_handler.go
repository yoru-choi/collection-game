package handler

import (
	"encoding/json"
	"net/http"

	"collection-game/internal/domain"
	"collection-game/internal/middleware"
	"collection-game/internal/usecase"
	"collection-game/pkg/utils"
)

type ShopHandler struct {
	shopUC *usecase.ShopUseCase
}

func NewShopHandler(shopUC *usecase.ShopUseCase) *ShopHandler {
	return &ShopHandler{
		shopUC: shopUC,
	}
}

// GetItems gets shop items
func (h *ShopHandler) GetItems(w http.ResponseWriter, r *http.Request) {
	currencyType := r.URL.Query().Get("currency")

	items, err := h.shopUC.GetItems(r.Context(), currencyType)
	if err != nil {
		utils.Error(w, http.StatusInternalServerError, "Failed to get shop items")
		return
	}

	utils.Success(w, items)
}

// Purchase purchases an item
func (h *ShopHandler) Purchase(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		utils.Unauthorized(w, "user not authenticated")
		return
	}

	var req domain.PurchaseRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.BadRequest(w, "Invalid request body")
		return
	}

	err := h.shopUC.Purchase(r.Context(), userID, &req)
	if err != nil {
		utils.BadRequest(w, err.Error())
		return
	}

	utils.Success(w, map[string]string{"message": "Purchase successful"})
}

// GetPurchaseHistory gets user's purchase history
func (h *ShopHandler) GetPurchaseHistory(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		utils.Unauthorized(w, "user not authenticated")
		return
	}

	history, err := h.shopUC.GetPurchaseHistory(r.Context(), userID, 50)
	if err != nil {
		utils.Error(w, http.StatusInternalServerError, "Failed to get purchase history")
		return
	}

	utils.Success(w, history)
}
