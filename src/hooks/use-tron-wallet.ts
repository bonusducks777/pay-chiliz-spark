import { useState, useEffect } from 'react';

export interface TronWalletState {
  isConnected: boolean;
  address: string | null;
  isLoading: boolean;
  error: string | null;
}

export const useTronWallet = () => {
  const [state, setState] = useState<TronWalletState>({
    isConnected: false,
    address: null,
    isLoading: false,
    error: null,
  });

  const checkConnection = async () => {
    try {
      if (typeof window !== 'undefined' && window.tronWeb && window.tronWeb.ready) {
        const address = window.tronWeb.defaultAddress.base58;
        if (address) {
          setState({
            isConnected: true,
            address,
            isLoading: false,
            error: null,
          });
        } else {
          setState({
            isConnected: false,
            address: null,
            isLoading: false,
            error: null,
          });
        }
      } else {
        setState({
          isConnected: false,
          address: null,
          isLoading: false,
          error: null,
        });
      }
    } catch (error) {
      setState({
        isConnected: false,
        address: null,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const connect = async (): Promise<string | null> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      if (typeof window === 'undefined' || !window.tronWeb) {
        throw new Error('TronLink wallet not found. Please install TronLink extension.');
      }

      // Request account access
      const result = await window.tronWeb.request({
        method: 'tron_requestAccounts',
      });

      if (result && result.code === 200) {
        // Wait for TronLink to be ready
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const address = window.tronWeb.defaultAddress.base58;
        if (address) {
          setState({
            isConnected: true,
            address,
            isLoading: false,
            error: null,
          });
          return address;
        } else {
          throw new Error('Failed to get Tron address');
        }
      } else {
        throw new Error('User rejected the connection request');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect to TronLink';
      setState({
        isConnected: false,
        address: null,
        isLoading: false,
        error: errorMessage,
      });
      throw new Error(errorMessage);
    }
  };

  const disconnect = () => {
    setState({
      isConnected: false,
      address: null,
      isLoading: false,
      error: null,
    });
  };

  // Check connection on mount and when TronLink becomes available
  useEffect(() => {
    checkConnection();

    // Listen for account changes
    const handleAccountsChanged = () => {
      checkConnection();
    };

    if (typeof window !== 'undefined' && window.tronWeb) {
      // TronLink doesn't have a standard event listener, so we poll
      const interval = setInterval(checkConnection, 1000);
      return () => clearInterval(interval);
    }
  }, []);

  return {
    ...state,
    connect,
    disconnect,
    checkConnection,
  };
};
