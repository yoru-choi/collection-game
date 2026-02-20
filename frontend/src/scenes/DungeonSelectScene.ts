import Phaser from 'phaser';
import { SCENE_KEYS, COLORS, UI } from '@/utils/Constants';
import { addSceneFrame } from '@/utils/SceneFrame';
import { Dungeon } from '@/types';
import { GameDataStore } from '@/store/GameDataStore';
import { dungeonService, DungeonProgress } from '@/services/DungeonService';

type Difficulty = 'normal' | 'hard' | 'hell';

export class DungeonSelectScene extends Phaser.Scene {
  private dungeons: Dungeon[] = [];
  private progress: DungeonProgress | null = null;
  private gameData!: GameDataStore;
  private selectedChapter: number = 1;
  private selectedDifficulty: Difficulty = 'normal';
  private statusText?: Phaser.GameObjects.Text;
  private listContainer?: Phaser.GameObjects.Container;
  private chapterTabs: Phaser.GameObjects.Container[] = [];
  private difficultyTabs: Phaser.GameObjects.Container[] = [];
  private confirmModal?: Phaser.GameObjects.Container;
  private energyDisplay?: Phaser.GameObjects.Container;
  private currentDungeonPage: number = 0;
  private readonly maxPerPage = 9; // 3 rows x 3 cols

  constructor() {
    super({ key: SCENE_KEYS.DUNGEON_SELECT });
  }

  create(): void {
    this.gameData = GameDataStore.getInstance();
    this.gameData.updateEnergy();
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // 배경
    const bgGfx = this.add.graphics();
    bgGfx.fillGradientStyle(COLORS.BG_START, COLORS.BG_START, COLORS.BG_END, COLORS.BG_END, 1);
    bgGfx.fillRect(0, 0, width, height);

    // 제목
    this.add.text(width / 2, 32, '🏰 Dungeon Select', {
      fontFamily: UI.FONTS.TITLE,
      fontSize: '34px',
      color: this.ccss(COLORS.TEXT_PRIMARY),
      fontStyle: 'bold',
      shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 6, fill: true },
    }).setOrigin(0.5);

    // Energy display at top-right
    this.createEnergyDisplay(width);

    // Chapter tabs
    this.createChapterTabs(width);

    // Difficulty tabs
    this.createDifficultyTabs(width);

