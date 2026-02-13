import Phaser from 'phaser';
import { SCENE_KEYS, COLORS, BATTLE_CONFIG } from '@/utils/Constants';
import { addSceneFrame } from '@/utils/SceneFrame';
import {
  BattleStateResponse,
  BattleUnitState,
  BattleResultResponse,
  Dungeon,
} from '@/types';
import { battleService } from '@/services/BattleService';
import { dungeonService } from '@/services/DungeonService';
import { userService } from '@/services/UserService';
import { GameDataStore } from '@/store/GameDataStore';
import { BattleUnitDisplay } from '@/objects/battle/BattleUnitDisplay';
import { SkillPanel } from '@/objects/battle/SkillPanel';
import { TurnOrderBar } from '@/objects/battle/TurnOrderBar';
import { AnimationLayer } from '@/objects/battle/AnimationLayer';
import { BattleTopBar } from '@/objects/battle/BattleTopBar';
import { ResultOverlay } from '@/objects/battle/ResultOverlay';

interface BattleSceneData {
  battleId?: number;
  dungeon?: Dungeon;
}

export class BattleScene extends Phaser.Scene {
  private battleId: number = 0;
  private dungeon?: Dungeon;
  private gameData!: GameDataStore;

  // State
  private battleState?: BattleStateResponse;
  private pollTimer?: Phaser.Time.TimerEvent;
  private isPolling: boolean = false;
  private targetSelectMode: boolean = false;
  private selectedSkillIndex: number = -1;
  private selectedSkillTargetType: string = '';

  // UI components
  private allyDisplays: Map<string, BattleUnitDisplay> = new Map();
  private enemyDisplays: Map<string, BattleUnitDisplay> = new Map();
  private skillPanel!: SkillPanel;
  private turnOrderBar!: TurnOrderBar;
  private animationLayer!: AnimationLayer;
  private topBar!: BattleTopBar;
  private resultOverlay?: ResultOverlay;
  private targetHint?: Phaser.GameObjects.Text;

  constructor() {
    super({ key: SCENE_KEYS.BATTLE });
  }

  init(data: BattleSceneData): void {
    this.battleId = data?.battleId || 0;
    this.dungeon = data?.dungeon;
    // Reset state
    this.battleState = undefined;
    this.allyDisplays.clear();
    this.enemyDisplays.clear();
    this.targetSelectMode = false;
    this.selectedSkillIndex = -1;
  }

  create(): void {
    this.gameData = GameDataStore.getInstance();

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Background
    this.add.rectangle(0, 0, width, height, COLORS.DARKER).setOrigin(0);

    // Top bar
    this.topBar = new BattleTopBar(this, 0, 0, width, () => this.showMenuOverlay());

    // Turn order bar
    this.turnOrderBar = new TurnOrderBar(this, width / 2, 70);

    // Skill panel at bottom
    this.skillPanel = new SkillPanel(this, width / 2 + 80, height - 40, {
      onSkillSelected: (idx) => this.onSkillSelected(idx),
      onAutoToggle: (auto) => this.onAutoToggle(auto),
      onSpeedToggle: (speed) => this.onSpeedToggle(speed),
    });

    // Animation layer
    const allDisplays = new Map<string, BattleUnitDisplay>();
    this.animationLayer = new AnimationLayer(this, allDisplays);

    // Target selection hint
    this.targetHint = this.add.text(width / 2, height - 80, '', {
      fontSize: '14px',
      color: '#ffcc00',
    });
    this.targetHint.setOrigin(0.5);
    this.targetHint.setVisible(false);

    // Load initial state
    if (this.battleId > 0) {
      this.loadInitialState();
    } else {
      this.add.text(width / 2, height / 2, 'No battle ID provided', {
        fontSize: '20px',
        color: '#ff4444',
      }).setOrigin(0.5);
      this.createBackButton();
    }

    addSceneFrame(this);
  }

