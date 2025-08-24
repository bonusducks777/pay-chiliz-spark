import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { useNetwork } from '@/lib/network-context';

interface QRCodeGeneratorProps {
  chainId?: number;
  contractAddress: string;
  size?: number;
}

const chainNames: Record<number, string> = {
  88882: 'chiliz', // Chiliz Spicy testnet
  28525: 'circle-layer', // Circle Layer testnet
  56: 'bsc',       // BSC mainnet
  1: 'ethereum',   // Ethereum mainnet
};

export const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ 
  chainId, 
  contractAddress, 
  size = 128 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { networkConfig } = useNetwork();

  useEffect(() => {
    if (canvasRef.current && contractAddress && 
        contractAddress !== '0x0000000000000000000000000000000000000000' && 
        contractAddress !== '') {
      
      let payload;
      
      if (networkConfig.type === 'evm' && chainId) {
        const chainName = chainNames[chainId] || 'unknown';
        payload = {
          type: 'evm',
          chain: chainName,
          chainId: chainId,
          address: contractAddress
        };
      } else if (networkConfig.type === 'stellar') {
        payload = {
          type: 'stellar',
          network: networkConfig.name,
          contractId: contractAddress,
          rpcUrl: networkConfig.rpcUrl
        };
      } else if (networkConfig.type === 'tron') {
        payload = {
          type: 'tron',
          network: networkConfig.name,
          contractAddress: contractAddress,
          rpcUrl: networkConfig.rpcUrl
        };
      } else {
        payload = {
          type: networkConfig.type,
          network: networkConfig.name,
          address: contractAddress
        };
      }

      QRCode.toCanvas(canvasRef.current, JSON.stringify(payload), {
        width: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      }).catch((error) => {
        console.error('Failed to generate QR code:', error);
      });
    }
  }, [chainId, contractAddress, networkConfig]);

  if (!contractAddress || 
      contractAddress === '0x0000000000000000000000000000000000000000' ||
      contractAddress === '') {
    return (
      <div 
        className="flex items-center justify-center border border-dashed border-muted-foreground/30 rounded"
        style={{ width: size, height: size }}
      >
        <span className="text-xs text-muted-foreground text-center">
          No contract<br />deployed
        </span>
      </div>
    );
  }

  return (
    <canvas 
      ref={canvasRef} 
      className="border border-border rounded"
    />
  );
};
