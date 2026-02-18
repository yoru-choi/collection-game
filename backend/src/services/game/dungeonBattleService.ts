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

  enterDungeon(userId: number, dungeonId: number): ServiceResult<unknown> {
    const dungeon = gameRepository.getDungeonById(dungeonId);
    if (!dungeon) {
      return serviceFail('dungeon not found', 404);
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

    user.gold += dungeon.gold_reward;
    user.exp += dungeon.exp_reward;

    return serviceOk({
      rewards: dungeon.rewards,
      gold: dungeon.gold_reward,
      exp: dungeon.exp_reward,
    });
  },

  getBattleState(battleId: number): ServiceResult<unknown> {
    const battle = gameRepository.getBattleById(battleId);
    if (!battle) {
      return serviceFail('battle not found', 404);
    }

    return serviceOk(battle);
  },

  battleAction(battleId: number, unitId?: string): ServiceResult<unknown> {
    const battle = gameRepository.getBattleById(battleId);
    if (!battle) {
      return serviceFail('battle not found', 404);
    }

    const aliveEnemy = battle.enemies.find((enemy) => enemy.is_alive);
    const actor = battle.allies.find((ally) => ally.unit_id === unitId) || battle.allies[0];

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

    gameRepository.updateBattle(battle);
    return serviceOk(battle);
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

    battle.speed_multiplier = [1, 2, 3].includes(speed) ? speed : 1;
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
