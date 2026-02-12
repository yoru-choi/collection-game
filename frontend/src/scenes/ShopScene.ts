import Phaser from 'phaser';
import { SCENE_KEYS, COLORS, UI } from '@/utils/Constants';
import { addSceneFrame } from '@/utils/SceneFrame';
import { shopService } from '@/services/ShopService';
import { userService } from '@/services/UserService';
import { GameDataStore } from '@/store/GameDataStore';
import { ShopItem } from '@/types';

export class ShopScene extends Phaser.Scene {
  private gameData!: GameDataStore;
  private items: ShopItem[] = [];
  private currentCurrency: 'gold' | 'crystal' = 'gold';
  private statusText?: Phaser.GameObjects.Text;
  private listContainer?: Phaser.GameObjects.Container;

  constructor() {
    super({ key: SCENE_KEYS.SHOP });
  }

  create(): void {
    this.gameData = GameDataStore.getInstance();

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    this.add.rectangle(0, 0, width, height, COLORS.DARK).setOrigin(0);

    this.createTopBar(width);
    this.createTabs(width);

    this.statusText = this.add.text(width / 2, height / 2, 'Loading shop...', {
      fontFamily: UI.FONTS.UI,
      fontSize: '20px',
      color: this.colorToCss(COLORS.TEXT_PRIMARY),
      wordWrap: { width: width - 120 },
      align: 'center',
    }).setOrigin(0.5);

    this.loadItems();

    this.createBackButton();

    addSceneFrame(this);
  }

  private createTopBar(width: number): void {
    const topBar = this.add.graphics();
    topBar.fillStyle(COLORS.DARK, 0.9);
    topBar.fillRect(0, 0, width, 70);
    topBar.lineStyle(2, COLORS.PRIMARY);
    topBar.strokeRect(0, 0, width, 70);

    this.add.text(20, 20, 'Shop', {
      fontFamily: UI.FONTS.TITLE,
      fontSize: '24px',
      color: this.colorToCss(COLORS.TEXT_PRIMARY),
      fontStyle: 'bold',
    });

    const crystal = this.gameData.getPlayerData()?.crystals || 0;
    const gold = this.gameData.getPlayerData()?.gold || 0;
    this.add.text(width - 260, 22, `💎 ${crystal}`, {
      fontFamily: UI.FONTS.UI,
      fontSize: '18px',
      color: this.colorToCss(COLORS.SECONDARY_LIGHT),
    });
    this.add.text(width - 140, 22, `🪙 ${gold}`, {
      fontFamily: UI.FONTS.UI,
      fontSize: '18px',
      color: this.colorToCss(COLORS.GOLD),
    });
  }

  private createTabs(width: number): void {
    const tabY = 100;
    this.createTab(width / 2 - 120, tabY, 'Gold Shop', 'gold');
    this.createTab(width / 2 + 120, tabY, 'Crystal Shop', 'crystal');
  }

