import type { 
  BattleState, 
  CharacterStats, 
  CharacterType,
  AttackType,
  FighterState,
  ComboHit,
  GuardType,
  MoveState
} from '@/types/game';
import { TYPE_EFFECTIVENESS } from '@/types/game';

// Constants
const CHIP_DAMAGE_PERCENT = 0.1; // 10% damage through block
const GUARD_BREAK_THRESHOLD = 20; // Guard gauge below this = guard break
const SUPER_METER_GAIN_ON_HIT = 5; // Reduced from 15 to require more hits
const SUPER_METER_GAIN_ON_DAMAGE = 3; // Reduced from 10
const COMBO_DAMAGE_SCALING = 0.85; // Each hit does 85% of previous
const THROW_DAMAGE_BASE = 20;
const STUN_DURATION_FRAMES = 30;

// Attack properties
const ATTACK_PROPERTIES: Record<AttackType, {
  damage: number;
  guardDamage: number;
  meterGain: number;
  startupFrames: number;
  canCancel: boolean;
  hitsHigh: boolean;
}> = {
  light: { damage: 7, guardDamage: 3, meterGain: 3, startupFrames: 5, canCancel: true, hitsHigh: true },
  medium: { damage: 10, guardDamage: 5, meterGain: 4, startupFrames: 8, canCancel: true, hitsHigh: true },
  heavy: { damage: 12, guardDamage: 8, meterGain: 5, startupFrames: 12, canCancel: false, hitsHigh: true },
  special: { damage: 45, guardDamage: 15, meterGain: 0, startupFrames: 15, canCancel: true, hitsHigh: true },
  super: { damage: 45, guardDamage: 25, meterGain: 0, startupFrames: 8, canCancel: false, hitsHigh: true },
  throw: { damage: 15, guardDamage: 0, meterGain: 4, startupFrames: 6, canCancel: false, hitsHigh: true }
};

/**
 * Initialize a fighter state
 */
export function createFighterState(character: CharacterStats): FighterState {
  const cappedHp = Math.min(character.maxHp, 50);
  return {
    hp: cappedHp,
    maxHp: cappedHp,
    superMeter: 0,
    guardGauge: 100,
    comboCounter: 0,
    currentCombo: [],
    isBlocking: false,
    guardType: 'none',
    moveState: 'idle',
    position: 0,
    isAirborne: false,
    stunDuration: 0
  };
}

/**
 * Calculate base damage with character stats
 */
function calculateBaseDamage(
  attacker: CharacterStats,
  defender: CharacterStats,
  attackType: AttackType,
  comboCount: number
): number {
  const baseAttack = ATTACK_PROPERTIES[attackType].damage;
  
  // Apply character attack stat
  let damage = baseAttack * (attacker.attack / 100);
  
  // Type effectiveness
  const effectiveness = TYPE_EFFECTIVENESS[attacker.type][defender.type];
  damage *= effectiveness;
  
  // Combo scaling (each hit in combo does less)
  if (comboCount > 0) {
    damage *= Math.pow(COMBO_DAMAGE_SCALING, comboCount);
  }
  
  // Defense reduction
  const defenseMultiplier = 100 / (100 + defender.defense);
  damage *= defenseMultiplier;
  
  // Random variance (95-105%)
  damage *= 0.95 + Math.random() * 0.1;
  
  return Math.floor(damage);
}

/**
 * Check if attack hits based on guard type
 */
function checkGuard(attackType: AttackType, guardType: GuardType, isAirborne: boolean): boolean {
  // Throws beat guard
  if (attackType === 'throw') {
    return false;
  }
  
  // Can't block in air
  if (isAirborne) {
    return false;
  }
  
  // No guard active
  if (guardType === 'none') {
    return false;
  }
  
  const hitsHigh = ATTACK_PROPERTIES[attackType].hitsHigh;
  
  // High guard blocks high attacks, low guard blocks low attacks
  if (hitsHigh && guardType === 'high') {
    return true;
  }
  if (!hitsHigh && guardType === 'low') {
    return true;
  }
  
  return false;
}

/**
 * Execute an attack action
 */
