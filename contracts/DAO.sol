// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./MyToken.sol";
import "./Multisig.sol";
import "./MultisigFactory.sol";

/**
 * @title DAO - Organización Autónoma Descentralizada
 * @author Obligatorio 2025 Team
 * @notice Contrato principal que implementa un sistema de gobernanza descentralizada
 * @dev Implementa un sistema completo de DAO con staking, propuestas, votación cuadrática 
 * y delegación. Diseñado para el Conjunto A del Obligatorio 2025.
 * @custom:security-contact admin@dao-obligatorio.com
 */
contract DAO {
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
        /// @notice Cantidad de tokens en staking
        uint256 amount;
        
        /// @notice Timestamp (en segundos) cuando se realizó el staking
        uint256 timestamp;
    }

    /// @notice Mapeo de las direcciones a su información de staking para votar
    mapping(address => StakeInfo) public voteStakes;
    
    /// @notice Mapeo de las direcciones a su información de staking para proponer
    mapping(address => StakeInfo) public proposalStakes;


    /**
     * @notice Restringe funciones para que solo sean llamables por el multisig de propietario
     * @dev Verifica que msg.sender sea el contrato de multifirma designado como owner
     */
    modifier onlyOwner() {
        require(msg.sender == ownerMultisig, "Not owner");
        _;
    }

    /**
     * @notice Restringe funciones para que solo sean llamables por el multisig de emergencia
     * @dev Verifica que msg.sender sea el contrato de multifirma designado para emergencias
     */
    modifier onlyPanic() {
        require(msg.sender == panicMultisig, "Not panic multisig");
        _;
    }

    /**
     * @notice Restringe funciones para que solo se ejecuten cuando la DAO está activa
     * @dev Verifica que el contrato no esté en estado pausado
     */
    modifier daoActive() {
        require(!isPaused, "DAO is paused");
        _;
    }

    /**
     * @notice Inicializa el contrato DAO con el token de gobernanza y la fábrica de multisig
     * @dev Establece el token ERC20 y crea una instancia de MultisigFactory
     * @param _tokenAddress Dirección del contrato de token ERC20 para gobernanza
     */
    constructor(address _tokenAddress) {
        token = MyToken(_tokenAddress);
        multisigFactory = new MultisigFactory();
    }

    /**
     * @notice Establece el multisig para operaciones administrativas
     * @dev Crea un nuevo contrato Multisig para operaciones de propietario
     * @param owners Array de direcciones que serán propietarios del multisig
     * @param requiredApprovals Número de aprobaciones necesarias para ejecutar transacciones
     * @custom:requirement Solo puede establecerse una vez
     */
    function setOwnerMultisig(address[] memory owners, uint requiredApprovals) external {
        require(ownerMultisig == address(0), "Owner multisig already set");
        ownerMultisig = multisigFactory.createMultisig(owners, requiredApprovals);
    }

    /**
     * @notice Establece el multisig para operaciones de emergencia
     * @dev Crea un nuevo contrato Multisig para el botón de pánico (operaciones críticas)
     * @param owners Array de direcciones que serán propietarios del multisig de emergencia
     * @param requiredApprovals Número de aprobaciones necesarias
     * @custom:requirement Solo puede establecerse una vez y la DAO debe tener un owner multisig configurado
     */
    function setPanicMultisig(address[] memory owners, uint requiredApprovals) external onlyOwner {
        require(panicMultisig == address(0), "Panic multisig already set");
        panicMultisig = multisigFactory.createMultisig(owners, requiredApprovals);
    }

    /**
     * @notice Establece una dirección como owner (método de compatibilidad)
     * @dev Método legacy que permite establecer una dirección simple como owner
     * @param _owner La dirección que será establecida como owner
     * @custom:legacy Este método existe por compatibilidad con versiones anteriores
     * @custom:requirement Solo puede llamarse si aún no se ha establecido el owner multisig
     */
    function setOwner(address _owner) external {
        require(ownerMultisig == address(0), "Already set");
        ownerMultisig = _owner;
    }

    /**
     * @notice Establece una dirección como wallet de pánico (método de compatibilidad)
     * @dev Método legacy que permite establecer una dirección simple para operaciones de pánico
     * @param _panicWallet La dirección que será establecida como wallet de pánico
     * @custom:legacy Este método existe por compatibilidad con versiones anteriores
     * @custom:requirement Solo puede ser llamado por el owner y la dirección no puede ser cero
     */
    function setPanicWallet(address _panicWallet) external onlyOwner {
        require(_panicWallet != address(0), "Invalid address");
        panicMultisig = _panicWallet;
    }

    /**
     * @notice Inicializa los parámetros operativos de la DAO
     * @dev Establece todos los valores de configuración necesarios para el funcionamiento de la DAO
     * @param _stakingToVote Cantidad mínima de tokens para poder votar
     * @param _stakingToPropose Cantidad mínima de tokens para crear propuestas
     * @param _minStakingTime Tiempo mínimo (en segundos) que deben permanecer los tokens en staking
     * @param _votePowerDivider Divisor para ajustar el poder de voto cuadrático
     * @param _proposalDurationDays Duración en días del período de votación de propuestas
     * @param _tokenPriceInWei Precio en wei de cada token al comprar con ETH
     * @custom:governance Estos parámetros son fundamentales para el funcionamiento del sistema y solo pueden 
     * ser modificados por el multisig de propietario o propuestas de parámetros aprobadas
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
     * @notice Permite a un usuario hacer staking de tokens para adquirir derecho a voto
     * @dev Transfiere los tokens del usuario al contrato y registra la información de staking
     * @param amount Cantidad de tokens a poner en staking
     * @custom:requirement La DAO debe estar activa, el monto debe ser suficiente y el usuario
     * no debe tener staking para voto actualmente
     */
    function stakeForVote(uint256 amount) external daoActive {
        require(amount >= stakingToVote, "Insufficient staking amount");
        require(voteStakes[msg.sender].amount == 0, "Already staked");

        token.transferFrom(msg.sender, address(this), amount);
        voteStakes[msg.sender] = StakeInfo(amount, block.timestamp);
    }

    /**
     * @notice Permite a un usuario hacer staking de tokens para adquirir derecho a crear propuestas
     * @dev Transfiere los tokens del usuario al contrato y registra la información de staking
     * @param amount Cantidad de tokens a poner en staking
     * @custom:requirement La DAO debe estar activa, el monto debe ser suficiente y el usuario
     * no debe tener staking para propuestas actualmente
     */
    function stakeForProposal(uint256 amount) external daoActive {
        require(amount >= stakingToPropose, "Insufficient staking amount");
        require(proposalStakes[msg.sender].amount == 0, "Already staked");

        token.transferFrom(msg.sender, address(this), amount);
        proposalStakes[msg.sender] = StakeInfo(amount, block.timestamp);
    }

    /**
     * @notice Permite a un usuario retirar tokens previamente puestos en staking para votar
     * @dev Verifica el tiempo mínimo de staking, elimina el registro y transfiere los tokens de vuelta
     * @custom:requirement El usuario debe tener tokens en staking y debe haber pasado el tiempo mínimo
     */
    function unstakeVote() external {
        StakeInfo memory stake = voteStakes[msg.sender];
        require(stake.amount > 0, "No tokens staked");
        require(block.timestamp >= stake.timestamp + minStakingTime, "Staking time not met");

        delete voteStakes[msg.sender];
        token.transfer(msg.sender, stake.amount);
    }

    /**
     * @notice Permite a un usuario retirar tokens previamente puestos en staking para propuestas
     * @dev Verifica el tiempo mínimo de staking, elimina el registro y transfiere los tokens de vuelta
     * @custom:requirement El usuario debe tener tokens en staking y debe haber pasado el tiempo mínimo
     */
    function unstakeProposal() external {
        StakeInfo memory stake = proposalStakes[msg.sender];
        require(stake.amount > 0, "No tokens staked");
        require(block.timestamp >= stake.timestamp + minStakingTime, "Staking time not met");

        delete proposalStakes[msg.sender];
        token.transfer(msg.sender, stake.amount);
    }

    /**
     * @notice Enumeración de los diferentes tipos de propuestas disponibles
     * @dev Los tipos determinan el comportamiento durante la ejecución de propuestas aprobadas
     */
    enum ProposalType { 
        /// @notice Propuesta simple sin acciones automáticas, solo registro de aprobación
        Simple,
        
        /// @notice Propuesta que ejecuta una transacción arbitraria a otro contrato
        Transaction,
        
        /// @notice Propuesta para cambiar parámetros del sistema DAO
        ParameterChange,
        
        /// @notice Propuesta para acuñar nuevos tokens a una dirección específica
        TokenMint
    }

    /**
     * @notice Estructura que almacena toda la información de una propuesta
     * @dev Contiene campos comunes y específicos según el tipo de propuesta
     */
    struct Proposal {
        /// @notice Dirección que creó la propuesta
        address proposer;
        
        /// @notice Descripción textual de la propuesta
        string description;
        
        /// @notice Timestamp de creación (usado para calcular expiración)
        uint256 createdAt;
        
        /// @notice Votos cuadráticos a favor de la propuesta
        uint256 votesFor;
        
        /// @notice Votos cuadráticos en contra de la propuesta
        uint256 votesAgainst;
        
        /// @notice Indica si la propuesta ya fue ejecutada
        bool executed;
        
        /// @notice Tipo de propuesta (determina qué campos específicos se utilizan)
        ProposalType proposalType;
        
        // Campos para propuestas de tipo Transaction
        /// @notice Dirección destino de la transacción (para tipo Transaction)
        address transactionTarget;
        
        /// @notice Datos codificados para la llamada (para tipo Transaction)
        bytes transactionData;
        
        /// @notice Cantidad de ETH a enviar (para tipo Transaction)
        uint transactionValue;
        
        /// @notice Nombre del parámetro a cambiar (para tipo ParameterChange)
        string paramName;
        
        /// @notice Nuevo valor para el parámetro (para tipo ParameterChange)
        uint paramValue;
        
        /// @notice Dirección que recibirá los tokens (para tipo TokenMint)
        address mintTo;
        
        /// @notice Cantidad de tokens a acuñar (para tipo TokenMint)
        uint mintAmount;
    }   

    /// @notice Array que almacena todas las propuestas creadas en la DAO
    Proposal[] public proposals;

    /**
     * @notice Emitido cuando se crea una nueva propuesta
     * @param proposalId ID único de la propuesta creada
     * @param proposer Dirección del creador de la propuesta
     * @param description Descripción de la propuesta
     * @param proposalType Tipo de la propuesta creada
     */
    event ProposalCreated(uint256 indexed proposalId, address indexed proposer, string description, ProposalType proposalType);
    
    /**
     * @notice Emitido cuando una propuesta aprobada es ejecutada
     * @param proposalId ID de la propuesta ejecutada
     * @param success Indica si la ejecución fue exitosa
     */
    event ProposalExecuted(uint256 indexed proposalId, bool success);

    /**
     * @dev Crea una propuesta simple sin acciones específicas a ejecutar
     * @param description Descripción de la propuesta
     */
    function createProposal(string memory description) external daoActive {
        StakeInfo memory stake = proposalStakes[msg.sender];
        require(stake.amount >= stakingToPropose, "Not enough stake to propose");

        Proposal memory newProposal = Proposal({
            proposer: msg.sender,
            description: description,
            createdAt: block.timestamp,
            votesFor: 0,
            votesAgainst: 0,
            executed: false,
            proposalType: ProposalType.Simple,
            transactionTarget: address(0),
            transactionData: "",
            transactionValue: 0,
            paramName: "",
            paramValue: 0,
            mintTo: address(0),
            mintAmount: 0
        });

        proposals.push(newProposal);
        emit ProposalCreated(proposals.length - 1, msg.sender, description, ProposalType.Simple);
    }
    
    /**
     * @dev Crea una propuesta para ejecutar una transacción arbitraria
     * @param description Descripción de la propuesta
     * @param target Contrato objetivo de la transacción
     * @param data Datos de la llamada codificados
     * @param value Cantidad de ETH a enviar en la transacción
     */
    function createTransactionProposal(
        string memory description,
        address target,
        bytes memory data,
        uint value
    ) external daoActive {
        StakeInfo memory stake = proposalStakes[msg.sender];
        require(stake.amount >= stakingToPropose, "Not enough stake to propose");

        Proposal memory newProposal = Proposal({
            proposer: msg.sender,
            description: description,
            createdAt: block.timestamp,
            votesFor: 0,
            votesAgainst: 0,
            executed: false,
            proposalType: ProposalType.Transaction,
            transactionTarget: target,
            transactionData: data,
            transactionValue: value,
            paramName: "",
            paramValue: 0,
            mintTo: address(0),
            mintAmount: 0
        });

        proposals.push(newProposal);
        emit ProposalCreated(proposals.length - 1, msg.sender, description, ProposalType.Transaction);
    }
    
    /**
     * @dev Crea una propuesta para cambiar parámetros del DAO
     * @param description Descripción de la propuesta
     * @param paramName Nombre del parámetro a cambiar
     * @param paramValue Nuevo valor para el parámetro
     */
    function createParameterChangeProposal(
        string memory description,
        string memory paramName,
        uint paramValue
    ) external daoActive {
        StakeInfo memory stake = proposalStakes[msg.sender];
        require(stake.amount >= stakingToPropose, "Not enough stake to propose");

        Proposal memory newProposal = Proposal({
            proposer: msg.sender,
            description: description,
            createdAt: block.timestamp,
            votesFor: 0,
            votesAgainst: 0,
            executed: false,
            proposalType: ProposalType.ParameterChange,
            transactionTarget: address(0),
            transactionData: "",
            transactionValue: 0,
            paramName: paramName,
            paramValue: paramValue,
            mintTo: address(0),
            mintAmount: 0
        });

        proposals.push(newProposal);
        emit ProposalCreated(proposals.length - 1, msg.sender, description, ProposalType.ParameterChange);
    }
    
    /**
     * @dev Crea una propuesta para mintear nuevos tokens
     * @param description Descripción de la propuesta
     * @param to Dirección que recibirá los tokens
     * @param amount Cantidad de tokens a mintear
     */
    function createTokenMintProposal(
        string memory description,
        address to,
        uint amount
    ) external daoActive {
        StakeInfo memory stake = proposalStakes[msg.sender];
        require(stake.amount >= stakingToPropose, "Not enough stake to propose");

        Proposal memory newProposal = Proposal({
            proposer: msg.sender,
            description: description,
            createdAt: block.timestamp,
            votesFor: 0,
            votesAgainst: 0,
            executed: false,
            proposalType: ProposalType.TokenMint,
            transactionTarget: address(0),
            transactionData: "",
            transactionValue: 0,
            paramName: "",
            paramValue: 0,
            mintTo: to,
            mintAmount: amount
        });

        proposals.push(newProposal);
        emit ProposalCreated(proposals.length - 1, msg.sender, description, ProposalType.TokenMint);
    }

    mapping(uint256 => mapping(address => bool)) public hasVoted;

    function voteProposal(uint256 proposalId, bool inFavor) external daoActive {
        require(proposalId < proposals.length, "Invalid proposal");
        require(!hasVoted[proposalId][msg.sender], "Already voted");

        uint256 totalPower = 0;

        // Voto propio
        if (voteStakes[msg.sender].amount >= stakingToVote) {
            totalPower += sqrt(voteStakes[msg.sender].amount);
        }

        //Votos delegados (para esta propuesta)
        for (uint i = 0; i < delegatorsPerProposal[proposalId].length; i++) {
            address delegator = delegatorsPerProposal[proposalId][i];

            if (delegatedVote[proposalId][delegator] == msg.sender) {

                if (voteStakes[delegator].amount >= stakingToVote) {
                    totalPower += sqrt(voteStakes[delegator].amount);
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


    /**
     * @dev Ejecuta una propuesta aprobada
     * @param proposalId ID de la propuesta a ejecutar
     * @return success Indica si la ejecución fue exitosa
     */
    function executeProposal(uint256 proposalId) external daoActive returns (bool success) {
        require(proposalId < proposals.length, "Invalid proposal");

        Proposal storage proposal = proposals[proposalId];

        require(!proposal.executed, "Already executed");

        uint256 endTime = proposal.createdAt + (proposalDurationDays * 1 days);
        require(block.timestamp >= endTime, "Proposal still active");

        require(proposal.votesFor > proposal.votesAgainst, "Proposal not approved");

        proposal.executed = true;
        
        // Ejecutar la acción correspondiente según el tipo de propuesta
        if (proposal.proposalType == ProposalType.Transaction) {
            // Ejecutar transacción arbitraria
            (bool txSuccess, ) = proposal.transactionTarget.call{value: proposal.transactionValue}(proposal.transactionData);
            success = txSuccess;
        } 
        else if (proposal.proposalType == ProposalType.ParameterChange) {
            // Cambiar parámetros del DAO
            if (keccak256(bytes(proposal.paramName)) == keccak256(bytes("stakingToVote"))) {
                stakingToVote = proposal.paramValue;
                success = true;
            } else if (keccak256(bytes(proposal.paramName)) == keccak256(bytes("stakingToPropose"))) {
                stakingToPropose = proposal.paramValue;
                success = true;
            } else if (keccak256(bytes(proposal.paramName)) == keccak256(bytes("minStakingTime"))) {
                minStakingTime = proposal.paramValue;
                success = true;
            } else if (keccak256(bytes(proposal.paramName)) == keccak256(bytes("votePowerDivider"))) {
                votePowerDivider = proposal.paramValue;
                success = true;
            } else if (keccak256(bytes(proposal.paramName)) == keccak256(bytes("proposalDurationDays"))) {
                proposalDurationDays = proposal.paramValue;
                success = true;
            } else if (keccak256(bytes(proposal.paramName)) == keccak256(bytes("tokenPriceInWei"))) {
                tokenPriceInWei = proposal.paramValue;
                success = true;
            } else {
                success = false;
            }
        }
        else if (proposal.proposalType == ProposalType.TokenMint) {
            // Mintear nuevos tokens
            try token.mint(proposal.mintTo, proposal.mintAmount) {
                success = true;
            } catch {
                success = false;
            }
        }
        else {
            // ProposalType.Simple no requiere ninguna acción específica
            success = true;
        }

        emit ProposalExecuted(proposalId, success);
        return success;
    }

    // Delegation voting
    mapping(address => address) public delegates;
    address[] public delegators;
    address[] public allDelegators;

    function delegate(address to) external daoActive {
        require(to != msg.sender, "Cannot delegate to self");

        if (delegates[msg.sender] == address(0)) {
            allDelegators.push(msg.sender);
        }

        delegates[msg.sender] = to;
    }

    function getVotingPower(address user) public view returns (uint256) {
        uint256 power = voteStakes[user].amount;

        for (uint i = 0; i < allDelegators.length; i++) {
            address delegator = allDelegators[i];
            if (delegates[delegator] == user) {
                power += voteStakes[delegator].amount;
            }
        }

        // Implementacion del voto cuadratico: Poder de voto = sqrt(tokens)
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

    // Delegación específica por propuesta
    mapping(uint256 => mapping(address => address)) public delegatedVote;
    mapping(uint256 => address[]) public delegatorsPerProposal;


    function delegateVoteForProposal(uint256 proposalId, address to) external daoActive {
        require(proposalId < proposals.length, "Invalid proposal");
        require(to != msg.sender, "Cannot delegate to self");
        require(delegatedVote[proposalId][msg.sender] == address(0), "Already delegated");

        delegatedVote[proposalId][msg.sender] = to;
        delegatorsPerProposal[proposalId].push(msg.sender); 
    }

    /**
     * @dev Compra tokens con ETH
     * @param amount Cantidad de tokens a comprar (en wei)
     */
    function buyTokens(uint256 amount) external payable daoActive {
        require(amount > 0, "Amount must be greater than 0");
        
        uint256 cost = (amount * tokenPriceInWei) / 1e18;
        require(msg.value >= cost, "Insufficient ETH sent");
        
        // Acuñar los tokens para el comprador
        token.mint(msg.sender, amount);
        
        // Devolver el cambio si se envió más ETH del necesario
        uint256 refund = msg.value - cost;
        if (refund > 0) {
            payable(msg.sender).transfer(refund);
        }
        
        emit TokensPurchased(msg.sender, amount, cost);
    }

    /**
     * @dev Función para obtener el número total de propuestas
     * @return El número total de propuestas creadas
     */
    function getProposalsCount() external view returns (uint256) {
        return proposals.length;
    }

    /**
     * @dev Evento emitido cuando se compran tokens
     */
    event TokensPurchased(address indexed buyer, uint256 amount, uint256 cost);

    /**
     * @dev Función para recibir ETH directamente
     * No realiza acciones específicas, solo permite que el contrato reciba ETH
     */
    receive() external payable {
        // No hacemos nada, solo aceptamos el ETH
    }
}
