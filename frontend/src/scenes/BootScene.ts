import Phaser from 'phaser';
import { SCENE_KEYS } from '@/utils/Constants';
import { addSceneFrame } from '@/utils/SceneFrame';
import { GameDataStore } from '@/store/GameDataStore';
import { AuthService } from '@/services/AuthService';
import { MONSTER_IMAGE_KEYS, getMonsterImagePath } from '@/utils/monsterImages';

export class BootScene extends Phaser.Scene {
  private loadingText!: Phaser.GameObjects.Text;
  private progressBar!: Phaser.GameObjects.Graphics;
  private progressBox!: Phaser.GameObjects.Graphics;
  private authService: AuthService;

  constructor() {
    super({ key: SCENE_KEYS.BOOT });
    this.authService = new AuthService();
  }

  preload(): void {
    console.log('BootScene: Starting preload...');
    this.createLoadingScreen();
    this.loadAssets();
  }

  private createLoadingScreen(): void {
    console.log('BootScene: Creating loading screen...');
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Progress bar background
    this.progressBox = this.add.graphics();
    this.progressBox.fillStyle(0x222222, 0.8);
    this.progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);

    // Progress bar
    this.progressBar = this.add.graphics();

    // Loading text
    this.loadingText = this.add.text(width / 2, height / 2 - 50, 'Loading...', {
      fontSize: '24px',
      color: '#ffffff',
    });
    this.loadingText.setOrigin(0.5);

    // Percentage text
    const percentText = this.add.text(width / 2, height / 2, '0%', {
      fontSize: '18px',
      color: '#ffffff',
    });
    percentText.setOrigin(0.5);

    // Update progress
    this.load.on('progress', (value: number) => {
      percentText.setText(`${Math.floor(value * 100)}%`);
      this.progressBar.clear();
      this.progressBar.fillStyle(0x4a90e2, 1);
      this.progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
    });

