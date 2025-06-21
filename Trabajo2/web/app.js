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

        // Solicitar conexión a MetaMask
        provider = new ethers.BrowserProvider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        signer = await provider.getSigner();
        const address = await signer.getAddress();
        walletAddress.textContent = `Conectado: ${address}`;

        // Cargar la dirección del contrato y crear la instancia
        const contractAddress = await loadContractAddress();
        if (!contractAddress) return false;
        
        miTokenContract = new ethers.Contract(contractAddress, miTokenABI, signer);
        
        // Habilitar los botones después de conectar
        btnGetBalance.disabled = false;
        btnTransfer.disabled = false;
        
        return true;
    } catch (error) {
        console.error("Error al conectar la wallet:", error);
        walletAddress.textContent = "Error al conectar wallet";
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
        
        const balance = await miTokenContract.balanceOf(address);
        const decimals = await miTokenContract.decimals();
        const symbol = await miTokenContract.symbol();
        
        // Formatear el balance para mostrarlo con la cantidad correcta de decimales
        const formattedBalance = ethers.formatUnits(balance, decimals);
        
        balanceResult.textContent = `Balance: ${formattedBalance} ${symbol}`;
    } catch (error) {
        console.error("Error al consultar el balance:", error);
        balanceResult.textContent = "Error al consultar el balance";
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

// Event listeners
btnConnect.addEventListener("click", connectWallet);
btnGetBalance.addEventListener("click", getBalance);
btnTransfer.addEventListener("click", transferTokens);

// Inicializar la página
document.addEventListener("DOMContentLoaded", () => {
    btnGetBalance.disabled = true;
    btnTransfer.disabled = true;
    
    // Si MetaMask ya está conectado, intentamos conectar automáticamente
    if (window.ethereum && window.ethereum.selectedAddress) {
        connectWallet();
    }
});
