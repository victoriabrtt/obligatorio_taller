// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./MyToken.sol";

contract DAO {
    MyToken public token;

    address public ownerMultisig;
    address public panicMultisig;

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

    constructor(address _tokenAddress) {
        token = MyToken(_tokenAddress);
    }

    function setOwner(address _owner) external {
        require(ownerMultisig == address(0), "Already set");
        ownerMultisig = _owner;
    }

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

    struct Proposal {
        address proposer;
        string description;
        uint256 createdAt;
        uint256 votesFor;
        uint256 votesAgainst;
        bool executed;
    }   

    Proposal[] public proposals;

    event ProposalCreated(uint256 indexed proposalId, address indexed proposer, string description);

    function createProposal(string memory description) external daoActive {
        StakeInfo memory stake = proposalStakes[msg.sender];
        require(stake.amount >= stakingToPropose, "Not enough stake to propose");

        Proposal memory newProposal = Proposal({
            proposer: msg.sender,
            description: description,
            createdAt: block.timestamp,
            votesFor: 0,
            votesAgainst: 0,
            executed: false
        });

        proposals.push(newProposal);
        emit ProposalCreated(proposals.length - 1, msg.sender, description);
    }

    mapping(uint256 => mapping(address => bool)) public hasVoted;

    function voteProposal(uint256 proposalId, bool inFavor) external daoActive {
        require(proposalId < proposals.length, "Invalid proposal");
        require(!hasVoted[proposalId][msg.sender], "Already voted");

        StakeInfo memory stake = voteStakes[msg.sender];
        require(stake.amount >= stakingToVote, "Not enough stake to vote");

        uint256 power = stake.amount / votePowerDivider;

         if (inFavor) {
            proposals[proposalId].votesFor += power;
        } else {
            proposals[proposalId].votesAgainst += power;
        }

        hasVoted[proposalId][msg.sender] = true;
    }

    function executeProposal(uint256 proposalId) external daoActive {
        require(proposalId < proposals.length, "Invalid proposal");

        Proposal storage proposal = proposals[proposalId];

        require(!proposal.executed, "Already executed");

        uint256 endTime = proposal.createdAt + (proposalDurationDays * 1 days);
        require(block.timestamp >= endTime, "Proposal still active");

        require(proposal.votesFor > proposal.votesAgainst, "Proposal not approved");

        proposal.executed = true;

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

        return power / votePowerDivider;
    }


}
