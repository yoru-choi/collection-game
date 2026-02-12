import Phaser from 'phaser';
import { SCENE_KEYS, COLORS, UI } from '@/utils/Constants';
import { addSceneFrame } from '@/utils/SceneFrame';
import { GameDataStore } from '@/store/GameDataStore';
import { UserCharacter, SummonResult, Character } from '@/types';
import { getGradeColor, getGradeStars } from '@/utils/Helpers';
import { getMonsterImageKey } from '@/utils/monsterImages';
import { characterService } from '@/services/CharacterService';
import { userService } from '@/services/UserService';

export class SummonScene extends Phaser.Scene {
  private gameData!: GameDataStore;
  private summonedCharacters: UserCharacter[] = [];
  private isAnimating: boolean = false;
  private currencyText?: Phaser.GameObjects.Text;

  constructor() {
    super({ key: SCENE_KEYS.SUMMON });
  }

  private colorToCss(color: number): string {
    return Phaser.Display.Color.IntegerToColor(color).rgba;
  }

  create(): void {
    this.gameData = GameDataStore.getInstance();

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Background with magical effect
    this.createBackground(width, height);

    // Title with glow
    const titleGlow = this.add.graphics();
    titleGlow.fillStyle(COLORS.PRIMARY_LIGHT, 0.3);
    titleGlow.fillCircle(width / 2, 60, 120);
    
    const title = this.add.text(width / 2, 60, '✨ Summon Portal ✨', {
      fontFamily: UI.FONTS.TITLE,
      fontSize: '48px',
      color: this.colorToCss(COLORS.TEXT_PRIMARY),
      fontStyle: 'bold',
      shadow: {
        offsetX: 3,
        offsetY: 3,
        color: this.colorToCss(COLORS.PRIMARY_DARK),
        blur: 10,
        stroke: true,
        fill: true,
      },
    });
    title.setOrigin(0.5);
    
    // Title pulse animation
    this.tweens.add({
      targets: title,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    
    // Rotating glow effect
    this.tweens.add({
      targets: titleGlow,
      alpha: 0.5,
      duration: 2000,
      yoyo: true,
      repeat: -1,
    });

    // Currency display
    this.createCurrencyDisplay(width);

    // Summon buttons
    this.createSummonButtons(width, height);

    // Rates button
    this.createRatesButton(width, height);

    // Back button
    this.createBackButton();

    // Summon result area
    this.createResultArea(width, height);

    addSceneFrame(this);
  }

  private createBackground(width: number, height: number): void {
    // Multi-layer gradient background
    const bg = this.add.graphics();
    bg.fillGradientStyle(COLORS.BG_START, COLORS.BG_START, COLORS.PRIMARY_DARK, COLORS.PRIMARY_DARK, 1);
    bg.fillRect(0, 0, width, height);
    
    // Overlay gradient for depth
    const overlay = this.add.graphics();
    overlay.fillGradientStyle(COLORS.PRIMARY, COLORS.PRIMARY, COLORS.SECONDARY_DARK, COLORS.SECONDARY_DARK, 0.3);
    overlay.fillRect(0, 0, width, height);

    // Magical particles - stars
    const starParticles = this.add.particles(0, 0, 'ui-particle', {
      x: { min: 0, max: width },
      y: { min: 0, max: height },
      speed: { min: 20, max: 50 },
      scale: { start: 0.7, end: 0 },
      alpha: { start: 0.5, end: 0 },
      blendMode: 'ADD',
      lifespan: 3000,
      frequency: 450,
      tint: [COLORS.PRIMARY_LIGHT, COLORS.SECONDARY_LIGHT, COLORS.GOLD],
    });
    
    // Floating orbs
    const orbParticles = this.add.particles(0, 0, 'ui-particle', {
      x: { min: 0, max: width },
      y: height + 50,
      speedY: { min: -80, max: -120 },
      speedX: { min: -20, max: 20 },
      scale: { start: 0.9, end: 0 },
      alpha: { start: 0.45, end: 0 },
      blendMode: 'ADD',
      lifespan: 4000,
      frequency: 700,
      tint: [COLORS.PRIMARY, COLORS.SECONDARY, 0xa855f7],
    });
  }

  private createCurrencyDisplay(width: number): void {
    const crystal = this.gameData.getPlayerData()?.crystals || 0;

    // Shadow
    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.4);
    shadow.fillRoundedRect(width - 194, 16, 180, 50, 12);

    // Background with glassmorphism
    const currencyBg = this.add.graphics();
    currencyBg.fillStyle(COLORS.PRIMARY_DARK, 0.9);
    currencyBg.fillRoundedRect(width - 200, 10, 180, 50, 12);
    
    // Border with glow
    currencyBg.lineStyle(2, COLORS.PRIMARY_LIGHT, 0.8);
    currencyBg.strokeRoundedRect(width - 200, 10, 180, 50, 12);
    
    // Inner highlight
    currencyBg.fillStyle(COLORS.PRIMARY_LIGHT, 0.1);
    currencyBg.fillRoundedRect(width - 195, 15, 170, 15, 8);

    this.currencyText = this.add.text(width - 110, 35, `💎 ${crystal}`, {
      fontFamily: UI.FONTS.UI,
      fontSize: '26px',
      color: this.colorToCss(COLORS.TEXT_PRIMARY),
      fontStyle: 'bold',
      shadow: {
        offsetX: 2,
        offsetY: 2,
        color: '#000000',
        blur: 4,
        fill: true,
      },
    }).setOrigin(0.5);
    
    // Pulse animation
    this.tweens.add({
      targets: this.currencyText,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private createSummonButtons(width: number, height: number): void {
    const centerY = height / 2;

    // Normal Summon
    this.createSummonButton(
      width / 2 - 200,
      centerY,
      'Normal Summon',
      '100 💎',
      'Single',
      COLORS.PRIMARY,
      () => this.performSummon('normal', 1)
    );

    // Normal Summon x10
    this.createSummonButton(
      width / 2 - 200,
      centerY + 120,
      'Normal Summon x10',
      '1000 💎',
      '10+1 bonus',
      COLORS.SECONDARY,
      () => this.performSummon('normal', 10)
    );

    // Premium Summon
    this.createSummonButton(
      width / 2 + 200,
      centerY,
      'Premium Summon',
      '300 💎',
      'Higher ⭐⭐⭐⭐⭐ Rate!',
      COLORS.WARNING,
      () => this.performSummon('premium', 1)
    );

    // Premium Summon x10
    this.createSummonButton(
      width / 2 + 200,
      centerY + 120,
      'Premium Summon x10',
      '3000 💎',
      '10+1 bonus',
      COLORS.DANGER,
      () => this.performSummon('premium', 10)
    );
  }

  private createSummonButton(
    x: number,
    y: number,
    title: string,
    cost: string,
    subtitle: string,
    color: number,
    callback: () => void
  ): void {
    const button = this.add.container(x, y);

    // Shadow layer
    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.5);
    shadow.fillRoundedRect(-178, -48, 356, 106, 15);

    // Button background with gradient
    const bg = this.add.graphics();
    bg.fillGradientStyle(
      color,
      color,
      Phaser.Display.Color.ValueToColor(color).darken(40).color,
      Phaser.Display.Color.ValueToColor(color).darken(40).color,
      1
    );
    bg.fillRoundedRect(-175, -50, 350, 100, 12);
    
    // Border with glow
    bg.lineStyle(3, COLORS.LIGHT, 0.8);
    bg.strokeRoundedRect(-175, -50, 350, 100, 12);
    
    // Inner highlight
    bg.fillStyle(0xffffff, 0.15);
    bg.fillRoundedRect(-170, -45, 340, 25, 10);

    // Sparkle particles
    const sparkles = this.add.particles(0, 0, 'ui-particle', {
      x: { min: -175, max: 175 },
      y: { min: -50, max: 50 },
      scale: { start: 0.7, end: 0 },
      alpha: { start: 0.5, end: 0 },
      blendMode: 'ADD',
      lifespan: 1500,
      frequency: 400,
      tint: [COLORS.PRIMARY_LIGHT, COLORS.SECONDARY_LIGHT, COLORS.GOLD],
    });
    sparkles.setPosition(0, 0);

    // Title
    const titleText = this.add.text(0, -28, title, {
      fontFamily: UI.FONTS.UI,
      fontSize: '24px',
      color: this.colorToCss(COLORS.TEXT_PRIMARY),
      fontStyle: 'bold',
      shadow: {
        offsetX: 2,
        offsetY: 2,
        color: '#000000',
        blur: 5,
        fill: true,
      },
    });
    titleText.setOrigin(0.5);

    // Cost
    const costText = this.add.text(0, 5, cost, {
      fontFamily: UI.FONTS.UI,
      fontSize: '22px',
      color: this.colorToCss(COLORS.GOLD),
      fontStyle: 'bold',
      shadow: {
        offsetX: 1,
        offsetY: 1,
        color: '#000000',
        blur: 3,
        fill: true,
      },
    });
    costText.setOrigin(0.5);

    // Subtitle
    const subtitleText = this.add.text(0, 32, subtitle, {
      fontFamily: UI.FONTS.BODY,
      fontSize: '16px',
      color: this.colorToCss(COLORS.TEXT_SECONDARY),
      fontStyle: 'bold',
    });
    subtitleText.setOrigin(0.5);

    button.add([shadow, bg, sparkles, titleText, costText, subtitleText]);
    button.setSize(350, 100);
    button.setInteractive({ useHandCursor: true });

    // Floating animation
    this.tweens.add({
      targets: button,
      y: y - 5,
      duration: 2000,
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
      
      // Increase sparkle frequency
      sparkles.setFrequency(200);
      
      // Enhance glow
      bg.clear();
      bg.fillGradientStyle(
        Phaser.Display.Color.ValueToColor(color).lighten(20).color,
        Phaser.Display.Color.ValueToColor(color).lighten(20).color,
        Phaser.Display.Color.ValueToColor(color).darken(20).color,
        Phaser.Display.Color.ValueToColor(color).darken(20).color,
        1
      );
      bg.fillRoundedRect(-175, -50, 350, 100, 12);
      bg.lineStyle(4, COLORS.LIGHT, 1);
      bg.strokeRoundedRect(-175, -50, 350, 100, 12);
      bg.fillStyle(0xffffff, 0.25);
      bg.fillRoundedRect(-170, -45, 340, 25, 10);
    });

    button.on('pointerout', () => {
      this.tweens.add({
        targets: button,
        scaleX: 1,
        scaleY: 1,
        duration: 200,
      });
      
      // Reset sparkle frequency
      sparkles.setFrequency(400);
      
      // Reset glow
      bg.clear();
      bg.fillGradientStyle(
        color,
        color,
        Phaser.Display.Color.ValueToColor(color).darken(40).color,
        Phaser.Display.Color.ValueToColor(color).darken(40).color,
        1
      );
      bg.fillRoundedRect(-175, -50, 350, 100, 12);
      bg.lineStyle(3, COLORS.LIGHT, 0.8);
      bg.strokeRoundedRect(-175, -50, 350, 100, 12);
      bg.fillStyle(0xffffff, 0.15);
      bg.fillRoundedRect(-170, -45, 340, 25, 10);
    });

    button.on('pointerdown', () => {
      // Flash effect
      this.tweens.add({
        targets: button,
        scaleX: 0.95,
        scaleY: 0.95,
        duration: 100,
        yoyo: true,
      });
      
      callback();
    });
  }

  private createRatesButton(width: number, height: number): void {
    const button = this.add.container(width / 2, height - 80);

    const bg = this.add.rectangle(0, 0, 200, 50, COLORS.INFO, 0.7);
    bg.setStrokeStyle(2, COLORS.LIGHT);

    const text = this.add.text(0, 0, 'View Rates', {
      fontFamily: UI.FONTS.UI,
      fontSize: '18px',
      color: this.colorToCss(COLORS.TEXT_PRIMARY),
    });
    text.setOrigin(0.5);

    button.add([bg, text]);
    button.setSize(200, 50);
    button.setInteractive({ useHandCursor: true });

    button.on('pointerdown', () => {
      this.showRates();
    });
  }

  private createResultArea(width: number, height: number): void {
    const panelX = width - 360;
    const panelY = height / 2 + 20;
      const panelWidth = 540;
    const panelHeight = height - 180;

    const panel = this.add.graphics();
    panel.fillStyle(COLORS.DARKER, 0.9);
    panel.fillRoundedRect(panelX - panelWidth / 2, panelY - panelHeight / 2, panelWidth, panelHeight, 18);
    panel.lineStyle(2, COLORS.GOLD, 0.7);
    panel.strokeRoundedRect(panelX - panelWidth / 2, panelY - panelHeight / 2, panelWidth, panelHeight, 18);

    const header = this.add.graphics();
    header.fillStyle(COLORS.BG_ACCENT, 0.6);
    header.fillRoundedRect(panelX - panelWidth / 2 + 16, panelY - panelHeight / 2 + 16, panelWidth - 32, 50, 12);
    header.lineStyle(1, COLORS.PRIMARY_LIGHT, 0.5);
    header.strokeRoundedRect(panelX - panelWidth / 2 + 16, panelY - panelHeight / 2 + 16, panelWidth - 32, 50, 12);

    this.add.text(panelX, panelY - panelHeight / 2 + 42, 'Summon Results', {
      fontFamily: UI.FONTS.TITLE,
      fontSize: '24px',
      color: this.colorToCss(COLORS.TEXT_PRIMARY),
      fontStyle: 'bold',
    }).setOrigin(0.5);
  }

  private async performSummon(type: 'normal' | 'premium', count: number): Promise<void> {
    if (this.isAnimating) return;

    console.log(`Performing ${type} summon x${count}`);

    this.isAnimating = true;

    try {
      const results = await characterService.summon(type, count);

      this.summonedCharacters = results.map((result, index) =>
        this.mapSummonResult(result, index)
      );

      const profile = await userService.getProfile();
      if (profile) {
        this.gameData.setPlayerData(profile);
        if (this.currencyText) {
          this.currencyText.setText(`💎 ${profile.crystals}`);
        }
      }
    } catch (error) {
      this.showToast('Summon failed. Check crystals.');
      console.error('Summon error:', error);
      this.isAnimating = false;
      return;
    }

    try {
      const characters = await characterService.getCharacterList();
      if (characters.length > 0) {
        this.gameData.setUserCharacters(characters);
      }
    } catch (error) {
      this.showToast('Character list refresh failed.');
      console.error('Character list refresh error:', error);
    }

    // Play summon animation
    await this.playSummonAnimation();

    // Show results
    this.showSummonResults();

    this.isAnimating = false;
  }

  private mapSummonResult(result: SummonResult, index: number): UserCharacter {
    const character = result.character as Character;
    const now = new Date().toISOString();
    return {
      id: `summon-${Date.now()}-${index}`,
      userId: 'user-unknown',
      characterId: String(result.character_id),
      character,
      level: 1,
      exp: 0,
      currentHp: character.baseHp,
      currentAtk: character.baseAtk,
      currentDef: character.baseDef,
      currentSpd: character.baseSpd,
      currentCrt: 5,
      currentCrtDmg: 50,
      currentAcc: 0,
      currentRes: 0,
      skill1Level: 1,
      skill2Level: 1,
      skill3Level: 1,
      skill4Level: 1,
      awakened: 0,
      obtainedAt: now,
    };
  }

  private showToast(message: string): void {
    const width = this.cameras.main.width;
    const toast = this.add.text(width / 2, 520, message, {
      fontFamily: UI.FONTS.UI,
      fontSize: '16px',
      color: this.colorToCss(COLORS.TEXT_PRIMARY),
      backgroundColor: '#000000',
      padding: { left: 10, right: 10, top: 6, bottom: 6 },
    });
    toast.setOrigin(0.5);
    this.tweens.add({
      targets: toast,
      alpha: 0,
      duration: 1200,
      onComplete: () => toast.destroy(),
    });
  }

  private playSummonAnimation(): Promise<void> {
    return new Promise((resolve) => {
      const width = this.cameras.main.width;
      const height = this.cameras.main.height;

      // Create a magical circle
      const circle = this.add.circle(width / 2, height / 2, 100, COLORS.PRIMARY, 0.5);

      this.tweens.add({
        targets: circle,
        scaleX: 3,
        scaleY: 3,
        alpha: 0,
        duration: 1500,
        ease: 'Power2',
        onComplete: () => {
          circle.destroy();
          resolve();
        },
      });
    });
  }

  private showSummonResults(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Dim background
    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.8).setOrigin(0);
    overlay.setInteractive();

    // Result panel
    const panelWidth = Math.min(1000, width - 100);
    const panelHeight = 600;
    const panel = this.add.graphics();
    panel.fillStyle(COLORS.DARK, 0.95);
    panel.fillRoundedRect(
      width / 2 - panelWidth / 2,
      height / 2 - panelHeight / 2,
      panelWidth,
      panelHeight,
      15
    );
    panel.lineStyle(3, COLORS.PRIMARY);
    panel.strokeRoundedRect(
      width / 2 - panelWidth / 2,
      height / 2 - panelHeight / 2,
      panelWidth,
      panelHeight,
      15
    );

    // Title
    this.add.text(width / 2, height / 2 - 260, 'Summon Results!', {
      fontFamily: UI.FONTS.TITLE,
      fontSize: '32px',
      color: this.colorToCss(COLORS.TEXT_PRIMARY),
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Display characters
    const cardSize = 140;
    const spacing = 20;
    const cols = 5;

    this.summonedCharacters.forEach((char, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = width / 2 - (cols * (cardSize + spacing)) / 2 + col * (cardSize + spacing) + cardSize / 2;
      const y = height / 2 - 150 + row * (cardSize + spacing);

      this.createResultCard(x, y, cardSize, char);
    });

    // Close button
    const closeBtn = this.add.container(width / 2, height / 2 + 250);
    const closeBg = this.add.rectangle(0, 0, 200, 50, COLORS.SUCCESS);
    closeBg.setStrokeStyle(2, COLORS.LIGHT);
    const closeText = this.add.text(0, 0, 'Confirm', {
      fontFamily: UI.FONTS.UI,
      fontSize: '20px',
      color: this.colorToCss(COLORS.TEXT_PRIMARY),
      fontStyle: 'bold',
    });
    closeText.setOrigin(0.5);

    closeBtn.add([closeBg, closeText]);
    closeBtn.setSize(200, 50);
    closeBtn.setInteractive({ useHandCursor: true });

    closeBtn.on('pointerdown', () => {
      overlay.destroy();
      panel.destroy();
      closeBtn.destroy();
      this.summonedCharacters = [];
    });
  }

  private createResultCard(x: number, y: number, size: number, character: UserCharacter): void {
    const card = this.add.container(x, y);

    // Background
    const bg = this.add.rectangle(0, 0, size, size, COLORS.SECONDARY, 0.9);
    bg.setStrokeStyle(3, getGradeColor(character.character.grade));

    // Character sprite with deterministic image
    const spriteKey = getMonsterImageKey(character);
    const sprite = this.add.sprite(0, -20, spriteKey);
    sprite.setDisplaySize(size * 0.75, size * 0.75);

    // Stars
    const stars = this.add.text(0, 40, getGradeStars(character.character.grade), {
      fontSize: '14px',
    });
    stars.setOrigin(0.5);

    // Name
    const name = this.add.text(0, 60, character.character.name, {
      fontFamily: UI.FONTS.UI,
      fontSize: '12px',
      color: this.colorToCss(COLORS.TEXT_PRIMARY),
      wordWrap: { width: size - 12 },
      align: 'center',
    });
    name.setOrigin(0.5);

    card.add([bg, sprite, stars, name]);

    // Entrance animation
    card.setScale(0);
    this.tweens.add({
      targets: card,
      scaleX: 1,
      scaleY: 1,
      duration: 500,
      ease: 'Back.easeOut',
    });
  }

  private showRates(): void {
    console.log('Show summon rates');
    // TODO: Display rates in a popup
  }

  private createBackButton(): void {
    const button = this.add.container(50, 35);

    const bg = this.add.rectangle(0, 0, 100, 50, COLORS.INFO);
    bg.setStrokeStyle(2, COLORS.LIGHT);

    const text = this.add.text(0, 0, '← Back', {
      fontFamily: UI.FONTS.UI,
      fontSize: '18px',
      color: this.colorToCss(COLORS.TEXT_PRIMARY),
    });
    text.setOrigin(0.5);

    button.add([bg, text]);
    button.setSize(100, 50);
    button.setInteractive({ useHandCursor: true });

    button.on('pointerdown', () => {
      this.scene.start(SCENE_KEYS.LOBBY);
    });
  }
}
