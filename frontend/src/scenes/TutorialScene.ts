import Phaser from 'phaser';
import { SCENE_KEYS, COLORS, UI } from '@/utils/Constants';
import { addSceneFrame } from '@/utils/SceneFrame';
import { GameDataStore } from '@/store/GameDataStore';

/**
 * TutorialScene - PRD 섹션 1.8 "첫 10분 튜토리얼 스크립트" 구현
 * 
 * 튜토리얼 플로우:
 * 1. 로그인 완료: 닉네임 설정, 기본 UI 안내
 * 2. 무료 소환 1회: 캐릭터 3종 중 1종 확정 지급
 * 3. 파티 편성: 지급 캐릭터 + 기본 캐릭터로 4인 파티 구성
 * 4. 스토리 1-1 입장: 전투 조작 안내 (스킬 1회 사용)
 * 5. 전투 승리 보상: 골드/경험치/재료 지급
 * 6. 레벨업 안내: 캐릭터 1회 레벨업 수행
 * 7. 다음 목표 안내: 스토리 1-2, 일일 퀘스트 1개 해금
 */
export class TutorialScene extends Phaser.Scene {
  private gameData!: GameDataStore;
  private currentStep: number = 0;
  private tutorialSteps: TutorialStep[] = [];
  private dialogBox?: Phaser.GameObjects.Container;
  private highlightGraphics?: Phaser.GameObjects.Graphics;
  private skipButton?: Phaser.GameObjects.Container;

  constructor() {
    super({ key: SCENE_KEYS.TUTORIAL });
  }

  create(): void {
    this.gameData = GameDataStore.getInstance();

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Background
    this.add.rectangle(0, 0, width, height, COLORS.BG_START).setOrigin(0);

    // Initialize tutorial steps
    this.initializeTutorialSteps();

    // Create dialog box
    this.createDialogBox(width, height);

    // Create skip button
    this.createSkipButton(width);

    // Start first step
    this.showStep(this.currentStep);

    addSceneFrame(this);
  }

  private initializeTutorialSteps(): void {
    this.tutorialSteps = [
      {
        title: 'Welcome to Collection RPG!',
        message: '환영합니다! 이 게임은 캐릭터를 수집하고 육성하여 전투를 즐기는 RPG입니다.\n차근차근 안내해 드리겠습니다.',
        action: () => this.showBasicUI(),
      },
      {
        title: 'Nickname Setup',
        message: '먼저 당신의 닉네임을 설정해주세요.\n이 닉네임은 게임 내에서 다른 플레이어들에게 보여집니다.',
        action: () => this.showNicknameInput(),
      },
      {
        title: 'Free Summon',
        message: '시작 보너스로 무료 소환권을 드립니다!\n강력한 캐릭터를 얻어보세요.',
        action: () => this.performFreeSummon(),
      },
      {
        title: 'Party Formation',
        message: '이제 파티를 구성해봅시다.\n최대 4명의 캐릭터로 파티를 구성할 수 있습니다.',
        action: () => this.showPartyFormation(),
      },
      {
        title: 'First Battle',
        message: '이제 첫 전투를 시작합니다!\n스토리 던전 1-1에 도전해보세요.',
        action: () => this.startFirstBattle(),
      },
      {
        title: 'Battle Victory!',
        message: '축하합니다! 첫 승리를 거두셨습니다.\n보상으로 골드와 경험치를 획득했습니다.',
        action: () => this.showBattleRewards(),
      },
      {
        title: 'Level Up',
        message: '캐릭터를 레벨업시켜 더 강하게 만들 수 있습니다.\n한번 시도해보세요!',
        action: () => this.showLevelUpDemo(),
      },
      {
        title: 'Tutorial Complete!',
        message: '튜토리얼을 완료했습니다!\n이제 본격적으로 게임을 즐겨보세요.\n\n다음 목표:\n- 스토리 던전 1-2 클리어\n- 일일 퀘스트 완료',
        action: () => this.completeTutorial(),
      },
    ];
  }

