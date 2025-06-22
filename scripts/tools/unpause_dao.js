// Script para desactivar la pausa del DAO
const hre = require("hardhat");

async function main() {
  // Dirección del DAO
  const daoAddress = "0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82";
  
  // Obtener la cuenta para firmar
  const [signer] = await hre.ethers.getSigners();
  console.log("Usando cuenta:", signer.address);
  
  // Obtener contrato DAO
  const dao = await hre.ethers.getContractAt("contracts/DAO.sol:DAO", daoAddress);
  
  // Verificar estado actual
  const isPaused = await dao.isPaused();
  console.log("¿El DAO está pausado?:", isPaused);
  
  if (isPaused) {
    console.log("Intentando despausar el DAO...");
    try {
      // Intentar tranquility como owner
      const tx = await dao.tranquility();
      await tx.wait();
      console.log("DAO despausado exitosamente");
    } catch (err) {
      console.error("Error al despausar como owner:", err.message);
      
      try {
        // Intentar con panic multisig
        console.log("Intentando con panicMultisig");
        const panicMultisig = await dao.panicMultisig();
        console.log("Dirección de panicMultisig:", panicMultisig);
        
        // Usar impersonación
        await hre.network.provider.request({
          method: "hardhat_impersonateAccount",
          params: [panicMultisig],
        });
        
        const impersonatedSigner = await hre.ethers.getSigner(panicMultisig);
        const daoWithSigner = dao.connect(impersonatedSigner);
        
        const tx = await daoWithSigner.tranquility();
        await tx.wait();
        
        await hre.network.provider.request({
          method: "hardhat_stopImpersonatingAccount",
          params: [panicMultisig],
        });
        
        console.log("DAO despausado con éxito usando panicMultisig");
      } catch (err2) {
        console.error("Error al despausar con panicMultisig:", err2.message);
        
        // Si todo falla, configurar manualmente el estado
        try {
          console.log("Configurando estado del DAO manualmente...");
          
          // Usar setStorageAt para modificar directamente el slot de almacenamiento
          // donde se almacena isPaused (esto es un hack para desarrollo local)
          const isPausedSlot = "0x0000000000000000000000000000000000000000000000000000000000000003"; // Slot 3 para isPaused
          await hre.ethers.provider.send("hardhat_setStorageAt", [
            daoAddress,
            isPausedSlot,
            "0x0000000000000000000000000000000000000000000000000000000000000000" // false
          ]);
          
          console.log("Estado del DAO configurado manualmente");
          
          // Verificar estado después del cambio
          const isStillPaused = await dao.isPaused();
          console.log("¿El DAO sigue pausado?:", isStillPaused);
        } catch (err3) {
          console.error("Error al configurar estado manualmente:", err3);
          process.exit(1);
        }
      }
    }
  } else {
    console.log("El DAO ya está activo, no es necesario despausarlo");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
