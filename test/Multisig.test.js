const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Multisig", function () {
  let multisig, multisigFactory;
  let deployer, owner1, owner2, owner3, user;

  beforeEach(async () => {
    [deployer, owner1, owner2, owner3, user] = await ethers.getSigners();

    const MultisigFactory = await ethers.getContractFactory("MultisigFactory");
    multisigFactory = await MultisigFactory.deploy();
    
    const tx = await multisigFactory.createMultisig(
      [owner1.address, owner2.address, owner3.address],
      2 // requiredApprovals: 2 de 3 firmas
    );
    const receipt = await tx.wait();
    
    // Obtener la dirección del multisig creado
    const multisigAddress = receipt.logs[0].args[0];
    
    const Multisig = await ethers.getContractFactory("Multisig");
    multisig = Multisig.attach(multisigAddress);
  });

  it("should initialize correctly", async function () {
    expect(await multisig.requiredApprovals()).to.equal(2);
    
    const owners = await multisig.getOwners();
    expect(owners.length).to.equal(3);
    expect(owners).to.include(owner1.address);
    expect(owners).to.include(owner2.address);
    expect(owners).to.include(owner3.address);
  });

  it("should submit and approve transactions", async function () {
    // Enviar fondos al multisig para poder ejecutar transacciones
    await deployer.sendTransaction({
      to: await multisig.getAddress(),
      value: ethers.parseEther("1.0")
    });

    // Crear una transacción que envíe 0.5 ETH a user
    const tx = await multisig.connect(owner1).submitTransaction(
      user.address,
      ethers.parseEther("0.5"),
      "0x" // sin datos específicos
    );

    const receipt = await tx.wait();
    const transactionId = 0; // Primera transacción
    
    // La transacción debe estar pendiente y ya aprobada por owner1
    expect(await (await multisig.transactions(transactionId)).approvalCount).to.equal(1);
    
    // owner2 aprueba la transacción, esto debería ejecutarla automáticamente
    await multisig.connect(owner2).approveTransaction(transactionId);
    
    // Verificar que la transacción se ejecutó
    expect(await (await multisig.transactions(transactionId)).executed).to.be.true;
    
    // Verificar que los fondos se transfirieron correctamente
    expect(await ethers.provider.getBalance(user.address))
      .to.be.closeTo(
        ethers.parseEther("10000.5"), // 10000 iniciales + 0.5 transferidos
        ethers.parseEther("0.01")  // margen de error para gas
      );
  });

  it("should not allow non-owners to submit transactions", async function () {
    await expect(multisig.connect(user).submitTransaction(
      user.address,
      ethers.parseEther("0.5"),
      "0x"
    )).to.be.revertedWith("Not an owner");
  });

  it("should not execute transaction with insufficient approvals", async function () {
    // Enviar fondos al multisig
    await deployer.sendTransaction({
      to: await multisig.getAddress(),
      value: ethers.parseEther("1.0")
    });

    // owner1 crea una transacción
    await multisig.connect(owner1).submitTransaction(
      user.address,
      ethers.parseEther("0.5"),
      "0x"
    );
    
    const transactionId = 0;
    
    // Intentar ejecutar sin suficientes aprobaciones
    await expect(multisig.connect(owner1).executeTransaction(transactionId))
      .to.be.revertedWith("Not enough approvals");
  });
});
