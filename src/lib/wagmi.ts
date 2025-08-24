import { http, createConfig } from 'wagmi'
import { chiliz, bsc, mainnet } from 'wagmi/chains'
import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import PaymentTerminalERC20ABI from './PaymentTerminalERC20.abi.json'


// Custom Chiliz chain configuration
const chilizSpicy = {
  id: 88882,
  name: 'Chiliz Spicy Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'CHZ',
    symbol: 'CHZ',
  },
  rpcUrls: {
    default: {
      http: ['https://spicy-rpc.chiliz.com'],
    },
  },
  blockExplorers: {
    default: { name: 'ChilizScan', url: 'https://testnet.chiliscan.com' },
  },
  testnet: true,
} as const

// Custom Circle Layer Testnet configuration
const circleLayerTestnet = {
  id: 28525,
  name: 'Circle Layer Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'CLAYER',
    symbol: 'CLAYER',
  },
  rpcUrls: {
    default: {
      http: ['https://testnet-rpc.circlelayer.com'],
    },
  },
  blockExplorers: {
    default: { name: 'Circle Layer Explorer', url: 'https://explorer-testnet.circlelayer.com' },
  },
  testnet: true,
} as const


// Placeholder contracts for other networks
export const CONTRACTS = {
  [chilizSpicy.id]: '0x2e0f3F84CA4Da3F006C326beeb62194C1F7965A2',
  [circleLayerTestnet.id]: '0x7AeE0CbBcd0e5257931f7dC87F0345C1bB2aab39',
  [bsc.id]: '0x0000000000000000000000000000000000000000', // TODO: Replace with real BSC contract
  [mainnet.id]: '0x0000000000000000000000000000000000000000', // TODO: Replace with real ETH contract
}

// Supported tokens per chain (native + 3 ERC20s)
export const SUPPORTED_TOKENS: Record<number, Array<{
  shortcode: string;
  address: string; // address(0) for native
  name: string;
  symbol: string;
  decimals: number;
}>> = {
  [chilizSpicy.id]: [
    { shortcode: 'native', address: '0x0000000000000000000000000000000000000000', name: 'Chiliz', symbol: 'CHZ', decimals: 18 },
    { shortcode: 'usd', address: '0x1111111111111111111111111111111111111111', name: 'USD Stable', symbol: 'USD', decimals: 18 },
    { shortcode: 'fan', address: '0x2222222222222222222222222222222222222222', name: 'Fan Token', symbol: 'FAN', decimals: 18 },
    { shortcode: 'soc', address: '0x3333333333333333333333333333333333333333', name: 'Socios', symbol: 'SOC', decimals: 18 },
  ],
  [circleLayerTestnet.id]: [
    { shortcode: 'native', address: '0x0000000000000000000000000000000000000000', name: 'Circle Layer', symbol: 'CLAYER', decimals: 18 },
    { shortcode: 'usdc', address: '0x1111111111111111111111111111111111111111', name: 'USD Coin', symbol: 'USDC', decimals: 6 },
    { shortcode: 'usdt', address: '0x2222222222222222222222222222222222222222', name: 'Tether USD', symbol: 'USDT', decimals: 6 },
    { shortcode: 'dai', address: '0x3333333333333333333333333333333333333333', name: 'Dai Stablecoin', symbol: 'DAI', decimals: 18 },
  ],
  [bsc.id]: [
    { shortcode: 'native', address: '0x0000000000000000000000000000000000000000', name: 'BNB', symbol: 'BNB', decimals: 18 },
    { shortcode: 'busd', address: '0x4444444444444444444444444444444444444444', name: 'Binance USD', symbol: 'BUSD', decimals: 18 },
    { shortcode: 'cake', address: '0x5555555555555555555555555555555555555555', name: 'PancakeSwap', symbol: 'CAKE', decimals: 18 },
    { shortcode: 'usdt', address: '0x6666666666666666666666666666666666666666', name: 'Tether USD', symbol: 'USDT', decimals: 18 },
  ],
  [mainnet.id]: [
    { shortcode: 'native', address: '0x0000000000000000000000000000000000000000', name: 'Ethereum', symbol: 'ETH', decimals: 18 },
    { shortcode: 'usdc', address: '0x7777777777777777777777777777777777777777', name: 'USD Coin', symbol: 'USDC', decimals: 6 },
    { shortcode: 'dai', address: '0x8888888888888888888888888888888888888888', name: 'Dai Stablecoin', symbol: 'DAI', decimals: 18 },
    { shortcode: 'uni', address: '0x9999999999999999999999999999999999999999', name: 'Uniswap', symbol: 'UNI', decimals: 18 },
  ],
}

export function getSupportedTokens(chainId: number) {
  return SUPPORTED_TOKENS[chainId] || SUPPORTED_TOKENS[chilizSpicy.id];
}

export function getChainInfo(chainId: number) {
  if (chainId === chilizSpicy.id) {
    return { name: 'Chiliz Spicy Testnet', symbol: 'CHZ', decimals: 18 };
  } else if (chainId === circleLayerTestnet.id) {
    return { name: 'Circle Layer Testnet', symbol: 'CLAYER', decimals: 18 };
  } else if (chainId === bsc.id) {
    return { name: 'BSC', symbol: 'BNB', decimals: 18 };
  } else if (chainId === mainnet.id) {
    return { name: 'Ethereum', symbol: 'ETH', decimals: 18 };
  } else {
    // Default to Chiliz
    return { name: 'Chiliz Spicy Testnet', symbol: 'CHZ', decimals: 18 };
  }
}

export const config = getDefaultConfig({
  appName: 'Payment Terminal',
  projectId: '2f81a97e8c70b3b2f8b5a6b4a5b2c8e1',
  chains: [chilizSpicy, circleLayerTestnet, bsc, mainnet],
  ssr: false,
})

// Contract configuration
// Default to Chiliz contract, but use CONTRACTS[chainId] in app logic
export const CONTRACT_ADDRESS = CONTRACTS[chilizSpicy.id]

export const CONTRACT_ABI = PaymentTerminalERC20ABI;