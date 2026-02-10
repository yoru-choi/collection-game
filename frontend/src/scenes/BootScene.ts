import Phaser from 'phaser';
import { SCENE_KEYS } from '@/utils/Constants';
import { GameDataStore } from '@/store/GameDataStore';

export class BootScene extends Phaser.Scene {
  private loadingText!: Phaser.GameObjects.Text;
  private progressBar!: Phaser.GameObjects.Graphics;
  private progressBox!: Phaser.GameObjects.Graphics;

  constructor() {
    super({ key: SCENE_KEYS.BOOT });
  }

  preload(): void {
    this.createLoadingScreen();
    this.loadAssets();
  }

  private createLoadingScreen(): void {
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
    
    // Create placeholder graphics for development
    this.createPlaceholderAssets();
  }

  private createPlaceholderAssets(): void {
    // Create placeholder textures programmatically
    const graphics = this.make.graphics({ x: 0, y: 0, add: false });
    
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

    graphics.destroy();
  }

  create(): void {
    console.log('Boot Scene: Assets loaded successfully');
    
    // Initialize game data store with mock data for development
    const gameData = GameDataStore.getInstance();
    
    // Load mock data if no player data exists
    if (!gameData.getPlayerData()) {
      console.log('Loading mock player data for development...');
      gameData.loadMockData();
    }
    
    // Check if user is already logged in
    const { AuthService } = require('@/services/AuthService');
    const authService = new AuthService();
    
    if (authService.isAuthenticated()) {
      // User is logged in, go to lobby
      this.scene.start(SCENE_KEYS.LOBBY);
    } else {
      // User is not logged in, go to login screen
      this.scene.start(SCENE_KEYS.LOGIN);
    }
    
    // Listen for logout event
    window.addEventListener('auth:logout', () => {
      this.scene.start(SCENE_KEYS.LOGIN);
    });
  }
}
