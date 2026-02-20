import {
  pgTable,
  bigserial,
  bigint,
  varchar,
  integer,
  timestamp,
  boolean,
  decimal,
  jsonb,
  primaryKey,
  unique,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  level: integer('level').notNull().default(1),
  exp: bigint('exp', { mode: 'number' }).notNull().default(0),
  crystals: bigint('crystals', { mode: 'number' }).notNull().default(0),
  gold: bigint('gold', { mode: 'number' }).notNull().default(1000),
  energy: integer('energy').notNull().default(100),
  maxEnergy: integer('max_energy').notNull().default(100),
  lastEnergyUpdate: timestamp('last_energy_update', { mode: 'string' }).notNull(),
  lastLogin: timestamp('last_login', { mode: 'string' }),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull(),
});

export const characters = pgTable('characters', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  grade: integer('grade').notNull(),
  element: varchar('element', { length: 20 }).notNull(),
  class: varchar('class', { length: 20 }).notNull(),
  baseHp: integer('base_hp').notNull(),
  baseAtk: integer('base_atk').notNull(),
  baseDef: integer('base_def').notNull(),
  baseSpd: integer('base_spd').notNull(),
  baseCrt: integer('base_crt').notNull().default(15),
  baseCrtDmg: integer('base_crt_dmg').notNull().default(50),
  baseAcc: integer('base_acc').notNull().default(0),
  baseRes: integer('base_res').notNull().default(0),
  skill1Id: bigint('skill_1_id', { mode: 'number' }),
  skill2Id: bigint('skill_2_id', { mode: 'number' }),
  skill3Id: bigint('skill_3_id', { mode: 'number' }),
  skill4Id: bigint('skill_4_id', { mode: 'number' }),
  imageUrl: varchar('image_url', { length: 500 }),
});

export const userCharacters = pgTable('user_characters', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  userId: bigint('user_id', { mode: 'number' }).notNull(),
  characterId: bigint('character_id', { mode: 'number' }).notNull(),
  level: integer('level').notNull().default(1),
  exp: bigint('exp', { mode: 'number' }).notNull().default(0),
  currentHp: integer('current_hp').notNull(),
  currentAtk: integer('current_atk').notNull(),
  currentDef: integer('current_def').notNull(),
  currentSpd: integer('current_spd').notNull(),
  critRate: decimal('crit_rate', { precision: 5, scale: 2 }).notNull().default('5.0'),
  critDamage: decimal('crit_damage', { precision: 5, scale: 2 }).notNull().default('50.0'),
  accuracy: decimal('accuracy', { precision: 5, scale: 2 }).notNull().default('0.0'),
  resistance: decimal('resistance', { precision: 5, scale: 2 }).notNull().default('0.0'),
  skill1Level: integer('skill_1_level').notNull().default(1),
  skill2Level: integer('skill_2_level').notNull().default(1),
  skill3Level: integer('skill_3_level').notNull().default(1),
  skill4Level: integer('skill_4_level').notNull().default(1),
  awakened: integer('awakened').notNull().default(0),
  obtainedAt: timestamp('obtained_at', { mode: 'string' }).notNull(),
});

export const dungeons = pgTable('dungeons', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  dungeonType: varchar('dungeon_type', { length: 20 }).notNull(),
  difficulty: varchar('difficulty', { length: 20 }).notNull(),
  chapter: integer('chapter').notNull().default(1),
  stage: integer('stage').notNull().default(1),
  energyCost: integer('energy_cost').notNull(),
  stages: jsonb('stages').notNull(),
  rewards: jsonb('rewards').notNull(),
  expReward: integer('exp_reward').notNull().default(0),
  goldReward: integer('gold_reward').notNull().default(0),
});

export const partyMembers = pgTable('party_members', {
  userId: bigint('user_id', { mode: 'number' }).notNull(),
  slotIndex: integer('slot_index').notNull(),
  userCharacterId: bigint('user_character_id', { mode: 'number' }).notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.slotIndex] }),
}));

