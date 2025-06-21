// Script para despausar la DAO
const { ethers } = require("hardhat");

async function main() {
  // Obtener direcciones desde el archivo de despliegue más reciente
  const deploymentsDir = "./deployments";
  const fs = require("fs");
  
  const files = fs.readdirSync(deploymentsDir).filter(f => f.startsWith("localhost-"));
  if (files.length === 0) {
    console.error("No se encontraron archivos de despliegue para localhost");
    return;
  }
  
  // Ordenar por fecha (más reciente primero)
  files.sort((a, b) => {
    const timestampA = parseInt(a.split("-")[1].split(".")[0]);
    const timestampB = parseInt(b.split("-")[1].split(".")[0]);
    return timestampB - timestampA;
  });
  
  const latestDeployment = JSON.parse(fs.readFileSync(`${deploymentsDir}/${files[0]}`));
  
  // Direcciones de contratos
  const daoAddress = latestDeployment.addresses.daoAddress;
  const panicMultisigAddress = latestDeployment.addresses.panicMultisigAddress;
  
  console.log("DAO Address:", daoAddress);
  console.log("Panic Multisig Address:", panicMultisigAddress);
  
  // Instanciar contratos
  const dao = await ethers.getContractAt("contracts/DAO.sol:DAO", daoAddress);
  
  // Verificar si está pausado
  const isPaused = await dao.isPaused();
  
  if (!isPaused) {
    console.log("⚠️ La DAO ya está despausada, no es necesario hacer nada.");
    return;
  }
  
  console.log("La DAO está pausada. Intentando despausar...");
  
  // Impersonar al multisig de pánico
  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [panicMultisigAddress],
  });
  
  // Darle ETH al multisig para que pueda enviar transacciones
  const [signer] = await ethers.getSigners();
  await signer.sendTransaction({
    to: panicMultisigAddress,
    value: ethers.parseEther("1")
  });
  
  // Conectar como el multisig de pánico
  const panicSigner = await ethers.getSigner(panicMultisigAddress);
  const daoWithPanic = dao.connect(panicSigner);
  
  try {
    // Llamar a tranquility para despausar
    console.log("Llamando a tranquility()...");
    const tx = await daoWithPanic.tranquility();
    const receipt = await tx.wait();
    console.log("Transacción exitosa:", tx.hash);
    
    // Verificar que se ha despausado
    const isPausedAfter = await dao.isPaused();
    console.log(`Estado de la DAO ahora: ${isPausedAfter ? "PAUSADO" : "ACTIVO"}`);
    
    if (!isPausedAfter) {
      console.log("✅ La DAO se ha despausado correctamente.");
    } else {
      console.log("❌ La operación no tuvo éxito, la DAO sigue pausada.");
    }
  } catch (error) {
    console.error("Error al despausar la DAO:", error.message);
  } finally {
    // Dejar de impersonar
    await hre.network.provider.request({
      method: "hardhat_stopImpersonatingAccount",
      params: [panicMultisigAddress],
    });
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
