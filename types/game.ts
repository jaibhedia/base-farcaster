// Character Types
export type CharacterType = 'fire' | 'ice' | 'spider' | 'fart' | 'stone' | 'punch' | 'jelly' | 'electro';

export interface CharacterStats {
  type: CharacterType;
  name: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  specialAbility: string;
  image: string;
  description: string;
  // Fighting game stats
  walkSpeed: number;
  dashSpeed: number;
  jumpHeight: number;
}

export interface PowerUp {
  id: string;
  name: string;
  effect: string;
  charges: number;
  maxCharges: number;
}

export type AttackType = 'light' | 'medium' | 'heavy' | 'special' | 'super' | 'throw';
export type GuardType = 'high' | 'low' | 'none';
export type MoveState = 'idle' | 'walking' | 'dashing' | 'jumping' | 'attacking' | 'blocking' | 'stunned' | 'thrown';

export interface ComboHit {
  damage: number;
  attackType: AttackType;
  canCancel: boolean;
}

export interface FighterState {
  hp: number;
  maxHp: number;
  superMeter: number; // 0-100
  guardGauge: number; // 0-100, depletes when blocking
  comboCounter: number;
  currentCombo: ComboHit[];
  isBlocking: boolean;
  guardType: GuardType;
  moveState: MoveState;
  position: number; // -100 to 100 (horizontal)
  isAirborne: boolean;
  stunDuration: number; // frames
}

export interface BattleState {
  playerCharacter: CharacterStats;
  opponentCharacter: CharacterStats;
  playerState: FighterState;
  opponentState: FighterState;
  playerPowerUp: PowerUp;
  turn: 'player' | 'opponent';
  battleLog: string[];
  isGameOver: boolean;
  winner: 'player' | 'opponent' | null;
  frameCount: number;
  lastAction: AttackType | 'block' | 'dash' | 'jump' | 'walk' | null;
}

export interface Player {
  address: string;
  username: string;
  wins: number;
  score: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
}

// Character base data (without hp which is dynamic)
interface CharacterData {
  type: CharacterType;
  name: string;
  attack: number;
  defense: number;
  speed: number;
  maxHp: number;
  specialAbility: string;
  image: string;
  description: string;
  walkSpeed: number;
  dashSpeed: number;
  jumpHeight: number;
}

// Character base stats
export const CHARACTERS: Record<CharacterType, CharacterData> = {
  fire: {
    type: 'fire',
    name: 'Fire Warrior',
    attack: 90,
    defense: 50,
    speed: 75,
    maxHp: 85,
    specialAbility: 'Flame Burst',
    image: '/characters/fire.png',
    description: 'High damage dealer with burning attacks',
    walkSpeed: 4,
    dashSpeed: 8,
    jumpHeight: 6
  },
  ice: {
    type: 'ice',
    name: 'Iced Out',
    attack: 70,
    defense: 65,
    speed: 60,
    maxHp: 80,
    specialAbility: 'Frost Nova',
    image: '/characters/ice.png',
    description: 'Freezes enemies and controls the battlefield',
    walkSpeed: 3,
    dashSpeed: 6,
    jumpHeight: 5
  },
  spider: {
    type: 'spider',
    name: 'Spider Assassin',
    attack: 85,
    defense: 45,
    speed: 95,
    maxHp: 70,
    specialAbility: 'Web Trap',
    image: '/characters/spider.png',
    description: 'Lightning fast with multi-hit attacks',
    walkSpeed: 5,
    dashSpeed: 10,
    jumpHeight: 8
  },
  fart: {
    type: 'fart',
    name: 'Fart Cloud',
    attack: 60,
    defense: 55,
    speed: 70,
    maxHp: 90,
    specialAbility: 'Toxic Gas',
    image: '/characters/fart.png',
    description: 'Poison damage over time specialist',
    walkSpeed: 3.5,
    dashSpeed: 7,
    jumpHeight: 4
  },
  stone: {
    type: 'stone',
    name: 'Stoner',
    attack: 65,
    defense: 85,
    speed: 30,
    maxHp: 120,
    specialAbility: 'Earthquake',
    image: '/characters/stoner.png',
    description: 'Massive tank that absorbs damage',
    walkSpeed: 2,
    dashSpeed: 4,
    jumpHeight: 3
  },
  punch: {
    type: 'punch',
    name: 'Power Puncher',
    attack: 95,
    defense: 50,
    speed: 60,
    maxHp: 95,
    specialAbility: 'Mega Punch',
    image: '/characters/boxer.png',
    description: 'Critical strike focused berserker',
    walkSpeed: 3,
    dashSpeed: 7,
    jumpHeight: 5
  },
  jelly: {
    type: 'jelly',
    name: 'Jello',
    attack: 50,
    defense: 75,
    speed: 55,
    maxHp: 100,
    specialAbility: 'Absorb',
    image: '/characters/jello.png',
    description: 'Self-healing support character',
    walkSpeed: 2.5,
    dashSpeed: 5,
    jumpHeight: 4
  },
  electro: {
    type: 'electro',
    name: 'Electro',
    attack: 88,
    defense: 55,
    speed: 90,
    maxHp: 82,
    specialAbility: 'Thunder Strike',
    image: '/characters/electro.png',
    description: 'Electric speedster with shocking attacks',
    walkSpeed: 4.5,
    dashSpeed: 9,
    jumpHeight: 7
  }
};

// Type effectiveness matrix (attacker -> defender)
export const TYPE_EFFECTIVENESS: Record<CharacterType, Record<CharacterType, number>> = {
  fire: { fire: 1.0, ice: 2.0, spider: 1.5, fart: 1.0, stone: 0.5, punch: 1.0, jelly: 1.0, electro: 1.0 },
  ice: { fire: 0.5, ice: 1.0, spider: 1.0, fart: 1.0, stone: 1.5, punch: 1.0, jelly: 0.5, electro: 1.5 },
  spider: { fire: 0.5, ice: 1.0, spider: 1.0, fart: 1.5, stone: 1.5, punch: 0.5, jelly: 1.5, electro: 0.5 },
  fart: { fire: 1.0, ice: 1.0, spider: 0.5, fart: 1.0, stone: 1.0, punch: 1.5, jelly: 1.0, electro: 1.0 },
  stone: { fire: 2.0, ice: 0.5, spider: 0.5, fart: 1.0, stone: 1.0, punch: 0.5, jelly: 1.5, electro: 0.5 },
  punch: { fire: 1.0, ice: 1.0, spider: 1.5, fart: 0.5, stone: 2.0, punch: 1.0, jelly: 0.5, electro: 1.0 },
  jelly: { fire: 1.0, ice: 1.5, spider: 0.5, fart: 1.0, stone: 0.5, punch: 1.5, jelly: 1.0, electro: 1.5 },
  electro: { fire: 1.0, ice: 0.5, spider: 2.0, fart: 1.5, stone: 2.0, punch: 1.0, jelly: 0.5, electro: 1.0 }
};

// Tier thresholds
export const TIER_THRESHOLDS = {
  bronze: 0,
  silver: 500,
  gold: 1500,
  platinum: 3000,
  diamond: 5000
};
