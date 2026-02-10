import { ElementType, ELEMENT_ADVANTAGE, COLORS, Grade } from './Constants';

/**
 * Get element advantage multiplier
 */
export function getElementAdvantage(
  attackerElement: ElementType,
  defenderElement: ElementType
): number {
  if (ELEMENT_ADVANTAGE[attackerElement] === defenderElement) {
    return 1.5; // 50% bonus damage
  } else if (ELEMENT_ADVANTAGE[defenderElement] === attackerElement) {
    return 0.75; // 25% reduced damage
  }
  return 1.0; // neutral
}

/**
 * Get color by grade
 */
export function getGradeColor(grade: Grade): number {
  switch (grade) {
    case Grade.ONE_STAR:
      return COLORS.GRADE_1;
    case Grade.TWO_STAR:
      return COLORS.GRADE_2;
    case Grade.THREE_STAR:
      return COLORS.GRADE_3;
    case Grade.FOUR_STAR:
      return COLORS.GRADE_4;
    case Grade.FIVE_STAR:
      return COLORS.GRADE_5;
    default:
      return COLORS.WHITE;
  }
}

/**
 * Get color by element
 */
export function getElementColor(element: ElementType): number {
  switch (element) {
    case ElementType.FIRE:
      return COLORS.FIRE;
    case ElementType.WATER:
      return COLORS.WATER;
    case ElementType.WIND:
      return COLORS.WIND;
    case ElementType.LIGHT:
      return COLORS.LIGHT;
    case ElementType.DARK:
      return COLORS.DARK;
    default:
      return COLORS.WHITE;
  }
}

/**
 * Format number with comma separators
 */
export function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Calculate stat with level scaling
 */
export function calculateStat(
  baseStat: number,
  level: number,
  grade: Grade
): number {
  const gradeMultiplier = 1 + (grade - 1) * 0.3; // 30% per grade
  const levelMultiplier = 1 + (level - 1) * 0.05; // 5% per level
  return Math.floor(baseStat * gradeMultiplier * levelMultiplier);
}

/**
 * Calculate damage
 */
export function calculateDamage(
  atk: number,
  def: number,
  multiplier: number,
  elementAdvantage: number,
  isCritical: boolean,
  critDamage: number
): number {
  let damage = (atk * multiplier - def * 0.5) * elementAdvantage;
  
  if (isCritical) {
    damage *= critDamage / 100;
  }
  
  return Math.max(1, Math.floor(damage));
}

/**
 * Check if attack is critical hit
 */
export function isCriticalHit(critRate: number): boolean {
  return Math.random() * 100 < critRate;
}

/**
 * Check if effect hits based on accuracy and resistance
 */
export function checkEffectHit(accuracy: number, resistance: number): boolean {
  const hitChance = Math.max(15, Math.min(85, 85 + accuracy - resistance));
  return Math.random() * 100 < hitChance;
}

/**
 * Format time (seconds) to MM:SS format
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Calculate energy recovery time
 */
export function calculateEnergyRecoveryTime(
  currentEnergy: number,
  maxEnergy: number,
  recoveryRate: number
): number {
  const energyNeeded = maxEnergy - currentEnergy;
  return Math.ceil(energyNeeded / recoveryRate) * 5 * 60; // in seconds
}

/**
 * Get required experience for next level
 */
export function getRequiredExp(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

/**
 * Get max level for grade
 */
export function getMaxLevel(grade: Grade): number {
  switch (grade) {
    case Grade.ONE_STAR:
      return 15;
    case Grade.TWO_STAR:
      return 25;
    case Grade.THREE_STAR:
      return 35;
    case Grade.FOUR_STAR:
      return 45;
    case Grade.FIVE_STAR:
      return 60;
    default:
      return 60;
  }
}

/**
 * Clamp value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Linear interpolation
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

/**
 * Random integer between min and max (inclusive)
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Shuffle array (Fisher-Yates algorithm)
 */
export function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

/**
 * Deep clone object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Calculate total power of a character
 */
export function calculatePower(character: {
  currentHp: number;
  currentAtk: number;
  currentDef: number;
  currentSpd: number;
}): number {
  return Math.floor(
    character.currentHp * 0.5 +
    character.currentAtk * 2 +
    character.currentDef * 1.5 +
    character.currentSpd * 1
  );
}

/**
 * Get grade stars as string
 */
export function getGradeStars(grade: Grade): string {
  return '⭐'.repeat(grade);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}
