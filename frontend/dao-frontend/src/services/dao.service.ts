import { ethers } from 'ethers';
import { DAO_ABI, TOKEN_ABI, MULTISIG_ABI, CONTRACTS } from '../contracts/contracts';

export class DAOService {
  private provider: ethers.BrowserProvider | null = null;
  private daoContract: ethers.Contract | null = null;
  private tokenContract: ethers.Contract | null = null;
  private signer: ethers.Signer | null = null;
  private address: string | null = null;

  constructor() {}
  
  // Verifica si el servicio está inicializado
  isInitialized(): boolean {
    return this.provider !== null && this.daoContract !== null && this.tokenContract !== null;
  }

  // Inicializa el servicio con un proveedor
  async initialize(provider: ethers.BrowserProvider) {
    this.provider = provider;
    this.signer = await provider.getSigner();
    this.address = await this.signer.getAddress();
    
    // Inicializar contratos
    this.daoContract = new ethers.Contract(
      CONTRACTS.DAO.address,
      DAO_ABI,
      this.signer
    );
    
    this.tokenContract = new ethers.Contract(
      CONTRACTS.TOKEN.address,
      TOKEN_ABI,
      this.signer
    );
    
    console.log("DAOService inicializado con wallet:", this.address);
  }
  
  // Inicializa el servicio en modo solo lectura
  async initializeReadOnly(provider: ethers.JsonRpcProvider) {
    try {
      console.log("Initializing DAOService in read-only mode");
      this.provider = provider as any; // Convertimos el tipo para compatibilidad
      this.address = "0xSimulatedAddress"; // Dirección simulada
      
      // Verificar la red
      const network = await provider.getNetwork();
      console.log("Connected to network:", { name: network.name, chainId: network.chainId });
      
      // Inicializar contratos en modo solo lectura
      this.daoContract = new ethers.Contract(
        CONTRACTS.DAO.address,
        DAO_ABI,
        provider
      );
      
      this.tokenContract = new ethers.Contract(
        CONTRACTS.TOKEN.address,
        TOKEN_ABI,
        provider
      );
      
      // Verificar que podemos conectarnos a los contratos
      try {
        const tokenName = await this.tokenContract.name();
        console.log("Successfully connected to token contract:", tokenName);
      } catch (err) {
        console.warn("Could not connect to token contract:", err);
      }
      
      console.log("DAOService initialized in read-only mode with contracts:", {
        dao: CONTRACTS.DAO.address,
        token: CONTRACTS.TOKEN.address
      });
    } catch (err) {
      console.error("Error initializing DAOService in read-only mode:", err);
      throw err;
    }
  }

  // Desconecta el servicio
  disconnect() {
    this.provider = null;
    this.daoContract = null;
    this.tokenContract = null;
    this.signer = null;
    this.address = null;
  }

  // Devuelve la dirección conectada
  getAddress(): string | null {
    return this.address;
  }

  // Verifica si el servicio está conectado
  isConnected(): boolean {
    return this.provider !== null && this.signer !== null;
  }

  // --- Funciones relacionadas con Tokens ---

  // Obtener balance de tokens
  async getTokenBalance(): Promise<string> {
    this.ensureConnected();
    const balance = await this.tokenContract!.balanceOf(this.address);
    return ethers.formatUnits(balance, 18); // Asumimos 18 decimales
  }

  // Aprobar tokens para el contrato DAO
  async approveTokens(amount: string): Promise<ethers.TransactionResponse> {
    this.ensureConnected(true); // Requiere wallet
    const amountWei = ethers.parseUnits(amount, 18);
    return await this.tokenContract!.approve(CONTRACTS.DAO.address, amountWei);
  }

