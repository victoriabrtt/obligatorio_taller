const hre = require("hardhat");

async function main() {
  console.log("Desplegando el contrato MiToken...");

  const MiToken = await hre.ethers.getContractFactory("MiToken");
  const miToken = await MiToken.deploy();

  await miToken.deployed();

  console.log("MiToken desplegado en:", miToken.address);
  
  // Guardar la dirección para la dApp
  const fs = require("fs");
  fs.writeFileSync(
    "./web/contract-address.json",
    JSON.stringify({ MiToken: miToken.address }, null, 2)
  );
  
  console.log("Dirección del contrato guardada en web/contract-address.json");
}

// Ejecutar la función principal
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
