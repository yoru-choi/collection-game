import Phaser from 'phaser';
import { COLORS } from '@/utils/Constants';

export class ATBGauge extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.Rectangle;
  private fill: Phaser.GameObjects.Rectangle;
  private barWidth: number;
  private barHeight: number;
  private currentValue: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, width: number = 60, height: number = 4) {
    super(scene, x, y);
    this.barWidth = width;
    this.barHeight = height;

    this.bg = scene.add.rectangle(0, 0, width, height, 0x333333);
    this.bg.setOrigin(0, 0.5);

    this.fill = scene.add.rectangle(0, 0, 0, height, COLORS.WARNING);
    this.fill.setOrigin(0, 0.5);

    this.add([this.bg, this.fill]);
    scene.add.existing(this);
  }

  update(value: number): void {
    this.currentValue = Math.min(100, Math.max(0, value));
    const fillWidth = (this.currentValue / 100) * this.barWidth;
    this.fill.width = fillWidth;

    // Color: yellow (0-50), orange (51-99), green+pulse (100)
    if (this.currentValue >= 100) {
      this.fill.fillColor = COLORS.SUCCESS;
      this.fill.setAlpha(0.8 + Math.sin(Date.now() / 200) * 0.2);
    } else if (this.currentValue > 50) {
      this.fill.fillColor = 0xf39c12;
      this.fill.setAlpha(1);
    } else {
      this.fill.fillColor = COLORS.WARNING;
      this.fill.setAlpha(1);
    }
  }

  getValue(): number {
    return this.currentValue;
  }
}
