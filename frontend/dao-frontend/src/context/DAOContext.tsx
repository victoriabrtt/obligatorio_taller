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
  isPaused: boolean; // Estado de pausa de la DAO
  refreshData: () => Promise<void>;
  connectWallet: () => Promise<boolean>; // Función para conectar la cartera
  account: string | null; // Alias para address, para mantener compatibilidad con componentes
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
  const [isPaused, setIsPaused] = useState<boolean>(false);
  
  // Crear instancia del servicio DAO
  const [daoService] = useState<DAOService>(new DAOService());

  // Función para conectar la cartera con timeout
  const connectWallet = async () => {
    try {
      setError(null);
      
      // Verificar si existe window.ethereum (MetaMask u otro wallet compatible)
      if (!window.ethereum) {
        throw new Error("No se encontró un proveedor de Web3. Instala MetaMask u otro proveedor compatible.");
      }
      
      console.log("Solicitando acceso a cuentas de MetaMask...");
      
      // Implementar timeout para la solicitud de cuentas
      const requestAccountsWithTimeout = async (timeout = 15000) => {
        return Promise.race([
          window.ethereum!.request({ method: 'eth_requestAccounts' }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Timeout: MetaMask está tardando demasiado. Intenta abrir MetaMask manualmente.")), timeout)
          )
        ]);
      };
      
      // Solicitar acceso a la cuenta con timeout
      const accounts = await requestAccountsWithTimeout();
      
      if (accounts.length === 0) {
        throw new Error("No se seleccionó ninguna cuenta. Por favor autoriza el acceso desde tu cartera.");
      }
      
      console.log("MetaMask respondió correctamente, cuenta seleccionada:", accounts[0]);
      
      // Crear proveedor y signer
      let provider = new ethers.BrowserProvider(window.ethereum);
      
      // IMPORTANTE: Verificar que estamos en la red correcta (Hardhat Local)
      const network = await provider.getNetwork();
      console.log("Red conectada:", network.name, "chainId:", network.chainId);
      
      // Hardhat chainId es 31337
      if (Number(network.chainId) !== 31337) {
        // Intentar cambiar a la red Hardhat
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x7A69' }], // 31337 en hexadecimal
          });
          // Actualizar el provider después del cambio
          const updatedProvider = new ethers.BrowserProvider(window.ethereum);
          const updatedNetwork = await updatedProvider.getNetwork();
          console.log("Red cambiada a:", updatedNetwork.name, "chainId:", updatedNetwork.chainId);
          
          if (Number(updatedNetwork.chainId) !== 31337) {
            throw new Error("No se pudo cambiar a la red Hardhat Local");
          }
          
          provider = updatedProvider;
        } catch (switchError: any) {
          // Si el usuario rechaza el cambio o la red no existe
          if (switchError.code === 4902 || switchError.code === -32603) {
            alert("Por favor, agrega la red Hardhat Local en MetaMask con estos datos:\n\nNombre de la red: Hardhat Local\nURL RPC: http://127.0.0.1:8545\nChain ID: 31337\nSímbolo de la moneda: ETH\n\nLuego vuelve a intentar conectarte.");
          } else {
            alert("Por favor, selecciona la red Hardhat Local en MetaMask para usar esta aplicación.\n\nSi no ves esta red, agrégala con los siguientes datos:\nURL RPC: http://127.0.0.1:8545\nChain ID: 31337");
          }
          throw new Error("Red incorrecta. Debe usar Hardhat Local (Chain ID: 31337)");
        }
      }
      
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();
      
      console.log("Wallet conectada:", userAddress);
      
      // Inicializar el servicio DAO con el signer
      await daoService.initialize(provider);
      
      setConnected(true);
      setAddress(userAddress);
      
      // Cargar datos del usuario
      await refreshData();
      
      return true;
    } catch (err: any) {
      console.error("Error al conectar wallet:", err);
      
      // Mensajes de error más específicos y soluciones
      let errorMessage = "Error al conectar con la cartera";
      
      if (err.message?.includes("User rejected")) {
        errorMessage = "Has rechazado la conexión en MetaMask. Por favor, aprueba la conexión para continuar.";
      } else if (err.message?.includes("Timeout")) {
        errorMessage = "MetaMask no respondió a tiempo. Prueba estas soluciones:\n" +
          "1. Abre MetaMask manualmente haciendo clic en su icono\n" +
          "2. Si está bloqueado, desbloquéalo\n" +
          "3. Reinicia el navegador si MetaMask sigue sin responder\n" +
          "4. Asegúrate de que MetaMask esté actualizado";
      } else if (err.code === -32002) {
        errorMessage = "Ya hay una solicitud de MetaMask pendiente. Por favor, abre MetaMask y completa la solicitud pendiente.";
      } else if (err.code === 4001) {
        errorMessage = "Has rechazado la solicitud de conexión en MetaMask.";
      } else if (err.message?.includes("Red incorrecta")) {
        errorMessage = "Debes conectarte a la red Hardhat Local (Chain ID: 31337). Verifica tu configuración de MetaMask.";
      }
      
      setError(errorMessage);
      alert(errorMessage);
      setConnected(false);
      return false;
    }
  };

  // Inicializamos en modo solo lectura por defecto
  useEffect(() => {
    const initializeDAO = async () => {
      try {
        console.log("Inicialización en modo solo lectura");
        
        // Usar proveedor de solo lectura configurado para Hardhat
        console.log("Conectando con el nodo local de Hardhat...");
        const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
        
        // Añadir timeout para la conexión al proveedor
        const networkPromise = Promise.race([
          provider.getNetwork(),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error("Timeout: No se pudo conectar al nodo local de Hardhat")), 5000)
          )
        ]);
        
        try {
          // Verificar que estamos conectados a la red correcta
          const network = await networkPromise;
          console.log("Red conectada (solo lectura):", network.name, "chainId:", Number(network.chainId));
          
          if (Number(network.chainId) !== 31337) {
            console.warn("La red local no parece ser Hardhat (Chain ID 31337). Puede haber problemas de compatibilidad.");
          }
          
          await daoService.initializeReadOnly(provider);
          console.log("DAO inicializado en modo solo lectura");
          
          // Cargar datos iniciales
          await refreshData();
        } catch (networkError) {
          console.error("Error conectando con Hardhat:", networkError);
          alert("No se pudo conectar al nodo local de Hardhat. Asegúrate de que el nodo esté ejecutándose con 'npx hardhat node'");
          setError("No se pudo conectar al nodo local de Hardhat. Ejecuta 'npx hardhat node' en una terminal.");
        }
        
        // Intentar detectar si hay una wallet conectada
        if (window.ethereum) {
          try {
            console.log("Verificando cuentas conectadas en MetaMask...");
            const accountsPromise = Promise.race([
              window.ethereum!.request({ method: 'eth_accounts' }),
              new Promise<string[]>((resolve) => 
                setTimeout(() => {
                  console.log("Timeout al obtener cuentas de MetaMask");
                  resolve([]); // En lugar de rechazar, devolvemos un array vacío
                }, 3000)
              )
            ]);
            
            const accounts = await accountsPromise;
            if (accounts && accounts.length > 0) {
              console.log("Cuenta detectada, intentando conexión automática:", accounts[0]);
              // Ya hay una wallet conectada, conectar automáticamente
              await connectWallet();
            } else {
              console.log("No se detectaron cuentas conectadas en MetaMask");
            }
          } catch (err) {
            console.log("Error al verificar wallet conectada:", err);
          }
        } else {
          console.log("No se detectó proveedor de Ethereum (MetaMask)");
        }
      } catch (err: any) {
        console.error('Error inicializando DAO:', err);
        setError(err.message || 'Error al inicializar');
      }
    };
    
    initializeDAO();
  }, []);

  // Refrescar datos de usuario y DAO
  const refreshData = async () => {
    // Quitar esta verificación para que siempre refresque los datos
    // if (!connected) return;
    
    try {
      console.log("Refrescando datos desde el DAO...");
      
      // Verificar que el servicio esté inicializado
      if (!daoService.isInitialized()) {
        console.log("DAO no inicializado, reinicializando...");
        const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
        await daoService.initializeReadOnly(provider);
      }
      
      // Comprobar si la DAO está pausada
      const daoIsPaused = await daoService.getIsPaused();
      console.log("Estado de pausa de la DAO:", daoIsPaused ? "PAUSADA" : "ACTIVA");
      setIsPaused(daoIsPaused);
      
      // Obtener balance de tokens
      const balance = await daoService.getTokenBalance();
      console.log("Balance de tokens:", balance);
      setTokenBalance(balance);
      
      // Obtener datos de staking
      const voteStakeInfo = await daoService.getVoteStakeInfo();
      console.log("Información de stake para votar:", voteStakeInfo);
      setVoteStake(voteStakeInfo);
      
      const proposalStakeInfo = await daoService.getProposalStakeInfo();
      console.log("Información de stake para propuestas:", proposalStakeInfo);
      setProposalStake(proposalStakeInfo);
      
      // Obtener propuestas
      const allProposals = await daoService.getAllProposals();
      console.log("Propuestas recuperadas:", allProposals.length);
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
    account: address, // Proporcionar account como alias de address
    error,
    daoService,
    tokenBalance,
    voteStake,
    proposalStake,
    proposals,
    isPaused, // Estado de pausa de la DAO
    refreshData,
    connectWallet,
  };

  return <DAOContext.Provider value={contextValue}>{children}</DAOContext.Provider>;
};
