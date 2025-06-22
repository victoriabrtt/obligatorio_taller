const { ethers } = require("hardhat");

async function main() {
  console.log("Creando más propuestas para probar...");
  
  // Get signers
  const [deployer, owner1, owner2, panicWallet1, panicWallet2, user1, user2] = await ethers.getSigners();

  console.log("Usando User 1:", user1.address);
  console.log("Usando User 2:", user2.address);
  
  // Direcciones de contratos (del último despliegue)
  const daoAddress = "0x0B306BF915C4d645ff596e518fAf3F9669b97016";
  const tokenAddress = "0x9A676e781A523b5d0C0e43731313A708CB607508";
  
  // Conectar con los contratos
  const DAO = await ethers.getContractFactory("contracts/DAO.sol:DAO");
  const dao = await DAO.attach(daoAddress);
  
  const Token = await ethers.getContractFactory("MyToken");
  const token = await Token.attach(tokenAddress);
  
  // Crear una propuesta que será ejecutada
  console.log("Creando propuesta para ser ejecutada...");
  await dao.connect(user1).createProposal("Propuesta 4: Esta será ejecutada");
  console.log("Propuesta creada");
  
  // Votar a favor
  console.log("Votando a favor...");
  await dao.connect(user2).voteProposal(3, true);
  
  // Avanzar el tiempo para que finalice el período de votación
  console.log("Avanzando el tiempo...");
  await network.provider.send("evm_increaseTime", [86400]); // 1 día
  await network.provider.send("evm_mine");
  
  // Ejecutar la propuesta
  console.log("Ejecutando propuesta...");
  await dao.connect(user1).executeProposal(3);
  
  console.log("Propuesta ejecutada correctamente");
  
  // Crear una propuesta que será rechazada
  console.log("Creando propuesta para ser rechazada...");
  await dao.connect(user1).createProposal("Propuesta 5: Esta será rechazada");
  
  // Votar en contra
  console.log("Votando en contra...");
  await dao.connect(user2).voteProposal(4, false);
  
  // Avanzar el tiempo para que finalice el período de votación
  console.log("Avanzando el tiempo...");
  await network.provider.send("evm_increaseTime", [86400]); // 1 día
  await network.provider.send("evm_mine");
  
  console.log("Ahora tenemos propuestas en todos los estados: ACTIVE, APPROVED, REJECTED, EXECUTED");
}

// Execute
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
