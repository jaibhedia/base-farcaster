'use client'

import { useAccount } from 'wagmi'
import { WalletActions } from '@/components/Home/WalletActions'

interface HomeScreenProps {
  onStart: () => void
}

export function HomeScreen({ onStart }: HomeScreenProps) {
  const { isConnected } = useAccount()

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* Background Video - Full Screen */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
      >
        <source src="/video.mp4" type="video/mp4" />
      </video>

      {/* Dark Overlay for better visibility */}
      <div className="absolute inset-0 bg-black bg-opacity-30 z-5"></div>

      {/* Wallet Widget - Top Right */}
      <div className="absolute top-6 right-6 z-20">
        <WalletActions />
      </div>

      {/* Play Button - Centered and moved down */}
      {isConnected && (
        <div className="absolute inset-0 flex items-center justify-center z-10" style={{ paddingTop: '70vh' }}>
          <button
            onClick={onStart}
            className="px-20 py-6 text-3xl font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-2xl"
          >
            Play
          </button>
        </div>
      )}
    </div>
  )
}
