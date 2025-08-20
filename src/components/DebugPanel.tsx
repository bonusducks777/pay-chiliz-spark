import { useState } from 'react'
import { useReadContract } from 'wagmi'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/wagmi'
import { Code, Database, Eye, RefreshCw } from 'lucide-react'

export const DebugPanel = () => {
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
    functionName: 'getActiveTransaction',
  })

  const { data: recentTransactions, refetch: refetchRecentTransactions } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getRecentTransactions',
  })

  const { data: paymentStatus, refetch: refetchPaymentStatus } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getPaymentStatus',
  })

  const handleRefresh = () => {
    refetchOwner()
    refetchTxCounter()
    refetchMaxRecentTx()
    refetchActiveTransaction()
    refetchRecentTransactions()
    refetchPaymentStatus()
  }

  const contractData = [
    { name: 'owner', description: 'Contract owner address', data: owner },
    { name: 'txCounter', description: 'Total transaction counter', data: txCounter },
    { name: 'MAX_RECENT_TX', description: 'Maximum recent transactions stored', data: maxRecentTx },
    { name: 'activeTransaction', description: 'Current active transaction details', data: activeTransaction },
    { name: 'recentTransactions', description: 'Array of recent transactions', data: recentTransactions },
    { name: 'paymentStatus', description: 'Payment status of active transaction', data: paymentStatus },
  ]

  const readFunctions = [
    { name: 'owner', description: 'Contract owner address' },
    { name: 'txCounter', description: 'Total transaction counter' },
    { name: 'MAX_RECENT_TX', description: 'Maximum recent transactions stored' },
    { name: 'activeTransaction', description: 'Current active transaction struct' },
    { name: 'getActiveTransaction', description: 'Get active transaction details' },
    { name: 'getRecentTransactions', description: 'Array of recent transactions' },
    { name: 'getPaymentStatus', description: 'Payment status of active transaction' },
  ]

  const writeFunctions = [
    { name: 'setActiveTransaction', description: 'Create new payment request (Owner only)', params: ['uint256 amount', 'string description'] },
    { name: 'cancelActiveTransaction', description: 'Cancel current transaction (Owner only)', params: [] },
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
                </div>
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
                    Check via external balance query
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