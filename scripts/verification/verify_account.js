const { ethers } = require("hardhat");

async function main() {
  const targetAddress = "0x86BF80dC22E5ED99596C0443429a59670f47ea64";
  
  console.log("VERIFICANDO FONDOS PARA:", targetAddress);
  console.log("===========================================");
  
  // Verificar la configuración de la red
  const provider = ethers.provider;
  const network = await provider.getNetwork();
  
  console.log("\n----- Información de la Red -----");
  console.log("Nombre de la red:", network.name);
  console.log("Chain ID:", network.chainId);
  console.log("URL del proveedor:", provider.connection?.url || "No disponible");
  
  // Verificar saldos de cuentas
  const accounts = await ethers.getSigners();
  
  console.log("\n----- Cuentas disponibles en Hardhat -----");
  for (let i = 0; i < Math.min(5, accounts.length); i++) {
    const account = accounts[i];
    const balance = await provider.getBalance(account.address);
    console.log(`Cuenta ${i}: ${account.address}`);
    console.log(`   Saldo: ${ethers.formatEther(balance)} ETH`);
  }
  
  // Verificar saldo de la cuenta objetivo
  console.log("\n----- Cuenta objetivo -----");
  console.log(`Dirección: ${targetAddress}`);
  try {
    const balance = await provider.getBalance(targetAddress);
    console.log(`Saldo en Hardhat: ${ethers.formatEther(balance)} ETH`);
    
    if (balance.toString() === "0") {
      console.log("\n⚠️ ALERTA: El saldo es cero. Posibles problemas:");
      console.log("1. La red de MetaMask no está bien configurada");
      console.log("2. Estás usando una cuenta diferente en MetaMask");
      console.log("3. El script de transferencia no se ejecutó correctamente");
      
      // Intentemos transferir ETH nuevamente
      console.log("\nIntentando transferir ETH nuevamente...");
      const tx = await accounts[0].sendTransaction({
        to: targetAddress,
        value: ethers.parseEther("10.0") // Enviar 10 ETH para estar seguros
      });
      
      console.log(`Transacción enviada: ${tx.hash}`);
      await tx.wait();
      console.log("Transacción confirmada!");
      
      // Verificar el saldo actualizado
      const newBalance = await provider.getBalance(targetAddress);
      console.log(`Nuevo saldo: ${ethers.formatEther(newBalance)} ETH`);
    }
  } catch (error) {
    console.error(`Error al verificar el saldo: ${error.message}`);
  }
  
  // Verificar configuración de contratos
  console.log("\n----- Configuración de Contratos -----");
  
  try {
    // Leer archivo de configuración del frontend
    const fs = require("fs");
    const path = require("path");
    const contractsPath = path.join(__dirname, "../frontend/dao-frontend/src/contracts/contracts.ts");
    
    if (fs.existsSync(contractsPath)) {
      const content = fs.readFileSync(contractsPath, "utf8");
      console.log("Archivo de configuración encontrado:");
      
      // Extraer direcciones con regex
      const daoMatch = content.match(/DAO:\s*{\s*address:\s*["']([^"']+)["']/);
      const tokenMatch = content.match(/TOKEN:\s*{\s*address:\s*["']([^"']+)["']/);
      
      if (daoMatch) {
        console.log(`Dirección del DAO en frontend: ${daoMatch[1]}`);
      }
      if (tokenMatch) {
        console.log(`Dirección del Token en frontend: ${tokenMatch[1]}`);
      }
      
      // Verificar si los contratos están desplegados
      const DAO = await ethers.getContractFactory("contracts/DAO.sol:DAO");
      const daoAddress = daoMatch ? daoMatch[1] : "";
      
      if (daoAddress) {
        const code = await provider.getCode(daoAddress);
        if (code !== "0x") {
          console.log("✅ El contrato DAO existe en la blockchain");
          
          // Verificar parámetros del DAO
          const dao = DAO.attach(daoAddress);
          try {
            const tokenPriceInWei = await dao.tokenPriceInWei();
            console.log(`Precio del token: ${ethers.formatEther(tokenPriceInWei)} ETH`);
          } catch (error) {
            console.error(`Error al leer tokenPriceInWei: ${error.message}`);
          }
        } else {
          console.log("❌ La dirección del DAO no contiene código");
        }
      }
    } else {
      console.log("Archivo de configuración no encontrado");
    }
  } catch (error) {
    console.error(`Error al verificar contratos: ${error.message}`);
  }
  
  console.log("\n----- Pasos para resolver problemas -----");
  console.log("1. Verifica que MetaMask esté conectado a http://localhost:8545");
  console.log("2. Asegúrate de tener seleccionada la cuenta correcta en MetaMask");
  console.log("3. Importa alguna de las cuentas de Hardhat a MetaMask si es necesario");
  console.log("4. Reinicia la aplicación frontend y el nodo de Hardhat si es necesario");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
