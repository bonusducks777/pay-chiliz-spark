import { isConnected, setAllowed, getUserInfo } from '@stellar/freighter-api';
import { Client as PaymentTerminalClient, Transaction } from 'payment-terminal-contract';
import { Networks } from '@stellar/stellar-sdk';

export interface StellarTransaction {
  id: string;
  amount: string;
  description: string;
  merchantName: string;
  merchantLocation: string;
  itemizedList: string;
  timestamp: number;
  paid: boolean;
  cancelled: boolean;
  payer?: string;
  requestedTokenContract: string;
}

export const STELLAR_TOKENS = [
  { symbol: 'XLM', name: 'Stellar Lumens', address: 'native' },
];

export class StellarContractClient {
  private client: PaymentTerminalClient;

  constructor(contractAddress: string, rpcUrl: string) {
    this.client = new PaymentTerminalClient({
      contractId: contractAddress,
      rpcUrl,
      networkPassphrase: Networks.TESTNET,
    });
  }

  // === HELPER METHODS ===

  private async ensureConnection(): Promise<string> {
    if (!await isConnected()) {
      await setAllowed();
    }
    
    const userInfo = await getUserInfo();
    const userAddress = userInfo.publicKey;
    if (!userAddress) {
      throw new Error('No wallet address available from Freighter');
    }
    
    return userAddress;
  }

  private convertToStellarTransaction(tx: Transaction): StellarTransaction {
    return {
      id: tx.id.toString(),
      amount: (Number(tx.amount) / 10000000).toString(), // Convert from stroops
      description: tx.description,
      merchantName: tx.merchant_name,
      merchantLocation: tx.merchant_location,
      itemizedList: tx.itemized_list,
      timestamp: Number(tx.timestamp) * 1000, // Convert to milliseconds
      paid: tx.paid,
      cancelled: tx.cancelled,
      payer: tx.payer || undefined,
      requestedTokenContract: tx.requested_token_contract
    };
  }

  // === CONTRACT READ FUNCTIONS ===
  
  async getActiveTransaction(): Promise<StellarTransaction | null> {
    try {
      console.log('Fetching active transaction from Soroban contract');
      
      const result = await this.client.get_active_transaction();
      
      if (!result.result) {
        console.log('No active transaction found');
        return null;
      }
      
      console.log('Active transaction result:', result.result);
      
      return this.convertToStellarTransaction(result.result);
    } catch (error) {
      console.error('Error fetching active transaction:', error);
      return null;
    }
  }

  async getPaymentStatus(): Promise<{ hasPendingTx: boolean; pendingTxPayer?: string; hasActiveTx: boolean; activeTxCreator?: string }> {
    try {
      console.log('Fetching payment status from Soroban contract');
      
      const result = await this.client.get_payment_status();
      
      if (!result.result) {
        return { hasPendingTx: false, hasActiveTx: false };
      }
      
      console.log('Payment status result:', result.result);
      
      const [hasPendingTx, pendingTxPayer, hasActiveTx, activeTxCreator] = result.result;
      
      return {
        hasPendingTx,
        pendingTxPayer: pendingTxPayer || undefined,
        hasActiveTx,
        activeTxCreator: activeTxCreator || undefined
      };
    } catch (error) {
      console.error('Error fetching payment status:', error);
      return { hasPendingTx: false, hasActiveTx: false };
    }
  }

  async getRecentTransactions(): Promise<StellarTransaction[]> {
    try {
      console.log('Fetching recent transactions from Soroban contract');
      
      const result = await this.client.get_all_recent_transactions();
      
      if (!result.result || !Array.isArray(result.result)) {
        console.log('No recent transactions found');
        return [];
      }
      
      console.log('Recent transactions result:', result.result);
      
      return result.result.map(tx => this.convertToStellarTransaction(tx));
    } catch (error) {
      console.error('Error fetching recent transactions:', error);
      return [];
    }
  }

  async getRecentTransactionsCount(): Promise<number> {
    try {
      console.log('Fetching recent transactions count from Soroban contract');
      
      const result = await this.client.get_recent_transactions_count();
      
      return Number(result.result) || 0;
    } catch (error) {
      console.error('Error fetching transactions count:', error);
      return 0;
    }
  }

  async getTxCounter(): Promise<number> {
    return this.getRecentTransactionsCount();
  }

  async getContractBalance(tokenContract: string): Promise<string> {
    try {
      console.log('Fetching contract balance from Soroban contract', tokenContract);
      
      // For native tokens, use the proper native asset contract address
      const tokenAddress = tokenContract === 'native' 
        ? 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQAHHAGCYUPX' // This needs to be the correct native token address
        : tokenContract;
      
      const result = await this.client.get_contract_balance({
        token_contract: tokenAddress
      });
      
      // Convert from stroops to XLM
      return (Number(result.result) / 10000000).toString();
    } catch (error) {
      console.error('Error fetching contract balance:', error);
      return '0';
    }
  }

  async getOwner(): Promise<string | null> {
    try {
      console.log('Fetching owner from Stellar contract');
      
      // Hardcoded owner address for this contract deployment
      const ownerAddress = 'GBWAX5ZDTNZYMI2L5KFFMVK6DFDVN7FZERDLPTQAEHGRKHQBIY5KVCHQ';
      console.log('Contract owner:', ownerAddress);
      return ownerAddress;
    } catch (error) {
      console.error('Error fetching owner:', error);
      return null;
    }
  }

