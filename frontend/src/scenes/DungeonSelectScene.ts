import Phaser from 'phaser';
import { SCENE_KEYS, COLORS } from '@/utils/Constants';
import { addSceneFrame } from '@/utils/SceneFrame';
import { Dungeon } from '@/types';
import { dungeonService } from '@/services/DungeonService';

export class DungeonSelectScene extends Phaser.Scene {
  private dungeons: Dungeon[] = [];
  private statusText?: Phaser.GameObjects.Text;

  constructor() {
    super({ key: SCENE_KEYS.DUNGEON_SELECT });
  }

  create(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.add.rectangle(0, 0, width, height, COLORS.DARK).setOrigin(0);

    const title = this.add.text(width / 2, 60, 'Dungeons', {
      fontSize: '42px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);

    this.statusText = this.add.text(width / 2, height / 2, 'Loading dungeons...', {
      fontSize: '20px',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.loadStoryDungeons();

    this.createBackButton();
    addSceneFrame(this);
  }

  private async loadStoryDungeons(): Promise<void> {
    try {
      const dungeons = await dungeonService.getDungeons(1);
      this.dungeons = dungeons.filter((d) => d.type === 'story');
      this.renderDungeonList();
    } catch (error) {
      if (this.statusText) {
        this.statusText.setText('Failed to load dungeons');
      }
      console.error('Failed to load dungeons:', error);
    }
  }

  private renderDungeonList(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    if (this.statusText) {
      this.statusText.destroy();
      this.statusText = undefined;
    }

    const header = this.add.text(width / 2, 120, 'Story Dungeons (Chapter 1)', {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    header.setOrigin(0.5);

    if (this.dungeons.length === 0) {
      this.add.text(width / 2, height / 2, 'No dungeons available', {
        fontSize: '20px',
        color: '#ffffff',
      }).setOrigin(0.5);
      return;
    }

    const startY = 180;
    const rowHeight = 70;

    this.dungeons.forEach((dungeon, index) => {
      const y = startY + index * rowHeight;
      this.createDungeonRow(width / 2, y, dungeon);
    });
  }

  private createDungeonRow(x: number, y: number, dungeon: Dungeon): void {
    const row = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, 700, 55, COLORS.PRIMARY, 0.25);
    bg.setStrokeStyle(2, COLORS.LIGHT);

    const name = this.add.text(-300, 0, `${dungeon.chapter}-${dungeon.stage} ${dungeon.name}`, {
      fontSize: '18px',
      color: '#ffffff',
    });
    name.setOrigin(0, 0.5);

    const energy = this.add.text(170, 0, `⚡ ${dungeon.energyCost}`, {
      fontSize: '16px',
      color: '#50c878',
    });
    energy.setOrigin(0.5);

    const playText = this.add.text(280, 0, 'Enter ▶', {
      fontSize: '16px',
      color: '#4a90e2',
    });
    playText.setOrigin(0.5);

    row.add([bg, name, energy, playText]);
    row.setSize(700, 55);
    row.setInteractive({ useHandCursor: true });
    row.on('pointerdown', async () => {
      try {
        const battle = await dungeonService.enterDungeon(dungeon.id);
        this.scene.start(SCENE_KEYS.BATTLE, { dungeon, battle: battle || undefined });
      } catch (error) {
        this.showToast('Not enough energy or dungeon error');
        console.error('Enter dungeon error:', error);
      }
    });
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
    const text = this.add.text(0, 0, '← Back', { fontSize: '18px', color: '#ffffff' });
    text.setOrigin(0.5);
    button.add([bg, text]);
    button.setSize(100, 50);
    button.setInteractive({ useHandCursor: true });
    button.on('pointerdown', () => this.scene.start(SCENE_KEYS.LOBBY));
  }
}
