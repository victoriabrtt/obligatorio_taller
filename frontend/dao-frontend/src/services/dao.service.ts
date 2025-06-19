import { ethers } from 'ethers';
import { DAO_ABI, TOKEN_ABI, MULTISIG_ABI, CONTRACTS } from '../contracts/contracts';

export class DAOService {
  private provider: ethers.BrowserProvider | null = null;
  private daoContract: ethers.Contract | null = null;
  private tokenContract: ethers.Contract | null = null;
  private signer: ethers.Signer | null = null;
  private address: string | null = null;

  constructor() {}

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
  }
  
  // Inicializa el servicio en modo solo lectura
  async initializeReadOnly(provider: ethers.JsonRpcProvider) {
    this.provider = provider as any; // Convertimos el tipo para compatibilidad
    this.address = "0xSimulatedAddress"; // Dirección simulada
    
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
    this.ensureConnected();
    const amountWei = ethers.parseUnits(amount, 18);
    return await this.tokenContract!.approve(CONTRACTS.DAO.address, amountWei);
  }

  // Comprar tokens con ETH
  async buyTokens(amount: string): Promise<ethers.TransactionResponse> {
    this.ensureConnected();
    const amountWei = ethers.parseUnits(amount, 18);
    const tokenPrice = await this.daoContract!.tokenPriceInWei();
    const totalEthCost = (tokenPrice * amountWei) / ethers.parseUnits("1", 18);
    
    // Llamar a la función buyTokens con la cantidad de ETH necesaria
    return await this.daoContract!.buyTokens(amountWei, {
      value: totalEthCost
    });
  }

  // Obtener el precio del token en wei
  async getTokenPrice(): Promise<string> {
    this.ensureConnected();
    const price = await this.daoContract!.tokenPriceInWei();
    return price.toString();
  }

  // --- Funciones relacionadas con Staking ---

  // Depositar tokens en staking para votar
  async stakeForVote(amount: string): Promise<ethers.TransactionResponse> {
    this.ensureConnected();
    const amountWei = ethers.parseUnits(amount, 18);
    return await this.daoContract!.stakeForVote(amountWei);
  }

  // Depositar tokens en staking para propuestas
  async stakeForProposal(amount: string): Promise<ethers.TransactionResponse> {
    this.ensureConnected();
    const amountWei = ethers.parseUnits(amount, 18);
    return await this.daoContract!.stakeForProposal(amountWei);
  }

  // Retirar tokens de staking para votar
  async unstakeVote(): Promise<ethers.TransactionResponse> {
    this.ensureConnected();
    return await this.daoContract!.unstakeVote();
  }

  // Retirar tokens de staking para propuestas
  async unstakeProposal(): Promise<ethers.TransactionResponse> {
    this.ensureConnected();
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
    return await this.daoContract!.delegates(this.address);
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

  // Verificar si está conectado
  private ensureConnected() {
    if (!this.isConnected()) {
      throw new Error("DAOService no está conectado. Llame a initialize() primero.");
    }
  }
}