    this.statusText = this.add.text(width / 2, height / 2, 'Loading dungeons...', {
      fontSize: '20px',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.loadData();

    this.createBackButton();
    addSceneFrame(this);
  }

  private createEnergyDisplay(width: number): void {
    if (this.energyDisplay) { this.energyDisplay.destroy(); }

    const player = this.gameData.getPlayerData();
    const energy = player?.energy ?? 0;
    const maxEnergy = player?.maxEnergy ?? 100;

    const container = this.add.container(width - 160, 36);

    // Badge background
    const bg = this.add.graphics();
    bg.fillStyle(COLORS.DARK, 0.92);
    bg.fillRoundedRect(-80, -18, 160, 36, 10);
    bg.lineStyle(2, COLORS.WARNING, 0.8);
    bg.strokeRoundedRect(-80, -18, 160, 36, 10);

    // Energy bar background
    const barBg = this.add.graphics();
    barBg.fillStyle(COLORS.DARKER, 0.8);
    barBg.fillRoundedRect(10, -8, 60, 16, 4);

    // Energy bar fill
    const fillRatio = Math.min(energy / maxEnergy, 1);
    const barFill = this.add.graphics();
    const barColor = fillRatio > 0.5 ? COLORS.SUCCESS : (fillRatio > 0.25 ? COLORS.WARNING : COLORS.DANGER);
    if (fillRatio > 0) {
      barFill.fillStyle(barColor, 0.9);
      barFill.fillRoundedRect(10, -8, Math.max(60 * fillRatio, 4), 16, 4);
    }

    const label = this.add.text(-68, 0, `⚡ ${energy}/${maxEnergy}`, {
      fontFamily: UI.FONTS.UI, fontSize: '14px',
      color: this.ccss(barColor), fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    container.add([bg, barBg, barFill, label]);
    this.energyDisplay = container;
  }

  private refreshEnergyDisplay(): void {
    this.gameData.updateEnergy();
    this.createEnergyDisplay(this.cameras.main.width);
  }

  private createChapterTabs(width: number): void {
    const chapters = [1, 2];
    const tabY = 80;
    const tabWidth = 150;
    const startX = width / 2 - (chapters.length * (tabWidth + 10)) / 2;

    chapters.forEach((ch, i) => {
      const x = startX + i * (tabWidth + 10) + tabWidth / 2;
      const tab = this.createTab(x, tabY, tabWidth, 38, `Chapter ${ch}`, ch === this.selectedChapter);
      tab.on('pointerdown', () => {
        this.selectedChapter = ch;
        this.refreshTabs();
        this.loadDungeons();
      });
      this.chapterTabs.push(tab);
    });
  }

  private createDifficultyTabs(width: number): void {
    const difficulties: { label: string; value: Difficulty; color: number }[] = [
      { label: 'Normal', value: 'normal', color: COLORS.SUCCESS },
      { label: 'Hard', value: 'hard', color: COLORS.WARNING },
      { label: 'Hell', value: 'hell', color: COLORS.DANGER },
    ];
    const tabY = 125;
    const tabWidth = 120;
    const startX = width / 2 - (difficulties.length * (tabWidth + 10)) / 2;

    difficulties.forEach((diff, i) => {
      const x = startX + i * (tabWidth + 10) + tabWidth / 2;
      const tab = this.createTab(x, tabY, tabWidth, 32, diff.label, diff.value === this.selectedDifficulty);
      tab.on('pointerdown', () => {
        this.selectedDifficulty = diff.value;
        this.refreshTabs();
        this.filterAndRender();
      });
      this.difficultyTabs.push(tab);
    });
  }

  private createTab(x: number, y: number, w: number, h: number, label: string, active: boolean): Phaser.GameObjects.Container {
    const tab = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, w, h, active ? COLORS.PRIMARY : COLORS.SECONDARY, active ? 1 : 0.5);
    bg.setStrokeStyle(2, active ? COLORS.LIGHT : COLORS.INFO);
    const text = this.add.text(0, 0, label, {
      fontSize: '15px',
      color: '#ffffff',
      fontStyle: active ? 'bold' : 'normal',
    });
    text.setOrigin(0.5);
    tab.add([bg, text]);
    tab.setSize(w, h);
    tab.setInteractive({ useHandCursor: true });
    return tab;
  }

  private refreshTabs(): void {
    // Destroy and recreate tabs for simplicity
    this.chapterTabs.forEach(t => t.destroy());
    this.difficultyTabs.forEach(t => t.destroy());
    this.chapterTabs = [];
    this.difficultyTabs = [];
    const width = this.cameras.main.width;
    this.createChapterTabs(width);
    this.createDifficultyTabs(width);
  }

  private async loadData(): Promise<void> {
    try {
      const [progress] = await Promise.all([
        dungeonService.getDungeonProgress(),
      ]);
      this.progress = progress;
      await this.loadDungeons();
    } catch (error) {
      if (this.statusText) {
        this.statusText.setText('Failed to load dungeons');
      }
      console.error('Failed to load dungeon data:', error);
    }
  }

  private async loadDungeons(): Promise<void> {
    try {
      const dungeons = await dungeonService.getDungeons(this.selectedChapter);
      this.dungeons = dungeons.filter((d) => d.type === 'story');
      this.filterAndRender();
    } catch (error) {
      if (this.statusText) {
        this.statusText.setText('Failed to load dungeons');
      }
      console.error('Failed to load dungeons:', error);
    }
  }

  private filterAndRender(): void {
    const filtered = this.dungeons.filter(
      (d) => d.difficulty === this.selectedDifficulty
    );
    this.renderDungeonList(filtered);
  }

  private renderDungeonList(dungeons: Dungeon[]): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    if (this.statusText) { this.statusText.destroy(); this.statusText = undefined; }
    if (this.listContainer) { this.listContainer.destroy(); this.listContainer = undefined; }

    this.listContainer = this.add.container(0, 0);

    if (dungeons.length === 0) {
      const noData = this.add.text(width / 2, height / 2, 'No dungeons for this selection', {
        fontFamily: UI.FONTS.UI, fontSize: '18px',
        color: this.ccss(COLORS.TEXT_MUTED),
      }).setOrigin(0.5);
      this.listContainer.add(noData);
      return;
    }

    const COLS = 3;
    const GAP_X = 16;
    const GAP_Y = 12;
    const CARD_W = Math.floor((1220 - (COLS - 1) * GAP_X) / COLS); // ~396px
    const CARD_H = 148; // reduced to fit 3 rows
    const startY = 170;
    const totalW = COLS * CARD_W + (COLS - 1) * GAP_X;
    const startX = (width - totalW) / 2;

    // Pagination
    const totalPages = Math.max(1, Math.ceil(dungeons.length / this.maxPerPage));
    if (this.currentDungeonPage >= totalPages) this.currentDungeonPage = totalPages - 1;
    if (this.currentDungeonPage < 0) this.currentDungeonPage = 0;
    const pageStart = this.currentDungeonPage * this.maxPerPage;
    const pageDungeons = dungeons.slice(pageStart, pageStart + this.maxPerPage);

    // Page controls
    if (totalPages > 1) {
      const pageY = height - 40;
      if (this.currentDungeonPage > 0) {
        const prevBtn = this.add.text(width / 2 - 100, pageY, '← Prev', {
          fontFamily: UI.FONTS.UI, fontSize: '15px',
          color: this.ccss(COLORS.TEXT_PRIMARY), fontStyle: 'bold',
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        prevBtn.on('pointerdown', () => {
          this.currentDungeonPage--;
          this.filterAndRender();
        });
        this.listContainer.add(prevBtn);
      }

      const pageIndicator = this.add.text(width / 2, pageY, `${this.currentDungeonPage + 1} / ${totalPages}`, {
        fontFamily: UI.FONTS.UI, fontSize: '14px',
        color: this.ccss(COLORS.TEXT_SECONDARY),
      }).setOrigin(0.5);
      this.listContainer.add(pageIndicator);

      if (this.currentDungeonPage < totalPages - 1) {
        const nextBtn = this.add.text(width / 2 + 100, pageY, 'Next →', {
          fontFamily: UI.FONTS.UI, fontSize: '15px',
          color: this.ccss(COLORS.TEXT_PRIMARY), fontStyle: 'bold',
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        nextBtn.on('pointerdown', () => {
          this.currentDungeonPage++;
          this.filterAndRender();
        });
        this.listContainer.add(nextBtn);
      }
    }

    const clearedSet = new Set(this.progress?.cleared || []);

    pageDungeons.forEach((dungeon, index) => {
      const dungeonIdNum = Number(dungeon.id);
      const isCleared = clearedSet.has(dungeonIdNum);

      let isLocked = false;
      if (dungeon.stage && dungeon.stage > 1) {
        const prevDungeon = dungeons.find(d => d.stage === (dungeon.stage! - 1));
        if (prevDungeon && !clearedSet.has(Number(prevDungeon.id))) {
          isLocked = true;
        }
      }
      if (this.selectedDifficulty === 'hard' || this.selectedDifficulty === 'hell') {
        isLocked = false;
      }

      const col = index % COLS;
      const row = Math.floor(index / COLS);
      const x = startX + col * (CARD_W + GAP_X);
      const y = startY + row * (CARD_H + GAP_Y);

      const card = this.createDungeonCard(dungeon, isCleared, isLocked, CARD_W, CARD_H);
      card.setPosition(x, y);
      this.listContainer!.add(card);
    });
  }

  /** Extract reward amounts from dungeon for display */
  private extractRewards(dungeon: Dungeon): { gold: number; crystal: number; shards: number; exp: number } {
    const gold = dungeon.goldReward ?? 0;
    const exp = dungeon.expReward ?? 0;
    let crystal = 0;
    let shards = 0;

    if (dungeon.rewards && dungeon.rewards.length > 0) {
      for (const r of dungeon.rewards) {
        const name = (r.name ?? '').toLowerCase();
        if (name.includes('crystal')) {
          crystal += r.quantity;
        } else if (name.includes('shard')) {
          shards += r.quantity;
        }
      }
    }

    return { gold, crystal, shards, exp };
  }

  private createDungeonCard(
    dungeon: Dungeon,
    isCleared: boolean,
    isLocked: boolean,
    w: number, h: number
  ): Phaser.GameObjects.Container {
    const card = this.add.container(0, 0);

    const diffColor: Record<string, number> = {
      normal: COLORS.SUCCESS, hard: COLORS.WARNING, hell: COLORS.DANGER,
    };
    const borderColor = isLocked
      ? COLORS.TEXT_MUTED
      : (isCleared ? COLORS.SUCCESS : (diffColor[this.selectedDifficulty] ?? COLORS.PRIMARY));

    const bgColor = isLocked ? 0x2a2a2a : (isCleared ? 0x2a4a2a : 0x2a3a4a);
    const cardBg = this.add.graphics();
    cardBg.fillStyle(bgColor, isLocked ? 0.5 : 0.9);
    cardBg.fillRoundedRect(0, 0, w, h, 16);
    cardBg.lineStyle(2, borderColor, isLocked ? 0.3 : 0.8);
    cardBg.strokeRoundedRect(0, 0, w, h, 16);
    card.add(cardBg);

    // -- Row 1: Stage badge + Name + Status badge --

    // Stage badge
    const chapterStageBg = this.add.graphics();
    chapterStageBg.fillStyle(borderColor, isLocked ? 0.2 : 0.8);
    chapterStageBg.fillRoundedRect(10, 10, 52, 28, 6);
    const chapterStageText = this.add.text(36, 24, `${dungeon.chapter}-${dungeon.stage}`, {
      fontFamily: UI.FONTS.UI, fontSize: '14px',
      color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(isLocked ? 0.4 : 1);
    card.add([chapterStageBg, chapterStageText]);

    // Dungeon name
    const nameText = this.add.text(72, 16, dungeon.name, {
      fontFamily: UI.FONTS.UI, fontSize: '16px',
      color: isLocked ? this.ccss(COLORS.TEXT_MUTED) : this.ccss(COLORS.TEXT_PRIMARY),
      fontStyle: 'bold',
    });
    card.add(nameText);

    // Clear/Locked status badge (with colored background)
    if (isCleared) {
      const clearBadgeBg = this.add.graphics();
      clearBadgeBg.fillStyle(COLORS.SUCCESS, 0.25);
      clearBadgeBg.fillRoundedRect(w - 90, 8, 80, 26, 6);
      clearBadgeBg.lineStyle(1, COLORS.SUCCESS, 0.6);
      clearBadgeBg.strokeRoundedRect(w - 90, 8, 80, 26, 6);
      const clearBadge = this.add.text(w - 50, 21, '✅ CLEAR', {
        fontFamily: UI.FONTS.UI, fontSize: '12px',
        color: this.ccss(COLORS.SUCCESS), fontStyle: 'bold',
      }).setOrigin(0.5);
      card.add([clearBadgeBg, clearBadge]);
    }
    if (isLocked) {
      const lockBadgeBg = this.add.graphics();
      lockBadgeBg.fillStyle(COLORS.TEXT_MUTED, 0.15);
      lockBadgeBg.fillRoundedRect(w - 98, 8, 88, 26, 6);
      lockBadgeBg.lineStyle(1, COLORS.TEXT_MUTED, 0.4);
      lockBadgeBg.strokeRoundedRect(w - 98, 8, 88, 26, 6);
      const lockBadge = this.add.text(w - 54, 21, '🔒 LOCKED', {
        fontFamily: UI.FONTS.UI, fontSize: '12px',
        color: this.ccss(COLORS.TEXT_MUTED),
      }).setOrigin(0.5);
      card.add([lockBadgeBg, lockBadge]);
    }

    // -- Divider --
    const divider = this.add.graphics();
    divider.lineStyle(1, COLORS.TEXT_MUTED, 0.3);
    divider.lineBetween(10, 44, w - 10, 44);
    card.add(divider);

    // -- Row 2: Energy cost badge (colored) + Recommended Power --

    // Energy cost badge with prominent background
    const player = this.gameData.getPlayerData();
    const currentEnergy = player?.energy ?? 0;
    const hasEnough = currentEnergy >= dungeon.energyCost;
    const energyBadgeColor = hasEnough ? COLORS.WARNING : COLORS.DANGER;

    const energyBadgeBg = this.add.graphics();
    energyBadgeBg.fillStyle(energyBadgeColor, isLocked ? 0.1 : 0.25);
    energyBadgeBg.fillRoundedRect(10, 50, 66, 24, 5);
    energyBadgeBg.lineStyle(1, energyBadgeColor, isLocked ? 0.2 : 0.7);
    energyBadgeBg.strokeRoundedRect(10, 50, 66, 24, 5);

    const energyText = this.add.text(43, 62, `⚡ ${dungeon.energyCost}`, {
      fontFamily: UI.FONTS.UI, fontSize: '13px',
      color: this.ccss(energyBadgeColor), fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(isLocked ? 0.4 : 1);
    card.add([energyBadgeBg, energyText]);

    // Recommended power
    if (dungeon.recommendedPower && dungeon.recommendedPower > 0) {
      const powerText = this.add.text(88, 54, `❤ ${dungeon.recommendedPower.toLocaleString()} Power`, {
        fontFamily: UI.FONTS.UI, fontSize: '12px',
        color: this.ccss(COLORS.WARNING),
      }).setAlpha(isLocked ? 0.4 : 1);
      card.add(powerText);
    }

    // -- Row 3: Reward preview (Gold, Crystal, Shards, EXP) --
    const rewards = this.extractRewards(dungeon);
    const rewardY = 82;
    let rewardX = 14;

    const rewardItems: { icon: string; value: number; color: number; suffix?: string }[] = [];
    if (rewards.gold > 0)    rewardItems.push({ icon: '🪙', value: rewards.gold, color: COLORS.GOLD });
    if (rewards.crystal > 0) rewardItems.push({ icon: '💎', value: rewards.crystal, color: COLORS.SECONDARY });
    if (rewards.shards > 0)  rewardItems.push({ icon: '🔮', value: rewards.shards, color: COLORS.GRADE_4 });
    if (rewards.exp > 0)     rewardItems.push({ icon: '⭐', value: rewards.exp, color: COLORS.WARNING, suffix: ' EXP' });

    // If there are other material rewards not covered above, show count
    const otherRewards = (dungeon.rewards ?? []).filter(r => {
      const name = (r.name ?? '').toLowerCase();
      return !name.includes('crystal') && !name.includes('shard')
        && !name.includes('gold') && !name.includes('exp');
    });
    if (otherRewards.length > 0) {
      rewardItems.push({ icon: '📦', value: otherRewards.length, color: COLORS.TEXT_SECONDARY, suffix: ' items' });
    }

    if (rewardItems.length > 0) {
      // Reward row background
      const rewardRowBg = this.add.graphics();
      rewardRowBg.fillStyle(COLORS.DARKER, 0.5);
      rewardRowBg.fillRoundedRect(10, rewardY - 4, w - 20, 24, 4);
      card.add(rewardRowBg);

      rewardItems.forEach((item) => {
        const label = `${item.icon} ${item.value.toLocaleString()}${item.suffix ?? ''}`;
        const txt = this.add.text(rewardX, rewardY, label, {
          fontFamily: UI.FONTS.UI, fontSize: '12px',
          color: this.ccss(item.color), fontStyle: 'bold',
        }).setAlpha(isLocked ? 0.4 : 1);
        card.add(txt);
        rewardX += txt.width + 16;
      });
    } else {
      const noReward = this.add.text(14, rewardY, 'No rewards listed', {
        fontFamily: UI.FONTS.UI, fontSize: '12px',
        color: this.ccss(COLORS.TEXT_MUTED),
      }).setAlpha(isLocked ? 0.4 : 1);
      card.add(noReward);
    }

    // -- Enter/Locked button --
    const btnX = w - 90;
    const btnY = h - 44;
    const btnBg = this.add.graphics();
    const canEnter = !isLocked;
    btnBg.fillStyle(
      canEnter ? (isCleared ? COLORS.INFO : COLORS.SUCCESS) : COLORS.DARK,
      canEnter ? 0.9 : 0.4
    );
    btnBg.fillRoundedRect(btnX, btnY, 78, 32, 6);
    btnBg.lineStyle(2, canEnter ? COLORS.LIGHT : COLORS.TEXT_MUTED, canEnter ? 0.7 : 0.3);
    btnBg.strokeRoundedRect(btnX, btnY, 78, 32, 6);
    const btnLabel = this.add.text(btnX + 39, btnY + 16,
      isLocked ? '🔒 Locked' : (isCleared ? '🔄 Retry' : '▶ Enter'), {
        fontFamily: UI.FONTS.UI, fontSize: '13px',
        color: canEnter ? '#ffffff' : this.ccss(COLORS.TEXT_MUTED),
        fontStyle: 'bold',
      }).setOrigin(0.5);
    card.add([btnBg, btnLabel]);

    card.setSize(w, h);
    if (canEnter) {
      card.setInteractive({ useHandCursor: true });
      card.on('pointerover', () => {
        cardBg.clear();
        cardBg.fillStyle(bgColor, 1);
        cardBg.fillRoundedRect(0, 0, w, h, 16);
        cardBg.lineStyle(3, COLORS.GOLD, 1);
        cardBg.strokeRoundedRect(0, 0, w, h, 16);
      });
      card.on('pointerout', () => {
        cardBg.clear();
        cardBg.fillStyle(bgColor, 0.9);
        cardBg.fillRoundedRect(0, 0, w, h, 16);
        cardBg.lineStyle(2, borderColor, 0.8);
        cardBg.strokeRoundedRect(0, 0, w, h, 16);
      });
      card.on('pointerdown', () => this.showConfirmModal(dungeon));
    }

    return card;
  }

  // ═══════════════════════════════════════════════════════════════════
  //  입장 확인 모달
  // ═══════════════════════════════════════════════════════════════════
  private showConfirmModal(dungeon: Dungeon): void {
    this.closeConfirmModal();

    const { width, height } = this.cameras.main;
    this.gameData.updateEnergy();
    const player = this.gameData.getPlayerData();
    const energy = player?.energy ?? 0;
    const maxEnergy = player?.maxEnergy ?? 100;
    const hasEnoughEnergy = energy >= dungeon.energyCost;

    const overlay = this.add.graphics().fillStyle(0x000000, 0.65).fillRect(0, 0, width, height);

    const mW = 480, mH = 340;
    const mX = (width - mW) / 2, mY = (height - mH) / 2;
    const modalBg = this.add.graphics();
    modalBg.fillStyle(COLORS.DARKER, 0.98);
    modalBg.fillRoundedRect(mX, mY, mW, mH, 14);
    modalBg.lineStyle(3, COLORS.PRIMARY, 0.9);
    modalBg.strokeRoundedRect(mX, mY, mW, mH, 14);

    const allChildren: Phaser.GameObjects.GameObject[] = [overlay, modalBg];

    // Title: "Enter Stage X-Y? Costs N energy"
    const title = this.add.text(width / 2, mY + 28,
      `Enter Stage ${dungeon.chapter}-${dungeon.stage}?  Costs ${dungeon.energyCost} energy`, {
        fontFamily: UI.FONTS.TITLE, fontSize: '18px',
        color: this.ccss(COLORS.TEXT_PRIMARY), fontStyle: 'bold',
      }).setOrigin(0.5);
    allChildren.push(title);

    // Dungeon name subtitle
    const subtitle = this.add.text(width / 2, mY + 54, dungeon.name, {
      fontFamily: UI.FONTS.UI, fontSize: '15px',
      color: this.ccss(COLORS.TEXT_SECONDARY),
    }).setOrigin(0.5);
    allChildren.push(subtitle);

    // Energy section with bar
    const energyColor = hasEnoughEnergy ? COLORS.SUCCESS : COLORS.DANGER;
    const energySectionBg = this.add.graphics();
    energySectionBg.fillStyle(energyColor, 0.12);
    energySectionBg.fillRoundedRect(mX + 30, mY + 72, mW - 60, 36, 8);
    energySectionBg.lineStyle(1, energyColor, 0.4);
    energySectionBg.strokeRoundedRect(mX + 30, mY + 72, mW - 60, 36, 8);
    allChildren.push(energySectionBg);

    const energyInfo = this.add.text(width / 2, mY + 90,
      `⚡ Energy: ${energy} / ${maxEnergy}    Cost: ${dungeon.energyCost}    Remaining: ${energy - dungeon.energyCost}`, {
        fontFamily: UI.FONTS.UI, fontSize: '14px',
        color: this.ccss(energyColor), fontStyle: 'bold',
      }).setOrigin(0.5);
    allChildren.push(energyInfo);

    // Reward breakdown section
    const rewards = this.extractRewards(dungeon);
    const rewardSectionY = mY + 120;

    const rewardHeader = this.add.text(mX + 30, rewardSectionY, 'Rewards', {
      fontFamily: UI.FONTS.UI, fontSize: '14px',
      color: this.ccss(COLORS.TEXT_PRIMARY), fontStyle: 'bold',
    });
    allChildren.push(rewardHeader);

    // Divider under header
    const rewardDivider = this.add.graphics();
    rewardDivider.lineStyle(1, COLORS.PRIMARY, 0.4);
    rewardDivider.lineBetween(mX + 30, rewardSectionY + 20, mX + mW - 30, rewardSectionY + 20);
    allChildren.push(rewardDivider);

    // Reward items in a grid
    const rewardEntries: { icon: string; label: string; color: number }[] = [];
    if (rewards.gold > 0)    rewardEntries.push({ icon: '🪙', label: `${rewards.gold.toLocaleString()} Gold`, color: COLORS.GOLD });
    if (rewards.crystal > 0) rewardEntries.push({ icon: '💎', label: `${rewards.crystal.toLocaleString()} Crystal`, color: COLORS.SECONDARY });
    if (rewards.shards > 0)  rewardEntries.push({ icon: '🔮', label: `${rewards.shards.toLocaleString()} Shards`, color: COLORS.GRADE_4 });
    if (rewards.exp > 0)     rewardEntries.push({ icon: '⭐', label: `${rewards.exp.toLocaleString()} EXP`, color: COLORS.WARNING });

    const rewardGridY = rewardSectionY + 30;
    const colWidth = (mW - 60) / 2;

    rewardEntries.forEach((entry, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const rx = mX + 40 + col * colWidth;
      const ry = rewardGridY + row * 24;

      const rewardText = this.add.text(rx, ry, `${entry.icon}  ${entry.label}`, {
        fontFamily: UI.FONTS.UI, fontSize: '14px',
        color: this.ccss(entry.color), fontStyle: 'bold',
      });
      allChildren.push(rewardText);
    });

    // Other material rewards
    const otherRewards = (dungeon.rewards ?? []).filter(r => {
      const name = (r.name ?? '').toLowerCase();
      return !name.includes('crystal') && !name.includes('shard')
        && !name.includes('gold') && !name.includes('exp');
    });
    if (otherRewards.length > 0) {
      const otherY = rewardGridY + Math.ceil(rewardEntries.length / 2) * 24;
      const otherText = this.add.text(mX + 40, otherY, `📦  +${otherRewards.length} additional item(s)`, {
        fontFamily: UI.FONTS.UI, fontSize: '13px',
        color: this.ccss(COLORS.TEXT_SECONDARY),
      });
      allChildren.push(otherText);
    }

    // Difficulty info
    const diffLabels: Record<string, string> = { normal: 'Normal', hard: 'Hard 🔥', hell: 'Hell ☠️' };
    const diffColors: Record<string, number> = { normal: COLORS.SUCCESS, hard: COLORS.WARNING, hell: COLORS.DANGER };
    const diffY = mY + mH - 100;
    const diffInfo = this.add.text(width / 2, diffY,
      `Difficulty: ${diffLabels[this.selectedDifficulty] ?? this.selectedDifficulty}${dungeon.recommendedPower ? '  |  Power: ' + dungeon.recommendedPower.toLocaleString() : ''}`, {
        fontFamily: UI.FONTS.UI, fontSize: '13px',
        color: this.ccss(diffColors[this.selectedDifficulty] ?? COLORS.TEXT_MUTED),
      }).setOrigin(0.5);
    allChildren.push(diffInfo);

    // Not enough energy warning
    if (!hasEnoughEnergy) {
      const warnText = this.add.text(width / 2, diffY + 20,
        '⚠️ Not enough energy! Visit the Shop to refill.', {
          fontFamily: UI.FONTS.UI, fontSize: '13px',
          color: this.ccss(COLORS.DANGER),
        }).setOrigin(0.5);
      allChildren.push(warnText);
    }

    // Enter button
    const btnY = mY + mH - 52;
    const confirmBtn = this.add.container(width / 2 - 80, btnY);
    const confBg = this.add.rectangle(0, 0, 140, 44,
      hasEnoughEnergy ? COLORS.SUCCESS : COLORS.DARK, hasEnoughEnergy ? 0.9 : 0.4
    ).setStrokeStyle(2, COLORS.LIGHT);
    const confLabel = this.add.text(0, 0, '▶ Enter Battle', {
      fontFamily: UI.FONTS.UI, fontSize: '16px',
      color: hasEnoughEnergy ? '#ffffff' : this.ccss(COLORS.TEXT_MUTED),
      fontStyle: 'bold',
    }).setOrigin(0.5);
    confirmBtn.add([confBg, confLabel]);
    confirmBtn.setSize(140, 44).setInteractive({ useHandCursor: true });
    confirmBtn.on('pointerdown', async () => {
      if (!hasEnoughEnergy) {
        this.showToast('⚡ Not enough energy!');
        return;
      }
      this.closeConfirmModal();
      try {
        const result = await dungeonService.enterDungeon(dungeon.id);
        if (result && result.battleId) {
          // Deduct energy locally for immediate feedback
          this.gameData.spendEnergy(dungeon.energyCost);
          this.scene.start(SCENE_KEYS.BATTLE, { battleId: result.battleId, dungeon });
        } else {
          this.showToast('Failed to start battle');
        }
      } catch (error: any) {
        const msg = error?.response?.data?.error || 'Not enough energy or dungeon locked';
        this.showToast(`❌ ${msg}`);
        console.error('Enter dungeon error:', error);
      }
    });
    allChildren.push(confirmBtn);

    // Cancel button
    const cancelBtn = this.add.container(width / 2 + 80, btnY);
    const canBg = this.add.rectangle(0, 0, 120, 44, COLORS.INFO, 0.8).setStrokeStyle(2, COLORS.LIGHT);
    cancelBtn.add([canBg, this.add.text(0, 0, '✕ Cancel', {
      fontFamily: UI.FONTS.UI, fontSize: '16px', color: '#fff', fontStyle: 'bold',
    }).setOrigin(0.5)]);
    cancelBtn.setSize(120, 44).setInteractive({ useHandCursor: true });
    cancelBtn.on('pointerdown', () => this.closeConfirmModal());
    allChildren.push(cancelBtn);

    this.confirmModal = this.add.container(0, 0, allChildren);
    this.confirmModal.setDepth(100);
  }

  private closeConfirmModal(): void {
    if (this.confirmModal) {
      this.confirmModal.destroy();
      this.confirmModal = undefined;
    }
  }

  /** hex number → CSS color string */
  private ccss(hex: number): string {
    return `#${hex.toString(16).padStart(6, '0')}`;
  }

  private showToast(message: string): void {
    const { width, height } = this.cameras.main;
    const bgGfx = this.add.graphics();
    bgGfx.fillStyle(COLORS.DARKER, 0.92);
    bgGfx.fillRoundedRect(-180, -22, 360, 44, 10);
    bgGfx.lineStyle(2, COLORS.PRIMARY, 0.7);
    bgGfx.strokeRoundedRect(-180, -22, 360, 44, 10);

    const txt = this.add.text(0, 0, message, {
      fontFamily: UI.FONTS.UI,
      fontSize: '15px',
      color: this.ccss(COLORS.TEXT_PRIMARY),
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const toast = this.add.container(width / 2, height - 80, [bgGfx, txt]);
    toast.setDepth(200);

    this.tweens.add({
      targets: toast,
      y: height - 110,
      alpha: 0,
      duration: 1800,
      ease: 'Cubic.easeOut',
      onComplete: () => toast.destroy(),
    });
  }

  private createBackButton(): void {
    const button = this.add.container(60, 36);
    const bg = this.add.graphics();
    bg.fillStyle(COLORS.DARK, 0.9);
    bg.fillRoundedRect(-50, -22, 100, 44, 10);
    bg.lineStyle(2, COLORS.PRIMARY, 0.8);
    bg.strokeRoundedRect(-50, -22, 100, 44, 10);
    const text = this.add.text(0, 0, '← Back', {
      fontFamily: UI.FONTS.UI,
      fontSize: '16px',
      color: this.ccss(COLORS.TEXT_PRIMARY),
      fontStyle: 'bold',
    }).setOrigin(0.5);
    button.add([bg, text]);
    button.setSize(100, 44);
    button.setInteractive({ useHandCursor: true });
    button.on('pointerover', () => { bg.clear(); bg.fillStyle(COLORS.PRIMARY, 0.3); bg.fillRoundedRect(-50, -22, 100, 44, 10); bg.lineStyle(2, COLORS.GOLD, 1); bg.strokeRoundedRect(-50, -22, 100, 44, 10); });
    button.on('pointerout',  () => { bg.clear(); bg.fillStyle(COLORS.DARK, 0.9); bg.fillRoundedRect(-50, -22, 100, 44, 10); bg.lineStyle(2, COLORS.PRIMARY, 0.8); bg.strokeRoundedRect(-50, -22, 100, 44, 10); });
    button.on('pointerdown', () => this.scene.start(SCENE_KEYS.LOBBY));
  }
}
