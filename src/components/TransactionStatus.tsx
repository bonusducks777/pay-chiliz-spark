import { useReadContract } from 'wagmi'
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
    functionName: 'getActiveTransaction',
    query: {
      refetchInterval: 2000, // Refetch every 2 seconds for real-time updates
    }
  })

  const getStatusIcon = () => {
    if (!activeTransaction || activeTransaction[1] === 0n) return Clock
    if (activeTransaction[6]) return XCircle // cancelled
    if (activeTransaction[3]) return CheckCircle // paid
    return Activity // pending
  }

  const getStatusColor = () => {
    if (!activeTransaction || activeTransaction[1] === 0n) return 'secondary'
    if (activeTransaction[6]) return 'destructive'
    if (activeTransaction[3]) return 'default'
    return 'default'
  }

  const getStatusText = () => {
    if (!activeTransaction || activeTransaction[1] === 0n) return 'No Active Transaction'
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
          {activeTransaction && activeTransaction[1] !== 0n ? (
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

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Created</span>
                <span className="text-sm">
                  {new Date(Number(activeTransaction[4]) * 1000).toLocaleString()}
                </span>
              </div>

              {activeTransaction[3] && activeTransaction[2] !== '0x0000000000000000000000000000000000000000' && (
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