export function executeAttack(
  state: BattleState,
  attackType: AttackType,
  isPlayer: boolean
): BattleState {
  const newState = { ...state };
  const attacker = isPlayer ? state.playerCharacter : state.opponentCharacter;
  const defender = isPlayer ? state.opponentCharacter : state.playerCharacter;
  const attackerState = isPlayer ? { ...state.playerState } : { ...state.opponentState };
  const defenderState = isPlayer ? { ...state.opponentState } : { ...state.playerState };
  
  // Check if can attack (not stunned)
  if (attackerState.stunDuration > 0) {
    newState.battleLog = [...state.battleLog, `${attacker.name} is stunned!`];
    return newState;
  }
  
  // Check super meter for super moves
  if (attackType === 'super' && attackerState.superMeter < 100) {
    newState.battleLog = [...state.battleLog, `${attacker.name} needs full super meter!`];
    return newState;
  }
  
  // Special case: throw beats block
  if (attackType === 'throw' && defenderState.isBlocking) {
    const throwDamage = THROW_DAMAGE_BASE + (attacker.attack * 0.3);
    defenderState.hp = Math.max(0, defenderState.hp - throwDamage);
    defenderState.stunDuration = STUN_DURATION_FRAMES;
    defenderState.moveState = 'thrown';
    defenderState.isBlocking = false;
    attackerState.superMeter = Math.min(100, attackerState.superMeter + ATTACK_PROPERTIES.throw.meterGain);
    
    newState.battleLog = [...state.battleLog, `${attacker.name} throws ${defender.name} for ${Math.floor(throwDamage)} damage! 🤜`];
  }
  // Normal attack flow
  else {
    const isBlocked = checkGuard(attackType, defenderState.guardType, defenderState.isAirborne);
    const comboCount = attackerState.currentCombo.length;
    const baseDamage = calculateBaseDamage(attacker, defender, attackType, comboCount);
    
    let actualDamage = baseDamage;
    let logMessage = '';
    
    if (isBlocked) {
      // Chip damage through block
      actualDamage = Math.floor(baseDamage * CHIP_DAMAGE_PERCENT);
      const guardDamage = ATTACK_PROPERTIES[attackType].guardDamage;
      defenderState.guardGauge = Math.max(0, defenderState.guardGauge - guardDamage);
      
      // Guard break
      if (defenderState.guardGauge < GUARD_BREAK_THRESHOLD) {
        defenderState.stunDuration = STUN_DURATION_FRAMES * 1.5;
        defenderState.moveState = 'stunned';
        defenderState.isBlocking = false;
        logMessage = `${defender.name} GUARD BROKEN! ⚠️`;
      } else {
        logMessage = `${defender.name} blocks! ${actualDamage} chip damage`;
      }
    } else {
      // Clean hit
      logMessage = `${attacker.name} hits with ${attackType.toUpperCase()} attack! ${actualDamage} damage`;
      
      // Add to combo
      attackerState.currentCombo.push({
        damage: actualDamage,
        attackType,
        canCancel: ATTACK_PROPERTIES[attackType].canCancel
      });
      attackerState.comboCounter++;
      
      if (attackerState.comboCounter > 1) {
        logMessage += ` (${attackerState.comboCounter} HIT COMBO! 🔥)`;
      }
      
      // Gain super meter on hit
      attackerState.superMeter = Math.min(100, attackerState.superMeter + SUPER_METER_GAIN_ON_HIT);
      defenderState.superMeter = Math.min(100, defenderState.superMeter + SUPER_METER_GAIN_ON_DAMAGE);
    }
    
    // Apply damage
    defenderState.hp = Math.max(0, defenderState.hp - actualDamage);
    
    // Consume super meter
    if (attackType === 'super') {
      attackerState.superMeter = 0;
    }
    
    newState.battleLog = [...state.battleLog, logMessage];
  }
  
  // Update states
  if (isPlayer) {
    newState.playerState = attackerState;
    newState.opponentState = defenderState;
  } else {
    newState.opponentState = attackerState;
    newState.playerState = defenderState;
  }
  
  // Check for KO
  if (defenderState.hp <= 0) {
    newState.isGameOver = true;
    newState.winner = isPlayer ? 'player' : 'opponent';
    newState.battleLog.push(`${attacker.name} wins! K.O.! 💥`);
  } else {
    // Switch turns
    newState.turn = isPlayer ? 'opponent' : 'player';
  }
  
  newState.frameCount++;
  newState.lastAction = attackType;
  
  return newState;
}

/**
 * Execute block/guard action
 */
