import { httpClient } from './api/HttpClient';
import {
  ApiResponse,
  BattleStateResponse,
  BattleUnitState,
  BattleSkillState,
  ActiveEffectDisplay,
  TurnEventDisplay,
  TargetResultDisplay,
  BattleActionInput,
  BattleResultResponse,
} from '@/types';

// Snake_case API types
interface BattleStateApi {
  battle_id: number;
  phase: string;
  current_wave: number;
  total_waves: number;
  allies: BattleUnitApi[];
  enemies: BattleUnitApi[];
  active_unit_id?: string;
  auto_mode: boolean;
  speed_multiplier: number;
  turn_counter: number;
  events?: TurnEventApi[];
}

interface BattleUnitApi {
  unit_id: string;
  team: string;
  char_id: number;
  name: string;
  grade: number;
  element: string;
  class: string;
  image_url: string;
  level: number;
  position: number;
  hp: number;
  max_hp: number;
  atk: number;
  def: number;
  spd: number;
  crit_rate: number;
  crit_damage: number;
  accuracy: number;
  resistance: number;
  atb_gauge: number;
  skills: BattleSkillApi[];
  buffs: ActiveEffectApi[];
  debuffs: ActiveEffectApi[];
  is_alive: boolean;
}

interface BattleSkillApi {
  skill_id: number;
  slot_index: number;
  name: string;
  skill_type: string;
  target_type: string;
  multiplier: number;
  max_cooldown: number;
  current_cd: number;
  effects: string;
}

interface ActiveEffectApi {
  effect_type: string;
  value: number;
  duration: number;
  source_id: string;
}

interface TurnEventApi {
  turn_number: number;
  actor_id: string;
  actor_name: string;
  skill_name: string;
  skill_id: number;
  targets: TargetResultApi[];
  event_type: string;
}

interface TargetResultApi {
  target_id: string;
  target_name: string;
  damage?: number;
  heal?: number;
  is_crit?: boolean;
  is_kill?: boolean;
  hp_after: number;
  applied?: string[];
  resisted?: string[];
}

interface BattleResultApi {
  battle_id: number;
  result: string;
  waves_cleared: number;
  gold: number;
  exp: number;
  crystals: number;
}

export class BattleService {
  async getState(battleId: number): Promise<BattleStateResponse | null> {
    try {
      const response = await httpClient.get<ApiResponse<BattleStateApi>>(
        `/battle/${battleId}/state`
      );
      return response.data ? this.mapState(response.data) : null;
    } catch (error) {
      console.error('Get battle state error:', error);
      return null;
    }
  }

  async submitAction(battleId: number, action: BattleActionInput): Promise<BattleStateResponse | null> {
    try {
      const response = await httpClient.post<ApiResponse<BattleStateApi>>(
        `/battle/${battleId}/action`,
        {
          unit_id: action.unitId,
          skill_index: action.skillIndex,
          target_ids: action.targetIds,
        }
      );
      return response.data ? this.mapState(response.data) : null;
    } catch (error) {
      console.error('Submit action error:', error);
      return null;
    }
  }

  async setAutoMode(battleId: number, auto: boolean): Promise<BattleStateResponse | null> {
    try {
      const response = await httpClient.post<ApiResponse<BattleStateApi>>(
        `/battle/${battleId}/auto`,
        { auto }
      );
      return response.data ? this.mapState(response.data) : null;
    } catch (error) {
      console.error('Set auto mode error:', error);
      return null;
    }
  }

  async setSpeed(battleId: number, speed: number): Promise<BattleStateResponse | null> {
    try {
      const response = await httpClient.post<ApiResponse<BattleStateApi>>(
        `/battle/${battleId}/speed`,
        { speed }
      );
      return response.data ? this.mapState(response.data) : null;
    } catch (error) {
      console.error('Set speed error:', error);
      return null;
    }
  }

