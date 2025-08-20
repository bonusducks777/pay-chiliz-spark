import { useState } from 'react'
import { motion } from 'framer-motion'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther } from 'viem'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/wagmi'
import { useToast } from '@/hooks/use-toast'
import { Settings, Plus, X, Wallet, Loader2 } from 'lucide-react'

export const AdminPanel = () => {
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [withdrawAddress, setWithdrawAddress] = useState('')
  const { toast } = useToast()

  const { writeContract, data: hash, isPending } = useWriteContract()
  
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash,
  })

  const handleSetTransaction = async () => {
    if (!amount || !description) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      })
      return
    }

    try {
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'setActiveTransaction',
        args: [parseEther(amount), description],
      } as any)
      
      toast({
        title: "Transaction Created",
        description: `Payment request for ${amount} CHZ created`,
      })
      
      setAmount('')
      setDescription('')
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create transaction",
        variant: "destructive"
      })
    }
  }

  const handleCancelTransaction = () => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'cancelActiveTransaction',
    } as any)
    
    toast({
      title: "Transaction Cancelled",
      description: "Active transaction has been cancelled",
    })
  }

  const handleWithdraw = () => {
    if (!withdrawAddress) {
      toast({
        title: "Error",
        description: "Please enter withdrawal address",
        variant: "destructive"
      })
      return
    }

    writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'withdraw',
      args: [withdrawAddress as `0x${string}`],
    } as any)
    
    toast({
      title: "Withdrawal Initiated",
      description: `Withdrawing funds to ${withdrawAddress}`,
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
              <Label htmlFor="amount">Amount (CHZ)</Label>
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
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Payment for..."
                rows={3}
              />
            </div>
            
            <Button 
              onClick={handleSetTransaction}
              disabled={isPending || isConfirming}
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