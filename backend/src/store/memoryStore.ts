import { v4 as uuidv4 } from 'uuid';
import { and, asc, eq, sql } from 'drizzle-orm';
import { env } from '../config/env';
import {
  Character, Dungeon, BattleState, BattleUnit, User, UserCharacter,
  SkillDefinition, DungeonWaveData, PurchaseRecord, UserQuestProgress, DailyLoginData,
  UserItem, QuestTemplate, AchievementProgress,
} from '../types';
import { db } from '../db/client';
import {
  characters as charactersTable,
  dungeons as dungeonsTable,
  guildMembers as guildMembersTable,
  guilds as guildsTable,
  partyMembers as partyMembersTable,
  quests as questsTable,
  shopItems as shopItemsTable,
  summonHistory as summonHistoryTable,
  userCharacters as userCharactersTable,
  users as usersTable,
  userDungeonProgress as userDungeonProgressTable,
  userItems as userItemsTable,
  weeklyQuests as weeklyQuestsTable,
  achievements as achievementsTable,
} from '../db/schema';

const now = (): string => new Date().toISOString();
const todayKey = (): string => new Date().toISOString().slice(0, 10);
const weekKey = (): string => {
  const d = new Date();
  const day = d.getDay() || 7;
  d.setDate(d.getDate() + 4 - day);
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNum = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
};

// PRD 4.1: 성급별 최대 레벨
const MAX_LEVEL_BY_GRADE: Record<number, number> = { 1: 15, 2: 25, 3: 35, 4: 45, 5: 60 };
const getMaxLevel = (grade: number): number => MAX_LEVEL_BY_GRADE[grade] ?? 15;
// PRD: 레벨업 비용 = 현재레벨 * 100 골드 / 경험치 크리스탈
const getExpToNext = (level: number): number => level * 100;

// ============================================================
// Skill Definitions (MVP: 4 skills per character template)
// ============================================================
const skillDefinitions: SkillDefinition[] = [
  // -- Fire Warrior (id 1) skills
  { id: 101, name: 'Flame Strike', skill_type: 'damage', target_type: 'single', multiplier: 1.0, max_cooldown: 0, effects: 'basic attack' },
  { id: 102, name: 'Blazing Slash', skill_type: 'damage', target_type: 'single', multiplier: 1.75, max_cooldown: 2, effects: 'strong fire attack', effect_type: 'burn', effect_chance: 30, effect_duration: 2 },
  { id: 103, name: 'Inferno Wave', skill_type: 'damage', target_type: 'all_enemies', multiplier: 2.75, max_cooldown: 3, effects: 'AoE fire damage', effect_type: 'burn', effect_chance: 50, effect_duration: 2 },
  { id: 104, name: 'Dragon Rage', skill_type: 'damage', target_type: 'single', multiplier: 4.5, max_cooldown: 5, effects: 'ultimate fire attack', effect_type: 'stun', effect_chance: 30, effect_duration: 1 },
  // -- Wind Support (id 2) skills
  { id: 201, name: 'Wind Bolt', skill_type: 'damage', target_type: 'single', multiplier: 1.0, max_cooldown: 0, effects: 'basic attack' },
  { id: 202, name: 'Healing Breeze', skill_type: 'heal', target_type: 'all_allies', multiplier: 1.75, max_cooldown: 2, effects: 'heal all allies' },
  { id: 203, name: 'Gale Shield', skill_type: 'buff', target_type: 'all_allies', multiplier: 2.75, max_cooldown: 3, effects: 'DEF buff to all allies', effect_type: 'def_up', effect_duration: 2, effect_value: 30 },
  { id: 204, name: 'Storm of Renewal', skill_type: 'heal', target_type: 'all_allies', multiplier: 4.5, max_cooldown: 5, effects: 'massive heal all allies' },
  // -- Water Archer (id 3) skills
  { id: 301, name: 'Water Arrow', skill_type: 'damage', target_type: 'single', multiplier: 1.0, max_cooldown: 0, effects: 'basic attack' },
  { id: 302, name: 'Tidal Shot', skill_type: 'damage', target_type: 'single', multiplier: 1.75, max_cooldown: 2, effects: 'piercing water shot', effect_type: 'def_down', effect_chance: 50, effect_duration: 2, effect_value: 25 },
  { id: 303, name: 'Frozen Rain', skill_type: 'damage', target_type: 'all_enemies', multiplier: 2.75, max_cooldown: 3, effects: 'AoE water damage', effect_type: 'spd_down', effect_chance: 50, effect_duration: 2, effect_value: 25 },
  { id: 304, name: 'Tsunami Barrage', skill_type: 'damage', target_type: 'all_enemies', multiplier: 4.5, max_cooldown: 5, effects: 'massive AoE water attack', effect_type: 'atk_down', effect_chance: 75, effect_duration: 2, effect_value: 25 },
  // -- Light Tank (id 4) skills
  { id: 401, name: 'Shield Bash', skill_type: 'damage', target_type: 'single', multiplier: 1.0, max_cooldown: 0, effects: 'basic attack' },
  { id: 402, name: 'Holy Guard', skill_type: 'buff', target_type: 'self', multiplier: 1.75, max_cooldown: 2, effects: 'DEF up self', effect_type: 'def_up', effect_duration: 2, effect_value: 35 },
  { id: 403, name: 'Divine Shield', skill_type: 'buff', target_type: 'all_allies', multiplier: 2.75, max_cooldown: 3, effects: 'shield all allies', effect_type: 'def_up', effect_duration: 2, effect_value: 30 },
  { id: 404, name: 'Judgement', skill_type: 'damage', target_type: 'all_enemies', multiplier: 4.5, max_cooldown: 5, effects: 'holy AoE damage' },
  // -- Dark Mage (id 5) skills
  { id: 501, name: 'Shadow Bolt', skill_type: 'damage', target_type: 'single', multiplier: 1.0, max_cooldown: 0, effects: 'basic attack' },
  { id: 502, name: 'Dark Pulse', skill_type: 'debuff', target_type: 'all_enemies', multiplier: 1.75, max_cooldown: 2, effects: 'AoE dark damage', effect_type: 'atk_down', effect_chance: 50, effect_duration: 2, effect_value: 20 },
  { id: 503, name: 'Void Burst', skill_type: 'damage', target_type: 'single', multiplier: 2.75, max_cooldown: 3, effects: 'strong dark attack', effect_type: 'def_down', effect_chance: 50, effect_duration: 2, effect_value: 25 },
  { id: 504, name: 'Abyss Annihilation', skill_type: 'damage', target_type: 'all_enemies', multiplier: 4.5, max_cooldown: 5, effects: 'ultimate dark AoE', effect_type: 'stun', effect_chance: 35, effect_duration: 1 },
  // -- Water Healer (id 6) skills
  { id: 601, name: 'Aqua Touch', skill_type: 'damage', target_type: 'single', multiplier: 1.0, max_cooldown: 0, effects: 'basic attack' },
  { id: 602, name: 'Tidal Heal', skill_type: 'heal', target_type: 'single', multiplier: 1.75, max_cooldown: 2, effects: 'heal single ally' },
  { id: 603, name: 'Purifying Wave', skill_type: 'heal', target_type: 'all_allies', multiplier: 2.75, max_cooldown: 3, effects: 'heal all allies' },
  { id: 604, name: 'Ocean Blessing', skill_type: 'heal', target_type: 'all_allies', multiplier: 4.5, max_cooldown: 5, effects: 'massive heal + DEF buff' },
  // -- Fire Assassin (id 7) skills
  { id: 701, name: 'Quick Slash', skill_type: 'damage', target_type: 'single', multiplier: 1.0, max_cooldown: 0, effects: 'basic attack' },
  { id: 702, name: 'Flame Dagger', skill_type: 'damage', target_type: 'single', multiplier: 1.75, max_cooldown: 2, effects: 'high crit fire attack', effect_type: 'burn', effect_chance: 50, effect_duration: 2 },
  { id: 703, name: 'Blaze Rush', skill_type: 'damage', target_type: 'single', multiplier: 2.75, max_cooldown: 3, effects: 'fire combo attack', effect_type: 'burn', effect_chance: 75, effect_duration: 2 },
  { id: 704, name: 'Infernal Execution', skill_type: 'damage', target_type: 'single', multiplier: 4.5, max_cooldown: 5, effects: 'ultimate assassination', effect_type: 'burn', effect_chance: 100, effect_duration: 2 },
  // -- Wind Mage (id 8) skills
  { id: 801, name: 'Wind Blade', skill_type: 'damage', target_type: 'single', multiplier: 1.0, max_cooldown: 0, effects: 'basic attack' },
  { id: 802, name: 'Cyclone', skill_type: 'damage', target_type: 'all_enemies', multiplier: 1.75, max_cooldown: 2, effects: 'wind AoE' },
  { id: 803, name: 'Tornado', skill_type: 'damage', target_type: 'all_enemies', multiplier: 2.75, max_cooldown: 3, effects: 'stronger wind AoE', effect_type: 'spd_down', effect_chance: 50, effect_duration: 2, effect_value: 25 },
  { id: 804, name: 'Tempest Fury', skill_type: 'damage', target_type: 'all_enemies', multiplier: 4.5, max_cooldown: 5, effects: 'ultimate wind AoE', effect_type: 'spd_down', effect_chance: 75, effect_duration: 2, effect_value: 35 },
  // -- Light Healer (id 9) skills
  { id: 901, name: 'Holy Light', skill_type: 'damage', target_type: 'single', multiplier: 1.0, max_cooldown: 0, effects: 'basic attack' },
  { id: 902, name: 'Heal', skill_type: 'heal', target_type: 'single', multiplier: 1.75, max_cooldown: 2, effects: 'heal single' },
  { id: 903, name: 'Mass Heal', skill_type: 'heal', target_type: 'all_allies', multiplier: 2.75, max_cooldown: 3, effects: 'heal all' },
  { id: 904, name: 'Divine Resurrection', skill_type: 'heal', target_type: 'all_allies', multiplier: 4.5, max_cooldown: 5, effects: 'massive heal' },
  // -- Dark Assassin (id 10) skills
  { id: 1001, name: 'Shadow Strike', skill_type: 'damage', target_type: 'single', multiplier: 1.0, max_cooldown: 0, effects: 'basic attack' },
  { id: 1002, name: 'Venom Blade', skill_type: 'damage', target_type: 'single', multiplier: 1.75, max_cooldown: 2, effects: 'poison attack', effect_type: 'poison', effect_chance: 75, effect_duration: 2 },
  { id: 1003, name: 'Shadow Dance', skill_type: 'damage', target_type: 'single', multiplier: 2.75, max_cooldown: 3, effects: 'multi-hit dark attack', effect_type: 'poison', effect_chance: 50, effect_duration: 2 },
  { id: 1004, name: 'Death Sentence', skill_type: 'damage', target_type: 'single', multiplier: 4.5, max_cooldown: 5, effects: 'ultimate dark attack', effect_type: 'poison', effect_chance: 100, effect_duration: 3 },
  // -- Water Tank (id 11) skills
  { id: 1101, name: 'Tidal Slam', skill_type: 'damage', target_type: 'single', multiplier: 1.0, max_cooldown: 0, effects: 'basic attack' },
  { id: 1102, name: 'Ice Barrier', skill_type: 'buff', target_type: 'self', multiplier: 1.75, max_cooldown: 2, effects: 'DEF up self', effect_type: 'def_up', effect_duration: 2, effect_value: 35 },
  { id: 1103, name: 'Frost Armor', skill_type: 'buff', target_type: 'all_allies', multiplier: 2.75, max_cooldown: 3, effects: 'DEF buff allies', effect_type: 'def_up', effect_duration: 2, effect_value: 30 },
  { id: 1104, name: 'Glacial Fortress', skill_type: 'buff', target_type: 'all_allies', multiplier: 4.5, max_cooldown: 5, effects: 'massive DEF buff', effect_type: 'def_up', effect_duration: 3, effect_value: 50 },
  // -- Fire Mage (id 12) skills
  { id: 1201, name: 'Fire Bolt', skill_type: 'damage', target_type: 'single', multiplier: 1.0, max_cooldown: 0, effects: 'basic attack' },
  { id: 1202, name: 'Fireball', skill_type: 'damage', target_type: 'single', multiplier: 1.75, max_cooldown: 2, effects: 'fire damage' },
  { id: 1203, name: 'Meteor Storm', skill_type: 'damage', target_type: 'all_enemies', multiplier: 2.75, max_cooldown: 3, effects: 'AoE fire damage' },
  { id: 1204, name: 'Hellfire', skill_type: 'damage', target_type: 'all_enemies', multiplier: 4.5, max_cooldown: 5, effects: 'ultimate fire AoE' },
  // -- Wind Warrior (id 13) skills
  { id: 1301, name: 'Gale Slash', skill_type: 'damage', target_type: 'single', multiplier: 1.0, max_cooldown: 0, effects: 'basic attack' },
  { id: 1302, name: 'Storm Strike', skill_type: 'damage', target_type: 'single', multiplier: 1.75, max_cooldown: 2, effects: 'wind attack' },
  { id: 1303, name: 'Whirlwind', skill_type: 'damage', target_type: 'all_enemies', multiplier: 2.75, max_cooldown: 3, effects: 'AoE wind damage' },
  { id: 1304, name: 'Hurricane Blade', skill_type: 'damage', target_type: 'all_enemies', multiplier: 4.5, max_cooldown: 5, effects: 'ultimate wind AoE' },
  // -- Dark Tank (id 14) skills
  { id: 1401, name: 'Dark Smash', skill_type: 'damage', target_type: 'single', multiplier: 1.0, max_cooldown: 0, effects: 'basic attack' },
  { id: 1402, name: 'Shadow Armor', skill_type: 'buff', target_type: 'self', multiplier: 1.75, max_cooldown: 2, effects: 'DEF up self', effect_type: 'def_up', effect_duration: 2, effect_value: 35 },
  { id: 1403, name: 'Dark Pact', skill_type: 'buff', target_type: 'all_allies', multiplier: 2.75, max_cooldown: 3, effects: 'ATK buff allies', effect_type: 'atk_up', effect_duration: 2, effect_value: 30 },
  { id: 1404, name: 'Abyssal Wall', skill_type: 'buff', target_type: 'all_allies', multiplier: 4.5, max_cooldown: 5, effects: 'massive DEF buff', effect_type: 'def_up', effect_duration: 3, effect_value: 50 },
  // -- Light Mage (id 15) skills
  { id: 1501, name: 'Light Beam', skill_type: 'damage', target_type: 'single', multiplier: 1.0, max_cooldown: 0, effects: 'basic attack' },
  { id: 1502, name: 'Radiance', skill_type: 'damage', target_type: 'all_enemies', multiplier: 1.75, max_cooldown: 2, effects: 'AoE light damage' },
  { id: 1503, name: 'Solar Flare', skill_type: 'damage', target_type: 'single', multiplier: 2.75, max_cooldown: 3, effects: 'strong light attack' },
  { id: 1504, name: 'Celestial Judgment', skill_type: 'damage', target_type: 'all_enemies', multiplier: 4.5, max_cooldown: 5, effects: 'ultimate light AoE' },
  // -- Enemy skills
  { id: 9001, name: 'Claw', skill_type: 'damage', target_type: 'single', multiplier: 1.0, max_cooldown: 0, effects: 'enemy basic attack' },
  { id: 9002, name: 'Bite', skill_type: 'damage', target_type: 'single', multiplier: 1.0, max_cooldown: 0, effects: 'enemy basic attack' },
  { id: 9003, name: 'Slam', skill_type: 'damage', target_type: 'single', multiplier: 1.5, max_cooldown: 2, effects: 'enemy strong attack' },
  { id: 9004, name: 'Roar', skill_type: 'buff', target_type: 'self', multiplier: 1.0, max_cooldown: 3, effects: 'ATK up', effect_type: 'atk_up', effect_duration: 2, effect_value: 30 },
];

