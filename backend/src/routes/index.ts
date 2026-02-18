import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { env, isProduction } from '../config/env';
import { ok, fail } from '../utils/response';
import { hashPassword, comparePassword } from '../utils/password';
import { dataStore } from '../store/memoryStore';
import {
  blacklistAccessToken,
  createAccessToken,
  createRefreshToken,
  persistRefreshToken,
  revokeRefreshToken,
  verifyRefreshToken,
} from '../services/tokenService';

const getPagination = (req: Request): { page: number; limit: number } => {
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.max(1, Number(req.query.limit || 20));
  return { page, limit };
};

const paginate = <T>(items: T[], page: number, limit: number): { items: T[]; total: number; page: number; limit: number; totalPages: number } => {
  const total = items.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  return {
    items: items.slice(start, start + limit),
    total,
    page,
    limit,
    totalPages,
  };
};

const setRefreshCookie = (res: Response, refreshToken: string): void => {
  res.cookie(env.refreshCookieName, refreshToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
    path: '/api/v1/auth/refresh',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

const clearRefreshCookie = (res: Response): void => {
  res.clearCookie(env.refreshCookieName, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
    path: '/api/v1/auth/refresh',
  });
};

const getRefreshTokenFromRequest = (req: Request): string | null => {
  const bodyToken = typeof req.body?.refresh_token === 'string' ? req.body.refresh_token : null;
  const cookieToken = typeof req.cookies?.[env.refreshCookieName] === 'string'
    ? req.cookies[env.refreshCookieName]
    : null;

  return bodyToken || cookieToken;
};

export const createApiRouter = (): Router => {
  const router = Router();

  router.post('/auth/register', async (req, res) => {
    const { username, email, password } = req.body as { username?: string; email?: string; password?: string };

    if (!username || !email || !password) {
      fail(res, 'username, email, password are required', 400);
      return;
    }

    if (dataStore.getUserByUsername(username) || dataStore.getUserByEmail(email)) {
      fail(res, 'username or email already exists', 409);
      return;
    }

    const passwordHash = await hashPassword(password);
    const user = dataStore.createUser(username, email, passwordHash);

    const authToken = createAccessToken(user.id);
    const refreshToken = createRefreshToken(user.id);
    await persistRefreshToken(refreshToken);

    setRefreshCookie(res, refreshToken);

    ok(res, {
      authToken,
      user: dataStore.toUserResponse(user),
    }, 201);
  });

  router.post('/auth/login', async (req, res) => {
    const { username, password } = req.body as { username?: string; password?: string };

    if (!username || !password) {
      fail(res, 'username and password are required', 400);
      return;
    }

    const user = dataStore.getUserByUsername(username);
    if (!user) {
      fail(res, 'invalid credentials', 401);
      return;
    }

    const matched = await comparePassword(password, user.passwordHash);
    if (!matched) {
      fail(res, 'invalid credentials', 401);
      return;
    }

    const authToken = createAccessToken(user.id);
    const refreshToken = createRefreshToken(user.id);
    await persistRefreshToken(refreshToken);
    setRefreshCookie(res, refreshToken);

    ok(res, {
      authToken,
      user: dataStore.toUserResponse(user),
    });
  });

  router.post('/auth/refresh', async (req, res) => {
    const token = getRefreshTokenFromRequest(req);
    if (!token) {
      fail(res, 'refresh token not found', 401);
      return;
    }

    const userId = await verifyRefreshToken(token);
    if (!userId) {
      clearRefreshCookie(res);
      fail(res, 'invalid refresh token', 401);
      return;
    }

    await revokeRefreshToken(token);

    const authToken = createAccessToken(userId);
    const refreshToken = createRefreshToken(userId);
    await persistRefreshToken(refreshToken);
    setRefreshCookie(res, refreshToken);

    ok(res, { authToken });
  });

  router.post('/auth/logout', async (req, res) => {
    const token = getRefreshTokenFromRequest(req);
    if (token) {
      await revokeRefreshToken(token);
    }

    const authorization = req.header('Authorization') || '';
    if (authorization.startsWith('Bearer ')) {
      await blacklistAccessToken(authorization.replace('Bearer ', '').trim());
    }

    clearRefreshCookie(res);
    ok(res, { message: 'logged out successfully' });
  });

  router.use(authMiddleware);

  router.get('/user/profile', (req, res) => {
    const user = dataStore.getUserById(req.userId!);
    if (!user) {
      fail(res, 'user not found', 404);
      return;
    }

    ok(res, dataStore.toUserResponse(user));
  });

  router.put('/user/profile', (req, res) => {
    const { username, email } = req.body as { username?: string; email?: string };
    const updated = dataStore.updateProfile(req.userId!, { username, email });
    if (!updated) {
      fail(res, 'user not found', 404);
      return;
    }

    ok(res, dataStore.toUserResponse(updated));
  });

  router.get('/user/inventory', (req, res) => {
    const user = dataStore.getUserById(req.userId!);
    if (!user) {
      fail(res, 'user not found', 404);
      return;
    }

    ok(res, {
      crystals: user.crystals,
      gold: user.gold,
      energy: user.energy,
      maxEnergy: user.maxEnergy,
      max_energy: user.maxEnergy,
      level: user.level,
      exp: user.exp,
    });
  });

  router.get('/characters', (req, res) => {
    const list = dataStore.getUserCharacters(req.userId!).map((entry) => {
      const detail = dataStore.getUserCharacterDetail(req.userId!, entry.id);
      return detail;
    }).filter(Boolean);

    const { page, limit } = getPagination(req);
    if (req.query.page || req.query.limit) {
      ok(res, paginate(list, page, limit));
      return;
    }

    ok(res, list);
  });

  router.get('/characters/:id', (req, res) => {
    const id = Number(req.params.id);
    const detail = dataStore.getUserCharacterDetail(req.userId!, id);
    if (!detail) {
      fail(res, 'character not found', 404);
      return;
    }

    ok(res, detail);
  });

  router.post('/characters/:id/level-up', (req, res) => {
    const id = Number(req.params.id);
    const expCrystals = Number(req.body?.exp_crystals || 1);
    const updated = dataStore.levelUpCharacter(req.userId!, id, expCrystals);
    if (!updated) {
      fail(res, 'character not found', 404);
      return;
    }

    ok(res, updated);
  });

  router.post('/characters/:id/awaken', (req, res) => {
    const id = Number(req.params.id);
    const updated = dataStore.awakenCharacter(req.userId!, id);
    if (!updated) {
      fail(res, 'character not found', 404);
      return;
    }

    ok(res, updated);
  });

  router.post('/characters/:id/skill-up', (req, res) => {
    const id = Number(req.params.id);
    const skillSlot = Number(req.body?.skillSlot || 1);
    const updated = dataStore.skillUpCharacter(req.userId!, id, skillSlot);
    if (!updated) {
      fail(res, 'character not found', 404);
      return;
    }

    ok(res, updated);
  });

  router.get('/party', (req, res) => {
    ok(res, { character_ids: dataStore.getParty(req.userId!) });
  });

  router.put('/party', (req, res) => {
    const ids = Array.isArray(req.body?.character_ids) ? req.body.character_ids.map((value: unknown) => Number(value)).filter((value: number) => Number.isFinite(value)) : [];

    if (ids.length < 1 || ids.length > 4) {
      fail(res, 'party must include 1~4 characters', 400);
      return;
    }

    const party = dataStore.setParty(req.userId!, ids);
    ok(res, { character_ids: party });
  });

  router.post('/summon/normal', (req, res) => {
    const count = Number(req.body?.count || 1);
    if (![1, 10].includes(count)) {
      fail(res, 'count must be 1 or 10', 400);
      return;
    }

    const results = dataStore.summon(req.userId!, 'normal', count);
    const user = dataStore.getUserById(req.userId!);

    ok(res, {
      results,
      remaining_crystals: user?.crystals || 0,
    });
  });

  router.post('/summon/premium', (req, res) => {
    const count = Number(req.body?.count || 1);
    if (![1, 10].includes(count)) {
      fail(res, 'count must be 1 or 10', 400);
      return;
    }

    const results = dataStore.summon(req.userId!, 'premium', count);
    const user = dataStore.getUserById(req.userId!);

    ok(res, {
      results,
      remaining_crystals: user?.crystals || 0,
    });
  });

  router.get('/summon/rates', (_req, res) => {
    ok(res, {
      normal: { grade1: 0.65, grade2: 0.25, grade3: 0.08, grade4: 0.02 },
      premium: { grade2: 0.40, grade3: 0.40, grade4: 0.18, grade5: 0.02 },
    });
  });

  router.get('/dungeons', (req, res) => {
    const chapter = req.query.chapter ? Number(req.query.chapter) : undefined;
    ok(res, dataStore.getDungeons(chapter));
  });

  router.get('/dungeons/progress', (_req, res) => {
    ok(res, {
      chapter: 1,
      stage: 1,
      cleared: [101],
    });
  });

  router.get('/dungeons/:id', (req, res) => {
    const dungeon = dataStore.getDungeonById(Number(req.params.id));
    if (!dungeon) {
      fail(res, 'dungeon not found', 404);
      return;
    }

    ok(res, dungeon);
  });

  router.post('/dungeons/:id/enter', (req, res) => {
    const dungeonId = Number(req.params.id);
    const dungeon = dataStore.getDungeonById(dungeonId);
    if (!dungeon) {
      fail(res, 'dungeon not found', 404);
      return;
    }

    if (!dataStore.consumeEnergy(req.userId!, dungeon.energy_cost)) {
      fail(res, 'not enough energy', 400);
      return;
    }

    const battle = dataStore.createBattleFromDungeon(req.userId!, dungeonId);
    if (!battle) {
      fail(res, 'failed to create battle', 500);
      return;
    }

    ok(res, battle);
  });

  router.post('/dungeons/:id/complete', (req, res) => {
    const dungeon = dataStore.getDungeonById(Number(req.params.id));
    if (!dungeon) {
      fail(res, 'dungeon not found', 404);
      return;
    }

    const user = dataStore.getUserById(req.userId!);
    if (!user) {
      fail(res, 'user not found', 404);
      return;
    }

    user.gold += dungeon.gold_reward;
    user.exp += dungeon.exp_reward;

    ok(res, {
      rewards: dungeon.rewards,
      gold: dungeon.gold_reward,
      exp: dungeon.exp_reward,
    });
  });

  router.get('/battle/:id/state', (req, res) => {
    const battle = dataStore.getBattleById(Number(req.params.id));
    if (!battle) {
      fail(res, 'battle not found', 404);
      return;
    }

    ok(res, battle);
  });

  router.post('/battle/:id/action', (req, res) => {
    const battle = dataStore.getBattleById(Number(req.params.id));
    if (!battle) {
      fail(res, 'battle not found', 404);
      return;
    }

    const aliveEnemy = battle.enemies.find((enemy) => enemy.is_alive);
    const actor = battle.allies.find((ally) => ally.unit_id === req.body?.unit_id) || battle.allies[0];

    if (aliveEnemy && actor) {
      const damage = Math.max(1, actor.atk - Math.floor(aliveEnemy.def * 0.35));
      aliveEnemy.hp = Math.max(0, aliveEnemy.hp - damage);
      aliveEnemy.is_alive = aliveEnemy.hp > 0;

      battle.turn_counter += 1;
      battle.events.unshift({
        turn_number: battle.turn_counter,
        actor_id: actor.unit_id,
        actor_name: actor.name,
        skill_name: 'Basic Attack',
        skill_id: actor.skills[0]?.skill_id || 0,
        event_type: 'action',
        targets: [{
          target_id: aliveEnemy.unit_id,
          target_name: aliveEnemy.name,
          damage,
          is_crit: false,
          is_kill: !aliveEnemy.is_alive,
          hp_after: aliveEnemy.hp,
        }],
      });

      if (!battle.enemies.some((enemy) => enemy.is_alive)) {
        battle.phase = 'battle_end';
        battle.result = {
          battle_id: battle.battle_id,
          result: 'victory',
          waves_cleared: battle.total_waves,
          gold: 1500,
          exp: 120,
          crystals: 10,
        };
      }
    }

    dataStore.updateBattle(battle);
    ok(res, battle);
  });

  router.post('/battle/:id/auto', (req, res) => {
    const battle = dataStore.getBattleById(Number(req.params.id));
    if (!battle) {
      fail(res, 'battle not found', 404);
      return;
    }

    battle.auto_mode = Boolean(req.body?.auto);
    dataStore.updateBattle(battle);
    ok(res, battle);
  });

  router.post('/battle/:id/speed', (req, res) => {
    const battle = dataStore.getBattleById(Number(req.params.id));
    if (!battle) {
      fail(res, 'battle not found', 404);
      return;
    }

    const speed = Number(req.body?.speed || 1);
    battle.speed_multiplier = [1, 2, 3].includes(speed) ? speed : 1;
    dataStore.updateBattle(battle);
    ok(res, battle);
  });

  router.post('/battle/:id/surrender', (req, res) => {
    const battle = dataStore.getBattleById(Number(req.params.id));
    if (!battle) {
      fail(res, 'battle not found', 404);
      return;
    }

    battle.phase = 'battle_end';
    battle.result = {
      battle_id: battle.battle_id,
      result: 'defeat',
      waves_cleared: Math.max(0, battle.current_wave - 1),
      gold: 0,
      exp: 0,
      crystals: 0,
    };

    dataStore.updateBattle(battle);
    ok(res, { surrendered: true });
  });

  router.get('/battle/:id/result', (req, res) => {
    const result = dataStore.getBattleResult(Number(req.params.id));
    if (!result) {
      fail(res, 'battle result not ready', 404);
      return;
    }

    ok(res, result);
  });

  router.get('/arena', (req, res) => {
    const ranking = dataStore.getArenaRanking();
    const current = ranking.find((entry) => Number(entry.userId) === req.userId);
    ok(res, current || null);
  });

  router.put('/arena/defense', (_req, res) => {
    ok(res, { updated: true });
  });

  router.post('/arena/defense', (_req, res) => {
    ok(res, { updated: true });
  });

  router.get('/arena/ranking', (req, res) => {
    const ranking = dataStore.getArenaRanking();
    const { page, limit } = getPagination(req);
    ok(res, paginate(ranking, page, limit));
  });

  router.post('/arena/attack', (req, res) => {
    const targetUserId = String(req.body?.targetUserId || '0');
    ok(res, {
      id: String(Date.now()),
      attacker: { userId: String(req.userId), username: 'You', rank: 100, rating: 1200, winCount: 1, loseCount: 0, defenseTeam: [] },
      defender: { userId: targetUserId, username: `Player-${targetUserId}`, rank: 101, rating: 1190, winCount: 1, loseCount: 1, defenseTeam: [] },
      result: 'win',
    });
  });

  router.get('/arena/history', (req, res) => {
    const { page, limit } = getPagination(req);
    ok(res, paginate([], page, limit));
  });

  router.get('/guilds', (req, res) => {
    const list = dataStore.getGuildList();
    const { page, limit } = getPagination(req);
    ok(res, paginate(list, page, limit));
  });

  router.post('/guilds', (req, res) => {
    const { name, description } = req.body as { name?: string; description?: string };
    if (!name) {
      fail(res, 'name is required', 400);
      return;
    }

    ok(res, dataStore.createGuild(req.userId!, name, description), 201);
  });

  router.get('/guilds/my', (req, res) => {
    ok(res, dataStore.getUserGuild(req.userId!));
  });

  router.get('/guilds/:id', (req, res) => {
    const guild = dataStore.getGuildById(Number(req.params.id));
    if (!guild) {
      fail(res, 'guild not found', 404);
      return;
    }

    ok(res, guild);
  });

  router.put('/guilds/:id', (req, res) => {
    const guild = dataStore.getGuildById(Number(req.params.id));
    if (!guild) {
      fail(res, 'guild not found', 404);
      return;
    }

    ok(res, { ...guild, ...req.body });
  });

  router.post('/guilds/:id/join', (req, res) => {
    if (!dataStore.joinGuild(req.userId!, Number(req.params.id))) {
      fail(res, 'guild not found', 404);
      return;
    }

    ok(res, { joined: true });
  });

  router.post('/guilds/:id/leave', (req, res) => {
    if (!dataStore.leaveGuild(req.userId!, Number(req.params.id))) {
      fail(res, 'not in guild', 400);
      return;
    }

    ok(res, { left: true });
  });

  router.get('/guilds/:id/members', (req, res) => {
    ok(res, dataStore.getGuildMembers(Number(req.params.id)));
  });

  router.get('/shop/items', (_req, res) => {
    ok(res, dataStore.getShopItems());
  });

  router.post('/shop/purchase', (req, res) => {
    const shopItemId = Number(req.body?.shop_item_id);
    const quantity = Number(req.body?.quantity || 1);

    if (!dataStore.purchaseItem(req.userId!, shopItemId, quantity)) {
      fail(res, 'purchase failed', 400);
      return;
    }

    ok(res, { purchased: true });
  });

  router.get('/shop/history', (req, res) => {
    const { page, limit } = getPagination(req);
    ok(res, paginate([], page, limit));
  });

  router.get('/quests/daily', (_req, res) => {
    ok(res, dataStore.getDailyQuests());
  });

  router.get('/quests/weekly', (_req, res) => {
    ok(res, []);
  });

  router.get('/quests/achievements', (_req, res) => {
    ok(res, []);
  });

  router.post('/quests/:id/complete', (req, res) => {
    if (!dataStore.completeQuest(Number(req.params.id))) {
      fail(res, 'quest not found', 404);
      return;
    }

    ok(res, { completed: true });
  });

  router.post('/quests/:id/claim', (req, res) => {
    const result = dataStore.claimQuest(req.userId!, Number(req.params.id));
    if (!result) {
      fail(res, 'quest claim failed', 400);
      return;
    }

    ok(res, result);
  });

  router.get('/login/daily', (_req, res) => {
    ok(res, {
      claimed: true,
      rewards: [{ type: 'currency', name: 'gold', quantity: 1000 }],
    });
  });

  return router;
};
