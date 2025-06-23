// Script to advance time in the blockchain
const { ethers } = require("hardhat");

async function main() {
  // Amount of time to advance in seconds
  const timeToAdvance = process.env.ADVANCE_TIME || 7200; // Default: 2 hours (7200 seconds)
  
  console.log(`Advancing blockchain time by ${timeToAdvance} seconds...`);
  
  try {
    // Get current block timestamp
    const block = await ethers.provider.getBlock("latest");
    const currentTimestamp = block.timestamp;
    console.log(`Current timestamp: ${currentTimestamp} (${new Date(currentTimestamp * 1000).toLocaleString()})`);
    
    // Advance time
    await hre.network.provider.send("evm_increaseTime", [Number(timeToAdvance)]);
    
    // Mine a new block with the updated timestamp
    await hre.network.provider.send("evm_mine");
    
    // Get new block timestamp
    const newBlock = await ethers.provider.getBlock("latest");
    const newTimestamp = newBlock.timestamp;
    console.log(`New timestamp: ${newTimestamp} (${new Date(newTimestamp * 1000).toLocaleString()})`);
    
    console.log(`Advanced time by ${newTimestamp - currentTimestamp} seconds`);
    
  } catch (error) {
    console.error("Error advancing time:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
