import Phaser from 'phaser';
import { COLORS } from '@/utils/Constants';

export class BattleTopBar extends Phaser.GameObjects.Container {
  private waveText!: Phaser.GameObjects.Text;
  private turnText!: Phaser.GameObjects.Text;
  private menuButton!: Phaser.GameObjects.Container;
  private onMenu?: () => void;

  constructor(scene: Phaser.Scene, x: number, y: number, width: number, onMenu: () => void) {
    super(scene, x, y);
    this.onMenu = onMenu;

    // Background
    const bg = scene.add.graphics();
    bg.fillStyle(COLORS.DARK, 0.9);
    bg.fillRoundedRect(0, 0, width, 50, { tl: 0, tr: 0, bl: 8, br: 8 });
    bg.lineStyle(1, COLORS.GOLD, 0.5);
    bg.strokeRoundedRect(0, 0, width, 50, { tl: 0, tr: 0, bl: 8, br: 8 });
    this.add(bg);

    // Wave text
    this.waveText = scene.add.text(20, 25, 'Wave 1/1', {
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    this.waveText.setOrigin(0, 0.5);
    this.add(this.waveText);

    // Turn counter
    this.turnText = scene.add.text(width / 2, 25, 'Turn 0', {
      fontSize: '14px',
      color: '#cccccc',
    });
    this.turnText.setOrigin(0.5);
    this.add(this.turnText);

    // Menu button
    this.menuButton = scene.add.container(width - 50, 25);
    const menuBg = scene.add.rectangle(0, 0, 60, 30, COLORS.DANGER, 0.7);
    menuBg.setStrokeStyle(1, COLORS.LIGHT);
    const menuText = scene.add.text(0, 0, 'Menu', {
      fontSize: '12px',
      color: '#ffffff',
    });
    menuText.setOrigin(0.5);
    this.menuButton.add([menuBg, menuText]);
    this.menuButton.setSize(60, 30);
    this.menuButton.setInteractive({ useHandCursor: true });
    this.menuButton.on('pointerdown', () => this.onMenu?.());
    this.add(this.menuButton);

    scene.add.existing(this);
  }

  updateWave(current: number, total: number): void {
    this.waveText.setText(`Wave ${current + 1}/${total}`);
  }

  updateTurn(turnCount: number): void {
    this.turnText.setText(`Turn ${turnCount}`);
  }
}
