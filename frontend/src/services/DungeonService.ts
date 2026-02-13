import { httpClient } from './api/HttpClient';
import { ApiResponse, BattleStart, BattleTeamMember, Dungeon, Reward } from '@/types';

type DungeonApi = {
  id: number;
  name: string;
  dungeon_type: string;
  difficulty: string;
  chapter: number;
  stage: number;
  energy_cost: number;
  stages: any;
  rewards: any;
  exp_reward: number;
  gold_reward: number;
};

// New ATB battle state response from server
type BattleStateApi = {
  battle_id: number;
  phase: string;
  current_wave: number;
  total_waves: number;
  allies: any[];
  enemies: any[];
  active_unit_id?: string;
  auto_mode: boolean;
  speed_multiplier: number;
  turn_counter: number;
  events?: any[];
};

type BattleTeamMemberApi = {
  user_character_id?: number;
  character_id: number;
  name: string;
  grade: number;
  element: string;
  class: string;
  image_url: string;
  level: number;
  position: number;
  current_hp: number;
  max_hp: number;
  atk: number;
  def: number;
  spd: number;
};

type BattleStartApi = {
  id: number;
  status: string;
  player_team: BattleTeamMemberApi[];
  enemy_team: BattleTeamMemberApi[];
};

export interface EnterDungeonResult {
  battleId: number;
  dungeon: Dungeon;
}

export class DungeonService {
  async getDungeons(chapter?: number): Promise<Dungeon[]> {
    try {
      const url = chapter ? `/dungeons?chapter=${chapter}` : '/dungeons';
      const response = await httpClient.get<ApiResponse<DungeonApi[]>>(url);
      const items = response.data || [];
      return items.map((item) => this.mapDungeon(item));
    } catch (error) {
      console.error('Get dungeons error:', error);
      return [];
    }
  }

  async enterDungeon(dungeonId: string): Promise<{ battleId: number } | null> {
    try {
      // The new API returns BattleStateResponse with battle_id
      const response = await httpClient.post<ApiResponse<BattleStateApi>>(
        `/dungeons/${dungeonId}/enter`
      );
      if (response.data && response.data.battle_id) {
        return { battleId: response.data.battle_id };
      }
      // Fallback: try old format
      const oldResponse = response as any;
      if (oldResponse.data?.id) {
        return { battleId: oldResponse.data.id };
      }
      return null;
    } catch (error) {
      console.error('Enter dungeon error:', error);
      throw error;
    }
  }

  async completeDungeon(
    dungeonId: string,
    stars: number,
    timeTaken: number
  ): Promise<boolean> {
    try {
      const response = await httpClient.post<ApiResponse<void>>(
        `/dungeons/${dungeonId}/complete`,
        { stars, time_taken: timeTaken }
      );
      return response.success;
    } catch (error) {
      console.error('Complete dungeon error:', error);
      throw error;
    }
  }

  private mapDungeon(item: DungeonApi): Dungeon {
    const rewards = this.parseRewards(item.rewards);
    if (item.gold_reward > 0) {
      rewards.push({ type: 'currency', name: 'gold', quantity: item.gold_reward });
    }
    if (item.exp_reward > 0) {
      rewards.push({ type: 'currency', name: 'exp', quantity: item.exp_reward });
    }

    return {
      id: String(item.id),
      name: item.name,
      type: item.dungeon_type,
      difficulty: item.difficulty,
      chapter: item.chapter,
      stage: item.stage,
      energyCost: item.energy_cost,
      recommendedPower: 0,
      stages: Array.isArray(item.stages) ? item.stages : [],
      rewards,
      expReward: item.exp_reward,
      goldReward: item.gold_reward,
    };
  }

  private parseRewards(raw: any): Reward[] {
    if (!raw) return [];
    try {
      const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (!Array.isArray(data)) return [];
      return data.map((entry: any) => ({
        type: entry.type || 'item',
        name: entry.name,
        id: entry.id,
        quantity: entry.amount ?? entry.quantity ?? 1,
      }));
    } catch {
      return [];
    }
  }

  private mapBattleStart(item: BattleStartApi): BattleStart {
    return {
      id: String(item.id),
      status: item.status as BattleStart['status'],
      playerTeam: (item.player_team || []).map((member) => this.mapTeamMember(member)),
      enemyTeam: (item.enemy_team || []).map((member) => this.mapTeamMember(member)),
    };
  }

  private mapTeamMember(member: BattleTeamMemberApi): BattleTeamMember {
    return {
      id: String(member.user_character_id ?? member.character_id),
      userCharacterId: member.user_character_id ? String(member.user_character_id) : undefined,
      characterId: String(member.character_id),
      name: member.name,
      grade: member.grade as BattleTeamMember['grade'],
      element: member.element as BattleTeamMember['element'],
      class: member.class as BattleTeamMember['class'],
      imageUrl: member.image_url,
      level: member.level,
      position: member.position,
      currentHp: member.current_hp,
      maxHp: member.max_hp,
      atk: member.atk,
      def: member.def,
      spd: member.spd,
    };
  }
}

export const dungeonService = new DungeonService();
