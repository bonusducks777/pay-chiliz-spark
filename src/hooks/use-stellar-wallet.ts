import { useState, useEffect } from 'react';
import { stellarWallet } from '../lib/stellar-wallet';

export const useStellarWallet = () => {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = stellarWallet.subscribe(() => {
      setAddress(stellarWallet.getAddress());
      setIsConnected(stellarWallet.isConnected());
    });

    // Initial state
    setAddress(stellarWallet.getAddress());
    setIsConnected(stellarWallet.isConnected());

    return unsubscribe;
  }, []);

  const connect = async () => {
    setIsLoading(true);
    try {
      await stellarWallet.connect();
    } catch (error) {
      console.error('Failed to connect Stellar wallet:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = () => {
    stellarWallet.disconnect();
  };

  return {
    address,
    isConnected,
    isLoading,
    connect,
    disconnect,
  };
};
