'use client';

import { CHARACTERS, type CharacterType } from '@/types/game';
import { useState } from 'react';
import { Lock } from 'lucide-react';

interface CharacterSelectProps {
  onCharacterSelect: (character: CharacterType) => void;
  unlockedCharacters: Set<CharacterType>;
}

export function CharacterSelect({ onCharacterSelect, unlockedCharacters }: CharacterSelectProps) {
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterType | null>(null);

  const handleSelect = (type: CharacterType) => {
    if (unlockedCharacters.has(type)) {
      setSelectedCharacter(type);
    }
  };

  const handleConfirm = () => {
    if (selectedCharacter) {
      onCharacterSelect(selectedCharacter);
    }
  };

  const characters: CharacterType[] = ['fire', 'ice', 'spider', 'fart', 'stone', 'punch', 'jelly', 'electro'];

  return (
    <div className="min-h-screen bg-black p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-white">Choose Character</h1>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          {characters.map((type) => {
            const char = CHARACTERS[type];
            const isSelected = selectedCharacter === type;
            const isLocked = !unlockedCharacters.has(type);

            return (
              <button
                key={type}
                onClick={() => handleSelect(type)}
                disabled={isLocked}
                className={`relative p-4 rounded-lg border transition-all ${
                  isLocked
                    ? 'border-gray-800 bg-gray-950 cursor-not-allowed'
                    : isSelected
                    ? 'border-white bg-gray-900'
                    : 'border-gray-800 bg-gray-950 hover:border-gray-700'
                }`}
              >
                <div className={`aspect-square bg-black rounded-lg mb-3 flex items-center justify-center p-2 relative ${
                  isLocked ? 'opacity-30 blur-sm' : ''
                }`}>
                  <img 
                    src={getCharacterImage(type)} 
                    alt={char.name}
                    className="w-full h-full object-contain"
                  />
                  {isLocked && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Lock className="w-12 h-12 text-gray-600" />
                    </div>
                  )}
                </div>
                <h3 className={`font-medium text-sm mb-2 ${isLocked ? 'text-gray-600' : 'text-white'}`}>
                  {char.name}
                </h3>
                {isLocked ? (
                  <p className="text-xs text-gray-700 text-center">Defeat to unlock</p>
                ) : (
                  <div className="text-xs space-y-1 text-gray-500">
                    <div className="flex justify-between">
                      <span>HP</span>
                      <span className="text-gray-400">{char.maxHp}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>ATK</span>
                      <span className="text-gray-400">{char.attack}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>DEF</span>
                      <span className="text-gray-400">{char.defense}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>SPD</span>
                      <span className="text-gray-400">{char.speed}</span>
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {selectedCharacter && (
          <div className="bg-gray-950 border border-gray-800 rounded-lg p-6 mb-4">
            <h2 className="text-xl font-bold text-white mb-2">
              {CHARACTERS[selectedCharacter].name}
            </h2>
            <p className="text-gray-500 text-sm mb-3">{CHARACTERS[selectedCharacter].description}</p>
            <div className="border-t border-gray-800 pt-3">
              <p className="text-sm text-gray-400">
                <span className="text-white">Special:</span>{' '}
                {CHARACTERS[selectedCharacter].specialAbility}
              </p>
            </div>
          </div>
        )}

        <button
          onClick={handleConfirm}
          disabled={!selectedCharacter}
          className={`w-full py-4 rounded-lg font-medium transition-all ${
            selectedCharacter
              ? 'bg-white text-black hover:bg-gray-200'
              : 'bg-gray-900 text-gray-600 cursor-not-allowed border border-gray-800'
          }`}
        >
          {selectedCharacter ? 'Start Battle' : 'Select a Character'}
        </button>
      </div>
    </div>
  );
}

function getCharacterImage(type: CharacterType): string {
  return CHARACTERS[type].image;
}
