// Script to send ETH to a specific account from the default Hardhat account
const { ethers } = require("hardhat");

async function main() {
  // Get accounts
  const [deployer] = await ethers.getSigners();
  console.log(`Sending from account: ${deployer.address}`);
  
  // Show balance of sender
  const deployerBalance = await ethers.provider.getBalance(deployer.address);
  console.log(`Sender balance: ${ethers.formatEther(deployerBalance)} ETH`);

  // Default recipient is the account connected to MetaMask
  // You can change this to any address you want
  let recipientAddress = process.env.RECIPIENT || "0xYOUR_ACCOUNT_ADDRESS"; // <-- Replace with your account address
  
  if (recipientAddress === "0xYOUR_ACCOUNT_ADDRESS") {
    console.log("Please set your account address in the script or pass it as RECIPIENT environment variable");
    console.log("For example:");
    console.log("RECIPIENT=0x123... npx hardhat run scripts/send_eth_to_account.js --network localhost");
    
    // If this script is run directly using `node` command, you can pass recipient as command line argument
    if (process.argv.length > 2) {
      recipientAddress = process.argv[2];
      console.log(`Using address from command line: ${recipientAddress}`);
    } else {
      process.exit(1);
    }
  }
  
  console.log(`Recipient address: ${recipientAddress}`);
  
  // Amount to send in ETH (default: 10 ETH)
  const amountInEth = process.env.AMOUNT || "10";
  const amountInWei = ethers.parseEther(amountInEth);
  console.log(`Sending ${amountInEth} ETH...`);
  
  // Show initial balance of recipient
  try {
    const initialBalance = await ethers.provider.getBalance(recipientAddress);
    console.log(`Initial recipient balance: ${ethers.formatEther(initialBalance)} ETH`);
  } catch (error) {
    console.log("Could not retrieve recipient balance. Make sure the address is valid.");
  }
  
  // Send ETH
  try {
    const tx = await deployer.sendTransaction({
      to: recipientAddress,
      value: amountInWei,
      gasLimit: 100000
    });
    
    console.log(`Transaction sent: ${tx.hash}`);
    await tx.wait();
    console.log("Transaction confirmed!");
    
    // Show new balance of recipient
    const newBalance = await ethers.provider.getBalance(recipientAddress);
    console.log(`New recipient balance: ${ethers.formatEther(newBalance)} ETH`);
    
  } catch (error) {
    console.error("Error sending ETH:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