  update(time: number, delta: number): void {
    // Local ATB interpolation
    if (this.battleState && BATTLE_CONFIG.LOCAL_ATB_INTERPOLATION) {
      if (this.battleState.phase === 'in_wave') {
        const allUnits = [...(this.battleState.allies || []), ...(this.battleState.enemies || [])];
        allUnits.forEach(unit => {
          if (unit.isAlive && unit.atbGauge < BATTLE_CONFIG.ATB_MAX) {
            const increment = (unit.spd / 100) * this.battleState!.speedMultiplier * (delta / BATTLE_CONFIG.TICK_INTERVAL);
            unit.atbGauge = Math.min(BATTLE_CONFIG.ATB_MAX, unit.atbGauge + increment);
          }
        });
        // Update displays
        this.updateUnitDisplays();
        this.turnOrderBar.updateOrder(allUnits);
      }
    }
  }

  private async loadInitialState(): Promise<void> {
    const state = await battleService.getState(this.battleId);
    if (state) {
      this.onStateReceived(state);
      this.startPolling();
    } else {
      const width = this.cameras.main.width;
      const height = this.cameras.main.height;
      this.add.text(width / 2, height / 2, 'Failed to load battle', {
        fontSize: '20px',
        color: '#ff4444',
      }).setOrigin(0.5);
      this.createBackButton();
    }
  }

  private onStateReceived(state: BattleStateResponse): void {
    const isFirstState = !this.battleState;
    this.battleState = state;

    if (isFirstState) {
      this.createUnitDisplays();
    }

    // Update all unit displays
    this.updateAllUnits(state);

    // Update top bar
    this.topBar.updateWave(state.currentWave, state.totalWaves);
    this.topBar.updateTurn(state.turnCounter);

    // Update skill panel
    this.skillPanel.setAutoMode(state.autoMode);
    this.skillPanel.setSpeed(state.speedMultiplier);

    // Update turn order
    const allUnits = [...(state.allies || []), ...(state.enemies || [])];
    this.turnOrderBar.updateOrder(allUnits);

    // Play events
    if (state.events && state.events.length > 0) {
      this.animationLayer.queueEvents(state.events);
    }

    // Handle phase
    switch (state.phase) {
      case 'action_select':
        this.handleActionSelect(state);
        break;
      case 'battle_end':
        this.handleBattleEnd(state);
        break;
      default:
        this.targetSelectMode = false;
        this.targetHint?.setVisible(false);
        this.clearTargetHighlights();
        this.skillPanel.setEnabled(false);
        break;
    }
  }

  private createUnitDisplays(): void {
    if (!this.battleState) return;

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Clear existing
    this.allyDisplays.forEach(d => d.destroy());
    this.enemyDisplays.forEach(d => d.destroy());
    this.allyDisplays.clear();
    this.enemyDisplays.clear();

    // Create ally displays (bottom area)
    const allyStartX = width * 0.15;
    const allySpacing = width * 0.18;
    const allyY = height * 0.62;

    (this.battleState.allies || []).forEach((ally, i) => {
      const x = allyStartX + i * allySpacing;
      const display = new BattleUnitDisplay(this, x, allyY, ally);
      this.allyDisplays.set(ally.unitId, display);
    });

    // Create enemy displays (top area)
    const enemyStartX = width * 0.15;
    const enemySpacing = width * 0.18;
    const enemyY = height * 0.28;

    (this.battleState.enemies || []).forEach((enemy, i) => {
      const x = enemyStartX + i * enemySpacing;
      const display = new BattleUnitDisplay(this, x, enemyY, enemy);
      display.on('pointerdown', () => this.onTargetClicked(enemy));
      this.enemyDisplays.set(enemy.unitId, display);
    });

    // Also make allies clickable for heal targeting
    this.allyDisplays.forEach((display, unitId) => {
      display.on('pointerdown', () => {
        const unit = this.battleState?.allies?.find(a => a.unitId === unitId);
        if (unit) this.onTargetClicked(unit);
      });
    });

    // Update animation layer references
    const allDisplays = new Map<string, BattleUnitDisplay>();
    this.allyDisplays.forEach((v, k) => allDisplays.set(k, v));
    this.enemyDisplays.forEach((v, k) => allDisplays.set(k, v));
    this.animationLayer.updateUnitDisplays(allDisplays);
  }

