import { motion } from 'framer-motion'
import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useBalance } from 'wagmi'
import * as React from 'react'
import { useAccount } from 'wagmi'
import { formatEther } from 'viem'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ItemizedTable } from '@/components/ui/itemized-table'
import { CONTRACTS, CONTRACT_ABI, getSupportedTokens } from '@/lib/wagmi'
import { useChainId } from 'wagmi'
import { useToast } from '@/hooks/use-toast'
import { CreditCard, Wallet, CheckCircle, XCircle, Clock, Loader2, ShieldCheck } from 'lucide-react'

export const UserPanel = () => {
  const { address } = useAccount()
  const { toast } = useToast()
  const chainId = useChainId();
  const contractAddress = CONTRACTS[chainId] as `0x${string}`;
  const supportedTokens = getSupportedTokens(chainId);
  const [needsApproval, setNeedsApproval] = React.useState(false);
  const [approvalPending, setApprovalPending] = React.useState(false);

  // Get user balances for all supported tokens
  const userBalances = supportedTokens.map(token => {
    const { data: tokenBalance } = useBalance({
      address: address,
      token: token.address === '0x0000000000000000000000000000000000000000' ? undefined : token.address as `0x${string}`,
      query: { refetchInterval: 5000 }
    });
    return { ...token, balance: tokenBalance };
  });

  // Get active transaction
  const { data: activeTransaction, refetch: refetchActive } = useReadContract({
  address: contractAddress,
    abi: CONTRACT_ABI,
    functionName: 'getActiveTransactionFields',
    query: {
      refetchInterval: 2000, // Refetch every 2 seconds for real-time updates
    }
  })

  // Helper: is valid struct (now expects 11 fields for ERC20)
  const isValidActiveTx = Array.isArray(activeTransaction) && activeTransaction.length >= 11 && typeof activeTransaction[0] !== 'undefined' && typeof activeTransaction[1] !== 'undefined' && activeTransaction[0] > 0n && activeTransaction[1] > 0n

  // ERC20 Approval ABI
  const ERC20_ABI = [
    {
      name: 'approve',
      type: 'function',
      stateMutability: 'nonpayable',
      inputs: [
        { name: 'spender', type: 'address' },
        { name: 'amount', type: 'uint256' }
      ],
      outputs: [{ name: '', type: 'bool' }]
    },
    {
      name: 'allowance',
      type: 'function',
      stateMutability: 'view',
      inputs: [
        { name: 'owner', type: 'address' },
        { name: 'spender', type: 'address' }
      ],
      outputs: [{ name: '', type: 'uint256' }]
    }
  ] as const;

  // Check ERC20 allowance if needed
  const requestedTokenAddress = isValidActiveTx ? activeTransaction[10] : '0x0000000000000000000000000000000000000000';
  const isERC20Payment = requestedTokenAddress !== '0x0000000000000000000000000000000000000000';
  
  const { data: allowance } = useReadContract({
    address: isERC20Payment ? requestedTokenAddress as `0x${string}` : undefined,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: isERC20Payment && address ? [address, contractAddress] : undefined,
    query: { 
      enabled: isERC20Payment && !!address,
      refetchInterval: 3000 
    }
  });

  // Check if approval is needed
  React.useEffect(() => {
    if (isERC20Payment && isValidActiveTx && allowance !== undefined) {
      const requiredAmount = activeTransaction[1];
      setNeedsApproval(allowance < requiredAmount);
    } else {
      setNeedsApproval(false);
    }
  }, [isERC20Payment, isValidActiveTx, allowance, activeTransaction]);

  const { writeContract: approveToken, data: approveHash, isPending: isApproving } = useWriteContract({
    mutation: {
      onSuccess: () => {
        setApprovalPending(true);
        toast({
          title: "Approval Submitted",
          description: "Token approval transaction submitted"
        });
      },
      onError: (error) => {
        toast({
          title: "Approval Failed",
          description: error.message || "Failed to approve token",
          variant: "destructive"
        });
      }
    }
  });

  const { isSuccess: approveSuccess } = useWaitForTransactionReceipt({
    hash: approveHash,
  });

  React.useEffect(() => {
    if (approveSuccess) {
      setApprovalPending(false);
      toast({
        title: "Approval Successful",
        description: "Token approved successfully. You can now make the payment."
      });
    }
  }, [approveSuccess, toast]);

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

  const handleApproval = () => {
    if (!isValidActiveTx || !isERC20Payment) return;
    
    approveToken({
      address: requestedTokenAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [contractAddress, activeTransaction[1]],
    } as any);
  };

  const handlePayment = async () => {
    if (!isValidActiveTx) {
      toast({
        title: "No Active Transaction",
        description: "There's no payment request to process",
        variant: "destructive"
      })
      return
    }

    if (isERC20Payment && needsApproval) {
      toast({
        title: "Approval Required",
        description: "Please approve the token first before making payment",
        variant: "destructive"
      });
      return;
    }

    const requestedToken = activeTransaction[10];
    if (requestedToken === '0x0000000000000000000000000000000000000000') {
      // Native token
      writeContract({
        address: contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'payActiveTransaction',
        value: activeTransaction[1],
      } as any)
    } else {
      // ERC20: prompt user to approve first, then call payActiveTransaction (no value)
      // You may want to add an approval UI here for production
      writeContract({
        address: contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'payActiveTransaction',
        value: 0n,
      } as any)
    }
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
            Your Balances
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {userBalances.map(token => (
              <div key={token.shortcode} className="flex flex-col items-center p-3 border rounded bg-secondary/30">
                <span className="font-bold text-sm">{token.symbol}</span>
                <span className="font-mono text-xs text-primary">
                  {token.balance ? formatEther(token.balance.value) : '0.000'}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Available balances for {userBalances.find(t => t.address === '0x0000000000000000000000000000000000000000')?.name || 'this chain'}
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
                    {formatEther(activeTransaction[1])} {(() => {
                      const token = supportedTokens.find(t => t.address.toLowerCase() === String(activeTransaction[10]).toLowerCase());
                      return token ? token.symbol : 'TOKEN';
                    })()}
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
                  <ItemizedTable 
                    itemizedList={activeTransaction[9]}
                    size="sm"
                    currency={(() => {
                      const token = supportedTokens.find(t => t.address.toLowerCase() === String(activeTransaction[10]).toLowerCase());
                      return token ? token.symbol : 'TOKEN';
                    })()}
                  />
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
                <>
                  {isERC20Payment && needsApproval && (
                    <Button
                      onClick={handleApproval}
                      disabled={isApproving || approvalPending}
                      className="w-full mb-2"
                      variant="outline"
                    >
                      {isApproving || approvalPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {isApproving ? 'Approving...' : 'Approval Pending...'}
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4 mr-2" />
                          Approve {formatEther(activeTransaction[1])} {(() => {
                            const token = supportedTokens.find(t => t.address.toLowerCase() === String(activeTransaction[10]).toLowerCase());
                            return token ? token.symbol : 'TOKEN';
                          })()}
                        </>
                      )}
                    </Button>
                  )}
                  <Button
                    onClick={handlePayment}
                    disabled={isPending || isConfirming || (isERC20Payment && needsApproval)}
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
                        Pay {formatEther(activeTransaction[1])} {(() => {
                          const token = supportedTokens.find(t => t.address.toLowerCase() === String(activeTransaction[10]).toLowerCase());
                          return token ? token.symbol : 'TOKEN';
                        })()}
                      </>
                    )}
                  </Button>
                </>
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