import Phaser from 'phaser';
import { SCENE_KEYS, COLORS } from '@/utils/Constants';
import { addSceneFrame } from '@/utils/SceneFrame';
import { AuthService } from '@/services/AuthService';

/**
 * SettingsScene - 게임 설정 화면
 * 
 * 기능:
 * - 음량/효과음 조절
 * - 품질 설정
 * - 언어 설정
 * - 알림 설정
 * - 계정 관리
 * - 크레딧 보기
 */
export class SettingsScene extends Phaser.Scene {
  private authService!: AuthService;
  private settings: GameSettings = {
    bgmVolume: 70,
    sfxVolume: 80,
    graphicsQuality: 'high',
    language: 'ko',
    pushNotifications: true,
    autoPlay: false,
    battleSpeed: 1,
    showDamageNumbers: true,
  };

  constructor() {
    super({ key: SCENE_KEYS.SETTINGS });
  }

  create(): void {
    this.authService = new AuthService();

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Background
    this.add.rectangle(0, 0, width, height, 0x0a0a1a).setOrigin(0);

    // Title
    const title = this.add.text(width / 2, 60, '⚙️ Settings', {
      fontSize: '42px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);

    // Load saved settings
    this.loadSettings();

    // Create settings panels
    let yPos = 140;
    yPos = this.createAudioSettings(width, yPos);
    yPos = this.createGraphicsSettings(width, yPos);
    yPos = this.createGameplaySettings(width, yPos);
    yPos = this.createAccountSettings(width, yPos);

    // Back button
    this.createBackButton();

    // Credits button
    this.createCreditsButton(width, height);
  }

  private createAudioSettings(width: number, yPos: number): number {
    this.createSectionTitle('🔊 Audio', width, yPos);
    yPos += 50;

    // BGM Volume
    yPos = this.createSlider('BGM Volume', this.settings.bgmVolume, width, yPos, (value) => {
      this.settings.bgmVolume = value;
      this.saveSettings();
      // Apply BGM volume
      console.log('BGM Volume:', value);
    });

    // SFX Volume
    yPos = this.createSlider('SFX Volume', this.settings.sfxVolume, width, yPos, (value) => {
      this.settings.sfxVolume = value;
      this.saveSettings();
      // Apply SFX volume
      console.log('SFX Volume:', value);

      addSceneFrame(this);
    });

    return yPos + 20;
  }

  private createGraphicsSettings(width: number, yPos: number): number {
    this.createSectionTitle('🎨 Graphics', width, yPos);
    yPos += 50;

    // Quality dropdown
    const qualityOptions = ['low', 'medium', 'high', 'ultra'];
    yPos = this.createDropdown(
      'Graphics Quality',
      qualityOptions,
      this.settings.graphicsQuality,
      width,
      yPos,
      (value) => {
        this.settings.graphicsQuality = value as GraphicsQuality;
        this.saveSettings();
        // Apply graphics quality
        console.log('Graphics Quality:', value);
      }
    );

    return yPos + 20;
  }

  private createGameplaySettings(width: number, yPos: number): number {
    this.createSectionTitle('🎮 Gameplay', width, yPos);
    yPos += 50;

    // Language
    const languages = ['en', 'ko', 'ja', 'zh'];
    const languageLabels: Record<string, string> = {
      en: 'English',
      ko: '한국어',
      ja: '日本語',
      zh: '中文',
    };
    yPos = this.createDropdown(
      'Language',
      languages,
      this.settings.language,
      width,
      yPos,
      (value) => {
        this.settings.language = value;
        this.saveSettings();
        console.log('Language:', languageLabels[value]);
      },
      languageLabels
    );

    // Battle Speed
    yPos = this.createSlider(
      'Battle Speed',
      this.settings.battleSpeed,
      width,
      yPos,
      (value) => {
        this.settings.battleSpeed = value;
        this.saveSettings();
      },
      { min: 1, max: 3, step: 1 }
    );

    // Toggle options
    yPos = this.createToggle(
      'Auto Play',
      this.settings.autoPlay,
      width,
      yPos,
      (value) => {
        this.settings.autoPlay = value;
        this.saveSettings();
      }
    );

    yPos = this.createToggle(
      'Show Damage Numbers',
      this.settings.showDamageNumbers,
      width,
      yPos,
      (value) => {
        this.settings.showDamageNumbers = value;
        this.saveSettings();
      }
    );

    yPos = this.createToggle(
      'Push Notifications',
      this.settings.pushNotifications,
      width,
      yPos,
      (value) => {
        this.settings.pushNotifications = value;
        this.saveSettings();
      }
    );

    return yPos + 20;
  }

  private createAccountSettings(width: number, yPos: number): number {
    this.createSectionTitle('👤 Account', width, yPos);
    yPos += 50;

    // Logout button
    const logoutBtn = this.createActionButton(
      'Logout',
      width / 2 - 120,
      yPos,
      COLORS.WARNING,
      () => {
        this.authService.logout();
        this.scene.start(SCENE_KEYS.LOGIN);
      }
    );

    // Delete account button
    const deleteBtn = this.createActionButton(
      'Delete Account',
      width / 2 + 120,
      yPos,
      COLORS.DANGER,
      () => {
        this.confirmDeleteAccount();
      }
    );

    return yPos + 80;
  }

  private createSectionTitle(text: string, width: number, yPos: number): void {
    const title = this.add.text(width / 2 - 300, yPos, text, {
      fontSize: '24px',
      color: '#FFD700',
      fontStyle: 'bold',
    });
  }

  private createSlider(
    label: string,
    value: number,
    width: number,
    yPos: number,
    onChange: (value: number) => void,
    options: { min?: number; max?: number; step?: number } = {}
  ): number {
    const { min = 0, max = 100, step = 1 } = options;

    // Label
    this.add.text(width / 2 - 300, yPos, label, {
      fontSize: '18px',
      color: '#ffffff',
    });

    // Value display
    const valueText = this.add.text(width / 2 + 250, yPos, `${value}`, {
      fontSize: '18px',
      color: '#4A90E2',
      fontStyle: 'bold',
    });
    valueText.setOrigin(1, 0);

    // Slider track
    const trackWidth = 300;
    const trackX = width / 2 - 150;
    const trackY = yPos + 35;

    const track = this.add.graphics();
    track.fillStyle(0x333333);
    track.fillRoundedRect(trackX, trackY, trackWidth, 8, 4);

    // Slider fill
    const fillWidth = ((value - min) / (max - min)) * trackWidth;
    const fill = this.add.graphics();
    fill.fillStyle(COLORS.SUCCESS);
    fill.fillRoundedRect(trackX, trackY, fillWidth, 8, 4);

    // Slider handle
    const handle = this.add.circle(trackX + fillWidth, trackY + 4, 12, COLORS.PRIMARY);
    handle.setStrokeStyle(2, COLORS.LIGHT);
    handle.setInteractive({ useHandCursor: true, draggable: true });

    this.input.on('drag', (pointer: any, gameObject: any, dragX: number) => {
      if (gameObject === handle) {
        const newX = Phaser.Math.Clamp(dragX, trackX, trackX + trackWidth);
        handle.x = newX;

        const newValue =
          Math.round(((newX - trackX) / trackWidth) * (max - min) / step) * step + min;
        valueText.setText(`${newValue}`);

        // Update fill
        fill.clear();
        fill.fillStyle(COLORS.SUCCESS);
        fill.fillRoundedRect(trackX, trackY, newX - trackX, 8, 4);

        onChange(newValue);
      }
    });

    return yPos + 60;
  }

  private createDropdown(
    label: string,
    options: string[],
    currentValue: string,
    width: number,
    yPos: number,
    onChange: (value: string) => void,
    labels?: Record<string, string>
  ): number {
    // Label
    this.add.text(width / 2 - 300, yPos, label, {
      fontSize: '18px',
      color: '#ffffff',
    });

    // Dropdown button
    const btnWidth = 200;
    const btnX = width / 2 + 50;

    const displayValue = labels ? labels[currentValue] : currentValue;
    const dropdownText = this.add.text(btnX, yPos, displayValue, {
      fontSize: '16px',
      color: '#ffffff',
    });
    dropdownText.setOrigin(0.5, 0);

    const dropdownBg = this.add.rectangle(btnX, yPos + 12, btnWidth, 35, COLORS.PRIMARY, 0.8);
    dropdownBg.setStrokeStyle(2, COLORS.LIGHT);
    dropdownBg.setInteractive({ useHandCursor: true });

    const arrow = this.add.text(btnX + btnWidth / 2 - 20, yPos, '▼', {
      fontSize: '14px',
      color: '#ffffff',
    });

    let isOpen = false;
    const optionElements: Phaser.GameObjects.GameObject[] = [];

    dropdownBg.on('pointerdown', () => {
      if (isOpen) {
        // Close dropdown
        optionElements.forEach((el) => el.destroy());
        optionElements.length = 0;
        isOpen = false;
      } else {
        // Open dropdown
        options.forEach((option, index) => {
          const optY = yPos + 50 + index * 40;
          const optBg = this.add.rectangle(btnX, optY, btnWidth, 35, 0x222222, 0.95);
          optBg.setStrokeStyle(1, COLORS.PRIMARY);
          optBg.setInteractive({ useHandCursor: true });

          const displayLabel = labels ? labels[option] : option;
          const optText = this.add.text(btnX, optY, displayLabel, {
            fontSize: '16px',
            color: option === currentValue ? '#FFD700' : '#ffffff',
          });
          optText.setOrigin(0.5);

          optBg.on('pointerdown', () => {
            dropdownText.setText(displayLabel);
            onChange(option);
            optionElements.forEach((el) => el.destroy());
            optionElements.length = 0;
            isOpen = false;
          });

          optBg.on('pointerover', () => {
            optBg.setFillStyle(COLORS.PRIMARY, 0.6);
          });

          optBg.on('pointerout', () => {
            optBg.setFillStyle(0x222222, 0.95);
          });

          optionElements.push(optBg, optText);
        });
        isOpen = true;
      }
    });

    return yPos + 50;
  }

  private createToggle(
    label: string,
    value: boolean,
    width: number,
    yPos: number,
    onChange: (value: boolean) => void
  ): number {
    // Label
    this.add.text(width / 2 - 300, yPos, label, {
      fontSize: '18px',
      color: '#ffffff',
    });

    // Toggle switch
    const switchX = width / 2 + 150;
    const switchWidth = 60;
    const switchHeight = 30;

    const switchBg = this.add.rectangle(
      switchX,
      yPos + 15,
      switchWidth,
      switchHeight,
      value ? COLORS.SUCCESS : 0x666666,
      0.8
    );
    switchBg.setStrokeStyle(2, COLORS.LIGHT);
    switchBg.setInteractive({ useHandCursor: true });

    const knobX = value ? switchX + switchWidth / 4 : switchX - switchWidth / 4;
    const knob = this.add.circle(knobX, yPos + 15, 12, COLORS.LIGHT);

    switchBg.on('pointerdown', () => {
      const newValue = !value;
      value = newValue;

      switchBg.setFillStyle(newValue ? COLORS.SUCCESS : 0x666666, 0.8);
      const targetX = newValue ? switchX + switchWidth / 4 : switchX - switchWidth / 4;

      this.tweens.add({
        targets: knob,
        x: targetX,
        duration: 200,
        ease: 'Power2',
      });

      onChange(newValue);
    });

    return yPos + 45;
  }

  private createActionButton(
    text: string,
    x: number,
    y: number,
    color: number,
    callback: () => void
  ): Phaser.GameObjects.Container {
    const button = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, 220, 50, color, 0.9);
    bg.setStrokeStyle(2, COLORS.LIGHT);

    const btnText = this.add.text(0, 0, text, {
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    btnText.setOrigin(0.5);

    button.add([bg, btnText]);
    button.setSize(220, 50);
    button.setInteractive({ useHandCursor: true });
    button.on('pointerdown', callback);

    return button;
  }

  private createBackButton(): void {
    const button = this.add.container(60, 40);
    const bg = this.add.rectangle(0, 0, 120, 50, COLORS.DANGER);
    bg.setStrokeStyle(2, COLORS.LIGHT);
    const text = this.add.text(0, 0, '⬅ Back', {
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    text.setOrigin(0.5);
    button.add([bg, text]);
    button.setSize(120, 50);
    button.setInteractive({ useHandCursor: true });
    button.on('pointerdown', () => this.scene.start(SCENE_KEYS.LOBBY));
  }

  private createCreditsButton(width: number, height: number): void {
    const button = this.add.container(width - 100, height - 40);
    const bg = this.add.rectangle(0, 0, 140, 50, COLORS.INFO, 0.8);
    bg.setStrokeStyle(2, COLORS.LIGHT);
    const text = this.add.text(0, 0, 'Credits', {
      fontSize: '16px',
      color: '#ffffff',
    });
    text.setOrigin(0.5);
    button.add([bg, text]);
    button.setSize(140, 50);
    button.setInteractive({ useHandCursor: true });
    button.on('pointerdown', () => this.scene.start(SCENE_KEYS.CREDITS));
  }

  private confirmDeleteAccount(): void {
    // In a real implementation, this would show a confirmation dialog
    console.log('Delete account confirmation required');
    
    const confirmed = confirm('Are you sure you want to delete your account? This action cannot be undone.');
    if (confirmed) {
      console.log('Account deletion requested');
      // Call API to delete account
      // this.authService.deleteAccount();
    }
  }

  private loadSettings(): void {
    const saved = localStorage.getItem('gameSettings');
    if (saved) {
      try {
        this.settings = { ...this.settings, ...JSON.parse(saved) };
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    }
  }

  private saveSettings(): void {
    try {
      localStorage.setItem('gameSettings', JSON.stringify(this.settings));
      console.log('Settings saved');
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }
}

interface GameSettings {
  bgmVolume: number;
  sfxVolume: number;
  graphicsQuality: GraphicsQuality;
  language: string;
  pushNotifications: boolean;
  autoPlay: boolean;
  battleSpeed: number;
  showDamageNumbers: boolean;
}

type GraphicsQuality = 'low' | 'medium' | 'high' | 'ultra';
