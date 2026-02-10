import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { LoginScene } from './scenes/LoginScene';
import { LobbyScene } from './scenes/LobbyScene';
import { CharacterListScene } from './scenes/CharacterListScene';
import { CharacterDetailScene } from './scenes/CharacterDetailScene';
import { SummonScene } from './scenes/SummonScene';
import { DungeonSelectScene } from './scenes/DungeonSelectScene';
import { BattleScene } from './scenes/BattleScene';
import { ArenaScene } from './scenes/ArenaScene';
import { GuildScene } from './scenes/GuildScene';
import { ShopScene } from './scenes/ShopScene';
import { InventoryScene } from './scenes/InventoryScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  parent: 'game-container',
  backgroundColor: '#000000',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0, x: 0 },
      debug: false,
    },
  },
  scene: [
    BootScene,
    LoginScene,
    LobbyScene,
    CharacterListScene,
    CharacterDetailScene,
    SummonScene,
    DungeonSelectScene,
    BattleScene,
    ArenaScene,
    GuildScene,
    ShopScene,
    InventoryScene,
  ],
};

export default config;
