const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DAO - Multisig Integration", function () {
  let token, dao;
  let deployer, owner1, owner2, panicWallet1, panicWallet2, user;

  beforeEach(async () => {
    [deployer, owner1, owner2, panicWallet1, panicWallet2, user] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("MyToken");
    token = await Token.deploy();

    const DAO = await ethers.getContractFactory("DAO");
    dao = await DAO.deploy(await token.getAddress());

    // Configurar multisig de propietario con 2 firmantes
    await dao.setOwnerMultisig(
      [owner1.address, owner2.address],
      2 // Requiere ambas firmas
    );
    
    // Ahora debemos obtener la dirección del multisig y usarla para las próximas operaciones
    const ownerMultisigAddress = await dao.ownerMultisig();
    
    // Obtener el contrato Multisig del propietario
    const Multisig = await ethers.getContractFactory("Multisig");
    const ownerMultisig = Multisig.attach(ownerMultisigAddress);
    
    // Preparar datos para llamar a setPanicMultisig
    const setPanicData = dao.interface.encodeFunctionData("setPanicMultisig", [
      [panicWallet1.address, panicWallet2.address],
      1 // Solo requiere 1 firma para emergencias
    ]);
    
    // Crear transacción en multisig del propietario
    await ownerMultisig.connect(owner1).submitTransaction(
      await dao.getAddress(),
      0,
      setPanicData
    );
    
    // Aprobar la transacción con owner2 para que se ejecute
    await ownerMultisig.connect(owner2).approveTransaction(0);
  });

  it("should set up multisig wallets correctly", async function () {
    // Verificar que se crearon las multisig
    const ownerMultisigAddress = await dao.ownerMultisig();
    const panicMultisigAddress = await dao.panicMultisig();
    
    expect(ownerMultisigAddress).to.not.equal(ethers.ZeroAddress);
    expect(panicMultisigAddress).to.not.equal(ethers.ZeroAddress);
    
    // Recuperar la multisigFactory
    const MultisigFactory = await ethers.getContractFactory("MultisigFactory");
    const factory = await dao.multisigFactory();
    
    const multisigFactory = MultisigFactory.attach(factory);
    
    // Verificar que las direcciones están registradas como multisig
    expect(await multisigFactory.isMultisig(ownerMultisigAddress)).to.be.true;
    expect(await multisigFactory.isMultisig(panicMultisigAddress)).to.be.true;
    
    // Verificar configuración de cada multisig
    const Multisig = await ethers.getContractFactory("Multisig");
    
    const ownerMultisig = Multisig.attach(ownerMultisigAddress);
    expect(await ownerMultisig.requiredApprovals()).to.equal(2);
    
    const panicMultisig = Multisig.attach(panicMultisigAddress);
    expect(await panicMultisig.requiredApprovals()).to.equal(1);
  });

  it("should allow multisig to initialize parameters", async function () {
    // Obtener el contrato multisig del propietario
    const Multisig = await ethers.getContractFactory("Multisig");
    const ownerMultisig = Multisig.attach(await dao.ownerMultisig());
    
    // Crear los datos de la llamada para initParameters
    const initData = dao.interface.encodeFunctionData("initParameters", [
      100, // stakingToVote
      200, // stakingToPropose
      3600, // minStakingTime
      1000, // votePowerDivider
      7, // proposalDurationDays
      ethers.parseEther("0.01") // tokenPriceInWei
    ]);
    
    // Crear propuesta en multisig (automáticamente aprobada por owner1)
    // Usamos txId = 1 porque ya hay una transacción existente de la configuración inicial
    await ownerMultisig.connect(owner1).submitTransaction(
      await dao.getAddress(),
      0, // No ETH enviado
      initData
    );
    
    // owner2 aprueba y ejecuta la propuesta
    await ownerMultisig.connect(owner2).approveTransaction(1);
    
    // Verificar que los parámetros fueron actualizados
    expect(await dao.stakingToVote()).to.equal(100);
    expect(await dao.stakingToPropose()).to.equal(200);
    expect(await dao.minStakingTime()).to.equal(3600);
    expect(await dao.votePowerDivider()).to.equal(1000);
    expect(await dao.proposalDurationDays()).to.equal(7);
    expect(await dao.tokenPriceInWei()).to.equal(ethers.parseEther("0.01"));
  });

  it("should allow panic multisig to unpause the DAO", async function () {
    // La DAO comienza pausada
    expect(await dao.isPaused()).to.be.true;
    
    // Obtener el contrato multisig de emergencia
    const Multisig = await ethers.getContractFactory("Multisig");
    const panicMultisig = Multisig.attach(await dao.panicMultisig());
    
    // Crear los datos de la llamada para tranquility (unpause)
    const tranquilityData = dao.interface.encodeFunctionData("tranquility", []);
    
    // Crear y ejecutar propuesta en multisig de pánico (solo require 1 firma)
    await panicMultisig.connect(panicWallet1).submitTransaction(
      await dao.getAddress(),
      0, // No ETH enviado
      tranquilityData
    );
    
    // Verificar que la DAO está activa ahora
    expect(await dao.isPaused()).to.be.false;
  });
});