export const summonHistory = pgTable('summon_history', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  userId: bigint('user_id', { mode: 'number' }).notNull(),
  summonType: varchar('summon_type', { length: 20 }).notNull(),
  characterId: bigint('character_id', { mode: 'number' }).notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull(),
});

export const guilds = pgTable('guilds', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  name: varchar('name', { length: 50 }).notNull().unique(),
  leaderId: bigint('leader_id', { mode: 'number' }).notNull(),
  level: integer('level').notNull().default(1),
  membersCount: integer('members_count').notNull().default(1),
  maxMembers: integer('max_members').notNull().default(20),
  description: varchar('description', { length: 2048 }),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull(),
});

export const guildMembers = pgTable('guild_members', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  guildId: bigint('guild_id', { mode: 'number' }).notNull(),
  userId: bigint('user_id', { mode: 'number' }).notNull(),
  role: varchar('role', { length: 20 }).notNull().default('member'),
  contribution: integer('contribution').notNull().default(0),
  joinedAt: timestamp('joined_at', { mode: 'string' }).notNull(),
}, (table) => ({
  userUnique: unique().on(table.userId),
}));

export const shopItems = pgTable('shop_items', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: varchar('description', { length: 2048 }),
  itemType: varchar('item_type', { length: 20 }).notNull(),
  currencyType: varchar('currency_type', { length: 20 }).notNull(),
  price: integer('price').notNull(),
  itemData: jsonb('item_data').notNull(),
  stock: integer('stock').notNull().default(-1),
  isActive: boolean('is_active').notNull().default(true),
});

export const quests = pgTable('quests', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: varchar('description', { length: 2048 }),
  questType: varchar('quest_type', { length: 20 }).notNull(),
  conditionType: varchar('condition_type', { length: 50 }).notNull(),
  conditionTarget: integer('condition_target').notNull().default(1),
  rewards: jsonb('rewards').notNull(),
  orderIndex: integer('order_index').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
});

export const userQuests = pgTable('user_quests', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  userId: bigint('user_id', { mode: 'number' }).notNull(),
  questId: bigint('quest_id', { mode: 'number' }).notNull(),
  progress: integer('progress').notNull().default(0),
  isCompleted: boolean('is_completed').notNull().default(false),
  isClaimed: boolean('is_claimed').notNull().default(false),
  startedAt: timestamp('started_at', { mode: 'string' }).notNull(),
  completedAt: timestamp('completed_at', { mode: 'string' }),
  claimedAt: timestamp('claimed_at', { mode: 'string' }),
});

// ── New tables from migration 000013 & 000014 ─────────────────────────────────

export const userDungeonProgress = pgTable('user_dungeon_progress', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  userId: bigint('user_id', { mode: 'number' }).notNull(),
  dungeonId: bigint('dungeon_id', { mode: 'number' }).notNull(),
  clearedAt: timestamp('cleared_at', { mode: 'string' }).notNull(),
}, (table) => ({
  userDungeonUnique: unique().on(table.userId, table.dungeonId),
}));

export const userItems = pgTable('user_items', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  userId: bigint('user_id', { mode: 'number' }).notNull(),
  itemType: varchar('item_type', { length: 50 }).notNull(),
  itemId: bigint('item_id', { mode: 'number' }).notNull().default(0),
  itemName: varchar('item_name', { length: 100 }).notNull().default(''),
  quantity: integer('quantity').notNull().default(0),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull(),
}, (table) => ({
  userItemUnique: unique().on(table.userId, table.itemType, table.itemId),
}));

export const weeklyQuests = pgTable('weekly_quests', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: varchar('description', { length: 2048 }),
  conditionType: varchar('condition_type', { length: 50 }).notNull(),
  conditionTarget: integer('condition_target').notNull().default(1),
  rewards: jsonb('rewards').notNull(),
  orderIndex: integer('order_index').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
});

export const achievements = pgTable('achievements', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: varchar('description', { length: 2048 }),
  conditionType: varchar('condition_type', { length: 50 }).notNull(),
  conditionTarget: integer('condition_target').notNull().default(1),
  rewards: jsonb('rewards').notNull(),
  orderIndex: integer('order_index').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
});
