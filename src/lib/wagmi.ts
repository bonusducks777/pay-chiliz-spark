import { http, createConfig } from 'wagmi'
import { chiliz } from 'wagmi/chains'
import { getDefaultConfig } from '@rainbow-me/rainbowkit'

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

export const config = getDefaultConfig({
  appName: 'Payment Terminal',
  projectId: '2f81a97e8c70b3b2f8b5a6b4a5b2c8e1', // Generic project ID
  chains: [chilizSpicy],
  ssr: false,
})

// Contract configuration
export const CONTRACT_ADDRESS = '0xbEDc143FAb3b17c3a19D32e1661Ee1c8FbFc00F9' as const

export const CONTRACT_ABI = [
  {"inputs":[],"name":"cancelActiveTransaction","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[],"name":"clearActiveTransaction","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"address","name":"_owner","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},
  {"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"FundsWithdrawn","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"id","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"},{"indexed":false,"internalType":"string","name":"description","type":"string"}],"name":"NewActiveTransaction","type":"event"},
  {"inputs":[],"name":"payActiveTransaction","outputs":[],"stateMutability":"payable","type":"function"},
  {"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"id","type":"uint256"},{"indexed":false,"internalType":"address","name":"payer","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"PaymentReceived","type":"event"},
  {"inputs":[{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"string","name":"description","type":"string"}],"name":"setActiveTransaction","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"id","type":"uint256"}],"name":"TransactionCancelled","type":"event"},
  {"stateMutability":"payable","type":"fallback"},
  {"inputs":[{"internalType":"address payable","name":"to","type":"address"}],"name":"withdraw","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"stateMutability":"payable","type":"receive"},
  {"inputs":[],"name":"activeTransaction","outputs":[{"internalType":"uint256","name":"id","type":"uint256"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"address","name":"payer","type":"address"},{"internalType":"bool","name":"paid","type":"bool"},{"internalType":"uint256","name":"timestamp","type":"uint256"},{"internalType":"string","name":"description","type":"string"},{"internalType":"bool","name":"cancelled","type":"bool"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"getActiveTransactionFields","outputs":[{"internalType":"uint256","name":"id","type":"uint256"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"address","name":"payer","type":"address"},{"internalType":"bool","name":"paid","type":"bool"},{"internalType":"uint256","name":"timestamp","type":"uint256"},{"internalType":"string","name":"description","type":"string"},{"internalType":"bool","name":"cancelled","type":"bool"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"getAllRecentTransactions","outputs":[{"internalType":"uint256[]","name":"ids","type":"uint256[]"},{"internalType":"uint256[]","name":"amounts","type":"uint256[]"},{"internalType":"address[]","name":"payers","type":"address[]"},{"internalType":"bool[]","name":"paids","type":"bool[]"},{"internalType":"uint256[]","name":"timestamps","type":"uint256[]"},{"internalType":"string[]","name":"descriptions","type":"string[]"},{"internalType":"bool[]","name":"cancelleds","type":"bool[]"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"getContractBalance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"getPaymentStatus","outputs":[{"internalType":"bool","name":"paid","type":"bool"},{"internalType":"address","name":"payer","type":"address"},{"internalType":"bool","name":"cancelled","type":"bool"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"index","type":"uint256"}],"name":"getRecentTransactionFields","outputs":[{"internalType":"uint256","name":"id","type":"uint256"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"address","name":"payer","type":"address"},{"internalType":"bool","name":"paid","type":"bool"},{"internalType":"uint256","name":"timestamp","type":"uint256"},{"internalType":"string","name":"description","type":"string"},{"internalType":"bool","name":"cancelled","type":"bool"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"getRecentTransactionsCount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"MAX_RECENT_TX","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"recentTransactions","outputs":[{"internalType":"uint256","name":"id","type":"uint256"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"address","name":"payer","type":"address"},{"internalType":"bool","name":"paid","type":"bool"},{"internalType":"uint256","name":"timestamp","type":"uint256"},{"internalType":"string","name":"description","type":"string"},{"internalType":"bool","name":"cancelled","type":"bool"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"txCounter","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}
] as const;