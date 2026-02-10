import Phaser from 'phaser';
import { SCENE_KEYS, COLORS, UI } from '@/utils/Constants';
import { isValidEmail } from '@/utils/Helpers';
import { AuthService } from '@/services/AuthService';
import { httpClient } from '@/services/api/HttpClient';

export class LoginScene extends Phaser.Scene {
  private authService!: AuthService;
  private isLoginMode: boolean = true;

  constructor() {
    super({ key: SCENE_KEYS.LOGIN });
  }

  create(): void {
    this.authService = new AuthService();
    
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Background
    this.add.rectangle(0, 0, width, height, COLORS.DARK).setOrigin(0);

    // Title
    const title = this.add.text(width / 2, 100, 'Collection RPG', {
      fontSize: '48px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);

    // Login/Register Panel
    this.createLoginPanel();
  }

  private createLoginPanel(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const panelWidth = 400;
    const panelHeight = 500;
    const panelX = width / 2;
    const panelY = height / 2 + 50;

    // Panel background
    const panel = this.add.graphics();
    panel.fillStyle(COLORS.PRIMARY, 0.2);
    panel.fillRoundedRect(
      panelX - panelWidth / 2,
      panelY - panelHeight / 2,
      panelWidth,
      panelHeight,
      15
    );
    panel.lineStyle(2, COLORS.PRIMARY);
    panel.strokeRoundedRect(
      panelX - panelWidth / 2,
      panelY - panelHeight / 2,
      panelWidth,
      panelHeight,
      15
    );

    // Mode toggle text
    const modeText = this.add.text(
      panelX,
      panelY - panelHeight / 2 + 40,
      this.isLoginMode ? 'Login' : 'Register',
      {
        fontSize: '32px',
        color: '#ffffff',
        fontStyle: 'bold',
      }
    );
    modeText.setOrigin(0.5);

    // Input fields (simulated with text and rectangles)
    const inputYStart = panelY - panelHeight / 2 + 100;
    
    // Email/Username field
    this.createInputField(
      panelX,
      inputYStart,
      this.isLoginMode ? 'Email' : 'Username',
      'email'
    );

    // Password field
    this.createInputField(
      panelX,
      inputYStart + 80,
      'Password',
      'password'
    );

    // Confirm password (only for registration)
    if (!this.isLoginMode) {
      this.createInputField(
        panelX,
        inputYStart + 160,
        'Confirm Password',
        'confirmPassword'
      );
    }

    // Submit button
    this.createButton(
      panelX,
      panelY + panelHeight / 2 - 100,
      this.isLoginMode ? 'Login' : 'Register',
      () => this.handleSubmit()
    );

    // Toggle mode button
    const toggleText = this.isLoginMode
      ? "Don't have an account? Register"
      : 'Already have an account? Login';
    
    const toggleButton = this.add.text(panelX, panelY + panelHeight / 2 - 40, toggleText, {
      fontSize: '16px',
      color: '#4a90e2',
    });
    toggleButton.setOrigin(0.5);
    toggleButton.setInteractive({ useHandCursor: true });
    toggleButton.on('pointerdown', () => {
      this.isLoginMode = !this.isLoginMode;
      this.scene.restart();
    });

    // Guest login button (temporary for development)
    this.createButton(
      panelX,
      panelY + panelHeight / 2 + 20,
      'Guest Login (Dev)',
      () => this.handleGuestLogin(),
      0x50c878
    );
  }

  private createInputField(
    x: number,
    y: number,
    label: string,
    fieldName: string
  ): void {
    // Label
    const labelText = this.add.text(x - 150, y - 25, label, {
      fontSize: '16px',
      color: '#ffffff',
    });

    // Input box (placeholder - in real implementation, use HTML input)
    const inputBox = this.add.rectangle(x, y, 300, 40, 0x34495e);
    inputBox.setStrokeStyle(2, COLORS.LIGHT);
    inputBox.setInteractive({ useHandCursor: true });
    
    // Placeholder text
    const placeholder = this.add.text(x, y, 'Click to edit (TODO)', {
      fontSize: '14px',
      color: '#95a5a6',
    });
    placeholder.setOrigin(0.5);

    // Note: In a real implementation, you would create HTML input elements
    // overlaid on the canvas using DOM elements
  }

  private createButton(
    x: number,
    y: number,
    text: string,
    callback: () => void,
    color: number = COLORS.PRIMARY
  ): Phaser.GameObjects.Container {
    const button = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, 250, 50, color);
    bg.setStrokeStyle(2, COLORS.LIGHT);
    
    const buttonText = this.add.text(0, 0, text, {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    buttonText.setOrigin(0.5);

    button.add([bg, buttonText]);
    button.setSize(250, 50);
    button.setInteractive({ useHandCursor: true });

    button.on('pointerover', () => {
      bg.setFillStyle(color, 0.8);
    });

    button.on('pointerout', () => {
      bg.setFillStyle(color, 1);
    });

    button.on('pointerdown', callback);

    return button;
  }

  private async handleSubmit(): Promise<void> {
    // TODO: Get actual input values from HTML input elements
    // For now, we'll use placeholder values
    
    console.log(this.isLoginMode ? 'Login attempt...' : 'Register attempt...');
    
    if (this.isLoginMode) {
      // Mock login
      const email = 'test@example.com';
      const password = 'password123';
      
      try {
        await this.authService.login(email, password);
        console.log('Login successful');
        this.scene.start(SCENE_KEYS.LOBBY);
      } catch (error) {
        console.error('Login failed:', error);
        this.showError('Login failed. Please check your credentials.');
      }
    } else {
      // Mock register
      const username = 'testuser';
      const email = 'test@example.com';
      const password = 'password123';
      
      try {
        await this.authService.register(username, email, password);
        console.log('Registration successful');
        this.scene.start(SCENE_KEYS.LOBBY);
      } catch (error) {
        console.error('Registration failed:', error);
        this.showError('Registration failed. Please try again.');
      }
    }
  }

  private async handleGuestLogin(): Promise<void> {
    // Bypass authentication for development
    console.log('Guest login - bypassing authentication');
    
    // 개발 모드: 목 토큰 설정
    httpClient.setAccessToken('guest-dev-token');
    
    this.scene.start(SCENE_KEYS.LOBBY);
  }

  private showError(message: string): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const errorText = this.add.text(width / 2, height - 50, message, {
      fontSize: '16px',
      color: '#e74c3c',
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 },
    });
    errorText.setOrigin(0.5);

    // Remove after 3 seconds
    this.time.delayedCall(3000, () => {
      errorText.destroy();
    });
  }
}
