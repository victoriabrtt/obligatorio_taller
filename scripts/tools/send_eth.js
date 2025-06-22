// Script para enviar ETH a una dirección
const hre = require("hardhat");

async function main() {
  // Dirección destino
  const toAddress = "0xfa58f1e31B6eCacF63753dD6Ca2ed35192Af4cb2";
  // Cantidad de ETH a enviar
  const ethAmount = "1.0"; // 1 ETH
  
  console.log(`Enviando ${ethAmount} ETH a la dirección: ${toAddress}`);
  
  // Verificar balance antes
  const balanceBefore = await hre.ethers.provider.getBalance(toAddress);
  console.log("Balance de ETH antes:", hre.ethers.formatEther(balanceBefore), "ETH");
  
  // Usar la primera cuenta (rica en ETH) para enviar
  const [signer] = await hre.ethers.getSigners();
  const tx = await signer.sendTransaction({
    to: toAddress,
    value: hre.ethers.parseEther(ethAmount)
  });
  
  await tx.wait();
  console.log("ETH enviado en transacción:", tx.hash);
  
  // Verificar balance después
  const balanceAfter = await hre.ethers.provider.getBalance(toAddress);
  console.log("Balance de ETH después:", hre.ethers.formatEther(balanceAfter), "ETH");
  console.log("ETH enviado:", hre.ethers.formatEther(balanceAfter - balanceBefore), "ETH");
  
  console.log("✅ Envío de ETH completado con éxito");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error al enviar ETH:", error);
    process.exit(1);
  });
