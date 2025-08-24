import { useReadContract, useChainId } from 'wagmi'
import * as React from 'react'
import { formatEther } from 'viem'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ItemizedTable } from '@/components/ui/itemized-table'
import { CONTRACTS, CONTRACT_ABI, getSupportedTokens } from '@/lib/wagmi'
import { StellarContractClient, STELLAR_TOKENS } from '@/lib/stellar-contract'
import { TronContractClient } from '@/lib/tron-contract'
import { useNetwork } from '@/lib/network-context'
import { Activity, CheckCircle, XCircle, Clock } from 'lucide-react'

export const UniversalTransactionStatus = () => {
  const { isEVM, isStellar, isTron, networkConfig } = useNetwork()
  const chainId = useChainId();
  
  // EVM data
  const contractAddress = CONTRACTS[chainId] as `0x${string}`;
  const supportedTokens = getSupportedTokens(chainId);
  const { data: activeTransaction, refetch } = useReadContract({
    address: contractAddress,
    abi: CONTRACT_ABI,
    functionName: 'getActiveTransactionFields',
    query: {
      refetchInterval: 5000, // Reduced from 2000 to 5000ms
      enabled: isEVM && !!contractAddress
    }
  })

  // Stellar data
  const [stellarTransaction, setStellarTransaction] = React.useState<any>(null)
  const stellarClient = React.useMemo(() => 
    isStellar && networkConfig.contractAddress && networkConfig.rpcUrl
      ? new StellarContractClient(networkConfig.contractAddress, networkConfig.rpcUrl)
      : null
  , [isStellar, networkConfig])

  // Tron data
  const [tronTransaction, setTronTransaction] = React.useState<any>(null)
  const tronClient = React.useMemo(() => 
    isTron && networkConfig.contractAddress && networkConfig.rpcUrl
      ? new TronContractClient(networkConfig.contractAddress, networkConfig.rpcUrl)
      : null
  , [isTron, networkConfig])

  React.useEffect(() => {
    if (stellarClient) {
      const fetchStellarData = async () => {
        try {
          const tx = await stellarClient.getActiveTransaction()
          // Only update if we got valid data or null (no active transaction)
          if (tx !== undefined) {
            setStellarTransaction(tx)
          }
        } catch (error) {
          console.error('Failed to fetch Stellar transaction:', error)
          // Don't reset transaction on error, keep previous state
        }
      }
      
      fetchStellarData()
      const interval = setInterval(fetchStellarData, 5000) // Reduced from 2000 to 5000ms
      return () => clearInterval(interval)
    } else {
      // Reset when client is not available
      setStellarTransaction(null)
    }
  }, [stellarClient])

  React.useEffect(() => {
    if (tronClient) {
      const fetchTronData = async () => {
        try {
          const tx = await tronClient.getActiveTransaction()
          // Only update if we got valid data or null (no active transaction)
          if (tx !== undefined) {
            setTronTransaction(tx)
          }
        } catch (error) {
          console.error('Failed to fetch Tron transaction:', error)
          // Don't reset transaction on error, keep previous state
        }
      }
      
      fetchTronData()
      const interval = setInterval(fetchTronData, 5000) // Reduced from 2000 to 5000ms
      return () => clearInterval(interval)
    } else {
      // Reset when client is not available
      setTronTransaction(null)
    }
  }, [tronClient])

  // Universal transaction data with improved validation
  const transaction = isEVM ? activeTransaction : (isStellar ? stellarTransaction : tronTransaction)
  const isValidActiveTx = React.useMemo(() => {
    if (isEVM) {
      return Array.isArray(activeTransaction) && activeTransaction.length >= 11 && activeTransaction[0] > 0n
    } else if (isStellar) {
      return stellarTransaction !== null && 
             stellarTransaction.id !== '0' && 
             parseInt(stellarTransaction.id) > 0 &&
             !stellarTransaction.paid &&
             !stellarTransaction.cancelled
    } else if (isTron) {
      return tronTransaction !== null && 
             tronTransaction.id !== '0' && 
             parseInt(tronTransaction.id) > 0 &&
             !tronTransaction.paid &&
             !tronTransaction.cancelled
    }
    return false
  }, [isEVM, isStellar, isTron, activeTransaction, stellarTransaction, tronTransaction])

  const getStatusIcon = () => {
    if (!isValidActiveTx) return Clock
    
    if (isEVM) {
      if (activeTransaction[6]) return XCircle // cancelled
      if (activeTransaction[3]) return CheckCircle // paid
      return Activity // pending
    } else if (isStellar) {
      if (stellarTransaction?.cancelled) return XCircle
      if (stellarTransaction?.paid) return CheckCircle
      return Activity
    } else if (isTron) {
      if (tronTransaction?.cancelled) return XCircle
      if (tronTransaction?.paid) return CheckCircle
      return Activity
    }
    return Clock
  }

  const getStatusText = () => {
    if (!isValidActiveTx) return 'No Active Transaction'
    
    if (isEVM) {
      if (activeTransaction[6]) return 'Cancelled'
      if (activeTransaction[3]) return 'Paid'
      return 'Pending Payment'
    } else if (isStellar) {
      if (stellarTransaction?.cancelled) return 'Cancelled'
      if (stellarTransaction?.paid) return 'Paid'
      return 'Pending Payment'
    } else if (isTron) {
      if (tronTransaction?.cancelled) return 'Cancelled'
      if (tronTransaction?.paid) return 'Paid'
      return 'Pending Payment'
    }
    return 'Unknown Status'
  }

  const getStatusColor = () => {
    if (!isValidActiveTx) return 'secondary'
    
    if (isEVM) {
      if (activeTransaction[6]) return 'destructive'
      if (activeTransaction[3]) return 'default'
      return 'default'
    } else if (isStellar) {
      if (stellarTransaction?.cancelled) return 'destructive'
      if (stellarTransaction?.paid) return 'default'
      return 'default'
    } else if (isTron) {
      if (tronTransaction?.cancelled) return 'destructive'
      if (tronTransaction?.paid) return 'default'
      return 'default'
    }
    return 'secondary'
  }

  const formatAmount = (amount: any) => {
    if (isEVM) {
      return formatEther(amount)
    } else if (isStellar) {
      // Convert stroops to XLM for display
      return (parseInt(amount) / 10000000).toFixed(7)
    } else if (isTron) {
      // Convert sun to TRX for display
      return (parseInt(amount) / 1000000).toFixed(6)
    }
    return '0'
  }

  const getTokenSymbol = () => {
    if (isEVM) {
      const tokenAddress = activeTransaction?.[10]
      const token = supportedTokens.find(t => t.address.toLowerCase() === tokenAddress?.toLowerCase())
      return token?.symbol || 'Unknown'
    } else if (isStellar) {
      const tokenContract = stellarTransaction?.requested_token_contract
      const token = STELLAR_TOKENS.find(t => t.address === tokenContract)
      return token?.symbol || 'XLM'
    } else if (isTron) {
      // For Tron, if token contract is null address, it's TRX
      const tokenContract = tronTransaction?.requestedTokenContract
      if (tokenContract === '0x0000000000000000000000000000000000000000' || tokenContract === 'T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb') {
        return 'TRX'
      }
      return 'TRC20' // Generic for other tokens
    }
    return 'Unknown'
  }

  const StatusIcon = getStatusIcon()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="shadow-card bg-gradient-card border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="w-5 h-5 text-primary" />
            Transaction Status
            <Badge variant="outline" className="ml-auto">
              {networkConfig.name}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isValidActiveTx ? (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No active transaction</p>
              <p className="text-sm text-muted-foreground mt-2">
                Waiting for a new payment request...
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Status Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StatusIcon className="w-5 h-5" />
                  <span className="font-medium">Status</span>
                </div>
                <Badge variant={getStatusColor() as any}>
                  {getStatusText()}
                </Badge>
              </div>

              {/* Transaction Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Amount</span>
                  <p className="font-mono font-medium">
                    {isEVM 
                      ? formatAmount(activeTransaction[1])
                      : isStellar 
                        ? formatAmount(stellarTransaction?.amount)
                        : isTron
                          ? formatAmount(tronTransaction?.amount)
                          : '0'
                    } {getTokenSymbol()}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">ID</span>
                  <p className="font-mono font-medium">
                    #{isEVM 
                      ? activeTransaction[0].toString()
                      : isStellar
                        ? stellarTransaction?.id
                        : isTron
                          ? tronTransaction?.id
                          : '0'
                    }
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Merchant</span>
                  <p className="font-medium truncate">
                    {isEVM 
                      ? activeTransaction[7]
                      : isStellar
                        ? stellarTransaction?.merchant_name
                        : isTron
                          ? tronTransaction?.merchantName
                          : 'N/A'
                    }
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Location</span>
                  <p className="font-medium truncate">
                    {isEVM 
                      ? activeTransaction[8]
                      : isStellar
                        ? stellarTransaction?.merchant_location
                        : isTron
                          ? tronTransaction?.merchantLocation
                          : 'N/A'
                    }
                  </p>
                </div>
              </div>

              {/* Description */}
              <div>
                <span className="text-muted-foreground text-sm">Description</span>
                <p className="font-medium">
                  {isEVM 
                    ? activeTransaction[5]
                    : isStellar
                      ? stellarTransaction?.description
                      : isTron
                        ? tronTransaction?.description
                        : 'N/A'
                  }
                </p>
              </div>

              {/* Items */}
              {((isEVM && activeTransaction[9]) || 
                (isStellar && stellarTransaction?.itemized_list) || 
                (isTron && tronTransaction?.itemizedList)) && (
                <ItemizedTable 
                  itemizedList={
                    isEVM 
                      ? activeTransaction[9]
                      : isStellar
                        ? stellarTransaction?.itemized_list || '[]'
                        : isTron
                          ? tronTransaction?.itemizedList || '[]'
                          : '[]'
                  }
                  size="sm"
                  currency={
                    isEVM 
                      ? (() => {
                          const token = supportedTokens.find(t => t.address.toLowerCase() === String(activeTransaction[10]).toLowerCase());
                          return token ? token.symbol : 'TOKEN';
                        })()
                      : isStellar
                        ? 'XLM'
                        : isTron
                          ? 'TRX'
                          : ''
                  }
                />
              )}

              {/* Payer Info */}
              {((isEVM && activeTransaction[2] && activeTransaction[2] !== '0x0000000000000000000000000000000000000000') || 
                (isStellar && stellarTransaction?.payer) ||
                (isTron && tronTransaction?.payer)) && (
                <div>
                  <span className="text-muted-foreground text-sm">Payer</span>
                  <p className="font-mono text-sm">
                    {isEVM 
                      ? `${activeTransaction[2].slice(0, 6)}...${activeTransaction[2].slice(-4)}`
                      : isStellar
                        ? `${stellarTransaction?.payer?.slice(0, 6)}...${stellarTransaction?.payer?.slice(-4)}`
                        : isTron
                          ? `${tronTransaction?.payer?.slice(0, 6)}...${tronTransaction?.payer?.slice(-4)}`
                          : 'N/A'
                    }
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
