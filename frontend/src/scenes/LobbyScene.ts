import Phaser from 'phaser';
import { SCENE_KEYS, COLORS, UI } from '@/utils/Constants';
import { addSceneFrame } from '@/utils/SceneFrame';
import { GameDataStore } from '@/store/GameDataStore';
import { questService } from '@/services/QuestService';
import { userService } from '@/services/UserService';
import { httpClient } from '@/services/api/HttpClient';
import { ApiResponse } from '@/types';

export class LobbyScene extends Phaser.Scene {
  private gameData!: GameDataStore;

  constructor() {
    super({ key: SCENE_KEYS.LOBBY });
  }

  create(): void {
    this.gameData = GameDataStore.getInstance();

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Background
    this.createBackground(width, height);

    // Top bar (user info, currency)
    this.createTopBar(width);

    // Menu buttons
    this.createMenuButtons(width, height);

    // Character display area
    this.createCharacterDisplay(width, height);

    // News/Event banner
    this.createEventBanner(width, height);

    // Quest notification icon (bottom right)
    this.createQuestNotification(width, height);

    // Refresh profile data from server
    this.refreshProfile();

    // Claim daily login on scene load
    this.claimDailyLogin();

    addSceneFrame(this);
  }

  private createBackground(width: number, height: number): void {
    const bg = this.add.graphics();
    bg.fillGradientStyle(COLORS.BG_START, COLORS.BG_START, COLORS.BG_END, COLORS.BG_END, 1);
    bg.fillRect(0, 0, width, height);

    for (let i = 0; i < 20; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 100 + 50;
      bg.fillStyle(COLORS.BG_ACCENT, 0.08);
      bg.fillCircle(x, y, size);
    }
  }

