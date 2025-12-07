'use client'

import { Sparkles, Check, Loader2 } from 'lucide-react'
import type { CharacterType } from '@/types/game'
import { CHARACTERS } from '@/types/game'

interface GameResult {
  won: boolean
  character: CharacterType
  score: number
  opponentCharacter?: CharacterType
  damageDealt?: number
}

interface ResultsScreenProps {
  result: GameResult
  onPlayAgain: () => void
  onBackToHome: () => void
  onMintNFT: (character: CharacterType) => void
  isMinting: boolean
  mintSuccess: boolean
  canMint: boolean
  opponentCharacter?: CharacterType
}

export function ResultsScreen({ 
  result, 
  onPlayAgain, 
  onBackToHome,
  onMintNFT,
  isMinting,
  mintSuccess,
  canMint,
  opponentCharacter
}: ResultsScreenProps) {
  const character = CHARACTERS[result.character]
  const tier = getTierFromScore(result.score)

  return (
    <div className="min-h-screen bg-black p-4 flex items-center justify-center">
      <div className="max-w-2xl w-full">
        {/* Result Banner */}
        <div className="text-center mb-8">
          <h1 className={`text-5xl font-bold mb-4 ${result.won ? 'text-white' : 'text-gray-500'}`}>
            {result.won ? 'Victory' : 'Defeat'}
          </h1>
          <p className="text-xl text-gray-500">
            Score: <span className="font-bold text-white">{result.score}</span>
          </p>
        </div>

        {/* Character Card */}
        <div className="bg-gray-950 border border-gray-800 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-black rounded-lg flex items-center justify-center p-2">
              <img 
                src={getCharacterImage(result.character)} 
                alt={character.name}
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{character.name}</h2>
              <p className="text-gray-500 text-sm">{character.description}</p>
            </div>
          </div>
        </div>

        {/* Character Unlocked Section */}
        {canMint && opponentCharacter && (
          <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border border-purple-500/50 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-24 h-24 bg-black rounded-lg flex items-center justify-center p-2">
                <img 
                  src={getCharacterImage(opponentCharacter)} 
                  alt={CHARACTERS[opponentCharacter].name}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-yellow-400" />
                  <h3 className="text-xl font-bold text-white">Character Unlocked!</h3>
                </div>
                <p className="text-gray-300 text-sm mb-1">
                  You defeated <span className="font-bold">{CHARACTERS[opponentCharacter].name}</span>
                </p>
                <p className="text-gray-400 text-xs">
                  Mint as NFT to permanently own this character
                </p>
              </div>
            </div>

            {!mintSuccess ? (
              <button
                onClick={() => onMintNFT(opponentCharacter)}
                disabled={isMinting}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:from-gray-700 disabled:to-gray-700 text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2"
              >
                {isMinting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Minting NFT...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Mint NFT as Yours
                  </>
                )}
              </button>
            ) : (
              <div className="bg-green-900/30 border border-green-500/50 rounded-lg p-4 flex items-center gap-3">
                <Check className="w-6 h-6 text-green-400" />
                <div>
                  <p className="text-green-400 font-medium">NFT Minted Successfully!</p>
                  <p className="text-green-300/70 text-xs">
                    {CHARACTERS[opponentCharacter].name} is now in your wallet
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Leaderboard Preview */}
        <div className="bg-gray-950 border border-gray-800 rounded-lg p-6 mb-6">
          <h3 className="text-xl font-bold text-white mb-4">
            Leaderboard
          </h3>
          <div className="space-y-2">
            {[
              { rank: 1, name: 'Player1', score: 1250, tier: 'diamond' },
              { rank: 2, name: 'Player2', score: 980, tier: 'platinum' },
              { rank: 3, name: 'Player3', score: 750, tier: 'gold' },
              { rank: 4, name: 'You', score: result.score, tier: tier, highlight: true },
              { rank: 5, name: 'Player5', score: 450, tier: 'silver' }
            ].map((player) => (
              <div
                key={player.rank}
                className={`flex items-center justify-between p-3 rounded border ${
                  player.highlight ? 'bg-gray-900 border-white' : 'bg-black border-gray-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-gray-600">#{player.rank}</span>
                  <span className="text-white font-medium text-sm">{player.name}</span>
                  <span className="text-xs px-2 py-1 rounded bg-gray-900 text-gray-400 border border-gray-800">
                    {player.tier.toUpperCase()}
                  </span>
                </div>
                <span className="text-white font-medium">{player.score}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={onPlayAgain}
            className="py-4 bg-white hover:bg-gray-200 text-black font-medium rounded-lg transition-all"
          >
            Play Again
          </button>
          <button
            onClick={onBackToHome}
            className="py-4 bg-gray-950 hover:bg-gray-900 text-white font-medium rounded-lg border border-gray-800 transition-all"
          >
            Home
          </button>
        </div>
      </div>
    </div>
  )
}

function getCharacterImage(type: CharacterType): string {
  return CHARACTERS[type].image;
}

function getTierFromScore(score: number): string {
  if (score >= 5000) return 'diamond'
  if (score >= 3000) return 'platinum'
  if (score >= 1500) return 'gold'
  if (score >= 500) return 'silver'
  return 'bronze'
}

function getTierColor(tier: string): string {
  const colors: Record<string, string> = {
    bronze: '#CD7F32',
    silver: '#C0C0C0',
    gold: '#FFD700',
    platinum: '#E5E4E2',
    diamond: '#B9F2FF'
  }
  return colors[tier] || '#666'
}

function getTierBadge(tier: string): string {
  const badges: Record<string, string> = {
    bronze: '🥉',
    silver: '🥈',
    gold: '🥇',
    platinum: '💎',
    diamond: '💠'
  }
  return badges[tier] || '🏅'
}
