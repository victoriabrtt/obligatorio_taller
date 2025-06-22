const { ethers } = require("hardhat");
const { updateFrontendContracts } = require("./update-frontend");

async function main() {
  console.log("Starting deployment process...");

  // Get the network name
  const network = hre.network.name;
  console.log(`Deploying to network: ${network}`);

  // Load signers based on network
  let deployer, owner1, owner2, panicWallet1, panicWallet2;

  if (network === 'localhost' || network === 'hardhat') {
    // For local development, use multiple different accounts
    [deployer, owner1, owner2, panicWallet1, panicWallet2] = await ethers.getSigners();
  } else {
    // For testnet/mainnet, use the same account for simplicity
    // (in production, you would use separate secure wallets)
    deployer = (await ethers.getSigners())[0];
    owner1 = deployer;
    owner2 = deployer;
    panicWallet1 = deployer;
    panicWallet2 = deployer;
  }

  console.log("Deployer:", deployer.address);
  console.log("Owner 1:", owner1.address);
  console.log("Owner 2:", owner2.address);
  console.log("Panic Wallet 1:", panicWallet1.address);
  console.log("Panic Wallet 2:", panicWallet2.address);

  // Deploy del token
  const Token = await ethers.getContractFactory("MyToken");
  const token = await Token.deploy();
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("MyToken deployed to:", tokenAddress);

  // Deploy de DAO
  const DAO = await ethers.getContractFactory("contracts/DAO.sol:DAO");
  const dao = await DAO.deploy(tokenAddress);
  await dao.waitForDeployment();
  const daoAddress = await dao.getAddress();
  console.log("DAO deployed to:", daoAddress);

  // Configurar multisig para propietario (requiere 2 de 2 firmas)
  await dao.setOwnerMultisig([owner1.address, owner2.address], 2);
  console.log("Owner multisig configured");
  
  // Obtener la dirección del multisig del propietario
  const ownerMultisigAddress = await dao.ownerMultisig();
  console.log("Owner multisig address:", ownerMultisigAddress);
  
  // Configurar multisig para pánico (requiere 1 de 2 firmas)
  // Nota: Necesitamos usar el contrato Multisig del propietario para esta operación
  const Multisig = await ethers.getContractFactory("Multisig");
  const ownerMultisig = Multisig.attach(ownerMultisigAddress);
  
  // Preparar la llamada a setPanicMultisig
  const setPanicData = dao.interface.encodeFunctionData("setPanicMultisig", [
    [panicWallet1.address, panicWallet2.address], 
    1
  ]);
  
  // Crear transacción en multisig (owner1 la aprueba automáticamente)
  await ownerMultisig.connect(owner1).submitTransaction(
    daoAddress,
    0,
    setPanicData
  );
  
  // owner2 aprueba y ejecuta la transacción
  await ownerMultisig.connect(owner2).approveTransaction(0);
  console.log("Panic multisig configured");
  
  const panicMultisigAddress = await dao.panicMultisig();
  console.log("Panic multisig address:", panicMultisigAddress);

  // Inicializar parámetros mediante multisig
  const initParams = {
    stakingToVote: 100,
    stakingToPropose: 200,
    minStakingTime: 3600,
    votePowerDivider: 1000,
    proposalDurationDays: 7,
    tokenPriceInWei: ethers.parseEther("0.01"),
  };
  
  // Preparar llamada a initParameters
  const initParamsData = dao.interface.encodeFunctionData("initParameters", [
    initParams.stakingToVote,
    initParams.stakingToPropose,
    initParams.minStakingTime,
    initParams.votePowerDivider,
    initParams.proposalDurationDays,
    initParams.tokenPriceInWei
  ]);
  
  // Crear transacción para inicializar parámetros
  await ownerMultisig.connect(owner1).submitTransaction(
    daoAddress,
    0,
    initParamsData
  );
  
  // owner2 aprueba y ejecuta la transacción
  await ownerMultisig.connect(owner2).approveTransaction(1);
  console.log("DAO parameters initialized");

  // Despausar la DAO mediante multisig de pánico
  const panicMultisig = Multisig.attach(panicMultisigAddress);
  const tranquilityData = dao.interface.encodeFunctionData("tranquility", []);
  
  await panicMultisig.connect(panicWallet1).submitTransaction(
    daoAddress,
    0,
    tranquilityData
  );
  console.log("DAO is now active ✅");
  
  // Transferir propiedad del token al DAO
  await token.transferOwnership(daoAddress);
  console.log("Token ownership transferred to DAO");
  
  // Get contract addresses for frontend
  const contractAddresses = {
    daoAddress,
    tokenAddress,
    ownerMultisigAddress,
    panicMultisigAddress
  };
  
  // Write contract information to a file for future reference
  const fs = require('fs');
  const deploymentInfo = {
    network: hre.network.name,
    timestamp: new Date().toISOString(),
    addresses: contractAddresses
  };
  
  // Create the deployments directory if it doesn't exist
  if (!fs.existsSync('./deployments')) {
    fs.mkdirSync('./deployments');
  }
  
  fs.writeFileSync(
    `./deployments/${hre.network.name}-${Date.now()}.json`,
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log(`Deployment information saved to ./deployments/${hre.network.name}-${Date.now()}.json`);
  
  // Update contract addresses in frontend
  try {
    await updateFrontendContracts(contractAddresses);
  } catch (error) {
    console.warn("Warning: Could not update frontend contract addresses:", error.message);
  }
  
  console.log("\nDeployment completed successfully! 🎉");
  
  if (hre.network.name !== 'localhost' && hre.network.name !== 'hardhat') {
    console.log("\nVerify contracts with:");
    console.log(`npx hardhat verify --network ${hre.network.name} ${tokenAddress}`);
    console.log(`npx hardhat verify --network ${hre.network.name} ${daoAddress} ${tokenAddress}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
