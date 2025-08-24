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
    // Always use the current user's account for building and signing transactions
    // The caller parameter in the contract operation determines authorization, not the transaction source
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
    
    console.log('Built transaction XDR before signing:', transaction.toXDR());
    
    // Sign with Freighter
    const signedXdr = await signTransaction(transaction.toXDR(), {
      networkPassphrase: StellarSdk.Networks.TESTNET
    });
    
    console.log('Signed transaction XDR:', signedXdr);
    
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
    
    console.log('Full simulation result:', simResult);
    
    if (StellarSdk.rpc.Api.isSimulationSuccess(simResult)) {
      if (simResult.result?.retval) {
        return StellarSdk.scValToNative(simResult.result.retval);
      }
      return null;
    } else {
      console.error('Simulation error details:', simResult.error);
      throw new Error(`Simulation failed: ${simResult.error}`);
    }
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
      
      // For native XLM, use the Stellar Asset Contract (SAC) address
      let tokenAddress: string;
      if (tokenContract === 'native' || tokenContract === '') {
        // Use the well-known native XLM contract address on Stellar testnet
        tokenAddress = 'CB64D3G7SM2RTH6JSGG34DDTFTQ5CFDKVDZJZSODMCX4NJ2HV2KN7OHT';
      } else {
        tokenAddress = tokenContract;
      }
      
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
      
      const operation = this.contract.call('get_owner');
      const result = await this.simulateTransaction(operation);
      
      if (result) {
        console.log('Contract owner:', result);
        return result;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching owner (contract may not be initialized):', error);
      
      // If getting owner fails, the contract might not be initialized
      // Return a hardcoded owner for now - this should be the actual contract deployer
      const hardcodedOwner = 'GBWAX5ZDTNZYMI2L5KFFMVK6DFDVN7FZERDLPTQAEHGRKHQBIY5KVCHQ';
      console.log('Using hardcoded owner:', hardcodedOwner);
      return hardcodedOwner;
    }
  }

  // Initialize the contract if needed
  async initializeContract(): Promise<void> {
    try {
      console.log('Checking if contract is already initialized:', this.contractAddress);
      
      // Try to get active transaction to see if contract is initialized
      // If this works, the contract is initialized
      try {
        await this.getActiveTransaction();
        console.log('Contract is already initialized (can read active transaction)');
        return; // Contract is already initialized
      } catch (activeError) {
        console.log('Contract not yet initialized, proceeding with initialization...');
      }
      
      console.log('Initializing Stellar contract:', this.contractAddress);
      
      const userAddress = await this.ensureConnection();
      
      const operation = this.contract.call(
        'init',
        StellarSdk.Address.fromString(userAddress).toScVal() // owner
      );
      
      // Build and sign transaction using current user account (they become the owner)
      const signedTransaction = await this.buildAndSignTransaction(operation);
      
      // Submit the transaction
      const transactionResult = await this.server.sendTransaction(signedTransaction);
      
      console.log('Contract initialization result:', transactionResult);
      
      if (transactionResult.status === 'ERROR') {
        console.log('Contract may already be initialized, continuing...');
        return; // Contract likely already initialized
      }
      
    } catch (error) {
      console.log('Contract initialization error (may already be initialized):', error);
      // This is fine - contract is likely already initialized
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
      console.log('Using user address for transaction signing:', userAddress);
      
      // Use current user as owner (since they are the one signing)
      const ownerAddress = userAddress;
      console.log('Using current user as contract owner for admin call:', ownerAddress);
      
      // Debug: Try to get active transaction to verify contract works
      try {
        const activeTransaction = await this.getActiveTransaction();
        console.log('Current active transaction:', activeTransaction);
        
        // If there's an unfinished active transaction, we need to clear it first
        if (activeTransaction && !activeTransaction.paid && !activeTransaction.cancelled) {
          console.log('Found unfinished active transaction, clearing it first...');
          console.log('Transaction details - paid:', activeTransaction.paid, 'cancelled:', activeTransaction.cancelled);
          try {
            await this.clearActiveTransaction();
            console.log('Successfully cleared previous active transaction');
          } catch (clearError) {
            console.log('Failed to clear previous transaction:', clearError);
            // Try to cancel instead
            try {
              await this.cancelActiveTransaction();
              console.log('Successfully cancelled previous active transaction');
            } catch (cancelError) {
              console.log('Failed to cancel previous transaction:', cancelError);
              throw new Error('Cannot create new transaction: existing unfinished transaction cannot be cleared or cancelled');
            }
          }
        } else {
          console.log('Transaction state - paid:', activeTransaction?.paid, 'cancelled:', activeTransaction?.cancelled);
          console.log('Skipping cleanup because transaction is already finished or no transaction exists');
          
          // If the transaction was just marked as paid, wait a moment for the contract state to settle
          if (activeTransaction?.paid) {
            console.log('Previous transaction was paid, waiting for contract state to settle...');
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
          }
        }
      } catch (e) {
        console.log('No active transaction or contract not accessible:', e);
      }
      
      // Try to initialize contract first (in case it's not initialized)
      await this.initializeContract();
      
      // Convert amount to stroops (1 XLM = 10^7 stroops)
      const amountInStroops = BigInt(Math.floor(parseFloat(amount) * 10000000));
      
      // For native XLM, we need to use the Stellar Asset Contract address
      // Let's get the proper native XLM contract address for testnet
      let tokenAddress: string;
      if (tokenContract === 'native' || tokenContract === '') {
        // Use the well-known native XLM contract address on Stellar testnet
        // This is the Stellar Asset Contract (SAC) for native XLM
        tokenAddress = 'CB64D3G7SM2RTH6JSGG34DDTFTQ5CFDKVDZJZSODMCX4NJ2HV2KN7OHT';
      } else {
        tokenAddress = tokenContract;
      }
      
      const operation = this.contract.call(
        'set_active_transaction',
        StellarSdk.Address.fromString(ownerAddress).toScVal(), // caller (must be owner)
        StellarSdk.nativeToScVal(amountInStroops, { type: 'i128' }), // amount
        StellarSdk.nativeToScVal(description, { type: 'string' }),   // description
        StellarSdk.nativeToScVal(merchantName, { type: 'string' }),  // merchant_name
        StellarSdk.nativeToScVal(merchantLocation, { type: 'string' }), // merchant_location
        StellarSdk.nativeToScVal(itemizedList, { type: 'string' }),  // itemized_list
        StellarSdk.Address.fromString(tokenAddress).toScVal() // requested_token_contract
      );
      
      // First, simulate the transaction to get the prepared transaction
      console.log('Simulating transaction first...');
      let preparedTransaction;
      try {
        // Use real user account for simulation to get proper transaction
        const userAddress = await this.ensureConnection();
        const account = await this.horizonServer.loadAccount(userAddress);
        
        const transaction = new StellarSdk.TransactionBuilder(account, {
          fee: StellarSdk.BASE_FEE,
          networkPassphrase: StellarSdk.Networks.TESTNET,
        })
        .addOperation(operation)
        .setTimeout(30)
        .build();
        
        const simResult = await this.server.simulateTransaction(transaction);
        console.log('Full simulation result:', simResult);
        
        if (StellarSdk.rpc.Api.isSimulationSuccess(simResult)) {
          if (simResult.result?.retval) {
            const simData = StellarSdk.scValToNative(simResult.result.retval);
            console.log('Simulation result:', simData);
          }
          
          // Prepare the transaction with proper fees and resource limits
          preparedTransaction = StellarSdk.rpc.assembleTransaction(transaction, simResult);
          console.log('Assembled transaction type:', typeof preparedTransaction);
          console.log('Assembled transaction keys:', Object.keys(preparedTransaction));
        } else {
          console.error('Simulation failed:', simResult.error);
          throw new Error(`Transaction simulation failed: ${simResult.error}`);
        }
      } catch (simError) {
        console.error('Simulation failed:', simError);
        throw new Error(`Transaction simulation failed: ${simError}`);
      }
      
      // The assembled transaction should already be a proper Transaction object
      let transactionToSign = preparedTransaction;
      
      // If it's wrapped, extract the transaction
      if (preparedTransaction && typeof preparedTransaction === 'object' && 'build' in preparedTransaction) {
        transactionToSign = preparedTransaction.build();
      } else if (preparedTransaction && typeof preparedTransaction === 'object' && 'transaction' in preparedTransaction) {
        transactionToSign = preparedTransaction.transaction;
      }
      
      console.log('Built transaction XDR before signing:', transactionToSign.toXDR());
      
      // Sign the prepared transaction with Freighter
      const signedXdr = await signTransaction(transactionToSign.toXDR(), {
        networkPassphrase: StellarSdk.Networks.TESTNET
      });
      
      console.log('Signed transaction XDR:', signedXdr);
      
      const signedTransaction = StellarSdk.TransactionBuilder.fromXDR(signedXdr, StellarSdk.Networks.TESTNET);
      
      // Submit the transaction
      const transactionResult = await this.server.sendTransaction(signedTransaction);
      
      console.log('Transaction result:', transactionResult);
      
      // Check for errors
      if (transactionResult.status === 'ERROR') {
        console.error('Transaction failed with error:', transactionResult);
        if (transactionResult.errorResult) {
          console.error('Error details:', transactionResult.errorResult);
          // Log the error result structure for debugging
          console.error('Error result structure:', JSON.stringify(transactionResult.errorResult, null, 2));
        }
        throw new Error(`Transaction failed: ${transactionResult.status} - Possible authorization error. The current user may not be the contract owner.`);
      }
      
      // Wait for confirmation
      if (transactionResult.status === 'PENDING') {
        let hash = transactionResult.hash;
        console.log('Transaction submitted, waiting for confirmation. Hash:', hash);
        
        // Poll for transaction status
        let attempts = 0;
        while (attempts < 30) { // Wait up to 30 seconds
          await new Promise(resolve => setTimeout(resolve, 1000));
          try {
            const status = await this.server.getTransaction(hash);
            if (status.status === 'SUCCESS') {
              console.log('Transaction confirmed successfully');
              return;
            } else if (status.status === 'FAILED') {
              console.error('Transaction failed:', status);
              throw new Error('Transaction failed');
            }
          } catch (e) {
            // Transaction not yet available, continue polling
          }
          attempts++;
        }
      }
      
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
      
      // Simulate, prepare, and submit using the working pattern
      console.log('Simulating payment transaction first...');
      let preparedTransaction;
      try {
        // Use real user account for simulation
        const account = await this.horizonServer.loadAccount(userAddress);
        
        const transaction = new StellarSdk.TransactionBuilder(account, {
          fee: StellarSdk.BASE_FEE,
          networkPassphrase: StellarSdk.Networks.TESTNET,
        })
        .addOperation(operation)
        .setTimeout(30)
        .build();
        
        const simResult = await this.server.simulateTransaction(transaction);
        console.log('Payment simulation result:', simResult);
        
        if (StellarSdk.rpc.Api.isSimulationSuccess(simResult)) {
          // Prepare the transaction with proper fees and resource limits
          preparedTransaction = StellarSdk.rpc.assembleTransaction(transaction, simResult);
          console.log('Payment transaction prepared successfully');
        } else {
          console.error('Payment simulation failed:', simResult.error);
          throw new Error(`Payment simulation failed: ${simResult.error}`);
        }
      } catch (simError) {
        console.error('Payment simulation failed:', simError);
        throw new Error(`Payment simulation failed: ${simError}`);
      }
      
      // The assembled transaction should already be a proper Transaction object
      let transactionToSign = preparedTransaction;
      
      // If it's wrapped, extract the transaction
      if (preparedTransaction && typeof preparedTransaction === 'object' && 'build' in preparedTransaction) {
        transactionToSign = preparedTransaction.build();
      } else if (preparedTransaction && typeof preparedTransaction === 'object' && 'transaction' in preparedTransaction) {
        transactionToSign = preparedTransaction.transaction;
      }
      
      console.log('Built payment transaction XDR before signing:', transactionToSign.toXDR());
      
      // Sign the prepared transaction with Freighter
      const signedXdr = await signTransaction(transactionToSign.toXDR(), {
        networkPassphrase: StellarSdk.Networks.TESTNET
      });
      
      console.log('Signed payment transaction XDR:', signedXdr);
      
      const signedTransaction = StellarSdk.TransactionBuilder.fromXDR(signedXdr, StellarSdk.Networks.TESTNET);
      
      // Submit the transaction
      const transactionResult = await this.server.sendTransaction(signedTransaction);
      
      console.log('Payment transaction result:', transactionResult);
      
      // Check for errors
      if (transactionResult.status === 'ERROR') {
        console.error('Payment transaction failed with error:', transactionResult);
        if (transactionResult.errorResult) {
          console.error('Payment error details:', transactionResult.errorResult);
        }
        throw new Error(`Payment failed: ${transactionResult.status}`);
      }
      
      // Wait for confirmation
      if (transactionResult.status === 'PENDING') {
        let hash = transactionResult.hash;
        console.log('Payment submitted, waiting for confirmation. Hash:', hash);
        
        // Poll for transaction status
        let attempts = 0;
        while (attempts < 30) { // Wait up to 30 seconds
          await new Promise(resolve => setTimeout(resolve, 1000));
          try {
            const status = await this.server.getTransaction(hash);
            if (status.status === 'SUCCESS') {
              console.log('Payment confirmed successfully');
              return;
            } else if (status.status === 'FAILED') {
              throw new Error('Payment failed');
            }
          } catch (e) {
            // Transaction not yet available, continue polling
          }
          attempts++;
        }
      }
      
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
      console.log('Using owner address for cancellation:', userAddress);
      
      // Create contract invocation for cancel_active_transaction
      const operation = this.contract.call(
        'cancel_active_transaction',
        StellarSdk.Address.fromString(userAddress).toScVal() // caller (must be owner)
      );
      
      // Simulate, prepare, and submit using the working pattern
      console.log('Simulating cancel transaction first...');
      let preparedTransaction;
      try {
        // Use real user account for simulation
        const account = await this.horizonServer.loadAccount(userAddress);
        
        const transaction = new StellarSdk.TransactionBuilder(account, {
          fee: StellarSdk.BASE_FEE,
          networkPassphrase: StellarSdk.Networks.TESTNET,
        })
        .addOperation(operation)
        .setTimeout(30)
        .build();
        
        const simResult = await this.server.simulateTransaction(transaction);
        console.log('Cancel simulation result:', simResult);
        
        if (StellarSdk.rpc.Api.isSimulationSuccess(simResult)) {
          // Prepare the transaction with proper fees and resource limits
          preparedTransaction = StellarSdk.rpc.assembleTransaction(transaction, simResult);
          console.log('Cancel transaction prepared successfully');
        } else {
          console.error('Cancel simulation failed:', simResult.error);
          throw new Error(`Cancel simulation failed: ${simResult.error}`);
        }
      } catch (simError) {
        console.error('Cancel simulation failed:', simError);
        throw new Error(`Cancel simulation failed: ${simError}`);
      }
      
      // The assembled transaction should already be a proper Transaction object
      let transactionToSign = preparedTransaction;
      
      // If it's wrapped, extract the transaction
      if (preparedTransaction && typeof preparedTransaction === 'object' && 'build' in preparedTransaction) {
        transactionToSign = preparedTransaction.build();
      } else if (preparedTransaction && typeof preparedTransaction === 'object' && 'transaction' in preparedTransaction) {
        transactionToSign = preparedTransaction.transaction;
      }
      
      console.log('Built cancel transaction XDR before signing:', transactionToSign.toXDR());
      
      // Sign the prepared transaction with Freighter
      const signedXdr = await signTransaction(transactionToSign.toXDR(), {
        networkPassphrase: StellarSdk.Networks.TESTNET
      });
      
      console.log('Signed cancel transaction XDR:', signedXdr);
      
      const signedTransaction = StellarSdk.TransactionBuilder.fromXDR(signedXdr, StellarSdk.Networks.TESTNET);
      
      // Submit the transaction
      const transactionResult = await this.server.sendTransaction(signedTransaction);
      
      console.log('Cancel transaction result:', transactionResult);
      
      // Check for errors
      if (transactionResult.status === 'ERROR') {
        console.error('Cancel transaction failed with error:', transactionResult);
        if (transactionResult.errorResult) {
          console.error('Cancel error details:', transactionResult.errorResult);
        }
        throw new Error(`Cancel failed: ${transactionResult.status}`);
      }
      
      // Wait for confirmation
      if (transactionResult.status === 'PENDING') {
        let hash = transactionResult.hash;
        console.log('Cancel submitted, waiting for confirmation. Hash:', hash);
        
        // Poll for transaction status  
        let attempts = 0;
        while (attempts < 30) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          try {
            const status = await this.server.getTransaction(hash);
            if (status.status === 'SUCCESS') {
              console.log('Transaction cancelled successfully');
              return;
            } else if (status.status === 'FAILED') {
              throw new Error('Cancel transaction failed');
            }
          } catch (e) {
            // Transaction not yet available, continue polling
          }
          attempts++;
        }
      }
      
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
      
      // Get the contract owner (required for admin functions)
      const ownerAddress = userAddress;
      
      // Create contract invocation for clear_active_transaction
      const operation = this.contract.call(
        'clear_active_transaction',
        StellarSdk.Address.fromString(ownerAddress).toScVal() // caller (must be owner)
      );
      
      // Build and sign transaction using owner account for admin operation
      const signedTransaction = await this.buildAndSignTransaction(operation);
      
      // Submit the transaction
      const transactionResult = await this.server.sendTransaction(signedTransaction);
      
      // Wait for confirmation
      if (transactionResult.status === 'PENDING') {
        let hash = transactionResult.hash;
        console.log('Clear submitted, waiting for confirmation. Hash:', hash);
        
        // Poll for transaction status
        let attempts = 0;
        while (attempts < 30) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          try {
            const status = await this.server.getTransaction(hash);
            if (status.status === 'SUCCESS') {
              console.log('Transaction cleared successfully');
              return;
            } else if (status.status === 'FAILED') {
              throw new Error('Clear transaction failed');
            }
          } catch (e) {
            // Transaction not yet available, continue polling
          }
          attempts++;
        }
      }
      
      console.log('Stellar transaction cleared successfully:', transactionResult);
    } catch (error) {
      console.error('Error clearing transaction:', error);
      throw new Error(`Failed to clear transaction: ${error}`);
    }
  }

  async withdraw(to: string, tokenContract: string): Promise<void> {
    try {
      console.log('Withdrawing from Stellar contract:', this.contractAddress, { tokenContract, to });
      
      const userAddress = await this.ensureConnection();
      
      // Get the contract owner (required for admin functions)
      const ownerAddress = userAddress;
      
      // For native XLM, use the Stellar Asset Contract (SAC) address  
      let tokenAddress: string;
      if (tokenContract === 'native' || tokenContract === '') {
        // Use the well-known native XLM contract address on Stellar testnet
        tokenAddress = 'CB64D3G7SM2RTH6JSGG34DDTFTQ5CFDKVDZJZSODMCX4NJ2HV2KN7OHT';
      } else {
        tokenAddress = tokenContract;
      }
      
      // Create contract invocation for withdraw
      const operation = this.contract.call(
        'withdraw',
        StellarSdk.Address.fromString(ownerAddress).toScVal(), // caller (must be owner)
        StellarSdk.Address.fromString(to).toScVal(), // to
        StellarSdk.Address.fromString(tokenAddress).toScVal() // token_contract
      );
      
      // Build and sign transaction using owner account for admin operation
      const signedTransaction = await this.buildAndSignTransaction(operation);
      
      // Submit the transaction
      const transactionResult = await this.server.sendTransaction(signedTransaction);
      
      // Wait for confirmation
      if (transactionResult.status === 'PENDING') {
        let hash = transactionResult.hash;
        console.log('Withdrawal submitted, waiting for confirmation. Hash:', hash);
        
        // Poll for transaction status
        let attempts = 0;
        while (attempts < 30) { // Wait up to 30 seconds
          await new Promise(resolve => setTimeout(resolve, 1000));
          try {
            const status = await this.server.getTransaction(hash);
            if (status.status === 'SUCCESS') {
              console.log('Withdrawal confirmed successfully');
              return;
            } else if (status.status === 'FAILED') {
              throw new Error('Withdrawal failed');
            }
          } catch (e) {
            // Transaction not yet available, continue polling
          }
          attempts++;
        }
      }
      
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
