import Phaser from 'phaser';
import { SCENE_KEYS, COLORS, UI } from '@/utils/Constants';
import { addSceneFrame } from '@/utils/SceneFrame';
import { UserCharacter } from '@/types';
import { getGradeColor, getGradeStars, calculatePower, getElementColor, getRequiredExp, formatNumber } from '@/utils/Helpers';
import { getMonsterImageKey } from '@/utils/monsterImages';
import { characterService } from '@/services/CharacterService';
import { userService } from '@/services/UserService';
import { GameDataStore } from '@/store/GameDataStore';

/** PRD: 1성: 15, 2성: 25, 3성: 35, 4성: 45, 5성: 60 */
const MAX_LEVEL_BY_GRADE: Record<number, number> = { 1: 15, 2: 25, 3: 35, 4: 45, 5: 60 };

export class CharacterDetailScene extends Phaser.Scene {
  private character!: UserCharacter;
  private activeModal?: Phaser.GameObjects.Container;

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
    const bg = this.add.graphics();
    bg.fillGradientStyle(COLORS.BG_START, COLORS.BG_START, COLORS.BG_END, COLORS.BG_END, 1);
    bg.fillRect(0, 0, width, height);

    if (!this.character.character || !this.character.character.name) {
      const loading = this.add.text(width / 2, height / 2, 'Loading character...', {
        fontFamily: UI.FONTS.UI,
        fontSize: '18px',
        color: this.colorToCss(COLORS.TEXT_PRIMARY),
      });
      loading.setOrigin(0.5);

      characterService
        .getCharacter(this.character.id)
        .then((updated) => {
          if (!updated) {
            this.showToast('Failed to load character.');
            return;
          }
          this.scene.restart({ character: updated });
        })
        .catch((error) => {
          console.error('Load character failed:', error);
          this.showToast('Failed to load character.');
        });
      return;
    }

    // Left panel - Character display
    this.createCharacterDisplay(200, height / 2);

    // Right panel - Character info and actions
    this.createCharacterInfo(500, 100, width - 550);

    // Back button
    this.createBackButton();

