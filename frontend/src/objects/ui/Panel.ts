import Phaser from 'phaser';
import { COLORS, UI } from '@/utils/Constants';

export class Panel extends Phaser.GameObjects.Container {
  private background: Phaser.GameObjects.Graphics;
  private title?: Phaser.GameObjects.Text;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    title?: string,
    backgroundColor: number = COLORS.DARKER,
    alpha: number = 0.92
  ) {
    super(scene, x, y);

    // Background
    this.background = scene.add.graphics();
    this.background.fillStyle(backgroundColor, alpha);
    this.background.fillRoundedRect(0, 0, width, height, 16);
    this.background.lineStyle(2, COLORS.GOLD, 0.8);
    this.background.strokeRoundedRect(0, 0, width, height, 16);
    this.background.lineStyle(1, COLORS.LIGHT, 0.25);
    this.background.strokeRoundedRect(4, 4, width - 8, height - 8, 12);

    this.add(this.background);

    // Header band for visual hierarchy
    const header = scene.add.graphics();
    header.fillStyle(COLORS.BG_ACCENT, 0.6);
    header.fillRoundedRect(8, 8, width - 16, 56, 12);
    header.lineStyle(1, COLORS.PRIMARY_LIGHT, 0.5);
    header.strokeRoundedRect(8, 8, width - 16, 56, 12);
    this.add(header);

    // Title if provided
    if (title) {
      this.title = scene.add.text(width / 2, 34, title, {
        fontFamily: UI.FONTS.TITLE,
        fontSize: '28px',
        color: Phaser.Display.Color.IntegerToColor(COLORS.TEXT_PRIMARY).rgba,
        fontStyle: 'bold',
      });
      this.title.setOrigin(0.5);
      this.add(this.title);
    }

    this.setSize(width, height);
    scene.add.existing(this);
  }

  public addContent(gameObject: Phaser.GameObjects.GameObject): void {
    this.add(gameObject);
  }
}
