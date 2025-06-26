const { ethers } = require("hardhat");

async function main() {
  // Cuenta de metamask del usuario - ACTUALIZADA para enviar a la nueva dirección
  const userAddress = "0x86BF80dC22E5ED99596C0443429a59670f47ea64";
  
  // Obtener las cuentas de Hardhat
  const [deployer] = await ethers.getSigners();
  
  console.log("Saldo del deployer:", await ethers.formatEther(await deployer.provider.getBalance(deployer.address)));
  
  // Enviar 100 ETH a la cuenta de MetaMask (cantidad muy grande para asegurar)
  console.log(`Enviando 100 ETH a ${userAddress}...`);
  const tx = await deployer.sendTransaction({
    to: userAddress,
    value: ethers.parseEther("100.0"), // Enviar 100 ETH
    gasLimit: 30000 // Límite de gas explícito para asegurar que la transacción se procese
  });
  
  console.log(`Transacción enviada: ${tx.hash}`);
  await tx.wait();
  console.log("Transacción confirmada!");
  
  // Verificar el saldo actualizado
  const userBalance = await deployer.provider.getBalance(userAddress);
  console.log(`Saldo de ${userAddress}: ${ethers.formatEther(userBalance)} ETH`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
