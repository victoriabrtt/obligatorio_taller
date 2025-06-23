// Script to buy tokens and stake them for a specific account
const { ethers } = require("hardhat");

async function main() {
  // Get the DAO address
  const daoAddress = process.env.DAO_ADDRESS || "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
  console.log(`Using DAO address: ${daoAddress}`);
  
  // Get the user account from env
  const userAddress = process.env.USER_ADDRESS;
  
  if (!userAddress) {
    console.error("Please provide a user address as USER_ADDRESS environment variable");
    console.error("Example: USER_ADDRESS=0x123... npx hardhat run scripts/setup_user_account.js --network localhost");
    process.exit(1);
  }
  
  console.log(`Setting up initial tokens for user: ${userAddress}`);
  
  // Get contract instances
  const DAO = await ethers.getContractFactory("contracts/DAO.sol:DAO");
  const dao = await DAO.attach(daoAddress);
  
  // Get token contract
  const tokenAddress = await dao.token();
  const Token = await ethers.getContractFactory("MyToken");
  const token = Token.attach(tokenAddress);
  console.log(`Token address: ${tokenAddress}`);
  
  // Get the user's current token balance
  try {
    const initialBalance = await token.balanceOf(userAddress);
    console.log(`Initial token balance: ${ethers.formatEther(initialBalance)} tokens`);
  } catch (error) {
    console.log("Could not get initial balance:", error.message);
  }
  
  // Get token price
  const tokenPriceInWei = await dao.tokenPriceInWei();
  console.log(`Token price: ${ethers.formatEther(tokenPriceInWei)} ETH`);
  
  // Amount of tokens to buy - need at least 600 for both staking operations
  const tokensToBuy = ethers.parseEther("1000"); // Buy extra tokens
  const cost = (tokensToBuy * tokenPriceInWei) / ethers.parseEther("1");
  
  console.log(`Buying ${ethers.formatEther(tokensToBuy)} tokens for ${ethers.formatEther(cost)} ETH`);
  
  // We need to impersonate the user account to buy tokens
  // This allows us to sign transactions as the user
  try {
    // Impersonate the user account
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [userAddress]
    });
    
    const userSigner = await ethers.getImpersonatedSigner(userAddress);
    
    // Check ETH balance of user
    const ethBalance = await ethers.provider.getBalance(userAddress);
    console.log(`User ETH balance: ${ethers.formatEther(ethBalance)} ETH`);
    
    if (ethBalance < cost) {
      console.error(`Insufficient ETH balance. Need ${ethers.formatEther(cost)} ETH but only have ${ethers.formatEther(ethBalance)} ETH`);
      process.exit(1);
    }
    
    // Buy tokens as the user
    console.log("Buying tokens...");
    const buyTx = await dao.connect(userSigner).buyTokens(tokensToBuy, {value: cost});
    await buyTx.wait();
    
    // Check new token balance
    const newBalance = await token.balanceOf(userAddress);
    console.log(`New token balance: ${ethers.formatEther(newBalance)} tokens`);
    
    // Now let's stake some tokens for voting and proposing
    // First, approve token transfers
    const stakeForVoteAmount = ethers.parseEther("100");  // Minimum required to vote
    const stakeForProposeAmount = ethers.parseEther("500"); // Minimum required to propose
    
    console.log("Approving tokens for staking...");
    const approveTx = await token.connect(userSigner).approve(daoAddress, stakeForVoteAmount + stakeForProposeAmount);
    await approveTx.wait();
    
    // Stake for voting
    console.log("Staking for voting...");
    const stakeVoteTx = await dao.connect(userSigner).stakeForVote(stakeForVoteAmount);
    await stakeVoteTx.wait();
    
    // Check vote stake
    const voteStake = await dao.voteStakes(userAddress);
    console.log(`Vote stake: ${ethers.formatEther(voteStake[0])} tokens`);
    
    // Stake for proposals
    console.log("Staking for proposals...");
    const stakeProposeTx = await dao.connect(userSigner).stakeForProposal(stakeForProposeAmount);
    await stakeProposeTx.wait();
    
    // Check proposal stake
    const proposalStake = await dao.proposalStakes(userAddress);
    console.log(`Proposal stake: ${ethers.formatEther(proposalStake[0])} tokens`);
    
    console.log("Setup complete! The user can now vote and create proposals.");
    
    // Stop impersonating the account
    await hre.network.provider.request({
      method: "hardhat_stopImpersonatingAccount",
      params: [userAddress]
    });
    
  } catch (error) {
    console.error("Error setting up user:", error);
  }
}

// Execute
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
