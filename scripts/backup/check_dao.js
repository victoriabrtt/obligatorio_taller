// Script to check the current state of the DAO
const { ethers } = require("hardhat");

async function main() {
  console.log("Checking DAO state...");

  // Get the DAO contract address from env or use default
  const daoAddress = process.env.DAO_ADDRESS || "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"; // DAO address from last deployment
  console.log(`Using DAO address: ${daoAddress}`);

  // Get the contract factory with explicit path
  const DAO = await ethers.getContractFactory("contracts/DAO.sol:DAO");
  const dao = await DAO.attach(daoAddress);
  
  // Check current paused state
  const isPaused = await dao.isPaused();
  console.log(`Current state: DAO is ${isPaused ? "PAUSED" : "ACTIVE"}`);
  
  // Get the owner multisig address
  const ownerMultisigAddress = await dao.ownerMultisig();
  const panicMultisigAddress = await dao.panicMultisig();
  
  console.log(`Owner multisig: ${ownerMultisigAddress}`);
  console.log(`Panic multisig: ${panicMultisigAddress}`);
  
  // Get token address
  const tokenAddress = await dao.token();
  console.log(`Token address: ${tokenAddress}`);
  
  // Get DAO parameters
  const stakingToVote = await dao.stakingToVote();
  const stakingToPropose = await dao.stakingToPropose();
  const minStakingTime = await dao.minStakingTime();
  const votePowerDivider = await dao.votePowerDivider();
  const proposalDurationDays = await dao.proposalDurationDays();
  const tokenPriceInWei = await dao.tokenPriceInWei();
  
  console.log("\nDAO Parameters:");
  console.log(`Staking to vote: ${ethers.formatEther(stakingToVote)} tokens`);
  console.log(`Staking to propose: ${ethers.formatEther(stakingToPropose)} tokens`);
  console.log(`Min staking time: ${minStakingTime} seconds`);
  console.log(`Vote power divider: ${votePowerDivider}`);
  console.log(`Proposal duration: ${proposalDurationDays} days`);
  console.log(`Token price: ${ethers.formatEther(tokenPriceInWei)} ETH`);
  
  // Try to check a few proposals directly
  console.log("\nChecking proposals:");
  try {
    // Check proposals with indices 0, 1, and 2 (first 3 proposals)
    for (let i = 0; i < 3; i++) {
      try {
        const proposal = await dao.proposals(i);
        console.log(`Proposal ${i}: ${proposal[1]}`);
        console.log(`  Votes For: ${proposal[3]}`);
        console.log(`  Votes Against: ${proposal[4]}`);
        console.log(`  Executed: ${proposal[5]}`);
      } catch (error) {
        console.log(`No proposal at index ${i}`);
        break;
      }
    }
  } catch (error) {
    console.log("Error accessing proposals:", error.message);
  }
  
  // Get user wallet balance for reference
  const [, , , , , user1] = await ethers.getSigners();
  const Token = await ethers.getContractFactory("MyToken");
  const token = await Token.attach(tokenAddress);
  
  const user1Balance = await token.balanceOf(user1.address);
  console.log(`\nUser1 (${user1.address}) token balance: ${ethers.formatEther(user1Balance)} tokens`);
  
  // Get staking info
  const voteStake = await dao.voteStakes(user1.address);
  const proposalStake = await dao.proposalStakes(user1.address);
  
  console.log(`User1 vote stake: ${ethers.formatEther(voteStake[0])} tokens (staked at ${new Date(Number(voteStake[1]) * 1000).toLocaleString()})`);
  console.log(`User1 proposal stake: ${ethers.formatEther(proposalStake[0])} tokens (staked at ${new Date(Number(proposalStake[1]) * 1000).toLocaleString()})`);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
