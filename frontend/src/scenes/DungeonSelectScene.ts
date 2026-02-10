import Phaser from 'phaser';
import { SCENE_KEYS, COLORS } from '@/utils/Constants';
import { Dungeon } from '@/types';

export class DungeonSelectScene extends Phaser.Scene {
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

    // Create dungeon categories
    const categories = [
      { name: 'Story', icon: '📖', color: COLORS.PRIMARY },
      { name: 'Element', icon: '🔥', color: COLORS.DANGER },
      { name: 'Experience', icon: '⭐', color: COLORS.WARNING },
      { name: 'Gold', icon: '🪙', color: COLORS.SUCCESS },
      { name: 'Boss Raid', icon: '👹', color: COLORS.SECONDARY },
    ];

    categories.forEach((cat, index) => {
      this.createDungeonCategory(
        width / 2 - 450 + index * 230,
        height / 2,
        cat.name,
        cat.icon,
        cat.color
      );
    });

    this.createBackButton();
  }

  private createDungeonCategory(
    x: number,
    y: number,
    name: string,
    icon: string,
    color: number
  ): void {
    const button = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, 200, 250, color, 0.8);
    bg.setStrokeStyle(3, COLORS.LIGHT);

    const iconText = this.add.text(0, -60, icon, { fontSize: '64px' });
    iconText.setOrigin(0.5);

    const nameText = this.add.text(0, 40, name, {
      fontSize: '22px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    nameText.setOrigin(0.5);

    button.add([bg, iconText, nameText]);
    button.setSize(200, 250);
    button.setInteractive({ useHandCursor: true });

    button.on('pointerdown', () => {
      console.log(`Selected dungeon: ${name}`);
      // Navigate to specific dungeon or start battle
      this.scene.start(SCENE_KEYS.BATTLE);
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
