/**
 * Responsive UI Helper Functions
 * PRD 섹션 1.5, 3.2, 4.2.4.1 구현
 * 
 * 가로뷰 기준 UI를 기기별로 스케일링하여 표시
 */

import { BREAKPOINTS, GAME_CONFIG } from './Constants';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';
export type Orientation = 'portrait' | 'landscape';

/**
 * Get current device type based on screen width
 */
export function getDeviceType(): DeviceType {
  const width = window.innerWidth;
  if (width <= BREAKPOINTS.MOBILE) return 'mobile';
  if (width <= BREAKPOINTS.TABLET) return 'tablet';
  return 'desktop';
}

/**
 * Get current orientation
 */
export function getOrientation(): Orientation {
  return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
}

/**
 * Check if device supports touch
 */
export function isTouchDevice(): boolean {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * Get responsive font size based on device
 */
export function getResponsiveFontSize(
  baseSize: number,
  device?: DeviceType
): number {
  const currentDevice = device || getDeviceType();
  
  switch (currentDevice) {
    case 'mobile':
      return Math.floor(baseSize * 0.7);
    case 'tablet':
      return Math.floor(baseSize * 0.85);
    case 'desktop':
    default:
      return baseSize;
  }
}

/**
 * Get responsive spacing based on device
 */
export function getResponsiveSpacing(
  baseSpacing: number,
  device?: DeviceType
): number {
  const currentDevice = device || getDeviceType();
  
  switch (currentDevice) {
    case 'mobile':
      return Math.floor(baseSpacing * 0.6);
    case 'tablet':
      return Math.floor(baseSpacing * 0.8);
    case 'desktop':
    default:
      return baseSpacing;
  }
}

/**
 * Get responsive button size
 */
export function getResponsiveButtonSize(device?: DeviceType): {
  width: number;
  height: number;
} {
  const currentDevice = device || getDeviceType();
  
  switch (currentDevice) {
    case 'mobile':
      return { width: 120, height: 50 }; // Larger touch targets
    case 'tablet':
      return { width: 140, height: 50 };
    case 'desktop':
    default:
      return { width: 150, height: 50 };
  }
}

/**
 * Get responsive UI scale factor
 */
export function getUIScale(device?: DeviceType): number {
  const currentDevice = device || getDeviceType();
  
  switch (currentDevice) {
    case 'mobile':
      return 0.7;
    case 'tablet':
      return 0.85;
    case 'desktop':
    default:
      return 1.0;
  }
}

/**
 * Get game scale configuration for Phaser
 */
export function getGameScaleConfig(): {
  mode: number;
  parent: string;
  width: number;
  height: number;
  autoCenter: number;
} {
  return {
    mode: Phaser.Scale.FIT,
    parent: 'game-container',
    width: GAME_CONFIG.WIDTH,
    height: GAME_CONFIG.HEIGHT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  };
}

/**
 * Get optimal grid layout for character/item display
 */
export function getGridLayout(device?: DeviceType): {
  columns: number;
  rows: number;
  itemSize: number;
  gap: number;
} {
  const currentDevice = device || getDeviceType();
  
  switch (currentDevice) {
    case 'mobile':
      return {
        columns: 2,
        rows: 3,
        itemSize: 100,
        gap: 10,
      };
    case 'tablet':
      return {
        columns: 3,
        rows: 3,
        itemSize: 120,
        gap: 15,
      };
    case 'desktop':
    default:
      return {
        columns: 4,
        rows: 3,
        itemSize: 140,
        gap: 20,
      };
  }
}

/**
 * Get responsive panel size
 */
export function getResponsivePanelSize(
  baseWidth: number,
  baseHeight: number,
  device?: DeviceType
): { width: number; height: number } {
  const currentDevice = device || getDeviceType();
  const scale = getUIScale(currentDevice);
  
  return {
    width: Math.floor(baseWidth * scale),
    height: Math.floor(baseHeight * scale),
  };
}

/**
 * Get menu layout configuration
 */
export function getMenuLayout(device?: DeviceType): {
  orientation: 'vertical' | 'horizontal' | 'grid';
  itemsPerRow: number;
  buttonSize: { width: number; height: number };
} {
  const currentDevice = device || getDeviceType();
  const btnSize = getResponsiveButtonSize(currentDevice);
  
  switch (currentDevice) {
    case 'mobile':
      return {
        orientation: 'grid',
        itemsPerRow: 2,
        buttonSize: btnSize,
      };
    case 'tablet':
      return {
        orientation: 'grid',
        itemsPerRow: 3,
        buttonSize: btnSize,
      };
    case 'desktop':
    default:
      return {
        orientation: 'horizontal',
        itemsPerRow: 4,
        buttonSize: btnSize,
      };
  }
}

/**
 * Check if device is low-end (for performance optimization)
 */
export function isLowEndDevice(): boolean {
  const device = getDeviceType();
  if (device !== 'mobile') return false;
  
  // Check for various performance indicators
  const ua = navigator.userAgent.toLowerCase();
  const hasLowRAM = (navigator as any).deviceMemory && (navigator as any).deviceMemory < 4;
  const hasSlowCPU = (navigator as any).hardwareConcurrency && (navigator as any).hardwareConcurrency < 4;
  
  return hasLowRAM || hasSlowCPU;
}

/**
 * Get performance settings based on device
 */
export function getPerformanceSettings(device?: DeviceType): {
  particleLimit: number;
  maxSpriteCount: number;
  enableShadows: boolean;
  enablePostProcessing: boolean;
  targetFPS: number;
} {
  const currentDevice = device || getDeviceType();
  const isLowEnd = isLowEndDevice();
  
  if (isLowEnd) {
    return {
      particleLimit: 50,
      maxSpriteCount: 100,
      enableShadows: false,
      enablePostProcessing: false,
      targetFPS: 30,
    };
  }
  
  switch (currentDevice) {
    case 'mobile':
      return {
        particleLimit: 100,
        maxSpriteCount: 200,
        enableShadows: false,
        enablePostProcessing: false,
        targetFPS: 30,
      };
    case 'tablet':
      return {
        particleLimit: 200,
        maxSpriteCount: 300,
        enableShadows: true,
        enablePostProcessing: true,
        targetFPS: 60,
      };
    case 'desktop':
    default:
      return {
        particleLimit: 500,
        maxSpriteCount: 500,
        enableShadows: true,
        enablePostProcessing: true,
        targetFPS: 60,
      };
  }
}

/**
 * Get touch target minimum size (accessibility)
 */
export function getMinTouchTargetSize(): { width: number; height: number } {
  return { width: 44, height: 44 }; // Apple HIG recommendation: 44x44 pts
}

/**
 * Apply responsive text style
 */
export function getResponsiveTextStyle(
  baseFontSize: number,
  device?: DeviceType
): Phaser.Types.GameObjects.Text.TextStyle {
  const currentDevice = device || getDeviceType();
  const fontSize = getResponsiveFontSize(baseFontSize, currentDevice);
  
  return {
    fontSize: `${fontSize}px`,
    color: '#ffffff',
    fontFamily: 'Arial, sans-serif',
    align: 'center',
  };
}

/**
 * Create responsive container bounds
 */
export function getResponsiveContainerBounds(
  scene: Phaser.Scene,
  padding: number = 20,
  device?: DeviceType
): { x: number; y: number; width: number; height: number } {
  const currentDevice = device || getDeviceType();
  const responsivePadding = getResponsiveSpacing(padding, currentDevice);
  
  return {
    x: responsivePadding,
    y: responsivePadding,
    width: scene.cameras. main.width - responsivePadding * 2,
    height: scene.cameras.main.height - responsivePadding * 2,
  };
}

/**
 * Log device info for debugging
 */
export function logDeviceInfo(): void {
  console.log('Device Info:', {
    type: getDeviceType(),
    orientation: getOrientation(),
    isTouch: isTouchDevice(),
    isLowEnd: isLowEndDevice(),
    screenSize: {
      width: window.innerWidth,
      height: window.innerHeight,
    },
    devicePixelRatio: window.devicePixelRatio,
    userAgent: navigator.userAgent,
  });
}
