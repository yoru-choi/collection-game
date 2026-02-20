import { ElementType, CharacterClass, Grade, RuneGrade, RuneType, StatusEffect } from '@/utils/Constants';

// User Types
export interface User {
  id: string;
  username: string;
  email: string;
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

// Character Types
export interface Character {
  id: string;
  name: string;
  grade: Grade;
  element: ElementType;
  class: CharacterClass;
  baseHp: number;
  baseAtk: number;
  baseDef: number;
  baseSpd: number;
  baseCrt: number;
  baseCrtDmg: number;
  baseAcc: number;
  baseRes: number;
  skill1Id: string;
  skill2Id: string;
  skill3Id: string;
  skill4Id: string;
  imageUrl: string;
  description?: string;
}

export interface UserCharacter {
  id: string;
  userId: string;
  characterId: string;
  character: Character;
  level: number;
  exp: number;
  currentHp: number;
  currentAtk: number;
  currentDef: number;
  currentSpd: number;
  currentCrt: number;
  currentCrtDmg: number;
  currentAcc: number;
  currentRes: number;
  skill1Level: number;
  skill2Level: number;
  skill3Level: number;
  skill4Level: number;
  awakened: number;
  obtainedAt: string;
  runes?: Rune[];
}

// Skill Types
export interface Skill {
  id: string;
  name: string;
  description: string;
  cooldown: number;
  multiplier: number;
  effects: SkillEffect[];
  animationKey?: string;
}

export interface SkillEffect {
  type: 'damage' | 'heal' | 'buff' | 'debuff' | 'status';
  target: 'self' | 'ally' | 'enemy' | 'all_allies' | 'all_enemies';
  value: number;
  statusEffect?: StatusEffect;
  duration?: number;
  chance?: number;
}

// Rune Types
export interface Rune {
  id: string;
  userCharacterId: string;
  slot: number; // 1-6
  type: RuneType;
  grade: RuneGrade;
  level: number;
  mainStat: RuneStat;
  subStats: RuneStat[];
  setType?: string;
}

export interface RuneStat {
  type: RuneType;
  value: number;
  isPercent: boolean;
}

// Battle Types (legacy)
export interface BattleState {
  id: string;
  playerTeam: BattleCharacter[];
  enemyTeam: BattleCharacter[];
  turnOrder: string[];
  currentTurn: number;
  isAutoPlay: boolean;
  battleSpeed: number;
  status: 'ongoing' | 'victory' | 'defeat';
}

export interface BattleTeamMember {
  id: string;
  userCharacterId?: string;
  characterId: string;
  name: string;
  grade: Grade;
  element: ElementType;
  class: CharacterClass;
  imageUrl: string;
  level: number;
  position: number;
  currentHp: number;
  maxHp: number;
  atk: number;
  def: number;
  spd: number;
}

export interface BattleStart {
  id: string;
  status: 'ongoing' | 'victory' | 'defeat';
  playerTeam: BattleTeamMember[];
  enemyTeam: BattleTeamMember[];
}

export interface BattleCharacter {
  id: string;
  userCharacter: UserCharacter;
  currentHp: number;
  maxHp: number;
  currentShield: number;
  buffs: BuffDebuff[];
  debuffs: BuffDebuff[];
  skillCooldowns: Map<string, number>;
  isDead: boolean;
  attackBar: number; // 0-100, for turn order
}

export interface BuffDebuff {
  type: StatusEffect;
  duration: number;
  value?: number;
  stackCount?: number;
}

export interface BattleAction {
  actorId: string;
  skillId: string;
  targetIds: string[];
}

export interface BattleResult {
  isVictory: boolean;
  rewards: Reward[];
  exp: number;
  gold: number;
}

// ============================================================
// ATB Battle System Types
// ============================================================

export type BattlePhase = 'ready' | 'in_wave' | 'action_select' | 'animating' | 'wave_clear' | 'battle_end';

export interface BattleStateResponse {
  battleId: number;
  phase: BattlePhase;
  currentWave: number;
  totalWaves: number;
  allies: BattleUnitState[];
  enemies: BattleUnitState[];
  activeUnitId?: string;
  autoMode: boolean;
  speedMultiplier: number;
  turnCounter: number;
  events?: TurnEventDisplay[];
}

export interface BattleUnitState {
  unitId: string;
  team: 'ally' | 'enemy';
  charId: number;
  name: string;
  grade: number;
  element: string;
  class: string;
  imageUrl: string;
  level: number;
  position: number;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  spd: number;
  critRate: number;
  critDamage: number;
  accuracy: number;
  resistance: number;
  atbGauge: number;
  skills: BattleSkillState[];
  buffs: ActiveEffectDisplay[];
  debuffs: ActiveEffectDisplay[];
  isAlive: boolean;
}

export interface BattleSkillState {
  skillId: number;
  slotIndex: number;
  name: string;
  skillType: string;
  targetType: string;
  multiplier: number;
  maxCooldown: number;
  currentCd: number;
  effects: string;
}

export interface ActiveEffectDisplay {
  effectType: string;
  value: number;
  duration: number;
  sourceId: string;
}

export interface TurnEventDisplay {
  turnNumber: number;
  actorId: string;
  actorName: string;
  skillName: string;
  skillId: number;
  targets: TargetResultDisplay[];
  eventType: string;
}

export interface TargetResultDisplay {
  targetId: string;
  targetName: string;
  damage?: number;
  heal?: number;
  isCrit?: boolean;
  isKill?: boolean;
  hpAfter: number;
  applied?: string[];
  resisted?: string[];
}

export interface BattleActionInput {
  unitId: string;
  skillIndex: number;
  targetIds: string[];
}

export interface BattleResultResponse {
  battleId: number;
  result: 'victory' | 'defeat';
  wavesCleared: number;
  gold: number;
  exp: number;
  crystals: number;
}

// Dungeon Types
export interface Dungeon {
  id: string;
  name: string;
  type: string;
  difficulty: string;
  chapter?: number;
  stage?: number;
  energyCost: number;
  recommendedPower: number;
  stages: DungeonStage[];
  rewards: Reward[];
  firstClearReward?: Reward[];
  expReward?: number;
  goldReward?: number;
}

export interface DungeonStage {
  stageNumber: number;
  enemies: Character[];
  waves: number;
}

export interface Reward {
  type: 'character' | 'item' | 'currency' | 'rune' | 'material';
  id?: string;
  quantity: number;
  name?: string;
}

// Arena Types
export interface ArenaPlayer {
  userId: string;
  username: string;
  rank: number;
  rating: number;
  winCount: number;
  loseCount: number;
  defenseTeam: UserCharacter[];
}

export interface ArenaMatch {
  id: string;
  attacker: ArenaPlayer;
  defender: ArenaPlayer;
  result?: 'win' | 'lose';
  replayData?: any;
}

// Guild Types
export interface Guild {
  id: string;
  name: string;
  leaderId: string;
  level: number;
  membersCount: number;
  maxMembers: number;
  description?: string;
  requirement?: string;
  createdAt: string;
}

export interface GuildMember {
  userId: string;
  username: string;
  role: 'leader' | 'officer' | 'member';
  contribution: number;
  joinedAt: string;
}

// Shop Types
export interface ShopItem {
  id: string;
  name: string;
  description: string;
  type: 'package' | 'energy' | 'material' | 'rune' | 'currency';
  price: number;
  currencyType: string;
  stock?: number;
  dailyLimit?: number;
  dailyPurchased?: number;
  imageUrl?: string;
}

// Quest Types
export interface Quest {
  id: string;
  type: 'daily' | 'weekly' | 'achievement';
  title: string;
  description: string;
  progress: number;
  goal: number;
  rewards: Reward[];
  isCompleted: boolean;
  isClaimed: boolean;
}

// Inventory Types
export interface InventoryItem {
  id: string;
  itemId: string;
  type: 'material' | 'consumable' | 'currency';
  name: string;
  quantity: number;
  description?: string;
  imageUrl?: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string | null;
  message?: string;
  timestamp?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  authToken: string;           // Access Token (15\ubd84, \uba54\ubaa8\ub9ac\uc5d0\ub9cc \uc800\uc7a5)
  refreshToken?: string;       // Refresh Token (7\uc77c, HttpOnly Cookie\ub85c \uad00\ub9ac, \ud074\ub77c\uc774\uc5b8\ud2b8\ub294 \ubc18\uc9c0 \uc54a\uc74c)
  user: User;
  expiresIn?: number;          // Access Token \ub9cc\ub8cc \uc2dc\uac04 (\ucd08)
}

export interface SummonRequest {
  type: 'normal' | 'premium';
  count: number;
}

export interface SummonResponse {
  results: SummonResult[];
  remaining_crystals: number;
}

export interface SummonResult {
  character_id: number;
  character: Character;
  is_new: boolean;
}

// WebSocket Message Types
export interface WSMessage {
  event: string;
  data: any;
  timestamp?: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  message: string;
  channel: 'global' | 'guild' | 'private';
  timestamp: string;
}

export interface PvPMatchFound {
  matchId: string;
  opponent: {
    userId: string;
    username: string;
    rank: number;
    team: UserCharacter[];
  };
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}
