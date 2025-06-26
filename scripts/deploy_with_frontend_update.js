// Full deployment script that deploys contracts and updates frontend

const { ethers } = require("hardhat");
const { updateFrontendAddresses } = require("./update_frontend_addresses");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Starting full deployment with frontend update...");
  
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

  // Deploy del MultisigFactory
  console.log("Deploying MultisigFactory...");
  const MultisigFactory = await ethers.getContractFactory("MultisigFactory");
  const multisigFactory = await MultisigFactory.deploy();
  await multisigFactory.waitForDeployment();
  const multisigFactoryAddress = await multisigFactory.getAddress();
  console.log(`MultisigFactory deployed at: ${multisigFactoryAddress}`);

  // Deploy owner multisig
  console.log("Deploying owner multisig...");
  await multisigFactory.createMultisig(
    [deployer.address, owner1.address, owner2.address],
    2 // 2 of 3 required approvals
  );
  const ownerMultisigAddress = await multisigFactory.getLastMultisig();
  console.log(`Owner multisig deployed at: ${ownerMultisigAddress}`);

  // Deploy panic multisig
  console.log("Deploying panic multisig...");
  await multisigFactory.createMultisig(
    [panicWallet1.address, panicWallet2.address],
    1 // 1 of 2 required approvals
  );
  const panicMultisigAddress = await multisigFactory.getLastMultisig();
  console.log(`Panic multisig deployed at: ${panicMultisigAddress}`);

  // Set token owner
  console.log("Setting token ownership to DAO...");
  await token.transferOwnership(daoAddress);
  console.log("Token ownership transferred to DAO");

  // Set DAO owner to multisig
  console.log("Setting DAO owner to multisig...");
  await dao.setOwner(ownerMultisigAddress);
  console.log("DAO owner set to multisig:", ownerMultisigAddress);

  // Set DAO panic wallet
  console.log("Setting DAO panic wallet...");
  await dao.setPanicWallet(panicMultisigAddress);
  console.log("DAO panic wallet set to:", panicMultisigAddress);

  // Initialize DAO parameters
  console.log("Initializing DAO parameters...");
  await dao.initParameters(
    ethers.parseEther("100"),  // stakingToVote
    ethers.parseEther("500"),  // stakingToPropose
    3600,                      // minStakingTime (1 hour)
    10,                        // votePowerDivider
    1,                         // proposalDurationDays
    ethers.parseEther("0.01")  // tokenPriceInWei
  );
  console.log("DAO parameters initialized");

  // Unpause the DAO
  console.log("Unpausing DAO...");
  await dao.connect(panicWallet1).tranquility();
  console.log("DAO unpaused");
  
  // Mint initial tokens to users for testing
  console.log("Minting initial tokens to users...");
  
  // Buy tokens for users
  const tokensToBuy = ethers.parseEther("1000");
  const cost = (tokensToBuy * ethers.parseEther("0.01")) / ethers.parseEther("1");
  
  // User 1 buys tokens
  await dao.connect(user1).buyTokens(tokensToBuy, { value: cost });
  console.log(`User 1 bought ${ethers.formatEther(tokensToBuy)} tokens`);
  
  // User 2 buys tokens
  await dao.connect(user2).buyTokens(tokensToBuy, { value: cost });
  console.log(`User 2 bought ${ethers.formatEther(tokensToBuy)} tokens`);

  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    timestamp: new Date().toISOString(),
    addresses: {
      daoAddress,
      tokenAddress,
      ownerMultisigAddress,
      panicMultisigAddress,
      multisigFactoryAddress
    }
  };
  
  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }
  
  // Write deployment info to file
  const timestamp = Date.now();
  fs.writeFileSync(
    path.join(deploymentsDir, `${network.name}-${timestamp}.json`),
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log("Deployment information saved to:", `${network.name}-${timestamp}.json`);
  
  // Update frontend addresses
  console.log("Updating frontend contract addresses...");
  await updateFrontendAddresses();
  
  console.log("Full deployment completed successfully!");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
