import { v4 as uuidv4 } from 'uuid';
import { and, asc, eq } from 'drizzle-orm';
import { env } from '../config/env';
import { Character, Dungeon, BattleState, User, UserCharacter } from '../types';
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
} from '../db/schema';

const now = (): string => new Date().toISOString();

const characters: Character[] = [
  { id: 1, name: 'Novice Fighter', grade: 1, element: 'fire', class: 'warrior', base_hp: 850, base_atk: 120, base_def: 70, base_spd: 102, skill_1_id: 101, skill_2_id: 102, skill_3_id: 103, skill_4_id: 104, image_url: '/monsters/warrior_fire_1.png' },
  { id: 2, name: 'Forest Healer', grade: 2, element: 'wind', class: 'support', base_hp: 980, base_atk: 80, base_def: 90, base_spd: 98, skill_1_id: 201, skill_2_id: 202, skill_3_id: 203, skill_4_id: 204, image_url: '/monsters/support_wind_1.png' },
  { id: 3, name: 'Water Archer', grade: 2, element: 'water', class: 'archer', base_hp: 760, base_atk: 150, base_def: 60, base_spd: 110, skill_1_id: 301, skill_2_id: 302, skill_3_id: 303, skill_4_id: 304, image_url: '/monsters/archer_water_1.png' },
  { id: 4, name: 'Light Knight', grade: 3, element: 'light', class: 'tank', base_hp: 1150, base_atk: 95, base_def: 140, base_spd: 95, skill_1_id: 401, skill_2_id: 402, skill_3_id: 403, skill_4_id: 404, image_url: '/monsters/tank_light_1.png' },
  { id: 5, name: 'Dark Mage', grade: 4, element: 'dark', class: 'mage', base_hp: 790, base_atk: 180, base_def: 65, base_spd: 105, skill_1_id: 501, skill_2_id: 502, skill_3_id: 503, skill_4_id: 504, image_url: '/monsters/mage_dark_1.png' },
];

const dungeons: Dungeon[] = [
  {
    id: 101,
    name: 'Story 1-1: Forest Edge',
    dungeon_type: 'story',
    difficulty: 'normal',
    chapter: 1,
    stage: 1,
    energy_cost: 6,
    stages: [{ stage_number: 1, waves: 3 }],
    rewards: [{ type: 'material', name: 'exp_crystal', amount: 1 }],
    exp_reward: 100,
    gold_reward: 1500,
  },
  {
    id: 102,
    name: 'Story 1-2: Ruin Gate',
    dungeon_type: 'story',
    difficulty: 'normal',
    chapter: 1,
    stage: 2,
    energy_cost: 7,
    stages: [{ stage_number: 1, waves: 3 }],
    rewards: [{ type: 'material', name: 'exp_crystal', amount: 2 }],
    exp_reward: 140,
    gold_reward: 1800,
  },
];

const users = new Map<number, User>();
const usersByUsername = new Map<string, number>();
const usersByEmail = new Map<string, number>();

const userCharacters = new Map<number, UserCharacter[]>();
const userParty = new Map<number, number[]>();
const battles = new Map<number, BattleState>();
const userGuild = new Map<number, number>();

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

const shopItems = [
  { id: 1, name: 'Small Energy Potion', description: 'Recover 20 energy', item_type: 'energy', currency_type: 'gold', price: 1000, stock: 99 },
  { id: 2, name: 'Summon Scroll', description: 'Normal summon x1', item_type: 'material', currency_type: 'crystal', price: 100, stock: 999 },
];

const dailyQuests = [
  { id: 1, type: 'daily', title: '로그인 1회', description: '오늘 게임에 로그인하기', progress: 1, goal: 1, rewards: [{ type: 'currency', name: 'gold', quantity: 1000 }], isCompleted: true, isClaimed: false },
  { id: 2, type: 'daily', title: '던전 1회 클리어', description: '스토리 던전 1회 완료', progress: 0, goal: 1, rewards: [{ type: 'currency', name: 'crystal', quantity: 30 }], isCompleted: false, isClaimed: false },
];

const persist = (task: () => Promise<void>): void => {
  void task().catch((error) => {
    console.error('[db-persist] failed:', error);
  });
};

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