// ============================================================
// Character Seed Data (15 characters, 5 elements × various classes)
// ============================================================
// Class-based CRT stats: { base_crt, base_crt_dmg, base_acc, base_res }
const CLASS_STATS: Record<string, { crt: number; crt_dmg: number; acc: number; res: number }> = {
  assassin: { crt: 20, crt_dmg: 60, acc: 10, res: 0 },
  warrior:  { crt: 15, crt_dmg: 50, acc: 5, res: 5 },
  tank:     { crt: 10, crt_dmg: 50, acc: 0, res: 15 },
  mage:     { crt: 15, crt_dmg: 55, acc: 10, res: 5 },
  healer:   { crt: 10, crt_dmg: 50, acc: 5, res: 10 },
  support:  { crt: 10, crt_dmg: 50, acc: 5, res: 10 },
  archer:   { crt: 20, crt_dmg: 55, acc: 15, res: 0 },
};
const getClassStats = (cls: string) => CLASS_STATS[cls] || { crt: 15, crt_dmg: 50, acc: 0, res: 0 };

const characters: Character[] = [
  // -- 1-star (Common) ×3
  { id: 1, name: 'Novice Fighter', grade: 1, element: 'fire', class: 'warrior', base_hp: 850, base_atk: 120, base_def: 70, base_spd: 102, base_crt: 15, base_crt_dmg: 50, base_acc: 5, base_res: 5, skill_1_id: 101, skill_2_id: 102, skill_3_id: 103, skill_4_id: 104, image_url: '/monsters/warrior_fire_1.png' },
  { id: 6, name: 'Aqua Priest', grade: 1, element: 'water', class: 'healer', base_hp: 900, base_atk: 75, base_def: 80, base_spd: 96, base_crt: 10, base_crt_dmg: 50, base_acc: 5, base_res: 10, skill_1_id: 601, skill_2_id: 602, skill_3_id: 603, skill_4_id: 604, image_url: '/monsters/healer_water_1.png' },
  { id: 13, name: 'Wind Swordsman', grade: 1, element: 'wind', class: 'warrior', base_hp: 820, base_atk: 115, base_def: 72, base_spd: 108, base_crt: 15, base_crt_dmg: 50, base_acc: 5, base_res: 5, skill_1_id: 1301, skill_2_id: 1302, skill_3_id: 1303, skill_4_id: 1304, image_url: '/monsters/warrior_wind_1.png' },

  // -- 2-star (Uncommon) ×3
  { id: 2, name: 'Forest Healer', grade: 2, element: 'wind', class: 'support', base_hp: 980, base_atk: 80, base_def: 90, base_spd: 98, base_crt: 10, base_crt_dmg: 50, base_acc: 5, base_res: 10, skill_1_id: 201, skill_2_id: 202, skill_3_id: 203, skill_4_id: 204, image_url: '/monsters/support_wind_1.png' },
  { id: 3, name: 'Water Archer', grade: 2, element: 'water', class: 'archer', base_hp: 760, base_atk: 150, base_def: 60, base_spd: 110, base_crt: 20, base_crt_dmg: 55, base_acc: 15, base_res: 0, skill_1_id: 301, skill_2_id: 302, skill_3_id: 303, skill_4_id: 304, image_url: '/monsters/archer_water_1.png' },
  { id: 11, name: 'Frost Guardian', grade: 2, element: 'water', class: 'tank', base_hp: 1200, base_atk: 85, base_def: 130, base_spd: 88, base_crt: 10, base_crt_dmg: 50, base_acc: 0, base_res: 15, skill_1_id: 1101, skill_2_id: 1102, skill_3_id: 1103, skill_4_id: 1104, image_url: '/monsters/tank_water_1.png' },

  // -- 3-star (Rare) ×3
  { id: 4, name: 'Light Knight', grade: 3, element: 'light', class: 'tank', base_hp: 1150, base_atk: 95, base_def: 140, base_spd: 95, base_crt: 10, base_crt_dmg: 50, base_acc: 0, base_res: 15, skill_1_id: 401, skill_2_id: 402, skill_3_id: 403, skill_4_id: 404, image_url: '/monsters/tank_light_1.png' },
  { id: 7, name: 'Flame Assassin', grade: 3, element: 'fire', class: 'assassin', base_hp: 720, base_atk: 170, base_def: 55, base_spd: 130, base_crt: 20, base_crt_dmg: 60, base_acc: 10, base_res: 0, skill_1_id: 701, skill_2_id: 702, skill_3_id: 703, skill_4_id: 704, image_url: '/monsters/assassin_fire_1.png' },
  { id: 8, name: 'Wind Sorceress', grade: 3, element: 'wind', class: 'mage', base_hp: 780, base_atk: 165, base_def: 60, base_spd: 105, base_crt: 15, base_crt_dmg: 55, base_acc: 10, base_res: 5, skill_1_id: 801, skill_2_id: 802, skill_3_id: 803, skill_4_id: 804, image_url: '/monsters/mage_wind_1.png' },

  // -- 4-star (Epic) ×3
  { id: 5, name: 'Dark Mage', grade: 4, element: 'dark', class: 'mage', base_hp: 790, base_atk: 180, base_def: 65, base_spd: 105, base_crt: 15, base_crt_dmg: 55, base_acc: 10, base_res: 5, skill_1_id: 501, skill_2_id: 502, skill_3_id: 503, skill_4_id: 504, image_url: '/monsters/mage_dark_1.png' },
  { id: 9, name: 'Holy Priestess', grade: 4, element: 'light', class: 'healer', base_hp: 1050, base_atk: 90, base_def: 100, base_spd: 100, base_crt: 10, base_crt_dmg: 50, base_acc: 5, base_res: 10, skill_1_id: 901, skill_2_id: 902, skill_3_id: 903, skill_4_id: 904, image_url: '/monsters/healer_light_1.png' },
  { id: 14, name: 'Shadow Sentinel', grade: 4, element: 'dark', class: 'tank', base_hp: 1300, base_atk: 100, base_def: 150, base_spd: 90, base_crt: 10, base_crt_dmg: 50, base_acc: 0, base_res: 15, skill_1_id: 1401, skill_2_id: 1402, skill_3_id: 1403, skill_4_id: 1404, image_url: '/monsters/tank_dark_1.png' },

  // -- 5-star (Legendary) ×3
  { id: 10, name: 'Shadow Reaper', grade: 5, element: 'dark', class: 'assassin', base_hp: 820, base_atk: 210, base_def: 60, base_spd: 140, base_crt: 20, base_crt_dmg: 60, base_acc: 10, base_res: 0, skill_1_id: 1001, skill_2_id: 1002, skill_3_id: 1003, skill_4_id: 1004, image_url: '/monsters/assassin_dark_1.png' },
  { id: 12, name: 'Inferno Archmage', grade: 5, element: 'fire', class: 'mage', base_hp: 830, base_atk: 200, base_def: 60, base_spd: 108, base_crt: 15, base_crt_dmg: 55, base_acc: 10, base_res: 5, skill_1_id: 1201, skill_2_id: 1202, skill_3_id: 1203, skill_4_id: 1204, image_url: '/monsters/mage_fire_1.png' },
  { id: 15, name: 'Celestial Sage', grade: 5, element: 'light', class: 'mage', base_hp: 850, base_atk: 195, base_def: 70, base_spd: 112, base_crt: 15, base_crt_dmg: 55, base_acc: 10, base_res: 5, skill_1_id: 1501, skill_2_id: 1502, skill_3_id: 1503, skill_4_id: 1504, image_url: '/monsters/mage_light_1.png' },
];

// ============================================================
// Element advantage helper
// ============================================================
const elementAdvantage: Record<string, string> = {
  fire: 'wind', wind: 'water', water: 'fire', light: 'dark', dark: 'light',
};

const getElementBonus = (attackerElement: string, defenderElement: string): number => {
  if (elementAdvantage[attackerElement] === defenderElement) return 1.5;
  if (elementAdvantage[defenderElement] === attackerElement) return 0.75;
  return 1.0;
};

// ============================================================
// Dungeon wave generator helpers
// ============================================================
const makeWaveEnemies = (chapter: number, stage: number, difficulty: string, wave: number, count: number): DungeonWaveData['enemies'] => {
  const diffMult = difficulty === 'hell' ? { hp: 4, atk: 2, def: 2 } : difficulty === 'hard' ? { hp: 2, atk: 1.5, def: 1.5 } : { hp: 1, atk: 1, def: 1 };
  const baseLevel = (chapter - 1) * 5 + stage;
  const elements = ['fire', 'water', 'wind', 'light', 'dark'];
  const names = ['Goblin', 'Slime', 'Wolf', 'Golem', 'Shade', 'Skeleton', 'Bat', 'Spider'];

  return Array.from({ length: count }, (_, i) => {
    const elem = elements[(wave + i + chapter + stage) % elements.length];
    const name = names[(wave * 3 + i + chapter) % names.length];
    return {
      char_id: 9000 + chapter * 100 + stage * 10 + wave * 4 + i,
      name: `${name} Lv${baseLevel + wave}`,
      element: elem,
      level: baseLevel + wave,
      hp: Math.round((400 + stage * 80 + wave * 60) * diffMult.hp),
      atk: Math.round((70 + stage * 12 + wave * 8) * diffMult.atk),
      def: Math.round((45 + stage * 8 + wave * 5) * diffMult.def),
      spd: 85 + wave * 3 + stage * 2,
      crit_rate: difficulty === 'hell' ? 15 : difficulty === 'hard' ? 10 : 5,
      crit_damage: difficulty === 'hell' ? 60 : 50,
      accuracy: difficulty === 'hell' ? 20 : difficulty === 'hard' ? 10 : 0,
      resistance: difficulty === 'hell' ? 20 : difficulty === 'hard' ? 10 : 0,
    };
  });
};

const makeWaveData = (chapter: number, stage: number, difficulty: string): DungeonWaveData[] => {
  return [1, 2, 3, 4].map((wave) => ({
    wave,
    enemies: makeWaveEnemies(chapter, stage, difficulty, wave, wave < 4 ? 3 : 4),
  }));
};

// ============================================================
// Dungeon Seed Data (Chapter 1-2, Normal/Hard/Hell)
// ============================================================
type DungeonRewardRow = {
  chapter: number; stage: number; difficulty: string;
  energy: number; gold: number; crystal: number; shards: number;
};

const rewardTable: DungeonRewardRow[] = [
  // Chapter 1 Normal
  { chapter: 1, stage: 1, difficulty: 'normal', energy: 3, gold: 1500, crystal: 30, shards: 0 },
  { chapter: 1, stage: 2, difficulty: 'normal', energy: 3, gold: 1700, crystal: 30, shards: 2 },
  { chapter: 1, stage: 3, difficulty: 'normal', energy: 4, gold: 2000, crystal: 40, shards: 3 },
  { chapter: 1, stage: 4, difficulty: 'normal', energy: 4, gold: 2300, crystal: 40, shards: 4 },
  { chapter: 1, stage: 5, difficulty: 'normal', energy: 5, gold: 2600, crystal: 50, shards: 5 },
  // Chapter 1 Hard
  { chapter: 1, stage: 1, difficulty: 'hard', energy: 5, gold: 3500, crystal: 60, shards: 6 },
  { chapter: 1, stage: 2, difficulty: 'hard', energy: 5, gold: 3800, crystal: 60, shards: 8 },
  { chapter: 1, stage: 3, difficulty: 'hard', energy: 6, gold: 4200, crystal: 80, shards: 10 },
  { chapter: 1, stage: 4, difficulty: 'hard', energy: 6, gold: 4600, crystal: 80, shards: 12 },
  { chapter: 1, stage: 5, difficulty: 'hard', energy: 7, gold: 5200, crystal: 100, shards: 14 },
  // Chapter 1 Hell
  { chapter: 1, stage: 1, difficulty: 'hell', energy: 7, gold: 6500, crystal: 120, shards: 15 },
  { chapter: 1, stage: 2, difficulty: 'hell', energy: 7, gold: 7000, crystal: 120, shards: 18 },
  { chapter: 1, stage: 3, difficulty: 'hell', energy: 8, gold: 8000, crystal: 150, shards: 22 },
  { chapter: 1, stage: 4, difficulty: 'hell', energy: 8, gold: 9000, crystal: 150, shards: 26 },
  { chapter: 1, stage: 5, difficulty: 'hell', energy: 9, gold: 10000, crystal: 180, shards: 30 },
  // Chapter 2 Normal
  { chapter: 2, stage: 1, difficulty: 'normal', energy: 5, gold: 3000, crystal: 50, shards: 6 },
  { chapter: 2, stage: 2, difficulty: 'normal', energy: 5, gold: 3300, crystal: 50, shards: 7 },
  { chapter: 2, stage: 3, difficulty: 'normal', energy: 6, gold: 3600, crystal: 60, shards: 8 },
  { chapter: 2, stage: 4, difficulty: 'normal', energy: 6, gold: 4000, crystal: 60, shards: 9 },
  { chapter: 2, stage: 5, difficulty: 'normal', energy: 7, gold: 4500, crystal: 70, shards: 10 },
  // Chapter 2 Hard
  { chapter: 2, stage: 1, difficulty: 'hard', energy: 7, gold: 6000, crystal: 100, shards: 16 },
  { chapter: 2, stage: 2, difficulty: 'hard', energy: 7, gold: 6500, crystal: 100, shards: 18 },
  { chapter: 2, stage: 3, difficulty: 'hard', energy: 8, gold: 7200, crystal: 120, shards: 20 },
  { chapter: 2, stage: 4, difficulty: 'hard', energy: 8, gold: 8000, crystal: 120, shards: 22 },
  { chapter: 2, stage: 5, difficulty: 'hard', energy: 9, gold: 9000, crystal: 150, shards: 24 },
  // Chapter 2 Hell
  { chapter: 2, stage: 1, difficulty: 'hell', energy: 9, gold: 11000, crystal: 180, shards: 28 },
  { chapter: 2, stage: 2, difficulty: 'hell', energy: 9, gold: 12000, crystal: 180, shards: 32 },
  { chapter: 2, stage: 3, difficulty: 'hell', energy: 10, gold: 13500, crystal: 220, shards: 36 },
  { chapter: 2, stage: 4, difficulty: 'hell', energy: 10, gold: 15000, crystal: 220, shards: 40 },
  { chapter: 2, stage: 5, difficulty: 'hell', energy: 11, gold: 17000, crystal: 260, shards: 45 },
];

