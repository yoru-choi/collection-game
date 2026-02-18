import { gameRepository } from '../../repositories/gameRepository';
import { ServiceResult, serviceFail, serviceOk } from '../result';

export const gameUserService = {
  getProfile(userId: number): ServiceResult<unknown> {
    const user = gameRepository.getUserById(userId);
    if (!user) {
      return serviceFail('user not found', 404);
    }

    return serviceOk(gameRepository.toUserResponse(user));
  },

  updateProfile(userId: number, username?: string, email?: string): ServiceResult<unknown> {
    const updated = gameRepository.updateProfile(userId, { username, email });
    if (!updated) {
      return serviceFail('user not found', 404);
    }

    return serviceOk(gameRepository.toUserResponse(updated));
  },

  getInventory(userId: number): ServiceResult<unknown> {
    const user = gameRepository.getUserById(userId);
    if (!user) {
      return serviceFail('user not found', 404);
    }

    return serviceOk({
      crystals: user.crystals,
      gold: user.gold,
      energy: user.energy,
      maxEnergy: user.maxEnergy,
      max_energy: user.maxEnergy,
      level: user.level,
      exp: user.exp,
    });
  },
};
