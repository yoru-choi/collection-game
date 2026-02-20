import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { authHandler } from '../handlers/authHandler';
import { gameHandler } from '../handlers/gameHandler';

export const createApiRouter = (): Router => {
  const router = Router();

  router.post('/auth/register', authHandler.register);
  router.post('/auth/login', authHandler.login);
  router.post('/auth/refresh', authHandler.refresh);
  router.post('/auth/logout', authHandler.logout);

  router.use(authMiddleware);

  router.get('/user/profile', gameHandler.getProfile);
  router.put('/user/profile', gameHandler.updateProfile);
  router.get('/user/inventory', gameHandler.getInventory);
  router.get('/user/items', gameHandler.getUserItems);

  router.get('/characters', gameHandler.getCharacters);
  router.get('/characters/:id', gameHandler.getCharacter);
  router.post('/characters/:id/level-up', gameHandler.levelUpCharacter);
  router.post('/characters/:id/awaken', gameHandler.awakenCharacter);
  router.post('/characters/:id/skill-up', gameHandler.skillUpCharacter);

  router.get('/party', gameHandler.getParty);
  router.put('/party', gameHandler.setParty);

  router.post('/summon/normal', gameHandler.summonNormal);
  router.post('/summon/premium', gameHandler.summonPremium);
  router.get('/summon/rates', gameHandler.getSummonRates);

  router.get('/dungeons', gameHandler.getDungeons);
  router.get('/dungeons/progress', gameHandler.getDungeonProgress);
  router.get('/dungeons/:id', gameHandler.getDungeon);
  router.post('/dungeons/:id/enter', gameHandler.enterDungeon);
  router.post('/dungeons/:id/complete', gameHandler.completeDungeon);

  router.get('/battle/:id/state', gameHandler.getBattleState);
  router.post('/battle/:id/action', gameHandler.battleAction);
  router.post('/battle/:id/tick', gameHandler.processBattleTick);
  router.post('/battle/:id/auto', gameHandler.setBattleAuto);
  router.post('/battle/:id/speed', gameHandler.setBattleSpeed);
  router.post('/battle/:id/surrender', gameHandler.surrenderBattle);
  router.get('/battle/:id/result', gameHandler.getBattleResult);

  router.get('/arena', gameHandler.getArena);
  router.get('/arena/defense', gameHandler.getArenaDefense);
  router.put('/arena/defense', gameHandler.updateArenaDefense);
  router.post('/arena/defense', gameHandler.updateArenaDefense);
  router.get('/arena/ranking', gameHandler.getArenaRanking);
  router.post('/arena/attack', gameHandler.attackArena);
  router.get('/arena/history', gameHandler.getArenaHistory);

  router.get('/guilds', gameHandler.getGuilds);
  router.post('/guilds', gameHandler.createGuild);
  router.get('/guilds/my', gameHandler.getMyGuild);
  router.get('/guilds/:id', gameHandler.getGuild);
  router.put('/guilds/:id', gameHandler.updateGuild);
  router.post('/guilds/:id/join', gameHandler.joinGuild);
  router.post('/guilds/:id/leave', gameHandler.leaveGuild);
  router.get('/guilds/:id/members', gameHandler.getGuildMembers);

  router.get('/shop/items', gameHandler.getShopItems);
  router.post('/shop/purchase', gameHandler.purchaseShopItem);
  router.get('/shop/history', gameHandler.getShopHistory);

  router.get('/quests/daily', gameHandler.getDailyQuests);
  router.get('/quests/weekly', gameHandler.getWeeklyQuests);
  router.get('/quests/achievements', gameHandler.getAchievements);
  router.post('/quests/:id/complete', gameHandler.completeQuest);
  router.post('/quests/:id/claim', gameHandler.claimQuest);

  router.get('/login/daily', gameHandler.getDailyLogin);
  router.post('/login/daily/claim', gameHandler.claimDailyLogin);

  return router;
};
