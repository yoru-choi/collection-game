import Phaser from 'phaser';
import { SCENE_KEYS, COLORS, UI } from '@/utils/Constants';
import { addSceneFrame } from '@/utils/SceneFrame';
import { shopService } from '@/services/ShopService';
import { userService } from '@/services/UserService';
import { GameDataStore } from '@/store/GameDataStore';
import { ShopItem } from '@/types';

type Tab = 'gold' | 'crystal';

/** 아이템 유형별 이모지 아이콘 */
const ITEM_ICONS: Record<string, string> = {
  material: '🧪',
  energy: '⚡',
  package: '📦',
  currency: '💎',
  rune: '💍',
};

/** 아이템 유형별 배경 색상 */
const ITEM_BG_COLORS: Record<string, number> = {
  material: 0x3a5a4a,
  energy: 0x2a4a5a,
  package: 0x4a3a5a,
  currency: 0x4a4a2a,
  rune: 0x4a2a3a,
};

export class ShopScene extends Phaser.Scene {
  private gameData!: GameDataStore;
  private items: ShopItem[] = [];
  private currentTab: Tab = 'gold';

  // UI 참조
  private gridContainer?: Phaser.GameObjects.Container;
  private statusText?: Phaser.GameObjects.Text;
  private goldText?: Phaser.GameObjects.Text;
  private crystalText?: Phaser.GameObjects.Text;
  private resetTimerText?: Phaser.GameObjects.Text;
  private tabContainers: Record<Tab, Phaser.GameObjects.Container | null> = { gold: null, crystal: null };

  // 구매 모달
  private purchaseModal?: Phaser.GameObjects.Container;
  private purchaseItem?: ShopItem;

  // 타이머 갱신
  private timerEvent?: Phaser.Time.TimerEvent;

  constructor() {
    super({ key: SCENE_KEYS.SHOP });
  }

