// Stellar wallet using proper Freighter API
export interface StellarWallet {
  address: string | null;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
}

class StellarWalletManager {
  private address: string | null = null;
  private connected: boolean = false;
  private listeners: Array<() => void> = [];

  async connect(): Promise<void> {
    try {
      console.log('Starting Freighter connection...')
      
      // Import the Freighter API dynamically
      const { isConnected, getPublicKey, requestAccess } = await import('@stellar/freighter-api')
      
      console.log('Freighter API imported successfully')
      
      // Check if Freighter is installed and available
      const isInstalled = await isConnected()
      console.log('Freighter installation check:', isInstalled)
      
      if (!isInstalled) {
        console.log('Freighter not installed, opening download page...')
        window.open('https://freighter.app/', '_blank')
        throw new Error('Freighter wallet extension not detected. Please install Freighter from https://freighter.app/')
      }

      // Request access to the wallet
      console.log('Requesting wallet access...')
      const hasAccess = await requestAccess()
      console.log('Access granted:', hasAccess)
      
      if (!hasAccess) {
        throw new Error('User denied wallet access')
      }

      // Get the public key
      console.log('Getting public key...')
      const publicKey = await getPublicKey()
      console.log('Connected to Freighter with public key:', publicKey)
      
      this.address = publicKey
      this.connected = true
      this.notifyListeners()
      
    } catch (error: any) {
      console.error('Stellar wallet connection failed:', error)
      
      // If it's clearly a "not installed" error and we haven't opened the page yet
      if (error.message.includes('not detected') || error.message.includes('not found') || error.message.includes('not available')) {
        if (!error.message.includes('https://freighter.app/')) {
          window.open('https://freighter.app/', '_blank')
        }
      }
      
      throw error
    }
  }

  disconnect(): void {
    this.address = null;
    this.connected = false;
    this.notifyListeners();
  }

  getAddress(): string | null {
    return this.address;
  }

  isConnected(): boolean {
    return this.connected;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }
}

export const stellarWallet = new StellarWalletManager();
