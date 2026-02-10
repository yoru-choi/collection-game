import Phaser from 'phaser';
import { COLORS } from '@/utils/Constants';

export class Button extends Phaser.GameObjects.Container {
  private background: Phaser.GameObjects.Rectangle;
  private text: Phaser.GameObjects.Text;
  private _enabled: boolean = true;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    text: string,
    onClick: () => void,
    color: number = COLORS.PRIMARY
  ) {
    super(scene, x, y);

    // Background
    this.background = scene.add.rectangle(0, 0, width, height, color);
    this.background.setStrokeStyle(2, COLORS.LIGHT);

    // Text
    this.text = scene.add.text(0, 0, text, {
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    this.text.setOrigin(0.5);

    this.add([this.background, this.text]);
    this.setSize(width, height);
    this.setInteractive({ useHandCursor: true });

    // Events
    this.on('pointerover', () => this.onHover());
    this.on('pointerout', () => this.onOut());
    this.on('pointerdown', () => {
      if (this._enabled) {
        this.onDown();
        onClick();
      }
    });

    scene.add.existing(this);
  }

  private onHover(): void {
    if (!this._enabled) return;
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 150,
      ease: 'Power2',
    });
  }

  private onOut(): void {
    if (!this._enabled) return;
    this.scene.tweens.add({
      targets: this,
      scaleX: 1,
      scaleY: 1,
      duration: 150,
      ease: 'Power2',
    });
  }

  private onDown(): void {
    this.scene.tweens.add({
      targets: this,
      scaleX: 0.95,
      scaleY: 0.95,
      duration: 100,
      yoyo: true,
    });
  }

  public setEnabled(enabled: boolean): void {
    this._enabled = enabled;
    this.background.setAlpha(enabled ? 1 : 0.5);
    this.setInteractive(enabled);
  }

  public setText(text: string): void {
    this.text.setText(text);
  }
}
