import Phaser from 'phaser';

const WANDER_SPEED = 60;
const FOLLOW_SPEED = 80;
const FOLLOW_RADIUS = 150;
const WANDER_REACH = 8; // pixels to consider "arrived"
const AI_TICK_MS = 500;

type WanderState = 'idle' | 'moving' | 'following';

export class MonsterSprite extends Phaser.Physics.Arcade.Image {
  private nameLabel!: Phaser.GameObjects.Text;
  private shadow!: Phaser.GameObjects.Ellipse;
  private boundsRect: Phaser.Geom.Rectangle;

  private wanderState: WanderState = 'idle';
  private targetX = 0;
  private targetY = 0;
  private idleTimer = 0;
  private aiTimer = 0;

  private onClickCb: (() => void) | null = null;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    grade: number,
    monsterName: string,
    wanderBounds: Phaser.Geom.Rectangle,
    onClick: () => void,
  ) {
    const gradeKeys = ['1star', '2star', '3star', '4star', '5star'];
    const textureKey = `monster-${gradeKeys[Math.max(0, Math.min(grade - 1, 4))]}`;

    super(scene, x, y, textureKey);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.boundsRect = wanderBounds;
    this.onClickCb = onClick;

    this.setDepth(8);
    this.setScale(0.9);

    // Shadow
    this.shadow = scene.add.ellipse(x, y + 16, 28, 8, 0x000000, 0.25);
    this.shadow.setDepth(7);

    // Grade star suffix label
    const stars = '★'.repeat(grade);
    this.nameLabel = scene.add.text(x, y - 30, `${monsterName}\n${stars}`, {
      fontSize: '10px',
      fontFamily: 'Arial',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
      align: 'center',
    });
    this.nameLabel.setOrigin(0.5, 1);
    this.nameLabel.setDepth(11);

    // Physics body
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCircle(16, 4, 4);
    body.setCollideWorldBounds(true);

    // Click interaction
    this.setInteractive({ useHandCursor: true });
    this.on('pointerdown', () => this.onClickCb?.());
    this.on('pointerover', () => this.nameLabel.setColor('#ffee44'));
    this.on('pointerout',  () => this.nameLabel.setColor('#ffffff'));

    // Pick first wander target
    this.pickWanderTarget();
  }

  update(delta: number, playerX: number, playerY: number): void {
    if (!this.active) return;

    const body = this.body as Phaser.Physics.Arcade.Body;

    // AI tick
    this.aiTimer += delta;
    if (this.aiTimer >= AI_TICK_MS) {
      this.aiTimer = 0;
      this.tickAI(playerX, playerY);
    }

    // Movement
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (this.wanderState === 'idle') {
      body.setVelocity(0, 0);
    } else {
      const speed = this.wanderState === 'following' ? FOLLOW_SPEED : WANDER_SPEED;
      if (dist > WANDER_REACH) {
        const nx = dx / dist;
        const ny = dy / dist;
        body.setVelocity(nx * speed, ny * speed);
      } else {
        body.setVelocity(0, 0);
        if (this.wanderState === 'moving') {
          // Arrived — enter idle pause
          this.wanderState = 'idle';
          this.idleTimer = Phaser.Math.Between(1000, 3000);
        }
      }
    }

    // Idle countdown
    if (this.wanderState === 'idle') {
      this.idleTimer -= delta;
      if (this.idleTimer <= 0) {
        this.pickWanderTarget();
      }
    }

    // Update label & shadow
    this.nameLabel.setPosition(this.x, this.y - 24);
    this.shadow.setPosition(this.x, this.y + 16);
  }

  private tickAI(playerX: number, playerY: number): void {
    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const distToPlayer = Math.sqrt(dx * dx + dy * dy);

    if (distToPlayer < FOLLOW_RADIUS) {
      // Follow player
      this.wanderState = 'following';
      this.targetX = playerX;
      this.targetY = playerY;
    } else if (this.wanderState === 'following') {
      // Player moved away — resume wander
      this.pickWanderTarget();
    }
  }

  private pickWanderTarget(): void {
    this.wanderState = 'moving';
    this.targetX = Phaser.Math.Between(this.boundsRect.left, this.boundsRect.right);
    this.targetY = Phaser.Math.Between(this.boundsRect.top, this.boundsRect.bottom);
  }

  destroy(fromScene?: boolean): void {
    this.nameLabel?.destroy();
    this.shadow?.destroy();
    super.destroy(fromScene);
  }
}