  private createTopBar(width: number): void {
    const topBar = this.add.graphics();
    topBar.fillStyle(COLORS.BG_CARD, 0.9);
    topBar.fillRoundedRect(0, 0, width, 90, { tl: 0, tr: 0, bl: 16, br: 16 });
    topBar.lineStyle(1, COLORS.PRIMARY, 0.3);
    topBar.strokeRoundedRect(0, 0, width, 90, { tl: 0, tr: 0, bl: 16, br: 16 });

    // User info
    const username = this.gameData.getPlayerData()?.username || 'Guest';
    const level = this.gameData.getPlayerData()?.level || 1;

    const avatar = this.add.circle(50, 35, 22, COLORS.PRIMARY_LIGHT);
    avatar.setStrokeStyle(2, COLORS.GOLD);

    const avatarText = this.add.text(50, 35, username.charAt(0).toUpperCase(), {
      fontFamily: UI.FONTS.TITLE,
      fontSize: '18px',
      color: this.colorToCss(COLORS.TEXT_PRIMARY),
      fontStyle: 'bold',
    });
    avatarText.setOrigin(0.5);

    this.add.text(82, 24, username, {
      fontFamily: UI.FONTS.UI,
      fontSize: '20px',
      color: this.colorToCss(COLORS.TEXT_PRIMARY),
      fontStyle: 'bold',
    });

    // Level badge
    const levelBadge = this.add.graphics();
    levelBadge.fillStyle(COLORS.WARNING, 1);
    levelBadge.fillRoundedRect(80, 44, 56, 22, 11);

    this.add.text(108, 55, `Lv.${level}`, {
      fontFamily: UI.FONTS.UI,
      fontSize: '13px',
      color: this.colorToCss(COLORS.TEXT_PRIMARY),
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Currency display - positioned to avoid settings button overlap
    const crystal = this.gameData.getPlayerData()?.crystals || 0;
    const gold = this.gameData.getPlayerData()?.gold || 0;
    const energy = this.gameData.getPlayerData()?.energy || 100;
    const maxEnergy = this.gameData.getPlayerData()?.maxEnergy || 100;

    // Currencies in a row, right-aligned but leaving space for settings button
    const currencyStartX = width - 440;
    this.createCurrencyDisplay(currencyStartX, 28, '💎', crystal, COLORS.PRIMARY_LIGHT);
    this.createCurrencyDisplay(currencyStartX + 130, 28, '🪙', gold, COLORS.WARNING);
    this.createCurrencyDisplay(currencyStartX + 260, 28, '⚡', energy, COLORS.SUCCESS);

    // Energy progress bar - below user info, not overlapping currencies
    const progressBg = this.add.graphics();
    progressBg.fillStyle(COLORS.DARK, 0.8);
    progressBg.fillRoundedRect(20, 70, 200, 14, 7);

    const progress = this.add.graphics();
    progress.fillStyle(COLORS.SUCCESS, 1);
    const progressWidth = Math.min(1, energy / maxEnergy) * 196;
    progress.fillRoundedRect(22, 72, progressWidth, 10, 5);

    this.add.text(120, 77, `${energy}/${maxEnergy}`, {
      fontFamily: UI.FONTS.UI,
      fontSize: '10px',
      color: this.colorToCss(COLORS.TEXT_PRIMARY),
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Settings button (top right, clear of currencies)
    this.createSettingsButton(width - 50, 35);
  }

  private createCurrencyDisplay(x: number, y: number, icon: string, value: number, glowColor: number): void {
    const bg = this.add.graphics();
    bg.fillStyle(COLORS.DARK, 0.6);
    bg.fillRoundedRect(x - 50, y - 14, 110, 32, 8);
    bg.lineStyle(1, glowColor, 0.4);
    bg.strokeRoundedRect(x - 50, y - 14, 110, 32, 8);

    const iconText = this.add.text(x - 35, y, icon, {
      fontSize: '18px',
    });
    iconText.setOrigin(0.5);

    this.add.text(x + 10, y, value.toLocaleString(), {
      fontFamily: UI.FONTS.UI,
      fontSize: '15px',
      color: this.colorToCss(COLORS.TEXT_PRIMARY),
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);
  }

  private createSettingsButton(x: number, y: number): void {
    const button = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(COLORS.INFO, 0.8);
    bg.fillCircle(0, 0, 24);
    bg.lineStyle(2, COLORS.INFO_LIGHT, 0.6);
    bg.strokeCircle(0, 0, 24);

    const icon = this.add.text(0, 0, '⚙️', {
      fontSize: '24px',
    });
    icon.setOrigin(0.5);

    button.add([bg, icon]);
    button.setSize(48, 48);
    button.setInteractive({ useHandCursor: true });

    button.on('pointerover', () => {
      this.tweens.add({
        targets: button,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 150,
      });
    });

    button.on('pointerout', () => {
      this.tweens.add({
        targets: button,
        scaleX: 1,
        scaleY: 1,
        duration: 150,
      });
    });

    button.on('pointerdown', () => {
      this.scene.start(SCENE_KEYS.SETTINGS);
    });
  }

  private createMenuButtons(width: number, height: number): void {
    const buttonData = [
      { text: 'Dungeon', scene: SCENE_KEYS.DUNGEON_SELECT, icon: '🏰', color: COLORS.DANGER },
      { text: 'Party', scene: SCENE_KEYS.PARTY, icon: '⚔️', color: COLORS.WARNING },
      { text: 'Summon', scene: SCENE_KEYS.SUMMON, icon: '🎲', color: COLORS.SECONDARY },
      { text: 'Characters', scene: SCENE_KEYS.CHARACTER_LIST, icon: '👥', color: COLORS.PRIMARY },
      { text: 'Shop', scene: SCENE_KEYS.SHOP, icon: '🛒', color: COLORS.SUCCESS },
      { text: 'Guild', scene: SCENE_KEYS.GUILD, icon: '🛡️', color: COLORS.INFO },
      { text: 'Inventory', scene: SCENE_KEYS.INVENTORY, icon: '🎒', color: COLORS.PRIMARY },
    ];

    const panelX = 30;
    const panelY = 120;
    const panelWidth = 300;
    const panelHeight = height - 190;

    const panel = this.add.graphics();
    panel.fillStyle(COLORS.BG_CARD, 0.85);
    panel.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 20);
    panel.lineStyle(1, COLORS.GOLD, 0.3);
    panel.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 20);

    const startX = panelX + 30;
    const startY = panelY + 30;
    const buttonSpacingY = 68;

    buttonData.forEach((data, index) => {
      const x = startX;
      const y = startY + index * buttonSpacingY;

      this.createMenuButton(x, y, data.text, data.icon, data.color, () => {
        this.scene.start(data.scene);
      });
    });
  }

  private createMenuButton(
    x: number,
    y: number,
    text: string,
    icon: string,
    color: number,
    callback: () => void
  ): void {
    const button = this.add.container(x, y);

    // Shadow layer
    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.25);
    shadow.fillRoundedRect(3, 3, 240, 58, 16);

    // Button background (simplified: no highlight + inner border)
    const bg = this.add.graphics();
    bg.fillStyle(color, 1);
    bg.fillRoundedRect(0, 0, 240, 58, 16);
    bg.lineStyle(2, COLORS.GOLD, 0.5);
    bg.strokeRoundedRect(0, 0, 240, 58, 16);

    // Icon
    const iconText = this.add.text(32, 29, icon, {
      fontSize: '26px',
    });
    iconText.setOrigin(0.5);

    // Button text
    const buttonText = this.add.text(120, 29, text, {
      fontFamily: UI.FONTS.UI,
      fontSize: '18px',
      color: this.colorToCss(COLORS.TEXT_PRIMARY),
      fontStyle: 'bold',
      shadow: {
        offsetX: 1,
        offsetY: 1,
        color: '#000000',
        blur: 3,
        fill: true,
      },
    });
    buttonText.setOrigin(0.5);

    button.add([shadow, bg, iconText, buttonText]);
    button.setSize(240, 58);
    button.setInteractive({ useHandCursor: true });

    // No floating animation or icon pulse (removed for stability)

    // Hover effects (reduced scale, no glow graphics leak)
    button.on('pointerover', () => {
      this.tweens.add({
        targets: button,
        scaleX: 1.04,
        scaleY: 1.04,
        duration: 200,
        ease: 'Back.easeOut',
      });
    });

    button.on('pointerout', () => {
      this.tweens.add({
        targets: button,
        scaleX: 1,
        scaleY: 1,
        duration: 200,
      });
    });

    button.on('pointerdown', () => {
      this.tweens.add({
        targets: button,
        scaleX: 0.95,
        scaleY: 0.95,
        duration: 100,
        yoyo: true,
        ease: 'Power2',
        onComplete: callback,
      });
    });
  }

  private createCharacterDisplay(width: number, height: number): void {
    const charX = width - 300;
    const charY = height / 2 + 10;

    const platform = this.add.graphics();
    platform.fillStyle(COLORS.PRIMARY, 0.15);
    platform.fillEllipse(charX, charY + 150, 180, 36);

    const character = this.add.sprite(charX, charY, 'character-placeholder');
    character.setScale(2.8);
    character.setTint(COLORS.PRIMARY_LIGHT);

    // Character info panel
    const infoBg = this.add.graphics();
    infoBg.fillStyle(COLORS.BG_CARD, 0.9);
    infoBg.fillRoundedRect(charX - 110, charY + 145, 220, 55, 16);
    infoBg.lineStyle(1, COLORS.PRIMARY_LIGHT, 0.3);
    infoBg.strokeRoundedRect(charX - 110, charY + 145, 220, 55, 16);

    const userChars = this.gameData.getUserCharacters?.() || [];
    const leader = userChars.length > 0 ? userChars[0] : null;
    const leaderName = leader?.character?.name || 'No Character';
    const leaderPower = leader
      ? leader.currentHp + leader.currentAtk * 5 + leader.currentDef * 3 + leader.currentSpd * 2
      : 0;

    this.add.text(charX, charY + 160, leaderName, {
      fontFamily: UI.FONTS.UI,
      fontSize: '16px',
      color: this.colorToCss(COLORS.TEXT_PRIMARY),
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(charX, charY + 183, `Power: ${leaderPower}`, {
      fontFamily: UI.FONTS.UI,
      fontSize: '13px',
      color: this.colorToCss(COLORS.WARNING_LIGHT),
      fontStyle: 'bold',
    }).setOrigin(0.5);
  }

  private createEventBanner(width: number, height: number): void {
    const bannerY = 100;
    const bannerX = 370;
    // Shrink banner width to avoid overlapping character display area
    const bannerW = Math.min(width - bannerX - 340, 560);

    const banner = this.add.graphics();
    banner.fillStyle(COLORS.WARNING, 0.2);
    banner.fillRoundedRect(bannerX, bannerY, bannerW, 100, 16);
    banner.lineStyle(2, COLORS.WARNING_LIGHT, 0.5);
    banner.strokeRoundedRect(bannerX, bannerY, bannerW, 100, 16);

    const bannerCenterX = bannerX + bannerW / 2;

    const icon = this.add.text(bannerX + 35, bannerY + 50, '🎉', {
      fontSize: '40px',
    });
    icon.setOrigin(0.5);

    const eventText = this.add.text(bannerCenterX, bannerY + 30, 'Special Event!', {
      fontFamily: UI.FONTS.TITLE,
      fontSize: '24px',
      color: this.colorToCss(COLORS.TEXT_PRIMARY),
      fontStyle: 'bold',
    });
    eventText.setOrigin(0.5);

    const eventDesc = this.add.text(
      bannerCenterX,
      bannerY + 65,
      'Limited time 5-star character summon event!',
      {
        fontFamily: UI.FONTS.BODY,
        fontSize: '14px',
        color: this.colorToCss(COLORS.TEXT_SECONDARY),
        wordWrap: { width: bannerW - 80 },
        align: 'center',
      }
    );
    eventDesc.setOrigin(0.5);

    // "NEW" badge
    const newBadge = this.add.graphics();
    newBadge.fillStyle(COLORS.DANGER, 1);
    newBadge.fillRoundedRect(bannerX + bannerW - 70, bannerY + 8, 60, 24, 12);

    this.add.text(bannerX + bannerW - 40, bannerY + 20, 'NEW', {
      fontFamily: UI.FONTS.UI,
      fontSize: '14px',
      color: this.colorToCss(COLORS.TEXT_PRIMARY),
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const bannerZone = this.add.zone(bannerX, bannerY, bannerW, 100).setOrigin(0);
    bannerZone.setInteractive({ useHandCursor: true });
    bannerZone.on('pointerdown', () => {
      this.scene.start(SCENE_KEYS.SUMMON);
    });
  }

  private createQuestNotification(width: number, height: number): void {
    const btnX = width - 80;
    const btnY = height - 80;

    const button = this.add.container(btnX, btnY);

    const bg = this.add.graphics();
    bg.fillStyle(COLORS.WARNING, 0.9);
    bg.fillCircle(0, 0, 30);
    bg.lineStyle(2, COLORS.GOLD, 0.6);
    bg.strokeCircle(0, 0, 30);

    const icon = this.add.text(0, 0, '📋', { fontSize: '26px' });
    icon.setOrigin(0.5);

    button.add([bg, icon]);
    button.setSize(60, 60);
    button.setInteractive({ useHandCursor: true });

    const badge = this.add.circle(16, -16, 9, COLORS.DANGER);
    badge.setStrokeStyle(2, COLORS.LIGHT);
    const badgeText = this.add.text(16, -16, '!', {
      fontSize: '11px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    button.add([badge, badgeText]);

    button.on('pointerdown', () => {
      this.showQuestPanel();
    });

    this.checkQuests(badge, badgeText);
  }

  private async checkQuests(badge: Phaser.GameObjects.Arc, badgeText: Phaser.GameObjects.Text): Promise<void> {
    try {
      const quests = await questService.getDailyQuests();
      const hasUnclaimed = quests.some(q => q.isCompleted && !q.isClaimed);
      badge.setVisible(hasUnclaimed);
      badgeText.setVisible(hasUnclaimed);
    } catch {
      badge.setVisible(false);
      badgeText.setVisible(false);
    }
  }

  private async showQuestPanel(): Promise<void> {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const overlay = this.add.container(0, 0);
    overlay.setDepth(100);

    const dim = this.add.rectangle(0, 0, width, height, 0x000000, 0.6);
    dim.setOrigin(0);
    dim.setInteractive();
    overlay.add(dim);

    const panelW = 500;
    const panelH = 400;
    const panel = this.add.graphics();
    panel.fillStyle(COLORS.DARK, 0.95);
    panel.fillRoundedRect(width / 2 - panelW / 2, height / 2 - panelH / 2, panelW, panelH, 20);
    panel.lineStyle(2, COLORS.WARNING);
    panel.strokeRoundedRect(width / 2 - panelW / 2, height / 2 - panelH / 2, panelW, panelH, 20);
    overlay.add(panel);

    const titleText = this.add.text(width / 2, height / 2 - panelH / 2 + 30, 'Daily Quests', {
      fontFamily: UI.FONTS.TITLE,
      fontSize: '24px',
      color: this.colorToCss(COLORS.TEXT_PRIMARY),
      fontStyle: 'bold',
    }).setOrigin(0.5);
    overlay.add(titleText);

    try {
      const quests = await questService.getDailyQuests();
      const startY = height / 2 - panelH / 2 + 70;

      quests.forEach((quest, i) => {
        const y = startY + i * 70;

        const questTitle = this.add.text(width / 2 - panelW / 2 + 30, y, quest.title, {
          fontFamily: UI.FONTS.UI,
          fontSize: '16px',
          color: this.colorToCss(COLORS.TEXT_PRIMARY),
        });
        overlay.add(questTitle);

        const barX = width / 2 - panelW / 2 + 30;
        const barY = y + 24;
        const barW = 200;
        const barH = 12;
        const barBg = this.add.rectangle(barX + barW / 2, barY + barH / 2, barW, barH, COLORS.DARK).setStrokeStyle(1, COLORS.BG_PANEL);
        overlay.add(barBg);
        const fillW = Math.min(1, quest.progress / quest.goal) * barW;
        if (fillW > 0) {
          const barFill = this.add.rectangle(barX + fillW / 2, barY + barH / 2, fillW, barH, quest.isCompleted ? COLORS.SUCCESS : COLORS.SECONDARY);
          overlay.add(barFill);
        }

        const rewardHint = quest.rewards?.[0];
        const rewardIcon = rewardHint?.name === 'crystal' ? '💎' : '🪙';
        const rewardStr = rewardHint ? `${rewardIcon}${rewardHint.quantity}` : '';

        const progressStr = `${quest.progress}/${quest.goal}  ${rewardStr}`;
        const progressText = this.add.text(width / 2 + 60, y, progressStr, {
          fontFamily: UI.FONTS.UI,
          fontSize: '14px',
          color: quest.isCompleted ? this.colorToCss(COLORS.SUCCESS) : this.colorToCss(COLORS.TEXT_SECONDARY),
        });
        overlay.add(progressText);

        if (quest.isCompleted && !quest.isClaimed) {
          const claimBtn = this.add.text(width / 2 + 160, y, 'Claim', {
            fontFamily: UI.FONTS.UI,
            fontSize: '14px',
            color: this.colorToCss(COLORS.WARNING),
            fontStyle: 'bold',
          });
          claimBtn.setInteractive({ useHandCursor: true });
          claimBtn.on('pointerdown', async () => {
            try {
              await questService.claimReward(String(quest.id));
              claimBtn.setText('Claimed!');
              claimBtn.setColor(this.colorToCss(COLORS.SUCCESS));
              claimBtn.removeInteractive();
            } catch {
              claimBtn.setText('Failed');
            }
          });
          overlay.add(claimBtn);
        } else if (quest.isClaimed) {
          const claimed = this.add.text(width / 2 + 160, y, 'Done', {
            fontFamily: UI.FONTS.UI,
            fontSize: '14px',
            color: this.colorToCss(COLORS.TEXT_MUTED),
          });
          overlay.add(claimed);
        }
      });
    } catch {
      const errorText = this.add.text(width / 2, height / 2, 'Failed to load quests', {
        fontSize: '16px',
        color: '#ff4444',
      }).setOrigin(0.5);
      overlay.add(errorText);
    }

    const closeBtn = this.add.container(width / 2, height / 2 + panelH / 2 - 30);
    const closeBg = this.add.rectangle(0, 0, 120, 36, COLORS.INFO);
    closeBg.setStrokeStyle(2, COLORS.LIGHT);
    const closeText = this.add.text(0, 0, 'Close', {
      fontFamily: UI.FONTS.UI,
      fontSize: '16px',
      color: '#ffffff',
    }).setOrigin(0.5);
    closeBtn.add([closeBg, closeText]);
    closeBtn.setSize(120, 36);
    closeBtn.setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => overlay.destroy());
    overlay.add(closeBtn);
  }

  private async refreshProfile(): Promise<void> {
    try {
      const profile = await userService.getProfile();
      if (profile) {
        this.gameData.setPlayerData(profile);
      }
    } catch (error) {
      console.error('Profile refresh failed:', error);
    }
  }

  private async claimDailyLogin(): Promise<void> {
    try {
      const response = await httpClient.get<ApiResponse<{ claimed: boolean; rewards: Array<{ type: string; name: string; quantity: number }>; consecutiveDays: number }>>('/login/daily');
      if (response.data?.claimed && response.data.rewards.length > 0) {
        const rewardStr = response.data.rewards.map(r => `${r.name}: ${r.quantity}`).join(', ');
        const width = this.cameras.main.width;
        const toast = this.add.text(width / 2, 650, `Daily Login Reward! Day ${response.data.consecutiveDays}: ${rewardStr}`, {
          fontSize: '16px',
          color: '#ffcc00',
          backgroundColor: '#000000aa',
          padding: { left: 12, right: 12, top: 6, bottom: 6 },
        });
        toast.setOrigin(0.5);
        toast.setDepth(50);
        this.tweens.add({
          targets: toast,
          alpha: 0,
          y: 620,
          duration: 3000,
          delay: 2000,
          onComplete: () => toast.destroy(),
        });
      }
    } catch {
      // Silently ignore
    }
  }

  private colorToCss(color: number): string {
    return Phaser.Display.Color.IntegerToColor(color).rgba;
  }
}