const hydrateFromDb = async (): Promise<void> => {
  try {
    const [dbUsers, dbCharacters, dbDungeons, dbUserChars, dbParty, dbGuilds, dbGuildMembers, dbShopItems, dbQuests] = await Promise.all([
      db.select().from(usersTable),
      db.select().from(charactersTable),
      db.select().from(dungeonsTable),
      db.select().from(userCharactersTable),
      db.select().from(partyMembersTable).orderBy(asc(partyMembersTable.slotIndex)),
      db.select().from(guildsTable),
      db.select().from(guildMembersTable),
      db.select().from(shopItemsTable).where(eq(shopItemsTable.isActive, true)),
      db.select().from(questsTable).where(and(eq(questsTable.isActive, true), eq(questsTable.questType, 'daily'))),
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
      dungeons.push(...dbDungeons.map((row) => ({
        id: row.id,
        name: row.name,
        dungeon_type: row.dungeonType,
        difficulty: row.difficulty,
        chapter: row.chapter,
        stage: row.stage,
        energy_cost: row.energyCost,
        stages: Array.isArray(row.stages) ? row.stages as Array<{ stage_number: number; waves: number }> : [],
        rewards: Array.isArray(row.rewards) ? row.rewards as Array<{ type: string; name?: string; amount: number }> : [],
        exp_reward: row.expReward,
        gold_reward: row.goldReward,
      })));
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
      })));
    }

    if (dbQuests.length > 0) {
      dailyQuests.length = 0;
      dailyQuests.push(...dbQuests.map((row) => ({
        id: row.id,
        type: 'daily',
        title: row.name,
        description: row.description || '',
        progress: 0,
        goal: row.conditionTarget,
        rewards: Array.isArray(row.rewards) ? (row.rewards as Array<{ type: string; name?: string; amount?: number; quantity?: number }>).map((reward) => ({
          type: reward.type,
          name: reward.name || reward.type,
          quantity: reward.quantity ?? reward.amount ?? 1,
        })) : [],
        isCompleted: false,
        isClaimed: false,
      })));
    }
  } catch (error) {
    console.warn('[db-hydrate] fallback to in-memory seed:', error);
  }
};

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
  crit_rate: 15,
  crit_damage: 50,
  accuracy: 0,
  resistance: 0,
  skill_1_level: 1,
  skill_2_level: 1,
  skill_3_level: 1,
  skill_4_level: 1,
  awakened: false,
  obtained_at: now(),
});

