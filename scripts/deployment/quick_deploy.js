// Script for quick deployment of the DAO system for testing
const { ethers } = require("hardhat");

async function main() {
  console.log("Starting quick deployment for testing...");
  
  // Get signers
  const [deployer, owner1, owner2, panicWallet1, panicWallet2, user1, user2] = await ethers.getSigners();

  console.log("Deployer:", deployer.address);
  console.log("User 1:", user1.address);
  console.log("User 2:", user2.address);
  
  // Deploy del token
  console.log("Deploying token...");
  const Token = await ethers.getContractFactory("MyToken");
  const token = await Token.deploy();
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log(`Token deployed at: ${tokenAddress}`);

  // Deploy del DAO
  console.log("Deploying DAO...");
  const DAO = await ethers.getContractFactory("contracts/DAO.sol:DAO");
  const dao = await DAO.deploy(tokenAddress);
  await dao.waitForDeployment();
  const daoAddress = await dao.getAddress();
  console.log(`DAO deployed at: ${daoAddress}`);

  // Set token owner
  console.log("Setting token ownership to DAO...");
  await token.transferOwnership(daoAddress);
  console.log("Token ownership transferred to DAO");

  // Set owner multisig
  console.log("Setting up multisig owners...");
  await dao.setOwner(deployer.address);
  console.log("Owner set to deployer");

  // Unpause the DAO
  console.log("Unpausing DAO...");
  await dao.initParameters(
    ethers.parseEther("100"),  // stakingToVote
    ethers.parseEther("500"),  // stakingToPropose
    3600,                      // minStakingTime (1 hour)
    10,                        // votePowerDivider
    1,                         // proposalDurationDays
    ethers.parseEther("0.01")  // tokenPriceInWei
  );
  await dao.setPanicWallet(panicWallet1.address);
  
  // Llamamos a tranquility desde el panicWallet
  await dao.connect(panicWallet1).tranquility();  // Unpause
  console.log("DAO initialized and unpaused");
  
  // Mint initial tokens to users for testing
  console.log("Minting initial tokens to users...");
  
  // Buy tokens for users
  const tokensToBuy = ethers.parseEther("1000");
  const cost = (tokensToBuy * ethers.parseEther("0.01")) / ethers.parseEther("1");
  
  // User1 buys tokens
  await dao.connect(user1).buyTokens(tokensToBuy, {value: cost});
  console.log(`User1 bought ${ethers.formatEther(tokensToBuy)} tokens`);
  
  // User2 buys tokens
  await dao.connect(user2).buyTokens(tokensToBuy, {value: cost});
  console.log(`User2 bought ${ethers.formatEther(tokensToBuy)} tokens`);
  
  // Stake tokens for voting and proposals
  console.log("Staking tokens...");
  
  // Obtenemos la instancia del token desde el punto de vista de cada usuario
  const tokenUser1 = token.connect(user1);
  const tokenUser2 = token.connect(user2);
  
  console.log("Approving tokens to be spent by DAO...");
  // Approve tokens to be spent by DAO
  await tokenUser1.approve(daoAddress, ethers.parseEther("800"));
  await tokenUser2.approve(daoAddress, ethers.parseEther("600"));
  
  console.log("Staking for voting...");
  // Stake for voting
  await dao.connect(user1).stakeForVote(ethers.parseEther("200"));
  await dao.connect(user2).stakeForVote(ethers.parseEther("300"));
  
  console.log("Staking for proposals...");
  // Stake for proposals
  await dao.connect(user1).stakeForProposal(ethers.parseEther("500"));
  
  console.log("Users have staked tokens for voting and proposals");
  
  // Create some test proposals
  console.log("Creating test proposals...");
  
  // User1 creates a simple proposal
  await dao.connect(user1).createProposal("Propuesta 1: Simple proposal for testing");
  
  // User1 creates a parameter change proposal
  await dao.connect(user1).createParameterChangeProposal(
    "Propuesta 2: Change voting duration", 
    "proposalDurationDays",
    7
  );
  
  // User1 creates a token mint proposal
  await dao.connect(user1).createTokenMintProposal(
    "Propuesta 3: Mint tokens to user2",
    user2.address,
    ethers.parseEther("1000")
  );
  
  console.log("Test proposals created");
  
  // Vote on proposals
  console.log("Voting on proposals...");
  
  // User2 votes for proposal 0
  await dao.connect(user2).voteProposal(0, true);
  
  // User2 votes against proposal 1
  await dao.connect(user2).voteProposal(1, false);
  
  console.log("Votes cast");
  
  console.log("DAO setup complete!");
  
  // Log contract addresses for frontend
  console.log("\nContract Addresses for Frontend:");
  console.log("--------------------------------");
  console.log(`DAO_ADDRESS=${daoAddress}`);
  console.log(`TOKEN_ADDRESS=${tokenAddress}`);
}

// Execute
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
