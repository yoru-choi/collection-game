import { dataStore } from '../store/memoryStore';
import {
  blacklistAccessToken,
  createAccessToken,
  createRefreshToken,
  persistRefreshToken,
  revokeRefreshToken,
  verifyRefreshToken,
} from '../services/tokenService';
import { User } from '../types';

export const authRepository = {
  getUserByUsername: (username: string) => dataStore.getUserByUsername(username),
  getUserByEmail: (email: string) => dataStore.getUserByEmail(email),
  createUser: (username: string, email: string, passwordHash: string) => dataStore.createUser(username, email, passwordHash),
  toUserResponse: (user: User) => dataStore.toUserResponse(user),

  createAccessToken,
  createRefreshToken,
  persistRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
  blacklistAccessToken,
};