  private updateAllUnits(state: BattleStateResponse): void {
    (state.allies || []).forEach(ally => {
      const display = this.allyDisplays.get(ally.unitId);
      if (display) display.updateUnit(ally);
    });

    // Handle enemy display refresh on wave change
    const currentEnemyIds = new Set((state.enemies || []).map(e => e.unitId));
    const displayedEnemyIds = new Set(this.enemyDisplays.keys());

    // Check if enemies changed (wave transition)
    let enemiesChanged = false;
    if (currentEnemyIds.size !== displayedEnemyIds.size) {
      enemiesChanged = true;
    } else {
      currentEnemyIds.forEach(id => {
        if (!displayedEnemyIds.has(id)) enemiesChanged = true;
      });
    }

    if (enemiesChanged) {
      this.recreateEnemyDisplays(state.enemies || []);
    } else {
      (state.enemies || []).forEach(enemy => {
        const display = this.enemyDisplays.get(enemy.unitId);
        if (display) display.updateUnit(enemy);
      });
    }
  }

  private recreateEnemyDisplays(enemies: BattleUnitState[]): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.enemyDisplays.forEach(d => d.destroy());
    this.enemyDisplays.clear();

    const enemyStartX = width * 0.15;
    const enemySpacing = width * 0.18;
    const enemyY = height * 0.28;

    enemies.forEach((enemy, i) => {
      const x = enemyStartX + i * enemySpacing;
      const display = new BattleUnitDisplay(this, x, enemyY, enemy);
      display.on('pointerdown', () => this.onTargetClicked(enemy));
      this.enemyDisplays.set(enemy.unitId, display);
    });

