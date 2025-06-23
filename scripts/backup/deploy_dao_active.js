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
    0, // no value sent with the transaction
    encodedPanicMultisig,
    { gasLimit: 1000000 }
  );
  
  await tx2.wait();
  console.log("Transaction submitted to owner multisig");
  
  // Get the transaction ID from events
  const ownerFilter = ownerMultisig.filters.SubmitTransaction();
  const ownerEvents = await ownerMultisig.queryFilter(ownerFilter, -1);
  const ownerTxId = ownerEvents[0].args[0];
  console.log(`Transaction ID: ${txId}`);
  
  // Confirm the transaction
  const tx3 = await ownerMultisig.confirmTransaction(ownerTxId, { gasLimit: 1000000 });
  await tx3.wait();
  console.log("Transaction confirmed");
  
  // Execute the transaction
  const tx4 = await ownerMultisig.executeTransaction(ownerTxId, { gasLimit: 1000000 });
  await tx4.wait();
  console.log("Transaction executed, panic multisig set");

  // Transfer token ownership to DAO
  console.log("Transferring token ownership to DAO...");
  await token.transferOwnership(daoAddress);
  console.log("Token ownership transferred");

  // Unpause the DAO to make it active
  console.log("Activating DAO (setting to not paused)...");
  
  // Get panic multisig address
  const panicMultisigAddress = await dao.panicMultisig();
  console.log(`Panic multisig address: ${panicMultisigAddress}`);
  
  // Use the MultisigContract that was already defined
  const panicMultisig = await MultisigContract.attach(panicMultisigAddress);
  
  // Create a transaction to call tranquility()
  const encodedTranquility = dao.interface.encodeFunctionData("tranquility", []);
  
  // Submit transaction to the multisig
  const tx = await panicMultisig.submitTransaction(
    daoAddress,
    0,
    encodedTranquility,
    { gasLimit: 1000000 }
  );
  
  await tx.wait();
  
  // Get the transaction ID from the event
  const panicFilter = panicMultisig.filters.SubmitTransaction();
  const panicEvents = await panicMultisig.queryFilter(panicFilter, -1);
  const panicTxId = panicEvents[0].args[0];
  
  // Confirm the transaction
  await panicMultisig.confirmTransaction(panicTxId, { gasLimit: 1000000 });
  
  // Execute the transaction
  await panicMultisig.executeTransaction(panicTxId, { gasLimit: 1000000 });
  
  // Verify DAO is now active
  const isPaused = await dao.isPaused();
  console.log(`DAO is now ${isPaused ? "PAUSED" : "ACTIVE"}`);
  
  // Set parameters
  console.log("Setting DAO parameters...");
  
  // Set token price (0.01 ETH)
  await dao.setTokenPrice(ethers.parseUnits("0.01", "ether"));
  
  // Set staking requirements
  await dao.setStakingToVote(ethers.parseUnits("100", "ether")); // 100 tokens to vote
  await dao.setStakingToPropose(ethers.parseUnits("500", "ether")); // 500 tokens to propose
  
  // Set minimum staking time (1 hour)
  await dao.setMinStakingTime(3600);
  
  // Set proposal duration (3 days)
  await dao.setProposalDurationDays(3);
  
  console.log("DAO parameters set");
  console.log("DAO deployment and activation complete!");
  
  console.log("\nContract addresses:");
  console.log(`- DAO: ${daoAddress}`);
  console.log(`- Token: ${tokenAddress}`);
  console.log(`- MultisigFactory: ${multisigFactoryAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
