import { ethers } from 'ethers';

// Definir el tipo para window.ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}

// Tipos para los proveedores de wallet
export interface WalletInfo {
  name: string;
  connector: () => Promise<ethers.BrowserProvider>;
  icon: string;
  description: string;
}

// Función para conectar con MetaMask
export const connectMetaMask = async (): Promise<ethers.BrowserProvider> => {
  if (window.ethereum) {
    const provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send('eth_requestAccounts', []);
    return provider;
  }
  throw new Error('MetaMask no está instalado');
}

// Función para conectar con WalletConnect (simulada)
export const connectWalletConnect = async (): Promise<ethers.BrowserProvider> => {
  // Aquí normalmente configurarías WalletConnect
  // Por ahora usamos un enfoque simplificado
  if (window.ethereum) {
    const provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send('eth_requestAccounts', []);
    return provider;
  }
  throw new Error('Se requiere un proveedor compatible con Ethereum');
}

// Listado de wallets disponibles
export const wallets: WalletInfo[] = [
  {
    name: 'MetaMask',
    connector: connectMetaMask,
    icon: 'metamask-icon',
    description: 'Conéctate con MetaMask'
  },
  {
    name: 'WalletConnect',
    connector: connectWalletConnect,
    icon: 'walletconnect-icon',
    description: 'Escanea con WalletConnect'
  }
]
