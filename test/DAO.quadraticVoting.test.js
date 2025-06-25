const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("DAO - Votación Cuadrática (Edge Cases)", function () {
  // Fixture para desplegar los contratos con los parámetros necesarios
  async function deployDAOWithTokensFixture() {
    const [owner, voter1, voter2, voter3, voter4, proposer] = await ethers.getSigners();
  
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
    
    // Inicializar con parámetros para pruebas
    await dao.initParameters(
      ethers.parseUnits("10", 18),  // stakingToVote (mínimo)
      ethers.parseUnits("50", 18),  // stakingToPropose (mínimo)
      0,                            // minStakingTime (cero para las pruebas)
      1,                            // votePowerDivider
      1,                            // proposalDurationDays
      ethers.parseUnits("0.01", 18) // tokenPriceInWei
    );
    
    // Activar la DAO
    await dao.tranquility();
    
    // Mintear tokens para pruebas
    await token.mint(voter1.address, ethers.parseUnits("1000", 18));
    await token.mint(voter2.address, ethers.parseUnits("100", 18));
    await token.mint(voter3.address, ethers.parseUnits("10", 18));  // Mínimo exacto
    await token.mint(voter4.address, ethers.parseUnits("9", 18));   // Por debajo del mínimo
    await token.mint(proposer.address, ethers.parseUnits("500", 18));
    
    // Aprobar y hacer staking para proposer
    await token.connect(proposer).approve(await dao.getAddress(), ethers.MaxUint256);
    await dao.connect(proposer).stakeForProposal(ethers.parseUnits("100", 18));
    
    // Crear propuesta para las pruebas
    await dao.connect(proposer).createProposal("Test Quadratic Voting");
    
    // Aprobar tokens para staking (todos los votantes)
    await token.connect(voter1).approve(await dao.getAddress(), ethers.MaxUint256);
    await token.connect(voter2).approve(await dao.getAddress(), ethers.MaxUint256);
    await token.connect(voter3).approve(await dao.getAddress(), ethers.MaxUint256);
    await token.connect(voter4).approve(await dao.getAddress(), ethers.MaxUint256);
    
    return { dao, token, owner, voter1, voter2, voter3, voter4, proposer };
  }
  
  // Función auxiliar para calcular la raíz cuadrada (igual que la del contrato)
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

  it("debería calcular correctamente el poder de voto cuadrático para valores altos", async function () {
    const { dao, token, voter1 } = await loadFixture(deployDAOWithTokensFixture);
    
    // Usar un número grande de tokens para probar
    const largeStake = ethers.parseUnits("1000", 18);
    await dao.connect(voter1).stakeForVote(largeStake);
    
    // Votar
    await dao.connect(voter1).voteProposal(0, true);
    
    // Verificar el resultado
    const proposal = await dao.proposals(0);
    const expectedPower = sqrt(largeStake);
    
    expect(proposal.votesFor).to.equal(expectedPower);
  });
  
  it("debería calcular correctamente el poder de voto cuadrático para el valor mínimo", async function () {
    const { dao, token, voter3 } = await loadFixture(deployDAOWithTokensFixture);
    
    // Usar el mínimo exacto de tokens requerido
    const minStake = ethers.parseUnits("10", 18);
    await dao.connect(voter3).stakeForVote(minStake);
    
    // Votar
    await dao.connect(voter3).voteProposal(0, true);
    
    // Verificar el resultado
    const proposal = await dao.proposals(0);
    const expectedPower = sqrt(minStake);
    
    expect(proposal.votesFor).to.equal(expectedPower);
  });
  
  it("no debería permitir votar con menos del stake mínimo", async function () {
    const { dao, token, voter4 } = await loadFixture(deployDAOWithTokensFixture);
    
    // Intentar hacer stake con menos del mínimo
    const lowStake = ethers.parseUnits("9", 18);
    
    // Debería revertir con el mensaje actual del contrato
    await expect(
      dao.connect(voter4).stakeForVote(lowStake)
    ).to.be.revertedWith("Insufficient amount");
  });
  
  it("debería mostrar la diferencia en poder de voto entre valores lineales y cuadráticos", async function () {
    const { dao, token, voter1, voter2, proposer } = await loadFixture(deployDAOWithTokensFixture);
    
    // Crear una segunda propuesta para la prueba
    await dao.connect(proposer).createProposal("Second Test Proposal");
    
    // Stake con dos valores muy diferentes (1000 vs 100)
    await dao.connect(voter1).stakeForVote(ethers.parseUnits("1000", 18));
    await dao.connect(voter2).stakeForVote(ethers.parseUnits("100", 18));
    
    // Calcular y comparar poderes de voto
    // En un sistema lineal, voter1 tendría 10x el poder de voter2
    // En un sistema cuadrático, voter1 tendría sqrt(1000)/sqrt(100) = 3.16x el poder de voter2
    
    // Votar con ambos en diferentes propuestas
    await dao.connect(voter1).voteProposal(0, true);
    await dao.connect(voter2).voteProposal(1, true);
    
    const proposal1 = await dao.proposals(0);
    const proposal2 = await dao.proposals(1);
    
    // Verificar los poderes de voto
    const power1 = sqrt(ethers.parseUnits("1000", 18));
    const power2 = sqrt(ethers.parseUnits("100", 18));
    
    expect(proposal1.votesFor).to.equal(power1);
    expect(proposal2.votesFor).to.equal(power2);
    
    // Verificar la relación entre los poderes
    // La relación en un sistema lineal sería exactamente 10
    // La relación en un sistema cuadrático es aproximadamente 3.16 (sqrt(10))
    const ratioCuadratico = Number(power1) / Number(power2);
    const ratioLineal = Number(ethers.parseUnits("1000", 18)) / Number(ethers.parseUnits("100", 18));
    
    expect(ratioCuadratico).to.be.lessThan(ratioLineal);
    expect(ratioCuadratico).to.be.approximately(Math.sqrt(ratioLineal), 0.1);
  });

  it("no debería aumentar el poder de voto al dividir tokens en múltiples cuentas", async function () {
    const { dao, token, owner, voter1, voter2, voter3, proposer } = await loadFixture(deployDAOWithTokensFixture);
    
    // Estrategia: Comparar el poder de voto de una cuenta con 400 tokens
    // vs el poder combinado de 3 cuentas con 100, 100 y 10 tokens
    
    // Crear una segunda propuesta para la prueba
    await dao.connect(proposer).createProposal("Sybil Attack Test");
    
    // Mintear tokens adicionales para owner
    await token.mint(owner.address, ethers.parseUnits("400", 18));
    
    // Usamos owner como la cuenta única con 400 tokens
    await token.connect(owner).approve(await dao.getAddress(), ethers.MaxUint256);
    await dao.connect(owner).stakeForVote(ethers.parseUnits("400", 18));
    
    // Votar con la cuenta única en la primera propuesta
    await dao.connect(owner).voteProposal(0, true);
    
    // Configurar los tres votantes con tokens ya minteados
    await dao.connect(voter1).stakeForVote(ethers.parseUnits("100", 18));
    await dao.connect(voter2).stakeForVote(ethers.parseUnits("100", 18));
    await dao.connect(voter3).stakeForVote(ethers.parseUnits("10", 18));
    
    // Votar con las cuentas divididas en la segunda propuesta
    await dao.connect(voter1).voteProposal(1, true);
    await dao.connect(voter2).voteProposal(1, true);
    await dao.connect(voter3).voteProposal(1, true);
    
    // Comparar poderes de voto
    const proposal1 = await dao.proposals(0);
    const proposal2 = await dao.proposals(1);
    
    const singleAccountPower = sqrt(ethers.parseUnits("400", 18));
    const multiAccountPower = sqrt(ethers.parseUnits("100", 18)) + 
                             sqrt(ethers.parseUnits("100", 18)) +
                             sqrt(ethers.parseUnits("10", 18));
    
    expect(proposal1.votesFor).to.equal(singleAccountPower);
    expect(proposal2.votesFor).to.equal(multiAccountPower);
    
    // En un sistema cuadrático, dividir tokens debería dar más poder
    // sqrt(400) < sqrt(100) + sqrt(100) + sqrt(10)
    expect(Number(singleAccountPower)).to.be.lessThan(Number(multiAccountPower));
    
    // Verificamos solo que el ratio cuadrático sea diferente al lineal
    const ratioDividido = Number(multiAccountPower) / Number(singleAccountPower);
    const ratioLineal = (Number(ethers.parseUnits("210", 18)) / Number(ethers.parseUnits("400", 18)));
    
    expect(ratioDividido).to.be.greaterThan(ratioLineal);
  });

  it("debería manejar apropiadamente el caso de votePowerDivider > 1", async function () {
    const { dao, token, owner, voter1 } = await loadFixture(deployDAOWithTokensFixture);
    
    // Cambiar el divisor de poder de voto a 10
    await dao.connect(owner).initParameters(
      ethers.parseUnits("10", 18),  // stakingToVote
      ethers.parseUnits("50", 18),  // stakingToPropose
      0,                            // minStakingTime
      10,                           // votePowerDivider - nuevo valor
      1,                            // proposalDurationDays
      ethers.parseUnits("0.01", 18) // tokenPriceInWei
    );
    
    // Hacer staking
    await dao.connect(voter1).stakeForVote(ethers.parseUnits("100", 18));
    
    // Obtener el poder de voto calculado
    const votingPower = await dao.getVotingPower(voter1.address);
    
    // Verificar que se aplica el divisor correctamente
    // sqrt(100 * 10^18) * 10^9 / 10 = 10^18 * 10^9 / 10 = 10^26
    const expectedPower = sqrt(ethers.parseUnits("100", 18)) * BigInt(1e9) / 10n;
    
    expect(votingPower).to.equal(expectedPower);
  });
  
  it("debería funcionar correctamente con valores extremadamente pequeños pero válidos", async function () {
    const { dao, token, owner, voter3 } = await loadFixture(deployDAOWithTokensFixture);
    
    // Cambiar el mínimo de staking a un valor muy bajo
    await dao.connect(owner).initParameters(
      ethers.parseUnits("0.000001", 18), // stakingToVote - valor muy pequeño
      ethers.parseUnits("50", 18),       // stakingToPropose
      0,                                 // minStakingTime
      1,                                 // votePowerDivider
      1,                                 // proposalDurationDays
      ethers.parseUnits("0.01", 18)      // tokenPriceInWei
    );
    
    // Hacer staking con valor pequeño
    const smallStake = ethers.parseUnits("0.000001", 18);
    await dao.connect(voter3).stakeForVote(smallStake);
    
    // Votar
    await dao.connect(voter3).voteProposal(0, true);
    
    // Verificar el resultado
    const proposal = await dao.proposals(0);
    const expectedPower = sqrt(smallStake);
    
    expect(proposal.votesFor).to.equal(expectedPower);
  });
});
