// Script para enviar tokens específicos a una dirección específica
const hre = require("hardhat");

async function main() {
  // Dirección y cantidad específicas
  const toAddress = "0xfa58f1e31B6eCacF63753dD6Ca2ed35192Af4cb2";
  const amount = "50"; // 50 tokens adicionales
  
  console.log(`Enviando ${amount} tokens adicionales a la dirección: ${toAddress}`);
  
  // Dirección del token (usar la dirección actual del token desplegado)
  const tokenAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
  
  // Obtener contrato token
  const token = await hre.ethers.getContractAt("MyToken", tokenAddress);
  
  // Obtener el dueño del token
  const tokenOwner = await token.owner();
  console.log("Dueño actual del token:", tokenOwner);
  
  // Verificar balance antes
  const balanceBefore = await token.balanceOf(toAddress);
  console.log("Balance de tokens antes:", hre.ethers.formatEther(balanceBefore), "MTK");
  
  // Impersonar al dueño del token
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
  await tx.wait();
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
    console.error("❌ Error al enviar tokens adicionales:", error);
    process.exit(1);
  });
