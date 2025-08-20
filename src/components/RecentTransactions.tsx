import { useReadContract } from 'wagmi'
import { formatEther } from 'viem'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/wagmi'
import { History, CheckCircle, XCircle } from 'lucide-react'

export const RecentTransactions = () => {
  const { data: recentTransactions } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getRecentTransactions',
  })

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="shadow-card bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            Recent Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            {recentTransactions && recentTransactions.length > 0 ? (
              <div className="space-y-3">
                {[...recentTransactions].reverse().map((tx, index) => (
                  <motion.div
                    key={tx[0].toString()}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/50 hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                        {tx[6] ? ( // cancelled
                          <XCircle className="w-4 h-4 text-destructive" />
                        ) : tx[3] ? ( // paid
                          <CheckCircle className="w-4 h-4 text-primary" />
                        ) : null}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">#{tx[0].toString()}</span>
                          <Badge 
                            variant={tx[6] ? 'destructive' : tx[3] ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {tx[6] ? 'Cancelled' : tx[3] ? 'Paid' : 'Pending'}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate max-w-32">
                          {tx[5]}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono text-sm text-primary">
                        {formatEther(tx[1])} CHZ
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(Number(tx[4]) * 1000).toLocaleDateString()}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <History className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Recent Transactions</h3>
                <p className="text-muted-foreground text-sm">
                  Transaction history will appear here
                </p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </motion.div>
  )
}