    addSceneFrame(this);
  }

  private createCharacterDisplay(x: number, y: number): void {
    // Character card
    const cardWidth = 300;
    const cardHeight = 500;

    const card = this.add.graphics();
    card.fillStyle(COLORS.BG_CARD, 0.9);
    card.fillRoundedRect(x - cardWidth / 2, y - cardHeight / 2, cardWidth, cardHeight, 20);
    card.lineStyle(2, getGradeColor(this.character.character.grade), 0.8);
    card.strokeRoundedRect(x - cardWidth / 2, y - cardHeight / 2, cardWidth, cardHeight, 20);

    // Character sprite
    const spriteKey = getMonsterImageKey(this.character);
    const sprite = this.add.sprite(x, y - 50, spriteKey);
    sprite.setDisplaySize(220, 220);

    // Character name
    const name = this.add.text(x, y + 150, this.character.character.name, {
      fontFamily: UI.FONTS.TITLE,
      fontSize: '24px',
      color: this.colorToCss(COLORS.TEXT_PRIMARY),
      fontStyle: 'bold',
      wordWrap: { width: cardWidth - 40 },
      align: 'center',
    });
    name.setOrigin(0.5);

    // Stars
    const stars = this.add.text(x, y + 180, getGradeStars(this.character.character.grade), {
      fontFamily: UI.FONTS.UI,
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
      fontFamily: UI.FONTS.UI,
      fontSize: '20px',
      color: this.colorToCss(COLORS.TEXT_PRIMARY),
      fontStyle: 'bold',
    });
    element.setOrigin(0.5);
  }

  private createCharacterInfo(x: number, y: number, width: number): void {
    // Info panel - dynamic height to prevent overflow
    const sceneHeight = this.cameras.main.height;
    const panelHeight = sceneHeight - y - 30; // 30px bottom margin
    const panel = this.add.graphics();
    panel.fillStyle(COLORS.BG_CARD, 0.8);
    panel.fillRoundedRect(x, y, width, panelHeight, 16);
    panel.lineStyle(1, COLORS.PRIMARY, 0.4);
    panel.strokeRoundedRect(x, y, width, panelHeight, 16);

    let currentY = y + 15;

    // Title
    this.add.text(x + 20, currentY, 'Character Details', {
      fontFamily: UI.FONTS.TITLE,
      fontSize: '24px',
      color: this.colorToCss(COLORS.TEXT_PRIMARY),
      fontStyle: 'bold',
    });
    currentY += 36;

    // Basic info
    const grade = this.character.character?.grade ?? 1;
    const maxLevel = MAX_LEVEL_BY_GRADE[grade] ?? 60;
    const infoData = [
      { label: 'Level', value: `${this.character.level} / ${maxLevel}` },
      { label: 'Class', value: this.character.character.class },
      { label: 'Element', value: this.character.character.element },
      { label: 'Power', value: formatNumber(calculatePower(this.character)) },
    ];

    infoData.forEach((info) => {
      this.add.text(x + 20, currentY, `${info.label}:`, {
        fontFamily: UI.FONTS.UI,
        fontSize: '15px',
        color: this.colorToCss(COLORS.TEXT_MUTED),
      });
      this.add.text(x + 130, currentY, info.value, {
        fontFamily: UI.FONTS.UI,
        fontSize: '15px',
        color: this.colorToCss(COLORS.TEXT_PRIMARY),
        fontStyle: 'bold',
        wordWrap: { width: width - 180 },
      });
      currentY += 26;
    });

    // EXP Progress Bar
    currentY += 4;
    this.createExpBar(x + 20, currentY, width - 60);
    currentY += 32;

    // Divider
    const divider1 = this.add.graphics();
    divider1.lineStyle(1, COLORS.PRIMARY, 0.4);
    divider1.lineBetween(x + 20, currentY, x + width - 20, currentY);
    currentY += 8;

    // Stats - all 8 stats in a compact 2-column layout
    this.add.text(x + 20, currentY, 'Stats', {
      fontFamily: UI.FONTS.TITLE,
      fontSize: '18px',
      color: this.colorToCss(COLORS.TEXT_PRIMARY),
      fontStyle: 'bold',
    });
    currentY += 28;

    const stats = [
      { label: 'HP', value: this.character.currentHp, color: '#e74c3c' },
      { label: 'ATK', value: this.character.currentAtk, color: '#e67e22' },
      { label: 'DEF', value: this.character.currentDef, color: '#3498db' },
      { label: 'SPD', value: this.character.currentSpd, color: '#2ecc71' },
      { label: 'CRT', value: this.character.currentCrt, color: '#9b59b6' },
      { label: 'CRT DMG', value: this.character.currentCrtDmg, color: '#8e44ad' },
      { label: 'ACC', value: this.character.currentAcc, color: '#e89a3c' },
      { label: 'RES', value: this.character.currentRes, color: '#1abc9c' },
    ];

    const colWidth = (width - 60) / 2;
    stats.forEach((stat, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const statX = x + 20 + col * (colWidth + 10);
      const statY = currentY + row * 26;
      this.createCompactStat(statX, statY, colWidth - 10, stat.label, stat.value, stat.color);
    });
    currentY += Math.ceil(stats.length / 2) * 26 + 6;

    // Divider
    const divider2 = this.add.graphics();
    divider2.lineStyle(1, COLORS.PRIMARY, 0.4);
    divider2.lineBetween(x + 20, currentY, x + width - 20, currentY);
    currentY += 8;

    // Skills section
    this.add.text(x + 20, currentY, 'Skills', {
      fontFamily: UI.FONTS.TITLE,
      fontSize: '18px',
      color: this.colorToCss(COLORS.TEXT_PRIMARY),
      fontStyle: 'bold',
    });
    currentY += 26;

    const skillSlots = [
      { id: this.character.character.skill1Id, level: this.character.skill1Level, slot: 1 },
      { id: this.character.character.skill2Id, level: this.character.skill2Level, slot: 2 },
      { id: this.character.character.skill3Id, level: this.character.skill3Level, slot: 3 },
      { id: this.character.character.skill4Id, level: this.character.skill4Level, slot: 4 },
    ];

    const skillColWidth = (width - 60) / 2;
    skillSlots.forEach((skill, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const skillX = x + 20 + col * (skillColWidth + 10);
      const skillY = currentY + row * 32;
      this.createSkillSlot(skillX, skillY, skillColWidth - 10, skill.id, skill.level, skill.slot);
    });
    currentY += Math.ceil(skillSlots.length / 2) * 32 + 10;

    // Action buttons
    this.createActionButtons(x + 20, currentY, width - 40);
  }

  private createExpBar(x: number, y: number, width: number): void {
    const grade = this.character.character?.grade ?? 1;
    const maxLevel = MAX_LEVEL_BY_GRADE[grade] ?? 60;
    const isMaxLevel = this.character.level >= maxLevel;
    const currentExp = this.character.exp ?? 0;
    const requiredExp = isMaxLevel ? 0 : getRequiredExp(this.character.level);

    // Label
    this.add.text(x, y, 'EXP:', {
      fontFamily: UI.FONTS.UI,
      fontSize: '14px',
      color: this.colorToCss(COLORS.TEXT_MUTED),
    });

    // Bar background
    const barX = x + 50;
    const barWidth = width - 110;
    const barHeight = 16;

    const bgBar = this.add.graphics();
    bgBar.fillStyle(0x34495e);
    bgBar.fillRoundedRect(barX, y, barWidth, barHeight, 4);

    // Progress fill
    const progressBar = this.add.graphics();
    if (isMaxLevel) {
      progressBar.fillStyle(COLORS.GOLD);
      progressBar.fillRoundedRect(barX, y, barWidth, barHeight, 4);
    } else if (requiredExp > 0) {
      const progress = Math.min(currentExp / requiredExp, 1);
      progressBar.fillStyle(COLORS.INFO);
      if (progress > 0) {
        progressBar.fillRoundedRect(barX, y, barWidth * progress, barHeight, 4);
      }
    }

    // Text on bar
    const expText = isMaxLevel ? 'MAX' : `${formatNumber(currentExp)} / ${formatNumber(requiredExp)}`;
    this.add.text(barX + barWidth / 2, y + barHeight / 2, expText, {
      fontFamily: UI.FONTS.UI,
      fontSize: '11px',
      color: this.colorToCss(COLORS.TEXT_PRIMARY),
      fontStyle: 'bold',
    }).setOrigin(0.5);
  }

  private createCompactStat(
    x: number,
    y: number,
    width: number,
    label: string,
    value: number,
    color: string
  ): void {
    // Label
    this.add.text(x, y, label, {
      fontFamily: UI.FONTS.UI,
      fontSize: '13px',
      color: this.colorToCss(COLORS.TEXT_MUTED),
    });

    // Value
    this.add.text(x + 70, y, formatNumber(value), {
      fontFamily: UI.FONTS.UI,
      fontSize: '13px',
      color: color,
      fontStyle: 'bold',
    });

    // Mini bar
    const barX = x + 130;
    const barWidth = width - 130;
    const barHeight = 10;

    if (barWidth > 20) {
      const bgBar = this.add.graphics();
      bgBar.fillStyle(0x34495e);
      bgBar.fillRoundedRect(barX, y + 2, barWidth, barHeight, 3);

      const progressBar = this.add.graphics();
      progressBar.fillStyle(parseInt(color.replace('#', '0x')));
      const maxVal = label === 'HP' ? 5000 : (label === 'CRT DMG' ? 300 : (label === 'CRT' || label === 'ACC' || label === 'RES' ? 100 : 1000));
      const progress = Math.min(value / maxVal, 1);
      if (progress > 0) {
        progressBar.fillRoundedRect(barX, y + 2, barWidth * progress, barHeight, 3);
      }
    }
  }

  private createSkillSlot(
    x: number,
    y: number,
    width: number,
    skillId: string,
    skillLevel: number,
    slotIndex: number
  ): void {
    const hasSkill = skillId && skillId !== '' && skillId !== '0';

    // Skill slot background
    const slotBg = this.add.graphics();
    slotBg.fillStyle(COLORS.DARK, 0.6);
    slotBg.fillRoundedRect(x, y, width, 30, 5);
    slotBg.lineStyle(1, hasSkill ? COLORS.PRIMARY : COLORS.TEXT_MUTED, 0.4);
    slotBg.strokeRoundedRect(x, y, width, 30, 5);

    // Slot number icon
    const iconBg = this.add.graphics();
    const iconColor = hasSkill ? COLORS.PRIMARY : COLORS.TEXT_MUTED;
    iconBg.fillStyle(iconColor, 0.3);
    iconBg.fillRoundedRect(x + 4, y + 4, 22, 22, 4);
    this.add.text(x + 15, y + 15, `${slotIndex}`, {
      fontFamily: UI.FONTS.UI,
      fontSize: '12px',
      color: this.colorToCss(hasSkill ? COLORS.TEXT_PRIMARY : COLORS.TEXT_MUTED),
      fontStyle: 'bold',
    }).setOrigin(0.5);

    if (hasSkill) {
      // Skill name (use ID as placeholder since we only have IDs)
      this.add.text(x + 32, y + 6, `Skill #${skillId}`, {
        fontFamily: UI.FONTS.UI,
        fontSize: '11px',
        color: this.colorToCss(COLORS.TEXT_PRIMARY),
      });

      // Skill level
      this.add.text(x + width - 8, y + 15, `Lv.${skillLevel}`, {
        fontFamily: UI.FONTS.UI,
        fontSize: '11px',
        color: this.colorToCss(COLORS.GOLD),
        fontStyle: 'bold',
      }).setOrigin(1, 0.5);
    } else {
      this.add.text(x + 32, y + 15, 'Empty', {
        fontFamily: UI.FONTS.UI,
        fontSize: '11px',
        color: this.colorToCss(COLORS.TEXT_MUTED),
      }).setOrigin(0, 0.5);
    }
  }

  private createActionButtons(x: number, y: number, width: number): void {
    const grade = this.character.character?.grade ?? 1;
    const maxLevel = MAX_LEVEL_BY_GRADE[grade] ?? 60;
    const isMaxLevel = this.character.level >= maxLevel;
    const isMaxGrade = grade >= 5;
    const goldCost = this.character.level * 100;

    const buttonWidth = (width - 40) / 3;

    // Level Up button
    const lvlUpText = isMaxLevel ? 'Level Up\n(MAX)' : `Level Up\n(${formatNumber(goldCost)} Gold)`;
    const lvlUpColor = isMaxLevel ? COLORS.DARK : COLORS.SUCCESS;
    this.createButton(
      x,
      y,
      buttonWidth,
      50,
      lvlUpText,
      lvlUpColor,
      () => {
        if (isMaxLevel) {
          this.showToast(`Already at max level (${maxLevel}). Awaken first!`);
          return;
        }
        this.handleLevelUp();
      },
      isMaxLevel
    );

    // Awaken button
    const awakenDisabled = !isMaxLevel || isMaxGrade;
    let awakenText: string;
    if (isMaxGrade) {
      awakenText = 'Awaken\n(MAX Grade)';
    } else if (!isMaxLevel) {
      awakenText = `Awaken\n(Req. Lv.${maxLevel})`;
    } else {
      awakenText = 'Awaken\n(Ready!)';
    }
    const awakenColor = awakenDisabled ? COLORS.DARK : COLORS.WARNING;
    this.createButton(
      x + (buttonWidth + 20),
      y,
      buttonWidth,
      50,
      awakenText,
      awakenColor,
      () => {
        if (isMaxGrade) {
          this.showToast('Already at maximum grade!');
          return;
        }
        if (!isMaxLevel) {
          this.showToast(`Reach Lv.${maxLevel} before awakening.`);
          return;
        }
        this.handleEvolve();
      },
      awakenDisabled
    );

    // Rune management button
    this.createButton(
      x + 2 * (buttonWidth + 20),
      y,
      buttonWidth,
      50,
      'Manage Runes\n(Coming Soon)',
      COLORS.DARK,
      () => this.handleManageRunes(),
      true
    );
  }

  private createButton(
    x: number,
    y: number,
    width: number,
    height: number,
    text: string,
    color: number,
    callback: () => void,
    disabled: boolean = false
  ): void {
    const button = this.add.container(x, y);

    const bgAlpha = disabled ? 0.4 : 1;
    const bg = this.add.rectangle(width / 2, height / 2, width, height, color, bgAlpha);
    bg.setStrokeStyle(2, disabled ? COLORS.TEXT_MUTED : COLORS.LIGHT);

    const btnText = this.add.text(width / 2, height / 2, text, {
      fontFamily: UI.FONTS.UI,
      fontSize: '13px',
      color: disabled ? this.colorToCss(COLORS.TEXT_MUTED) : this.colorToCss(COLORS.TEXT_PRIMARY),
      fontStyle: 'bold',
      align: 'center',
    });
    btnText.setOrigin(0.5);

    button.add([bg, btnText]);
    button.setSize(width, height);
    button.setInteractive({ useHandCursor: !disabled });

    if (!disabled) {
      button.on('pointerover', () => {
        bg.setFillStyle(color, 0.8);
      });

      button.on('pointerout', () => {
        bg.setFillStyle(color, 1);
      });
    }

    button.on('pointerdown', callback);
  }

  // ═══════════════════════════════════════════════════════════════════
  //  Level Up 모달
  // ═══════════════════════════════════════════════════════════════════
  private handleLevelUp(): void {
    this.closeModal();

    const grade = this.character.character?.grade ?? 1;
    const maxLevel = MAX_LEVEL_BY_GRADE[grade] ?? 60;
    const currentLevel = this.character.level;

    if (currentLevel >= maxLevel) {
      this.showToast(`Already at max level (${maxLevel}) for this grade. Evolve first!`);
      return;
    }

    const { width, height } = this.cameras.main;
    let qty = 1;

    const overlay = this.add.graphics().fillStyle(0x000000, 0.6).fillRect(0, 0, width, height);

    const mW = 420, mH = 280;
    const mX = (width - mW) / 2, mY = (height - mH) / 2;
    const modalBg = this.add.graphics();
    modalBg.fillStyle(COLORS.DARKER, 0.98);
    modalBg.fillRoundedRect(mX, mY, mW, mH, 14);
    modalBg.lineStyle(3, COLORS.SUCCESS, 0.9);
    modalBg.strokeRoundedRect(mX, mY, mW, mH, 14);

    const title = this.add.text(width / 2, mY + 30, '⬆️ Level Up', {
      fontFamily: UI.FONTS.TITLE, fontSize: '24px',
      color: this.colorToCss(COLORS.TEXT_PRIMARY), fontStyle: 'bold',
    }).setOrigin(0.5);

    const subInfo = this.add.text(width / 2, mY + 64,
      `Current: Lv.${currentLevel} / Max: Lv.${maxLevel}`, {
        fontFamily: UI.FONTS.UI, fontSize: '16px',
        color: this.colorToCss(COLORS.TEXT_MUTED),
      }).setOrigin(0.5);

    const qtyLabel = this.add.text(width / 2, mY + 110, `Exp Crystals: ${qty}`, {
      fontFamily: UI.FONTS.UI, fontSize: '20px',
      color: this.colorToCss(COLORS.TEXT_PRIMARY), fontStyle: 'bold',
    }).setOrigin(0.5);

    const updateQty = (d: number) => {
      qty = Math.max(1, qty + d);
      qtyLabel.setText(`Exp Crystals: ${qty}`);
    };

    // − 버튼
    const minusBtn = this.add.container(width / 2 - 90, mY + 110);
    const minusBg = this.add.graphics();
    minusBg.fillStyle(COLORS.DARK, 0.9).fillRoundedRect(-18, -18, 36, 36, 6)
      .lineStyle(2, COLORS.LIGHT, 0.5).strokeRoundedRect(-18, -18, 36, 36, 6);
    minusBtn.add([minusBg, this.add.text(0, 0, '−', { fontSize: '22px', color: '#fff' }).setOrigin(0.5)]);
    minusBtn.setSize(36, 36).setInteractive({ useHandCursor: true });
    minusBtn.on('pointerdown', () => updateQty(-1));

    // + 버튼
    const plusBtn = this.add.container(width / 2 + 90, mY + 110);
    const plusBg = this.add.graphics();
    plusBg.fillStyle(COLORS.DARK, 0.9).fillRoundedRect(-18, -18, 36, 36, 6)
      .lineStyle(2, COLORS.LIGHT, 0.5).strokeRoundedRect(-18, -18, 36, 36, 6);
    plusBtn.add([plusBg, this.add.text(0, 0, '+', { fontSize: '22px', color: '#fff' }).setOrigin(0.5)]);
    plusBtn.setSize(36, 36).setInteractive({ useHandCursor: true });
    plusBtn.on('pointerdown', () => updateQty(1));

    // 확인 버튼
    const confirmBtn = this.add.container(width / 2 - 70, mY + 220);
    const confBg = this.add.rectangle(0, 0, 120, 44, COLORS.SUCCESS, 0.9).setStrokeStyle(2, COLORS.LIGHT);
    confirmBtn.add([confBg, this.add.text(0, 0, '✅ Level Up', {
      fontFamily: UI.FONTS.UI, fontSize: '17px', color: '#fff', fontStyle: 'bold',
    }).setOrigin(0.5)]);
    confirmBtn.setSize(120, 44).setInteractive({ useHandCursor: true });
    confirmBtn.on('pointerdown', () => {
      this.closeModal();
      characterService.levelUpCharacter(this.character.id, qty)
        .then(async updated => {
          if (!updated) { this.showToast('Level up failed.'); return; }
          this.character = updated;
          // Refresh profile (gold spent)
          const profile = await userService.getProfile();
          if (profile) GameDataStore.getInstance().setPlayerData(profile);
          this.showToast('✅ Level up successful!');
          this.scene.restart({ character: updated });
        })
        .catch(err => {
          console.error('Level up failed:', err);
          this.showToast('❌ Level up failed.');
        });
    });

    // 취소 버튼
    const cancelBtn = this.add.container(width / 2 + 70, mY + 220);
    const canBg = this.add.rectangle(0, 0, 120, 44, COLORS.DANGER, 0.8).setStrokeStyle(2, COLORS.LIGHT);
    cancelBtn.add([canBg, this.add.text(0, 0, '✕ Cancel', {
      fontFamily: UI.FONTS.UI, fontSize: '17px', color: '#fff', fontStyle: 'bold',
    }).setOrigin(0.5)]);
    cancelBtn.setSize(120, 44).setInteractive({ useHandCursor: true });
    cancelBtn.on('pointerdown', () => this.closeModal());

    this.activeModal = this.add.container(0, 0, [
      overlay, modalBg, title, subInfo, qtyLabel,
      minusBtn, plusBtn, confirmBtn, cancelBtn,
    ]);
    this.activeModal.setDepth(100);
  }

  // ═══════════════════════════════════════════════════════════════════
  //  Evolve 모달
  // ═══════════════════════════════════════════════════════════════════
  private handleEvolve(): void {
    this.closeModal();

    const grade = this.character.character?.grade ?? 1;
    const maxLevel = MAX_LEVEL_BY_GRADE[grade] ?? 60;

    const { width, height } = this.cameras.main;

    const overlay = this.add.graphics().fillStyle(0x000000, 0.6).fillRect(0, 0, width, height);

    const mW = 440, mH = 300;
    const mX = (width - mW) / 2, mY = (height - mH) / 2;
    const modalBg = this.add.graphics();
    modalBg.fillStyle(COLORS.DARKER, 0.98);
    modalBg.fillRoundedRect(mX, mY, mW, mH, 14);
    modalBg.lineStyle(3, COLORS.WARNING, 0.9);
    modalBg.strokeRoundedRect(mX, mY, mW, mH, 14);

    const title = this.add.text(width / 2, mY + 30, '✨ Evolve Character', {
      fontFamily: UI.FONTS.TITLE, fontSize: '24px',
      color: this.colorToCss(COLORS.TEXT_PRIMARY), fontStyle: 'bold',
    }).setOrigin(0.5);

    const gradeLabel = this.add.text(width / 2, mY + 68,
      `${getGradeStars(grade)}  →  ${getGradeStars(Math.min(5, grade + 1))}`, {
        fontFamily: UI.FONTS.UI, fontSize: '22px',
        color: this.colorToCss(COLORS.GOLD),
      }).setOrigin(0.5);

    const needsMaxLevel = this.character.level < maxLevel;
    const requirement = this.add.text(width / 2, mY + 108,
      needsMaxLevel
        ? `❌ Requires Lv.${maxLevel} (current: Lv.${this.character.level})`
        : `✅ Level requirement met (Lv.${maxLevel})`, {
        fontFamily: UI.FONTS.UI, fontSize: '15px',
        color: needsMaxLevel
          ? this.colorToCss(COLORS.DANGER)
          : this.colorToCss(COLORS.SUCCESS),
      }).setOrigin(0.5);

    const note = this.add.text(width / 2, mY + 140,
      'Character level resets to 1 after evolving.', {
        fontFamily: UI.FONTS.UI, fontSize: '13px',
        color: this.colorToCss(COLORS.TEXT_MUTED),
      }).setOrigin(0.5);

    // 확인 (level requirement 거의 영향 쨼)
    const confirmBtn = this.add.container(width / 2 - 70, mY + 240);
    const cBg = this.add.rectangle(0, 0, 120, 44,
      needsMaxLevel ? COLORS.DARK : COLORS.WARNING, needsMaxLevel ? 0.4 : 0.9
    ).setStrokeStyle(2, COLORS.LIGHT);
    confirmBtn.add([cBg, this.add.text(0, 0, '✨ Evolve', {
      fontFamily: UI.FONTS.UI, fontSize: '17px',
      color: needsMaxLevel ? this.colorToCss(COLORS.TEXT_MUTED) : '#000',
      fontStyle: 'bold',
    }).setOrigin(0.5)]);
    confirmBtn.setSize(120, 44).setInteractive({ useHandCursor: true });
    confirmBtn.on('pointerdown', () => {
      if (needsMaxLevel) {
        this.showToast(`Reach Lv.${maxLevel} before evolving.`);
        return;
      }
      this.closeModal();
      characterService.evolveCharacter(this.character.id)
        .then(async updated => {
          if (!updated) { this.showToast('Evolve failed.'); return; }
          this.character = updated;
          // Refresh profile (gold/materials spent)
          const profile = await userService.getProfile();
          if (profile) GameDataStore.getInstance().setPlayerData(profile);
          this.showToast('✨ Evolution successful!');
          this.scene.restart({ character: updated });
        })
        .catch(err => {
          console.error('Evolve failed:', err);
          this.showToast('❌ Evolve failed.');
        });
    });

    // 취소
    const cancelBtn = this.add.container(width / 2 + 70, mY + 240);
    const canBg = this.add.rectangle(0, 0, 120, 44, COLORS.INFO, 0.8).setStrokeStyle(2, COLORS.LIGHT);
    cancelBtn.add([canBg, this.add.text(0, 0, '✕ Cancel', {
      fontFamily: UI.FONTS.UI, fontSize: '17px', color: '#fff', fontStyle: 'bold',
    }).setOrigin(0.5)]);
    cancelBtn.setSize(120, 44).setInteractive({ useHandCursor: true });
    cancelBtn.on('pointerdown', () => this.closeModal());

    this.activeModal = this.add.container(0, 0, [
      overlay, modalBg, title, gradeLabel, requirement, note, confirmBtn, cancelBtn,
    ]);
    this.activeModal.setDepth(100);
  }

  private closeModal(): void {
    if (this.activeModal) {
      this.activeModal.destroy();
      this.activeModal = undefined;
    }
  }

  private handleManageRunes(): void {
    this.showToast('Rune Management - Coming Soon!');
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
      this.scene.start(SCENE_KEYS.CHARACTER_LIST);
    });
  }

  private colorToCss(color: number): string {
    return Phaser.Display.Color.IntegerToColor(color).rgba;
  }

  private showToast(message: string): void {
    const { width, height } = this.cameras.main;
    const toast = this.add.text(width / 2, height - 80, message, {
      fontFamily: UI.FONTS.UI,
      fontSize: '17px',
      color: '#ffffff',
      backgroundColor: '#000000cc',
      padding: { x: 16, y: 8 },
    }).setOrigin(0.5).setDepth(200);
    this.tweens.add({
      targets: toast,
      y: height - 110,
      alpha: 0,
      delay: 1800,
      duration: 600,
      onComplete: () => toast.destroy(),
    });
  }
}
