import React, { createContext, useContext, useState, ReactNode } from 'react';

export type NetworkType = 'evm' | 'stellar' | 'tron';

export interface NetworkConfig {
  type: NetworkType;
  name: string;
  icon: string;
  chainId?: number; // For EVM chains
  rpcUrl?: string;  // For non-EVM chains
  contractAddress?: string;
}

export const NETWORK_CONFIGS: Record<string, NetworkConfig> = {
  // EVM Networks
  'chiliz-spicy': {
    type: 'evm',
    name: 'Chiliz Spicy Testnet',
    icon: '🌶️',
    chainId: 88882,
  },
  'bsc': {
    type: 'evm',
    name: 'BSC',
    icon: '🟡',
    chainId: 56,
  },
  'ethereum': {
    type: 'evm',
    name: 'Ethereum',
    icon: '⟠',
    chainId: 1,
  },
  // Non-EVM Networks
  'stellar-testnet': {
    type: 'stellar',
    name: 'Stellar Testnet',
    icon: '⭐',
    rpcUrl: 'https://soroban-testnet.stellar.org:443',
    contractAddress: 'CCK6M7FA7XXYLV5ZURLH2YR7APWVXL2CVY3W7WFZZA5JFJI7CP3JFUQG',
  },
  'stellar-mainnet': {
    type: 'stellar',
    name: 'Stellar Mainnet',
    icon: '⭐',
    rpcUrl: 'https://soroban-mainnet.stellar.org:443',
    contractAddress: '', // TODO: Deploy to mainnet
  },
  'tron-nile': {
    type: 'tron',
    name: 'Tron Nile Testnet',
    icon: '🔴',
    rpcUrl: 'https://nile.trongrid.io',
    contractAddress: 'TBg8fwgRfHmSt9dhWjfRpBpfXy89YirPuX',
  },
};

interface NetworkContextType {
  currentNetwork: string;
  networkConfig: NetworkConfig;
  setCurrentNetwork: (network: string) => void;
  isEVM: boolean;
  isStellar: boolean;
  isTron: boolean;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
};

interface NetworkProviderProps {
  children: ReactNode;
}

export const NetworkProvider: React.FC<NetworkProviderProps> = ({ children }) => {
  const [currentNetwork, setCurrentNetwork] = useState('evm-group');
  
  // Handle the evm-group selection by defaulting to chiliz-spicy
  const actualNetwork = currentNetwork === 'evm-group' ? 'chiliz-spicy' : currentNetwork;
  const networkConfig = NETWORK_CONFIGS[actualNetwork] || NETWORK_CONFIGS['chiliz-spicy'];
  
  const isEVM = networkConfig.type === 'evm' || currentNetwork === 'evm-group';
  const isStellar = networkConfig.type === 'stellar';
  const isTron = networkConfig.type === 'tron';

  return (
    <NetworkContext.Provider
      value={{
        currentNetwork,
        networkConfig,
        setCurrentNetwork,
        isEVM,
        isStellar,
        isTron,
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
};
