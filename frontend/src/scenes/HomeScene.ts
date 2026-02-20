import Phaser from 'phaser';
import { SCENE_KEYS, COLORS, UI } from '@/utils/Constants';
import { GameDataStore } from '@/store/GameDataStore';
import { PlayerCharacter } from '@/objects/home/PlayerCharacter';
import { MonsterSprite } from '@/objects/home/MonsterSprite';
import { VirtualJoystick } from '@/objects/home/VirtualJoystick';
import { userService } from '@/services/UserService';
import { httpClient } from '@/services/api/HttpClient';
import { ApiResponse } from '@/types';

// ── Map constants ──────────────────────────────────────────────────────────────
const MAP_W = 3200;
const MAP_H = 2400;
const SPAWN_X = MAP_W / 2;
const SPAWN_Y = MAP_H / 2;
const INTERACT_RADIUS = 120;
const MAX_MONSTERS = 6;

interface ZoneDef {
  key: string;
  texture: string;
  x: number;
  y: number;
  label: string;
  sceneKey: string;
  patchColor: number;
}

const ZONE_DEFS: ZoneDef[] = [
  { key: 'dungeon', texture: 'zone-dungeon', x: SPAWN_X + 800, y: SPAWN_Y,       label: '던전 입구',  sceneKey: SCENE_KEYS.DUNGEON_SELECT, patchColor: 0x6d0000 },
  { key: 'summon',  texture: 'zone-summon',  x: SPAWN_X,       y: SPAWN_Y - 500, label: '소환 제단',  sceneKey: SCENE_KEYS.SUMMON,         patchColor: 0x311b92 },
  { key: 'shop',    texture: 'zone-shop',    x: SPAWN_X,       y: SPAWN_Y + 500, label: '상점',       sceneKey: SCENE_KEYS.SHOP,           patchColor: 0xe65100 },
  { key: 'guild',   texture: 'zone-guild',   x: SPAWN_X - 800, y: SPAWN_Y,       label: '길드 홀',   sceneKey: SCENE_KEYS.GUILD,          patchColor: 0x0d47a1 },
];

interface ZoneObject {
  def: ZoneDef;
  sprite: Phaser.GameObjects.Image;
  prompt: Phaser.GameObjects.Container;
  labelText: Phaser.GameObjects.Text;
  btn: Phaser.GameObjects.Container | null;
}

export class HomeScene extends Phaser.Scene {
  private gameData!: GameDataStore;
  private player!: PlayerCharacter;
  private monsters: MonsterSprite[] = [];
  private joystick!: VirtualJoystick;
  private zones: ZoneObject[] = [];

  // HUD elements (setScrollFactor 0)
  private hudCrystals!: Phaser.GameObjects.Text;
  private hudGold!: Phaser.GameObjects.Text;
  private hudEnergy!: Phaser.GameObjects.Text;
  private hudUsername!: Phaser.GameObjects.Text;

  private interactPrompt!: Phaser.GameObjects.Container;
  private interactPromptText!: Phaser.GameObjects.Text;
  private nearbyZone: ZoneDef | null = null;

  private obstacles!: Phaser.Physics.Arcade.StaticGroup;

  constructor() {
    super({ key: SCENE_KEYS.HOME });
  }

  create(): void {
    this.gameData = GameDataStore.getInstance();

    this.physics.world.setBounds(0, 0, MAP_W, MAP_H);

    this.drawMapBackground();
    this.createObstacles();
    this.createZoneMarkers();
    this.createPlayer();
    this.spawnMonsters();
    this.createHUD();
    this.createInteractPrompt();
    this.setupCamera();

    this.refreshGameData();
    this.claimDailyLoginIfNeeded();
  }

  // ── Map ──────────────────────────────────────────────────────────────────────

  private drawMapBackground(): void {
    // Base grass tile
    this.add.tileSprite(0, 0, MAP_W, MAP_H, 'tile-grass').setOrigin(0, 0).setDepth(-5);

    const g = this.add.graphics();

    // Zone patch areas (soft circles)
    ZONE_DEFS.forEach(z => {
      g.fillStyle(z.patchColor, 0.18);
      g.fillCircle(z.x, z.y, 200);
    });

    // Dirt paths connecting zones to center
    g.fillStyle(0x8d6e63, 0.35);
    ZONE_DEFS.forEach(z => {
      // Draw a thick line from spawn to zone as a series of circles
      const steps = 30;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const px = SPAWN_X + (z.x - SPAWN_X) * t;
        const py = SPAWN_Y + (z.y - SPAWN_Y) * t;
        g.fillCircle(px, py, 22);
      }
    });

