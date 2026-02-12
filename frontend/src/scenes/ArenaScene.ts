import Phaser from 'phaser';
import { SCENE_KEYS, COLORS } from '@/utils/Constants';
import { addSceneFrame } from '@/utils/SceneFrame';

export class ArenaScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE_KEYS.ARENA });
  }

  create(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    this.add.rectangle(0, 0, width, height, COLORS.DARK).setOrigin(0);
    
    this.add.text(width / 2, height / 2, 'Arena Scene\n(Under Construction)', {
      fontSize: '32px',
      color: '#ffffff',
      align: 'center',
    }).setOrigin(0.5);
    
    this.createBackButton();
    addSceneFrame(this);
  }

  private createBackButton(): void {
    const button = this.add.container(50, 35);
    const bg = this.add.rectangle(0, 0, 100, 50, COLORS.INFO);
    const text = this.add.text(0, 0, '← Back', { fontSize: '18px', color: '#ffffff' });
    text.setOrigin(0.5);
    button.add([bg, text]);
    button.setSize(100, 50);
    button.setInteractive({ useHandCursor: true });
    button.on('pointerdown', () => this.scene.start(SCENE_KEYS.LOBBY));
  }
}