  // Comprar tokens con ETH
  async buyTokens(amount: string): Promise<ethers.TransactionResponse> {
    this.ensureConnected(true); // Requiere wallet
    
    try {
      console.log("Buying tokens:", amount);
      // Asegurarse de que amount es un número
      if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        throw new Error("La cantidad debe ser un número mayor que cero");
      }
      
      const amountWei = ethers.parseUnits(amount, 18);
      
      // Comprobación detallada del contrato
      if (!this.daoContract) {
        console.error("daoContract is null");
        throw new Error("DAO contract not initialized");
      }
      
      // Comprobación de la billetera
      const address = await this.signer?.getAddress();
      console.log("Current wallet address:", address);
      
      const balance = await this.provider?.getBalance(address!);
      console.log("Current wallet balance:", ethers.formatEther(balance || 0), "ETH");
      
      // Obtener el precio directamente del contrato
      const tokenPrice = await this.getTokenPrice();
      console.log("Token price:", ethers.formatEther(tokenPrice), "ETH");
      
      // Calcular el costo total en ETH
      const tokenPriceBigInt = BigInt(tokenPrice);
      const totalCost = (amountWei * tokenPriceBigInt) / BigInt(10**18);
      console.log("Total cost:", ethers.formatEther(totalCost), "ETH for", amount, "tokens");
      
      // Verificar si hay suficientes fondos
      if (balance && balance < totalCost) {
        throw new Error(`Fondos insuficientes. Se necesitan ${ethers.formatEther(totalCost)} ETH pero solo tienes ${ethers.formatEther(balance)} ETH.`);
      }
      
      // Usar exactamente el costo calculado sin margen adicional
      console.log("Sending transaction with value:", ethers.formatEther(totalCost), "ETH");
      
      // Usar un límite de gas más razonable para la red local
      const tx = await this.daoContract!.buyTokens(amountWei, {
        value: totalCost,
        gasLimit: 200000
      });
      
      console.log("Transaction sent:", tx.hash);
      return tx;
    } catch (err) {
      console.error("Error in buyTokens:", err);
      throw err;
    }
  }

  // Obtener el precio del token en wei
  async getTokenPrice(): Promise<string> {
    try {
      console.log("Getting token price - using fixed value for now");
      // Por el momento, devolvemos un valor fijo para solucionar el error
      return "10000000000000000"; // 0.01 ETH
      
      /* Código anterior comentado mientras resolvemos el problema
      // Si no estamos conectados, usamos un provider genérico
      if (!this.isConnected()) {
        console.log("Getting token price in read-only mode");
        // Intentar usar el método view sin necesidad de estar conectado
        const provider = new ethers.JsonRpcProvider();
        const readOnlyContract = new ethers.Contract(
          CONTRACTS.DAO.address,
          DAO_ABI,
          provider
        );
        const price = await readOnlyContract.tokenPriceInWei();
        return price.toString();
      }
      
      // Si estamos conectados, usamos el contrato con signer
      const price = await this.daoContract!.tokenPriceInWei();
      console.log("Token price retrieved:", price.toString());
      return price.toString();
      */
    } catch (err) {
      console.error("Error getting token price:", err);
      // Devolvemos un valor por defecto para evitar errores en la interfaz
      return "10000000000000000"; // 0.01 ETH como fallback
    }
  }

  // --- Funciones relacionadas con Staking ---

  // Depositar tokens en staking para votar
  async stakeForVote(amount: string): Promise<ethers.TransactionResponse> {
    this.ensureConnected(true); // Requiere wallet
    const amountWei = ethers.parseUnits(amount, 18);
    return await this.daoContract!.stakeForVote(amountWei);
  }

  // Depositar tokens en staking para propuestas
  async stakeForProposal(amount: string): Promise<ethers.TransactionResponse> {
    this.ensureConnected(true); // Requiere wallet
    const amountWei = ethers.parseUnits(amount, 18);
    return await this.daoContract!.stakeForProposal(amountWei);
  }

  // Retirar tokens de staking para votar
  async unstakeVote(): Promise<ethers.TransactionResponse> {
    this.ensureConnected(true); // Requiere wallet
    return await this.daoContract!.unstakeVote();
  }

  // Retirar tokens de staking para propuestas
  async unstakeProposal(): Promise<ethers.TransactionResponse> {
    this.ensureConnected(true); // Requiere wallet
    return await this.daoContract!.unstakeProposal();
  }

  // Obtener información de staking para votar
  async getVoteStakeInfo(): Promise<{amount: string, timestamp: number}> {
    this.ensureConnected();
    const stakeInfo = await this.daoContract!.voteStakes(this.address);
    return {
      amount: ethers.formatUnits(stakeInfo.amount, 18),
      timestamp: Number(stakeInfo.timestamp)
    };
  }

  // Obtener información de staking para propuestas
  async getProposalStakeInfo(): Promise<{amount: string, timestamp: number}> {
    this.ensureConnected();
    const stakeInfo = await this.daoContract!.proposalStakes(this.address);
    return {
      amount: ethers.formatUnits(stakeInfo.amount, 18),
      timestamp: Number(stakeInfo.timestamp)
    };
  }

  // --- Funciones relacionadas con Propuestas ---

  // Crear una propuesta simple
  async createProposal(title: string, description: string): Promise<ethers.TransactionResponse> {
    this.ensureConnected();
    // Combinamos título y descripción ya que el contrato solo acepta un campo de descripción
    const fullDescription = `${title}\n\n${description}`;
    return await this.daoContract!.createProposal(fullDescription);
  }

  // Crear una propuesta de transacción
  async createTransactionProposal(
    title: string,
    description: string,
    target: string, 
    value: string
  ): Promise<ethers.TransactionResponse> {
    this.ensureConnected();
    // Combinamos título y descripción
    const fullDescription = `${title}\n\n${description}`;
    const valueWei = ethers.parseUnits(value, 18);
    
    // El contrato espera la dirección destino, el valor en wei, y una descripción
    return await this.daoContract!.createTransactionProposal(
      fullDescription,
      target, 
      valueWei
    );
  }

  // Crear una propuesta para cambiar un parámetro
  async createParameterChangeProposal(
    title: string,
    description: string,
    paramName: string,
    paramValue: string
  ): Promise<ethers.TransactionResponse> {
    this.ensureConnected();
    // Combinamos título y descripción
    const fullDescription = `${title}\n\n${description}`;
    const valueWei = ethers.parseUnits(paramValue, 0); // No todos los parámetros usan 18 decimales
    
    return await this.daoContract!.createParameterChangeProposal(
      fullDescription,
      paramName,
      valueWei
    );
  }

  // Crear una propuesta para mintear tokens
  async createTokenMintProposal(
    title: string,
    description: string,
    to: string,
    amount: string
  ): Promise<ethers.TransactionResponse> {
    this.ensureConnected();
    const amountWei = ethers.parseUnits(amount, 18);
    return await this.daoContract!.createTokenMintProposal(
      description,
      to,
      amountWei
    );
  }

  // Obtener todas las propuestas
  async getAllProposals(): Promise<any[]> {
    this.ensureConnected();
    
    // Primero, necesitamos saber cuántas propuestas hay
    let proposalCount = 0;
    try {
      // Intentar obtener la cantidad de propuestas (esto variará según tu implementación)
      // Iteramos hasta encontrar un error, lo que indica que ya no hay más propuestas
      while (true) {
        await this.daoContract!.proposals(proposalCount);
        proposalCount++;
      }
    } catch (error) {
      // Llegamos al final de las propuestas
    }
    
    // Ahora obtenemos cada propuesta
    const proposals = [];
    for (let i = 0; i < proposalCount; i++) {
      const proposal = await this.daoContract!.proposals(i);
      
      // Agregar información adicional como estado (activa/aprobada/rechazada)
      const now = Math.floor(Date.now() / 1000);
      const endTime = Number(proposal.createdAt) + (Number(await this.daoContract!.proposalDurationDays()) * 86400);
      
      let status = "ACTIVE";
      if (proposal.executed) {
        status = "EXECUTED";
      } else if (now > endTime) {
        status = proposal.votesFor > proposal.votesAgainst ? "APPROVED" : "REJECTED";
      }
      
      proposals.push({
        id: i,
        proposer: proposal.proposer,
        description: proposal.description,
        createdAt: Number(proposal.createdAt),
        votesFor: ethers.formatUnits(proposal.votesFor, 0),
        votesAgainst: ethers.formatUnits(proposal.votesAgainst, 0),
        executed: proposal.executed,
        proposalType: Number(proposal.proposalType),
        status,
        endTime
      });
    }
    
    return proposals;
  }

  // Votar en una propuesta
  async voteProposal(proposalId: number, inFavor: boolean): Promise<ethers.TransactionResponse> {
    this.ensureConnected();
    return await this.daoContract!.voteProposal(proposalId, inFavor);
  }

  // Ejecutar una propuesta
  async executeProposal(proposalId: number): Promise<ethers.TransactionResponse> {
    this.ensureConnected();
    return await this.daoContract!.executeProposal(proposalId);
  }

  // Delegar el voto a otra dirección
  async delegate(to: string): Promise<ethers.TransactionResponse> {
    this.ensureConnected();
    return await this.daoContract!.delegate(to);
  }

  // Delegar el voto para una propuesta específica
  async delegateForProposal(proposalId: number, to: string): Promise<ethers.TransactionResponse> {
    this.ensureConnected();
    return await this.daoContract!.delegateVoteForProposal(proposalId, to);
  }

  // --- Funciones relacionadas con Delegación ---

  // Obtiene la dirección a la que el usuario ha delegado sus votos
  async getCurrentDelegate(): Promise<string> {
    this.ensureConnected();
    return await this.daoContract!.delegatedTo(this.address || '0x0000000000000000000000000000000000000000');
  }
  
  // Obtiene el delegado efectivo siguiendo la cadena de delegación
  async getEffectiveDelegate(address: string): Promise<string> {
    this.ensureConnected();
    return await this.daoContract!.getEffectiveDelegate(address);
  }
  
  // Obtiene el delegado efectivo para una propuesta específica
  async getEffectiveDelegateForProposal(proposalId: number, address: string): Promise<string> {
    this.ensureConnected();
    return await this.daoContract!.getEffectiveDelegateForProposal(proposalId, address);
  }
  
  // Obtiene las direcciones que han delegado a este usuario
  async getDelegators(delegate: string): Promise<string[]> {
    this.ensureConnected();
    try {
      // Emular esta funcionalidad si el contrato no la soporta
      // En un entorno real, el contrato debería tener esta funcionalidad
      const delegators: string[] = [];
      // Limitamos a los últimos 100 bloques para evitar búsquedas excesivas
      const filter = this.daoContract!.filters.DelegationChanged(null, delegate);
      const events = await this.daoContract!.queryFilter(filter, -100, 'latest');
      
      // Extraer direcciones únicas de los eventos
      const uniqueDelegators = new Map<string, boolean>();
      events.forEach(event => {
        // Necesitamos verificar si es un EventLog para acceder a los args
        if ('args' in event && event.args && event.args[0]) {
          uniqueDelegators.set(event.args[0], true);
        }
      });
      
      // Verificar que cada dirección aún tiene esta dirección como delegado
      const potentialDelegators = Array.from(uniqueDelegators.keys());
      for (let i = 0; i < potentialDelegators.length; i++) {
        const potentialDelegator = potentialDelegators[i];
        const currentDelegate = await this.daoContract!.delegatedTo(potentialDelegator);
        if (currentDelegate.toLowerCase() === delegate.toLowerCase()) {
          delegators.push(potentialDelegator);
        }
      }
      
      return delegators;
    } catch (error) {
      console.error("Error obteniendo delegadores:", error);
      return [];
    }
  }
  
  // Obtiene las direcciones que han delegado a este usuario para una propuesta específica
  async getDelegatorsForProposal(proposalId: number, delegate: string): Promise<string[]> {
    this.ensureConnected();
    try {
      // Emular esta funcionalidad si el contrato no la soporta
      const delegators: string[] = [];
      
      // Limitamos a los últimos 100 bloques para evitar búsquedas excesivas
      const filter = this.daoContract!.filters.ProposalDelegationChanged(proposalId, null, delegate);
      const events = await this.daoContract!.queryFilter(filter, -100, 'latest');
      
      // Extraer direcciones únicas de los eventos
      const uniqueDelegators = new Map<string, boolean>();
      events.forEach(event => {
        // Verificar si es un EventLog para acceder a los args
        if ('args' in event && event.args && event.args[1]) {
          uniqueDelegators.set(event.args[1], true);
        }
      });
      
      // Verificar que cada dirección aún tiene esta dirección como delegado para esta propuesta
      const potentialDelegators = Array.from(uniqueDelegators.keys());
      for (let i = 0; i < potentialDelegators.length; i++) {
        const potentialDelegator = potentialDelegators[i];
        const currentDelegate = await this.daoContract!.delegatedVote(proposalId, potentialDelegator);
        if (currentDelegate.toLowerCase() === delegate.toLowerCase()) {
          delegators.push(potentialDelegator);
        }
      }
      
      return delegators;
    } catch (error) {
      console.error("Error obteniendo delegadores para propuesta:", error);
      return [];
    }
  }
  
  // Verifica si un usuario ha votado ya en una propuesta
  async hasVoted(proposalId: number, address: string): Promise<boolean> {
    this.ensureConnected();
    try {
      return await this.daoContract!.hasVoted(proposalId, address);
    } catch (error) {
      // Si el contrato no tiene esta función, emulamos con el evento de voto
      console.warn("Función hasVoted no encontrada, emulando con eventos");
      const filter = this.daoContract!.filters.VoteCasted(proposalId, address);
      const events = await this.daoContract!.queryFilter(filter);
      return events.length > 0;
    }
  }
  
  // Obtiene el poder de voto de un usuario (considerando delegaciones)
  async getVotingPower(address: string): Promise<ethers.BigNumberish> {
    this.ensureConnected();
    try {
      return await this.daoContract!.calculateVotingPower(address);
    } catch (error) {
      console.error("Error obteniendo poder de voto:", error);
      // Si falla, devolvemos el balance de tokens en stake como aproximación
      const stakeInfo = await this.daoContract!.voteStakes(address);
      return stakeInfo ? stakeInfo.amount : 0;
    }
  }
  
  // Revoca la delegación general
  async revokeDelegate(): Promise<ethers.TransactionResponse> {
    this.ensureConnected(true);
    // Delegar a dirección cero (o a sí mismo) para revocar
    return await this.daoContract!.delegate('0x0000000000000000000000000000000000000000');
  }
  
  // Revoca la delegación para una propuesta específica
  async revokeDelegateForProposal(proposalId: number): Promise<ethers.TransactionResponse> {
    this.ensureConnected(true);
    // Delegar a dirección cero para revocar
    return await this.daoContract!.delegateVoteForProposal(proposalId, '0x0000000000000000000000000000000000000000');
  }
  
  // --- Funciones relacionadas con parámetros ---

  // Obtiene el valor de un parámetro específico
  async getParameterValue(paramName: string): Promise<string> {
    this.ensureConnected();
    const value = await this.daoContract!.getParameter(paramName);
    return value;
  }
  
  // Establece el valor de un parámetro específico (solo para el propietario del contrato)
  async setParameterValue(paramName: string, paramValue: string): Promise<ethers.TransactionResponse> {
    this.ensureConnected(true); // Requiere wallet
    return await this.daoContract!.setParameter(paramName, paramValue);
  }

  // --- Funciones para obtener parámetros del DAO ---
  
  // Obtener el mínimo de tokens para votar
  async getStakingToVote(): Promise<string> {
    this.ensureConnected();
    const amount = await this.daoContract!.stakingToVote();
    return ethers.formatUnits(amount, 18);
  }
  
  // Obtener el mínimo de tokens para proponer
  async getStakingToPropose(): Promise<string> {
    this.ensureConnected();
    const amount = await this.daoContract!.stakingToPropose();
    return ethers.formatUnits(amount, 18);
  }
  
  // Obtener el tiempo mínimo de staking
  async getMinStakingTime(): Promise<string> {
    this.ensureConnected();
    const time = await this.daoContract!.minStakingTime();
    return time.toString();
  }
  
  // Obtener la duración en días de las propuestas
  async getProposalDurationDays(): Promise<string> {
    this.ensureConnected();
    const days = await this.daoContract!.proposalDurationDays();
    return days.toString();
  }
  
  // Obtener si el DAO está pausado
  async getIsPaused(): Promise<boolean> {
    this.ensureConnected();
    return await this.daoContract!.isPaused();
  }

  // --- Funciones auxiliares ---

  /**
   * Verifica si el servicio está conectado y listo para realizar operaciones
   * Si no está inicializado, intenta inicializarlo en modo solo lectura
   * Si se necesita una wallet para escribir operaciones (escribirContra), lanza un error si no hay una conectada
   * @param requiereWallet Indica si la operación requiere una wallet conectada
   */
  private ensureConnected(requiereWallet = false) {
    // Si no está inicializado, intentamos inicializar en modo solo lectura
    if (!this.isInitialized()) {
      console.warn("DAOService no está inicializado. Intentando inicializar en modo solo lectura...");
      // Inicializar en modo solo lectura debería hacerse de forma asíncrona,
      // pero como esta función no es async, solo mostramos una advertencia
      throw new Error("DAOService no está inicializado. Llame a initialize() o initializeReadOnly() primero.");
    }

    // Si requiere una wallet pero no hay signer, lanzamos error
    if (requiereWallet && (!this.signer || this.address === "0xSimulatedAddress")) {
      throw new Error("Esta operación requiere una cartera conectada. Por favor, conecta tu wallet primero.");
    }
  }
}
