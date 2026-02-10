import Phaser from 'phaser';
import { SCENE_KEYS, COLORS, Grade } from '@/utils/Constants';
import { GameDataStore } from '@/store/GameDataStore';
import { UserCharacter } from '@/types';
import { getGradeColor, getGradeStars } from '@/utils/Helpers';

export class SummonScene extends Phaser.Scene {
  private gameData!: GameDataStore;
  private summonedCharacters: UserCharacter[] = [];
  private isAnimating: boolean = false;

  constructor() {
    super({ key: SCENE_KEYS.SUMMON });
  }

  create(): void {
    this.gameData = GameDataStore.getInstance();

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Background with magical effect
    this.createBackground(width, height);

    // Title
    const title = this.add.text(width / 2, 60, 'Summon Portal', {
      fontSize: '42px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);

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
  }

  private createBackground(width: number, height: number): void {
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0f0f2e, 0x0f0f2e, 0x1a1a4e, 0x1a1a4e, 1);
    bg.fillRect(0, 0, width, height);

    // Add some particles for magical effect
    const particles = this.add.particles(0, 0, 'character-placeholder', {
      speed: { min: -100, max: 100 },
      scale: { start: 0.1, end: 0 },
      blendMode: 'ADD',
      lifespan: 2000,
      frequency: 200,
      emitting: true,
      bounds: { x: 0, y: 0, w: width, h: height },
    });
    particles.setAlpha(0.3);
  }

  private createCurrencyDisplay(width: number): void {
    const crystal = this.gameData.getPlayerData()?.crystals || 0;
    
    const currencyBg = this.add.graphics();
    currencyBg.fillStyle(COLORS.PRIMARY, 0.3);
    currencyBg.fillRoundedRect(width - 200, 10, 180, 50, 10);

    this.add.text(width - 110, 35, `💎 ${crystal}`, {
      fontSize: '24px',
      color: '#4a90e2',
      fontStyle: 'bold',
    }).setOrigin(0.5);
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
      '900 💎',
      '10+1 Free!',
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
      '2700 💎',
      'Guaranteed ⭐⭐⭐⭐+',
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

    // Button background
    const bg = this.add.rectangle(0, 0, 350, 100, color, 0.9);
    bg.setStrokeStyle(3, COLORS.LIGHT);

    // Title
    const titleText = this.add.text(0, -25, title, {
      fontSize: '22px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    titleText.setOrigin(0.5);

    // Cost
    const costText = this.add.text(0, 5, cost, {
      fontSize: '20px',
      color: '#4a90e2',
    });
    costText.setOrigin(0.5);

    // Subtitle
    const subtitleText = this.add.text(0, 30, subtitle, {
      fontSize: '14px',
      color: '#f39c12',
    });
    subtitleText.setOrigin(0.5);

    button.add([bg, titleText, costText, subtitleText]);
    button.setSize(350, 100);
    button.setInteractive({ useHandCursor: true });

    // Hover effects
    button.on('pointerover', () => {
      this.tweens.add({
        targets: button,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 200,
      });
    });

    button.on('pointerout', () => {
      this.tweens.add({
        targets: button,
        scaleX: 1,
        scaleY: 1,
        duration: 200,
      });
    });

    button.on('pointerdown', callback);
  }

  private createRatesButton(width: number, height: number): void {
    const button = this.add.container(width / 2, height - 80);

    const bg = this.add.rectangle(0, 0, 200, 50, COLORS.INFO, 0.7);
    bg.setStrokeStyle(2, COLORS.LIGHT);

    const text = this.add.text(0, 0, 'View Rates', {
      fontSize: '18px',
      color: '#ffffff',
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
    // This area will be populated after summoning
  }

  private async performSummon(type: 'normal' | 'premium', count: number): Promise<void> {
    if (this.isAnimating) return;

    console.log(`Performing ${type} summon x${count}`);
    
    this.isAnimating = true;

    // TODO: Call API to perform actual summon
    // For now, generate mock characters
    this.summonedCharacters = this.generateMockCharacters(count, type);

    // Play summon animation
    await this.playSummonAnimation();

    // Show results
    this.showSummonResults();

    this.isAnimating = false;
  }

  private generateMockCharacters(count: number, type: 'normal' | 'premium'): UserCharacter[] {
    const mockChars: UserCharacter[] = [];
    
    for (let i = 0; i < count; i++) {
      // Simplified gacha simulation
      let grade: Grade;
      const roll = Math.random();
      
      if (type === 'premium') {
        if (roll < 0.03) grade = Grade.FIVE_STAR;
        else if (roll < 0.12) grade = Grade.FOUR_STAR;
        else if (roll < 0.35) grade = Grade.THREE_STAR;
        else if (roll < 0.65) grade = Grade.TWO_STAR;
        else grade = Grade.ONE_STAR;
      } else {
        if (roll < 0.01) grade = Grade.FIVE_STAR;
        else if (roll < 0.05) grade = Grade.FOUR_STAR;
        else if (roll < 0.20) grade = Grade.THREE_STAR;
        else if (roll < 0.50) grade = Grade.TWO_STAR;
        else grade = Grade.ONE_STAR;
      }

      mockChars.push({
        id: `char-${Date.now()}-${i}`,
        userId: 'user-1',
        characterId: `base-char-${i}`,
        character: {
          id: `base-char-${i}`,
          name: `Character ${i + 1}`,
          grade,
          element: ['fire', 'water', 'wind', 'light', 'dark'][Math.floor(Math.random() * 5)] as any,
          class: ['warrior', 'mage', 'healer'][Math.floor(Math.random() * 3)] as any,
          baseHp: 500,
          baseAtk: 100,
          baseDef: 50,
          baseSpd: 100,
          skill1Id: 'skill-1',
          skill2Id: 'skill-2',
          skill3Id: 'skill-3',
          skill4Id: 'skill-4',
          imageUrl: '',
        },
        level: 1,
        exp: 0,
        currentHp: 500,
        currentAtk: 100,
        currentDef: 50,
        currentSpd: 100,
        currentCrt: 15,
        currentCrtDmg: 150,
        currentAcc: 0,
        currentRes: 0,
        skill1Level: 1,
        skill2Level: 1,
        skill3Level: 1,
        skill4Level: 1,
        awakened: 0,
        obtainedAt: new Date().toISOString(),
      });
    }

    return mockChars;
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
      fontSize: '32px',
      color: '#ffffff',
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
      fontSize: '20px',
      color: '#ffffff',
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

    // Character sprite
    const sprite = this.add.sprite(0, -20, 'character-placeholder');
    sprite.setScale(0.8);

    // Stars
    const stars = this.add.text(0, 40, getGradeStars(character.character.grade), {
      fontSize: '14px',
    });
    stars.setOrigin(0.5);

    // Name
    const name = this.add.text(0, 60, character.character.name, {
      fontSize: '12px',
      color: '#ffffff',
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
      fontSize: '18px',
      color: '#ffffff',
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
