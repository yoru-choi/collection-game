package usecase

import (
	"context"
	"encoding/json"
	"errors"

	"collection-game/internal/domain"
	"collection-game/internal/repository"
)

type ShopUseCase struct {
	shopRepo *repository.ShopRepository
	userRepo repository.UserRepository
	charRepo repository.CharacterRepository
}

func NewShopUseCase(
	shopRepo *repository.ShopRepository,
	userRepo repository.UserRepository,
	charRepo repository.CharacterRepository,
) *ShopUseCase {
	return &ShopUseCase{
		shopRepo: shopRepo,
		userRepo: userRepo,
		charRepo: charRepo,
	}
}

// GetItems gets shop items filtered by currency type
func (uc *ShopUseCase) GetItems(ctx context.Context, currencyType string) ([]domain.ShopItem, error) {
	return uc.shopRepo.GetActiveItems(ctx, currencyType)
}

// Purchase purchases an item
func (uc *ShopUseCase) Purchase(ctx context.Context, userID int64, req *domain.PurchaseRequest) error {
	// Get item
	item, err := uc.shopRepo.GetByID(ctx, req.ShopItemID)
	if err != nil {
		return err
	}

	// Check if item is available
	if !item.IsActive {
		return errors.New("item is not available")
	}

	// Check stock
	if item.Stock >= 0 && item.Stock < req.Quantity {
		return errors.New("insufficient stock")
	}

	// Get user
	user, err := uc.userRepo.GetByID(ctx, userID)
	if err != nil {
		return err
	}

	// Calculate total price
	totalPrice := item.Price * req.Quantity

	// Check if user has enough currency
	switch item.CurrencyType {
	case "crystal":
		if user.Crystals < int64(totalPrice) {
			return errors.New("insufficient crystals")
		}
	case "gold":
		if user.Gold < int64(totalPrice) {
			return errors.New("insufficient gold")
		}
	default:
		return errors.New("unsupported currency type")
	}

	// Deduct currency
	if item.CurrencyType == "crystal" {
		err = uc.userRepo.UpdateCurrency(ctx, userID, -int64(totalPrice), 0)
	} else if item.CurrencyType == "gold" {
		err = uc.userRepo.UpdateCurrency(ctx, userID, 0, -int64(totalPrice))
	}
	if err != nil {
		return err
	}

	// Grant items to user
	err = uc.grantItems(ctx, userID, item, req.Quantity)
	if err != nil {
		// Rollback currency deduction
		if item.CurrencyType == "crystal" {
			uc.userRepo.UpdateCurrency(ctx, userID, int64(totalPrice), 0)
		} else if item.CurrencyType == "gold" {
			uc.userRepo.UpdateCurrency(ctx, userID, 0, int64(totalPrice))
		}
		return err
	}

	// Record purchase
	purchase := &domain.ShopPurchase{
		UserID:       userID,
		ShopItemID:   req.ShopItemID,
		Quantity:     req.Quantity,
		TotalPrice:   totalPrice,
		CurrencyType: item.CurrencyType,
	}
	err = uc.shopRepo.RecordPurchase(ctx, purchase)
	if err != nil {
		return err
	}

	return nil
}

// grantItems grants items to user based on shop item data
func (uc *ShopUseCase) grantItems(ctx context.Context, userID int64, item *domain.ShopItem, quantity int) error {
	var itemData domain.ShopItemData
	err := json.Unmarshal(item.ItemData, &itemData)
	if err != nil {
		return err
	}

	// Handle different item types
	switch item.ItemType {
	case "gold":
		amount := itemData.Amount * quantity
		return uc.userRepo.UpdateCurrency(ctx, userID, 0, int64(amount))
	case "crystal":
		amount := itemData.Amount * quantity
		return uc.userRepo.UpdateCurrency(ctx, userID, int64(amount), 0)
	case "energy":
		amount := itemData.Amount * quantity
		return uc.userRepo.AddEnergy(ctx, userID, amount)
	case "character":
		if itemData.CharacterID == nil {
			return errors.New("character item missing character_id")
		}
		for i := 0; i < quantity; i++ {
			if err := uc.grantCharacter(ctx, userID, *itemData.CharacterID); err != nil {
				return err
			}
		}
		return nil
	case "package":
		return uc.grantPackage(ctx, userID, itemData.Package, quantity)
	default:
		return errors.New("unsupported item type")
	}
}

func (uc *ShopUseCase) grantPackage(ctx context.Context, userID int64, items []domain.PackageItem, quantity int) error {
	if len(items) == 0 || quantity <= 0 {
		return nil
	}

	var addCrystals int64
	var addGold int64
	var addEnergy int

	for _, item := range items {
		if item.Amount <= 0 {
			continue
		}
		amount := item.Amount * quantity
		switch item.Type {
		case "crystal":
			addCrystals += int64(amount)
		case "gold":
			addGold += int64(amount)
		case "energy":
			addEnergy += amount
		case "character":
			if item.ID == nil {
				return errors.New("package character item missing id")
			}
			for i := 0; i < amount; i++ {
				if err := uc.grantCharacter(ctx, userID, *item.ID); err != nil {
					return err
				}
			}
		default:
			return errors.New("unsupported package item type")
		}
	}

	if addCrystals != 0 || addGold != 0 {
		if err := uc.userRepo.UpdateCurrency(ctx, userID, addCrystals, addGold); err != nil {
			return err
		}
	}
	if addEnergy > 0 {
		if err := uc.userRepo.AddEnergy(ctx, userID, addEnergy); err != nil {
			return err
		}
	}

	return nil
}

func (uc *ShopUseCase) grantCharacter(ctx context.Context, userID int64, characterID int64) error {
	char, err := uc.charRepo.GetByID(ctx, characterID)
	if err != nil {
		return err
	}

	userChar := &domain.UserCharacter{
		UserID:      userID,
		CharacterID: char.ID,
		Level:       1,
		Exp:         0,
		CritRate:    5.0,
		CritDamage:  50.0,
		Accuracy:    0.0,
		Resistance:  0.0,
		Skill1Level: 1,
		Skill2Level: 1,
		Skill3Level: 1,
		Skill4Level: 1,
		Awakened:    false,
	}

	userChar.CalculateStats(char)
	return uc.charRepo.CreateUserCharacter(ctx, userChar)
}

// GetPurchaseHistory gets user's purchase history
func (uc *ShopUseCase) GetPurchaseHistory(ctx context.Context, userID int64, limit int) ([]domain.ShopPurchase, error) {
	if limit <= 0 || limit > 100 {
		limit = 20
	}
	return uc.shopRepo.GetUserPurchases(ctx, userID, limit)
}
