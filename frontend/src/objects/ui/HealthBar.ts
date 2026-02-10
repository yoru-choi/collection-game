import Phaser from 'phaser';

export class HealthBar extends Phaser.GameObjects.Container {
  private background: Phaser.GameObjects.Graphics;
  private bar: Phaser.GameObjects.Graphics;
  private width: number;
  private height: number;
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

    this.width = width;
    this.height = height;

    // Background
    this.background = scene.add.graphics();
    this.background.fillStyle(0x34495e);
    this.background.fillRoundedRect(0, 0, width, height, height / 2);

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
    let color = 0x2ecc71; // Green
    if (this.currentValue < 0.3) {
      color = 0xe74c3c; // Red
    } else if (this.currentValue < 0.6) {
      color = 0xf39c12; // Orange
    }
    
    this.bar.fillStyle(color);
    this.bar.fillRoundedRect(0, 0, this.width * this.currentValue, this.height, this.height / 2);
  }
}
