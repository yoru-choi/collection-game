import Phaser from 'phaser';
import { SCENE_KEYS, COLORS, UI } from '@/utils/Constants';
import { addSceneFrame } from '@/utils/SceneFrame';
import { GameDataStore } from '@/store/GameDataStore';
import { UserCharacter } from '@/types';
import { getGradeColor, getGradeStars, calculatePower, getElementColor } from '@/utils/Helpers';
import { getMonsterImageKey } from '@/utils/monsterImages';
import { characterService } from '@/services/CharacterService';

export class CharacterListScene extends Phaser.Scene {
  private gameData!: GameDataStore;
  private characters: UserCharacter[] = [];
  private selectedFilter: string = 'all';
  private sortBy: string = 'power';
  private currentPage: number = 0;
  private itemsPerPage: number = 8; // 2 rows x 4 cols — fits within 720px
  private readonly sortOptions: string[] = ['power', 'level', 'grade', 'element'];
  private statusText?: Phaser.GameObjects.Text;

  constructor() {
    super({ key: SCENE_KEYS.CHARACTER_LIST });
  }

  init(data?: { selectedFilter?: string; sortBy?: string; currentPage?: number }): void {
    if (data?.selectedFilter !== undefined) this.selectedFilter = data.selectedFilter;
    if (data?.sortBy !== undefined) this.sortBy = data.sortBy;
    if (data?.currentPage !== undefined) this.currentPage = data.currentPage;
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
      this.scene.restart({ selectedFilter: this.selectedFilter, sortBy: this.sortBy, currentPage: this.currentPage });
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

    const count = this.add.text(width - 20, 35, `Total: ${this.characters.length}`, {
      fontFamily: UI.FONTS.UI,
      fontSize: '18px',
      color: this.colorToCss(COLORS.TEXT_SECONDARY),
    });
    count.setOrigin(1, 0.5);
  }

  private createFilterBar(width: number): void {
    const filterY = 90;

    const filters = ['All', 'Fire', 'Water', 'Wind', 'Light', 'Dark'];
    const buttonWidth = 100;
    const spacing = 10;
    const totalWidth = filters.length * (buttonWidth + spacing);
    const startX = (width - totalWidth) / 2;

    filters.forEach((filter, index) => {
      const x = startX + index * (buttonWidth + spacing);
      this.createFilterButton(x, filterY, filter.toLowerCase());
    });

    const sortNames = ['Power', 'Level', 'Grade', 'Element'];
    const sortKeys = ['power', 'level', 'grade', 'element'];
    const sortBtnWidth = 65;
    const sortSpacing = 5;
    const sortTotalWidth = sortNames.length * sortBtnWidth + (sortNames.length - 1) * sortSpacing;
    const sortStartX = width - sortTotalWidth - 20;

    const sortLabel = this.add.text(sortStartX, filterY - 12, 'Sort:', {
      fontFamily: UI.FONTS.UI,
      fontSize: '14px',
      color: this.colorToCss(COLORS.TEXT_SECONDARY),
    });
    sortLabel.setOrigin(0, 0);

    sortNames.forEach((name, i) => {
      const sx = sortStartX + i * (sortBtnWidth + sortSpacing) + sortBtnWidth / 2;
      this.createSortButton(sx, filterY + 14, name, sortKeys[i]);
    });
  }

