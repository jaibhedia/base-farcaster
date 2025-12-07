'use client'

import { useState, useEffect } from 'react'
import { Sword, Shield, Zap } from 'lucide-react'
import type { CharacterType, BattleState } from '@/types/game'
import { CHARACTERS } from '@/types/game'
import { initBattle, executeTurn, isGameOver } from '@/lib/battle'

interface BattleScreenProps {
  playerCharacter: CharacterType
  onBattleEnd: (won: boolean, score: number) => void
}

export function BattleScreen({ playerCharacter, onBattleEnd }: BattleScreenProps) {
  const [battleState, setBattleState] = useState<BattleState | null>(null)
  const [isPowerUpCharging, setIsPowerUpCharging] = useState(false)
  const [actionSelected, setActionSelected] = useState<'attack' | 'special' | 'defend' | null>(null)
  const [isAttacking, setIsAttacking] = useState(false)
  const [isDefending, setIsDefending] = useState(false)

  // Initialize battle on mount
  useEffect(() => {
    const characterTypes: CharacterType[] = ['fire', 'ice', 'spider', 'fart', 'stone', 'punch', 'jelly']
    const randomOpponent = characterTypes[Math.floor(Math.random() * characterTypes.length)]
    const initialState = initBattle(playerCharacter, randomOpponent)
    setBattleState(initialState)
  }, [playerCharacter])

  // Check for game over
  useEffect(() => {
    if (battleState && isGameOver(battleState)) {
      const won = battleState.winner === 'player'
      const score = won ? 100 + battleState.playerState.hp : 25
      setTimeout(() => onBattleEnd(won, score), 2000)
    }
  }, [battleState, onBattleEnd])

  const handleAttack = (type: 'attack' | 'special' | 'defend') => {
    if (!battleState || battleState.turn !== 'player' || battleState.isGameOver) return

    setActionSelected(type)
    
    // Trigger animation
    if (type === 'attack') setIsAttacking(true)
    if (type === 'defend') setIsDefending(true)
    
    const newState = executeTurn(battleState, type)
    
    setTimeout(() => {
      setBattleState(newState)
      setActionSelected(null)
      setIsAttacking(false)
      setIsDefending(false)
      
      // Opponent's turn if game not over
      if (!isGameOver(newState)) {
        setTimeout(() => {
          const opponentAction = Math.random() > 0.7 ? 'special' : 'attack'
          const finalState = executeTurn(newState, opponentAction)
          setBattleState(finalState)
        }, 1000)
      }
    }, 800)
  }

  // Power-up charging animation
  useEffect(() => {
    if (battleState && battleState.playerPowerUp.charges < battleState.playerPowerUp.maxCharges) {
      setIsPowerUpCharging(true)
      const timer = setTimeout(() => setIsPowerUpCharging(false), 300)
      return () => clearTimeout(timer)
    }
  }, [battleState?.playerPowerUp.charges])

  if (!battleState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  const playerChar = battleState.playerCharacter
  const opponentChar = battleState.opponentCharacter
  const canUseSpecial = battleState.playerPowerUp.charges >= battleState.playerPowerUp.maxCharges

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Top - Opponent Info */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <span className="text-white font-medium">{opponentChar.name}</span>
          <span className="text-gray-400 text-sm">Lvl {Math.floor(Math.random() * 10) + 1}</span>
        </div>
        <div className="max-w-md mx-auto mt-2">
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-500 transition-all duration-500"
              style={{ width: `${(battleState.opponentState.hp / opponentChar.maxHp) * 100}%` }}
            />
          </div>
          <div className="text-right text-xs text-gray-500 mt-1">
            {battleState.opponentState.hp} / {opponentChar.maxHp}
          </div>
        </div>
      </div>

      {/* Battle Arena - Characters Fighting */}
      <div className="flex-1 flex items-center justify-between px-4 md:px-16 relative">
        {/* Opponent Character (Left) */}
        <div className={`relative transition-all duration-300 ${
          isAttacking ? 'opacity-50 scale-95' : 'scale-100'
        }`}>
          <div className="w-32 h-32 md:w-40 md:h-40 transform scale-x-[-1] animate-float">
            <img 
              src={getCharacterImage(opponentChar.type)} 
              alt={opponentChar.name}
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        {/* Battle Actions Indicator - Center */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {isAttacking && (
            <div className="animate-slash">
              <Sword className="w-20 h-20 md:w-24 md:h-24 text-white" />
            </div>
          )}
          {isDefending && (
            <div className="animate-pulse-scale">
              <Shield className="w-20 h-20 md:w-24 md:h-24 text-blue-500" />
            </div>
          )}
          {actionSelected === 'special' && (
            <div className="animate-zap">
              <Zap className="w-20 h-20 md:w-24 md:h-24 text-yellow-500" />
            </div>
          )}
        </div>

        {/* Player Character (Right) */}
        <div className={`relative transition-all duration-300 ${
          isAttacking ? 'translate-x-[-40px] md:translate-x-[-60px] scale-110' : 'scale-100'
        }`}>
          <div className="w-32 h-32 md:w-40 md:h-40 animate-float-delayed">
            <img 
              src={getCharacterImage(playerChar.type)} 
              alt={playerChar.name}
              className="w-full h-full object-contain"
            />
          </div>
          {isDefending && (
            <div className="absolute inset-0 flex items-center justify-center animate-spin-slow">
              <Shield className="w-24 h-24 md:w-32 md:h-32 text-blue-500 opacity-60" />
            </div>
          )}
        </div>
      </div>
      
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: scaleX(-1) translateY(0px); }
          50% { transform: scaleX(-1) translateY(-10px); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes slash {
          0% { transform: translateX(-50px) rotate(-45deg); opacity: 0; }
          50% { transform: translateX(0) rotate(0deg); opacity: 1; }
          100% { transform: translateX(50px) rotate(45deg); opacity: 0; }
        }
        @keyframes pulse-scale {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.2); opacity: 0.8; }
        }
        @keyframes zap {
          0% { transform: scale(0) rotate(0deg); opacity: 0; }
          50% { transform: scale(1.5) rotate(180deg); opacity: 1; }
          100% { transform: scale(0) rotate(360deg); opacity: 0; }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 3s ease-in-out infinite 0.5s;
        }
        .animate-slash {
          animation: slash 0.8s ease-out;
        }
        .animate-pulse-scale {
          animation: pulse-scale 0.8s ease-in-out;
        }
        .animate-zap {
          animation: zap 0.8s ease-out;
        }
        .animate-spin-slow {
          animation: spin 2s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Bottom - Player Info & Controls */}
      <div className="border-t border-gray-800">
        {/* Player HP Bar */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-between max-w-md mx-auto">
            <span className="text-white font-medium">{playerChar.name}</span>
            <span className="text-gray-400 text-sm">You</span>
          </div>
          <div className="max-w-md mx-auto mt-2">
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-500"
                style={{ width: `${(battleState.playerState.hp / playerChar.maxHp) * 100}%` }}
              />
            </div>
            <div className="text-right text-xs text-gray-500 mt-1">
              {battleState.playerState.hp} / {playerChar.maxHp}
            </div>
          </div>
        </div>

        {/* Power-Up Bar */}
        <div className="px-4 py-3 bg-gray-900">
          <div className="flex items-center gap-2 max-w-md mx-auto">
            <Zap className="w-4 h-4 text-yellow-500" />
            <div className="flex-1">
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-yellow-500 transition-all duration-300 ${isPowerUpCharging ? 'animate-pulse' : ''}`}
                  style={{ width: `${(battleState.playerPowerUp.charges / battleState.playerPowerUp.maxCharges) * 100}%` }}
                />
              </div>
            </div>
            <span className="text-xs text-gray-400">
              {battleState.playerPowerUp.charges}/{battleState.playerPowerUp.maxCharges}
            </span>
          </div>
        </div>

        {/* Attack Buttons */}
        <div className="p-4 grid grid-cols-3 gap-3 max-w-md mx-auto">
          <button
            onClick={() => handleAttack('attack')}
            disabled={battleState.turn !== 'player' || battleState.isGameOver}
            className="flex flex-col items-center justify-center py-4 bg-white text-black disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed rounded-lg transition-all active:scale-95"
          >
            <Sword className="w-6 h-6 mb-1" />
            <span className="text-sm font-medium">Attack</span>
          </button>

          <button
            onClick={() => handleAttack('defend')}
            disabled={battleState.turn !== 'player' || battleState.isGameOver}
            className="flex flex-col items-center justify-center py-4 bg-blue-600 text-white disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed rounded-lg transition-all active:scale-95"
          >
            <Shield className="w-6 h-6 mb-1" />
            <span className="text-sm font-medium">Defend</span>
          </button>

          <button
            onClick={() => handleAttack('special')}
            disabled={!canUseSpecial || battleState.turn !== 'player' || battleState.isGameOver}
            className={`flex flex-col items-center justify-center py-4 ${
              canUseSpecial ? 'bg-yellow-500 text-black' : 'bg-gray-800 text-gray-600'
            } disabled:cursor-not-allowed rounded-lg transition-all active:scale-95`}
          >
            <Zap className="w-6 h-6 mb-1" />
            <span className="text-sm font-medium">Special</span>
          </button>
        </div>
      </div>

      {/* Game Over Overlay */}
      {battleState.isGameOver && (
        <div className="absolute inset-0 bg-black bg-opacity-90 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-5xl font-bold mb-4">
              {battleState.winner === 'player' ? (
                <span className="text-green-500">Victory</span>
              ) : (
                <span className="text-red-500">Defeat</span>
              )}
            </h2>
          </div>
        </div>
      )}
    </div>
  )
}

function getCharacterImage(type: CharacterType): string {
  const { CHARACTERS } = require('@/types/game');
  return CHARACTERS[type].image;
}
