const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("DAO_update - Pruebas Completas", function() {
  // Fixture para desplegar todos los contratos necesarios
  async function deployDAOFixture() {
    const [owner, userA, userB, userC, userD, proposer] = await ethers.getSigners();
    
    // Desplegar el contrato de token
    const Token = await ethers.getContractFactory("MyToken");
    const token = await Token.deploy();
    await token.waitForDeployment();
    
    // Desplegar la DAO 
    const DAO = await ethers.getContractFactory("contracts/DAO_update.sol:DAO_update");
    const dao = await DAO.deploy(await token.getAddress());
    await dao.waitForDeployment();
    
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
    
    // Desactivar modo pausa
    await dao.connect(owner).tranquility();
    await dao.waitForDeployment();
    
    // Transferir tokens a los usuarios
    await token.transfer(userA.address, ethers.parseUnits("1000", 18));
    await token.transfer(userB.address, ethers.parseUnits("1000", 18));
    await token.transfer(userC.address, ethers.parseUnits("1000", 18));
    await token.transfer(userD.address, ethers.parseUnits("1000", 18));
    await token.transfer(proposer.address, ethers.parseUnits("1000", 18));
    
    // Aprobar tokens para la DAO
    await token.connect(userA).approve(await dao.getAddress(), ethers.parseUnits("1000", 18));
    await token.connect(userB).approve(await dao.getAddress(), ethers.parseUnits("1000", 18));
    await token.connect(userC).approve(await dao.getAddress(), ethers.parseUnits("1000", 18));
    await token.connect(userD).approve(await dao.getAddress(), ethers.parseUnits("1000", 18));
    await token.connect(proposer).approve(await dao.getAddress(), ethers.parseUnits("1000", 18));
    
    return { dao, token, multisigFactory, owner, userA, userB, userC, userD, proposer };
  }
  
  // Utilidad para avanzar el tiempo en la blockchain
  async function advanceTime(seconds) {
    await ethers.provider.send("evm_increaseTime", [seconds]);
    await ethers.provider.send("evm_mine");
  }
  
  // Utilidad para calcular la raíz cuadrada en los tests
  function sqrt(value) {
    return BigInt(Math.floor(Math.sqrt(Number(value))));
  }
  
  describe("Funcionalidad Básica", function() {
    it("permite crear una propuesta y votarla", async function () {
      const { dao, userA, proposer } = await loadFixture(deployDAOFixture);
      
      // Crear propuesta
      await dao.connect(proposer).stakeForProposal(ethers.parseUnits("50", 18));
      await dao.connect(proposer).createProposal("Test Proposal");
      
      // Hacer stake y votar
      await dao.connect(userA).stakeForVote(ethers.parseUnits("100", 18));
      await dao.connect(userA).voteProposal(0, true);
      
      const proposal = await dao.proposals(0);
      expect(proposal.votesFor).to.equal(10_000_000_000n);
    });
    
    it("calcula correctamente el poder de voto cuadrático", async function () {
      const { dao, userA, proposer } = await loadFixture(deployDAOFixture);
      
      // Crear propuesta
      await dao.connect(proposer).stakeForProposal(ethers.parseUnits("50", 18));
      await dao.connect(proposer).createProposal("Test Proposal");
      
      // Hacer stake con 100 tokens
      await dao.connect(userA).stakeForVote(ethers.parseUnits("100", 18));
      
      // Votar
      await dao.connect(userA).voteProposal(0, true);
      
      // 100 tokens = 10^20 (considerando 18 decimales) => sqrt(10^20) = 10^10
      const proposal = await dao.proposals(0);
      const expectedVotingPower = 10_000_000_000n; // 10^10
      
      // Verificar que el poder de voto es aproximadamente el esperado
      expect(proposal.votesFor).to.equal(expectedVotingPower);
    });
  });
  
  describe("Delegación", function() {
    it("permite delegar el voto", async function () {
      const { dao, userA, userB, proposer } = await loadFixture(deployDAOFixture);
      
      // Crear propuesta
      await dao.connect(proposer).stakeForProposal(ethers.parseUnits("50", 18));
      await dao.connect(proposer).createProposal("Test Proposal");
      
      // Hacer stake y delegar
      await dao.connect(userA).stakeForVote(ethers.parseUnits("100", 18));
      await dao.connect(userA).delegate(userB.address);
      
      // userB vota y debe incluir el poder de voto de userA
      await dao.connect(userB).stakeForVote(ethers.parseUnits("100", 18));
      await dao.connect(userB).voteProposal(0, true);
      
      const proposal = await dao.proposals(0);
      const expectedVotingPower = 20_000_000_000n; // 10^10 + 10^10
      
      // Verificar que el poder de voto incluye el de ambos usuarios
      expect(proposal.votesFor).to.equal(expectedVotingPower);
    });
    
    it("permite delegar el voto para una propuesta específica", async function () {
      const { dao, userA, userB, userC, proposer } = await loadFixture(deployDAOFixture);
      
      // Crear propuesta
      await dao.connect(proposer).stakeForProposal(ethers.parseUnits("50", 18));
      await dao.connect(proposer).createProposal("Test Proposal");
      await dao.connect(proposer).createProposal("Test Proposal 2");
      
      // UserA hace stake
      await dao.connect(userA).stakeForVote(ethers.parseUnits("100", 18));
      
      // UserA delega a userB solo para la propuesta 0
      await dao.connect(userA).delegateForProposal(0, userB.address);
      
      // UserB vota en propuesta 0 (incluye voto de userA)
      await dao.connect(userB).stakeForVote(ethers.parseUnits("100", 18));
      await dao.connect(userB).voteProposal(0, true);
      
      // UserA vota directamente en propuesta 1
      await dao.connect(userA).voteProposal(1, true);
      
      const proposal0 = await dao.proposals(0);
      const proposal1 = await dao.proposals(1);
      
      // En propuesta 0, el poder de userB incluye el de userA
      expect(proposal0.votesFor).to.equal(20_000_000_000n);
      
      // En propuesta 1, solo el poder de userA
      expect(proposal1.votesFor).to.equal(10_000_000_000n);
    });
    
    it("no permite delegaciones circulares", async function () {
      const { dao, userA, userB } = await loadFixture(deployDAOFixture);
      
      // Hacer stake
      await dao.connect(userA).stakeForVote(ethers.parseUnits("100", 18));
      await dao.connect(userB).stakeForVote(ethers.parseUnits("100", 18));
      
      // A delega en B
      await dao.connect(userA).delegate(userB.address);
      
      // B intenta delegar en A, debería fallar
      await expect(
        dao.connect(userB).delegate(userA.address)
      ).to.be.revertedWith("Circular delegation detected");
    });
    
    it("no permite votar después de delegar", async function () {
      const { dao, userA, userB, proposer } = await loadFixture(deployDAOFixture);
      
      // Crear propuesta
      await dao.connect(proposer).stakeForProposal(ethers.parseUnits("50", 18));
      await dao.connect(proposer).createProposal("Test Proposal");
      
      // UserA hace stake y delega a userB
      await dao.connect(userA).stakeForVote(ethers.parseUnits("100", 18));
      await dao.connect(userA).delegate(userB.address);
      
      // UserA intenta votar, debería fallar
      await expect(
        dao.connect(userA).voteProposal(0, true)
      ).to.be.revertedWith("Cannot vote after delegating");
    });
  });
  
  describe("Propuestas y Ejecución", function() {
    it("permite obtener el número total de propuestas", async function () {
      const { dao, proposer } = await loadFixture(deployDAOFixture);
      
      // Inicialmente no hay propuestas
      expect(await dao.getProposalsCount()).to.equal(0);
      
      // Crear propuesta
      await dao.connect(proposer).stakeForProposal(ethers.parseUnits("50", 18));
      await dao.connect(proposer).createProposal("Test Proposal");
      
      // Ahora debe haber 1 propuesta
      expect(await dao.getProposalsCount()).to.equal(1);
      
      // Crear otra propuesta
      await dao.connect(proposer).createProposal("Test Proposal 2");
      
      // Ahora debe haber 2 propuestas
      expect(await dao.getProposalsCount()).to.equal(2);
    });
    
    it("respeta el período de votación", async function () {
      const { dao, userA, proposer } = await loadFixture(deployDAOFixture);
      
      // Crear propuesta
      await dao.connect(proposer).stakeForProposal(ethers.parseUnits("50", 18));
      await dao.connect(proposer).createProposal("Test Proposal");
      
      // Hacer stake
      await dao.connect(userA).stakeForVote(ethers.parseUnits("100", 18));
      
      // Avanzar tiempo más allá del período de votación (2 segundos en el fixture)
      await advanceTime(3);
      
      // Intentar votar después del período de votación
      await expect(
        dao.connect(userA).voteProposal(0, true)
      ).to.be.revertedWith("Voting period ended");
    });
    
    it("permite ejecutar una propuesta aprobada", async function () {
      const { dao, userA, proposer } = await loadFixture(deployDAOFixture);
      
      // Crear propuesta
      await dao.connect(proposer).stakeForProposal(ethers.parseUnits("50", 18));
      await dao.connect(proposer).createProposal("Test Proposal");
      
      // Votar a favor
      await dao.connect(userA).stakeForVote(ethers.parseUnits("100", 18));
      await dao.connect(userA).voteProposal(0, true);
      
      // Avanzar tiempo más allá del período de votación
      await advanceTime(3);
      
      // Ejecutar la propuesta
      await dao.connect(userA).executeProposal(0);
      
      // Verificar que la propuesta fue ejecutada
      const proposal = await dao.proposals(0);
      expect(proposal.executed).to.be.true;
    });
    
    it("no permite ejecutar una propuesta rechazada", async function () {
      const { dao, userA, userB, proposer } = await loadFixture(deployDAOFixture);
      
      // Crear propuesta
      await dao.connect(proposer).stakeForProposal(ethers.parseUnits("50", 18));
      await dao.connect(proposer).createProposal("Test Proposal");
      
      // userA vota en contra con más poder que userB a favor
      await dao.connect(userA).stakeForVote(ethers.parseUnits("400", 18)); // 20 de poder
      await dao.connect(userA).voteProposal(0, false);
      
      await dao.connect(userB).stakeForVote(ethers.parseUnits("100", 18)); // 10 de poder
      await dao.connect(userB).voteProposal(0, true);
      
      // Avanzar tiempo más allá del período de votación
      await advanceTime(3);
      
      // Intentar ejecutar la propuesta rechazada
      await expect(
        dao.connect(userA).executeProposal(0)
      ).to.be.revertedWith("Proposal not approved");
    });
    
    it("gestiona correctamente el modo de emergencia", async function () {
      const { dao, owner, userA, proposer } = await loadFixture(deployDAOFixture);
      
      // Crear propuesta
      await dao.connect(proposer).stakeForProposal(ethers.parseUnits("50", 18));
      await dao.connect(proposer).createProposal("Test Proposal");
      
      // Configurar multisig de pánico
      await dao.connect(owner).setupPanicMultisig([owner.address], 1);
      
      // Activar modo de emergencia
      await dao.connect(owner).panic();
      
      // Intentar votar durante emergencia
      await dao.connect(userA).stakeForVote(ethers.parseUnits("100", 18));
      await expect(
        dao.connect(userA).voteProposal(0, true)
      ).to.be.revertedWith("DAO is paused");
      
      // Desactivar emergencia
      await dao.connect(owner).tranquility();
      
      // Ahora se debería poder votar
      await dao.connect(userA).voteProposal(0, true);
      
      const proposal = await dao.proposals(0);
      expect(proposal.votesFor).to.equal(10_000_000_000n);
    });
  });
});
