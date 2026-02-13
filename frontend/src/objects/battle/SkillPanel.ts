import Phaser from 'phaser';
import { COLORS } from '@/utils/Constants';
import { BattleSkillState } from '@/types';

export class SkillPanel extends Phaser.GameObjects.Container {
  private skillButtons: Phaser.GameObjects.Container[] = [];
  private autoButton!: Phaser.GameObjects.Container;
  private autoText!: Phaser.GameObjects.Text;
  private speedButton!: Phaser.GameObjects.Container;
  private speedText!: Phaser.GameObjects.Text;
  private isAutoMode: boolean = false;
  private currentSpeed: number = 1;
  private onSkillSelected?: (slotIndex: number) => void;
  private onAutoToggle?: (auto: boolean) => void;
  private onSpeedToggle?: (speed: number) => void;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    callbacks: {
      onSkillSelected: (slotIndex: number) => void;
      onAutoToggle: (auto: boolean) => void;
      onSpeedToggle: (speed: number) => void;
    }
  ) {
    super(scene, x, y);
    this.onSkillSelected = callbacks.onSkillSelected;
    this.onAutoToggle = callbacks.onAutoToggle;
    this.onSpeedToggle = callbacks.onSpeedToggle;

    this.createAutoButton();
    this.createSpeedButton();
    this.createSkillSlots();
    scene.add.existing(this);
  }

  private createAutoButton(): void {
    this.autoButton = this.scene.add.container(-250, 0);
    const bg = this.scene.add.rectangle(0, 0, 70, 35, COLORS.DARK, 0.8);
    bg.setStrokeStyle(2, COLORS.LIGHT);
    this.autoText = this.scene.add.text(0, 0, 'AUTO', {
      fontSize: '13px',
      color: '#888888',
      fontStyle: 'bold',
    });
    this.autoText.setOrigin(0.5);
    this.autoButton.add([bg, this.autoText]);
    this.autoButton.setSize(70, 35);
    this.autoButton.setInteractive({ useHandCursor: true });
    this.autoButton.on('pointerdown', () => {
      this.isAutoMode = !this.isAutoMode;
      this.updateAutoDisplay();
      this.onAutoToggle?.(this.isAutoMode);
    });
    this.add(this.autoButton);
  }

  private createSpeedButton(): void {
    this.speedButton = this.scene.add.container(-170, 0);
    const bg = this.scene.add.rectangle(0, 0, 50, 35, COLORS.DARK, 0.8);
    bg.setStrokeStyle(2, COLORS.LIGHT);
    this.speedText = this.scene.add.text(0, 0, 'x1', {
      fontSize: '13px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    this.speedText.setOrigin(0.5);
    this.speedButton.add([bg, this.speedText]);
    this.speedButton.setSize(50, 35);
    this.speedButton.setInteractive({ useHandCursor: true });
    this.speedButton.on('pointerdown', () => {
      this.currentSpeed = this.currentSpeed === 1 ? 2 : 1;
      this.speedText.setText(`x${this.currentSpeed}`);
      this.onSpeedToggle?.(this.currentSpeed);
    });
    this.add(this.speedButton);
  }

  private createSkillSlots(): void {
    for (let i = 0; i < 4; i++) {
      const slotX = -50 + i * 85;
      const btn = this.scene.add.container(slotX, 0);
      const bg = this.scene.add.rectangle(0, 0, 75, 35, COLORS.INFO, 0.5);
      bg.setStrokeStyle(1, COLORS.LIGHT);
      const label = this.scene.add.text(0, -5, `Skill ${i + 1}`, {
        fontSize: '11px',
        color: '#ffffff',
      });
      label.setOrigin(0.5);
      const cdText = this.scene.add.text(0, 10, '', {
        fontSize: '9px',
        color: '#ffcc00',
      });
      cdText.setOrigin(0.5);
      btn.add([bg, label, cdText]);
      btn.setSize(75, 35);
      btn.setInteractive({ useHandCursor: true });
      const idx = i;
      btn.on('pointerdown', () => this.onSkillSelected?.(idx));
      btn.setData('bg', bg);
      btn.setData('label', label);
      btn.setData('cdText', cdText);
      this.skillButtons.push(btn);
      this.add(btn);
    }
  }

  updateSkills(skills: BattleSkillState[], isActionSelect: boolean): void {
    skills.forEach((skill, i) => {
      if (i >= this.skillButtons.length) return;
      const btn = this.skillButtons[i];
      const bg = btn.getData('bg') as Phaser.GameObjects.Rectangle;
      const label = btn.getData('label') as Phaser.GameObjects.Text;
      const cdText = btn.getData('cdText') as Phaser.GameObjects.Text;

      label.setText(skill.name.length > 10 ? skill.name.substring(0, 9) + '..' : skill.name);

      if (skill.currentCd > 0) {
        cdText.setText(`CD: ${skill.currentCd}`);
        bg.fillColor = 0x444444;
        bg.fillAlpha = 0.5;
      } else {
        cdText.setText('');
        bg.fillColor = isActionSelect ? COLORS.INFO : 0x555555;
        bg.fillAlpha = isActionSelect ? 0.9 : 0.4;
      }
    });
  }

  setAutoMode(auto: boolean): void {
    this.isAutoMode = auto;
    this.updateAutoDisplay();
  }

  setSpeed(speed: number): void {
    this.currentSpeed = speed;
    this.speedText.setText(`x${speed}`);
  }

  private updateAutoDisplay(): void {
    if (this.isAutoMode) {
      this.autoText.setText('AUTO');
      this.autoText.setColor('#44ff44');
    } else {
      this.autoText.setText('AUTO');
      this.autoText.setColor('#888888');
    }
  }

  setEnabled(enabled: boolean): void {
    this.skillButtons.forEach(btn => {
      if (enabled) {
        btn.setAlpha(1);
      } else {
        btn.setAlpha(0.5);
      }
    });
  }
}
