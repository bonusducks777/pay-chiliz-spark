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
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/wagmi'
import { useToast } from '@/hooks/use-toast'
import { useMerchantInfo } from '@/hooks/use-merchant-info'
import { Settings, Plus, X, Wallet, Loader2, Store, MapPin } from 'lucide-react'

export const AdminPanel = () => {
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [itemizedList, setItemizedList] = useState('')
  const [withdrawAddress, setWithdrawAddress] = useState('')
  const { toast } = useToast()
  const { merchantInfo, updateMerchantInfo } = useMerchantInfo()

  // Get contract balance
  const { data: contractBalance, refetch: refetchContractBalance } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getContractBalance',
    query: { refetchInterval: 5000 },
  })

  const { writeContract, data: hash, isPending, error } = useWriteContract({
    mutation: {
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
    console.log('handleSetTransaction called with:', { 
      amount, 
      description, 
      merchantName: merchantInfo.name, 
      merchantLocation: merchantInfo.location, 
      itemizedList 
    })
    
    if (!amount || !description || !merchantInfo.name || !merchantInfo.location) {
      console.log('Missing required fields')
      toast({
        title: "Error",
        description: "Please fill in all required fields (amount, description, merchant name, and location)",
        variant: "destructive"
      })
      return
    }

    console.log('Setting active transaction...')
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'setActiveTransaction',
      args: [parseEther(amount), description, merchantInfo.name, merchantInfo.location, itemizedList || ''],
    } as any)
    
    setAmount('')
    setDescription('')
    setItemizedList('')
  }

  const handleCancelTransaction = () => {
    console.log('handleCancelTransaction called')
    writeContract({
      address: CONTRACT_ADDRESS,
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
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'withdraw',
      args: [withdrawAddress as `0x${string}`],
    } as any)
    
    setWithdrawAddress('')
  }

  // Clear active transaction
  const handleClearActiveTransaction = () => {
    console.log('handleClearActiveTransaction called')
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'clearActiveTransaction',
    } as any)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Merchant Settings */}
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

        {/* Create Transaction */}
        <Card className="shadow-card bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              Create Payment Request
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Contract Balance</Label>
              <div className="font-mono text-lg text-primary">
                {contractBalance ? `${Number(contractBalance) / 1e18} CHZ` : '0.000 CHZ'}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (CHZ) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.001"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.000"
                className="font-mono"
              />
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
              <Textarea
                id="itemizedList"
                value={itemizedList}
                onChange={(e) => setItemizedList(e.target.value)}
                placeholder="1x Coffee - $3.50&#10;1x Muffin - $2.25"
                rows={3}
              />
            </div>
            
            <Button 
              onClick={handleSetTransaction}
              disabled={isPending || isConfirming || !merchantInfo.name || !merchantInfo.location}
              className="w-full"
            >
              {isPending || isConfirming ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
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
              disabled={isPending || isConfirming}
              className="w-full"
            >
              {isPending || isConfirming ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Cancelling...
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
  )
}