let dungeonIdSeq = 101;
const dungeons: Dungeon[] = rewardTable.map((row) => ({
  id: dungeonIdSeq++,
  name: `Story ${row.chapter}-${row.stage}: ${row.difficulty === 'normal' ? 'Normal' : row.difficulty === 'hard' ? 'Hard' : 'Hell'}`,
  dungeon_type: 'story',
  difficulty: row.difficulty,
  chapter: row.chapter,
  stage: row.stage,
  energy_cost: row.energy,
  stages: [{ stage_number: 1, waves: 4 }],
  rewards: row.shards > 0 ? [{ type: 'material', name: 'character_shard', amount: row.shards }] : [],
  exp_reward: Math.round(row.gold * 0.1),
  gold_reward: row.gold,
  crystal_reward: row.crystal,
  character_shard_reward: row.shards,
  wave_data: makeWaveData(row.chapter, row.stage, row.difficulty),
}));

// ============================================================
// In-memory state
// ============================================================
const users = new Map<number, User>();
const usersByUsername = new Map<string, number>();
const usersByEmail = new Map<string, number>();

const userCharacters = new Map<number, UserCharacter[]>();
const userParty = new Map<number, number[]>();
const battles = new Map<number, BattleState>();
const userGuild = new Map<number, number>();

// Dungeon progress: userId → Set<dungeonId>
const dungeonCleared = new Map<number, Set<number>>();

// Shop purchase history: userId → Map<date, PurchaseRecord[]>
const purchaseHistory = new Map<number, Map<string, PurchaseRecord[]>>();

// Quest progress per user: userId → Map<questId, UserQuestProgress>
const userQuestProgress = new Map<number, Map<number, UserQuestProgress>>();

// Weekly quest progress per user: userId → Map<questId, UserQuestProgress>
const userWeeklyProgress = new Map<number, Map<number, UserQuestProgress>>();

// Achievement progress per user: userId → Map<achievementId, AchievementProgress>
const userAchievementProgress = new Map<number, Map<number, AchievementProgress>>();

// Cumulative counters for achievements: userId → Map<conditionType, number>
const userCumulativeStats = new Map<number, Map<string, number>>();

// User items (character shards, materials): userId → Map<itemKey, UserItem>
const userItemsMap = new Map<number, Map<string, UserItem>>();
let userItemIdSeq = 1;

// Arena defense team: userId → userCharacterId[]
const arenaDefenseTeam = new Map<number, number[]>();

// Daily login: userId → DailyLoginData
const dailyLogin = new Map<number, DailyLoginData>();

let userIdSeq = 1;
let userCharacterIdSeq = 1;
let battleIdSeq = 1;
let guildIdSeq = 1;

const guilds: Array<{
  id: number;
  name: string;
  leaderId: number;
  level: number;
  description?: string;
  maxMembers: number;
  createdAt: string;
}> = [];

// ============================================================
// Shop Items (PRD aligned)
// ============================================================
const shopItems = [
  { id: 1, name: 'EXP Crystal (Small)', description: 'Grants 100 EXP to a character', item_type: 'material', currency_type: 'gold', price: 2000, stock: 5, daily_limit: 5 },
  { id: 2, name: 'EXP Crystal (Medium)', description: 'Grants 500 EXP to a character', item_type: 'material', currency_type: 'gold', price: 5000, stock: 3, daily_limit: 3 },
  { id: 3, name: 'Awakening Stone', description: 'Used to awaken characters', item_type: 'material', currency_type: 'gold', price: 3000, stock: 3, daily_limit: 3 },
  { id: 4, name: 'Energy ×10', description: 'Recover 10 energy', item_type: 'energy', currency_type: 'gold', price: 1500, stock: 5, daily_limit: 5 },
  { id: 5, name: 'Summon Scroll', description: 'Normal summon ×1', item_type: 'material', currency_type: 'crystal', price: 100, stock: 999, daily_limit: 999 },
];

// ============================================================
// Daily Quest templates
// ============================================================
const dailyQuestTemplates = [
  { id: 1, type: 'daily' as const, title: 'Daily Login', description: 'Log in today', condition: 'login', goal: 1, rewards: [{ type: 'currency', name: 'gold', quantity: 1000 }] },
  { id: 2, type: 'daily' as const, title: 'Clear 3 Dungeons', description: 'Complete any dungeon 3 times', condition: 'dungeon_clear', goal: 3, rewards: [{ type: 'currency', name: 'crystal', quantity: 30 }] },
  { id: 3, type: 'daily' as const, title: 'Summon 1 Time', description: 'Perform a summon', condition: 'summon', goal: 1, rewards: [{ type: 'currency', name: 'gold', quantity: 2000 }] },
  { id: 4, type: 'daily' as const, title: 'Level Up a Character', description: 'Level up any character once', condition: 'level_up', goal: 1, rewards: [{ type: 'currency', name: 'crystal', quantity: 20 }] },
];

// ============================================================
// Weekly Quest templates
// ============================================================
const weeklyQuestTemplates: QuestTemplate[] = [
  { id: 101, type: 'weekly', title: 'Clear 10 Dungeons', description: 'Complete any dungeon 10 times this week', condition: 'dungeon_clear', goal: 10, rewards: [{ type: 'currency', name: 'crystal', quantity: 50 }] },
  { id: 102, type: 'weekly', title: 'Summon 5 Times', description: 'Perform 5 summons this week', condition: 'summon', goal: 5, rewards: [{ type: 'currency', name: 'gold', quantity: 10000 }] },
  { id: 103, type: 'weekly', title: 'Level Up 3 Characters', description: 'Level up any 3 characters this week', condition: 'level_up', goal: 3, rewards: [{ type: 'currency', name: 'crystal', quantity: 30 }] },
  { id: 104, type: 'weekly', title: 'Win 5 Arena Battles', description: 'Win 5 battles in Arena this week', condition: 'arena_win', goal: 5, rewards: [{ type: 'currency', name: 'crystal', quantity: 80 }] },
];

// ============================================================
// Achievement templates
// ============================================================
const achievementTemplates: QuestTemplate[] = [
  { id: 201, type: 'achievement', title: 'First Victory', description: 'Clear your first dungeon', condition: 'dungeon_clear_total', goal: 1, rewards: [{ type: 'currency', name: 'crystal', quantity: 100 }] },
  { id: 202, type: 'achievement', title: 'Summoner Beginner', description: 'Summon 10 characters', condition: 'summon_total', goal: 10, rewards: [{ type: 'currency', name: 'crystal', quantity: 50 }] },
  { id: 203, type: 'achievement', title: 'Summoner Intermediate', description: 'Summon 50 characters', condition: 'summon_total', goal: 50, rewards: [{ type: 'currency', name: 'crystal', quantity: 200 }] },
  { id: 204, type: 'achievement', title: 'Dungeon Explorer', description: 'Clear 10 different dungeons', condition: 'dungeon_clear_total', goal: 10, rewards: [{ type: 'currency', name: 'crystal', quantity: 100 }] },
  { id: 205, type: 'achievement', title: 'Dungeon Master', description: 'Clear 30 different dungeons', condition: 'dungeon_clear_total', goal: 30, rewards: [{ type: 'currency', name: 'crystal', quantity: 300 }] },
  { id: 206, type: 'achievement', title: 'Power Leveler', description: 'Level up characters 20 times total', condition: 'level_up_total', goal: 20, rewards: [{ type: 'currency', name: 'gold', quantity: 20000 }] },
  { id: 207, type: 'achievement', title: 'Loyal Player', description: 'Log in 7 consecutive days', condition: 'login_streak', goal: 7, rewards: [{ type: 'currency', name: 'crystal', quantity: 200 }] },
];

// ============================================================
// Persistence helper
// ============================================================
const persist = (task: () => Promise<void>): void => {
  void task().catch((error) => {
    console.error('[db-persist] failed:', error);
  });
};

// ============================================================
// Energy regen
// ============================================================
const maybeRegenEnergy = (user: User): void => {
  if (user.energy >= user.maxEnergy) {
    return;
  }

  const lastUpdatedMs = Date.parse(user.lastEnergyUpdate);
  if (!Number.isFinite(lastUpdatedMs)) {
    user.lastEnergyUpdate = now();
    return;
  }

  const intervalMs = Math.max(1, env.energyRegenMinutes) * 60 * 1000;
  const currentMs = Date.now();
  const elapsedMs = currentMs - lastUpdatedMs;

  if (elapsedMs < intervalMs) {
    return;
  }

  const energyToAdd = Math.floor(elapsedMs / intervalMs);
  if (energyToAdd <= 0) {
    return;
  }

  const previousEnergy = user.energy;
  user.energy = Math.min(user.maxEnergy, user.energy + energyToAdd);
  if (user.energy === previousEnergy) {
    return;
  }

  const consumedIntervals = user.energy - previousEnergy;
  const nextTickMs = lastUpdatedMs + consumedIntervals * intervalMs;
  user.lastEnergyUpdate = new Date(nextTickMs).toISOString();
  user.updatedAt = now();

  persist(async () => {
    await db.update(usersTable)
      .set({
        energy: user.energy,
        lastEnergyUpdate: user.lastEnergyUpdate,
        updatedAt: user.updatedAt,
      })
      .where(eq(usersTable.id, user.id));
  });
};

// ============================================================
// DB mapping helpers
// ============================================================
const mapCharacterFromDb = (row: typeof charactersTable.$inferSelect): Character => ({
  id: row.id,
  name: row.name,
  grade: row.grade,
  element: row.element,
  class: row.class,
  base_hp: row.baseHp,
  base_atk: row.baseAtk,
  base_def: row.baseDef,
  base_spd: row.baseSpd,
  base_crt: row.baseCrt,
  base_crt_dmg: row.baseCrtDmg,
  base_acc: row.baseAcc,
  base_res: row.baseRes,
  skill_1_id: row.skill1Id || 0,
  skill_2_id: row.skill2Id || 0,
  skill_3_id: row.skill3Id || 0,
  skill_4_id: row.skill4Id || 0,
  image_url: row.imageUrl || '',
});

const mapUserCharacterFromDb = (row: typeof userCharactersTable.$inferSelect): UserCharacter => ({
  id: row.id,
  user_id: row.userId,
  character_id: row.characterId,
  level: row.level,
  exp: row.exp,
  current_hp: row.currentHp,
  current_atk: row.currentAtk,
  current_def: row.currentDef,
  current_spd: row.currentSpd,
  crit_rate: Number(row.critRate),
  crit_damage: Number(row.critDamage),
  accuracy: Number(row.accuracy),
  resistance: Number(row.resistance),
  skill_1_level: row.skill1Level,
  skill_2_level: row.skill2Level,
  skill_3_level: row.skill3Level,
  skill_4_level: row.skill4Level,
  awakened: row.awakened,
  obtained_at: row.obtainedAt,
});

// ============================================================
// DB hydration
// ============================================================
const hydrateFromDb = async (): Promise<void> => {
  try {
    const [dbUsers, dbCharacters, dbDungeons, dbUserChars, dbParty, dbGuilds, dbGuildMembers, dbShopItems, dbQuests, dbDungeonProgress, dbUserItems] = await Promise.all([
      db.select().from(usersTable),
      db.select().from(charactersTable),
      db.select().from(dungeonsTable),
      db.select().from(userCharactersTable),
      db.select().from(partyMembersTable).orderBy(asc(partyMembersTable.slotIndex)),
      db.select().from(guildsTable),
      db.select().from(guildMembersTable),
      db.select().from(shopItemsTable).where(eq(shopItemsTable.isActive, true)),
      db.select().from(questsTable).where(and(eq(questsTable.isActive, true), eq(questsTable.questType, 'daily'))),
      db.select().from(userDungeonProgressTable).catch(() => [] as (typeof userDungeonProgressTable.$inferSelect)[]),
      db.select().from(userItemsTable).catch(() => [] as (typeof userItemsTable.$inferSelect)[]),
    ]);

    if (dbUsers.length > 0) {
      users.clear();
      usersByUsername.clear();
      usersByEmail.clear();

      dbUsers.forEach((row) => {
        const user: User = {
          id: row.id,
          username: row.username,
          email: row.email,
          passwordHash: row.passwordHash,
          level: row.level,
          exp: row.exp,
          crystals: row.crystals,
          gold: row.gold,
          energy: row.energy,
          maxEnergy: row.maxEnergy,
          lastEnergyUpdate: row.lastEnergyUpdate,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        };
        users.set(user.id, user);
        usersByUsername.set(user.username.toLowerCase(), user.id);
        usersByEmail.set(user.email.toLowerCase(), user.id);
      });

      userIdSeq = Math.max(...dbUsers.map((row) => row.id), 0) + 1;
    }

    if (dbCharacters.length > 0) {
      characters.length = 0;
      characters.push(...dbCharacters.map(mapCharacterFromDb));
    }

    if (dbDungeons.length > 0) {
      dungeons.length = 0;
      dungeons.push(...dbDungeons.map((row) => {
        const rewardsArr = Array.isArray(row.rewards) ? row.rewards as Array<{ type: string; name?: string; amount: number }> : [];
        // Extract crystal and shard rewards from JSONB rewards array
        const crystalReward = rewardsArr.find((r) => r.name === 'crystal' || r.type === 'crystal')?.amount || 0;
        const shardReward = rewardsArr.find((r) => r.name === 'character_shard' || r.type === 'character_shard')?.amount || 0;
        return {
          id: row.id,
          name: row.name,
          dungeon_type: row.dungeonType,
          difficulty: row.difficulty,
          chapter: row.chapter,
          stage: row.stage,
          energy_cost: row.energyCost,
          stages: Array.isArray(row.stages) ? row.stages as Array<{ stage_number: number; waves: number }> : [],
          rewards: rewardsArr,
          exp_reward: row.expReward,
          gold_reward: row.goldReward,
          crystal_reward: crystalReward,
          character_shard_reward: shardReward,
          // Regenerate wave data from chapter/stage/difficulty
          wave_data: makeWaveData(row.chapter, row.stage, row.difficulty),
        };
      }));
    }

    if (dbUserChars.length > 0) {
      userCharacters.clear();
      dbUserChars.forEach((row) => {
        const mapped = mapUserCharacterFromDb(row);
        const list = userCharacters.get(mapped.user_id) || [];
        list.push(mapped);
        userCharacters.set(mapped.user_id, list);
      });
      userCharacterIdSeq = Math.max(...dbUserChars.map((row) => row.id), 0) + 1;
    }

    if (dbParty.length > 0) {
      userParty.clear();
      dbParty.forEach((row) => {
        const members = userParty.get(row.userId) || [];
        members[row.slotIndex] = row.userCharacterId;
        userParty.set(row.userId, members.filter((value) => typeof value === 'number'));
      });
    }

    if (dbGuilds.length > 0) {
      guilds.length = 0;
      guilds.push(...dbGuilds.map((row) => ({
        id: row.id,
        name: row.name,
        leaderId: row.leaderId,
        level: row.level,
        description: row.description || undefined,
        maxMembers: row.maxMembers,
        createdAt: row.createdAt,
      })));
      guildIdSeq = Math.max(...dbGuilds.map((row) => row.id), 0) + 1;
    }

    if (dbGuildMembers.length > 0) {
      userGuild.clear();
      dbGuildMembers.forEach((row) => {
        userGuild.set(row.userId, row.guildId);
      });
    }

    if (dbShopItems.length > 0) {
      shopItems.length = 0;
      shopItems.push(...dbShopItems.map((row) => ({
        id: row.id,
        name: row.name,
        description: row.description || '',
        item_type: row.itemType,
        currency_type: row.currencyType,
        price: row.price,
        stock: row.stock,
        daily_limit: row.stock,
      })));
    }

    // Load dungeon progress
    if (dbDungeonProgress.length > 0) {
      dungeonCleared.clear();
      dbDungeonProgress.forEach((row) => {
        let set = dungeonCleared.get(row.userId);
        if (!set) {
          set = new Set();
          dungeonCleared.set(row.userId, set);
        }
        set.add(row.dungeonId);
      });
    }

    // Load user items (shards, materials)
    if (dbUserItems.length > 0) {
      userItemsMap.clear();
      dbUserItems.forEach((row) => {
        let items = userItemsMap.get(row.userId);
        if (!items) {
          items = new Map();
          userItemsMap.set(row.userId, items);
        }
        const key = `${row.itemType}:${row.itemId}`;
        items.set(key, {
          id: row.id,
          user_id: row.userId,
          item_type: row.itemType as UserItem['item_type'],
          item_id: row.itemId,
          item_name: row.itemName,
          quantity: row.quantity,
          created_at: row.createdAt,
          updated_at: row.updatedAt,
        });
      });
      userItemIdSeq = Math.max(...dbUserItems.map((r) => r.id), 0) + 1;
    }
  } catch (error) {
    console.warn('[db-hydrate] fallback to in-memory seed:', error);
  }
};

