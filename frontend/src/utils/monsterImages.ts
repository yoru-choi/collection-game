export const MONSTER_IMAGE_KEYS = Array.from({ length: 25 }, (_, index) => {
  return `monster-card-${String(index + 1).padStart(3, '0')}`;
});

export const getMonsterImagePath = (key: string): string => {
  return `/assets/monsters/cards/${key}.png`;
};

const hashString = (value: string): number => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
};

export const getMonsterImageKey = (character: {
  id?: string;
  characterId?: string;
  character?: { id?: string; name?: string };
}): string => {
  const seed =
    character.character?.id ||
    character.characterId ||
    character.id ||
    character.character?.name ||
    '0';

  const index = hashString(seed) % MONSTER_IMAGE_KEYS.length;
  return MONSTER_IMAGE_KEYS[index];
};
