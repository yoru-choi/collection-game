import Phaser from 'phaser';
import { SCENE_KEYS, COLORS, UI } from '@/utils/Constants';
import { GameDataStore } from '@/store/GameDataStore';

export class LobbyScene extends Phaser.Scene {
  private gameData!: GameDataStore;

  constructor() {
    super({ key: SCENE_KEYS.LOBBY });
  }

  create(): void {
    this.gameData = GameDataStore.getInstance();
    
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Background
    this.createBackground(width, height);

    // Top bar (user info, currency)
    this.createTopBar(width);

    // Menu buttons
    this.createMenuButtons(width, height);

    // Character display area
    this.createCharacterDisplay(width, height);

    // News/Event banner
    this.createEventBanner(width, height);
  }

  private createBackground(width: number, height: number): void {
    // Gradient background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x16213e, 0x16213e, 1);
    bg.fillRect(0, 0, width, height);
  }

  private createTopBar(width: number): void {
    const topBar = this.add.graphics();
    topBar.fillStyle(COLORS.DARK, 0.9);
    topBar.fillRect(0, 0, width, 80);
    topBar.lineStyle(2, COLORS.PRIMARY);
    topBar.strokeRect(0, 0, width, 80);

    // User info
    const username = this.gameData.getPlayerData()?.username || 'Guest';
    const level = this.gameData.getPlayerData()?.level || 1;
    
    this.add.text(20, 15, `${username} Lv.${level}`, {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold',
    });

    // Currency display
    const crystal = this.gameData.getPlayerData()?.crystals || 0;
    const gold = this.gameData.getPlayerData()?.gold || 0;
    const energy = this.gameData.getPlayerData()?.energy || 100;
    
    const currencyX = width - 350;
    this.add.text(currencyX, 20, `💎 ${crystal}`, {
      fontSize: '18px',
      color: '#4a90e2',
    });
    
    this.add.text(currencyX + 100, 20, `🪙 ${gold}`, {
      fontSize: '18px',
      color: '#f39c12',
    });
    
    this.add.text(currencyX + 200, 20, `⚡ ${energy}`, {
      fontSize: '18px',
      color: '#50c878',
    });

    // Progress bar for energy
    const progressBg = this.add.graphics();
    progressBg.fillStyle(0x34495e);
    progressBg.fillRoundedRect(20, 50, 200, 15, 5);
    
    const progress = this.add.graphics();
    progress.fillStyle(COLORS.SUCCESS);
    const progressWidth = (energy / 100) * 200;
    progress.fillRoundedRect(20, 50, progressWidth, 15, 5);
  }

  private createMenuButtons(width: number, height: number): void {
    const buttonData = [
      { text: 'Summon', scene: SCENE_KEYS.SUMMON, icon: '🎲', color: COLORS.SECONDARY },
      { text: 'Characters', scene: SCENE_KEYS.CHARACTER_LIST, icon: '👥', color: COLORS.PRIMARY },
      { text: 'Dungeon', scene: SCENE_KEYS.DUNGEON_SELECT, icon: '🏰', color: COLORS.DANGER },
      { text: 'Arena', scene: SCENE_KEYS.ARENA, icon: '⚔️', color: COLORS.WARNING },
      { text: 'Guild', scene: SCENE_KEYS.GUILD, icon: '🛡️', color: COLORS.INFO },
      { text: 'Shop', scene: SCENE_KEYS.SHOP, icon: '🛒', color: COLORS.SUCCESS },
      { text: 'Inventory', scene: SCENE_KEYS.INVENTORY, icon: '🎒', color: COLORS.PRIMARY },
    ];

    const startX = 150;
    const startY = height - 250;
    const gridCols = 4;
    const buttonSpacingX = 280;
    const buttonSpacingY = 140;

    buttonData.forEach((data, index) => {
      const col = index % gridCols;
      const row = Math.floor(index / gridCols);
      const x = startX + col * buttonSpacingX;
      const y = startY + row * buttonSpacingY;

      this.createMenuButton(x, y, data.text, data.icon, data.color, () => {
        this.scene.start(data.scene);
      });
    });
  }

  private createMenuButton(
    x: number,
    y: number,
    text: string,
    icon: string,
    color: number,
    callback: () => void
  ): void {
    const button = this.add.container(x, y);

    // Button background
    const bg = this.add.rectangle(0, 0, 240, 110, color, 0.9);
    bg.setStrokeStyle(3, COLORS.LIGHT);
    
    // Icon
    const iconText = this.add.text(0, -20, icon, {
      fontSize: '40px',
    });
    iconText.setOrigin(0.5);

    // Button text
    const buttonText = this.add.text(0, 25, text, {
      fontSize: '22px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    buttonText.setOrigin(0.5);

    button.add([bg, iconText, buttonText]);
    button.setSize(240, 110);
    button.setInteractive({ useHandCursor: true });

    // Hover effects
    button.on('pointerover', () => {
      this.tweens.add({
        targets: button,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 200,
        ease: 'Power2',
      });
    });

    button.on('pointerout', () => {
      this.tweens.add({
        targets: button,
        scaleX: 1,
        scaleY: 1,
        duration: 200,
        ease: 'Power2',
      });
    });

    button.on('pointerdown', () => {
      this.tweens.add({
        targets: button,
        scaleX: 0.95,
        scaleY: 0.95,
        duration: 100,
        yoyo: true,
        onComplete: callback,
      });
    });
  }

  private createCharacterDisplay(width: number, height: number): void {
    // Display featured character or user's main character
    const charX = width - 300;
    const charY = height / 2 + 50;

    // Placeholder character sprite
    const character = this.add.sprite(charX, charY, 'character-placeholder');
    character.setScale(2);

    // Add some animation
    this.tweens.add({
      targets: character,
      y: charY - 10,
      duration: 2000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });

    // Character name/info
    this.add.text(charX, charY + 150, 'Main Character', {
      fontSize: '18px',
      color: '#ffffff',
      backgroundColor: '#000000aa',
      padding: { x: 10, y: 5 },
    }).setOrigin(0.5);
  }

  private createEventBanner(width: number, height: number): void {
    const bannerY = 120;
    
    // Banner background
    const banner = this.add.graphics();
    banner.fillStyle(COLORS.WARNING, 0.3);
    banner.fillRoundedRect(50, bannerY, width - 100, 100, 10);
    banner.lineStyle(2, COLORS.WARNING);
    banner.strokeRoundedRect(50, bannerY, width - 100, 100, 10);

    // Banner text
    const eventText = this.add.text(width / 2, bannerY + 30, '🎉 Special Event!', {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    eventText.setOrigin(0.5);

    const eventDesc = this.add.text(
      width / 2,
      bannerY + 65,
      'Limited time 5-star character summon event! Don\'t miss out!',
      {
        fontSize: '16px',
        color: '#ffffff',
      }
    );
    eventDesc.setOrigin(0.5);

    // Make banner clickable
    const bannerZone = this.add.zone(50, bannerY, width - 100, 100).setOrigin(0);
    bannerZone.setInteractive({ useHandCursor: true });
    bannerZone.on('pointerdown', () => {
      console.log('Event banner clicked');
      // Navigate to event page or show event details
    });
  }
}