  private createTab(x: number, y: number, label: string, currency: 'gold' | 'crystal'): void {
    const active = this.currentCurrency === currency;
    const bg = this.add.rectangle(x, y, 200, 45, active ? COLORS.PRIMARY : COLORS.SECONDARY, 0.9);
    bg.setStrokeStyle(2, COLORS.LIGHT);
    const text = this.add.text(x, y, label, {
      fontFamily: UI.FONTS.UI,
      fontSize: '16px',
      color: this.colorToCss(COLORS.TEXT_PRIMARY),
      fontStyle: 'bold',
    });
    text.setOrigin(0.5);

    const zone = this.add.zone(x, y, 200, 45);
    zone.setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => {
      if (this.currentCurrency !== currency) {
        this.currentCurrency = currency;
        this.scene.restart();
      }
    });
  }

  private async loadItems(): Promise<void> {
    try {
      this.items = await shopService.getItems(this.currentCurrency);
      this.renderItems();
    } catch (error) {
      if (this.statusText) {
        this.statusText.setText('Failed to load shop items');
      }
      console.error('Shop load error:', error);
    }
  }

  private renderItems(): void {
    const width = this.cameras.main.width;

    if (this.statusText) {
      this.statusText.destroy();
      this.statusText = undefined;
    }

    if (this.listContainer) {
      this.listContainer.destroy();
      this.listContainer = undefined;
    }

    this.listContainer = this.add.container(0, 0);

    if (this.items.length === 0) {
      this.statusText = this.add.text(width / 2, 260, 'No items available', {
        fontFamily: UI.FONTS.UI,
        fontSize: '18px',
        color: this.colorToCss(COLORS.TEXT_SECONDARY),
      }).setOrigin(0.5);
      return;
    }

    const startY = 170;
    const rowHeight = 70;

    this.items.forEach((item, index) => {
      const y = startY + index * rowHeight;
      const row = this.createItemRow(width / 2, y, item);
      this.listContainer?.add(row);
    });
  }

  private createItemRow(x: number, y: number, item: ShopItem): Phaser.GameObjects.Container {
    const row = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, 700, 55, COLORS.PRIMARY, 0.2);
    bg.setStrokeStyle(2, COLORS.LIGHT);

    const name = this.add.text(-300, 0, item.name, {
      fontFamily: UI.FONTS.UI,
      fontSize: '16px',
      color: this.colorToCss(COLORS.TEXT_PRIMARY),
    });
    name.setOrigin(0, 0.5);
    this.truncateText(name, 320);

    const priceText = item.currencyType === 'crystal' ? '💎' : '🪙';
    const price = this.add.text(170, 0, `${priceText} ${item.price}`, {
      fontFamily: UI.FONTS.UI,
      fontSize: '16px',
      color: this.colorToCss(COLORS.GOLD),
    });
    price.setOrigin(0.5);

    const stock = typeof item.stock === 'number' && item.stock >= 0 ? `Stock ${item.stock}` : 'Unlimited';
    const stockText = this.add.text(260, 0, stock, {
      fontFamily: UI.FONTS.UI,
      fontSize: '12px',
      color: this.colorToCss(COLORS.TEXT_MUTED),
    });
    stockText.setOrigin(0.5);

    const buy = this.add.text(320, 0, 'Buy', {
      fontFamily: UI.FONTS.UI,
      fontSize: '16px',
      color: this.colorToCss(COLORS.SECONDARY_LIGHT),
    });
    buy.setOrigin(0.5);

    row.add([bg, name, price, stockText, buy]);
    row.setSize(700, 55);
    row.setInteractive({ useHandCursor: true });
    row.on('pointerdown', () => this.handlePurchase(item));

    return row;
  }

  private async handlePurchase(item: ShopItem): Promise<void> {
    try {
      await shopService.purchase(item.id, 1);
      const profile = await userService.getProfile();
      if (profile) {
        this.gameData.setPlayerData(profile);
      }
      this.showToast('Purchase successful');
      this.loadItems();
    } catch (error) {
      this.showToast('Purchase failed');
      console.error('Purchase error:', error);
    }
  }

  private showToast(message: string): void {
    const width = this.cameras.main.width;
    const toast = this.add.text(width / 2, 520, message, {
      fontFamily: UI.FONTS.UI,
      fontSize: '16px',
      color: this.colorToCss(COLORS.TEXT_PRIMARY),
      backgroundColor: '#000000',
      padding: { left: 10, right: 10, top: 6, bottom: 6 },
    });
    toast.setOrigin(0.5);
    this.tweens.add({
      targets: toast,
      alpha: 0,
      duration: 1200,
      onComplete: () => toast.destroy(),
    });
  }

  private createBackButton(): void {
    const button = this.add.container(50, 35);
    const bg = this.add.rectangle(0, 0, 100, 50, COLORS.INFO);
    const text = this.add.text(0, 0, '← Back', {
      fontFamily: UI.FONTS.UI,
      fontSize: '18px',
      color: this.colorToCss(COLORS.TEXT_PRIMARY),
    });
    text.setOrigin(0.5);
    button.add([bg, text]);
    button.setSize(100, 50);
    button.setInteractive({ useHandCursor: true });
    button.on('pointerdown', () => this.scene.start(SCENE_KEYS.LOBBY));
  }

  private truncateText(text: Phaser.GameObjects.Text, maxWidth: number): void {
    if (text.width <= maxWidth) return;

    const original = text.text;
    let truncated = original;

    while (truncated.length > 1 && text.width > maxWidth) {
      truncated = `${truncated.slice(0, -2)}...`;
      text.setText(truncated);
    }
  }

  private colorToCss(color: number): string {
    return Phaser.Display.Color.IntegerToColor(color).rgba;
  }
}
