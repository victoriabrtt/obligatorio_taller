// Script para verificar balances de tokens y ETH
const { ethers } = require("hardhat");

async function main() {
  // Obtener la dirección a verificar
  const addressToCheck = process.argv[2] || "0x86BF80dC22E5ED99596C0443429a59670f47ea64"; // Dirección por defecto
  
  console.log(`Verificando balances para ${addressToCheck}...`);
  
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
  
  // Dirección del token
  const tokenAddress = latestDeployment.addresses.tokenAddress;
  console.log("Dirección del token:", tokenAddress);
  
  // Obtener contrato token
  const token = await ethers.getContractAt("MyToken", tokenAddress);
  
  // Verificar balance de ETH
  const ethBalance = await ethers.provider.getBalance(addressToCheck);
  console.log("Balance de ETH:", ethers.formatEther(ethBalance), "ETH");
  
  // Verificar balance de tokens
  const tokenBalance = await token.balanceOf(addressToCheck);
  console.log("Balance de tokens:", ethers.formatEther(tokenBalance), "MTK");
  
  // Verificar stake para votar
  try {
    const daoAddress = latestDeployment.addresses.daoAddress;
    const dao = await ethers.getContractAt("contracts/DAO.sol:DAO", daoAddress);
    
    const voteStake = await dao.voteStakes(addressToCheck);
    console.log("\nStake para votar:", ethers.formatEther(voteStake.amount), "MTK");
    
    if (voteStake.amount > 0) {
      const timestamp = new Date(Number(voteStake.timestamp) * 1000);
      console.log("Fecha de stake:", timestamp.toLocaleString());
    }
    
    const proposalStake = await dao.proposalStakes(addressToCheck);
    console.log("Stake para propuestas:", ethers.formatEther(proposalStake.amount), "MTK");
    
    if (proposalStake.amount > 0) {
      const timestamp = new Date(Number(proposalStake.timestamp) * 1000);
      console.log("Fecha de stake:", timestamp.toLocaleString());
    }
  } catch (error) {
    console.warn("No se pudo obtener información de staking:", error.message);
  }
  
  console.log("\nVerificación de balances completada");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