export const dataStore = {
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
      skill_1_id: base.skill_1_id,
      skill_2_id: base.skill_2_id,
      skill_3_id: base.skill_3_id,
      skill_4_id: base.skill_4_id,
      image_url: base.image_url,
    };
  },

  levelUpCharacter(userId: number, userCharacterId: number, expCrystals = 1): Record<string, unknown> | null {
    const entry = this.getUserCharacters(userId).find((character) => character.id === userCharacterId);
    if (!entry) {
      return null;
    }

    entry.exp += Math.max(1, expCrystals) * 100;
    while (entry.exp >= entry.level * 100) {
      entry.exp -= entry.level * 100;
      entry.level += 1;
      entry.current_hp += 30;
      entry.current_atk += 5;
      entry.current_def += 4;
      entry.current_spd += 1;
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
        })
        .where(eq(userCharactersTable.id, userCharacterId));
    });

    return this.getUserCharacterDetail(userId, userCharacterId);
  },

  awakenCharacter(userId: number, userCharacterId: number): Record<string, unknown> | null {
    const entry = this.getUserCharacters(userId).find((character) => character.id === userCharacterId);
    if (!entry) {
      return null;
    }

    entry.awakened = true;
    entry.current_hp += 100;
    entry.current_atk += 15;
    entry.current_def += 12;

    persist(async () => {
      await db.update(userCharactersTable)
        .set({
          awakened: true,
          currentHp: entry.current_hp,
          currentAtk: entry.current_atk,
          currentDef: entry.current_def,
        })
        .where(eq(userCharactersTable.id, userCharacterId));
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

    user.crystals = Math.max(0, user.crystals - totalCost);

    const owned = this.getUserCharacters(userId);

    const results = Array.from({ length: totalCount }).map((_value, index) => {
      let targetPool = characters;
      if (type === 'premium' || (count === 10 && index === totalCount - 1)) {
        targetPool = characters.filter((character) => character.grade >= 3);
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

  createBattleFromDungeon(userId: number, dungeonId: number): BattleState | null {
    const dungeon = this.getDungeonById(dungeonId);
    if (!dungeon) {
      return null;
    }

    const memberIds = this.getParty(userId);
    const ownCharacters = this.getUserCharacters(userId);
    const allies = memberIds
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
          skills: [{
            skill_id: base.skill_1_id,
            slot_index: 0,
            name: 'Basic Attack',
            skill_type: 'damage',
            target_type: 'single',
            multiplier: 1,
            max_cooldown: 0,
            current_cd: 0,
            effects: 'deal damage',
          }],
          buffs: [],
          debuffs: [],
          is_alive: true,
        };
      });

    const enemies = [0, 1, 2].map((position) => ({
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
      crit_rate: 15,
      crit_damage: 50,
      accuracy: 0,
      resistance: 0,
      atb_gauge: 0,
      skills: [{
        skill_id: 999,
        slot_index: 0,
        name: 'Claw',
        skill_type: 'damage',
        target_type: 'single',
        multiplier: 1,
        max_cooldown: 0,
        current_cd: 0,
        effects: 'deal damage',
      }],
      buffs: [],
      debuffs: [],
      is_alive: true,
    }));

    const battleState: BattleState = {
      battle_id: battleIdSeq++,
      phase: 'action_select',
      current_wave: 1,
      total_waves: 1,
      allies,
      enemies,
      active_unit_id: allies[0]?.unit_id,
      auto_mode: false,
      speed_multiplier: 1,
      turn_counter: 1,
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

  getBattleResult(battleId: number): BattleState['result'] | null {
    const battle = battles.get(battleId);
    return battle?.result || null;
  },

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

  getShopItems(): Array<Record<string, unknown>> {
    return shopItems;
  },

  purchaseItem(userId: number, shopItemId: number, quantity: number): boolean {
    const user = this.getUserById(userId);
    const item = shopItems.find((shopItem) => shopItem.id === shopItemId);

    if (!user || !item || quantity <= 0) {
      return false;
    }

    const totalCost = item.price * quantity;
    if (item.currency_type === 'gold') {
      if (user.gold < totalCost) {
        return false;
      }
      user.gold -= totalCost;
      if (item.item_type === 'energy') {
        user.energy = Math.min(user.maxEnergy, user.energy + 20 * quantity);
      }

      persist(async () => {
        await db.update(usersTable)
          .set({
            gold: user.gold,
            energy: user.energy,
            updatedAt: now(),
          })
          .where(eq(usersTable.id, userId));
      });

      return true;
    }

    if (user.crystals < totalCost) {
      return false;
    }

    user.crystals -= totalCost;

    persist(async () => {
      await db.update(usersTable)
        .set({
          crystals: user.crystals,
          updatedAt: now(),
        })
        .where(eq(usersTable.id, userId));
    });

    return true;
  },

  getDailyQuests(): Array<Record<string, unknown>> {
    return dailyQuests;
  },

  completeQuest(questId: number): boolean {
    const quest = dailyQuests.find((entry) => entry.id === questId);
    if (!quest) {
      return false;
    }
    quest.progress = quest.goal;
    quest.isCompleted = true;
    return true;
  },

  claimQuest(userId: number, questId: number): Record<string, unknown> | null {
    const user = this.getUserById(userId);
    const quest = dailyQuests.find((entry) => entry.id === questId);

    if (!user || !quest || !quest.isCompleted || quest.isClaimed) {
      return null;
    }

    quest.isClaimed = true;
    quest.rewards.forEach((reward) => {
      if (reward.name === 'gold') {
        user.gold += reward.quantity;
      }
      if (reward.name === 'crystal') {
        user.crystals += reward.quantity;
      }
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

    return {
      questId,
      rewards: quest.rewards,
    };
  },
};

void hydrateFromDb();
