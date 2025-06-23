// Unpause script for the DAO - Call the tranquility() function from the panic multisig
const { ethers } = require("hardhat");

async function main() {
  console.log("Unpause DAO script starting...");

  // Get local accounts
  const [deployer] = await ethers.getSigners();
  console.log(`Using account: ${deployer.address}`);

  // Get the DAO contract
  const DAO = await ethers.getContractFactory("contracts/DAO.sol:DAO");
  const daoAddress = process.env.DAO_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Default local address
  const dao = await DAO.attach(daoAddress);
  console.log(`DAO contract address: ${daoAddress}`);

  // Check if DAO is paused
  const isPaused = await dao.isPaused();
  console.log(`DAO is currently ${isPaused ? "PAUSED" : "ACTIVE"}`);

  if (!isPaused) {
    console.log("DAO is already active. No action needed.");
    return;
  }

  // Get the panic multisig address
  const panicMultisigAddress = await dao.panicMultisig();
  console.log(`Panic multisig address: ${panicMultisigAddress}`);

  // Get the Multisig contract to interact with
  const Multisig = await ethers.getContractFactory("Multisig");
  const panicMultisig = await Multisig.attach(panicMultisigAddress);

  // Create a transaction proposal on the multisig to call tranquility()
  console.log("Creating proposal to unpause the DAO...");
  
  // Encode the function call
  const encodedFunction = dao.interface.encodeFunctionData("tranquility", []);
  
  // Create the proposal in the multisig
  const tx = await panicMultisig.submitTransaction(
    daoAddress,
    0, // no value sent with the transaction
    encodedFunction,
    { gasLimit: 1000000 }
  );
  
  const receipt = await tx.wait();
  console.log(`Transaction submitted to multisig: ${tx.hash}`);
  
  // Get the transaction ID
  const events = receipt.logs.filter(log => {
    try {
      return panicMultisig.interface.parseLog(log).name === "SubmitTransaction";
    } catch (e) {
      return false;
    }
  });
  
  if (events.length === 0) {
    console.error("No SubmitTransaction event found");
    return;
  }
  
  const txId = panicMultisig.interface.parseLog(events[0]).args.txIndex;
  console.log(`Transaction ID: ${txId}`);
  
  // Approve the transaction
  console.log("Approving transaction...");
  await panicMultisig.confirmTransaction(txId, { gasLimit: 1000000 });
  console.log("Transaction approved");
  
  // Execute the transaction
  console.log("Executing transaction...");
  await panicMultisig.executeTransaction(txId, { gasLimit: 1000000 });
  console.log("Transaction executed");
  
  // Verify the DAO is now active
  const newIsPaused = await dao.isPaused();
  console.log(`DAO is now ${newIsPaused ? "PAUSED" : "ACTIVE"}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