  private createDialogBox(width: number, height: number): void {
    const boxWidth = Math.min(800, width - 100);
    const boxHeight = 250;
    const boxX = width / 2;
    const boxY = height - boxHeight / 2 - 50;

    this.dialogBox = this.add.container(boxX, boxY);

    // Background
    const bg = this.add.graphics();
    bg.fillStyle(COLORS.DARKER, 0.9);
    bg.fillRoundedRect(-boxWidth / 2, -boxHeight / 2, boxWidth, boxHeight, 15);
    bg.lineStyle(3, COLORS.GOLD);
    bg.strokeRoundedRect(-boxWidth / 2, -boxHeight / 2, boxWidth, boxHeight, 15);

    // Title text
    const titleText = this.add.text(0, -boxHeight / 2 + 30, '', {
      fontFamily: UI.FONTS.TITLE,
      fontSize: '28px',
      color: this.colorToCss(COLORS.GOLD),
      fontStyle: 'bold',
      align: 'center',
      wordWrap: { width: boxWidth - 40 },
    });
    titleText.setOrigin(0.5);

    // Message text
    const messageText = this.add.text(0, -boxHeight / 2 + 90, '', {
      fontFamily: UI.FONTS.BODY,
      fontSize: '20px',
      color: this.colorToCss(COLORS.TEXT_PRIMARY),
      align: 'center',
      wordWrap: { width: boxWidth - 40 },
      lineSpacing: 8,
    });
    messageText.setOrigin(0.5, 0);

    // Next button
    const nextButton = this.createButton(boxWidth / 2 - 80, boxHeight / 2 - 35, 'Next ▶', () => {
      this.nextStep();
    });

    this.dialogBox.add([bg, titleText, messageText, nextButton]);
  }

  private createSkipButton(width: number): void {
    this.skipButton = this.add.container(width - 100, 40);

    const bg = this.add.rectangle(0, 0, 120, 45, COLORS.DANGER, 0.85);
    bg.setStrokeStyle(2, COLORS.LIGHT);

    const text = this.add.text(0, 0, 'Skip ⏩', {
      fontFamily: UI.FONTS.UI,
      fontSize: '18px',
      color: this.colorToCss(COLORS.TEXT_PRIMARY),
      fontStyle: 'bold',
    });
    text.setOrigin(0.5);

    this.skipButton.add([bg, text]);
    this.skipButton.setSize(120, 45);
    this.skipButton.setInteractive({ useHandCursor: true });
    this.skipButton.on('pointerdown', () => {
      this.skipTutorial();
    });
  }

  private createButton(
    x: number,
    y: number,
    text: string,
    callback: () => void
  ): Phaser.GameObjects.Container {
    const button = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, 140, 50, COLORS.SUCCESS, 0.9);
    bg.setStrokeStyle(2, COLORS.LIGHT);

    const btnText = this.add.text(0, 0, text, {
      fontFamily: UI.FONTS.UI,
      fontSize: '20px',
      color: this.colorToCss(COLORS.TEXT_PRIMARY),
      fontStyle: 'bold',
    });
    btnText.setOrigin(0.5);

    button.add([bg, btnText]);
    button.setSize(140, 50);
    button.setInteractive({ useHandCursor: true });
    button.on('pointerdown', callback);

