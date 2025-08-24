import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ItemizedTable } from '@/components/ui/itemized-table'
import { useNetwork } from '@/lib/network-context'
import { useStellarWallet } from '@/hooks/use-stellar-wallet'
import { StellarContractClient } from '@/lib/stellar-contract'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CreditCard, Loader2, CheckCircle, AlertTriangle, XCircle, Wallet, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

export const StellarUserPanel = () => {
  const { networkConfig } = useNetwork()
  const stellarWallet = useStellarWallet()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTransaction, setActiveTransaction] = useState<any>(null)
  const [userBalance, setUserBalance] = useState<string>('0')
  const [isFetching, setIsFetching] = useState(false) // Prevent concurrent fetches

  const client = networkConfig.contractAddress && networkConfig.rpcUrl
    ? new StellarContractClient(networkConfig.contractAddress, networkConfig.rpcUrl)
    : null

  const fetchUserBalance = async () => {
    try {
      if (stellarWallet.isConnected && stellarWallet.address) {
        // For now, just show a placeholder. In a real implementation,
        // you'd fetch the actual XLM balance from Horizon
        setUserBalance('0.0000000') // Placeholder
      }
    } catch (error) {
      console.error('Error fetching user balance:', error)
    }
  }

  const fetchActiveTransaction = async () => {
    if (!client || isFetching) {
      console.log('🚫 fetchActiveTransaction skipped: client?', !!client, 'isFetching?', isFetching)
      return
    }

    try {
      console.log('🔄 fetchActiveTransaction starting (no loading state change)')
      setIsFetching(true)
      setError(null)
      const transaction = await client.getActiveTransaction()
      
      // Only set active transaction if it's a valid non-zero transaction
      if (transaction && transaction.id !== '0' && parseInt(transaction.id) > 0) {
        console.log('✅ Found valid active transaction:', transaction.id)
        setActiveTransaction(transaction)
      } else {
        console.log('❌ No valid active transaction found')
        setActiveTransaction(null)
      }
    } catch (error) {
      console.error('💥 Error fetching active transaction:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch transaction')
      setActiveTransaction(null)
    } finally {
      console.log('✅ fetchActiveTransaction complete (no loading state change)')
      setIsFetching(false)
    }
  }

  const handlePayment = async () => {
    console.log('🚀 handlePayment called:', {
      isConnected: stellarWallet.isConnected,
      hasActiveTransaction: !!activeTransaction,
      hasClient: !!client,
      currentIsLoading: isLoading
    })
    
    if (!stellarWallet.isConnected || !activeTransaction || !client) {
      console.log('❌ Payment blocked - missing requirements')
      return
    }

    try {
      console.log('⏳ Setting isLoading to true')
      setIsLoading(true)
      setError(null)
      
      console.log('💳 Calling payActiveTransaction...')
      await client.payActiveTransaction()
      console.log('✅ Payment submitted successfully')
      toast.success('Payment submitted successfully!')
      
      // Refresh transaction status
      console.log('🔄 Refreshing transaction status in 2 seconds...')
      setTimeout(fetchActiveTransaction, 2000)
    } catch (error) {
      console.error('💥 Payment error:', error)
      setError(error instanceof Error ? error.message : 'Payment failed')
      toast.error('Payment failed')
    } finally {
      console.log('✅ Setting isLoading to false')
      setIsLoading(false)
    }
  }

  useEffect(() => {
    console.log('🏗️ StellarUserPanel mounted')
    return () => {
      console.log('🏗️ StellarUserPanel unmounted')
    }
  }, [])

  // Auto-reset loading state if stuck
  useEffect(() => {
    if (isLoading) {
      console.log('⏰ isLoading is true, setting timeout to auto-reset in 30 seconds')
      const timeout = setTimeout(() => {
        console.log('⏰ Auto-resetting stuck loading state')
        setIsLoading(false)
      }, 30000) // Reset after 30 seconds if stuck
      
      return () => clearTimeout(timeout)
    }
  }, [isLoading])

  useEffect(() => {
    if (stellarWallet.isConnected) {
      console.log('🔌 Wallet connected, starting initial fetch and polling')
      fetchActiveTransaction()
      fetchUserBalance()
      
      // Set up polling for active transaction - every 1 second for real-time updates
      const interval = setInterval(() => {
        console.log('⏰ Polling interval triggered')
        fetchActiveTransaction()
      }, 1000) // Every 1 second
      
      return () => {
        console.log('🔌 Cleaning up polling interval')
        clearInterval(interval)
      }
    } else {
      console.log('🔌 Wallet not connected, clearing active transaction')
      setActiveTransaction(null)
    }
  }, [stellarWallet.isConnected, client])

  const isValidActiveTx = activeTransaction && 
    activeTransaction.id !== '0' && 
    parseInt(activeTransaction.id) > 0 &&
    !activeTransaction.paid &&
    !activeTransaction.cancelled

  const getPaymentButtonContent = () => {
    console.log('🔍 getPaymentButtonContent called:', {
      isLoading,
      isFetching,
      activeTransaction: activeTransaction ? {
        id: activeTransaction.id,
        paid: activeTransaction.paid,
        cancelled: activeTransaction.cancelled
      } : null
    })
    
    if (isLoading) {
      console.log('🟡 Button state: Processing payment (isLoading=true)')
      return (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Processing...
        </>
      )
    }
    
    if (activeTransaction?.paid) {
      console.log('🟢 Button state: Paid')
      return (
        <>
          <CheckCircle className="w-4 h-4 mr-2" />
          Paid
        </>
      )
    }
    
    if (activeTransaction?.cancelled) {
      console.log('🔴 Button state: Cancelled')
      return (
        <>
          <XCircle className="w-4 h-4 mr-2" />
          Cancelled
        </>
      )
    }
    
    console.log('🔵 Button state: Pay Transaction (normal)')
    return (
      <>
        <CreditCard className="w-4 h-4 mr-2" />
        Pay Transaction
      </>
    )
  }

  if (!stellarWallet.isConnected) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-8"
      >
        <Wallet className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">Connect Freighter Wallet</h3>
        <p className="text-muted-foreground mb-4">
          Connect your Freighter wallet to interact with Stellar payment terminal
        </p>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Wallet Info */}
      <Card className="shadow-card bg-gradient-card border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Wallet className="w-5 h-5 text-primary" />
            Wallet Information
            <Button
              variant="outline"
              size="sm"
              onClick={fetchActiveTransaction}
              className="ml-auto"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Address:</span>
            <span className="font-mono text-sm">
              {stellarWallet.address?.slice(0, 8)}...{stellarWallet.address?.slice(-6)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Balance:</span>
            <span className="font-mono text-sm">{userBalance} XLM</span>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Status */}
      <Card className="shadow-card bg-gradient-card border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CreditCard className="w-5 h-5 text-primary" />
            Transaction Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading && !activeTransaction ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading transaction...</span>
            </div>
          ) : !isValidActiveTx ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/20 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Active Transaction</h3>
              <p className="text-muted-foreground">
                No pending payment required at this time
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Transaction #{activeTransaction.id}</span>
                <Badge variant={activeTransaction.paid ? 'default' : activeTransaction.cancelled ? 'destructive' : 'secondary'}>
                  {activeTransaction.paid ? 'Paid' : activeTransaction.cancelled ? 'Cancelled' : 'Pending'}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-mono">{(parseInt(activeTransaction.amount) / 1e7).toFixed(7)} XLM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Description:</span>
                  <span className="text-sm max-w-[200px] truncate">{activeTransaction.description}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Merchant:</span>
                  <span className="text-sm">{activeTransaction.merchantName}</span>
                </div>
                {activeTransaction.payer && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payer:</span>
                    <span className="font-mono text-xs">{activeTransaction.payer.slice(0, 8)}...</span>
                  </div>
                )}
              </div>

              {/* Itemized List Table */}
              {activeTransaction.itemizedList && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Items:</h4>
                  <ItemizedTable 
                    itemizedList={activeTransaction.itemizedList} 
                    currency="XLM"
                    size="sm"
                  />
                </div>
              )}
              
              <Button
                onClick={handlePayment}
                className="w-full"
                disabled={isLoading || !activeTransaction || activeTransaction.paid || activeTransaction.cancelled}
                variant={activeTransaction.paid ? "outline" : activeTransaction.cancelled ? "destructive" : "default"}
              >
                {getPaymentButtonContent()}
              </Button>
              
              {/* Debug Reset Button - TEMPORARY */}
              <Button
                onClick={() => {
                  console.log('🔧 Manual reset triggered')
                  setIsLoading(false)
                  setIsFetching(false)
                  setError(null)
                }}
                variant="outline"
                size="sm"
                className="w-full mt-2"
              >
                🔧 Reset All States (Debug)
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
