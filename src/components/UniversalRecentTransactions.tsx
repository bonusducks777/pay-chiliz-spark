import React from 'react';
import { useReadContract } from 'wagmi'
import { formatEther } from 'viem'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ItemizedTable } from '@/components/ui/itemized-table'
import { CONTRACTS, CONTRACT_ABI, getSupportedTokens, getChainInfo } from '@/lib/wagmi'
import { useChainId } from 'wagmi'
import { Clock, CheckCircle, XCircle } from 'lucide-react'
import { StellarContractClient } from '@/lib/stellar-contract'
import { TronContractClient } from '@/lib/tron-contract'
import { useNetwork } from '@/lib/network-context'

export const UniversalRecentTransactions = () => {
  const { isEVM, isStellar, isTron, networkConfig } = useNetwork()
  const chainId = useChainId()
  const chainInfo = getChainInfo(chainId)
  
  // EVM Data
  const contractAddress = CONTRACTS[chainId] as `0x${string}`;
  const supportedTokens = getSupportedTokens(chainId);
  
  const { data: allTxData } = useReadContract({
    address: contractAddress,
    abi: CONTRACT_ABI,
    functionName: 'getAllRecentTransactions',
    query: { 
      refetchInterval: 5000,
      enabled: isEVM && !!contractAddress
    },
  })

  // Stellar Data - fetch from contract when available
  const [stellarTransactions, setStellarTransactions] = React.useState([])

  // Tron Data - fetch from contract when available
  const [tronTransactions, setTronTransactions] = React.useState([])

  React.useEffect(() => {
    if (isStellar && networkConfig.contractAddress && networkConfig.rpcUrl) {
      // Fetch real Stellar transactions from contract
      const stellarClient = new StellarContractClient(
        networkConfig.contractAddress,
        networkConfig.rpcUrl
      )
      
      stellarClient.getRecentTransactions()
        .then(setStellarTransactions)
        .catch(error => {
          console.error('Failed to fetch Stellar transactions:', error)
          setStellarTransactions([])
        })
      
      // Set up polling to refresh data
      const interval = setInterval(() => {
        stellarClient.getRecentTransactions()
          .then(setStellarTransactions)
          .catch(error => console.error('Polling error:', error))
      }, 10000) // Poll every 10 seconds
      
      return () => clearInterval(interval)
    }
  }, [isStellar, networkConfig.contractAddress, networkConfig.rpcUrl])

  React.useEffect(() => {
    if (isTron && networkConfig.contractAddress && networkConfig.rpcUrl) {
      // For now, set some placeholder transactions for Tron
      const placeholderTransactions = [
        {
          id: '3',
          amount: '0.5',
          payer: 'TBg8fwgRfHmSt9dhWjfRpBpfXy89YirPuX',
          paid: true,
          timestamp: Date.now() - 300000,
          description: 'Coffee and pastry',
          cancelled: false,
          merchantName: 'Crypto Cafe',
          merchantLocation: 'Downtown',
          itemizedList: JSON.stringify([{name: 'Latte', quantity: 1, value: 0.3}, {name: 'Croissant', quantity: 1, value: 0.2}]),
          requestedTokenContract: '',
        },
        {
          id: '2',
          amount: '2.1',
          payer: 'TLPpSqpJhpaq2gkMNHjfAEhJ4pcz32iJYo',
          paid: true,
          timestamp: Date.now() - 900000,
          description: 'Gaming session',
          cancelled: false,
          merchantName: 'GameZone',
          merchantLocation: 'Mall Plaza',
          itemizedList: JSON.stringify([{name: '2hr Gaming', quantity: 1, value: 2.1}]),
          requestedTokenContract: '',
        },
        {
          id: '1',
          amount: '1.25',
          payer: 'TMuA6YqfCeX8EhbfYEg5y7S4DqzSJireY8',
          paid: false,
          timestamp: Date.now() - 1800000,
          description: 'Lunch order',
          cancelled: true,
          merchantName: 'Burger Spot',
          merchantLocation: 'Food Court',
          itemizedList: JSON.stringify([{name: 'Burger Combo', quantity: 1, value: 1.25}]),
          requestedTokenContract: '',
        }
      ]
      
      setTronTransactions(placeholderTransactions)
      
      // TODO: Replace with real contract data fetching
      // const tronClient = new TronContractClient(
      //   networkConfig.contractAddress,
      //   networkConfig.rpcUrl
      // )
      // 
      // tronClient.getRecentTransactions()
      //   .then(setTronTransactions)
      //   .catch(error => {
      //     console.error('Failed to fetch Tron transactions:', error)
      //     setTronTransactions([])
      //   })
      // 
      // // Set up polling to refresh data
      // const interval = setInterval(() => {
      //   tronClient.getRecentTransactions()
      //     .then(setTronTransactions)
      //     .catch(error => console.error('Tron polling error:', error))
      // }, 10000) // Poll every 10 seconds
      // 
      // return () => clearInterval(interval)
    }
  }, [isTron, networkConfig.contractAddress, networkConfig.rpcUrl])

  // Parse the transaction data
  const recentTransactions = React.useMemo(() => {
    if (isEVM) {
      if (!allTxData || !Array.isArray(allTxData) || allTxData.length < 10) {
        console.log('UniversalRecentTransactions - No valid EVM data:', allTxData)
        return []
      }

      const [ids, amounts, payers, paids, timestamps, descriptions, cancelleds, merchantNames, merchantLocations, itemizedLists, requestedTokenContracts] = allTxData
      if (!Array.isArray(ids) || ids.length === 0) {
        console.log('UniversalRecentTransactions - No EVM transactions found')
        return []
      }
      
      return ids.map((id, index) => ({
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
    } else if (isStellar) {
      return stellarTransactions
    } else if (isTron) {
      return tronTransactions
    }
    
    return []
  }, [isEVM, isStellar, allTxData, stellarTransactions])

  const formatAmount = (amount: any, tokenContract?: string) => {
    if (isEVM) {
      if (!amount) return '0'
      
      try {
        const token = supportedTokens?.find(t => t.address.toLowerCase() === tokenContract?.toLowerCase())
        if (token) {
          const decimals = token.decimals || 18
          const divisor = BigInt(10 ** decimals)
          const formattedAmount = (BigInt(amount.toString()) / divisor).toString()
          return `${formattedAmount} ${token.symbol}`
        }
        return `${formatEther(BigInt(amount.toString()))} ${chainInfo.symbol}`
      } catch (error) {
        console.error('Error formatting amount:', error)
        return '0'
      }
    } else if (isStellar) {
      // Stellar amounts are already in decimal format
      return `${amount} XLM`
    } else if (isTron) {
      // Tron amounts are in SUN (1 TRX = 1,000,000 SUN)
      try {
        const amountInTrx = parseInt(amount.toString()) / 1000000
        return `${amountInTrx.toFixed(6)} TRX`
      } catch (error) {
        console.error('Error formatting Tron amount:', error)
        return '0 TRX'
      }
    }
    
    return '0'
  }

  const formatAddress = (addr: string) => {
    if (!addr) return 'Unknown'
    if (isEVM) {
      return `${addr.slice(0, 6)}...${addr.slice(-4)}`
    } else if (isStellar) {
      return `${addr.slice(0, 8)}...${addr.slice(-8)}`
    }
    return addr
  }

  const getStatusIcon = (paid: boolean, cancelled: boolean) => {
    if (cancelled) return <XCircle className="w-4 h-4 text-red-500" />
    if (paid) return <CheckCircle className="w-4 h-4 text-green-500" />
    return <Clock className="w-4 h-4 text-yellow-500" />
  }

  const getStatusBadge = (paid: boolean, cancelled: boolean) => {
    if (cancelled) return <Badge variant="destructive">Cancelled</Badge>
    if (paid) return <Badge variant="default" className="bg-green-500">Paid</Badge>
    return <Badge variant="secondary">Pending</Badge>
  }

  return (
    <Card className="shadow-card bg-gradient-card border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Recent Transactions
          <Badge variant="outline" className="ml-auto">
            {networkConfig.name}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          {recentTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No recent transactions found</p>
              <p className="text-sm">Transactions will appear here once created</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentTransactions.slice(0, 10).map((tx, index) => (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 rounded-lg bg-background/30 border border-border/50 hover:bg-background/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(tx.paid, tx.cancelled)}
                      <span className="font-mono text-sm">#{tx.id}</span>
                    </div>
                    {getStatusBadge(tx.paid, tx.cancelled)}
                  </div>
                  
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Amount:</span>
                      <span className="font-mono font-semibold">
                        {formatAmount(tx.amount, tx.requestedTokenContract)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Payer:</span>
                      <span className="font-mono">{formatAddress(tx.payer)}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Merchant:</span>
                      <span>{tx.merchantName || 'Unknown'}</span>
                    </div>
                    
                    {tx.description && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Description:</span>
                        <span className="truncate max-w-32">{tx.description}</span>
                      </div>
                    )}
                    
                    {tx.itemizedList && (
                      <div className="mt-3">
                        <ItemizedTable 
                          itemizedList={tx.itemizedList}
                          size="sm"
                          currency={isEVM 
                            ? (() => {
                                const token = supportedTokens.find(t => t.address.toLowerCase() === tx.requestedTokenContract.toLowerCase());
                                return token ? token.symbol : '';
                              })()
                            : isStellar
                              ? 'XLM'
                              : isTron
                                ? 'TRX'
                                : ''
                          }
                        />
                      </div>
                    )}
                    
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Time:</span>
                      <span className="font-mono text-xs">
                        {new Date(Number(tx.timestamp) * 1000).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
