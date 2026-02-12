import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { LoginScene } from './scenes/LoginScene';
import { TutorialScene } from './scenes/TutorialScene';
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
import { SettingsScene } from './scenes/SettingsScene';
import { CreditsScene } from './scenes/CreditsScene';
import { GAME_CONFIG } from './utils/Constants';

console.log('Game config: Initializing...');

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_CONFIG.WIDTH,
  height: GAME_CONFIG.HEIGHT,
  parent: 'game-container',
  backgroundColor: '#18150f',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    // 반응형: 모든 화면 크기에 자동 대응 (Windows, iPad, Mobile)
    width: GAME_CONFIG.WIDTH,
    height: GAME_CONFIG.HEIGHT,
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
    TutorialScene,
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
    SettingsScene,
    CreditsScene,
  ],
  callbacks: {
    preBoot: (game) => {
      console.log('Game config: Pre-boot callback', game);
    },
    postBoot: (game) => {
      console.log('Game config: Post-boot callback', game);
    },
  },
};

console.log('Game config: Configuration created', config);

export default config;
