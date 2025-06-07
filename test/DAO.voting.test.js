const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

async function deployDAOFixture() {
    const [owner, proposer, voter, userExtra] = await ethers.getSigners();
  
    const Token = await ethers.getContractFactory("MyToken");
    const token = await Token.deploy();
    await token.waitForDeployment();
  
    const DAO = await ethers.getContractFactory("DAO");
    const dao = await DAO.deploy(await token.getAddress());
  
    await dao.setOwner(owner.address);
    await dao.setPanicWallet(owner.address);
    await dao.tranquility();
  
    await dao.initParameters(
      ethers.parseUnits("100", 18), 
      ethers.parseUnits("200", 18), 
      0,                            
      1,                            
      1,                            
      ethers.parseUnits("0.01", 18) 
    );
  
    return { dao, token, owner, proposer, voter, userExtra };
  }
  

describe("DAO - Votación y Ejecución de Propuestas", function () {
  let dao, token, owner, proposer, voter;

  beforeEach(async function () {
    [owner, proposer, voter] = await ethers.getSigners();

    // Desplegar el token y mintear tokens
    const Token = await ethers.getContractFactory("MyToken");
    token = await Token.deploy();
    await token.waitForDeployment();

    // Desplegar la DAO
    const DAO = await ethers.getContractFactory("DAO");
    dao = await DAO.deploy(await token.getAddress());

    // Setup inicial
    await dao.connect(owner).setOwner(await owner.getAddress());
    await dao.connect(owner).setPanicWallet(await proposer.getAddress());
    await dao.connect(proposer).tranquility();

    await dao.connect(owner).initParameters(
      ethers.parseUnits("100", 18), 
      ethers.parseUnits("200", 18), 
      0, 
      1, 
      1, 
      ethers.parseUnits("0.01", 18)
    );

    // Mintear tokens
    await token.connect(owner).mint(proposer.address, ethers.parseUnits("200", 18));
    await token.connect(owner).mint(voter.address, ethers.parseUnits("100", 18));

    // Aprobar y hacer staking para propuesta
    await token.connect(proposer).approve(await dao.getAddress(), ethers.MaxUint256);
    await dao.connect(proposer).stakeForProposal(ethers.parseUnits("200", 18));

    // Crear propuesta
    await dao.connect(proposer).createProposal("Propuesta Test");

    // Aprobar y hacer staking para votar
    await token.connect(voter).approve(await dao.getAddress(), ethers.MaxUint256);
    await dao.connect(voter).stakeForVote(ethers.parseUnits("100", 18));
  });

  it("debería permitir votar una propuesta a favor", async function () {
    await dao.connect(voter).voteProposal(0, true);
    const propuesta = await dao.proposals(0);
  
    const staked = BigInt(ethers.parseUnits("100", 18).toString());
    const expectedPower = sqrt(staked);
  
    expect(propuesta.votesFor).to.equal(expectedPower);
  });
  
  it("debería impedir votar dos veces", async function () {
    await dao.connect(voter).voteProposal(0, true);
    await expect(dao.connect(voter).voteProposal(0, true)).to.be.revertedWith("Already voted");
  });

  it("debería ejecutar una propuesta aprobada después del tiempo", async function () {
    await dao.connect(voter).voteProposal(0, true);

    // Avanza el tiempo 2 días
    await ethers.provider.send("evm_increaseTime", [2 * 24 * 60 * 60]);
    await ethers.provider.send("evm_mine");

    await dao.connect(owner).executeProposal(0);

    const prop = await dao.proposals(0);
    expect(prop.executed).to.be.true;
  });

  it("no debería ejecutar una propuesta rechazada", async function () {
    await dao.connect(voter).voteProposal(0, false);

    await ethers.provider.send("evm_increaseTime", [2 * 24 * 60 * 60]);
    await ethers.provider.send("evm_mine");

    await expect(dao.executeProposal(0)).to.be.revertedWith("Proposal not approved");
  });

  it("no debería ejecutar antes de que expire", async function () {
    await dao.connect(voter).voteProposal(0, true);
    await expect(dao.executeProposal(0)).to.be.revertedWith("Proposal still active");
  });

  it("no debería ejecutar dos veces", async function () {
    await dao.connect(voter).voteProposal(0, true);

    await ethers.provider.send("evm_increaseTime", [2 * 24 * 60 * 60]);
    await ethers.provider.send("evm_mine");

    await dao.executeProposal(0);
    await expect(dao.executeProposal(0)).to.be.revertedWith("Already executed");
  });

  it("debería permitir delegar el voto solo para una propuesta", async function () {
    const { dao, token, owner, proposer, voter } = await loadFixture(deployDAOFixture);
  
    await token.connect(owner).mint(proposer.address, ethers.parseUnits("300", 18));
    await token.connect(owner).mint(voter.address, ethers.parseUnits("100", 18));
    await token.connect(proposer).approve(await dao.getAddress(), ethers.MaxUint256);
    await token.connect(voter).approve(await dao.getAddress(), ethers.MaxUint256);
  
    await dao.connect(proposer).stakeForProposal(ethers.parseUnits("200", 18));
    await dao.connect(voter).stakeForVote(ethers.parseUnits("100", 18));
    await dao.connect(proposer).createProposal("Test Proposal");
  
    // Un nuevo votante sin stake
    const [_, __, ___, delegator, delegatee] = await ethers.getSigners();
    await token.connect(owner).mint(delegator.address, ethers.parseUnits("100", 18));
    await token.connect(delegator).approve(await dao.getAddress(), ethers.MaxUint256);
    await dao.connect(delegator).stakeForVote(ethers.parseUnits("100", 18));
  
    // Delegador delega su voto a voter para esta propuesta
    await dao.connect(delegator).delegateVoteForProposal(0, voter.address);
  
    // Voter ahora tiene su poder + el del delegador
    await dao.connect(voter).voteProposal(0, true);
    const prop = await dao.proposals(0);
    const sqrt = (n) => {
        return BigInt(Math.floor(Math.sqrt(Number(n))));
    };
      
      const expected = sqrt(ethers.parseUnits("100", 18)) + sqrt(ethers.parseUnits("100", 18));
      expect(prop.votesFor).to.equal(expected);      
  });  

  // funcion de sqrt
  function sqrt(value) {
    if (value === 0n) return 0n;
    let z = (value + 1n) / 2n;
    let y = value;
    while (z < y) {
      y = z;
      z = (value / z + z) / 2n;
    }
    return y;
  }
  
});
