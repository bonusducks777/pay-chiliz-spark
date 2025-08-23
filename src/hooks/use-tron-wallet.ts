import { useState, useEffect, useCallback } from 'react';

export interface TronWalletState {
  isConnected: boolean;
  address: string | null;
  isLoading: boolean;
  error: string | null;
}

// Extend the Window interface to include tronWeb
declare global {
  interface Window {
    tronWeb?: any;
  }
}

export const useTronWallet = () => {
  const [state, setState] = useState<TronWalletState>({
    isConnected: false,
    address: null,
    isLoading: true, // Start with loading true
    error: null,
  });

  const checkTronWebAvailability = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      let attempts = 0;
      const maxAttempts = 30; // 3 seconds
      
      const checkInterval = setInterval(() => {
        attempts++;
        
        if (typeof window !== 'undefined' && window.tronWeb) {
          clearInterval(checkInterval);
          resolve(true);
        } else if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          resolve(false);
        }
      }, 100);
    });
  }, []);

  const checkConnection = useCallback(async () => {
    try {
      if (typeof window === 'undefined') {
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      // Wait for TronWeb to be available
      const tronWebAvailable = await checkTronWebAvailability();
      
      if (!tronWebAvailable) {
        setState({
          isConnected: false,
          address: null,
          isLoading: false,
          error: null,
        });
        return;
      }

      // Check if TronWeb is ready and has an address
      if (window.tronWeb && window.tronWeb.ready && window.tronWeb.defaultAddress?.base58) {
        const address = window.tronWeb.defaultAddress.base58;
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
    } catch (error) {
      console.error('Error checking Tron connection:', error);
      setState({
        isConnected: false,
        address: null,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }, [checkTronWebAvailability]);

  const connect = async (): Promise<string | null> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Wait for TronWeb to be available first
      const tronWebAvailable = await checkTronWebAvailability();
      
      if (!tronWebAvailable) {
        throw new Error('TronLink wallet not detected. Please install TronLink extension and refresh the page.');
      }

      // Check if already connected
      if (window.tronWeb && window.tronWeb.ready && window.tronWeb.defaultAddress?.base58) {
        const address = window.tronWeb.defaultAddress.base58;
        setState({
          isConnected: true,
          address,
          isLoading: false,
          error: null,
        });
        return address;
      }

      // Try different connection methods
      let result;
      
      // Method 1: Modern TronLink API
      if (window.tronWeb && window.tronWeb.request) {
        try {
          result = await window.tronWeb.request({
            method: 'tron_requestAccounts',
          });
        } catch (err) {
          console.warn('Modern TronLink API failed, trying legacy method');
        }
      }

      // Method 2: Legacy method - trigger wallet popup
      if (!result && window.tronWeb) {
        try {
          // This triggers the TronLink popup
          await window.tronWeb.trx.getAccount();
          result = { code: 200 };
        } catch (err) {
          console.warn('Legacy TronLink method failed');
        }
      }

      // Wait a bit for TronLink to update
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Check connection again
      if (window.tronWeb && window.tronWeb.ready && window.tronWeb.defaultAddress?.base58) {
        const address = window.tronWeb.defaultAddress.base58;
        setState({
          isConnected: true,
          address,
          isLoading: false,
          error: null,
        });
        return address;
      } else {
        throw new Error('Please unlock your TronLink wallet and try again.');
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
