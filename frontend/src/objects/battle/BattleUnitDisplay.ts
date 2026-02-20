import Phaser from 'phaser';
import { COLORS, BATTLE_CONFIG } from '@/utils/Constants';
import { BattleUnitState } from '@/types';
import { ATBGauge } from './ATBGauge';
import { getMonsterImageKey } from '@/utils/monsterImages';

// Effect type → { label, color, bgColor }
const EFFECT_DISPLAY: Record<string, { label: string; color: number; bg: number }> = {
  // Buffs (green tones)
  atk_up:   { label: 'ATK↑', color: 0x00ff88, bg: 0x005522 },
  def_up:   { label: 'DEF↑', color: 0x44aaff, bg: 0x002255 },
  spd_up:   { label: 'SPD↑', color: 0xffee00, bg: 0x443300 },
  immunity: { label: 'IMU',  color: 0xffffff, bg: 0x334455 },
  shield:   { label: 'SLD',  color: 0x88ccff, bg: 0x223344 },
  invincible:{ label: 'INV', color: 0xffd700, bg: 0x554400 },
  // Debuffs (red/dark tones)
  atk_down: { label: 'ATK↓', color: 0xff6666, bg: 0x440000 },
  def_down: { label: 'DEF↓', color: 0xff88aa, bg: 0x440022 },
  spd_down: { label: 'SPD↓', color: 0xffaa44, bg: 0x442200 },
  // Status effects
  stun:     { label: '★STN', color: 0xffff00, bg: 0x333300 },
  poison:   { label: '☠POI', color: 0xcc44ff, bg: 0x330044 },
  burn:     { label: '🔥BRN', color: 0xff6600, bg: 0x442200 },
  freeze:   { label: '❄FRZ', color: 0x88eeff, bg: 0x003344 },
  sleep:    { label: 'ZZZ',  color: 0xaaaaff, bg: 0x333355 },
  silence:  { label: '🔇SIL', color: 0xaaaaaa, bg: 0x333333 },
};

export class BattleUnitDisplay extends Phaser.GameObjects.Container {
  private unitData!: BattleUnitState;
  private sprite!: Phaser.GameObjects.Sprite;
  private hpBar!: Phaser.GameObjects.Graphics;
  private atbGauge!: ATBGauge;
  private nameText!: Phaser.GameObjects.Text;
  private hpText!: Phaser.GameObjects.Text;
  private buffContainer!: Phaser.GameObjects.Container;
  private highlight!: Phaser.GameObjects.Rectangle;
  private stunOverlay?: Phaser.GameObjects.Text;
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

    // Buff/debuff icons container (above sprite)
    this.buffContainer = this.scene.add.container(0, -50);
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
      this.stunOverlay?.setVisible(false);
    } else {
      this.setAlpha(1);
      this.sprite.clearTint();
      // Show stun overlay
      const isStunned = unit.debuffs?.some(d => d.effectType === 'stun' || d.effectType === 'freeze');
      if (isStunned) {
        if (!this.stunOverlay) {
          this.stunOverlay = this.scene.add.text(0, -10, '★', {
            fontSize: '28px',
            color: '#ffff00',
            stroke: '#000000',
            strokeThickness: 2,
          });
          this.stunOverlay.setOrigin(0.5);
          this.add(this.stunOverlay);
        }
        this.stunOverlay.setVisible(true);
      } else {
        this.stunOverlay?.setVisible(false);
      }
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

    if (allEffects.length === 0) return;

    const iconW = 20;
    const iconH = 14;
    const spacing = 2;
    const totalW = allEffects.length * (iconW + spacing) - spacing;
    const startX = -totalW / 2;

    allEffects.slice(0, 8).forEach((effect, i) => {
      const x = startX + i * (iconW + spacing) + iconW / 2;

      const display = EFFECT_DISPLAY[effect.effectType] || {
        label: effect.effectType.slice(0, 3).toUpperCase(),
        color: effect.isBuff ? 0x00ff88 : 0xff4444,
        bg: effect.isBuff ? 0x005522 : 0x440000,
      };

      // Background pill
      const bg = this.scene.add.graphics();
      bg.fillStyle(display.bg, 0.95);
      bg.fillRoundedRect(x - iconW / 2, -iconH / 2, iconW, iconH, 3);
      bg.lineStyle(1, display.color, 0.7);
      bg.strokeRoundedRect(x - iconW / 2, -iconH / 2, iconW, iconH, 3);
      this.buffContainer.add(bg);

      // Label
      const label = this.scene.add.text(x, 0, display.label.slice(-3), {
        fontSize: '7px',
        color: Phaser.Display.Color.IntegerToColor(display.color).rgba,
        fontStyle: 'bold',
      });
      label.setOrigin(0.5);
      this.buffContainer.add(label);

      // Duration badge (top-right corner)
      if (effect.duration > 0) {
        const durationText = this.scene.add.text(x + iconW / 2 - 2, -iconH / 2, String(effect.duration), {
          fontSize: '6px',
          color: '#ffffff',
          backgroundColor: '#000000',
        });
        durationText.setOrigin(1, 0);
        this.buffContainer.add(durationText);
      }
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

  showStatusEffect(effectType: string): void {
    const display = EFFECT_DISPLAY[effectType];
    if (!display) return;

    const text = this.scene.add.text(0, -50, display.label, {
      fontSize: '12px',
      color: Phaser.Display.Color.IntegerToColor(display.color).rgba,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2,
    });
    text.setOrigin(0.5);
    this.add(text);

    this.scene.tweens.add({
      targets: text,
      y: -80,
      alpha: 0,
      duration: 1000,
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