  private createFilterButton(x: number, y: number, filter: string): void {
    const isSelected = this.selectedFilter === filter;

    let activeColor = COLORS.PRIMARY;
    if (filter !== 'all') {
      activeColor = getElementColor(filter as any);
    }

    const button = this.add.rectangle(
      x, y, 100, 40,
      isSelected ? activeColor : COLORS.SECONDARY,
      isSelected ? 1 : 0.4
    );
    button.setStrokeStyle(isSelected ? 3 : 2, isSelected ? activeColor : COLORS.LIGHT);

    if (isSelected) {
      this.add.rectangle(x, y + 18, 80, 4, activeColor, 1).setOrigin(0.5);
    }

    const text = this.add.text(x, y, filter.charAt(0).toUpperCase() + filter.slice(1), {
      fontFamily: UI.FONTS.UI,
      fontSize: '16px',
      color: isSelected ? this.colorToCss(COLORS.TEXT_PRIMARY) : this.colorToCss(COLORS.TEXT_MUTED),
      fontStyle: isSelected ? 'bold' : 'normal',
    });
    text.setOrigin(0.5);

    const zone = this.add.zone(x, y, 100, 40);
    zone.setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => {
      this.selectedFilter = filter;
      this.currentPage = 0;
      this.scene.restart({ selectedFilter: this.selectedFilter, sortBy: this.sortBy, currentPage: 0 });
    });
  }

  private createSortButton(x: number, y: number, label: string, sortKey: string): void {
    const isActive = this.sortBy === sortKey;

    const button = this.add.rectangle(
      x, y, 65, 28,
      isActive ? COLORS.INFO : COLORS.DARKER,
      isActive ? 0.9 : 0.6
    );
    button.setStrokeStyle(isActive ? 2 : 1, isActive ? COLORS.INFO_LIGHT : COLORS.TEXT_MUTED);

    const text = this.add.text(x, y, isActive ? label + ' ▼' : label, {
      fontFamily: UI.FONTS.UI,
      fontSize: '12px',
      color: isActive ? this.colorToCss(COLORS.TEXT_PRIMARY) : this.colorToCss(COLORS.TEXT_MUTED),
      fontStyle: isActive ? 'bold' : 'normal',
    });
    text.setOrigin(0.5);

    const zone = this.add.zone(x, y, 65, 28);
    zone.setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => {
      this.sortBy = sortKey;
      this.currentPage = 0;
      this.scene.restart({ selectedFilter: this.selectedFilter, sortBy: this.sortBy, currentPage: 0 });
    });
  }

  private createCharacterGrid(width: number, height: number): void {
    // Dynamic card sizing to fit within 1280x720
    const cols = 4;
    const rows = 2;
    const contentMargin = 30;
    const contentWidth = width - contentMargin * 2; // 1220px
    const gap = 20;
    const cardWidth = Math.floor((contentWidth - (cols - 1) * gap) / cols); // ~290px
    const cardHeight = 250;

    const startX = contentMargin + cardWidth / 2;
    const startY = 140 + cardHeight / 2; // below filter bar

    // Filter characters
    let filteredChars = this.characters;
    if (this.selectedFilter !== 'all') {
      filteredChars = this.characters.filter(
        (c) => c.character.element === this.selectedFilter
      );
    }

    // Sort characters
    filteredChars.sort((a, b) => {
      switch (this.sortBy) {
        case 'level':
          return b.level - a.level;
        case 'grade':
          if (b.character.grade !== a.character.grade) return b.character.grade - a.character.grade;
          return calculatePower(b) - calculatePower(a);
        case 'element': {
          const elementOrder = ['fire', 'water', 'wind', 'light', 'dark'];
          const diff = elementOrder.indexOf(a.character.element) - elementOrder.indexOf(b.character.element);
          if (diff !== 0) return diff;
          return calculatePower(b) - calculatePower(a);
        }
        case 'power':
        default:
          return calculatePower(b) - calculatePower(a);
      }
    });

    // Pagination
    const totalItems = filteredChars.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / this.itemsPerPage));
    if (this.currentPage >= totalPages) this.currentPage = totalPages - 1;
    if (this.currentPage < 0) this.currentPage = 0;
    const startIndex = this.currentPage * this.itemsPerPage;
    const pageChars = filteredChars.slice(startIndex, startIndex + this.itemsPerPage);

    // Display character cards
    pageChars.forEach((char, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = startX + col * (cardWidth + gap);
      const y = startY + row * (cardHeight + gap);

      this.createCharacterCard(x, y, cardWidth, cardHeight, char);
    });

    // Pagination bar
    if (totalPages > 1) {
      this.createPaginationBar(width, height, totalPages);
    }

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

    // Card background
    const bg = this.add.graphics();
    bg.fillStyle(COLORS.BG_CARD, 0.95);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 20);
    bg.lineStyle(2, gradeColor, 0.8);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 20);

    // Inner glow
    const glow = this.add.graphics();
    glow.fillStyle(gradeColor, 0.08);
    glow.fillRoundedRect(-width / 2 + 8, -height / 2 + 8, width - 16, height * 0.5, 16);

    // Character image
    const spriteKey = getMonsterImageKey(character);
    const charSprite = this.add.sprite(0, -30, spriteKey);
    charSprite.setDisplaySize(120, 120);

    // Grade badge (top-left)
    const ribbon = this.add.graphics();
    ribbon.fillStyle(gradeColor, 0.9);
    ribbon.fillRoundedRect(-width / 2 + 10, -height / 2 + 10, 70, 24, 8);
    const ribbonText = this.add.text(-width / 2 + 45, -height / 2 + 22, `${character.character.grade}★`, {
      fontFamily: UI.FONTS.UI,
      fontSize: '13px',
      color: this.colorToCss(COLORS.TEXT_PRIMARY),
      fontStyle: 'bold',
    });
    ribbonText.setOrigin(0.5);

    // Level badge (top-right)
    const lvlBadge = this.add.graphics();
    lvlBadge.fillStyle(COLORS.INFO, 0.85);
    lvlBadge.fillRoundedRect(width / 2 - 62, -height / 2 + 10, 52, 24, 8);
    const lvlBadgeText = this.add.text(width / 2 - 36, -height / 2 + 22, `Lv.${character.level}`, {
      fontFamily: UI.FONTS.UI,
      fontSize: '12px',
      color: this.colorToCss(COLORS.TEXT_PRIMARY),
      fontStyle: 'bold',
    });
    lvlBadgeText.setOrigin(0.5);

    // Element badge
    const elementColor = getElementColor(character.character.element as any);
    const elemBadge = this.add.graphics();
    elemBadge.fillStyle(elementColor, 0.8);
    elemBadge.fillRoundedRect(-width / 2 + 10, -height / 2 + 38, 70, 20, 6);
    const elemLabel = character.character.element.charAt(0).toUpperCase() + character.character.element.slice(1);
    const elemBadgeText = this.add.text(-width / 2 + 45, -height / 2 + 48, elemLabel, {
      fontFamily: UI.FONTS.UI,
      fontSize: '10px',
      color: this.colorToCss(COLORS.TEXT_PRIMARY),
      fontStyle: 'bold',
    });
    elemBadgeText.setOrigin(0.5);

    // Character name
    const name = this.add.text(0, 55, character.character.name, {
      fontFamily: UI.FONTS.UI,
      fontSize: '16px',
      color: this.colorToCss(COLORS.TEXT_PRIMARY),
      fontStyle: 'bold',
      wordWrap: { width: width - 20 },
      align: 'center',
    });
    name.setOrigin(0.5);

    // Stars
    const stars = this.add.text(0, 78, getGradeStars(character.character.grade), {
      fontFamily: UI.FONTS.UI,
      fontSize: '14px',
    });
    stars.setOrigin(0.5);

    // Level (bottom-left)
    const level = this.add.text(-width / 2 + 14, height / 2 - 22, `Lv. ${character.level}`, {
      fontFamily: UI.FONTS.UI,
      fontSize: '12px',
      color: this.colorToCss(COLORS.SECONDARY_LIGHT),
    });
    level.setOrigin(0, 0.5);

    // Power (bottom-right)
    const power = calculatePower(character);
    const powerText = this.add.text(width / 2 - 14, height / 2 - 22, `PWR ${power}`, {
      fontFamily: UI.FONTS.UI,
      fontSize: '12px',
      color: this.colorToCss(COLORS.GOLD),
    });
    powerText.setOrigin(1, 0.5);

    card.add([bg, glow, charSprite, ribbon, ribbonText, lvlBadge, lvlBadgeText, elemBadge, elemBadgeText, name, stars, level, powerText]);
    card.setSize(width, height);
    card.setInteractive({ useHandCursor: true });

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

  private createPaginationBar(width: number, height: number, totalPages: number): void {
    const barY = height - 40;

    const barBg = this.add.graphics();
    barBg.fillStyle(COLORS.BG_CARD, 0.85);
    barBg.fillRect(0, barY - 22, width, 44);

    // Previous button
    const prevEnabled = this.currentPage > 0;
    const prevBtn = this.add.rectangle(width / 2 - 120, barY, 90, 32,
      prevEnabled ? COLORS.INFO : COLORS.DARKER, prevEnabled ? 0.8 : 0.3);
    prevBtn.setStrokeStyle(1, prevEnabled ? COLORS.INFO_LIGHT : COLORS.TEXT_MUTED);
    const prevText = this.add.text(width / 2 - 120, barY, '← Prev', {
      fontFamily: UI.FONTS.UI,
      fontSize: '14px',
      color: prevEnabled ? this.colorToCss(COLORS.TEXT_PRIMARY) : this.colorToCss(COLORS.TEXT_MUTED),
      fontStyle: 'bold',
    });
    prevText.setOrigin(0.5);
    if (prevEnabled) {
      const prevZone = this.add.zone(width / 2 - 120, barY, 90, 32);
      prevZone.setInteractive({ useHandCursor: true });
      prevZone.on('pointerdown', () => {
        this.currentPage--;
        this.scene.restart({ selectedFilter: this.selectedFilter, sortBy: this.sortBy, currentPage: this.currentPage });
      });
    }

    // Page indicator
    const pageText = this.add.text(width / 2, barY, `${this.currentPage + 1} / ${totalPages}`, {
      fontFamily: UI.FONTS.UI,
      fontSize: '16px',
      color: this.colorToCss(COLORS.TEXT_PRIMARY),
      fontStyle: 'bold',
    });
    pageText.setOrigin(0.5);

    // Next button
    const nextEnabled = this.currentPage < totalPages - 1;
    const nextBtn = this.add.rectangle(width / 2 + 120, barY, 90, 32,
      nextEnabled ? COLORS.INFO : COLORS.DARKER, nextEnabled ? 0.8 : 0.3);
    nextBtn.setStrokeStyle(1, nextEnabled ? COLORS.INFO_LIGHT : COLORS.TEXT_MUTED);
    const nextText = this.add.text(width / 2 + 120, barY, 'Next →', {
      fontFamily: UI.FONTS.UI,
      fontSize: '14px',
      color: nextEnabled ? this.colorToCss(COLORS.TEXT_PRIMARY) : this.colorToCss(COLORS.TEXT_MUTED),
      fontStyle: 'bold',
    });
    nextText.setOrigin(0.5);
    if (nextEnabled) {
      const nextZone = this.add.zone(width / 2 + 120, barY, 90, 32);
      nextZone.setInteractive({ useHandCursor: true });
      nextZone.on('pointerdown', () => {
        this.currentPage++;
        this.scene.restart({ selectedFilter: this.selectedFilter, sortBy: this.sortBy, currentPage: this.currentPage });
      });
    }
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