    // Central spawn area
    g.fillStyle(0xa5d6a7, 0.3);
    g.fillCircle(SPAWN_X, SPAWN_Y, 120);
    g.lineStyle(3, 0x81c784, 0.5);
    g.strokeCircle(SPAWN_X, SPAWN_Y, 120);

    // Decorative trees (static circles for now)
    const treeSeed = 12345;
    const rng = new Phaser.Math.RandomDataGenerator([String(treeSeed)]);
    const treeColor = 0x1b5e20;
    for (let i = 0; i < 60; i++) {
      const tx = rng.between(50, MAP_W - 50);
      const ty = rng.between(50, MAP_H - 50);
      const distToCenter = Phaser.Math.Distance.Between(tx, ty, SPAWN_X, SPAWN_Y);
      if (distToCenter < 300) continue; // keep center clear
      const skip = ZONE_DEFS.some(z => Phaser.Math.Distance.Between(tx, ty, z.x, z.y) < 220);
      if (skip) continue;
      const r = rng.between(18, 35);
      g.fillStyle(treeColor, 0.7);
      g.fillCircle(tx, ty, r);
      g.fillStyle(0x2e7d32, 0.6);
      g.fillCircle(tx - 4, ty - 4, r * 0.6);
    }

    g.setDepth(-4);
  }

  // ── Obstacles ────────────────────────────────────────────────────────────────

  private createObstacles(): void {
    this.obstacles = this.physics.add.staticGroup();

    // Border walls (invisible, handled by world bounds),
    // plus a few internal rocks
    const rockPositions = [
      { x: 900,  y: 900  },
      { x: 2300, y: 900  },
      { x: 900,  y: 1500 },
      { x: 2300, y: 1500 },
      { x: 1600, y: 400  },
      { x: 1600, y: 2000 },
    ];

    const g = this.add.graphics();
    rockPositions.forEach(({ x, y }) => {
      // Draw rock decoration
      g.fillStyle(0x546e7a, 0.9);
      g.fillEllipse(x, y, 70, 50);
      g.fillStyle(0x607d8b, 0.6);
      g.fillEllipse(x - 10, y - 10, 40, 30);

      // Physics body
      const rock = this.obstacles.create(x, y, 'tile-wall') as Phaser.Physics.Arcade.Image;
      rock.setAlpha(0);
      rock.refreshBody();
      rock.setDisplaySize(60, 44);
    });
    g.setDepth(-3);
  }

  // ── Zone Markers ─────────────────────────────────────────────────────────────

  private createZoneMarkers(): void {
    ZONE_DEFS.forEach(def => {
      // Zone sprite
      const sprite = this.add.image(def.x, def.y, def.texture);
      sprite.setDepth(5);
      sprite.setScale(1.2);

      // Pulsing animation
      this.tweens.add({
        targets: sprite,
        scaleX: 1.4,
        scaleY: 1.4,
        duration: 1200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      // Zone label below
      const labelText = this.add.text(def.x, def.y + 60, def.label, {
        fontSize: '16px',
        fontFamily: UI.FONTS?.UI ?? 'Arial',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 4,
      });
      labelText.setOrigin(0.5);
      labelText.setDepth(6);

      // Interaction prompt (shown when player is near)
      const promptBg = this.add.rectangle(0, 0, 160, 34, 0x000000, 0.7).setStrokeStyle(2, 0xffffff, 0.9);
      const promptTxt = this.add.text(0, 0, `[E] ${def.label} 입장`, {
        fontSize: '13px',
        fontFamily: 'Arial',
        color: '#ffee44',
      }).setOrigin(0.5);
      const prompt = this.add.container(def.x, def.y - 100, [promptBg, promptTxt]);
      prompt.setDepth(20);
      prompt.setVisible(false);

      // Tap button on zone sprite for mobile
      sprite.setInteractive({ useHandCursor: true });
      sprite.on('pointerdown', () => {
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, def.x, def.y);
        if (dist <= INTERACT_RADIUS + 60) {
          this.enterZone(def.sceneKey);
        }
      });

      this.zones.push({ def, sprite, prompt, labelText, btn: null });
    });
  }

  // ── Player ───────────────────────────────────────────────────────────────────

  private createPlayer(): void {
    const username = this.gameData.getPlayerData()?.username ?? 'Summoner';
    this.player = new PlayerCharacter(this, SPAWN_X, SPAWN_Y, username);

    // Collision with obstacles
    this.physics.add.collider(this.player, this.obstacles);
  }

  // ── Monsters ─────────────────────────────────────────────────────────────────

  private spawnMonsters(): void {
    const characters = this.gameData.getUserCharacters();
    const party: number[] = (this.gameData as unknown as { getParty?: () => number[] | null }).getParty?.() ?? [];
    
    // Sort: party members first
    const sorted = [...characters].sort((a, b) => {
      const aInParty = party.includes(Number(a.id)) ? -1 : 1;
      const bInParty = party.includes(Number(b.id)) ? -1 : 1;
      return aInParty - bInParty;
    });

    const toSpawn = sorted.slice(0, MAX_MONSTERS);
    const wanderBounds = new Phaser.Geom.Rectangle(200, 200, MAP_W - 400, MAP_H - 400);

    toSpawn.forEach((uc, i) => {
      const angle = (i / MAX_MONSTERS) * Math.PI * 2;
      const radius = Phaser.Math.Between(100, 300);
      const mx = SPAWN_X + Math.cos(angle) * radius;
      const my = SPAWN_Y + Math.sin(angle) * radius;

      const grade = uc.character?.grade ?? 1;
      const name = uc.character?.name ?? `Monster ${i + 1}`;

      const m = new MonsterSprite(
        this,
        Phaser.Math.Clamp(mx, 100, MAP_W - 100),
        Phaser.Math.Clamp(my, 100, MAP_H - 100),
        grade,
        name,
        wanderBounds,
        () => this.openCharacterDetail(uc.id),
      );

      this.monsters.push(m);
      this.physics.add.collider(m, this.obstacles);
    });

    // If no characters yet, spawn placeholder monsters
    if (toSpawn.length === 0) {
      this.spawnPlaceholderMonsters(wanderBounds);
    }
  }

  private spawnPlaceholderMonsters(bounds: Phaser.Geom.Rectangle): void {
    const placeholders = [
      { grade: 2, name: 'Goblin' },
      { grade: 3, name: 'Orc' },
      { grade: 1, name: 'Slime' },
    ];
    placeholders.forEach((p, i) => {
      const angle = (i / placeholders.length) * Math.PI * 2;
      const m = new MonsterSprite(
        this,
        SPAWN_X + Math.cos(angle) * 150,
        SPAWN_Y + Math.sin(angle) * 150,
        p.grade,
        p.name,
        bounds,
        () => {},
      );
      this.monsters.push(m);
    });
  }

  // ── HUD ──────────────────────────────────────────────────────────────────────

  private createHUD(): void {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;
    const player = this.gameData.getPlayerData();

    // ── Top bar background ──────────────────────────────────────
    const topBar = this.add.rectangle(W / 2, 0, W, 70, 0x000000, 0.55).setOrigin(0.5, 0);
    topBar.setScrollFactor(0).setDepth(90);

    // Username + Level
    this.hudUsername = this.add.text(16, 14, `Lv.${player?.level ?? 1}  ${player?.username ?? ''}`, {
      fontSize: '15px', fontFamily: 'Arial', color: '#ffdd44', fontStyle: 'bold',
    });
    this.hudUsername.setScrollFactor(0).setDepth(91);

    // Crystals
    this.hudCrystals = this.add.text(W / 2 - 120, 10, `💎 ${player?.crystals ?? 0}`, {
      fontSize: '14px', fontFamily: 'Arial', color: '#90caf9',
    });
    this.hudCrystals.setScrollFactor(0).setDepth(91);

    // Gold
    this.hudGold = this.add.text(W / 2 - 10, 10, `🪙 ${player?.gold ?? 0}`, {
      fontSize: '14px', fontFamily: 'Arial', color: '#ffe082',
    });
    this.hudGold.setScrollFactor(0).setDepth(91);

    // Energy
    this.hudEnergy = this.add.text(W / 2 + 100, 10, `⚡ ${player?.energy ?? 0}/${player?.maxEnergy ?? 30}`, {
      fontSize: '14px', fontFamily: 'Arial', color: '#a5d6a7',
    });
    this.hudEnergy.setScrollFactor(0).setDepth(91);

    // ── Quick menu (right side) ─────────────────────────────────
    const menuItems = [
      { label: '던전',    icon: '⚔️',  scene: SCENE_KEYS.DUNGEON_SELECT },
      { label: '소환',    icon: '✨',  scene: SCENE_KEYS.SUMMON },
      { label: '상점',    icon: '🛒',  scene: SCENE_KEYS.SHOP },
      { label: '퀘스트',  icon: '📋',  scene: SCENE_KEYS.LOBBY },
      { label: '캐릭터',  icon: '👤',  scene: SCENE_KEYS.CHARACTER_LIST },
    ];

    const btnW = 70;
    const btnH = 58;
    const gap = 6;
    const totalH = menuItems.length * (btnH + gap);
    const startY = (H - totalH) / 2;

    menuItems.forEach((item, i) => {
      const bx = W - btnW / 2 - 6;
      const by = startY + i * (btnH + gap) + btnH / 2;

      const bg = this.add.rectangle(bx, by, btnW, btnH, 0x000000, 0.6).setStrokeStyle(1, 0xffffff, 0.4);
      bg.setScrollFactor(0).setDepth(90);

      const iconText = this.add.text(bx, by - 9, item.icon, { fontSize: '20px' }).setOrigin(0.5);
      iconText.setScrollFactor(0).setDepth(91);

      const labelT = this.add.text(bx, by + 12, item.label, {
        fontSize: '11px', fontFamily: 'Arial', color: '#ffffff',
      }).setOrigin(0.5);
      labelT.setScrollFactor(0).setDepth(91);

      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerover', () => bg.setFillStyle(0x1a237e, 0.9));
      bg.on('pointerout',  () => bg.setFillStyle(0x000000, 0.6));
      bg.on('pointerdown', () => this.scene.start(item.scene));
    });

    // ── Joystick (bottom-left, mobile) ─────────────────────────
    this.joystick = new VirtualJoystick(this, 80, H - 80);

    // ── Settings / Lobby button (bottom right) ──────────────────
    const settingsBg = this.add.rectangle(W - 50, H - 30, 80, 40, 0x000000, 0.6).setStrokeStyle(1, 0xffffff, 0.4);
    settingsBg.setScrollFactor(0).setDepth(90);
    const settingsTxt = this.add.text(W - 50, H - 30, '☰ 메뉴', {
      fontSize: '13px', fontFamily: 'Arial', color: '#ffffff',
    }).setOrigin(0.5);
    settingsTxt.setScrollFactor(0).setDepth(91);
    settingsBg.setInteractive({ useHandCursor: true });
    settingsBg.on('pointerdown', () => this.scene.start(SCENE_KEYS.LOBBY));
  }

  // ── Interact prompt ──────────────────────────────────────────────────────────

  private createInteractPrompt(): void {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    const bg = this.add.rectangle(0, 0, 220, 40, 0x000000, 0.8).setStrokeStyle(2, 0xffee44, 1);
    this.interactPromptText = this.add.text(0, 0, '', {
      fontSize: '14px', fontFamily: 'Arial', color: '#ffee44',
    }).setOrigin(0.5);

    this.interactPrompt = this.add.container(W / 2, H - 60, [bg, this.interactPromptText]);
    this.interactPrompt.setScrollFactor(0).setDepth(95);
    this.interactPrompt.setVisible(false);
  }

  // ── Camera ───────────────────────────────────────────────────────────────────

  private setupCamera(): void {
    const cam = this.cameras.main;
    cam.setBounds(0, 0, MAP_W, MAP_H);
    cam.startFollow(this.player, true, 0.08, 0.08);
    cam.setZoom(1);
  }

  // ── Update loop ──────────────────────────────────────────────────────────────

  update(_time: number, delta: number): void {
    // Joystick → player external velocity
    if (this.joystick.isActive()) {
      const { x, y } = this.joystick.getDelta();
      this.player.setExternalVelocity(x, y);
    } else {
      this.player.clearExternalVelocity();
    }

    this.player.update();
    this.monsters.forEach(m => m.update(delta, this.player.x, this.player.y));

    this.updateZoneProximity();
    this.updateHUD();
  }

  private updateZoneProximity(): void {
    let nearestZone: ZoneDef | null = null;
    let minDist = INTERACT_RADIUS;

    // Check proximity and show/hide zone prompts
    this.zones.forEach(zo => {
      const dist = Phaser.Math.Distance.Between(
        this.player.x, this.player.y,
        zo.def.x, zo.def.y,
      );
      const inRange = dist <= INTERACT_RADIUS;
      zo.prompt.setVisible(inRange);

      if (inRange && dist < minDist) {
        minDist = dist;
        nearestZone = zo.def;
      }
    });

    this.nearbyZone = nearestZone;

    if (nearestZone) {
      this.interactPromptText.setText(`[E] ${nearestZone.label} 입장`);
      this.interactPrompt.setVisible(true);

      // E key to enter
      if (this.player.isInteractPressed()) {
        this.enterZone(nearestZone.sceneKey);
      }
    } else {
      this.interactPrompt.setVisible(false);
    }
  }

  private updateHUD(): void {
    const player = this.gameData.getPlayerData();
    if (!player) return;
    this.hudCrystals.setText(`💎 ${player.crystals}`);
    this.hudGold.setText(`🪙 ${player.gold}`);
    this.hudEnergy.setText(`⚡ ${player.energy}/${player.maxEnergy}`);
    this.hudUsername.setText(`Lv.${player.level}  ${player.username}`);
  }

  // ── Scene Transitions ────────────────────────────────────────────────────────

  private enterZone(sceneKey: string): void {
    this.cameras.main.fadeOut(300, 0, 0, 0, () => {
      this.scene.start(sceneKey);
    });
  }

  private openCharacterDetail(characterId: string): void {
    this.scene.start(SCENE_KEYS.CHARACTER_DETAIL, { characterId });
  }

  // ── Data ─────────────────────────────────────────────────────────────────────

  private async refreshGameData(): Promise<void> {
    try {
      const profile = await userService.getProfile();
      if (profile) {
        this.gameData.setPlayerData(profile);
        this.updateHUD();
        this.hudUsername.setText(`Lv.${profile.level}  ${profile.username}`);
      }
    } catch (e) {
      console.warn('HomeScene: profile refresh failed', e);
    }

    try {
      const res = await httpClient.get<ApiResponse<Array<unknown>>>('/characters');
      if (res.data && Array.isArray(res.data)) {
        this.gameData.setUserCharacters(res.data as never);
      }
    } catch (e) {
      console.warn('HomeScene: character fetch failed', e);
    }
  }

  private async claimDailyLoginIfNeeded(): Promise<void> {
    try {
      const res = await httpClient.get<ApiResponse<{ claimed: boolean; rewards: Array<{ name: string; quantity: number }>; consecutiveDays: number }>>('/login/daily');
      if (res.data?.claimed && res.data.rewards.length > 0) {
        const rewardStr = res.data.rewards.map(r => `${r.name} x${r.quantity}`).join(', ');
        this.showToast(`📅 출석 ${res.data.consecutiveDays}일차 보상: ${rewardStr}`, 4000);
      }
    } catch { /* silent */ }
  }

  private showToast(message: string, duration = 3000): void {
    const W = this.cameras.main.width;
    const toast = this.add.text(W / 2, 90, message, {
      fontSize: '14px',
      fontFamily: 'Arial',
      color: '#ffdd44',
      backgroundColor: '#000000cc',
      padding: { left: 14, right: 14, top: 8, bottom: 8 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(99);

    this.tweens.add({
      targets: toast,
      alpha: 0,
      y: 75,
      duration: 800,
      delay: duration,
      onComplete: () => toast.destroy(),
    });
  }
}
