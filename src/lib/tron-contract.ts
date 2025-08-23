import TronWeb from 'tronweb';

// Payment Terminal Contract ABI (based on PaymentTerminalERC20.sol)
const PAYMENT_TERMINAL_ABI = [
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "description",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "merchantName",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "merchantLocation",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "itemizedList",
        "type": "string"
      },
      {
        "internalType": "address",
        "name": "requestedTokenContract",
        "type": "address"
      }
    ],
    "name": "setActiveTransaction",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "payActiveTransaction",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "cancelActiveTransaction",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "clearActiveTransaction",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "activeTransaction",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "payer",
        "type": "address"
      },
      {
        "internalType": "bool",
        "name": "paid",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "description",
        "type": "string"
      },
      {
        "internalType": "bool",
        "name": "cancelled",
        "type": "bool"
      },
      {
        "internalType": "string",
        "name": "merchantName",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "merchantLocation",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "itemizedList",
        "type": "string"
      },
      {
        "internalType": "address",
        "name": "requestedTokenContract",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "txCounter",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "recentTransactions",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "payer",
        "type": "address"
      },
      {
        "internalType": "bool",
        "name": "paid",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "description",
        "type": "string"
      },
      {
        "internalType": "bool",
        "name": "cancelled",
        "type": "bool"
      },
      {
        "internalType": "string",
        "name": "merchantName",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "merchantLocation",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "itemizedList",
        "type": "string"
      },
      {
        "internalType": "address",
        "name": "requestedTokenContract",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "tokenContract",
        "type": "address"
      }
    ],
    "name": "getContractBalance",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAllRecentTransactions",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "id",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "payer",
            "type": "address"
          },
          {
            "internalType": "bool",
            "name": "paid",
            "type": "bool"
          },
          {
            "internalType": "uint256",
            "name": "timestamp",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "description",
            "type": "string"
          },
          {
            "internalType": "bool",
            "name": "cancelled",
            "type": "bool"
          },
          {
            "internalType": "string",
            "name": "merchantName",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "merchantLocation",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "itemizedList",
            "type": "string"
          },
          {
            "internalType": "address",
            "name": "requestedTokenContract",
            "type": "address"
          }
        ],
        "internalType": "struct PaymentTerminalERC20.Transaction[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getPaymentStatus",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      },
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      },
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      },
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address payable",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "tokenContract",
        "type": "address"
      }
    ],
    "name": "withdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

export interface TronTransaction {
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

export class TronContractClient {
  private tronWeb: any;
  private contract: any;
  private contractAddress: string;

  constructor(contractAddress: string, rpcUrl: string) {
    this.contractAddress = contractAddress;
    
    // Initialize TronWeb - try to use TronLink if available
    if (typeof window !== 'undefined' && window.tronWeb && window.tronWeb.ready) {
      this.tronWeb = window.tronWeb;
    } else {
      this.tronWeb = null;
    }
  }

  async ensureConnection(): Promise<string> {
    // Check if TronLink is installed
    if (typeof window !== 'undefined' && window.tronWeb) {
      this.tronWeb = window.tronWeb;
      
      // Request account access
      const accounts = await this.tronWeb.request({ method: 'tron_requestAccounts' });
      if (!accounts || accounts.length === 0) {
        throw new Error('No Tron accounts found. Please connect your TronLink wallet.');
      }
      
      return accounts[0];
    } else {
      throw new Error('TronLink wallet not found. Please install TronLink.');
    }
  }

  private async getContract() {
    if (!this.contract) {
      // Ensure TronWeb is available before creating contract
      if (!this.tronWeb) {
        if (typeof window !== 'undefined' && window.tronWeb && window.tronWeb.ready) {
          this.tronWeb = window.tronWeb;
        } else {
          throw new Error('TronLink not connected. Please connect your TronLink wallet first.');
        }
      }
      this.contract = await this.tronWeb.contract(PAYMENT_TERMINAL_ABI, this.contractAddress);
    }
    return this.contract;
  }

  private convertToTronTransaction(tx: any): TronTransaction {
    // Helper function to convert hex address to base58 or return undefined for zero address
    const convertAddress = (addr: any): string | undefined => {
      if (!addr || addr === '410000000000000000000000000000000000000000' || addr === '0x0000000000000000000000000000000000000000') {
        return undefined;
      }
      
      if (typeof addr === 'string' && addr.startsWith('41') && addr.length === 42) {
        try {
          return this.tronWeb.address.fromHex(addr);
        } catch (error) {
          console.warn('Failed to convert address:', addr, error);
          return undefined;
        }
      }
      
      return addr;
    };

    return {
      id: tx.id?.toString() || '0',
      amount: this.tronWeb ? this.tronWeb.fromSun(tx.amount || 0).toString() : '0',
      description: tx.description || '',
      merchantName: tx.merchantName || '',
      merchantLocation: tx.merchantLocation || '',
      itemizedList: tx.itemizedList || '',
      timestamp: parseInt(tx.timestamp?.toString() || '0') * 1000,
      paid: tx.paid || false,
      cancelled: tx.cancelled || false,
      payer: convertAddress(tx.payer),
      requestedTokenContract: convertAddress(tx.requestedTokenContract) || '',
    };
  }

