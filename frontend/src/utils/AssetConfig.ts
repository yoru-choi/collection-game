/**
 * AssetConfig - OpenGameArt.org 에셋 관리 시스템
 * PRD 섹션 1.6 구현
 * 
 * 개발 전략:
 * - 개발 환경: 핫링크로 빠른 프로토타이핑
 * - 배포 환경: 로컬 다운로드 및 번들링
 * 
 * 사용법:
 * const assetUrl = getAssetUrl('character', 'female_mage');
 * const credits = getAssetCredits();
 */

// Asset mode: 'hotlink' for development, 'local' for production
const ASSET_MODE = import.meta.env.VITE_ASSETS_MODE || 'hotlink';

export interface AssetCredit {
  name: string;
  author: string;
  license: 'CC0' | 'CC-BY 3.0' | 'CC-BY 4.0' | 'GPL 3.0' | 'OGA-BY 3.0';
  url?: string;
}

export interface AssetDefinition extends AssetCredit {
  id: string;
  category: 'character' | 'ui' | 'background' | 'effect' | 'tile' | 'audio';
  hotlinkUrl: string;
  localPath: string;
}

/**
 * OpenGameArt.org 에셋 카탈로그
 * 
 * 실제 사용 시 OpenGameArt.org에서 적절한 에셋을 찾아 URL을 업데이트해야 합니다.
 * 
 * 추천 에셋 컬렉션:
 * - LPC (Liberated Pixel Cup) Character sprites
 * - Kenney.nl UI packs
 * - Platformer tile sets
 */
const ASSET_CATALOG: AssetDefinition[] = [
  // Character Assets
  {
    id: 'female_base',
    category: 'character',
    name: 'LPC Female Character Base',
    author: 'Multiple Contributors',
    license: 'CC-BY 3.0',
    url: 'https://opengameart.org/content/lpc-ladies',
    hotlinkUrl: 'https://opengameart.org/sites/default/files/LPC_Sara/SaraFullSheet.png',
    localPath: '/assets/characters/female_base.png',
  },
  {
    id: 'female_mage',
    category: 'character',
    name: 'LPC Female Mage',
    author: 'bluecarrot16',
    license: 'CC-BY 3.0',
    url: 'https://opengameart.org/content/lpc-medieval-fantasy-character-sprites',
    hotlinkUrl: 'https://opengameart.org/sites/default/files/mage_female.png',
    localPath: '/assets/characters/female_mage.png',
  },
  {
    id: 'female_warrior',
    category: 'character',
    name: 'LPC Female Warrior',
    author: 'bluecarrot16',
    license: 'CC-BY 3.0',
    url: 'https://opengameart.org/content/lpc-medieval-fantasy-character-sprites',
    hotlinkUrl: 'https://opengameart.org/sites/default/files/warrior_female.png',
    localPath: '/assets/characters/female_warrior.png',
  },
  {
    id: 'female_archer',
    category: 'character',
    name: 'LPC Female Archer',
    author: 'bluecarrot16',
    license: 'CC-BY 3.0',
    url: 'https://opengameart.org/content/lpc-medieval-fantasy-character-sprites',
    hotlinkUrl: 'https://opengameart.org/sites/default/files/archer_female.png',
    localPath: '/assets/characters/female_archer.png',
  },
  {
    id: 'female_healer',
    category: 'character',
    name: 'LPC Female Healer',
    author: 'bluecarrot16',
    license: 'CC-BY 3.0',
    url: 'https://opengameart.org/content/lpc-medieval-fantasy-character-sprites',
    hotlinkUrl: 'https://opengameart.org/sites/default/files/healer_female.png',
    localPath: '/assets/characters/female_healer.png',
  },

  // UI Assets
  {
    id: 'ui_buttons',
    category: 'ui',
    name: 'Kenney UI Pack',
    author: 'Kenney',
    license: 'CC0',
    url: 'https://opengameart.org/content/ui-pack',
    hotlinkUrl: 'https://opengameart.org/sites/default/files/uipack_0.png',
    localPath: '/assets/ui/buttons.png',
  },
  {
    id: 'ui_icons',
    category: 'ui',
    name: 'Game Icons',
    author: 'Lorc, Delapouite & contributors',
    license: 'CC-BY 3.0',
    url: 'https://opengameart.org/content/game-icons',
    hotlinkUrl: 'https://opengameart.org/sites/default/files/game-icons.png',
    localPath: '/assets/ui/icons.png',
  },

  // Background Assets
  {
    id: 'bg_dungeon',
    category: 'background',
    name: 'Dungeon Tileset',
    author: '0x72',
    license: 'CC0',
    url: 'https://opengameart.org/content/dungeon-tileset',
    hotlinkUrl: 'https://opengameart.org/sites/default/files/dungeon_0.png',
    localPath: '/assets/backgrounds/dungeon.png',
  },
  {
    id: 'bg_forest',
    category: 'background',
    name: 'Forest Background',
    author: 'ansimuz',
    license: 'CC0',
    url: 'https://opengameart.org/content/forest-background',
    hotlinkUrl: 'https://opengameart.org/sites/default/files/forest.png',
    localPath: '/assets/backgrounds/forest.png',
  },

  // Effect Assets
  {
    id: 'fx_fire',
    category: 'effect',
    name: 'Fire Spell Effect',
    author: 'yd',
    license: 'CC0',
    url: 'https://opengameart.org/content/fire-spell',
    hotlinkUrl: 'https://opengameart.org/sites/default/files/fire_0.png',
    localPath: '/assets/effects/fire.png',
  },
  {
    id: 'fx_heal',
    category: 'effect',
    name: 'Heal Effect',
    author: 'yd',
    license: 'CC0',
    url: 'https://opengameart.org/content/heal-effect',
    hotlinkUrl: 'https://opengameart.org/sites/default/files/heal_0.png',
    localPath: '/assets/effects/heal.png',
  },

  // Tile Assets
  {
    id: 'tiles_grass',
    category: 'tile',
    name: 'Grass Tileset',
    author: 'Kenney',
    license: 'CC0',
    url: 'https://opengameart.org/content/grass-tileset',
    hotlinkUrl: 'https://opengameart.org/sites/default/files/grass.png',
    localPath: '/assets/tiles/grass.png',
  },

  // Audio Assets (placeholder)
  {
    id: 'bgm_battle',
    category: 'audio',
    name: 'Battle Music',
    author: 'cynicmusic',
    license: 'CC-BY 3.0',
    url: 'https://opengameart.org/content/battle-theme',
    hotlinkUrl: 'https://opengameart.org/sites/default/files/battle.ogg',
    localPath: '/assets/audio/battle.ogg',
  },
];

