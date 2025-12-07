import { useFrame } from '@/components/farcaster-provider'
import { farcasterMiniApp as miniAppConnector } from '@farcaster/miniapp-wagmi-connector'
import { parseEther } from 'viem'
import { base } from 'viem/chains'
import { useAppKit } from '@reown/appkit/react'
import {
  useAccount,
  useConnect,
  useDisconnect,
  useSendTransaction,
  useSwitchChain,
} from 'wagmi'

export function WalletActions() {
  const { isEthProviderAvailable } = useFrame()
  const { isConnected, address, chainId } = useAccount()
  const { disconnect } = useDisconnect()
  const { data: hash, sendTransaction } = useSendTransaction()
  const { switchChain } = useSwitchChain()
  const { connect } = useConnect()
  const { open } = useAppKit()

  async function sendTransactionHandler() {
    sendTransaction({
      to: '0x7f748f154B6D180D35fA12460C7E4C631e28A9d7',
      value: parseEther('1'),
    })
  }

  if (isConnected) {
    return (
      <div className="max-w-sm mx-auto">
        <div className="space-y-3 rounded-lg p-3 backdrop-blur-md bg-white/10 border border-white/20 shadow-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-white">Wallet</h2>
            <button
              type="button"
              className="text-xs text-gray-300 hover:text-white transition-colors"
              onClick={() => disconnect()}
            >
              Disconnect
            </button>
          </div>
          
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between text-gray-300">
              <span>Address</span>
              <span className="font-mono text-white">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </span>
            </div>
            <div className="flex items-center justify-between text-gray-300">
              <span>Chain</span>
              <span className="font-mono text-white">{chainId}</span>
            </div>
          </div>

          {chainId !== base.id && (
            <button
              type="button"
              className="w-full bg-white/90 hover:bg-white text-black text-sm py-2 rounded transition-colors"
              onClick={() => switchChain({ chainId: base.id })}
            >
              Switch to Base
            </button>
          )}
        </div>
      </div>
    )
  }

  if (isEthProviderAvailable) {
    return (
      <div className="space-y-4 rounded-xl p-4 backdrop-blur-md bg-white/10 border border-white/20 shadow-xl">
        <h2 className="text-xl font-bold text-left text-white">Wallet</h2>
        <div className="flex flex-row space-x-4 justify-start items-start">
          <button
            type="button"
            className="bg-blue-600 hover:bg-blue-700 text-white w-full rounded-md p-3 text-sm"
            onClick={() => {
              if (isEthProviderAvailable) {
                // Inside Warpcast MiniApp: use the Farcaster connector
                connect({ connector: miniAppConnector() })
              } else {
                // On the web: open the WalletConnect/AppKit modal
                open?.()
              }
            }}
          >
            Connect Wallet (WalletConnect)
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 rounded-xl p-4 backdrop-blur-md bg-white/10 border border-white/20 shadow-xl">
      <h2 className="text-xl font-bold text-left text-white">Wallet</h2>
      <div className="flex flex-row space-x-4 justify-start items-start">
        <p className="text-sm text-left text-gray-300">Wallet connection only via Warpcast</p>
      </div>
    </div>
  )
}
