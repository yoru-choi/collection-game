import Phaser from 'phaser';
import { COLORS, BATTLE_CONFIG } from '@/utils/Constants';
import { BattleUnitState } from '@/types';
import { ATBGauge } from './ATBGauge';
import { getMonsterImageKey } from '@/utils/monsterImages';

export class BattleUnitDisplay extends Phaser.GameObjects.Container {
  private unitData!: BattleUnitState;
  private sprite!: Phaser.GameObjects.Sprite;
  private hpBar!: Phaser.GameObjects.Graphics;
  private atbGauge!: ATBGauge;
  private nameText!: Phaser.GameObjects.Text;
  private hpText!: Phaser.GameObjects.Text;
  private buffContainer!: Phaser.GameObjects.Container;
  private highlight!: Phaser.GameObjects.Rectangle;
  private isSelected: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number, unit: BattleUnitState) {
    super(scene, x, y);
    this.unitData = unit;
    this.createDisplay();
    scene.add.existing(this);
  }

  private createDisplay(): void {
    // Selection highlight (hidden by default)
    this.highlight = this.scene.add.rectangle(0, 0, 90, 90, COLORS.WARNING, 0.3);
    this.highlight.setVisible(false);
    this.add(this.highlight);

    // Sprite
    const spriteKey = getMonsterImageKey({
      id: String(this.unitData.charId),
      character: { id: String(this.unitData.charId), name: this.unitData.name },
    });
    this.sprite = this.scene.add.sprite(0, -10, spriteKey);
    this.sprite.setScale(0.45);
    this.add(this.sprite);

    // Name
    this.nameText = this.scene.add.text(0, 30, this.unitData.name, {
      fontSize: '11px',
      color: '#ffffff',
    });
    this.nameText.setOrigin(0.5);
    this.add(this.nameText);

    // HP bar
    this.hpBar = this.scene.add.graphics();
    this.add(this.hpBar);
    this.drawHPBar();

    // HP text
    this.hpText = this.scene.add.text(0, 50, '', {
      fontSize: '9px',
      color: '#cccccc',
    });
    this.hpText.setOrigin(0.5);
    this.add(this.hpText);
    this.updateHPText();

    // ATB gauge
    this.atbGauge = new ATBGauge(this.scene, -30, 58, 60, 3);
    this.add(this.atbGauge);

    // Buff/debuff icons container
    this.buffContainer = this.scene.add.container(0, -45);
    this.add(this.buffContainer);

    // Make interactive for targeting
    this.setSize(90, 100);
    this.setInteractive({ useHandCursor: true });

    // Dead state
    if (!this.unitData.isAlive) {
      this.setAlpha(0.3);
      this.sprite.setTint(0x666666);
    }
  }

  updateUnit(unit: BattleUnitState): void {
    const prevHP = this.unitData.hp;
    this.unitData = unit;

    this.drawHPBar();
    this.updateHPText();
    this.atbGauge.update(unit.atbGauge);
    this.updateBuffIcons();

    if (!unit.isAlive) {
      this.setAlpha(0.3);
      this.sprite.setTint(0x666666);
    } else {
      this.setAlpha(1);
      this.sprite.clearTint();
    }

    // Flash on damage
    if (unit.hp < prevHP && unit.isAlive) {
      this.scene.tweens.add({
        targets: this.sprite,
        tint: 0xff0000,
        duration: 100,
        yoyo: true,
        onComplete: () => this.sprite.clearTint(),
      });
    }
  }

  private drawHPBar(): void {
    this.hpBar.clear();
    const w = 60;
    const h = 5;
    const x = -30;
    const y = 42;

    // Background
    this.hpBar.fillStyle(0x333333);
    this.hpBar.fillRect(x, y, w, h);

    // Fill
    const ratio = this.unitData.maxHp > 0 ? this.unitData.hp / this.unitData.maxHp : 0;
    const color = ratio > 0.5 ? COLORS.SUCCESS : ratio > 0.25 ? COLORS.WARNING : COLORS.DANGER;
    this.hpBar.fillStyle(color);
    this.hpBar.fillRect(x, y, w * Math.max(0, ratio), h);
  }

  private updateHPText(): void {
    this.hpText.setText(`${this.unitData.hp}/${this.unitData.maxHp}`);
  }

  private updateBuffIcons(): void {
    this.buffContainer.removeAll(true);
    const allEffects = [
      ...(this.unitData.buffs || []).map(b => ({ ...b, isBuff: true })),
      ...(this.unitData.debuffs || []).map(d => ({ ...d, isBuff: false })),
    ];

    allEffects.slice(0, 6).forEach((effect, i) => {
      const iconX = (i - allEffects.length / 2) * 14;
      const color = effect.isBuff ? COLORS.SUCCESS : COLORS.DANGER;
      const icon = this.scene.add.rectangle(iconX, 0, 12, 12, color, 0.8);
      const label = this.scene.add.text(iconX, 0, effect.effectType.charAt(0).toUpperCase(), {
        fontSize: '8px',
        color: '#ffffff',
      });
      label.setOrigin(0.5);
      this.buffContainer.add([icon, label]);
    });
  }

  showDamageNumber(damage: number, isCrit: boolean): void {
    const color = isCrit ? BATTLE_CONFIG.DAMAGE_COLORS.CRITICAL : BATTLE_CONFIG.DAMAGE_COLORS.NORMAL;
    const size = isCrit ? '18px' : '14px';
    const text = this.scene.add.text(0, -30, `-${damage}`, {
      fontSize: size,
      color: color,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2,
    });
    text.setOrigin(0.5);
    this.add(text);

    this.scene.tweens.add({
      targets: text,
      y: -70,
      alpha: 0,
      duration: BATTLE_CONFIG.ANIMATION_DURATION.DAMAGE_NUMBER,
      onComplete: () => text.destroy(),
    });
  }

  showHealNumber(heal: number): void {
    const text = this.scene.add.text(0, -30, `+${heal}`, {
      fontSize: '14px',
      color: BATTLE_CONFIG.DAMAGE_COLORS.HEAL,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2,
    });
    text.setOrigin(0.5);
    this.add(text);

    this.scene.tweens.add({
      targets: text,
      y: -70,
      alpha: 0,
      duration: BATTLE_CONFIG.ANIMATION_DURATION.DAMAGE_NUMBER,
      onComplete: () => text.destroy(),
    });
  }

  setTargetHighlight(enabled: boolean): void {
    this.isSelected = enabled;
    this.highlight.setVisible(enabled);
  }

  getUnitData(): BattleUnitState {
    return this.unitData;
  }
}
