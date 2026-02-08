import { http, createConfig } from 'wagmi'
import { chiliz, bsc, mainnet, avalancheFuji } from 'wagmi/chains'
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

// Custom Plasma Testnet configuration
const plasmaTestnet = {
  id: 9746,
  name: 'Plasma Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'XPL',
    symbol: 'XPL',
  },
  rpcUrls: {
    default: {
      http: ['https://testnet-rpc.plasma.to'],
    },
  },
  blockExplorers: {
    default: { name: 'Plasma Explorer', url: 'https://testnet.plasma.to' },
  },
  testnet: true,
} as const


// Placeholder contracts for other networks
export const CONTRACTS = {
  [chilizSpicy.id]: '0x2e0f3F84CA4Da3F006C326beeb62194C1F7965A2',
  [circleLayerTestnet.id]: '0x7AeE0CbBcd0e5257931f7dC87F0345C1bB2aab39',
  [bsc.id]: '0x0000000000000000000000000000000000000000', // TODO: Replace with real BSC contract
  [mainnet.id]: '0x0000000000000000000000000000000000000000', // TODO: Replace with real ETH contract
  [avalancheFuji.id]: '0xFb3D22A7faAeF73CCec677658771083D55e38dC0', // Avalanche C-Chain Fuji Testnet
  [plasmaTestnet.id]: '0x640eC5CC37B33E9EE2Ab9C41004462ee8604AE4C', // Plasma Testnet
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
  [avalancheFuji.id]: [
    { shortcode: 'native', address: '0x0000000000000000000000000000000000000000', name: 'Avalanche', symbol: 'AVAX', decimals: 18 },
    { shortcode: 'usdc', address: '0x5425890298aed601595a70AB815c96711a31Bc65', name: 'USD Coin', symbol: 'USDC.e', decimals: 6 },
    { shortcode: 'usdt', address: '0x1f1Be82E0317b18B38f80a37160C0F6F78FaF95e', name: 'Tether USD', symbol: 'USDT.e', decimals: 6 },
    { shortcode: 'wavax', address: '0xd00ae08403B9bbb9124bB305C09058E32C39A48c', name: 'Wrapped AVAX', symbol: 'WAVAX', decimals: 18 },
  ],
  [plasmaTestnet.id]: [
    { shortcode: 'native', address: '0x0000000000000000000000000000000000000000', name: 'Plasma', symbol: 'XPL', decimals: 18 },
    { shortcode: 'usdt0', address: '0x502012b361AebCE43b26Ec812B74D9a51dB4D412', name: 'USDT0', symbol: 'USDT0', decimals: 6 },
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
  } else if (chainId === avalancheFuji.id) {
    return { name: 'Avalanche Fuji Testnet', symbol: 'AVAX', decimals: 18 };
  } else if (chainId === plasmaTestnet.id) {
    return { name: 'Plasma Testnet', symbol: 'XPL', decimals: 18 };
  } else {
    // Default to Chiliz
    return { name: 'Chiliz Spicy Testnet', symbol: 'CHZ', decimals: 18 };
  }
}

export const config = getDefaultConfig({
  appName: 'Payment Terminal',
  projectId: '2f81a97e8c70b3b2f8b5a6b4a5b2c8e1',
  chains: [chilizSpicy, circleLayerTestnet, bsc, mainnet, avalancheFuji, plasmaTestnet],
  ssr: false,
})

// Contract configuration
// Default to Chiliz contract, but use CONTRACTS[chainId] in app logic
export const CONTRACT_ADDRESS = CONTRACTS[chilizSpicy.id]

export const CONTRACT_ABI = PaymentTerminalERC20ABI;