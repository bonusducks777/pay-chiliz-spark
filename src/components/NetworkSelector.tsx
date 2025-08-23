import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNetwork, NETWORK_CONFIGS } from '@/lib/network-context';
import { Globe } from 'lucide-react';

export const NetworkSelector = () => {
  const { currentNetwork, setCurrentNetwork } = useNetwork();

  // Group networks by type
  const evmNetworks = Object.entries(NETWORK_CONFIGS).filter(([_, config]) => config.type === 'evm');
  const stellarNetworks = Object.entries(NETWORK_CONFIGS).filter(([_, config]) => config.type === 'stellar');
  const tronNetworks = Object.entries(NETWORK_CONFIGS).filter(([_, config]) => config.type === 'tron');

  return (
    <div className="flex items-center gap-2">
      <Globe className="w-4 h-4 text-muted-foreground" />
      <Select value={currentNetwork} onValueChange={setCurrentNetwork}>
        <SelectTrigger className="w-[180px] bg-background/50 border-border/50">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {/* EVM Networks - grouped as one option since RainbowKit handles switching */}
          <SelectItem value="evm-group">
            <div className="flex items-center gap-2">
              <span>⟠</span>
              <span>EVM Networks (RainbowKit)</span>
            </div>
          </SelectItem>
          
          {/* Stellar Networks */}
          {stellarNetworks.map(([key, config]) => (
            <SelectItem key={key} value={key}>
              <div className="flex items-center gap-2">
                <span>{config.icon}</span>
                <span>{config.name}</span>
              </div>
            </SelectItem>
          ))}
          
          {/* Tron Networks */}
          {tronNetworks.map(([key, config]) => (
            <SelectItem key={key} value={key}>
              <div className="flex items-center gap-2">
                <span>{config.icon}</span>
                <span>{config.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
