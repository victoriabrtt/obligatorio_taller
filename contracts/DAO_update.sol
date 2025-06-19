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

    // Resto del contrato...
    
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

    // El resto del contrato DAO no se modifica...
}
