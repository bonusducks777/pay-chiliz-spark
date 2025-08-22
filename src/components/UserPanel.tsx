import { motion } from 'framer-motion'
import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useBalance } from 'wagmi'
import * as React from 'react'
import { useAccount } from 'wagmi'
import { formatEther } from 'viem'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/wagmi'
import { useToast } from '@/hooks/use-toast'
import { CreditCard, Wallet, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react'

export const UserPanel = () => {
  const { address } = useAccount()
  const { toast } = useToast()

  // Get user balance
  const { data: balance } = useBalance({
    address: address,
  })

  // Get active transaction
  const { data: activeTransaction, refetch: refetchActive } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getActiveTransactionFields',
    query: {
      refetchInterval: 2000, // Refetch every 2 seconds for real-time updates
    }
  })

  // Helper: is valid struct (now expects 10 fields instead of 7)
  const isValidActiveTx = Array.isArray(activeTransaction) && activeTransaction.length >= 10 && typeof activeTransaction[0] !== 'undefined' && typeof activeTransaction[1] !== 'undefined' && activeTransaction[0] > 0n && activeTransaction[1] > 0n

  const { writeContract, data: hash, isPending, error } = useWriteContract({
    mutation: {
      onError: (error) => {
        toast({
          title: "Transaction Failed",
          description: error.message || "Failed to process payment",
          variant: "destructive"
        })
      }
    }
  })

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  // Handle successful payment
  React.useEffect(() => {
    if (isSuccess && hash) {
      refetchActive()
      toast({
        title: "Payment Successful!",
        description: "Your payment has been processed successfully",
      })
    }
  }, [isSuccess, hash, refetchActive, toast])

  const handlePayment = () => {
    if (!isValidActiveTx) {
      toast({
        title: "No Active Transaction",
        description: "There's no payment request to process",
        variant: "destructive"
      })
      return
    }
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'payActiveTransaction',
      value: activeTransaction[1], // amount
    } as any)
  }

  const getTransactionStatus = () => {
    if (!isValidActiveTx) {
      return { status: 'none', icon: Clock, color: 'secondary' }
    }
    if (activeTransaction[6]) {
      return { status: 'cancelled', icon: XCircle, color: 'destructive' }
    }
    if (activeTransaction[3]) {
      return { status: 'paid', icon: CheckCircle, color: 'default' }
    }
    return { status: 'pending', icon: Clock, color: 'default' }
  }

  const { status, icon: StatusIcon, color } = getTransactionStatus()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* User Balance */}
      <Card className="shadow-card bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary" />
            Your Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold font-mono text-primary">
            {balance ? formatEther(balance.value) : '0.000'} CHZ
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Available balance
          </p>
        </CardContent>
      </Card>

      {/* Payment Interface */}
      <Card className="shadow-card bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            Payment Request
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {activeTransaction && activeTransaction[0] > 0n && activeTransaction[1] > 0n ? (
            <>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Transaction ID</span>
                  <span className="font-mono">#{activeTransaction[0].toString()}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Amount</span>
                  <span className="font-mono text-lg text-primary">
                    {formatEther(activeTransaction[1])} CHZ
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Description</span>
                  <span className="text-right max-w-48 truncate">{activeTransaction[5]}</span>
                </div>
                
                {activeTransaction[7] && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Merchant</span>
                    <span className="text-right max-w-48 truncate">{activeTransaction[7]}</span>
                  </div>
                )}
                
                {activeTransaction[8] && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Location</span>
                    <span className="text-right max-w-48 truncate">{activeTransaction[8]}</span>
                  </div>
                )}
                
                {activeTransaction[9] && (
                  <div className="space-y-2">
                    <span className="text-sm text-muted-foreground">Items</span>
                    <ul className="text-xs bg-secondary/50 p-2 rounded border border-border/50 whitespace-pre-wrap max-h-20 overflow-y-auto list-disc pl-5">
                      {(() => {
                        try {
                          const items = JSON.parse(activeTransaction[9])
                          if (Array.isArray(items) && items.length > 0) {
                            return items.map((item, idx) => (
                              <li key={idx}>
                                <span className="font-semibold">{item.name}</span> x{item.quantity} - <span className="font-mono">{item.value}</span>
                              </li>
                            ))
                          }
                          return <li className="text-muted-foreground">No items</li>
                        } catch {
                          return <li className="text-destructive">Invalid itemized list</li>
                        }
                      })()}
                    </ul>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge variant={color as any} className="flex items-center gap-1">
                    <StatusIcon className="w-3 h-3" />
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Badge>
                </div>

                {activeTransaction[3] && activeTransaction[2] !== '0x0000000000000000000000000000000000000000' && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Paid by</span>
                    <span className="font-mono text-xs">
                      {activeTransaction[2].slice(0, 6)}...{activeTransaction[2].slice(-4)}
                    </span>
                  </div>
                )}
              </div>

              {!activeTransaction[3] && !activeTransaction[6] && (
                <Button
                  onClick={handlePayment}
                  disabled={isPending || isConfirming}
                  className="w-full"
                  size="lg"
                >
                  {isPending || isConfirming ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing Payment...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Pay {formatEther(activeTransaction[1])} CHZ
                    </>
                  )}
                </Button>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Active Payment Request</h3>
              <p className="text-muted-foreground">
                Waiting for the merchant to create a payment request
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}