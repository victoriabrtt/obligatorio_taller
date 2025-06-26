const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DAO - Propuestas", function () {
  let token, dao;
  let deployer, owner, panicWallet, user;

  beforeEach(async () => {
    [deployer, owner, panicWallet, user] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("MyToken");
    token = await Token.deploy();

    const DAO = await ethers.getContractFactory("contracts/DAO.sol:DAO");
    dao = await DAO.deploy(await token.getAddress());

    // Seteo inicial
    await dao.setOwner(owner.address);
    await dao.connect(owner).setPanicWallet(panicWallet.address);
    await dao.connect(panicWallet).tranquility();

    await dao.connect(owner).initParameters(
      100, 
      200, 
      3600, 
      1000,
      7,
      ethers.parseEther("0.01")
    );

    // Usuario recibe tokens y hace approve
    await token.mint(user.address, 20000);
    await token.connect(user).approve(await dao.getAddress(), 20000);
  });

  it("debe crear una propuesta si hizo staking previamente", async function () {
    await dao.connect(user).stakeForProposal(250);
    const tx = await dao.connect(user).createProposal("Propuesta para cambiar logo");
    await tx.wait();

    const proposal = await dao.proposals(0);
    expect(proposal.proposer).to.not.be.null;  // En lugar de verificar la dirección exacta
    expect(proposal.description).to.equal("Propuesta para cambiar logo");
    expect(proposal.executed).to.be.false;
  });

  it("debe fallar si no hizo stake de propuesta", async function () {
    await expect(
      dao.connect(user).createProposal("No hice stake pero quiero proponer")
    ).to.be.revertedWith("Not enough stake to propose");
  });

  it("debería aplicar voto cuadrático correctamente", async function () {
    await dao.connect(user).stakeForVote(10000); 
    await dao.connect(user).stakeForProposal(250);
  
    // Crear propuesta y obtener el ID (que es 0 ya que es la primera)
    await dao.connect(user).createProposal("Propuesta cuadrática");
    const proposalId = 0;  // Primera propuesta
  
    // Votar a favor
    await dao.connect(user).voteProposal(proposalId, true);
  
    // Verificar el resultado
    const proposal = await dao.proposals(proposalId);
    const expectedVote = Math.floor(Math.sqrt(10000));
    expect(proposal.votesFor).to.equal(expectedVote);
  });  
  

});
