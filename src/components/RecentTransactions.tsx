import React from 'react';
import { useReadContract } from 'wagmi'
import { formatEther } from 'viem'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CONTRACTS, CONTRACT_ABI, getSupportedTokens } from '@/lib/wagmi'
import { useChainId } from 'wagmi'
import { Clock, CheckCircle, XCircle } from 'lucide-react'

export const RecentTransactions = () => {
  const chainId = useChainId();
  const contractAddress = CONTRACTS[chainId] as `0x${string}`;
  const supportedTokens = getSupportedTokens(chainId);
  // Use new getAllRecentTransactions for efficient loading
  const { data: allTxData } = useReadContract({
    address: contractAddress,
    abi: CONTRACT_ABI,
    functionName: 'getAllRecentTransactions',
    query: { refetchInterval: 5000 },
  })

  // Parse the transaction data from the new contract format
  const recentTransactions = React.useMemo(() => {
    if (!allTxData || !Array.isArray(allTxData) || allTxData.length < 10) {
      console.log('RecentTransactions - No valid data:', allTxData)
      return []
    }

    const [ids, amounts, payers, paids, timestamps, descriptions, cancelleds, merchantNames, merchantLocations, itemizedLists, requestedTokenContracts] = allTxData
    if (!Array.isArray(ids) || ids.length === 0) {
      console.log('RecentTransactions - No transactions found')
      return []
    }
    const transactions = ids.map((id, index) => ({
      id: id,
      amount: amounts[index],
      payer: payers[index],
      paid: paids[index],
      timestamp: timestamps[index],
      description: descriptions[index],
      cancelled: cancelleds[index],
      merchantName: merchantNames[index],
      merchantLocation: merchantLocations[index],
      itemizedList: itemizedLists[index],
      requestedTokenContract: requestedTokenContracts[index],
    }))

    console.log('RecentTransactions - Parsed transactions:', transactions)
    return transactions
  }, [allTxData])

  React.useEffect(() => {
    console.log('RecentTransactions - Raw data:', allTxData)
  }, [allTxData])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="shadow-card bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Recent Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            {recentTransactions && recentTransactions.length > 0 ? (
              <div className="space-y-3">
                {[...recentTransactions].reverse().map((tx, index) => (
                  <motion.div
                    key={tx.id.toString()}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/50 hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                        {tx.cancelled ? (
                          <XCircle className="w-4 h-4 text-destructive" />
                        ) : tx.paid ? (
                          <CheckCircle className="w-4 h-4 text-primary" />
                        ) : (
                          <Clock className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                       <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">#{tx.id.toString()}</span>
                          <Badge
                            variant={tx.cancelled ? 'destructive' : tx.paid ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {tx.cancelled ? 'Cancelled' : tx.paid ? 'Paid' : 'Pending'}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate max-w-32">
                          {tx.description}
                        </p>
                        {tx.merchantName && (
                          <p className="text-xs text-muted-foreground/80 truncate max-w-32">
                            {tx.merchantName}
                          </p>
                        )}
                        {tx.itemizedList && (
                          <div className="text-[10px] text-muted-foreground/80 mt-1">
                            {(() => {
                              try {
                                const items = JSON.parse(tx.itemizedList)
                                if (Array.isArray(items) && items.length > 0) {
                                  return (
                                    <div className="space-y-1">
                                      <div className="grid grid-cols-[1fr_40px_60px] gap-1 font-semibold border-b pb-1">
                                        <span>Item</span>
                                        <span className="text-center">Qty</span>
                                        <span className="text-center">Amount</span>
                                      </div>
                                      {items.map((item, idx) => (
                                        <div key={idx} className="grid grid-cols-[1fr_40px_60px] gap-1">
                                          <span className="font-semibold truncate">{item.name}</span>
                                          <span className="text-center">{item.quantity}</span>
                                          <span className="text-center font-mono">{item.value}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )
                                }
                                return <div className="text-muted-foreground">No items</div>
                              } catch {
                                return <div className="text-destructive">Invalid itemized list</div>
                              }
                            })()}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono text-sm text-primary">
                        {formatEther(tx.amount)} {(() => {
                          const token = supportedTokens.find(t => t.address.toLowerCase() === String(tx.requestedTokenContract).toLowerCase());
                          return token ? token.symbol : 'TOKEN';
                        })()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(Number(tx.timestamp) * 1000).toLocaleDateString()}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Clock className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
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