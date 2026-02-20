import { gameRepository } from '../../repositories/gameRepository';
import { ServiceResult, serviceFail, serviceOk } from '../result';

export const gameDungeonBattleService = {
  getDungeons(chapter?: number): ServiceResult<unknown[]> {
    return serviceOk(gameRepository.getDungeons(chapter));
  },

  getDungeonById(dungeonId: number): ServiceResult<unknown> {
    const dungeon = gameRepository.getDungeonById(dungeonId);
    if (!dungeon) {
      return serviceFail('dungeon not found', 404);
    }

    return serviceOk(dungeon);
  },

  getDungeonProgress(userId: number): ServiceResult<unknown> {
    return serviceOk(gameRepository.getDungeonProgress(userId));
  },

  enterDungeon(userId: number, dungeonId: number): ServiceResult<unknown> {
    const dungeon = gameRepository.getDungeonById(dungeonId);
    if (!dungeon) {
      return serviceFail('dungeon not found', 404);
    }

    if (!gameRepository.isDungeonUnlocked(userId, dungeonId)) {
      return serviceFail('dungeon is locked', 403);
    }

    if (!gameRepository.consumeEnergy(userId, dungeon.energy_cost)) {
      return serviceFail('not enough energy', 400);
    }

    const battle = gameRepository.createBattleFromDungeon(userId, dungeonId);
    if (!battle) {
      return serviceFail('failed to create battle', 500);
    }

    return serviceOk(battle);
  },

  completeDungeon(userId: number, dungeonId: number): ServiceResult<unknown> {
    const dungeon = gameRepository.getDungeonById(dungeonId);
    if (!dungeon) {
      return serviceFail('dungeon not found', 404);
    }

    const user = gameRepository.getUserById(userId);
    if (!user) {
      return serviceFail('user not found', 404);
    }

    // Rewards are already granted by the battle system on victory
    // This endpoint returns the reward summary
    return serviceOk({
      rewards: dungeon.rewards,
      gold: dungeon.gold_reward,
      exp: dungeon.exp_reward,
      crystals: dungeon.crystal_reward || 0,
      character_shards: dungeon.character_shard_reward || 0,
    });
  },

  getBattleState(battleId: number): ServiceResult<unknown> {
    const battle = gameRepository.getBattleById(battleId);
    if (!battle) {
      return serviceFail('battle not found', 404);
    }

    return serviceOk(battle);
  },

  battleAction(battleId: number, unitId?: string, skillIndex?: number, targetIds?: string[]): ServiceResult<unknown> {
    const result = gameRepository.battleAction(battleId, unitId, skillIndex, targetIds);
    if (!result) {
      return serviceFail('battle not found', 404);
    }

    return serviceOk(result);
  },

  processBattleTick(battleId: number): ServiceResult<unknown> {
    const result = gameRepository.processBattleTick(battleId);
    if (!result) {
      return serviceFail('battle not found', 404);
    }

    return serviceOk(result);
  },

  setBattleAuto(battleId: number, auto: boolean): ServiceResult<unknown> {
    const battle = gameRepository.getBattleById(battleId);
    if (!battle) {
      return serviceFail('battle not found', 404);
    }

    battle.auto_mode = auto;
    gameRepository.updateBattle(battle);
    return serviceOk(battle);
  },

  setBattleSpeed(battleId: number, speed: number): ServiceResult<unknown> {
    const battle = gameRepository.getBattleById(battleId);
    if (!battle) {
      return serviceFail('battle not found', 404);
    }

    battle.speed_multiplier = [1, 2].includes(speed) ? speed : 1;
    gameRepository.updateBattle(battle);
    return serviceOk(battle);
  },

  surrenderBattle(battleId: number): ServiceResult<unknown> {
    const battle = gameRepository.getBattleById(battleId);
    if (!battle) {
      return serviceFail('battle not found', 404);
    }

    battle.phase = 'battle_end';
    battle.result = {
      battle_id: battle.battle_id,
      result: 'defeat',
      waves_cleared: Math.max(0, battle.current_wave - 1),
      gold: 0,
      exp: 0,
      crystals: 0,
      character_shards: 0,
    };

    gameRepository.updateBattle(battle);
    return serviceOk({ surrendered: true });
  },

  getBattleResult(battleId: number): ServiceResult<unknown> {
    const result = gameRepository.getBattleResult(battleId);
    if (!result) {
      return serviceFail('battle result not ready', 404);
    }

    return serviceOk(result);
  },
};
