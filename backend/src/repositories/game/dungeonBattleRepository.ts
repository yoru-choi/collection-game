import { dataStore } from '../../store/memoryStore';
import { BattleState } from '../../types';

export const gameDungeonBattleRepository = {
  getDungeons: (chapter?: number) => dataStore.getDungeons(chapter),
  getDungeonById: (dungeonId: number) => dataStore.getDungeonById(dungeonId),
  consumeEnergy: (userId: number, amount: number) => dataStore.consumeEnergy(userId, amount),
  createBattleFromDungeon: (userId: number, dungeonId: number) => dataStore.createBattleFromDungeon(userId, dungeonId),

  getBattleById: (battleId: number) => dataStore.getBattleById(battleId),
  updateBattle: (battle: BattleState) => dataStore.updateBattle(battle),
  getBattleResult: (battleId: number) => dataStore.getBattleResult(battleId),

  // ATB battle methods
  processBattleTick: (battleId: number) => dataStore.processBattleTick(battleId),
  battleAction: (battleId: number, unitId?: string, skillIndex?: number, targetIds?: string[]) =>
    dataStore.battleAction(battleId, unitId, skillIndex, targetIds),

  // Dungeon progress
  getDungeonProgress: (userId: number) => dataStore.getDungeonProgress(userId),
  markDungeonCleared: (userId: number, dungeonId: number) => dataStore.markDungeonCleared(userId, dungeonId),
  isDungeonUnlocked: (userId: number, dungeonId: number) => dataStore.isDungeonUnlocked(userId, dungeonId),
};