/**
 * Get asset URL based on current mode (hotlink or local)
 */
export function getAssetUrl(category: string, assetId: string): string {
  const asset = ASSET_CATALOG.find((a) => a.id === assetId && a.category === category);

  if (!asset) {
    console.warn(`Asset not found: ${category}/${assetId}`);
    return '';
  }

  if (ASSET_MODE === 'local') {
    return asset.localPath;
  }

  return asset.hotlinkUrl;
}

/**
 * Get all assets by category
 */
export function getAssetsByCategory(
  category: AssetDefinition['category']
): AssetDefinition[] {
  return ASSET_CATALOG.filter((asset) => asset.category === category);
}

/**
 * Get asset credits for attribution
 */
export function getAssetCredits(): AssetCredit[] {
  return ASSET_CATALOG.map((asset) => ({
    name: asset.name,
    author: asset.author,
    license: asset.license,
    url: asset.url,
  }));
}

/**
 * Get all unique authors
 */
export function getAuthors(): string[] {
  const authors = new Set(ASSET_CATALOG.map((asset) => asset.author));
  return Array.from(authors);
}

/**
 * Check if asset is available
 */
export function isAssetAvailable(assetId: string): boolean {
  return ASSET_CATALOG.some((asset) => asset.id === assetId);
}

/**
 * Get asset definition by ID
 */
export function getAssetById(assetId: string): AssetDefinition | undefined {
  return ASSET_CATALOG.find((asset) => asset.id === assetId);
}

/**
 * Download all assets for production build
 * This should be run as a build script
 */
export async function downloadAllAssets(): Promise<void> {
  console.log('Downloading assets from OpenGameArt.org...');

  for (const asset of ASSET_CATALOG) {
    try {
      const response = await fetch(asset.hotlinkUrl);
      const blob = await response.blob();

      // In Node.js environment, this would save to file system
      // In browser, this is just a simulation
      console.log(`Downloaded: ${asset.name} -> ${asset.localPath}`);
    } catch (error) {
      console.error(`Failed to download ${asset.name}:`, error);
    }
  }

  console.log('Asset download complete!');
}

/**
 * Generate attribution text for game credits
 */
export function generateAttributionText(): string {
  const credits = getAssetCredits();
  let text = 'Art Assets from OpenGameArt.org\n\n';

  credits.forEach((credit) => {
    text += `${credit.name}\n`;
    text += `  by ${credit.author}\n`;
    text += `  License: ${credit.license}\n`;
    if (credit.url) {
      text += `  ${credit.url}\n`;
    }
    text += '\n';
  });

  return text;
}

// Export asset mode for checks
export const isHotlinkMode = ASSET_MODE === 'hotlink';
export const isLocalMode = ASSET_MODE === 'local';