  // === CONTRACT WRITE FUNCTIONS ===

  async setActiveTransaction(
    amount: string,
    description: string,
    merchantName: string,
    merchantLocation: string,
    itemizedList: string,
    tokenContract: string
  ): Promise<void> {
    try {
      console.log('Calling set_active_transaction on Soroban contract:', {
        amount,
        description,
        merchantName,
        merchantLocation,
        itemizedList,
        tokenContract
      });
      
      const userAddress = await this.ensureConnection();
      console.log('Using user address:', userAddress);
      
      // Convert amount to stroops (1 XLM = 10^7 stroops)
      const amountInStroops = BigInt(Math.floor(parseFloat(amount) * 10000000));
      
      // For native tokens, use the proper native asset contract address
      const tokenAddress = tokenContract === 'native' 
        ? 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQAHHAGCYUPX' // This needs to be the correct native token address
        : tokenContract;
      
      // Create the transaction using the generated bindings
      const transaction = await this.client.set_active_transaction({
        caller: userAddress,
        amount: amountInStroops,
        description,
        merchant_name: merchantName,
        merchant_location: merchantLocation,
        itemized_list: itemizedList,
        requested_token_contract: tokenAddress
      });
      
      // Sign and send the transaction with Freighter
      const result = await transaction.signAndSend();
      
      console.log('Soroban contract call successful:', result);
    } catch (error) {
      console.error('Error calling set_active_transaction:', error);
      throw new Error(`Failed to create transaction: ${error}`);
    }
  }

  async payActiveTransaction(): Promise<void> {
    try {
      console.log('Calling pay_active_transaction on Soroban contract');
      
      const userAddress = await this.ensureConnection();
      console.log('Using payer address:', userAddress);
      
      // Create the transaction using the generated bindings
      const transaction = await this.client.pay_active_transaction({
        payer: userAddress
      });
      
      // Sign and send the transaction with Freighter
      const result = await transaction.signAndSend();
      
      console.log('Payment transaction successful:', result);
    } catch (error) {
      console.error('Error paying transaction:', error);
      throw new Error(`Failed to pay transaction: ${error}`);
    }
  }

  async cancelActiveTransaction(): Promise<void> {
    try {
      console.log('Cancelling active transaction on Stellar contract');
      
      const userAddress = await this.ensureConnection();
      
      // Create the transaction using the generated bindings
      const transaction = await this.client.cancel_active_transaction({
        caller: userAddress
      });
      
      // Sign and send the transaction with Freighter
      const result = await transaction.signAndSend();
      
      console.log('Stellar transaction cancelled successfully:', result);
    } catch (error) {
      console.error('Error cancelling transaction:', error);
      throw new Error(`Failed to cancel transaction: ${error}`);
    }
  }

  async clearActiveTransaction(): Promise<void> {
    try {
      console.log('Clearing active transaction on Stellar contract');
      
      const userAddress = await this.ensureConnection();
      
      // Create the transaction using the generated bindings
      const transaction = await this.client.clear_active_transaction({
        caller: userAddress
      });
      
      // Sign and send the transaction with Freighter
      const result = await transaction.signAndSend();
      
      console.log('Stellar transaction cleared successfully:', result);
    } catch (error) {
      console.error('Error clearing transaction:', error);
      throw new Error(`Failed to clear transaction: ${error}`);
    }
  }

  async withdraw(tokenContract: string, to: string): Promise<void> {
    try {
      console.log('Withdrawing from Stellar contract:', { tokenContract, to });
      
      const userAddress = await this.ensureConnection();
      
      // For native tokens, use the proper native asset contract address
      const tokenAddress = tokenContract === 'native' 
        ? 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQAHHAGCYUPX' // This needs to be the correct native token address
        : tokenContract;
      
      // Create the transaction using the generated bindings
      const transaction = await this.client.withdraw({
        caller: userAddress,
        to,
        token_contract: tokenAddress
      });
      
      // Sign and send the transaction with Freighter
      const result = await transaction.signAndSend();
      
      console.log('Stellar withdrawal completed successfully:', result);
    } catch (error) {
      console.error('Error withdrawing:', error);
      throw new Error(`Failed to withdraw: ${error}`);
    }
  }

  // === UTILITY METHODS ===

  async getAllContractData(): Promise<{
    activeTransaction: StellarTransaction | null;
    paymentStatus: { hasPendingTx: boolean; pendingTxPayer?: string; hasActiveTx: boolean; activeTxCreator?: string };
    recentTransactions: StellarTransaction[];
    txCounter: number;
    contractBalance: string;
    owner: string | null;
  }> {
    const [
      activeTransaction,
      paymentStatus,
      recentTransactions,
      txCounter,
      contractBalance,
      owner
    ] = await Promise.all([
      this.getActiveTransaction(),
      this.getPaymentStatus(),
      this.getRecentTransactions(),
      this.getTxCounter(),
      this.getContractBalance('native'),
      this.getOwner(),
    ]);

    return {
      activeTransaction,
      paymentStatus,
      recentTransactions,
      txCounter,
      contractBalance,
      owner
    };
  }
}
