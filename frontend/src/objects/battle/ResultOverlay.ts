import Phaser from 'phaser';
import { COLORS, SCENE_KEYS } from '@/utils/Constants';
import { BattleResultResponse } from '@/types';

export class ResultOverlay extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, result: BattleResultResponse, dungeonId?: string) {
    super(scene, 0, 0);

    const width = scene.cameras.main.width;
    const height = scene.cameras.main.height;

    // Dim background
    const dim = scene.add.rectangle(0, 0, width, height, 0x000000, 0.7);
    dim.setOrigin(0);
    dim.setInteractive();
    this.add(dim);

    // Result panel
    const panelW = 500;
    const panelH = 350;
    const px = width / 2;
    const py = height / 2;

    const panel = scene.add.rectangle(px, py, panelW, panelH, COLORS.DARK, 0.95);
    panel.setStrokeStyle(2, result.result === 'victory' ? COLORS.GOLD : COLORS.DANGER);
    this.add(panel);

    // Title
    const isVictory = result.result === 'victory';
    const titleColor = isVictory ? '#ffd700' : '#ff4444';
    const title = scene.add.text(px, py - 130, isVictory ? 'VICTORY!' : 'DEFEAT', {
      fontSize: '36px',
      color: titleColor,
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);
    this.add(title);

    // Waves cleared
    const waveText = scene.add.text(px, py - 80, `Waves Cleared: ${result.wavesCleared}`, {
      fontSize: '16px',
      color: '#cccccc',
    });
    waveText.setOrigin(0.5);
    this.add(waveText);

    // Rewards
    if (isVictory) {
      const rewardY = py - 40;
      const rewards = [
        { label: 'Gold', value: result.gold, color: '#ffd700' },
        { label: 'EXP', value: result.exp, color: '#44ff44' },
        { label: 'Crystals', value: result.crystals, color: '#44aaff' },
      ];

      rewards.forEach((r, i) => {
        if (r.value > 0) {
          const text = scene.add.text(px, rewardY + i * 30, `${r.label}: +${r.value}`, {
            fontSize: '18px',
            color: r.color,
            fontStyle: 'bold',
          });
          text.setOrigin(0.5);
          this.add(text);
        }
      });
    }

    // Buttons
    const buttonY = py + 100;
    const buttonSpacing = 160;

    // Continue / Next Dungeon
    this.createButton(px - buttonSpacing / 2, buttonY, isVictory ? 'Next Dungeon' : 'Retry', () => {
      scene.scene.start(SCENE_KEYS.DUNGEON_SELECT);
    });

    // Lobby
    this.createButton(px + buttonSpacing / 2, buttonY, 'Lobby', () => {
      scene.scene.start(SCENE_KEYS.LOBBY);
    });

    scene.add.existing(this);

    // Entrance animation
    this.setAlpha(0);
    scene.tweens.add({
      targets: this,
      alpha: 1,
      duration: 500,
      ease: 'Power2',
    });
  }

  private createButton(x: number, y: number, label: string, onClick: () => void): void {
    const btn = this.scene.add.container(x, y);
    const bg = this.scene.add.rectangle(0, 0, 140, 45, COLORS.INFO, 0.9);
    bg.setStrokeStyle(2, COLORS.LIGHT);
    const text = this.scene.add.text(0, 0, label, {
      fontSize: '15px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    text.setOrigin(0.5);
    btn.add([bg, text]);
    btn.setSize(140, 45);
    btn.setInteractive({ useHandCursor: true });
    btn.on('pointerdown', onClick);
    this.add(btn);
  }
}