  async tick(battleId: number): Promise<BattleStateResponse | null> {
    try {
      const response = await httpClient.post<ApiResponse<BattleStateApi>>(
        `/battle/${battleId}/tick`
      );
      return response.data ? this.mapState(response.data) : null;
    } catch (error) {
      console.error('Battle tick error:', error);
      return null;
    }
  }

  async surrender(battleId: number): Promise<boolean> {
    try {
      await httpClient.post<ApiResponse<void>>(`/battle/${battleId}/surrender`);
      return true;
    } catch (error) {
      console.error('Surrender error:', error);
      return false;
    }
  }

  async getResult(battleId: number): Promise<BattleResultResponse | null> {
    try {
      const response = await httpClient.get<ApiResponse<BattleResultApi>>(
        `/battle/${battleId}/result`
      );
      if (!response.data) return null;
      const d = response.data;
      return {
        battleId: d.battle_id,
        result: d.result as 'victory' | 'defeat',
        wavesCleared: d.waves_cleared,
        gold: d.gold,
        exp: d.exp,
        crystals: d.crystals,
      };
    } catch (error) {
      console.error('Get result error:', error);
      return null;
    }
  }

  private mapState(api: BattleStateApi): BattleStateResponse {
    return {
      battleId: api.battle_id,
      phase: api.phase as BattleStateResponse['phase'],
      currentWave: api.current_wave,
      totalWaves: api.total_waves,
      allies: (api.allies || []).map(u => this.mapUnit(u)),
      enemies: (api.enemies || []).map(u => this.mapUnit(u)),
      activeUnitId: api.active_unit_id,
      autoMode: api.auto_mode,
      speedMultiplier: api.speed_multiplier,
      turnCounter: api.turn_counter,
      events: (api.events || []).map(e => this.mapEvent(e)),
    };
  }

  private mapUnit(api: BattleUnitApi): BattleUnitState {
    return {
      unitId: api.unit_id,
      team: api.team as 'ally' | 'enemy',
      charId: api.char_id,
      name: api.name,
      grade: api.grade,
      element: api.element,
      class: api.class,
      imageUrl: api.image_url,
      level: api.level,
      position: api.position,
      hp: api.hp,
      maxHp: api.max_hp,
      atk: api.atk,
      def: api.def,
      spd: api.spd,
      critRate: api.crit_rate,
      critDamage: api.crit_damage,
      accuracy: api.accuracy,
      resistance: api.resistance,
      atbGauge: api.atb_gauge,
      skills: (api.skills || []).map(s => this.mapSkill(s)),
      buffs: (api.buffs || []).map(e => this.mapEffect(e)),
      debuffs: (api.debuffs || []).map(e => this.mapEffect(e)),
      isAlive: api.is_alive,
    };
  }

  private mapSkill(api: BattleSkillApi): BattleSkillState {
    return {
      skillId: api.skill_id,
      slotIndex: api.slot_index,
      name: api.name,
      skillType: api.skill_type,
      targetType: api.target_type,
      multiplier: api.multiplier,
      maxCooldown: api.max_cooldown,
      currentCd: api.current_cd,
      effects: api.effects,
    };
  }

  private mapEffect(api: ActiveEffectApi): ActiveEffectDisplay {
    return {
      effectType: api.effect_type,
      value: api.value,
      duration: api.duration,
      sourceId: api.source_id,
    };
  }

  private mapEvent(api: TurnEventApi): TurnEventDisplay {
    return {
      turnNumber: api.turn_number,
      actorId: api.actor_id,
      actorName: api.actor_name,
      skillName: api.skill_name,
      skillId: api.skill_id,
      targets: (api.targets || []).map(t => this.mapTargetResult(t)),
      eventType: api.event_type,
    };
  }

  private mapTargetResult(api: TargetResultApi): TargetResultDisplay {
    return {
      targetId: api.target_id,
      targetName: api.target_name,
      damage: api.damage,
      heal: api.heal,
      isCrit: api.is_crit,
      isKill: api.is_kill,
      hpAfter: api.hp_after,
      applied: api.applied,
      resisted: api.resisted,
    };
  }
}

export const battleService = new BattleService();
