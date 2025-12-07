import type { BattleState, CharacterStats, CharacterType, GuardType, MoveState } from '@/types/game';
import { TYPE_EFFECTIVENESS } from '@/types/game';

/**
 * Calculate damage dealt in an attack
 */
export function calculateDamage(
  attacker: CharacterStats,
  defender: CharacterStats,
  isPowerUp: boolean = false
): number {
  // Base damage
  let damage = attacker.attack;
  
  // Apply defense reduction
  const defenseMultiplier = 100 / (100 + defender.defense);
  damage *= defenseMultiplier;
  
  // Type effectiveness
  const effectiveness = TYPE_EFFECTIVENESS[attacker.type][defender.type];
  damage *= effectiveness;
  
  // Power-up bonus
  if (isPowerUp) {
    damage *= 1.5;
  }
  
  // Random variance (90-110%)
  damage *= 0.9 + Math.random() * 0.2;
  
  // Critical hit chance (15%)
  if (Math.random() < 0.15) {
    damage *= 2;
  }
  
  return Math.floor(damage);
}

/**
 * Execute a turn in the battle
 */
export function executeTurn(
  state: BattleState,
  action: 'attack' | 'special' | 'defend'
): BattleState {
  const newState = { ...state };
  const isPlayerTurn = state.turn === 'player';
  
  const attacker = isPlayerTurn ? state.playerCharacter : state.opponentCharacter;
  const defender = isPlayerTurn ? state.opponentCharacter : state.playerCharacter;
  const attackerHp = isPlayerTurn ? state.playerState.hp : state.opponentState.hp;
  const defenderHp = isPlayerTurn ? state.opponentState.hp : state.playerState.hp;
  
  let damage = 0;
  let logMessage = '';
  
  switch (action) {
    case 'attack':
      damage = calculateDamage(attacker, defender, false);
      logMessage = `${attacker.name} attacks for ${damage} damage!`;
      break;
      
    case 'special':
      if (isPlayerTurn && state.playerPowerUp.charges < state.playerPowerUp.maxCharges) {
        logMessage = 'Not enough power-up charges!';
        break;
      }
      damage = calculateDamage(attacker, defender, true);
      logMessage = `${attacker.name} uses ${attacker.specialAbility} for ${damage} damage!`;
      if (isPlayerTurn) {
        newState.playerPowerUp.charges = 0;
      }
      break;
      
    case 'defend':
      damage = 0;
      logMessage = `${attacker.name} defends! Defense increased.`;
      // Increase defense temporarily
      if (isPlayerTurn) {
        newState.playerCharacter.defense += 20;
      } else {
        newState.opponentCharacter.defense += 20;
      }
      break;
  }
  
  // Apply damage
  const newDefenderHp = Math.max(0, defenderHp - damage);
  
  if (isPlayerTurn) {
    newState.opponentState.hp = newDefenderHp;
    newState.playerPowerUp.charges = Math.min(
      newState.playerPowerUp.charges + 1,
      newState.playerPowerUp.maxCharges
    );
  } else {
    newState.playerState.hp = newDefenderHp;
  }
  
  // Add to battle log
  newState.battleLog = [...state.battleLog, logMessage];
  
  // Check for game over
  if (newState.playerState.hp <= 0) {
    newState.isGameOver = true;
    newState.winner = 'opponent';
    newState.battleLog.push('You lost the battle!');
  } else if (newState.opponentState.hp <= 0) {
    newState.isGameOver = true;
    newState.winner = 'player';
    newState.battleLog.push('You won the battle!');
  } else {
    // Switch turns
    newState.turn = isPlayerTurn ? 'opponent' : 'player';
  }
  
  return newState;
}

/**
 * Execute AI opponent turn
 */
export function executeAITurn(state: BattleState): BattleState {
  // Simple AI: 70% attack, 20% special if available, 10% defend
  const rand = Math.random();
  let action: 'attack' | 'special' | 'defend';
  
  if (rand < 0.7) {
    action = 'attack';
  } else if (rand < 0.9 && state.opponentState.hp < state.opponentCharacter.maxHp * 0.3) {
    action = 'defend';
  } else {
    action = 'attack';
  }
  
  return executeTurn(state, action);
}

/**
 * Initialize a new battle
 */
export function initializeBattle(
  playerCharacter: CharacterStats,
  opponentCharacter: CharacterStats
): BattleState {
  return {
    playerCharacter: { ...playerCharacter },
    opponentCharacter: { ...opponentCharacter },
    playerState: {
      hp: playerCharacter.maxHp,
      maxHp: playerCharacter.maxHp,
      superMeter: 0,
      guardGauge: 100,
      comboCounter: 0,
      currentCombo: [],
      isBlocking: false,
      guardType: 'none' as GuardType,
      position: 0,
      moveState: 'idle' as MoveState,
      isAirborne: false,
      stunDuration: 0
    },
    opponentState: {
      hp: opponentCharacter.maxHp,
      maxHp: opponentCharacter.maxHp,
      superMeter: 0,
      guardGauge: 100,
      comboCounter: 0,
      currentCombo: [],
      isBlocking: false,
      guardType: 'none' as GuardType,
      position: 0,
      moveState: 'idle' as MoveState,
      isAirborne: false,
      stunDuration: 0
    },
    playerPowerUp: {
      id: 'power-up',
      name: 'Power Up',
      effect: 'Increased damage',
      charges: 0,
      maxCharges: 3
    },
    turn: playerCharacter.speed >= opponentCharacter.speed ? 'player' : 'opponent',
    battleLog: ['Battle started!'],
    isGameOver: false,
    winner: null,
    frameCount: 0,
    lastAction: null
  };
}

/**
 * Initialize battle with character types
 */
export function initBattle(
  playerType: CharacterType,
  opponentType: CharacterType
): BattleState {
  const { CHARACTERS } = require('@/types/game');
  const playerChar = { ...CHARACTERS[playerType], hp: CHARACTERS[playerType].maxHp };
  const opponentChar = { ...CHARACTERS[opponentType], hp: CHARACTERS[opponentType].maxHp };
  return initializeBattle(playerChar, opponentChar);
}

/**
 * Check if game is over
 */
export function isGameOver(state: BattleState): boolean {
  return state.isGameOver || state.playerState.hp <= 0 || state.opponentState.hp <= 0;
}

/**
 * Get effectiveness message
 */
export function getEffectivenessMessage(attacker: CharacterType, defender: CharacterType): string {
  const effectiveness = TYPE_EFFECTIVENESS[attacker][defender];
  if (effectiveness > 1.5) return "It's super effective!";
  if (effectiveness < 0.75) return "It's not very effective...";
  return '';
}
