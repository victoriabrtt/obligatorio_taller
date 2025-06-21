// Script para acuñar tokens directamente (bypass del DAO)
const hre = require("hardhat");

async function main() {
  // Parámetros
  const amount = process.argv[2] || "50"; // Cantidad por defecto: 50 tokens
  const toAddress = process.argv[3] || "0x86BF80dC22E5ED99596C0443429a59670f47ea64"; // Dirección por defecto
  
  console.log(`Acuñando ${amount} tokens para ${toAddress}...`);
  
  // Dirección del token
  const tokenAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
  
  // Obtener contrato token
  const token = await hre.ethers.getContractAt("MyToken", tokenAddress);
  
  // Obtener el dueño del token
  const tokenOwner = await token.owner();
  console.log("Dueño del token:", tokenOwner);
  
  // Verificar el balance antes
  const balanceBefore = await token.balanceOf(toAddress);
  console.log("Balance de tokens antes:", hre.ethers.formatEther(balanceBefore));
  
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
  
  // Usar el dueño para acuñar tokens
  const ownerSigner = await hre.ethers.getSigner(tokenOwner);
  const tokenWithSigner = token.connect(ownerSigner);
  
  // Acuñar tokens
  console.log("Acuñando tokens...");
  const tx = await tokenWithSigner.mint(toAddress, hre.ethers.parseEther(amount));
  const receipt = await tx.wait();
  console.log("Tokens acuñados:", tx.hash);
  
  // Dejar de impersonar
  await hre.network.provider.request({
    method: "hardhat_stopImpersonatingAccount",
    params: [tokenOwner],
  });
  
  // Verificar el balance después
  const balanceAfter = await token.balanceOf(toAddress);
  console.log("Balance de tokens después:", hre.ethers.formatEther(balanceAfter));
  console.log("Tokens acuñados:", hre.ethers.formatEther(balanceAfter - balanceBefore));
  
  console.log("Proceso completado con éxito");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
