import Phaser from 'phaser';
import { SCENE_KEYS, COLORS } from '@/utils/Constants';
import { addSceneFrame } from '@/utils/SceneFrame';
import { getAssetCredits } from '@/utils/AssetConfig';

/**
 * CreditsScene - PRD 섹션 1.6 아트 에셋 출처 표시
 * 
 * OpenGameArt.org에서 사용한 에셋의 크레딧을 표시
 * 라이선스 준수 및 크리에이터 존중
 */
export class CreditsScene extends Phaser.Scene {
  private scrollY: number = 0;
  private scrollSpeed: number = 1;
  private isAutoScroll: boolean = true;
  private contentHeight: number = 0;

  constructor() {
    super({ key: SCENE_KEYS.CREDITS });
  }

  create(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Background
    this.add.rectangle(0, 0, width, height, 0x0a0a1a).setOrigin(0);

    // Title
    const title = this.add.text(width / 2, 60, 'Credits & Attributions', {
      fontSize: '42px',
      color: '#FFD700',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);
    title.setScrollFactor(0);

    // Subtitle
    const subtitle = this.add.text(
      width / 2,
      110,
      'Thank you to all the amazing artists!',
      {
        fontSize: '20px',
        color: '#ffffff',
        fontStyle: 'italic',
      }
    );
    subtitle.setOrigin(0.5);
    subtitle.setScrollFactor(0);

    // Back button
    this.createBackButton();

    // Create scrolling content
    this.createScrollingContent(width, height);

    // Controls info
    this.createControlsInfo(width, height);

    // Enable mouse wheel scrolling
    this.input.on('wheel', (pointer: any, gameObjects: any, deltaX: number, deltaY: number) => {
      this.scrollY += deltaY * 0.5;
      this.scrollY = Phaser.Math.Clamp(this.scrollY, 0, this.contentHeight);
      this.cameras.main.scrollY = this.scrollY;
      this.isAutoScroll = false;
    });

    // Auto scroll
    if (this.isAutoScroll) {
      this.time.addEvent({
        delay: 50,
        callback: this.autoScroll,
        callbackScope: this,
        loop: true,
      });
    }

    addSceneFrame(this);
  }

  private createScrollingContent(width: number, height: number): void {
    let yPos = 180;

    // Game Credits
    yPos = this.addSectionTitle('Game Development', width, yPos);
    yPos = this.addCreditLine('Game Design & Development', 'Collection RPG Team', width, yPos);
    yPos = this.addCreditLine('Powered By', 'Phaser 3 Game Engine', width, yPos);
    yPos += 40;

    // Art Assets from OpenGameArt.org
    yPos = this.addSectionTitle('Art Assets from OpenGameArt.org', width, yPos);
    yPos = this.addInfoText(
      'All assets are used under Creative Commons licenses (CC0, CC-BY)',
      width,
      yPos
    );
    yPos += 30;

    const assetCredits = getAssetCredits();
    assetCredits.forEach((credit) => {
      yPos = this.addAssetCredit(credit, width, yPos);
    });

    // OpenGameArt.org Attribution
    yPos += 40;
    yPos = this.addSectionTitle('Special Thanks', width, yPos);
    yPos = this.addCreditLine(
      'Asset Source',
      'OpenGameArt.org - Free Open Source Art Repository',
      width,
      yPos
    );
    yPos = this.addInfoText('https://opengameart.org/', width, yPos, '#4A90E2');
    yPos += 30;

    // Technology Stack
    yPos += 40;
    yPos = this.addSectionTitle('Technology Stack', width, yPos);
    const techStack = [
      { name: 'Frontend', value: 'Phaser 3 + TypeScript + Vite' },
      { name: 'Backend', value: 'Go (Golang)' },
      { name: 'Database', value: 'PostgreSQL' },
      { name: 'Cache & Session', value: 'Valkey (Redis)' },
      { name: 'WebSocket', value: 'Socket.IO' },
      { name: 'Container', value: 'Docker & Docker Compose' },
    ];
    techStack.forEach((tech) => {
      yPos = this.addCreditLine(tech.name, tech.value, width, yPos);
    });

    // License Information
    yPos += 40;
    yPos = this.addSectionTitle('License Information', width, yPos);
    yPos = this.addInfoText(
      'This game uses assets licensed under:\n' +
        '• CC0 (Public Domain) - No attribution required but appreciated\n' +
        '• CC-BY 3.0 - Attribution required\n' +
        '• CC-BY 4.0 - Attribution required\n' +
        '• GPL 3.0 - Open source compatible',
      width,
      yPos
    );
    yPos += 80;

    // Thank You Message
    yPos = this.addSectionTitle('Thank You for Playing!', width, yPos);
    yPos = this.addInfoText(
      '🎮 Enjoy the game and support open source art! 🎨',
      width,
      yPos,
      '#FFD700'
    );
    yPos += 100;

    this.contentHeight = yPos - height;
  }

  private addSectionTitle(text: string, width: number, yPos: number): number {
    const title = this.add.text(width / 2, yPos, text, {
      fontSize: '28px',
      color: '#FFD700',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);
    return yPos + 50;
  }

  private addCreditLine(label: string, value: string, width: number, yPos: number): number {
    const labelText = this.add.text(width / 2 - 200, yPos, label + ':', {
      fontSize: '18px',
      color: '#AAAAAA',
    });
    labelText.setOrigin(1, 0);

    const valueText = this.add.text(width / 2 - 190, yPos, value, {
      fontSize: '18px',
      color: '#ffffff',
    });

    return yPos + 30;
  }

  private addInfoText(
    text: string,
    width: number,
    yPos: number,
    color: string = '#CCCCCC'
  ): number {
    const infoText = this.add.text(width / 2, yPos, text, {
      fontSize: '16px',
      color: color,
      align: 'center',
      wordWrap: { width: width - 200 },
      lineSpacing: 5,
    });
    infoText.setOrigin(0.5, 0);

    const lines = text.split('\n').length;
    return yPos + lines * 25 + 10;
  }

  private addAssetCredit(credit: AssetCredit, width: number, yPos: number): number {
    // Asset name
    const assetName = this.add.text(width / 2, yPos, credit.name, {
      fontSize: '20px',
      color: '#4A90E2',
      fontStyle: 'bold',
    });
    assetName.setOrigin(0.5);
    yPos += 30;

    // Author
    this.add.text(width / 2 - 150, yPos, 'Author:', {
      fontSize: '16px',
      color: '#AAAAAA',
    }).setOrigin(1, 0);

    this.add.text(width / 2 - 140, yPos, credit.author, {
      fontSize: '16px',
      color: '#ffffff',
    });
    yPos += 25;

    // License
    this.add.text(width / 2 - 150, yPos, 'License:', {
      fontSize: '16px',
      color: '#AAAAAA',
    }).setOrigin(1, 0);

    this.add.text(width / 2 - 140, yPos, credit.license, {
      fontSize: '16px',
      color: '#50C878',
    });
    yPos += 25;

    // URL
    if (credit.url) {
      this.add.text(width / 2 - 150, yPos, 'Source:', {
        fontSize: '14px',
        color: '#AAAAAA',
      }).setOrigin(1, 0);

      const urlText = this.add.text(width / 2 - 140, yPos, credit.url, {
        fontSize: '14px',
        color: '#4A90E2',
        fontStyle: 'underline',
      });
      urlText.setInteractive({ useHandCursor: true });
      urlText.on('pointerdown', () => {
        window.open(credit.url, '_blank');
      });
      yPos += 25;
    }

    // Separator
    const separator = this.add.graphics();
    separator.lineStyle(1, COLORS.PRIMARY, 0.3);
    separator.lineBetween(width / 2 - 300, yPos + 10, width / 2 + 300, yPos + 10);
    yPos += 35;

    return yPos;
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
    button.setScrollFactor(0);
  }

  private createControlsInfo(width: number, height: number): void {
    const controls = this.add.container(width / 2, height - 30);
    const bg = this.add.rectangle(0, 0, 400, 40, 0x000000, 0.7);
    const text = this.add.text(0, 0, '🖱️ Scroll: Mouse Wheel  |  ⏸️ Pause: Click', {
      fontSize: '14px',
      color: '#ffffff',
    });
    text.setOrigin(0.5);
    controls.add([bg, text]);
    controls.setScrollFactor(0);
  }

  private autoScroll(): void {
    if (this.isAutoScroll && this.scrollY < this.contentHeight) {
      this.scrollY += this.scrollSpeed;
      this.cameras.main.scrollY = this.scrollY;
    }
  }
}

interface AssetCredit {
  name: string;
  author: string;
  license: string;
  url?: string;
}
