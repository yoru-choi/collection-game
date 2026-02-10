// Game Configuration
export const GAME_CONFIG = {
  WIDTH: 1280,
  HEIGHT: 720,
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  WS_URL: import.meta.env.VITE_WS_URL || 'ws://localhost:8080',
  API_VERSION: 'v1',
  TOKEN_REFRESH_INTERVAL: 14 * 60 * 1000, // 14 minutes (before 15min expiry)
  REQUEST_TIMEOUT: 10000,
  MAX_RETRIES: 3,
};

// Scene Keys
export const SCENE_KEYS = {
  BOOT: 'BootScene',
  LOGIN: 'LoginScene',
  LOBBY: 'LobbyScene',
  CHARACTER_LIST: 'CharacterListScene',
  CHARACTER_DETAIL: 'CharacterDetailScene',
  SUMMON: 'SummonScene',
  DUNGEON_SELECT: 'DungeonSelectScene',
  BATTLE: 'BattleScene',
  ARENA: 'ArenaScene',
  GUILD: 'GuildScene',
  SHOP: 'ShopScene',
  INVENTORY: 'InventoryScene',
};

// Character Elements
export enum ElementType {
  FIRE = 'fire',
  WATER = 'water',
  WIND = 'wind',
  LIGHT = 'light',
  DARK = 'dark',
}

// Character Classes
export enum CharacterClass {
  WARRIOR = 'warrior',
  MAGE = 'mage',
  HEALER = 'healer',
  ASSASSIN = 'assassin',
  TANK = 'tank',
  SUPPORT = 'support',
}

// Character Grades (Star Rating)
export enum Grade {
  ONE_STAR = 1,
  TWO_STAR = 2,
  THREE_STAR = 3,
  FOUR_STAR = 4,
  FIVE_STAR = 5,
}

// Gacha Rates
export const GACHA_RATES = {
  [Grade.ONE_STAR]: 0.5,
  [Grade.TWO_STAR]: 0.3,
  [Grade.THREE_STAR]: 0.15,
  [Grade.FOUR_STAR]: 0.04,
  [Grade.FIVE_STAR]: 0.01,
};

// Currency Types
export enum CurrencyType {
  CRYSTAL = 'crystal',
  GOLD = 'gold',
  GLORY_POINT = 'glory_point',
  GUILD_POINT = 'guild_point',
  FRIENDSHIP_POINT = 'friendship_point',
}

// Rune Grades
export enum RuneGrade {
  NORMAL = 'normal',
  MAGIC = 'magic',
  RARE = 'rare',
  HERO = 'hero',
  LEGEND = 'legend',
}

// Rune Types
export enum RuneType {
  ATK = 'atk',
  DEF = 'def',
  HP = 'hp',
  SPD = 'spd',
  CRT = 'crt',
  CRT_DMG = 'crt_dmg',
  ACC = 'acc',
  RES = 'res',
}

// Battle Speed
export enum BattleSpeed {
  X1 = 1,
  X2 = 2,
  X3 = 3,
}

// Dungeon Types
export enum DungeonType {
  STORY = 'story',
  ELEMENT = 'element',
  EXPERIENCE = 'experience',
  GOLD = 'gold',
  BOSS_RAID = 'boss_raid',
  EVENT = 'event',
}

// Dungeon Difficulty
export enum DungeonDifficulty {
  NORMAL = 'normal',
  HARD = 'hard',
  HELL = 'hell',
}

// Arena Ranks
export enum ArenaRank {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum',
  DIAMOND = 'diamond',
  MASTER = 'master',
  LEGEND = 'legend',
}

// Status Effects
export enum StatusEffect {
  STUN = 'stun',
  SILENCE = 'silence',
  TAUNT = 'taunt',
  SLEEP = 'sleep',
  FREEZE = 'freeze',
  POISON = 'poison',
  BURN = 'burn',
  BLEED = 'bleed',
  ATK_UP = 'atk_up',
  ATK_DOWN = 'atk_down',
  DEF_UP = 'def_up',
  DEF_DOWN = 'def_down',
  SPD_UP = 'spd_up',
  SPD_DOWN = 'spd_down',
  SHIELD = 'shield',
  INVINCIBLE = 'invincible',
}

// Element Advantage
export const ELEMENT_ADVANTAGE: Record<ElementType, ElementType> = {
  [ElementType.FIRE]: ElementType.WIND,
  [ElementType.WIND]: ElementType.WATER,
  [ElementType.WATER]: ElementType.FIRE,
  [ElementType.LIGHT]: ElementType.DARK,
  [ElementType.DARK]: ElementType.LIGHT,
};

// Energy
export const ENERGY_CONFIG = {
  MAX_ENERGY: 100,
  RECOVERY_RATE: 1, // energy per 5 minutes
  RECOVERY_INTERVAL: 5 * 60 * 1000, // 5 minutes in milliseconds
};

// Colors
export const COLORS = {
  PRIMARY: 0x4a90e2,
  SECONDARY: 0x7b68ee,
  SUCCESS: 0x50c878,
  DANGER: 0xe74c3c,
  WARNING: 0xf39c12,
  INFO: 0x3498db,
  LIGHT: 0xecf0f1,
  DARK: 0x2c3e50,
  WHITE: 0xffffff,
  BLACK: 0x000000,
  
  // Grade Colors
  GRADE_1: 0x808080,
  GRADE_2: 0x00ff00,
  GRADE_3: 0x0070dd,
  GRADE_4: 0xa335ee,
  GRADE_5: 0xff8000,
  
  // Element Colors
  FIRE: 0xff4500,
  WATER: 0x1e90ff,
  WIND: 0x32cd32,
  LIGHT: 0xffd700,
  DARK: 0x8b008b,
};

// UI Constants
export const UI = {
  PADDING: 20,
  BUTTON_HEIGHT: 50,
  BUTTON_WIDTH: 150,
  PANEL_PADDING: 15,
  FONT_SIZE: {
    SMALL: 14,
    MEDIUM: 18,
    LARGE: 24,
    XLARGE: 32,
  },
};

// WebSocket Events
export const WS_EVENTS = {
  // Chat
  CHAT_MESSAGE: 'chat:message',
  CHAT_JOIN: 'chat:join',
  CHAT_LEAVE: 'chat:leave',
  
  // PvP
  PVP_MATCH_FOUND: 'pvp:match_found',
  PVP_TURN: 'pvp:turn',
  PVP_RESULT: 'pvp:result',
  
  // Guild
  GUILD_NOTIFICATION: 'guild:notification',
  GUILD_WAR_START: 'guild:war_start',
  
  // System
  EVENT_UPDATE: 'event:update',
  USER_ONLINE_STATUS: 'user:online_status',
  NOTIFICATION_PUSH: 'notification:push',
  
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'error',
  RECONNECT: 'reconnect',
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
};
