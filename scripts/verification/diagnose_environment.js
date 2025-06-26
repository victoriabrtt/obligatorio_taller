// Script para diagnosticar el entorno completo y verificar que todo esté funcionando correctamente
// Ejecutar con: npx hardhat run scripts/diagnose_environment.js --network localhost

const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

// Compatibilidad con diferentes versiones de ethers
const formatEther = (value) => {
  if (ethers.utils && ethers.utils.formatEther) {
    return ethers.utils.formatEther(value);
  } else if (ethers.formatEther) {
    return ethers.formatEther(value);
  } else {
    // Fallback manual para formatear
    return (value / 1e18).toString();
  }
};

const parseEther = (value) => {
  if (ethers.utils && ethers.utils.parseEther) {
    return ethers.utils.parseEther(value);
  } else if (ethers.parseEther) {
    return ethers.parseEther(value);
  } else {
    // Fallback manual para parsear
    return ethers.BigNumber.from(Math.floor(parseFloat(value) * 1e18).toString());
  }
};

async function main() {
  console.log("\n🔍 DIAGNÓSTICO COMPLETO DEL ENTORNO 🔍");
  console.log("=================================");
  
  // 1. Verificar red
  console.log("\n📡 Verificando conexión a la red...");
  try {
    const network = await ethers.provider.getNetwork();
    console.log(`✅ Conectado a la red: ${network.name} (chainId: ${network.chainId})`);
    
    // Si no estamos en la red local de Hardhat, mostrar advertencia
    if (network.chainId !== 31337) {
      console.warn("⚠️ ADVERTENCIA: No estás conectado a la red local de Hardhat (chainId 31337).");
      console.warn(`   Estás conectado a ${network.name} (chainId: ${network.chainId})`);
    }
  } catch (error) {
    console.error("❌ Error al conectar con la red:", error.message);
    console.error("   Asegúrate de que el nodo local de Hardhat esté en ejecución.");
    return;
  }
  
  // 2. Verificar cuentas disponibles
  console.log("\n👤 Verificando cuentas disponibles...");
  try {
    const signers = await ethers.getSigners();
    const deployer = signers[0];
    const deployerAddress = await deployer.getAddress();
    const deployerBalance = await ethers.provider.getBalance(deployerAddress);
    
    console.log(`✅ Cuenta principal (deployer): ${deployerAddress}`);
    console.log(`   Balance: ${formatEther(deployerBalance)} ETH`);
    
    // Comparación segura para diferentes versiones de ethers
    const oneEth = parseEther("1");
    if (typeof deployerBalance.lt === 'function' && deployerBalance.lt(oneEth)) {
      console.warn("⚠️ ADVERTENCIA: La cuenta principal tiene menos de 1 ETH.");
    } else if (Number(formatEther(deployerBalance)) < 1) {
      console.warn("⚠️ ADVERTENCIA: La cuenta principal tiene menos de 1 ETH.");
    }
    
    console.log(`   Total de cuentas disponibles: ${signers.length}`);
  } catch (error) {
    console.error("❌ Error al verificar cuentas:", error.message);
    return;
  }
  
  // 3. Buscar el último despliegue para obtener direcciones de contratos
  console.log("\n📝 Buscando información de despliegue...");
  let myTokenAddress;
  let daoAddress;
  
  try {
    // Encontrar el archivo de despliegue más reciente
    const deploymentsDir = path.join(__dirname, '../deployments');
    const files = fs.readdirSync(deploymentsDir);
    
    // Filtrar solo archivos JSON
    const deployFiles = files.filter(file => file.endsWith('.json'));
    
    if (deployFiles.length === 0) {
      console.error("❌ No se encontraron archivos de despliegue en /deployments");
      return;
    }
    
    // Ordenar por fecha de modificación (más reciente primero)
    const mostRecentFile = deployFiles.map(file => {
      const filePath = path.join(deploymentsDir, file);
      const stats = fs.statSync(filePath);
      return { file, mtime: stats.mtime };
    }).sort((a, b) => b.mtime - a.mtime)[0].file;
    
    console.log(`✅ Archivo de despliegue más reciente: ${mostRecentFile}`);
    
    // Leer el archivo de despliegue
    const deployData = JSON.parse(
      fs.readFileSync(path.join(deploymentsDir, mostRecentFile), 'utf8')
    );
    
    // Detectar el formato del archivo de despliegue
    if (deployData.addresses) {
      // Nuevo formato
      console.log("   Formato de despliegue nuevo detectado");
      myTokenAddress = deployData.addresses.tokenAddress;
      daoAddress = deployData.addresses.daoAddress;
    } else if (deployData.contracts) {
      // Formato antiguo
      console.log("   Formato de despliegue antiguo detectado");
      myTokenAddress = deployData.contracts.MyToken.address;
      daoAddress = deployData.contracts.DAO.address;
    } else {
      throw new Error("Formato de archivo de despliegue desconocido");
    }
    
    console.log(`   Contrato MyToken: ${myTokenAddress}`);
    console.log(`   Contrato DAO: ${daoAddress}`);
  } catch (error) {
    console.error("❌ Error al leer archivos de despliegue:", error.message);
    console.log("   Intentando buscar contratos por nombre...");
    
    // Intento alternativo: buscar contratos por nombre
    try {
      const MyToken = await ethers.getContractFactory("MyToken");
      const DAO = await ethers.getContractFactory("DAO");
      
      // Esto fallará si los contratos no están desplegados
      console.log("   Buscando contrato MyToken...");
      myTokenAddress = MyToken.address;
      console.log("   Buscando contrato DAO...");
      daoAddress = DAO.address;
    } catch (altError) {
      console.error("❌ No se pudieron encontrar los contratos desplegados.");
      return;
    }
  }
  
  // 4. Verificar contratos
  if (myTokenAddress) {
    console.log("\n🪙 Verificando contrato MyToken...");
    try {
      // Cargar ABI desde artifacts
      const MyToken = await ethers.getContractFactory("MyToken");
      const token = await MyToken.attach(myTokenAddress);
      
      const name = await token.name();
      const symbol = await token.symbol();
      const totalSupply = await token.totalSupply();
      
      console.log(`✅ Contrato MyToken verificado`);
      console.log(`   Nombre: ${name}`);
      console.log(`   Símbolo: ${symbol}`);
      console.log(`   Suministro total: ${formatEther(totalSupply)} ${symbol}`);
    } catch (error) {
      console.error("❌ Error al verificar contrato MyToken:", error.message);
    }
  }
  
  if (daoAddress) {
    console.log("\n🏛️ Verificando contrato DAO...");
    try {
      const DAO = await ethers.getContractFactory("DAO");
      const dao = await DAO.attach(daoAddress);
      
      const token = await dao.token();
      const proposalCount = await dao.proposalCount();
      
      console.log(`✅ Contrato DAO verificado`);
      console.log(`   Token asociado: ${token}`);
      console.log(`   Número de propuestas: ${proposalCount}`);
      
      try {
        if (token.toLowerCase && token.toLowerCase() !== myTokenAddress.toLowerCase()) {
          console.warn("⚠️ ADVERTENCIA: La dirección del token en DAO no coincide con MyToken");
        } else if (token.toString() !== myTokenAddress) {
          console.warn("⚠️ ADVERTENCIA: La dirección del token en DAO no coincide con MyToken");
        }
      } catch (compareError) {
        console.warn("⚠️ No se pudo comparar las direcciones de los tokens");
      }
    } catch (error) {
      console.error("❌ Error al verificar contrato DAO:", error.message);
    }
  }
  
  // 5. Verificar balance de la dirección específica
  const recipientAddress = "0xfa58f1e31B6eCacF63753dD6Ca2ed35192Af4cb2";
  console.log(`\n🧾 Verificando fondos para ${recipientAddress}...`);
  
  try {
    const ethBalance = await ethers.provider.getBalance(recipientAddress);
    console.log(`✅ Balance de ETH: ${formatEther(ethBalance)} ETH`);
    
    // Comparación segura para diferentes versiones de ethers
    if (typeof ethBalance.lt === 'function' && ethBalance.lt(parseEther("100"))) {
      console.warn(`⚠️ ADVERTENCIA: La dirección tiene menos de 100 ETH (${formatEther(ethBalance)} ETH)`);
    } else if (Number(formatEther(ethBalance)) < 100) {
      console.warn(`⚠️ ADVERTENCIA: La dirección tiene menos de 100 ETH (${formatEther(ethBalance)} ETH)`);
    }
    
    if (myTokenAddress) {
      const MyToken = await ethers.getContractFactory("MyToken");
      const token = await MyToken.attach(myTokenAddress);
      const tokenBalance = await token.balanceOf(recipientAddress);
      
      console.log(`✅ Balance de tokens: ${formatEther(tokenBalance)} MTK`);
      
      // Comparación segura para diferentes versiones de ethers
      if (typeof tokenBalance.lt === 'function' && tokenBalance.lt(parseEther("150"))) {
        console.warn(`⚠️ ADVERTENCIA: La dirección tiene menos de 150 MTK (${formatEther(tokenBalance)} MTK)`);
      } else if (Number(formatEther(tokenBalance)) < 150) {
        console.warn(`⚠️ ADVERTENCIA: La dirección tiene menos de 150 MTK (${formatEther(tokenBalance)} MTK)`);
      }
    }
  } catch (error) {
    console.error("❌ Error al verificar fondos:", error.message);
  }
  
  console.log("\n✨ Diagnóstico completo");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
