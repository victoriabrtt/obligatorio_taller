// Script para comprar tokens directamente desde el contrato DAO
const hre = require("hardhat");

async function main() {
  // Dirección de la cuenta que comprará tokens
  const buyerAddress = "0x86BF80dC22E5ED99596C0443429a59670f47ea64";
  // Cantidad de tokens a comprar
  const tokensToBuy = "100"; // 100 tokens
  
  console.log(`Comprando ${tokensToBuy} tokens para la dirección: ${buyerAddress}`);
  
  // Dirección del DAO (usar la dirección actual del DAO desplegado)
  const daoAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
  
  // Dirección del token
  const tokenAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  
  // Obtener contratos
  const dao = await hre.ethers.getContractAt("contracts/DAO.sol:DAO", daoAddress);
  const token = await hre.ethers.getContractAt("MyToken", tokenAddress);
  
  // Verificar precio de token
  const tokenPriceInWei = await dao.tokenPriceInWei();
  console.log("Precio del token en Wei:", hre.ethers.formatEther(tokenPriceInWei), "ETH");
  
  // Calcular costo total
  const tokenAmount = hre.ethers.parseEther(tokensToBuy);
  const totalCostWei = (tokenAmount * tokenPriceInWei) / hre.ethers.parseEther("1");
  console.log("Costo total:", hre.ethers.formatEther(totalCostWei), "ETH");
  
  // Verificar balance antes
  const balanceBefore = await token.balanceOf(buyerAddress);
  console.log("Balance de tokens antes:", hre.ethers.formatEther(balanceBefore), "MTK");
  
  // Impersonar al comprador
  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [buyerAddress],
  });
  
  // Verificar saldo ETH del comprador
  const ethBalanceBefore = await hre.ethers.provider.getBalance(buyerAddress);
  console.log("Balance de ETH antes:", hre.ethers.formatEther(ethBalanceBefore), "ETH");
  
  // Verificar si tiene suficiente ETH
  if (ethBalanceBefore < totalCostWei) {
    console.log("⚠️ El comprador no tiene suficiente ETH. Añadiendo más ETH...");
    // Añadir más ETH si es necesario
    const [signer] = await hre.ethers.getSigners();
    await signer.sendTransaction({
      to: buyerAddress,
      value: hre.ethers.parseEther("10") // Enviar 10 ETH adicionales
    });
    const ethBalanceAfterFunding = await hre.ethers.provider.getBalance(buyerAddress);
    console.log("Balance de ETH después de fondear:", hre.ethers.formatEther(ethBalanceAfterFunding), "ETH");
  }
  
  // Usar el comprador para comprar tokens
  try {
    const buyerSigner = await hre.ethers.getSigner(buyerAddress);
    const daoWithBuyer = dao.connect(buyerSigner);
    
    console.log("Comprando tokens con parámetros explícitos...");
    
    // Comprar tokens con opciones explícitas para el gas
    const tx = await daoWithBuyer.buyTokens(tokenAmount, {
      value: totalCostWei,
      gasLimit: 500000, // Límite de gas explícito
      maxFeePerGas: hre.ethers.parseUnits("50", "gwei"), // Precio de gas máximo
      maxPriorityFeePerGas: hre.ethers.parseUnits("2", "gwei") // Propina de gas máxima
    });
    
    console.log("Transacción enviada:", tx.hash);
    console.log("Esperando confirmación...");
    
    const receipt = await tx.wait();
    console.log("Transacción confirmada en el bloque:", receipt.blockNumber);
    console.log("Gas usado:", receipt.gasUsed.toString());
  } catch (error) {
    console.error("❌ Error al comprar tokens:", error);
    
    // Extraer detalles del error para diagnóstico
    if (error.error && error.error.data) {
      try {
        const decodedError = dao.interface.parseError(error.error.data);
        console.error("Error decodificado:", decodedError);
      } catch (e) {
        console.log("No se pudo decodificar el error");
      }
    }
    
    // Intentar con valor y gas más precisos
    try {
      console.log("\nIntentando nuevamente con parámetros ajustados...");
      
      // Obtener información exacta del contrato
      const tokenPrice = await dao.tokenPriceInWei();
      const exactCost = tokenAmount.mul(tokenPrice).div(hre.ethers.parseEther("1"));
      console.log("Costo exacto calculado:", hre.ethers.formatEther(exactCost), "ETH");
      
      const buyerSigner = await hre.ethers.getSigner(buyerAddress);
      const daoWithBuyer = dao.connect(buyerSigner);
      
      // Aumentar ligeramente el valor enviado (1% extra)
      const valueToSend = exactCost.mul(101).div(100);
      console.log("Enviando valor (con 1% extra):", hre.ethers.formatEther(valueToSend), "ETH");
      
      const tx2 = await daoWithBuyer.buyTokens(tokenAmount, {
        value: valueToSend,
        gasLimit: 1000000 // Aumentar significativamente el límite de gas
      });
      
      console.log("Segunda transacción enviada:", tx2.hash);
      const receipt2 = await tx2.wait();
      console.log("Transacción confirmada en el bloque:", receipt2.blockNumber);
    } catch (error2) {
      console.error("❌ Error en el segundo intento:", error2);
    }
  } finally {
    // Dejar de impersonar
    await hre.network.provider.request({
      method: "hardhat_stopImpersonatingAccount",
      params: [buyerAddress],
    });
  }
  
  // Verificar balance después
  const balanceAfter = await token.balanceOf(buyerAddress);
  console.log("Balance de tokens después:", hre.ethers.formatEther(balanceAfter), "MTK");
  console.log("Tokens comprados:", hre.ethers.formatEther(balanceAfter - balanceBefore), "MTK");
  
  if (balanceAfter > balanceBefore) {
    console.log("✅ Compra de tokens completada con éxito");
  } else {
    console.log("⚠️ No se detectaron nuevos tokens. La transacción puede haber fallado.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error general:", error);
    process.exit(1);
  });
