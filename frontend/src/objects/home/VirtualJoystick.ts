import Phaser from 'phaser';

const BASE_RADIUS = 50;
const STICK_RADIUS = 22;
const MAX_DIST = BASE_RADIUS - STICK_RADIUS;

/**
 * Virtual joystick widget for mobile controls.
 * Outputs a normalised direction vector via getDelta().
 * The container is FixedToCamera (setScrollFactor 0).
 */
export class VirtualJoystick {
  private scene: Phaser.Scene;

  private baseCircle: Phaser.GameObjects.Arc;
  private stick: Phaser.GameObjects.Arc;
  private container: Phaser.GameObjects.Container;

  private originX: number;
  private originY: number;
  private deltaX = 0;
  private deltaY = 0;
  private active = false;

  private trackingPointerId: number | null = null;

  constructor(scene: Phaser.Scene, screenX: number, screenY: number) {
    this.scene = scene;
    this.originX = 0;
    this.originY = 0;

    // Build graphics (local coords inside container)
    this.baseCircle = scene.add.arc(0, 0, BASE_RADIUS, 0, 360, false, 0x000000, 0.35);
    this.baseCircle.setStrokeStyle(3, 0xffffff, 0.5);

    this.stick = scene.add.arc(0, 0, STICK_RADIUS, 0, 360, false, 0xffffff, 0.7);
    this.stick.setStrokeStyle(2, 0xffffff, 0.9);

    this.container = scene.add.container(screenX, screenY, [this.baseCircle, this.stick]);
    this.container.setDepth(100);
    this.container.setScrollFactor(0);
    this.container.setSize(BASE_RADIUS * 2, BASE_RADIUS * 2);

    // Mobile-only: hide on desktop
    const isMobile = !scene.sys.game.device.os.desktop;
    this.container.setVisible(isMobile);

    this.setupInput();
  }

  private setupInput(): void {
    const cam = this.scene.cameras.main;

    this.scene.input.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      // Convert pointer screen coords to container-local coords
      const localX = ptr.x - (this.container.x - cam.scrollX * 0) ;
      const localY = ptr.y - (this.container.y - cam.scrollY * 0);
      const dist = Math.sqrt(localX * localX + localY * localY);

      if (dist <= BASE_RADIUS + 20) {
        this.active = true;
        this.trackingPointerId = ptr.id;
        this.originX = this.container.x;
        this.originY = this.container.y;
      }
    });

    this.scene.input.on('pointermove', (ptr: Phaser.Input.Pointer) => {
      if (!this.active || ptr.id !== this.trackingPointerId) return;

      const dx = ptr.x - this.originX;
      const dy = ptr.y - this.originY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist === 0) {
        this.deltaX = 0;
        this.deltaY = 0;
        this.stick.setPosition(0, 0);
        return;
      }

      const clamped = Math.min(dist, MAX_DIST);
      const nx = dx / dist;
      const ny = dy / dist;

      this.deltaX = nx;
      this.deltaY = ny;

      this.stick.setPosition(nx * clamped, ny * clamped);
    });

    this.scene.input.on('pointerup', (ptr: Phaser.Input.Pointer) => {
      if (ptr.id !== this.trackingPointerId) return;
      this.active = false;
      this.trackingPointerId = null;
      this.deltaX = 0;
      this.deltaY = 0;
      this.stick.setPosition(0, 0);
    });
  }

  /** Normalised direction (-1..1 per axis). Zero when idle. */
  getDelta(): { x: number; y: number } {
    return { x: this.deltaX, y: this.deltaY };
  }

  isActive(): boolean {
    return this.active;
  }

  setVisible(visible: boolean): void {
    this.container.setVisible(visible);
  }

  destroy(): void {
    this.container.destroy();
  }
}
