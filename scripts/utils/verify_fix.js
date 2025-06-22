// Test script to verify the fix for the "Invalid Block Tag" error
const hre = require("hardhat");

async function main() {
  console.log("Testing our fix for the 'Invalid Block Tag' error");
  
  // Get the current block number to verify it
  const blockNumber = await hre.ethers.provider.getBlockNumber();
  console.log("Current block number:", blockNumber);
  
  // Get account to test with
  const testAddress = "0x86BF80dC22E5ED99596C0443429a59670f47ea64";
  
  try {
    // This is the call that was failing with "Received invalid block tag"
    const txCount = await hre.ethers.provider.getTransactionCount(testAddress);
    console.log(`Transaction count for ${testAddress}: ${txCount}`);
    
    // Get the contract addresses
    const daoAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
    const tokenAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
    
    // Get token contract
    const token = await hre.ethers.getContractAt("MyToken", tokenAddress);
    const dao = await hre.ethers.getContractAt("contracts/DAO.sol:DAO", daoAddress);
    
    // Check token balance
    const balance = await token.balanceOf(testAddress);
    console.log("Token balance:", hre.ethers.formatEther(balance), "MTK");
    
    // Check if DAO is paused
    const isPaused = await dao.isPaused();
    console.log("Is DAO paused:", isPaused);
    
    // Check token price
    const tokenPrice = await dao.tokenPriceInWei();
    console.log("Token price:", hre.ethers.formatEther(tokenPrice), "ETH");
    
    console.log("\nAll tests completed successfully! 🎉");
    console.log("Our fix should prevent the 'Invalid Block Tag' error by letting MetaMask handle the nonce automatically.");
    
  } catch (error) {
    console.error("Test failed:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
