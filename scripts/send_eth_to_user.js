const { ethers } = require("hardhat");

async function main() {
  console.log("Enviando ETH a la dirección del usuario...");
  
  // Obtener la primera cuenta (que tiene muchos ETH en el nodo local de Hardhat)
  const [deployer] = await ethers.getSigners();
  
  // La dirección del usuario
  const userAddress = "0x86BF80dC22E5ED99596C0443429a59670f47ea64";
  
  console.log("Cuenta origen:", deployer.address);
  console.log("Balance de origen:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");
  console.log("Cuenta destino:", userAddress);
  console.log("Balance inicial del destino:", ethers.formatEther(await ethers.provider.getBalance(userAddress)), "ETH");
  
  // Cantidad a enviar: 100 ETH
  const amountToSend = ethers.parseEther("100");
  
  // Enviar ETH
  console.log(`Enviando ${ethers.formatEther(amountToSend)} ETH a ${userAddress}...`);
  
  const tx = await deployer.sendTransaction({
    to: userAddress,
    value: amountToSend
  });
  
  // Esperar a que la transacción se confirme
  await tx.wait();
  console.log("Transacción confirmada:", tx.hash);
  
  // Verificar el nuevo balance
  console.log("Nuevo balance del destino:", ethers.formatEther(await ethers.provider.getBalance(userAddress)), "ETH");
  
  console.log("¡Transferencia completada con éxito!");
}

// Ejecutar el script
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
