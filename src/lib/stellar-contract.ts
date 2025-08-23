import * as StellarSdk from '@stellar/stellar-sdk';
import { isConnected, setAllowed, getUserInfo, signTransaction } from '@stellar/freighter-api';

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
  private contractAddress: string;
  private rpcUrl: string;
  private server: StellarSdk.rpc.Server;
  private horizonServer: StellarSdk.Horizon.Server;
  private contract: StellarSdk.Contract;

  constructor(contractAddress: string, rpcUrl: string) {
    this.contractAddress = contractAddress;
    this.rpcUrl = rpcUrl;
    // Use Soroban RPC server for contract operations
    this.server = new StellarSdk.rpc.Server(rpcUrl);
    // Use Horizon server for account operations
    this.horizonServer = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');
    this.contract = new StellarSdk.Contract(contractAddress);
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

  private async buildAndSignTransaction(operation: StellarSdk.xdr.Operation): Promise<StellarSdk.Transaction> {
    const userAddress = await this.ensureConnection();
    
    // Load the user's account
    const account = await this.horizonServer.loadAccount(userAddress);
    
    // Build transaction
    const transaction = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: StellarSdk.Networks.TESTNET,
    })
    .addOperation(operation)
    .setTimeout(30)
    .build();
    
    // Sign with Freighter
    const signedXdr = await signTransaction(transaction.toXDR(), {
      networkPassphrase: StellarSdk.Networks.TESTNET
    });
    
    const signedTransaction = StellarSdk.TransactionBuilder.fromXDR(signedXdr, StellarSdk.Networks.TESTNET);
    
    // Ensure we return a Transaction, not a FeeBumpTransaction
    if ('innerTransaction' in signedTransaction) {
      return signedTransaction.innerTransaction;
    }
    
    return signedTransaction as StellarSdk.Transaction;
  }

  private async simulateTransaction(operation: StellarSdk.xdr.Operation): Promise<any> {
    // Use a dummy account for simulation only
    const dummySource = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF';
    const sourceAccount = new StellarSdk.Account(dummySource, '0');
    
    // Build transaction for simulation
    const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: StellarSdk.Networks.TESTNET,
    })
    .addOperation(operation)
    .setTimeout(30)
    .build();
    
    // Simulate the transaction
    const simResult = await this.server.simulateTransaction(transaction);
    
    if (StellarSdk.rpc.Api.isSimulationSuccess(simResult)) {
      if (simResult.result?.retval) {
        return StellarSdk.scValToNative(simResult.result.retval);
      }
    } else {
      throw new Error(`Simulation failed: ${simResult.error}`);
    }
    
    return null;
  }

  // === CONTRACT READ FUNCTIONS ===
  
  async getActiveTransaction(): Promise<StellarTransaction | null> {
    try {
      console.log('Fetching active transaction from Soroban contract:', this.contractAddress);
      
      const operation = this.contract.call('get_active_transaction');
      const result = await this.simulateTransaction(operation);
      
      if (!result) {
        console.log('No active transaction found');
        return null;
      }
      
      console.log('Active transaction result:', result);
      
      // Convert the result to our interface
      return {
        id: result.id?.toString() || '',
        amount: (Number(result.amount) / 10000000).toString(), // Convert from stroops
        description: result.description || '',
        merchantName: result.merchant_name || '',
        merchantLocation: result.merchant_location || '',
        itemizedList: result.itemized_list || '',
        timestamp: Number(result.timestamp) * 1000, // Convert to milliseconds
        paid: result.paid || false,
        cancelled: result.cancelled || false,
        payer: result.payer || undefined,
        requestedTokenContract: result.requested_token_contract || ''
      };
    } catch (error) {
      console.error('Error fetching active transaction:', error);
      return null;
    }
  }

  async getPaymentStatus(): Promise<{ hasPendingTx: boolean; pendingTxPayer?: string; hasActiveTx: boolean; activeTxCreator?: string }> {
    try {
      console.log('Fetching payment status from Soroban contract:', this.contractAddress);
      
      const operation = this.contract.call('get_payment_status');
      const result = await this.simulateTransaction(operation);
      
      if (!result) {
        return { hasPendingTx: false, hasActiveTx: false };
      }
      
      console.log('Payment status result:', result);
      
      return {
        hasPendingTx: result[0] || false,
        pendingTxPayer: result[1] || undefined,
        hasActiveTx: result[2] || false,
        activeTxCreator: result[3] || undefined
      };
    } catch (error) {
      console.error('Error fetching payment status:', error);
      return { hasPendingTx: false, hasActiveTx: false };
    }
  }

  async getRecentTransactions(): Promise<StellarTransaction[]> {
    try {
      console.log('Fetching recent transactions from Soroban contract:', this.contractAddress);
      
      const operation = this.contract.call('get_all_recent_transactions');
      const result = await this.simulateTransaction(operation);
      
      if (!result || !Array.isArray(result)) {
        console.log('No recent transactions found');
        return [];
      }
      
      console.log('Recent transactions result:', result);
      
      // Convert the results to our interface
      return result.map((tx: any) => ({
        id: tx.id?.toString() || '',
        amount: (Number(tx.amount) / 10000000).toString(), // Convert from stroops
        description: tx.description || '',
        merchantName: tx.merchant_name || '',
        merchantLocation: tx.merchant_location || '',
        itemizedList: tx.itemized_list || '',
        timestamp: Number(tx.timestamp) * 1000, // Convert to milliseconds
        paid: tx.paid || false,
        cancelled: tx.cancelled || false,
        payer: tx.payer || undefined,
        requestedTokenContract: tx.requested_token_contract || ''
      }));
    } catch (error) {
      console.error('Error fetching recent transactions:', error);
      return [];
    }
  }

  async getRecentTransactionsCount(): Promise<number> {
    try {
      console.log('Fetching recent transactions count from Soroban contract:', this.contractAddress);
      
      const operation = this.contract.call('get_recent_transactions_count');
      const result = await this.simulateTransaction(operation);
      
      return Number(result) || 0;
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
      console.log('Fetching contract balance from Soroban contract:', this.contractAddress, tokenContract);
      
      const tokenAddress = tokenContract === 'native' 
        ? 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQAHHAGCYUPX' 
        : tokenContract;
      
      const operation = this.contract.call(
        'get_contract_balance',
        StellarSdk.Address.fromString(tokenAddress).toScVal()
      );
      
      const result = await this.simulateTransaction(operation);
      
      // Convert from stroops to XLM
      return (Number(result) / 10000000).toString();
    } catch (error) {
      console.error('Error fetching contract balance:', error);
      return '0';
    }
  }

  async getOwner(): Promise<string | null> {
    try {
      console.log('Fetching owner from Stellar contract:', this.contractAddress);
      
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
      console.log('Calling set_active_transaction on Soroban contract:', this.contractAddress, {
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
      const amountInStroops = Math.floor(parseFloat(amount) * 10000000);
      
      // Create contract invocation for set_active_transaction
      const tokenAddress = tokenContract === 'native' 
        ? 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQAHHAGCYUPX' 
        : tokenContract;
      
      const operation = this.contract.call(
        'set_active_transaction',
        StellarSdk.Address.fromString(userAddress).toScVal(), // caller
        StellarSdk.nativeToScVal(amountInStroops, { type: 'i128' }), // amount
        StellarSdk.nativeToScVal(description, { type: 'string' }),   // description
        StellarSdk.nativeToScVal(merchantName, { type: 'string' }),  // merchant_name
        StellarSdk.nativeToScVal(merchantLocation, { type: 'string' }), // merchant_location
        StellarSdk.nativeToScVal(itemizedList, { type: 'string' }),  // itemized_list
        StellarSdk.Address.fromString(tokenAddress).toScVal() // requested_token_contract
      );
      
      // Build and sign transaction
      const signedTransaction = await this.buildAndSignTransaction(operation);
      
      // Submit the transaction
      const transactionResult = await this.server.sendTransaction(signedTransaction);
      
      console.log('Soroban contract call successful:', transactionResult);
    } catch (error) {
      console.error('Error calling set_active_transaction:', error);
      throw new Error(`Failed to create transaction: ${error}`);
    }
  }

  async payActiveTransaction(): Promise<void> {
    try {
      console.log('Calling pay_active_transaction on Soroban contract:', this.contractAddress);
      
      const userAddress = await this.ensureConnection();
      console.log('Using payer address:', userAddress);
      
      // Create contract invocation for pay_active_transaction
      const operation = this.contract.call(
        'pay_active_transaction',
        StellarSdk.Address.fromString(userAddress).toScVal() // payer
      );
      
      // Build and sign transaction
      const signedTransaction = await this.buildAndSignTransaction(operation);
      
      // Submit the transaction
      const transactionResult = await this.server.sendTransaction(signedTransaction);
      
      console.log('Payment transaction successful:', transactionResult);
    } catch (error) {
      console.error('Error paying transaction:', error);
      throw new Error(`Failed to pay transaction: ${error}`);
    }
  }

  async cancelActiveTransaction(): Promise<void> {
    try {
      console.log('Cancelling active transaction on Stellar contract:', this.contractAddress);
      
      const userAddress = await this.ensureConnection();
      
      // Create contract invocation for cancel_active_transaction
      const operation = this.contract.call(
        'cancel_active_transaction',
        StellarSdk.Address.fromString(userAddress).toScVal() // caller
      );
      
      // Build and sign transaction
      const signedTransaction = await this.buildAndSignTransaction(operation);
      
      // Submit the transaction
      const transactionResult = await this.server.sendTransaction(signedTransaction);
      
      console.log('Stellar transaction cancelled successfully:', transactionResult);
    } catch (error) {
      console.error('Error cancelling transaction:', error);
      throw new Error(`Failed to cancel transaction: ${error}`);
    }
  }

  async clearActiveTransaction(): Promise<void> {
    try {
      console.log('Clearing active transaction on Stellar contract:', this.contractAddress);
      
      const userAddress = await this.ensureConnection();
      
      // Create contract invocation for clear_active_transaction
      const operation = this.contract.call(
        'clear_active_transaction',
        StellarSdk.Address.fromString(userAddress).toScVal() // caller
      );
      
      // Build and sign transaction
      const signedTransaction = await this.buildAndSignTransaction(operation);
      
      // Submit the transaction
      const transactionResult = await this.server.sendTransaction(signedTransaction);
      
      console.log('Stellar transaction cleared successfully:', transactionResult);
    } catch (error) {
      console.error('Error clearing transaction:', error);
      throw new Error(`Failed to clear transaction: ${error}`);
    }
  }

  async withdraw(tokenContract: string, to: string): Promise<void> {
    try {
      console.log('Withdrawing from Stellar contract:', this.contractAddress, { tokenContract, to });
      
      const userAddress = await this.ensureConnection();
      
      const tokenAddress = tokenContract === 'native' 
        ? 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQAHHAGCYUPX' 
        : tokenContract;
      
      // Create contract invocation for withdraw
      const operation = this.contract.call(
        'withdraw',
        StellarSdk.Address.fromString(userAddress).toScVal(), // caller
        StellarSdk.Address.fromString(to).toScVal(), // to
        StellarSdk.Address.fromString(tokenAddress).toScVal() // token_contract
      );
      
      // Build and sign transaction
      const signedTransaction = await this.buildAndSignTransaction(operation);
      
      // Submit the transaction
      const transactionResult = await this.server.sendTransaction(signedTransaction);
      
      console.log('Stellar withdrawal completed successfully:', transactionResult);
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