    this.load.on('complete', () => {
      this.progressBar.destroy();
      this.progressBox.destroy();
      this.loadingText.destroy();
      percentText.destroy();
    });
  }

  private loadAssets(): void {
    console.log('BootScene: Loading assets...');
    
    // TODO: Load actual game assets
    // For now, we'll create placeholder assets
    
    // Load UI assets (placeholder)
    // this.load.image('button', 'assets/ui/button.png');
    // this.load.image('panel', 'assets/ui/panel.png');
    
    // Load character sprites (placeholder)
    // this.load.atlas('characters', 'assets/characters/atlas.png', 'assets/characters/atlas.json');
    
    // Load background images
    // this.load.image('lobby-bg', 'assets/backgrounds/lobby.jpg');
    
    // Load audio
    // this.load.audio('bgm', 'assets/audio/bgm.mp3');
    
    MONSTER_IMAGE_KEYS.forEach((key) => {
      this.load.image(key, getMonsterImagePath(key));
    });

    // Create placeholder graphics for development
    this.createPlaceholderAssets();
    
    // Ensure load:complete event fires even with no assets
    if (this.load.totalToLoad === 0) {
      console.log('BootScene: No assets to load, triggering complete event manually');
      this.load.once('complete', () => {
        console.log('BootScene: Load complete event fired');
      });
      this.load.start();
    }
  }

  private createPlaceholderAssets(): void {
    // Create placeholder textures programmatically
    const graphics = this.make.graphics({ x: 0, y: 0 });
    
    // Button placeholder
    graphics.fillStyle(0x4a90e2);
    graphics.fillRoundedRect(0, 0, 200, 60, 10);
    graphics.generateTexture('button', 200, 60);
    graphics.clear();
    
    // Panel placeholder
    graphics.fillStyle(0x2c3e50, 0.9);
    graphics.fillRoundedRect(0, 0, 400, 300, 15);
    graphics.lineStyle(2, 0x4a90e2);
    graphics.strokeRoundedRect(0, 0, 400, 300, 15);
    graphics.generateTexture('panel', 400, 300);
    graphics.clear();
    
    // Character placeholder
    graphics.fillStyle(0x7b68ee);
    graphics.fillCircle(50, 50, 50);
    graphics.generateTexture('character-placeholder', 100, 100);
    graphics.clear();

    // UI particle (small glow dot)
    graphics.fillStyle(0xffffff, 0.8);
    graphics.fillCircle(4, 4, 4);
    graphics.generateTexture('ui-particle', 8, 8);
    graphics.clear();

    // ── Home World Assets ─────────────────────────────────────
    // Player character texture (44×44 — circle head + body silhouette)
    graphics.fillStyle(0x4caf50, 1);
    graphics.fillCircle(22, 10, 10); // head
    graphics.fillRoundedRect(14, 18, 16, 20, 4); // body
    graphics.fillTriangle(22, 14, 18, 40, 26, 40); // legs hint
    graphics.generateTexture('player-char', 44, 44);
    graphics.clear();

    // Player direction arrow overlay (for facing indicator)
    graphics.fillStyle(0xffee00, 1);
    graphics.fillTriangle(10, 20, 0, 0, 20, 0);
    graphics.generateTexture('player-arrow', 20, 20);
    graphics.clear();

    // Monster textures per grade (coloured circles with star-count indicator)
    const gradeColors = [0x9e9e9e, 0x4caf50, 0x2196f3, 0x9c27b0, 0xff9800];
    const gradeNames = ['1star', '2star', '3star', '4star', '5star'];
    gradeColors.forEach((col, i) => {
      graphics.fillStyle(col, 1);
      graphics.fillCircle(20, 20, 18);
      graphics.lineStyle(3, 0xffffff, 0.8);
      graphics.strokeCircle(20, 20, 18);
      graphics.generateTexture(`monster-${gradeNames[i]}`, 40, 40);
      graphics.clear();
    });

    // Interactive zone textures
    const zones = [
      { key: 'zone-dungeon', color: 0xb71c1c, label: 'D' },
      { key: 'zone-summon',  color: 0x6a1b9a, label: 'S' },
      { key: 'zone-shop',    color: 0xe65100, label: '$' },
      { key: 'zone-guild',   color: 0x1565c0, label: 'G' },
    ];
    zones.forEach(({ key, color }) => {
      graphics.fillStyle(color, 0.85);
      graphics.fillCircle(40, 40, 38);
      graphics.lineStyle(4, 0xffffff, 0.7);
      graphics.strokeCircle(40, 40, 38);
      graphics.generateTexture(key, 80, 80);
      graphics.clear();
    });

    // Home world background tile texture (64×64 grass-like pattern)
    graphics.fillStyle(0x2d5a1b, 1);
    graphics.fillRect(0, 0, 64, 64);
    graphics.fillStyle(0x3d6e27, 0.4);
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if ((r + c) % 2 === 0) {
          graphics.fillRect(c * 16, r * 16, 16, 16);
        }
      }
    }
    graphics.generateTexture('tile-grass', 64, 64);
    graphics.clear();

    // Path tile texture
    graphics.fillStyle(0x8d6e63, 1);
    graphics.fillRect(0, 0, 64, 64);
    graphics.fillStyle(0x795548, 0.5);
    graphics.fillRect(4, 4, 56, 56);
    graphics.generateTexture('tile-path', 64, 64);
    graphics.clear();

    // Obstacle/wall texture
    graphics.fillStyle(0x546e7a, 1);
    graphics.fillRect(0, 0, 64, 64);
    graphics.lineStyle(2, 0x78909c, 1);
    graphics.strokeRect(0, 0, 64, 64);
    graphics.generateTexture('tile-wall', 64, 64);
    graphics.clear();

    graphics.destroy();
  }

  create(): void {
    console.log('Boot Scene: Assets loaded successfully');
    
    // 디버그: 화면에 상태 표시
    const statusText = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      'Initializing...',
      {
        fontSize: '24px',
        color: '#ffffff',
      }
    );
    statusText.setOrigin(0.5);
    
    // Initialize game data store with mock data for development
    const gameData = GameDataStore.getInstance();
    
    // Load mock data if no player data exists
    if (!gameData.getPlayerData()) {
      console.log('Loading mock player data for development...');
      statusText.setText('Loading game data...');
      gameData.loadMockData();
    }
    
    // Check if user is already logged in
    if (this.authService.isAuthenticated()) {
      console.log('User authenticated, starting home world...');
      statusText.setText('Starting game...');
      this.time.delayedCall(500, () => {
        this.scene.start(SCENE_KEYS.HOME);
      });
    } else {
      // User is not logged in, go to login screen
      console.log('User not authenticated, starting login...');
      statusText.setText('Loading login screen...');
      this.time.delayedCall(500, () => {
        this.scene.start(SCENE_KEYS.LOGIN);
      });
    }

    addSceneFrame(this);
    
    // Listen for logout event
    window.addEventListener('auth:logout', () => {
      console.log('Logout event received, returning to login...');
      this.scene.start(SCENE_KEYS.LOGIN);
    });
  }
}