    // Update animation layer
    const allDisplays = new Map<string, BattleUnitDisplay>();
    this.allyDisplays.forEach((v, k) => allDisplays.set(k, v));
    this.enemyDisplays.forEach((v, k) => allDisplays.set(k, v));
    this.animationLayer.updateUnitDisplays(allDisplays);
  }

  private updateUnitDisplays(): void {
    if (!this.battleState) return;
    (this.battleState.allies || []).forEach(ally => {
      const display = this.allyDisplays.get(ally.unitId);
      if (display) display.updateUnit(ally);
    });
    (this.battleState.enemies || []).forEach(enemy => {
      const display = this.enemyDisplays.get(enemy.unitId);
      if (display) display.updateUnit(enemy);
    });
  }

  // ============================================================
  // Polling
  // ============================================================

  private startPolling(): void {
    this.stopPolling();
    const interval = this.getPollingInterval();
    this.pollTimer = this.time.addEvent({
      delay: interval,
      callback: () => this.pollState(),
      loop: true,
    });
  }

  private stopPolling(): void {
    if (this.pollTimer) {
      this.pollTimer.destroy();
      this.pollTimer = undefined;
    }
  }

  private getPollingInterval(): number {
    if (!this.battleState) return BATTLE_CONFIG.POLL_INTERVAL_AUTO;
    if (this.battleState.phase === 'action_select') return 0; // Don't poll during action select
    if (this.battleState.autoMode) return BATTLE_CONFIG.POLL_INTERVAL_AUTO;
    return BATTLE_CONFIG.POLL_INTERVAL_MANUAL;
  }

  private async pollState(): Promise<void> {
    if (this.isPolling || !this.battleId) return;
    if (this.battleState?.phase === 'action_select') return;
    if (this.battleState?.phase === 'battle_end') {
      this.stopPolling();
      return;
    }

    this.isPolling = true;
    try {
      const state = await battleService.getState(this.battleId);
      if (state) {
        this.onStateReceived(state);

        // Adjust polling interval based on phase
        if (state.phase === 'action_select' || state.phase === 'battle_end') {
          this.stopPolling();
        }
      }
    } catch (error) {
      console.error('Poll error:', error);
    } finally {
      this.isPolling = false;
    }
  }

  // ============================================================
  // Player Input Handling
  // ============================================================

  private handleActionSelect(state: BattleStateResponse): void {
    this.stopPolling();
    this.skillPanel.setEnabled(true);

    // Find the active unit's skills
    const activeUnit = (state.allies || []).find(a => a.unitId === state.activeUnitId);
    if (activeUnit) {
      this.skillPanel.updateSkills(activeUnit.skills, true);

      // Highlight the active unit
      const display = this.allyDisplays.get(activeUnit.unitId);
      if (display) {
        display.setTargetHighlight(true);
      }
    }
  }

  private onSkillSelected(slotIndex: number): void {
    if (!this.battleState || this.battleState.phase !== 'action_select') return;

    const activeUnit = (this.battleState.allies || []).find(
      a => a.unitId === this.battleState!.activeUnitId
    );
    if (!activeUnit) return;

    const skill = activeUnit.skills[slotIndex];
    if (!skill || skill.currentCd > 0) return;

    this.selectedSkillIndex = slotIndex;
    this.selectedSkillTargetType = skill.targetType;

    // Auto-target skills (self, all_enemies, all_allies)
    if (skill.targetType === 'self' || skill.targetType === 'all_enemies' || skill.targetType === 'all_allies') {
      this.submitAction(activeUnit.unitId, slotIndex, []);
      return;
    }

    // Enter target selection mode
    this.targetSelectMode = true;
    this.targetHint?.setText(`Select target for: ${skill.name}`);
    this.targetHint?.setVisible(true);

    // Highlight valid targets
    if (skill.targetType === 'single_enemy') {
      this.enemyDisplays.forEach(d => {
        if (d.getUnitData().isAlive) d.setTargetHighlight(true);
      });
    } else if (skill.targetType === 'single_ally') {
      this.allyDisplays.forEach(d => {
        if (d.getUnitData().isAlive) d.setTargetHighlight(true);
      });
    }
  }

  private onTargetClicked(unit: BattleUnitState): void {
    if (!this.targetSelectMode || !this.battleState) return;

    const activeUnitId = this.battleState.activeUnitId;
    if (!activeUnitId) return;

    // Validate target
    if (this.selectedSkillTargetType === 'single_enemy' && unit.team !== 'enemy') return;
    if (this.selectedSkillTargetType === 'single_ally' && unit.team !== 'ally') return;
    if (!unit.isAlive) return;

    this.submitAction(activeUnitId, this.selectedSkillIndex, [unit.unitId]);
  }

  private async submitAction(unitId: string, skillIndex: number, targetIds: string[]): Promise<void> {
    this.targetSelectMode = false;
    this.targetHint?.setVisible(false);
    this.clearTargetHighlights();
    this.skillPanel.setEnabled(false);

    const state = await battleService.submitAction(this.battleId, {
      unitId,
      skillIndex,
      targetIds,
    });

    if (state) {
      this.onStateReceived(state);

      // Resume polling if battle continues
      if (state.phase !== 'action_select' && state.phase !== 'battle_end') {
        this.startPolling();
      }
    }
  }

  private clearTargetHighlights(): void {
    this.allyDisplays.forEach(d => d.setTargetHighlight(false));
    this.enemyDisplays.forEach(d => d.setTargetHighlight(false));
  }

  private async onAutoToggle(auto: boolean): Promise<void> {
    if (!this.battleId) return;
    const state = await battleService.setAutoMode(this.battleId, auto);
    if (state) {
      this.onStateReceived(state);
      if (state.phase !== 'action_select' && state.phase !== 'battle_end') {
        this.startPolling();
      }
    }
  }

  private async onSpeedToggle(speed: number): Promise<void> {
    if (!this.battleId) return;
    await battleService.setSpeed(this.battleId, speed);
  }

  // ============================================================
  // Battle End
  // ============================================================

  private async handleBattleEnd(state: BattleStateResponse): Promise<void> {
    this.stopPolling();
    this.skillPanel.setEnabled(false);
    this.animationLayer.clearQueue();

    // Get result from server
    const result = await battleService.getResult(this.battleId);
    if (!result) {
      // Determine from state
      const alliesAlive = (state.allies || []).some(a => a.isAlive);
      const fakeResult: BattleResultResponse = {
        battleId: this.battleId,
        result: alliesAlive ? 'victory' : 'defeat',
        wavesCleared: state.currentWave,
        gold: 0,
        exp: 0,
        crystals: 0,
      };
      this.showResult(fakeResult);
      return;
    }

    // If victory and dungeon, also complete the dungeon for rewards
    if (result.result === 'victory' && this.dungeon) {
      try {
        await dungeonService.completeDungeon(this.dungeon.id, 3, 0);
        const profile = await userService.getProfile();
        if (profile) {
          this.gameData.setPlayerData(profile);
        }
      } catch (e) {
        console.error('Failed to complete dungeon:', e);
      }
    }

    this.showResult(result);
  }

  private showResult(result: BattleResultResponse): void {
    if (this.resultOverlay) return;
    this.resultOverlay = new ResultOverlay(this, result, this.dungeon?.id);
  }

  // ============================================================
  // Menu Overlay
  // ============================================================

  private showMenuOverlay(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const overlay = this.add.container(0, 0);
    overlay.setDepth(100);

    const dim = this.add.rectangle(0, 0, width, height, 0x000000, 0.5);
    dim.setOrigin(0);
    dim.setInteractive();
    overlay.add(dim);

    const panel = this.add.rectangle(width / 2, height / 2, 300, 200, COLORS.DARK, 0.95);
    panel.setStrokeStyle(2, COLORS.LIGHT);
    overlay.add(panel);

    const title = this.add.text(width / 2, height / 2 - 70, 'Menu', {
      fontSize: '22px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);
    overlay.add(title);

    // Resume button
    const resumeBtn = this.createMenuButton(width / 2, height / 2 - 20, 'Resume', () => {
      overlay.destroy();
    });
    overlay.add(resumeBtn);

    // Surrender button
    const surrenderBtn = this.createMenuButton(width / 2, height / 2 + 30, 'Surrender', async () => {
      overlay.destroy();
      await battleService.surrender(this.battleId);
      this.scene.start(SCENE_KEYS.DUNGEON_SELECT);
    });
    overlay.add(surrenderBtn);

    // Exit button
    const exitBtn = this.createMenuButton(width / 2, height / 2 + 80, 'Exit to Lobby', () => {
      overlay.destroy();
      this.stopPolling();
      this.scene.start(SCENE_KEYS.LOBBY);
    });
    overlay.add(exitBtn);
  }

  private createMenuButton(x: number, y: number, label: string, onClick: () => void): Phaser.GameObjects.Container {
    const btn = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, 200, 35, COLORS.INFO, 0.8);
    bg.setStrokeStyle(1, COLORS.LIGHT);
    const text = this.add.text(0, 0, label, { fontSize: '14px', color: '#ffffff' });
    text.setOrigin(0.5);
    btn.add([bg, text]);
    btn.setSize(200, 35);
    btn.setInteractive({ useHandCursor: true });
    btn.on('pointerdown', onClick);
    return btn;
  }

  private createBackButton(): void {
    const button = this.add.container(50, 35);
    const bg = this.add.rectangle(0, 0, 100, 50, COLORS.DANGER);
    bg.setStrokeStyle(2, COLORS.LIGHT);
    const text = this.add.text(0, 0, 'Exit', { fontSize: '18px', color: '#ffffff' });
    text.setOrigin(0.5);
    button.add([bg, text]);
    button.setSize(100, 50);
    button.setInteractive({ useHandCursor: true });
    button.on('pointerdown', () => this.scene.start(SCENE_KEYS.DUNGEON_SELECT));
  }

  shutdown(): void {
    this.stopPolling();
    this.animationLayer?.clearQueue();
  }
}
