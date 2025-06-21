import { ethers } from "https://cdnjs.cloudflare.com/ajax/libs/ethers/6.6.0/ethers.min.js";

// Variables globales
let provider, signer, miTokenContract;
const miTokenABI = [
    // Solo las funciones que necesitamos
    "function balanceOf(address owner) view returns (uint256)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)"
];

// Elementos del DOM
const btnConnect = document.getElementById("btnConnect");
const walletAddress = document.getElementById("walletAddress");
const balanceAddress = document.getElementById("balanceAddress");
const btnGetBalance = document.getElementById("btnGetBalance");
const balanceResult = document.getElementById("balanceResult");
const transferAddress = document.getElementById("transferAddress");
const transferAmount = document.getElementById("transferAmount");
const btnTransfer = document.getElementById("btnTransfer");
const transferStatus = document.getElementById("transferStatus");
const networkInfo = document.getElementById("networkInfo");
const contractInfo = document.getElementById("contractInfo");

// Función para cargar la dirección del contrato desde el archivo JSON
async function loadContractAddress() {
    try {
        const response = await fetch('./contract-address.json');
        if (!response.ok) {
            throw new Error('No se pudo cargar la dirección del contrato. Asegúrate de que el contrato esté desplegado.');
        }
        const data = await response.json();
        return data.MiToken;
    } catch (error) {
        console.error("Error al cargar la dirección del contrato:", error);
        alert("Error al cargar la dirección del contrato. Verifica que el contrato esté desplegado.");
        return null;
    }
}

// Función para conectar la wallet
async function connectWallet() {
    try {
        if (!window.ethereum) {
            alert("MetaMask no está instalado. Por favor, instala MetaMask para usar esta dApp.");
            return false;
        }

        console.log("Iniciando conexión a MetaMask...");
        
        // Solicitar conexión a MetaMask
        provider = new ethers.BrowserProvider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        
        // Verificar la red conectada
        const network = await provider.getNetwork();
        console.log("Red conectada:", network.name, "Chain ID:", network.chainId);
        networkInfo.textContent = `${network.name} (Chain ID: ${network.chainId})`;
        
        // Para la red Hardhat local, asegurarse de que el Chain ID sea 31337
        if (network.chainId !== 31337n) {
            const message = `¡Atención! Estás conectado a la red ${network.name} con Chain ID ${network.chainId}, 
                             pero deberías estar en la red local Hardhat con Chain ID 31337. 
                             Cambia la red en MetaMask para interactuar correctamente con el contrato.`;
            console.warn(message);
            alert(message);
        }
        
        signer = await provider.getSigner();
        const address = await signer.getAddress();
        console.log("Dirección conectada:", address);
        walletAddress.textContent = `Conectado: ${address}`;

        // Cargar la dirección del contrato y crear la instancia
        const contractAddress = await loadContractAddress();
        console.log("Dirección del contrato cargada:", contractAddress);
        if (!contractAddress) return false;
        
        console.log("Creando instancia del contrato con ABI:", miTokenABI);
        miTokenContract = new ethers.Contract(contractAddress, miTokenABI, signer);
        contractInfo.textContent = `${contractAddress} (verificando...)`;
        
        // Verificar que podamos interactuar con el contrato
        try {
            const name = await miTokenContract.name();
            const symbol = await miTokenContract.symbol();
            const totalSupply = await miTokenContract.balanceOf(address);
            const decimals = await miTokenContract.decimals();
            
            console.log("Nombre del token:", name);
            console.log("Símbolo:", symbol);
            console.log("Decimales:", decimals);
            console.log("Balance del deployer:", ethers.formatUnits(totalSupply, decimals));
            console.log("Contrato conectado correctamente");
            
            contractInfo.textContent = `${contractAddress} (${name}, ${symbol})`;
        } catch (contractError) {
            console.error("Error al conectar con el contrato:", contractError);
            contractInfo.textContent = `${contractAddress} (Error: ${contractError.reason || contractError.message})`;
            alert("Error al conectar con el contrato. Asegúrate de estar en la red correcta (Chain ID 31337).");
            return false;
        }
        
        // Habilitar los botones después de conectar
        btnGetBalance.disabled = false;
        btnTransfer.disabled = false;
        
        // Prellenar la dirección para consulta de balance
        balanceAddress.value = address;
        
        return true;
    } catch (error) {
        console.error("Error al conectar la wallet:", error);
        walletAddress.textContent = "Error al conectar wallet: " + (error.reason || error.message);
        return false;
    }
}

