import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ItemizedTable } from '@/components/ui/itemized-table';
import { useTronWallet } from '@/hooks/use-tron-wallet';
import { TronContractClient, TronTransaction } from '@/lib/tron-contract';
import { useNetwork } from '@/lib/network-context';
import { TronConnectButton } from './TronConnectButton';
import { Loader2, CreditCard, Clock, CheckCircle, XCircle, Wallet } from 'lucide-react';

export const TronUserPanel = () => {
  const { isConnected, address } = useTronWallet();
  const { networkConfig } = useNetwork();
  const [activeTransaction, setActiveTransaction] = useState<TronTransaction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userBalance, setUserBalance] = useState<string>('0');
  const [isFetching, setIsFetching] = useState(false); // Separate state for data fetching

  const client = new TronContractClient(
    networkConfig.contractAddress || '',
    networkConfig.rpcUrl || ''
  );

  const fetchUserBalance = async () => {
    if (!isConnected || !address) return;
    
    try {
      if (window.tronWeb && window.tronWeb.ready) {
        const balance = await window.tronWeb.trx.getBalance(address);
        const balanceInTrx = window.tronWeb.fromSun(balance);
        setUserBalance(balanceInTrx);
      }
    } catch (error) {
      console.error('Error fetching user balance:', error);
    }
  };

  const fetchActiveTransaction = async () => {
    if (isFetching) {
      console.log('🚫 Tron fetchActiveTransaction skipped: already fetching');
      return;
    }

    try {
      console.log('🔄 Tron fetchActiveTransaction starting (no loading state change)');
      setIsFetching(true);
      setError(null);
      const transaction = await client.getActiveTransaction();
      
      // Only set active transaction if it's a valid non-zero transaction
      if (transaction && transaction.id !== '0' && parseInt(transaction.id) > 0) {
        console.log('✅ Tron found valid active transaction:', transaction.id);
        setActiveTransaction(transaction);
      } else {
        console.log('❌ Tron no valid active transaction found');
        setActiveTransaction(null);
      }
    } catch (error) {
      console.error('💥 Tron error fetching active transaction:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch transaction');
      setActiveTransaction(null);
    } finally {
      console.log('✅ Tron fetchActiveTransaction complete');
      setIsFetching(false);
    }
  };

  const handlePayment = async () => {
    console.log('🚀 Tron handlePayment called:', {
      isConnected,
      hasActiveTransaction: !!activeTransaction,
      currentIsLoading: isLoading
    });
    
    if (!isConnected || !activeTransaction) {
      console.log('❌ Tron payment blocked - missing requirements');
      return;
    }

    try {
      console.log('⏳ Tron setting isLoading to true');
      setIsLoading(true);
      setError(null);
      
      console.log('💳 Tron calling payActiveTransaction...');
      await client.payActiveTransaction();
      console.log('✅ Tron payment submitted successfully');
      
      // Refresh transaction status
      console.log('🔄 Tron refreshing transaction status in 2 seconds...');
      setTimeout(fetchActiveTransaction, 2000);
    } catch (error) {
      console.error('💥 Tron payment error:', error);
      setError(error instanceof Error ? error.message : 'Payment failed');
    } finally {
      console.log('✅ Tron setting isLoading to false');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log('🏗️ TronUserPanel mounted');
    return () => {
      console.log('🏗️ TronUserPanel unmounted');
    }
  }, []);

  // Auto-reset loading state if stuck
  useEffect(() => {
    if (isLoading) {
      console.log('⏰ Tron isLoading is true, setting timeout to auto-reset in 30 seconds');
      const timeout = setTimeout(() => {
        console.log('⏰ Tron auto-resetting stuck loading state');
        setIsLoading(false);
      }, 30000); // Reset after 30 seconds if stuck
      
      return () => clearTimeout(timeout);
    }
  }, [isLoading]);

  const getPaymentButtonContent = () => {
    console.log('🔍 Tron getPaymentButtonContent called:', {
      isLoading,
      isFetching,
      activeTransaction: activeTransaction ? {
        id: activeTransaction.id,
        paid: activeTransaction.paid,
        cancelled: activeTransaction.cancelled
      } : null
    });
    
    if (isLoading) {
      console.log('🟡 Tron button state: Processing payment (isLoading=true)');
      return (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Processing...
        </>
      );
    }
    
    if (activeTransaction?.paid) {
      console.log('🟢 Tron button state: Paid');
      return (
        <>
          <CheckCircle className="w-4 h-4 mr-2" />
          Paid
        </>
      );
    }
    
    if (activeTransaction?.cancelled) {
      console.log('🔴 Tron button state: Cancelled');
      return (
        <>
          <XCircle className="w-4 h-4 mr-2" />
          Cancelled
        </>
      );
    }
    
    console.log('🔵 Tron button state: Pay Transaction (normal)');
    return (
      <>
        <CreditCard className="w-4 h-4 mr-2" />
        Pay {activeTransaction?.amount} TRX
      </>
    );
  };

  useEffect(() => {
    if (isConnected) {
      fetchActiveTransaction();
      fetchUserBalance();
      
      // Refresh every 1 second for real-time updates
      const interval = setInterval(() => {
        fetchActiveTransaction();
        fetchUserBalance();
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isConnected]);

  if (!isConnected) {
    return (
      <div className="space-y-6">
        {/* User Balance */}
        <Card className="shadow-card bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-primary" />
              Your Wallet
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                Connect your TronLink wallet to view balance and make payments
              </p>
              <TronConnectButton />
            </div>
          </CardContent>
        </Card>
        
        {/* Payment Request */}
        <Card className="shadow-card bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              Payment Request
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                Connect wallet to view payment requests
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Balance */}
      <Card className="shadow-card bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary" />
            Your Wallet
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Connected Address</span>
            <span className="font-mono text-sm">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">TRX Balance</span>
            <span className="font-mono text-lg text-primary">{userBalance} TRX</span>
          </div>
          <div className="text-center">
            <TronConnectButton />
          </div>
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
          {activeTransaction ? (
            <>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Transaction ID</span>
                  <span className="font-mono">#{activeTransaction.id}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Amount</span>
                  <span className="font-mono text-lg text-primary">
                    {activeTransaction.amount} TRX
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Description</span>
                  <span className="text-right max-w-48 truncate">{activeTransaction.description}</span>
                </div>
                
                {activeTransaction.merchantName && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Merchant</span>
                    <span className="text-right max-w-48 truncate">{activeTransaction.merchantName}</span>
                  </div>
                )}
                
                {activeTransaction.merchantLocation && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Location</span>
                    <span className="text-right max-w-48 truncate">{activeTransaction.merchantLocation}</span>
                  </div>
                )}
                
                {activeTransaction.itemizedList && (
                  <ItemizedTable 
                    itemizedList={activeTransaction.itemizedList}
                    size="sm"
                    currency="TRX"
                  />
                )}
              </div>

              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  activeTransaction.paid ? 'bg-green-500' : 
                  activeTransaction.cancelled ? 'bg-red-500' : 
                  'bg-yellow-500 animate-pulse'
                }`} />
                <Badge variant={
                  activeTransaction.paid ? 'default' : 
                  activeTransaction.cancelled ? 'destructive' : 
                  'secondary'
                }>
                  {activeTransaction.paid ? 'Paid' : 
                   activeTransaction.cancelled ? 'Cancelled' : 
                   'Pending Payment'}
                </Badge>
              </div>

              {!activeTransaction.paid && !activeTransaction.cancelled && (
                <>
                  <Button 
                    onClick={handlePayment} 
                    disabled={isLoading}
                    className="w-full"
                    size="lg"
                  >
                    {getPaymentButtonContent()}
                  </Button>
                  
                  {/* Debug Reset Button - TEMPORARY */}
                  <Button
                    onClick={() => {
                      console.log('🔧 Tron manual reset triggered');
                      setIsLoading(false);
                      setIsFetching(false);
                      setError(null);
                    }}
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                  >
                    🔧 Reset Tron States (Debug)
                  </Button>
                </>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {isLoading ? 'Loading payment request...' : 'No active payment request'}
              </p>
              {!isLoading && (
                <Button 
                  variant="outline" 
                  onClick={fetchActiveTransaction}
                  className="mt-4"
                >
                  Refresh
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <XCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
