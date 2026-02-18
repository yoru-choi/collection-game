import { gameRepository } from '../../repositories/gameRepository';
import { ServiceResult, serviceFail, serviceOk } from '../result';
import { paginate } from './pagination';

export const gameSocialService = {
  getArena(userId: number): ServiceResult<Record<string, unknown> | null> {
    const ranking = gameRepository.getArenaRanking();
    const current = ranking.find((entry) => Number(entry.userId) === userId);
    return serviceOk(current || null);
  },

  getArenaRanking(page: number, limit: number): ServiceResult<unknown> {
    return serviceOk(paginate(gameRepository.getArenaRanking(), page, limit));
  },

  attackArena(userId: number, targetUserId: string): ServiceResult<unknown> {
    return serviceOk({
      id: String(Date.now()),
      attacker: { userId: String(userId), username: 'You', rank: 100, rating: 1200, winCount: 1, loseCount: 0, defenseTeam: [] },
      defender: { userId: targetUserId, username: `Player-${targetUserId}`, rank: 101, rating: 1190, winCount: 1, loseCount: 1, defenseTeam: [] },
      result: 'win',
    });
  },

  getArenaHistory(page: number, limit: number): ServiceResult<unknown> {
    return serviceOk(paginate([], page, limit));
  },

  getGuilds(page: number, limit: number): ServiceResult<unknown> {
    return serviceOk(paginate(gameRepository.getGuildList(), page, limit));
  },

  createGuild(userId: number, name?: string, description?: string): ServiceResult<unknown> {
    if (!name) {
      return serviceFail('name is required', 400);
    }

    return serviceOk(gameRepository.createGuild(userId, name, description), 201);
  },

  getMyGuild(userId: number): ServiceResult<unknown> {
    return serviceOk(gameRepository.getUserGuild(userId));
  },

  getGuildById(guildId: number): ServiceResult<unknown> {
    const guild = gameRepository.getGuildById(guildId);
    if (!guild) {
      return serviceFail('guild not found', 404);
    }

    return serviceOk(guild);
  },

  updateGuild(guildId: number, payload: Record<string, unknown>): ServiceResult<unknown> {
    const guild = gameRepository.getGuildById(guildId);
    if (!guild) {
      return serviceFail('guild not found', 404);
    }

    return serviceOk({ ...guild, ...payload });
  },

  joinGuild(userId: number, guildId: number): ServiceResult<unknown> {
    if (!gameRepository.joinGuild(userId, guildId)) {
      return serviceFail('guild not found', 404);
    }

    return serviceOk({ joined: true });
  },

  leaveGuild(userId: number, guildId: number): ServiceResult<unknown> {
    if (!gameRepository.leaveGuild(userId, guildId)) {
      return serviceFail('not in guild', 400);
    }

    return serviceOk({ left: true });
  },

  getGuildMembers(guildId: number): ServiceResult<unknown[]> {
    return serviceOk(gameRepository.getGuildMembers(guildId));
  },

  getShopItems(): ServiceResult<unknown[]> {
    return serviceOk(gameRepository.getShopItems());
  },

  purchaseShopItem(userId: number, shopItemId: number, quantity: number): ServiceResult<unknown> {
    if (!gameRepository.purchaseItem(userId, shopItemId, quantity)) {
      return serviceFail('purchase failed', 400);
    }

    return serviceOk({ purchased: true });
  },

  getShopHistory(page: number, limit: number): ServiceResult<unknown> {
    return serviceOk(paginate([], page, limit));
  },

  getDailyQuests(): ServiceResult<unknown[]> {
    return serviceOk(gameRepository.getDailyQuests());
  },

  completeQuest(questId: number): ServiceResult<unknown> {
    if (!gameRepository.completeQuest(questId)) {
      return serviceFail('quest not found', 404);
    }

    return serviceOk({ completed: true });
  },

  claimQuest(userId: number, questId: number): ServiceResult<unknown> {
    const result = gameRepository.claimQuest(userId, questId);
    if (!result) {
      return serviceFail('quest claim failed', 400);
    }

    return serviceOk(result);
  },
};
