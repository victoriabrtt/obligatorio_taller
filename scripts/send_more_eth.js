const { ethers } = require("hardhat");

async function main() {
  // Cuenta de metamask del usuario
  const userAddress = "0x86BF80dC22E5ED99596C0443429a59670f47ea64";
  
  // Obtener las cuentas de Hardhat
  const [deployer] = await ethers.getSigners();
  
  console.log("Saldo del deployer:", await ethers.formatEther(await deployer.provider.getBalance(deployer.address)));
  
  // Enviar 10 ETH a la cuenta de MetaMask (suficiente para transacciones y gas)
  const tx = await deployer.sendTransaction({
    to: userAddress,
    value: ethers.parseEther("10.0") // Enviar 10 ETH
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
