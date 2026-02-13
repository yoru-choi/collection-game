import Phaser from 'phaser';
import { COLORS } from '@/utils/Constants';
import { BattleUnitState } from '@/types';

export class TurnOrderBar extends Phaser.GameObjects.Container {
  private portraits: Phaser.GameObjects.Container[] = [];

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    // Background
    const bg = scene.add.rectangle(0, 0, 400, 30, COLORS.DARK, 0.7);
    bg.setStrokeStyle(1, COLORS.LIGHT);
    this.add(bg);

    scene.add.existing(this);
  }

  updateOrder(allUnits: BattleUnitState[]): void {
    // Clear existing
    this.portraits.forEach(p => p.destroy());
    this.portraits = [];

    // Sort by ATB descending
    const sorted = [...allUnits]
      .filter(u => u.isAlive)
      .sort((a, b) => b.atbGauge - a.atbGauge)
      .slice(0, 10);

    sorted.forEach((unit, i) => {
      const xPos = -180 + i * 38;
      const container = this.scene.add.container(xPos, 0);

      const color = unit.team === 'ally' ? COLORS.INFO : COLORS.DANGER;
      const box = this.scene.add.rectangle(0, 0, 32, 24, color, 0.7);
      box.setStrokeStyle(1, 0xffffff);

      const initial = this.scene.add.text(0, 0, unit.name.charAt(0), {
        fontSize: '12px',
        color: '#ffffff',
        fontStyle: 'bold',
      });
      initial.setOrigin(0.5);

      container.add([box, initial]);
      this.add(container);
      this.portraits.push(container);
    });
  }
}
