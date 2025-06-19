import { ethers } from "https://cdnjs.cloudflare.com/ajax/libs/ethers/6.6.0/ethers.min.js";

// ABI y dirección de contrato
const ABI = [
    { "inputs": [], "name": "getValue", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
    { "inputs": [{ "internalType": "uint256", "name": "_v", "type": "uint256" }], "name": "setValue", "outputs": [], "stateMutability": "nonpayable", "type": "function" }
];
const CONTRACT_ADDRESS = "0x71B2c23A171cdB18036791BB412a8fBeaA0d78d5";

let provider, signer, contract;

const btnConnect = document.getElementById("btnConnect");
const addrDisplay = document.getElementById("addrDisplay");
const btnGet = document.getElementById("btnGet");
const getValueDisplay = document.getElementById("getValueDisplay");
const inpSet = document.getElementById("inpSet");
const btnSet = document.getElementById("btnSet");

// Conectar MetaMask
btnConnect.addEventListener("click", async () => {
    if (!window.ethereum) {
        alert("MetaMask no está instalada");
        return;
    }
    provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = await provider.getSigner();
    const addr = await signer.getAddress();
    addrDisplay.textContent = addr;
    contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
});

// Llamar getValue()
btnGet.addEventListener("click", async () => {
    if (!contract) return alert("Wallet no conectada");
    const v = await contract.getValue();
    getValueDisplay.textContent = v.toString();
});

// Llamar setValue()
btnSet.addEventListener("click", async () => {
    if (!contract) return alert("Wallet no conectada");
    const v = inpSet.value;
    if (!v) return;
    const tx = await contract.setValue(BigInt(v));
    await tx.wait();
    btnGet.click(); // refresca el valor
});