  create(): void {
    this.gameData = GameDataStore.getInstance();

    const { width, height } = this.cameras.main;

    // ── 배경 ─────────────────────────────────────────────────────────────
    const bg = this.add.graphics();
    bg.fillGradientStyle(COLORS.BG_START, COLORS.BG_START, COLORS.BG_END, COLORS.BG_END, 1);
    bg.fillRect(0, 0, width, height);

    // ── 상단 바 ───────────────────────────────────────────────────────────
    this.createTopBar(width);

    // ── 탭 ───────────────────────────────────────────────────────────────
    this.createTabs(width);

    // ── 일일 리셋 타이머 ──────────────────────────────────────────────────
    this.resetTimerText = this.add.text(width / 2, 125, '', {
      fontFamily: UI.FONTS.UI,
      fontSize: '13px',
      color: this.colorToCss(COLORS.TEXT_MUTED),
    }).setOrigin(0.5);
    this.startResetTimer();

    // ── 아이템 그리드 영역 ────────────────────────────────────────────────
    this.gridContainer = this.add.container(0, 0);

    this.statusText = this.add.text(width / 2, height / 2, 'Loading...', {
      fontFamily: UI.FONTS.UI,
      fontSize: '18px',
      color: this.colorToCss(COLORS.TEXT_SECONDARY),
    }).setOrigin(0.5);

    // ── 뒤로 버튼 ─────────────────────────────────────────────────────────
    this.createBackButton();

    // ── 로드 ──────────────────────────────────────────────────────────────
    this.loadItems();

    addSceneFrame(this);
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  상단 바
  // ═══════════════════════════════════════════════════════════════════════
  private createTopBar(width: number): void {
    const topBg = this.add.graphics();
    topBg.fillStyle(COLORS.DARKER, 0.95);
    topBg.fillRoundedRect(0, 0, width, 70, { tl: 0, tr: 0, bl: 14, br: 14 });
    topBg.lineStyle(2, COLORS.PRIMARY, 0.5);
    topBg.strokeRoundedRect(0, 0, width, 70, { tl: 0, tr: 0, bl: 14, br: 14 });

    this.add.text(22, 35, '🛒 Shop', {
      fontFamily: UI.FONTS.TITLE,
      fontSize: '28px',
      color: this.colorToCss(COLORS.TEXT_PRIMARY),
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    const crystal = this.gameData.getPlayerData()?.crystals ?? 0;
    const gold = this.gameData.getPlayerData()?.gold ?? 0;

    this.crystalText = this.add.text(width - 20, 20, `💎 ${crystal.toLocaleString()}`, {
      fontFamily: UI.FONTS.UI,
      fontSize: '18px',
      color: this.colorToCss(COLORS.SECONDARY_LIGHT),
      fontStyle: 'bold',
    }).setOrigin(1, 0.5);

    this.goldText = this.add.text(width - 20, 50, `🪙 ${gold.toLocaleString()}`, {
      fontFamily: UI.FONTS.UI,
      fontSize: '18px',
      color: this.colorToCss(COLORS.GOLD),
      fontStyle: 'bold',
    }).setOrigin(1, 0.5);
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  탭
  // ═══════════════════════════════════════════════════════════════════════
  private createTabs(width: number): void {
    const tabs: { label: string; value: Tab; icon: string }[] = [
      { label: 'Gold Shop', value: 'gold', icon: '🪙' },
      { label: 'Crystal Shop', value: 'crystal', icon: '💎' },
    ];

    const tabW = 200;
    const startX = width / 2 - (tabs.length * (tabW + 8)) / 2;

    tabs.forEach((tab, i) => {
      const x = startX + i * (tabW + 8);
      const container = this.add.container(x, 80);

      const active = this.currentTab === tab.value;
      const tabBg = this.add.graphics();
      this.drawTabBg(tabBg, tabW, 36, active);

      const label = this.add.text(tabW / 2, 18, `${tab.icon} ${tab.label}`, {
        fontFamily: UI.FONTS.UI,
        fontSize: '15px',
        color: active
          ? this.colorToCss(COLORS.TEXT_PRIMARY)
          : this.colorToCss(COLORS.TEXT_MUTED),
        fontStyle: active ? 'bold' : 'normal',
      }).setOrigin(0.5);

      container.add([tabBg, label]);
      container.setSize(tabW, 36);
      container.setInteractive({ useHandCursor: true });
      container.on('pointerdown', () => {
        if (this.currentTab !== tab.value) {
          this.currentTab = tab.value;
          this.scene.restart();
        }
      });

      this.tabContainers[tab.value] = container;
    });
  }

  private drawTabBg(g: Phaser.GameObjects.Graphics, w: number, h: number, active: boolean): void {
    g.clear();
    if (active) {
      g.fillStyle(COLORS.PRIMARY, 0.9);
      g.fillRoundedRect(0, 0, w, h, { tl: 8, tr: 8, bl: 0, br: 0 });
      g.lineStyle(2, COLORS.GOLD, 1);
      g.strokeRoundedRect(0, 0, w, h, { tl: 8, tr: 8, bl: 0, br: 0 });
    } else {
      g.fillStyle(COLORS.DARK, 0.7);
      g.fillRoundedRect(0, 0, w, h, { tl: 8, tr: 8, bl: 0, br: 0 });
      g.lineStyle(1, COLORS.SECONDARY, 0.3);
      g.strokeRoundedRect(0, 0, w, h, { tl: 8, tr: 8, bl: 0, br: 0 });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  일일 리셋 타이머
  // ═══════════════════════════════════════════════════════════════════════
  private startResetTimer(): void {
    this.updateResetTimer();
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: this.updateResetTimer,
      callbackScope: this,
    });
  }

  private updateResetTimer(): void {
    if (!this.resetTimerText) return;
    const now = new Date();
    const reset = new Date(now);
    reset.setUTCHours(0, 0, 0, 0);
    reset.setDate(reset.getDate() + 1);
    const diff = reset.getTime() - now.getTime();
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    this.resetTimerText.setText(
      `🔄 Daily reset in ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  아이템 그리드 렌더링
  // ═══════════════════════════════════════════════════════════════════════
  private async loadItems(): Promise<void> {
    try {
      this.items = await shopService.getItems(this.currentTab);
      if (this.statusText) {
        this.statusText.setVisible(false);
      }
      this.renderGrid();
    } catch (err) {
      if (this.statusText) {
        this.statusText.setText('Failed to load shop items.');
      }
      console.error('ShopScene load error:', err);
    }
  }

  private renderGrid(): void {
    if (!this.gridContainer) return;
    this.gridContainer.removeAll(true);

    const { width } = this.cameras.main;

    const COLS = 4;
    const GAP_X = 16;
    const GAP_Y = 16;
    const contentWidth = 1220; // width - 60 (30px margins)
    const CARD_W = Math.floor((contentWidth - (COLS - 1) * GAP_X) / COLS); // ~293px
    const CARD_H = 168;
    const startY = 148;
    const totalW = COLS * CARD_W + (COLS - 1) * GAP_X;
    const startX = (width - totalW) / 2;

    if (this.items.length === 0) {
      const empty = this.add.text(width / 2, 400, 'No items available.', {
        fontFamily: UI.FONTS.UI,
        fontSize: '18px',
        color: this.colorToCss(COLORS.TEXT_MUTED),
      }).setOrigin(0.5);
      this.gridContainer.add(empty);
      return;
    }

    this.items.forEach((item, idx) => {
      const col = idx % COLS;
      const row = Math.floor(idx / COLS);
      const x = startX + col * (CARD_W + GAP_X);
      const y = startY + row * (CARD_H + GAP_Y);
      const card = this.buildItemCard(item, CARD_W, CARD_H);
      card.setPosition(x, y);
      this.gridContainer!.add(card);
    });
  }

  private buildItemCard(item: ShopItem, w: number, h: number): Phaser.GameObjects.Container {
    const container = this.add.container(0, 0);

    const isSoldOut = typeof item.dailyLimit === 'number'
      && typeof item.dailyPurchased === 'number'
      && item.dailyPurchased >= item.dailyLimit;

    const bgColor = ITEM_BG_COLORS[item.type] ?? COLORS.DARK;

    // 카드 배경
    const cardBg = this.add.graphics();
    cardBg.fillStyle(bgColor, isSoldOut ? 0.4 : 0.9);
    cardBg.fillRoundedRect(0, 0, w, h, 16);
    cardBg.lineStyle(2, isSoldOut ? COLORS.TEXT_MUTED : COLORS.PRIMARY, isSoldOut ? 0.3 : 0.6);
    cardBg.strokeRoundedRect(0, 0, w, h, 16);

    // 아이콘 배경 원
    const iconCircle = this.add.graphics();
    iconCircle.fillStyle(0x000000, 0.3);
    iconCircle.fillCircle(44, h / 2, 34);

    // 아이템 아이콘
    const icon = this.add.text(44, h / 2, ITEM_ICONS[item.type] ?? '📦', {
      fontSize: '32px',
    }).setOrigin(0.5).setAlpha(isSoldOut ? 0.4 : 1);

    // 이름
    const nameText = this.add.text(88, 16, item.name, {
      fontFamily: UI.FONTS.UI,
      fontSize: '16px',
      color: isSoldOut
        ? this.colorToCss(COLORS.TEXT_MUTED)
        : this.colorToCss(COLORS.TEXT_PRIMARY),
      fontStyle: 'bold',
      wordWrap: { width: w - 100 },
    });

    // 설명
    if (item.description) {
      this.add.text(88, 42, item.description, {
        fontFamily: UI.FONTS.UI,
        fontSize: '12px',
        color: this.colorToCss(COLORS.TEXT_MUTED),
        wordWrap: { width: w - 100 },
      });
    }

    // 가격
    const currencyIcon = item.currencyType === 'crystal' ? '💎' : '🪙';
    const priceText = this.add.text(88, h - 50, `${currencyIcon} ${item.price.toLocaleString()}`, {
      fontFamily: UI.FONTS.UI,
      fontSize: '18px',
      color: item.currencyType === 'crystal'
        ? this.colorToCss(COLORS.SECONDARY_LIGHT)
        : this.colorToCss(COLORS.GOLD),
      fontStyle: 'bold',
    });

    // 일일 한도 배지 & 진행 바
    if (typeof item.dailyLimit === 'number') {
      const purchased = item.dailyPurchased ?? 0;
      const limitLabel = this.add.text(w - 12, 10, `${purchased}/${item.dailyLimit}`, {
        fontFamily: UI.FONTS.UI,
        fontSize: '11px',
        color: isSoldOut
          ? this.colorToCss(COLORS.DANGER)
          : this.colorToCss(COLORS.TEXT_MUTED),
        fontStyle: isSoldOut ? 'bold' : 'normal',
      }).setOrigin(1, 0);
      container.add(limitLabel);

      const barW = w - 24;
      const barX = 12;
      const barY = h - 18;
      const progressBg2 = this.add.graphics();
      progressBg2.fillStyle(0x000000, 0.4);
      progressBg2.fillRoundedRect(barX, barY, barW, 8, 4);
      const filled = item.dailyLimit > 0 ? Math.min(purchased / item.dailyLimit, 1) : 0;
      const progressFg = this.add.graphics();
      progressFg.fillStyle(isSoldOut ? COLORS.DANGER : COLORS.SUCCESS, 0.8);
      progressFg.fillRoundedRect(barX, barY, barW * filled, 8, 4);
      container.add([progressBg2, progressFg]);
    }

    // 구매 버튼
    const canBuy = !isSoldOut;
    const btnBg = this.add.graphics();
    const btnX = w - 76;
    const btnY = h - 50;
    const btnW = 68;
    const btnH = 32;
    btnBg.fillStyle(canBuy ? COLORS.SUCCESS : COLORS.DARK, canBuy ? 0.9 : 0.4);
    btnBg.fillRoundedRect(btnX, btnY, btnW, btnH, 6);
    btnBg.lineStyle(2, canBuy ? COLORS.SUCCESS : COLORS.TEXT_MUTED, canBuy ? 0.8 : 0.3);
    btnBg.strokeRoundedRect(btnX, btnY, btnW, btnH, 6);

    const btnLabel = this.add.text(btnX + btnW / 2, btnY + btnH / 2, isSoldOut ? 'Sold' : 'Buy', {
      fontFamily: UI.FONTS.UI,
      fontSize: '14px',
      color: canBuy ? '#ffffff' : this.colorToCss(COLORS.TEXT_MUTED),
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Sold Out 오버레이
    if (isSoldOut) {
      const soldOverlay = this.add.graphics();
      soldOverlay.fillStyle(0x000000, 0.5);
      soldOverlay.fillRoundedRect(0, 0, w, h, 16);
      const soldText = this.add.text(w / 2, h / 2, 'SOLD OUT', {
        fontFamily: UI.FONTS.TITLE,
        fontSize: '22px',
        color: '#ff6666',
        fontStyle: 'bold',
      }).setOrigin(0.5).setAngle(-15);
      container.add([soldOverlay, soldText]);
    }

    container.add([cardBg, iconCircle, icon, nameText, priceText, btnBg, btnLabel]);
    container.setSize(w, h);

    if (canBuy) {
      container.setInteractive({ useHandCursor: true });
      container.on('pointerover', () => {
        cardBg.clear();
        cardBg.fillStyle(bgColor, 1);
        cardBg.fillRoundedRect(0, 0, w, h, 16);
        cardBg.lineStyle(3, COLORS.GOLD, 1);
        cardBg.strokeRoundedRect(0, 0, w, h, 16);
      });
      container.on('pointerout', () => {
        cardBg.clear();
        cardBg.fillStyle(bgColor, 0.9);
        cardBg.fillRoundedRect(0, 0, w, h, 16);
        cardBg.lineStyle(2, COLORS.PRIMARY, 0.6);
        cardBg.strokeRoundedRect(0, 0, w, h, 16);
      });
      container.on('pointerdown', () => this.showPurchaseModal(item));
    }

    return container;
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  구매 모달
  // ═══════════════════════════════════════════════════════════════════════
  private showPurchaseModal(item: ShopItem): void {
    this.closePurchaseModal();

    const { width, height } = this.cameras.main;
    this.purchaseItem = item;

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.65);
    overlay.fillRect(0, 0, width, height);

    const modalW = 460;
    const modalH = 300;
    const modalX = (width - modalW) / 2;
    const modalY = (height - modalH) / 2;

    const modalBg = this.add.graphics();
    modalBg.fillStyle(COLORS.DARKER, 0.98);
    modalBg.fillRoundedRect(modalX, modalY, modalW, modalH, 16);
    modalBg.lineStyle(3, COLORS.PRIMARY, 0.9);
    modalBg.strokeRoundedRect(modalX, modalY, modalW, modalH, 16);

    const titleText = this.add.text(width / 2, modalY + 32, `Purchase ${item.name}`, {
      fontFamily: UI.FONTS.TITLE,
      fontSize: '22px',
      color: this.colorToCss(COLORS.TEXT_PRIMARY),
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const currencyIcon = item.currencyType === 'crystal' ? '💎' : '🪙';
    const priceLabel = this.add.text(width / 2, modalY + 68, `${currencyIcon} ${item.price.toLocaleString()} each`, {
      fontFamily: UI.FONTS.UI,
      fontSize: '18px',
      color: item.currencyType === 'crystal'
        ? this.colorToCss(COLORS.SECONDARY_LIGHT)
        : this.colorToCss(COLORS.GOLD),
    }).setOrigin(0.5);

    let qty = 1;
    const maxQty = typeof item.dailyLimit === 'number'
      ? (item.dailyLimit - (item.dailyPurchased ?? 0))
      : 99;

    const qtyText = this.add.text(width / 2, modalY + 128, `Quantity: ${qty}`, {
      fontFamily: UI.FONTS.UI, fontSize: '20px',
      color: this.colorToCss(COLORS.TEXT_PRIMARY), fontStyle: 'bold',
    }).setOrigin(0.5);

    const totalText = this.add.text(width / 2, modalY + 162, `Total: ${currencyIcon} ${(item.price * qty).toLocaleString()}`, {
      fontFamily: UI.FONTS.UI, fontSize: '16px',
      color: this.colorToCss(COLORS.TEXT_SECONDARY),
    }).setOrigin(0.5);

    const updateQty = (delta: number) => {
      qty = Math.max(1, Math.min(maxQty, qty + delta));
      qtyText.setText(`Quantity: ${qty}`);
      totalText.setText(`Total: ${currencyIcon} ${(item.price * qty).toLocaleString()}`);
    };

    // − ボタン
    const minusBtn = this.add.container(width / 2 - 100, modalY + 145);
    const minusBg = this.add.graphics();
    minusBg.fillStyle(COLORS.DARK, 0.9);
    minusBg.fillRoundedRect(-18, -18, 36, 36, 6);
    minusBg.lineStyle(2, COLORS.LIGHT, 0.5);
    minusBg.strokeRoundedRect(-18, -18, 36, 36, 6);
    const minusLabel = this.add.text(0, 0, '−', { fontSize: '22px', color: '#ffffff' }).setOrigin(0.5);
    minusBtn.add([minusBg, minusLabel]);
    minusBtn.setSize(36, 36).setInteractive({ useHandCursor: true });
    minusBtn.on('pointerdown', () => updateQty(-1));

    // + ボタン
    const plusBtn = this.add.container(width / 2 + 100, modalY + 145);
    const plusBg = this.add.graphics();
    plusBg.fillStyle(COLORS.DARK, 0.9);
    plusBg.fillRoundedRect(-18, -18, 36, 36, 6);
    plusBg.lineStyle(2, COLORS.LIGHT, 0.5);
    plusBg.strokeRoundedRect(-18, -18, 36, 36, 6);
    const plusLabel = this.add.text(0, 0, '+', { fontSize: '22px', color: '#ffffff' }).setOrigin(0.5);
    plusBtn.add([plusBg, plusLabel]);
    plusBtn.setSize(36, 36).setInteractive({ useHandCursor: true });
    plusBtn.on('pointerdown', () => updateQty(1));

    // 확인 버튼
    const confirmBtn = this.add.container(width / 2 - 70, modalY + 240);
    const confirmBg = this.add.rectangle(0, 0, 120, 44, COLORS.SUCCESS, 0.9).setStrokeStyle(2, COLORS.LIGHT);
    const confirmLabel = this.add.text(0, 0, '✅ Buy', {
      fontFamily: UI.FONTS.UI, fontSize: '18px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);
    confirmBtn.add([confirmBg, confirmLabel]);
    confirmBtn.setSize(120, 44).setInteractive({ useHandCursor: true });
    confirmBtn.on('pointerdown', () => this.confirmPurchase(item, qty));

    // 취소 버튼
    const cancelBtn = this.add.container(width / 2 + 70, modalY + 240);
    const cancelBg = this.add.rectangle(0, 0, 120, 44, COLORS.DANGER, 0.8).setStrokeStyle(2, COLORS.LIGHT);
    const cancelLabel = this.add.text(0, 0, '✕ Cancel', {
      fontFamily: UI.FONTS.UI, fontSize: '18px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);
    cancelBtn.add([cancelBg, cancelLabel]);
    cancelBtn.setSize(120, 44).setInteractive({ useHandCursor: true });
    cancelBtn.on('pointerdown', () => this.closePurchaseModal());

    this.purchaseModal = this.add.container(0, 0, [
      overlay, modalBg,
      titleText, priceLabel, qtyText, totalText,
      minusBtn, plusBtn,
      confirmBtn, cancelBtn,
    ]);
    this.purchaseModal.setDepth(100);
  }

  private closePurchaseModal(): void {
    if (this.purchaseModal) {
      this.purchaseModal.destroy();
      this.purchaseModal = undefined;
    }
    this.purchaseItem = undefined;
  }

  private async confirmPurchase(item: ShopItem, qty: number): Promise<void> {
    this.closePurchaseModal();
    try {
      await shopService.purchase(item.id, qty);
      const profile = await userService.getProfile();
      if (profile) {
        this.gameData.setPlayerData(profile);
        if (this.crystalText) this.crystalText.setText(`💎 ${profile.crystals.toLocaleString()}`);
        if (this.goldText) this.goldText.setText(`🪙 ${profile.gold.toLocaleString()}`);
      }
      this.showToast(`✅ Purchased ${qty}x ${item.name}!`);
      this.loadItems();
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Purchase failed';
      this.showToast(`❌ ${msg}`);
      console.error('Purchase error:', err);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  뒤로 버튼
  // ═══════════════════════════════════════════════════════════════════════
  private createBackButton(): void {
    const btn = this.add.container(70, 35);
    const bg = this.add.rectangle(0, 0, 110, 42, COLORS.INFO, 0.9).setStrokeStyle(2, COLORS.LIGHT);
    const text = this.add.text(0, 0, '← Back', {
      fontFamily: UI.FONTS.UI, fontSize: '18px',
      color: this.colorToCss(COLORS.TEXT_PRIMARY), fontStyle: 'bold',
    }).setOrigin(0.5);
    btn.add([bg, text]);
    btn.setSize(110, 42).setInteractive({ useHandCursor: true });
    btn.on('pointerdown', () => this.scene.start(SCENE_KEYS.LOBBY));
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  토스트 알림
  // ═══════════════════════════════════════════════════════════════════════
  private showToast(msg: string): void {
    const { width, height } = this.cameras.main;
    const toast = this.add.text(width / 2, height - 80, msg, {
      fontFamily: UI.FONTS.UI, fontSize: '17px',
      color: '#ffffff',
      backgroundColor: '#000000cc',
      padding: { x: 16, y: 8 },
    }).setOrigin(0.5).setDepth(200);

    this.tweens.add({
      targets: toast,
      y: height - 110,
      alpha: 0,
      delay: 1800,
      duration: 600,
      onComplete: () => toast.destroy(),
    });
  }

  private colorToCss(color: number): string {
    return `#${color.toString(16).padStart(6, '0')}`;
  }
}
