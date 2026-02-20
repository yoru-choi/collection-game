import Phaser from 'phaser';
import { COLORS } from '@/utils/Constants';

export class HealthBar extends Phaser.GameObjects.Container {
  private background: Phaser.GameObjects.Graphics;
  private bar: Phaser.GameObjects.Graphics;
  private barWidth: number;
  private barHeight: number;
  private currentValue: number = 1;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    color: number = 0xe74c3c
  ) {
    super(scene, x, y);

    this.barWidth = width;
    this.barHeight = height;

    // Background
    this.background = scene.add.graphics();
    this.background.fillStyle(COLORS.DARK, 0.9);
    this.background.fillRoundedRect(0, 0, width, height, height / 2);
    this.background.lineStyle(1, COLORS.GOLD, 0.6);
    this.background.strokeRoundedRect(0, 0, width, height, height / 2);

    // Health bar
    this.bar = scene.add.graphics();
    this.bar.fillStyle(color);
    this.bar.fillRoundedRect(0, 0, width, height, height / 2);


    this.add([this.background, this.bar]);
    scene.add.existing(this);
  }

  public setValue(value: number, animate: boolean = true): void {
    value = Phaser.Math.Clamp(value, 0, 1);
    
    if (animate) {
      this.scene.tweens.add({
        targets: this,
        currentValue: value,
        duration: 300,
        ease: 'Power2',
        onUpdate: () => {
          this.updateBar();
        },
      });
    } else {
      this.currentValue = value;
      this.updateBar();
    }
  }

  private updateBar(): void {
    this.bar.clear();
    
    // Color changes based on health percentage
    let color = COLORS.SUCCESS; // Green
    if (this.currentValue < 0.3) {
      color = COLORS.DANGER; // Red
    } else if (this.currentValue < 0.6) {
      color = COLORS.WARNING; // Orange
    }
    
    this.bar.fillStyle(color);
    this.bar.fillRoundedRect(0, 0, this.barWidth * this.currentValue, this.barHeight, this.barHeight / 2);
  }
}
