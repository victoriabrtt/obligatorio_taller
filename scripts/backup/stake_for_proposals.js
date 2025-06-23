// Script to stake tokens for proposals
const { ethers } = require("hardhat");

async function main() {
  // Get the user address
  const userAddress = process.env.USER_ADDRESS;
  
  if (!userAddress) {
    console.error("Please provide a user address as USER_ADDRESS environment variable");
    console.error("Example: USER_ADDRESS=0x123... npx hardhat run scripts/stake_for_proposals.js --network localhost");
    process.exit(1);
  }
  
  console.log(`Setting up proposal stake for: ${userAddress}`);
  
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
  
  // Get the amount needed for staking
  const stakingToPropose = await dao.stakingToPropose();
  console.log(`Required staking amount: ${ethers.formatEther(stakingToPropose)} tokens`);
  
  try {
    // Impersonate the user account
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [userAddress]
    });
    
    const userSigner = await ethers.getImpersonatedSigner(userAddress);
    
    // Check current token balance
    const tokenBalance = await token.balanceOf(userAddress);
    console.log(`Current token balance: ${ethers.formatEther(tokenBalance)} tokens`);
    
    if (tokenBalance < stakingToPropose) {
      console.error(`Insufficient token balance. Need ${ethers.formatEther(stakingToPropose)} tokens but only have ${ethers.formatEther(tokenBalance)} tokens`);
      process.exit(1);
    }
    
    // Approve token transfers
    console.log("Approving tokens for staking...");
    const approvalTx = await token.connect(userSigner).approve(daoAddress, stakingToPropose);
    await approvalTx.wait();
    console.log("Tokens approved");
    
    // Stake for proposals
    console.log("Staking for proposals...");
    const stakeTx = await dao.connect(userSigner).stakeForProposal(stakingToPropose);
    await stakeTx.wait();
    console.log("Tokens staked for proposals");
    
    // Check updated proposal stake
    const proposalStake = await dao.proposalStakes(userAddress);
    console.log(`New proposal stake: ${ethers.formatEther(proposalStake[0])} tokens (staked on ${new Date(Number(proposalStake[1]) * 1000).toLocaleString()})`);
    
    // Stop impersonating the account
    await hre.network.provider.request({
      method: "hardhat_stopImpersonatingAccount",
      params: [userAddress]
    });
    
    console.log("Setup complete! The user can now create proposals after the staking time requirement is met.");
    
  } catch (error) {
    console.error("Error setting up stake:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
