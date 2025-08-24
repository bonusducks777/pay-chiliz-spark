import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useStellarWallet } from '@/hooks/use-stellar-wallet';
import { StellarContractClient, StellarTransaction } from '@/lib/stellar-contract';
import { useNetwork } from '@/lib/network-context';
import { Loader2, Settings, Plus, X, Trash2, CheckCircle, Wallet, Store, MapPin } from 'lucide-react';
import { toast } from 'sonner';

export const StellarAdminPanel = () => {
  const { isConnected, address } = useStellarWallet();
  const { networkConfig } = useNetwork();
  const [activeTransaction, setActiveTransaction] = useState<StellarTransaction | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [withdrawAddress, setWithdrawAddress] = useState('');

  // Form state for creating new transactions
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    requestedTokenContract: '', // Empty string for native XLM
  });

  // Merchant info state (like Tron version)
  const [merchantInfo, setMerchantInfo] = useState({
    name: '',
    location: ''
  });

  // Itemized items state (like Tron version)
  const [itemizedItems, setItemizedItems] = useState<{ name: string; quantity: string; value: string }[]>([]);
  const [newItem, setNewItem] = useState({ name: '', quantity: '1', value: '' });

  // Memoize the client to prevent unnecessary re-renders
  const client = useMemo(() => {
    if (networkConfig.contractAddress && networkConfig.rpcUrl) {
      return new StellarContractClient(networkConfig.contractAddress, networkConfig.rpcUrl);
    }
    return null;
  }, [networkConfig.contractAddress, networkConfig.rpcUrl]);

  // Auto-calculate amount from itemizedItems
  useEffect(() => {
    if (itemizedItems.length > 0) {
      const total = itemizedItems.reduce((sum, item) => {
        const qty = parseFloat(item.quantity) || 0;
        const val = parseFloat(item.value) || 0;
        return sum + qty * val;
      }, 0);
      setFormData(prev => ({ ...prev, amount: total ? total.toFixed(7) : '' }));
    } else {
      setFormData(prev => ({ ...prev, amount: '' }));
    }
  }, [itemizedItems]);

  const checkOwnership = async () => {
    if (!isConnected || !address || !client) return;

    try {
      const owner = await client.getOwner();
      const isOwnerAccount = owner?.toLowerCase() === address.toLowerCase();
      setIsOwner(isOwnerAccount);
    } catch (error) {
      console.error('Error checking ownership:', error);
      setIsOwner(false);
    }
  };

  const fetchActiveTransaction = async () => {
    if (!client) return;

    try {
      setIsLoading(true);
      setError(null);
      const transaction = await client.getActiveTransaction();
      
      // Only set active transaction if it's a valid non-zero transaction
      if (transaction && transaction.id !== '0' && parseInt(transaction.id) > 0) {
        setActiveTransaction(transaction);
      } else {
        setActiveTransaction(null);
      }
    } catch (error) {
      console.error('Error fetching active transaction:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch active transaction');
      setActiveTransaction(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTransaction = async () => {
    console.log('handleCreateTransaction called');
    if (!client || !isConnected || !isOwner || !formData.amount) return;

    if (isLoading) {
      console.log('Already loading, preventing duplicate call');
      return;
    }

    if (!formData.amount || !formData.description || !merchantInfo.name || !merchantInfo.location) {
      setError('Please fill in all required fields (amount, description, merchant name, and location)');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      let itemizedListJson = '[]';
      try {
        itemizedListJson = JSON.stringify(itemizedItems);
      } catch (e) {
        setError('Failed to serialize itemized list');
        return;
      }
      
      await client.setActiveTransaction(
        formData.amount, // Pass amount as string, client will convert to stroops
        formData.description,
        merchantInfo.name,
        merchantInfo.location,
        itemizedListJson,
        formData.requestedTokenContract
      );
      
      // Reset form
      setFormData({
        amount: '',
        description: '',
        requestedTokenContract: '', // Empty string for native XLM
      });
      setItemizedItems([]);
      
      // Refresh transaction data
      setTimeout(fetchActiveTransaction, 2000);
    } catch (error) {
      console.error('Error creating transaction:', error);
      setError(error instanceof Error ? error.message : 'Failed to create transaction');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelTransaction = async () => {
    if (!client || !isConnected || !isOwner || isLoading) return;

    try {
      setIsLoading(true);
      setError(null);
      await client.cancelActiveTransaction();
      toast.success('Transaction cancelled successfully!');
      setTimeout(fetchActiveTransaction, 5000); // Longer delay
    } catch (error) {
      console.error('Error cancelling transaction:', error);
      setError(error instanceof Error ? error.message : 'Failed to cancel transaction');
      toast.error('Failed to cancel transaction');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearTransaction = async () => {
    if (!client || !isConnected || !isOwner) return;

    try {
      setIsLoading(true);
      setError(null);
      await client.clearActiveTransaction();
      setTimeout(fetchActiveTransaction, 2000);
    } catch (error) {
      console.error('Error clearing transaction:', error);
      setError(error instanceof Error ? error.message : 'Failed to clear transaction');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!client || !isConnected || !isOwner || !withdrawAddress) {
      setError('Please enter a valid withdrawal address');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      // Use empty string for native XLM withdrawal
      await client.withdraw(withdrawAddress, '');
      setWithdrawAddress('');
    } catch (error) {
      console.error('Error withdrawing:', error);
      setError(error instanceof Error ? error.message : 'Failed to withdraw');
    } finally {
      setIsLoading(false);
    }
  };

  const addItemizedItem = () => {
    if (newItem.name && newItem.quantity && newItem.value) {
      setItemizedItems([...itemizedItems, { ...newItem }]);
      setNewItem({ name: '', quantity: '1', value: '' });
    }
  };

  const removeItemizedItem = (index: number) => {
    setItemizedItems(itemizedItems.filter((_, i) => i !== index));
  };

  // Helper: check if there's a valid active transaction
  const hasActiveTransaction = activeTransaction && activeTransaction.id !== '0' && parseInt(activeTransaction.id) > 0;
  const isTransactionPaid = hasActiveTransaction && activeTransaction.paid;
  const isTransactionCancelled = hasActiveTransaction && activeTransaction.cancelled;
  const canCreateNewTransaction = !hasActiveTransaction || isTransactionPaid || isTransactionCancelled;
  const canCancelTransaction = hasActiveTransaction && !isTransactionPaid && !isTransactionCancelled;

  useEffect(() => {
    if (isConnected && client) {
      checkOwnership();
      fetchActiveTransaction();
      
      // Set up polling for active transaction updates, but less frequently
      const interval = setInterval(fetchActiveTransaction, 15000); // Every 15 seconds
      return () => clearInterval(interval);
    }
  }, [isConnected, address]); // Removed 'client' from dependencies

  if (!isConnected) {
    return (
      <Card className="shadow-card bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            Stellar Admin Panel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              Connect your Freighter wallet to access admin functions
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isOwner) {
    return (
      <Card className="shadow-card bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            Stellar Admin Panel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Access denied. Only the contract owner can access admin functions.
            </p>
          </div>
        </CardContent>
      </Card>
    );
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
                  ID #{activeTransaction?.id}
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
                  onChange={(e) => setMerchantInfo({ ...merchantInfo, name: e.target.value })}
                  placeholder="Your Business Name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="merchantLocation">Location *</Label>
                <Input
                  id="merchantLocation"
                  value={merchantInfo.location}
                  onChange={(e) => setMerchantInfo({ ...merchantInfo, location: e.target.value })}
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
                      step="0.0000001"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      placeholder="Amount"
                      className="font-mono"
                      readOnly={itemizedItems.length > 0}
                    />
                  </div>
                  <div className="min-w-[100px]">
                    <Label htmlFor="currency">Currency</Label>
                    <div className="w-full h-[40px] px-3 py-2 border border-input bg-background rounded-md font-mono text-sm flex items-center">
                      XLM
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                    <Label htmlFor="itemValue">Value (XLM)</Label>
                    <Input
                      id="itemValue"
                      value={newItem.value}
                      onChange={e => setNewItem({ ...newItem, value: e.target.value })}
                      placeholder="Value"
                      type="number"
                      step="0.0000001"
                      className="font-mono"
                    />
                  </div>
                  <Button onClick={addItemizedItem} size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {itemizedItems.length > 0 && (
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {itemizedItems.map((item, index) => (
                      <div key={index} className="flex justify-between items-center bg-muted/30 rounded px-2 py-1 text-sm">
                        <span>{item.quantity}x {item.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono">{item.value} XLM</span>
                          <Button variant="ghost" size="sm" onClick={() => removeItemizedItem(index)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <Button 
                onClick={handleCreateTransaction}
                disabled={isLoading || !canCreateNewTransaction}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : !canCreateNewTransaction ? (
                  <>
                    <X className="w-4 h-4 mr-2" />
                    Complete Current Transaction
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

          {/* Admin Controls (1/3 width) */}
          <Card className="shadow-card bg-gradient-card border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" />
                Admin Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                variant={canCancelTransaction ? "outline" : "secondary"}
                onClick={handleClearTransaction}
                disabled={isLoading || !hasActiveTransaction}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Clearing...
                  </>
                ) : !hasActiveTransaction ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    No Active Transaction
                  </>
                ) : (
                  'Clear Active Transaction'
                )}
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleCancelTransaction}
                disabled={isLoading || !canCancelTransaction}
                className="w-full"
              >
                {isLoading ? (
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
                  placeholder="G..."
                  className="font-mono"
                />
              </div>
              <Button 
                variant="secondary" 
                onClick={handleWithdraw}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
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
            {error && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
