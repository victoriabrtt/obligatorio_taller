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
}
