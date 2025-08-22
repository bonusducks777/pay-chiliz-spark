import React, { useState } from 'react'
import { useReadContract, useWriteContract } from 'wagmi'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/wagmi'
import { Code, Database, Eye, RefreshCw, Clock } from 'lucide-react'

export const DebugPanel = () => {
  // Contract balance
  const { data: contractBalance, refetch: refetchContractBalance } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getContractBalance',
    query: { refetchInterval: 5000 },
  })

  // All recent transactions (tuple arrays)
  const { data: allTxData } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getAllRecentTransactions',
    query: { refetchInterval: 5000 },
  })

  const allRecentTransactions = React.useMemo(() => {
    if (!allTxData || !Array.isArray(allTxData) || allTxData.length < 10) return [];
    const [ids, amounts, payers, paids, timestamps, descriptions, cancelleds, merchantNames, merchantLocations, itemizedLists] = allTxData;
    return ids.map((id: any, i: number) => [
      id, amounts[i], payers[i], paids[i], timestamps[i], descriptions[i], cancelleds[i],
      merchantNames[i], merchantLocations[i], itemizedLists[i]
    ]);
  }, [allTxData]);

  // Write contract for clearActiveTransaction
  const { writeContract } = useWriteContract();
  const handleClearActiveTransaction = () => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'clearActiveTransaction',
    } as any)
  }

  // Individual contract reads to avoid type issues
  const { data: owner, refetch: refetchOwner } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'owner',
  })

  const { data: txCounter, refetch: refetchTxCounter } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'txCounter',
  })

  const { data: maxRecentTx, refetch: refetchMaxRecentTx } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'MAX_RECENT_TX',
  })

  const { data: activeTransaction, refetch: refetchActiveTransaction } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getActiveTransactionFields',
  })

  const { data: paymentStatus, refetch: refetchPaymentStatus } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getPaymentStatus',
  })

  // Debug logging
  console.log('DebugPanel data:', {
    owner,
    txCounter,
    maxRecentTx,
    activeTransaction,
    allRecentTransactions,
    paymentStatus
  })

  const handleRefresh = () => {
    console.log('Debug panel refresh triggered')
    refetchOwner()
    refetchTxCounter()
    refetchMaxRecentTx()
    refetchActiveTransaction()
    refetchContractBalance()
    refetchPaymentStatus()
  }

  const contractData = [
    { name: 'owner', description: 'Contract owner address', data: owner },
    { name: 'txCounter', description: 'Total transaction counter', data: txCounter },
    { name: 'MAX_RECENT_TX', description: 'Maximum recent transactions stored', data: maxRecentTx },
    { name: 'activeTransaction', description: 'Current active transaction details', data: activeTransaction },
    { name: 'paymentStatus', description: 'Payment status of active transaction', data: paymentStatus },
    { name: 'contractBalance', description: 'Current contract balance (CHZ)', data: contractBalance ? `${Number(contractBalance) / 1e18} CHZ` : '0.000 CHZ' },
  ]

  const readFunctions = [
    { name: 'owner', description: 'Contract owner address' },
    { name: 'txCounter', description: 'Total transaction counter' },
    { name: 'MAX_RECENT_TX', description: 'Maximum recent transactions stored' },
    { name: 'activeTransaction', description: 'Current active transaction struct' },
    { name: 'getActiveTransactionFields', description: 'Get active transaction fields as tuple' },
    { name: 'getAllRecentTransactions', description: 'Get all recent transactions as tuple arrays' },
    { name: 'getPaymentStatus', description: 'Payment status of active transaction' },
    { name: 'getContractBalance', description: 'Get current contract balance' },
    { name: 'getRecentTransactionsCount', description: 'Get count of recent transactions' },
    { name: 'getRecentTransactionFields', description: 'Get specific transaction by index' },
  ]

  const writeFunctions = [
    { name: 'setActiveTransaction', description: 'Create new payment request (Owner only)', params: ['uint256 amount', 'string description'] },
    { name: 'cancelActiveTransaction', description: 'Cancel current transaction (Owner only)', params: [] },
    { name: 'clearActiveTransaction', description: 'Clear completed transaction (Owner only)', params: [] },
    { name: 'payActiveTransaction', description: 'Pay the active transaction', params: [] },
    { name: 'withdraw', description: 'Withdraw contract balance (Owner only)', params: ['address payable to'] },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Code className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold">Debug Console</h2>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="state" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="state">Contract State</TabsTrigger>
          <TabsTrigger value="functions">Functions</TabsTrigger>
          <TabsTrigger value="events">Contract Info</TabsTrigger>
        </TabsList>

        <TabsContent value="state" className="space-y-4">
          <Card className="shadow-card bg-gradient-card border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5 text-primary" />
                Live Contract State
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-4 font-mono text-sm">
                  {contractData.map((item, index) => (
                    <div key={index} className="p-3 rounded-lg bg-secondary/30 border border-border/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-primary font-semibold">
                          {item.name}
                        </span>
                        <Badge variant={item.data !== undefined ? 'default' : 'destructive'}>
                          {item.data !== undefined ? 'success' : 'error'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {item.description}
                      </p>
                      <div className="bg-terminal-bg p-2 rounded border border-border/30 overflow-x-auto">
                        <pre className="text-xs text-terminal-green whitespace-pre-wrap">
                          {item.data !== undefined 
                            ? JSON.stringify(item.data, (key, value) =>
                                typeof value === 'bigint' ? value.toString() : value
                              , 2)
                            : 'No data available'
                          }
                        </pre>
                      </div>
                    </div>
                  ))}
                  {/* Button to clear active transaction */}
                  <Button onClick={handleClearActiveTransaction} variant="outline" className="mt-2 w-full">
                    Clear Active Transaction
                  </Button>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
          {/* All Recent Transactions Table */}
          <Card className="shadow-card bg-gradient-card border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                All Recent Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px] pr-4">
                {allRecentTransactions.length > 0 ? (
                  <div className="space-y-2">
                    {[...allRecentTransactions].reverse().map((tx, idx) => (
                      <div key={tx[0].toString()} className="flex items-center justify-between p-2 rounded bg-secondary/30 border border-border/50">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs">#{tx[0].toString()}</span>
                          <Badge variant={tx[6] ? 'destructive' : tx[3] ? 'default' : 'secondary'} className="text-xs">
                            {tx[6] ? 'Cancelled' : tx[3] ? 'Paid' : 'Pending'}
                          </Badge>
                        </div>
                        <span className="font-mono text-xs">{tx[5]}</span>
                        <span className="font-mono text-xs">{Number(tx[1]) / 1e18} CHZ</span>
                        <span className="font-mono text-xs">{new Date(Number(tx[4]) * 1000).toLocaleDateString()}</span>
                        {tx[9] && (
                          <ul className="text-[10px] text-muted-foreground/80 list-disc pl-4 mt-1">
                            {(() => {
                              try {
                                const items = JSON.parse(tx[9])
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
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-xs text-muted-foreground">No recent transactions</div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="functions" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Read Functions */}
            <Card className="shadow-card bg-gradient-card border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-primary" />
                  View Functions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-3">
                    {readFunctions.map((func, index) => (
                      <div key={func.name} className="p-3 rounded-lg bg-secondary/30 border border-border/50">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary" className="text-xs">VIEW</Badge>
                          <span className="font-mono text-sm text-primary">{func.name}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{func.description}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Write Functions */}
            <Card className="shadow-card bg-gradient-card border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="w-5 h-5 text-primary" />
                  Write Functions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-3">
                    {writeFunctions.map((func) => (
                      <div key={func.name} className="p-3 rounded-lg bg-secondary/30 border border-border/50">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="destructive" className="text-xs">WRITE</Badge>
                          <span className="font-mono text-sm text-primary">{func.name}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{func.description}</p>
                        {func.params.length > 0 && (
                          <div className="text-xs">
                            <span className="text-muted-foreground">Parameters:</span>
                            <div className="font-mono text-terminal-cyan ml-2">
                              {func.params.map((param, i) => (
                                <div key={i}>• {param}</div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <Card className="shadow-card bg-gradient-card border-border/50">
            <CardHeader>
              <CardTitle>Contract Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <span className="text-sm text-muted-foreground">Contract Address</span>
                  <div className="font-mono text-sm bg-secondary/30 p-2 rounded border">
                    {CONTRACT_ADDRESS}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <span className="text-sm text-muted-foreground">Chain ID</span>
                  <div className="font-mono text-sm bg-secondary/30 p-2 rounded border">
                    88882 (Chiliz Spicy)
                  </div>
                </div>
                
                <div className="space-y-2">
                  <span className="text-sm text-muted-foreground">RPC URL</span>
                  <div className="font-mono text-sm bg-secondary/30 p-2 rounded border">
                    spicy-rpc.chiliz.com
                  </div>
                </div>
                
                <div className="space-y-2">
                  <span className="text-sm text-muted-foreground">Contract Balance</span>
                  <div className="font-mono text-sm bg-secondary/30 p-2 rounded border">
                    {contractBalance ? `${Number(contractBalance) / 1e18} CHZ` : '0.000 CHZ'}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-sm text-muted-foreground">Available Events</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {['NewActiveTransaction', 'PaymentReceived', 'TransactionCancelled', 'FundsWithdrawn'].map((event) => (
                    <Badge key={event} variant="outline" className="justify-center p-2">
                      {event}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}