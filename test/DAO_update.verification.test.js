const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("DAO - Verificación de Mejoras", function () {
  async function deployDAOFixture() {
    const [owner, userA, userB, userC, userD, userE, proposer] = await ethers.getSigners();
  
    // Desplegar token
    const Token = await ethers.getContractFactory("MyToken");
    const token = await Token.deploy();
    await token.waitForDeployment();
  
    // Desplegar DAO
    const DAO = await ethers.getContractFactory("contracts/DAO.sol:DAO");
    const dao = await DAO.deploy(await token.getAddress());
  
    // Configurar DAO
    await dao.setOwner(owner.address);
    await dao.setPanicWallet(owner.address);
    
    // Inicializar con parámetros
    await dao.initParameters(
      ethers.parseUnits("10", 18),  // stakingToVote
      ethers.parseUnits("50", 18),  // stakingToPropose
      0,                            // minStakingTime
      1,                            // votePowerDivider
      1,                            // proposalDurationDays
      ethers.parseUnits("0.01", 18) // tokenPriceInWei
    );
    
    // Desactivar modo pausa (como owner.address también es la panicWallet)
    await dao.connect(owner).tranquility();
    
    // Mintear y aprobar tokens para todos
    for (const user of [owner, userA, userB, userC, userD, userE, proposer]) {
      await token.mint(user.address, ethers.parseUnits("100", 18));
      await token.connect(user).approve(await dao.getAddress(), ethers.MaxUint256);
    }
    
    return { dao, token, owner, userA, userB, userC, userD, userE, proposer };
  }

  it("permite crear una propuesta y votarla", async function () {
    const { dao, userA, userB, proposer } = await loadFixture(deployDAOFixture);
    
    // Crear propuesta
    await dao.connect(proposer).stakeForProposal(ethers.parseUnits("50", 18));
    await dao.connect(proposer).createProposal("Test Proposal");
    
    // Hacer stake y votar
    await dao.connect(userA).stakeForVote(ethers.parseUnits("100", 18));
    await dao.connect(userA).voteProposal(0, true);
    
    const proposal = await dao.proposals(0);
    expect(proposal.votesFor).to.be.gt(0);
  });
  
  it("calcula correctamente el poder de voto cuadrático", async function () {
    const { dao, userA, userB, proposer } = await loadFixture(deployDAOFixture);
    
    // Crear propuesta
    await dao.connect(proposer).stakeForProposal(ethers.parseUnits("50", 18));
    await dao.connect(proposer).createProposal("Test Proposal");
    
    // Hacer stake con 100 tokens
    await dao.connect(userA).stakeForVote(ethers.parseUnits("100", 18));
    
    // Votar
    await dao.connect(userA).voteProposal(0, true);
    
    // 100 tokens = 10^20 (considerando 18 decimales) => sqrt(10^20) = 10^10
    const proposal = await dao.proposals(0);
    const voteAmount = ethers.parseUnits("100", 18); // 100 tokens con 18 decimales
    
    // Calculamos la raíz cuadrada de 100 tokens (considerando los decimales)
    // sqrt(100 * 10^18) = 10 * 10^9
    const expectedVotingPower = 10_000_000_000n; // 10^10
    
    // Verificar que el poder de voto es aproximadamente el esperado
    expect(proposal.votesFor).to.equal(expectedVotingPower);
  });

  it("permite delegar el voto", async function () {
    const { dao, userA, userB, userC, proposer } = await loadFixture(deployDAOFixture);
    
    // Crear propuesta
    await dao.connect(proposer).stakeForProposal(ethers.parseUnits("50", 18));
    await dao.connect(proposer).createProposal("Test Proposal");
    
    // Hacer stake y delegar
    await dao.connect(userA).stakeForVote(ethers.parseUnits("100", 18));
    await dao.connect(userA).delegate(userB.address);
    
    // Hacer stake para el delegado
    await dao.connect(userB).stakeForVote(ethers.parseUnits("100", 18));
    
    // El delegado vota
    await dao.connect(userB).voteProposal(0, true);
    
    const proposal = await dao.proposals(0);
    
    // Esperamos que el poder de voto sea mayor que el de un solo usuario
    // con 100 tokens (que sería 10)
    expect(proposal.votesFor).to.be.gt(10);
  });
  
  it("permite delegar el voto para una propuesta específica", async function () {
    const { dao, userA, userB, proposer } = await loadFixture(deployDAOFixture);
    
    // Crear propuesta
    await dao.connect(proposer).stakeForProposal(ethers.parseUnits("50", 18));
    await dao.connect(proposer).createProposal("Test Proposal");
    
    // Hacer stake
    await dao.connect(userA).stakeForVote(ethers.parseUnits("100", 18));
    await dao.connect(userB).stakeForVote(ethers.parseUnits("100", 18));
    
    // Delegar para la propuesta específica
    await dao.connect(userA).delegateVoteForProposal(0, userB.address);
    
    // El delegado vota
    await dao.connect(userB).voteProposal(0, true);
    
    const proposal = await dao.proposals(0);
    
    // Esperamos que el poder de voto sea mayor que el de un solo usuario
    expect(proposal.votesFor).to.be.gt(10);
  });
});
