const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("UyArt NFT", function () {
  let UyArt, nft;
  let StakeForNFT, staking;
  let OrtToken, token;
  let owner, staker, recipient, operator;
  const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
  
  beforeEach(async function () {
    [owner, staker, recipient, operator] = await ethers.getSigners();
    
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
    
    // Transfer tokens to staker
    await token.transfer(staker.address, ethers.parseEther("10000"));
  });

  describe("Basic NFT functionality", function () {
    it("Should return correct name and symbol", async function () {
      expect(await nft.name()).to.equal("Uruguay Art Collection");
      expect(await nft.symbol()).to.equal("UYART");
    });

    it("Should allow setting staking contract only by owner", async function () {
      await expect(nft.connect(staker).setStakingContract(staker.address))
        .to.be.revertedWith("UyArt: solo el propietario puede configurar el contrato de staking");
      
      await nft.setStakingContract(operator.address);
      expect(await nft.stakingContract()).to.equal(operator.address);
    });
    
    it("Should limit minting to staking contract", async function () {
      // Configure staking contract for testing
      await nft.setStakingContract(owner.address);
      
      // Mint a token
      await nft.mint(staker.address, "test_metadata");
      
      // Check token ownership
      expect(await nft.balanceOf(staker.address)).to.equal(1);
      expect(await nft.ownerOf(1)).to.equal(staker.address);
      
      // Try to mint with non-staking address
      await nft.setStakingContract(staking.getAddress());
      await expect(nft.mint(staker.address, "test_metadata"))
        .to.be.revertedWith("UyArt: solo el contrato de staking puede mintear");
    });
  });

  describe("Token transfers and approvals", function () {
    beforeEach(async function () {
      // Configure staking contract
      await nft.setStakingContract(owner.address);
      
      // Mint tokens for testing
      await nft.mint(staker.address, "test_metadata_1");
      await nft.mint(staker.address, "test_metadata_2");
    });

    it("Should allow token transfer", async function () {
      await nft.connect(staker).transferFrom(staker.address, recipient.address, 1);
      
      expect(await nft.ownerOf(1)).to.equal(recipient.address);
      expect(await nft.balanceOf(staker.address)).to.equal(1);
      expect(await nft.balanceOf(recipient.address)).to.equal(1);
    });

    it("Should handle approvals correctly", async function () {
      // Single token approval
      await nft.connect(staker).approve(operator.address, 1);
      expect(await nft.getApproved(1)).to.equal(operator.address);
      
      // Operator can transfer
      await nft.connect(operator).transferFrom(staker.address, recipient.address, 1);
      expect(await nft.ownerOf(1)).to.equal(recipient.address);
      
      // Approval for all
      await nft.connect(staker).setApprovalForAll(operator.address, true);
      expect(await nft.isApprovedForAll(staker.address, operator.address)).to.be.true;
      
      // Operator can transfer all approved tokens
      await nft.connect(operator).transferFrom(staker.address, recipient.address, 2);
      expect(await nft.ownerOf(2)).to.equal(recipient.address);
    });

    it("Should reject invalid transfers and approvals", async function () {
      // Cannot transfer without ownership or approval
      await expect(nft.connect(recipient).transferFrom(staker.address, recipient.address, 1))
        .to.be.revertedWith("UyArt: transferencia no autorizada");
      
      // Cannot approve to zero address
      await expect(nft.connect(staker).approve(ZERO_ADDRESS, 999))
        .to.be.revertedWith("UyArt: propietario consulta para token inexistente");
      
      // Cannot approve to self
      await expect(nft.connect(staker).setApprovalForAll(staker.address, true))
        .to.be.revertedWith("UyArt: aprobacion a uno mismo");
    });
    
    it("Should handle different transfer methods", async function () {
      // Regular transfer
      await nft.connect(staker)["transferFrom(address,address,uint256)"](staker.address, recipient.address, 1);
      expect(await nft.ownerOf(1)).to.equal(recipient.address);
      
      // "Safe" transfer (in our implementation, it's the same as regular transfer)
      const tx = await nft.connect(staker)["transferFrom(address,address,uint256)"](staker.address, recipient.address, 2);
      await tx.wait();
      expect(await nft.ownerOf(2)).to.equal(recipient.address);
    });
  });

  describe("Token metadata", function () {
    beforeEach(async function () {
      // Configure staking contract
      await nft.setStakingContract(owner.address);
      
      // Mint a token with metadata
      await nft.mint(staker.address, "QmTest123");
    });

    it("Should return correct token URI", async function () {
      expect(await nft.tokenURI(1)).to.equal("ipfs://QmTest123");
    });

    it("Should revert when querying non-existent token", async function () {
      await expect(nft.tokenURI(999))
        .to.be.revertedWith("UyArt: consulta para token inexistente");
    });
  });

  describe("Token supply", function () {
    it("Should track total supply correctly", async function () {
      await nft.setStakingContract(owner.address);
      
      expect(await nft.totalSupply()).to.equal(0);
      
      await nft.mint(staker.address, "test1");
      expect(await nft.totalSupply()).to.equal(1);
      
      await nft.mint(staker.address, "test2");
      expect(await nft.totalSupply()).to.equal(2);
    });

    it("Should enforce max supply", async function () {
      await nft.setStakingContract(owner.address);
      
      // Mint to the max
      for (let i = 0; i < 100; i++) {
        await nft.mint(staker.address, `test${i}`);
      }
      
      expect(await nft.totalSupply()).to.equal(100);
      
      // Try to mint one more
      await expect(nft.mint(staker.address, "tooMany"))
        .to.be.revertedWith("UyArt: Superado el maximo supply");
    });
    
    it("Should return tokens of owner", async function () {
      await nft.setStakingContract(owner.address);
      
      // Mint 3 tokens
      await nft.mint(staker.address, "test1");
      await nft.mint(staker.address, "test2");
      await nft.mint(staker.address, "test3");
      
      // Get tokens of owner
      const tokens = await nft.tokensOfOwner(staker.address);
      expect(tokens.length).to.equal(3);
      expect(tokens[0]).to.equal(1);
      expect(tokens[1]).to.equal(2);
      expect(tokens[2]).to.equal(3);
      
      // Empty array for address with no tokens
      const noTokens = await nft.tokensOfOwner(recipient.address);
      expect(noTokens.length).to.equal(0);
    });
  });
});