// Función para consultar el balance
async function getBalance() {
    try {
        if (!miTokenContract) {
            alert("Por favor, conecta tu wallet primero.");
            return;
        }

        const address = balanceAddress.value.trim();
        if (!address) {
            alert("Por favor, ingresa una dirección para consultar el balance.");
            return;
        }

        if (!ethers.isAddress(address)) {
            alert("La dirección ingresada no es válida.");
            return;
        }

        balanceResult.textContent = "Consultando...";
        
        console.log("Consultando balance para la dirección:", address);
        console.log("Usando contrato en la dirección:", await miTokenContract.getAddress());
        
        // Verificar que la red sea la correcta
        const network = await provider.getNetwork();
        console.log("Red conectada:", network.name, "Chain ID:", network.chainId);
        
        try {
            const balance = await miTokenContract.balanceOf(address);
            console.log("Balance obtenido (raw):", balance.toString());
            
            const decimals = await miTokenContract.decimals();
            console.log("Decimales:", decimals);
            
            const symbol = await miTokenContract.symbol();
            console.log("Símbolo:", symbol);
            
            // Formatear el balance para mostrarlo con la cantidad correcta de decimales
            const formattedBalance = ethers.formatUnits(balance, decimals);
            console.log("Balance formateado:", formattedBalance);
            
            balanceResult.textContent = `Balance: ${formattedBalance} ${symbol}`;
        } catch (callError) {
            console.error("Error específico en la llamada al contrato:", callError);
            balanceResult.textContent = "Error en la llamada al contrato: " + (callError.reason || callError.message);
        }
    } catch (error) {
        console.error("Error general al consultar el balance:", error);
        balanceResult.textContent = "Error al consultar el balance: " + (error.reason || error.message);
    }
}

// Función para transferir tokens
async function transferTokens() {
    try {
        if (!miTokenContract) {
            alert("Por favor, conecta tu wallet primero.");
            return;
        }

        const toAddress = transferAddress.value.trim();
        const amount = transferAmount.value.trim();

        if (!toAddress || !amount) {
            alert("Por favor, completa todos los campos para la transferencia.");
            return;
        }

        if (!ethers.isAddress(toAddress)) {
            alert("La dirección de destino no es válida.");
            return;
        }

        if (parseFloat(amount) <= 0) {
            alert("La cantidad debe ser mayor que cero.");
            return;
        }

        transferStatus.textContent = "Enviando transferencia...";
        
        // Convertir la cantidad a la unidad correcta con decimales
        const decimals = await miTokenContract.decimals();
        const amountInWei = ethers.parseUnits(amount, decimals);
        
        // Enviar la transacción
        const tx = await miTokenContract.transfer(toAddress, amountInWei);
        transferStatus.textContent = "Transacción enviada. Esperando confirmación...";
        
        // Esperar a que se confirme la transacción
        await tx.wait();
        transferStatus.textContent = "Transferencia completada con éxito!";
        
        // Limpiar los campos después de la transferencia
        transferAddress.value = "";
        transferAmount.value = "";
    } catch (error) {
        console.error("Error en la transferencia:", error);
        transferStatus.textContent = "Error en la transferencia: " + (error.reason || error.message);
    }
}

// Función para verificar si el nodo de Hardhat está disponible
async function checkHardhatNode() {
    try {
        const tempProvider = new ethers.JsonRpcProvider("http://localhost:8545");
        const blockNumber = await tempProvider.getBlockNumber();
        console.log("Nodo Hardhat disponible. Bloque actual:", blockNumber);
        return true;
    } catch (error) {
        console.error("Error al conectar con el nodo Hardhat:", error);
        return false;
    }
}

// Event listeners
btnConnect.addEventListener("click", connectWallet);
btnGetBalance.addEventListener("click", getBalance);
btnTransfer.addEventListener("click", transferTokens);

// Inicializar la página
document.addEventListener("DOMContentLoaded", async () => {
    btnGetBalance.disabled = true;
    btnTransfer.disabled = true;
    
    // Verificar si el nodo Hardhat está disponible
    const isHardhatRunning = await checkHardhatNode();
    if (!isHardhatRunning) {
        alert("¡ATENCIÓN! No se puede conectar al nodo Hardhat. Asegúrate de que esté ejecutándose con el comando 'npm run node' en otra terminal.");
        networkInfo.textContent = "Error: No se puede conectar al nodo Hardhat";
    }
    
    // Si MetaMask ya está conectado, intentamos conectar automáticamente
    if (window.ethereum && window.ethereum.selectedAddress) {
        connectWallet();
    }
});
