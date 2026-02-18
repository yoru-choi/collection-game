import { gameCharacterHandler } from './game/characterHandler';
import { gameDungeonBattleHandler } from './game/dungeonBattleHandler';
import { gameSocialHandler } from './game/socialHandler';
import { gameUserHandler } from './game/userHandler';

export const gameHandler = {
  ...gameUserHandler,
  ...gameCharacterHandler,
  ...gameDungeonBattleHandler,
  ...gameSocialHandler,
};
