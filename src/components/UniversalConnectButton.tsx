import { Button } from '@/components/ui/button';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useNetwork } from '@/lib/network-context';
import { useStellarWallet } from '@/hooks/use-stellar-wallet';
import { useTronWallet } from '@/hooks/use-tron-wallet';
import { Wallet, LogOut, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

export const UniversalConnectButton = () => {
  const { isEVM, isStellar, isTron, networkConfig } = useNetwork();
  const stellarWallet = useStellarWallet();
  const tronWallet = useTronWallet();

  if (isEVM) {
    return <ConnectButton />;
  }

  if (isStellar) {
    const handleConnect = async () => {
      try {
        // Debug: Log what's available in window
        console.log('Window object check:', {
          hasFreighter: !!(window as any).freighter,
          hasFreighterApi: !!(window as any).freighterApi,
          windowKeys: Object.keys(window).filter(k => 
            k.toLowerCase().includes('freighter') || 
            k.toLowerCase().includes('stellar') ||
            k.toLowerCase().includes('wallet')
          )
        });

        await stellarWallet.connect();
        toast.success('Freighter wallet connected successfully!');
      } catch (error: any) {
        console.error('Connection error:', error);
        
        if (error.message.includes('not detected') || error.message.includes('not found')) {
          toast.error('Freighter wallet not found', {
            description: 'Please install and enable the Freighter browser extension',
            action: {
              label: 'Install Freighter',
              onClick: () => window.open('https://freighter.app/', '_blank')
            }
          });
        } else if (error.message.includes('User declined access')) {
          toast.error('Access denied', {
            description: 'You need to approve the connection request in Freighter'
          });
        } else {
          toast.error('Connection failed', {
            description: error.message || 'Unknown error occurred'
          });
        }
      }
    };

    return (
      <div className="flex items-center gap-2">
        {stellarWallet.isConnected ? (
          <div className="flex items-center gap-2 px-3 py-2 bg-background/50 border border-border/50 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm font-mono">
              {stellarWallet.address?.slice(0, 6)}...{stellarWallet.address?.slice(-4)}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={stellarWallet.disconnect}
              className="h-6 w-6 p-0"
              title="Disconnect"
            >
              <LogOut className="w-3 h-3" />
            </Button>
          </div>
        ) : (
          <Button
            onClick={handleConnect}
            disabled={stellarWallet.isLoading}
            className="flex items-center gap-2"
          >
            <Wallet className="w-4 h-4" />
            {stellarWallet.isLoading ? 'Connecting...' : 'Connect Freighter'}
          </Button>
        )}
      </div>
    );
  }

  if (isTron) {
    const handleTronConnect = async () => {
      try {
        await tronWallet.connect();
        toast.success('TronLink wallet connected successfully!');
      } catch (error: any) {
        console.error('Tron connection error:', error);
        
        if (error.message.includes('not detected') || error.message.includes('not found')) {
          toast.error('TronLink wallet not found', {
            description: 'Please install and enable the TronLink browser extension',
            action: {
              label: 'Install TronLink',
              onClick: () => window.open('https://www.tronlink.org/', '_blank')
            }
          });
        } else if (error.message.includes('User declined access')) {
          toast.error('Access denied', {
            description: 'You need to approve the connection request in TronLink'
          });
        } else {
          toast.error('Connection failed', {
            description: error.message || 'Unknown error occurred'
          });
        }
      }
    };

    return (
      <div className="flex items-center gap-2">
        {tronWallet.isConnected ? (
          <div className="flex items-center gap-2 px-3 py-2 bg-background/50 border border-border/50 rounded-lg">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm font-mono">
              {tronWallet.address?.slice(0, 6)}...{tronWallet.address?.slice(-4)}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={tronWallet.disconnect}
              className="h-6 w-6 p-0"
              title="Disconnect"
            >
              <LogOut className="w-3 h-3" />
            </Button>
          </div>
        ) : (
          <Button
            onClick={handleTronConnect}
            disabled={tronWallet.isLoading}
            className="flex items-center gap-2"
          >
            <Wallet className="w-4 h-4" />
            {tronWallet.isLoading ? 'Connecting...' : 'Connect TronLink'}
          </Button>
        )}
      </div>
    );
  }

  return (
    <Button disabled className="flex items-center gap-2">
      <Wallet className="w-4 h-4" />
      {networkConfig.name} - Coming Soon
    </Button>
  );
};
