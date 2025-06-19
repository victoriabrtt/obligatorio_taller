// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./MyToken.sol";
import "./Multisig.sol";
import "./MultisigFactory.sol";

/**
 * @title DAO
 * @dev Contrato principal de la Organización Autónoma Descentralizada (DAO)
 * Implementa staking, propuestas, votación cuadrática y delegación
 */
contract DAO {
    MyToken public token;
    
    // Contratos multisig para administración y emergencias
    address public ownerMultisig;
    address public panicMultisig;
    MultisigFactory public multisigFactory;

    bool public isPaused = true;

    uint256 public stakingToVote;
    uint256 public stakingToPropose;
    uint256 public minStakingTime;
    uint256 public votePowerDivider;
    uint256 public proposalDurationDays;
    uint256 public tokenPriceInWei;

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
        require(ownerMultisig == address(0), "Already set");
        ownerMultisig = _owner;
    }

    /**
     * @dev Método legacy para compatibilidad
     */
    function setPanicWallet(address _panicWallet) external onlyOwner {
        require(_panicWallet != address(0), "Invalid address");
        panicMultisig = _panicWallet;
    }

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

    function panic() external onlyOwner {
        require(panicMultisig != address(0), "Panic wallet not set");
        isPaused = true;
    }

    function tranquility() external onlyPanic {
        isPaused = false;
    }

    function stakeForVote(uint256 amount) external daoActive {
        require(amount >= stakingToVote, "Insufficient staking amount");
        require(voteStakes[msg.sender].amount == 0, "Already staked");

        token.transferFrom(msg.sender, address(this), amount);
        voteStakes[msg.sender] = StakeInfo(amount, block.timestamp);
    }

    function stakeForProposal(uint256 amount) external daoActive {
        require(amount >= stakingToPropose, "Insufficient staking amount");
        require(proposalStakes[msg.sender].amount == 0, "Already staked");

        token.transferFrom(msg.sender, address(this), amount);
        proposalStakes[msg.sender] = StakeInfo(amount, block.timestamp);
    }

    function unstakeVote() external {
        StakeInfo memory stake = voteStakes[msg.sender];
        require(stake.amount > 0, "No tokens staked");
        require(block.timestamp >= stake.timestamp + minStakingTime, "Staking time not met");

        delete voteStakes[msg.sender];
        token.transfer(msg.sender, stake.amount);
    }

    function unstakeProposal() external {
        StakeInfo memory stake = proposalStakes[msg.sender];
        require(stake.amount > 0, "No tokens staked");
        require(block.timestamp >= stake.timestamp + minStakingTime, "Staking time not met");

        delete proposalStakes[msg.sender];
        token.transfer(msg.sender, stake.amount);
    }

    enum ProposalType { 
        Simple,       // Solo aprobación sin ejecución de código
        Transaction,  // Ejecuta una transacción
        ParameterChange, // Cambia parámetros del DAO
        TokenMint     // Mintea nuevos tokens
    }

    struct Proposal {
        address proposer;
        string description;
        uint256 createdAt;
        uint256 votesFor;
        uint256 votesAgainst;
        bool executed;
        ProposalType proposalType;
        // Para propuestas de tipo Transaction
        address transactionTarget;
        bytes transactionData;
        uint transactionValue;
        // Para propuestas de tipo ParameterChange
        string paramName;
        uint paramValue;
        // Para propuestas de tipo TokenMint
        address mintTo;
        uint mintAmount;
    }   

    Proposal[] public proposals;

    event ProposalCreated(uint256 indexed proposalId, address indexed proposer, string description, ProposalType proposalType);
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

    function sqrt(uint256 x) public pure returns (uint256) {
        if (x == 0) return 0;
        uint256 z = (x + 1) / 2;
        uint256 y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
        return y;
    }

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

        // Implementación del voto cuadrático: Poder de voto = sqrt(tokens)
        return sqrt(power) * 1e9 / votePowerDivider;
    }
    
    /**
     * @dev Calcula la raíz cuadrada de un número usando el método de Newton-Raphson
     * @param x Número del que calcular la raíz cuadrada
     * @return y Raíz cuadrada de x
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
     * @dev Evento emitido cuando se compran tokens
     */
    event TokensPurchased(address indexed buyer, uint256 amount, uint256 cost);
}
