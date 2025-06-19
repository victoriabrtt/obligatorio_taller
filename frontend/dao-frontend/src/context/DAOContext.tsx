import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { DAOService } from '../services/dao.service';
import { WalletInfo } from '../connectors';

// Definir el tipo para el contexto
interface DAOContextType {
  connected: boolean;
  address: string | null;
  connecting: boolean;
  error: string | null;
  daoService: DAOService;
  tokenBalance: string;
  voteStake: { amount: string; timestamp: number };
  proposalStake: { amount: string; timestamp: number };
  proposals: any[];
  wallet: string | null;
  connect: (walletInfo: WalletInfo) => Promise<void>;
  disconnect: () => void;
  refreshData: () => Promise<void>;
}

// Crear el contexto
const DAOContext = createContext<DAOContextType | undefined>(undefined);

// Hook personalizado para facilitar el uso del contexto
export const useDAO = () => {
  const context = useContext(DAOContext);
  if (context === undefined) {
    throw new Error('useDAO debe ser usado dentro de un DAOProvider');
  }
  return context;
};

// Props para el provider
interface DAOProviderProps {
  children: React.ReactNode;
}

// Provider que encapsula la lógica del contexto
export const DAOProvider: React.FC<DAOProviderProps> = ({ children }) => {
  const [connected, setConnected] = useState<boolean>(false);
  const [connecting, setConnecting] = useState<boolean>(false);
  const [address, setAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tokenBalance, setTokenBalance] = useState<string>('0');
  const [voteStake, setVoteStake] = useState<{ amount: string; timestamp: number }>({
    amount: '0',
    timestamp: 0,
  });
  const [proposalStake, setProposalStake] = useState<{ amount: string; timestamp: number }>({
    amount: '0',
    timestamp: 0,
  });
  const [proposals, setProposals] = useState<any[]>([]);
  const [wallet, setWallet] = useState<string | null>(null);
  
  // Crear instancia del servicio DAO
  const [daoService] = useState<DAOService>(new DAOService());

  // Conectar a wallet
  const connect = async (walletInfo: WalletInfo) => {
    try {
      setConnecting(true);
      setError(null);
      
      const provider = await walletInfo.connector();
      await daoService.initialize(provider);
      
      setConnected(true);
      setAddress(daoService.getAddress());
      setWallet(walletInfo.name);
      
      // Cargar datos iniciales
      await refreshData();
    } catch (err: any) {
      console.error('Error conectando:', err);
      setError(err.message || 'Error al conectar');
    } finally {
      setConnecting(false);
    }
  };

  // Desconectar
  const disconnect = () => {
    daoService.disconnect();
    setConnected(false);
    setAddress(null);
    setWallet(null);
    setTokenBalance('0');
    setVoteStake({ amount: '0', timestamp: 0 });
    setProposalStake({ amount: '0', timestamp: 0 });
    setProposals([]);
  };

  // Refrescar datos de usuario y DAO
  const refreshData = async () => {
    if (!connected) return;
    
    try {
      // Obtener balance de tokens
      const balance = await daoService.getTokenBalance();
      setTokenBalance(balance);
      
      // Obtener datos de staking
      const voteStakeInfo = await daoService.getVoteStakeInfo();
      setVoteStake(voteStakeInfo);
      
      const proposalStakeInfo = await daoService.getProposalStakeInfo();
      setProposalStake(proposalStakeInfo);
      
      // Obtener propuestas
      const allProposals = await daoService.getAllProposals();
      setProposals(allProposals);
    } catch (err: any) {
      console.error('Error refrescando datos:', err);
      setError(err.message || 'Error al refrescar datos');
    }
  };

  // Valor del contexto
  const contextValue: DAOContextType = {
    connected,
    connecting,
    address,
    error,
    daoService,
    tokenBalance,
    voteStake,
    proposalStake,
    proposals,
    wallet,
    connect,
    disconnect,
    refreshData,
  };

  return <DAOContext.Provider value={contextValue}>{children}</DAOContext.Provider>;
};
