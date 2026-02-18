import { gameCharacterService } from './game/characterService';
import { gameDungeonBattleService } from './game/dungeonBattleService';
import { gameSocialService } from './game/socialService';
import { gameUserService } from './game/userService';

export const gameService = {
  ...gameUserService,
  ...gameCharacterService,
  ...gameDungeonBattleService,
  ...gameSocialService,
};
