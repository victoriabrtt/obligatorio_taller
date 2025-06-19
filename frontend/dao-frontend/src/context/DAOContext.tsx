import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { DAOService } from '../services/dao.service';

// Definir el tipo para el contexto
interface DAOContextType {
  connected: boolean;
  address: string | null;
  error: string | null;
  daoService: DAOService;
  tokenBalance: string;
  voteStake: { amount: string; timestamp: number };
  proposalStake: { amount: string; timestamp: number };
  proposals: any[];
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
  const [connected, setConnected] = useState<boolean>(true); // Asumimos conectado por defecto
  const [address, setAddress] = useState<string | null>("0x123456789..."); // Dirección de ejemplo
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
  
  // Crear instancia del servicio DAO
  const [daoService] = useState<DAOService>(new DAOService());

  // Inicializamos directamente en algún momento, posiblemente en useEffect
  useEffect(() => {
    const initializeDAO = async () => {
      try {
        // En lugar de esperar una conexión de wallet, ahora inicializamos directamente 
        // con un proveedor de solo lectura (podríamos usar Infura o similar)
        const provider = new ethers.JsonRpcProvider('http://localhost:8545'); // O tu endpoint
        await daoService.initializeReadOnly(provider);
        
        // Actualizar la dirección (podría ser una dirección fija o configurada)
        setAddress(daoService.getAddress() || "0xDemo...Address");
        
        // Cargar datos iniciales
        await refreshData();
      } catch (err: any) {
        console.error('Error inicializando DAO:', err);
        setError(err.message || 'Error al inicializar');
      }
    };
    
    initializeDAO();
  }, []);

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
    address,
    error,
    daoService,
    tokenBalance,
    voteStake,
    proposalStake,
    proposals,
    refreshData,
  };

  return <DAOContext.Provider value={contextValue}>{children}</DAOContext.Provider>;
};
