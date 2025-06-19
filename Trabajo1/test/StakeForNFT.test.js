const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("StakeForNFT", function () {
  let OrtToken, token;
  let UyArt, nft;
  let StakeForNFT, staking;
  let owner, user1, user2;
  
  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    
    // Deploy OrtToken
    OrtToken = await ethers.getContractFactory("OrtToken");
    token = await OrtToken.deploy(ethers.parseEther("1000000"));
    await token.waitForDeployment();
    
    // Deploy UyArt
    UyArt = await ethers.getContractFactory("UyArt");
    nft = await UyArt.deploy();
    await nft.waitForDeployment();
    
    // Deploy StakeForNFT
    StakeForNFT = await ethers.getContractFactory("StakeForNFT");
    staking = await StakeForNFT.deploy(await token.getAddress(), await nft.getAddress());
    await staking.waitForDeployment();
    
    // Configure NFT staking contract
    await nft.setStakingContract(await staking.getAddress());
    
    // Transfer tokens to users for testing
    await token.transfer(user1.address, ethers.parseEther("10000"));
    await token.transfer(user2.address, ethers.parseEther("10000"));
  });
  
  it("Should allow staking only within 1000 blocks", async function () {
    // Approve tokens for staking
    await token.connect(user1).approve(await staking.getAddress(), ethers.parseEther("5000"));
    
    // Check initial deployment block
    const deployedBlock = await staking.deployedBlock();
    
    // Stake tokens
    await staking.connect(user1).stake(ethers.parseEther("5000"));
    
    // Check user stake
    const stakeRecord = await staking.stakes(user1.address);
    expect(stakeRecord.balance).to.equal(ethers.parseEther("5000"));
    
    // Move blocks forward (simulating passing the staking window)
    for (let i = 0; i < 1001; i++) {
      await ethers.provider.send("evm_mine");
    }
    
    // Try to stake after window closed (should fail)
    await token.connect(user2).approve(await staking.getAddress(), ethers.parseEther("2000"));
    await expect(staking.connect(user2).stake(ethers.parseEther("2000"))).to.be.revertedWith("Periodo de staking finalizado");
  });
  
  it("Should only accept stakes in multiples of 1000", async function () {
    // Approve tokens for staking
    await token.connect(user1).approve(await staking.getAddress(), ethers.parseEther("3500"));
    
    // Try to stake invalid amount (should fail)
    await expect(staking.connect(user1).stake(ethers.parseEther("900"))).to.be.revertedWith("El monto debe ser al menos 1000 tokens");
    await expect(staking.connect(user1).stake(ethers.parseEther("1500"))).to.be.revertedWith("El monto debe ser multiplo de 1000 tokens");
    
    // Stake valid amount
    await staking.connect(user1).stake(ethers.parseEther("3000"));
    
    // Check user stake
    const stakeRecord = await staking.stakes(user1.address);
    expect(stakeRecord.balance).to.equal(ethers.parseEther("3000"));
  });
  
  it("Should enforce max total staking limit", async function () {
    // Give user1 enough tokens and approve for staking
    await token.transfer(user1.address, ethers.parseEther("90000"));
    await token.connect(user1).approve(await staking.getAddress(), ethers.parseEther("101000"));
    
    // Stake up to max limit
    await staking.connect(user1).stake(ethers.parseEther("95000"));
    
    // Try to stake more (should fail if total > MAX_TOTAL_STAKED)
    await token.connect(user2).approve(await staking.getAddress(), ethers.parseEther("6000"));
    await expect(staking.connect(user2).stake(ethers.parseEther("6000"))).to.be.revertedWith("Excede el maximo total de staking");
    
    // Stake remaining amount should work
    await staking.connect(user2).stake(ethers.parseEther("5000"));
    
    // Check total staked
    const totalStaked = await staking.totalStaked();
    expect(totalStaked).to.equal(ethers.parseEther("100000"));
  });
  
  it("Should allow claiming NFTs after staking period", async function () {
    // Approve and stake tokens
    await token.connect(user1).approve(await staking.getAddress(), ethers.parseEther("3000"));
    await staking.connect(user1).stake(ethers.parseEther("3000"));
    
    // Move blocks forward (simulating passing the staking window)
    for (let i = 0; i < 1001; i++) {
      await ethers.provider.send("evm_mine");
    }
    
    // Claim NFTs
    await staking.connect(user1).claimNFTs();
    
    // Check NFT balance (3 NFTs for 3000 tokens)
    const nftBalance = await nft.balanceOf(user1.address);
    expect(nftBalance).to.equal(3);
    
    // Try to claim again (should fail)
    await expect(staking.connect(user1).claimNFTs()).to.be.revertedWith("NFTs ya reclamados");
  });
});
