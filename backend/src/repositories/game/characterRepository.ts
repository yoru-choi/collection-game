import { dataStore } from '../../store/memoryStore';

export const gameCharacterRepository = {
  getUserCharacters: (userId: number) => dataStore.getUserCharacters(userId),
  getUserCharacterDetail: (userId: number, characterId: number) => dataStore.getUserCharacterDetail(userId, characterId),
  levelUpCharacter: (userId: number, characterId: number, expCrystals: number) => dataStore.levelUpCharacter(userId, characterId, expCrystals),
  awakenCharacter: (userId: number, characterId: number) => dataStore.awakenCharacter(userId, characterId),
  skillUpCharacter: (userId: number, characterId: number, skillSlot: number) => dataStore.skillUpCharacter(userId, characterId, skillSlot),

  getParty: (userId: number) => dataStore.getParty(userId),
  setParty: (userId: number, ids: number[]) => dataStore.setParty(userId, ids),

  summon: (userId: number, banner: 'normal' | 'premium', count: number) => dataStore.summon(userId, banner, count),
};
