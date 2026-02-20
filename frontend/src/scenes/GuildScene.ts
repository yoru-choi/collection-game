import Phaser from 'phaser';
import { SCENE_KEYS, COLORS, UI } from '@/utils/Constants';
import { addSceneFrame } from '@/utils/SceneFrame';

export class GuildScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE_KEYS.GUILD });
  }

  create(): void {
    const { width, height } = this.cameras.main;
    this.add.rectangle(0, 0, width, height, COLORS.BG_CARD).setOrigin(0);

    // Title
    this.add.text(width / 2, 60, 'Guild', {
      fontFamily: UI.FONTS.TITLE, fontSize: '36px',
      color: this.colorToCss(COLORS.PRIMARY),
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Coming Soon card
    const cardY = height / 2 - 20;
    const cardBg = this.add.graphics();
    cardBg.fillStyle(COLORS.BG_PANEL, 0.9);
    cardBg.fillRoundedRect(width / 2 - 250, cardY - 140, 500, 280, 20);
    cardBg.lineStyle(1, COLORS.PRIMARY, 0.3);
    cardBg.strokeRoundedRect(width / 2 - 250, cardY - 140, 500, 280, 20);

    this.add.text(width / 2, cardY - 60, 'Coming Soon', {
      fontFamily: UI.FONTS.TITLE, fontSize: '40px',
      color: this.colorToCss(COLORS.PRIMARY_LIGHT),
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(width / 2, cardY + 50, 'Join or create a guild with friends!\nGuild wars, donations, and chat.', {
      fontFamily: UI.FONTS.UI, fontSize: '18px',
      color: this.colorToCss(COLORS.TEXT_SECONDARY),
      align: 'center', lineSpacing: 6,
    }).setOrigin(0.5);

    this.add.text(width / 2, cardY + 100, 'Stay tuned for future updates', {
      fontFamily: UI.FONTS.UI, fontSize: '14px',
      color: this.colorToCss(COLORS.TEXT_MUTED),
    }).setOrigin(0.5);

    this.createBackButton();
    addSceneFrame(this);
  }

  private createBackButton(): void {
    const btn = this.add.container(70, 35);
    const bg = this.add.graphics();
    bg.fillStyle(COLORS.BG_PANEL, 0.9);
    bg.fillRoundedRect(-55, -21, 110, 42, 16);
    bg.lineStyle(1, COLORS.PRIMARY, 0.3);
    bg.strokeRoundedRect(-55, -21, 110, 42, 16);
    const text = this.add.text(0, 0, '← Back', {
      fontFamily: UI.FONTS.UI, fontSize: '18px',
      color: this.colorToCss(COLORS.TEXT_PRIMARY), fontStyle: 'bold',
    }).setOrigin(0.5);
    btn.add([bg, text]);
    btn.setSize(110, 42).setInteractive({ useHandCursor: true });
    btn.on('pointerdown', () => this.scene.start(SCENE_KEYS.LOBBY));
  }

  private colorToCss(color: number): string {
    return `#${color.toString(16).padStart(6, '0')}`;
  }
}
