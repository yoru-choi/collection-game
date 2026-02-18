import { gameRepository } from '../../repositories/gameRepository';
import { ServiceResult, serviceFail, serviceOk } from '../result';
import { paginate } from './pagination';

export const gameCharacterService = {
  getCharacters(userId: number, page?: number, limit?: number): ServiceResult<Record<string, unknown> | unknown[]> {
    const list = gameRepository.getUserCharacters(userId)
      .map((entry) => gameRepository.getUserCharacterDetail(userId, entry.id))
      .filter(Boolean);

    if (page && limit) {
      return serviceOk(paginate(list, page, limit));
    }

    return serviceOk(list);
  },

  getCharacter(userId: number, characterId: number): ServiceResult<unknown> {
    const detail = gameRepository.getUserCharacterDetail(userId, characterId);
    if (!detail) {
      return serviceFail('character not found', 404);
    }

    return serviceOk(detail);
  },

  levelUpCharacter(userId: number, characterId: number, expCrystals: number): ServiceResult<unknown> {
    const updated = gameRepository.levelUpCharacter(userId, characterId, expCrystals);
    if (!updated) {
      return serviceFail('character not found', 404);
    }

    return serviceOk(updated);
  },

  awakenCharacter(userId: number, characterId: number): ServiceResult<unknown> {
    const updated = gameRepository.awakenCharacter(userId, characterId);
    if (!updated) {
      return serviceFail('character not found', 404);
    }

    return serviceOk(updated);
  },

  skillUpCharacter(userId: number, characterId: number, skillSlot: number): ServiceResult<unknown> {
    const updated = gameRepository.skillUpCharacter(userId, characterId, skillSlot);
    if (!updated) {
      return serviceFail('character not found', 404);
    }

    return serviceOk(updated);
  },

  getParty(userId: number): ServiceResult<{ character_ids: number[] }> {
    return serviceOk({ character_ids: gameRepository.getParty(userId) });
  },

  setParty(userId: number, ids: number[]): ServiceResult<{ character_ids: number[] }> {
    if (ids.length < 1 || ids.length > 4) {
      return serviceFail('party must include 1~4 characters', 400);
    }

    return serviceOk({ character_ids: gameRepository.setParty(userId, ids) });
  },

  summon(userId: number, banner: 'normal' | 'premium', count: number): ServiceResult<unknown> {
    if (![1, 10].includes(count)) {
      return serviceFail('count must be 1 or 10', 400);
    }

    const results = gameRepository.summon(userId, banner, count);
    const user = gameRepository.getUserById(userId);

    return serviceOk({
      results,
      remaining_crystals: user?.crystals || 0,
    });
  },
};
