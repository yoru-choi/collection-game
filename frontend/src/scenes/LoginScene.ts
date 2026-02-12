import Phaser from 'phaser';
import { SCENE_KEYS, COLORS, UI } from '@/utils/Constants';
import { addSceneFrame } from '@/utils/SceneFrame';
import { AuthService } from '@/services/AuthService';
import { httpClient } from '@/services/api/HttpClient';
import { isValidEmail } from '@/utils/Helpers';
import { GameDataStore } from '@/store/GameDataStore';

export class LoginScene extends Phaser.Scene {
  private authService!: AuthService;
  private isLoginMode: boolean = true;
  private inputElements: Record<string, HTMLInputElement> = {};
  private inputLayouts: Array<{
    name: string;
    left: number;
    top: number;
    width: number;
    height: number;
  }> = [];
  private resizeHandler?: () => void;

  constructor() {
    super({ key: SCENE_KEYS.LOGIN });
  }

  create(): void {
    this.cleanupDomInputs();
    this.authService = new AuthService();

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Background with fantasy glow
    const bg = this.add.graphics();
    bg.fillGradientStyle(COLORS.BG_START, COLORS.BG_START, COLORS.BG_END, COLORS.BG_END, 1);
    bg.fillRect(0, 0, width, height);

    const glow = this.add.graphics();
    glow.fillStyle(COLORS.SECONDARY, 0.08);
    glow.fillCircle(width * 0.2, height * 0.25, 240);
    glow.fillStyle(COLORS.PRIMARY, 0.1);
    glow.fillCircle(width * 0.75, height * 0.2, 220);

    const particles = this.add.particles(0, 0, 'ui-particle', {
      x: { min: 0, max: width },
      y: { min: 0, max: height },
      speed: { min: 10, max: 30 },
      scale: { start: 0.6, end: 0 },
      alpha: { start: 0.25, end: 0 },
      blendMode: 'ADD',
      lifespan: 5000,
      frequency: 700,
      tint: [COLORS.PRIMARY_LIGHT, COLORS.SECONDARY_LIGHT],
    });
    particles.setDepth(-2);

    // Title
    const titleGlow = this.add.graphics();
    titleGlow.fillStyle(COLORS.PRIMARY_LIGHT, 0.25);
    titleGlow.fillCircle(width / 2, 120, 110);

    const title = this.add.text(width / 2, 120, 'Collection RPG', {
      fontFamily: UI.FONTS.TITLE,
      fontSize: '56px',
      color: this.colorToCss(COLORS.TEXT_PRIMARY),
      fontStyle: 'bold',
      shadow: {
        offsetX: 3,
        offsetY: 3,
        color: this.colorToCss(COLORS.PRIMARY_DARK),
        blur: 8,
        stroke: true,
        fill: true,
      },
    });
    title.setOrigin(0.5);

    this.tweens.add({
      targets: title,
      y: 115,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    const subtitle = this.add.text(width / 2, 180, 'Epic Character Collection Adventure', {
      fontFamily: UI.FONTS.BODY,
      fontSize: '18px',
      color: this.colorToCss(COLORS.TEXT_SECONDARY),
    });
    subtitle.setOrigin(0.5);

    this.createLoginPanel();
    addSceneFrame(this);
    this.registerResizeHandler();
    this.events.once('shutdown', () => this.cleanupDomInputs());
  }

  private createLoginPanel(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const panelWidth = 450;
    const panelHeight = this.isLoginMode ? 550 : 640;
    const panelX = width / 2;
    const panelY = height / 2 + 80;

    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.5);
    shadow.fillRoundedRect(
      panelX - panelWidth / 2 + 6,
      panelY - panelHeight / 2 + 6,
      panelWidth,
      panelHeight,
      20
    );

    const panel = this.add.graphics();
    panel.fillStyle(COLORS.DARKER, 0.95);
    panel.fillRoundedRect(
      panelX - panelWidth / 2,
      panelY - panelHeight / 2,
      panelWidth,
      panelHeight,
      20
    );
    panel.lineStyle(3, COLORS.GOLD, 0.8);
    panel.strokeRoundedRect(
      panelX - panelWidth / 2,
      panelY - panelHeight / 2,
      panelWidth,
      panelHeight,
      20
    );

    panel.fillStyle(COLORS.BG_ACCENT, 0.6);
    panel.fillRoundedRect(
      panelX - panelWidth / 2 + 12,
      panelY - panelHeight / 2 + 12,
      panelWidth - 24,
      60,
      14
    );

    const modeText = this.add.text(
      panelX,
      panelY - panelHeight / 2 + 46,
      this.isLoginMode ? 'Login' : 'Register',
      {
        fontFamily: UI.FONTS.TITLE,
        fontSize: '36px',
        color: this.colorToCss(COLORS.GOLD),
        fontStyle: 'bold',
        shadow: {
          offsetX: 2,
          offsetY: 2,
          color: '#000000',
          blur: 4,
          fill: true,
        },
      }
    );
    modeText.setOrigin(0.5);

    const underline = this.add.graphics();
    underline.lineStyle(4, COLORS.PRIMARY_LIGHT);
    underline.lineBetween(
      panelX - 90,
      panelY - panelHeight / 2 + 70,
      panelX + 90,
      panelY - panelHeight / 2 + 70
    );

    const inputYStart = panelY - panelHeight / 2 + 120;

    this.createInputField(panelX, inputYStart, '👤 Username', 'username');

    if (!this.isLoginMode) {
      this.createInputField(panelX, inputYStart + 90, '📧 Email', 'email');
      this.createInputField(panelX, inputYStart + 180, '🔒 Password', 'password');
      this.createInputField(panelX, inputYStart + 270, '🔒 Confirm Password', 'confirmPassword');
    } else {
      this.createInputField(panelX, inputYStart + 90, '🔒 Password', 'password');
    }

    this.createButton(
      panelX,
      panelY + panelHeight / 2 - 130,
      this.isLoginMode ? '🎮 Login' : '✨ Register',
      () => this.handleSubmit(),
      COLORS.PRIMARY
    );

    const toggleText = this.isLoginMode
      ? "Don't have an account? Register"
      : 'Already have an account? Login';

    const toggleButton = this.add.text(panelX, panelY + panelHeight / 2 - 70, toggleText, {
      fontFamily: UI.FONTS.BODY,
      fontSize: '16px',
      color: this.colorToCss(COLORS.TEXT_SECONDARY),
      shadow: {
        offsetX: 1,
        offsetY: 1,
        color: '#000000',
        blur: 2,
        fill: true,
      },
    });
    toggleButton.setOrigin(0.5);
    toggleButton.setInteractive({ useHandCursor: true });

    toggleButton.on('pointerover', () => {
      toggleButton.setColor('#ffffff');
      this.tweens.add({
        targets: toggleButton,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 150,
      });
    });

    toggleButton.on('pointerout', () => {
      toggleButton.setColor(this.colorToCss(COLORS.TEXT_SECONDARY));
      this.tweens.add({
        targets: toggleButton,
        scaleX: 1,
        scaleY: 1,
        duration: 150,
      });
    });

    toggleButton.on('pointerdown', () => {
      this.isLoginMode = !this.isLoginMode;
      this.scene.restart();
    });

    this.createButton(
      panelX,
      panelY + panelHeight / 2 + 10,
      '🎭 Guest Login (Dev)',
      () => this.handleGuestLogin(),
      COLORS.SUCCESS
    );
  }

  private createInputField(
    x: number,
    y: number,
    label: string,
    fieldName: string
  ): void {
    this.add.text(x - 180, y - 28, label, {
      fontFamily: UI.FONTS.UI,
      fontSize: '18px',
      color: this.colorToCss(COLORS.TEXT_SECONDARY),
      fontStyle: 'bold',
      shadow: {
        offsetX: 1,
        offsetY: 1,
        color: '#000000',
        blur: 3,
        fill: true,
      },
    });

    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.3);
    shadow.fillRoundedRect(x - 175, y - 18 + 3, 350, 50, 10);

    const inputBox = this.add.graphics();
    inputBox.fillStyle(COLORS.DARK, 0.9);
    inputBox.fillRoundedRect(x - 175, y - 18, 350, 50, 10);
    inputBox.lineStyle(2, COLORS.PRIMARY, 0.6);
    inputBox.strokeRoundedRect(x - 175, y - 18, 350, 50, 10);
    inputBox.lineStyle(1, COLORS.PRIMARY_LIGHT, 0.3);
    inputBox.strokeRoundedRect(x - 173, y - 16, 346, 46, 9);

    const hitArea = this.add.rectangle(x, y + 7, 350, 50);
    hitArea.setInteractive({ useHandCursor: true });
    hitArea.setVisible(false);

    const domInput = this.createDomInput(fieldName, x - 175, y - 18, 350, 50, label);
    hitArea.on('pointerdown', () => domInput.focus());

    hitArea.on('pointerover', () => {
      inputBox.clear();
      inputBox.fillStyle(COLORS.DARK, 1);
      inputBox.fillRoundedRect(x - 175, y - 18, 350, 50, 10);
      inputBox.lineStyle(2, COLORS.PRIMARY_LIGHT, 1);
      inputBox.strokeRoundedRect(x - 175, y - 18, 350, 50, 10);
      inputBox.lineStyle(1, COLORS.PRIMARY_LIGHT, 0.5);
      inputBox.strokeRoundedRect(x - 173, y - 16, 346, 46, 9);
    });

    hitArea.on('pointerout', () => {
      inputBox.clear();
      inputBox.fillStyle(COLORS.DARK, 0.9);
      inputBox.fillRoundedRect(x - 175, y - 18, 350, 50, 10);
      inputBox.lineStyle(2, COLORS.PRIMARY, 0.6);
      inputBox.strokeRoundedRect(x - 175, y - 18, 350, 50, 10);
      inputBox.lineStyle(1, COLORS.PRIMARY_LIGHT, 0.3);
      inputBox.strokeRoundedRect(x - 173, y - 16, 346, 46, 9);
    });
  }

