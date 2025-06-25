// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./MyToken.sol";
import "./Multisig.sol";
import "./MultisigFactory.sol";

/**
 * @title DAO_update - Organización Autónoma Descentralizada (Versión Mejorada)
 * @author Obligatorio 2025 Team
 * @notice Versión mejorada del contrato principal que implementa un sistema de gobernanza descentralizada
 * @dev Esta versión incluye mejoras en los mecanismos de delegación, votación cuadrática y validación de tiempos
 * @custom:security-contact admin@dao-obligatorio.com
 */
contract DAO_update {
    /// @notice Token de gobernanza utilizado para staking y votación
    MyToken public token;
    
    /// @notice Contrato multisig para operaciones administrativas
    address public ownerMultisig;
    
    /// @notice Contrato multisig para operaciones de emergencia
    address public panicMultisig;
    
    /// @notice Factory para crear contratos multisig
    MultisigFactory public multisigFactory;

    /// @notice Indica si el sistema está pausado o no
    /// @dev Inicialmente pausado hasta que se configure completamente
    bool public isPaused = true;

    /// @notice Cantidad mínima de tokens necesarios para poder votar
    uint256 public stakingToVote;
    
    /// @notice Cantidad mínima de tokens necesarios para crear propuestas
    uint256 public stakingToPropose;
    
    /// @notice Tiempo mínimo en segundos que deben permanecer los tokens en staking
    uint256 public minStakingTime;
    
    /// @notice Divisor para ajustar el poder de voto cuadrático
    uint256 public votePowerDivider;
    
    /// @notice Duración en días del período de votación de propuestas
    uint256 public proposalDurationDays;
    
    /// @notice Precio en wei de cada token de gobernanza
    uint256 public tokenPriceInWei;

    /**
     * @notice Estructura para almacenar información de staking
     * @dev Guarda tanto la cantidad de tokens en staking como el momento en que se realizó
     */
    struct StakeInfo {
        uint256 amount;
        uint256 timestamp;
    }

    mapping(address => StakeInfo) public voteStakes;
    mapping(address => StakeInfo) public proposalStakes;


    modifier onlyOwner() {
        require(msg.sender == ownerMultisig, "Not owner");
        _;
    }

    modifier onlyPanic() {
        require(msg.sender == panicMultisig, "Not panic multisig");
        _;
    }

    modifier daoActive() {
        require(!isPaused, "DAO is paused");
        _;
    }

    /**
     * @dev Constructor que establece el token y crea la factory para multisig
     * @param _tokenAddress Dirección del contrato de token
     */
    constructor(address _tokenAddress) {
        token = MyToken(_tokenAddress);
        multisigFactory = new MultisigFactory();
    }

    /**
     * @dev Crea un multisig para operaciones de propietario
     * @param owners Array de direcciones que serán propietarios del multisig
     * @param requiredApprovals Número de aprobaciones necesarias
     */
    function setOwnerMultisig(address[] memory owners, uint requiredApprovals) external {
        require(ownerMultisig == address(0), "Owner multisig already set");
        ownerMultisig = multisigFactory.createMultisig(owners, requiredApprovals);
    }

    /**
     * @dev Crea un multisig para operaciones de emergencia (panic button)
     * @param owners Array de direcciones que serán propietarios del multisig
     * @param requiredApprovals Número de aprobaciones necesarias
     */
    function setPanicMultisig(address[] memory owners, uint requiredApprovals) external onlyOwner {
        require(panicMultisig == address(0), "Panic multisig already set");
        panicMultisig = multisigFactory.createMultisig(owners, requiredApprovals);
    }

    /**
     * @dev Método legacy para compatibilidad
     */
    function setOwner(address _owner) external {
        // Esta función solo debe ser utilizable si aún no hay un multisig de propietario
        require(ownerMultisig == address(0), "Owner already set");
        ownerMultisig = _owner;
    }

    /**
     * @dev Método legacy para compatibilidad
     */
    function setPanicWallet(address _panicWallet) external onlyOwner {
        require(_panicWallet != address(0), "Invalid address");
        panicMultisig = _panicWallet;
    }

    /**
     * @dev Inicializa los parámetros de la DAO
     */
    function initParameters(
        uint256 _stakingToVote,
        uint256 _stakingToPropose,
        uint256 _minStakingTime,
        uint256 _votePowerDivider,
        uint256 _proposalDurationDays,
        uint256 _tokenPriceInWei
    ) external onlyOwner {
        stakingToVote = _stakingToVote;
        stakingToPropose = _stakingToPropose;
        minStakingTime = _minStakingTime;
        votePowerDivider = _votePowerDivider;
        proposalDurationDays = _proposalDurationDays;
        tokenPriceInWei = _tokenPriceInWei;
    }

    /**
     * @notice Activa el modo de emergencia, pausando todas las operaciones de la DAO
     * @dev Pausa la DAO para prevenir posibles ataques o vulnerabilidades
     * @custom:security Esta función es crítica para la seguridad y solo puede ser llamada 
     * por el multisig de propietario
     * @custom:requirement El multisig de pánico debe estar configurado previamente
     */
    function panic() external onlyOwner {
        require(panicMultisig != address(0), "Panic wallet not set");
        isPaused = true;
    }

    /**
     * @notice Desactiva el modo de emergencia, permitiendo que la DAO vuelva a operar
     * @dev Solo puede ser llamada por el multisig de pánico, como medida de seguridad
     */
    function tranquility() external onlyPanic {
        isPaused = false;
    }

    /**
     * @dev Evento emitido cuando se compran tokens
     */
    event TokensPurchased(address indexed buyer, uint256 amount, uint256 cost);

    /**
     * @dev Habilita a los usuarios depositar tokens para obtener derecho a votar
     * @param amount Cantidad de tokens a depositar
     */
    function stakeForVote(uint256 amount) external daoActive {
        require(amount >= stakingToVote, "Insufficient amount");
        require(voteStakes[msg.sender].amount == 0, "Already staked");
        
        token.transferFrom(msg.sender, address(this), amount);
        voteStakes[msg.sender] = StakeInfo(amount, block.timestamp);
    }

    /**
     * @dev Habilita a los usuarios depositar tokens para poder crear propuestas
     * @param amount Cantidad de tokens a depositar
     */
    function stakeForProposal(uint256 amount) external daoActive {
        require(amount >= stakingToPropose, "Insufficient amount");
        require(proposalStakes[msg.sender].amount == 0, "Already staked");
        
        token.transferFrom(msg.sender, address(this), amount);
        proposalStakes[msg.sender] = StakeInfo(amount, block.timestamp);
    }

    /**
     * @dev Permite retirar tokens depositados para votar
     */
    function unstakeVote() external {
        StakeInfo storage stake = voteStakes[msg.sender];
        require(stake.amount > 0, "No tokens staked");
        require(block.timestamp >= stake.timestamp + minStakingTime, "Minimum staking time not met");
        
        uint256 amount = stake.amount;
        delete voteStakes[msg.sender];
        token.transfer(msg.sender, stake.amount);
    }

    /**
     * @dev Permite retirar tokens depositados para crear propuestas
     */
    function unstakeProposal() external {
        StakeInfo storage stake = proposalStakes[msg.sender];
        require(stake.amount > 0, "No tokens staked");
        require(block.timestamp >= stake.timestamp + minStakingTime, "Minimum staking time not met");
        
        delete proposalStakes[msg.sender];
        token.transfer(msg.sender, stake.amount);
    }

    // ----- PROPOSAL MANAGEMENT -----

    /**
     * @notice Estructura que almacena la información de una propuesta
     * @dev Incluye tanto los datos de la propuesta como el estado de votación y ejecución
     */
    struct Proposal {
        /// @notice Descripción de la propuesta
        string description;
        
        /// @notice Autor de la propuesta
        address author;
        
        /// @notice Timestamp en que se creó la propuesta
        uint256 creationTime;
        
        /// @notice Total de votos a favor (ponderados por poder de voto)
        uint256 votesFor;
        
        /// @notice Total de votos en contra (ponderados por poder de voto)
        uint256 votesAgainst;
        
        /// @notice Indica si la propuesta ha sido ejecutada
        bool executed;
    }

    /// @notice Array con todas las propuestas creadas
    Proposal[] public proposals;
    
    /// @notice Registro de votos: proposalId => voter => ha votado
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    /**
     * @notice Crea una nueva propuesta
     * @dev Requiere que el creador tenga suficiente stake y guarda la propuesta
     * @param description Texto descriptivo de la propuesta
     * @return uint256 El ID de la propuesta creada
     * @custom:requirement El autor debe tener suficiente stake para proponer
     */
    function createProposal(string memory description) external daoActive returns (uint256) {
        require(proposalStakes[msg.sender].amount >= stakingToPropose, "Insufficient stake to propose");
        
        Proposal memory newProposal = Proposal({
            description: description,
            author: msg.sender,
            creationTime: block.timestamp,
            votesFor: 0,
            votesAgainst: 0,
            executed: false
        });
        
        proposals.push(newProposal);
        return proposals.length - 1;
    }

    /**
     * @notice Verifica si el período de votación de una propuesta sigue activo
     * @dev Calcula el tiempo desde la creación y compara con la duración configurada
     * @param proposalId ID de la propuesta a verificar
     * @return bool True si el período de votación está activo, false en caso contrario
     */
    function isVotingPeriodActive(uint256 proposalId) public view returns (bool) {
        require(proposalId < proposals.length, "Invalid proposal");
        Proposal storage prop = proposals[proposalId];
        uint256 endTime = prop.creationTime + (proposalDurationDays * 1 days);
        return !prop.executed && block.timestamp < endTime;
    }

    /**
     * @notice Ejecuta una propuesta aprobada
     * @dev Verifica que la propuesta haya sido aprobada y marca como ejecutada
     * @param proposalId ID de la propuesta a ejecutar
     * @custom:requirement La propuesta debe existir, no estar ejecutada, y tener más votos a favor que en contra
     */
    function executeProposal(uint256 proposalId) external daoActive {
        require(proposalId < proposals.length, "Invalid proposal");
        require(!proposals[proposalId].executed, "Already executed");
        
        Proposal storage prop = proposals[proposalId];
        
        uint256 endTime = prop.creationTime + (proposalDurationDays * 1 days);
        require(block.timestamp >= endTime, "Proposal still active");
        
        require(prop.votesFor > prop.votesAgainst, "Proposal not approved");
        
        prop.executed = true;
    }

    /**
     * @notice Obtiene el número total de propuestas creadas
     * @dev Retorna la longitud del array de propuestas
     * @return uint256 Número total de propuestas
     */
    function getProposalsCount() external view returns (uint256) {
        return proposals.length;
    }

    // ----- DELEGATION SYSTEM -----

    /// @notice Mapa de delegaciones generales: delegador => delegado
    mapping(address => address) public delegates;
    
    /// @notice Lista de todos los delegadores activos
    address[] public allDelegators;

    /**
     * @notice Delega el voto general a otro usuario
     * @dev Registra la delegación y verifica que no haya ciclos
     * @param to Dirección a la que se delega el voto
     * @custom:requirement No se puede delegar a uno mismo ni crear ciclos de delegación
     */
    function delegate(address to) external daoActive {
        require(to != msg.sender, "Cannot delegate to self");
        
        // Verificar que no se cree un ciclo de delegación
        address current = to;
        uint maxDepth = 10; // Evita bucles infinitos
        for (uint i = 0; i < maxDepth; i++) {
            if (delegates[current] == address(0)) break;
            current = delegates[current];
            require(current != msg.sender, "Circular delegation not allowed");
        }

        if (delegates[msg.sender] == address(0)) {
            allDelegators.push(msg.sender);
        }
        delegates[msg.sender] = to;
    }

    /**
     * @notice Calcula el delegado efectivo para un usuario (siguiendo la cadena de delegación)
     * @dev Sigue la cadena de delegación hasta encontrar un usuario que no haya delegado
     * @param delegator Usuario del que queremos encontrar el delegado efectivo
     * @return address El delegado efectivo final
     */
    function getEffectiveDelegate(address delegator) public view returns (address) {
        address currentDelegate = delegates[delegator];
        if (currentDelegate == address(0)) return delegator;
        
        // Prevent infinite loops by limiting delegation depth
        uint256 maxDepth = 10;
        address[] memory path = new address[](maxDepth);
        uint256 depth = 0;
        
        while (currentDelegate != address(0) && depth < maxDepth) {
            // Check for cycles
            for (uint256 i = 0; i < depth; i++) {
                if (path[i] == currentDelegate) {
                    return currentDelegate; // Return last valid delegate if cycle is detected
                }
            }
            
            path[depth] = currentDelegate;
            depth++;
            
            address nextDelegate = delegates[currentDelegate];
            if (nextDelegate == address(0)) break;
            currentDelegate = nextDelegate;
        }
        
        return currentDelegate;
    }

    /**
     * @notice Obtiene el poder de voto total de un usuario
     * @dev Calcula el poder de voto cuadrático incluyendo todas las delegaciones
     * @param user Dirección del usuario
     * @return uint256 Poder de voto total (incluye factor de normalización)
     */
    function getVotingPower(address user) public view returns (uint256) {
        uint256 power = voteStakes[user].amount;

        for (uint i = 0; i < allDelegators.length; i++) {
            address delegator = allDelegators[i];
            if (getEffectiveDelegate(delegator) == user) {
                power += voteStakes[delegator].amount;
            }
        }

        // Implementación del voto cuadrático: Poder de voto = sqrt(tokens)
        return sqrt(power) * 1e9 / votePowerDivider;
    }
    
    /**
     * @dev Calcula la raiz cuadrada de un numero usando el metodo de Newton-Raphson
     * @param x Numero del que calcular la raiz cuadrada
     * @return y Raiz cuadrada de x
     */
    function sqrt(uint256 x) internal pure returns (uint256) {
        if (x == 0) return 0;
        
        uint256 z = (x + 1) / 2;
        uint256 y = x;
        
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
        
        return y;
    }

    // ----- PROPOSAL-SPECIFIC DELEGATION -----

    /// @notice Mapeo de delegaciones específicas por propuesta: proposalId => delegador => delegado
    mapping(uint256 => mapping(address => address)) public delegatedVote;
    
    /// @notice Registro de delegadores por propuesta
    mapping(uint256 => address[]) public delegatorsPerProposal;

    /**
     * @notice Delega el voto para una propuesta específica
     * @dev Registra la delegación para la propuesta indicada
     * @param proposalId ID de la propuesta para la que se delega
     * @param to Dirección a la que se delega el voto
     * @custom:requirement La propuesta debe existir y no se puede delegar dos veces
     */
    function delegateVoteForProposal(uint256 proposalId, address to) external daoActive {
        require(proposalId < proposals.length, "Invalid proposal");
        require(to != msg.sender, "Cannot delegate to self");
        require(delegatedVote[proposalId][msg.sender] == address(0), "Already delegated");
        require(isVotingPeriodActive(proposalId), "Voting period ended");

        // Verificar que no se cree un ciclo de delegación para esta propuesta
        address current = to;
        uint maxDepth = 10;
        for (uint i = 0; i < maxDepth; i++) {
            if (delegatedVote[proposalId][current] == address(0)) break;
            current = delegatedVote[proposalId][current];
            require(current != msg.sender, "Circular delegation not allowed");
        }

        delegatedVote[proposalId][msg.sender] = to;
        delegatorsPerProposal[proposalId].push(msg.sender);
    }

    /**
     * @notice Calcula el delegado efectivo para una propuesta específica
     * @dev Sigue la cadena de delegación para la propuesta hasta encontrar un usuario que no haya delegado
     * @param proposalId ID de la propuesta
     * @param delegator Usuario del que queremos encontrar el delegado efectivo
     * @return address El delegado efectivo final para esta propuesta
     */
    function getEffectiveDelegateForProposal(uint256 proposalId, address delegator) public view returns (address) {
        address currentDelegate = delegatedVote[proposalId][delegator];
        if (currentDelegate == address(0)) return delegator;
        
        uint256 maxDepth = 10;
        address[] memory path = new address[](maxDepth);
        uint256 depth = 0;
        
        while (currentDelegate != address(0) && depth < maxDepth) {
            // Check for cycles
            for (uint256 i = 0; i < depth; i++) {
                if (path[i] == currentDelegate) {
                    return currentDelegate; // Return last valid delegate if cycle is detected
                }
            }
            
            path[depth] = currentDelegate;
            depth++;
            
            address nextDelegate = delegatedVote[proposalId][currentDelegate];
            if (nextDelegate == address(0)) break;
            currentDelegate = nextDelegate;
        }
        
        return currentDelegate;
    }

    /**
     * @notice Vota en una propuesta
     * @dev Aplica votación cuadrática y acumula delegaciones
     * @param proposalId ID de la propuesta en la que votar
     * @param inFavor True para votar a favor, false para votar en contra
     * @custom:requirement El votante debe tener stake o delegaciones, y no haber votado antes
     */
    function voteProposal(uint256 proposalId, bool inFavor) external daoActive {
        require(proposalId < proposals.length, "Invalid proposal");
        require(!hasVoted[proposalId][msg.sender], "Already voted");
        require(isVotingPeriodActive(proposalId), "Voting period ended");
        require(getEffectiveDelegate(msg.sender) == msg.sender, "Cannot vote after delegating");

        uint256 totalPower = 0;

        // Voto propio
        if (voteStakes[msg.sender].amount >= stakingToVote) {
            totalPower += sqrt(voteStakes[msg.sender].amount);
        }

        // Votos delegados (para esta propuesta)
        for (uint i = 0; i < delegatorsPerProposal[proposalId].length; i++) {
            address delegator = delegatorsPerProposal[proposalId][i];

            if (getEffectiveDelegateForProposal(proposalId, delegator) == msg.sender) {
                if (voteStakes[delegator].amount >= stakingToVote) {
                    totalPower += sqrt(voteStakes[delegator].amount);
                }
            }
        }

        // Votos delegados generales
        for (uint i = 0; i < allDelegators.length; i++) {
            address delegator = allDelegators[i];
            
            // Solo considerar si no tiene delegación específica para esta propuesta
            if (delegatedVote[proposalId][delegator] == address(0)) {
                if (getEffectiveDelegate(delegator) == msg.sender) {
                    if (voteStakes[delegator].amount >= stakingToVote) {
                        totalPower += sqrt(voteStakes[delegator].amount);
                    }
                }
            }
        }

        require(totalPower > 0, "No voting power");

        if (inFavor) {
            proposals[proposalId].votesFor += totalPower;
        } else {
            proposals[proposalId].votesAgainst += totalPower;
        }

        hasVoted[proposalId][msg.sender] = true;
    }

    // ----- TOKEN PURCHASE -----

    /**
     * @notice Compra tokens enviando ETH
     * @dev Calcula la cantidad de tokens según el precio configurado
     * @custom:requirement El contrato debe estar activo y el precio debe ser mayor que cero
     */
    function buyTokens() external payable daoActive {
        require(msg.value > 0, "ETH amount must be greater than 0");
        require(tokenPriceInWei > 0, "Token price not set");
        
        uint256 tokenAmount = (msg.value * 1e18) / tokenPriceInWei;
        
        token.mint(msg.sender, tokenAmount);
    }
    
    /**
     * @notice Retira ETH del contrato
     * @dev Solo el owner puede retirar fondos
     * @param to Dirección a la que se envían los fondos
     * @param amount Cantidad de ETH a enviar
     * @custom:requirement Solo puede ser llamada por el owner
     */
    function withdrawETH(address payable to, uint256 amount) external onlyOwner {
        require(address(this).balance >= amount, "Insufficient balance");
        to.transfer(amount);
    }
    
    /**
     * @notice Función para recibir ETH
     * @dev Permite que el contrato reciba ETH
     */
    receive() external payable {}
}
