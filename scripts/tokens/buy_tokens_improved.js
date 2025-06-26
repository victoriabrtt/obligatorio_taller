// Script para comprar tokens del DAO con manejo de errores mejorado
const hre = require("hardhat");

async function main() {
  // Parámetros configurables
  const buyerAddress = "0x86BF80dC22E5ED99596C0443429a59670f47ea64"; // Dirección del comprador
  const tokensToBuy = process.env.TOKENS || "200"; // Cantidad de tokens a comprar (configurable por variable de entorno)
  const addExtraEth = true; // Si se debe añadir ETH adicional si es necesario
  
  console.log(`\n=== Comprando ${tokensToBuy} tokens para ${buyerAddress} ===\n`);
  
  // Obtener direcciones de los contratos
  const daoAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
  const tokenAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  
  // Cargar contratos
  const dao = await hre.ethers.getContractAt("contracts/DAO.sol:DAO", daoAddress);
  const token = await hre.ethers.getContractAt("MyToken", tokenAddress);
  
  // Verificar balances iniciales
  const tokenBalanceBefore = await token.balanceOf(buyerAddress);
  const ethBalanceBefore = await hre.ethers.provider.getBalance(buyerAddress);
  
  console.log("Balance inicial de tokens:", hre.ethers.formatEther(tokenBalanceBefore), "MTK");
  console.log("Balance inicial de ETH:", hre.ethers.formatEther(ethBalanceBefore), "ETH");
  
  // Calcular costo
  const tokenPriceInWei = await dao.tokenPriceInWei();
  const tokenAmount = hre.ethers.parseEther(tokensToBuy);
  const totalCostWei = (tokenAmount * tokenPriceInWei) / hre.ethers.parseEther("1");
  
  console.log("\nPrecio por token:", hre.ethers.formatEther(tokenPriceInWei), "ETH");
  console.log("Costo total de compra:", hre.ethers.formatEther(totalCostWei), "ETH");
  
  // Verificar si el comprador tiene suficiente ETH
  if (ethBalanceBefore < totalCostWei) {
    console.log("\n⚠️ Saldo insuficiente de ETH para la compra");
    
    if (addExtraEth) {
      const ethNeeded = totalCostWei - ethBalanceBefore;
      // Añadir un 10% extra para cubrir los costos de gas
      const ethToAdd = (ethNeeded * 110n) / 100n;
      
      console.log("ETH necesario:", hre.ethers.formatEther(ethNeeded));
      console.log("Añadiendo:", hre.ethers.formatEther(ethToAdd), "ETH (incluye 10% extra para gas)");
      
      // Enviar ETH adicional
      const [signer] = await hre.ethers.getSigners();
      await signer.sendTransaction({
        to: buyerAddress,
        value: ethToAdd
      });
      
      // Verificar nuevo balance
      const newBalance = await hre.ethers.provider.getBalance(buyerAddress);
      console.log("Nuevo balance de ETH:", hre.ethers.formatEther(newBalance), "ETH");
    } else {
      console.error("❌ Fondos insuficientes y no se ha habilitado la función de añadir ETH");
      console.error("   Añade fondos manualmente o usa el script con addExtraEth=true");
      return;
    }
  }
  
  // Impersonar al comprador
  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [buyerAddress],
  });
  
  try {
    console.log("\n🔄 Realizando compra de tokens...");
    
    // Conectar con la cuenta del comprador
    const buyerSigner = await hre.ethers.getSigner(buyerAddress);
    const daoWithBuyer = dao.connect(buyerSigner);
    
    // Preparar opciones de transacción con un buffer de seguridad para el valor
    const valueToSend = totalCostWei * 101n / 100n; // 1% extra de seguridad
    const txOptions = {
      value: valueToSend,
      gasLimit: 500000
    };
    
    console.log("Enviando transacción con valor:", hre.ethers.formatEther(valueToSend), "ETH");
    
    // Ejecutar la transacción
    const tx = await daoWithBuyer.buyTokens(tokenAmount, txOptions);
    console.log("Transacción enviada:", tx.hash);
    
    // Esperar confirmación
    const receipt = await tx.wait();
    console.log("✅ Transacción confirmada en el bloque", receipt.blockNumber);
    console.log("Gas usado:", receipt.gasUsed.toString());
    
    // Verificar el cambio en el balance de tokens
    const tokenBalanceAfter = await token.balanceOf(buyerAddress);
    const tokensBought = tokenBalanceAfter - tokenBalanceBefore;
    
    console.log("\n=== Resultado de la compra ===");
    console.log("Balance final de tokens:", hre.ethers.formatEther(tokenBalanceAfter), "MTK");
    console.log("Tokens adquiridos:", hre.ethers.formatEther(tokensBought), "MTK");
    
    const ethBalanceAfter = await hre.ethers.provider.getBalance(buyerAddress);
    console.log("ETH gastado:", hre.ethers.formatEther(ethBalanceBefore - ethBalanceAfter), "ETH");
    console.log("Balance final de ETH:", hre.ethers.formatEther(ethBalanceAfter), "ETH");
    
  } catch (error) {
    console.error("\n❌ Error durante la compra de tokens:");
    
    // Intentar decodificar el error de contrato
    if (error.data) {
      try {
        const decodedError = dao.interface.parseError(error.data);
        console.error("Error del contrato:", decodedError.name);
        console.error("Argumentos:", decodedError.args);
      } catch (e) {
        // Si no se puede decodificar, mostrar el error original
        console.error(error);
      }
    } else {
      console.error(error);
    }
    
    console.log("\nPosibles soluciones:");
    console.log("1. Verificar que tienes suficiente ETH para gas y costo de tokens");
    console.log("2. Comprobar que el DAO no está pausado");
    console.log("3. Verificar que la cantidad de tokens es razonable");
    console.log("4. Reiniciar el nodo local de Hardhat si persiste el problema");
  } finally {
    // Dejar de impersonar
    await hre.network.provider.request({
      method: "hardhat_stopImpersonatingAccount",
      params: [buyerAddress],
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
