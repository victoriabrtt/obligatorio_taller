// Script para verificar el estado de la DAO
const { ethers } = require("hardhat");

async function main() {
  // Obtener direcciones desde el archivo de despliegue más reciente
  const deploymentsDir = "./deployments";
  const fs = require("fs");
  
  const files = fs.readdirSync(deploymentsDir).filter(f => f.startsWith("localhost-"));
  if (files.length === 0) {
    console.error("No se encontraron archivos de despliegue para localhost");
    return;
  }
  
  // Ordenar por fecha (más reciente primero)
  files.sort((a, b) => {
    const timestampA = parseInt(a.split("-")[1].split(".")[0]);
    const timestampB = parseInt(b.split("-")[1].split(".")[0]);
    return timestampB - timestampA;
  });
  
  const latestDeployment = JSON.parse(fs.readFileSync(`${deploymentsDir}/${files[0]}`));
  
  // Direcciones de contratos
  const daoAddress = latestDeployment.addresses.daoAddress;
  const tokenAddress = latestDeployment.addresses.tokenAddress;
  
  console.log("DAO Address:", daoAddress);
  console.log("Token Address:", tokenAddress);
  
  // Instanciar contratos
  const dao = await ethers.getContractAt("contracts/DAO.sol:DAO", daoAddress);
  const token = await ethers.getContractAt("MyToken", tokenAddress);
  
  // Comprobar estado del DAO
  const isPaused = await dao.isPaused();
  console.log("\n--- Estado del DAO ---");
  console.log(`Estado: ${isPaused ? "PAUSADO" : "ACTIVO"}`);
  
  // Obtener parámetros
  const stakingToVote = await dao.stakingToVote();
  const stakingToPropose = await dao.stakingToPropose();
  const minStakingTime = await dao.minStakingTime();
  const votePowerDivider = await dao.votePowerDivider();
  const proposalDurationDays = await dao.proposalDurationDays();
  const tokenPriceInWei = await dao.tokenPriceInWei();
  
  console.log("\n--- Parámetros ---");
  console.log(`Staking para votar: ${ethers.formatEther(stakingToVote)} tokens`);
  console.log(`Staking para proponer: ${ethers.formatEther(stakingToPropose)} tokens`);
  console.log(`Tiempo mínimo de staking: ${minStakingTime} segundos (${minStakingTime / 3600} horas)`);
  console.log(`Divisor del poder de voto: ${votePowerDivider}`);
  console.log(`Duración de propuestas: ${proposalDurationDays} días`);
  console.log(`Precio del token: ${ethers.formatEther(tokenPriceInWei)} ETH`);
  
  // Obtener información de multisig
  const ownerMultisig = await dao.ownerMultisig();
  const panicMultisig = await dao.panicMultisig();
  
  console.log("\n--- Contratos Multisig ---");
  console.log(`Multisig del Owner: ${ownerMultisig}`);
  console.log(`Multisig de Pánico: ${panicMultisig}`);
  
  // Verificar propietario del token
  const tokenOwner = await token.owner();
  console.log("\n--- Token ---");
  console.log(`Propietario del Token: ${tokenOwner}`);
  console.log(`¿El propietario es el DAO?: ${tokenOwner === daoAddress ? "SÍ" : "NO"}`);
  
  console.log("\nVerificación completada con éxito");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
