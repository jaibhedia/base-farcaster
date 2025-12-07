'use client'

import { useState, useEffect } from 'react'
import { Sword, Shield, Zap, Move, Target } from 'lucide-react'
import type { CharacterType, BattleState, AttackType, GuardType } from '@/types/game'
import { CHARACTERS } from '@/types/game'
import { 
  initializeFightingBattle, 
  executeAttack, 
  executeBlock, 
  executeMovement,
  updateFrameState 
} from '@/lib/fightingMechanics'

interface FightingBattleProps {
  playerCharacter: CharacterType
  onBattleEnd: (won: boolean, score: number, opponentCharacter: CharacterType, damageDealt: number) => void
}

export function FightingBattle({ playerCharacter, onBattleEnd }: FightingBattleProps) {
  const [battleState, setBattleState] = useState<BattleState | null>(null)
  const [animState, setAnimState] = useState<'idle' | 'attack' | 'defend' | 'dash' | 'jump'>('idle')
  const [specialEffect, setSpecialEffect] = useState<CharacterType | null>(null)
  const [attackEffect, setAttackEffect] = useState<boolean>(false)
  const [showFightStart, setShowFightStart] = useState<boolean>(true)
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [opponentCharacter, setOpponentCharacter] = useState<CharacterType | null>(null)
  const [totalDamageDealt, setTotalDamageDealt] = useState<number>(0)
  const [defenseMinigame, setDefenseMinigame] = useState<{
    active: boolean;
    progress: number;
    targetZone: { start: number; end: number };
    success: boolean | null;
  } | null>(null)
  const [buttonMashes, setButtonMashes] = useState<number>(0)
  const [successfulAttacks, setSuccessfulAttacks] = useState<number>(0)
  const [enemyShake, setEnemyShake] = useState<boolean>(false)
  const [playerShake, setPlayerShake] = useState<boolean>(false)

  // Initialize battle on mount with fight start animation
  useEffect(() => {
    const characterTypes: CharacterType[] = ['fire', 'ice', 'spider', 'fart', 'stone', 'punch', 'jelly', 'electro']
    const randomOpponent = characterTypes[Math.floor(Math.random() * characterTypes.length)]
    setOpponentCharacter(randomOpponent)
    const playerChar = { ...CHARACTERS[playerCharacter], hp: CHARACTERS[playerCharacter].maxHp }
    const opponentChar = { ...CHARACTERS[randomOpponent], hp: CHARACTERS[randomOpponent].maxHp }
    const initialState = initializeFightingBattle(playerChar, opponentChar)
    setBattleState(initialState)
    
    // Show Tekken-style "FIGHT!" animation for 2 seconds
    setTimeout(() => setShowFightStart(false), 2000)
  }, [playerCharacter])

  // Frame update loop
  useEffect(() => {
    if (!battleState || battleState.isGameOver) return
    
    const frameInterval = setInterval(() => {
      setBattleState(prev => prev ? updateFrameState(prev) : prev)
    }, 16) // ~60 FPS
    
    return () => clearInterval(frameInterval)
  }, [battleState?.isGameOver])

  // Check for game over
  useEffect(() => {
    if (battleState?.isGameOver && opponentCharacter) {
      const won = battleState.winner === 'player'
      const score = won ? 100 + battleState.playerState.hp : 25
      setTimeout(() => onBattleEnd(won, score, opponentCharacter, totalDamageDealt), 2000)
    }
  }, [battleState?.isGameOver, battleState?.winner, opponentCharacter, totalDamageDealt, onBattleEnd])

  const handleAttack = (attackType: AttackType) => {
    if (!battleState || battleState.isGameOver || isProcessing) return
    
    setIsProcessing(true)
    
    if (attackType === 'light') {
      setAttackEffect(true)
      setTimeout(() => setAttackEffect(false), 500)
    } else if (attackType === 'special') {
      setSpecialEffect(battleState.playerCharacter.type)
      setTimeout(() => setSpecialEffect(null), 1500)
      // Reset counter after special
      setSuccessfulAttacks(0)
    }
    
    setAnimState('attack')
    
    // Trigger player shake when attacking (recoil effect)
    setPlayerShake(true)
    setTimeout(() => setPlayerShake(false), 300)
    
    const previousOpponentHp = battleState.opponentState.hp
    const newState = executeAttack(battleState, attackType, true)
    const damageThisHit = previousOpponentHp - newState.opponentState.hp
    setTotalDamageDealt(prev => prev + damageThisHit)
    
    // Trigger enemy shake when hit
    if (damageThisHit > 0) {
      setEnemyShake(true)
      setTimeout(() => setEnemyShake(false), 400)
    }
    
    // Increment successful attacks counter for light attacks
    if (attackType === 'light' && damageThisHit > 0) {
      setSuccessfulAttacks(prev => prev + 1)
    }
    
    setBattleState(newState)
    
    setTimeout(() => {
      setAnimState('idle')
      // AI always counterattacks - trigger defense minigame
      if (!newState.isGameOver) {
        setTimeout(() => {
          startDefenseMinigame(newState)
        }, 800)
      } else {
        setIsProcessing(false)
      }
    }, 600)
  }



  const startDefenseMinigame = (state: BattleState) => {
    // Create random target zone (20% window)
    const targetStart = Math.random() * 70 + 10 // Between 10-80
    setDefenseMinigame({
      active: true,
      progress: 0,
      targetZone: { start: targetStart, end: targetStart + 20 },
      success: null
    })
    setButtonMashes(0)
    
    // Auto-progress the indicator
    let progress = 0
    const interval = setInterval(() => {
      progress += 3
      setDefenseMinigame(prev => prev ? { ...prev, progress } : null)
      
      if (progress >= 100) {
        clearInterval(interval)
        // Failed to defend in time
        completeDefenseMinigame(false, state)
      }
    }, 30)
    
    // Store interval for cleanup
    ;(window as any).defenseInterval = interval
  }
  
  const handleDefenseMash = () => {
    if (!defenseMinigame?.active || defenseMinigame.success !== null) return
    
    const newMashes = buttonMashes + 1
    setButtonMashes(newMashes)
    
    // Check if in target zone (need 3 mashes in zone)
    const { progress, targetZone } = defenseMinigame
    if (progress >= targetZone.start && progress <= targetZone.end) {
      if (newMashes >= 3) {
        // Success! Stop the minigame
        if ((window as any).defenseInterval) {
          clearInterval((window as any).defenseInterval)
        }
        completeDefenseMinigame(true, battleState!)
      }
    } else {
      // Reset mashes if outside zone
      setButtonMashes(0)
    }
  }
  
  const completeDefenseMinigame = (success: boolean, state: BattleState) => {
    setDefenseMinigame(prev => prev ? { ...prev, active: false, success } : null)
    
    setTimeout(() => {
      const aiAction: AttackType = Math.random() > 0.6 ? 'special' : 'light'
      
      if (success) {
        // Perfect defense - block the attack
        setAnimState('defend')
        const blockState = executeBlock(state, 'high', true)
        const aiState = executeAttack(blockState, aiAction, false)
        setBattleState(aiState)
        setTimeout(() => setAnimState('idle'), 400)
      } else {
        // Failed defense - take full damage
        const aiState = executeAttack(state, aiAction, false)
        setBattleState(aiState)
      }
      
      // Return to player turn
      setTimeout(() => {
        setIsProcessing(false)
        setDefenseMinigame(null)
        setButtonMashes(0)
      }, 800)
    }, 500)
  }
  
  const handleMovement = (action: 'dash' | 'jump', direction: 'forward' | 'back') => {
    if (!battleState || battleState.isGameOver) return
    
    setAnimState(action)
    const newState = executeMovement(battleState, action, direction, true)
    setBattleState(newState)
    
    setTimeout(() => setAnimState('idle'), 400)
  }

  if (!battleState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  const playerChar = battleState.playerCharacter
  const opponentChar = battleState.opponentCharacter
  const playerState = battleState.playerState
  const opponentState = battleState.opponentState

  const getCharacterImage = (type: CharacterType): string => {
    return CHARACTERS[type].image
  }

  return (
    <div className="h-screen w-screen bg-black text-white flex flex-col overflow-hidden fixed inset-0">
      {/* Top HUD - HP Only */}
      <div className="w-full px-4 py-3 flex justify-between items-center gap-4 flex-shrink-0 z-20">
        {/* Player Stats (Left) */}
        <div className="flex-1 max-w-[45%]">
          <div className="text-xs font-bold mb-1 text-white truncate">{playerChar.name}</div>
          <div className="w-full">
            {/* HP Bar */}
            <div className="bg-gray-900 h-6 rounded overflow-hidden border border-red-800 relative">
              <div 
                className="h-full bg-gradient-to-r from-red-600 to-red-500 transition-all duration-300"
                style={{ width: `${(playerState.hp / playerState.maxHp) * 100}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white" style={{ textShadow: '0 1px 2px black' }}>
                {playerState.hp}/{playerState.maxHp}
              </div>
            </div>
          </div>
        </div>

        {/* AI Stats (Right) */}
        <div className="flex-1 max-w-[45%] text-right">
          <div className="text-xs font-bold mb-1 text-gray-400 truncate">{opponentChar.name}</div>
          <div className="w-full">
            {/* HP Bar */}
            <div className="bg-gray-900 h-6 rounded overflow-hidden border border-red-800 relative">
              <div 
                className="h-full bg-gradient-to-r from-red-500 to-red-600 transition-all duration-300"
                style={{ width: `${(opponentState.hp / opponentState.maxHp) * 100}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white" style={{ textShadow: '0 1px 2px black' }}>
                {opponentState.hp}/{opponentState.maxHp}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tekken-Style Fight Start Animation */}
      {showFightStart && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 pointer-events-none">
          <div className="animate-fight-start">
            <div className="text-4xl md:text-5xl font-black text-white tracking-widest" style={{ textShadow: '0 0 20px rgba(255,0,0,0.8), 0 0 40px rgba(255,0,0,0.6)' }}>
              FIGHT!
            </div>
          </div>
        </div>
      )}

      {/* WWE 2K Defense Minigame */}
      {defenseMinigame?.active && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black bg-opacity-70">
          <div className="text-2xl font-bold text-red-500 mb-4 animate-pulse">
            INCOMING ATTACK!
          </div>
          <div className="text-lg text-white mb-6">
            Mash DEFEND to counter! ({buttonMashes}/3)
          </div>
          
          {/* Progress Bar */}
          <div className="w-3/4 max-w-2xl">
            <div className="relative h-12 bg-gray-800 rounded-lg border-4 border-gray-600 overflow-hidden">
              {/* Target Zone */}
              <div 
                className="absolute h-full bg-green-500 opacity-30"
                style={{ 
                  left: `${defenseMinigame.targetZone.start}%`,
                  width: `${defenseMinigame.targetZone.end - defenseMinigame.targetZone.start}%`
                }}
              />
              
              {/* Moving Indicator */}
              <div 
                className="absolute top-0 w-2 h-full bg-white shadow-lg transition-all"
                style={{ left: `${defenseMinigame.progress}%` }}
              >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-white" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-b-8 border-transparent border-b-white" />
              </div>
            </div>
            
            <div className="flex justify-between mt-2 text-xs text-gray-400">
              <span>TOO EARLY</span>
              <span className="text-green-400 font-bold">PERFECT ZONE</span>
              <span>TOO LATE</span>
            </div>
          </div>
          
          {defenseMinigame.success !== null && (
            <div className={`mt-6 text-3xl font-bold animate-bounce ${
              defenseMinigame.success ? 'text-green-400' : 'text-red-500'
            }`}>
              {defenseMinigame.success ? '✓ BLOCKED!' : '✗ FAILED!'}
            </div>
          )}
        </div>
      )}

      {/* Battle Arena */}
      <div className="flex-1 flex items-center justify-center px-8 relative overflow-hidden min-h-0" style={{
        backgroundImage: 'url(/arena-bg.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}>
        {/* Overlay for better character visibility */}
        <div className="absolute inset-0 bg-black opacity-40 pointer-events-none"></div>
        
        {/* Content wrapper with higher z-index */}
        <div className="relative z-10 flex items-center justify-center w-full pointer-events-none">
        {/* Special Effect Animations */}
        {specialEffect && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            {/* Background glow effect */}
            <div className="absolute inset-0 bg-gradient-radial from-white/20 to-transparent animate-pulse"></div>
            {/* Fire - Fireball */}
            {specialEffect === 'fire' && (
              <div className="animate-fireball relative">
                <div className="text-9xl animate-spin-slow" style={{ filter: 'drop-shadow(0 0 30px rgba(255,100,0,0.8))' }}>🔥</div>
                <div className="absolute inset-0 bg-orange-500 opacity-20 blur-3xl rounded-full"></div>
              </div>
            )}
            
            {/* Ice - Freeze Effect */}
            {specialEffect === 'ice' && (
              <div className="animate-freeze">
                <div className="text-9xl">🧊</div>
                <div className="absolute inset-0 bg-blue-500 opacity-30 animate-pulse"></div>
              </div>
            )}
            
            {/* Spider - Web Trap */}
            {specialEffect === 'spider' && (
              <div className="animate-web-trap">
                <div className="text-9xl animate-pulse">🕸️</div>
              </div>
            )}
            
            {/* Fart - Toxic Cloud */}
            {specialEffect === 'fart' && (
              <div className="animate-fart-cloud">
                <div className="text-9xl opacity-80 animate-bounce">💨</div>
                <div className="absolute inset-0 bg-green-600 opacity-20 animate-pulse rounded-full blur-3xl"></div>
              </div>
            )}
            
            {/* Stone - Rock Throw */}
            {specialEffect === 'stone' && (
              <div className="animate-rock-throw">
                <div className="text-9xl">🪨</div>
              </div>
            )}
            
            {/* Punch - Hulk Smash */}
            {specialEffect === 'punch' && (
              <div className="animate-hulk-punch">
                <div className="text-9xl animate-bounce">👊</div>
                <div className="absolute inset-0 bg-red-600 opacity-40 animate-ping"></div>
              </div>
            )}
            
            {/* Jelly - Slippery Trap */}
            {specialEffect === 'jelly' && (
              <div className="animate-slippery">
                <div className="text-9xl animate-wiggle">🟣</div>
                <div className="absolute bottom-0 left-0 right-0 h-20 bg-purple-500 opacity-50 blur-xl"></div>
              </div>
            )}
            
            {/* Electro - Lightning Bolts */}
            {specialEffect === 'electro' && (
              <div className="animate-lightning-strike relative">
                <div className="text-9xl" style={{ filter: 'drop-shadow(0 0 40px rgba(255,255,0,0.9))' }}>⚡</div>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-full bg-yellow-400 opacity-90 animate-pulse" style={{ boxShadow: '0 0 20px yellow' }}></div>
                <div className="absolute inset-0 bg-yellow-300 opacity-30 animate-ping"></div>
              </div>
            )}
          </div>
        )}

        {/* Attack Effect - Punch Impact */}
        {attackEffect && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="animate-punch-impact">
              <div className="text-8xl">💥</div>
            </div>
          </div>
        )}

        {/* Player Character (Left) */}
        <div className={`relative transition-all duration-300 animate-breathe pointer-events-none ${
          animState === 'attack' ? 'animate-attack-forward' : ''
        } ${animState === 'defend' ? 'animate-spin-slow' : ''
        } ${animState === 'dash' ? 'translate-x-[-20px]' : ''
        } ${playerShake ? 'animate-character-shake' : ''}
        } ${playerState.moveState === 'stunned' ? 'opacity-50 animate-pulse' : ''}`}>
          <div className="w-40 h-40 md:w-48 md:h-48" style={{
            transform: `scale(1.2) translateX(${playerState.position}px)`,
            transition: 'transform 0.3s'
          }}>
            <img 
              src={getCharacterImage(playerChar.type)} 
              alt={playerChar.name}
              className="w-full h-full object-contain"
            />
          </div>
          {playerState.isBlocking && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Shield className="w-16 h-16 text-blue-400 animate-pulse" />
            </div>
          )}
        </div>

        {/* VS indicator */}
        <div className="mx-8 md:mx-16 text-4xl font-bold text-gray-700">VS</div>

        {/* AI Character (Right) */}
        <div className={`relative transition-all duration-300 animate-breathe pointer-events-none ${
          enemyShake ? 'animate-character-shake' : ''
        } ${opponentState.moveState === 'stunned' ? 'opacity-50 animate-pulse' : ''
        } ${opponentState.moveState === 'thrown' ? 'animate-bounce' : ''
        } ${specialEffect === 'ice' ? 'animate-freeze-shake' : ''
        } ${specialEffect === 'jelly' ? 'animate-slip' : ''}`}>
          <div className="w-40 h-40 md:w-48 md:h-48 transform scale-x-[-1]" style={{
            transform: `scale(-1.2, 1.2) translateX(${opponentState.position}px)`,
            transition: 'transform 0.3s'
          }}>
            <img 
              src={getCharacterImage(opponentChar.type)} 
              alt={opponentChar.name}
              className="w-full h-full object-contain"
            />
          </div>
          {opponentState.isBlocking && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Shield className="w-16 h-16 text-blue-400 animate-pulse" />
            </div>
          )}
        </div>
        </div>
      </div>

      {/* Controls */}
      <div className="p-4 bg-gray-950 border-t border-gray-800 flex-shrink-0 pointer-events-auto relative z-30 w-full">
        {/* Super Meter */}
        <div className="mb-4">
          <div className="w-full bg-gray-800 h-3 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 transition-all duration-300"
              style={{ width: `${playerState.superMeter}%` }}
            />
          </div>
        </div>
        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={() => handleAttack('light')}
            disabled={isProcessing || defenseMinigame?.active}
            className="flex flex-col items-center justify-center py-6 bg-red-900 hover:bg-red-800 disabled:opacity-30 disabled:cursor-not-allowed border-2 border-red-700 rounded-xl transition-all pointer-events-auto"
          >
            <Sword className="w-10 h-10 mb-2" />
            <span className="text-base font-bold">Attack</span>
          </button>
          <button
            onClick={() => handleDefenseMash()}
            disabled={!defenseMinigame?.active}
            className={`flex flex-col items-center justify-center py-6 transition-all pointer-events-auto ${
              defenseMinigame?.active 
                ? 'bg-yellow-600 hover:bg-yellow-500 border-yellow-400 animate-pulse' 
                : 'bg-gray-700 border-gray-600 opacity-50 cursor-not-allowed'
            } border-2 rounded-xl`}
          >
            <Shield className="w-10 h-10 mb-2" />
            <span className="text-base font-bold">{defenseMinigame?.active ? 'MASH!' : 'Defend'}</span>
          </button>
          <button
            onClick={() => handleAttack('special')}
            disabled={isProcessing || defenseMinigame?.active || successfulAttacks < 4}
            className="flex flex-col items-center justify-center py-6 bg-purple-900 hover:bg-purple-800 disabled:opacity-30 disabled:cursor-not-allowed border-2 border-purple-700 rounded-xl transition-all pointer-events-auto relative"
          >
            <Zap className="w-10 h-10 mb-2" />
            <span className="text-base font-bold">Special</span>
            {successfulAttacks < 4 && (
              <span className="absolute top-1 right-1 text-xs bg-black/70 px-2 py-1 rounded">
                {successfulAttacks}/4
              </span>
            )}
          </button>
        </div>
      </div>

      {battleState.isGameOver && (
        <div className="absolute inset-0 bg-black bg-opacity-90 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl font-bold mb-4">
              {battleState.winner === 'player' ? '🏆 VICTORY! 🏆' : '💀 DEFEATED 💀'}
            </div>
            <div className="text-2xl text-gray-400">
              {battleState.winner === 'player' ? 'You win!' : 'Game Over'}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slash {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(-40px); }
        }
        @keyframes attack-forward {
          0% { transform: translateX(0) scale(1.2) rotate(0deg); }
          20% { transform: translateX(-10px) scale(1.25) rotate(-3deg); }
          40% { transform: translateX(80px) scale(1.3) rotate(5deg); }
          50% { transform: translateX(80px) scale(1.3) rotate(-5deg); }
          60% { transform: translateX(80px) scale(1.3) rotate(0deg); }
          80% { transform: translateX(-5px) scale(1.22) rotate(0deg); }
          100% { transform: translateX(0) scale(1.2) rotate(0deg); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        /* Fire - Fireball shooting from left to right */
        @keyframes fireball {
          0% { transform: translateX(-200px) translateY(0) scale(0.3) rotate(0deg); opacity: 0; }
          30% { transform: translateX(-50px) translateY(-20px) scale(0.8) rotate(180deg); opacity: 1; }
          50% { transform: translateX(50px) translateY(0) scale(1.5) rotate(360deg); opacity: 1; }
          70% { transform: translateX(150px) translateY(-30px) scale(1.2) rotate(540deg); opacity: 0.8; }
          100% { transform: translateX(250px) translateY(0) scale(0.5) rotate(720deg); opacity: 0; }
        }
        
        /* Ice - Freeze and shatter */
        @keyframes freeze {
          0% { transform: scale(1); filter: brightness(1); }
          50% { transform: scale(1.1); filter: brightness(2) hue-rotate(200deg); }
          75% { transform: scale(1.1); }
          100% { transform: scale(1) rotate(5deg); filter: brightness(1); }
        }
        @keyframes freeze-shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px) rotate(-2deg); }
          75% { transform: translateX(5px) rotate(2deg); }
        }
        
        /* Spider - Web trap expanding */
        @keyframes web-trap {
          0% { transform: scale(0.3) rotate(0deg) translateY(-50px); opacity: 0; }
          20% { transform: scale(0.8) rotate(90deg) translateY(0); opacity: 0.5; }
          40% { transform: scale(1.2) rotate(180deg) translateY(0); opacity: 1; }
          60% { transform: scale(1.6) rotate(270deg) translateY(10px); opacity: 0.8; }
          80% { transform: scale(2) rotate(360deg) translateY(0); opacity: 0.4; }
          100% { transform: scale(2.5) rotate(450deg) translateY(20px); opacity: 0; }
        }
        
        /* Fart - Cloud expanding */
        @keyframes fart-cloud {
          0% { transform: scale(0.5); opacity: 0; }
          50% { transform: scale(1.5); opacity: 0.8; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        
        /* Stone - Rock throw arc */
        @keyframes rock-throw {
          0% { transform: translateX(-100px) translateY(-50px) rotate(0deg); opacity: 0; }
          50% { transform: translateX(0) translateY(-100px) rotate(360deg); opacity: 1; }
          100% { transform: translateX(100px) translateY(0) rotate(720deg); opacity: 0; }
        }
        
        /* Punch - Hulk smash impact */
        @keyframes hulk-punch {
          0% { transform: scale(0.3) translateX(-100px) translateY(-50px) rotate(-20deg); opacity: 0; }
          30% { transform: scale(1) translateX(-20px) translateY(0) rotate(10deg); opacity: 1; }
          50% { transform: scale(1.8) translateX(20px) translateY(0) rotate(-10deg); opacity: 1; }
          70% { transform: scale(2.2) translateX(50px) translateY(10px) rotate(5deg); opacity: 0.7; }
          100% { transform: scale(2.5) translateX(100px) translateY(20px) rotate(0deg); opacity: 0; }
        }
        
        /* Jelly - Slippery effect */
        @keyframes slippery {
          0% { transform: translateY(0) scale(1); }
          50% { transform: translateY(20px) scale(1.2); }
          100% { transform: translateY(0) scale(1); }
        }
        @keyframes slip {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          25% { transform: translateX(-20px) rotate(-10deg); }
          75% { transform: translateX(20px) rotate(10deg); }
        }
        
        /* Wiggle animation for jelly */
        @keyframes wiggle {
          0%, 100% { transform: rotate(-5deg); }
          50% { transform: rotate(5deg); }
        }
        
        /* Punch impact */
        @keyframes punch-impact {
          0% { transform: scale(0) rotate(0deg); opacity: 1; }
          20% { transform: scale(0.8) rotate(10deg); opacity: 1; }
          40% { transform: scale(1.5) rotate(-10deg); opacity: 0.9; }
          60% { transform: scale(2) rotate(5deg); opacity: 0.6; }
          80% { transform: scale(2.5) rotate(-5deg); opacity: 0.3; }
          100% { transform: scale(3) rotate(0deg); opacity: 0; }
        }
        
        /* Electro - Lightning strike from top */
        @keyframes lightning-strike {
          0% { transform: translateY(-200px) scale(0.5); opacity: 0; }
          10% { transform: translateY(-100px) scale(1); opacity: 1; }
          20% { transform: translateY(0) scale(1.2); opacity: 1; }
          30% { transform: translateY(0) scale(1); opacity: 0.8; }
          40% { transform: translateY(0) scale(1.2); opacity: 1; }
          50% { transform: translateY(0) scale(1); opacity: 0.6; }
          60% { transform: translateY(0) scale(1.3); opacity: 1; }
          100% { transform: translateY(0) scale(1); opacity: 0; }
        }
        
        /* Character shake for attack feedback */
        @keyframes character-shake {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          10% { transform: translate(-4px, -2px) rotate(-2deg); }
          20% { transform: translate(4px, 2px) rotate(2deg); }
          30% { transform: translate(-3px, 1px) rotate(-1deg); }
          40% { transform: translate(3px, -1px) rotate(1deg); }
          50% { transform: translate(-2px, 2px) rotate(-1deg); }
          60% { transform: translate(2px, -2px) rotate(1deg); }
          70% { transform: translate(-1px, 1px) rotate(-0.5deg); }
          80% { transform: translate(1px, -1px) rotate(0.5deg); }
          90% { transform: translate(-1px, 0) rotate(0deg); }
        }
        
        /* Screen shake for hit impact */
        @keyframes screen-shake {
          0%, 100% { transform: translate(0, 0); }
          10% { transform: translate(-8px, 3px) rotate(-0.5deg); }
          20% { transform: translate(8px, -3px) rotate(0.5deg); }
          30% { transform: translate(-6px, 6px) rotate(-0.3deg); }
          40% { transform: translate(6px, -6px) rotate(0.3deg); }
          50% { transform: translate(-4px, 2px) rotate(-0.2deg); }
          60% { transform: translate(4px, -2px) rotate(0.2deg); }
          70% { transform: translate(-2px, 4px) rotate(-0.1deg); }
          80% { transform: translate(2px, -4px) rotate(0.1deg); }
          90% { transform: translate(-1px, 1px); }
        }
        
        /* Breathing animation for idle characters */
        @keyframes breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.03); }
        }
        
        /* Fight start animation - Tekken style */
        @keyframes fight-start {
          0% { transform: scale(0) rotate(-10deg); opacity: 0; }
          50% { transform: scale(1.2) rotate(5deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        
        .animate-slash {
          animation: slash 0.6s ease-in-out;
        }
        .animate-attack-forward {
          animation: attack-forward 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
        .animate-character-shake {
          animation: character-shake 0.3s ease-in-out;
        }
        .animate-screen-shake {
          animation: screen-shake 0.4s ease-in-out;
        }
        .animate-spin-slow {
          animation: spin-slow 0.6s linear;
        }
        .animate-fireball {
          animation: fireball 1.5s ease-in-out;
        }
        .animate-freeze {
          animation: freeze 1.5s ease-in-out;
        }
        .animate-freeze-shake {
          animation: freeze-shake 0.5s ease-in-out infinite;
        }
        .animate-web-trap {
          animation: web-trap 1.5s ease-out;
        }
        .animate-fart-cloud {
          animation: fart-cloud 1.5s ease-out;
        }
        .animate-rock-throw {
          animation: rock-throw 1s ease-in-out;
        }
        .animate-hulk-punch {
          animation: hulk-punch 1s ease-out;
        }
        .animate-slippery {
          animation: slippery 1.5s ease-in-out;
        }
        .animate-slip {
          animation: slip 1s ease-in-out;
        }
        .animate-wiggle {
          animation: wiggle 0.5s ease-in-out infinite;
        }
        .animate-punch-impact {
          animation: punch-impact 0.5s ease-out;
        }
        .animate-lightning-strike {
          animation: lightning-strike 1.5s ease-out;
        }
        .animate-breathe {
          animation: breathe 3s ease-in-out infinite;
        }
        .animate-fight-start {
          animation: fight-start 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
      `}</style>
    </div>
  )
}
