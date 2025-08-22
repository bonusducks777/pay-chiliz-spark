import { useState } from 'react'
import * as React from 'react'
import { motion } from 'framer-motion'
import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { parseEther } from 'viem'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { CONTRACTS, CONTRACT_ABI, getSupportedTokens } from '@/lib/wagmi'
import { useChainId } from 'wagmi'
import { useToast } from '@/hooks/use-toast'
import { useMerchantInfo } from '@/hooks/use-merchant-info'
import { Settings, Plus, X, Wallet, Loader2, Store, MapPin } from 'lucide-react'

export const AdminPanel = () => {
  const chainId = useChainId();
  const contractAddress = CONTRACTS[chainId] as `0x${string}`;
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [itemizedItems, setItemizedItems] = useState<{ name: string; quantity: string; value: string }[]>([])
  const [newItem, setNewItem] = useState({ name: '', quantity: '1', value: '' })
  const [withdrawAddress, setWithdrawAddress] = useState('')
  const supportedTokens = getSupportedTokens(chainId);
  const [selectedToken, setSelectedToken] = useState(supportedTokens[0]);
  const [requestedTokenContract, setRequestedTokenContract] = useState(supportedTokens[0].address);
  const { toast } = useToast()
  const { merchantInfo, updateMerchantInfo } = useMerchantInfo()

  // Reset selected token when chain changes
  React.useEffect(() => {
    const newSupportedTokens = getSupportedTokens(chainId);
    setSelectedToken(newSupportedTokens[0]); // Always default to native token
    setRequestedTokenContract(newSupportedTokens[0].address);
  }, [chainId]);

  // Get active transaction state
  const { data: activeTransaction, refetch: refetchActive } = useReadContract({
    address: contractAddress,
    abi: CONTRACT_ABI,
    functionName: 'getActiveTransactionFields',
    query: {
      refetchInterval: 3000, // Refetch every 3 seconds
    }
  });

  // Helper: check if there's a valid active transaction
  const hasActiveTransaction = Array.isArray(activeTransaction) && activeTransaction.length >= 11 && activeTransaction[0] > 0n;
  const isTransactionPaid = hasActiveTransaction && activeTransaction[3];
  const isTransactionCancelled = hasActiveTransaction && activeTransaction[6];
  const canCreateNewTransaction = !hasActiveTransaction || isTransactionPaid || isTransactionCancelled;
  const canCancelTransaction = hasActiveTransaction && !isTransactionPaid && !isTransactionCancelled;

  // Get contract balances for all supported tokens
  const balances = supportedTokens.map(token => {
    const { data } = useReadContract({
      address: contractAddress,
      abi: CONTRACT_ABI,
      functionName: 'getContractBalance',
      args: [token.address],
      query: { refetchInterval: 5000 },
    });
    return { ...token, balance: data };
  });

  // Auto-calculate amount from itemizedItems
  React.useEffect(() => {
    if (itemizedItems.length > 0) {
      const total = itemizedItems.reduce((sum, item) => {
        const qty = parseFloat(item.quantity) || 0;
        const val = parseFloat(item.value) || 0;
        return sum + qty * val;
      }, 0);
      setAmount(total ? total.toFixed(selectedToken.decimals) : '');
    } else {
      setAmount('');
    }
  }, [itemizedItems, selectedToken]);

  const { writeContract, data: hash, isPending, error } = useWriteContract({
    mutation: {
      onSuccess: () => {
        // Refresh active transaction state after successful operation
        setTimeout(() => refetchActive(), 1000);
      },
      onError: (error) => {
        toast({
          title: "Transaction Failed",
          description: error.message || "Transaction failed to execute",
          variant: "destructive"
        })
      }
    }
  })
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  // Handle successful transactions
  React.useEffect(() => {
    if (isSuccess && hash) {
      console.log('AdminPanel - Transaction successful, hash:', hash)
      toast({
        title: "Transaction Successful!",
        description: "Your transaction has been confirmed on the blockchain",
      })
    }
  }, [isSuccess, hash, toast])

  const handleSetTransaction = async () => {
    if (!canCreateNewTransaction) {
      toast({
        title: "Cannot Create Transaction",
        description: "Please complete or cancel the current active transaction first",
        variant: "destructive"
      })
      return
    }
    
    if (!amount || !description || !merchantInfo.name || !merchantInfo.location) {
      toast({
        title: "Error",
        description: "Please fill in all required fields (amount, description, merchant name, and location)",
        variant: "destructive"
      })
      return
    }
    let itemizedListJson = '[]'
    try {
      itemizedListJson = JSON.stringify(itemizedItems)
    } catch (e) {
      toast({
        title: "Error",
        description: "Failed to serialize itemized list",
        variant: "destructive"
      })
      return
    }
    writeContract({
      address: contractAddress,
      abi: CONTRACT_ABI,
      functionName: 'setActiveTransaction',
      args: [parseEther(amount), description, merchantInfo.name, merchantInfo.location, itemizedListJson, selectedToken.address],
    } as any)
    setAmount('')
    setDescription('')
    setItemizedItems([])
    setNewItem({ name: '', quantity: '', value: '' })
    setSelectedToken(supportedTokens[0])
  }

  const handleCancelTransaction = () => {
    console.log('handleCancelTransaction called')
    
    if (!canCancelTransaction) {
      toast({
        title: "Cannot Cancel Transaction",
        description: !hasActiveTransaction 
          ? "No active transaction to cancel" 
          : isTransactionPaid 
            ? "Cannot cancel a paid transaction" 
            : "Transaction is already cancelled",
        variant: "destructive"
      })
      return
    }
    
    writeContract({
      address: contractAddress,
      abi: CONTRACT_ABI,
      functionName: 'cancelActiveTransaction',
    } as any)
  }

  const handleWithdraw = () => {
    console.log('handleWithdraw called with address:', withdrawAddress)
    
    if (!withdrawAddress) {
      console.log('Missing withdrawal address')
      toast({
        title: "Error",
        description: "Please enter withdrawal address",
        variant: "destructive"
      })
      return
    }

    console.log('Initiating withdrawal...')
    // PaymentTerminalERC20 withdraw requires tokenContract parameter
    writeContract({
      address: contractAddress,
      abi: CONTRACT_ABI,
      functionName: 'withdraw',
      args: [withdrawAddress as `0x${string}`, selectedToken.address], // Use selected token
    } as any)
    
    setWithdrawAddress('')
  }

  // Clear active transaction
  const handleClearActiveTransaction = () => {
    console.log('handleClearActiveTransaction called')
    writeContract({
      address: contractAddress,
      abi: CONTRACT_ABI,
      functionName: 'clearActiveTransaction',
    } as any)
  }

  return (
    <div>
      {/* Transaction Status Indicator */}
      {hasActiveTransaction && (
        <Card className="shadow-card bg-gradient-card border-border/50 mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${isTransactionPaid ? 'bg-green-500' : isTransactionCancelled ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'}`} />
              <div>
                <span className="font-semibold">
                  {isTransactionPaid ? 'Transaction Completed' : isTransactionCancelled ? 'Transaction Cancelled' : 'Active Transaction'}
                </span>
                <span className="text-sm text-muted-foreground ml-2">
                  ID #{activeTransaction[0].toString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Merchant Settings (1/3 width) */}
        <Card className="shadow-card bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="w-5 h-5 text-primary" />
              Merchant Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="merchantName">Merchant Name *</Label>
              <Input
                id="merchantName"
                value={merchantInfo.name}
                onChange={(e) => updateMerchantInfo({ name: e.target.value })}
                placeholder="Your Business Name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="merchantLocation">Location *</Label>
              <Input
                id="merchantLocation"
                value={merchantInfo.location}
                onChange={(e) => updateMerchantInfo({ location: e.target.value })}
                placeholder="City, State or Address"
              />
            </div>
            
            <div className="text-xs text-muted-foreground">
              Merchant info is saved locally and included in all transactions
            </div>
          </CardContent>
        </Card>

  {/* Create Transaction (1/3 width) */}
  <Card className="shadow-card bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              Create Payment Request
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Label htmlFor="amount">Amount *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.001"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Amount"
                    className="font-mono"
                    readOnly={itemizedItems.length > 0}
                  />
                </div>
                <div className="min-w-[100px]">
                  <Label htmlFor="currency">Currency</Label>
                  <select
                    id="currency"
                    className="w-full h-[40px] px-3 py-2 border border-input bg-background rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors shadow-sm"
                    value={selectedToken.shortcode}
                    onChange={e => {
                      const token = supportedTokens.find(t => t.shortcode === e.target.value);
                      if (token) {
                        setSelectedToken(token);
                      }
                    }}
                  >
                    {supportedTokens.map(token => (
                      <option key={token.shortcode} value={token.shortcode}>{token.symbol}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Payment for..."
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="itemizedList">Itemized List</Label>
              <div className="grid grid-cols-[1fr_80px_100px_80px] gap-2 items-end">
                <div>
                  <Label htmlFor="itemName">Item Name</Label>
                  <Input
                    id="itemName"
                    value={newItem.name}
                    onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                    placeholder="Item name"
                  />
                </div>
                <div>
                  <Label htmlFor="itemQty">Qty</Label>
                  <Input
                    id="itemQty"
                    value={newItem.quantity}
                    onChange={e => setNewItem({ ...newItem, quantity: e.target.value })}
                    placeholder="Qty"
                    type="number"
                    min="1"
                  />
                </div>
                <div>
                  <Label htmlFor="itemValue">Amount</Label>
                  <Input
                    id="itemValue"
                    value={newItem.value}
                    onChange={e => setNewItem({ ...newItem, value: e.target.value })}
                    placeholder="Amount"
                    type="number"
                    min="0"
                    step="0.01"
                  />
                </div>
                <Button
                  type="button"
                  onClick={() => {
                    if (newItem.name.trim() && newItem.quantity && newItem.value) {
                      setItemizedItems([...itemizedItems, { ...newItem }])
                      setNewItem({ name: '', quantity: '', value: '' })
                    }
                  }}
                  size="sm"
                >Add</Button>
              </div>
              {itemizedItems.length > 0 && (
                <div className="space-y-1">
                  {itemizedItems.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-[1fr_80px_100px_80px] gap-2 items-center p-2 bg-secondary/20 rounded border">
                      <span className="font-semibold">{item.name}</span>
                      <span className="text-center">{item.quantity}</span>
                      <span className="text-center font-mono">{item.value} {selectedToken.symbol}</span>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => setItemizedItems(itemizedItems.filter((_, i) => i !== idx))}
                      >Remove</Button>
                    </div>
                  ))}
                </div>
              )}
              <div className="text-xs text-muted-foreground">Items will be saved as a JSON list of objects (name, quantity, value)</div>
            </div>
            <Button 
              onClick={handleSetTransaction}
              disabled={isPending || isConfirming || !merchantInfo.name || !merchantInfo.location || !canCreateNewTransaction}
              className="w-full"
            >
              {isPending || isConfirming ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : !canCreateNewTransaction ? (
                <>
                  <X className="w-4 h-4 mr-2" />
                  Active Transaction Exists
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Payment Request
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Transaction Management */}
  <Card className="shadow-card bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              Transaction Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Contract Balances</Label>
              <div className="flex flex-wrap gap-2">
                {balances.map(token => (
                  <div key={token.shortcode} className="font-mono text-lg text-primary border rounded px-2 py-1 bg-secondary/30">
                    {token.balance ? (Number(token.balance) / 10 ** token.decimals).toFixed(4) : '0.0000'} {token.symbol}
                  </div>
                ))}
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={handleClearActiveTransaction}
              disabled={isPending || isConfirming}
              className="w-full mb-2"
            >
              {isPending || isConfirming ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Clearing...
                </>
              ) : (
                'Clear Active Transaction'
              )}
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleCancelTransaction}
              disabled={isPending || isConfirming || !canCancelTransaction}
              className="w-full"
            >
              {isPending || isConfirming ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : !canCancelTransaction ? (
                <>
                  <X className="w-4 h-4 mr-2" />
                  {!hasActiveTransaction ? 'No Active Transaction' : isTransactionPaid ? 'Transaction Already Paid' : 'Transaction Already Cancelled'}
                </>
              ) : (
                <>
                  <X className="w-4 h-4 mr-2" />
                  Cancel Active Transaction
                </>
              )}
            </Button>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="withdraw">Withdraw to Address</Label>
              <Input
                id="withdraw"
                value={withdrawAddress}
                onChange={(e) => setWithdrawAddress(e.target.value)}
                placeholder="0x..."
                className="font-mono"
              />
            </div>
            <Button 
              variant="secondary" 
              onClick={handleWithdraw}
              disabled={isPending || isConfirming}
              className="w-full"
            >
              {isPending || isConfirming ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Withdrawing...
                </>
              ) : (
                <>
                  <Wallet className="w-4 h-4 mr-2" />
                  Withdraw All Funds
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Transaction Status */}
      <Card className="shadow-card bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle>Admin Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Connected as Contract Owner
          </div>
        </CardContent>
      </Card>
    </motion.div>
    </div>
  )
}