export function executeBlock(
  state: BattleState,
  guardType: GuardType,
  isPlayer: boolean
): BattleState {
  const newState = { ...state };
  const character = isPlayer ? state.playerCharacter : state.opponentCharacter;
  const fighterState = isPlayer ? { ...state.playerState } : { ...state.opponentState };
  
  fighterState.isBlocking = true;
  fighterState.guardType = guardType;
  fighterState.moveState = 'blocking';
  
  // Regenerate guard gauge slowly while not actively blocking attacks
  fighterState.guardGauge = Math.min(100, fighterState.guardGauge + 2);
  
  if (isPlayer) {
    newState.playerState = fighterState;
  } else {
    newState.opponentState = fighterState;
  }
  
  newState.battleLog = [...state.battleLog, `${character.name} guards ${guardType}!`];
  newState.turn = isPlayer ? 'opponent' : 'player';
  newState.lastAction = 'block';
  
  return newState;
}

/**
 * Execute movement action
 */
export function executeMovement(
  state: BattleState,
  action: 'dash' | 'jump' | 'walk',
  direction: 'forward' | 'back',
  isPlayer: boolean
): BattleState {
  const newState = { ...state };
  const character = isPlayer ? state.playerCharacter : state.opponentCharacter;
  const fighterState = isPlayer ? { ...state.playerState } : { ...state.opponentState };
  
  // Reset combo when moving
  fighterState.currentCombo = [];
  fighterState.comboCounter = 0;
  
  const dirMultiplier = direction === 'forward' ? 1 : -1;
  
  switch (action) {
    case 'walk':
      fighterState.position += character.walkSpeed * dirMultiplier;
      fighterState.moveState = 'walking';
      break;
    case 'dash':
      fighterState.position += character.dashSpeed * dirMultiplier;
      fighterState.moveState = 'dashing';
      break;
    case 'jump':
      fighterState.isAirborne = true;
      fighterState.moveState = 'jumping';
      // Reset blocking in air
      fighterState.isBlocking = false;
      fighterState.guardType = 'none';
      break;
  }
  
  // Clamp position
  fighterState.position = Math.max(-100, Math.min(100, fighterState.position));
  
  if (isPlayer) {
    newState.playerState = fighterState;
  } else {
    newState.opponentState = fighterState;
  }
  
  newState.battleLog = [...state.battleLog, `${character.name} ${action}s ${direction}!`];
  newState.turn = isPlayer ? 'opponent' : 'player';
  newState.lastAction = action;
  
  return newState;
}

/**
 * Update frame-based mechanics (stun, airborne state, etc.)
 */
export function updateFrameState(state: BattleState): BattleState {
  const newState = { ...state };
  
  // Update player stun
  if (newState.playerState.stunDuration > 0) {
    newState.playerState.stunDuration--;
    if (newState.playerState.stunDuration === 0) {
      newState.playerState.moveState = 'idle';
    }
  }
  
  // Update opponent stun
  if (newState.opponentState.stunDuration > 0) {
    newState.opponentState.stunDuration--;
    if (newState.opponentState.stunDuration === 0) {
      newState.opponentState.moveState = 'idle';
    }
  }
  
  // Landing from jump (simplified)
  if (newState.playerState.isAirborne && state.frameCount % 20 === 0) {
    newState.playerState.isAirborne = false;
    newState.playerState.moveState = 'idle';
  }
  if (newState.opponentState.isAirborne && state.frameCount % 20 === 0) {
    newState.opponentState.isAirborne = false;
    newState.opponentState.moveState = 'idle';
  }
  
  return newState;
}

/**
 * Initialize a new battle with fighting game states
 */
export function initializeFightingBattle(
  playerCharacter: CharacterStats,
  opponentCharacter: CharacterStats
): BattleState {
  return {
    playerCharacter: { ...playerCharacter, hp: playerCharacter.maxHp },
    opponentCharacter: { ...opponentCharacter, hp: opponentCharacter.maxHp },
    playerState: createFighterState(playerCharacter),
    opponentState: createFighterState(opponentCharacter),
    playerPowerUp: {
      id: '1',
      name: 'Super Meter',
      effect: 'Enables super moves',
      charges: 0,
      maxCharges: 100
    },
    turn: Math.random() > 0.5 ? 'player' : 'opponent',
    battleLog: ['Fight begins!'],
    isGameOver: false,
    winner: null,
    frameCount: 0,
    lastAction: null
  };
}
