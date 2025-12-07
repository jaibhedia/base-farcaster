'use client'

import { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { HomeScreen } from './HomeScreen'
import { CharacterSelect } from './CharacterSelect'
import { FightingBattle } from './FightingBattle'
import { ResultsScreen } from './ResultsScreen'
import type { CharacterType } from '@/types/game'
import { BATTLE_CHARACTER_CONTRACT, BATTLE_CHARACTER_ABI, CHARACTER_TYPE_MAP } from '@/lib/contract'

type GameScreen = 'home' | 'select' | 'battle' | 'results'

interface GameResult {
  won: boolean
  character: CharacterType
  score: number
  opponentCharacter?: CharacterType
  damageDealt?: number
}

// Starter characters that are always unlocked
const STARTER_CHARACTERS: CharacterType[] = ['fire', 'ice', 'punch']

export function GameFlow() {
  const { address } = useAccount()
  const [currentScreen, setCurrentScreen] = useState<GameScreen>('home')
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterType | null>(null)
  const [gameResult, setGameResult] = useState<GameResult | null>(null)
  const [unlockedCharacters, setUnlockedCharacters] = useState<Set<CharacterType>>(new Set(STARTER_CHARACTERS))
  
  const { writeContract, data: mintHash, isPending: isMinting } = useWriteContract()
  const { isSuccess: mintSuccess } = useWaitForTransactionReceipt({ hash: mintHash })

  // Load unlocked characters from localStorage
  useEffect(() => {
    if (address) {
      const stored = localStorage.getItem(`unlocked_${address}`)
      if (stored) {
        try {
          const unlocked = JSON.parse(stored)
          setUnlockedCharacters(new Set([...STARTER_CHARACTERS, ...unlocked]))
        } catch (e) {
          console.error('Failed to load unlocked characters', e)
        }
      }
    }
  }, [address])

  // Save unlocked characters to localStorage
  const saveUnlockedCharacters = (unlocked: Set<CharacterType>) => {
    if (address) {
      const toSave = Array.from(unlocked).filter(char => !STARTER_CHARACTERS.includes(char))
      localStorage.setItem(`unlocked_${address}`, JSON.stringify(toSave))
    }
  }

  const handleStartGame = () => {
    setCurrentScreen('select')
  }

  const handleCharacterSelected = (character: CharacterType) => {
    setSelectedCharacter(character)
    setCurrentScreen('battle')
  }

  const handleBattleEnd = (won: boolean, score: number, opponentCharacter: CharacterType, damageDealt: number) => {
    if (selectedCharacter) {
      // Unlock the opponent character if the player won
      if (won && !unlockedCharacters.has(opponentCharacter)) {
        const newUnlocked = new Set(unlockedCharacters)
        newUnlocked.add(opponentCharacter)
        setUnlockedCharacters(newUnlocked)
        saveUnlockedCharacters(newUnlocked)
      }

      setGameResult({ won, character: selectedCharacter, score, opponentCharacter, damageDealt })
      setCurrentScreen('results')
    }
  }

  const handleMintNFT = (characterType: CharacterType) => {
    if (!address) return

    const characterId = CHARACTER_TYPE_MAP[characterType]
    writeContract({
      address: BATTLE_CHARACTER_CONTRACT,
      abi: BATTLE_CHARACTER_ABI,
      functionName: 'mintToWinner',
      args: [address, characterId],
    })
  }

  const handlePlayAgain = () => {
    setSelectedCharacter(null)
    setGameResult(null)
    setCurrentScreen('select')
  }

  const handleBackToHome = () => {
    setSelectedCharacter(null)
    setGameResult(null)
    setCurrentScreen('home')
  }

  return (
    <>
      {currentScreen === 'home' && <HomeScreen onStart={handleStartGame} />}
      
      {currentScreen === 'select' && (
        <CharacterSelect 
          onCharacterSelect={handleCharacterSelected}
          unlockedCharacters={unlockedCharacters}
        />
      )}
      
      {currentScreen === 'battle' && selectedCharacter && (
        <FightingBattle 
          playerCharacter={selectedCharacter} 
          onBattleEnd={handleBattleEnd}
        />
      )}
      
      {currentScreen === 'results' && gameResult && (
        <ResultsScreen 
          result={gameResult}
          onPlayAgain={handlePlayAgain}
          onBackToHome={handleBackToHome}
          onMintNFT={handleMintNFT}
          isMinting={isMinting}
          mintSuccess={mintSuccess}
          canMint={!!(gameResult.won && gameResult.opponentCharacter && !STARTER_CHARACTERS.includes(gameResult.opponentCharacter))}
          opponentCharacter={gameResult.opponentCharacter}
        />
      )}
    </>
  )
}
