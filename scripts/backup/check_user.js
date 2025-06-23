// Script to check the status of a specific user's account
const { ethers } = require("hardhat");

async function main() {
  // Get the user address
  const userAddress = process.env.USER_ADDRESS;
  
  if (!userAddress) {
    console.error("Please provide a user address as USER_ADDRESS environment variable");
    console.error("Example: USER_ADDRESS=0x123... npx hardhat run scripts/check_user.js --network localhost");
    process.exit(1);
  }
  
  console.log(`Checking account status for: ${userAddress}`);
  
  // Get DAO address and contract
  const daoAddress = process.env.DAO_ADDRESS || "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
  const DAO = await ethers.getContractFactory("contracts/DAO.sol:DAO");
  const dao = await DAO.attach(daoAddress);
  
  // Get token address and contract
  const tokenAddress = await dao.token();
  const Token = await ethers.getContractFactory("MyToken");
  const token = await Token.attach(tokenAddress);
  
  console.log(`DAO address: ${daoAddress}`);
  console.log(`Token address: ${tokenAddress}`);
  
  // Check ETH balance
  const ethBalance = await ethers.provider.getBalance(userAddress);
  console.log(`ETH balance: ${ethers.formatEther(ethBalance)} ETH`);
  
  // Check token balance
  const tokenBalance = await token.balanceOf(userAddress);
  console.log(`Token balance: ${ethers.formatEther(tokenBalance)} tokens`);
  
  // Check voting stake
  const voteStake = await dao.voteStakes(userAddress);
  console.log(`Vote stake: ${ethers.formatEther(voteStake[0])} tokens (staked on ${new Date(Number(voteStake[1]) * 1000).toLocaleString()})`);
  
  // Check proposal stake
  const proposalStake = await dao.proposalStakes(userAddress);
  console.log(`Proposal stake: ${ethers.formatEther(proposalStake[0])} tokens (staked on ${new Date(Number(proposalStake[1]) * 1000).toLocaleString()})`);
  
  // Check voting power
  const votingPower = await dao.getVotingPower(userAddress);
  console.log(`Voting power: ${votingPower}`);
  
  // Check if user can vote and propose
  const stakingToVote = await dao.stakingToVote();
  const stakingToPropose = await dao.stakingToPropose();
  const minStakingTime = await dao.minStakingTime();
  
  console.log(`\nDAO Requirements:`);
  console.log(`Staking to vote: ${ethers.formatEther(stakingToVote)} tokens`);
  console.log(`Staking to propose: ${ethers.formatEther(stakingToPropose)} tokens`);
  console.log(`Min staking time: ${minStakingTime} seconds`);
  
  // Calculate if the user can vote or propose
  const currentTime = Math.floor(Date.now() / 1000);
  const canVoteTime = Number(voteStake[1]) + Number(minStakingTime) <= currentTime;
  const canProposeTime = Number(proposalStake[1]) + Number(minStakingTime) <= currentTime;
  
  const canVoteAmount = voteStake[0] >= stakingToVote;
  const canProposeAmount = proposalStake[0] >= stakingToPropose;
  
  console.log(`\nUser Status:`);
  console.log(`Can vote: ${canVoteAmount && canVoteTime ? 'Yes' : 'No'} (amount: ${canVoteAmount ? 'Sufficient' : 'Insufficient'}, time: ${canVoteTime ? 'Sufficient' : 'Needs to wait longer'})`);
  console.log(`Can propose: ${canProposeAmount && canProposeTime ? 'Yes' : 'No'} (amount: ${canProposeAmount ? 'Sufficient' : 'Insufficient'}, time: ${canProposeTime ? 'Sufficient' : 'Needs to wait longer'})`);
  
  // If the user has not staked enough, suggest buying more tokens
  if (!canVoteAmount || !canProposeAmount) {
    console.log(`\nSuggested Actions:`);
    
    if (!canVoteAmount) {
      const neededAmount = ethers.formatEther(stakingToVote - voteStake[0]);
      console.log(`Stake ${neededAmount} more tokens for voting`);
    }
    
    if (!canProposeAmount) {
      const neededAmount = ethers.formatEther(stakingToPropose - proposalStake[0]);
      console.log(`Stake ${neededAmount} more tokens for proposals`);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
