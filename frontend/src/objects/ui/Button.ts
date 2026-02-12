import Phaser from 'phaser';
import { COLORS, UI } from '@/utils/Constants';

export class Button extends Phaser.GameObjects.Container {
  private background: Phaser.GameObjects.Graphics;
  private text: Phaser.GameObjects.Text;
  private shadow: Phaser.GameObjects.Graphics;
  private glowEffect?: Phaser.GameObjects.Graphics;
  private _enabled: boolean = true;
  private _color: number;
  private _width: number;
  private _height: number;

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

    this._color = color;
    this._width = width;
    this._height = height;

    // Shadow (depth effect)
    this.shadow = scene.add.graphics();
    this.drawShadow();

    // Background with gradient
    this.background = scene.add.graphics();
    this.drawBackground();

    // Glow effect
    this.glowEffect = scene.add.graphics();
    this.glowEffect.setAlpha(0);

    // Text with shadow
    this.text = scene.add.text(0, 0, text, {
      fontFamily: UI.FONTS.UI,
      fontSize: '18px',
      color: Phaser.Display.Color.IntegerToColor(COLORS.TEXT_PRIMARY).rgba,
      fontStyle: 'bold',
      shadow: {
        offsetX: 2,
        offsetY: 2,
        color: '#000000',
        blur: 4,
        stroke: true,
        fill: true,
      },
    });
    this.text.setOrigin(0.5);

    this.add([this.shadow, this.background, this.glowEffect, this.text]);
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

  private drawShadow(): void {
    this.shadow.clear();
    this.shadow.fillStyle(0x000000, 0.35);
    this.shadow.fillRoundedRect(
      -this._width / 2 + UI.SHADOW_OFFSET,
      -this._height / 2 + UI.SHADOW_OFFSET,
      this._width,
      this._height,
      UI.BORDER_RADIUS
    );
  }

  private drawBackground(): void {
    this.background.clear();
    
    // Gradient effect
    const topColor = Phaser.Display.Color.ValueToColor(this._color).lighten(18).color;
    const bottomColor = Phaser.Display.Color.ValueToColor(this._color).darken(28).color;

    this.background.fillGradientStyle(
      topColor,
      topColor,
      bottomColor,
      bottomColor,
      1
    );
    this.background.fillRoundedRect(
      -this._width / 2,
      -this._height / 2,
      this._width,
      this._height,
      UI.BORDER_RADIUS
    );
    
    // Highlight on top
    this.background.fillStyle(0xffffff, 0.18);
    this.background.fillRoundedRect(
      -this._width / 2,
      -this._height / 2,
      this._width,
      this._height / 3,
      UI.BORDER_RADIUS
    );
    
    // Border
    this.background.lineStyle(2, COLORS.GOLD, 0.8);
    this.background.strokeRoundedRect(
      -this._width / 2,
      -this._height / 2,
      this._width,
      this._height,
      UI.BORDER_RADIUS
    );
    this.background.lineStyle(1, COLORS.LIGHT, 0.25);
    this.background.strokeRoundedRect(
      -this._width / 2 + 3,
      -this._height / 2 + 3,
      this._width - 6,
      this._height - 6,
      UI.BORDER_RADIUS - 2
    );
  }

  private onHover(): void {
    if (!this._enabled) return;
    
    // Scale animation
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: UI.ANIMATION.FAST,
      ease: 'Back.easeOut',
    });

    // Glow effect
    if (this.glowEffect) {
      this.glowEffect.clear();
      this.glowEffect.lineStyle(6, COLORS.PRIMARY_LIGHT, 0.6);
      this.glowEffect.strokeRoundedRect(
        -this._width / 2,
        -this._height / 2,
        this._width,
        this._height,
        UI.BORDER_RADIUS
      );

      this.scene.tweens.add({
        targets: this.glowEffect,
        alpha: 1,
        duration: UI.ANIMATION.FAST,
      });
    }

    // Slight rotation
    this.scene.tweens.add({
      targets: this,
      angle: 1,
      duration: UI.ANIMATION.FAST,
      yoyo: true,
    });
  }

  private onOut(): void {
    if (!this._enabled) return;
    
    this.scene.tweens.add({
      targets: this,
      scaleX: 1,
      scaleY: 1,
      angle: 0,
      duration: UI.ANIMATION.FAST,
      ease: 'Back.easeIn',
    });

    if (this.glowEffect) {
      this.scene.tweens.add({
        targets: this.glowEffect,
        alpha: 0,
        duration: UI.ANIMATION.FAST,
      });
    }
  }

  private onDown(): void {
    // Press animation
    this.scene.tweens.add({
      targets: this,
      scaleX: 0.95,
      scaleY: 0.95,
      duration: 80,
      yoyo: true,
      ease: 'Cubic.easeOut',
    });

    // Flash effect
    const flash = this.scene.add.graphics();
    flash.fillStyle(0xffffff, 0.5);
    flash.fillRoundedRect(
      this.x - this._width / 2,
      this.y - this._height / 2,
      this._width,
      this._height,
      UI.BORDER_RADIUS
    );
    
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 200,
      onComplete: () => flash.destroy(),
    });
  }

  public setEnabled(enabled: boolean): void {
    this._enabled = enabled;
    this.background.setAlpha(enabled ? 1 : 0.5);
    this.text.setAlpha(enabled ? 1 : 0.5);
    this.setInteractive(enabled);
  }

  public setText(text: string): void {
    this.text.setText(text);
  }

  public setColor(color: number): void {
    this._color = color;
    this.drawBackground();
  }
}
