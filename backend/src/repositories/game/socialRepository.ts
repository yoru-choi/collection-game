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

  getShopItems: (userId?: number) => dataStore.getShopItems(userId),
  purchaseItem: (userId: number, shopItemId: number, quantity: number) => dataStore.purchaseItem(userId, shopItemId, quantity),
  getShopHistory: (userId: number) => dataStore.getShopHistory(userId),

  getDailyQuests: (userId: number) => dataStore.getDailyQuests(userId),
  getWeeklyQuests: (userId: number) => dataStore.getWeeklyQuests(userId),
  getAchievements: (userId: number) => dataStore.getAchievements(userId),
  completeQuest: (questId: number) => dataStore.completeQuest(questId),
  claimQuest: (userId: number, questId: number) => dataStore.claimQuest(userId, questId),

  getDailyLoginStatus: (userId: number) => dataStore.getDailyLoginStatus(userId),
  claimDailyLogin: (userId: number) => dataStore.claimDailyLogin(userId),

  getUserItems: (userId: number) => dataStore.getUserItems(userId),
  getArenaDefenseTeam: (userId: number) => dataStore.getArenaDefenseTeam(userId),
  setArenaDefenseTeam: (userId: number, characterIds: number[]) => dataStore.setArenaDefenseTeam(userId, characterIds),
};
