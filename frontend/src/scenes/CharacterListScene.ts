import Phaser from 'phaser';
import { SCENE_KEYS, COLORS, UI } from '@/utils/Constants';
import { GameDataStore } from '@/store/GameDataStore';
import { UserCharacter } from '@/types';
import { getGradeColor, getGradeStars, calculatePower } from '@/utils/Helpers';

export class CharacterListScene extends Phaser.Scene {
  private gameData!: GameDataStore;
  private characters: UserCharacter[] = [];
  private selectedFilter: string = 'all';
  private sortBy: string = 'power';

  constructor() {
    super({ key: SCENE_KEYS.CHARACTER_LIST });
  }

  create(): void {
    this.gameData = GameDataStore.getInstance();
    this.characters = this.gameData.getUserCharacters() || [];

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Background
    this.add.rectangle(0, 0, width, height, COLORS.DARK).setOrigin(0);

    // Top bar
    this.createTopBar(width);

    // Filter and sort options
    this.createFilterBar(width);

    // Character grid
    this.createCharacterGrid(width, height);

    // Back button
    this.createBackButton();
  }

  private createTopBar(width: number): void {
    const topBar = this.add.graphics();
    topBar.fillStyle(COLORS.PRIMARY, 0.3);
    topBar.fillRect(0, 0, width, 70);

    const title = this.add.text(width / 2, 35, 'My Characters', {
      fontSize: '32px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);

    // Character count
    const count = this.add.text(width - 20, 35, `Total: ${this.characters.length}`, {
      fontSize: '18px',
      color: '#ffffff',
    });
    count.setOrigin(1, 0.5);
  }

  private createFilterBar(width: number): void {
    const filterY = 90;
    
    // Filter buttons
    const filters = ['All', 'Fire', 'Water', 'Wind', 'Light', 'Dark'];
    const buttonWidth = 100;
    const spacing = 10;
    const totalWidth = filters.length * (buttonWidth + spacing);
    const startX = (width - totalWidth) / 2;

    filters.forEach((filter, index) => {
      const x = startX + index * (buttonWidth + spacing);
      this.createFilterButton(x, filterY, filter.toLowerCase());
    });

    // Sort dropdown (simplified)
    const sortX = width - 150;
    this.add.text(sortX, filterY - 10, 'Sort by:', {
      fontSize: '16px',
      color: '#ffffff',
    });

    this.createSortButton(sortX, filterY + 20, 'Power');
  }

  private createFilterButton(x: number, y: number, filter: string): void {
    const isSelected = this.selectedFilter === filter;
    
    const button = this.add.rectangle(
      x,
      y,
      100,
      40,
      isSelected ? COLORS.PRIMARY : COLORS.SECONDARY,
      isSelected ? 1 : 0.5
    );
    button.setStrokeStyle(2, COLORS.LIGHT);

    const text = this.add.text(x, y, filter.charAt(0).toUpperCase() + filter.slice(1), {
      fontSize: '16px',
      color: '#ffffff',
    });
    text.setOrigin(0.5);

    const zone = this.add.zone(x, y, 100, 40);
    zone.setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => {
      this.selectedFilter = filter;
      this.scene.restart();
    });
  }

  private createSortButton(x: number, y: number, sortType: string): void {
    const button = this.add.rectangle(x, y, 120, 35, COLORS.INFO, 0.7);
    button.setStrokeStyle(2, COLORS.LIGHT);

    const text = this.add.text(x, y, sortType + ' ▼', {
      fontSize: '14px',
      color: '#ffffff',
    });
    text.setOrigin(0.5);
  }

  private createCharacterGrid(width: number, height: number): void {
    const startX = 100;
    const startY = 180;
    const cardWidth = 200;
    const cardHeight = 280;
    const cols = 5;
    const spacingX = 20;
    const spacingY = 20;

    // Filter characters
    let filteredChars = this.characters;
    if (this.selectedFilter !== 'all') {
      filteredChars = this.characters.filter(
        (c) => c.character.element === this.selectedFilter
      );
    }

    // Sort characters
    filteredChars.sort((a, b) => {
      const powerA = calculatePower(a);
      const powerB = calculatePower(b);
      return powerB - powerA;
    });

    // Display character cards
    filteredChars.slice(0, 20).forEach((char, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = startX + col * (cardWidth + spacingX);
      const y = startY + row * (cardHeight + spacingY);

      this.createCharacterCard(x, y, cardWidth, cardHeight, char);
    });

    // If no characters
    if (filteredChars.length === 0) {
      const noCharText = this.add.text(
        width / 2,
        height / 2,
        'No characters found.\nGo to Summon to get characters!',
        {
          fontSize: '24px',
          color: '#ffffff',
          align: 'center',
        }
      );
      noCharText.setOrigin(0.5);
    }
  }

  private createCharacterCard(
    x: number,
    y: number,
    width: number,
    height: number,
    character: UserCharacter
  ): void {
    const card = this.add.container(x, y);

    // Card background
    const bg = this.add.rectangle(0, 0, width, height, COLORS.SECONDARY, 0.8);
    bg.setStrokeStyle(3, getGradeColor(character.character.grade));

    // Character image placeholder
    const charSprite = this.add.sprite(0, -40, 'character-placeholder');
    charSprite.setScale(1.2);

    // Character name
    const name = this.add.text(0, 60, character.character.name, {
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    name.setOrigin(0.5);

    // Stars
    const stars = this.add.text(0, 85, getGradeStars(character.character.grade), {
      fontSize: '16px',
    });
    stars.setOrigin(0.5);

    // Level
    const level = this.add.text(0, 105, `Lv. ${character.level}`, {
      fontSize: '16px',
      color: '#4a90e2',
    });
    level.setOrigin(0.5);

    // Power
    const power = calculatePower(character);
    const powerText = this.add.text(0, 125, `Power: ${power}`, {
      fontSize: '14px',
      color: '#f39c12',
    });
    powerText.setOrigin(0.5);

    card.add([bg, charSprite, name, stars, level, powerText]);
    card.setSize(width, height);
    card.setInteractive({ useHandCursor: true });

    // Hover effect
    card.on('pointerover', () => {
      this.tweens.add({
        targets: card,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 200,
      });
    });

    card.on('pointerout', () => {
      this.tweens.add({
        targets: card,
        scaleX: 1,
        scaleY: 1,
        duration: 200,
      });
    });

    card.on('pointerdown', () => {
      this.scene.start(SCENE_KEYS.CHARACTER_DETAIL, { character });
    });
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
