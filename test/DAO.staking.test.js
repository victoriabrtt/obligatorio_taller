const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DAO - Staking", function () {
  let token, dao;
  let deployer, owner, panicWallet, user;

  beforeEach(async () => {
    [deployer, owner, panicWallet, user] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("MyToken");
    token = await Token.deploy();

    const DAO = await ethers.getContractFactory("DAO");
    dao = await DAO.deploy(await token.getAddress());

    // Set owner y pánico
    await dao.setOwner(owner.address);
    await dao.connect(owner).setPanicWallet(panicWallet.address);
    await dao.connect(panicWallet).tranquility();

    // Inicializar parámetros
    await dao.connect(owner).initParameters(
      100, // stakingToVote
      200, // stakingToPropose
      3600, // minStakingTime = 1 hora
      1000,
      7,
      ethers.parseEther("0.01")
    );

    // Mint tokens al user y approve
    await token.mint(user.address, 1000);
    await token.connect(user).approve(await dao.getAddress(), 1000);
  });

  it("should allow stake for vote", async function () {
    await dao.connect(user).stakeForVote(150);
    const stake = await dao.voteStakes(user.address);
    expect(stake.amount).to.equal(150);
  });

  it("should not allow staking for vote twice", async function () {
    await dao.connect(user).stakeForVote(150);
    await expect(dao.connect(user).stakeForVote(150)).to.be.revertedWith("Already staked");
  });

  it("should allow stake for proposal", async function () {
    await dao.connect(user).stakeForProposal(250);
    const stake = await dao.proposalStakes(user.address);
    expect(stake.amount).to.equal(250);
  });

  it("should not allow unstaking vote before time", async function () {
    await dao.connect(user).stakeForVote(150);
    await expect(dao.connect(user).unstakeVote()).to.be.revertedWith("Staking time not met");
  });

  it("should allow unstaking vote after time", async function () {
    await dao.connect(user).stakeForVote(150);

    // Avanza el tiempo 2 horas
    await ethers.provider.send("evm_increaseTime", [7200]);
    await ethers.provider.send("evm_mine");

    await dao.connect(user).unstakeVote();

    const stake = await dao.voteStakes(user.address);
    expect(stake.amount).to.equal(0);
  });

  it("should allow unstaking proposal after time", async function () {
    await dao.connect(user).stakeForProposal(250);

    await ethers.provider.send("evm_increaseTime", [7200]);
    await ethers.provider.send("evm_mine");

    await dao.connect(user).unstakeProposal();

    const stake = await dao.proposalStakes(user.address);
    expect(stake.amount).to.equal(0);
  });

  it("debe fallar al deshacer stake si no tiene tokens", async function () {
    await expect(dao.connect(user).unstakeVote()).to.be.revertedWith("No tokens staked");
  });

  it("debe fallar si intenta deshacer stake antes del tiempo", async function () {
    await dao.connect(user).stakeForVote(150);
    await expect(dao.connect(user).unstakeVote()).to.be.revertedWith("Staking time not met");
  });
  
  it("debe fallar si intenta unstake sin haber staked", async function () {
    await expect(dao.connect(user).unstakeVote()).to.be.revertedWith("No tokens staked");
  });

  it("no permite hacer stake dos veces", async function () {
    await dao.connect(user).stakeForVote(150);
    await expect(dao.connect(user).stakeForVote(150)).to.be.revertedWith("Already staked");
  });
  
  it("debe fallar si intenta unstake antes de que se cumpla el tiempo mínimo", async function () {
    await dao.connect(user).stakeForVote(150);
  
    // No avanza el tiempo, intenta directamente
    await expect(dao.connect(user).unstakeVote()).to.be.revertedWith("Staking time not met");
  });

  it("debe fallar si intenta stake para propuesta dos veces sin unstake", async function () {
    await dao.connect(user).stakeForProposal(250);
  
    await expect(
      dao.connect(user).stakeForProposal(250)
    ).to.be.revertedWith("Already staked");
  });

  it("debe fallar si intenta unstake sin haber hecho stake", async function () {
    await expect(
      dao.connect(user).unstakeVote()
    ).to.be.revertedWith("No tokens staked");
  });  
  
});
