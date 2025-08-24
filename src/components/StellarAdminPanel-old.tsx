import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ItemizedTable } from '@/components/ui/itemized-table';
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

  // Merchant info state
  const [merchantInfo, setMerchantInfo] = useState({
    name: '',
    location: ''
  });

  // Itemized items state
  const [itemizedItems, setItemizedItems] = useState<{ name: string; quantity: string; value: string }[]>([]);
  const [newItem, setNewItem] = useState({ name: '', quantity: '1', value: '' });

  const client = networkConfig.contractAddress && networkConfig.rpcUrl
    ? new StellarContractClient(networkConfig.contractAddress, networkConfig.rpcUrl)
    : null;

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
      setError(error instanceof Error ? error.message : 'Failed to fetch transaction');
      setActiveTransaction(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected) {
      checkOwnership();
      fetchActiveTransaction();
      
      // Set up polling
      const interval = setInterval(fetchActiveTransaction, 10000); // Every 10 seconds
      return () => clearInterval(interval);
    }
  }, [isConnected, client]);

  const handleSetActiveTransaction = async () => {
    if (!client || !isConnected) return;

    try {
      setIsLoading(true);
      setError(null);

      // Convert amount to stroop (smallest XLM unit: 1 XLM = 10^7 stroop)
      const amountInStroop = Math.floor(parseFloat(formData.amount) * 1e7);

      await client.setActiveTransaction(
        amountInStroop.toString(),
        formData.description,
        merchantInfo.name,
        merchantInfo.location,
        JSON.stringify(itemizedItems),
        formData.requestedTokenContract
      );

      toast.success('Transaction created successfully!');
      
      // Reset form and refresh
      setFormData({ amount: '', description: '', requestedTokenContract: '' });
      setMerchantInfo({ name: '', location: '' });
      setItemizedItems([]);
      setTimeout(fetchActiveTransaction, 2000);
    } catch (error) {
      console.error('Error setting active transaction:', error);
      setError(error instanceof Error ? error.message : 'Failed to create transaction');
      toast.error('Failed to create transaction');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelTransaction = async () => {
    if (!client || !isConnected || !activeTransaction) return;

    try {
      setIsLoading(true);
      setError(null);
      await client.cancelActiveTransaction();
      toast.success('Transaction cancelled successfully!');
      setTimeout(fetchActiveTransaction, 2000);
    } catch (error) {
      console.error('Error cancelling transaction:', error);
      setError(error instanceof Error ? error.message : 'Failed to cancel transaction');
      toast.error('Failed to cancel transaction');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearTransaction = async () => {
    if (!client || !isConnected) return;

    try {
      setIsLoading(true);
      setError(null);
      await client.clearActiveTransaction();
      toast.success('Transaction cleared successfully!');
      setTimeout(fetchActiveTransaction, 2000);
    } catch (error) {
      console.error('Error clearing transaction:', error);
      setError(error instanceof Error ? error.message : 'Failed to clear transaction');
      toast.error('Failed to clear transaction');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!client || !isConnected || !withdrawAddress.trim()) return;

    try {
      setIsLoading(true);
      setError(null);
      await client.withdraw('native', withdrawAddress.trim());
      toast.success('Withdrawal initiated successfully!');
      setWithdrawAddress('');
    } catch (error) {
      console.error('Error withdrawing:', error);
      setError(error instanceof Error ? error.message : 'Failed to withdraw');
      toast.error('Failed to withdraw');
    } finally {
      setIsLoading(false);
    }
  };

  const addItemizedItem = () => {
    if (newItem.name && newItem.value) {
      setItemizedItems([...itemizedItems, { ...newItem }]);
      setNewItem({ name: '', quantity: '1', value: '' });
    }
  };

  const removeItemizedItem = (index: number) => {
    setItemizedItems(itemizedItems.filter((_, i) => i !== index));
  };

  if (!isConnected) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-8"
      >
        <Wallet className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">Connect Freighter Wallet</h3>
        <p className="text-muted-foreground mb-4">
          Connect your Freighter wallet to access admin features
        </p>
      </motion.div>
    );
  }

  if (!isOwner) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-8"
      >
        <Settings className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
        <p className="text-muted-foreground">
          Only the contract owner can access admin features
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-destructive">
              <X className="w-4 h-4" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Active Transaction */}
      <Card className="shadow-card bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-primary" />
            Current Active Transaction
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && !activeTransaction ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading...</span>
            </div>
          ) : !activeTransaction || activeTransaction.id === '0' ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground">No active transaction</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Transaction ID</Label>
                  <p className="font-mono text-sm">{activeTransaction.id}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <div className="mt-1">
                    <Badge variant={activeTransaction.paid ? 'default' : activeTransaction.cancelled ? 'destructive' : 'secondary'}>
                      {activeTransaction.paid ? 'Paid' : activeTransaction.cancelled ? 'Cancelled' : 'Pending'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Amount</Label>
                  <p className="font-mono text-sm">{(parseInt(activeTransaction.amount) / 1e7).toFixed(7)} XLM</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Description</Label>
                  <p className="text-sm truncate">{activeTransaction.description}</p>
                </div>
              </div>

              {/* Itemized List Table */}
              {activeTransaction.itemizedList && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Items</Label>
                  <ItemizedTable 
                    itemizedList={activeTransaction.itemizedList} 
                    currency="XLM"
                    size="sm"
                  />
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={handleCancelTransaction}
                  variant="destructive"
                  size="sm"
                  disabled={isLoading || activeTransaction.paid || activeTransaction.cancelled}
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Cancel'}
                </Button>
                <Button
                  onClick={handleClearTransaction}
                  variant="outline"
                  size="sm"
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Clear'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create New Transaction */}
      <Card className="shadow-card bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            Create New Transaction
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Merchant Information */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Store className="w-4 h-4 text-primary" />
              <Label className="text-sm font-medium">Merchant Information</Label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="merchantName" className="text-xs">Merchant Name</Label>
                <Input
                  id="merchantName"
                  placeholder="e.g., Coffee Shop"
                  value={merchantInfo.name}
                  onChange={(e) => setMerchantInfo({ ...merchantInfo, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="merchantLocation" className="text-xs">Location</Label>
                <Input
                  id="merchantLocation"
                  placeholder="e.g., Downtown Plaza"
                  value={merchantInfo.location}
                  onChange={(e) => setMerchantInfo({ ...merchantInfo, location: e.target.value })}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Itemized Items */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              Itemized Items
            </Label>
            
            {/* Add New Item */}
            <div className="grid grid-cols-4 gap-2">
              <Input
                placeholder="Item name"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              />
              <Input
                type="number"
                placeholder="Qty"
                value={newItem.quantity}
                onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
              />
              <Input
                type="number"
                step="0.0000001"
                placeholder="Value (XLM)"
                value={newItem.value}
                onChange={(e) => setNewItem({ ...newItem, value: e.target.value })}
              />
              <Button onClick={addItemizedItem} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Items List */}
            {itemizedItems.length > 0 && (
              <div className="space-y-2">
                <ItemizedTable 
                  itemizedList={JSON.stringify(itemizedItems)} 
                  currency="XLM"
                  size="sm"
                />
                <div className="flex flex-wrap gap-1">
                  {itemizedItems.map((item, index) => (
                    <div key={index} className="flex items-center gap-1 bg-secondary/20 px-2 py-1 rounded text-xs">
                      <span>{item.name} (x{item.quantity})</span>
                      <button
                        onClick={() => removeItemizedItem(index)}
                        className="text-destructive hover:text-destructive/80 ml-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Transaction Details */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="amount" className="text-xs">Amount (XLM)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.0000001"
                  placeholder="0.0000000"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  disabled={itemizedItems.length > 0} // Auto-calculated when items exist
                />
                {itemizedItems.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Auto-calculated from items
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="tokenContract" className="text-xs">Token Contract (optional)</Label>
                <Input
                  id="tokenContract"
                  placeholder="Leave empty for XLM"
                  value={formData.requestedTokenContract}
                  onChange={(e) => setFormData({ ...formData, requestedTokenContract: e.target.value })}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="description" className="text-xs">Description</Label>
              <Textarea
                id="description"
                placeholder="Transaction description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>

          <Button
            onClick={handleSetActiveTransaction}
            className="w-full"
            disabled={isLoading || !formData.amount || !formData.description}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Transaction'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Withdraw Funds */}
      <Card className="shadow-card bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary" />
            Withdraw Funds
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="withdrawAddress" className="text-xs">Withdrawal Address</Label>
            <Input
              id="withdrawAddress"
              placeholder="Stellar address (G...)"
              value={withdrawAddress}
              onChange={(e) => setWithdrawAddress(e.target.value)}
            />
          </div>
          
          <Button
            onClick={handleWithdraw}
            variant="outline"
            className="w-full"
            disabled={isLoading || !withdrawAddress.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Withdrawing...
              </>
            ) : (
              'Withdraw All XLM'
            )}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};
