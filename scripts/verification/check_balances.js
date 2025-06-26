const { ethers } = require("hardhat");

async function main() {
  const targetAddress = "0x86BF80dC22E5ED99596C0443429a59670f47ea64"; // Dirección a la que enviamos los fondos
  
  // Verificar saldos con el proveedor de Hardhat
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
  
  try {
    const balance = await provider.getBalance(targetAddress);
    console.log(`Saldo de ${targetAddress} en el nodo Hardhat: ${ethers.formatEther(balance)} ETH`);
    
    // También verificar las primeras cuentas de Hardhat
    console.log("\nCuentas de Hardhat:");
    for (let i = 0; i < 3; i++) {
      const accounts = await provider.listAccounts();
      const account = accounts[i];
      const balance = await provider.getBalance(account);
      console.log(`${i}: ${account} - ${ethers.formatEther(balance)} ETH`);
    }
    
  } catch (error) {
    console.error("Error al verificar saldos:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error en script:", error);
    process.exit(1);
  });
