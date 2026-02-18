import { gameCharacterRepository } from './game/characterRepository';
import { gameDungeonBattleRepository } from './game/dungeonBattleRepository';
import { gameSocialRepository } from './game/socialRepository';
import { gameUserRepository } from './game/userRepository';

export const gameRepository = {
  ...gameUserRepository,
  ...gameCharacterRepository,
  ...gameDungeonBattleRepository,
  ...gameSocialRepository,
};
