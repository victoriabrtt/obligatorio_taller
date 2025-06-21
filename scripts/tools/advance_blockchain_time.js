const { ethers } = require("hardhat");

async function main() {
  console.log("Avanzando el tiempo en la blockchain local para permitir el retiro de stake...");
  
  // Avanzar el tiempo de la blockchain en 1 hora (3600 segundos)
  await ethers.provider.send("evm_increaseTime", [3600]);
  await ethers.provider.send("evm_mine"); // Minar un nuevo bloque
  
  // Verificamos el tiempo actual del bloque
  const block = await ethers.provider.getBlock("latest");
  console.log(`Tiempo actual del bloque: ${new Date(block.timestamp * 1000).toLocaleString()}`);
  
  console.log("\n¡Tiempo avanzado con éxito!");
  console.log("Ahora deberías poder retirar tus tokens de staking sin recibir el error 'Staking time not met'.");
  console.log("Prueba a retirar tus tokens desde la interfaz web o mediante un script.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