// ============================================================
// User character factory
// ============================================================
const makeUserCharacter = (userId: number, character: Character): UserCharacter => ({
  id: userCharacterIdSeq++,
  user_id: userId,
  character_id: character.id,
  level: 1,
  exp: 0,
  current_hp: character.base_hp,
  current_atk: character.base_atk,
  current_def: character.base_def,
  current_spd: character.base_spd,
  crit_rate: character.base_crt,
  crit_damage: character.base_crt_dmg,
  accuracy: character.base_acc,
  resistance: character.base_res,
  skill_1_level: 1,
  skill_2_level: 1,
  skill_3_level: 1,
  skill_4_level: 1,
  awakened: 0,
  obtained_at: now(),
});

// ============================================================
// Quest progress helpers
// ============================================================
const ensureUserQuests = (userId: number): Map<number, UserQuestProgress> => {
  let quests = userQuestProgress.get(userId);
  if (!quests) {
    quests = new Map();
    userQuestProgress.set(userId, quests);
  }
  const today = todayKey();
  // Reset if stale
  dailyQuestTemplates.forEach((template) => {
    const existing = quests!.get(template.id);
    if (!existing || existing.reset_at !== today) {
      quests!.set(template.id, {
        quest_id: template.id,
        progress: 0,
        is_completed: false,
        is_claimed: false,
        reset_at: today,
      });
    }
  });
  return quests;
};

// ─── Weekly Quest helpers ───────────────────────────────────
const ensureUserWeeklyQuests = (userId: number): Map<number, UserQuestProgress> => {
  let map = userWeeklyProgress.get(userId);
  if (!map) {
    map = new Map();
    userWeeklyProgress.set(userId, map);
  }
  const wk = weekKey();
  weeklyQuestTemplates.forEach((template) => {
    const existing = map!.get(template.id);
    if (!existing || existing.reset_at !== wk) {
      map!.set(template.id, {
        quest_id: template.id,
        progress: 0,
        is_completed: false,
        is_claimed: false,
        reset_at: wk,
      });
    }
  });
  return map;
};

// ─── Achievement helpers ─────────────────────────────────────
const ensureUserAchievements = (userId: number): Map<number, AchievementProgress> => {
  let map = userAchievementProgress.get(userId);
  if (!map) {
    map = new Map();
    userAchievementProgress.set(userId, map);
    achievementTemplates.forEach((tmpl) => {
      map!.set(tmpl.id, { quest_id: tmpl.id, progress: 0, is_completed: false, is_claimed: false });
    });
  }
  return map;
};

const advanceQuestProgress = (userId: number, condition: string, amount: number = 1): void => {
  // Daily quests
  const quests = ensureUserQuests(userId);
  dailyQuestTemplates.forEach((template) => {
    if (template.condition !== condition) return;
    const progress = quests.get(template.id);
    if (!progress || progress.is_completed) return;
    progress.progress = Math.min(progress.progress + amount, template.goal);
    if (progress.progress >= template.goal) progress.is_completed = true;
  });

  // Weekly quests
  const weekly = ensureUserWeeklyQuests(userId);
  weeklyQuestTemplates.forEach((template) => {
    if (template.condition !== condition) return;
    const progress = weekly.get(template.id);
    if (!progress || progress.is_completed) return;
    progress.progress = Math.min(progress.progress + amount, template.goal);
    if (progress.progress >= template.goal) progress.is_completed = true;
  });

  // Achievements (cumulative condition mapping)
  const cumStats = userCumulativeStats.get(userId) || new Map<string, number>();
  userCumulativeStats.set(userId, cumStats);
  // Map event condition → cumulative stat key
  const cumKey: Record<string, string> = {
    dungeon_clear: 'dungeon_clear_total',
    summon: 'summon_total',
    level_up: 'level_up_total',
    login: 'login_streak',
  };
  const statKey = cumKey[condition];
  if (statKey) {
    cumStats.set(statKey, (cumStats.get(statKey) || 0) + amount);
  }
  const achievements = ensureUserAchievements(userId);
  achievementTemplates.forEach((tmpl) => {
    const prog = achievements.get(tmpl.id);
    if (!prog || prog.is_completed) return;
    // Determine current cumulative value
    let current = 0;
    if (tmpl.condition.endsWith('_total') || tmpl.condition === 'login_streak') {
      current = cumStats.get(tmpl.condition) || 0;
    } else if (cumKey[tmpl.condition]) {
      current = cumStats.get(cumKey[tmpl.condition]) || 0;
    }
    if (current <= 0) return; // not related to this event
    prog.progress = Math.min(current, tmpl.goal);
    if (current >= tmpl.goal) prog.is_completed = true;
  });
};

// ─── User level-up helper ────────────────────────────────────
const getUserExpToNextLevel = (level: number): number => level * 500;
const checkUserLevelUp = (user: User): void => {
  while (user.exp >= getUserExpToNextLevel(user.level)) {
    user.exp -= getUserExpToNextLevel(user.level);
    user.level += 1;
    // On level-up, increase max energy by 1
    if (user.level % 5 === 0) {
      user.maxEnergy = Math.min(user.maxEnergy + 5, 200);
    }
  }
};

const advanceWeeklyQuestProgress = (userId: number, condition: string, amount: number = 1): void => {
  const quests = ensureUserWeeklyQuests(userId);
  weeklyQuestTemplates.forEach((template) => {
    if (template.condition !== condition) return;
    const progress = quests.get(template.id);
    if (!progress || progress.is_completed) return;
    progress.progress = Math.min(progress.progress + amount, template.goal);
    if (progress.progress >= template.goal) progress.is_completed = true;
  });
};

const ensureUserStats = (userId: number): Map<string, number> => {
  let stats = userCumulativeStats.get(userId);
  if (!stats) {
    stats = new Map();
    userCumulativeStats.set(userId, stats);
  }
  return stats;
};

const advanceCumulativeStat = (userId: number, condition: string, amount: number = 1): void => {
  const stats = ensureUserStats(userId);
  const prev = stats.get(condition) || 0;
  stats.set(condition, prev + amount);
  const total = stats.get(condition)!;

  const ach = ensureUserAchievements(userId);
  achievementTemplates.forEach((template) => {
    if (template.condition !== condition) return;
    const progress = ach.get(template.id);
    if (!progress || progress.is_completed) return;
    progress.progress = Math.min(total, template.goal);
    if (progress.progress >= template.goal) progress.is_completed = true;
  });
};

// ============================================================
// User items (shards, materials) helpers
// ============================================================
const grantUserItem = (userId: number, itemType: UserItem['item_type'], itemId: number, itemName: string, quantity: number): void => {
  if (quantity <= 0) return;
  let items = userItemsMap.get(userId);
  if (!items) {
    items = new Map();
    userItemsMap.set(userId, items);
  }
  const key = `${itemType}:${itemId}`;
  const existing = items.get(key);
  if (existing) {
    existing.quantity += quantity;
    existing.updated_at = now();
    persist(async () => {
      await db.update(userItemsTable)
        .set({ quantity: existing.quantity, updatedAt: existing.updated_at })
        .where(eq(userItemsTable.id, existing.id));
    });
  } else {
    const newItem: UserItem = {
      id: userItemIdSeq++,
      user_id: userId,
      item_type: itemType,
      item_id: itemId,
      item_name: itemName,
      quantity,
      created_at: now(),
      updated_at: now(),
    };
    items.set(key, newItem);
    persist(async () => {
      await db.insert(userItemsTable).values({
        id: newItem.id,
        userId: newItem.user_id,
        itemType: newItem.item_type,
        itemId: newItem.item_id,
        itemName: newItem.item_name,
        quantity: newItem.quantity,
        createdAt: newItem.created_at,
        updatedAt: newItem.updated_at,
      }).onConflictDoUpdate({
        target: [userItemsTable.userId, userItemsTable.itemType, userItemsTable.itemId],
        set: { quantity: sql`user_items.quantity + ${quantity}`, updatedAt: now() },
      });
    });
  }
};

// ============================================================
// User level-up helper
// ============================================================
const USER_EXP_PER_LEVEL = (level: number): number => level * 500;

const maybeUserLevelUp = (user: User): void => {
  let leveled = false;
  while (user.exp >= USER_EXP_PER_LEVEL(user.level)) {
    user.exp -= USER_EXP_PER_LEVEL(user.level);
    user.level += 1;
    // Increase max energy by 1 per level
    user.maxEnergy = Math.min(200, user.maxEnergy + 1);
    leveled = true;
  }
  if (leveled) {
    user.updatedAt = now();
    persist(async () => {
      await db.update(usersTable)
        .set({ level: user.level, exp: user.exp, maxEnergy: user.maxEnergy, updatedAt: user.updatedAt })
        .where(eq(usersTable.id, user.id));
    });
  }
};

// ============================================================
// Battle victory reward helper (called once when battle ends in victory)
// ============================================================
const grantBattleVictoryRewards = (userId: number, dungeon: Dungeon): void => {
  const user = users.get(userId);
  if (!user) return;

  user.gold += dungeon.gold_reward;
  user.exp += dungeon.exp_reward;
  user.crystals += dungeon.crystal_reward || 0;
  user.updatedAt = now();

  // Grant character shards if any
  if (dungeon.character_shard_reward && dungeon.character_shard_reward > 0) {
    grantUserItem(userId, 'character_shard', dungeon.id, `${dungeon.name} Shard`, dungeon.character_shard_reward);
  }

  // Advance daily quest
  advanceQuestProgress(userId, 'dungeon_clear');
  // Advance weekly quest
  advanceWeeklyQuestProgress(userId, 'dungeon_clear');
  // Advance cumulative stats for achievements
  advanceCumulativeStat(userId, 'dungeon_clear_total');

  // Apply user level-up
  maybeUserLevelUp(user);

  // Persist user currency changes to DB
  persist(async () => {
    await db.update(usersTable)
      .set({ gold: user.gold, exp: user.exp, crystals: user.crystals, level: user.level, maxEnergy: user.maxEnergy, updatedAt: user.updatedAt })
      .where(eq(usersTable.id, userId));
  });
};

// ============================================================
// Battle ATB helpers
// ============================================================
const buildSkillsForUnit = (charBase: Character): BattleUnit['skills'] => {
  const skillIds = [charBase.skill_1_id, charBase.skill_2_id, charBase.skill_3_id, charBase.skill_4_id];
  return skillIds.map((skillId, idx) => {
    const def = skillDefinitions.find((s) => s.id === skillId);
    return {
      skill_id: skillId,
      slot_index: idx,
      name: def?.name || 'Unknown',
      skill_type: def?.skill_type || 'damage',
      target_type: def?.target_type || 'single',
      multiplier: def?.multiplier || 1,
      max_cooldown: def?.max_cooldown || 0,
      current_cd: 0,
      effects: def?.effects || '',
    };
  });
};

const buildEnemySkills = (): BattleUnit['skills'] => {
  return [{
    skill_id: 9001,
    slot_index: 0,
    name: 'Claw',
    skill_type: 'damage',
    target_type: 'single',
    multiplier: 1.0,
    max_cooldown: 0,
    current_cd: 0,
    effects: 'enemy basic attack',
  }, {
    skill_id: 9003,
    slot_index: 1,
    name: 'Slam',
    skill_type: 'damage',
    target_type: 'single',
    multiplier: 1.5,
    max_cooldown: 2,
    current_cd: 0,
    effects: 'enemy strong attack',
  }, {
    skill_id: 9004,
    slot_index: 2,
    name: 'Roar',
    skill_type: 'buff',
    target_type: 'self',
    multiplier: 1.0,
    max_cooldown: 3,
    current_cd: 0,
    effects: 'ATK up',
  }];
};

// ============================================================
// Buff/Debuff stat helpers
// ============================================================
const BUFF_TYPES = new Set(['atk_up', 'def_up', 'spd_up', 'immunity', 'shield', 'invincible', 'endure']);
const STATUS_EFFECTS = new Set(['stun', 'poison', 'burn', 'freeze', 'sleep', 'silence']);

