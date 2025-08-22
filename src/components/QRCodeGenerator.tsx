import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface QRCodeGeneratorProps {
  chainId: number;
  contractAddress: string;
  size?: number;
}

const chainNames: Record<number, string> = {
  88882: 'chiliz', // Chiliz Spicy testnet
  56: 'bsc',       // BSC mainnet
  1: 'ethereum',   // Ethereum mainnet
};

export const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ 
  chainId, 
  contractAddress, 
  size = 128 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && contractAddress && contractAddress !== '0x0000000000000000000000000000000000000000') {
      const chainName = chainNames[chainId] || 'unknown';
      
      const payload = {
        chain: chainName,
        address: contractAddress
      };

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
  }, [chainId, contractAddress]);

  if (!contractAddress || contractAddress === '0x0000000000000000000000000000000000000000') {
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
