const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy OrtToken
  const OrtToken = await ethers.getContractFactory("OrtToken");
  const token = await OrtToken.deploy(ethers.parseEther("1000000"));
  await token.waitForDeployment();
  console.log("OrtToken deployed to:", await token.getAddress());

  // Deploy UyArt
  const UyArt = await ethers.getContractFactory("UyArt");
  const nft = await UyArt.deploy();
  await nft.waitForDeployment();
  console.log("UyArt NFT deployed to:", await nft.getAddress());

  // Deploy StakeForNFT
  const StakeForNFT = await ethers.getContractFactory("StakeForNFT");
  const staking = await StakeForNFT.deploy(await token.getAddress(), await nft.getAddress());
  await staking.waitForDeployment();
  console.log("StakeForNFT deployed to:", await staking.getAddress());

  // Configure NFT staking contract
  const setTx = await nft.setStakingContract(await staking.getAddress());
  await setTx.wait();
  console.log("Set staking contract in NFT");

  // Transfer some tokens to the deployer for testing
  const transferTx = await token.transfer(deployer.address, ethers.parseEther("500000"));
  await transferTx.wait();
  console.log("Transferred 500,000 tokens to deployer");

  console.log("Current block number:", await ethers.provider.getBlockNumber());
  console.log("Staking window will be open for 1000 blocks");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
