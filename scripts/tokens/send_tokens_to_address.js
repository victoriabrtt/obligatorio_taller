// Script para enviar tokens directamente a una dirección específica
const hre = require("hardhat");

async function main() {
  // Dirección destino específica
  const toAddress = "0x86BF80dC22E5ED99596C0443429a59670f47ea64";
  // Cantidad de tokens a enviar - por defecto 1000 tokens
  const amount = "1000";
  
  console.log(`Enviando ${amount} tokens a la dirección: ${toAddress}`);
  
  // Dirección del token (usar la dirección actual del token desplegado)
  const tokenAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  
  // Obtener contrato token
  const token = await hre.ethers.getContractAt("MyToken", tokenAddress);
  
  // Obtener el dueño del token (normalmente el DAO)
  const tokenOwner = await token.owner();
  console.log("Dueño actual del token:", tokenOwner);
  
  // Verificar balance antes
  const balanceBefore = await token.balanceOf(toAddress);
  console.log("Balance de tokens antes:", hre.ethers.formatEther(balanceBefore), "MTK");
  
  // Impersonar al dueño del token para poder acuñar
  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [tokenOwner],
  });
  
  // Darle ETH al dueño en caso de que no tenga
  const [signer] = await hre.ethers.getSigners();
  await signer.sendTransaction({
    to: tokenOwner,
    value: hre.ethers.parseEther("1")
  });
  
  console.log("Fondos enviados al dueño del token para gas");
  
  // Usar el dueño para acuñar tokens
  const ownerSigner = await hre.ethers.getSigner(tokenOwner);
  const tokenWithSigner = token.connect(ownerSigner);
  
  // Acuñar tokens
  console.log("Acuñando tokens...");
  const tx = await tokenWithSigner.mint(toAddress, hre.ethers.parseEther(amount));
  const receipt = await tx.wait();
  console.log("Tokens acuñados en transacción:", tx.hash);
  
  // Dejar de impersonar
  await hre.network.provider.request({
    method: "hardhat_stopImpersonatingAccount",
    params: [tokenOwner],
  });
  
  // Verificar balance después
  const balanceAfter = await token.balanceOf(toAddress);
  console.log("Balance de tokens después:", hre.ethers.formatEther(balanceAfter), "MTK");
  console.log("Tokens enviados:", hre.ethers.formatEther(balanceAfter - balanceBefore), "MTK");
  
  console.log("✅ Envío de tokens completado con éxito");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
