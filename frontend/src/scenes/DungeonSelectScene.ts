import Phaser from 'phaser';
import { SCENE_KEYS, COLORS } from '@/utils/Constants';
import { addSceneFrame } from '@/utils/SceneFrame';
import { Dungeon } from '@/types';
import { dungeonService, DungeonProgress } from '@/services/DungeonService';

type Difficulty = 'normal' | 'hard' | 'hell';

export class DungeonSelectScene extends Phaser.Scene {
  private dungeons: Dungeon[] = [];
  private progress: DungeonProgress | null = null;
  private selectedChapter: number = 1;
  private selectedDifficulty: Difficulty = 'normal';
  private statusText?: Phaser.GameObjects.Text;
  private listContainer?: Phaser.GameObjects.Container;
  private chapterTabs: Phaser.GameObjects.Container[] = [];
  private difficultyTabs: Phaser.GameObjects.Container[] = [];

  constructor() {
    super({ key: SCENE_KEYS.DUNGEON_SELECT });
  }

  create(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.add.rectangle(0, 0, width, height, COLORS.DARK).setOrigin(0);

    const title = this.add.text(width / 2, 40, 'Dungeons', {
      fontSize: '36px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);

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

    if (this.statusText) {
      this.statusText.destroy();
      this.statusText = undefined;
    }

    if (this.listContainer) {
      this.listContainer.destroy();
      this.listContainer = undefined;
    }

    this.listContainer = this.add.container(0, 0);

    if (dungeons.length === 0) {
      const noData = this.add.text(width / 2, height / 2, 'No dungeons available for this selection', {
        fontSize: '18px',
        color: '#aaaaaa',
      }).setOrigin(0.5);
      this.listContainer.add(noData);
      return;
    }

    const startY = 170;
    const rowHeight = 65;
    const clearedSet = new Set(this.progress?.cleared || []);

    dungeons.forEach((dungeon, index) => {
      const y = startY + index * rowHeight;
      const dungeonIdNum = Number(dungeon.id);
      const isCleared = clearedSet.has(dungeonIdNum);

      // Simple unlock check: first stage always unlocked, others need previous cleared
      let isLocked = false;
      if (dungeon.stage && dungeon.stage > 1) {
        const prevDungeon = dungeons.find(d => d.stage === (dungeon.stage! - 1));
        if (prevDungeon && !clearedSet.has(Number(prevDungeon.id))) {
          isLocked = true;
        }
      }
      // Hard locked if no normal stages cleared at all for this difficulty
      if (this.selectedDifficulty === 'hard' || this.selectedDifficulty === 'hell') {
        // Use server-side unlock logic; if we got the dungeon in the list, it may be accessible
        // We rely on the server to reject entry to locked dungeons
        isLocked = false;
      }

      const row = this.createDungeonRow(width / 2, y, dungeon, isCleared, isLocked);
      this.listContainer!.add(row);
    });
  }

  private createDungeonRow(
    x: number,
    y: number,
    dungeon: Dungeon,
    isCleared: boolean,
    isLocked: boolean,
  ): Phaser.GameObjects.Container {
    const row = this.add.container(x, y);
    const bgColor = isLocked ? 0x333333 : (isCleared ? 0x1a3a1a : COLORS.PRIMARY);
    const bg = this.add.rectangle(0, 0, 700, 55, bgColor, isLocked ? 0.3 : 0.25);
    bg.setStrokeStyle(2, isCleared ? COLORS.SUCCESS : COLORS.LIGHT);

    const statusIcon = isCleared ? ' [CLEAR]' : (isLocked ? ' [LOCKED]' : '');
    const name = this.add.text(-300, 0, `${dungeon.chapter}-${dungeon.stage} ${dungeon.name}${statusIcon}`, {
      fontSize: '16px',
      color: isLocked ? '#666666' : '#ffffff',
    });
    name.setOrigin(0, 0.5);

    const energy = this.add.text(120, 0, `Energy: ${dungeon.energyCost}`, {
      fontSize: '14px',
      color: '#50c878',
    });
    energy.setOrigin(0.5);

    // Rewards preview
    const goldReward = dungeon.goldReward || 0;
    const rewardText = this.add.text(230, 0, `Gold: ${goldReward}`, {
      fontSize: '12px',
      color: '#cccccc',
    });
    rewardText.setOrigin(0.5);

    const playText = this.add.text(320, 0, isLocked ? 'Locked' : 'Enter', {
      fontSize: '16px',
      color: isLocked ? '#666666' : '#4a90e2',
    });
    playText.setOrigin(0.5);

    row.add([bg, name, energy, rewardText, playText]);
    row.setSize(700, 55);

    if (!isLocked) {
      row.setInteractive({ useHandCursor: true });
      row.on('pointerdown', async () => {
        try {
          const result = await dungeonService.enterDungeon(dungeon.id);
          if (result && result.battleId) {
            this.scene.start(SCENE_KEYS.BATTLE, { battleId: result.battleId, dungeon });
          } else {
            this.showToast('Failed to start battle');
          }
        } catch (error) {
          this.showToast('Not enough energy or dungeon locked');
          console.error('Enter dungeon error:', error);
        }
      });
    }

    return row;
  }

  private showToast(message: string): void {
    const width = this.cameras.main.width;
    const toast = this.add.text(width / 2, 520, message, {
      fontSize: '16px',
      color: '#ffffff',
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

  private createBackButton(): void {
    const button = this.add.container(50, 35);
    const bg = this.add.rectangle(0, 0, 100, 50, COLORS.INFO);
    bg.setStrokeStyle(2, COLORS.LIGHT);
    const text = this.add.text(0, 0, '< Back', { fontSize: '18px', color: '#ffffff' });
    text.setOrigin(0.5);
    button.add([bg, text]);
    button.setSize(100, 50);
    button.setInteractive({ useHandCursor: true });
    button.on('pointerdown', () => this.scene.start(SCENE_KEYS.LOBBY));
  }
}
