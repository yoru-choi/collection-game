import { dataStore } from '../../store/memoryStore';

export const gameUserRepository = {
  getUserById: (userId: number) => dataStore.getUserById(userId),
  toUserResponse: (user: NonNullable<ReturnType<typeof dataStore.getUserById>>) => dataStore.toUserResponse(user),
  updateProfile: (userId: number, payload: { username?: string; email?: string }) => dataStore.updateProfile(userId, payload),
};
