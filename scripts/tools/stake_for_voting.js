// Script para hacer staking de tokens para votar
const hre = require("hardhat");

async function main() {
  // Parámetros configurables
  const userAddress = "0x86BF80dC22E5ED99596C0443429a59670f47ea64"; // Tu dirección
  const tokensToStake = process.env.STAKE || "500"; // Cantidad de tokens para stake (configurable)
  
  console.log(`\n=== Haciendo stake de ${tokensToStake} tokens para votar (${userAddress}) ===\n`);
  
  // Obtener direcciones de los contratos
  const daoAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
  const tokenAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  
  // Cargar contratos
  const dao = await hre.ethers.getContractAt("contracts/DAO.sol:DAO", daoAddress);
  const token = await hre.ethers.getContractAt("MyToken", tokenAddress);
  
  // Verificar balances iniciales
  const tokenBalanceBefore = await token.balanceOf(userAddress);
  console.log("Balance de tokens:", hre.ethers.formatEther(tokenBalanceBefore), "MTK");
  
  // Verificar stake actual
  const currentStake = await dao.voteStakes(userAddress);
  console.log("Stake actual para votar:", hre.ethers.formatEther(currentStake[0]), "MTK (desde", new Date(Number(currentStake[1]) * 1000).toLocaleString(), ")");
  
  // Verificar requerimiento mínimo
  const stakingToVote = await dao.stakingToVote();
  console.log("Stake mínimo requerido para votar:", hre.ethers.formatEther(stakingToVote), "MTK");
  
  // Verificar si el usuario ya ha hecho stake o necesita hacer approve
  if (currentStake[0] > 0n) {
    console.log("\n⚠️ Ya tienes tokens en stake para votar. Debes retirarlos antes de hacer un nuevo stake.");
    return;
  }
  
  // Verificar si tiene suficientes tokens
  const stakeAmount = hre.ethers.parseEther(tokensToStake);
  if (tokenBalanceBefore < stakeAmount) {
    console.log("\n❌ No tienes suficientes tokens para hacer el stake solicitado.");
    console.log(`   Necesitas: ${tokensToStake} MTK, Tienes: ${hre.ethers.formatEther(tokenBalanceBefore)} MTK`);
    return;
  }
  
  // Impersonar al usuario
  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [userAddress],
  });
  
  try {
    // Conectar con la cuenta del usuario
    const userSigner = await hre.ethers.getSigner(userAddress);
    const tokenWithSigner = token.connect(userSigner);
    const daoWithSigner = dao.connect(userSigner);
    
    // Verificar allowance actual
    const allowance = await token.allowance(userAddress, daoAddress);
    console.log("\nAllowance actual:", hre.ethers.formatEther(allowance), "MTK");
    
    // Aprobar tokens si es necesario
    if (allowance < stakeAmount) {
      console.log("Aprobando tokens para el contrato DAO...");
      const approveTx = await tokenWithSigner.approve(daoAddress, stakeAmount);
      await approveTx.wait();
      console.log("✅ Aprobación completada:", approveTx.hash);
    } else {
      console.log("La aprobación existente es suficiente, no se necesita aprobar nuevamente.");
    }
    
    // Hacer stake
    console.log("\n🔄 Realizando stake de tokens para votar...");
    const stakeTx = await daoWithSigner.stakeForVote(stakeAmount, { gasLimit: 500000 });
    console.log("Transacción enviada:", stakeTx.hash);
    
    const receipt = await stakeTx.wait();
    console.log("✅ Stake completado en el bloque", receipt.blockNumber);
    
    // Verificar stake actualizado
    const newStake = await dao.voteStakes(userAddress);
    console.log("\nNuevo stake para votar:", hre.ethers.formatEther(newStake[0]), "MTK (desde", new Date(Number(newStake[1]) * 1000).toLocaleString(), ")");
    
    // Verificar poder de voto (cuadrático)
    const votingPower = await dao.getVotingPower(userAddress);
    console.log("Poder de voto (cuadrático):", hre.ethers.formatEther(votingPower));
    
    // Mostrar balance actualizado
    const tokenBalanceAfter = await token.balanceOf(userAddress);
    console.log("Balance de tokens restante:", hre.ethers.formatEther(tokenBalanceAfter), "MTK");
    
  } catch (error) {
    console.error("\n❌ Error durante el stake:");
    
    // Intentar decodificar el error del contrato
    if (error.data) {
      try {
        const decodedError = dao.interface.parseError(error.data);
        console.error("Error del contrato:", decodedError.name);
        console.error("Argumentos:", decodedError.args);
      } catch (e) {
        console.error(error);
      }
    } else {
      console.error(error);
    }
    
    console.log("\nPosibles soluciones:");
    console.log("1. Verificar que tienes suficientes tokens");
    console.log("2. Comprobar que el DAO no está pausado");
    console.log("3. Asegurarte de que no tienes ya tokens en stake");
  } finally {
    // Dejar de impersonar
    await hre.network.provider.request({
      method: "hardhat_stopImpersonatingAccount",
      params: [userAddress],
    });
  }
}

// Ejecutar el script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error general:", error);
    process.exit(1);
  });
