// Script ultra simple para desplegar el DAO sin multisigs
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Iniciando despliegue ultra simple del DAO...");

  // Obtener cuentas
  const [deployer] = await hre.ethers.getSigners();
  console.log("Desplegando contratos con la cuenta:", deployer.address);

  // Enviar ETH a la cuenta de prueba
  const testWallet = "0x86BF80dC22E5ED99596C0443429a59670f47ea64";
  console.log(`Enviando 100 ETH a ${testWallet}...`);
  await deployer.sendTransaction({
    to: testWallet,
    value: hre.ethers.parseEther("100")
  });
  console.log(`Saldo de ${testWallet}:`, hre.ethers.formatEther(await hre.ethers.provider.getBalance(testWallet)), "ETH");

  // Desplegar contratos
  const tokenFactory = await hre.ethers.getContractFactory("MyToken");
  const token = await tokenFactory.deploy();
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("Token desplegado en:", tokenAddress);

  const daoFactory = await hre.ethers.getContractFactory("contracts/DAO.sol:DAO");
  const dao = await daoFactory.deploy(tokenAddress);
  await dao.waitForDeployment();
  const daoAddress = await dao.getAddress();
  console.log("DAO desplegado en:", daoAddress);

  // Establecer owner simple sin multisig
  await dao.setOwner(deployer.address);
  console.log("Owner establecido a:", deployer.address);
  
  // Configurar parámetros simples
  console.log("Inicializando parámetros del DAO...");
  
  const params = {
    stakingToVote: "0.0000000000000001", // Valor muy pequeño para pruebas
    stakingToPropose: "0.0000000000000002", // Valor muy pequeño para pruebas
    minStakingTime: 60, // 1 minuto para pruebas
    votePowerDivider: 10**9,
    proposalDurationDays: 1,
    tokenPriceInWei: "0.01" // 0.01 ETH por token
  };
  
  await dao.initParameters(
    hre.ethers.parseEther(params.stakingToVote),
    hre.ethers.parseEther(params.stakingToPropose),
    params.minStakingTime,
    params.votePowerDivider,
    params.proposalDurationDays,
    hre.ethers.parseEther(params.tokenPriceInWei)
  );
  console.log("Parámetros inicializados");

  // Activar el DAO
  await dao.tranquility();
  console.log("DAO activado (unpause)");

  // Acuñar algunos tokens iniciales para la cuenta de prueba
  console.log("Acuñando 1000 tokens iniciales para la cuenta de prueba...");
  await token.mint(testWallet, hre.ethers.parseEther("1000"));
  console.log("Tokens acuñados exitosamente");
  console.log("Balance de tokens de prueba:", hre.ethers.formatEther(await token.balanceOf(testWallet)));

  // Guardar direcciones en un archivo
  const deploymentInfo = {
    network: hre.network.name,
    timestamp: new Date().toISOString(),
    addresses: {
      daoAddress: daoAddress,
      tokenAddress: tokenAddress,
      ownerAddress: deployer.address
    }
  };

  const deploymentPath = path.join(__dirname, "../deployments", `${hre.network.name}-${Date.now()}.json`);
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`Información de despliegue guardada en ${deploymentPath}`);

  console.log("\n✅ Despliegue completado exitosamente");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