  private createButton(
    x: number,
    y: number,
    text: string,
    callback: () => void,
    color: number = COLORS.PRIMARY
  ): Phaser.GameObjects.Container {
    const button = this.add.container(x, y);

    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.4);
    shadow.fillRoundedRect(-130, -22, 260, 54, 12);

    const bg = this.add.graphics();
    bg.fillGradientStyle(
      color,
      color,
      Phaser.Display.Color.ValueToColor(color).darken(30).color,
      Phaser.Display.Color.ValueToColor(color).darken(30).color,
      1
    );
    bg.fillRoundedRect(-125, -25, 250, 50, 10);
    bg.lineStyle(2, COLORS.GOLD, 0.9);
    bg.strokeRoundedRect(-125, -25, 250, 50, 10);
    bg.fillStyle(0xffffff, 0.1);
    bg.fillRoundedRect(-123, -23, 246, 15, 8);

    const buttonText = this.add.text(0, 0, text, {
      fontFamily: UI.FONTS.UI,
      fontSize: '20px',
      color: this.colorToCss(COLORS.TEXT_PRIMARY),
      fontStyle: 'bold',
      shadow: {
        offsetX: 2,
        offsetY: 2,
        color: '#000000',
        blur: 4,
        fill: true,
      },
    });
    buttonText.setOrigin(0.5);

