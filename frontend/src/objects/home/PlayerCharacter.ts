import Phaser from 'phaser';

const BASE_SPEED = 120;
const SPRINT_SPEED = 240;

export class PlayerCharacter extends Phaser.Physics.Arcade.Image {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  };
  private shiftKey!: Phaser.Input.Keyboard.Key;
  private interactKey!: Phaser.Input.Keyboard.Key;

  private nameLabel!: Phaser.GameObjects.Text;
  private dirArrow!: Phaser.GameObjects.Image;
  private footCircle!: Phaser.GameObjects.Ellipse;

  private externalVx = 0;
  private externalVy = 0;
  private useExternal = false;

  // Last non-zero velocity angle (radians) for direction indicator
  private facingAngle = Math.PI / 2; // facing down

  constructor(scene: Phaser.Scene, x: number, y: number, username: string) {
    super(scene, x, y, 'player-char');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setDepth(10);
    this.setScale(1.1);

    // Shadow ellipse beneath player
    this.footCircle = scene.add.ellipse(x, y + 18, 32, 10, 0x000000, 0.3);
    this.footCircle.setDepth(9);

    // Direction arrow (rotated in update)
    this.dirArrow = scene.add.image(x, y - 28, 'player-arrow');
    this.dirArrow.setDepth(11);
    this.dirArrow.setScale(0.9);

    // Name label
    this.nameLabel = scene.add.text(x, y - 44, username, {
      fontSize: '11px',
      fontFamily: 'Arial',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    });
    this.nameLabel.setOrigin(0.5, 1);
    this.nameLabel.setDepth(12);

    // Physics body setup
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCircle(18, 4, 4);
    body.setCollideWorldBounds(true);
    body.setMaxVelocity(SPRINT_SPEED, SPRINT_SPEED);

    // Input
    if (scene.input.keyboard) {
      this.cursors = scene.input.keyboard.createCursorKeys();
      this.wasd = scene.input.keyboard.addKeys({
        up: Phaser.Input.Keyboard.KeyCodes.W,
        down: Phaser.Input.Keyboard.KeyCodes.S,
        left: Phaser.Input.Keyboard.KeyCodes.A,
        right: Phaser.Input.Keyboard.KeyCodes.D,
      }) as typeof this.wasd;
      this.shiftKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
      this.interactKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    }
  }

  /** Set velocity from joystick (normalized -1..1, already scaled) */
  setExternalVelocity(nx: number, ny: number): void {
    this.externalVx = nx;
    this.externalVy = ny;
    this.useExternal = true;
  }

  clearExternalVelocity(): void {
    this.useExternal = false;
    this.externalVx = 0;
    this.externalVy = 0;
  }

  isInteractPressed(): boolean {
    return this.interactKey?.isDown ?? false;
  }

  update(): void {
    if (!this.active) return;

    const body = this.body as Phaser.Physics.Arcade.Body;
    const speed = this.shiftKey?.isDown ? SPRINT_SPEED : BASE_SPEED;

    let vx = 0;
    let vy = 0;

    if (this.useExternal) {
      vx = this.externalVx * speed;
      vy = this.externalVy * speed;
    } else {
      const left  = this.cursors?.left.isDown  || this.wasd?.left.isDown;
      const right = this.cursors?.right.isDown || this.wasd?.right.isDown;
      const up    = this.cursors?.up.isDown    || this.wasd?.up.isDown;
      const down  = this.cursors?.down.isDown  || this.wasd?.down.isDown;

      if (left)  vx = -speed;
      if (right) vx =  speed;
      if (up)    vy = -speed;
      if (down)  vy =  speed;

      // Normalize diagonal movement
      if (vx !== 0 && vy !== 0) {
        vx *= 0.7071;
        vy *= 0.7071;
      }
    }

    body.setVelocity(vx, vy);

    // Track facing direction
    if (vx !== 0 || vy !== 0) {
      this.facingAngle = Math.atan2(vy, vx);
    }

    // Tint: running = slightly brighter
    this.setTint(vx !== 0 || vy !== 0 ? 0xccffcc : 0xffffff);

    // Update decoration positions
    const px = this.x;
    const py = this.y;
    this.footCircle.setPosition(px, py + 18);
    this.nameLabel.setPosition(px, py - 28);
    this.dirArrow.setPosition(px, py - 24);
    this.dirArrow.setAngle(Phaser.Math.RadToDeg(this.facingAngle) + 90);
  }

  destroy(fromScene?: boolean): void {
    this.nameLabel?.destroy();
    this.dirArrow?.destroy();
    this.footCircle?.destroy();
    super.destroy(fromScene);
  }
}
