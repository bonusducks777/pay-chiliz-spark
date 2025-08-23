import { useState, useEffect, useCallback } from 'react';

export interface TronWalletState {
  isConnected: boolean;
  address: string | null;
  isLoading: boolean;
  error: string | null;
}

// Extend the Window interface to include tronWeb and tronLink
declare global {
  interface Window {
    tronWeb?: any;
    tronLink?: any;
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
        
        // Check for both tronWeb and tronLink
        if (typeof window !== 'undefined' && (window.tronWeb || window.tronLink)) {
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

      // Wait for TronWeb/TronLink to be available first
      const tronWebAvailable = await checkTronWebAvailability();
      
      if (!tronWebAvailable) {
        throw new Error('TronLink wallet not detected. Please install TronLink extension and refresh the page.');
      }

      // Use the recommended tronLink.request method first
      let result;
      
      if (window.tronLink && window.tronLink.request) {
        try {
          console.log('Using recommended tronLink.request method');
          result = await window.tronLink.request({
            method: 'tron_requestAccounts',
          });
          console.log('TronLink request result:', result);
        } catch (err) {
          console.warn('TronLink.request failed, trying fallback methods', err);
        }
      }

      // Fallback to tronWeb.request if tronLink not available
      if (!result && window.tronWeb && window.tronWeb.request) {
        try {
          console.log('Using fallback tronWeb.request method');
          result = await window.tronWeb.request({
            method: 'tron_requestAccounts',
          });
        } catch (err) {
          console.warn('TronWeb.request failed, trying legacy method', err);
        }
      }

      // Legacy method - trigger wallet popup
      if (!result && window.tronWeb) {
        try {
          console.log('Using legacy TronWeb method');
          await window.tronWeb.trx.getAccount();
          result = { code: 200 };
        } catch (err) {
          console.warn('Legacy TronLink method failed', err);
        }
      }

      // Wait a bit for TronLink to update  
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Force a connection check to update state
      await checkConnection();
      
      // Double-check connection status
      if (window.tronWeb && window.tronWeb.ready && window.tronWeb.defaultAddress?.base58) {
        const address = window.tronWeb.defaultAddress.base58;
        console.log('Successfully connected to address:', address);
        
        // Force state update
        setState({
          isConnected: true,
          address,
          isLoading: false,
          error: null,
        });
        
        // Trigger another check after a short delay to ensure persistence
        setTimeout(() => checkConnection(), 500);
        
        return address;
      } else {
        console.error('TronWeb state check failed:', {
          tronWebExists: !!window.tronWeb,
          tronWebReady: window.tronWeb?.ready,
          hasAddress: !!window.tronWeb?.defaultAddress?.base58,
          address: window.tronWeb?.defaultAddress?.base58
        });
        throw new Error('Connection established but wallet state not updated. Please try again.');
      }
    } catch (error) {
      console.error('Connection error:', error);
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
    // Initial connection check
    checkConnection();

    // Set up polling to detect state changes
    const interval = setInterval(() => {
      checkConnection();
    }, 2000); // Check every 2 seconds

    // Listen for TronLink events
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.message) {
        const { action } = event.data.message;
        if (action === 'accountsChanged' || action === 'connect' || action === 'disconnect') {
          console.log('TronLink event detected:', action);
          // Small delay to ensure TronLink has updated
          setTimeout(() => checkConnection(), 100);
        }
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      clearInterval(interval);
      window.removeEventListener('message', handleMessage);
    };
  }, [checkConnection]);

  return {
    ...state,
    connect,
    disconnect,
    checkConnection,
  };
};
