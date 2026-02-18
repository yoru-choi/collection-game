export interface ApiOk<T> {
  success: true;
  data: T;
  timestamp: string;
}

export interface ApiFail {
  success: false;
  error: string;
  timestamp: string;
}

export type ApiResponse<T> = ApiOk<T> | ApiFail;

export interface User {
  id: number;
  username: string;
  email: string;
  passwordHash: string;
  level: number;
  exp: number;
  crystals: number;
  gold: number;
  energy: number;
  maxEnergy: number;
  lastEnergyUpdate: string;
  createdAt: string;
  updatedAt: string;
}

export interface Character {
  id: number;
  name: string;
  grade: number;
  element: string;
  class: string;
  base_hp: number;
  base_atk: number;
  base_def: number;
  base_spd: number;
  skill_1_id: number;
  skill_2_id: number;
  skill_3_id: number;
  skill_4_id: number;
  image_url: string;
}

export interface UserCharacter {
  id: number;
  user_id: number;
  character_id: number;
  level: number;
  exp: number;
  current_hp: number;
  current_atk: number;
  current_def: number;
  current_spd: number;
  crit_rate: number;
  crit_damage: number;
  accuracy: number;
  resistance: number;
  skill_1_level: number;
  skill_2_level: number;
  skill_3_level: number;
  skill_4_level: number;
  awakened: boolean;
  obtained_at: string;
}

export interface Dungeon {
  id: number;
  name: string;
  dungeon_type: string;
  difficulty: string;
  chapter: number;
  stage: number;
  energy_cost: number;
  stages: Array<{ stage_number: number; waves: number }>;
  rewards: Array<{ type: string; name?: string; amount: number }>;
  exp_reward: number;
  gold_reward: number;
}

export interface BattleUnit {
  unit_id: string;
  team: 'ally' | 'enemy';
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
  skills: Array<{
    skill_id: number;
    slot_index: number;
    name: string;
    skill_type: string;
    target_type: string;
    multiplier: number;
    max_cooldown: number;
    current_cd: number;
    effects: string;
  }>;
  buffs: Array<{ effect_type: string; value: number; duration: number; source_id: string }>;
  debuffs: Array<{ effect_type: string; value: number; duration: number; source_id: string }>;
  is_alive: boolean;
}

export interface BattleState {
  battle_id: number;
  phase: 'ready' | 'in_wave' | 'action_select' | 'animating' | 'wave_clear' | 'battle_end';
  current_wave: number;
  total_waves: number;
  allies: BattleUnit[];
  enemies: BattleUnit[];
  active_unit_id?: string;
  auto_mode: boolean;
  speed_multiplier: number;
  turn_counter: number;
  events: Array<{
    turn_number: number;
    actor_id: string;
    actor_name: string;
    skill_name: string;
    skill_id: number;
    event_type: string;
    targets: Array<{
      target_id: string;
      target_name: string;
      damage?: number;
      heal?: number;
      is_crit?: boolean;
      is_kill?: boolean;
      hp_after: number;
      applied?: string[];
      resisted?: string[];
    }>;
  }>;
  result?: {
    battle_id: number;
    result: 'victory' | 'defeat';
    waves_cleared: number;
    gold: number;
    exp: number;
    crystals: number;
  };
}

declare global {
  namespace Express {
    interface Request {
      userId?: number;
      accessToken?: string;
    }
  }
}