  // === CONTRACT WRITE FUNCTIONS ===

  async setActiveTransaction(
    amount: string,
    description: string,
    merchantName: string,
    merchantLocation: string,
    itemizedList: string,
    requestedTokenContract: string
  ): Promise<string> {
    try {
      console.log('Creating active transaction on Tron contract:', {
        amount,
        description,
        merchantName,
        merchantLocation,
        itemizedList,
        requestedTokenContract,
      });

      await this.ensureConnection();
      const contract = await this.getContract();

      // Convert amount to Sun (TRX base unit)
      const amountInSun = this.tronWeb.toSun(amount);
      console.log('Amount in Sun:', amountInSun);

      // For Tron, convert the zero address to the proper format
      let tokenContract = requestedTokenContract;
      if (requestedTokenContract === 'T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb' || 
          requestedTokenContract === '' || 
          !requestedTokenContract) {
        tokenContract = this.tronWeb.address.toHex('T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb'); // Convert to hex format for contract
      }

      console.log('Token contract (hex):', tokenContract);

      const result = await contract.setActiveTransaction(
        amountInSun,
        description,
        merchantName,
        merchantLocation,
        itemizedList,
        tokenContract
      ).send({
        feeLimit: 100_000_000, // 100 TRX fee limit
      });

      console.log('Tron transaction result:', result);
      return result;
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  }

  async payActiveTransaction(): Promise<string> {
    try {
      console.log('Paying active transaction on Tron contract');

      await this.ensureConnection();
      const contract = await this.getContract();

      // Get active transaction to determine payment amount
      const activeTransaction = await this.getActiveTransaction();
      if (!activeTransaction) {
        throw new Error('No active transaction found');
      }

      console.log('Active transaction for payment:', activeTransaction);

      // The amount from contract is already in TRX (converted from Sun), so convert back to Sun for payment
      const amountInSun = this.tronWeb.toSun(activeTransaction.amount);
      console.log('Payment amount in Sun:', amountInSun);
      console.log('Requested token contract:', activeTransaction.requestedTokenContract);

      // Check if it's native TRX payment
      // In Tron, address(0) in contract is stored as hex, but might display as base58
      const isNativePayment = !activeTransaction.requestedTokenContract || 
                             activeTransaction.requestedTokenContract === '' ||
                             activeTransaction.requestedTokenContract === 'T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb' ||
                             activeTransaction.requestedTokenContract === '410000000000000000000000000000000000000000' ||
                             activeTransaction.requestedTokenContract.toLowerCase() === '0x0000000000000000000000000000000000000000';

      console.log('Is native payment:', isNativePayment);

      const result = await contract.payActiveTransaction().send({
        callValue: isNativePayment ? amountInSun : 0,
        feeLimit: 100_000_000,
      });

      console.log('Payment result:', result);
      return result;
    } catch (error) {
      console.error('Error paying transaction:', error);
      throw error;
    }
  }

  async cancelActiveTransaction(): Promise<string> {
    try {
      console.log('Cancelling active transaction on Tron contract');

      await this.ensureConnection();
      const contract = await this.getContract();

      const result = await contract.cancelActiveTransaction().send({
        feeLimit: 100_000_000,
      });

      console.log('Cancel result:', result);
      return result;
    } catch (error) {
      console.error('Error cancelling transaction:', error);
      throw error;
    }
  }

  async clearActiveTransaction(): Promise<string> {
    try {
      console.log('Clearing active transaction on Tron contract');

      await this.ensureConnection();
      const contract = await this.getContract();

      const result = await contract.clearActiveTransaction().send({
        feeLimit: 100_000_000,
      });

      console.log('Clear result:', result);
      return result;
    } catch (error) {
      console.error('Error clearing transaction:', error);
      throw error;
    }
  }

  async withdraw(to: string, tokenContract: string): Promise<string> {
    try {
      console.log('Withdrawing from Tron contract:', { to, tokenContract });

      await this.ensureConnection();
      const contract = await this.getContract();

      // Convert empty string to proper zero address for contract
      let contractAddress = tokenContract;
      if (!tokenContract || tokenContract === '') {
        contractAddress = this.tronWeb.address.toHex('T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb'); // Zero address in hex
      }

      console.log('Withdraw with contract address:', contractAddress);

      const result = await contract.withdraw(to, contractAddress).send({
        feeLimit: 100_000_000,
      });

      console.log('Withdraw result:', result);
      return result;
    } catch (error) {
      console.error('Error withdrawing:', error);
      throw error;
    }
  }

  // === CONTRACT READ FUNCTIONS ===

  async getActiveTransaction(): Promise<TronTransaction | null> {
    try {
      console.log('Fetching active transaction from Tron contract');

      // Check if TronLink is available
      if (!this.tronWeb && typeof window !== 'undefined' && window.tronWeb && window.tronWeb.ready) {
        this.tronWeb = window.tronWeb;
      }

      if (!this.tronWeb) {
        console.warn('TronLink not connected. Cannot fetch active transaction.');
        return null;
      }

      const contract = await this.getContract();
      const result = await contract.activeTransaction().call();

      console.log('Active transaction result:', result);

      if (!result || result.id === '0') {
        console.log('No active transaction found');
        return null;
      }

      return this.convertToTronTransaction(result);
    } catch (error) {
      console.error('Error fetching active transaction:', error);
      return null;
    }
  }

  async getRecentTransactions(): Promise<TronTransaction[]> {
    try {
      console.log('Fetching recent transactions from Tron contract');

      // Check if TronLink is available
      if (!this.tronWeb && typeof window !== 'undefined' && window.tronWeb && window.tronWeb.ready) {
        this.tronWeb = window.tronWeb;
      }

      if (!this.tronWeb) {
        console.warn('TronLink not connected. Cannot fetch recent transactions.');
        return [];
      }

      const contract = await this.getContract();
      const txCount = await contract.txCounter().call();
      const maxRecent = 10; // MAX_RECENT_TX from contract

      const transactions: TronTransaction[] = [];
      const count = Math.min(parseInt(txCount.toString()), maxRecent);

      for (let i = 0; i < count; i++) {
        try {
          const tx = await contract.recentTransactions(i).call();
          if (tx && tx.id !== '0') {
            transactions.push(this.convertToTronTransaction(tx));
          }
        } catch (error) {
          console.warn(`Error fetching transaction at index ${i}:`, error);
        }
      }

      return transactions;
    } catch (error) {
      console.error('Error fetching recent transactions:', error);
      return [];
    }
  }

  async getTxCounter(): Promise<number> {
    try {
      // Check if TronLink is available
      if (!this.tronWeb && typeof window !== 'undefined' && window.tronWeb && window.tronWeb.ready) {
        this.tronWeb = window.tronWeb;
      }

      if (!this.tronWeb) {
        console.warn('TronLink not connected. Cannot fetch transaction counter.');
        return 0;
      }

      const contract = await this.getContract();
      const result = await contract.txCounter().call();
      return parseInt(result.toString());
    } catch (error) {
      console.error('Error fetching transaction counter:', error);
      return 0;
    }
  }

  async getContractBalance(tokenContract: string): Promise<string> {
    try {
      console.log('Fetching contract balance from Tron contract', tokenContract);

      // Check if TronLink is available
      if (!this.tronWeb && typeof window !== 'undefined' && window.tronWeb && window.tronWeb.ready) {
        this.tronWeb = window.tronWeb;
      }

      if (!this.tronWeb) {
        console.warn('TronLink not connected. Cannot fetch contract balance.');
        return '0';
      }

      const contract = await this.getContract();
      const result = await contract.getContractBalance(tokenContract).call();

      // Convert from Sun to TRX
      return this.tronWeb.fromSun(result).toString();
    } catch (error) {
      console.error('Error fetching contract balance:', error);
      return '0';
    }
  }

  async getOwner(): Promise<string | null> {
    try {
      console.log('Fetching owner from Tron contract');

      // Check if TronLink is available
      if (!this.tronWeb && typeof window !== 'undefined' && window.tronWeb && window.tronWeb.ready) {
        this.tronWeb = window.tronWeb;
      }

      if (!this.tronWeb) {
        console.warn('TronLink not connected. Cannot fetch owner.');
        return null;
      }

      const contract = await this.getContract();
      const result = await contract.owner().call();

      console.log('Contract owner (hex):', result);
      
      // Convert hex address to base58 address for Tron
      let ownerAddress = result;
      if (typeof result === 'string' && result.startsWith('41')) {
        // Convert hex address to base58
        ownerAddress = this.tronWeb.address.fromHex(result);
        console.log('Contract owner (base58):', ownerAddress);
      }
      
      return ownerAddress;
    } catch (error) {
      console.error('Error fetching owner:', error);
      return null;
    }
  }

  // === UTILITY METHODS ===

  async getAllContractData(): Promise<{
    activeTransaction: TronTransaction | null;
    recentTransactions: TronTransaction[];
    txCounter: number;
    contractBalance: string;
    owner: string | null;
  }> {
    const [
      activeTransaction,
      recentTransactions,
      txCounter,
      contractBalance,
      owner
    ] = await Promise.all([
      this.getActiveTransaction(),
      this.getRecentTransactions(),
      this.getTxCounter(),
      this.getContractBalance('0x0000000000000000000000000000000000000000'), // Native TRX
      this.getOwner(),
    ]);

    return {
      activeTransaction,
      recentTransactions,
      txCounter,
      contractBalance,
      owner
    };
  }
}

// Global TronWeb type declaration
declare global {
  interface Window {
    tronWeb: any;
  }
}
