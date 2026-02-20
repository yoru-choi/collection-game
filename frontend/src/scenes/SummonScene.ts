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
  private resultOverlayObjects: Phaser.GameObjects.GameObject[] = [];

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

    // Title
    const title = this.add.text(width / 2, 60, '✨ Summon Portal ✨', {
      fontFamily: UI.FONTS.TITLE,
      fontSize: '48px',
      color: this.colorToCss(COLORS.TEXT_PRIMARY),
      fontStyle: 'bold',
      shadow: {
        offsetX: 2,
        offsetY: 2,
        color: this.colorToCss(COLORS.PRIMARY_DARK),
        blur: 4,
        stroke: true,
        fill: true,
      },
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

    addSceneFrame(this);
  }

  private createBackground(width: number, height: number): void {
    // Multi-layer gradient background
    const bg = this.add.graphics();
    bg.fillGradientStyle(COLORS.BG_START, COLORS.BG_START, COLORS.PRIMARY_DARK, COLORS.PRIMARY_DARK, 1);
    bg.fillRect(0, 0, width, height);
    
    // Overlay gradient for depth
    const overlay = this.add.graphics();
    overlay.fillGradientStyle(COLORS.PRIMARY, COLORS.PRIMARY, COLORS.SECONDARY_DARK, COLORS.SECONDARY_DARK, 0.15);
    overlay.fillRect(0, 0, width, height);
  }

  private createCurrencyDisplay(width: number): void {
    const crystal = this.gameData.getPlayerData()?.crystals || 0;

    // Background
    const currencyBg = this.add.graphics();
    currencyBg.fillStyle(COLORS.PRIMARY_DARK, 0.9);
    currencyBg.fillRoundedRect(width - 200, 10, 180, 50, 12);
    currencyBg.lineStyle(2, COLORS.PRIMARY_LIGHT, 0.8);
    currencyBg.strokeRoundedRect(width - 200, 10, 180, 50, 12);

    this.currencyText = this.add.text(width - 110, 35, `💎 ${crystal}`, {
      fontFamily: UI.FONTS.UI,
      fontSize: '26px',
      color: this.colorToCss(COLORS.TEXT_PRIMARY),
      fontStyle: 'bold',
    }).setOrigin(0.5);
  }

  private createSummonButtons(width: number, height: number): void {
    // 2x2 grid centered, button width reduced to 300px to avoid overlap
    const leftCol = width / 4 + 40;   // ~360
    const rightCol = 3 * width / 4 - 40; // ~920
    const topRow = height / 2 - 50;
    const bottomRow = height / 2 + 70;

    // Normal Summon
    this.createSummonButton(
      leftCol,
      topRow,
      'Normal Summon',
      '100 💎',
      'Single',
      COLORS.PRIMARY,
      () => this.performSummon('normal', 1)
    );

    // Normal Summon x10
    this.createSummonButton(
      leftCol,
      bottomRow,
      'Normal Summon x10',
      '1000 💎',
      '10+1 bonus',
      COLORS.SECONDARY,
      () => this.performSummon('normal', 10)
    );

    // Premium Summon
    this.createSummonButton(
      rightCol,
      topRow,
      'Premium Summon',
      '300 💎',
      'Higher ★★★★★ Rate!',
      COLORS.WARNING,
      () => this.performSummon('premium', 1)
    );

    // Premium Summon x10
    this.createSummonButton(
      rightCol,
      bottomRow,
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
    shadow.fillStyle(0x000000, 0.3);
    shadow.fillRoundedRect(-153, -43, 306, 96, 16);

    // Button background with gradient
    const bg = this.add.graphics();
    bg.fillGradientStyle(
      color,
      color,
      Phaser.Display.Color.ValueToColor(color).darken(40).color,
      Phaser.Display.Color.ValueToColor(color).darken(40).color,
      1
    );
    bg.fillRoundedRect(-150, -45, 300, 90, 16);

    // Border
    bg.lineStyle(2, COLORS.LIGHT, 0.6);
    bg.strokeRoundedRect(-150, -45, 300, 90, 16);

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

    button.add([shadow, bg, titleText, costText, subtitleText]);
    button.setSize(300, 90);
    button.setInteractive({ useHandCursor: true });

    // Hover effects
    button.on('pointerover', () => {
      this.tweens.add({
        targets: button,
        scaleX: 1.08,
        scaleY: 1.08,
        duration: 200,
        ease: 'Back.easeOut',
      });

      // Enhance glow
      bg.clear();
      bg.fillGradientStyle(
        Phaser.Display.Color.ValueToColor(color).lighten(20).color,
        Phaser.Display.Color.ValueToColor(color).lighten(20).color,
        Phaser.Display.Color.ValueToColor(color).darken(20).color,
        Phaser.Display.Color.ValueToColor(color).darken(20).color,
        1
      );
      bg.fillRoundedRect(-150, -45, 300, 90, 16);
      bg.lineStyle(3, COLORS.LIGHT, 1);
      bg.strokeRoundedRect(-150, -45, 300, 90, 16);
    });

    button.on('pointerout', () => {
      this.tweens.add({
        targets: button,
        scaleX: 1,
        scaleY: 1,
        duration: 200,
      });

      // Reset
      bg.clear();
      bg.fillGradientStyle(
        color,
        color,
        Phaser.Display.Color.ValueToColor(color).darken(40).color,
        Phaser.Display.Color.ValueToColor(color).darken(40).color,
        1
      );
      bg.fillRoundedRect(-150, -45, 300, 90, 16);
      bg.lineStyle(2, COLORS.LIGHT, 0.6);
      bg.strokeRoundedRect(-150, -45, 300, 90, 16);
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
    // Small hint area below the summon buttons
    const panelX = width / 2;
    const panelY = height - 50;

    this.add.text(panelX, panelY, 'Summon results will appear in an overlay', {
      fontFamily: UI.FONTS.UI,
      fontSize: '14px',
      color: this.colorToCss(COLORS.TEXT_MUTED),
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
      currentCrt: character.baseCrt ?? 15,
      currentCrtDmg: character.baseCrtDmg ?? 50,
      currentAcc: character.baseAcc ?? 0,
      currentRes: character.baseRes ?? 0,
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

  private cleanupResultOverlay(): void {
    this.resultOverlayObjects.forEach((obj) => {
      if (obj && !obj.scene) return;
      obj.destroy();
    });
    this.resultOverlayObjects = [];
  }

  private showSummonResults(): void {
    this.cleanupResultOverlay();

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Dim background - blocks clicks behind
    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.8).setOrigin(0).setDepth(50);
    overlay.setInteractive(); // Block clicks through
    this.resultOverlayObjects.push(overlay);

    // Result panel
    const panelWidth = Math.min(1000, width - 100);
    const panelHeight = 600;
    const panel = this.add.graphics().setDepth(51);
    panel.fillStyle(COLORS.DARK, 0.95);
    panel.fillRoundedRect(
      width / 2 - panelWidth / 2,
      height / 2 - panelHeight / 2,
      panelWidth,
      panelHeight,
      15
    );

    // Grade-based border: if any 5-star → rainbow border, 4-star → gold
    const maxGrade = Math.max(...this.summonedCharacters.map((c) => c.character.grade));
    const borderColor = maxGrade >= 5 ? 0xff6600 : maxGrade >= 4 ? COLORS.PRIMARY : COLORS.SECONDARY;
    panel.lineStyle(3, borderColor);
    panel.strokeRoundedRect(
      width / 2 - panelWidth / 2,
      height / 2 - panelHeight / 2,
      panelWidth,
      panelHeight,
      15
    );
    this.resultOverlayObjects.push(panel);

    // Title
    const titleText = maxGrade >= 5 ? '🌈 Summon Results! 🌈' : maxGrade >= 4 ? '✨ Summon Results! ✨' : 'Summon Results!';
    const titleObj = this.add.text(width / 2, height / 2 - 260, titleText, {
      fontFamily: UI.FONTS.TITLE,
      fontSize: '32px',
      color: this.colorToCss(maxGrade >= 5 ? 0xff6600 : maxGrade >= 4 ? COLORS.PRIMARY : COLORS.TEXT_PRIMARY),
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(52);
    this.resultOverlayObjects.push(titleObj);

    // Display characters
    const cardSize = 140;
    const spacing = 20;
    const cols = 5;

    this.summonedCharacters.forEach((char, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = width / 2 - (cols * (cardSize + spacing)) / 2 + col * (cardSize + spacing) + cardSize / 2;
      const y = height / 2 - 150 + row * (cardSize + spacing);

      this.createResultCard(x, y, cardSize, char, index);
    });

    // Close button
    const closeBtn = this.add.container(width / 2, height / 2 + 250).setDepth(52);
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
      this.cleanupResultOverlay();
      this.summonedCharacters = [];
    });
    this.resultOverlayObjects.push(closeBtn);
  }

  private createResultCard(x: number, y: number, size: number, character: UserCharacter, index: number = 0): void {
    const card = this.add.container(x, y).setDepth(52);

    const grade = character.character.grade;
    const gradeColor = getGradeColor(grade);

    // Glow for 4-star (gold) and 5-star (rainbow/orange)
    if (grade >= 4) {
      const glowColor = grade >= 5 ? 0xff6600 : COLORS.PRIMARY;
      const glow = this.add.rectangle(0, 0, size + 8, size + 8, glowColor, 0.4);
      card.add(glow);
      this.tweens.add({
        targets: glow,
        alpha: 0.1,
        duration: 800,
        yoyo: true,
        repeat: -1,
      });
    }

    // Background
    const bg = this.add.rectangle(0, 0, size, size, COLORS.SECONDARY, 0.9);
    bg.setStrokeStyle(3, gradeColor);

    // Character sprite
    const spriteKey = getMonsterImageKey(character);
    const sprite = this.add.sprite(0, -20, spriteKey);
    sprite.setDisplaySize(size * 0.75, size * 0.75);

    // Stars
    const stars = this.add.text(0, 40, getGradeStars(grade), {
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

    // NEW badge
    const newBadge = this.add.text(size / 2 - 8, -size / 2 + 4, 'NEW!', {
      fontFamily: UI.FONTS.UI,
      fontSize: '11px',
      color: '#ffffff',
      backgroundColor: '#ff3333',
      padding: { x: 4, y: 2 },
      fontStyle: 'bold',
    }).setOrigin(1, 0);
    card.add(newBadge);

    this.resultOverlayObjects.push(card);

    // Staggered entrance animation
    card.setScale(0);
    this.tweens.add({
      targets: card,
      scaleX: 1,
      scaleY: 1,
      duration: 500,
      delay: index * 80,
      ease: 'Back.easeOut',
    });
  }

  private showRates(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const overlay = this.add.container(0, 0);
    overlay.setDepth(100);

    const dim = this.add.rectangle(0, 0, width, height, 0x000000, 0.7);
    dim.setOrigin(0);
    dim.setInteractive();
    overlay.add(dim);

    const panelW = 400;
    const panelH = 360;
    const panel = this.add.graphics();
    panel.fillStyle(COLORS.DARK, 0.95);
    panel.fillRoundedRect(width / 2 - panelW / 2, height / 2 - panelH / 2, panelW, panelH, 15);
    panel.lineStyle(2, COLORS.PRIMARY_LIGHT);
    panel.strokeRoundedRect(width / 2 - panelW / 2, height / 2 - panelH / 2, panelW, panelH, 15);
    overlay.add(panel);

    const titleText = this.add.text(width / 2, height / 2 - panelH / 2 + 30, 'Summon Rates', {
      fontFamily: UI.FONTS.TITLE,
      fontSize: '24px',
      color: this.colorToCss(COLORS.TEXT_PRIMARY),
      fontStyle: 'bold',
    }).setOrigin(0.5);
    overlay.add(titleText);

    const rates = [
      { grade: '1 Star', rate: '50%', color: '#aaaaaa' },
      { grade: '2 Star', rate: '30%', color: '#55bb55' },
      { grade: '3 Star', rate: '15%', color: '#5588ee' },
      { grade: '4 Star', rate: '4%', color: '#cc66ff' },
      { grade: '5 Star', rate: '1%', color: '#ffcc00' },
    ];

    const startY = height / 2 - panelH / 2 + 70;
    rates.forEach((r, i) => {
      const y = startY + i * 36;
      const gradeText = this.add.text(width / 2 - 80, y, r.grade, {
        fontFamily: UI.FONTS.UI,
        fontSize: '18px',
        color: r.color,
      });
      const rateText = this.add.text(width / 2 + 80, y, r.rate, {
        fontFamily: UI.FONTS.UI,
        fontSize: '18px',
        color: r.color,
        fontStyle: 'bold',
      });
      rateText.setOrigin(1, 0);
      overlay.add([gradeText, rateText]);
    });

    const noteY = startY + rates.length * 36 + 20;
    const note = this.add.text(width / 2, noteY, '10-pull guarantees at least one 4-star or higher!', {
      fontFamily: UI.FONTS.BODY,
      fontSize: '14px',
      color: this.colorToCss(COLORS.WARNING_LIGHT),
      wordWrap: { width: panelW - 40 },
      align: 'center',
    }).setOrigin(0.5, 0);
    overlay.add(note);

    const closeBtn = this.add.container(width / 2, height / 2 + panelH / 2 - 40);
    const closeBg = this.add.rectangle(0, 0, 120, 40, COLORS.INFO);
    closeBg.setStrokeStyle(2, COLORS.LIGHT);
    const closeText = this.add.text(0, 0, 'Close', {
      fontFamily: UI.FONTS.UI,
      fontSize: '16px',
      color: this.colorToCss(COLORS.TEXT_PRIMARY),
    }).setOrigin(0.5);
    closeBtn.add([closeBg, closeText]);
    closeBtn.setSize(120, 40);
    closeBtn.setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => overlay.destroy());
    overlay.add(closeBtn);
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
