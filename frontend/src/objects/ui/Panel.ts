import Phaser from 'phaser';
import { COLORS } from '@/utils/Constants';

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
    backgroundColor: number = COLORS.DARK,
    alpha: number = 0.9
  ) {
    super(scene, x, y);

    // Background
    this.background = scene.add.graphics();
    this.background.fillStyle(backgroundColor, alpha);
    this.background.fillRoundedRect(0, 0, width, height, 15);
    this.background.lineStyle(2, COLORS.PRIMARY);
    this.background.strokeRoundedRect(0, 0, width, height, 15);

    this.add(this.background);

    // Title if provided
    if (title) {
      this.title = scene.add.text(width / 2, 30, title, {
        fontSize: '28px',
        color: '#ffffff',
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
