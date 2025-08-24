import { useState } from 'react'
import * as React from 'react'
import { motion } from 'framer-motion'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useReadContract } from 'wagmi'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AdminPanel } from './AdminPanel'
import { UniversalAdminPanel } from './UniversalAdminPanel'
import { UserPanel } from './UserPanel'
import { UniversalUserPanel } from './UniversalUserPanel'
import { UniversalTransactionStatus } from './UniversalTransactionStatus'
import { UniversalRecentTransactions } from './UniversalRecentTransactions'
import { DebugPanel } from './DebugPanel'
import { QRCodeGenerator } from './QRCodeGenerator'
import { NetworkSelector } from './NetworkSelector'
import { UniversalConnectButton } from './UniversalConnectButton'
import { TronConnectButton } from './TronConnectButton'
import { TronUserPanel } from './TronUserPanel'
import { TronAdminPanel } from './TronAdminPanel'
import { ChainSyncer } from './ChainSyncer'
import { useNetwork } from '@/lib/network-context'
import { useStellarWallet } from '@/hooks/use-stellar-wallet'
import { useTronWallet } from '@/hooks/use-tron-wallet'
import { StellarContractClient } from '@/lib/stellar-contract'
import { TronContractClient } from '@/lib/tron-contract'
import { CONTRACTS, CONTRACT_ABI } from '@/lib/wagmi'
import { useChainId } from 'wagmi'

import { Terminal, Zap, Users, Settings } from 'lucide-react'