    button.add([shadow, bg, buttonText]);
    button.setSize(250, 50);
    button.setInteractive({ useHandCursor: true });

    button.on('pointerover', () => {
      this.tweens.add({
        targets: button,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 150,
        ease: 'Back.easeOut',
      });
      bg.clear();
      bg.fillGradientStyle(
        Phaser.Display.Color.ValueToColor(color).lighten(20).color,
        Phaser.Display.Color.ValueToColor(color).lighten(20).color,
        Phaser.Display.Color.ValueToColor(color).darken(10).color,
        Phaser.Display.Color.ValueToColor(color).darken(10).color,
        1
      );
      bg.fillRoundedRect(-125, -25, 250, 50, 10);
      bg.lineStyle(3, COLORS.GOLD, 1);
      bg.strokeRoundedRect(-125, -25, 250, 50, 10);
      bg.fillStyle(0xffffff, 0.2);
      bg.fillRoundedRect(-123, -23, 246, 15, 8);
    });

    button.on('pointerout', () => {
      this.tweens.add({
        targets: button,
        scaleX: 1,
        scaleY: 1,
        duration: 150,
      });
      bg.clear();
      bg.fillGradientStyle(
        color,
        color,
        Phaser.Display.Color.ValueToColor(color).darken(30).color,
        Phaser.Display.Color.ValueToColor(color).darken(30).color,
        1
      );
      bg.fillRoundedRect(-125, -25, 250, 50, 10);
      bg.lineStyle(2, COLORS.GOLD, 0.9);
      bg.strokeRoundedRect(-125, -25, 250, 50, 10);
      bg.fillStyle(0xffffff, 0.1);
      bg.fillRoundedRect(-123, -23, 246, 15, 8);
    });

