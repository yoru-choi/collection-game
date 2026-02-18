import { dataStore } from '../../store/memoryStore';

export const gameSocialRepository = {
  getArenaRanking: () => dataStore.getArenaRanking(),

  getGuildList: () => dataStore.getGuildList(),
  createGuild: (userId: number, name: string, description?: string) => dataStore.createGuild(userId, name, description),
  getUserGuild: (userId: number) => dataStore.getUserGuild(userId),
  getGuildById: (guildId: number) => dataStore.getGuildById(guildId),
  joinGuild: (userId: number, guildId: number) => dataStore.joinGuild(userId, guildId),
  leaveGuild: (userId: number, guildId: number) => dataStore.leaveGuild(userId, guildId),
  getGuildMembers: (guildId: number) => dataStore.getGuildMembers(guildId),

  getShopItems: () => dataStore.getShopItems(),
  purchaseItem: (userId: number, shopItemId: number, quantity: number) => dataStore.purchaseItem(userId, shopItemId, quantity),

  getDailyQuests: () => dataStore.getDailyQuests(),
  completeQuest: (questId: number) => dataStore.completeQuest(questId),
  claimQuest: (userId: number, questId: number) => dataStore.claimQuest(userId, questId),
};
