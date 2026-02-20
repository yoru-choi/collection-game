import Phaser from 'phaser';
import { SCENE_KEYS, COLORS, UI } from '@/utils/Constants';
import { addSceneFrame } from '@/utils/SceneFrame';
import { GameDataStore } from '@/store/GameDataStore';
import { UserCharacter } from '@/types';
import {
  getGradeColor,
  getGradeStars,
  calculatePower,
  getElementColor,
} from '@/utils/Helpers';
import { getMonsterImageKey } from '@/utils/monsterImages';
import { characterService } from '@/services/CharacterService';
import { partyService } from '@/services/PartyService';

const MAX_PARTY_SIZE = 4;

export class PartyScene extends Phaser.Scene {
  private gameData!: GameDataStore;
  private allCharacters: UserCharacter[] = [];

  // 파티 슬롯: null이면 비어 있음
  private partySlots: (UserCharacter | null)[] = [null, null, null, null];

  // UI 상태
  private selectedSlotIndex: number = -1;   // 편집 중인 파티 슬롯
  private charListPage: number = 0;
  private readonly PAGE_SIZE = 8;

  // UI 오브젝트 참조
  private slotContainers: Phaser.GameObjects.Container[] = [];
  private charListContainer?: Phaser.GameObjects.Container;
  private saveBtn?: Phaser.GameObjects.Container;
  private statusText?: Phaser.GameObjects.Text;
  private pageText?: Phaser.GameObjects.Text;
  private totalPowerText?: Phaser.GameObjects.Text;

  constructor() {
    super({ key: SCENE_KEYS.PARTY });
  }

  create(): void {
    this.gameData = GameDataStore.getInstance();

    const { width, height } = this.cameras.main;

    // ── 배경 ──────────────────────────────────────────────────────────────
    const bg = this.add.graphics();
    bg.fillGradientStyle(COLORS.BG_START, COLORS.BG_START, COLORS.BG_END, COLORS.BG_END, 1);
    bg.fillRect(0, 0, width, height);

    // ── 상단 제목 ─────────────────────────────────────────────────────────
    this.add.text(width / 2, 38, '⚔️ Party Formation', {
      fontFamily: UI.FONTS.TITLE,
      fontSize: '38px',
      color: this.colorToCss(COLORS.TEXT_PRIMARY),
      fontStyle: 'bold',
      shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 6, fill: true },
    }).setOrigin(0.5);

    // ── 파티 슬롯 영역 (상단) ─────────────────────────────────────────────
    this.createPartyPanel(width, height);

    // ── 안내 문구 ─────────────────────────────────────────────────────────
    this.add.text(width / 2, 175, 'Select a slot → pick a character below', {
      fontFamily: UI.FONTS.UI,
      fontSize: '15px',
      color: this.colorToCss(COLORS.TEXT_MUTED),
    }).setOrigin(0.5);

    // ── 캐릭터 목록 영역 (하단) ───────────────────────────────────────────
    this.createCharListArea(width, height);

    // ── 저장 버튼 & 뒤로 버튼 ─────────────────────────────────────────────
    this.createBottomButtons(width, height);

    // ── 로딩 ─────────────────────────────────────────────────────────────
    this.loadData();

    addSceneFrame(this);
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  파티 슬롯 패널
  // ═══════════════════════════════════════════════════════════════════════
  private createPartyPanel(width: number, _height: number): void {
    const panelX = 30;
    const panelY = 72;
    const panelW = width - 60;
    const panelH = 200;

    const panelBg = this.add.graphics();
    panelBg.fillStyle(COLORS.BG_CARD, 0.85);
    panelBg.fillRoundedRect(panelX, panelY, panelW, panelH, 20);
    panelBg.lineStyle(1, COLORS.PRIMARY, 0.3);
    panelBg.strokeRoundedRect(panelX, panelY, panelW, panelH, 20);

    // 4개 슬롯
    const slotW = 160;
    const slotH = 170;
    const totalSlotW = MAX_PARTY_SIZE * slotW + (MAX_PARTY_SIZE - 1) * 24;
    let slotX = panelX + (panelW - totalSlotW) / 2;
    const slotY = panelY + (panelH - slotH) / 2;

    for (let i = 0; i < MAX_PARTY_SIZE; i++) {
      const container = this.buildSlotContainer(slotX, slotY, slotW, slotH, i);
      this.slotContainers.push(container);
      slotX += slotW + 24;
    }

    // 합산 전투력
    this.totalPowerText = this.add.text(panelX + panelW - 14, panelY + panelH - 14, 'Total Power: -', {
      fontFamily: UI.FONTS.UI,
      fontSize: '14px',
      color: this.colorToCss(COLORS.GOLD),
    }).setOrigin(1, 1);
  }