const getEffectiveATK = (unit: BattleUnit): number => {
  let mult = 1.0;
  unit.buffs.forEach((b) => { if (b.effect_type === 'atk_up') mult += b.value / 100; });
  unit.debuffs.forEach((d) => { if (d.effect_type === 'atk_down') mult -= d.value / 100; });
  return Math.max(1, Math.round(unit.atk * Math.max(0.1, mult)));
};

const getEffectiveDEF = (unit: BattleUnit): number => {
  let mult = 1.0;
  unit.buffs.forEach((b) => { if (b.effect_type === 'def_up') mult += b.value / 100; });
  unit.debuffs.forEach((d) => { if (d.effect_type === 'def_down') mult -= d.value / 100; });
  return Math.max(0, Math.round(unit.def * Math.max(0, mult)));
};

const getEffectiveSPD = (unit: BattleUnit): number => {
  let mult = 1.0;
  unit.buffs.forEach((b) => { if (b.effect_type === 'spd_up') mult += b.value / 100; });
  unit.debuffs.forEach((d) => { if (d.effect_type === 'spd_down') mult -= d.value / 100; });
  return Math.max(10, Math.round(unit.spd * Math.max(0.1, mult)));
};

/** Try to apply an effect (buff or debuff) from skill to target unit.
 *  Returns the effect_type if applied, null if missed/resisted. */
const tryApplyEffect = (
  actor: BattleUnit,
  target: BattleUnit,
  skillDef: SkillDefinition,
): string | null => {
  if (!skillDef.effect_type) return null;

  const chance = skillDef.effect_chance ?? 100;
  // Accuracy vs Resistance check
  const finalChance = Math.min(100, Math.max(0, chance + actor.accuracy - target.resistance));
  if (Math.random() * 100 >= finalChance) return null;

  const duration = skillDef.effect_duration ?? 2;
  const value = skillDef.effect_value ?? 0;
  const isBuff = BUFF_TYPES.has(skillDef.effect_type);

  const effect = {
    effect_type: skillDef.effect_type,
    value,
    duration,
    source_id: actor.unit_id,
  };

  if (isBuff) {
    // Overwrite same type buff (refresh)
    target.buffs = target.buffs.filter((b) => b.effect_type !== skillDef.effect_type);
    target.buffs.push(effect);
  } else {
    // Check immunity
    if (target.buffs.some((b) => b.effect_type === 'immunity')) return 'resisted';
    // Overwrite same type debuff (refresh)
    target.debuffs = target.debuffs.filter((d) => d.effect_type !== skillDef.effect_type);
    target.debuffs.push(effect);
  }

  return skillDef.effect_type;
};

/** Decay buff/debuff durations and apply DOT. Returns true if unit should skip its turn. */
const processStatusEffectsForUnit = (
  unit: BattleUnit,
  battle: BattleState,
): boolean => {
  let skipTurn = false;

  // Process debuffs
  for (let i = unit.debuffs.length - 1; i >= 0; i--) {
    const d = unit.debuffs[i];

    if (d.effect_type === 'stun' || d.effect_type === 'freeze') {
      skipTurn = true;
    } else if (d.effect_type === 'sleep') {
      skipTurn = true;
      // Sleep wake on hit is handled in executeAction damage section
    } else if (d.effect_type === 'poison') {
      const dotDmg = Math.max(1, Math.round(unit.max_hp * 0.05));
      unit.hp = Math.max(0, unit.hp - dotDmg);
      if (unit.hp <= 0) unit.is_alive = false;
      battle.events.unshift({
        turn_number: battle.turn_counter,
        actor_id: d.source_id,
        actor_name: 'Poison',
        skill_name: 'Poison Damage',
        skill_id: 0,
        event_type: 'dot',
        targets: [{ target_id: unit.unit_id, target_name: unit.name, damage: dotDmg, hp_after: unit.hp }],
      });
    } else if (d.effect_type === 'burn') {
      const dotDmg = Math.max(1, Math.round(unit.max_hp * 0.03));
      unit.hp = Math.max(0, unit.hp - dotDmg);
      if (unit.hp <= 0) unit.is_alive = false;
      battle.events.unshift({
        turn_number: battle.turn_counter,
        actor_id: d.source_id,
        actor_name: 'Burn',
        skill_name: 'Burn Damage',
        skill_id: 0,
        event_type: 'dot',
        targets: [{ target_id: unit.unit_id, target_name: unit.name, damage: dotDmg, hp_after: unit.hp }],
      });
    }

    d.duration -= 1;
    if (d.duration <= 0) unit.debuffs.splice(i, 1);
  }

  // Decay buffs
  for (let i = unit.buffs.length - 1; i >= 0; i--) {
    unit.buffs[i].duration -= 1;
    if (unit.buffs[i].duration <= 0) unit.buffs.splice(i, 1);
  }

  // Silence: can only use basic attack
  if (unit.debuffs.some((d) => d.effect_type === 'silence')) {
    // handled during pickAiAction by limiting to slot 0
  }

  return skipTurn;
};

const calculateDamage = (attacker: BattleUnit, defender: BattleUnit, skillMultiplier: number): { damage: number; isCrit: boolean } => {
  const effATK = getEffectiveATK(attacker);
  const effDEF = getEffectiveDEF(defender);
  const hasGlancing = attacker.debuffs.some((d) => d.effect_type === 'glancing');
  let isCrit = Math.random() * 100 < attacker.crit_rate;
  if (hasGlancing) isCrit = false; // Glancing hit prevents crits
  const critMultiplier = isCrit ? 1 + attacker.crit_damage / 100 : 1;
  const glancingMultiplier = hasGlancing ? 0.7 : 1.0;
  const elemBonus = getElementBonus(attacker.element, defender.element);
  const rawDamage = effATK * skillMultiplier * elemBonus * critMultiplier * glancingMultiplier - effDEF * 0.35;
  const damage = Math.max(1, Math.round(rawDamage));
  return { damage, isCrit };
};

const pickAiAction = (unit: BattleUnit, aliveEnemies: BattleUnit[], aliveAllies: BattleUnit[]): { skillIdx: number; targets: BattleUnit[] } => {
  // Taunt: forced to basic attack the taunt source
  const tauntDebuff = unit.debuffs.find((d) => d.effect_type === 'taunt');
  if (tauntDebuff) {
    const tauntSource = [...aliveEnemies, ...aliveAllies].find((u) => u.unit_id === tauntDebuff.source_id && u.is_alive);
    if (tauntSource) return { skillIdx: 0, targets: [tauntSource] };
  }

  const isSilenced = unit.debuffs.some((d) => d.effect_type === 'silence');
  const maxSkill = isSilenced ? 0 : unit.skills.length - 1;

  // Try to use highest available skill first
  for (let i = maxSkill; i >= 1; i--) {
    const skill = unit.skills[i];
    if (skill && skill.current_cd === 0) {
      if (skill.target_type === 'all_enemies') return { skillIdx: i, targets: aliveEnemies };
      if (skill.target_type === 'all_allies' || skill.target_type === 'self') return { skillIdx: i, targets: aliveAllies };
      // single target - pick lowest HP enemy
      const target = [...aliveEnemies].sort((a, b) => a.hp - b.hp)[0];
      return { skillIdx: i, targets: target ? [target] : aliveEnemies.slice(0, 1) };
    }
  }
  // Fallback to basic attack
  const target = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
  return { skillIdx: 0, targets: target ? [target] : [] };
};

const tickCooldowns = (unit: BattleUnit): void => {
  unit.skills.forEach((skill) => {
    if (skill.current_cd > 0) skill.current_cd -= 1;
  });
};

const executeAction = (
  battle: BattleState,
  actor: BattleUnit,
  skillIdx: number,
  targetUnits: BattleUnit[],
): void => {
  const skill = actor.skills[skillIdx] || actor.skills[0];
  const multiplier = skill.multiplier;
  const skillDef = skillDefinitions.find((s) => s.id === skill.skill_id);

  // Set cooldown
  if (skill.max_cooldown > 0) {
    skill.current_cd = skill.max_cooldown;
  }

  // Tick cooldowns for this unit's turn
  tickCooldowns(actor);

  const eventTargets: BattleState['events'][0]['targets'] = [];

  if (skill.skill_type === 'heal') {
    // Healing
    const healTargets = skill.target_type === 'self' ? [actor] : targetUnits;
    healTargets.forEach((target) => {
      if (!target.is_alive) return;
      const healAmount = Math.round(getEffectiveATK(actor) * multiplier * 0.8);
      target.hp = Math.min(target.max_hp, target.hp + healAmount);
      eventTargets.push({
        target_id: target.unit_id,
        target_name: target.name,
        heal: healAmount,
        hp_after: target.hp,
      });
    });
  } else if (skill.skill_type === 'buff') {
    // Buff skill: apply effect + minor HP restore as visual feedback
    const buffTargets = skill.target_type === 'self' ? [actor] : targetUnits;
    buffTargets.forEach((target) => {
      if (!target.is_alive) return;
      const applied: string[] = [];
      if (skillDef?.effect_type) {
        const result = tryApplyEffect(actor, target, skillDef);
        if (result && result !== 'resisted') applied.push(result);
      }
      eventTargets.push({
        target_id: target.unit_id,
        target_name: target.name,
        hp_after: target.hp,
        applied,
      });
    });
  } else if (skill.skill_type === 'debuff') {
    // Debuff skill: no damage, just apply debuffs
    targetUnits.forEach((target) => {
      if (!target.is_alive) return;
      const applied: string[] = [];
      const resisted: string[] = [];
      if (skillDef?.effect_type) {
        const result = tryApplyEffect(actor, target, skillDef);
        if (result === 'resisted') resisted.push(skillDef.effect_type);
        else if (result) applied.push(result);
      }
      eventTargets.push({
        target_id: target.unit_id,
        target_name: target.name,
        hp_after: target.hp,
        applied,
        resisted,
      });
    });
  } else {
    // Damage
    targetUnits.forEach((target) => {
      if (!target.is_alive) return;
      const { damage, isCrit } = calculateDamage(actor, target, multiplier);
      target.hp = Math.max(0, target.hp - damage);
      let isKill = target.hp <= 0;

      // Endure buff: survive lethal damage with 1 HP
      if (isKill) {
        const endureIdx = target.buffs.findIndex((b) => b.effect_type === 'endure');
        if (endureIdx >= 0) {
          target.hp = 1;
          isKill = false;
          target.buffs.splice(endureIdx, 1);
        }
      }
      if (isKill) target.is_alive = false;

      // Sleep wake: 50% chance to wake when hit
      if (!isKill) {
        const sleepIdx = target.debuffs.findIndex((d) => d.effect_type === 'sleep');
        if (sleepIdx >= 0 && Math.random() < 0.5) {
          target.debuffs.splice(sleepIdx, 1);
        }
      }

      // Side-effect application (e.g., burn on hit, poison on hit)
      const applied: string[] = [];
      const resisted: string[] = [];
      if (skillDef?.effect_type && !isKill) {
        const result = tryApplyEffect(actor, target, skillDef);
        if (result === 'resisted') resisted.push(skillDef.effect_type);
        else if (result) applied.push(result);
      }

      eventTargets.push({
        target_id: target.unit_id,
        target_name: target.name,
        damage,
        is_crit: isCrit,
        is_kill: isKill,
        hp_after: target.hp,
        applied: applied.length > 0 ? applied : undefined,
        resisted: resisted.length > 0 ? resisted : undefined,
      });
    });
  }

  battle.turn_counter += 1;
  battle.events.unshift({
    turn_number: battle.turn_counter,
    actor_id: actor.unit_id,
    actor_name: actor.name,
    skill_name: skill.name,
    skill_id: skill.skill_id,
    event_type: 'action',
    targets: eventTargets,
  });

  // Keep events list manageable
  if (battle.events.length > 30) battle.events.length = 30;

  // Reset ATB
  actor.atb_gauge = 0;
};

const advanceBattleTick = (battle: BattleState, ticks: number = 1): void => {
  const allUnits = [...battle.allies, ...battle.enemies];

  for (let t = 0; t < ticks; t++) {
    // Increase ATB for alive units using effective SPD
    allUnits.forEach((unit) => {
      if (!unit.is_alive) return;
      const effSpd = getEffectiveSPD(unit);
      unit.atb_gauge += (effSpd / 100) * battle.speed_multiplier;
    });

    // Process units that reached 100 ATB
    const readyUnits = allUnits
      .filter((u) => u.is_alive && u.atb_gauge >= 100)
      .sort((a, b) => getEffectiveSPD(b) - getEffectiveSPD(a));

    for (const unit of readyUnits) {
      if (!unit.is_alive) continue;

      // Process status effects at the start of this unit's turn
      const skipTurn = processStatusEffectsForUnit(unit, battle);

      // Check if unit died from DOT
      if (!unit.is_alive) {
        if (!battle.enemies.some((e) => e.is_alive)) {
          if (battle.current_wave < battle.total_waves) {
            battle.phase = 'wave_clear';
            battle.current_wave += 1;
          } else {
            battle.phase = 'battle_end';
          }
          return;
        }
        if (!battle.allies.some((a) => a.is_alive)) {
          battle.phase = 'battle_end';
          return;
        }
        continue;
      }

      if (skipTurn) {
        // Stunned: reset ATB and continue
        unit.atb_gauge = 0;
        continue;
      }

      const isAlly = unit.team === 'ally';
      const aliveEnemies = battle.enemies.filter((e) => e.is_alive);
      const aliveAllies = battle.allies.filter((a) => a.is_alive);

      // If manual mode and ally turn, pause for action select
      if (isAlly && !battle.auto_mode) {
        battle.phase = 'action_select';
        battle.active_unit_id = unit.unit_id;
        return;
      }

      // AI action (auto mode or enemy)
      const opponents = isAlly ? aliveEnemies : aliveAllies;
      const friendlies = isAlly ? aliveAllies : aliveEnemies;

      if (opponents.length === 0) break;

      const { skillIdx, targets } = pickAiAction(unit, opponents, friendlies);
      executeAction(battle, unit, skillIdx, targets);

      // Check wave clear
      if (!battle.enemies.some((e) => e.is_alive)) {
        if (battle.current_wave < battle.total_waves) {
          battle.phase = 'wave_clear';
          battle.current_wave += 1;
          return;
        }
        // Victory
        battle.phase = 'battle_end';
        return;
      }

      // Check defeat
      if (!battle.allies.some((a) => a.is_alive)) {
        battle.phase = 'battle_end';
        return;
      }
    }
  }
};

