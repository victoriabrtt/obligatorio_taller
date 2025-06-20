const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

// Leer las direcciones del archivo contracts.ts
function getContractAddresses() {
  const contractsPath = path.join(__dirname, "../frontend/dao-frontend/src/contracts/contracts.ts");
  const contractsContent = fs.readFileSync(contractsPath, "utf8");
  
  // Extraer direcciones usando regex
  const daoMatch = contractsContent.match(/DAO:\s*{\s*address:\s*["']([^"']+)["']/);
  const tokenMatch = contractsContent.match(/TOKEN:\s*{\s*address:\s*["']([^"']+)["']/);
  
  return {
    DAO: { address: daoMatch ? daoMatch[1] : "" },
    TOKEN: { address: tokenMatch ? tokenMatch[1] : "" }
  };
}

async function main() {
  // Obtener las direcciones de los contratos
  const CONTRACTS = getContractAddresses();
  const daoAddress = CONTRACTS.DAO.address;
  console.log("Dirección del DAO:", daoAddress);
  
  // Conectar al contrato, especificando el nombre completo para evitar ambigüedad
  const DAO = await ethers.getContractFactory("contracts/DAO.sol:DAO");
  const dao = await DAO.attach(daoAddress);
  
  // Obtener el precio del token
  try {
    const tokenPriceInWei = await dao.tokenPriceInWei();
    console.log("Precio del token en wei:", tokenPriceInWei.toString());
    console.log("Precio del token en ETH:", ethers.formatEther(tokenPriceInWei));
    
    // Verificar otros parámetros
    const stakingToVote = await dao.stakingToVote();
    console.log("Staking para votar:", ethers.formatEther(stakingToVote));
    
    const stakingToPropose = await dao.stakingToPropose();
    console.log("Staking para proponer:", ethers.formatEther(stakingToPropose));
    
    const isPaused = await dao.isPaused();
    console.log("DAO está pausado:", isPaused);
    
    // Verificar dirección del token
    const tokenAddress = await dao.token();
    console.log("Dirección del token:", tokenAddress);
    console.log("Dirección esperada del token:", CONTRACTS.TOKEN.address);
    
  } catch (error) {
    console.error("Error al obtener el precio del token:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
