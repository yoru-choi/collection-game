import Phaser from 'phaser';
import { SCENE_KEYS, COLORS } from '@/utils/Constants';
import { addSceneFrame } from '@/utils/SceneFrame';
import { BattleState, BattleStart, BattleTeamMember, Dungeon, UserCharacter } from '@/types';
import { dungeonService } from '@/services/DungeonService';
import { userService } from '@/services/UserService';
import { GameDataStore } from '@/store/GameDataStore';
import { getMonsterImageKey } from '@/utils/monsterImages';

export class BattleScene extends Phaser.Scene {
  private battleState!: BattleState | null;
  private isAutoPlay: boolean = false;
  private battleSpeed: number = 1;
  private dungeon?: Dungeon;
  private battleStart?: BattleStart;
  private startedAt?: number;
  private gameData!: GameDataStore;
  private resultOverlay?: Phaser.GameObjects.Container;

  constructor() {
    super({ key: SCENE_KEYS.BATTLE });
  }

  init(data: { dungeon?: Dungeon; battle?: BattleStart }): void {
    this.dungeon = data?.dungeon;
    this.battleStart = data?.battle;
  }

  create(): void {
    this.gameData = GameDataStore.getInstance();
    this.startedAt = Date.now();

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.add.rectangle(0, 0, width, height, 0x1a1a2e).setOrigin(0);
    this.add.rectangle(0, 0, width, height, COLORS.DARKER).setOrigin(0);
    // Battle UI
    const topBar = this.add.graphics();
    topBar.fillStyle(COLORS.DARK, 0.9);
    topBar.fillRoundedRect(0, 0, width, 80, { tl: 0, tr: 0, bl: 16, br: 16 });
    topBar.lineStyle(2, COLORS.GOLD, 0.6);
    topBar.strokeRoundedRect(0, 0, width, 80, { tl: 0, tr: 0, bl: 16, br: 16 });
    const titleText = this.dungeon
      ? `Battle: ${this.dungeon.chapter}-${this.dungeon.stage}`
      : 'Battle Scene';

    this.add.text(width / 2, 40, titleText, {
      fontSize: '32px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Player team (left side)
    this.createTeamDisplay(240, height / 2 + 20, 'Player', true, this.getPlayerTeam());

    // Enemy team (right side)
    this.createTeamDisplay(width - 240, height / 2 + 20, 'Enemy', false, this.getEnemyTeam());

    // Battle controls
    this.createBattleControls(width, height);
    this.add.text(width / 2, height - 120, 'Battle system under construction', {
      fontSize: '20px',
      color: '#f39c12',
    }).setOrigin(0.5);

    // Back button
    this.createBackButton();

    // MVP: Complete button to simulate victory
    this.createCompleteButton(width / 2, height - 160);

    addSceneFrame(this);
  }

  private createTeamDisplay(
    x: number,
    y: number,
    label: string,
    isPlayer: boolean,
    team: BattleTeamMember[]
  ): void {
    this.add.text(x, y - 200, label, {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Display 4 character positions
    for (let i = 0; i < 4; i++) {
      const charY = y - 100 + i * 80;
      this.createCharacterSlot(x, charY, i, isPlayer, team[i]);
    }
  }

  private createCharacterSlot(
    x: number,
    y: number,
    index: number,
    isPlayer: boolean,
    member?: BattleTeamMember
  ): void {
    const slot = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, 150, 60, COLORS.PRIMARY, 0.3);
    bg.setStrokeStyle(2, COLORS.LIGHT);

    const spriteKey = member
      ? getMonsterImageKey({
          id: member.characterId,
          character: { id: member.characterId, name: member.name },
        })
      : getMonsterImageKey({ id: `enemy-${index}-${isPlayer ? 'p' : 'e'}` });
    const sprite = this.add.sprite(-40, 0, spriteKey);
    sprite.setScale(0.4);

    const hpBar = this.add.graphics();
    hpBar.fillStyle(0xe74c3c);
    const hpRatio = member && member.maxHp > 0
      ? Math.max(member.currentHp / member.maxHp, 0)
      : 1;
    hpBar.fillRect(10, -15, 60 * hpRatio, 8);

    const nameText = member ? member.name : `Char ${index + 1}`;
    const name = this.add.text(40, 15, nameText, {
      fontSize: '12px',
      color: '#ffffff',
    });

    slot.add([bg, sprite, hpBar, name]);
  }

  private getPlayerTeam(): BattleTeamMember[] {
    if (this.battleStart?.playerTeam?.length) {
      return this.battleStart.playerTeam;
    }

    const characters = this.gameData.getUserCharacters() || [];
    return characters.slice(0, 4).map((character, index) =>
      this.mapUserCharacterToTeamMember(character, index)
    );
  }

  private getEnemyTeam(): BattleTeamMember[] {
    if (this.battleStart?.enemyTeam?.length) {
      return this.battleStart.enemyTeam;
    }

    return Array.from({ length: 4 }, (_, index) => ({
      id: `enemy-${index}`,
      characterId: `enemy-${index}`,
      name: `Enemy ${index + 1}`,
      grade: 1,
      element: 'dark',
      class: 'warrior',
      imageUrl: '',
      level: 1,
      position: index,
      currentHp: 100,
      maxHp: 100,
      atk: 50,
      def: 30,
      spd: 60,
    }));
  }

  private mapUserCharacterToTeamMember(character: UserCharacter, position: number): BattleTeamMember {
    return {
      id: character.id,
      userCharacterId: character.id,
      characterId: character.characterId,
      name: character.character.name,
      grade: character.character.grade,
      element: character.character.element,
      class: character.character.class,
      imageUrl: character.character.imageUrl,
      level: character.level,
      position,
      currentHp: character.currentHp,
      maxHp: character.currentHp,
      atk: character.currentAtk,
      def: character.currentDef,
      spd: character.currentSpd,
    };
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

  private createCompleteButton(x: number, y: number): void {
    const button = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, 180, 45, COLORS.SUCCESS, 0.9);
    bg.setStrokeStyle(2, COLORS.LIGHT);
    const text = this.add.text(0, 0, 'Complete (Win)', {
      fontSize: '16px',
      color: '#ffffff',
    });
    text.setOrigin(0.5);
    button.add([bg, text]);
    button.setSize(180, 45);
    button.setInteractive({ useHandCursor: true });
    button.on('pointerdown', () => this.handleComplete());
  }

  private async handleComplete(): Promise<void> {
    if (!this.dungeon) {
      this.scene.start(SCENE_KEYS.DUNGEON_SELECT);
      return;
    }

    const timeTaken = this.startedAt ? Math.floor((Date.now() - this.startedAt) / 1000) : 0;
    try {
      await dungeonService.completeDungeon(this.dungeon.id, 3, timeTaken);
      const profile = await userService.getProfile();
      if (profile) {
        this.gameData.setPlayerData(profile);
      }
      this.showToast('Dungeon completed! Rewards granted.');
      this.showPostBattleActions();
    } catch (error) {
      this.showToast('Failed to complete dungeon');
      console.error('Complete dungeon error:', error);
    }
  }

  private showPostBattleActions(): void {
    if (this.resultOverlay) {
      this.resultOverlay.destroy();
    }

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const overlay = this.add.container(0, 0);
    const dim = this.add.rectangle(0, 0, width, height, 0x000000, 0.6).setOrigin(0);
    dim.setInteractive();

    const panel = this.add.rectangle(width / 2, height / 2, 500, 260, COLORS.DARK, 0.95);
    panel.setStrokeStyle(2, COLORS.LIGHT);

    const title = this.add.text(width / 2, height / 2 - 90, 'Next Actions', {
      fontSize: '22px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);

    const buttonRowY = height / 2 - 20;
    const buttonSpacing = 170;
    this.createActionButton(width / 2 - buttonSpacing, buttonRowY, 'Shop', () => {
      this.scene.start(SCENE_KEYS.SHOP);
    });
    this.createActionButton(width / 2, buttonRowY, 'Summon', () => {
      this.scene.start(SCENE_KEYS.SUMMON);
    });
    this.createActionButton(width / 2 + buttonSpacing, buttonRowY, 'Party', () => {
      this.scene.start(SCENE_KEYS.CHARACTER_LIST);
    });

    this.createActionButton(width / 2, height / 2 + 70, 'Next Dungeon', () => {
      this.scene.start(SCENE_KEYS.DUNGEON_SELECT);
    });

    overlay.add([dim, panel, title]);
    this.resultOverlay = overlay;
  }

  private createActionButton(x: number, y: number, label: string, onClick: () => void): void {
    const button = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, 140, 45, COLORS.INFO, 0.9);
    bg.setStrokeStyle(2, COLORS.LIGHT);
    const text = this.add.text(0, 0, label, {
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    text.setOrigin(0.5);
    button.add([bg, text]);
    button.setSize(140, 45);
    button.setInteractive({ useHandCursor: true });
    button.on('pointerdown', onClick);
  }

  private showToast(message: string): void {
    const width = this.cameras.main.width;
    const toast = this.add.text(width / 2, 520, message, {
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { left: 10, right: 10, top: 6, bottom: 6 },
    });
    toast.setOrigin(0.5);
    this.tweens.add({
      targets: toast,
      alpha: 0,
      duration: 1200,
      onComplete: () => toast.destroy(),
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
