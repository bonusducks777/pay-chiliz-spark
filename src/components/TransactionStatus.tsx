import { useReadContract } from 'wagmi'
import * as React from 'react'
import { formatEther } from 'viem'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/wagmi'
import { Activity, CheckCircle, XCircle, Clock } from 'lucide-react'

export const TransactionStatus = () => {
  const { data: activeTransaction, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getActiveTransactionFields',
    query: {
      refetchInterval: 2000, // Refetch every 2 seconds for real-time updates
    }
  })

  // Helper: is valid struct (now expects 10 fields instead of 7)
  const isValidActiveTx = Array.isArray(activeTransaction) && activeTransaction.length >= 10 && typeof activeTransaction[0] !== 'undefined' && typeof activeTransaction[1] !== 'undefined' && activeTransaction[0] > 0n && activeTransaction[1] > 0n

  // Debug logging
  React.useEffect(() => {
    console.log('TransactionStatus - Active transaction data:', activeTransaction)
    console.log('TransactionStatus - Is valid:', isValidActiveTx)
    if (isValidActiveTx) {
      console.log('TransactionStatus - Transaction details:', {
        id: activeTransaction[0].toString(),
        amount: activeTransaction[1].toString(),
        payer: activeTransaction[2],
        paid: activeTransaction[3],
        timestamp: activeTransaction[4].toString(),
        description: activeTransaction[5],
        cancelled: activeTransaction[6],
        merchantName: activeTransaction[7],
        merchantLocation: activeTransaction[8],
        itemizedList: activeTransaction[9]
      })
    }
  }, [activeTransaction, isValidActiveTx])

  const getStatusIcon = () => {
    if (!isValidActiveTx) return Clock
    if (activeTransaction[6]) return XCircle // cancelled
    if (activeTransaction[3]) return CheckCircle // paid
    return Activity // pending
  }

  const getStatusColor = () => {
    if (!isValidActiveTx) return 'secondary'
    if (activeTransaction[6]) return 'destructive'
    if (activeTransaction[3]) return 'default'
    return 'default'
  }

  const getStatusText = () => {
    if (!isValidActiveTx) return 'No Active Transaction'
    if (activeTransaction[6]) return 'Cancelled'
    if (activeTransaction[3]) return 'Paid'
    return 'Awaiting Payment'
  }

  const StatusIcon = getStatusIcon()

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.1 }}
    >
      <Card className="shadow-card bg-gradient-card border-border/50 shadow-terminal">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Active Transaction
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isValidActiveTx ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant={getStatusColor() as any} className="flex items-center gap-1">
                  <StatusIcon className="w-3 h-3" />
                  {getStatusText()}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Transaction ID</span>
                <span className="font-mono text-primary">#{activeTransaction[0].toString()}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Amount</span>
                <span className="font-mono text-xl text-primary animate-glow">
                  {formatEther(activeTransaction[1])} CHZ
                </span>
              </div>

              <div className="space-y-2">
                <span className="text-sm text-muted-foreground">Description</span>
                <p className="text-sm bg-secondary/50 p-3 rounded-md border border-border/50">
                  {activeTransaction[5]}
                </p>
              </div>

              {activeTransaction[7] && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Merchant</span>
                  <span className="text-sm font-medium">{activeTransaction[7]}</span>
                </div>
              )}

              {activeTransaction[8] && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Location</span>
                  <span className="text-sm">{activeTransaction[8]}</span>
                </div>
              )}

              {activeTransaction[9] && (
                <div className="space-y-2">
                  <span className="text-sm text-muted-foreground">Items</span>
                  <ul className="text-xs bg-secondary/50 p-3 rounded-md border border-border/50 whitespace-pre-wrap list-disc pl-5">
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
                <span className="text-sm text-muted-foreground">Created</span>
                <span className="text-sm">
                  {new Date(Number(activeTransaction[4]) * 1000).toLocaleString()}
                </span>
              </div>

              {activeTransaction[3] && typeof activeTransaction[2] === 'string' && activeTransaction[2] !== '0x0000000000000000000000000000000000000000' && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Paid by</span>
                  <span className="font-mono text-xs">
                    {activeTransaction[2].slice(0, 6)}...{activeTransaction[2].slice(-4)}
                  </span>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Active Transaction</h3>
              <p className="text-muted-foreground text-sm">
                Create a payment request to get started
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}