    return button;
  }

  private showStep(stepIndex: number): void {
    if (stepIndex >= this.tutorialSteps.length) {
      this.completeTutorial();
      return;
    }

    const step = this.tutorialSteps[stepIndex];

    // Update dialog box
    if (this.dialogBox) {
      const titleText = this.dialogBox.getAt(1) as Phaser.GameObjects.Text;
      const messageText = this.dialogBox.getAt(2) as Phaser.GameObjects.Text;

      titleText.setText(step.title);
      messageText.setText(step.message);
    }

    // Execute step action
    if (step.action) {
      this.time.delayedCall(500, () => {
        step.action?.();
      });
    }
  }

  private nextStep(): void {
    this.currentStep++;
    this.showStep(this.currentStep);
  }

  private skipTutorial(): void {
    // Mark tutorial as completed
    console.log('Tutorial skipped');
    this.completeTutorial();
  }

  // Tutorial step actions
  private showBasicUI(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Show simplified UI elements
    const uiText = this.add.text(width / 2, 100, '🎮 게임 UI 안내', {
      fontFamily: UI.FONTS.TITLE,
      fontSize: '24px',
      color: this.colorToCss(COLORS.GOLD),
      fontStyle: 'bold',
    });
    uiText.setOrigin(0.5);

    const info = this.add.text(
      width / 2,
      150,
      '상단: 유저 정보 및 재화\n중앙: 주요 메뉴\n하단: 대화창',
      {
        fontFamily: UI.FONTS.BODY,
        fontSize: '18px',
        color: this.colorToCss(COLORS.TEXT_PRIMARY),
        align: 'center',
        lineSpacing: 5,
      }
    );
    info.setOrigin(0.5);
  }

  private showNicknameInput(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // In a real implementation, this would show an HTML input
    // For now, we'll use a placeholder
    const placeholder = this.add.text(width / 2, height / 2 - 100, '[ 닉네임 입력창 ]', {
      fontFamily: UI.FONTS.UI,
      fontSize: '24px',
      color: this.colorToCss(COLORS.TEXT_MUTED),
      backgroundColor: '#222222',
      padding: { x: 20, y: 10 },
    });
    placeholder.setOrigin(0.5);
    // Auto-fill for tutorial
    this.time.delayedCall(1000, () => {
      placeholder.setText('Player_' + Math.floor(Math.random() * 9999));
      placeholder.setColor('#ffffff');
    });
  }

  private colorToCss(color: number): string {
    return Phaser.Display.Color.IntegerToColor(color).rgba;
  }

  private performFreeSummon(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Show summon portal effect
    const portal = this.add.circle(width / 2, height / 2 - 100, 100, COLORS.PRIMARY, 0.3);
    
    this.tweens.add({
      targets: portal,
      scale: { from: 0, to: 1.5 },
      alpha: { from: 1, to: 0 },
      duration: 1500,
      ease: 'Power2',
      repeat: 2,
    });

    // Simulate character appearance
    this.time.delayedCall(3000, () => {
      const charText = this.add.text(width / 2, height / 2 - 100, '⭐⭐⭐ New Character!', {
        fontSize: '28px',
        color: '#FFD700',
        fontStyle: 'bold',
      });
      charText.setOrigin(0.5);

      this.tweens.add({
        targets: charText,
        scale: { from: 0, to: 1 },
        duration: 500,
        ease: 'Back.easeOut',
      });
    });
  }

  private showPartyFormation(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const partyText = this.add.text(width / 2, height / 2 - 150, 'Party Formation', {
      fontSize: '28px',
      color: '#FFD700',
      fontStyle: 'bold',
    });
    partyText.setOrigin(0.5);

    // Show 4 character slots
    for (let i = 0; i < 4; i++) {
      const slotX = width / 2 - 200 + i * 130;
      const slotY = height / 2 - 100;

      const slot = this.add.rectangle(slotX, slotY, 100, 120, COLORS.PRIMARY, 0.3);
      slot.setStrokeStyle(2, COLORS.LIGHT);

      this.add.text(slotX, slotY, `Slot ${i + 1}`, {
        fontSize: '16px',
        color: '#ffffff',
      }).setOrigin(0.5);
    }
  }

  private startFirstBattle(): void {
    console.log('Starting first battle tutorial');
    
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const battleText = this.add.text(width / 2, height / 2 - 150, '⚔️ First Battle', {
      fontSize: '32px',
      color: '#FF4444',
      fontStyle: 'bold',
    });
    battleText.setOrigin(0.5);

    this.tweens.add({
      targets: battleText,
      scale: { from: 0, to: 1 },
      duration: 600,
      ease: 'Back.easeOut',
    });
  }

  private showBattleRewards(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const rewards = [
      { icon: '🪙', text: '+500 Gold', color: '#FFD700' },
      { icon: '⭐', text: '+100 Exp', color: '#4A90E2' },
      { icon: '💎', text: '+50 Crystal', color: '#E74C3C' },
    ];

    rewards.forEach((reward, index) => {
      const rewardText = this.add.text(
        width / 2,
        height / 2 - 150 + index * 50,
        `${reward.icon} ${reward.text}`,
        {
          fontSize: '24px',
          color: reward.color,
          fontStyle: 'bold',
        }
      );
      rewardText.setOrigin(0.5);
      rewardText.setAlpha(0);

      this.tweens.add({
        targets: rewardText,
        alpha: 1,
        y: rewardText.y + 20,
        duration: 400,
        delay: index * 200,
        ease: 'Power2',
      });
    });
  }

  private showLevelUpDemo(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const levelUp = this.add.text(width / 2, height / 2 - 150, 'LEVEL UP! 📈', {
      fontSize: '36px',
      color: '#00FF00',
      fontStyle: 'bold',
    });
    levelUp.setOrigin(0.5);

    this.tweens.add({
      targets: levelUp,
      scale: { from: 0.5, to: 1.2 },
      alpha: { from: 0, to: 1 },
      duration: 800,
      yoyo: true,
      ease: 'Sine.easeInOut',
    });

    const stats = this.add.text(
      width / 2,
      height / 2 - 80,
      'HP: 500 → 600\nATK: 100 → 120\nDEF: 80 → 95',
      {
        fontSize: '20px',
        color: '#ffffff',
        align: 'center',
        lineSpacing: 5,
      }
    );
    stats.setOrigin(0.5);
    stats.setAlpha(0);

    this.time.delayedCall(800, () => {
      this.tweens.add({
        targets: stats,
        alpha: 1,
        duration: 500,
      });
    });
  }

  private completeTutorial(): void {
    console.log('Tutorial completed!');

    // Mark tutorial as completed in game data
    // In a real implementation, this would update user profile

    // Transition to home world
    this.time.delayedCall(2000, () => {
      this.scene.start(SCENE_KEYS.HOME);
    });
  }
}

interface TutorialStep {
  title: string;
  message: string;
  action?: () => void;
}
