import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ItemizedTable } from '@/components/ui/itemized-table'
import { useNetwork } from '@/lib/network-context'
import { useStellarWallet } from '@/hooks/use-stellar-wallet'
import { StellarContractClient } from '@/lib/stellar-contract'
import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CreditCard, Loader2, CheckCircle, AlertTriangle, XCircle, Wallet, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

export const StellarUserPanel = () => {
  const { networkConfig } = useNetwork()
  const stellarWallet = useStellarWallet()
  const [isLoading, setIsLoading] = useState(false) // For background operations like fetching
  const [isPaymentLoading, setIsPaymentLoading] = useState(false) // For payment button specifically
  const [error, setError] = useState<string | null>(null)
  const [activeTransaction, setActiveTransaction] = useState<any>(null)
  const [userBalance, setUserBalance] = useState<string>('0')

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
    if (!client) return

    try {
      setError(null)
      const transaction = await client.getActiveTransaction()
      
      // Only set active transaction if it's a valid non-zero transaction
      if (transaction && transaction.id !== '0' && parseInt(transaction.id) > 0) {
        // Only update if the transaction has actually changed
        setActiveTransaction(prevTx => {
          if (!prevTx || 
              prevTx.id !== transaction.id || 
              prevTx.paid !== transaction.paid || 
              prevTx.cancelled !== transaction.cancelled ||
              prevTx.amount !== transaction.amount ||
              prevTx.description !== transaction.description) {
            return transaction
          }
          return prevTx // Keep the same object reference if nothing changed
        })
      } else {
        setActiveTransaction(null)
      }
    } catch (error) {
      console.error('Error fetching active transaction:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch transaction')
      setActiveTransaction(null)
    }
  }

  const handlePayment = async () => {
    console.log('handlePayment called');
    if (!stellarWallet.isConnected || !activeTransaction || !client || isPaymentLoading) return

    if (isPaymentLoading) {
      console.log('Already processing payment, preventing duplicate call');
      return;
    }

    try {
      setIsPaymentLoading(true)
      setError(null)
      await client.payActiveTransaction()
      toast.success('Payment submitted successfully!')
      
      // Refresh transaction status after a longer delay
      setTimeout(fetchActiveTransaction, 5000)
    } catch (error) {
      console.error('Error paying transaction:', error)
      setError(error instanceof Error ? error.message : 'Payment failed')
      toast.error('Payment failed')
    } finally {
      setIsPaymentLoading(false)
    }
  }

  useEffect(() => {
    if (stellarWallet.isConnected) {
      fetchActiveTransaction()
      fetchUserBalance()
      
      // Reduce polling frequency to prevent glitching
      const interval = setInterval(fetchActiveTransaction, 15000) // Every 15 seconds instead of 10
      return () => clearInterval(interval)
    }
  }, [stellarWallet.isConnected, client])

  // Stable transaction validation to prevent button flickering
  const isValidActiveTx = React.useMemo(() => {
    return activeTransaction && 
      activeTransaction.id !== '0' && 
      parseInt(activeTransaction.id) > 0 &&
      !activeTransaction.paid &&
      !activeTransaction.cancelled
  }, [activeTransaction?.id, activeTransaction?.paid, activeTransaction?.cancelled])

  // Memoize button content to prevent unnecessary re-renders
  const getPaymentButtonContent = React.useCallback(() => {
    if (isPaymentLoading) {
      return (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Processing...
        </>
      )
    }
    
    if (activeTransaction?.paid) {
      return (
        <>
          <CheckCircle className="w-4 h-4 mr-2" />
          Paid
        </>
      )
    }
    
    if (activeTransaction?.cancelled) {
      return (
        <>
          <XCircle className="w-4 h-4 mr-2" />
          Cancelled
        </>
      )
    }
    
    return (
      <>
        <CreditCard className="w-4 h-4 mr-2" />
        Pay Transaction
      </>
    )
  }, [isPaymentLoading, activeTransaction?.paid, activeTransaction?.cancelled])

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
                disabled={isPaymentLoading || !activeTransaction || activeTransaction.paid || activeTransaction.cancelled}
                variant={activeTransaction.paid ? "outline" : activeTransaction.cancelled ? "destructive" : "default"}
              >
                {getPaymentButtonContent()}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
