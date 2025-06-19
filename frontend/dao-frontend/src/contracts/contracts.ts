// Archivo para configurar las direcciones de contrato
// Estas direcciones deberán ser reemplazadas por las reales después del despliegue
export const CONTRACTS = {
    DAO: {
        address: "0x0000000000000000000000000000000000000000", // Reemplazar con la dirección real
    },
    TOKEN: {
        address: "0x0000000000000000000000000000000000000000", // Reemplazar con la dirección real
    },
    MULTISIG: {
        address: "0x0000000000000000000000000000000000000000", // Reemplazar con la dirección real
    },
    MULTISIG_FACTORY: {
        address: "0x0000000000000000000000000000000000000000", // Reemplazar con la dirección real
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
    "function delegateVoteForProposal(uint256 proposalId, address to) external",
    "function buyTokens(uint256 amount) external payable",
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
    "function submitTransaction(address destination, uint value, bytes memory data) external returns (uint)",
    "function approveTransaction(uint transactionId) external",
    "function executeTransaction(uint transactionId) external",
    "function revokeApproval(uint transactionId) external"
];
