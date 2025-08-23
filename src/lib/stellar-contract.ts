import { isConnected, setAllowed, getUserInfo, signTransaction } from '@stellar/freighter-api';
import { Client as PaymentTerminalClient, Transaction } from 'payment-terminal-contract';
import { Networks, Asset, scValToNative } from '@stellar/stellar-sdk';

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
    // Initialize with basic options, we'll set up signing per transaction
    this.client = new PaymentTerminalClient({
      contractId: contractAddress,
      rpcUrl,
      networkPassphrase: Networks.TESTNET,
      publicKey: 'GBWAX5ZDTNZYMI2L5KFFMVK6DFDVN7FZERDLPTQAEHGRKHQBIY5KVCHQ', // The owner's public key
      signTransaction: async (tx: string) => {
        console.log('Client signTransaction called for tx:', tx);
        const signedXdr = await signTransaction(tx, {
          networkPassphrase: Networks.TESTNET
        });
        return { signedTxXdr: signedXdr };
      }
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

  private convertToStellarTransaction(tx: Transaction | any): StellarTransaction {
    console.log('Converting transaction:', tx);
    
    // Handle both structured Transaction type and raw map data
    if (tx._attributes || tx._value) {
      // This is raw contract data, need to parse it
      console.log('Converting raw contract data...');
      return this.parseRawTransactionData(tx);
    }
    
    // This is structured Transaction type from the bindings
    // Make sure field names match the contract specification
    return {
      id: tx.id ? tx.id.toString() : '0',
      amount: tx.amount ? (Number(tx.amount) / 10000000).toString() : '0', // Convert from stroops
      description: tx.description || '',
      merchantName: tx.merchant_name || '',
      merchantLocation: tx.merchant_location || '',
      itemizedList: tx.itemized_list || '',
      timestamp: tx.timestamp ? Number(tx.timestamp) * 1000 : 0, // Convert to milliseconds
      paid: tx.paid || false,
      cancelled: tx.cancelled || false,
      payer: tx.payer || undefined,
      requestedTokenContract: tx.requested_token_contract || ''
    };
  }

  private parseRawTransactionData(rawData: any): StellarTransaction {
    console.log('Parsing raw transaction data:', rawData);
    
    // The data is coming as a map with key-value pairs
    const dataMap = new Map();
    
    if (rawData._value) {
      // Extract key-value pairs from the raw data
      for (const entry of rawData._value) {
        const key = Buffer.from(entry._attributes.key._value.data).toString();
        const val = entry._attributes.val;
        
        let value;
        switch (val._switch.name) {
          case 'scvString':
            value = Buffer.from(val._value.data).toString();
            break;
          case 'scvI128':
            value = val._value._attributes.lo._value;
            break;
          case 'scvU64':
            value = val._value._value;
            break;
          case 'scvBool':
            value = val._value;
            break;
          case 'scvVoid':
            value = null;
            break;
          case 'scvAddress':
            // Convert address to string representation
            if (val._value && val._value._value && val._value._value.data) {
              // This is a contract address - convert buffer to hex string
              const addressBuffer = Buffer.from(val._value._value.data);
              value = 'C' + addressBuffer.toString('hex').toUpperCase();
            } else {
              value = val._value;
            }
            break;
          default:
            value = val._value;
        }
        
        dataMap.set(key, value);
      }
    }
    
    console.log('Parsed data map:', Array.from(dataMap.entries()));
    
    return {
      id: dataMap.get('id') || '0',
      amount: dataMap.get('amount') ? (Number(dataMap.get('amount')) / 10000000).toString() : '0',
      description: dataMap.get('description') || '',
      merchantName: dataMap.get('merchant_name') || '',
      merchantLocation: dataMap.get('merchant_location') || '',
      itemizedList: dataMap.get('itemized_list') || '',
      timestamp: dataMap.get('timestamp') ? Number(dataMap.get('timestamp')) * 1000 : 0,
      paid: dataMap.get('paid') || false,
      cancelled: dataMap.get('cancelled') || false,
      payer: dataMap.get('payer') || undefined,
      requestedTokenContract: dataMap.get('requested_token_contract') || ''
    };
  }

  // === CONTRACT READ FUNCTIONS ===
  
  async getActiveTransaction(): Promise<StellarTransaction | null> {
    try {
      console.log('Fetching active transaction from Soroban contract');
      
      // Try the normal approach first, catch the parsing error, and use simulation
      try {
        const result = await this.client.get_active_transaction();
        console.log('Direct result (this will likely fail):', result.result);
        return this.convertToStellarTransaction(result.result);
      } catch (parseError) {
        console.log('Direct parsing failed as expected, using simulation approach...');
        
        // The contract is returning raw map data, so simulate and handle raw result
        const tx = await this.client.get_active_transaction();
        const simResult = await tx.simulate();
        
        console.log('Simulation completed, checking for result...');
        
        // Check if simulation succeeded - look for the raw data structure
        // that matches what we saw in the error logs
        if (simResult && simResult.simulationData && simResult.simulationData.result && simResult.simulationData.result.retval) {
          console.log('Found retval in simulation result, parsing raw data...');
          
          // The simulation result contains the raw map structure
          // Let's work with it directly since we know the structure from the error logs
          const rawData = simResult.simulationData.result.retval;
          
          // Check if this is the map structure we expect
          // Based on the error logs, the data should have transaction fields
          console.log('Raw data structure:', rawData);
          try {
            return this.parseRawTransactionData(rawData);
          } catch (parseErr) {
            console.log('Failed to parse raw data:', parseErr);
            return null;
          }
          
          console.log('Raw data is not in expected map format');
          return null;
        }
        
        console.log('No valid simulation result found');
        return null;
      }
      
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

  async getRecentTransactionAt(index: number): Promise<StellarTransaction | null> {
    try {
      console.log('Fetching recent transaction at index:', index);
      
      const result = await this.client.get_recent_transaction_at({ index });
      
      if (!result.result) {
        return null;
      }
      
      return this.convertToStellarTransaction(result.result);
    } catch (error) {
      console.error('Error fetching transaction at index:', error);
      return null;
    }
  }

  async getAllRecentTransactions(): Promise<StellarTransaction[]> {
    try {
      console.log('Fetching all recent transactions from Soroban contract');
      
      const result = await this.client.get_all_recent_transactions();
      
      if (!result.result) {
        return [];
      }
      
      return result.result.map(tx => this.convertToStellarTransaction(tx));
    } catch (error) {
      console.error('Error fetching all recent transactions:', error);
      return [];
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
        ? Asset.native().contractId(Networks.TESTNET)
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
        ? Asset.native().contractId(Networks.TESTNET)
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
      
      // Check if additional signatures are needed and log details
      console.log('Transaction object:', transaction);
      const additionalSigners = transaction.needsNonInvokerSigningBy();
      console.log('needsNonInvokerSigningBy result:', additionalSigners);
      
      // For transactions that need the invoker (caller) to sign, we need to handle it differently
      // The caller should be the same as the user making the transaction
      console.log('Transaction caller (should match user):', userAddress);
      
      // Sign and send the transaction with Freighter (using client's signTransaction)
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
        ? Asset.native().contractId(Networks.TESTNET)
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
