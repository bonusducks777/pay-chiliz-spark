import { useEffect } from 'react';
import { useChainId } from 'wagmi';
import { useNetwork } from '@/lib/network-context';

/**
 * Component that syncs the wagmi chainId with the network context
 * Must be used inside WagmiProvider
 */
export const ChainSyncer = () => {
  const chainId = useChainId();
  const { setChainId } = useNetwork();

  useEffect(() => {
    setChainId(chainId);
  }, [chainId, setChainId]);

  return null; // This component doesn't render anything
};
