import React, { useState } from 'react'
import { useReadContract, useWriteContract } from 'wagmi'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { CONTRACTS, CONTRACT_ABI } from '@/lib/wagmi'
import { useChainId } from 'wagmi'
import { useNetwork } from '@/lib/network-context'
import { useStellarWallet } from '@/hooks/use-stellar-wallet'
import { useTronWallet } from '@/hooks/use-tron-wallet'
import { StellarContractClient } from '@/lib/stellar-contract'
import { TronContractClient } from '@/lib/tron-contract'
import { Code, Database, Eye, RefreshCw, Clock, Star } from 'lucide-react'

export const DebugPanel = () => {
  const { isEVM, isStellar, isTron, networkConfig } = useNetwork()
  const stellarWallet = useStellarWallet()
  const tronWallet = useTronWallet()
  const chainId = useChainId();
  
  // EVM Contract data
  const contractAddress = isEVM ? CONTRACTS[chainId] as `0x${string}` : undefined;
  
  // Stellar Data
  const [stellarData, setStellarData] = React.useState<any>(null)
  
  // Tron Data
  const [tronData, setTronData] = React.useState<any>(null)
  
  const stellarClient = React.useMemo(() => 
    isStellar && networkConfig.contractAddress && networkConfig.rpcUrl
      ? new StellarContractClient(networkConfig.contractAddress, networkConfig.rpcUrl)
      : null
  , [isStellar, networkConfig])

  const tronClient = React.useMemo(() => 
    isTron && networkConfig.contractAddress && networkConfig.rpcUrl
      ? new TronContractClient(networkConfig.contractAddress, networkConfig.rpcUrl)
      : null
  , [isTron, networkConfig])

  React.useEffect(() => {
    if (stellarClient) {
      const fetchStellarData = async () => {
        try {
          const data = await stellarClient.getAllContractData()
          setStellarData(data)
        } catch (error) {
          console.error('Failed to fetch Stellar contract data:', error)
          setStellarData(null)
        }
      }
      
      fetchStellarData()
      const interval = setInterval(fetchStellarData, 5000)
      return () => clearInterval(interval)
    }
  }, [stellarClient])

  React.useEffect(() => {
    if (tronClient) {
      const fetchTronData = async () => {
        try {
          const data = await tronClient.getAllContractData()
          setTronData(data)
        } catch (error) {
          console.error('Failed to fetch Tron contract data:', error)
          setTronData(null)
        }
      }
      
      fetchTronData()
      const interval = setInterval(fetchTronData, 5000)
      return () => clearInterval(interval)
    }
  }, [tronClient])
  
  // EVM Contract balance
  const { data: contractBalance, refetch: refetchContractBalance } = useReadContract({
    address: contractAddress,
    abi: CONTRACT_ABI,
    functionName: 'getContractBalance',
    query: { 
      refetchInterval: 5000,
      enabled: isEVM && !!contractAddress 
    },
  })

  // EVM All recent transactions (tuple arrays)
  const { data: allTxData } = useReadContract({
    address: contractAddress,
    abi: CONTRACT_ABI,
    functionName: 'getAllRecentTransactions',
    query: { 
      refetchInterval: 5000,
      enabled: isEVM && !!contractAddress 
    },
  })

  const allRecentTransactions = React.useMemo(() => {
    if (!isEVM || !allTxData || !Array.isArray(allTxData) || allTxData.length < 11) return [];
    const [ids, amounts, payers, paids, timestamps, descriptions, cancelleds, merchantNames, merchantLocations, itemizedLists, requestedTokenContracts] = allTxData;
    return ids.map((id: any, i: number) => [
      id, amounts[i], payers[i], paids[i], timestamps[i], descriptions[i], cancelleds[i],
      merchantNames[i], merchantLocations[i], itemizedLists[i], requestedTokenContracts[i]
    ]);
  }, [isEVM, allTxData]);

  // Write contract for clearActiveTransaction (EVM only)
  const { writeContract } = useWriteContract();
  const handleClearActiveTransaction = () => {
    if (isEVM && contractAddress) {
      writeContract({
        address: contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'clearActiveTransaction',
      } as any)
    }
  }

  // Individual contract reads (EVM only)
  const { data: owner, refetch: refetchOwner } = useReadContract({
    address: contractAddress,
    abi: CONTRACT_ABI,
    functionName: 'owner',
    query: { enabled: isEVM && !!contractAddress }
  })

  const { data: txCounter, refetch: refetchTxCounter } = useReadContract({
    address: contractAddress,
    abi: CONTRACT_ABI,
    functionName: 'txCounter',
    query: { enabled: isEVM && !!contractAddress }
  })

  const { data: maxRecentTx, refetch: refetchMaxRecentTx } = useReadContract({
    address: contractAddress,
    abi: CONTRACT_ABI,
    functionName: 'MAX_RECENT_TX',
    query: { enabled: isEVM && !!contractAddress }
  })

  const { data: activeTransaction, refetch: refetchActiveTransaction } = useReadContract({
    address: contractAddress,
    abi: CONTRACT_ABI,
    functionName: 'getActiveTransactionFields',
    query: { enabled: isEVM && !!contractAddress }
  })

  const { data: paymentStatus, refetch: refetchPaymentStatus } = useReadContract({
    address: contractAddress,
    abi: CONTRACT_ABI,
    functionName: 'getPaymentStatus',
    query: { enabled: isEVM && !!contractAddress }
  })

  // Debug logging
  console.log('DebugPanel data:', isEVM ? {
    owner,
    txCounter,
    maxRecentTx,
    activeTransaction,
    allRecentTransactions,
    paymentStatus
  } : {
    stellarConnected: stellarWallet.isConnected,
    stellarAddress: stellarWallet.address,
    stellarNetwork: networkConfig.name,
    stellarContractId: networkConfig.contractAddress,
    stellarData: stellarData
  })

  const handleRefresh = () => {
    console.log('Debug panel refresh triggered for', networkConfig.type)
    if (isEVM) {
      refetchOwner()
      refetchTxCounter()
      refetchMaxRecentTx()
      refetchActiveTransaction()
      refetchContractBalance()
      refetchPaymentStatus()
    } else if (stellarClient) {
      // Trigger Stellar data refresh
      stellarClient.getAllContractData()
        .then(setStellarData)
        .catch(error => console.error('Stellar refresh failed:', error))
    } else if (tronClient) {
      // Trigger Tron data refresh
      tronClient.getAllContractData()
        .then(setTronData)
        .catch(error => console.error('Tron refresh failed:', error))
    }
  }

  // Network-specific contract data
  const contractData = isEVM ? [
    { name: 'owner', description: 'Contract owner address', data: owner },
    { name: 'txCounter', description: 'Total transaction counter', data: txCounter },
    { name: 'MAX_RECENT_TX', description: 'Maximum recent transactions stored', data: maxRecentTx },
    { name: 'activeTransaction', description: 'Current active transaction details', data: activeTransaction },
    { name: 'paymentStatus', description: 'Payment status of active transaction', data: paymentStatus },
    { name: 'contractBalance', description: 'Current contract balance (CHZ)', data: contractBalance ? `${Number(contractBalance) / 1e18} CHZ` : '0.000 CHZ' },
  ] : isStellar ? [
    { name: 'contractId', description: 'Stellar contract ID', data: networkConfig.contractAddress },
    { name: 'rpcUrl', description: 'Stellar RPC endpoint', data: networkConfig.rpcUrl },
    { name: 'owner', description: 'Contract owner address', data: stellarData?.owner || 'Loading...' },
    { name: 'txCounter', description: 'Total transaction counter', data: stellarData?.txCounter || 0 },
    { name: 'maxRecentTx', description: 'Maximum recent transactions', data: stellarData?.maxRecentTx || 10 },
    { name: 'recentCount', description: 'Current recent transactions count', data: stellarData?.recentCount || 0 },
    { name: 'activeTransaction', description: 'Current active transaction', data: stellarData?.activeTransaction || 'None' },
    { name: 'paymentStatus', description: 'Payment status', data: stellarData?.paymentStatus || 'Loading...' },
    { name: 'contractBalance', description: 'Contract balance (XLM)', data: stellarData?.contractBalance ? `${Number(stellarData.contractBalance) / 1e7} XLM` : '0.000 XLM' },
    { name: 'walletConnected', description: 'Freighter wallet connected', data: stellarWallet.isConnected ? 'Yes' : 'No' },
    { name: 'walletAddress', description: 'Connected wallet address', data: stellarWallet.address || 'Not connected' },
  ] : isTron ? [
    { name: 'contractAddress', description: 'Tron contract address', data: networkConfig.contractAddress },
    { name: 'rpcUrl', description: 'Tron RPC endpoint', data: networkConfig.rpcUrl },
    { name: 'owner', description: 'Contract owner address', data: tronData?.owner || 'Loading...' },
    { name: 'txCounter', description: 'Total transaction counter', data: tronData?.txCounter || 0 },
    { name: 'activeTransaction', description: 'Current active transaction', data: tronData?.activeTransaction || 'None' },
    { name: 'contractBalance', description: 'Contract balance (TRX)', data: tronData?.contractBalance ? `${Number(tronData.contractBalance) / 1e6} TRX` : '0.000 TRX' },
    { name: 'walletConnected', description: 'TronLink wallet connected', data: tronWallet.isConnected ? 'Yes' : 'No' },
    { name: 'walletAddress', description: 'Connected wallet address', data: tronWallet.address || 'Not connected' },
    { name: 'recentTransactionsCount', description: 'Recent transactions count', data: tronData?.recentTransactions?.length || 0 },
  ] : []

  const readFunctions = isEVM ? [
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
  ] : isStellar ? [
    { name: 'get_active_transaction', description: 'Get current active payment request' },
    { name: 'get_recent_transactions', description: 'Get recent transaction history' },
    { name: 'get_transaction_count', description: 'Get total transaction count' },
    { name: 'get_owner', description: 'Get contract owner address' },
    { name: 'get_payment_status', description: 'Check payment status' },
  ] : isTron ? [
    { name: 'owner', description: 'Contract owner address' },
    { name: 'txCounter', description: 'Total transaction counter' },
    { name: 'getActiveTransaction', description: 'Get current active transaction' },
    { name: 'getRecentTransactions', description: 'Get recent transaction history' },
    { name: 'getTxCounter', description: 'Get total transaction count' },
    { name: 'getContractBalance', description: 'Get contract balance for token' },
    { name: 'getOwner', description: 'Get contract owner address' },
  ] : []

  const writeFunctions = isEVM ? [
    { name: 'setActiveTransaction', description: 'Create new payment request (Owner only)', params: ['uint256 amount', 'string description'] },
    { name: 'cancelActiveTransaction', description: 'Cancel current transaction (Owner only)', params: [] },
    { name: 'clearActiveTransaction', description: 'Clear completed transaction (Owner only)', params: [] },
    { name: 'payActiveTransaction', description: 'Pay the active transaction', params: [] },
    { name: 'withdraw', description: 'Withdraw contract balance (Owner only)', params: ['address payable to'] },
  ] : isStellar ? [
    { name: 'set_active_transaction', description: 'Create new payment request (Owner only)', params: ['amount: u64', 'description: String'] },
    { name: 'cancel_active_transaction', description: 'Cancel current transaction (Owner only)', params: [] },
    { name: 'clear_active_transaction', description: 'Clear completed transaction (Owner only)', params: [] },
    { name: 'pay_active_transaction', description: 'Pay the active transaction', params: [] },
    { name: 'withdraw', description: 'Withdraw contract balance (Owner only)', params: ['to: Address'] },
  ] : isTron ? [
    { name: 'setActiveTransaction', description: 'Create new payment request (Owner only)', params: ['uint256 amount', 'string description', 'string merchantName', 'string merchantLocation', 'string itemizedList', 'address tokenContract'] },
    { name: 'cancelActiveTransaction', description: 'Cancel current transaction (Owner only)', params: [] },
    { name: 'clearActiveTransaction', description: 'Clear completed transaction (Owner only)', params: [] },
    { name: 'payActiveTransaction', description: 'Pay the active transaction', params: [] },
    { name: 'withdraw', description: 'Withdraw contract balance (Owner only)', params: ['address to'] },
  ] : []

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isEVM ? <Code className="w-5 h-5 text-primary" /> : <Star className="w-5 h-5 text-primary" />}
          <h2 className="text-xl font-bold">Debug Console</h2>
          <Badge variant="outline">{networkConfig.name}</Badge>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="state" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="state">{isEVM ? 'Contract State' : 'Network State'}</TabsTrigger>
          <TabsTrigger value="functions">{isEVM ? 'Functions' : 'Methods'}</TabsTrigger>
          <TabsTrigger value="events">{isEVM ? 'Contract Info' : 'Network Info'}</TabsTrigger>
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
                  {isEVM && (
                    <Button onClick={handleClearActiveTransaction} variant="outline" className="mt-2 w-full">
                      Clear Active Transaction
                    </Button>
                  )}
                  {isStellar && stellarClient && (
                    <Button 
                      onClick={() => stellarClient.clearActiveTransaction().catch(console.error)} 
                      variant="outline" 
                      className="mt-2 w-full"
                    >
                      Clear Active Transaction (Stellar)
                    </Button>
                  )}
                  {isTron && tronClient && (
                    <Button 
                      onClick={() => tronClient.clearActiveTransaction().catch(console.error)} 
                      variant="outline" 
                      className="mt-2 w-full"
                    >
                      Clear Active Transaction (Tron)
                    </Button>
                  )}
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
                {(isEVM ? allRecentTransactions.length > 0 : 
                  isStellar ? (stellarData?.recentTransactions || []).length > 0 :
                  isTron ? (tronData?.recentTransactions || []).length > 0 : false) ? (
                  <div className="space-y-2 font-mono text-xs">
                    {isEVM ? (
                      allRecentTransactions.map((tx, index) => (
                        <div key={index} className="p-2 bg-secondary/30 rounded border border-border/50">
                          <div className="grid grid-cols-4 gap-2">
                            <span className="text-primary">ID: {tx[0]?.toString()}</span>
                            <span>Amount: {tx[1]?.toString()}</span>
                            <span>Paid: {tx[3] ? 'Yes' : 'No'}</span>
                            <span>Cancelled: {tx[6] ? 'Yes' : 'No'}</span>
                          </div>
                          <div className="mt-1 text-muted-foreground">
                            <div>Payer: {tx[2] || 'None'}</div>
                            <div>Description: {tx[5] || 'No description'}</div>
                            <div>Merchant: {tx[7] || 'Unknown'}</div>
                          </div>
                        </div>
                      ))
                    ) : isStellar ? (
                      stellarData?.recentTransactions?.map((tx: any, index: number) => (
                        <div key={index} className="p-2 bg-secondary/30 rounded border border-border/50">
                          <div className="grid grid-cols-4 gap-2">
                            <span className="text-primary">ID: {tx.id}</span>
                            <span>Amount: {tx.amount} stroops</span>
                            <span>Paid: {tx.paid ? 'Yes' : 'No'}</span>
                            <span>Cancelled: {tx.cancelled ? 'Yes' : 'No'}</span>
                          </div>
                          <div className="mt-1 text-muted-foreground">
                            <div>Payer: {tx.payer || 'None'}</div>
                            <div>Description: {tx.description || 'No description'}</div>
                            <div>Merchant: {tx.merchant_name || 'Unknown'}</div>
                          </div>
                        </div>
                      )) || []
                    ) : isTron ? (
                      tronData?.recentTransactions?.map((tx: any, index: number) => (
                        <div key={index} className="p-2 bg-secondary/30 rounded border border-border/50">
                          <div className="grid grid-cols-4 gap-2">
                            <span className="text-primary">ID: {tx.id}</span>
                            <span>Amount: {tx.amount} TRX</span>
                            <span>Paid: {tx.paid ? 'Yes' : 'No'}</span>
                            <span>Cancelled: {tx.cancelled ? 'Yes' : 'No'}</span>
                          </div>
                          <div className="mt-1 text-muted-foreground">
                            <div>Payer: {tx.payer || 'None'}</div>
                            <div>Description: {tx.description || 'No description'}</div>
                            <div>Merchant: {tx.merchantName || 'Unknown'}</div>
                          </div>
                        </div>
                      )) || []
                    ) : null}
                  </div>
                ) : (
                  <div className="text-center py-4 text-xs text-muted-foreground">
                    No recent transactions found
                  </div>
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
                    {isEVM ? contractAddress : networkConfig.contractAddress || 'Not deployed'}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <span className="text-sm text-muted-foreground">{isEVM ? 'Chain ID' : 'Network'}</span>
                  <div className="font-mono text-sm bg-secondary/30 p-2 rounded border">
                    {isEVM ? `${chainId} (${networkConfig.name})` : networkConfig.name}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <span className="text-sm text-muted-foreground">RPC URL</span>
                  <div className="font-mono text-sm bg-secondary/30 p-2 rounded border">
                    {isEVM ? 'Auto-detected' : networkConfig.rpcUrl || 'Not configured'}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <span className="text-sm text-muted-foreground">Contract Balance</span>
                  <div className="font-mono text-sm bg-secondary/30 p-2 rounded border">
                    {isEVM 
                      ? (contractBalance ? `${Number(contractBalance) / 1e18} CHZ` : '0.000 CHZ')
                      : isStellar 
                        ? (stellarData?.contractBalance ? `${Number(stellarData.contractBalance) / 1e7} XLM` : '0.000 XLM')
                        : isTron
                          ? (tronData?.contractBalance ? `${Number(tronData.contractBalance) / 1e6} TRX` : '0.000 TRX')
                          : 'Unknown'
                    }
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