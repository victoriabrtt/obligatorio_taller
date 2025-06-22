// Archivo para configurar las direcciones de contrato
// Estas son las direcciones de los contratos desplegados localmente
export const CONTRACTS = {
    DAO: {
        address: "0x0B306BF915C4d645ff596e518fAf3F9669b97016", // Dirección obtenida del último despliegue
    },
    TOKEN: {
        address: "0x9A676e781A523b5d0C0e43731313A708CB607508", // Dirección obtenida del último despliegue
    },
    MULTISIG: {
        address: "0xAe367415f4BDe0aDEE3e59C35221d259f517413E", // Dirección del Owner multisig
    },
    MULTISIG_FACTORY: {
        address: "0x4D17b728F3E78e62Ac86D585bE00738Eae7528C6", // Dirección del Panic multisig
    }
};

// ABI del contrato DAO
export const DAO_ABI = [
    // Eventos
    "event ProposalCreated(uint256 indexed proposalId, address indexed proposer, string description, uint8 proposalType)",
    "event ProposalExecuted(uint256 indexed proposalId, bool success)",
    
    // Funciones de vista
    "function token() external view returns (address)",
    "function ownerMultisig() external view returns (address)",
    "function panicMultisig() external view returns (address)",
    "function isPaused() external view returns (bool)",
    "function stakingToVote() external view returns (uint256)",
    "function stakingToPropose() external view returns (uint256)",
    "function minStakingTime() external view returns (uint256)",
    "function votePowerDivider() external view returns (uint256)",
    "function proposalDurationDays() external view returns (uint256)",
    "function tokenPriceInWei() external view returns (uint256)",
    "function voteStakes(address) external view returns (uint256 amount, uint256 timestamp)",
    "function proposalStakes(address) external view returns (uint256 amount, uint256 timestamp)",
    "function proposals(uint256) external view returns (address proposer, string description, uint256 createdAt, uint256 votesFor, uint256 votesAgainst, bool executed, uint8 proposalType, address transactionTarget, bytes transactionData, uint256 transactionValue, string paramName, uint256 paramValue, address mintTo, uint256 mintAmount)",
    "function hasVoted(uint256, address) external view returns (bool)",
    "function getVotingPower(address) external view returns (uint256)",
    "function delegates(address) external view returns (address)",
    "function delegatedVote(uint256, address) external view returns (address)",
    "function sqrt(uint256 x) public pure returns (uint256)",
    
    // Funciones que modifican el estado
    "function buyTokens(uint256 amount) external payable",
    "function stakeForVote(uint256 amount) external",
    "function stakeForProposal(uint256 amount) external",
    "function unstakeVote() external",
    "function unstakeProposal() external",
    "function createProposal(string memory description) external",
    "function createTransactionProposal(string memory description, address target, bytes memory data, uint value) external",
    "function createParameterChangeProposal(string memory description, string memory paramName, uint paramValue) external",
    "function createTokenMintProposal(string memory description, address to, uint amount) external",
    "function voteProposal(uint256 proposalId, bool inFavor) external",
    "function executeProposal(uint256 proposalId) external returns (bool)",
    "function delegate(address to) external",
    "function delegateVoteForProposal(uint256 proposalId, address to) external"
];

// ABI del contrato MyToken
export const TOKEN_ABI = [
    // Eventos
    "event Transfer(address indexed from, address indexed to, uint256 value)",
    "event Approval(address indexed owner, address indexed spender, uint256 value)",
    
    // Funciones de vista
    "function name() external view returns (string memory)",
    "function symbol() external view returns (string memory)",
    "function decimals() external view returns (uint8)",
    "function totalSupply() external view returns (uint256)",
    "function balanceOf(address account) external view returns (uint256)",
    "function allowance(address owner, address spender) external view returns (uint256)",
    
    // Funciones que modifican el estado
    "function transfer(address to, uint256 amount) external returns (bool)",
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function transferFrom(address from, address to, uint256 amount) external returns (bool)",
    
    // Funciones específicas de MyToken
    "function mint(address to, uint256 amount) external"
];

// ABI del contrato Multisig
export const MULTISIG_ABI = [
    // Eventos
    "event TransactionCreated(uint indexed transactionId, address indexed destination, uint value, bytes data)",
    "event TransactionApproved(uint indexed transactionId, address indexed owner)",
    "event TransactionExecuted(uint indexed transactionId)",
    "event OwnerAdded(address indexed owner)",
    "event OwnerRemoved(address indexed owner)",
    
    // Funciones de vista
    "function owners(uint) external view returns (address)",
    "function requiredApprovals() external view returns (uint256)",
    "function transactionCount() external view returns (uint256)",
    "function transactions(uint) external view returns (address destination, uint value, bool executed, bytes data, uint approvalCount)",
    "function approvals(uint, address) external view returns (bool)",
    "function getOwnersCount() external view returns (uint)",
    "function getOwners() external view returns (address[] memory)",
    
    // Funciones que modifican el estado
    "function createTransaction(address destination, uint value, bytes memory data) external returns (uint)",
    "function approveTransaction(uint transactionId) external",
    "function executeTransaction(uint transactionId) external",
    "function addOwner(address owner) external",
    "function removeOwner(address owner) external"
];