  private buildSlotContainer(
    x: number, y: number,
    w: number, h: number,
    index: number
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(COLORS.DARK, 0.9);
    bg.fillRoundedRect(0, 0, w, h, 10);
    bg.lineStyle(2, COLORS.SECONDARY, 0.5);
    bg.strokeRoundedRect(0, 0, w, h, 10);

    const slotLabel = this.add.text(w / 2, 14, `Slot ${index + 1}`, {
      fontFamily: UI.FONTS.UI,
      fontSize: '12px',
      color: this.colorToCss(COLORS.TEXT_MUTED),
    }).setOrigin(0.5);

    const emptyText = this.add.text(w / 2, h / 2, '+ Empty', {
      fontFamily: UI.FONTS.UI,
      fontSize: '16px',
      color: this.colorToCss(COLORS.TEXT_MUTED),
    }).setOrigin(0.5);
    emptyText.setName('emptyText');

    container.add([bg, slotLabel, emptyText]);
    container.setSize(w, h);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerdown', () => this.onSlotClicked(index));
    container.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(COLORS.PRIMARY_DARK, 0.9);
      bg.fillRoundedRect(0, 0, w, h, 10);
      bg.lineStyle(3, COLORS.PRIMARY, 0.9);
      bg.strokeRoundedRect(0, 0, w, h, 10);
    });
    container.on('pointerout', () => {
      this.redrawSlotBg(index, bg, w, h);
    });

    // 슬롯 인덱스 저장
    (container as any).__slotIndex = index;
    (container as any).__slotBg = bg;

    return container;
  }

  private redrawSlotBg(
    index: number,
    bg: Phaser.GameObjects.Graphics,
    w: number, h: number
  ): void {
    const isSelected = this.selectedSlotIndex === index;
    bg.clear();
    bg.fillStyle(COLORS.DARK, 0.9);
    bg.fillRoundedRect(0, 0, w, h, 10);
    if (isSelected) {
      bg.lineStyle(3, COLORS.GOLD, 1);
    } else {
      bg.lineStyle(2, COLORS.SECONDARY, 0.5);
    }
    bg.strokeRoundedRect(0, 0, w, h, 10);
  }

  private refreshSlotUI(index: number): void {
    const container = this.slotContainers[index];
    if (!container) return;

    const w = 160, h = 170;
    const bg = (container as any).__slotBg as Phaser.GameObjects.Graphics;

    // 기존 캐릭터 관련 오브젝트 제거 (slotBg, slotLabel, emptyText 제외)
    const toRemove = container.getAll().filter((obj: any) => obj.name?.startsWith('slot_'));
    toRemove.forEach((obj: any) => obj.destroy());

    const char = this.partySlots[index];

    if (!char) {
      // 빈 상태
      const emptyText = container.getByName('emptyText') as Phaser.GameObjects.Text | null;
      if (emptyText) emptyText.setVisible(true);
      this.redrawSlotBg(index, bg, w, h);
      return;
    }

    // 캐릭터 있음 → emptyText 숨기기
    const emptyText = container.getByName('emptyText') as Phaser.GameObjects.Text | null;
    if (emptyText) emptyText.setVisible(false);

    // 속성 색상 테두리
    this.redrawSlotBg(index, bg, w, h);
    const gradeColor = getGradeColor(char.character?.grade ?? 1);
    bg.lineStyle(3, gradeColor, 0.9);
    bg.strokeRoundedRect(1, 1, w - 2, h - 2, 10);

    // 스프라이트
    const spriteKey = getMonsterImageKey(char);
    const sprite = this.add.sprite(w / 2, h / 2 - 14, spriteKey)
      .setDisplaySize(90, 90)
      .setName('slot_sprite');
    container.add(sprite);

    // 이름
    const nameText = this.add.text(w / 2, h - 44, char.character?.name ?? '?', {
      fontFamily: UI.FONTS.UI,
      fontSize: '12px',
      color: this.colorToCss(COLORS.TEXT_PRIMARY),
      fontStyle: 'bold',
      wordWrap: { width: w - 16 },
      align: 'center',
    }).setOrigin(0.5).setName('slot_name');
    container.add(nameText);

    // 레벨
    const levelText = this.add.text(w / 2, h - 28, `Lv.${char.level}  ${getGradeStars(char.character?.grade ?? 1)}`, {
      fontFamily: UI.FONTS.UI,
      fontSize: '11px',
      color: this.colorToCss(COLORS.TEXT_SECONDARY),
    }).setOrigin(0.5).setName('slot_level');
    container.add(levelText);

    // 제거 버튼 (×)
    const removeZone = this.add.container(w - 16, 12).setName('slot_remove');
    const removeBg = this.add.circle(0, 0, 10, COLORS.DANGER, 0.85);
    const removeText = this.add.text(0, 0, '×', {
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    removeZone.add([removeBg, removeText]);
    removeZone.setSize(20, 20);
    removeZone.setInteractive({ useHandCursor: true });
    removeZone.on('pointerdown', (ptr: Phaser.Input.Pointer, lx: number, ly: number, evt: Event) => {
      evt.stopPropagation();
      this.removeFromSlot(index);
    });
    container.add(removeZone);

    this.updateTotalPower();
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  캐릭터 목록 영역
  // ═══════════════════════════════════════════════════════════════════════
  private createCharListArea(width: number, height: number): void {
    const areaX = 20;
    const areaY = 285;
    const areaW = width - 40;
    const areaH = height - areaY - 70;

    // 배경
    const bg = this.add.graphics();
    bg.fillStyle(COLORS.DARKER, 0.7);
    bg.fillRoundedRect(areaX, areaY - 10, areaW, areaH + 10, 12);
    bg.lineStyle(1, COLORS.PRIMARY, 0.3);
    bg.strokeRoundedRect(areaX, areaY - 10, areaW, areaH + 10, 12);

    this.add.text(areaX + 14, areaY + 4, '📋 Character Collection', {
      fontFamily: UI.FONTS.UI,
      fontSize: '15px',
      color: this.colorToCss(COLORS.TEXT_SECONDARY),
      fontStyle: 'bold',
    });

    // 페이지 텍스트
    this.pageText = this.add.text(width - areaX - 14, areaY + 4, '', {
      fontFamily: UI.FONTS.UI,
      fontSize: '13px',
      color: this.colorToCss(COLORS.TEXT_MUTED),
    }).setOrigin(1, 0);

    // 목록 컨테이너
    this.charListContainer = this.add.container(areaX, areaY + 24);

    // 페이지 버튼
    this.createPageButtons(width, height);
  }

  private createPageButtons(width: number, height: number): void {
    const btnY = height - 48;
    const centerX = width / 2;

    // ◀ Prev
    const prevBtn = this.add.container(centerX - 90, btnY);
    const prevBg = this.add.rectangle(0, 0, 80, 34, COLORS.SECONDARY, 0.9)
      .setStrokeStyle(2, COLORS.LIGHT);
    const prevText = this.add.text(0, 0, '◀ Prev', {
      fontFamily: UI.FONTS.UI, fontSize: '14px',
      color: this.colorToCss(COLORS.TEXT_PRIMARY),
    }).setOrigin(0.5);
    prevBtn.add([prevBg, prevText]);
    prevBtn.setSize(80, 34).setInteractive({ useHandCursor: true });
    prevBtn.on('pointerdown', () => { this.charListPage = Math.max(0, this.charListPage - 1); this.renderCharList(); });

    // ▶ Next
    const nextBtn = this.add.container(centerX + 90, btnY);
    const nextBg = this.add.rectangle(0, 0, 80, 34, COLORS.SECONDARY, 0.9)
      .setStrokeStyle(2, COLORS.LIGHT);
    const nextText = this.add.text(0, 0, 'Next ▶', {
      fontFamily: UI.FONTS.UI, fontSize: '14px',
      color: this.colorToCss(COLORS.TEXT_PRIMARY),
    }).setOrigin(0.5);
    nextBtn.add([nextBg, nextText]);
    nextBtn.setSize(80, 34).setInteractive({ useHandCursor: true });
    nextBtn.on('pointerdown', () => {
      const maxPage = Math.ceil(this.allCharacters.length / this.PAGE_SIZE) - 1;
      this.charListPage = Math.min(maxPage, this.charListPage + 1);
      this.renderCharList();
    });
  }

  private renderCharList(): void {
    if (!this.charListContainer) return;
    this.charListContainer.removeAll(true);

    const startIdx = this.charListPage * this.PAGE_SIZE;
    const page = this.allCharacters.slice(startIdx, startIdx + this.PAGE_SIZE);
    const totalPages = Math.ceil(this.allCharacters.length / this.PAGE_SIZE);

    if (this.pageText) {
      this.pageText.setText(`Page ${this.charListPage + 1} / ${Math.max(1, totalPages)}`);
    }

    const cols = 8;
    const gapX = 8;
    const gapY = 8;
    const areaW = 1240; // matches charListContainer parent width
    const cardW = Math.floor((areaW - (cols - 1) * gapX) / cols); // ~148px
    const cardH = 120; // reduced from 130 to fit better

    page.forEach((char, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cx = col * (cardW + gapX);
      const cy = row * (cardH + gapY);

      const card = this.buildCharCard(char, cardW, cardH);
      card.setPosition(cx, cy);
      this.charListContainer!.add(card);
    });

    if (page.length === 0 && this.allCharacters.length === 0) {
      const txt = this.add.text(0, 60, 'No characters yet. Summon some!', {
        fontFamily: UI.FONTS.UI, fontSize: '16px',
        color: this.colorToCss(COLORS.TEXT_MUTED),
      }).setOrigin(0, 0.5);
      this.charListContainer.add(txt);
    }
  }

  private buildCharCard(char: UserCharacter, w: number, h: number): Phaser.GameObjects.Container {
    const card = this.add.container(0, 0);

    const isInParty = this.partySlots.some(s => s?.id === char.id);
    const gradeColor = getGradeColor(char.character?.grade ?? 1);

    // 배경
    const bg = this.add.graphics();
    bg.fillStyle(isInParty ? COLORS.SUCCESS : COLORS.DARK, isInParty ? 0.3 : 0.8);
    bg.fillRoundedRect(0, 0, w, h, 8);
    bg.lineStyle(2, isInParty ? COLORS.SUCCESS : gradeColor, 0.8);
    bg.strokeRoundedRect(0, 0, w, h, 8);
    card.add(bg);

    // 스프라이트
    const spriteKey = getMonsterImageKey(char);
    const sprite = this.add.sprite(w / 2, h / 2 - 14, spriteKey).setDisplaySize(70, 70);
    card.add(sprite);

    // 이름
    const nameText = this.add.text(w / 2, h - 36, char.character?.name ?? '?', {
      fontFamily: UI.FONTS.UI, fontSize: '11px',
      color: this.colorToCss(COLORS.TEXT_PRIMARY),
      fontStyle: 'bold',
      wordWrap: { width: w - 10 },
      align: 'center',
    }).setOrigin(0.5);
    card.add(nameText);

    // 레벨 & 별
    const levelText = this.add.text(w / 2, h - 20, `Lv.${char.level}`, {
      fontFamily: UI.FONTS.UI, fontSize: '10px',
      color: this.colorToCss(COLORS.TEXT_MUTED),
    }).setOrigin(0.5);
    card.add(levelText);

    const starsText = this.add.text(w / 2, h - 8, getGradeStars(char.character?.grade ?? 1), {
      fontFamily: UI.FONTS.UI, fontSize: '10px',
    }).setOrigin(0.5);
    card.add(starsText);

    // 파티 배지
    if (isInParty) {
      const badgeBg = this.add.graphics();
      badgeBg.fillStyle(COLORS.SUCCESS, 0.9);
      badgeBg.fillRoundedRect(2, 2, 28, 16, 4);
      const badge = this.add.text(16, 10, '★', {
        fontFamily: UI.FONTS.UI, fontSize: '11px',
        color: '#ffffff', fontStyle: 'bold',
      }).setOrigin(0.5);
      card.add([badgeBg, badge]);
    }

    // 인터랙티브
    card.setSize(w, h);
    card.setInteractive({ useHandCursor: true });

    card.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(COLORS.PRIMARY, 0.35);
      bg.fillRoundedRect(0, 0, w, h, 8);
      bg.lineStyle(3, COLORS.GOLD, 1);
      bg.strokeRoundedRect(0, 0, w, h, 8);
    });
    card.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(isInParty ? COLORS.SUCCESS : COLORS.DARK, isInParty ? 0.3 : 0.8);
      bg.fillRoundedRect(0, 0, w, h, 8);
      bg.lineStyle(2, isInParty ? COLORS.SUCCESS : gradeColor, 0.8);
      bg.strokeRoundedRect(0, 0, w, h, 8);
    });
    card.on('pointerdown', () => this.onCharCardClicked(char));

    return card;
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  하단 버튼
  // ═══════════════════════════════════════════════════════════════════════
  private createBottomButtons(width: number, height: number): void {
    const btnY = height - 48;

    // ← 뒤로
    const backBtn = this.add.container(80, btnY);
    const backBg = this.add.rectangle(0, 0, 130, 42, COLORS.INFO, 1)
      .setStrokeStyle(2, COLORS.LIGHT);
    const backText = this.add.text(0, 0, '← Back', {
      fontFamily: UI.FONTS.UI, fontSize: '18px',
      color: this.colorToCss(COLORS.TEXT_PRIMARY), fontStyle: 'bold',
    }).setOrigin(0.5);
    backBtn.add([backBg, backText]);
    backBtn.setSize(130, 42).setInteractive({ useHandCursor: true });
    backBtn.on('pointerdown', () => this.scene.start(SCENE_KEYS.LOBBY));

    // 💾 저장
    this.saveBtn = this.add.container(width - 100, btnY);
    const saveBg = this.add.rectangle(0, 0, 160, 42, COLORS.SUCCESS, 1)
      .setStrokeStyle(2, COLORS.LIGHT);
    const saveText = this.add.text(0, 0, '💾 Save Party', {
      fontFamily: UI.FONTS.UI, fontSize: '18px',
      color: this.colorToCss(COLORS.TEXT_PRIMARY), fontStyle: 'bold',
    }).setOrigin(0.5);
    this.saveBtn.add([saveBg, saveText]);
    this.saveBtn.setSize(160, 42).setInteractive({ useHandCursor: true });
    this.saveBtn.on('pointerdown', () => this.saveParty());

    this.statusText = this.add.text(width / 2, btnY, '', {
      fontFamily: UI.FONTS.UI, fontSize: '14px',
      color: this.colorToCss(COLORS.TEXT_MUTED),
    }).setOrigin(0.5);
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  이벤트 핸들러
  // ═══════════════════════════════════════════════════════════════════════
  private onSlotClicked(index: number): void {
    if (this.selectedSlotIndex === index) {
      // 이미 선택된 슬롯 클릭 → 선택 해제
      this.selectedSlotIndex = -1;
    } else {
      this.selectedSlotIndex = index;
    }
    // 슬롯 비주얼 갱신
    this.slotContainers.forEach((c, i) => {
      const bg = (c as any).__slotBg as Phaser.GameObjects.Graphics;
      this.redrawSlotBg(i, bg, 160, 170);
    });
    this.showStatus(
      this.selectedSlotIndex >= 0
        ? `Slot ${this.selectedSlotIndex + 1} selected. Pick a character below.`
        : ''
    );
  }

  private onCharCardClicked(char: UserCharacter): void {
    if (this.selectedSlotIndex < 0) {
      // 슬롯 미선택 → 빈 슬롯에 자동 배치
      const emptyIdx = this.partySlots.findIndex(s => s === null);
      if (emptyIdx < 0) {
        this.showStatus('Party is full! Select a slot to replace.', true);
        return;
      }
      this.selectedSlotIndex = emptyIdx;
    }

    // 이미 파티에 있으면 제거
    const existingIdx = this.partySlots.findIndex(s => s?.id === char.id);
    if (existingIdx >= 0 && existingIdx !== this.selectedSlotIndex) {
      this.partySlots[existingIdx] = null;
      this.refreshSlotUI(existingIdx);
    }

    this.partySlots[this.selectedSlotIndex] = char;
    this.refreshSlotUI(this.selectedSlotIndex);
    this.selectedSlotIndex = -1;

    // 슬롯 비주얼 갱신
    this.slotContainers.forEach((c, i) => {
      const bg = (c as any).__slotBg as Phaser.GameObjects.Graphics;
      this.redrawSlotBg(i, bg, 160, 170);
    });

    this.renderCharList();
    this.showStatus('Character assigned!');
  }

  private removeFromSlot(index: number): void {
    this.partySlots[index] = null;
    this.refreshSlotUI(index);
    this.renderCharList();
    this.showStatus(`Slot ${index + 1} cleared.`);
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  데이터 로드 / 저장
  // ═══════════════════════════════════════════════════════════════════════
  private async loadData(): Promise<void> {
    this.showStatus('Loading…');
    try {
      const [chars, partyMembers] = await Promise.all([
        characterService.getCharacterList(),
        partyService.getParty(),
      ]);

      this.allCharacters = chars.sort(
        (a, b) => calculatePower(b) - calculatePower(a)
      );
      this.gameData.setUserCharacters(chars);

      // 파티 슬롯 복원
      this.partySlots = [null, null, null, null];
      partyMembers
        .sort((a, b) => a.slotIndex - b.slotIndex)
        .forEach(member => {
          const idx = member.slotIndex;
          if (idx < MAX_PARTY_SIZE) {
            const found = chars.find(c => Number(c.id) === member.userCharacterId);
            if (found) this.partySlots[idx] = found;
          }
        });

      // UI 갱신
      for (let i = 0; i < MAX_PARTY_SIZE; i++) {
        this.refreshSlotUI(i);
      }
      this.renderCharList();
      this.showStatus('');
    } catch (err) {
      console.error('PartyScene load error:', err);
      // 캐시에서 캐릭터 복원
      this.allCharacters = this.gameData.getUserCharacters() || [];
      this.renderCharList();
      this.showStatus('Server unavailable. Using cached data.', true);
    }
  }

  private async saveParty(): Promise<void> {
    const memberIds = this.partySlots
      .filter(s => s !== null)
      .map(s => Number(s!.id));

    if (memberIds.length === 0) {
      this.showStatus('Add at least one character to your party.', true);
      return;
    }

    this.showStatus('Saving…');
    try {
      await partyService.setParty(memberIds);
      this.showStatus('✅ Party saved!');
    } catch (err) {
      console.error('Save party error:', err);
      this.showStatus('❌ Failed to save. Check connection.', true);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  헬퍼
  // ═══════════════════════════════════════════════════════════════════════
  private updateTotalPower(): void {
    const total = this.partySlots
      .filter(s => s !== null)
      .reduce((sum, s) => sum + calculatePower(s!), 0);
    if (this.totalPowerText) {
      this.totalPowerText.setText(`Total Power: ${total.toLocaleString()}`);
    }
  }

  private showStatus(msg: string, isError = false): void {
    if (!this.statusText) return;
    this.statusText.setText(msg);
    this.statusText.setColor(isError ? '#ff6666' : this.colorToCss(COLORS.TEXT_MUTED));
  }

  private colorToCss(color: number): string {
    return Phaser.Display.Color.IntegerToColor(color).rgba;
  }
}
