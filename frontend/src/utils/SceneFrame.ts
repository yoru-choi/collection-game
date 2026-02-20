import Phaser from 'phaser';
import { COLORS } from '@/utils/Constants';

type FrameOptions = {
  inset?: number;
  radius?: number;
  alpha?: number;
};

export function addSceneFrame(
  scene: Phaser.Scene,
  options: FrameOptions = {}
): Phaser.GameObjects.Container {
  const width = scene.cameras.main.width;
  const height = scene.cameras.main.height;
  const inset = options.inset ?? 12;
  const radius = options.radius ?? 20;
  const alpha = options.alpha ?? 0.4;

  const container = scene.add.container(0, 0);

  // Single soft border (simplified from double border + corner plates)
  const border = scene.add.graphics();
  border.lineStyle(2, COLORS.GOLD, alpha);
  border.strokeRoundedRect(inset, inset, width - inset * 2, height - inset * 2, radius);

  container.add([border]);
  container.setDepth(1000);

  // Scene fade-in transition
  scene.cameras.main.fadeIn(250, 0, 0, 0);

  return container;
}
