import Phaser from 'phaser';
import { SCENE_KEYS, COLORS } from '@/utils/Constants';
import { BattleState, BattleCharacter } from '@/types';

export class BattleScene extends Phaser.Scene {
  private battleState!: BattleState | null;
  private isAutoPlay: boolean = false;
  private battleSpeed: number = 1;

  constructor() {
    super({ key: SCENE_KEYS.BATTLE });
  }

  create(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.add.rectangle(0, 0, width, height, 0x1a1a2e).setOrigin(0);

    // Battle UI
    this.add.text(width / 2, 30, 'Battle Scene', {
      fontSize: '32px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Player team (left side)
    this.createTeamDisplay(200, height / 2, 'Player', true);

    // Enemy team (right side)
    this.createTeamDisplay(width - 200, height / 2, 'Enemy', false);

    // Battle controls
    this.createBattleControls(width, height);

    // Back button
    this.createBackButton();

    // Mock battle message
    this.add.text(width / 2, height - 100, 'Battle system under construction', {
      fontSize: '20px',
      color: '#f39c12',
    }).setOrigin(0.5);
  }

  private createTeamDisplay(x: number, y: number, label: string, isPlayer: boolean): void {
    this.add.text(x, y - 200, label, {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Display 4 character positions
    for (let i = 0; i < 4; i++) {
      const charY = y - 100 + i * 80;
      this.createCharacterSlot(x, charY, i, isPlayer);
    }
  }

  private createCharacterSlot(x: number, y: number, index: number, isPlayer: boolean): void {
    const slot = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, 150, 60, COLORS.PRIMARY, 0.3);
    bg.setStrokeStyle(2, COLORS.LIGHT);

    const sprite = this.add.sprite(-40, 0, 'character-placeholder');
    sprite.setScale(0.4);

    const hpBar = this.add.graphics();
    hpBar.fillStyle(0xe74c3c);
    hpBar.fillRect(10, -15, 60, 8);

    const name = this.add.text(40, 15, `Char ${index + 1}`, {
      fontSize: '12px',
      color: '#ffffff',
    });

    slot.add([bg, sprite, hpBar, name]);
  }

  private createBattleControls(width: number, height: number): void {
    const controlY = height - 50;

    // Auto button
    this.createControlButton(width / 2 - 200, controlY, 'Auto', () => {
      this.isAutoPlay = !this.isAutoPlay;
      console.log('Auto play:', this.isAutoPlay);
    });

    // Speed button
    this.createControlButton(width / 2 - 80, controlY, `x${this.battleSpeed}`, () => {
      this.battleSpeed = this.battleSpeed === 3 ? 1 : this.battleSpeed + 1;
      console.log('Battle speed:', this.battleSpeed);
    });

    // Pause button
    this.createControlButton(width / 2 + 40, controlY, 'Pause', () => {
      console.log('Battle paused');
    });

    // Retreat button
    this.createControlButton(width / 2 + 160, controlY, 'Retreat', () => {
      this.scene.start(SCENE_KEYS.DUNGEON_SELECT);
    });
  }

  private createControlButton(x: number, y: number, text: string, callback: () => void): void {
    const button = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, 100, 40, COLORS.INFO, 0.8);
    bg.setStrokeStyle(2, COLORS.LIGHT);
    const btnText = this.add.text(0, 0, text, { fontSize: '16px', color: '#ffffff' });
    btnText.setOrigin(0.5);
    button.add([bg, btnText]);
    button.setSize(100, 40);
    button.setInteractive({ useHandCursor: true });
    button.on('pointerdown', callback);
  }

  private createBackButton(): void {
    const button = this.add.container(50, 35);
    const bg = this.add.rectangle(0, 0, 100, 50, COLORS.DANGER);
    bg.setStrokeStyle(2, COLORS.LIGHT);
    const text = this.add.text(0, 0, '⬅ Exit', { fontSize: '18px', color: '#ffffff' });
    text.setOrigin(0.5);
    button.add([bg, text]);
    button.setSize(100, 50);
    button.setInteractive({ useHandCursor: true });
    button.on('pointerdown', () => this.scene.start(SCENE_KEYS.DUNGEON_SELECT));
  }
}
