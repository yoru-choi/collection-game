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
  const radius = options.radius ?? 18;
  const alpha = options.alpha ?? 0.85;

  const container = scene.add.container(0, 0);

  const border = scene.add.graphics();
  border.lineStyle(4, COLORS.GOLD, alpha);
  border.strokeRoundedRect(inset, inset, width - inset * 2, height - inset * 2, radius);
  border.lineStyle(1, COLORS.LIGHT, 0.35);
  border.strokeRoundedRect(inset + 4, inset + 4, width - (inset + 4) * 2, height - (inset + 4) * 2, radius - 4);

  const corner = scene.add.graphics();
  corner.fillStyle(COLORS.DARKER, 0.55);
  const plateSize = 46;
  const offset = inset + 8;
  corner.fillRoundedRect(offset, offset, plateSize, plateSize, 10);
  corner.fillRoundedRect(width - offset - plateSize, offset, plateSize, plateSize, 10);
  corner.fillRoundedRect(offset, height - offset - plateSize, plateSize, plateSize, 10);
  corner.fillRoundedRect(width - offset - plateSize, height - offset - plateSize, plateSize, plateSize, 10);
  corner.lineStyle(2, COLORS.PRIMARY_LIGHT, 0.5);
  corner.strokeRoundedRect(offset, offset, plateSize, plateSize, 10);
  corner.strokeRoundedRect(width - offset - plateSize, offset, plateSize, plateSize, 10);
  corner.strokeRoundedRect(offset, height - offset - plateSize, plateSize, plateSize, 10);
  corner.strokeRoundedRect(width - offset - plateSize, height - offset - plateSize, plateSize, plateSize, 10);

  container.add([border, corner]);
  container.setDepth(1000);

  return container;
}