    button.on('pointerdown', () => {
      this.tweens.add({
        targets: button,
        scaleX: 0.95,
        scaleY: 0.95,
        duration: 100,
        yoyo: true,
      });
      callback();
    });

    return button;
  }

  private async handleSubmit(): Promise<void> {
    console.log(this.isLoginMode ? 'Login attempt...' : 'Register attempt...');

    if (this.isLoginMode) {
      const username = this.getInputValue('username');
      const password = this.getInputValue('password');

      if (!username || !password) {
        this.showError('Username and password are required.');
        return;
      }

      try {
        const result = await this.authService.login(username, password);
        GameDataStore.getInstance().setPlayerData(result.user);
        console.log('Login successful');
        this.scene.start(SCENE_KEYS.LOBBY);
      } catch (error) {
        console.error('Login failed:', error);
        const message = error instanceof Error
          ? error.message
          : 'Login failed. Please check your credentials.';
        this.showError(message);
      }
    } else {
      const username = this.getInputValue('username');
      const email = this.getInputValue('email');
      const password = this.getInputValue('password');
      const confirmPassword = this.getInputValue('confirmPassword');

      if (!username || !email || !password || !confirmPassword) {
        this.showError('All fields are required.');
        return;
      }

      if (!isValidEmail(email)) {
        this.showError('Please enter a valid email.');
        return;
      }

      if (password.length < 6) {
        this.showError('Password must be at least 6 characters.');
        return;
      }

      if (password !== confirmPassword) {
        this.showError('Passwords do not match.');
        return;
      }

      try {
        const result = await this.authService.register(username, email, password);
        GameDataStore.getInstance().setPlayerData(result.user);
        console.log('Registration successful');
        this.scene.start(SCENE_KEYS.LOBBY);
      } catch (error) {
        console.error('Registration failed:', error);
        const message = error instanceof Error
          ? error.message
          : 'Registration failed. Please try again.';
        this.showError(message);
      }
    }
  }

  private async handleGuestLogin(): Promise<void> {
    console.log('Guest login - bypassing authentication');
    httpClient.setAccessToken('guest-dev-token');
    this.scene.start(SCENE_KEYS.LOBBY);
  }

  private showError(message: string): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const errorText = this.add.text(width / 2, height - 50, message, {
      fontFamily: UI.FONTS.UI,
      fontSize: '16px',
      color: this.colorToCss(COLORS.DANGER),
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 },
    });
    errorText.setOrigin(0.5);

    this.time.delayedCall(3000, () => {
      errorText.destroy();
    });
  }

  private createDomInput(
    name: string,
    left: number,
    top: number,
    width: number,
    height: number,
    placeholder: string
  ): HTMLInputElement {
    const container = document.getElementById('game-container');
    if (!container) {
      throw new Error('Game container not found.');
    }

    const input = document.createElement('input');
    input.type = name.toLowerCase().includes('password') ? 'password' : 'text';
    if (name === 'password' || name === 'confirmPassword') {
      input.autocomplete = this.isLoginMode ? 'current-password' : 'new-password';
    } else {
      input.autocomplete = 'off';
    }
    if (name === 'email') {
      input.autocomplete = 'email';
      input.inputMode = 'email';
    }
    if (name === 'username') {
      input.autocomplete = 'username';
    }
    input.placeholder = placeholder.replace(/^[^a-zA-Z0-9]+\s*/, '');
    input.style.position = 'absolute';
    input.style.zIndex = '1001';
    input.style.background = 'transparent';
    input.style.border = 'none';
    input.style.outline = 'none';
    input.style.color = this.colorToCss(COLORS.TEXT_PRIMARY);
    input.style.caretColor = this.colorToCss(COLORS.TEXT_PRIMARY);
    input.style.fontFamily = UI.FONTS.UI;
    input.style.fontSize = '16px';
    input.style.padding = '0 12px';
    input.style.width = '100%';
    input.style.height = '100%';
    input.style.pointerEvents = 'auto';
    input.style.cursor = 'text';

    const wrapper = document.createElement('div');
    wrapper.style.position = 'absolute';
    wrapper.style.zIndex = '1000';
    wrapper.style.pointerEvents = 'auto';
    wrapper.style.display = 'flex';
    wrapper.style.alignItems = 'center';
    wrapper.style.justifyContent = 'center';
    wrapper.style.boxSizing = 'border-box';
    wrapper.style.borderRadius = '10px';
    wrapper.style.cursor = 'text';

    wrapper.appendChild(input);
    container.appendChild(wrapper);

    this.inputElements[name] = input;
    this.inputLayouts.push({ name, left, top, width, height });
    this.positionDomInputs();

    wrapper.addEventListener('mousedown', (event) => {
      event.stopPropagation();
      input.focus();
    });
    wrapper.addEventListener('touchstart', (event) => {
      event.stopPropagation();
      input.focus();
    });

    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        this.handleSubmit();
      }
    });

    return input;
  }

  private positionDomInputs(): void {
    const container = document.getElementById('game-container');
    const canvas = document.querySelector('canvas');
    if (!container || !canvas) return;

    const rect = canvas.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const scaleX = rect.width / this.cameras.main.width;
    const scaleY = rect.height / this.cameras.main.height;

    this.inputLayouts.forEach((layout) => {
      const input = this.inputElements[layout.name];
      if (!input) return;
      const wrapper = input.parentElement as HTMLElement | null;
      if (!wrapper) return;

      wrapper.style.left = `${rect.left - containerRect.left + layout.left * scaleX}px`;
      wrapper.style.top = `${rect.top - containerRect.top + layout.top * scaleY}px`;
      wrapper.style.width = `${layout.width * scaleX}px`;
      wrapper.style.height = `${layout.height * scaleY}px`;
    });
  }

  private registerResizeHandler(): void {
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }
    this.resizeHandler = () => this.positionDomInputs();
    window.addEventListener('resize', this.resizeHandler);
    this.positionDomInputs();
  }

  private cleanupDomInputs(): void {
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = undefined;
    }

    Object.values(this.inputElements).forEach((input) => {
      const wrapper = input.parentElement;
      if (wrapper && wrapper.parentElement) {
        wrapper.parentElement.removeChild(wrapper);
      }
    });

    this.inputElements = {};
    this.inputLayouts = [];
  }

  private getInputValue(name: string): string {
    return (this.inputElements[name]?.value || '').trim();
  }

  private colorToCss(color: number): string {
    return Phaser.Display.Color.IntegerToColor(color).rgba;
  }
}