// ============================================================
// Data Store
// ============================================================
export const dataStore = {
  getSkillDefinition(skillId: number): SkillDefinition | undefined {
    return skillDefinitions.find((s) => s.id === skillId);
  },

  getCharacterById(characterId: number): Character | undefined {
    return characters.find((character) => character.id === characterId);
  },

  getAllCharacters(): Character[] {
    return characters;
  },

  createUser(username: string, email: string, passwordHash: string): User {
    const id = userIdSeq++;
    const user: User = {
      id,
      username,
      email,
      passwordHash,
      level: 1,
      exp: 0,
      crystals: 300,
      gold: 5000,
      energy: env.maxEnergy,
      maxEnergy: env.maxEnergy,
      lastEnergyUpdate: now(),
      createdAt: now(),
      updatedAt: now(),
    };

    users.set(id, user);
    usersByUsername.set(username.toLowerCase(), id);
    usersByEmail.set(email.toLowerCase(), id);

    const starterCharacters = [1, 2, 3, 4].map((characterId) => this.getCharacterById(characterId)!).map((character) => makeUserCharacter(id, character));
    userCharacters.set(id, starterCharacters);
    userParty.set(id, starterCharacters.map((entry) => entry.id).slice(0, 4));

    // Initialize quest progress with login quest auto-completed
    ensureUserQuests(id);
    advanceQuestProgress(id, 'login');
    ensureUserWeeklyQuests(id);
    ensureUserAchievements(id);

    persist(async () => {
      await db.insert(usersTable).values({
        id: user.id,
        username: user.username,
        email: user.email,
        passwordHash: user.passwordHash,
        level: user.level,
        exp: user.exp,
        crystals: user.crystals,
        gold: user.gold,
        energy: user.energy,
        maxEnergy: user.maxEnergy,
        lastEnergyUpdate: user.lastEnergyUpdate,
        lastLogin: user.updatedAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      });

      if (starterCharacters.length > 0) {
        await db.insert(userCharactersTable).values(starterCharacters.map((character) => ({
          id: character.id,
          userId: character.user_id,
          characterId: character.character_id,
          level: character.level,
          exp: character.exp,
          currentHp: character.current_hp,
          currentAtk: character.current_atk,
          currentDef: character.current_def,
          currentSpd: character.current_spd,
          critRate: String(character.crit_rate),
          critDamage: String(character.crit_damage),
          accuracy: String(character.accuracy),
          resistance: String(character.resistance),
          skill1Level: character.skill_1_level,
          skill2Level: character.skill_2_level,
          skill3Level: character.skill_3_level,
          skill4Level: character.skill_4_level,
          awakened: character.awakened,
          obtainedAt: character.obtained_at,
        })));

        await db.insert(partyMembersTable).values(starterCharacters.slice(0, 4).map((character, slotIndex) => ({
          userId: user.id,
          slotIndex,
          userCharacterId: character.id,
          createdAt: now(),
          updatedAt: now(),
        })));
      }
    });

    return user;
  },

  getUserByUsername(username: string): User | undefined {
    const id = usersByUsername.get(username.toLowerCase());
    return id ? users.get(id) : undefined;
  },

  getUserByEmail(email: string): User | undefined {
    const id = usersByEmail.get(email.toLowerCase());
    return id ? users.get(id) : undefined;
  },

  getUserById(userId: number): User | undefined {
    const user = users.get(userId);
    if (!user) {
      return undefined;
    }

    maybeRegenEnergy(user);
    return user;
  },

  toUserResponse(user: User): Record<string, unknown> {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      level: user.level,
      exp: user.exp,
      crystals: user.crystals,
      gold: user.gold,
      energy: user.energy,
      maxEnergy: user.maxEnergy,
      max_energy: user.maxEnergy,
      lastEnergyUpdate: user.lastEnergyUpdate,
      last_energy_update: user.lastEnergyUpdate,
      last_login: user.updatedAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  },

  updateProfile(userId: number, updates: { username?: string; email?: string }): User | null {
    const user = users.get(userId);
    if (!user) {
      return null;
    }

    if (updates.username && updates.username !== user.username) {
      usersByUsername.delete(user.username.toLowerCase());
      usersByUsername.set(updates.username.toLowerCase(), user.id);
      user.username = updates.username;
    }

    if (updates.email && updates.email !== user.email) {
      usersByEmail.delete(user.email.toLowerCase());
      usersByEmail.set(updates.email.toLowerCase(), user.id);
      user.email = updates.email;
    }

    user.updatedAt = now();

    persist(async () => {
      await db.update(usersTable)
        .set({
          username: user.username,
          email: user.email,
          updatedAt: user.updatedAt,
        })
        .where(eq(usersTable.id, userId));
    });

    return user;
  },

  getUserCharacters(userId: number): UserCharacter[] {
    return userCharacters.get(userId) || [];
  },

  getUserCharacterDetail(userId: number, userCharacterId: number): Record<string, unknown> | null {
    const entry = this.getUserCharacters(userId).find((character) => character.id === userCharacterId);
    if (!entry) {
      return null;
    }

    const base = this.getCharacterById(entry.character_id);
    if (!base) {
      return null;
    }

    return {
      ...entry,
      character_name: base.name,
      grade: base.grade,
      element: base.element,
      class: base.class,
      base_hp: base.base_hp,
      base_atk: base.base_atk,
      base_def: base.base_def,
      base_spd: base.base_spd,
      base_crt: base.base_crt,
      base_crt_dmg: base.base_crt_dmg,
      base_acc: base.base_acc,
      base_res: base.base_res,
      skill_1_id: base.skill_1_id,
      skill_2_id: base.skill_2_id,
      skill_3_id: base.skill_3_id,
      skill_4_id: base.skill_4_id,
      image_url: base.image_url,
      max_level: getMaxLevel(base.grade),
      exp_to_next: getExpToNext(entry.level),
    };
  },

  levelUpCharacter(userId: number, userCharacterId: number, expCrystals = 1): Record<string, unknown> | null {
    const user = this.getUserById(userId);
    if (!user) return null;

    const entry = this.getUserCharacters(userId).find((character) => character.id === userCharacterId);
    if (!entry) {
      return null;
    }

    const base = this.getCharacterById(entry.character_id);
    if (!base) return null;

    const maxLevel = getMaxLevel(base.grade);

    // 최대 레벨 도달 시 레벨업 불가
    if (entry.level >= maxLevel) {
      return null;
    }

    // Cost check: level * 100 gold per crystal
    const goldCost = entry.level * 100 * Math.max(1, expCrystals);
    if (user.gold < goldCost) {
      return null;
    }
    user.gold -= goldCost;

    const prevLevel = entry.level;
    entry.exp += Math.max(1, expCrystals) * 100;
    while (entry.exp >= getExpToNext(entry.level) && entry.level < maxLevel) {
      entry.exp -= getExpToNext(entry.level);
      entry.level += 1;
      entry.current_hp += 30;
      entry.current_atk += 5;
      entry.current_def += 4;
      entry.current_spd += 1;
      entry.crit_rate = Math.round((entry.crit_rate + 0.2) * 100) / 100;
      entry.crit_damage = Math.round((entry.crit_damage + 0.5) * 100) / 100;
      entry.accuracy = Math.round((entry.accuracy + 0.3) * 100) / 100;
      entry.resistance = Math.round((entry.resistance + 0.3) * 100) / 100;
    }

    // 최대 레벨 도달 시 잉여 exp 초기화
    if (entry.level >= maxLevel) {
      entry.exp = 0;
    }

    if (entry.level > prevLevel) {
      advanceQuestProgress(userId, 'level_up');
      advanceWeeklyQuestProgress(userId, 'level_up');
      advanceCumulativeStat(userId, 'level_up_total');
    }

    persist(async () => {
      await db.update(userCharactersTable)
        .set({
          level: entry.level,
          exp: entry.exp,
          currentHp: entry.current_hp,
          currentAtk: entry.current_atk,
          currentDef: entry.current_def,
          currentSpd: entry.current_spd,
          critRate: String(entry.crit_rate),
          critDamage: String(entry.crit_damage),
          accuracy: String(entry.accuracy),
          resistance: String(entry.resistance),
        })
        .where(eq(userCharactersTable.id, userCharacterId));
      await db.update(usersTable)
        .set({ gold: user.gold, updatedAt: now() })
        .where(eq(usersTable.id, userId));
    });

    return this.getUserCharacterDetail(userId, userCharacterId);
  },

  awakenCharacter(userId: number, userCharacterId: number): Record<string, unknown> | null {
    const user = this.getUserById(userId);
    if (!user) return null;

    const entry = this.getUserCharacters(userId).find((character) => character.id === userCharacterId);
    if (!entry) {
      return null;
    }

    const base = this.getCharacterById(entry.character_id);
    if (!base) return null;

    const maxLevel = getMaxLevel(base.grade);

    // 각성은 최대 레벨 도달 시에만 가능 (PRD 4.2)
    if (entry.level < maxLevel) {
      return null;
    }

    // 이미 최대 각성 (5성 이상) 불가
    if (base.grade >= 5) {
      return null;
    }

    // 비용: 5000 * 성급 골드 + 각성석(미구현 시 고정)
    const goldCost = 5000 * base.grade;
    if (user.gold < goldCost) {
      return null;
    }
    user.gold -= goldCost;

    // 각성: 성급 +1, 레벨 1로 초기화, 스탯 대폭 상승
    entry.awakened = (entry.awakened || 0) + 1;
    entry.level = 1;
    entry.exp = 0;
    entry.current_hp += 200 + base.grade * 50;
    entry.current_atk += 30 + base.grade * 8;
    entry.current_def += 25 + base.grade * 6;
    entry.current_spd += 5 + base.grade * 1;
    entry.crit_rate += 3;
    entry.crit_damage += 5;
    entry.accuracy += 5;
    entry.resistance += 5;

    // grade bump is stored on base character - we track it via awakened count
    // actual grade displayed = base.grade + entry.awakened (capped at 5)

    persist(async () => {
      await db.update(userCharactersTable)
        .set({
          awakened: entry.awakened,
          level: entry.level,
          exp: entry.exp,
          currentHp: entry.current_hp,
          currentAtk: entry.current_atk,
          currentDef: entry.current_def,
          currentSpd: entry.current_spd,
          critRate: String(entry.crit_rate),
          critDamage: String(entry.crit_damage),
          accuracy: String(entry.accuracy),
          resistance: String(entry.resistance),
        })
        .where(eq(userCharactersTable.id, userCharacterId));
      await db.update(usersTable)
        .set({ gold: user.gold, updatedAt: now() })
        .where(eq(usersTable.id, userId));
    });

    return this.getUserCharacterDetail(userId, userCharacterId);
  },

  skillUpCharacter(userId: number, userCharacterId: number, slot: number): Record<string, unknown> | null {
    const entry = this.getUserCharacters(userId).find((character) => character.id === userCharacterId);
    if (!entry) {
      return null;
    }

    if (slot === 1) entry.skill_1_level += 1;
    if (slot === 2) entry.skill_2_level += 1;
    if (slot === 3) entry.skill_3_level += 1;
    if (slot === 4) entry.skill_4_level += 1;

    persist(async () => {
      await db.update(userCharactersTable)
        .set({
          skill1Level: entry.skill_1_level,
          skill2Level: entry.skill_2_level,
          skill3Level: entry.skill_3_level,
          skill4Level: entry.skill_4_level,
        })
        .where(eq(userCharactersTable.id, userCharacterId));
    });

    return this.getUserCharacterDetail(userId, userCharacterId);
  },

  getParty(userId: number): number[] {
    return userParty.get(userId) || [];
  },

  setParty(userId: number, members: number[]): number[] {
    const uniqueMembers = [...new Set(members)].slice(0, 4);
    userParty.set(userId, uniqueMembers);

    persist(async () => {
      await db.delete(partyMembersTable).where(eq(partyMembersTable.userId, userId));
      if (uniqueMembers.length > 0) {
        await db.insert(partyMembersTable).values(uniqueMembers.map((userCharacterId, slotIndex) => ({
          userId,
          slotIndex,
          userCharacterId,
          createdAt: now(),
          updatedAt: now(),
        })));
      }
    });

    return uniqueMembers;
  },

  summon(userId: number, type: 'normal' | 'premium', count: number): Array<Record<string, unknown>> {
    const user = this.getUserById(userId);
    if (!user) {
      return [];
    }

    const totalCount = type === 'normal' && count === 10 ? 11 : count;
    const costPerPull = type === 'premium' ? 300 : 100;
    const totalCost = costPerPull * count;

    if (user.crystals < totalCost) {
      return [];
    }

    user.crystals -= totalCost;

    const owned = this.getUserCharacters(userId);

    // Grade probability pool
    const gradePool = (isPremium: boolean, isGuarantee: boolean): number => {
      if (isGuarantee) {
        // 10-pull guarantee: at least 4-star
        const r = Math.random();
        if (r < 0.01) return 5;
        if (r < 0.05) return 4;
        return 4;
      }
      const r = Math.random();
      if (isPremium) {
        if (r < 0.02) return 5;
        if (r < 0.10) return 4;
        if (r < 0.30) return 3;
        if (r < 0.60) return 2;
        return 1;
      }
      if (r < 0.01) return 5;
      if (r < 0.05) return 4;
      if (r < 0.20) return 3;
      if (r < 0.50) return 2;
      return 1;
    };

    const results = Array.from({ length: totalCount }).map((_value, index) => {
      const isGuarantee = count === 10 && index === totalCount - 1;
      const targetGrade = gradePool(type === 'premium', isGuarantee);

      let targetPool = characters.filter((c) => c.grade === targetGrade);
      if (targetPool.length === 0) {
        targetPool = characters.filter((c) => c.grade <= targetGrade);
      }
      if (targetPool.length === 0) {
        targetPool = characters;
      }

      const picked = targetPool[Math.floor(Math.random() * targetPool.length)];
      const fresh = makeUserCharacter(userId, picked);
      owned.push(fresh);

      return {
        character_id: picked.id,
        character: {
          id: picked.id,
          name: picked.name,
          grade: picked.grade,
          element: picked.element,
          class: picked.class,
          baseHp: picked.base_hp,
          baseAtk: picked.base_atk,
          baseDef: picked.base_def,
          baseSpd: picked.base_spd,
          skill1Id: String(picked.skill_1_id),
          skill2Id: String(picked.skill_2_id),
          skill3Id: String(picked.skill_3_id),
          skill4Id: String(picked.skill_4_id),
          imageUrl: picked.image_url,
        },
        is_new: true,
      };
    });

    userCharacters.set(userId, owned);

    // Advance summon quest
    advanceQuestProgress(userId, 'summon', count);
    advanceWeeklyQuestProgress(userId, 'summon', count);
    advanceCumulativeStat(userId, 'summon_total', totalCount);

    persist(async () => {
      await db.update(usersTable)
        .set({
          crystals: user.crystals,
          updatedAt: now(),
        })
        .where(eq(usersTable.id, userId));

      const newlyOwned = owned.slice(-totalCount);
      if (newlyOwned.length > 0) {
        await db.insert(userCharactersTable).values(newlyOwned.map((entry) => ({
          id: entry.id,
          userId: entry.user_id,
          characterId: entry.character_id,
          level: entry.level,
          exp: entry.exp,
          currentHp: entry.current_hp,
          currentAtk: entry.current_atk,
          currentDef: entry.current_def,
          currentSpd: entry.current_spd,
          critRate: String(entry.crit_rate),
          critDamage: String(entry.crit_damage),
          accuracy: String(entry.accuracy),
          resistance: String(entry.resistance),
          skill1Level: entry.skill_1_level,
          skill2Level: entry.skill_2_level,
          skill3Level: entry.skill_3_level,
          skill4Level: entry.skill_4_level,
          awakened: entry.awakened,
          obtainedAt: entry.obtained_at,
        })));

        await db.insert(summonHistoryTable).values(newlyOwned.map((entry) => ({
          userId,
          summonType: type,
          characterId: entry.character_id,
          createdAt: now(),
        })));
      }
    });

    return results;
  },

  // ============================================================
  // Dungeons
  // ============================================================
  getDungeons(chapter?: number): Dungeon[] {
    if (!chapter) {
      return dungeons;
    }
    return dungeons.filter((dungeon) => dungeon.chapter === chapter);
  },

  getDungeonById(dungeonId: number): Dungeon | undefined {
    return dungeons.find((dungeon) => dungeon.id === dungeonId);
  },

  consumeEnergy(userId: number, amount: number): boolean {
    const user = this.getUserById(userId);
    if (!user) {
      return false;
    }
    if (user.energy < amount) {
      return false;
    }
    user.energy -= amount;
    user.lastEnergyUpdate = now();

    persist(async () => {
      await db.update(usersTable)
        .set({
          energy: user.energy,
          lastEnergyUpdate: user.lastEnergyUpdate,
          updatedAt: now(),
        })
        .where(eq(usersTable.id, userId));
    });

    return true;
  },

  // ============================================================
  // Dungeon progress
  // ============================================================
  getDungeonProgress(userId: number): { cleared: number[]; chapter: number; stage: number } {
    const cleared = dungeonCleared.get(userId);
    const clearedIds = cleared ? Array.from(cleared) : [];
    // Determine highest chapter/stage
    let maxChapter = 1;
    let maxStage = 0;
    clearedIds.forEach((id) => {
      const d = this.getDungeonById(id);
      if (d) {
        if (d.chapter > maxChapter || (d.chapter === maxChapter && d.stage > maxStage)) {
          maxChapter = d.chapter;
          maxStage = d.stage;
        }
      }
    });
    return { cleared: clearedIds, chapter: maxChapter, stage: maxStage };
  },

  markDungeonCleared(userId: number, dungeonId: number): void {
    let set = dungeonCleared.get(userId);
    if (!set) {
      set = new Set();
      dungeonCleared.set(userId, set);
    }
    const isNew = !set.has(dungeonId);
    set.add(dungeonId);

    if (isNew) {
      persist(async () => {
        await db.insert(userDungeonProgressTable).values({
          userId,
          dungeonId,
          clearedAt: now(),
        }).onConflictDoNothing();
      });
    }
  },

  isDungeonUnlocked(userId: number, dungeonId: number): boolean {
    const dungeon = this.getDungeonById(dungeonId);
    if (!dungeon) return false;

    // First stage of normal chapter 1 is always unlocked
    if (dungeon.chapter === 1 && dungeon.stage === 1 && dungeon.difficulty === 'normal') return true;

    const cleared = dungeonCleared.get(userId) || new Set<number>();

    // Same difficulty: previous stage must be cleared
    if (dungeon.stage > 1) {
      const prevDungeon = dungeons.find((d) => d.chapter === dungeon.chapter && d.stage === dungeon.stage - 1 && d.difficulty === dungeon.difficulty);
      if (prevDungeon && !cleared.has(prevDungeon.id)) return false;
    }

    // Hard requires all normal cleared for this chapter
    if (dungeon.difficulty === 'hard') {
      const normalStages = dungeons.filter((d) => d.chapter === dungeon.chapter && d.difficulty === 'normal');
      if (!normalStages.every((d) => cleared.has(d.id))) return false;
    }

    // Hell requires all hard cleared for this chapter
    if (dungeon.difficulty === 'hell') {
      const hardStages = dungeons.filter((d) => d.chapter === dungeon.chapter && d.difficulty === 'hard');
      if (!hardStages.every((d) => cleared.has(d.id))) return false;
    }

    // Chapter 2 requires chapter 1 normal boss (stage 5) cleared
    if (dungeon.chapter === 2 && dungeon.stage === 1 && dungeon.difficulty === 'normal') {
      const ch1Boss = dungeons.find((d) => d.chapter === 1 && d.stage === 5 && d.difficulty === 'normal');
      if (ch1Boss && !cleared.has(ch1Boss.id)) return false;
    }

    return true;
  },

  // ============================================================
  // Battle creation with proper ATB/wave system
  // ============================================================
  createBattleFromDungeon(userId: number, dungeonId: number): BattleState | null {
    const dungeon = this.getDungeonById(dungeonId);
    if (!dungeon) {
      return null;
    }

    const memberIds = this.getParty(userId);
    const ownCharacters = this.getUserCharacters(userId);
    const allies: BattleUnit[] = memberIds
      .map((memberId) => ownCharacters.find((entry) => entry.id === memberId))
      .filter((entry): entry is UserCharacter => !!entry)
      .slice(0, 4)
      .map((entry, index) => {
        const base = this.getCharacterById(entry.character_id)!;
        return {
          unit_id: `ally-${uuidv4()}`,
          team: 'ally' as const,
          char_id: base.id,
          name: base.name,
          grade: base.grade,
          element: base.element,
          class: base.class,
          image_url: base.image_url,
          level: entry.level,
          position: index,
          hp: entry.current_hp,
          max_hp: entry.current_hp,
          atk: entry.current_atk,
          def: entry.current_def,
          spd: entry.current_spd,
          crit_rate: entry.crit_rate,
          crit_damage: entry.crit_damage,
          accuracy: entry.accuracy,
          resistance: entry.resistance,
          atb_gauge: 0,
          skills: buildSkillsForUnit(base),
          buffs: [],
          debuffs: [],
          is_alive: true,
        };
      });

    // Build enemies from wave data
    const waveData = dungeon.wave_data;
    const firstWave = waveData ? waveData[0] : undefined;
    const totalWaves = waveData ? waveData.length : 1;

    const enemies: BattleUnit[] = firstWave
      ? firstWave.enemies.map((e, i) => ({
          unit_id: `enemy-${uuidv4()}`,
          team: 'enemy' as const,
          char_id: e.char_id,
          name: e.name,
          grade: 1,
          element: e.element,
          class: 'warrior',
          image_url: '/monsters/enemy_default.png',
          level: e.level,
          position: i,
          hp: e.hp,
          max_hp: e.hp,
          atk: e.atk,
          def: e.def,
          spd: e.spd,
          crit_rate: e.crit_rate,
          crit_damage: e.crit_damage,
          accuracy: e.accuracy,
          resistance: e.resistance,
          atb_gauge: 0,
          skills: buildEnemySkills(),
          buffs: [],
          debuffs: [],
          is_alive: true,
        }))
      : [0, 1, 2].map((position) => ({
          unit_id: `enemy-${uuidv4()}`,
          team: 'enemy' as const,
          char_id: 900 + position,
          name: `Dungeon Mob ${position + 1}`,
          grade: 1,
          element: 'wind',
          class: 'warrior',
          image_url: '/monsters/enemy_default.png',
          level: dungeon.chapter + dungeon.stage,
          position,
          hp: 450 + position * 70,
          max_hp: 450 + position * 70,
          atk: 80,
          def: 55,
          spd: 95,
          crit_rate: 10,
          crit_damage: 50,
          accuracy: 0,
          resistance: 0,
          atb_gauge: 0,
          skills: buildEnemySkills(),
          buffs: [],
          debuffs: [],
          is_alive: true,
        }));

    const battleState: BattleState = {
      battle_id: battleIdSeq++,
      dungeon_id: dungeonId,
      user_id: userId,
      phase: 'in_wave',
      current_wave: 1,
      total_waves: totalWaves,
      allies,
      enemies,
      active_unit_id: undefined,
      auto_mode: false,
      speed_multiplier: 1,
      turn_counter: 0,
      events: [],
    };

    battles.set(battleState.battle_id, battleState);
    return battleState;
  },

  getBattleById(battleId: number): BattleState | undefined {
    return battles.get(battleId);
  },

  updateBattle(battle: BattleState): void {
    battles.set(battle.battle_id, battle);
  },

  // ATB tick and auto-action processing
  processBattleTick(battleId: number): BattleState | null {
    const battle = battles.get(battleId);
    if (!battle || battle.phase === 'battle_end') return battle || null;

    if (battle.phase === 'action_select') return battle;

    // Run multiple ticks to advance the battle
    const ticksToRun = 10 * battle.speed_multiplier;
    advanceBattleTick(battle, ticksToRun);

    // Check wave clear → spawn next wave
    if (battle.phase === 'wave_clear' && battle.current_wave <= battle.total_waves) {
      this.spawnNextWave(battle);
      battle.phase = 'in_wave';
    }

    // Set result if battle ended (phase may be mutated by advanceBattleTick)
    const phase = battle.phase as string;
    if (phase === 'battle_end' && !battle.result) {
      const alliesAlive = battle.allies.some((a) => a.is_alive);
      const dungeon = this.getDungeonById(battle.dungeon_id || 0);
      if (alliesAlive) {
        battle.result = {
          battle_id: battle.battle_id,
          result: 'victory',
          waves_cleared: battle.total_waves,
          gold: dungeon?.gold_reward || 0,
          exp: dungeon?.exp_reward || 0,
          crystals: dungeon?.crystal_reward || 0,
          character_shards: dungeon?.character_shard_reward || 0,
        };
        if (dungeon && battle.user_id) {
          this.markDungeonCleared(battle.user_id, dungeon.id);
          grantBattleVictoryRewards(battle.user_id, dungeon);
        }
      } else {
        battle.result = {
          battle_id: battle.battle_id,
          result: 'defeat',
          waves_cleared: Math.max(0, battle.current_wave - 1),
          gold: 0,
          exp: 0,
          crystals: 0,
          character_shards: 0,
        };
      }
    }

    return battle;
  },

  spawnNextWave(battle: BattleState): void {
    const dungeon = this.getDungeonById(battle.dungeon_id || 0);
    if (!dungeon || !dungeon.wave_data) return;

    const waveData = dungeon.wave_data[battle.current_wave - 1];
    if (!waveData) return;

    battle.enemies = waveData.enemies.map((e, i) => ({
      unit_id: `enemy-${uuidv4()}`,
      team: 'enemy' as const,
      char_id: e.char_id,
      name: e.name,
      grade: 1,
      element: e.element,
      class: 'warrior',
      image_url: '/monsters/enemy_default.png',
      level: e.level,
      position: i,
      hp: e.hp,
      max_hp: e.hp,
      atk: e.atk,
      def: e.def,
      spd: e.spd,
      crit_rate: e.crit_rate,
      crit_damage: e.crit_damage,
      accuracy: e.accuracy,
      resistance: e.resistance,
      atb_gauge: 0,
      skills: buildEnemySkills(),
      buffs: [],
      debuffs: [],
      is_alive: true,
    }));
  },

  // Manual action from player
  battleAction(battleId: number, unitId?: string, skillIndex?: number, targetIds?: string[]): BattleState | null {
    const battle = battles.get(battleId);
    if (!battle) return null;

    if (battle.phase === 'action_select' && unitId) {
      const actor = battle.allies.find((a) => a.unit_id === unitId);
      if (!actor || !actor.is_alive) return battle;

      const sIdx = typeof skillIndex === 'number' ? skillIndex : 0;
      const skill = actor.skills[sIdx] || actor.skills[0];

      let targets: BattleUnit[] = [];
      if (skill.target_type === 'all_enemies') {
        targets = battle.enemies.filter((e) => e.is_alive);
      } else if (skill.target_type === 'all_allies' || skill.target_type === 'self') {
        targets = skill.target_type === 'self' ? [actor] : battle.allies.filter((a) => a.is_alive);
      } else if (targetIds && targetIds.length > 0) {
        const allUnits = [...battle.allies, ...battle.enemies];
        targets = targetIds.map((tid) => allUnits.find((u) => u.unit_id === tid)).filter((u): u is BattleUnit => !!u && u.is_alive);
      } else {
        // Default: first alive enemy
        const target = battle.enemies.find((e) => e.is_alive);
        if (target) targets = [target];
      }

      executeAction(battle, actor, sIdx, targets);

      // Check wave/end
      if (!battle.enemies.some((e) => e.is_alive)) {
        if (battle.current_wave < battle.total_waves) {
          battle.current_wave += 1;
          this.spawnNextWave(battle);
          battle.phase = 'in_wave';
        } else {
          battle.phase = 'battle_end';
        }
      } else if (!battle.allies.some((a) => a.is_alive)) {
        battle.phase = 'battle_end';
      } else {
        battle.phase = 'in_wave';
      }
    }

    // Process ticks if in_wave
    if (battle.phase === 'in_wave') {
      return this.processBattleTick(battleId);
    }

    // Set result if ended
    if (battle.phase === 'battle_end' && !battle.result) {
      const alliesAlive = battle.allies.some((a) => a.is_alive);
      const dungeon = this.getDungeonById(battle.dungeon_id || 0);
      if (alliesAlive) {
        battle.result = {
          battle_id: battle.battle_id,
          result: 'victory',
          waves_cleared: battle.total_waves,
          gold: dungeon?.gold_reward || 0,
          exp: dungeon?.exp_reward || 0,
          crystals: dungeon?.crystal_reward || 0,
          character_shards: dungeon?.character_shard_reward || 0,
        };
        if (dungeon && battle.user_id) {
          this.markDungeonCleared(battle.user_id, dungeon.id);
          grantBattleVictoryRewards(battle.user_id, dungeon);
        }
      } else {
        battle.result = {
          battle_id: battle.battle_id,
          result: 'defeat',
          waves_cleared: Math.max(0, battle.current_wave - 1),
          gold: 0,
          exp: 0,
          crystals: 0,
          character_shards: 0,
        };
      }
    }

    return battle;
  },

  getBattleResult(battleId: number): BattleState['result'] | null {
    const battle = battles.get(battleId);
    return battle?.result || null;
  },

  // ============================================================
  // Shop
  // ============================================================
  getShopItems(userId?: number): Array<Record<string, unknown>> {
    const today = todayKey();
    return shopItems.map((item) => {
      let purchasedToday = 0;
      if (userId !== undefined) {
        const userPurchases = purchaseHistory.get(userId);
        if (userPurchases) {
          const records = userPurchases.get(today) || [];
          purchasedToday = records
            .filter((p) => p.shop_item_id === item.id)
            .reduce((sum, p) => sum + p.quantity, 0);
        }
      }
      return {
        ...item,
        purchased_today: purchasedToday,
        remaining_today: Math.max(0, item.daily_limit - purchasedToday),
      };
    });
  },

  purchaseItem(userId: number, shopItemId: number, quantity: number): Record<string, unknown> | null {
    const user = this.getUserById(userId);
    const item = shopItems.find((shopItem) => shopItem.id === shopItemId);

    if (!user || !item || quantity <= 0) {
      return null;
    }

    // Check daily limit
    const today = todayKey();
    let userPurchases = purchaseHistory.get(userId);
    if (!userPurchases) {
      userPurchases = new Map();
      purchaseHistory.set(userId, userPurchases);
    }
    const todayPurchases = userPurchases.get(today) || [];
    const todayBought = todayPurchases.filter((p) => p.shop_item_id === shopItemId).reduce((sum, p) => sum + p.quantity, 0);
    if (todayBought + quantity > item.daily_limit) {
      return null;
    }

    const totalCost = item.price * quantity;
    if (item.currency_type === 'gold') {
      if (user.gold < totalCost) {
        return null;
      }
      user.gold -= totalCost;
      if (item.item_type === 'energy') {
        user.energy = Math.min(user.maxEnergy, user.energy + 10 * quantity);
      }
    } else {
      if (user.crystals < totalCost) {
        return null;
      }
      user.crystals -= totalCost;
    }

    // Record purchase
    todayPurchases.push({ shop_item_id: shopItemId, quantity, purchased_at: now() });
    userPurchases.set(today, todayPurchases);

    persist(async () => {
      await db.update(usersTable)
        .set({
          gold: user.gold,
          crystals: user.crystals,
          energy: user.energy,
          updatedAt: now(),
        })
        .where(eq(usersTable.id, userId));
    });

    return {
      purchased: true,
      item_id: item.id,
      item_name: item.name,
      quantity,
      total_cost: totalCost,
      currency_type: item.currency_type,
      gold: user.gold,
      crystals: user.crystals,
      energy: user.energy,
    };
  },

  getShopHistory(userId: number): PurchaseRecord[] {
    const userPurchases = purchaseHistory.get(userId);
    if (!userPurchases) return [];
    const allRecords: PurchaseRecord[] = [];
    userPurchases.forEach((records) => allRecords.push(...records));
    return allRecords.sort((a, b) => b.purchased_at.localeCompare(a.purchased_at));
  },

  // ============================================================
  // Daily quests
  // ============================================================
  getDailyQuests(userId: number): Array<Record<string, unknown>> {
    const quests = ensureUserQuests(userId);
    return dailyQuestTemplates.map((template) => {
      const progress = quests.get(template.id)!;
      return {
        id: template.id,
        type: template.type,
        title: template.title,
        description: template.description,
        progress: progress.progress,
        goal: template.goal,
        rewards: template.rewards,
        isCompleted: progress.is_completed,
        isClaimed: progress.is_claimed,
      };
    });
  },

  completeQuest(questId: number): boolean {
    // Manual complete (mostly used for testing)
    const template = dailyQuestTemplates.find((q) => q.id === questId);
    return !!template;
  },

  claimQuest(userId: number, questId: number): Record<string, unknown> | null {
    const user = this.getUserById(userId);
    if (!user) return null;

    // Try daily first
    const daily = ensureUserQuests(userId).get(questId);
    const dailyTemplate = dailyQuestTemplates.find((q) => q.id === questId);
    if (daily && dailyTemplate) {
      if (!daily.is_completed || daily.is_claimed) return null;
      daily.is_claimed = true;
      dailyTemplate.rewards.forEach((reward) => {
        if (reward.name === 'gold') user.gold += reward.quantity;
        if (reward.name === 'crystal') user.crystals += reward.quantity;
      });
      persist(async () => {
        await db.update(usersTable)
          .set({ gold: user.gold, crystals: user.crystals, updatedAt: now() })
          .where(eq(usersTable.id, userId));
      });
      return { questId, rewards: dailyTemplate.rewards, gold: user.gold, crystals: user.crystals };
    }

    // Try weekly
    const weekly = ensureUserWeeklyQuests(userId).get(questId);
    const weeklyTemplate = weeklyQuestTemplates.find((q) => q.id === questId);
    if (weekly && weeklyTemplate) {
      if (!weekly.is_completed || weekly.is_claimed) return null;
      weekly.is_claimed = true;
      weeklyTemplate.rewards.forEach((reward) => {
        if (reward.name === 'gold') user.gold += reward.quantity;
        if (reward.name === 'crystal') user.crystals += reward.quantity;
      });
      persist(async () => {
        await db.update(usersTable)
          .set({ gold: user.gold, crystals: user.crystals, updatedAt: now() })
          .where(eq(usersTable.id, userId));
      });
      return { questId, rewards: weeklyTemplate.rewards, gold: user.gold, crystals: user.crystals };
    }

    // Try achievement
    const ach = ensureUserAchievements(userId).get(questId);
    const achTemplate = achievementTemplates.find((q) => q.id === questId);
    if (ach && achTemplate) {
      if (!ach.is_completed || ach.is_claimed) return null;
      ach.is_claimed = true;
      achTemplate.rewards.forEach((reward) => {
        if (reward.name === 'gold') user.gold += reward.quantity;
        if (reward.name === 'crystal') user.crystals += reward.quantity;
      });
      persist(async () => {
        await db.update(usersTable)
          .set({ gold: user.gold, crystals: user.crystals, updatedAt: now() })
          .where(eq(usersTable.id, userId));
      });
      return { questId, rewards: achTemplate.rewards, gold: user.gold, crystals: user.crystals };
    }

    return null;
  },

  // Weekly quests
  getWeeklyQuests(userId: number): Array<Record<string, unknown>> {
    const weekly = ensureUserWeeklyQuests(userId);
    return weeklyQuestTemplates.map((template) => {
      const progress = weekly.get(template.id)!;
      return {
        id: template.id,
        type: template.type,
        title: template.title,
        description: template.description,
        progress: progress.progress,
        goal: template.goal,
        rewards: template.rewards,
        isCompleted: progress.is_completed,
        isClaimed: progress.is_claimed,
      };
    });
  },

  // Achievements
  getAchievements(userId: number): Array<Record<string, unknown>> {
    const ach = ensureUserAchievements(userId);
    return achievementTemplates.map((template) => {
      const progress = ach.get(template.id)!;
      return {
        id: template.id,
        type: template.type,
        title: template.title,
        description: template.description,
        progress: progress.progress,
        goal: template.goal,
        rewards: template.rewards,
        isCompleted: progress.is_completed,
        isClaimed: progress.is_claimed,
      };
    });
  },

  // User items (shards, materials)
  getUserItems(userId: number): Array<Record<string, unknown>> {
    const items = userItemsMap.get(userId);
    if (!items) return [];
    return Array.from(items.values()).filter((item) => item.quantity > 0).map((item) => ({
      id: item.id,
      item_type: item.item_type,
      item_id: item.item_id,
      item_name: item.item_name,
      quantity: item.quantity,
      updated_at: item.updated_at,
    }));
  },

  // Arena defense team
  getArenaDefenseTeam(userId: number): number[] {
    return arenaDefenseTeam.get(userId) || [];
  },

  setArenaDefenseTeam(userId: number, characterIds: number[]): number[] {
    const team = [...new Set(characterIds)].slice(0, 4);
    arenaDefenseTeam.set(userId, team);
    return team;
  },

  // ============================================================
  // Daily login
  // ============================================================
  getDailyLoginStatus(userId: number): { claimedToday: boolean; consecutiveDays: number; nextRewards: Array<{ type: string; name: string; quantity: number }> } {
    const today = todayKey();
    const loginData = dailyLogin.get(userId);
    const consecutiveDays = loginData?.consecutive_days ?? 0;
    const claimedToday = loginData?.last_login_date === today && (loginData?.claimed_today ?? false);
    const day = claimedToday ? consecutiveDays : consecutiveDays + 1;
    const nextRewards: Array<{ type: string; name: string; quantity: number }> = [];
    nextRewards.push({ type: 'currency', name: 'gold', quantity: 1000 + Math.max(0, day - 1) * 200 });
    if (day >= 3) nextRewards.push({ type: 'currency', name: 'crystal', quantity: 20 + Math.max(0, day - 3) * 10 });
    if (day >= 7) nextRewards.push({ type: 'currency', name: 'crystal', quantity: 50 });
    return { claimedToday, consecutiveDays, nextRewards };
  },

  claimDailyLogin(userId: number): { claimed: boolean; rewards: Array<{ type: string; name: string; quantity: number }>; consecutiveDays: number } {
    const user = this.getUserById(userId);
    if (!user) return { claimed: false, rewards: [], consecutiveDays: 0 };

    const today = todayKey();
    let loginData = dailyLogin.get(userId);

    if (!loginData) {
      loginData = { last_login_date: '', consecutive_days: 0, claimed_today: false };
      dailyLogin.set(userId, loginData);
    }

    if (loginData.last_login_date === today && loginData.claimed_today) {
      return { claimed: false, rewards: [], consecutiveDays: loginData.consecutive_days };
    }

    // Calculate consecutive days
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = yesterday.toISOString().slice(0, 10);

    if (loginData.last_login_date === yesterdayKey) {
      loginData.consecutive_days += 1;
    } else if (loginData.last_login_date !== today) {
      loginData.consecutive_days = 1;
    }

    loginData.last_login_date = today;
    loginData.claimed_today = true;

    // Rewards based on consecutive days
    const day = loginData.consecutive_days;
    const rewards: Array<{ type: string; name: string; quantity: number }> = [];

    rewards.push({ type: 'currency', name: 'gold', quantity: 1000 + (day - 1) * 200 });
    if (day >= 3) rewards.push({ type: 'currency', name: 'crystal', quantity: 20 + (day - 3) * 10 });
    if (day >= 7) rewards.push({ type: 'currency', name: 'crystal', quantity: 50 });

    rewards.forEach((reward) => {
      if (reward.name === 'gold') user.gold += reward.quantity;
      if (reward.name === 'crystal') user.crystals += reward.quantity;
    });

    // Advance login quest
    advanceQuestProgress(userId, 'login');
    // Check login streak achievement
    advanceCumulativeStat(userId, 'login_streak', 0);
    // Manually set login_streak to consecutive_days for achievement check
    ensureUserStats(userId).set('login_streak', loginData.consecutive_days);
    // Re-eval achievements for login_streak
    const ach = ensureUserAchievements(userId);
    achievementTemplates.filter((t) => t.condition === 'login_streak').forEach((template) => {
      const progress = ach.get(template.id);
      if (!progress || progress.is_completed) return;
      progress.progress = Math.min(loginData.consecutive_days, template.goal);
      if (progress.progress >= template.goal) progress.is_completed = true;
    });

    persist(async () => {
      await db.update(usersTable)
        .set({
          gold: user.gold,
          crystals: user.crystals,
          updatedAt: now(),
        })
        .where(eq(usersTable.id, userId));
    });

    return { claimed: true, rewards, consecutiveDays: loginData.consecutive_days };
  },

  // ============================================================
  // Arena / Guild (kept from original)
  // ============================================================
  getArenaRanking(): Array<Record<string, unknown>> {
    return Array.from(users.values()).map((user, index) => ({
      userId: String(user.id),
      username: user.username,
      rank: index + 1,
      rating: 1200 - index * 3,
      winCount: 10 + index,
      loseCount: 5,
      defenseTeam: [],
    }));
  },

  createGuild(userId: number, name: string, description?: string): Record<string, unknown> {
    const guild = {
      id: guildIdSeq++,
      name,
      leaderId: userId,
      level: 1,
      description,
      maxMembers: 30,
      createdAt: now(),
    };

    guilds.push(guild);
    userGuild.set(userId, guild.id);

    persist(async () => {
      await db.insert(guildsTable).values({
        id: guild.id,
        name: guild.name,
        leaderId: guild.leaderId,
        level: guild.level,
        membersCount: 1,
        maxMembers: guild.maxMembers,
        description: guild.description || null,
        createdAt: guild.createdAt,
        updatedAt: guild.createdAt,
      });

      await db.insert(guildMembersTable).values({
        guildId: guild.id,
        userId,
        role: 'leader',
        contribution: 0,
        joinedAt: now(),
      });
    });

    return {
      id: String(guild.id),
      name: guild.name,
      leaderId: String(guild.leaderId),
      level: guild.level,
      membersCount: 1,
      maxMembers: guild.maxMembers,
      description: guild.description || '',
      createdAt: guild.createdAt,
    };
  },

  getGuildList(): Array<Record<string, unknown>> {
    return guilds.map((guild) => ({
      id: String(guild.id),
      name: guild.name,
      leaderId: String(guild.leaderId),
      level: guild.level,
      membersCount: Array.from(userGuild.values()).filter((value) => value === guild.id).length,
      maxMembers: guild.maxMembers,
      description: guild.description || '',
      createdAt: guild.createdAt,
    }));
  },

  getGuildById(guildId: number): Record<string, unknown> | null {
    return this.getGuildList().find((guild) => Number(guild.id) === guildId) || null;
  },

  getGuildMembers(guildId: number): Array<Record<string, unknown>> {
    const members = Array.from(userGuild.entries()).filter((entry) => entry[1] === guildId);
    return members.map(([userId], index) => {
      const user = this.getUserById(userId)!;
      return {
        userId: String(user.id),
        username: user.username,
        role: index === 0 ? 'leader' : 'member',
        contribution: 0,
        joinedAt: user.updatedAt,
      };
    });
  },

  joinGuild(userId: number, guildId: number): boolean {
    if (!this.getGuildById(guildId)) {
      return false;
    }
    userGuild.set(userId, guildId);

    persist(async () => {
      await db.insert(guildMembersTable).values({
        guildId,
        userId,
        role: 'member',
        contribution: 0,
        joinedAt: now(),
      });
    });

    return true;
  },

  leaveGuild(userId: number, guildId: number): boolean {
    if (userGuild.get(userId) !== guildId) {
      return false;
    }
    userGuild.delete(userId);

    persist(async () => {
      await db.delete(guildMembersTable).where(and(eq(guildMembersTable.guildId, guildId), eq(guildMembersTable.userId, userId)));
    });

    return true;
  },

  getUserGuild(userId: number): Record<string, unknown> | null {
    const guildId = userGuild.get(userId);
    if (!guildId) {
      return null;
    }
    return this.getGuildById(guildId);
  },
};

void hydrateFromDb();
