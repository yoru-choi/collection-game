// Game Configuration
const DEFAULT_API_BASE_URL = typeof window !== 'undefined'
  ? window.location.origin
  : 'http://localhost';

const DEFAULT_WS_URL = typeof window !== 'undefined'
  ? window.location.origin.replace(/^http/, 'ws')
  : 'ws://localhost';

const IS_PRODUCTION = import.meta.env.MODE === 'production';
const RESOLVED_API_BASE_URL = IS_PRODUCTION
  ? DEFAULT_API_BASE_URL
  : (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL);

const RESOLVED_WS_URL = IS_PRODUCTION
  ? DEFAULT_WS_URL
  : (import.meta.env.VITE_WS_URL || DEFAULT_WS_URL);

export const GAME_CONFIG = {
  WIDTH: 1280,
  HEIGHT: 720,
  API_BASE_URL: RESOLVED_API_BASE_URL,
  WS_URL: RESOLVED_WS_URL,
  API_VERSION: 'v1',
  TOKEN_REFRESH_INTERVAL: 14 * 60 * 1000, // 14 minutes (before 15min expiry)
  REQUEST_TIMEOUT: 10000,
  MAX_RETRIES: 3,
};

// Responsive Breakpoints (반응형 브레이크포인트)
export const BREAKPOINTS = {
  MOBILE: 767,      // 모바일 중심 UI 기준
  TABLET: 1279,     // 태블릿 (모바일 UI 스케일)
  DESKTOP: 1280,    // 데스크톱 (모바일 UI 스케일)
};

// Device Detection Helper
export const getDeviceType = (): 'mobile' | 'tablet' | 'desktop' => {
  const width = window.innerWidth;
  if (width <= BREAKPOINTS.MOBILE) return 'mobile';
  if (width <= BREAKPOINTS.TABLET) return 'tablet';
  return 'desktop';
};

// Touch Support Detection
export const isTouchDevice = (): boolean => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

// Scene Keys
export const SCENE_KEYS = {
  BOOT: 'BootScene',
  LOGIN: 'LoginScene',
  TUTORIAL: 'TutorialScene',
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
  SETTINGS: 'SettingsScene',
  CREDITS: 'CreditsScene',
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

// Colors - Fantasy UI Palette (Gold + Crystal)
export const COLORS = {
  // Primary Colors - Gold Theme
  PRIMARY: 0xd4af37,        // Gold
  PRIMARY_DARK: 0xb08a2e,   // Antique Gold
  PRIMARY_LIGHT: 0xf1d27a,  // Pale Gold
  
  // Secondary Colors - Crystal Blue
  SECONDARY: 0x3fb6c6,      // Crystal Blue
  SECONDARY_DARK: 0x2a8f9b, // Deep Teal
  SECONDARY_LIGHT: 0x7ad4df, // Light Crystal
  
  // Status Colors
  SUCCESS: 0x4caf50,        // Green
  SUCCESS_LIGHT: 0x7bd37f,
  DANGER: 0xe53935,         // Red
  DANGER_LIGHT: 0xf07c79,
  WARNING: 0xf2b705,        // Amber
  WARNING_LIGHT: 0xf7d26a,
  INFO: 0x4b9fde,           // Sapphire
  INFO_LIGHT: 0x7cc1f0,
  
  // Neutral Colors (Warm)
  LIGHT: 0xf1ede3,
  DARK: 0x2a2620,
  DARKER: 0x17140f,
  WHITE: 0xffffff,
  BLACK: 0x000000,
  
  // Text Colors
  TEXT_PRIMARY: 0xf4efe3,
  TEXT_SECONDARY: 0xc8c1b3,
  TEXT_MUTED: 0x9a907f,
  
  // Background Gradients
  BG_START: 0x18150f,
  BG_END: 0x2a261e,
  BG_ACCENT: 0x3a3327,
  
  // Grade Colors - Fantasy
  GRADE_1: 0x8f8a7a,
  GRADE_2: 0x3c9d63,
  GRADE_3: 0x2f6fd6,
  GRADE_4: 0x8f6bd9,
  GRADE_5: 0xd4af37,
  
  // Element Colors
  ELEMENT_FIRE: 0xd96b2b,
  ELEMENT_WATER: 0x2a83c8,
  ELEMENT_WIND: 0x3aa06a,
  ELEMENT_LIGHT: 0xf2c35c,
  ELEMENT_DARK: 0x5f3b86,
  
  // UI Accent Colors
  GOLD: 0xd4af37,
  SILVER: 0xbcb4a5,
  BRONZE: 0x9c6b2f,
};

// UI Constants
export const UI = {
  PADDING: 20,
  BUTTON_HEIGHT: 50,
  BUTTON_WIDTH: 150,
  PANEL_PADDING: 15,
  BORDER_RADIUS: 12,
  SHADOW_OFFSET: 4,
  SHADOW_BLUR: 8,
  FONTS: {
    TITLE: '"Cinzel", "Noto Serif KR", serif',
    BODY: '"Noto Sans KR", "Apple SD Gothic Neo", sans-serif',
    UI: '"Noto Sans KR", "Apple SD Gothic Neo", sans-serif',
  },
  FONT_SIZE: {
    TINY: 12,
    SMALL: 14,
    MEDIUM: 18,
    LARGE: 24,
    XLARGE: 32,
    HUGE: 48,
  },
  ANIMATION: {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500,
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

// Battle Configuration
export const BATTLE_CONFIG = {
  POLL_INTERVAL_AUTO: 500,      // ms - polling interval during auto battle
  POLL_INTERVAL_MANUAL: 300,    // ms - polling interval during manual wait
  TICK_INTERVAL: 100,           // ms - server tick interval
  ATB_MAX: 100,
  LOCAL_ATB_INTERPOLATION: true,
  ANIMATION_DURATION: {
    ATTACK: 400,
    SKILL: 600,
    HEAL: 500,
    DAMAGE_NUMBER: 800,
    DEATH: 600,
    WAVE_TRANSITION: 1000,
  },
  DAMAGE_COLORS: {
    NORMAL: '#ffffff',
    CRITICAL: '#ff4444',
    HEAL: '#44ff44',
  },
};
