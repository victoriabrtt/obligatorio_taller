// Script to deploy a DAO in active state (not paused)
const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying DAO in active state...");

  // Get accounts
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying with account: ${deployer.address}`);

  // Deploy token
  const Token = await ethers.getContractFactory("MyToken");
  const token = await Token.deploy();
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log(`Token deployed to: ${tokenAddress}`);

  // Deploy multisig factory
  const MultisigFactoryContract = await ethers.getContractFactory("MultisigFactory");
  const multisigFactory = await MultisigFactoryContract.deploy();
  await multisigFactory.waitForDeployment();
  const multisigFactoryAddress = await multisigFactory.getAddress();
  console.log(`MultisigFactory deployed to: ${multisigFactoryAddress}`);

  // Deploy DAO
  const DAO = await ethers.getContractFactory("contracts/DAO.sol:DAO");
  const dao = await DAO.deploy(tokenAddress);
  await dao.waitForDeployment();
  const daoAddress = await dao.getAddress();
  console.log(`DAO deployed to: ${daoAddress}`);

  // Set up owner multisig
  console.log("Setting up owner multisig...");
  const tx1 = await dao.setOwnerMultisig([deployer.address], 1);
  console.log("Owner multisig transaction sent, waiting for confirmation...");
  await tx1.wait();
  console.log("Owner multisig set");

  // Get owner multisig address
  const ownerMultisigAddress = await dao.ownerMultisig();
  console.log(`Owner multisig address: ${ownerMultisigAddress}`);
  
  // Get the Multisig contract to interact with
  const MultisigContract = await ethers.getContractFactory("Multisig");
  const ownerMultisig = await MultisigContract.attach(ownerMultisigAddress);
  
  // Set up panic multisig through the owner multisig
  console.log("Setting up panic multisig via owner multisig...");
  
  // Encode the function call to setPanicMultisig
  const encodedPanicMultisig = dao.interface.encodeFunctionData("setPanicMultisig", [
    [deployer.address], 1
  ]);
  
  // Create the proposal in the multisig
  const tx2 = await ownerMultisig.submitTransaction(
    await dao.getAddress(),
    0,
    encodedPanicMultisig,
    { gasLimit: 1000000 }
  );
  
  await tx2.wait();
  console.log("Transaction submitted to owner multisig");
  
  // Get the transaction ID from events
  const ownerFilter = ownerMultisig.filters.SubmitTransaction();
  const ownerEvents = await ownerMultisig.queryFilter(ownerFilter, -1);
  const txId = ownerEvents[0].args[0];
  console.log(`Transaction ID: ${txId}`);
  
  // Confirm the transaction
  const tx3 = await ownerMultisig.confirmTransaction(txId, { gasLimit: 1000000 });
  await tx3.wait();
  console.log("Transaction confirmed");
  
  // Execute the transaction
  const tx4 = await ownerMultisig.executeTransaction(txId, { gasLimit: 1000000 });
  await tx4.wait();
  console.log("Transaction executed, panic multisig set");
  
  // Initialize parameters
  console.log("Setting initial parameters...");
  const tx5 = await dao.initParameters(
    ethers.parseEther("100"),  // stakingToVote
    ethers.parseEther("500"),  // stakingToPropose
    3600,                     // minStakingTime (1 hour)
    10,                       // votePowerDivider
    1,                        // proposalDurationDays
    ethers.parseEther("0.01") // tokenPriceInWei
  );
  await tx5.wait();
  console.log("Parameters initialized");
  
  // Unpause the DAO
  console.log("Unpausing the DAO...");
  
  // Get the panic multisig address
  const panicMultisigAddress = await dao.panicMultisig();
  console.log(`Panic multisig address: ${panicMultisigAddress}`);
  
  // Attach to the panic multisig
  const panicMultisig = await MultisigContract.attach(panicMultisigAddress);
  
  // Create transaction to call tranquility
  const encodedTranquility = dao.interface.encodeFunctionData("tranquility", []);
  const tx6 = await panicMultisig.submitTransaction(
    daoAddress,
    0,
    encodedTranquility,
    { gasLimit: 1000000 }
  );
  await tx6.wait();
  
  // Get transaction ID
  const filter = panicMultisig.filters.SubmitTransaction();
  const events = await panicMultisig.queryFilter(filter, -1);
  const panicTxId = events[0].args[0];
  
  // Confirm and execute
  await panicMultisig.confirmTransaction(panicTxId, { gasLimit: 1000000 });
  await panicMultisig.executeTransaction(panicTxId, { gasLimit: 1000000 });
  
  console.log("DAO unpaused successfully");
  
  // Check if DAO is active
  const isPaused = await dao.isPaused();
  console.log(`DAO is now ${isPaused ? "PAUSED" : "ACTIVE"}`);
  
  // Log contract addresses for frontend
  console.log("\nContract Addresses for Frontend:");
  console.log("--------------------------------");
  console.log(`DAO_ADDRESS=${daoAddress}`);
  console.log(`TOKEN_ADDRESS=${tokenAddress}`);
  console.log(`OWNER_MULTISIG=${ownerMultisigAddress}`);
  console.log(`PANIC_MULTISIG=${panicMultisigAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
