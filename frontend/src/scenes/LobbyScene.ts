import Phaser from 'phaser';
import { SCENE_KEYS, COLORS, UI } from '@/utils/Constants';
import { addSceneFrame } from '@/utils/SceneFrame';
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

    addSceneFrame(this);
  }

  private createBackground(width: number, height: number): void {
    // Animated gradient background
    const bg = this.add.graphics();
    
    // Create multi-layer gradient background
    bg.fillGradientStyle(COLORS.BG_START, COLORS.BG_START, COLORS.BG_END, COLORS.BG_END, 1);
    bg.fillRect(0, 0, width, height);
    
    // Add subtle pattern overlay
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 100 + 50;
      
      bg.fillStyle(COLORS.BG_ACCENT, 0.05);
      bg.fillCircle(x, y, size);
    }
    
    // Animated particles for ambient effect
    const particles = this.add.particles(0, 0, 'ui-particle', {
      x: { min: 0, max: width },
      y: { min: 0, max: height },
      speed: { min: 10, max: 30 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.2, end: 0 },
      blendMode: 'ADD',
      lifespan: 4000,
      frequency: 900,
      tint: [COLORS.PRIMARY_LIGHT, COLORS.SECONDARY_LIGHT, COLORS.INFO_LIGHT],
    });
    particles.setDepth(-2);
  }

  private createTopBar(width: number): void {
    // Modern glass-morphism style top bar
    const topBar = this.add.graphics();
    topBar.fillStyle(COLORS.DARKER, 0.8);
    topBar.fillRoundedRect(0, 0, width, 90, { tl: 0, tr: 0, bl: 15, br: 15 });
    
    // Subtle border glow
    topBar.lineStyle(2, COLORS.PRIMARY, 0.5);
    topBar.strokeRoundedRect(0, 0, width, 90, { tl: 0, tr: 0, bl: 15, br: 15 });
    
    // Highlight effect
    topBar.fillStyle(COLORS.PRIMARY, 0.1);
    topBar.fillRoundedRect(10, 10, width - 20, 30, 10);

    // User info with icon
    const username = this.gameData.getPlayerData()?.username || 'Guest';
    const level = this.gameData.getPlayerData()?.level || 1;
    
    // Avatar circle
    const avatar = this.add.circle(60, 45, 25, COLORS.PRIMARY_LIGHT);
    avatar.setStrokeStyle(3, COLORS.GOLD);
    
    const avatarText = this.add.text(60, 45, username.charAt(0).toUpperCase(), {
      fontFamily: UI.FONTS.TITLE,
      fontSize: '20px',
      color: this.colorToCss(COLORS.TEXT_PRIMARY),
      fontStyle: 'bold',
    });
    avatarText.setOrigin(0.5);
    
    this.add.text(95, 30, username, {
      fontFamily: UI.FONTS.UI,
      fontSize: '22px',
      color: this.colorToCss(COLORS.TEXT_PRIMARY),
      fontStyle: 'bold',
    });
    
    // Level badge
    const levelBadge = this.add.graphics();
    levelBadge.fillStyle(COLORS.WARNING, 1);
    levelBadge.fillRoundedRect(90, 50, 60, 25, 12);
    levelBadge.lineStyle(2, COLORS.GOLD);
    levelBadge.strokeRoundedRect(90, 50, 60, 25, 12);
    
    this.add.text(120, 62, `Lv.${level}`, {
      fontFamily: UI.FONTS.UI,
      fontSize: '14px',
      color: this.colorToCss(COLORS.TEXT_PRIMARY),
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Currency display with animated icons
    const crystal = this.gameData.getPlayerData()?.crystals || 0;
    const gold = this.gameData.getPlayerData()?.gold || 0;
    const energy = this.gameData.getPlayerData()?.energy || 100;
    
    const currencyX = width - 400;
    
    // Crystal
    this.createCurrencyDisplay(currencyX, 25, '💎', crystal, COLORS.PRIMARY_LIGHT);
    
    // Gold
    this.createCurrencyDisplay(currencyX + 120, 25, '🪙', gold, COLORS.WARNING);
    
    // Energy
    this.createCurrencyDisplay(currencyX + 240, 25, '⚡', energy, COLORS.SUCCESS);

    // Energy progress bar with glow
    const progressBg = this.add.graphics();
    progressBg.fillStyle(COLORS.DARK, 0.8);
    progressBg.fillRoundedRect(20, 65, 250, 18, 9);
    
    const progress = this.add.graphics();
    progress.fillStyle(COLORS.SUCCESS, 1);
    const progressWidth = (energy / 100) * 246;
    progress.fillRoundedRect(22, 67, progressWidth, 14, 7);
    
    // Glow effect on progress bar
    progress.lineStyle(2, COLORS.SUCCESS_LIGHT, 0.5);
    progress.strokeRoundedRect(22, 67, progressWidth, 14, 7);
    
    // Energy text
    this.add.text(145, 74, `${energy}/100`, {
      fontFamily: UI.FONTS.UI,
      fontSize: '12px',
      color: this.colorToCss(COLORS.TEXT_PRIMARY),
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Settings button (top right)
    this.createSettingsButton(width - 60, 45);
  }
  
  private createCurrencyDisplay(x: number, y: number, icon: string, value: number, glowColor: number): void {
    // Background
    const bg = this.add.graphics();
    bg.fillStyle(COLORS.DARK, 0.6);
    bg.fillRoundedRect(x - 50, y - 15, 100, 35, 8);
    
    // Glow border
    bg.lineStyle(2, glowColor, 0.6);
    bg.strokeRoundedRect(x - 50, y - 15, 100, 35, 8);
    
    // Icon with pulse animation
    const iconText = this.add.text(x - 35, y, icon, {
      fontSize: '20px',
    });
    iconText.setOrigin(0.5);
    
    this.tweens.add({
      targets: iconText,
      scale: { from: 1, to: 1.2 },
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    
    // Value
    this.add.text(x + 10, y, value.toLocaleString(), {
      fontFamily: UI.FONTS.UI,
      fontSize: '16px',
      color: this.colorToCss(COLORS.TEXT_PRIMARY),
      fontStyle: 'bold',
      shadow: {
        offsetX: 1,
        offsetY: 1,
        color: '#000000',
        blur: 3,
        fill: true,
      },
    }).setOrigin(0, 0.5);
  }

  private createSettingsButton(x: number, y: number): void {
    const button = this.add.container(x, y);
    
    // Animated gradient background
    const bg = this.add.graphics();
    bg.fillStyle(COLORS.INFO, 0.9);
    bg.fillCircle(0, 0, 28);
    bg.lineStyle(3, COLORS.INFO_LIGHT, 0.8);
    bg.strokeCircle(0, 0, 28);
    
    // Inner glow
    bg.fillStyle(0xffffff, 0.2);
    bg.fillCircle(0, -8, 15);
    
    const icon = this.add.text(0, 0, '⚙️', {
      fontSize: '28px',
    });
    icon.setOrigin(0.5);
    
    button.add([bg, icon]);
    button.setSize(56, 56);
    button.setInteractive({ useHandCursor: true });
    
    // Rotation animation
    this.tweens.add({
      targets: icon,
      angle: 360,
      duration: 10000,
      repeat: -1,
      ease: 'Linear',
    });
    
    button.on('pointerover', () => {
      this.tweens.add({
        targets: button,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 150,
      });
    });
    
    button.on('pointerout', () => {
      this.tweens.add({
        targets: button,
        scaleX: 1,
        scaleY: 1,
        duration: 150,
      });
    });
    
    button.on('pointerdown', () => {
      this.scene.start(SCENE_KEYS.SETTINGS);
    });
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

    const panelX = 40;
    const panelY = 120;
    const panelWidth = 320;
    const panelHeight = height - 200;

    const panel = this.add.graphics();
    panel.fillStyle(COLORS.DARKER, 0.85);
    panel.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 18);
    panel.lineStyle(2, COLORS.GOLD, 0.7);
    panel.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 18);

    const startX = panelX + 40;
    const startY = panelY + 50;
    const buttonSpacingY = 84;

    buttonData.forEach((data, index) => {
      const x = startX;
      const y = startY + index * buttonSpacingY;

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

    // Shadow layer
    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.45);
    shadow.fillRoundedRect(4, 4, 240, 72, 14);

    // Button background with gradient
    const bg = this.add.graphics();
    bg.fillStyle(color, 1);
    bg.fillRoundedRect(0, 0, 240, 72, 14);
    
    // Highlight gradient
    bg.fillStyle(0xffffff, 0.2);
    bg.fillRoundedRect(0, 0, 240, 26, 14);
    
    // Border glow
    bg.lineStyle(3, COLORS.GOLD, 0.7);
    bg.strokeRoundedRect(0, 0, 240, 72, 14);
    
    // Inner border
    bg.lineStyle(2, 0xffffff, 0.3);
    bg.strokeRoundedRect(3, 3, 234, 66, 12);
    
    // Icon with circular background
    const iconBg = this.add.circle(36, 36, 24, 0xffffff, 0.2);
    const iconText = this.add.text(36, 36, icon, {
      fontSize: '30px',
    });
    iconText.setOrigin(0.5);

    // Button text with shadow
    const buttonText = this.add.text(120, 36, text, {
      fontFamily: UI.FONTS.UI,
      fontSize: '20px',
      color: this.colorToCss(COLORS.TEXT_PRIMARY),
      fontStyle: 'bold',
      shadow: {
        offsetX: 2,
        offsetY: 2,
        color: '#000000',
        blur: 4,
        fill: true,
      },
    });
    buttonText.setOrigin(0.5);

    button.add([shadow, bg, iconBg, iconText, buttonText]);
    button.setSize(240, 72);
    button.setInteractive({ useHandCursor: true });

    // Floating animation
    this.tweens.add({
      targets: button,
      y: y - 5,
      duration: 2000 + Math.random() * 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Icon pulse
    this.tweens.add({
      targets: iconText,
      scale: { from: 1, to: 1.1 },
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Hover effects
    button.on('pointerover', () => {
      this.tweens.add({
        targets: button,
        scaleX: 1.08,
        scaleY: 1.08,
        duration: 200,
        ease: 'Back.easeOut',
      });
      
      // Glow effect
      const glow = this.add.graphics();
      glow.lineStyle(8, color, 0.6);
      glow.strokeRoundedRect(x - 4, y - 4, 248, 118, 18);
      
      this.tweens.add({
        targets: glow,
        alpha: 0,
        duration: 500,
        onComplete: () => glow.destroy(),
      });
    });

    button.on('pointerout', () => {
      this.tweens.add({
        targets: button,
        scaleX: 1,
        scaleY: 1,
        duration: 200,
        ease: 'Back.easeIn',
      });
    });

    button.on('pointerdown', () => {
      this.tweens.add({
        targets: button,
        scaleX: 0.95,
        scaleY: 0.95,
        duration: 100,
        yoyo: true,
        ease: 'Power2',
        onComplete: callback,
      });
      
      // Flash effect
      const flash = this.add.graphics();
      flash.fillStyle(0xffffff, 0.6);
      flash.fillRoundedRect(x, y, 240, 110, 15);
      
      this.tweens.add({
        targets: flash,
        alpha: 0,
        duration: 300,
        onComplete: () => flash.destroy(),
      });
    });
  }

  private createCharacterDisplay(width: number, height: number): void {
    // Display featured character or user's main character
    const charX = width - 320;
    const charY = height / 2 + 10;
    
    // Character platform with glow
    const platform = this.add.graphics();
    platform.fillStyle(COLORS.PRIMARY, 0.2);
    platform.fillEllipse(charX, charY + 150, 200, 40);
    
    // Glow effect
    platform.lineStyle(3, COLORS.PRIMARY_LIGHT, 0.6);
    platform.strokeEllipse(charX, charY + 150, 200, 40);

    // Placeholder character sprite with spotlight
    const spotlight = this.add.graphics();
    spotlight.fillGradientStyle(COLORS.PRIMARY_LIGHT, COLORS.PRIMARY_LIGHT, 0x000000, 0x000000, 0.5, 0, 0, 0);
    spotlight.fillCircle(charX, charY, 120);
    
    const character = this.add.sprite(charX, charY, 'character-placeholder');
    character.setScale(2.8);
    character.setTint(COLORS.PRIMARY_LIGHT);

    // Floating animation
    this.tweens.add({
      targets: character,
      y: charY - 15,
      duration: 2500,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });
    
    // Rotation animation
    this.tweens.add({
      targets: character,
      angle: { from: -5, to: 5 },
      duration: 3000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });
    
    // Sparkle particles around character
    const particles = this.add.particles(charX, charY, 'ui-particle', {
      speed: { min: 20, max: 50 },
      scale: { start: 0.8, end: 0 },
      alpha: { start: 0.45, end: 0 },
      blendMode: 'ADD',
      lifespan: 2000,
      frequency: 280,
      tint: [COLORS.PRIMARY_LIGHT, COLORS.SECONDARY_LIGHT, COLORS.GOLD],
      emitZone: {
        type: 'edge',
        source: new Phaser.Geom.Circle(0, 0, 80),
        quantity: 48,
      },
    });

    // Character info panel
    const infoBg = this.add.graphics();
    infoBg.fillStyle(COLORS.DARKER, 0.9);
    infoBg.fillRoundedRect(charX - 120, charY + 145, 240, 60, 12);
    infoBg.lineStyle(2, COLORS.PRIMARY_LIGHT, 0.6);
    infoBg.strokeRoundedRect(charX - 120, charY + 145, 240, 60, 12);
    
    // Character name/info
    this.add.text(charX, charY + 160, 'Main Character', {
      fontFamily: UI.FONTS.UI,
      fontSize: '18px',
      color: this.colorToCss(COLORS.TEXT_PRIMARY),
      fontStyle: 'bold',
      shadow: {
        offsetX: 1,
        offsetY: 1,
        color: '#000000',
        blur: 3,
        fill: true,
      },
    }).setOrigin(0.5);
    
    // Power rating
    const powerText = this.add.text(charX, charY + 185, '⚡ Power: 9999', {
      fontFamily: UI.FONTS.UI,
      fontSize: '14px',
      color: this.colorToCss(COLORS.WARNING_LIGHT),
      fontStyle: 'bold',
    }).setOrigin(0.5);
    
    // Power pulse animation
    this.tweens.add({
      targets: powerText,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 1000,
      yoyo: true,
      repeat: -1,
    });
  }

  private createEventBanner(width: number, height: number): void {
    const bannerY = 120;
    
    // Animated banner background with gradient
    const banner = this.add.graphics();
    banner.fillStyle(COLORS.WARNING, 0.3);
    banner.fillRoundedRect(50, bannerY, width - 100, 110, 15);
    
    // Glow border animation
    banner.lineStyle(3, COLORS.WARNING_LIGHT, 0.8);
    banner.strokeRoundedRect(50, bannerY, width - 100, 110, 15);
    
    // Inner highlight
    banner.fillStyle(0xffffff, 0.15);
    banner.fillRoundedRect(60, bannerY + 10, width - 120, 40, 10);
    
    // Sparkle particles
    const sparkles = this.add.particles(width / 2, bannerY + 55, 'ui-particle', {
      speed: { min: 50, max: 100 },
      scale: { start: 0.7, end: 0 },
      alpha: { start: 1, end: 0 },
      blendMode: 'ADD',
      lifespan: 1000,
      frequency: 100,
      tint: COLORS.GOLD,
      angle: { min: -180, max: 180 },
    });

    // Banner icon
    const icon = this.add.text(100, bannerY + 55, '🎉', {
      fontSize: '48px',
    });
    icon.setOrigin(0.5);
    
    // Icon animation
    this.tweens.add({
      targets: icon,
      y: bannerY + 50,
      scale: { from: 1, to: 1.2 },
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Banner title
    const eventText = this.add.text(width / 2, bannerY + 35, '✨ Special Event! ✨', {
      fontFamily: UI.FONTS.TITLE,
      fontSize: '28px',
      color: this.colorToCss(COLORS.TEXT_PRIMARY),
      fontStyle: 'bold',
      shadow: {
        offsetX: 2,
        offsetY: 2,
        color: '#000000',
        blur: 4,
        fill: true,
      },
    });
    eventText.setOrigin(0.5);
    
    // Pulse animation
    this.tweens.add({
      targets: eventText,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Banner description
    const eventDesc = this.add.text(
      width / 2,
      bannerY + 75,
      'Limited time 5-star character summon event! Don\'t miss out! 🌟',
      {
        fontFamily: UI.FONTS.BODY,
        fontSize: '16px',
        color: this.colorToCss(COLORS.TEXT_SECONDARY),
        wordWrap: { width: width - 160 },
        align: 'center',
        shadow: {
          offsetX: 1,
          offsetY: 1,
          color: '#000000',
          blur: 2,
          fill: true,
        },
      }
    );
    eventDesc.setOrigin(0.5);

    // "NEW" badge
    const newBadge = this.add.graphics();
    newBadge.fillStyle(COLORS.DANGER, 1);
    newBadge.fillRoundedRect(width - 180, bannerY + 10, 80, 30, 15);
    newBadge.lineStyle(2, COLORS.DANGER_LIGHT);
    newBadge.strokeRoundedRect(width - 180, bannerY + 10, 80, 30, 15);
    
    const newText = this.add.text(width - 140, bannerY + 25, 'NEW', {
      fontFamily: UI.FONTS.UI,
      fontSize: '18px',
      color: this.colorToCss(COLORS.TEXT_PRIMARY),
      fontStyle: 'bold',
    }).setOrigin(0.5);
    
    // Badge pulse
    this.tweens.add({
      targets: [newBadge, newText],
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    // Make banner clickable
    const bannerZone = this.add.zone(50, bannerY, width - 100, 110).setOrigin(0);
    bannerZone.setInteractive({ useHandCursor: true });
    
    bannerZone.on('pointerover', () => {
      this.tweens.add({
        targets: banner,
        alpha: 1.2,
        duration: 200,
      });
    });
    
    bannerZone.on('pointerout', () => {
      this.tweens.add({
        targets: banner,
        alpha: 1,
        duration: 200,
      });
    });
    
    bannerZone.on('pointerdown', () => {
      console.log('Event banner clicked');
      this.scene.start(SCENE_KEYS.SUMMON);
    });
  }

  private colorToCss(color: number): string {
    return Phaser.Display.Color.IntegerToColor(color).rgba;
  }
}
