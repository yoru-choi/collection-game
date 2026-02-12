import Phaser from 'phaser';
import { SCENE_KEYS, COLORS, UI } from '@/utils/Constants';
import { addSceneFrame } from '@/utils/SceneFrame';
import { GameDataStore } from '@/store/GameDataStore';
import { UserCharacter } from '@/types';
import { getGradeColor, getGradeStars, calculatePower } from '@/utils/Helpers';
import { getMonsterImageKey } from '@/utils/monsterImages';
import { characterService } from '@/services/CharacterService';

export class CharacterListScene extends Phaser.Scene {
  private gameData!: GameDataStore;
  private characters: UserCharacter[] = [];
  private selectedFilter: string = 'all';
  private sortBy: string = 'power';
  private statusText?: Phaser.GameObjects.Text;

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

    this.statusText = this.add.text(width / 2, height / 2, 'Loading characters...', {
      fontFamily: UI.FONTS.UI,
      fontSize: '20px',
      color: this.colorToCss(COLORS.TEXT_PRIMARY),
      wordWrap: { width: width - 120 },
      align: 'center',
    }).setOrigin(0.5);

    this.loadCharacters();

    // Back button
    this.createBackButton();

    addSceneFrame(this);
  }

  private async loadCharacters(): Promise<void> {
    try {
      const characters = await characterService.getCharacterList();
      this.characters = characters;
      this.gameData.setUserCharacters(characters);
      if (this.statusText) {
        this.statusText.setVisible(false);
      }
      this.scene.restart();
    } catch (error) {
      if (this.statusText) {
        const hasCache = this.gameData.getUserCharacters().length > 0;
        this.statusText.setText(
          hasCache
            ? 'Server unavailable. Showing cached characters.'
            : 'Server unavailable. Start the backend and try again.'
        );
      }
      console.error('Failed to load characters:', error);
    }
  }

  private createTopBar(width: number): void {
    const topBar = this.add.graphics();
    topBar.fillStyle(COLORS.PRIMARY, 0.3);
    topBar.fillRect(0, 0, width, 70);

    const title = this.add.text(width / 2, 35, 'My Characters', {
      fontFamily: UI.FONTS.TITLE,
      fontSize: '32px',
      color: this.colorToCss(COLORS.TEXT_PRIMARY),
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);

    // Character count
    const count = this.add.text(width - 20, 35, `Total: ${this.characters.length}`, {
      fontFamily: UI.FONTS.UI,
      fontSize: '18px',
      color: this.colorToCss(COLORS.TEXT_SECONDARY),
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
    const startX = 120;
    const startY = 170;
    const cardWidth = 240;
    const cardHeight = 320;
    const cols = 4;
    const spacingX = 24;
    const spacingY = 26;

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
          fontFamily: UI.FONTS.UI,
          fontSize: '24px',
          color: this.colorToCss(COLORS.TEXT_PRIMARY),
          align: 'center',
          wordWrap: { width: width - 200 },
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

    const gradeColor = getGradeColor(character.character.grade);

    // Card background with frame
    const bg = this.add.graphics();
    bg.fillStyle(COLORS.DARKER, 0.95);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 16);
    bg.lineStyle(3, gradeColor, 0.9);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 16);
    bg.lineStyle(1, COLORS.LIGHT, 0.25);
    bg.strokeRoundedRect(-width / 2 + 4, -height / 2 + 4, width - 8, height - 8, 12);

    // Inner glow
    const glow = this.add.graphics();
    glow.fillStyle(gradeColor, 0.12);
    glow.fillRoundedRect(-width / 2 + 10, -height / 2 + 10, width - 20, height * 0.58, 12);

    // Character image
    const spriteKey = getMonsterImageKey(character);
    const charSprite = this.add.sprite(0, -30, spriteKey);
    charSprite.setDisplaySize(150, 150);

    // Rarity ribbon
    const ribbon = this.add.graphics();
    ribbon.fillStyle(gradeColor, 0.95);
    ribbon.fillRoundedRect(-width / 2 + 12, -height / 2 + 12, 84, 28, 8);
    const ribbonText = this.add.text(-width / 2 + 54, -height / 2 + 26, `${character.character.grade}★`, {
      fontFamily: UI.FONTS.UI,
      fontSize: '14px',
      color: this.colorToCss(COLORS.TEXT_PRIMARY),
      fontStyle: 'bold',
    });
    ribbonText.setOrigin(0.5);

    // Character name
    const name = this.add.text(0, 80, character.character.name, {
      fontFamily: UI.FONTS.UI,
      fontSize: '18px',
      color: this.colorToCss(COLORS.TEXT_PRIMARY),
      fontStyle: 'bold',
      wordWrap: { width: width - 20 },
      align: 'center',
    });
    name.setOrigin(0.5);

    // Stars
    const stars = this.add.text(0, 110, getGradeStars(character.character.grade), {
      fontFamily: UI.FONTS.UI,
      fontSize: '16px',
    });
    stars.setOrigin(0.5);

    // Level
    const level = this.add.text(-width / 2 + 16, height / 2 - 26, `Lv. ${character.level}`, {
      fontFamily: UI.FONTS.UI,
      fontSize: '14px',
      color: this.colorToCss(COLORS.SECONDARY_LIGHT),
    });
    level.setOrigin(0, 0.5);

    // Power
    const power = calculatePower(character);
    const powerText = this.add.text(width / 2 - 16, height / 2 - 26, `PWR ${power}`, {
      fontFamily: UI.FONTS.UI,
      fontSize: '13px',
      color: this.colorToCss(COLORS.GOLD),
    });
    powerText.setOrigin(1, 0.5);

    card.add([bg, glow, charSprite, ribbon, ribbonText, name, stars, level, powerText]);
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

  private colorToCss(color: number): string {
    return Phaser.Display.Color.IntegerToColor(color).rgba;
  }
}
