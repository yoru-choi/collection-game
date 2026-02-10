import { User, UserCharacter, InventoryItem, Quest } from '@/types';
import { wsClient } from '@/services/api/WebSocketClient';

export class GameDataStore {
  private static instance: GameDataStore;
  
  private playerData: User | null = null;
  private userCharacters: UserCharacter[] = [];
  private inventory: InventoryItem[] = [];
  private quests: Quest[] = [];

  private constructor() {
    this.loadFromStorage();
  }

  public static getInstance(): GameDataStore {
    if (!GameDataStore.instance) {
      GameDataStore.instance = new GameDataStore();
    }
    return GameDataStore.instance;
  }

  // Player Data
  public getPlayerData(): User | null {
    return this.playerData;
  }

  public setPlayerData(data: User): void {
    this.playerData = data;
    this.saveToStorage();
  }

  public updatePlayerData(updates: Partial<User>): void {
    if (this.playerData) {
      this.playerData = { ...this.playerData, ...updates };
      this.saveToStorage();
    }
  }

  // Characters
  public getUserCharacters(): UserCharacter[] {
    return this.userCharacters;
  }

  public setUserCharacters(characters: UserCharacter[]): void {
    this.userCharacters = characters;
    this.saveToStorage();
  }

  public addUserCharacter(character: UserCharacter): void {
    this.userCharacters.push(character);
    this.saveToStorage();
  }

  public updateUserCharacter(id: string, updates: Partial<UserCharacter>): void {
    const index = this.userCharacters.findIndex(c => c.id === id);
    if (index !== -1) {
      this.userCharacters[index] = { ...this.userCharacters[index], ...updates };
      this.saveToStorage();
    }
  }

  public getUserCharacter(id: string): UserCharacter | null {
    return this.userCharacters.find(c => c.id === id) || null;
  }

  // Inventory
  public getInventory(): InventoryItem[] {
    return this.inventory;
  }

  public setInventory(items: InventoryItem[]): void {
    this.inventory = items;
    this.saveToStorage();
  }

  public addInventoryItem(item: InventoryItem): void {
    const existing = this.inventory.find(i => i.itemId === item.itemId);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      this.inventory.push(item);
    }
    this.saveToStorage();
  }

  public removeInventoryItem(itemId: string, quantity: number = 1): boolean {
    const item = this.inventory.find(i => i.itemId === itemId);
    if (item && item.quantity >= quantity) {
      item.quantity -= quantity;
      if (item.quantity <= 0) {
        this.inventory = this.inventory.filter(i => i.itemId !== itemId);
      }
      this.saveToStorage();
      return true;
    }
    return false;
  }

  // Quests
  public getQuests(): Quest[] {
    return this.quests;
  }

  public setQuests(quests: Quest[]): void {
    this.quests = quests;
    this.saveToStorage();
  }

  public updateQuest(id: string, updates: Partial<Quest>): void {
    const index = this.quests.findIndex(q => q.id === id);
    if (index !== -1) {
      this.quests[index] = { ...this.quests[index], ...updates };
      this.saveToStorage();
    }
  }

  // Currency helpers
  public addCurrency(type: 'crystals' | 'gold', amount: number): void {
    if (this.playerData) {
      this.playerData[type] += amount;
      this.saveToStorage();
    }
  }

  public spendCurrency(type: 'crystals' | 'gold', amount: number): boolean {
    if (this.playerData && this.playerData[type] >= amount) {
      this.playerData[type] -= amount;
      this.saveToStorage();
      return true;
    }
    return false;
  }

  public hasCurrency(type: 'crystals' | 'gold', amount: number): boolean {
    return this.playerData ? this.playerData[type] >= amount : false;
  }

  // Energy
  public updateEnergy(): void {
    if (!this.playerData) return;

    const now = Date.now();
    const lastUpdate = new Date(this.playerData.lastEnergyUpdate).getTime();
    const timePassed = now - lastUpdate;
    const energyRecovered = Math.floor(timePassed / (5 * 60 * 1000)); // 1 energy per 5 minutes

    if (energyRecovered > 0) {
      this.playerData.energy = Math.min(
        this.playerData.maxEnergy,
        this.playerData.energy + energyRecovered
      );
      this.playerData.lastEnergyUpdate = new Date().toISOString();
      this.saveToStorage();
    }
  }

  public spendEnergy(amount: number): boolean {
    if (this.playerData && this.playerData.energy >= amount) {
      this.playerData.energy -= amount;
      this.saveToStorage();
      return true;
    }
    return false;
  }

  // Persistence
  private saveToStorage(): void {
    try {
      localStorage.setItem('gameData', JSON.stringify({
        playerData: this.playerData,
        userCharacters: this.userCharacters,
        inventory: this.inventory,
        quests: this.quests,
      }));
    } catch (error) {
      console.error('Failed to save game data:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const saved = localStorage.getItem('gameData');
      if (saved) {
        const data = JSON.parse(saved);
        this.playerData = data.playerData || null;
        this.userCharacters = data.userCharacters || [];
        this.inventory = data.inventory || [];
        this.quests = data.quests || [];
      }
    } catch (error) {
      console.error('Failed to load game data:', error);
    }
  }

  public clearAll(): void {
    this.playerData = null;
    this.userCharacters = [];
    this.inventory = [];
    this.quests = [];
    localStorage.removeItem('gameData');
  }

  // Mock data for development
  public loadMockData(): void {
    this.playerData = {
      id: 'user-1',
      username: 'TestPlayer',
      email: 'test@example.com',
      level: 10,
      exp: 5000,
      crystals: 1000,
      gold: 50000,
      energy: 80,
      maxEnergy: 100,
      lastEnergyUpdate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Initialize WebSocket connection (optional for development)
    try {
      if (!wsClient.isConnected()) {
        // Don't block on WebSocket connection in development
        setTimeout(() => wsClient.connect(), 1000);
      }
    } catch (error) {
      console.warn('WebSocket initialization skipped:', error);
    }

    this.saveToStorage();
  }
}
