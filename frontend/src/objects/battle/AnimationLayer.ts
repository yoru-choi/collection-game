import Phaser from 'phaser';
import { BATTLE_CONFIG } from '@/utils/Constants';
import { TurnEventDisplay } from '@/types';
import { BattleUnitDisplay } from './BattleUnitDisplay';

export class AnimationLayer extends Phaser.GameObjects.Container {
  private animationQueue: TurnEventDisplay[] = [];
  private isPlaying: boolean = false;
  private unitDisplays: Map<string, BattleUnitDisplay>;

  constructor(scene: Phaser.Scene, unitDisplays: Map<string, BattleUnitDisplay>) {
    super(scene, 0, 0);
    this.unitDisplays = unitDisplays;
    scene.add.existing(this);
  }

  queueEvents(events: TurnEventDisplay[]): void {
    this.animationQueue.push(...events);
    if (!this.isPlaying) {
      this.playNext();
    }
  }

  private playNext(): void {
    if (this.animationQueue.length === 0) {
      this.isPlaying = false;
      return;
    }

    this.isPlaying = true;
    const event = this.animationQueue.shift()!;
    this.playEvent(event);
  }

  private playEvent(event: TurnEventDisplay): void {
    const actor = this.unitDisplays.get(event.actorId);

    // Play attack animation on actor
    if (actor) {
      const isAlly = event.actorId.startsWith('ally');
      const moveX = isAlly ? 20 : -20;

      this.scene.tweens.add({
        targets: actor,
        x: actor.x + moveX,
        duration: 150,
        yoyo: true,
        ease: 'Power2',
      });
    }

    // Process targets
    let delay = 200;
    for (const target of event.targets) {
      const targetDisplay = this.unitDisplays.get(target.targetId);
      if (!targetDisplay) continue;

      this.scene.time.delayedCall(delay, () => {
        if (target.damage && target.damage > 0) {
          targetDisplay.showDamageNumber(target.damage, target.isCrit || false);

          // Screen shake for crits
          if (target.isCrit) {
            this.scene.cameras.main.shake(100, 0.005);
          }
        }
        if (target.heal && target.heal > 0) {
          targetDisplay.showHealNumber(target.heal);
        }
      });

      delay += 100;
    }

    // Move to next event after animation completes
    this.scene.time.delayedCall(delay + 200, () => {
      this.playNext();
    });
  }

  updateUnitDisplays(displays: Map<string, BattleUnitDisplay>): void {
    this.unitDisplays = displays;
  }

  clearQueue(): void {
    this.animationQueue = [];
    this.isPlaying = false;
  }
}
