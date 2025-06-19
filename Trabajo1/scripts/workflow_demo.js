const { ethers } = require("hardhat");

async function main() {
  const [deployer, user1, user2] = await ethers.getSigners();
  
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)));
  
  // 1. Deploy OrtToken
  const OrtToken = await ethers.getContractFactory("OrtToken");
  const token = await OrtToken.deploy(ethers.parseEther("1000000"));
  await token.waitForDeployment();
  console.log("OrtToken deployed to:", await token.getAddress());
  
  // 2. Deploy UyArt NFT
  const UyArt = await ethers.getContractFactory("UyArt");
  const nft = await UyArt.deploy();
  await nft.waitForDeployment();
  console.log("UyArt NFT deployed to:", await nft.getAddress());
  
  // 3. Deploy StakeForNFT
  const StakeForNFT = await ethers.getContractFactory("StakeForNFT");
  const staking = await StakeForNFT.deploy(await token.getAddress(), await nft.getAddress());
  await staking.waitForDeployment();
  console.log("StakeForNFT deployed to:", await staking.getAddress());
  
  // 4. Set staking contract in NFT
  await nft.setStakingContract(await staking.getAddress());
  console.log("Set staking contract in NFT");
  
  // 5. Transfer tokens to users for staking
  await token.transfer(user1.address, ethers.parseEther("30000"));
  await token.transfer(user2.address, ethers.parseEther("20000"));
  console.log("Transferred tokens to users");
  
  // 6. Users approve and stake tokens
  await token.connect(user1).approve(await staking.getAddress(), ethers.parseEther("10000"));
  await staking.connect(user1).stake(ethers.parseEther("10000"));
  console.log("User1 staked 10,000 tokens");
  
  await token.connect(user2).approve(await staking.getAddress(), ethers.parseEther("5000"));
  await staking.connect(user2).stake(ethers.parseEther("5000"));
  console.log("User2 staked 5,000 tokens");
  
  // 7. Display current state
  const user1Stake = await staking.stakes(user1.address);
  const user2Stake = await staking.stakes(user2.address);
  const totalStaked = await staking.totalStaked();
  
  console.log("User1 staked amount:", ethers.formatEther(user1Stake.balance));
  console.log("User2 staked amount:", ethers.formatEther(user2Stake.balance));
  console.log("Total staked:", ethers.formatEther(totalStaked));
  
  // 8. Fast forward to after staking period
  console.log("\nFast-forwarding 1,001 blocks to simulate end of staking period...");
  const deployedBlock = await staking.deployedBlock();
  const currentBlock = await ethers.provider.getBlockNumber();
  const blocksToMine = Number(deployedBlock) + 1001 - currentBlock;
  
  for (let i = 0; i < blocksToMine; i++) {
    if (i % 100 === 0) {
      console.log(`Mining block ${i}/${blocksToMine}...`);
    }
    await ethers.provider.send("evm_mine");
  }
  
  console.log("Staking period has ended");
  
  // 9. Users claim their NFTs
  await staking.connect(user1).claimNFTs();
  console.log("User1 claimed NFTs");
  
  await staking.connect(user2).claimNFTs();
  console.log("User2 claimed NFTs");
  
  // 10. Check NFT balances
  const user1NFTs = await nft.balanceOf(user1.address);
  const user2NFTs = await nft.balanceOf(user2.address);
  const totalSupply = await nft.totalSupply();
  
  console.log("\nFinal NFT Balances:");
  console.log("User1 NFTs:", user1NFTs.toString());
  console.log("User2 NFTs:", user2NFTs.toString());
  console.log("Total NFTs minted:", totalSupply.toString());
  console.log("Max supply:", (await nft.maxSupply()).toString());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
