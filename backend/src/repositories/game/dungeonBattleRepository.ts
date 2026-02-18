import { dataStore } from '../../store/memoryStore';

export const gameDungeonBattleRepository = {
  getDungeons: (chapter?: number) => dataStore.getDungeons(chapter),
  getDungeonById: (dungeonId: number) => dataStore.getDungeonById(dungeonId),
  consumeEnergy: (userId: number, amount: number) => dataStore.consumeEnergy(userId, amount),
  createBattleFromDungeon: (userId: number, dungeonId: number) => dataStore.createBattleFromDungeon(userId, dungeonId),

  getBattleById: (battleId: number) => dataStore.getBattleById(battleId),
  updateBattle: (battle: NonNullable<ReturnType<typeof dataStore.getBattleById>>) => dataStore.updateBattle(battle),
  getBattleResult: (battleId: number) => dataStore.getBattleResult(battleId),
};
