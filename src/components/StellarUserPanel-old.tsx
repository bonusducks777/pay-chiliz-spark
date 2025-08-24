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
  const [freighterStatus, setFreighterStatus] = useState<{
    detected: boolean;
    version?: string;
    error?: string;
  }>({ detected: false })

  const client = networkConfig.contractAddress && networkConfig.rpcUrl
    ? new StellarContractClient(networkConfig.contractAddress, networkConfig.rpcUrl)
    : null

  // Check Freighter status on mount
  useEffect(() => {
    const checkFreighter = async () => {
      try {
        console.log('Checking Freighter status...')
        
        const { isConnected } = await import('@stellar/freighter-api')
        const isInstalled = await isConnected()
        
        setFreighterStatus({ 
          detected: isInstalled,
          version: isInstalled ? 'Detected via API' : undefined
        })
        
        console.log('Freighter API check result:', isInstalled)
      } catch (error: any) {
        console.error('Freighter check failed:', error)
        setFreighterStatus({ 
          detected: false, 
          error: error.message 
        })
      }
    }

    checkFreighter()
    const timeout = setTimeout(checkFreighter, 1000)
    
    return () => clearTimeout(timeout)
  }, [])

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
      setIsLoading(true)
      setError(null)
      const transaction = await client.getActiveTransaction()
      
      // Only set active transaction if it's a valid non-zero transaction
      if (transaction && transaction.id !== '0' && parseInt(transaction.id) > 0) {
        setActiveTransaction(transaction)
      } else {
        setActiveTransaction(null)
      }
    } catch (error) {
      console.error('Error fetching active transaction:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch transaction')
      setActiveTransaction(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePayment = async () => {
    if (!stellarWallet.isConnected || !activeTransaction || !client) return

    try {
      setIsLoading(true)
      setError(null)
      await client.payActiveTransaction()
      toast.success('Payment submitted successfully!')
      
      // Refresh transaction status
      setTimeout(fetchActiveTransaction, 2000)
    } catch (error) {
      console.error('Error paying transaction:', error)
      setError(error instanceof Error ? error.message : 'Payment failed')
      toast.error('Payment failed')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (stellarWallet.isConnected) {
      fetchActiveTransaction()
      fetchUserBalance()
      
      // Set up polling for active transaction
      const interval = setInterval(fetchActiveTransaction, 10000) // Every 10 seconds
      return () => clearInterval(interval)
    }
  }, [stellarWallet.isConnected, client])

  const isValidActiveTx = activeTransaction && 
    activeTransaction.id !== '0' && 
    parseInt(activeTransaction.id) > 0 &&
    !activeTransaction.paid &&
    !activeTransaction.cancelled

  const getPaymentButtonContent = () => {
    if (isLoading) {
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
  }
        ])
        setActiveTransaction(activeTx)
        setPaymentStatus(payStatus)
      }, 2000)
    } catch (error: any) {
      console.error('Payment failed:', error)
      toast.error(`Payment failed: ${error.message}`)
    } finally {
      setIsPayingTx(false)
    }
  }

  if (!stellarWallet.isConnected) {
    return (
      <Card className="shadow-card bg-gradient-card border-border/50">
        <CardContent className="p-8 space-y-6">
          <div className="text-center">
            <CreditCard className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Connect Your Stellar Wallet</h3>
            <p className="text-muted-foreground mb-4">
              Connect your Freighter wallet to make payments on {networkConfig.name}
            </p>
          </div>

          {/* Freighter Status Debug */}
          <div className="p-4 bg-background/30 rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              {freighterStatus.detected ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-500" />
              )}
              <span className="text-sm font-medium">
                Freighter Status: {freighterStatus.detected ? 'Detected' : 'Not Detected'}
              </span>
            </div>
            
            {freighterStatus.version && (
              <p className="text-xs text-muted-foreground">
                Version: {freighterStatus.version}
              </p>
            )}
            
            {freighterStatus.error && (
              <p className="text-xs text-red-400">
                Error: {freighterStatus.error}
              </p>
            )}

            <details className="text-xs">
              <summary className="cursor-pointer text-muted-foreground">Debug Info</summary>
              <pre className="mt-2 p-2 bg-black/20 rounded text-xs overflow-auto">
                {JSON.stringify({
                  hasFreighter: !!(window as any)?.freighter,
                  hasFreighterApi: !!(window as any)?.freighterApi,
                  windowKeys: typeof window !== 'undefined' ? 
                    Object.keys(window).filter(k => 
                      k.toLowerCase().includes('freighter') || 
                      k.toLowerCase().includes('stellar')
                    ) : [],
                  contractAddress: networkConfig.contractAddress,
                  rpcUrl: networkConfig.rpcUrl,
                  networkName: networkConfig.name
                }, null, 2)}
              </pre>
            </details>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Card className="shadow-card bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            Stellar Payment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-background/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Connected Account</span>
              <span className="text-xs text-green-600 font-medium">Connected</span>
            </div>
            <p className="font-mono text-sm">
              {stellarWallet.address?.slice(0, 12)}...{stellarWallet.address?.slice(-8)}
            </p>
          </div>

          {/* Active Transaction Details */}
          {activeTransaction ? (
            <div className="p-4 bg-background/30 rounded-lg border border-border/50">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold">Active Transaction</h4>
                <Badge variant={paymentStatus?.paid ? 'default' : paymentStatus?.cancelled ? 'destructive' : 'secondary'}>
                  {paymentStatus?.paid ? 'Paid' : paymentStatus?.cancelled ? 'Cancelled' : 'Pending'}
                </Badge>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-mono">{(parseInt(activeTransaction.amount) / 10000000).toFixed(7)} XLM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Description:</span>
                  <span className="max-w-32 truncate">{activeTransaction.description}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Merchant:</span>
                  <span className="max-w-32 truncate">{activeTransaction.merchant_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Location:</span>
                  <span className="max-w-32 truncate">{activeTransaction.merchant_location}</span>
                </div>
                {paymentStatus?.payer && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Paid by:</span>
                    <span className="font-mono text-xs">{paymentStatus.payer.slice(0, 8)}...</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-background/20 rounded-lg text-center">
              <CreditCard className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No active transaction</p>
            </div>
          )}

          <div className="space-y-3">
            <Button 
              onClick={handlePayActiveTransaction}
              disabled={isPayingTx || !activeTransaction || paymentStatus?.paid || paymentStatus?.cancelled}
              className="w-full"
              size="lg"
            >
              {isPayingTx ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing Payment...
                </>
              ) : !activeTransaction ? (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  No Active Transaction
                </>
              ) : paymentStatus?.paid ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Already Paid
                </>
              ) : paymentStatus?.cancelled ? (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Transaction Cancelled
                </>
              ) : (
                <>
                  <Wallet className="w-4 h-4 mr-2" />
                  Pay {(parseInt(activeTransaction.amount) / 10000000).toFixed(4)} XLM
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Payment will be processed using your connected Freighter wallet
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
