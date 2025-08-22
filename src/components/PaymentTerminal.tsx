import { useState } from 'react'
import { motion } from 'framer-motion'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useReadContract } from 'wagmi'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AdminPanel } from './AdminPanel'
import { UserPanel } from './UserPanel'
import { TransactionStatus } from './TransactionStatus'
import { RecentTransactions } from './RecentTransactions'
import { DebugPanel } from './DebugPanel'
import { CONTRACTS, CONTRACT_ABI } from '@/lib/wagmi'
import { useChainId } from 'wagmi'

import { Terminal, Zap, Users, Settings } from 'lucide-react'

export const PaymentTerminal = () => {

  const { address, isConnected } = useAccount()
  const [activeTab, setActiveTab] = useState('terminal')
  const chainId = useChainId();
  const contractAddress = CONTRACTS[chainId] as `0x${string}`;
  // Check if connected user is owner
  const { data: owner } = useReadContract({
    address: contractAddress,
    abi: CONTRACT_ABI,
    functionName: 'owner',
  })
  const isOwner = owner && address && owner.toLowerCase() === address.toLowerCase()

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-terminal-bg to-background">
      {/* Background glow effect */}
      <div className="fixed inset-0 bg-gradient-glow pointer-events-none" />
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-gradient-primary shadow-glow">
              <Terminal className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Payment Terminal
              </h1>
              <p className="text-muted-foreground font-mono text-sm">
                {contractAddress}
              </p>
              <p className="text-xs text-muted-foreground font-mono mt-1">
                Project ID: facd1356da9a88af48c3e1821f0d92cf
              </p>
            </div>
          </div>
          <ConnectButton />
        </motion.div>

        {!isConnected ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center justify-center min-h-[400px]"
          >
            <Card className="w-full max-w-md shadow-card bg-gradient-card border-border/50">
              <CardContent className="p-8 text-center">
                <Zap className="w-16 h-16 mx-auto mb-4 text-primary animate-pulse" />
                <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
                <p className="text-muted-foreground mb-6">
                  Connect your wallet to interact with the payment terminal
                </p>
                <ConnectButton />
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Main Terminal Interface */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4">
                <TabsTrigger value="terminal" className="flex items-center gap-2">
                  <Terminal className="w-4 h-4" />
                  Terminal
                </TabsTrigger>
                {isOwner && (
                  <TabsTrigger value="admin" className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Admin
                  </TabsTrigger>
                )}
                <TabsTrigger value="user" className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Pay
                </TabsTrigger>
                <TabsTrigger value="debug" className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Debug
                </TabsTrigger>
              </TabsList>

              <TabsContent value="terminal" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <TransactionStatus />
                  <RecentTransactions />
                </div>
              </TabsContent>

              {isOwner && (
                <TabsContent value="admin">
                  <AdminPanel />
                </TabsContent>
              )}

              <TabsContent value="user">
                <UserPanel />
              </TabsContent>

              <TabsContent value="debug">
                <DebugPanel />
              </TabsContent>
            </Tabs>
          </motion.div>
        )}
      </div>
    </div>
  )
}