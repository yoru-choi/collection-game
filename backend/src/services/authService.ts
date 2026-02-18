import { comparePassword, hashPassword } from '../utils/password';
import { authRepository } from '../repositories/authRepository';
import { ServiceResult, serviceFail, serviceOk } from './result';

interface AuthPayload {
  authToken: string;
  refreshToken: string;
  user?: Record<string, unknown>;
}

export const authService = {
  async register(username?: string, email?: string, password?: string): Promise<ServiceResult<AuthPayload>> {
    if (!username || !email || !password) {
      return serviceFail('username, email, password are required', 400);
    }

    if (authRepository.getUserByUsername(username) || authRepository.getUserByEmail(email)) {
      return serviceFail('username or email already exists', 409);
    }

    const passwordHash = await hashPassword(password);
    const user = authRepository.createUser(username, email, passwordHash);
    const authToken = authRepository.createAccessToken(user.id);
    const refreshToken = authRepository.createRefreshToken(user.id);
    await authRepository.persistRefreshToken(refreshToken);

    return serviceOk({
      authToken,
      refreshToken,
      user: authRepository.toUserResponse(user),
    }, 201);
  },

  async login(username?: string, password?: string): Promise<ServiceResult<AuthPayload>> {
    if (!username || !password) {
      return serviceFail('username and password are required', 400);
    }

    const user = authRepository.getUserByUsername(username);
    if (!user) {
      return serviceFail('invalid credentials', 401);
    }

    const matched = await comparePassword(password, user.passwordHash);
    if (!matched) {
      return serviceFail('invalid credentials', 401);
    }

    const authToken = authRepository.createAccessToken(user.id);
    const refreshToken = authRepository.createRefreshToken(user.id);
    await authRepository.persistRefreshToken(refreshToken);

    return serviceOk({
      authToken,
      refreshToken,
      user: authRepository.toUserResponse(user),
    });
  },

  async refresh(token: string | null): Promise<ServiceResult<AuthPayload>> {
    if (!token) {
      return serviceFail('refresh token not found', 401);
    }

    const userId = await authRepository.verifyRefreshToken(token);
    if (!userId) {
      return serviceFail('invalid refresh token', 401);
    }

    await authRepository.revokeRefreshToken(token);

    const authToken = authRepository.createAccessToken(userId);
    const refreshToken = authRepository.createRefreshToken(userId);
    await authRepository.persistRefreshToken(refreshToken);

    return serviceOk({ authToken, refreshToken });
  },

  async logout(refreshToken: string | null, accessToken?: string): Promise<ServiceResult<{ message: string }>> {
    if (refreshToken) {
      await authRepository.revokeRefreshToken(refreshToken);
    }

    if (accessToken) {
      await authRepository.blacklistAccessToken(accessToken);
    }

    return serviceOk({ message: 'logged out successfully' });
  },
};