export const PaymentTerminal = () => {
  const { isEVM, isStellar, isTron, networkConfig } = useNetwork()
  const { address, isConnected } = useAccount()
  const stellarWallet = useStellarWallet()
  const tronWallet = useTronWallet()
  const [activeTab, setActiveTab] = useState('terminal')
  const chainId = useChainId();
  
  // Get contract address based on network type
  const contractAddress = isEVM 
    ? CONTRACTS[chainId] as `0x${string}`
    : networkConfig.contractAddress || '';
  
  // Check if connected user is owner
  const { data: owner } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'owner',
    query: { enabled: isEVM && !!contractAddress }
  })
  
  // For Stellar, implement owner check via contract client
  const [stellarOwner, setStellarOwner] = React.useState<string | null>(null)
  
  // For Tron, implement owner check via contract client
  const [tronOwner, setTronOwner] = React.useState<string | null>(null)
  
  React.useEffect(() => {
    if (isStellar && networkConfig.contractAddress && networkConfig.rpcUrl) {
      const stellarClient = new StellarContractClient(
        networkConfig.contractAddress,
        networkConfig.rpcUrl
      )
      stellarClient.getOwner().then((owner) => {
        console.log('Stellar contract owner:', owner)
        setStellarOwner(owner)
      }).catch(() => setStellarOwner(null))
    }
  }, [isStellar, networkConfig])
  
  React.useEffect(() => {
    if (isTron && networkConfig.contractAddress && networkConfig.rpcUrl) {
      const tronClient = new TronContractClient(
        networkConfig.contractAddress,
        networkConfig.rpcUrl
      )
      tronClient.getOwner().then((owner) => {
        console.log('Tron contract owner:', owner)
        setTronOwner(owner)
      }).catch(() => setTronOwner(null))
    }
  }, [isTron, networkConfig, tronWallet.isConnected]) // Added tronWallet.isConnected to re-check owner when wallet connects
  
  const isEVMOwner = isEVM && owner && address && (typeof owner === 'string') && owner.toLowerCase() === address.toLowerCase()
  const isStellarOwner = isStellar && stellarWallet.isConnected && stellarOwner === stellarWallet.address
  const isTronOwner = isTron && tronWallet.isConnected && tronOwner?.toLowerCase() === tronWallet.address?.toLowerCase()
  const isOwner = isEVMOwner || isStellarOwner || isTronOwner
  
  // Debug logging for Tron owner checking
  React.useEffect(() => {
    if (isTron) {
      console.log('=== TRON OWNER DEBUG ===')
      console.log('isTron:', isTron)
      console.log('tronWallet.isConnected:', tronWallet.isConnected)
      console.log('tronWallet.address:', tronWallet.address)
      console.log('tronOwner:', tronOwner)
      console.log('tronOwner?.toLowerCase():', tronOwner?.toLowerCase())
      console.log('tronWallet.address?.toLowerCase():', tronWallet.address?.toLowerCase())
      console.log('Address match:', tronOwner?.toLowerCase() === tronWallet.address?.toLowerCase())
      console.log('isTronOwner:', isTronOwner)
      console.log('isOwner:', isOwner)
      console.log('========================')
    }
  }, [isTron, tronWallet.isConnected, tronWallet.address, tronOwner, isTronOwner, isOwner])
  
  // Debug logging
  React.useEffect(() => {
    console.log('=== OWNER DEBUG ===')
    console.log('isEVM:', isEVM)
    console.log('isStellar:', isStellar)
    console.log('isTron:', isTron)
    console.log('stellarWallet.isConnected:', stellarWallet.isConnected)
    console.log('stellarWallet.address:', stellarWallet.address)
    console.log('stellarOwner:', stellarOwner)
    console.log('tronWallet.isConnected:', tronWallet.isConnected)
    console.log('tronWallet.address:', tronWallet.address)
    console.log('tronOwner:', tronOwner)
    console.log('isOwner:', isOwner)
    console.log('==================')
  }, [isEVM, isStellar, isTron, stellarWallet.isConnected, stellarWallet.address, stellarOwner, tronWallet.isConnected, tronWallet.address, tronOwner, isOwner])
  
  // Universal connection status
  const universalIsConnected = isEVM ? isConnected : (isStellar ? stellarWallet.isConnected : tronWallet.isConnected)
  const universalAddress = isEVM ? address : (isStellar ? stellarWallet.address : tronWallet.address)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-terminal-bg to-background">
      {/* Sync wagmi chainId with network context */}
      {isEVM && <ChainSyncer />}
      
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
                {contractAddress || 'No contract deployed'}
              </p>
              <p className="text-xs text-muted-foreground font-mono mt-1">
                Network: {networkConfig.name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <NetworkSelector />
            <UniversalConnectButton />
          </div>
        </motion.div>

        {!universalIsConnected ? (
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
                  Connect your wallet to interact with the payment terminal on {networkConfig.name}
                </p>
                <UniversalConnectButton />
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
                {(isOwner || isTron) && (
                  <TabsTrigger value="admin" className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Admin {isTron && !isOwner && '(Debug)'}
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
                  <UniversalTransactionStatus />
                  <UniversalRecentTransactions />
                </div>
                
                {/* Payment Instructions */}
                <Card className="shadow-card bg-gradient-card border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Terminal className="w-5 h-5 text-primary" />
                      Payment Instructions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                      {/* Tap to Pay Instructions */}
                      <div className="lg:col-span-2 space-y-4">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-primary font-bold">1</span>
                          </div>
                          <h3 className="font-semibold text-lg">How to Pay</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <div className="flex items-start gap-3">
                              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
                                <span className="text-xs font-semibold text-primary">1</span>
                              </div>
                              <div>
                                <p className="font-medium">Connect Wallet</p>
                                <p className="text-sm text-muted-foreground">Use the "Connect Wallet" button above</p>
                              </div>
                            </div>
                            
                            <div className="flex items-start gap-3">
                              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
                                <span className="text-xs font-semibold text-primary">2</span>
                              </div>
                              <div>
                                <p className="font-medium">Navigate to Pay Tab</p>
                                <p className="text-sm text-muted-foreground">Click the "Pay" tab above</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            <div className="flex items-start gap-3">
                              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
                                <span className="text-xs font-semibold text-primary">3</span>
                              </div>
                              <div>
                                <p className="font-medium">Review Payment</p>
                                <p className="text-sm text-muted-foreground">Check the transaction details</p>
                              </div>
                            </div>
                            
                            <div className="flex items-start gap-3">
                              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
                                <span className="text-xs font-semibold text-primary">4</span>
                              </div>
                              <div>
                                <p className="font-medium">Complete Payment</p>
                                <p className="text-sm text-muted-foreground">Approve transaction in your wallet</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* QR Code */}
                      <div className="flex flex-col items-center space-y-4 lg:col-span-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-primary font-bold">2</span>
                          </div>
                          <h3 className="font-semibold text-lg">QR Code</h3>
                        </div>
                        
                        <div className="p-6 bg-white rounded-xl shadow-sm border">
                          <QRCodeGenerator 
                            chainId={isEVM ? chainId : undefined}
                            contractAddress={contractAddress}
                            size={160}
                          />
                        </div>
                        
                        <div className="text-center space-y-1">
                          <p className="text-sm font-medium">Scan for Contract Info</p>
                          <p className="text-xs text-muted-foreground">
                            Contains chain & contract address
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {(isOwner || isTron) && (
                <TabsContent value="admin">
                  <UniversalAdminPanel />
                </TabsContent>
              )}

              <TabsContent value="user">
                <UniversalUserPanel />
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