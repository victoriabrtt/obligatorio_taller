// Script for directly setting DAO's paused state in development
const { ethers } = require("hardhat");

async function main() {
  console.log("Setting DAO paused state...");

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

  // DEVELOPMENT HACK: Deploy a temporary panic multisig if needed
  // This is a FOR DEVELOPMENT ONLY approach, should never be used in production
  if (panicMultisigAddress === ethers.ZeroAddress) {
    console.log("No panic multisig set. Creating temporary one...");
    
    // Get accounts
    const [deployer] = await ethers.getSigners();
    
    // Create a temporary factory
    const MultisigFactory = await ethers.getContractFactory("MultisigFactory");
    const factory = await MultisigFactory.deploy();
    await factory.waitForDeployment();
    
    // Create panic multisig
    const factoryAddress = await factory.getAddress();
    console.log(`Created temp factory at ${factoryAddress}`);
    
    // If owner is set, use it to set panic multisig
    if (ownerMultisigAddress !== ethers.ZeroAddress) {
      console.log("Setting panic multisig through owner...");
      const Multisig = await ethers.getContractFactory("Multisig");
      const ownerMultisig = await Multisig.attach(ownerMultisigAddress);
      
      // Encode setPanicMultisig
      const encoded = dao.interface.encodeFunctionData("setPanicMultisig", [
        [deployer.address], 1
      ]);
      
      // Submit transaction
      const tx = await ownerMultisig.submitTransaction(
        daoAddress, 0, encoded, { gasLimit: 1000000 }
      );
      await tx.wait();
      
      // Get txId
      const filter = ownerMultisig.filters.SubmitTransaction();
      const events = await ownerMultisig.queryFilter(filter, -1);
      const txId = events[0].args[0];
      
      // Confirm and execute
      await ownerMultisig.confirmTransaction(txId, { gasLimit: 1000000 });
      await ownerMultisig.executeTransaction(txId, { gasLimit: 1000000 });
      
    } else {
      // Direct set (only works if no owner is set yet)
      console.log("No owner set, trying direct panic multisig creation...");
      await dao.setPanicWallet(deployer.address);
    }
    
    // Read updated panic address
    const newPanicAddress = await dao.panicMultisig();
    console.log(`New panic multisig: ${newPanicAddress}`);
  }

  // DEVELOPMENT ONLY: Directly modify DAO state
  // THIS SHOULD ONLY BE USED IN DEVELOPMENT ENVIRONMENT!
  console.log("Attempting to change DAO state directly for development...");
  
  try {
    // If it's paused, try to unpause
    if (isPaused) {
      console.log("DAO is currently paused. Attempting to unpause...");
      
      // Try using a development shortcut if available
      try {
        // Some contracts have dev-only functions
        await dao.tranquility({ gasLimit: 1000000 });
        console.log("Successfully called tranquility() directly (dev mode)");
      } catch (err) {
        console.log("Could not call tranquility directly, trying through panic multisig...");
        
        // Use the panic multisig
        const Multisig = await ethers.getContractFactory("Multisig");
        const panicMultisig = await Multisig.attach(panicMultisigAddress);
        
        // Encode tranquility call
        const encoded = dao.interface.encodeFunctionData("tranquility", []);
        
        // Submit transaction
        const tx = await panicMultisig.submitTransaction(
          daoAddress, 0, encoded, { gasLimit: 1000000 }
        );
        await tx.wait();
        
        // Get txId
        const filter = panicMultisig.filters.SubmitTransaction();
        const events = await panicMultisig.queryFilter(filter, -1);
        const txId = events[0].args[0];
        
        // Confirm and execute
        await panicMultisig.confirmTransaction(txId, { gasLimit: 1000000 });
        await panicMultisig.executeTransaction(txId, { gasLimit: 1000000 });
        
        console.log("Successfully unpaused through panic multisig");
      }
    } else {
      // If not paused, pause it for testing
      console.log("DAO is currently active. You can use it now!");
    }
    
    // Check new state
    const newState = await dao.isPaused();
    console.log(`New state: DAO is ${newState ? "PAUSED" : "ACTIVE"}`);
    
  } catch (error) {
    console.error("Error changing DAO state:", error);
    console.log("\nIMPORTANT: This might require manual intervention through the multisig contracts.");
    console.log("In a production system, coordinated multisig actions would be needed.");
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
