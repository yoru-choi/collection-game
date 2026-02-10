import Phaser from 'phaser';
import { SCENE_KEYS, COLORS } from '@/utils/Constants';
import { UserCharacter } from '@/types';
import { getGradeColor, getGradeStars, calculatePower, getElementColor } from '@/utils/Helpers';

export class CharacterDetailScene extends Phaser.Scene {
  private character!: UserCharacter;

  constructor() {
    super({ key: SCENE_KEYS.CHARACTER_DETAIL });
  }

  init(data: { character: UserCharacter }): void {
    this.character = data.character;
  }

  create(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Background
    this.add.rectangle(0, 0, width, height, COLORS.DARK).setOrigin(0);

    // Left panel - Character display
    this.createCharacterDisplay(200, height / 2);

    // Right panel - Character info and actions
    this.createCharacterInfo(500, 100, width - 550);

    // Back button
    this.createBackButton();
  }

  private createCharacterDisplay(x: number, y: number): void {
    // Character card
    const cardWidth = 300;
    const cardHeight = 500;

    const card = this.add.graphics();
    card.fillStyle(COLORS.SECONDARY, 0.8);
    card.fillRoundedRect(x - cardWidth / 2, y - cardHeight / 2, cardWidth, cardHeight, 15);
    card.lineStyle(4, getGradeColor(this.character.character.grade));
    card.strokeRoundedRect(x - cardWidth / 2, y - cardHeight / 2, cardWidth, cardHeight, 15);

    // Character sprite
    const sprite = this.add.sprite(x, y - 50, 'character-placeholder');
    sprite.setScale(3);

    // Floating animation
    this.tweens.add({
      targets: sprite,
      y: y - 60,
      duration: 2000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });

    // Character name
    const name = this.add.text(x, y + 150, this.character.character.name, {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    name.setOrigin(0.5);

    // Stars
    const stars = this.add.text(x, y + 180, getGradeStars(this.character.character.grade), {
      fontSize: '20px',
    });
    stars.setOrigin(0.5);

    // Element badge
    const elementBg = this.add.circle(
      x,
      y + 220,
      25,
      getElementColor(this.character.character.element),
      0.8
    );
    const element = this.add.text(x, y + 220, this.character.character.element.toUpperCase()[0], {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    element.setOrigin(0.5);
  }

  private createCharacterInfo(x: number, y: number, width: number): void {
    // Info panel
    const panelHeight = 620;
    const panel = this.add.graphics();
    panel.fillStyle(COLORS.PRIMARY, 0.2);
    panel.fillRoundedRect(x, y, width, panelHeight, 10);
    panel.lineStyle(2, COLORS.PRIMARY);
    panel.strokeRoundedRect(x, y, width, panelHeight, 10);

    let currentY = y + 20;

    // Title
    this.add.text(x + 20, currentY, 'Character Details', {
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    currentY += 50;

    // Basic info
    const infoData = [
      { label: 'Level', value: `${this.character.level}` },
      { label: 'Class', value: this.character.character.class },
      { label: 'Element', value: this.character.character.element },
      { label: 'Power', value: calculatePower(this.character).toString() },
    ];

    infoData.forEach((info) => {
      this.add.text(x + 20, currentY, `${info.label}:`, {
        fontSize: '18px',
        color: '#95a5a6',
      });
      this.add.text(x + 150, currentY, info.value, {
        fontSize: '18px',
        color: '#ffffff',
        fontStyle: 'bold',
      });
      currentY += 35;
    });

    currentY += 10;

    // Stats
    this.add.text(x + 20, currentY, 'Stats', {
      fontSize: '22px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    currentY += 40;

    const stats = [
      { label: 'HP', value: this.character.currentHp, color: '#e74c3c' },
      { label: 'ATK', value: this.character.currentAtk, color: '#e67e22' },
      { label: 'DEF', value: this.character.currentDef, color: '#3498db' },
      { label: 'SPD', value: this.character.currentSpd, color: '#2ecc71' },
      { label: 'CRT', value: this.character.currentCrt, color: '#9b59b6' },
      { label: 'CRT DMG', value: this.character.currentCrtDmg, color: '#8e44ad' },
    ];

    stats.forEach((stat) => {
      this.createStatBar(x + 20, currentY, width - 60, stat.label, stat.value, stat.color);
      currentY += 45;
    });

    currentY += 20;

    // Action buttons
    this.createActionButtons(x + 20, currentY, width - 40);
  }

  private createStatBar(
    x: number,
    y: number,
    width: number,
    label: string,
    value: number,
    color: string
  ): void {
    // Label
    this.add.text(x, y, label, {
      fontSize: '16px',
      color: '#ffffff',
    });

    // Value
    this.add.text(x + 100, y, value.toString(), {
      fontSize: '16px',
      color: color,
      fontStyle: 'bold',
    });

    // Progress bar background
    const barWidth = width - 180;
    const barHeight = 20;
    const barX = x + 180;

    const bgBar = this.add.graphics();
    bgBar.fillStyle(0x34495e);
    bgBar.fillRoundedRect(barX, y - 3, barWidth, barHeight, 5);

    // Progress bar (normalized to max stat value of ~1000)
    const progressBar = this.add.graphics();
    progressBar.fillStyle(parseInt(color.replace('#', '0x')));
    const progress = Math.min(value / 1000, 1);
    progressBar.fillRoundedRect(barX, y - 3, barWidth * progress, barHeight, 5);
  }

  private createActionButtons(x: number, y: number, width: number): void {
    const buttonData = [
      { text: 'Level Up', color: COLORS.SUCCESS, action: () => this.handleLevelUp() },
      { text: 'Evolve', color: COLORS.WARNING, action: () => this.handleEvolve() },
      { text: 'Manage Runes', color: COLORS.INFO, action: () => this.handleManageRunes() },
    ];

    const buttonWidth = (width - 40) / 3;
    buttonData.forEach((btn, index) => {
      this.createButton(
        x + index * (buttonWidth + 20),
        y,
        buttonWidth,
        50,
        btn.text,
        btn.color,
        btn.action
      );
    });
  }

  private createButton(
    x: number,
    y: number,
    width: number,
    height: number,
    text: string,
    color: number,
    callback: () => void
  ): void {
    const button = this.add.container(x, y);

    const bg = this.add.rectangle(width / 2, height / 2, width, height, color);
    bg.setStrokeStyle(2, COLORS.LIGHT);

    const btnText = this.add.text(width / 2, height / 2, text, {
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    btnText.setOrigin(0.5);

    button.add([bg, btnText]);
    button.setSize(width, height);
    button.setInteractive({ useHandCursor: true });

    button.on('pointerover', () => {
      bg.setFillStyle(color, 0.8);
    });

    button.on('pointerout', () => {
      bg.setFillStyle(color, 1);
    });

    button.on('pointerdown', callback);
  }

  private handleLevelUp(): void {
    console.log('Level up character:', this.character.id);
    // TODO: Implement level up logic
  }

  private handleEvolve(): void {
    console.log('Evolve character:', this.character.id);
    // TODO: Implement evolution logic
  }

  private handleManageRunes(): void {
    console.log('Manage runes for character:', this.character.id);
    this.scene.start(SCENE_KEYS.INVENTORY, { character: this.character });
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
      this.scene.start(SCENE_KEYS.CHARACTER_LIST);
    });
  }
}
